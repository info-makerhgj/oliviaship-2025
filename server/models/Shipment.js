import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema({
  shipmentNumber: {
    type: String,
    unique: true,
    required: true,
  },
  orders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  }],
  smartCartOrders: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SmartCartOrder',
  }],
  origin: {
    country: String,
    city: String,
    address: String,
    contact: String,
  },
  destination: {
    country: {
      type: String,
      default: 'Yemen',
    },
    city: String,
    address: String,
    contact: String,
  },
  status: {
    type: String,
    enum: ['pending', 'preparing', 'in_transit', 'arrived', 'customs', 'delivered', 'cancelled'],
    default: 'pending',
  },
  carrier: String,
  trackingNumber: String,
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
  cost: {
    shipping: Number,
    customs: Number,
    handling: Number,
    total: Number,
  },
  documents: [{
    type: String,
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  notes: String,
  estimatedDelivery: Date,
  actualDelivery: Date,
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
}, {
  timestamps: true,
});

shipmentSchema.index({ shipmentNumber: 1 });
shipmentSchema.index({ status: 1 });

export default mongoose.model('Shipment', shipmentSchema);

