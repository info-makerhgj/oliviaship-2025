import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  agentNumber: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 10, // 10% default commission
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  // Payment tracking
  totalEarnings: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalCommissions: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalPaidToPlatform: {
    type: Number,
    default: 0,
    min: 0,
  },
  pendingAmount: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Statistics
  stats: {
    totalCustomers: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    pendingOrders: {
      type: Number,
      default: 0,
    },
    completedOrders: {
      type: Number,
      default: 0,
    },
  },
  // Settings
  settings: {
    receiveNotifications: {
      type: Boolean,
      default: true,
    },
    notificationMethods: {
      sms: {
        type: Boolean,
        default: false,
      },
      whatsapp: {
        type: Boolean,
        default: false,
      },
      email: {
        type: Boolean,
        default: true,
      },
    },
    preferredPaymentMethod: {
      type: String,
      enum: ['cash', 'transfer', 'cash_pay', 'wallet', 'point_of_sale'],
      default: 'transfer',
    },
  },
  notes: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

// Generate unique agent number
agentSchema.statics.generateAgentNumber = async function() {
  let agentNumber;
  let exists = true;
  
  while (exists) {
    const random = Math.floor(1000 + Math.random() * 9000); // 1000-9999
    agentNumber = `AGENT-${random}`;
    exists = await this.findOne({ agentNumber });
  }
  
  return agentNumber;
};

// Update stats method
agentSchema.methods.updateStats = async function() {
  const AgentCustomer = mongoose.model('AgentCustomer');
  const AgentOrder = mongoose.model('AgentOrder');
  
  // Count customers
  const customerCount = await AgentCustomer.countDocuments({ agent: this._id });
  
  // Count orders and calculate totals
  const orders = await AgentOrder.find({ agent: this._id });
  const orderCount = orders.length;
  const salesTotal = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
  const completedCount = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
  
  this.stats = {
    totalCustomers: customerCount,
    totalOrders: orderCount,
    totalSales: salesTotal,
    pendingOrders: pendingCount,
    completedOrders: completedCount,
  };
  
  return this.save();
};

export default mongoose.model('Agent', agentSchema);

