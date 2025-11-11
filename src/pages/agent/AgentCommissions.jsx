import { useEffect, useState } from 'react';
import { agentAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  FiDollarSign,
  FiLoader,
  FiSearch,
  FiEye,
  FiFilter,
  FiTrendingUp,
  FiCheckCircle,
  FiClock,
  FiXCircle,
} from 'react-icons/fi';

export default function AgentCommissions() {
  const { error: showError } = useToast();
  const [agent, setAgent] = useState(null);
  const [commissions, setCommissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedCommission, setSelectedCommission] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [pagination.page, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const agentRes = await agentAPI.getMyAgent();
      if (agentRes?.data?.agent) {
        setAgent(agentRes.data.agent);
        const agentId = agentRes.data.agent._id;

        // Load stats
        const statsRes = await agentAPI.getStats(agentId);
        if (statsRes?.data?.stats) {
          setStats(statsRes.data.stats);
        }

        // Load commissions (we'll need to add this endpoint)
        // For now, we'll use stats.commissions data
        if (statsRes?.data?.stats?.commissions) {
          // This would normally come from a separate endpoint
          // setCommissions(statsRes.data.commissions || []);
        }
      }
    } catch (error) {
      console.error('Failed to load data', error);
      showError(error.response?.data?.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      calculated: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      pending: 'معلقة',
      calculated: 'محسوبة',
      paid: 'مدفوعة',
      cancelled: 'ملغاة',
    };
    return texts[status] || status;
  };

  if (loading && !agent) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="card text-center py-12">
        <FiDollarSign className="text-4xl text-gray-300 mx-auto mb-4" />
        <p className="text-lg text-gray-600 mb-4">أنت لست وكيلاً</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-gradient">العمولات</h1>
        <p className="text-sm sm:text-base text-gray-600">عرض ومتابعة عمولاتك</p>
      </div>

      {/* Stats Cards */}
      {stats?.commissions && (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 mb-4 md:mb-6">
          <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-primary-700 font-medium mb-1">إجمالي العمولات</p>
                <p className="text-base sm:text-lg font-bold text-primary-900 truncate">
                  {formatCurrency(stats.commissions.total || 0, 'SAR')}
                </p>
              </div>
              <div className="bg-primary-200 p-2 sm:p-2.5 rounded-lg flex-shrink-0 ml-2">
                <FiTrendingUp className="text-sm sm:text-base text-primary-700" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-yellow-700 font-medium mb-1">معلقة</p>
                <p className="text-base sm:text-lg font-bold text-yellow-900 truncate">
                  {formatCurrency(stats.commissions.pending || 0, 'SAR')}
                </p>
              </div>
              <div className="bg-yellow-200 p-2 sm:p-2.5 rounded-lg flex-shrink-0 ml-2">
                <FiClock className="text-sm sm:text-base text-yellow-700" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-blue-600 font-medium mb-1">محسوبة</p>
                <p className="text-base sm:text-lg font-bold text-blue-900 truncate">
                  {formatCurrency((stats.commissions.total || 0) - (stats.commissions.paid || 0) - (stats.commissions.pending || 0), 'SAR')}
                </p>
              </div>
              <div className="bg-blue-200 p-2 sm:p-2.5 rounded-lg flex-shrink-0 ml-2">
                <FiDollarSign className="text-sm sm:text-base text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200 p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-green-700 font-medium mb-1">مدفوعة</p>
                <p className="text-base sm:text-lg font-bold text-green-900 truncate">
                  {formatCurrency(stats.commissions.paid || 0, 'SAR')}
                </p>
              </div>
              <div className="bg-green-200 p-2 sm:p-2.5 rounded-lg flex-shrink-0 ml-2">
                <FiCheckCircle className="text-sm sm:text-base text-green-700" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-4 md:mb-6 p-3 sm:p-4">
        <div className="flex flex-col md:flex-row gap-2 sm:gap-3 md:gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="بحث..."
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
            <option value="pending">معلقة</option>
            <option value="calculated">محسوبة</option>
            <option value="paid">مدفوعة</option>
            <option value="cancelled">ملغاة</option>
          </select>
        </div>
      </div>

      {/* Commissions List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
        </div>
      ) : (
        <div className="card">
          <div className="text-center py-12">
            <FiDollarSign className="text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-gray-600 mb-2">تفاصيل العمولات ستظهر هنا</p>
            <p className="text-sm text-gray-500">
              سيتم إضافة API endpoint لعرض تفاصيل العمولات
            </p>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="card bg-blue-50 border-blue-200 mt-6">
        <div className="flex items-start gap-3">
          <FiEye className="text-blue-600 mt-1" />
          <div>
            <p className="font-semibold text-blue-900 mb-1">معلومات عن العمولات</p>
            <p className="text-sm text-blue-600">
              يتم حساب العمولات تلقائياً عند إرسال الطلبات للمنصة. نسبة عمولتك الحالية: <strong>{agent.commissionRate}%</strong>
            </p>
            <p className="text-sm text-blue-600 mt-2">
              العمولات المعلقة: الطلبات التي تم إرسالها ولكن لم يتم تأكيدها بعد.
            </p>
            <p className="text-sm text-blue-600">
              العمولات المدفوعة: تم تأكيدها ودفعها من الإدارة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

