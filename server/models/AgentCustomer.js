import mongoose from 'mongoose';

const agentCustomerSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
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
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
    mapLink: String,
    notes: String, // إرشادات الوصول
  },
  // Statistics
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
  // If customer has account in system
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  notes: String,
}, {
  timestamps: true,
});

// Index for search
agentCustomerSchema.index({ agent: 1, phone: 1 });
agentCustomerSchema.index({ agent: 1, name: 1 });

// Update stats method
agentCustomerSchema.methods.updateStats = async function() {
  const AgentOrder = mongoose.model('AgentOrder');
  
  const orders = await AgentOrder.find({ customer: this._id });
  const orderCount = orders.length;
  const spentTotal = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const lastOrder = orders
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
  
  this.stats = {
    totalOrders: orderCount,
    totalSpent: spentTotal,
    lastOrderDate: lastOrder?.createdAt || null,
  };
  
  return this.save();
};

export default mongoose.model('AgentCustomer', agentCustomerSchema);

