import { useEffect, useState } from 'react';
import { agentAPI, userAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  FiUsers,
  FiLoader,
  FiSearch,
  FiEdit,
  FiPower,
  FiPlus,
  FiEye,
  FiDollarSign,
  FiPackage,
  FiTrendingUp,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTrash2,
} from 'react-icons/fi';

export default function AdminAgents() {
  const { success: showSuccess, error: showError } = useToast();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentStats, setAgentStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  
  // Create agent form
  const [formData, setFormData] = useState({
    userId: '',
    commissionRate: 10,
    notes: '',
  });
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadAgents(pagination.page);
  }, [pagination.page, searchTerm, statusFilter]);

  const loadAgents = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      };

      const res = await agentAPI.getAll(params);
      setAgents(res.data.agents || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to load agents', error);
      showError('فشل في تحميل الوكلاء');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await userAPI.getAll();
      // Filter users who are not already agents
      const allUsers = res.data.users || [];
      const existingAgentUserIds = agents.map(a => a.user?._id?.toString());
      const availableUsers = allUsers.filter(
        u => u.role !== 'agent' && !existingAgentUserIds.includes(u._id?.toString())
      );
      setUsers(availableUsers);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateAgent = async (e) => {
    e.preventDefault();
    
    if (!formData.userId) {
      showError('يجب اختيار مستخدم');
      return;
    }

    setCreating(true);
    try {
      await agentAPI.create(formData);
      showSuccess('✅ تم إنشاء الوكيل بنجاح');
      setShowCreateModal(false);
      setFormData({ userId: '', commissionRate: 10, notes: '' });
      loadAgents(pagination.page);
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في إنشاء الوكيل');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (agentId) => {
    try {
      await agentAPI.toggleStatus(agentId);
      showSuccess('✅ تم تحديث الحالة بنجاح');
      loadAgents(pagination.page);
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في تحديث الحالة');
    }
  };

  const handleDeleteAgent = async (agentId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الوكيل؟ سيتم حذف الوكيل تماماً من النظام.')) {
      return;
    }

    try {
      await agentAPI.delete(agentId);
      showSuccess('✅ تم حذف الوكيل بنجاح');
      loadAgents(pagination.page);
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في حذف الوكيل');
    }
  };

  const loadAgentStats = async (agentId) => {
    setLoadingStats(true);
    try {
      const res = await agentAPI.getStats(agentId);
      setAgentStats(res.data.stats);
    } catch (error) {
      console.error('Failed to load stats', error);
      showError('فشل في تحميل الإحصائيات');
    } finally {
      setLoadingStats(false);
    }
  };

  const handleViewStats = (agent) => {
    setSelectedAgent(agent);
    setShowStatsModal(true);
    loadAgentStats(agent._id);
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      active: 'نشط',
      inactive: 'غير نشط',
      suspended: 'موقوف',
    };
    return texts[status] || status;
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold mb-2 text-gradient">إدارة الوكلاء</h1>
          <p className="text-gray-600">إدارة الوكلاء ومراقبة أدائهم</p>
        </div>
        <button
          onClick={() => {
            loadUsers();
            setShowCreateModal(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus />
          إضافة وكيل جديد
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="بحث عن وكيل..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="input-field w-full pr-10"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="input-field"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="suspended">موقوف</option>
          </select>
        </div>
      </div>

      {/* Agents List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
        </div>
      ) : agents.length === 0 ? (
        <div className="card text-center py-12">
          <FiUsers className="text-4xl text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-600">لا توجد وكلاء</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="card hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 font-semibold">رقم الوكيل</th>
                  <th className="text-right py-3 px-4 font-semibold">الاسم</th>
                  <th className="text-right py-3 px-4 font-semibold">نسبة العمولة</th>
                  <th className="text-right py-3 px-4 font-semibold">العملاء</th>
                  <th className="text-right py-3 px-4 font-semibold">الطلبات</th>
                  <th className="text-right py-3 px-4 font-semibold">المبيعات</th>
                  <th className="text-right py-3 px-4 font-semibold">المستحق</th>
                  <th className="text-right py-3 px-4 font-semibold">الحالة</th>
                  <th className="text-right py-3 px-4 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr key={agent._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <span className="font-mono text-primary-600">{agent.agentNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold">{agent.user?.name}</p>
                        <p className="text-xs text-gray-500">{agent.user?.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">{agent.commissionRate}%</span>
                    </td>
                    <td className="py-3 px-4">{agent.stats?.totalCustomers || 0}</td>
                    <td className="py-3 px-4">{agent.stats?.totalOrders || 0}</td>
                    <td className="py-3 px-4">
                      {formatCurrency(agent.stats?.totalSales || 0, 'SAR')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-yellow-600 font-semibold">
                        {formatCurrency(agent.pendingAmount || 0, 'SAR')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(agent.status)}`}>
                        {getStatusText(agent.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewStats(agent)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                          title="عرض الإحصائيات"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(agent._id)}
                          className={`p-2 rounded ${
                            agent.status === 'active'
                              ? 'text-gray-600 hover:bg-gray-100'
                              : 'text-green-600 hover:bg-green-50'
                          }`}
                          title={agent.status === 'active' ? 'تعطيل' : 'تفعيل'}
                        >
                          <FiPower />
                        </button>
                        <button
                          onClick={() => handleDeleteAgent(agent._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="حذف الوكيل"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {agents.map((agent) => (
              <div key={agent._id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-mono font-bold text-primary-600 mb-1 text-sm">
                      {agent.agentNumber}
                    </p>
                    <p className="font-semibold">{agent.user?.name}</p>
                    <p className="text-xs text-gray-500">{agent.user?.email}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(agent.status)}`}>
                    {getStatusText(agent.status)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">نسبة العمولة</p>
                    <p className="font-semibold">{agent.commissionRate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">العملاء</p>
                    <p className="font-semibold">{agent.stats?.totalCustomers || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">الطلبات</p>
                    <p className="font-semibold">{agent.stats?.totalOrders || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">المبيعات</p>
                    <p className="font-semibold">
                      {formatCurrency(agent.stats?.totalSales || 0, 'SAR')}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">المستحق للدفع</p>
                  <p className="text-lg font-bold text-yellow-600">
                    {formatCurrency(agent.pendingAmount || 0, 'SAR')}
                  </p>
                </div>

                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleViewStats(agent)}
                    className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-1"
                  >
                    <FiEye />
                    الإحصائيات
                  </button>
                  <button
                    onClick={() => handleToggleStatus(agent._id)}
                    className={`flex-1 py-2 text-xs flex items-center justify-center gap-1 rounded ${
                      agent.status === 'active'
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    <FiPower />
                    {agent.status === 'active' ? 'تعطيل' : 'تفعيل'}
                  </button>
                  <button
                    onClick={() => handleDeleteAgent(agent._id)}
                    className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 py-2 text-xs rounded flex items-center justify-center gap-1"
                  >
                    <FiTrash2 />
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                السابق
              </button>
              <span className="text-sm text-gray-600">
                صفحة {pagination.page} من {pagination.pages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.pages}
                className="btn-secondary disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Agent Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 md:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">إضافة وكيل جديد</h2>
            <form onSubmit={handleCreateAgent} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المستخدم *
                </label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                  className="input-field w-full"
                  disabled={loadingUsers}
                >
                  <option value="">اختر مستخدماً</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} - {user.email}
                    </option>
                  ))}
                </select>
                {loadingUsers && (
                  <p className="text-xs text-gray-500 mt-1">جاري تحميل المستخدمين...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نسبة العمولة (%) *
                </label>
                <input
                  type="number"
                  value={formData.commissionRate}
                  onChange={(e) =>
                    setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })
                  }
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="input-field w-full"
                  placeholder="ملاحظات عن الوكيل..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {creating ? 'جاري الإنشاء...' : 'إنشاء'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({ userId: '', commissionRate: 10, notes: '' });
                  }}
                  className="flex-1 btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && selectedAgent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                إحصائيات {selectedAgent.agentNumber}
              </h2>
              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setSelectedAgent(null);
                  setAgentStats(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiXCircle className="text-xl" />
              </button>
            </div>

            {loadingStats ? (
              <div className="flex items-center justify-center py-12">
                <FiLoader className="animate-spin text-xl text-primary-600" />
              </div>
            ) : agentStats ? (
              <div className="space-y-6">
                {/* General Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-xs text-blue-600 mb-1">العملاء</p>
                    <p className="text-xl font-bold text-blue-900">
                      {agentStats.totalCustomers || 0}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-xs text-green-700 mb-1">الطلبات</p>
                    <p className="text-xl font-bold text-green-900">
                      {agentStats.totalOrders || 0}
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-xs text-purple-400 mb-1">المبيعات</p>
                    <p className="text-xl font-bold text-purple-900">
                      {formatCurrency(agentStats.totalSales || 0, 'SAR')}
                    </p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <p className="text-xs text-yellow-700 mb-1">المستحق</p>
                    <p className="text-xl font-bold text-yellow-900">
                      {formatCurrency(agentStats.payments?.totalPending || 0, 'SAR')}
                    </p>
                  </div>
                </div>

                {/* Commissions */}
                <div className="border-t pt-4">
                  <h3 className="font-bold mb-3">العمولات</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">الإجمالي</p>
                      <p className="font-semibold">
                        {formatCurrency(agentStats.commissions?.total || 0, 'SAR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">معلقة</p>
                      <p className="font-semibold text-yellow-600">
                        {formatCurrency(agentStats.commissions?.pending || 0, 'SAR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">مدفوعة</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(agentStats.commissions?.paid || 0, 'SAR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">عدد العمولات</p>
                      <p className="font-semibold">{agentStats.commissions?.count || 0}</p>
                    </div>
                  </div>
                </div>

                {/* Payments */}
                <div className="border-t pt-4">
                  <h3 className="font-bold mb-3">المدفوعات</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">المستحق</p>
                      <p className="font-semibold text-yellow-600">
                        {formatCurrency(agentStats.payments?.totalPending || 0, 'SAR')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">المدفوع</p>
                      <p className="font-semibold text-green-600">
                        {formatCurrency(agentStats.payments?.totalPaid || 0, 'SAR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                لا توجد إحصائيات متاحة
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

