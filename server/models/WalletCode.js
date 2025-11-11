import mongoose from 'mongoose';

const walletCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    unique: true,
    required: true,
    uppercase: true,
    trim: true,
    index: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'SAR',
  },
  isUsed: {
    type: Boolean,
    default: false,
  },
  usedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  usedAt: Date,
  isReturned: {
    type: Boolean,
    default: false,
    index: true,
  },
  returnedAt: {
    type: Date,
  },
  returnedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PointOfSale',
  },
  returnReason: String,
  expiresAt: {
    type: Date,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  notes: String,
}, {
  timestamps: true,
});

walletCodeSchema.index({ isUsed: 1 });
walletCodeSchema.index({ expiresAt: 1 });

// Static method to generate random code
walletCodeSchema.statics.generateCode = function(length = 8) {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters (0, O, I, 1)
  let code = '';
  
  for (let i = 0; i < length; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return code;
};

// Method to check if code is valid
walletCodeSchema.methods.isValid = function() {
  if (this.isUsed) return false;
  if (this.isReturned) return false; // الكود المرتجع لا يمكن استخدامه
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
};

export default mongoose.model('WalletCode', walletCodeSchema);

