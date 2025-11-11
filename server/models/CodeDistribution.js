import mongoose from 'mongoose';

const codeDistributionSchema = new mongoose.Schema({
  walletCode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WalletCode',
    required: true,
  },
  pointOfSale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PointOfSale',
    required: true,
  },
  distributedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  purchasePrice: {
    type: Number,
    required: true, // السعر الذي اشترت به النقطة الكود (مع الخصم)
  },
  originalAmount: {
    type: Number,
    required: true, // القيمة الأصلية للكود
  },
  salePrice: {
    type: Number, // السعر الذي باعت به النقطة الكود للعميل (إن تم البيع)
  },
  soldAt: Date,
  soldTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  status: {
    type: String,
    enum: ['distributed', 'sold', 'returned', 'expired'],
    default: 'distributed',
  },
  notes: String,
}, {
  timestamps: true,
});

codeDistributionSchema.index({ pointOfSale: 1, status: 1 });
codeDistributionSchema.index({ walletCode: 1 });

export default mongoose.model('CodeDistribution', codeDistributionSchema);


