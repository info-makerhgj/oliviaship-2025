import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentNumber: {
    type: String,
    unique: true,
    required: true,
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  smartCartOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SmartCartOrder',
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  currency: {
    type: String,
    default: 'SAR',
  },
  method: {
    type: String,
    enum: ['stripe', 'cash_on_delivery', 'bank_transfer', 'wallet', 'cash_pay'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
  gateway: {
    type: String,
    enum: ['stripe', 'cash_pay', 'manual'],
    default: 'stripe',
  },
  transactionId: String,
  gatewayResponse: mongoose.Schema.Types.Mixed,
  paidAt: Date,
  proofOfPayment: String,
  notes: String,
  refundedAmount: {
    type: Number,
    default: 0,
  },
  refundedAt: Date,
  refundReason: String,
}, {
  timestamps: true,
});

paymentSchema.index({ paymentNumber: 1 });
paymentSchema.index({ user: 1 });
paymentSchema.index({ order: 1 });
paymentSchema.index({ status: 1 });

export default mongoose.model('Payment', paymentSchema);
