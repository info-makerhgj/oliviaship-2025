import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderSchema = new Schema({
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
  product: {
    url: {
      type: String,
      required: true,
    },
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
  },
  pricing: {
    productPrice: Number,
    shippingCost: Number,
    commission: Number,
    customsFees: Number,
    processingFee: Number,
    handlingFee: Number,
    insuranceFee: Number,
    packagingFee: Number,
    totalCost: Number,
    totalInYER: Number,
  },
  totalAmount: Number, // للتوافق مع الطلبات القديمة
  paymentStatus: String, // للتوافق مع الطلبات القديمة
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
    type: {
      type: String,
    },
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
}, {
  timestamps: true,
});

// Indexes
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

export default mongoose.model('Order', orderSchema);
