import mongoose from 'mongoose';

const { Schema } = mongoose;

const pointCommissionSchema = new Schema({
  pointOfSale: {
    type: Schema.Types.ObjectId,
    ref: 'PointOfSale',
    required: true,
    index: true,
  },
  order: {
    type: Schema.Types.ObjectId,
    ref: 'Order',
    index: true,
  },
  smartCartOrder: {
    type: Schema.Types.ObjectId,
    ref: 'SmartCartOrder',
    index: true,
  },
  orderNumber: {
    type: String,
    required: true,
  },
  orderType: {
    type: String,
    enum: ['regular', 'smartCart', 'code'],
    required: true,
  },
  codeDistribution: {
    type: Schema.Types.ObjectId,
    ref: 'CodeDistribution',
    index: true,
  },
  // تفاصيل الطلب لحساب العمولة
  orderTotal: {
    type: Number,
    required: true, // إجمالي الطلب
  },
  commissionRate: {
    type: Number,
    required: true, // نسبة العمولة (%)
    min: 0,
    max: 100,
  },
  commissionAmount: {
    type: Number,
    required: true, // مبلغ العمولة (ريال سعودي)
  },
  // الحالة
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'cancelled'],
    default: 'pending',
  },
  // معلومات الدفع
  paidAt: Date,
  paidBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  paymentNotes: String,
  // معلومات إضافية
  notes: String,
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Indexes
pointCommissionSchema.index({ pointOfSale: 1, status: 1 });
pointCommissionSchema.index({ createdAt: -1 });
pointCommissionSchema.index({ orderNumber: 1 });

export default mongoose.model('PointCommission', pointCommissionSchema);


