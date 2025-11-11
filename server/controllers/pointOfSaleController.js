import PointOfSale from '../models/PointOfSale.js';
import CodeDistribution from '../models/CodeDistribution.js';
import WalletCode from '../models/WalletCode.js';
import Order from '../models/Order.js';
import SmartCartOrder from '../models/SmartCartOrder.js';
import User from '../models/User.js';
import PointCommission from '../models/PointCommission.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';

// Helper function to calculate and create commission for orders
async function calculateAndCreateCommission(order, orderType, pickupPoint) {
  try {
    // If no pickup point, skip commission
    if (!pickupPoint || !pickupPoint._id) {
      return;
    }

    // Get point to check commission rate
    const point = await PointOfSale.findById(pickupPoint._id || pickupPoint);
    if (!point || !point.settings?.commission || point.settings.commission <= 0) {
      // No commission configured for this point
      return;
    }

    // Calculate commission
    const orderTotal = order.pricing?.totalCost || 0;
    const commissionRate = point.settings.commission; // Percentage for orders
    const commissionAmount = (orderTotal * commissionRate) / 100;

    // Create commission record
    await PointCommission.create({
      pointOfSale: point._id,
      [orderType === 'smartCart' ? 'smartCartOrder' : 'order']: order._id,
      orderNumber: order.orderNumber,
      orderType: orderType,
      orderTotal: orderTotal,
      commissionRate: commissionRate,
      commissionAmount: commissionAmount,
      status: 'pending',
      notes: `عمولة على طلب #${order.orderNumber}`,
    });

    console.log('✅ Commission created for order:', {
      pointId: point._id,
      pointName: point.name,
      orderNumber: order.orderNumber,
      commissionRate,
      commissionAmount,
    });
  } catch (error) {
    console.error('❌ Failed to create commission:', error);
    // Don't fail the order pickup if commission creation fails
  }
}

// Helper function to calculate and create commission for code sales
async function calculateAndCreateCodeCommission(distribution, point) {
  try {
    if (!distribution || !point) {
      return;
    }

    // Check if code commission is configured
    if (!point.settings?.codeCommission || point.settings.codeCommission <= 0) {
      // No code commission configured for this point
      return;
    }

    // Calculate commission based on sale price
    const salePrice = distribution.salePrice || 0;
    const commissionRate = point.settings.codeCommission; // Percentage for codes
    const commissionAmount = (salePrice * commissionRate) / 100;

    // Create commission record
    await PointCommission.create({
      pointOfSale: point._id,
      codeDistribution: distribution._id,
      orderNumber: `CODE-${distribution.walletCode.code}`,
      orderType: 'code',
      orderTotal: salePrice,
      commissionRate: commissionRate,
      commissionAmount: commissionAmount,
      status: 'pending',
      notes: `عمولة على بيع كود ${distribution.walletCode.code}`,
    });

    console.log('✅ Commission created for code:', {
      pointId: point._id,
      pointName: point.name,
      code: distribution.walletCode.code,
      salePrice,
      commissionRate,
      commissionAmount,
    });
  } catch (error) {
    console.error('❌ Failed to create code commission:', error);
    // Don't fail the code sale if commission creation fails
  }
}

// @desc    Create a new point of sale
// @route   POST /api/pos
// @access  Private (Admin)
export const createPoint = catchAsync(async (req, res, next) => {
  const {
    name,
    type,
    location,
    contact,
    operatingHours,
    settings,
    manager,
    notes,
  } = req.body;

  if (!name || !location || !contact?.phone) {
    return next(new AppError('يرجى إدخال البيانات المطلوبة', 400));
  }

  // Generate unique code
  const code = await PointOfSale.generateCode();

  // Create QR code data (can be enhanced later)
  const qrCode = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/pos/${code}`;

  const point = await PointOfSale.create({
    name,
    code,
    type: type || 'both',
    location: {
      address: location.address,
      mapLink: location.mapLink || '',
      city: location.city || 'صنعاء',
      coordinates: {
        latitude: location.coordinates?.latitude,
        longitude: location.coordinates?.longitude,
      },
    },
    contact: {
      phone: contact.phone,
      whatsapp: contact.whatsapp,
      email: contact.email,
    },
    operatingHours: operatingHours || {},
    settings: settings || {},
    manager,
    createdBy: req.user.id,
    qrCode,
    notes,
  });

  res.status(201).json({
    success: true,
    point,
  });
});

// @desc    Get point detailed stats for admin
// @route   GET /api/pos/:id/admin-stats
// @access  Private (Admin)
export const getPointAdminStats = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const point = await PointOfSale.findById(id);
  if (!point) {
    return next(new AppError('النقطة غير موجودة', 404));
  }

  const mongoose = await import('mongoose');
  const pointObjectId = new mongoose.Types.ObjectId(id);
  const pointIdStr = id.toString();
  const pointQuery = {
    $or: [
      { 'delivery.pickupPoint': pointObjectId },
      { 'delivery.pickupPoint': pointIdStr },
    ],
  };

  // Total orders
  const totalOrders = await SmartCartOrder.countDocuments(pointQuery) + 
                      await Order.countDocuments(pointQuery);

  // Delivered orders
  const deliveredOrders = await SmartCartOrder.countDocuments({
    ...pointQuery,
    status: 'delivered',
    'delivery.pickedUpAt': { $exists: true },
  }) + await Order.countDocuments({
    ...pointQuery,
    status: 'delivered',
    'delivery.pickedUpAt': { $exists: true },
  });

  // Pending orders (not delivered or cancelled)
  const pendingOrders = await SmartCartOrder.countDocuments({
    ...pointQuery,
    status: { $nin: ['delivered', 'cancelled'] },
  }) + await Order.countDocuments({
    ...pointQuery,
    status: { $nin: ['delivered', 'cancelled'] },
  });

  // Ready for pickup
  const readyOrders = await SmartCartOrder.countDocuments({
    ...pointQuery,
    'delivery.readyForPickup': true,
    'delivery.pickedUpAt': null,
  }) + await Order.countDocuments({
    ...pointQuery,
    'delivery.readyForPickup': true,
    'delivery.pickedUpAt': null,
  });

  // Awaiting pickup (ready but not picked up yet)
  const awaitingPickup = readyOrders;

  // Commission statistics
  const totalCommissions = await PointCommission.aggregate([
    {
      $match: {
        pointOfSale: point._id,
        status: { $nin: ['cancelled'] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$commissionAmount' },
        pending: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0],
          },
        },
        approved: {
          $sum: {
            $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0],
          },
        },
        paid: {
          $sum: {
            $cond: [{ $eq: ['$status', 'paid'] }, '$commissionAmount', 0],
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const commissions = totalCommissions[0] || {
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    count: 0,
  };

  res.json({
    success: true,
    stats: {
      totalOrders,
      deliveredOrders,
      pendingOrders,
      readyOrders,
      awaitingPickup,
      remainingOrders: pendingOrders - readyOrders, // Orders that arrived but not ready yet
      commissions: {
        total: commissions.total || 0,
        pending: commissions.pending || 0,
        approved: commissions.approved || 0,
        paid: commissions.paid || 0,
        count: commissions.count || 0,
        commissionRate: point.settings?.commission || 0,
      },
    },
  });
});

// @desc    Get public points of sale (for public page)
// @route   GET /api/pos/public
// @access  Public
export const getPublicPoints = catchAsync(async (req, res, next) => {
  const { city, type } = req.query;

  const query = {
    status: 'active', // Only active points
  };

  if (city) {
    query['location.city'] = { $regex: city, $options: 'i' };
  }

  if (type && type !== 'all') {
    if (type === 'pickup_only') {
      query.$or = [
        { type: 'pickup_only' },
        { type: 'both' },
      ];
    } else if (type === 'codes_only') {
      query.$or = [
        { type: 'codes_only' },
        { type: 'both' },
      ];
    } else {
      query.type = type;
    }
  }

  const points = await PointOfSale.find(query)
    .select('name code type location contact operatingHours status')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    points: points || [],
    count: points?.length || 0,
  });
});

// @desc    Get all points of sale
// @route   GET /api/pos
// @access  Private (Admin)
export const getAllPoints = catchAsync(async (req, res, next) => {
  // Ensure user is authenticated
  if (!req.user || !req.user.id) {
    return res.status(401).json({
      success: false,
      message: 'غير مصرح',
    });
  }

  const {
    page = 1,
    limit = 20,
    status,
    type,
    city,
    search,
  } = req.query;

  const query = {};

  // If user is not admin, only return their managed point
  if (req.user.role !== 'admin') {
    try {
      const mongoose = await import('mongoose');
      const userId = req.user.id;
      // Try both string and ObjectId formats
      const userObjectId = new mongoose.Types.ObjectId(userId);
      query.manager = { $in: [userId, userObjectId] };
    } catch (e) {
      // If ObjectId conversion fails, use string
      query.manager = req.user.id;
    }
  }

  if (status) {
    query.status = status;
  }

  if (type) {
    query.type = type;
  }

  if (city) {
    query['location.city'] = { $regex: city, $options: 'i' };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { code: { $regex: search, $options: 'i' } },
      { 'location.address': { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  try {
    // Use lean() for better performance and to avoid population issues
    const points = await PointOfSale.find(query)
      .populate({
        path: 'manager',
        select: 'name email phone',
        strictPopulate: false, // Don't fail if manager doesn't exist
      })
      .populate({
        path: 'createdBy',
        select: 'name email',
        strictPopulate: false, // Don't fail if createdBy doesn't exist
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Use lean() to get plain JS objects

    const total = await PointOfSale.countDocuments(query);

    res.json({
      success: true,
      points: Array.isArray(points) ? points : [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total || 0,
        pages: Math.ceil((total || 0) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('❌ Error in getAllPoints:', {
      message: error.message,
      stack: error.stack,
      query,
      userId: req.user?.id,
      role: req.user?.role,
    });
    // Return empty result instead of throwing error
    res.json({
      success: true,
      points: [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: 0,
        pages: 0,
      },
    });
  }
});

// @desc    Get user's managed point
// @route   GET /api/pos/my-point
// @access  Private (Point Manager or Customer)
export const getMyPoint = catchAsync(async (req, res, next) => {
  const userId = req.user.id || req.user._id;
  
  // Try direct query first
  let point = await PointOfSale.findOne({ 
    manager: { $eq: userId } 
  })
    .populate('manager', 'name email phone')
    .populate('createdBy', 'name email');

  // If not found, try with ObjectId comparison
  if (!point) {
    const mongoose = await import('mongoose');
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      point = await PointOfSale.findOne({ manager: userObjectId })
        .populate('manager', 'name email phone')
        .populate('createdBy', 'name email');
    } catch (e) {
      // Invalid ObjectId, continue
    }
  }

  // Check if point found
  if (point) {
    return res.json({
      success: true,
      point,
    });
  }

  // If still not found, return null (not 404) - user simply doesn't manage a point
  // This is normal for regular customers, not an error
  return res.json({
    success: true,
    point: null,
    message: 'لا توجد نقطة مرتبطة بحسابك',
  });
});

// @desc    Get nearest points to customer location
// @route   GET /api/pos/nearest
// @access  Private (Customer)
export const getNearestPoints = catchAsync(async (req, res, next) => {
  const { latitude, longitude, maxDistance = 50, type } = req.query;

  if (!latitude || !longitude) {
    return next(new AppError('يرجى تحديد موقعك', 400));
  }

  const lat = parseFloat(latitude);
  const lng = parseFloat(longitude);
  const distance = parseFloat(maxDistance);

  const query = {
    status: 'active',
  };

  if (type) {
    if (type === 'codes') {
      query.type = { $in: ['codes_only', 'both'] };
    } else if (type === 'pickup') {
      query.type = { $in: ['pickup_only', 'both'] };
    }
  }

  // Get all active points
  const allPoints = await PointOfSale.find(query)
    .populate('manager', 'name email phone');

  // Calculate distance and filter
  const pointsWithDistance = allPoints
    .map(point => {
      const pointDistance = point.calculateDistance(lat, lng);
      return {
        point: point.toObject(),
        distance: pointDistance,
      };
    })
    .filter(item => item.distance <= distance)
    .sort((a, b) => a.distance - b.distance);

  res.json({
    success: true,
    points: pointsWithDistance.map(item => ({
      ...item.point,
      distance: item.distance,
      distanceFormatted: `${item.distance.toFixed(2)} كم`,
    })),
    userLocation: {
      latitude: lat,
      longitude: lng,
    },
  });
});

// @desc    Get single point of sale
// @route   GET /api/pos/:id
// @access  Private (Admin or Point Manager)
export const getPoint = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;

  try {
    const point = await PointOfSale.findById(id)
      .populate('manager', 'name email phone')
      .populate('createdBy', 'name email');

    if (!point) {
      return next(new AppError('النقطة غير موجودة', 404));
    }

    // Check if user is admin or point manager
    const managerId = point.manager?._id?.toString() || point.manager?.toString() || point.manager;
    const userStr = userId.toString();
    
    console.log('🔍 getPoint permission check:', {
      userRole: req.user.role,
      userId: userStr,
      managerId: managerId,
      pointName: point.name,
      isAdmin: req.user.role === 'admin',
      isManager: managerId === userStr
    });

    if (req.user.role !== 'admin' && managerId !== userStr) {
      console.error('❌ Access denied in getPoint:', {
        userRole: req.user.role,
        userId: userStr,
        managerId: managerId,
        match: managerId === userStr
      });
      return next(new AppError('غير مصرح بالوصول', 403));
    }

    console.log('✅ Access granted in getPoint');
    res.json({
      success: true,
      point,
    });
  } catch (error) {
    console.error('Error in getPoint:', error);
    return next(new AppError('فشل في تحميل بيانات النقطة', 500));
  }
});

// @desc    Update point of sale
// @route   PUT /api/pos/:id
// @access  Private (Admin or Point Manager)
export const updatePoint = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const point = await PointOfSale.findById(id);

  if (!point) {
    return next(new AppError('النقطة غير موجودة', 404));
  }

  // Check permissions
  if (req.user.role !== 'admin' && point.manager?.toString() !== req.user.id) {
    return next(new AppError('غير مصرح بالتعديل', 403));
  }

  const {
    name,
    type,
    location,
    contact,
    operatingHours,
    settings,
    manager,
    status,
    notes,
  } = req.body;

  if (name) point.name = name;
  if (type) point.type = type;
  if (location) {
    if (location.address) point.location.address = location.address;
    if (location.city) point.location.city = location.city;
    if (location.coordinates) {
      if (location.coordinates.latitude !== undefined) {
        point.location.coordinates.latitude = location.coordinates.latitude;
      }
      if (location.coordinates.longitude !== undefined) {
        point.location.coordinates.longitude = location.coordinates.longitude;
      }
    }
  }
  if (contact) {
    if (contact.phone) point.contact.phone = contact.phone;
    if (contact.whatsapp !== undefined) point.contact.whatsapp = contact.whatsapp;
    if (contact.email !== undefined) point.contact.email = contact.email;
  }
  if (operatingHours) point.operatingHours = operatingHours;
  if (settings) {
    if (settings.commission !== undefined) point.settings.commission = settings.commission;
    if (settings.codeCommission !== undefined) point.settings.codeCommission = settings.codeCommission;
    if (settings.discountOnCodes !== undefined) point.settings.discountOnCodes = settings.discountOnCodes;
  }
  if (req.body.managerId !== undefined) {
    point.manager = req.body.managerId || null;
  } else if (manager !== undefined) {
    point.manager = manager;
  }
  if (status && req.user.role === 'admin') point.status = status;
  if (notes !== undefined) point.notes = notes;

  await point.save();

  res.json({
    success: true,
    point,
  });
});

// @desc    Delete point of sale
// @route   DELETE /api/pos/:id
// @access  Private (Admin)
export const deletePoint = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const point = await PointOfSale.findById(id);

  if (!point) {
    return next(new AppError('النقطة غير موجودة', 404));
  }

  // Check if point has active distributions or orders
  const hasActiveDistributions = await CodeDistribution.countDocuments({
    pointOfSale: id,
    status: { $in: ['distributed'] }, // Only check non-sold distributed codes
  });

  const mongoose = await import('mongoose');
  const pointObjectId = new mongoose.Types.ObjectId(id);
  const pointIdStr = id.toString();
  const pointQuery = {
    $or: [
      { 'delivery.pickupPoint': pointObjectId },
      { 'delivery.pickupPoint': pointIdStr },
    ],
  };

  const hasActiveOrders = await Order.countDocuments({
    ...pointQuery,
    status: { $nin: ['delivered', 'cancelled'] },
  }) + await SmartCartOrder.countDocuments({
    ...pointQuery,
    status: { $nin: ['delivered', 'cancelled'] },
  });

  if (hasActiveDistributions > 0 || hasActiveOrders > 0) {
    return next(new AppError(
      `لا يمكن حذف النقطة لأنها تحتوي على ${hasActiveDistributions} كود موزع و ${hasActiveOrders} طلب نشط. يمكنك تعطيل النقطة بدلاً من ذلك.`,
      400
    ));
  }

  // Safe to delete
  await PointOfSale.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'تم حذف النقطة بنجاح',
  });
});

// @desc    Toggle point status (active/inactive)
// @route   PATCH /api/pos/:id/toggle-status
// @access  Private (Admin)
export const togglePointStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const point = await PointOfSale.findById(id);

  if (!point) {
    return next(new AppError('النقطة غير موجودة', 404));
  }

  // Toggle between active and inactive
  point.status = point.status === 'active' ? 'inactive' : 'active';
  await point.save();

  res.json({
    success: true,
    message: `تم ${point.status === 'active' ? 'تفعيل' : 'تعطيل'} النقطة بنجاح`,
    point,
  });
});

// @desc    Distribute wallet codes to a point
// @route   POST /api/pos/:id/distribute-codes
// @access  Private (Admin)
export const distributeCodes = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { walletCodeIds, discount } = req.body;

  if (!walletCodeIds || !Array.isArray(walletCodeIds) || walletCodeIds.length === 0) {
    return next(new AppError('يرجى تحديد الأكواد المطلوبة', 400));
  }

  const point = await PointOfSale.findById(id);

  if (!point) {
    return next(new AppError('النقطة غير موجودة', 404));
  }

  if (point.status !== 'active') {
    return next(new AppError('النقطة غير نشطة', 400));
  }

  const codes = await WalletCode.find({
    _id: { $in: walletCodeIds },
    isUsed: false,
    isReturned: false, // لا يمكن توزيع الأكواد المرتجعة
  });

  if (codes.length !== walletCodeIds.length) {
    // Check which codes are invalid
    const invalidCodes = await WalletCode.find({
      _id: { $in: walletCodeIds },
      $or: [
        { isUsed: true },
        { isReturned: true }
      ]
    });
    
    if (invalidCodes.length > 0) {
      return next(new AppError(`بعض الأكواد غير صالحة: ${invalidCodes.length} كود مستخدم أو مرتجع`, 400));
    }
    
    return next(new AppError('بعض الأكواد غير موجودة أو غير صالحة', 400));
  }

  const distributions = [];

  for (const walletCode of codes) {
    const purchasePrice = discount
      ? walletCode.amount * (1 - discount / 100)
      : walletCode.amount * (1 - (point.settings.discountOnCodes || 0) / 100);

    const distribution = await CodeDistribution.create({
      walletCode: walletCode._id,
      pointOfSale: id,
      distributedBy: req.user.id,
      purchasePrice,
      originalAmount: walletCode.amount,
    });

    distributions.push(distribution);

    // Update point inventory
    point.inventory.availableCodes += 1;
    point.inventory.totalCodesDistributed += 1;
  }

  await point.save();

  res.status(201).json({
    success: true,
    message: `تم توزيع ${distributions.length} كود على النقطة`,
    distributions,
    point,
  });
});

// @desc    Get point statistics
// @route   GET /api/pos/:id/stats
// @access  Private (Admin or Point Manager)
export const getPointStats = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const point = await PointOfSale.findById(id);

  if (!point) {
    return next(new AppError('النقطة غير موجودة', 404));
  }

  // Check permissions
  if (req.user.role !== 'admin' && point.manager?.toString() !== req.user.id) {
    return next(new AppError('غير مصرح بالوصول', 403));
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Code sales statistics
  const codeSales = await CodeDistribution.aggregate([
    {
      $match: {
        pointOfSale: point._id,
        status: 'sold',
        soldAt: { $gte: today },
      },
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$salePrice' },
        totalProfit: { $sum: { $subtract: ['$salePrice', '$purchasePrice'] } },
      },
    },
  ]);

  // Use flexible query for order statistics (backward compatibility)
  const mongoose = await import('mongoose');
  const pointObjectId = new mongoose.Types.ObjectId(id);
  const pointIdStr = id.toString();
  const pointQuery = {
    $or: [
      { 'delivery.pickupPoint': pointObjectId },
      { 'delivery.pickupPoint': pointIdStr },
    ],
  };

  // Order statistics
  const orders = await SmartCartOrder.countDocuments({
    ...pointQuery,
    status: { $nin: ['cancelled'] },
  }) + await Order.countDocuments({
    ...pointQuery,
    status: { $nin: ['cancelled'] },
  });

  const pendingOrders = await SmartCartOrder.countDocuments({
    ...pointQuery,
    'delivery.readyForPickup': false,
    status: { $in: ['arrived', 'in_transit'] },
  }) + await Order.countDocuments({
    ...pointQuery,
    'delivery.readyForPickup': false,
    status: { $in: ['arrived', 'in_transit'] },
  });

  const readyOrders = await SmartCartOrder.countDocuments({
    ...pointQuery,
    'delivery.readyForPickup': true,
    'delivery.pickedUpAt': null,
  }) + await Order.countDocuments({
    ...pointQuery,
    'delivery.readyForPickup': true,
    'delivery.pickedUpAt': null,
  });

  // Commission statistics
  const totalCommissions = await PointCommission.aggregate([
    {
      $match: {
        pointOfSale: point._id,
        status: { $nin: ['cancelled'] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$commissionAmount' },
        pending: {
          $sum: {
            $cond: [{ $eq: ['$status', 'pending'] }, '$commissionAmount', 0],
          },
        },
        approved: {
          $sum: {
            $cond: [{ $eq: ['$status', 'approved'] }, '$commissionAmount', 0],
          },
        },
        paid: {
          $sum: {
            $cond: [{ $eq: ['$status', 'paid'] }, '$commissionAmount', 0],
          },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const commissions = totalCommissions[0] || {
    total: 0,
    pending: 0,
    approved: 0,
    paid: 0,
    count: 0,
  };

  const stats = {
    codeSales: codeSales[0] || {
      totalSales: 0,
      totalRevenue: 0,
      totalProfit: 0,
    },
    inventory: point.inventory,
    orders: {
      total: orders,
      pending: pendingOrders,
      readyForPickup: readyOrders,
    },
    commissions: {
      total: commissions.total || 0,
      pending: commissions.pending || 0,
      approved: commissions.approved || 0,
      paid: commissions.paid || 0,
      count: commissions.count || 0,
      commissionRate: point.settings?.commission || 0,
    },
    rating: point.rating,
  };

  res.json({
    success: true,
    stats,
  });
});

// @desc    Sell wallet code to customer (Point Manager)
// @route   POST /api/pos/:id/sell-code
// @access  Private (Point Manager)
export const sellCodeToCustomer = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { distributionId, salePrice, customerEmail, customerPhone } = req.body;

  if (!distributionId || !salePrice) {
    return next(new AppError('يرجى تحديد الكود وسعر البيع', 400));
  }

  const point = await PointOfSale.findById(id);

  if (!point) {
    return next(new AppError('النقطة غير موجودة', 404));
  }

  // Check if user is point manager
  if (req.user.role !== 'admin' && point.manager?.toString() !== req.user.id) {
    return next(new AppError('غير مصرح بالوصول', 403));
  }

  const distribution = await CodeDistribution.findById(distributionId)
    .populate('walletCode');

  if (!distribution) {
    return next(new AppError('التوزيع غير موجود', 404));
  }

  if (distribution.pointOfSale.toString() !== id) {
    return next(new AppError('الكود ليس مخصص لهذه النقطة', 400));
  }

  if (distribution.status !== 'distributed') {
    return next(new AppError('الكود تم بيعه مسبقاً أو مُرجع', 400));
  }

  // Find or create customer
  let customer = null;
  if (customerEmail) {
    customer = await User.findOne({ email: customerEmail });
  } else if (customerPhone) {
    customer = await User.findOne({ phone: customerPhone });
  }

  // Update distribution
  distribution.status = 'sold';
  distribution.salePrice = parseFloat(salePrice);
  distribution.soldAt = new Date();
  if (customer) {
    distribution.soldTo = customer._id;
  }

  // Mark wallet code as used if customer exists (auto-redeem)
  if (customer) {
    const Wallet = (await import('../models/Wallet.js')).default;
    let wallet = await Wallet.findOne({ user: customer._id });

    if (!wallet) {
      const walletNumber = await Wallet.generateWalletNumber();
      wallet = await Wallet.create({
        user: customer._id,
        walletNumber,
        balance: 0,
        currency: 'SAR',
      });
    }

    // Auto-redeem the code
    await wallet.addTransaction('deposit', distribution.walletCode.amount, {
      description: `شحن رصيد عبر الكود ${distribution.walletCode.code} من نقطة ${point.name}`,
      codeId: distribution.walletCode._id,
    });

    distribution.walletCode.isUsed = true;
    distribution.walletCode.usedBy = customer._id;
    distribution.walletCode.usedAt = new Date();
    await distribution.walletCode.save();
  }

  await distribution.save();

  // Update point inventory
  point.inventory.availableCodes -= 1;
  point.inventory.totalSales += 1;
  await point.save();

  // Create commission for code sale
  await calculateAndCreateCodeCommission(distribution, point);

  res.json({
    success: true,
    message: customer ? 'تم بيع الكود وتفعيله تلقائياً' : 'تم بيع الكود (يرجى تفعيله يدوياً)',
    distribution,
    customer: customer ? {
      id: customer._id,
      name: customer.name,
      email: customer.email,
    } : null,
  });
});

// @desc    Get point's code inventory
// @route   GET /api/pos/:id/codes
// @access  Private (Point Manager or Admin)
export const getPointCodes = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, page = 1, limit = 20 } = req.query;

  try {
    const point = await PointOfSale.findById(id);

    if (!point) {
      return next(new AppError('النقطة غير موجودة', 404));
    }

    // Check permissions
    const managerId = point.manager?._id?.toString() || point.manager?.toString() || point.manager;
    const userId = req.user.id?.toString() || req.user._id?.toString();
    
    if (req.user.role !== 'admin' && managerId !== userId) {
      return next(new AppError('غير مصرح بالوصول', 403));
    }

    const query = {
      pointOfSale: id,
    };

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const distributions = await CodeDistribution.find(query)
      .populate('walletCode')
      .populate('distributedBy', 'name email')
      .populate('soldTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CodeDistribution.countDocuments(query);

    res.json({
      success: true,
      distributions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error in getPointCodes:', error);
    return next(new AppError('فشل في تحميل الأكواد', 500));
  }
});

// @desc    Return code to admin (Point Manager)
// @route   POST /api/pos/:id/return-code
// @access  Private (Point Manager)
export const returnCode = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { distributionId, reason } = req.body;

  if (!distributionId) {
    return next(new AppError('يرجى تحديد الكود', 400));
  }

  const point = await PointOfSale.findById(id);

  if (!point) {
    return next(new AppError('النقطة غير موجودة', 404));
  }

  // Check if user is point manager
  if (req.user.role !== 'admin' && point.manager?.toString() !== req.user.id) {
    return next(new AppError('غير مصرح بالوصول', 403));
  }

  const distribution = await CodeDistribution.findById(distributionId);

  if (!distribution) {
    return next(new AppError('التوزيع غير موجود', 404));
  }

  if (distribution.pointOfSale.toString() !== id) {
    return next(new AppError('الكود ليس مخصص لهذه النقطة', 400));
  }

  if (distribution.status !== 'distributed') {
    return next(new AppError('لا يمكن إرجاع كود تم بيعه', 400));
  }

  // Get walletCode ID (could be populated or just ID)
  const walletCodeId = typeof distribution.walletCode === 'string' 
    ? distribution.walletCode 
    : (distribution.walletCode?._id || distribution.walletCode);

  if (!walletCodeId) {
    return next(new AppError('الكود غير موجود في التوزيع', 400));
  }

  // Find the actual WalletCode document
  const WalletCode = (await import('../models/WalletCode.js')).default;
  const walletCode = await WalletCode.findById(walletCodeId);

  if (!walletCode) {
    return next(new AppError('الكود غير موجود', 404));
  }

  // Check if code was already used
  if (walletCode.isUsed) {
    return next(new AppError('لا يمكن إرجاع كود مستخدم مسبقاً', 400));
  }

  // Check if code was already returned
  if (walletCode.isReturned) {
    return next(new AppError('هذا الكود تم إرجاعه مسبقاً', 400));
  }

  // Mark code as returned and invalidate it
  walletCode.isReturned = true;
  walletCode.returnedAt = new Date();
  walletCode.returnedFrom = point._id;
  walletCode.returnedReason = reason || 'تم الإرجاع من النقطة';
  walletCode.isUsed = true; // تعطيل الكود تماماً - لا يمكن استخدامه بعد الإرجاع
  walletCode.notes = (walletCode.notes ? walletCode.notes + ' | ' : '') + `مرتجع من ${point.name} - ${reason || 'بدون سبب'}`;
  await walletCode.save();

  // Update distribution status
  distribution.status = 'returned';
  distribution.notes = reason || 'تم الإرجاع من النقطة';

  await distribution.save();

  // Update point inventory
  point.inventory.availableCodes -= 1;
  await point.save();

  res.json({
    success: true,
    message: 'تم إرجاع الكود بنجاح - الكود معطل ولا يمكن استخدامه',
    distribution,
  });
});

// @desc    Get orders assigned to point
// @route   GET /api/pos/:id/orders
// @access  Private (Point Manager or Admin)
export const getPointOrders = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, readyForPickup, page = 1, limit = 20 } = req.query;

  try {
    const point = await PointOfSale.findById(id);

    if (!point) {
      return next(new AppError('النقطة غير موجودة', 404));
    }

    // Check permissions
    const managerId = point.manager?._id?.toString() || point.manager?.toString() || point.manager;
    const userId = req.user.id?.toString() || req.user._id?.toString();
    
    if (req.user.role !== 'admin' && managerId !== userId) {
      return next(new AppError('غير مصرح بالوصول', 403));
    }

    // Use flexible query that works with both ObjectId and string (backward compatibility)
    const mongoose = await import('mongoose');
    const pointObjectId = new mongoose.Types.ObjectId(id);
    const pointIdStr = id.toString();
    
    const baseQuery = {
      $or: [
        { 'delivery.pickupPoint': pointObjectId },
        { 'delivery.pickupPoint': pointIdStr },
      ],
    };
    
    const query = { ...baseQuery };

    if (status) {
      query.status = status;
    }

    if (readyForPickup !== undefined) {
      query['delivery.readyForPickup'] = readyForPickup === 'true';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get both regular orders and smart cart orders
    const [regularOrders, smartCartOrders] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email phone')
        .populate('delivery.pickupPoint', 'name location contact')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SmartCartOrder.find(query)
        .populate('user', 'name email phone')
        .populate('delivery.pickupPoint', 'name location contact')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
    ]);

    const totalRegular = await Order.countDocuments(query);
    const totalSmartCart = await SmartCartOrder.countDocuments(query);

    res.json({
      success: true,
      orders: {
        regular: regularOrders,
        smartCart: smartCartOrders,
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalRegular + totalSmartCart,
        pages: Math.ceil((totalRegular + totalSmartCart) / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error in getPointOrders:', error);
    return next(new AppError('فشل في تحميل الطلبات', 500));
  }
});

// @desc    Mark order as ready for pickup
// @route   PUT /api/pos/:id/orders/:orderId/ready?orderType=smartCart
// @access  Private (Point Manager)
export const markOrderReady = catchAsync(async (req, res, next) => {
  const { id, orderId } = req.params;
  const { orderType } = req.query; // 'regular' or 'smartCart'

  console.log('🔍 markOrderReady:', { pointId: id, orderId, orderType });

  // Validate orderId
  if (!orderId || orderId.length < 10) {
    return next(new AppError('رقم الطلب غير صحيح', 400));
  }

  const point = await PointOfSale.findById(id);

  if (!point) {
    return next(new AppError('النقطة غير موجودة', 404));
  }

  // Check if user is point manager
  const managerId = point.manager?._id?.toString() || point.manager?.toString() || point.manager;
  const userId = req.user.id?.toString() || req.user._id?.toString();
  
  if (req.user.role !== 'admin' && managerId !== userId) {
    console.error('❌ Permission denied:', { userRole: req.user.role, userId, managerId });
    return next(new AppError('غير مصرح بالوصول', 403));
  }

  // Use flexible query that works with both ObjectId and string
  const mongoose = await import('mongoose');
  const pointObjectId = new mongoose.Types.ObjectId(id);
  const pointIdStr = id.toString();
  
  let order = null;

  // First, find the order by ID (without pickupPoint filter)
  // Then manually verify it's assigned to this point
  let orderToCheck = null;
  let foundOrderType = null;
  
  // Try both types if orderType is not specified or unclear
  if (orderType === 'regular') {
    orderToCheck = await Order.findById(orderId);
    if (orderToCheck) foundOrderType = 'regular';
  } else if (orderType === 'smartCart') {
    orderToCheck = await SmartCartOrder.findById(orderId);
    if (orderToCheck) foundOrderType = 'smartCart';
  }
  
  // If not found or orderType not specified, try both
  if (!orderToCheck) {
    // Try smart cart first
    orderToCheck = await SmartCartOrder.findById(orderId);
    if (orderToCheck) {
      foundOrderType = 'smartCart';
    } else {
      // Try regular order
      orderToCheck = await Order.findById(orderId);
      if (orderToCheck) {
        foundOrderType = 'regular';
      }
    }
  } else {
    foundOrderType = orderType; // Use the provided type
  }

  if (!orderToCheck) {
    console.error('❌ Order not found by ID:', {
      orderId,
      orderType,
      triedBoth: !orderType || orderType === 'regular' || orderType === 'smartCart',
    });
    return next(new AppError('الطلب غير موجود', 404));
  }

  console.log('✅ Order found:', {
    orderId,
    orderNumber: orderToCheck.orderNumber,
    foundOrderType,
    requestedOrderType: orderType,
  });

  // Check pickupPoint - handle both ObjectId and string properly
  const storedPickupPoint = orderToCheck.delivery?.pickupPoint;
  
  // Convert stored pickupPoint to string (handles ObjectId, populated object, or string)
  let storedPickupPointStr = null;
  if (storedPickupPoint) {
    if (storedPickupPoint._id) {
      // Already populated
      storedPickupPointStr = storedPickupPoint._id.toString();
    } else if (storedPickupPoint.toString) {
      // ObjectId or string
      storedPickupPointStr = storedPickupPoint.toString();
    } else {
      storedPickupPointStr = String(storedPickupPoint);
    }
  }
  
  // Normalize both IDs to strings for comparison
  const normalizedStored = storedPickupPointStr?.trim();
  const normalizedPointId = pointIdStr?.trim();
  const normalizedPointObjectId = pointObjectId.toString().trim();
  
  console.log('🔍 Order pickupPoint verification:', {
    orderId,
    orderNumber: orderToCheck.orderNumber,
    orderType: orderToCheck.constructor?.modelName || 'Unknown',
    storedPickupPoint: normalizedStored,
    pointIdStr: normalizedPointId,
    pointObjectIdStr: normalizedPointObjectId,
    match: normalizedStored === normalizedPointId || normalizedStored === normalizedPointObjectId,
    hasPickupPoint: !!storedPickupPoint,
  });

  // Verify delivery type is pickup_point
  if (orderToCheck.delivery?.type !== 'pickup_point') {
    console.error('❌ Order delivery type is not pickup_point:', {
      orderId,
      deliveryType: orderToCheck.delivery?.type,
      expectedType: 'pickup_point',
    });
    
    return next(new AppError(
      'الطلب ليس من نوع الاستلام من النقطة. يرجى التأكد من توزيع الطلب على نقطة الاستلام من لوحة الإدارة.',
      400
    ));
  }

  // Verify the order is assigned to this point
  const isMatch = normalizedStored && (
    normalizedStored === normalizedPointId || 
    normalizedStored === normalizedPointObjectId
  );

  if (!isMatch) {
    console.error('❌ Order not assigned to this point:', {
      orderId,
      orderNumber: orderToCheck.orderNumber,
      storedPickupPoint: normalizedStored,
      expectedPoint: normalizedPointId,
      match: false,
      reason: !storedPickupPoint ? 'no pickupPoint' : 'different point',
    });
    
    return next(new AppError(
      `الطلب موجود لكنه ${storedPickupPoint ? `موجه لنقطة أخرى (${normalizedStored})` : 'غير موجه لأي نقطة'}. يرجى التأكد من توزيع الطلب على هذه النقطة (${normalizedPointId}) من لوحة الإدارة.`,
      400
    ));
  }

  // Order is assigned to this point - use it
  order = orderToCheck;
  
  // DON'T populate here - we already verified it's assigned to this point
  // Populating might cause issues if the reference is stale or invalid
  // We'll just use the order data we already have

  console.log('✅ Order verified and assigned to point:', {
    orderId,
    orderNumber: order.orderNumber,
    pointId: id,
    deliveryType: order.delivery?.type,
    hasPickupPoint: !!order.delivery?.pickupPoint,
  });

  // Ensure order is valid
  if (!order || !order._id) {
    console.error('❌ Order is null or invalid after verification');
    return next(new AppError('خطأ في تحميل بيانات الطلب', 500));
  }

  // Check if already ready
  if (order.delivery?.readyForPickup) {
    const alreadyReadyResponse = {
      success: true,
      message: 'الطلب كان جاهزاً للاستلام مسبقاً',
      order: {
        _id: order._id.toString(),
        orderNumber: order.orderNumber || '',
        status: order.status || 'pending',
        delivery: {
          type: order.delivery?.type || 'pickup_point',
          readyForPickup: true,
        },
      },
    };

    console.log('✅ Order already ready, sending response');
    return res.json(alreadyReadyResponse);
  }

  // Update order
  if (!order.delivery) {
    order.delivery = {};
  }
  
  order.delivery.readyForPickup = true;
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: order.status,
    timestamp: new Date(),
    note: 'جاهز للاستلام من النقطة',
    updatedBy: req.user.id,
  });

  try {
    await order.save();
    console.log('✅ Order marked as ready:', order.orderNumber);
  } catch (saveError) {
    console.error('❌ Failed to save order:', saveError);
    return next(new AppError('فشل في تحديث حالة الطلب', 500));
  }

  // Build safe response object - convert all values to JSON-safe types
  const orderResponse = {
    _id: order._id.toString(),
    orderNumber: order.orderNumber || '',
    status: order.status || 'pending',
    delivery: {
      type: order.delivery?.type || 'pickup_point',
      readyForPickup: order.delivery?.readyForPickup === true,
    },
  };

  // Only add pickupPoint if it exists and is valid
  const pickupPointValue = order.delivery?.pickupPoint;
  if (pickupPointValue) {
    // Handle both ObjectId and populated object
    if (pickupPointValue._id) {
      // Already populated
      orderResponse.delivery.pickupPoint = {
        _id: pickupPointValue._id.toString(),
        name: pickupPointValue.name || '',
      };
    } else if (pickupPointValue.toString) {
      // ObjectId or string
      orderResponse.delivery.pickupPoint = {
        _id: pickupPointValue.toString(),
        name: '',
      };
    }
  }

  console.log('✅ Sending response:', {
    orderId: orderResponse._id,
    orderNumber: orderResponse.orderNumber,
    readyForPickup: orderResponse.delivery.readyForPickup,
  });

  // Ensure response is sent correctly - wrap in try-catch
  try {
    const responsePayload = {
      success: true,
      message: 'تم تحديث حالة الطلب - جاهز للاستلام',
      order: orderResponse,
    };
    
    console.log('✅ Response payload:', JSON.stringify(responsePayload, null, 2));
    
    if (!res.headersSent) {
      res.json(responsePayload);
    } else {
      console.error('❌ Headers already sent, cannot send response');
    }
  } catch (responseError) {
    console.error('❌ Failed to send response:', responseError);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'خطأ في إرسال الاستجابة',
      });
    }
  }
});

// @desc    Confirm order pickup by customer
// @route   PUT /api/pos/orders/:orderId/confirm-pickup
// @access  Private (Customer)
export const confirmOrderPickup = catchAsync(async (req, res, next) => {
  const { orderId } = req.params;
  const { orderType } = req.body; // 'regular' or 'smartCart'

  let order;

  if (orderType === 'smartCart' || !orderType) {
    order = await SmartCartOrder.findOne({
      _id: orderId,
      user: req.user.id,
      'delivery.type': 'pickup_point',
      'delivery.readyForPickup': true,
    })
    .populate('delivery.pickupPoint');

    if (order) {
      order.delivery.pickedUpAt = new Date();
      order.delivery.pickedUpBy = req.user.id;
      order.status = 'delivered';
      order.statusHistory.push({
        status: 'delivered',
        timestamp: new Date(),
        note: 'تم الاستلام من نقطة البيع',
        updatedBy: req.user.id,
      });
      await order.save();

      // Calculate and create commission for the point
      if (order.delivery?.pickupPoint) {
        await calculateAndCreateCommission(order, 'smartCart', order.delivery.pickupPoint);
      }
    }
  }

  if (!order && (orderType === 'regular' || !orderType)) {
    order = await Order.findOne({
      _id: orderId,
      user: req.user.id,
      'delivery.type': 'pickup_point',
      'delivery.readyForPickup': true,
    })
    .populate('delivery.pickupPoint');

    if (order) {
      order.delivery.pickedUpAt = new Date();
      order.delivery.pickedUpBy = req.user.id;
      order.status = 'delivered';
      order.statusHistory.push({
        status: 'delivered',
        timestamp: new Date(),
        note: 'تم الاستلام من نقطة البيع',
        updatedBy: req.user.id,
      });
      await order.save();

      // Calculate and create commission for the point
      if (order.delivery?.pickupPoint) {
        await calculateAndCreateCommission(order, 'regular', order.delivery.pickupPoint);
      }
    }
  }

  if (!order) {
    return next(new AppError('الطلب غير موجود أو غير جاهز للاستلام', 404));
  }

  res.json({
    success: true,
    message: 'تم تأكيد الاستلام بنجاح',
    order,
  });
});

// @desc    Request codes from admin (Point Manager)
// @route   POST /api/pos/:id/request-codes
// @access  Private (Point Manager)
export const requestCodes = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { amounts, notes } = req.body; // amounts: [10, 25, 50] - array of code values needed

  if (!amounts || !Array.isArray(amounts) || amounts.length === 0) {
    return next(new AppError('يرجى تحديد قيم الأكواد المطلوبة', 400));
  }

  const point = await PointOfSale.findById(id);

  if (!point) {
    return next(new AppError('النقطة غير موجودة', 404));
  }

  // Check if user is point manager
  if (req.user.role !== 'admin' && point.manager?.toString() !== req.user.id) {
    return next(new AppError('غير مصرح بالوصول', 403));
  }

  // This would typically create a notification or request record
  // For now, we'll just return available codes that match the request
  const availableCodes = await WalletCode.find({
    amount: { $in: amounts },
    isUsed: false,
    isReturned: false, // لا يمكن توزيع الأكواد المرتجعة
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
  }).limit(amounts.length * 2); // Get some extra for options

  res.json({
    success: true,
    message: 'تم إرسال الطلب للإدارة',
    requestedAmounts: amounts,
    availableCodes: availableCodes.length,
    codes: availableCodes.slice(0, 50), // Limit response size
    notes,
  });
});

// @desc    Search customer by email or phone (for code sale)
// @route   GET /api/pos/search-customer
// @access  Private (Point Manager or Admin)
export const searchCustomer = catchAsync(async (req, res, next) => {
  const { email, phone } = req.query;

  if (!email && !phone) {
    return next(new AppError('يرجى إدخال البريد الإلكتروني أو رقم الهاتف', 400));
  }

  const query = {};
  if (email) {
    query.email = { $regex: email, $options: 'i' };
  }
  if (phone) {
    query.phone = { $regex: phone, $options: 'i' };
  }

  const customers = await User.find(query)
    .select('name email phone role')
    .limit(10);

  res.json({
    success: true,
    customers,
  });
});

// @desc    Get point by code (public QR code access)
// @route   GET /api/pos/code/:code
// @access  Public
// @desc    Get point commissions
// @route   GET /api/pos/:id/commissions
// @access  Private (Admin or Point Manager)
export const getPointCommissions = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

  const point = await PointOfSale.findById(id);
  if (!point) {
    return next(new AppError('النقطة غير موجودة', 404));
  }

  // Check permissions
  if (req.user.role !== 'admin' && point.manager?.toString() !== req.user.id) {
    return next(new AppError('غير مصرح بالوصول', 403));
  }

  const query = { pointOfSale: point._id };
  if (status && status !== 'all') {
    query.status = status;
  }
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const commissions = await PointCommission.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip)
    .populate('order', 'orderNumber')
    .populate('smartCartOrder', 'orderNumber')
    .populate({
      path: 'codeDistribution',
      populate: {
        path: 'walletCode',
        select: 'code amount',
      },
    });

  const total = await PointCommission.countDocuments(query);

  res.json({
    success: true,
    commissions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// @desc    Update commission status (Admin)
// @route   PUT /api/pos/commissions/:commissionId
// @access  Private (Admin)
export const updateCommissionStatus = catchAsync(async (req, res, next) => {
  const { commissionId } = req.params;
  const { status, paymentNotes } = req.body;

  const commission = await PointCommission.findById(commissionId)
    .populate('pointOfSale');
  
  if (!commission) {
    return next(new AppError('العمولة غير موجودة', 404));
  }

  if (status && ['pending', 'approved', 'paid', 'cancelled'].includes(status)) {
    commission.status = status;
    if (status === 'paid') {
      commission.paidAt = new Date();
      commission.paidBy = req.user.id;
    }
    if (paymentNotes) {
      commission.paymentNotes = paymentNotes;
    }
    await commission.save();
  }

  res.json({
    success: true,
    commission,
  });
});

export const getPointByCode = catchAsync(async (req, res, next) => {
  const { code } = req.params;

  const point = await PointOfSale.findOne({ code: code.toUpperCase() })
    .populate('manager', 'name email phone')
    .select('-inventory.totalCodesDistributed -inventory.totalSales');

  if (!point) {
    return next(new AppError('النقطة غير موجودة', 404));
  }

  res.json({
    success: true,
    point,
  });
});

