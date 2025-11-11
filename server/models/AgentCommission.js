import mongoose from 'mongoose';

const agentCommissionSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
    index: true,
  },
  agentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentOrder',
    required: true,
    index: true,
  },
  orderNumber: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  commissionRate: {
    type: Number,
    required: true,
  },
  orderAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'calculated', 'paid', 'cancelled'],
    default: 'pending',
  },
  calculatedAt: Date,
  paidAt: Date,
  paidBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  paymentMethod: {
    type: String,
    enum: ['wallet', 'transfer', 'cash', 'other'],
  },
  paymentNotes: String,
  notes: String,
}, {
  timestamps: true,
});

// Indexes
agentCommissionSchema.index({ agent: 1, status: 1 });
agentCommissionSchema.index({ agent: 1, createdAt: -1 });

export default mongoose.model('AgentCommission', agentCommissionSchema);

