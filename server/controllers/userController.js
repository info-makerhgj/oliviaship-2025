import User from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';
import { applyPermissionPreset, isSuperAdmin } from '../utils/permissions.js';

export const getUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({}).select('-password');
  res.json({ success: true, users });
});

export const getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'المستخدم غير موجود' });
  }
  res.json({ success: true, user });
});

export const updateUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
  res.json({ success: true, user });
});

export const toggleStatus = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  user.isActive = !user.isActive;
  await user.save();
  res.json({ success: true, user });
});

/**
 * Create new admin user with permissions
 * Only super admin can create admins
 */
export const createAdmin = catchAsync(async (req, res, next) => {
  // Only super admin can create admins
  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح - يجب أن تكون مدير النظام الكامل',
    });
  }

  const { name, email, password, phone, permissionType } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'الاسم، البريد الإلكتروني وكلمة المرور مطلوبة',
    });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'البريد الإلكتروني مستخدم بالفعل',
    });
  }

  // Create admin user with permissions
  const adminData = {
    name,
    email,
    password,
    phone,
    role: 'admin',
    isActive: true,
    stats: {
      totalOrders: 0,
      totalSpent: 0,
    },
  };

  // Add permissions if specified
  if (permissionType) {
    adminData.permissions = applyPermissionPreset(permissionType);
  } else {
    // Default to super_admin if not specified
    adminData.permissions = applyPermissionPreset('super_admin');
  }

  const admin = await User.create(adminData);

  // Create wallet automatically for new admin
  try {
    const Wallet = (await import('../models/Wallet.js')).default;
    const walletNumber = await Wallet.generateWalletNumber();
    await Wallet.create({
      user: admin._id,
      walletNumber,
      balance: 0,
      currency: 'SAR',
    });
  } catch (error) {
    console.error('Failed to create wallet for admin:', error);
    // Continue even if wallet creation fails
  }

  res.status(201).json({
    success: true,
    user: await User.findById(admin._id).select('-password'),
  });
});

export const updatePermissions = catchAsync(async (req, res, next) => {
  // Only super admin can update permissions
  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح - يجب أن تكون مدير النظام الكامل',
    });
  }

  const { id } = req.params;
  const { permissionType, permissions } = req.body;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'المستخدم غير موجود',
    });
  }

  // Only update permissions for admin users
  if (user.role !== 'admin') {
    return res.status(400).json({
      success: false,
      message: 'يمكن فقط تحديث صلاحيات المديرين',
    });
  }

  // If permissionType is provided, apply preset
  if (permissionType) {
    const preset = applyPermissionPreset(permissionType);
    if (preset) {
      user.permissions = preset;
    }
  } else if (permissions) {
    // Update specific permissions
    user.permissions = {
      ...user.permissions,
      ...permissions,
    };
  }

  await user.save();

  res.json({
    success: true,
    user: await User.findById(id).select('-password'),
  });
});

