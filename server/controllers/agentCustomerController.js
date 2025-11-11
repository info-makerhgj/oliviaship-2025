import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import Agent from '../models/Agent.js';
import AgentCustomer from '../models/AgentCustomer.js';
import AgentOrder from '../models/AgentOrder.js';

/**
 * Create customer for agent
 * إضافة عميل للوكيل
 */
export const createCustomer = catchAsync(async (req, res, next) => {
  const { agentId } = req.params;
  const { name, phone, email, address, notes } = req.body;

  // Verify agent exists and user is authorized
  const agent = await Agent.findById(agentId);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  // Check if user is the agent or admin
  if (agent.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بإضافة عملاء لهذا الوكيل', 403));
  }

  // Check if customer with same phone already exists for this agent
  const existingCustomer = await AgentCustomer.findOne({
    agent: agentId,
    phone,
  });

  if (existingCustomer) {
    return next(new AppError('هذا العميل موجود بالفعل لهذا الوكيل', 400));
  }

  const customer = await AgentCustomer.create({
    agent: agentId,
    name,
    phone,
    email,
    address,
    notes,
  });

  // Update agent stats
  await agent.updateStats();

  res.status(201).json({
    success: true,
    message: 'تم إضافة العميل بنجاح',
    customer,
  });
});

/**
 * Get all customers for agent
 * الحصول على جميع عملاء الوكيل
 */
export const getCustomers = catchAsync(async (req, res, next) => {
  const { agentId } = req.params;
  const { page = 1, limit = 20, search, isActive } = req.query;

  // Verify agent
  const agent = await Agent.findById(agentId);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  // Check authorization
  if (agent.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بالوصول لهذا الوكيل', 403));
  }

  const query = { agent: agentId };

  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const customers = await AgentCustomer.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await AgentCustomer.countDocuments(query);

  res.json({
    success: true,
    customers,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * Get customer by ID
 * الحصول على عميل محدد
 */
export const getCustomer = catchAsync(async (req, res, next) => {
  const { agentId, customerId } = req.params;

  const agent = await Agent.findById(agentId);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  if (agent.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بالوصول', 403));
  }

  const customer = await AgentCustomer.findOne({
    _id: customerId,
    agent: agentId,
  });

  if (!customer) {
    return next(new AppError('العميل غير موجود', 404));
  }

  // Update customer stats
  await customer.updateStats();

  res.json({
    success: true,
    customer,
  });
});

/**
 * Update customer
 * تحديث بيانات العميل
 */
export const updateCustomer = catchAsync(async (req, res, next) => {
  const { agentId, customerId } = req.params;
  const { name, phone, email, address, isActive, notes } = req.body;

  const agent = await Agent.findById(agentId);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  if (agent.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بهذه العملية', 403));
  }

  const customer = await AgentCustomer.findOne({
    _id: customerId,
    agent: agentId,
  });

  if (!customer) {
    return next(new AppError('العميل غير موجود', 404));
  }

  if (name !== undefined) customer.name = name;
  if (phone !== undefined) customer.phone = phone;
  if (email !== undefined) customer.email = email;
  if (address !== undefined) customer.address = { ...customer.address, ...address };
  if (isActive !== undefined) customer.isActive = isActive;
  if (notes !== undefined) customer.notes = notes;

  await customer.save();

  res.json({
    success: true,
    message: 'تم تحديث بيانات العميل بنجاح',
    customer,
  });
});

/**
 * Delete customer
 * حذف عميل
 */
export const deleteCustomer = catchAsync(async (req, res, next) => {
  const { agentId, customerId } = req.params;

  const agent = await Agent.findById(agentId);
  if (!agent) {
    return next(new AppError('الوكيل غير موجود', 404));
  }

  if (agent.user.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new AppError('غير مصرح لك بهذه العملية', 403));
  }

  // Check if customer has orders
  const ordersCount = await AgentOrder.countDocuments({ customer: customerId });
  if (ordersCount > 0) {
    return next(new AppError('لا يمكن حذف العميل لأنه لديه طلبات. يمكنك تعطيله بدلاً من ذلك.', 400));
  }

  await AgentCustomer.findByIdAndDelete(customerId);

  // Update agent stats
  await agent.updateStats();

  res.json({
    success: true,
    message: 'تم حذف العميل بنجاح',
  });
});

export default {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer,
};

