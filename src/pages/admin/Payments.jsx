import { useEffect, useState } from 'react';
import { paymentAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { 
  FiDollarSign, 
  FiLoader, 
  FiEdit, 
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
  FiSearch
} from 'react-icons/fi';

const statusOptions = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'paid', label: 'مدفوع' },
  { value: 'failed', label: 'فاشل' },
  { value: 'refunded', label: 'مسترد' },
];

const methodOptions = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'cash_on_delivery', label: 'الدفع عند الاستلام' },
  { value: 'bank_transfer', label: 'تحويل بنكي' },
];

const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    refunded: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[status] || colors.pending;
};

const getStatusText = (status) => {
  return statusOptions.find(s => s.value === status)?.label || status;
};

const getMethodColor = (method) => {
  const colors = {
    stripe: 'bg-blue-100 text-blue-700',
    cash_on_delivery: 'bg-purple-100 text-purple-700',
    bank_transfer: 'bg-indigo-100 text-indigo-800',
  };
  return colors[method] || 'bg-gray-100 text-gray-800';
};

export default function AdminPayments() {
  const { success: showSuccess, error: showError } = useToast();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [stats, setStats] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  useEffect(() => {
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

  const loadPayments = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(methodFilter !== 'all' && { method: methodFilter }),
        ...(searchTerm && { search: searchTerm }),
      };

      const res = await paymentAPI.getAll(params);
      setPayments(res.data.payments || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to load payments', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await paymentAPI.getStats();
      setStats(res.data.stats);
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  };

  const handleStatusChange = (payment) => {
    setSelectedPayment(payment);
    setNewStatus(payment.status);
    setStatusNote('');
    setShowStatusModal(true);
  };

  const updatePaymentStatus = async () => {
    if (!selectedPayment || !newStatus) return;

    try {
      setUpdatingStatus(selectedPayment._id);
      await paymentAPI.updateStatus(selectedPayment._id, {
        status: newStatus,
        notes: statusNote,
      });
      
      await loadPayments(pagination.page);
      await loadStats();
      setShowStatusModal(false);
      setSelectedPayment(null);
      showSuccess('✅ تم تحديث حالة المدفوعة بنجاح');
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في تحديث حالة المدفوعة');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleRefund = (payment) => {
    setSelectedPayment(payment);
    setRefundAmount(payment.amount.toString());
    setRefundReason('');
    setShowRefundModal(true);
  };

  const processRefund = async () => {
    if (!selectedPayment || !refundAmount) return;

    try {
      setUpdatingStatus(selectedPayment._id);
      await paymentAPI.processRefund(selectedPayment._id, {
        refundedAmount: parseFloat(refundAmount),
        refundReason: refundReason,
      });
      
      await loadPayments(pagination.page);
      await loadStats();
      setShowRefundModal(false);
      setSelectedPayment(null);
      showSuccess('✅ تم استرداد المدفوعة بنجاح');
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في استرداد المدفوعة');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid':
        return <FiCheckCircle className="text-green-600" />;
      case 'failed':
        return <FiXCircle className="text-red-600" />;
      case 'refunded':
        return <FiRefreshCw className="text-gray-600" />;
      default:
        return <FiAlertCircle className="text-yellow-600" />;
    }
  };

  if (loading && !payments.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">إدارة المدفوعات</h1>
        <p className="text-xs md:text-sm text-gray-600">عرض وإدارة جميع المدفوعات في النظام</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="card p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1 truncate">إجمالي المدفوعات</p>
                <p className="text-lg md:text-xl font-bold text-gray-900">{stats.total || 0}</p>
              </div>
              <div className="p-2 md:p-3 bg-blue-100 rounded-lg flex-shrink-0">
                <FiDollarSign className="text-xl md:text-2xl text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1 truncate">المدفوعات الناجحة</p>
                <p className="text-lg md:text-xl font-bold text-gray-900">{stats.byStatus?.paid || 0}</p>
              </div>
              <div className="p-2 md:p-3 bg-green-100 rounded-lg flex-shrink-0">
                <FiCheckCircle className="text-xl md:text-2xl text-green-600" />
              </div>
            </div>
          </div>

          <div className="card p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1 truncate">إجمالي الإيرادات</p>
                <p className="text-sm md:text-xl font-bold text-gray-900 truncate">{formatCurrency(stats.revenue?.paid || 0)}</p>
              </div>
              <div className="p-2 md:p-3 bg-purple-100 rounded-lg flex-shrink-0">
                <FiDollarSign className="text-xl md:text-2xl text-purple-500" />
              </div>
            </div>
          </div>

          <div className="card p-3 md:p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1 truncate">قيد الانتظار</p>
                <p className="text-lg md:text-xl font-bold text-gray-900">{stats.byStatus?.pending || 0}</p>
              </div>
              <div className="p-2 md:p-3 bg-yellow-100 rounded-lg flex-shrink-0">
                <FiAlertCircle className="text-xl md:text-2xl text-yellow-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-3 md:p-4">
        <div className="flex flex-col gap-3">
          <div className="w-full">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="البحث برقم المدفوعة، المعرف، أو البريد..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pr-10 pl-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2 w-full">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                loadPayments(1);
              }}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            <select
              value={methodFilter}
              onChange={(e) => {
                setMethodFilter(e.target.value);
                loadPayments(1);
              }}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">جميع الطرق</option>
              {methodOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Payments - Desktop Table & Mobile Cards */}
      {payments.length > 0 ? (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">رقم المدفوعة</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">المستخدم</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">الطلب</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">المبلغ</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">الطريقة</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">الحالة</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">التاريخ</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {payments.map((payment) => (
                    <tr key={payment._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-mono font-semibold text-primary-600">#{payment.paymentNumber}</div>
                        {payment.transactionId && (
                          <div className="text-xs text-gray-500 mt-1">{payment.transactionId}</div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold">{payment.user?.name || 'غير معروف'}</p>
                          <p className="text-sm text-gray-500">{payment.user?.email}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900">
                          {payment.order?.orderNumber || payment.smartCartOrder?.orderNumber || '-'}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-primary-600">
                          {formatCurrency(payment.amount)} {payment.currency}
                        </span>
                        {payment.refundedAmount > 0 && (
                          <div className="text-xs text-red-600 mt-1">
                            مسترد: {formatCurrency(payment.refundedAmount)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getMethodColor(payment.method)}`}>
                          {methodOptions.find(m => m.value === payment.method)?.label || payment.method}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleStatusChange(payment)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:shadow-md border ${getStatusColor(payment.status)}`}
                          title="انقر لتغيير الحالة"
                        >
                          {getStatusText(payment.status)}
                        </button>
                      </td>
                      <td className="py-4 px-4 text-gray-600">{formatDate(payment.createdAt)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleStatusChange(payment)}
                            className="p-2 text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
                            title="تغيير الحالة"
                          >
                            <FiEdit />
                          </button>
                          {payment.status === 'paid' && (
                            <button
                              onClick={() => handleRefund(payment)}
                              disabled={updatingStatus === payment._id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="استرداد"
                            >
                              <FiRefreshCw />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  عرض {((pagination.page - 1) * pagination.limit) + 1} إلى {Math.min(pagination.page * pagination.limit, pagination.total)} من {pagination.total}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadPayments(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    السابق
                  </button>
                  <button
                    onClick={() => loadPayments(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {payments.map((payment) => (
              <div key={payment._id} className="card p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-bold text-primary-600 mb-1 text-sm break-all">#{payment.paymentNumber}</p>
                    <p className="text-xs text-gray-500">{formatDate(payment.createdAt)}</p>
                    {payment.transactionId && (
                      <p className="text-xs text-gray-400 mt-1 break-all truncate" title={payment.transactionId}>
                        {payment.transactionId.length > 20 ? `${payment.transactionId.substring(0, 20)}...` : payment.transactionId}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => handleStatusChange(payment)}
                    className={`px-2 py-1 rounded-lg text-xs font-medium border flex-shrink-0 ${getStatusColor(payment.status)}`}
                  >
                    {getStatusText(payment.status)}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">المستخدم</p>
                    <p className="font-semibold text-sm truncate" title={payment.user?.name || 'غير معروف'}>
                      {payment.user?.name || 'غير معروف'}
                    </p>
                    <p className="text-xs text-gray-500 truncate" title={payment.user?.email}>
                      {payment.user?.email}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-1">الطلب</p>
                    <p className="font-medium text-sm">
                      {payment.order?.orderNumber || payment.smartCartOrder?.orderNumber || '-'}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-1">الطريقة</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getMethodColor(payment.method)}`}>
                    {methodOptions.find(m => m.value === payment.method)?.label || payment.method}
                  </span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">المبلغ</p>
                      <p className="text-base font-bold text-primary-600">
                        {formatCurrency(payment.amount)} {payment.currency}
                      </p>
                      {payment.refundedAmount > 0 && (
                        <p className="text-xs text-red-600 mt-1">
                          مسترد: {formatCurrency(payment.refundedAmount)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(payment)}
                      className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-1"
                    >
                      <FiEdit className="text-sm" />
                      <span>تعديل</span>
                    </button>
                    {payment.status === 'paid' && (
                      <button
                        onClick={() => handleRefund(payment)}
                        disabled={updatingStatus === payment._id}
                        className="flex-1 btn-danger py-2 text-xs disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        <FiRefreshCw className="text-sm" />
                        <span>استرداد</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Mobile Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between card p-4">
                <button
                  onClick={() => loadPayments(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  السابق
                </button>
                <div className="text-sm text-gray-700">
                  صفحة {pagination.page} من {pagination.pages}
                </div>
                <button
                  onClick={() => loadPayments(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  التالي
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="card text-center py-16">
          <FiDollarSign className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
          <p className="text-sm md:text-base text-gray-600 mb-2">لا توجد مدفوعات</p>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
              ? 'جرب تغيير معايير البحث' 
              : 'لم يتم إنشاء أي مدفوعات بعد'}
          </p>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">تحديث حالة المدفوعة</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات (اختياري)</label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={updatePaymentStatus}
                disabled={updatingStatus === selectedPayment._id}
                className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {updatingStatus === selectedPayment._id ? 'جاري التحديث...' : 'تحديث'}
              </button>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedPayment(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">استرداد المدفوعة</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">مبلغ الاسترداد (SAR)</label>
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  max={selectedPayment.amount}
                  min={0}
                  step="0.01"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">المبلغ الأقصى: {formatCurrency(selectedPayment.amount)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">سبب الاسترداد (اختياري)</label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="أدخل سبب الاسترداد..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={processRefund}
                disabled={updatingStatus === selectedPayment._id || !refundAmount || parseFloat(refundAmount) <= 0}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {updatingStatus === selectedPayment._id ? 'جاري الاسترداد...' : 'تأكيد الاسترداد'}
              </button>
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setSelectedPayment(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
