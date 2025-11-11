import mongoose from 'mongoose';

const { Schema } = mongoose;

const smartCartOrderSchema = new Schema({
  orderNumber: {
    type: String,
    unique: true,
    required: true,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
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
    productId: String,
    sku: String,
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    status: {
      type: String,
      default: 'pending',
    },
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
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'purchased', 'shipped', 'in_transit', 'arrived', 'arrived_at_point', 'ready_for_pickup', 'delivered', 'cancelled', 'agent_pending', 'agent_confirmed', 'agent_processing'],
    default: 'pending',
  },
  statusHistory: [{
    status: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
    note: String,
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  payment: {
    method: String,
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paidAmount: Number,
    paymentDate: Date,
    transactionId: String,
  },
  delivery: {
    type: {
      type: String,
      enum: ['home', 'pickup_point'],
      default: 'home',
    },
    address: {
      street: String,
      city: String,
      governorate: String,
      postalCode: String,
      country: String,
    },
    pickupPoint: {
      type: Schema.Types.ObjectId,
      ref: 'PointOfSale',
    },
    estimatedDelivery: Date,
    trackingNumber: String,
    deliveryNotes: String,
    readyForPickup: {
      type: Boolean,
      default: false,
    },
    pickedUpAt: Date,
    pickedUpBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  attachments: [{
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  }],
  notes: [{
    text: String,
    isPublic: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }],
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal',
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  metadata: {
    source: String, // 'agent', 'website', etc.
    userAgent: String,
    ipAddress: String,
    referrer: String,
    cartSessionId: String,
    cartCreatedAt: Date,
    cartUpdatedAt: Date,
    // Agent order metadata
    agentId: {
      type: Schema.Types.ObjectId,
      ref: 'Agent',
    },
    agentOrderId: {
      type: Schema.Types.ObjectId,
      ref: 'AgentOrder',
    },
    customerName: String,
    customerPhone: String,
  },
}, {
  timestamps: true,
});

smartCartOrderSchema.index({ orderNumber: 1 });
smartCartOrderSchema.index({ user: 1 });
smartCartOrderSchema.index({ status: 1 });

export default mongoose.model('SmartCartOrder', smartCartOrderSchema);
