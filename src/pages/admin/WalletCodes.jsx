import { useEffect, useState } from 'react';
import { walletAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import QRCodeModal from '../../components/modals/QRCodeModal';
import { formatDate, formatCurrency } from '../../utils/helpers';
import {
  FiCreditCard,
  FiLoader,
  FiPlus,
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiDownload,
  FiCopy,
  FiMaximize2,
} from 'react-icons/fi';

export default function WalletCodes() {
  const { success: showSuccess, error: showError } = useToast();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({});
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrModalData, setQrModalData] = useState({ qrUrl: '', code: '', amount: '', currency: '', codeId: '' });
  const [codes, setCodes] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  // Create code form
  const [amount, setAmount] = useState('');
  const [code, setCode] = useState('');
  const [count, setCount] = useState('1');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadCodes(pagination.page);
  }, [statusFilter, pagination.page]);

  const loadCodes = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(statusFilter === 'used' && { isUsed: true }),
        ...(statusFilter === 'returned' && { isReturned: true }),
        ...(statusFilter === 'unused' && { isUsed: false, isReturned: false }),
        ...(searchTerm && { search: searchTerm }),
      };

      const res = await walletAPI.getAllCodes(params);
      setCodes(res.data.codes || []);
      setStats(res.data.stats || null);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to load codes', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCode = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      showError('يجب تحديد قيمة الكود');
      return;
    }

    const codeCount = parseInt(count) || 1;
    if (codeCount < 1 || codeCount > 1000) {
      showError('عدد الأكواد يجب أن يكون بين 1 و 1000');
      return;
    }

    // Warning for large batches
    if (codeCount > 100) {
      setConfirmModalData({
        title: 'تأكيد إنشاء أكواد متعددة',
        message: `هل أنت متأكد من إنشاء ${codeCount} كود؟ قد يستغرق ذلك وقتاً أطول.`,
        type: 'warning',
        onConfirm: () => {
          setShowConfirmModal(false);
          createCodes();
        },
      });
      setShowConfirmModal(true);
      return;
    }

    createCodes();
  };

  const createCodes = async () => {

    setCreating(true);
    try {
      const res = await walletAPI.createCode({
        amount: parseFloat(amount),
        code: code.trim() || undefined, // Auto-generate if empty
        count: code.trim() ? 1 : parseInt(count) || 1, // If code provided, ignore count
        expiresAt: expiresAt || undefined,
        notes: notes.trim() || undefined,
      });

      if (res.data.success) {
        const totalCreated = res.data.totalCreated || res.data.codes.length;
        showSuccess(`✅ تم إنشاء ${totalCreated} كود بنجاح!`);
        setShowCreateModal(false);
        resetForm();
        loadCodes(1);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في إنشاء الأكواد');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setCode('');
    setCount('1');
    setExpiresAt('');
    setNotes('');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSuccess('✅ تم نسخ الكود!');
  };

  const handleExportCodes = async () => {
    try {
      const params = {
        ...(statusFilter !== 'all' && { isUsed: statusFilter === 'used' }),
        ...(searchTerm && { search: searchTerm }),
      };
      
      const res = await walletAPI.exportCodes(params);
      
      // Create blob and download
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `wallet-codes-${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess('✅ تم تصدير الأكواد بنجاح');
    } catch (error) {
      console.error('Failed to export codes', error);
      showError(error.response?.data?.message || 'فشل في تصدير الأكواد');
    }
  };

  const handleShowQR = async (codeId) => {
    try {
      const res = await walletAPI.getCodeQR(codeId);
      if (res.data.success && res.data.qrUrl) {
        // Find code details for display
        const codeItem = codes.find(c => c._id === codeId);
        setQrModalData({
          qrUrl: res.data.qrUrl,
          code: res.data.code || codeItem?.code || '',
          amount: res.data.data?.amount || codeItem?.amount || '',
          currency: res.data.data?.currency || codeItem?.currency || 'SAR',
          codeId: codeId,
        });
        setShowQRModal(true);
      } else {
        showError('فشل في إنشاء QR Code');
      }
    } catch (error) {
      console.error('Failed to get QR code', error);
      showError(error.response?.data?.message || 'فشل في عرض QR Code');
    }
  };

  if (loading && codes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">أكواد الشحن</h1>
          <p className="text-xs md:text-sm text-gray-600">إدارة أكواد الشحن للمحافظ</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm md:text-base"
        >
          <FiPlus />
          إنشاء أكواد
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className={`grid grid-cols-2 ${stats.returnedCodes !== undefined ? 'md:grid-cols-5' : 'md:grid-cols-4'} gap-3 md:gap-4`}>
          <div className="card p-3 md:p-4">
            <p className="text-xs md:text-sm text-gray-600 mb-1">إجمالي الأكواد</p>
            <p className="text-lg md:text-xl font-bold text-gray-900">{stats.totalCodes || 0}</p>
          </div>
          <div className="card p-3 md:p-4">
            <p className="text-xs md:text-sm text-gray-600 mb-1">مستخدمة</p>
            <p className="text-lg md:text-xl font-bold text-green-600">{stats.usedCodes || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatCurrency(stats.usedValue || 0, 'SAR')}
            </p>
          </div>
          <div className="card p-3 md:p-4">
            <p className="text-xs md:text-sm text-gray-600 mb-1">غير مستخدمة</p>
            <p className="text-lg md:text-xl font-bold text-blue-600">{stats.unusedCodes || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatCurrency(stats.unusedValue || 0, 'SAR')}
            </p>
          </div>
          {stats.returnedCodes !== undefined && (
            <div className="card p-3 md:p-4">
              <p className="text-xs md:text-sm text-gray-600 mb-1">مرتجعة</p>
              <p className="text-lg md:text-xl font-bold text-orange-600">{stats.returnedCodes || 0}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatCurrency(stats.returnedValue || 0, 'SAR')}
              </p>
            </div>
          )}
          <div className="card p-3 md:p-4">
            <p className="text-xs md:text-sm text-gray-600 mb-1">القيمة الإجمالية</p>
            <p className="text-lg md:text-xl font-bold text-primary-600">
              {formatCurrency(stats.totalValue || 0, 'SAR')}
            </p>
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
                placeholder="البحث بالكود..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    loadCodes(1);
                  }
                }}
                className="w-full pr-10 pl-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">جميع الحالات</option>
              <option value="unused">غير مستخدمة</option>
              <option value="used">مستخدمة</option>
              <option value="returned">مرتجعة</option>
            </select>
          </div>
        </div>
      </div>

      {/* Codes Table (Desktop) */}
      <div className="hidden lg:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">الكود</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">القيمة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">الحالة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">مستخدم بواسطة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">تاريخ الإنشاء</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">تاريخ الانتهاء</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {codes.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                    لا توجد أكواد
                  </td>
                </tr>
              ) : (
                codes.map((codeItem) => (
                  <tr key={codeItem._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-primary-600">{codeItem.code}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(codeItem.amount, codeItem.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border ${
                        codeItem.isReturned
                          ? 'bg-orange-100 text-orange-800 border-orange-200'
                          : codeItem.isUsed
                          ? 'bg-gray-100 text-gray-800 border-gray-200'
                          : 'bg-green-100 text-green-800 border-green-200'
                      }`}>
                        {codeItem.isReturned ? (
                          <>
                            <FiXCircle />
                            مرتجع
                          </>
                        ) : codeItem.isUsed ? (
                          <>
                            <FiCheckCircle />
                            مستخدم
                          </>
                        ) : (
                          <>
                            <FiCheckCircle />
                            متاح
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {codeItem.isReturned ? (
                        <div>
                          <div className="text-sm font-medium text-orange-600">مرتجع</div>
                          {codeItem.returnedFrom && (
                            <div className="text-xs text-gray-500">من: {codeItem.returnedFrom.name}</div>
                          )}
                          <div className="text-xs text-gray-400 mt-0.5">
                            {formatDate(codeItem.returnedAt)}
                          </div>
                          {codeItem.returnedReason && (
                            <div className="text-xs text-gray-500 mt-1 italic">{codeItem.returnedReason}</div>
                          )}
                        </div>
                      ) : codeItem.usedBy ? (
                        <div>
                          <div className="text-sm font-medium">{codeItem.usedBy.name}</div>
                          <div className="text-xs text-gray-500">{codeItem.usedBy.email}</div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {formatDate(codeItem.usedAt)}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(codeItem.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {codeItem.expiresAt ? (
                        new Date(codeItem.expiresAt) > new Date() ? (
                          formatDate(codeItem.expiresAt)
                        ) : (
                          <span className="text-red-600">منتهي</span>
                        )
                      ) : (
                        <span className="text-gray-400">لا يوجد</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => copyToClipboard(codeItem.code)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="نسخ الكود"
                        >
                          <FiCopy />
                        </button>
                        {!codeItem.isUsed && (
                          <button
                            onClick={() => handleShowQR(codeItem._id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="QR Code"
                          >
                            <FiMaximize2 />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
                onClick={() => loadCodes(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <button
                onClick={() => loadCodes(pagination.page + 1)}
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
        {codes.length === 0 ? (
          <div className="card text-center py-8">
            <FiCreditCard className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-gray-600">لا توجد أكواد</p>
          </div>
        ) : (
          codes.map((codeItem) => (
            <div key={codeItem._id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-mono font-bold text-primary-600 mb-1 text-sm">{codeItem.code}</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(codeItem.amount, codeItem.currency)}
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                  codeItem.isReturned
                    ? 'bg-orange-100 text-orange-800'
                    : codeItem.isUsed
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {codeItem.isReturned ? (
                    <>
                      <FiXCircle />
                      مرتجع
                    </>
                  ) : codeItem.isUsed ? 'مستخدم' : 'متاح'}
                </span>
              </div>

              {(codeItem.isReturned || codeItem.usedBy) && (
                <div className="mb-3 pt-3 border-t border-gray-200">
                  {codeItem.isReturned ? (
                    <>
                      <p className="text-xs text-gray-500 mb-1">حالة الإرجاع</p>
                      <p className="text-sm font-semibold text-orange-600">مرتجع</p>
                      {codeItem.returnedFrom && (
                        <p className="text-xs text-gray-500">من: {codeItem.returnedFrom.name}</p>
                      )}
                      {codeItem.returnedAt && (
                        <p className="text-xs text-gray-400 mt-1">{formatDate(codeItem.returnedAt)}</p>
                      )}
                      {codeItem.returnedReason && (
                        <p className="text-xs text-gray-500 mt-1 italic">{codeItem.returnedReason}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-500 mb-1">مستخدم بواسطة</p>
                      <p className="text-sm font-semibold">{codeItem.usedBy.name}</p>
                      <p className="text-xs text-gray-500">{codeItem.usedBy.email}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(codeItem.usedAt)}</p>
                    </>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  {formatDate(codeItem.createdAt)}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(codeItem.code)}
                    className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1"
                  >
                    <FiCopy />
                    نسخ
                  </button>
                  {!codeItem.isUsed && !codeItem.isReturned && (
                    <button
                      onClick={() => handleShowQR(codeItem._id)}
                      className="btn-secondary px-3 py-1.5 text-xs flex items-center gap-1 text-blue-600 hover:bg-blue-50"
                      title="عرض QR Code"
                    >
                      <FiMaximize2 />
                      QR
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => loadCodes(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <span className="text-sm text-gray-700">
              صفحة {pagination.page} من {pagination.pages}
            </span>
            <button
              onClick={() => loadCodes(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {/* Create Code Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 md:p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">إنشاء أكواد شحن</h2>
            <form onSubmit={handleCreateCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  القيمة (ريال سعودي) *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="مثال: 10, 50, 100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الكود (اتركه فارغاً لتوليد تلقائي)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
                  placeholder="مثال: CODE10"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {code.trim() 
                    ? 'إذا حددت كوداً، سيتم إنشاء كود واحد فقط (سيتم تجاهل عدد الأكواد)'
                    : `إذا تركت فارغاً، سيتم توليد ${count} كود تلقائياً`}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  عدد الأكواد *
                </label>
                <input
                  type="number"
                  value={count}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 1;
                    setCount(Math.min(Math.max(val, 1), 1000).toString());
                  }}
                  min="1"
                  max="1000"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  يمكنك إنشاء من 1 إلى 1000 كود في دفعة واحدة
                </p>
                {parseInt(count) > 100 && (
                  <p className="text-xs text-yellow-600 mt-1">
                    ⚠️ توليد {count} كود قد يستغرق وقتاً أطول
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ الانتهاء (اختياري)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="أي ملاحظات حول هذه الأكواد..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={creating || !amount}
                  className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'جاري الإنشاء...' : 'إنشاء'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmModalData.onConfirm || (() => {})}
        title={confirmModalData.title || 'تأكيد العملية'}
        message={confirmModalData.message || ''}
        type={confirmModalData.type || 'warning'}
        confirmText={confirmModalData.confirmText || 'موافق'}
        cancelText={confirmModalData.cancelText || 'إلغاء'}
        loading={confirmModalData.loading || false}
      />

      {/* QR Code Modal */}
      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrUrl={qrModalData.qrUrl}
        code={qrModalData.code}
        amount={qrModalData.amount}
        currency={qrModalData.currency}
        codeId={qrModalData.codeId}
      />
    </div>
  );
}

