import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { catchAsync } from '../utils/catchAsync.js';
import { hasPermission, isSuperAdmin } from '../utils/permissions.js';

export const protect = catchAsync(async (req, res, next) => {
  let token;

  // Check Authorization header first
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  // For mobile app (WebView), allow token from query string
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      message: 'غير مصرح - يرجى تسجيل الدخول',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if mongoose is connected
    if (!mongoose.connection.readyState) {
      console.error('❌ MongoDB not connected in protect middleware');
      return res.status(500).json({
        message: 'خطأ في الاتصال بقاعدة البيانات',
      });
    }
    
    req.user = await User.findById(decoded.id);
    
    if (!req.user || !req.user.isActive) {
      return res.status(401).json({
        message: 'المستخدم غير موجود أو غير نشط',
      });
    }

    next();
  } catch (error) {
    console.error('❌ Auth error:', error);
    
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'رمز الدخول غير صالح أو منتهي الصلاحية',
      });
    }
    
    // Handle database errors
    if (error.name === 'MongoError' || error.name === 'MongooseError') {
      console.error('❌ Database error in auth:', error);
      return res.status(500).json({
        message: 'خطأ في الاتصال بقاعدة البيانات',
      });
    }
    
    return res.status(401).json({
      message: 'رمز الدخول غير صالح',
    });
  }
});

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      message: 'غير مصرح - يجب أن تكون مدير',
    });
  }
};

/**
 * Check if user has specific permission
 * Usage: requirePermission('canManageOrders')
 */
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'غير مصرح',
      });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        message: 'غير مصرح - يجب أن تكون مدير',
      });
    }

    // Super admin bypasses all permission checks
    if (isSuperAdmin(req.user)) {
      return next();
    }

    if (!hasPermission(req.user, permission)) {
      return res.status(403).json({
        message: 'ليس لديك صلاحية للوصول إلى هذا المورد',
      });
    }

    next();
  };
};

/**
 * Require super admin access
 */
export const requireSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: 'غير مصرح',
    });
  }

  if (!isSuperAdmin(req.user)) {
    return res.status(403).json({
      message: 'غير مصرح - يجب أن تكون مدير النظام الكامل',
    });
  }

  next();
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      console.log('❌ Authorize: No user found');
      return res.status(401).json({
        message: 'غير مصرح',
      });
    }

    console.log('✅ User role:', req.user.role, 'Required roles:', roles);

    if (!roles.includes(req.user.role)) {
      console.log('❌ Authorize: User role not allowed');
      return res.status(403).json({
        message: 'ليس لديك صلاحية للوصول إلى هذا المورد',
        userRole: req.user.role,
        requiredRoles: roles,
      });
    }

    next();
  };
};
