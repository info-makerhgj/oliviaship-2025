import Wallet from '../models/Wallet.js';
import WalletCode from '../models/WalletCode.js';
import User from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';

// Get user's wallet with statistics
export const getWallet = catchAsync(async (req, res, next) => {
  let wallet = await Wallet.findOne({ user: req.user.id });

  if (!wallet) {
    // Create wallet if doesn't exist (for existing users)
    const walletNumber = await Wallet.generateWalletNumber();
    wallet = await Wallet.create({
      user: req.user.id,
      walletNumber,
      balance: 0,
      currency: 'SAR',
    });
  }

  // Calculate statistics
  const transactions = wallet.transactions || [];
  const stats = {
    totalDeposits: transactions
      .filter(t => t.type === 'deposit' || t.type === 'refund' || t.type === 'adjustment')
      .reduce((sum, t) => sum + (t.amount || 0), 0),
    totalPayments: transactions
      .filter(t => t.type === 'payment' || t.type === 'withdraw')
      .reduce((sum, t) => sum + (t.amount || 0), 0),
    transactionCount: transactions.length,
    lastTransaction: transactions.length > 0 
      ? transactions[transactions.length - 1].timestamp 
      : null,
    depositsCount: transactions.filter(t => t.type === 'deposit' || t.type === 'refund' || t.type === 'adjustment').length,
    paymentsCount: transactions.filter(t => t.type === 'payment' || t.type === 'withdraw').length,
  };

  res.json({
    success: true,
    wallet,
    stats,
  });
});

// Get wallet transactions with filtering
export const getTransactions = catchAsync(async (req, res, next) => {
  const wallet = await Wallet.findOne({ user: req.user.id });

  if (!wallet) {
    return res.status(404).json({
      message: 'المحفظة غير موجودة',
    });
  }

  const { 
    page = 1, 
    limit = 20,
    type, // filter by transaction type
    startDate, // filter by start date
    endDate, // filter by end date
    minAmount, // filter by minimum amount
    maxAmount, // filter by maximum amount
    search, // search in description
  } = req.query;

  let filteredTransactions = [...(wallet.transactions || [])];

  // Filter by type
  if (type && type !== 'all') {
    if (type === 'income') {
      filteredTransactions = filteredTransactions.filter(t => 
        t.type === 'deposit' || t.type === 'refund' || t.type === 'adjustment'
      );
    } else if (type === 'expense') {
      filteredTransactions = filteredTransactions.filter(t => 
        t.type === 'payment' || t.type === 'withdraw'
      );
    } else {
      filteredTransactions = filteredTransactions.filter(t => t.type === type);
    }
  }

  // Filter by date range
  if (startDate) {
    const start = new Date(startDate);
    filteredTransactions = filteredTransactions.filter(t => 
      new Date(t.timestamp) >= start
    );
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filteredTransactions = filteredTransactions.filter(t => 
      new Date(t.timestamp) <= end
    );
  }

  // Filter by amount range
  if (minAmount !== undefined) {
    filteredTransactions = filteredTransactions.filter(t => 
      (t.amount || 0) >= parseFloat(minAmount)
    );
  }
  if (maxAmount !== undefined) {
    filteredTransactions = filteredTransactions.filter(t => 
      (t.amount || 0) <= parseFloat(maxAmount)
    );
  }

  // Search in description
  if (search) {
    const searchLower = search.toLowerCase();
    filteredTransactions = filteredTransactions.filter(t => 
      (t.description || '').toLowerCase().includes(searchLower)
    );
  }

  // Sort by timestamp (newest first)
  filteredTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  const total = filteredTransactions.length;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedTransactions = filteredTransactions.slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    transactions: paginatedTransactions,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Export transactions as CSV
export const exportTransactions = catchAsync(async (req, res, next) => {
  const wallet = await Wallet.findOne({ user: req.user.id });

  if (!wallet) {
    return res.status(404).json({
      message: 'المحفظة غير موجودة',
    });
  }

  const transactions = wallet.transactions || [];
  transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Generate CSV
  const csvHeader = 'التاريخ,النوع,المبلغ,الوصف,الرصيد قبل,الرصيد بعد\n';
  const csvRows = transactions.map(t => {
    const date = new Date(t.timestamp).toLocaleDateString('ar-SA');
    const type = {
      deposit: 'شحن',
      payment: 'دفع',
      refund: 'استرداد',
      adjustment: 'تعديل',
      withdraw: 'سحب',
    }[t.type] || t.type;
    return `"${date}","${type}","${t.amount}","${t.description || ''}","${t.balanceBefore || 0}","${t.balanceAfter || 0}"`;
  }).join('\n');

  const csv = csvHeader + csvRows;
  const filename = `wallet-transactions-${wallet.walletNumber}-${Date.now()}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\ufeff' + csv); // BOM for Excel UTF-8 support
});

// Redeem code (Charge wallet)
export const redeemCode = catchAsync(async (req, res, next) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({
      message: 'يرجى إدخال الكود',
    });
  }

  // Find code
  const walletCode = await WalletCode.findOne({ 
    code: code.toUpperCase().trim() 
  });

  if (!walletCode) {
    return res.status(404).json({
      message: 'الكود غير صحيح',
    });
  }

  // Check if code is valid
  if (!walletCode.isValid()) {
    if (walletCode.isReturned) {
      return res.status(400).json({
        message: 'هذا الكود تم إرجاعه ولا يمكن استخدامه',
      });
    }
    if (walletCode.isUsed) {
      return res.status(400).json({
        message: 'هذا الكود مستخدم مسبقاً',
      });
    }
    if (walletCode.expiresAt && new Date() > walletCode.expiresAt) {
      return res.status(400).json({
        message: 'هذا الكود منتهي الصلاحية',
      });
    }
  }

  // Get or create wallet
  let wallet = await Wallet.findOne({ user: req.user.id });

  if (!wallet) {
    const walletNumber = await Wallet.generateWalletNumber();
    wallet = await Wallet.create({
      user: req.user.id,
      walletNumber,
      balance: 0,
      currency: 'SAR',
    });
  }

  // Add transaction and update balance
  await wallet.addTransaction('deposit', walletCode.amount, {
    description: `شحن رصيد عبر الكود ${walletCode.code}`,
    codeId: walletCode._id,
  });

  // Mark code as used
  walletCode.isUsed = true;
  walletCode.usedBy = req.user.id;
  walletCode.usedAt = new Date();
  await walletCode.save();

  // Reload wallet to get updated balance
  await wallet.populate('user', 'name email');

  res.json({
    success: true,
    message: `تم شحن رصيدك بنجاح بمبلغ ${walletCode.amount} ${walletCode.currency}`,
    wallet,
    amount: walletCode.amount,
  });
});

// Admin: Create wallet code (supports bulk generation up to 1000)
export const createWalletCode = catchAsync(async (req, res, next) => {
  const { amount, code, expiresAt, notes, count = 1 } = req.body;

  if (!amount || amount <= 0) {
    return res.status(400).json({
      message: 'يجب تحديد قيمة الكود',
    });
  }

  const codeCount = parseInt(count) || 1;
  if (codeCount < 1 || codeCount > 1000) {
    return res.status(400).json({
      message: 'عدد الأكواد يجب أن يكون بين 1 و 1000',
    });
  }

  const codes = [];
  const providedCode = code ? code.toUpperCase().trim() : null;

  // If code is provided, only create one code (ignore count)
  if (providedCode) {
    const existingCode = await WalletCode.findOne({ code: providedCode });
    
    if (existingCode) {
      return res.status(400).json({
        message: `الكود ${providedCode} موجود مسبقاً`,
      });
    }

    const walletCode = await WalletCode.create({
      code: providedCode,
      amount,
      currency: req.body.currency || 'SAR',
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      createdBy: req.user.id,
      notes,
    });

    codes.push(walletCode);
  } else {
    // Generate multiple codes
    let created = 0;
    let attempts = 0;
    const maxAttempts = codeCount * 10; // Prevent infinite loop

    while (created < codeCount && attempts < maxAttempts) {
      attempts++;
      
      let generatedCode;
      let exists = true;
      let checkAttempts = 0;
      
      // Generate unique code (longer for bulk to reduce collisions)
      while (exists && checkAttempts < 50) {
        generatedCode = WalletCode.generateCode(10);
        const existing = await WalletCode.findOne({ code: generatedCode });
        exists = !!existing;
        checkAttempts++;
      }

      if (exists) {
        continue; // Skip if couldn't generate unique code
      }

      try {
        const walletCode = await WalletCode.create({
          code: generatedCode,
          amount,
          currency: req.body.currency || 'SAR',
          expiresAt: expiresAt ? new Date(expiresAt) : undefined,
          createdBy: req.user.id,
          notes,
        });

        codes.push(walletCode);
        created++;
      } catch (error) {
        // Skip duplicates and continue
        if (error.code !== 11000) {
          throw error;
        }
      }
    }

    if (created < codeCount) {
      return res.status(500).json({
        message: `تم إنشاء ${created} من ${codeCount} كود. قد تكون هناك مشكلة في توليد الأكواد الفريدة.`,
        codes,
      });
    }
  }

  res.status(201).json({
    success: true,
    message: `تم إنشاء ${codes.length} كود بنجاح`,
    codes: codes.slice(0, 100), // Return max 100 codes in response to avoid huge payload
    totalCreated: codes.length,
  });
});

// Admin: Get all wallet codes with statistics
export const getAllWalletCodes = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    isUsed,
    isReturned,
    search,
    minAmount,
    maxAmount,
  } = req.query;

  const query = {};

  if (isUsed !== undefined) {
    query.isUsed = isUsed === 'true';
  }

  if (isReturned !== undefined) {
    query.isReturned = isReturned === 'true';
  }

  if (search) {
    query.code = { $regex: search, $options: 'i' };
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    query.amount = {};
    if (minAmount !== undefined) query.amount.$gte = parseFloat(minAmount);
    if (maxAmount !== undefined) query.amount.$lte = parseFloat(maxAmount);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const codes = await WalletCode.find(query)
    .populate('usedBy', 'name email')
    .populate('returnedFrom', 'name')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await WalletCode.countDocuments(query);

  // Calculate statistics for all codes (without query filters for accurate stats)
  const allCodesForStats = await WalletCode.find({});
  const stats = {
    totalCodes: allCodesForStats.length,
    usedCodes: allCodesForStats.filter(c => c.isUsed && !c.isReturned).length,
    unusedCodes: allCodesForStats.filter(c => !c.isUsed && !c.isReturned).length,
    returnedCodes: allCodesForStats.filter(c => c.isReturned).length,
    expiredCodes: allCodesForStats.filter(c => c.expiresAt && new Date(c.expiresAt) < new Date()).length,
    totalValue: allCodesForStats.reduce((sum, c) => sum + (c.amount || 0), 0),
    usedValue: allCodesForStats.filter(c => c.isUsed && !c.isReturned).reduce((sum, c) => sum + (c.amount || 0), 0),
    unusedValue: allCodesForStats.filter(c => !c.isUsed && !c.isReturned).reduce((sum, c) => sum + (c.amount || 0), 0),
    returnedValue: allCodesForStats.filter(c => c.isReturned).reduce((sum, c) => sum + (c.amount || 0), 0),
  };

  res.json({
    success: true,
    codes,
    stats,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Admin: Export wallet codes as CSV
export const exportWalletCodes = catchAsync(async (req, res, next) => {
  const {
    isUsed,
    isReturned,
    search,
    minAmount,
    maxAmount,
  } = req.query;

  const query = {};

  if (isUsed !== undefined) {
    query.isUsed = isUsed === 'true';
  }

  if (isReturned !== undefined) {
    query.isReturned = isReturned === 'true';
  }

  if (search) {
    query.code = { $regex: search, $options: 'i' };
  }

  if (minAmount !== undefined || maxAmount !== undefined) {
    query.amount = {};
    if (minAmount !== undefined) query.amount.$gte = parseFloat(minAmount);
    if (maxAmount !== undefined) query.amount.$lte = parseFloat(maxAmount);
  }

  const codes = await WalletCode.find(query)
    .populate('usedBy', 'name email')
    .populate('returnedFrom', 'name')
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 });

  // Generate CSV
  const csvHeader = 'الكود,القيمة,العملة,الحالة,مستخدم بواسطة,تاريخ الاستخدام,تاريخ الانتهاء,مرتجع من,تاريخ الإرجاع,سبب الإرجاع,أنشئ بواسطة,تاريخ الإنشاء,ملاحظات\n';
  const csvRows = codes.map(c => {
    let status = 'نشط';
    if (c.isReturned) {
      status = 'مرتجع';
    } else if (c.isUsed) {
      status = 'مستخدم';
    } else if (c.expiresAt && new Date(c.expiresAt) < new Date()) {
      status = 'منتهي';
    }
    const usedBy = c.usedBy ? `${c.usedBy.name} (${c.usedBy.email})` : '';
    const usedAt = c.usedAt ? new Date(c.usedAt).toLocaleDateString('ar-SA') : '';
    const expiresAt = c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('ar-SA') : '';
    const returnedFrom = c.returnedFrom ? (c.returnedFrom.name || c.returnedFrom) : '';
    const returnedAt = c.returnedAt ? new Date(c.returnedAt).toLocaleDateString('ar-SA') : '';
    const returnReason = c.returnedReason || '';
    const createdBy = c.createdBy ? `${c.createdBy.name} (${c.createdBy.email})` : '';
    const createdAt = new Date(c.createdAt).toLocaleDateString('ar-SA');
    return `"${c.code}","${c.amount}","${c.currency}","${status}","${usedBy}","${usedAt}","${expiresAt}","${returnedFrom}","${returnedAt}","${returnReason}","${createdBy}","${createdAt}","${c.notes || ''}"`;
  }).join('\n');

  const csv = csvHeader + csvRows;
  const filename = `wallet-codes-${Date.now()}.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send('\ufeff' + csv); // BOM for Excel UTF-8 support
});

// Admin: Get QR code for wallet code (returns data URL)
export const getWalletCodeQR = catchAsync(async (req, res, next) => {
  const { codeId } = req.params;

  const walletCode = await WalletCode.findById(codeId);

  if (!walletCode) {
    return res.status(404).json({
      message: 'الكود غير موجود',
    });
  }

  // Generate QR code data - include both JSON and plain text formats
  // JSON format for structured data
  const qrData = {
    code: walletCode.code,
    amount: walletCode.amount,
    currency: walletCode.currency,
  };

  // Create QR code with JSON data (scanner can parse JSON or use plain code)
  // Using both JSON and plain code for maximum compatibility
  // Format: JSON with code as primary, but scanner can also read plain code if JSON parsing fails
  const qrCodeContent = JSON.stringify(qrData);
  
  // Generate QR code URL with higher resolution for better scanning
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeContent)}&ecc=M`;

  res.json({
    success: true,
    qrUrl,
    code: walletCode.code,
    data: qrData,
    // Also provide plain code for direct scanning
    plainCode: walletCode.code,
  });
});

// Admin: Get wallet by user ID
export const getWalletByUserId = catchAsync(async (req, res, next) => {
  const { userId } = req.query;

  if (!userId) {
    return next(new AppError('يرجى تحديد معرف المستخدم', 400));
  }

  let wallet = await Wallet.findOne({ user: userId })
    .populate('user', 'name email phone');

  if (!wallet) {
    // Create wallet if doesn't exist
    const walletNumber = await Wallet.generateWalletNumber();
    wallet = await Wallet.create({
      user: userId,
      walletNumber,
      balance: 0,
      currency: 'SAR',
    });
    await wallet.populate('user', 'name email phone');
  }

  res.json({
    success: true,
    wallet,
  });
});

// Admin: Get all wallets
export const getAllWallets = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    minBalance,
    maxBalance,
    userId,
  } = req.query;

  const query = {};

  // Filter by userId if provided
  if (userId) {
    query.user = userId;
  }

  if (search) {
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    
    query.$or = [
      { walletNumber: { $regex: search, $options: 'i' } },
      ...(users.length > 0 ? [{ user: { $in: users.map(u => u._id) } }] : []),
    ];
  }

  if (minBalance !== undefined || maxBalance !== undefined) {
    query.balance = {};
    if (minBalance !== undefined) query.balance.$gte = parseFloat(minBalance);
    if (maxBalance !== undefined) query.balance.$lte = parseFloat(maxBalance);
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const wallets = await Wallet.find(query)
    .populate('user', 'name email phone')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Wallet.countDocuments(query);

  res.json({
    success: true,
    wallets,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

// Admin: Adjust wallet balance
export const adjustBalance = catchAsync(async (req, res, next) => {
  const { walletId, amount, description } = req.body;

  if (!walletId || amount === undefined) {
    return res.status(400).json({
      message: 'يجب تحديد المحفظة والمبلغ',
    });
  }

  const wallet = await Wallet.findById(walletId);

  if (!wallet) {
    return res.status(404).json({
      message: 'المحفظة غير موجودة',
    });
  }

  // Use 'adjustment' for increase and 'withdraw' for decrease
  const adjustmentType = amount > 0 ? 'adjustment' : 'withdraw';
  const adjustmentAmount = Math.abs(amount);

  await wallet.addTransaction(adjustmentType, adjustmentAmount, {
    description: description || `تعديل يدوي من قبل الإدارة: ${amount > 0 ? '+' : '-'}${adjustmentAmount}`,
    adjustedBy: req.user.id,
  });

  res.json({
    success: true,
    message: `تم تعديل الرصيد بنجاح. الرصيد الجديد: ${wallet.balance}`,
    wallet: {
      walletNumber: wallet.walletNumber,
      balance: wallet.balance,
      currency: wallet.currency,
    },
    balanceBefore: wallet.balance - (amount > 0 ? adjustmentAmount : -adjustmentAmount),
    balanceAfter: wallet.balance,
  });
});

// Admin: Get wallet transactions
export const getWalletTransactions = catchAsync(async (req, res, next) => {
  const { walletId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const wallet = await Wallet.findById(walletId);

  if (!wallet) {
    return res.status(404).json({
      message: 'المحفظة غير موجودة',
    });
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const transactions = wallet.transactions
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(skip, skip + parseInt(limit));

  res.json({
    success: true,
    transactions,
    wallet: {
      walletNumber: wallet.walletNumber,
      balance: wallet.balance,
      user: wallet.user,
    },
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: wallet.transactions.length,
      pages: Math.ceil(wallet.transactions.length / parseInt(limit)),
    },
  });
});
