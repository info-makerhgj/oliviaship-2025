import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['order', 'payment', 'shipment', 'general', 'promotional'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
  },
  relatedSmartCartOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SmartCartOrder',
  },
  relatedPayment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Payment',
  },
  channels: {
    email: {
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: Date,
      error: String,
    },
    sms: {
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: Date,
      error: String,
    },
    whatsapp: {
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: Date,
      error: String,
    },
    push: {
      sent: {
        type: Boolean,
        default: false,
      },
      sentAt: Date,
      error: String,
    },
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal',
  },
  expiresAt: Date,
}, {
  timestamps: true,
});

notificationSchema.index({ user: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);

