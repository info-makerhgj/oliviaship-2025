import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { catchAsync } from '../utils/catchAsync.js';

export const register = catchAsync(async (req, res, next) => {
  const { name, email, password, phone } = req.body;

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      message: 'البريد الإلكتروني مستخدم بالفعل',
    });
  }

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    phone,
  });

  // Create wallet automatically for new user
  try {
    const Wallet = (await import('../models/Wallet.js')).default;
    const walletNumber = await Wallet.generateWalletNumber();
    await Wallet.create({
      user: user._id,
      walletNumber,
      balance: 0,
      currency: 'SAR',
    });
  } catch (error) {
    console.error('Failed to create wallet for user:', error);
    // Continue even if wallet creation fails
  }

  const token = generateToken(user._id);

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور',
    });
  }

  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({
      message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    });
  }

  if (!user.isActive) {
    return res.status(401).json({
      message: 'تم تعطيل حسابك. يرجى الاتصال بالدعم',
    });
  }

  const token = generateToken(user._id);

  // If admin has no permissions set, set as super_admin (backward compatibility)
  if (user.role === 'admin' && !user.permissions?.adminType) {
    const { applyPermissionPreset } = await import('../utils/permissions.js');
    user.permissions = applyPermissionPreset('super_admin');
    await user.save();
  }

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    },
  });
});

export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  // If admin has no permissions set, set as super_admin (backward compatibility)
  if (user.role === 'admin' && !user.permissions?.adminType) {
    const { applyPermissionPreset } = await import('../utils/permissions.js');
    user.permissions = applyPermissionPreset('super_admin');
    await user.save();
  }
  
  res.json({
    success: true,
    user,
  });
});

export const updateProfile = catchAsync(async (req, res, next) => {
  const { name, phone, address } = req.body;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      name,
      phone,
      address,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.json({
    success: true,
    user,
  });
});

export const changePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return res.status(401).json({
      message: 'كلمة المرور الحالية غير صحيحة',
    });
  }

  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'تم تغيير كلمة المرور بنجاح',
  });
});
