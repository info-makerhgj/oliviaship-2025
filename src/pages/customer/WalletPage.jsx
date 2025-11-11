import { useEffect, useState } from 'react';
import { walletAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import QRScannerModal from '../../components/modals/QRScannerModal';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { 
  FiDollarSign, 
  FiLoader, 
  FiCheckCircle, 
  FiXCircle, 
  FiCreditCard,
  FiRefreshCw,
  FiArrowDown,
  FiArrowUp,
  FiEye,
  FiEyeOff,
  FiFilter,
  FiDownload,
  FiSearch,
  FiMaximize2
} from 'react-icons/fi';

export default function WalletPage() {
  const { success: showSuccess, error: showError } = useToast();
  const [wallet, setWallet] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [code, setCode] = useState('');
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [showTransactions, setShowTransactions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: '',
    endDate: '',
    minAmount: '',
    maxAmount: '',
    search: '',
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const res = await walletAPI.get();
      setWallet(res.data.wallet);
      setStats(res.data.stats || null);
    } catch (error) {
      console.error('Failed to load wallet', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (page = 1) => {
    try {
      setTransactionsLoading(true);
      const params = {
        page,
        limit: 20,
        ...(filters.type !== 'all' && { type: filters.type }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
        ...(filters.minAmount && { minAmount: filters.minAmount }),
        ...(filters.maxAmount && { maxAmount: filters.maxAmount }),
        ...(filters.search && { search: filters.search }),
      };
      const res = await walletAPI.getTransactions(params);
      setTransactions(res.data.transactions || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to load transactions', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const applyFilters = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    loadTransactions(1);
  };

  const resetFilters = () => {
    setFilters({
      type: 'all',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
      search: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
    setTimeout(() => loadTransactions(1), 100);
  };

  const handleRedeemCode = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setRedeemError('يرجى إدخال الكود');
      return;
    }

    setRedeeming(true);
    setRedeemError('');
    setRedeemSuccess(false);

    try {
      const res = await walletAPI.redeemCode(code.trim().toUpperCase());
      
      if (res.data.success) {
        setRedeemSuccess(true);
        setCode('');
        showSuccess(`✅ تم شحن رصيدك بنجاح بمبلغ ${res.data.amount || ''} ${res.data.wallet?.currency || 'SAR'}`);
        await loadWallet();
        // Reload transactions if showing
        if (showTransactions) {
          await loadTransactions();
        }
        
        setTimeout(() => {
          setRedeemSuccess(false);
        }, 3000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'فشل في استبدال الكود. يرجى التحقق من الكود والمحاولة مرة أخرى.';
      setRedeemError(errorMsg);
      showError(errorMsg);
    } finally {
      setRedeeming(false);
    }
  };

  const handleQRScanSuccess = (scannedCode) => {
    // Set the scanned code in the input field
    setCode(scannedCode);
    setRedeemError('');
    setRedeemSuccess(false);
    
    // Auto-submit after setting code (user can still see the code before submission)
    setTimeout(async () => {
      if (scannedCode) {
        setRedeeming(true);
        try {
          const res = await walletAPI.redeemCode(scannedCode.trim().toUpperCase());
          
          if (res.data.success) {
            setRedeemSuccess(true);
            setCode('');
            showSuccess(`✅ تم شحن رصيدك بنجاح بمبلغ ${res.data.amount || ''} ${res.data.wallet?.currency || 'SAR'}`);
            await loadWallet();
            if (showTransactions) {
              await loadTransactions();
            }
            setTimeout(() => {
              setRedeemSuccess(false);
            }, 3000);
          }
        } catch (error) {
          const errorMsg = error.response?.data?.message || 'فشل في استبدال الكود. يرجى التحقق من الكود والمحاولة مرة أخرى.';
          setRedeemError(errorMsg);
          showError(errorMsg);
        } finally {
          setRedeeming(false);
        }
      }
    }, 300);
  };

  const handleToggleTransactions = () => {
    setShowTransactions(!showTransactions);
    if (!showTransactions && transactions.length === 0) {
      loadTransactions(1);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
      case 'refund':
      case 'adjustment':
        return <FiArrowDown className="text-green-600" />;
      case 'payment':
      case 'withdraw':
        return <FiArrowUp className="text-red-600" />;
      default:
        return <FiCreditCard className="text-gray-600" />;
    }
  };

  const getTransactionTypeText = (type) => {
    const types = {
      deposit: 'شحن',
      withdraw: 'سحب',
      payment: 'دفع',
      refund: 'استرداد',
      adjustment: 'تعديل',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FiLoader className="animate-spin text-4xl text-primary-600 mb-4" />
        <p className="text-gray-600">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-2 text-gradient">محفظتي</h1>
        <p className="text-gray-600 text-sm">إدارة رصيدك وعمليات الشحن</p>
      </div>

      {/* Wallet Balance Card */}
      <div className="card bg-gradient-to-br from-primary-600 to-secondary-500 text-white mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs opacity-90 mb-1">الرصيد الحالي</p>
            <p className="text-xl md:text-2xl font-bold">{formatCurrency(wallet?.balance || 0, wallet?.currency || 'SAR')}</p>
            <p className="text-xs opacity-75 mt-1.5">رقم المحفظة: {wallet?.walletNumber}</p>
          </div>
          <div className="bg-white bg-opacity-20 p-3 rounded-xl">
            <FiDollarSign className="text-2xl md:text-3xl" />
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white border-opacity-20">
            <div>
              <p className="text-xs opacity-75 mb-1">إجمالي الشحنات</p>
              <p className="text-base md:text-lg font-bold">{formatCurrency(stats.totalDeposits || 0, wallet?.currency || 'SAR')}</p>
              <p className="text-xs opacity-60 mt-0.5">{stats.depositsCount || 0} عملية</p>
            </div>
            <div>
              <p className="text-xs opacity-75 mb-1">إجمالي المشتريات</p>
              <p className="text-base md:text-lg font-bold">{formatCurrency(stats.totalPayments || 0, wallet?.currency || 'SAR')}</p>
              <p className="text-xs opacity-60 mt-0.5">{stats.paymentsCount || 0} عملية</p>
            </div>
          </div>
        )}
      </div>

      {/* Redeem Code Section */}
      <div className="card mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-100 p-2 rounded-xl">
            <FiCreditCard className="text-green-600 text-xl" />
          </div>
          <h2 className="text-base md:text-lg font-bold">شحن المحفظة</h2>
        </div>

        <form onSubmit={handleRedeemCode} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                أدخل كود الشحن
              </label>
              <button
                type="button"
                onClick={() => setShowQRScanner(true)}
                className="flex items-center gap-1.5 text-primary-600 hover:text-primary-700 text-sm font-medium px-3 py-1.5 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <FiMaximize2 className="text-base" />
                مسح QR Code
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setRedeemError('');
                  setRedeemSuccess(false);
                }}
                placeholder="مثال: A1B2C3D4 أو امسح QR Code"
                className="input-field w-full text-center font-mono text-sm md:text-base tracking-widest pr-12"
                disabled={redeeming}
              />
              {code && (
                <button
                  type="button"
                  onClick={() => {
                    setCode('');
                    setRedeemError('');
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                  title="مسح"
                >
                  <FiXCircle className="text-gray-400 text-sm" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              يمكنك إدخال الكود يدوياً أو مسح QR Code باستخدام الكاميرا
            </p>
          </div>

          {redeemError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm">
              <FiXCircle className="mt-0.5 flex-shrink-0" />
              <span>{redeemError}</span>
            </div>
          )}

          {redeemSuccess && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
              <FiCheckCircle className="flex-shrink-0" />
              <span>تم شحن المحفظة بنجاح!</span>
            </div>
          )}

          <button
            type="submit"
            disabled={redeeming || !code.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {redeeming ? (
              <>
                <FiLoader className="animate-spin" />
                جاري المعالجة...
              </>
            ) : (
              <>
                <FiCreditCard />
                استبدال الكود
              </>
            )}
          </button>
        </form>
      </div>

      {/* Transactions Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div 
            className="flex items-center gap-3 cursor-pointer flex-1"
            onClick={handleToggleTransactions}
          >
            <div className="bg-blue-100 p-2 rounded-xl">
              <FiRefreshCw className="text-blue-600 text-lg" />
            </div>
            <h2 className="text-base md:text-lg font-bold">سجل المعاملات</h2>
          </div>
          <div className="flex items-center gap-2">
            {showTransactions && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilters(!showFilters);
                }}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="فلترة"
              >
                <FiFilter />
              </button>
            )}
            <div 
              className="cursor-pointer p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={handleToggleTransactions}
            >
              {showTransactions ? <FiEyeOff /> : <FiEye />}
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showTransactions && showFilters && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">نوع المعاملة</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">الكل</option>
                  <option value="income">إيرادات (شحنات)</option>
                  <option value="expense">مصروفات (مشتريات)</option>
                  <option value="deposit">شحن</option>
                  <option value="payment">دفع</option>
                  <option value="refund">استرداد</option>
                  <option value="adjustment">تعديل</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">من تاريخ</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">إلى تاريخ</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">أقل مبلغ</label>
                <input
                  type="number"
                  value={filters.minAmount}
                  onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">أعلى مبلغ</label>
                <input
                  type="number"
                  value={filters.maxAmount}
                  onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                  placeholder="999999"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">بحث في الوصف</label>
                <div className="relative">
                  <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="ابحث..."
                    className="w-full pr-10 pl-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyFilters}
                className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
              >
                <FiFilter />
                تطبيق الفلاتر
              </button>
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                إعادة تعيين
              </button>
            </div>
          </div>
        )}

        {showTransactions && (
          <div>
            {transactionsLoading ? (
              <div className="flex justify-center py-8">
                <FiLoader className="animate-spin text-2xl text-primary-600" />
              </div>
            ) : transactions.length > 0 ? (
              <>
                <div className="space-y-3">
                  {transactions.map((transaction, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="bg-white p-2 rounded-lg">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-sm">
                            {getTransactionTypeText(transaction.type)}
                          </p>
                          {transaction.description && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              {transaction.description}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-1">
                            {formatDate(transaction.timestamp)}
                          </p>
                        </div>
                      </div>
                      <div className="text-left">
                        {transaction.type === 'deposit' || transaction.type === 'refund' || transaction.type === 'adjustment' ? (
                          <p className="text-green-600 font-bold text-sm">
                            +{formatCurrency(transaction.amount, wallet?.currency || 'SAR')}
                          </p>
                        ) : (
                          <p className="text-red-600 font-bold text-sm">
                            -{formatCurrency(transaction.amount, wallet?.currency || 'SAR')}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-0.5">
                          الرصيد: {formatCurrency(transaction.balanceAfter || 0, wallet?.currency || 'SAR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      صفحة {pagination.page} من {pagination.pages} ({pagination.total} معاملة)
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => loadTransactions(pagination.page - 1)}
                        disabled={pagination.page === 1}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        السابق
                      </button>
                      <button
                        onClick={() => loadTransactions(pagination.page + 1)}
                        disabled={pagination.page === pagination.pages}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        التالي
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <FiRefreshCw className="text-4xl text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">لا توجد معاملات</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* QR Scanner Modal */}
      <QRScannerModal
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScanSuccess={handleQRScanSuccess}
      />
    </div>
  );
}

