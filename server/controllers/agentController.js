import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import Agent from '../models/Agent.js';
import AgentCustomer from '../models/AgentCustomer.js';
import AgentOrder from '../models/AgentOrder.js';
import AgentCommission from '../models/AgentCommission.js';
import SmartCartOrder from '../models/SmartCartOrder.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { calculateCost } from '../utils/calculateCost.js';
import Settings from '../models/Settings.js';

/**
 * Create new agent (Admin only)
 * إنشاء وكيل جديد
 */
export const createAgent = catchAsync(async (req, res, next) => {
  const { userId, commissionRate, notes } = req.body;

  if (!userId) {
    return next(new AppError('يجب تحديد المستخدم', 400));
  }

  const user = await User.findById(userId);
  if (!user) {
    return next(new AppError('المستخدم غير موجود', 404));
  }

  // Check if user is already an agent
  const existingAgent = await Agent.findOne({ user: userId });
  if (existingAgent) {
    return next(new AppError('هذا المستخدم وكيل بالفعل', 400));
  }

  // Update user role to agent
  user.role = 'agent';
  await user.save();

  const agentNumber = await Agent.generateAgentNumber();
  const agent = await Agent.create({
    user: userId,
    agentNumber,
    commissionRate: commissionRate || 10,
    createdBy: req.user.id,
    notes,
  });

  // Create wallet automatically for agent
  try {
    const Wallet = (await import('../models/Wallet.js')).default;
    let wallet = await Wallet.findOne({ user: userId });
    
    if (!wallet) {
      const walletNumber = await Wallet.generateWalletNumber();
      wallet = await Wallet.create({
        user: userId,
        walletNumber,
        balance: 0,
        currency: 'SAR',
      });
    }
  } catch (error) {
    console.error('Failed to create wallet for agent:', error);
    // Continue even if wallet creation fails
  }

  await agent.populate('user', 'name email phone');

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الوكيل بنجاح',
    agent,
  });
});

/**
 * Get all agents (Admin)
 * الحصول على جميع الوكلاء
 */
export const getAllAgents = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    search,
    status,
  } = req.query;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');

    query.$or = [
      { agentNumber: { $regex: search, $options: 'i' } },
      ...(users.length > 0 ? [{ user: { $in: users.map(u => u._id) } }] : []),
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const agents = await Agent.find(query)
    .populate('user', 'name email phone')
    .populate('createdBy', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Agent.countDocuments(query);

  res.json({
    success: true,
    agents,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * Get agent by ID
 * الحصول على وكيل محدد
 */
export const getAgent = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const agent = await Agent.findById(id)
    .populate('user', 'name email phone')
    .populate('createdBy', 'name');

  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  // Load stats
  await agent.updateStats();

  res.json({
    success: true,
    agent,
  });
});

/**
 * Get my agent profile
 * الحصول على ملف الوكيل الخاص
 */
export const getMyAgent = catchAsync(async (req, res, next) => {
  const agent = await Agent.findOne({ user: req.user.id })
    .populate('user', 'name email phone');

  if (!agent) {
    return next(new AppError('أنت لست وكيلاً', 404));
  }

  // Check if agent is active
  if (agent.status !== 'active') {
    return next(new AppError('حسابك كـ وكيل معطل', 403));
  }

  // Update stats
  await agent.updateStats();

  res.json({
    success: true,
    agent,
  });
});

/**
 * Update agent
 * تحديث بيانات الوكيل
 */
export const updateAgent = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { commissionRate, status, settings, notes } = req.body;

  const agent = await Agent.findById(id);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  // Only admin can update
  if (req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بهذه العملية', 403));
  }

  if (commissionRate !== undefined) {
    agent.commissionRate = commissionRate;
  }
  if (status !== undefined) {
    agent.status = status;
  }
  if (settings !== undefined) {
    agent.settings = { ...agent.settings, ...settings };
  }
  if (notes !== undefined) {
    agent.notes = notes;
  }

  await agent.save();

  await agent.populate('user', 'name email phone');

  res.json({
    success: true,
    message: 'تم تحديث بيانات الوكيل بنجاح',
    agent,
  });
});

/**
 * Toggle agent status
 * تفعيل/تعطيل الوكيل
 */
export const toggleAgentStatus = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const agent = await Agent.findById(id);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  agent.status = agent.status === 'active' ? 'inactive' : 'active';
  await agent.save();

  res.json({
    success: true,
    message: `تم ${agent.status === 'active' ? 'تفعيل' : 'تعطيل'} الوكيل بنجاح`,
    agent,
  });
});

/**
 * Get agent stats
 * الحصول على إحصائيات الوكيل
 */
export const getAgentStats = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const agent = await Agent.findById(id);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  await agent.updateStats();

  // Get commissions stats
  const commissions = await AgentCommission.find({ agent: id });
  const commissionsStats = {
    total: commissions.reduce((sum, c) => sum + c.amount, 0),
    pending: commissions.filter(c => c.status === 'pending' || c.status === 'calculated').reduce((sum, c) => sum + c.amount, 0),
    paid: commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
    count: commissions.length,
  };

  // Get payment stats
  const orders = await AgentOrder.find({ agent: id });
  const paymentStats = {
    totalPending: orders
      .filter(o => o.customerPaymentStatus === 'paid' && o.agentPaymentStatus === 'pending')
      .reduce((sum, o) => sum + (o.pricing?.totalCost || 0), 0),
    totalPaid: orders
      .filter(o => o.agentPaymentStatus === 'paid')
      .reduce((sum, o) => sum + (o.pricing?.totalCost || 0), 0),
  };

  res.json({
    success: true,
    stats: {
      ...agent.stats,
      commissions: commissionsStats,
      payments: paymentStats,
      agentInfo: {
        agentNumber: agent.agentNumber,
        commissionRate: agent.commissionRate,
        status: agent.status,
      },
    },
  });
});

/**
 * Delete agent
 * حذف الوكيل
 */
export const deleteAgent = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const agent = await Agent.findById(id);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  // Check if agent has any orders or customers
  const ordersCount = await AgentOrder.countDocuments({ agent: id });
  const customersCount = await AgentCustomer.countDocuments({ agent: id });
  const commissionsCount = await AgentCommission.countDocuments({ agent: id });

  if (ordersCount > 0 || customersCount > 0 || commissionsCount > 0) {
    return next(new AppError(
      `لا يمكن حذف الوكيل لأنه لديه ${ordersCount} طلب، ${customersCount} عميل، و ${commissionsCount} عمولة. يمكنك تعطيله بدلاً من ذلك.`,
      400
    ));
  }

  // Reset user role to customer
  const user = await User.findById(agent.user);
  if (user && user.role === 'agent') {
    user.role = 'customer';
    await user.save();
  }

  // Delete agent
  await Agent.findByIdAndDelete(id);

  res.json({
    success: true,
    message: 'تم حذف الوكيل بنجاح',
  });
});

export default {
  createAgent,
  getAllAgents,
  getAgent,
  getMyAgent,
  updateAgent,
  toggleAgentStatus,
  getAgentStats,
  deleteAgent,
};

