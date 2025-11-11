import Chat from '../models/Chat.js';
import { catchAsync } from '../utils/catchAsync.js';

/**
 * Get or create chat for user
 */
export const getOrCreateChat = catchAsync(async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'غير مصرح',
      });
    }

    const userId = req.user.id;

    let chat = await Chat.findOne({ user: userId, status: 'active' })
      .populate('user', 'name email')
      .populate('admin', 'name email')
      .sort({ lastMessageAt: -1 });

    if (!chat) {
      chat = await Chat.create({
        user: userId,
        messages: [],
        status: 'active',
      });
      
      chat = await Chat.findById(chat._id)
        .populate('user', 'name email')
        .populate('admin', 'name email');
    }

    res.json({
      success: true,
      chat,
    });
  } catch (error) {
    console.error('Error in getOrCreateChat:', error);
    return next(error);
  }
});

/**
 * Get all chats (Admin only)
 */
export const getAllChats = catchAsync(async (req, res, next) => {
  const { status, search } = req.query;
  
  const query = {};
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  if (search) {
    query.$or = [
      { 'user.name': { $regex: search, $options: 'i' } },
      { 'user.email': { $regex: search, $options: 'i' } },
    ];
  }

  const chats = await Chat.find(query)
    .populate('user', 'name email')
    .populate('admin', 'name email')
    .sort({ lastMessageAt: -1 });

  res.json({
    success: true,
    chats,
  });
});

/**
 * Get single chat
 */
export const getChat = catchAsync(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id)
    .populate('user', 'name email')
    .populate('admin', 'name email')
    .populate('messages.senderId', 'name email');

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'المحادثة غير موجودة',
    });
  }

  // Check permissions
  if (req.user.role !== 'admin' && chat.user._id.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح لك بالوصول إلى هذه المحادثة',
    });
  }

  // Mark messages as read
  if (req.user.role === 'admin') {
    chat.messages.forEach(msg => {
      if (msg.sender === 'user' && !msg.read) {
        msg.read = true;
        msg.readAt = new Date();
      }
    });
    chat.unreadCount.admin = 0;
  } else {
    chat.messages.forEach(msg => {
      if (msg.sender === 'admin' && !msg.read) {
        msg.read = true;
        msg.readAt = new Date();
      }
    });
    chat.unreadCount.user = 0;
  }

  await chat.save();

  res.json({
    success: true,
    chat,
  });
});

/**
 * Send message
 */
export const sendMessage = catchAsync(async (req, res, next) => {
  const { message, chatId } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      message: 'الرسالة مطلوبة',
    });
  }

  let chat;
  
  if (chatId) {
    chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'المحادثة غير موجودة',
      });
    }
  } else {
    // Create new chat or get existing
    chat = await Chat.findOne({ user: req.user.id, status: 'active' });
    if (!chat) {
      chat = await Chat.create({
        user: req.user.id,
        messages: [],
        status: 'active',
      });
    }
  }

  // Check permissions
  if (req.user.role !== 'admin' && chat.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح لك',
    });
  }

  const sender = req.user.role === 'admin' ? 'admin' : 'user';
  
  // Assign admin if first admin message
  if (sender === 'admin' && !chat.admin) {
    chat.admin = req.user.id;
  }

  // Add message
  chat.messages.push({
    sender,
    senderId: req.user.id,
    message: message.trim(),
    read: false,
  });

  // Update unread count
  if (sender === 'admin') {
    chat.unreadCount.user += 1;
  } else {
    chat.unreadCount.admin += 1;
  }

  chat.lastMessageAt = new Date();
  await chat.save();

  // Populate before sending
  chat = await Chat.findById(chat._id)
    .populate('user', 'name email')
    .populate('admin', 'name email')
    .populate('messages.senderId', 'name email');

  res.json({
    success: true,
    chat,
    newMessage: chat.messages[chat.messages.length - 1],
  });
});

/**
 * Mark messages as read
 */
export const markAsRead = catchAsync(async (req, res, next) => {
  const chat = await Chat.findById(req.params.id);

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'المحادثة غير موجودة',
    });
  }

  // Check permissions
  if (req.user.role !== 'admin' && chat.user.toString() !== req.user.id) {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح لك',
    });
  }

  if (req.user.role === 'admin') {
    chat.messages.forEach(msg => {
      if (msg.sender === 'user' && !msg.read) {
        msg.read = true;
        msg.readAt = new Date();
      }
    });
    chat.unreadCount.admin = 0;
  } else {
    chat.messages.forEach(msg => {
      if (msg.sender === 'admin' && !msg.read) {
        msg.read = true;
        msg.readAt = new Date();
      }
    });
    chat.unreadCount.user = 0;
  }

  await chat.save();

  res.json({
    success: true,
    chat,
  });
});

/**
 * Update chat status
 */
export const updateStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  
  const chat = await Chat.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  )
  .populate('user', 'name email')
  .populate('admin', 'name email');

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'المحادثة غير موجودة',
    });
  }

  res.json({
    success: true,
    chat,
  });
});

