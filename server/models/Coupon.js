import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
  },
  minOrderAmount: {
    type: Number,
    default: 0,
  },
  maxDiscountAmount: Number,
  applicableStores: [String],
  customSites: [{
    domain: String,
    name: String,
    description: String,
  }],
  storeTypes: [String],
  validFrom: {
    type: Date,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  usageLimit: {
    type: Number,
    default: null,
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  usageLimitPerUser: {
    type: Number,
    default: 1,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  priority: {
    type: Number,
    default: 0,
  },
  conditions: {
    categories: [String],
    brands: [String],
    minItems: Number,
    maxItems: Number,
    validDays: [String],
    validHours: {
      start: String,
      end: String,
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  stats: {
    totalDiscountGiven: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    averageOrderValue: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

couponSchema.index({ code: 1 });
couponSchema.index({ isActive: 1 });

export default mongoose.model('Coupon', couponSchema);

