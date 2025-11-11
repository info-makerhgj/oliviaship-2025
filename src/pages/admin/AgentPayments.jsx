import { useEffect, useState } from 'react';
import { agentAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { formatDate, formatCurrency, getStatusText } from '../../utils/helpers';
import { 
  FiDollarSign, 
  FiLoader, 
  FiEye,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiPackage,
  FiTrendingUp,
  FiTrendingDown,
} from 'react-icons/fi';

const statusOptions = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'paid', label: 'مدفوع' },
  { value: 'pending', label: 'معلق' },
  { value: 'partial', label: 'جزئي' },
];

const methodOptions = [
  { value: 'all', label: 'جميع الطرق' },
  { value: 'cash', label: 'نقد' },
  { value: 'transfer', label: 'تحويل بنكي' },
  { value: 'cash_pay', label: 'Cash Pay' },
  { value: 'wallet', label: 'محفظة' },
  { value: 'point_of_sale', label: 'نقطة البيع' },
  { value: 'other', label: 'أخرى' },
];

const getStatusColor = (status) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-700 border-green-200';
    case 'partial':
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 'pending':
      return 'bg-gray-100 text-gray-700 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getMethodText = (method) => {
  const methods = {
    cash: 'نقد',
    transfer: 'تحويل بنكي',
    cash_pay: 'Cash Pay',
    wallet: 'محفظة',
    point_of_sale: 'نقطة البيع',
    other: 'أخرى',
  };
  return methods[method] || method || 'غير محدد';
};

const getMethodColor = (method) => {
  const colors = {
    cash: 'bg-blue-100 text-blue-700',
    transfer: 'bg-purple-100 text-purple-700',
    cash_pay: 'bg-indigo-100 text-indigo-800',
    wallet: 'bg-green-100 text-green-800',
    point_of_sale: 'bg-orange-100 text-orange-800',
    other: 'bg-gray-100 text-gray-800',
  };
  return colors[method] || 'bg-gray-100 text-gray-800';
};

export default function AgentPayments() {
  const { success: showSuccess, error: showError } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [agentFilter, setAgentFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [agents, setAgents] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    loadAgents();
    loadPayments(1);
    loadStats();
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== searchTerm) {
        setSearchTerm(searchInput);
        loadPayments(1);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadAgents = async () => {
    try {
      const res = await agentAPI.getAll({ page: 1, limit: 100, status: 'active' });
      setAgents(res.data.agents || []);
    } catch (error) {
      console.error('Failed to load agents', error);
    }
  };

  const loadPayments = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(methodFilter !== 'all' && { paymentMethod: methodFilter }),
        ...(agentFilter !== 'all' && { agentId: agentFilter }),
        ...(searchTerm && { search: searchTerm }),
      };

      const res = await agentAPI.getAgentPayments(params);
      setPayments(res.data.payments || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to load payments', error);
      showError('فشل في تحميل المدفوعات');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await agentAPI.getAgentPaymentStats();
      setStats(res.data.stats || null);
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  };

  const handlePaymentClick = (payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const getPaymentAmount = (order) => {
    return (order.pricing?.totalCost || 0) - (order.commission || 0);
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-2 text-gradient">مدفوعات الوكلاء</h1>
        <p className="text-gray-600 text-sm">إدارة ومتابعة جميع مدفوعات الوكلاء للمنصة</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي المدفوعات</p>
                <p className="text-2xl font-bold text-primary-600">{stats.total}</p>
              </div>
              <FiPackage className="text-3xl text-primary-300" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">المدفوعة</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <FiCheckCircle className="text-3xl text-green-300" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">المعلقة</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
              <FiClock className="text-3xl text-yellow-300" />
            </div>
          </div>
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي المبلغ المدفوع</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(stats.totalPaidAmount || 0, 'SAR')}
                </p>
              </div>
              <FiTrendingUp className="text-3xl text-primary-300" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ابحث برقم الطلب أو الوكيل..."
              className="input-field pr-12 w-full"
            />
          </div>

          {/* Agent Filter */}
          <div className="relative">
            <FiUser className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                loadPayments(1);
              }}
              className="input-field pr-12 w-full appearance-none cursor-pointer"
            >
              <option value="all">جميع الوكلاء</option>
              {agents.map((agent) => (
                <option key={agent._id} value={agent._id}>
                  {agent.user?.name} ({agent.agentNumber})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FiFilter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                loadPayments(1);
              }}
              className="input-field pr-12 w-full appearance-none cursor-pointer"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Method Filter */}
          <div className="relative">
            <FiFilter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                loadPayments(1);
              }}
              className="input-field pr-12 w-full appearance-none cursor-pointer"
            >
              {methodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Payments Count */}
      <div className="mb-4">
        <p className="text-gray-600">
          إجمالي المدفوعات: <span className="font-bold text-primary-600">{pagination.total}</span>
        </p>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
        </div>
      ) : payments.length === 0 ? (
        <div className="card text-center py-12">
          <FiDollarSign className="text-4xl text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-600">لا توجد مدفوعات</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-4 px-4 font-bold text-gray-700">رقم الطلب</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">الوكيل</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">العميل</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">المبلغ</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">العمولة</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">طريقة الدفع</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">الحالة</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">تاريخ الدفع</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => {
                  const paymentAmount = getPaymentAmount(payment);
                  return (
                    <tr 
                      key={payment._id} 
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handlePaymentClick(payment)}
                    >
                      <td className="py-4 px-4">
                        <span className="font-mono font-semibold text-primary-600">
                          #{payment.orderNumber}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold">{payment.agent?.user?.name || 'غير محدد'}</p>
                          <p className="text-xs text-gray-500">{payment.agent?.agentNumber}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium">{payment.customer?.name || 'غير محدد'}</p>
                          <p className="text-xs text-gray-500">{payment.customer?.phone}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-primary-600">
                          {formatCurrency(paymentAmount, 'SAR')}
                        </span>
                        <p className="text-xs text-gray-500">
                          الإجمالي: {formatCurrency(payment.pricing?.totalCost || 0, 'SAR')}
                        </p>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">
                          {formatCurrency(payment.commission || 0, 'SAR')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(payment.agentPaymentMethod)}`}>
                          {getMethodText(payment.agentPaymentMethod)}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(payment.agentPaymentStatus)}`}>
                          {getStatusText(payment.agentPaymentStatus)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-600">
                        {payment.agentPaymentDate ? formatDate(payment.agentPaymentDate) : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePaymentClick(payment);
                          }}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="عرض التفاصيل"
                        >
                          <FiEye />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {payments.map((payment) => {
              const paymentAmount = getPaymentAmount(payment);
              return (
                <div 
                  key={payment._id} 
                  className="card cursor-pointer"
                  onClick={() => handlePaymentClick(payment)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-mono font-bold text-primary-600 mb-1">
                        #{payment.orderNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {payment.agentPaymentDate ? formatDate(payment.agentPaymentDate) : 'لم يتم الدفع'}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(payment.agentPaymentStatus)}`}>
                      {getStatusText(payment.agentPaymentStatus)}
                    </span>
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">الوكيل</p>
                      <p className="font-semibold">{payment.agent?.user?.name || 'غير محدد'}</p>
                      <p className="text-xs text-gray-500">{payment.agent?.agentNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">العميل</p>
                      <p className="font-semibold">{payment.customer?.name || 'غير محدد'}</p>
                      <p className="text-xs text-gray-500">{payment.customer?.phone}</p>
                    </div>
                  </div>

                  <div className="mb-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">المبلغ المدفوع:</span>
                      <span className="font-bold text-primary-600">
                        {formatCurrency(paymentAmount, 'SAR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">العمولة:</span>
                      <span className="text-sm text-gray-700">
                        {formatCurrency(payment.commission || 0, 'SAR')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">طريقة الدفع:</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(payment.agentPaymentMethod)}`}>
                        {getMethodText(payment.agentPaymentMethod)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => loadPayments(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="text-gray-600">
                صفحة {pagination.page} من {pagination.pages}
              </span>
              <button
                onClick={() => loadPayments(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* Payment Details Modal */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-4">تفاصيل الدفع</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">رقم الطلب</p>
                <p className="font-mono font-bold text-primary-600">#{selectedPayment.orderNumber}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">الوكيل</p>
                  <p className="font-semibold">{selectedPayment.agent?.user?.name || 'غير محدد'}</p>
                  <p className="text-xs text-gray-500">#{selectedPayment.agent?.agentNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">العميل</p>
                  <p className="font-semibold">{selectedPayment.customer?.name || 'غير محدد'}</p>
                  <p className="text-xs text-gray-500">{selectedPayment.customer?.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500 mb-1">إجمالي الطلب</p>
                  <p className="font-bold text-lg">
                    {formatCurrency(selectedPayment.pricing?.totalCost || 0, 'SAR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">العمولة</p>
                  <p className="font-bold text-lg text-green-600">
                    {formatCurrency(selectedPayment.commission || 0, 'SAR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">المبلغ المدفوع</p>
                  <p className="font-bold text-xl text-primary-600">
                    {formatCurrency(getPaymentAmount(selectedPayment), 'SAR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">الحالة</p>
                  <span className={`inline-block px-3 py-1 rounded text-sm font-medium border ${getStatusColor(selectedPayment.agentPaymentStatus)}`}>
                    {getStatusText(selectedPayment.agentPaymentStatus)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-1">طريقة الدفع</p>
                <span className={`inline-block px-3 py-1 rounded text-sm font-medium ${getMethodColor(selectedPayment.agentPaymentMethod)}`}>
                  {getMethodText(selectedPayment.agentPaymentMethod)}
                </span>
              </div>

              {selectedPayment.agentPaymentTransactionId && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">رقم العملية</p>
                  <p className="font-mono text-sm">{selectedPayment.agentPaymentTransactionId}</p>
                </div>
              )}

              {selectedPayment.agentPaymentDate && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">تاريخ الدفع</p>
                  <p className="text-sm">{formatDate(selectedPayment.agentPaymentDate)}</p>
                </div>
              )}

              {selectedPayment.agentPaymentProof && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">إيصال الدفع</p>
                  <a 
                    href={selectedPayment.agentPaymentProof} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline text-sm"
                  >
                    عرض الإيصال
                  </a>
                </div>
              )}

              {selectedPayment.agentPaymentNotes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">ملاحظات</p>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                    {selectedPayment.agentPaymentNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPayment(null);
                }}
                className="btn-secondary"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

