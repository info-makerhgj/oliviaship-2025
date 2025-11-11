import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  walletNumber: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  balance: {
    type: Number,
    default: 0,
    min: 0,
  },
  currency: {
    type: String,
    default: 'SAR',
  },
  transactions: [{
    type: {
      type: String,
      enum: ['deposit', 'withdraw', 'adjustment', 'payment', 'refund'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    description: String,
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    smartCartOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SmartCartOrder',
    },
    codeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WalletCode',
    },
    agentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AgentOrder',
    },
    adjustedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    balanceBefore: Number,
    balanceAfter: Number,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Static method to generate wallet number
walletSchema.statics.generateWalletNumber = async function() {
  let walletNumber;
  let exists = true;
  
  while (exists) {
    const random = Math.floor(1000 + Math.random() * 9000); // 1000-9999
    walletNumber = `WALLET-${random}`;
    exists = await this.findOne({ walletNumber });
  }
  
  return walletNumber;
};

// Method to add transaction
walletSchema.methods.addTransaction = function(type, amount, options = {}) {
  const balanceBefore = this.balance;
  let balanceAfter = balanceBefore;

  if (type === 'deposit' || type === 'refund' || type === 'adjustment') {
    balanceAfter = balanceBefore + amount;
    this.balance = balanceAfter;
  } else if (type === 'withdraw' || type === 'payment') {
    balanceAfter = balanceBefore - amount;
    this.balance = Math.max(0, balanceAfter); // Don't go below 0
  }

  this.transactions.push({
    type,
    amount,
    description: options.description || '',
    orderId: options.orderId,
    smartCartOrderId: options.smartCartOrderId,
    codeId: options.codeId,
    adjustedBy: options.adjustedBy,
    balanceBefore,
    balanceAfter,
    timestamp: new Date(),
  });

  return this.save();
};

export default mongoose.model('Wallet', walletSchema);

