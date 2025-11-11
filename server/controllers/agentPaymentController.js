import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';
import Agent from '../models/Agent.js';
import AgentOrder from '../models/AgentOrder.js';
import AgentCommission from '../models/AgentCommission.js';
import User from '../models/User.js';

/**
 * Get all agent payments (Admin only)
 * الحصول على جميع مدفوعات الوكلاء
 */
export const getAllAgentPayments = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    agentId,
    status,
    paymentMethod,
    startDate,
    endDate,
    search,
  } = req.query;

  const query = {};

  if (agentId) {
    query.agent = agentId;
  }

  if (status) {
    query.agentPaymentStatus = status;
  }

  if (paymentMethod) {
    query.agentPaymentMethod = paymentMethod;
  }

  if (startDate || endDate) {
    query.agentPaymentDate = {};
    if (startDate) {
      query.agentPaymentDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.agentPaymentDate.$lte = new Date(endDate);
    }
  }

  if (search) {
    // Search by order number, agent number, or agent/customer name
    const agents = await Agent.find({
      $or: [
        { agentNumber: { $regex: search, $options: 'i' } },
      ],
    }).populate('user', 'name email');
    
    const agentIds = agents.map(a => a._id);
    
    const users = await User.find({
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    
    const userIds = users.map(u => u._id);
    
    const agentUsers = agents.filter(a => a.user).map(a => a.user._id);
    
    query.$or = [
      { orderNumber: { $regex: search, $options: 'i' } },
      { agentPaymentTransactionId: { $regex: search, $options: 'i' } },
      ...(agentIds.length > 0 ? [{ agent: { $in: agentIds } }] : []),
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const orders = await AgentOrder.find(query)
    .populate('agent', 'agentNumber commissionRate')
    .populate({
      path: 'agent',
      populate: {
        path: 'user',
        select: 'name email phone',
      },
    })
    .populate('customer', 'name phone')
    .sort({ agentPaymentDate: -1, createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await AgentOrder.countDocuments(query);

  // Calculate statistics
  const statsQuery = { agentPaymentStatus: 'paid' };
  if (agentId) {
    statsQuery.agent = agentId;
  }

  const [
    totalPayments,
    paidPayments,
    pendingPayments,
    totalPaidAmount,
    paidAmountByMethod,
  ] = await Promise.all([
    AgentOrder.countDocuments(query),
    AgentOrder.countDocuments({ ...query, agentPaymentStatus: 'paid' }),
    AgentOrder.countDocuments({ ...query, agentPaymentStatus: 'pending' }),
    AgentOrder.aggregate([
      { $match: { ...query, agentPaymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          total: {
            $sum: { $subtract: ['$pricing.totalCost', '$commission'] },
          },
        },
      },
    ]),
    AgentOrder.aggregate([
      { $match: { ...query, agentPaymentStatus: 'paid' } },
      {
        $group: {
          _id: '$agentPaymentMethod',
          total: {
            $sum: { $subtract: ['$pricing.totalCost', '$commission'] },
          },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  res.json({
    success: true,
    payments: orders,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit)),
    },
    stats: {
      total: totalPayments,
      paid: paidPayments,
      pending: pendingPayments,
      totalPaidAmount: totalPaidAmount[0]?.total || 0,
      paidAmountByMethod: paidAmountByMethod.reduce((acc, item) => {
        acc[item._id || 'unknown'] = {
          total: item.total,
          count: item.count,
        };
        return acc;
      }, {}),
    },
  });
});

/**
 * Get agent payment statistics
 * إحصائيات مدفوعات الوكلاء
 */
export const getAgentPaymentStats = catchAsync(async (req, res, next) => {
  const { agentId, startDate, endDate } = req.query;

  const query = {};

  if (agentId) {
    query.agent = agentId;
  }

  if (startDate || endDate) {
    query.agentPaymentDate = {};
    if (startDate) {
      query.agentPaymentDate.$gte = new Date(startDate);
    }
    if (endDate) {
      query.agentPaymentDate.$lte = new Date(endDate);
    }
  }

  const [
    totalPayments,
    paidPayments,
    pendingPayments,
    totalPaidAmount,
    totalPendingAmount,
    paymentsByMethod,
    paymentsByAgent,
  ] = await Promise.all([
    AgentOrder.countDocuments(query),
    AgentOrder.countDocuments({ ...query, agentPaymentStatus: 'paid' }),
    AgentOrder.countDocuments({ ...query, agentPaymentStatus: 'pending' }),
    AgentOrder.aggregate([
      { $match: { ...query, agentPaymentStatus: 'paid' } },
      {
        $group: {
          _id: null,
          total: {
            $sum: { $subtract: ['$pricing.totalCost', '$commission'] },
          },
        },
      },
    ]),
    AgentOrder.aggregate([
      { $match: { ...query, agentPaymentStatus: 'pending' } },
      {
        $group: {
          _id: null,
          total: {
            $sum: { $subtract: ['$pricing.totalCost', '$commission'] },
          },
        },
      },
    ]),
    AgentOrder.aggregate([
      { $match: { ...query, agentPaymentStatus: 'paid' } },
      {
        $group: {
          _id: '$agentPaymentMethod',
          total: {
            $sum: { $subtract: ['$pricing.totalCost', '$commission'] },
          },
          count: { $sum: 1 },
        },
      },
    ]),
    AgentOrder.aggregate([
      { $match: { ...query, agentPaymentStatus: 'paid' } },
      {
        $group: {
          _id: '$agent',
          total: {
            $sum: { $subtract: ['$pricing.totalCost', '$commission'] },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
      { $limit: 10 },
    ]),
  ]);

  // Populate agent info for paymentsByAgent
  const agentIds = paymentsByAgent.map(p => p._id);
  const agents = await Agent.find({ _id: { $in: agentIds } })
    .populate('user', 'name email');

  const paymentsByAgentWithInfo = paymentsByAgent.map((p) => {
    const agent = agents.find(a => a._id.toString() === p._id.toString());
    return {
      ...p,
      agent: agent ? {
        id: agent._id,
        agentNumber: agent.agentNumber,
        name: agent.user?.name,
        email: agent.user?.email,
      } : null,
    };
  });

  res.json({
    success: true,
    stats: {
      total: totalPayments,
      paid: paidPayments,
      pending: pendingPayments,
      totalPaidAmount: totalPaidAmount[0]?.total || 0,
      totalPendingAmount: totalPendingAmount[0]?.total || 0,
      paymentsByMethod: paymentsByMethod.reduce((acc, item) => {
        acc[item._id || 'unknown'] = {
          total: item.total,
          count: item.count,
        };
        return acc;
      }, {}),
      paymentsByAgent: paymentsByAgentWithInfo,
    },
  });
});

