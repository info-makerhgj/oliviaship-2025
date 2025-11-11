import { useEffect, useState } from 'react';
import { agentAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  FiUsers,
  FiPackage,
  FiDollarSign,
  FiTrendingUp,
  FiLoader,
  FiEye,
  FiPlus,
  FiShoppingCart,
  FiClock,
  FiCheckCircle,
} from 'react-icons/fi';

export default function AgentDashboard() {
  const { error: showError } = useToast();
  const [agent, setAgent] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const agentRes = await agentAPI.getMyAgent();
      
      if (agentRes?.data?.agent) {
        const agent = agentRes.data.agent;
        setAgent(agent);
        const agentId = agent._id;
        
        // Load stats and orders in parallel
        const [statsResponse, ordersResponse] = await Promise.all([
          agentAPI.getStats(agentId).catch(() => ({ data: { stats: {} } })),
          agentAPI.getOrders(agentId, { limit: 5 }).catch(() => ({ data: { orders: [] } })),
        ]);

        if (statsResponse?.data?.stats) {
          setStats(statsResponse.data.stats);
        }

        if (ordersResponse?.data?.orders) {
          setRecentOrders(ordersResponse.data.orders);
        }
      }
    } catch (error) {
      console.error('Failed to load data', error);
      showError(error.response?.data?.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="card text-center py-12">
        <FiUsers className="text-4xl text-gray-300 mx-auto mb-4" />
        <p className="text-lg text-gray-600 mb-4">أنت لست وكيلاً</p>
        <p className="text-sm text-gray-500">يرجى التواصل مع الإدارة لتفعيل حسابك كـ وكيل</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'نظرة عامة', icon: FiEye },
    { id: 'customers', label: 'العملاء', icon: FiUsers },
    { id: 'orders', label: 'الطلبات', icon: FiPackage },
    { id: 'commissions', label: 'العمولات', icon: FiDollarSign },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-2 text-gradient">لوحة الوكيل</h1>
        <p className="text-gray-600">
          مرحباً {agent.user?.name} - رقم الوكيل: {agent.agentNumber}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-primary-700 font-medium mb-1">إجمالي العملاء</p>
              <p className="text-xl font-bold text-primary-900">{stats?.totalCustomers || 0}</p>
            </div>
            <div className="bg-primary-200 p-3 rounded-xl">
              <FiUsers className="text-lg md:text-xl text-primary-700" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium mb-1">إجمالي الطلبات</p>
              <p className="text-xl font-bold text-blue-900">{stats?.totalOrders || 0}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <FiPackage className="text-lg md:text-xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 font-medium mb-1">إجمالي المبيعات</p>
              <p className="text-xl font-bold text-green-900">
                {formatCurrency(stats?.totalSales || 0, 'SAR')}
              </p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <FiDollarSign className="text-lg md:text-xl text-green-700" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-400 font-medium mb-1">العمولات</p>
              <p className="text-xl font-bold text-purple-900">
                {formatCurrency(stats?.commissions?.total || 0, 'SAR')}
              </p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <FiTrendingUp className="text-lg md:text-xl text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Pending Payment Alert */}
      {stats?.payments?.totalPending > 0 && (
        <div className="card bg-yellow-50 border-yellow-200 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-yellow-800 mb-1">مبلغ مستحق للدفع</p>
              <p className="text-lg font-bold text-yellow-900">
                {formatCurrency(stats.payments.totalPending, 'SAR')}
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                يرجى دفع المبلغ المستحق للمنصة
              </p>
            </div>
            <FiClock className="text-2xl text-yellow-600" />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="card">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4">آخر الطلبات</h2>
              {recentOrders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد طلبات بعد
                </div>
              ) : (
                <div className="space-y-3">
                  {recentOrders.map((order) => (
                    <div key={order._id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">طلب #{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">
                            {order.customer?.name || 'عميل'}
                          </p>
                          <p className="text-sm text-gray-500 mt-1">
                            {formatCurrency(order.pricing?.totalCost || 0, 'SAR')}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 rounded text-xs ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="text-center py-8">
            <p className="text-gray-600">سيتم إضافة إدارة العملاء هنا</p>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="text-center py-8">
            <p className="text-gray-600">سيتم إضافة إدارة الطلبات هنا</p>
          </div>
        )}

        {activeTab === 'commissions' && (
          <div className="text-center py-8">
            <p className="text-gray-600">سيتم إضافة العمولات هنا</p>
          </div>
        )}
      </div>
    </div>
  );
}

