import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'الاسم مطلوب'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'البريد الإلكتروني مطلوب'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'كلمة المرور مطلوبة'],
    minlength: [6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'],
  },
  phone: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'purchasing', 'shipping', 'support', 'agent'],
    default: 'customer',
  },
  // Admin permissions - only for admin role
  permissions: {
    adminType: {
      type: String,
      enum: ['super_admin', 'orders_manager', 'users_manager', 'payments_manager', 'settings_manager'],
      default: null,
    },
    // Granular permissions object
    canManageOrders: { type: Boolean, default: false },
    canManageUsers: { type: Boolean, default: false },
    canManagePayments: { type: Boolean, default: false },
    canManageAgents: { type: Boolean, default: false },
    canManagePoints: { type: Boolean, default: false },
    canManageSettings: { type: Boolean, default: false },
    canManageWallets: { type: Boolean, default: false },
  },
  address: {
    street: String,
    city: String,
    governorate: String,
    postalCode: String,
    country: {
      type: String,
      default: 'Yemen',
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  stats: {
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    lastOrderDate: Date,
  },
  preferences: {
    language: {
      type: String,
      default: 'ar',
    },
    currency: {
      type: String,
      default: 'YER',
    },
    notifications: {
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
      whatsapp: {
        type: Boolean,
        default: false,
      },
    },
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model('User', userSchema);

