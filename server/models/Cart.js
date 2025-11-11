import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [{
    productUrl: {
      type: String,
      required: true,
    },
    store: String,
    name: String,
    price: Number,
    currency: String,
    image: String,
    quantity: {
      type: Number,
      default: 1,
    },
    options: {
      color: String,
      size: String,
      specifications: String,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  totalItems: {
    type: Number,
    default: 0,
  },
  totalPrice: {
    type: Number,
    default: 0,
  },
  currency: {
    type: String,
    default: 'SAR',
  },
  coupons: [{
    code: String,
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    discountAmount: Number,
    discountType: String,
    applicableStores: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
  }],
  discountSummary: {
    totalDiscount: {
      type: Number,
      default: 0,
    },
    couponsUsed: {
      type: Number,
      default: 0,
    },
    storeBreakdown: mongoose.Schema.Types.Mixed,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

cartSchema.index({ user: 1 });

export default mongoose.model('Cart', cartSchema);

