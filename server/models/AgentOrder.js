import mongoose from 'mongoose';

const agentOrderSchema = new mongoose.Schema({
  agent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agent',
    required: true,
    index: true,
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AgentCustomer',
    required: true,
    index: true,
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true,
    index: true,
  },
  // Link to main order system
  smartCartOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SmartCartOrder',
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  // Order details
  products: [{
    url: String,
    name: String,
    price: Number,
    currency: String,
    image: String,
    quantity: {
      type: Number,
      default: 1,
    },
    color: String,
    size: String,
    specifications: String,
    store: String,
  }],
  pricing: {
    subtotal: Number,
    commission: Number,
    customsFees: Number,
    shippingCost: Number,
    processingFee: Number,
    handlingFee: Number,
    insuranceFee: Number,
    packagingFee: Number,
    totalDiscount: {
      type: Number,
      default: 0,
    },
    totalCost: Number,
    totalInYER: Number,
  },
  // Payment status from customer to agent
  customerPaymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'refunded'],
    default: 'pending',
  },
  customerPaymentDate: Date,
  customerPaymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'other'],
  },
  customerPaymentNotes: String,
  // Payment status from agent to platform
  agentPaymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'partial', 'refunded'],
    default: 'pending',
  },
  agentPaymentDate: Date,
  agentPaymentMethod: {
    type: String,
    enum: ['cash', 'transfer', 'cash_pay', 'wallet', 'point_of_sale', 'other'],
  },
  agentPaymentTransactionId: String,
  agentPaymentProof: String, // رابط إيصال التحويل
  agentPaymentNotes: String,
  // Commission
  commission: {
    type: Number,
    default: 0,
  },
  commissionStatus: {
    type: String,
    enum: ['pending', 'calculated', 'paid', 'cancelled'],
    default: 'pending',
  },
  commissionPaidAt: Date,
  // Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'confirmed', 'processing', 'purchased', 'shipped', 'in_transit', 'arrived', 'arrived_at_point', 'ready_for_pickup', 'delivered', 'cancelled', 'agent_pending', 'agent_confirmed', 'agent_processing'],
    default: 'draft',
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: String,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  // Delivery
  delivery: {
    type: {
      type: String,
      enum: ['home', 'pickup_point'],
      default: 'home',
    },
    address: {
      type: mongoose.Schema.Types.Mixed,
    },
    pickupPoint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PointOfSale',
    },
    estimatedDelivery: Date,
    deliveryNotes: String,
  },
  notes: String,
}, {
  timestamps: true,
});

// Generate order number
agentOrderSchema.statics.generateOrderNumber = async function() {
  let orderNumber;
  let exists = true;
  
  while (exists) {
    const prefix = 'AO'; // Agent Order
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    orderNumber = `${prefix}${timestamp}${random}`;
    exists = await this.findOne({ orderNumber });
  }
  
  return orderNumber;
};

// Calculate commission
agentOrderSchema.methods.calculateCommission = async function() {
  const Agent = mongoose.model('Agent');
  const agent = await Agent.findById(this.agent);
  
  if (!agent) {
    throw new Error('الوكيل غير موجود');
  }
  
  const totalAmount = this.pricing?.totalCost || 0;
  const commissionRate = agent.commissionRate || 0;
  this.commission = (totalAmount * commissionRate) / 100;
  
  return this.save();
};

export default mongoose.model('AgentOrder', agentOrderSchema);

