import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true,
  },
  messages: [{
    sender: {
      type: String,
      enum: ['user', 'admin'],
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
  }],
  status: {
    type: String,
    enum: ['active', 'closed', 'resolved'],
    default: 'active',
  },
  lastMessageAt: {
    type: Date,
    default: Date.now,
  },
  unreadCount: {
    user: {
      type: Number,
      default: 0,
    },
    admin: {
      type: Number,
      default: 0,
    },
  },
}, {
  timestamps: true,
});

// Indexes
chatSchema.index({ user: 1, status: 1 });
chatSchema.index({ admin: 1, status: 1 });
chatSchema.index({ lastMessageAt: -1 });

export default mongoose.model('Chat', chatSchema);






