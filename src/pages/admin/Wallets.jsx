import { useEffect, useState } from 'react';
import { walletAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  FiDollarSign,
  FiLoader,
  FiEye,
  FiEdit,
  FiSearch,
  FiRefreshCw,
  FiPlus,
  FiMinus,
} from 'react-icons/fi';

export default function Wallets() {
  const { success: showSuccess, error: showError } = useToast();
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustDescription, setAdjustDescription] = useState('');
  const [adjusting, setAdjusting] = useState(false);
  const [adjustType, setAdjustType] = useState(null); // 'increase' or 'decrease'
  const [showTransactions, setShowTransactions] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  useEffect(() => {
    loadWallets(pagination.page);
  }, [pagination.page, searchTerm]);

  const loadWallets = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
      };

      const res = await walletAPI.getAllWallets(params);
      setWallets(res.data.wallets || []);
      setPagination(res.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
    } catch (error) {
      console.error('Failed to load wallets', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = async (walletId) => {
    try {
      setTransactionsLoading(true);
      const res = await walletAPI.getWalletTransactions(walletId, { page: 1, limit: 50 });
      setTransactions(res.data.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  const handleAdjust = async (type) => {
    if (!adjustAmount || parseFloat(adjustAmount) <= 0) {
      showError('يجب إدخال مبلغ أكبر من صفر');
      return;
    }

    // Calculate the final amount: positive for increase, negative for decrease
    const finalAmount = type === 'increase' ? parseFloat(adjustAmount) : -parseFloat(adjustAmount);
    setAdjustType(type);
    setAdjusting(true);
    try {
      const res = await walletAPI.adjustBalance({
        walletId: selectedWallet._id,
        amount: finalAmount,
        description: adjustDescription.trim() || undefined,
      });

      if (res.data.success) {
        showSuccess(`✅ تم ${type === 'increase' ? 'زيادة' : 'نقصان'} الرصيد بنجاح!`);
        setShowAdjustModal(false);
        setAdjustAmount('');
        setAdjustDescription('');
        setAdjustType(null);
        setSelectedWallet(null);
        loadWallets(pagination.page);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في تعديل الرصيد');
    } finally {
      setAdjusting(false);
    }
  };

  const handleViewTransactions = (wallet) => {
    setSelectedWallet(wallet);
    setShowTransactions(true);
    loadTransactions(wallet._id);
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
      case 'refund':
      case 'adjustment':
        return <FiRefreshCw className="text-green-600" />;
      case 'payment':
      case 'withdraw':
        return <FiRefreshCw className="text-red-600 rotate-180" />;
      default:
        return <FiDollarSign className="text-gray-600" />;
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

  if (loading && wallets.length === 0) {
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
        <h1 className="text-lg md:text-xl font-bold text-gray-900 mb-1 md:mb-2">المحافظ</h1>
        <p className="text-xs md:text-sm text-gray-600">عرض وإدارة محافظ المستخدمين</p>
      </div>

      {/* Search */}
      <div className="card p-3 md:p-4">
        <div className="relative">
          <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="البحث برقم المحفظة..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                loadWallets(1);
              }
            }}
            className="w-full pr-10 pl-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Wallets Table (Desktop) */}
      <div className="hidden lg:block card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">رقم المحفظة</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">المستخدم</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">الرصيد</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">تاريخ الإنشاء</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {wallets.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-gray-500">
                    لا توجد محافظ
                  </td>
                </tr>
              ) : (
                wallets.map((wallet) => (
                  <tr key={wallet._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-primary-600">{wallet.walletNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-sm">{wallet.user?.name || 'غير محدد'}</p>
                        <p className="text-xs text-gray-500">{wallet.user?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-lg font-bold text-primary-600">
                        {formatCurrency(wallet.balance, wallet.currency)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDate(wallet.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewTransactions(wallet)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="عرض المعاملات"
                        >
                          <FiEye />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedWallet(wallet);
                            setShowAdjustModal(true);
                          }}
                          className="p-2 text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
                          title="تعديل الرصيد"
                        >
                          <FiEdit />
                        </button>
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
                onClick={() => loadWallets(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <button
                onClick={() => loadWallets(pagination.page + 1)}
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
        {wallets.length === 0 ? (
          <div className="card text-center py-8">
            <FiDollarSign className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-lg text-gray-600">لا توجد محافظ</p>
          </div>
        ) : (
          wallets.map((wallet) => (
            <div key={wallet._id} className="card p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <p className="font-mono font-bold text-primary-600 mb-1 text-sm">{wallet.walletNumber}</p>
                  <p className="text-lg font-bold text-primary-600">
                    {formatCurrency(wallet.balance, wallet.currency)}
                  </p>
                </div>
              </div>

              <div className="mb-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-1">المستخدم</p>
                <p className="text-sm font-semibold">{wallet.user?.name || 'غير محدد'}</p>
                <p className="text-xs text-gray-500">{wallet.user?.email}</p>
              </div>

              <div className="flex gap-2 pt-3 border-t border-gray-200">
                <button
                  onClick={() => handleViewTransactions(wallet)}
                  className="flex-1 btn-secondary py-2 text-xs flex items-center justify-center gap-1"
                >
                  <FiEye />
                  المعاملات
                </button>
                <button
                  onClick={() => {
                    setSelectedWallet(wallet);
                    setShowAdjustModal(true);
                  }}
                  className="flex-1 btn-primary py-2 text-xs flex items-center justify-center gap-1"
                >
                  <FiEdit />
                  تعديل
                </button>
              </div>
            </div>
          ))
        )}

        {/* Mobile Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => loadWallets(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <span className="text-sm text-gray-700">
              صفحة {pagination.page} من {pagination.pages}
            </span>
            <button
              onClick={() => loadWallets(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        )}
      </div>

      {/* Adjust Balance Modal */}
      {showAdjustModal && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 md:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">تعديل الرصيد</h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">المستخدم: {selectedWallet.user?.name}</p>
              <p className="text-sm text-gray-600 mb-1">المحفظة: {selectedWallet.walletNumber}</p>
              <p className="text-lg font-bold text-primary-600">
                الرصيد الحالي: {formatCurrency(selectedWallet.balance, selectedWallet.currency)}
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المبلغ (ريال سعودي) *
                </label>
                <input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Only allow positive numbers
                    if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                      setAdjustAmount(value);
                    }
                  }}
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="أدخل المبلغ"
                />
                <p className="text-xs text-gray-500 mt-1">
                  أدخل المبلغ المراد تعديله
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الوصف (اختياري)
                </label>
                <textarea
                  value={adjustDescription}
                  onChange={(e) => setAdjustDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="سبب التعديل..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => handleAdjust('increase')}
                  disabled={adjusting || !adjustAmount || parseFloat(adjustAmount) <= 0}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiPlus />
                  {adjusting && adjustType === 'increase' ? 'جاري الزيادة...' : 'زيادة'}
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjust('decrease')}
                  disabled={adjusting || !adjustAmount || parseFloat(adjustAmount) <= 0}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiMinus />
                  {adjusting && adjustType === 'decrease' ? 'جاري النقصان...' : 'نقصان'}
                </button>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdjustModal(false);
                    setSelectedWallet(null);
                    setAdjustAmount('');
                    setAdjustDescription('');
                    setAdjustType(null);
                  }}
                  className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Modal */}
      {showTransactions && selectedWallet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">معاملات المحفظة</h2>
              <button
                onClick={() => {
                  setShowTransactions(false);
                  setSelectedWallet(null);
                  setTransactions([]);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">المحفظة: <span className="font-bold">{selectedWallet.walletNumber}</span></p>
              <p className="text-sm text-gray-600">المستخدم: <span className="font-bold">{selectedWallet.user?.name}</span></p>
              <p className="text-lg font-bold text-primary-600 mt-1">
                الرصيد الحالي: {formatCurrency(selectedWallet.balance, selectedWallet.currency)}
              </p>
            </div>

            {transactionsLoading ? (
              <div className="flex justify-center py-8">
                <FiLoader className="animate-spin text-lg md:text-xl text-primary-600" />
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-2">
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
                          +{formatCurrency(transaction.amount, selectedWallet.currency)}
                        </p>
                      ) : (
                        <p className="text-red-600 font-bold text-sm">
                          -{formatCurrency(transaction.amount, selectedWallet.currency)}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-0.5">
                        الرصيد: {formatCurrency(transaction.balanceAfter || 0, selectedWallet.currency)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FiRefreshCw className="text-3xl md:text-4xl text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">لا توجد معاملات</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

