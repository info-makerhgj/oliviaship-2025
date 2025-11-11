import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { posAPI } from '../../utils/api';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { useAuthStore } from '../../store/authStore';
import {
  FiPackage,
  FiCreditCard,
  FiLoader,
  FiCheckCircle,
  FiXCircle,
  FiMapPin,
  FiShoppingBag,
  FiDollarSign,
  FiTrendingUp,
  FiInfo,
  FiClock,
} from 'react-icons/fi';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import PromptModal from '../../components/modals/PromptModal';
import ToastNotification from '../../components/modals/ToastNotification';

export default function PointDashboard() {
  const { pointId } = useParams();
  const navigate = useNavigate();
  const [point, setPoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders', 'codes', 'stats', 'commissions'
  const [orders, setOrders] = useState({ regular: [], smartCart: [] });
  const [codes, setCodes] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingCodes, setLoadingCodes] = useState(false);
  const [loadingCommissions, setLoadingCommissions] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [readyFilter, setReadyFilter] = useState('all');
  const [commissionStatusFilter, setCommissionStatusFilter] = useState('all');
  const [stats, setStats] = useState(null);
  
  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({});
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptModalData, setPromptModalData] = useState({});
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' });

  useEffect(() => {
    if (pointId) {
      loadPoint();
      loadOrders();
      loadCodes();
      loadCommissions();
      loadStats();
    }
  }, [pointId]);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, readyFilter]);

  useEffect(() => {
    loadCommissions();
  }, [commissionStatusFilter]);

  const { user } = useAuthStore();

  const loadPoint = async () => {
    try {
      setLoading(true);
      const res = await posAPI.getOne(pointId);
      const pointData = res.data.point;
      setPoint(pointData);
      
      // Check if user has permission (admin or point manager)
      const managerId = pointData.manager?._id?.toString() || pointData.manager?.toString() || pointData.manager;
      const userId = user?.id?.toString() || user?._id?.toString() || user?.id;
      
      console.log('🔍 Permission check:', {
        userRole: user?.role,
        userId: userId,
        managerId: managerId,
        isAdmin: user?.role === 'admin',
        isManager: managerId === userId,
        pointName: pointData.name
      });
      
      if (user?.role !== 'admin' && managerId !== userId) {
        console.error('❌ Access denied:', {
          userRole: user?.role,
          userId: userId,
          managerId: managerId,
          match: managerId === userId
        });
        alert('غير مصرح لك بالوصول إلى هذه النقطة');
        // Redirect based on user role
        if (user?.role === 'admin') {
          navigate('/admin/points');
        } else if (user?.role === 'agent') {
          navigate('/agent');
        } else {
          navigate('/dashboard');
        }
        return;
      }
      
      console.log('✅ Access granted');
    } catch (error) {
      console.error('Failed to load point', error);
      if (error.response?.status === 403) {
        alert('غير مصرح لك بالوصول إلى هذه النقطة');
      } else {
        alert('فشل في تحميل بيانات النقطة');
      }
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (readyFilter !== 'all') {
        params.readyForPickup = readyFilter === 'ready';
      }
      const res = await posAPI.getOrders(pointId, params);
      
      // Add orderType to each order for easy identification
      const regularOrders = (res.data.orders?.regular || []).map(order => ({
        ...order,
        orderType: 'regular'
      }));
      const smartCartOrders = (res.data.orders?.smartCart || []).map(order => ({
        ...order,
        orderType: 'smartCart'
      }));
      
      setOrders({
        regular: regularOrders,
        smartCart: smartCartOrders,
      });
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoadingOrders(false);
    }
  };

  const loadCodes = async () => {
    setLoadingCodes(true);
    try {
      const res = await posAPI.getCodes(pointId);
      setCodes(res.data.distributions || []);
    } catch (error) {
      console.error('Failed to load codes', error);
    } finally {
      setLoadingCodes(false);
    }
  };

  const loadCommissions = async () => {
    setLoadingCommissions(true);
    try {
      const params = {};
      if (commissionStatusFilter !== 'all') {
        params.status = commissionStatusFilter;
      }
      const res = await posAPI.getCommissions(pointId, params);
      setCommissions(res.data.commissions || []);
    } catch (error) {
      console.error('Failed to load commissions', error);
    } finally {
      setLoadingCommissions(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await posAPI.getStats(pointId);
      setStats(res.data.stats);
    } catch (error) {
      console.error('Failed to load stats', error);
    }
  };

  const handleMarkReady = async (orderId, orderType) => {
    setConfirmModalData({
      title: 'تأكيد جاهزية الطلب',
      message: 'هل أنت متأكد أن الطلب جاهز للاستلام؟',
      type: 'info',
      onConfirm: async () => {
        setShowConfirmModal(false);
        try {
          console.log('🔍 Marking order ready:', { pointId, orderId, orderType });
          const res = await posAPI.markOrderReady(pointId, orderId, orderType);
          setToast({ isOpen: true, message: '✅ تم تحديث حالة الطلب - جاهز للاستلام', type: 'success' });
          loadOrders();
        } catch (error) {
          console.error('❌ Failed to mark order ready:', error);
          const errorMessage = error.response?.data?.message || error.message || 'فشل في تحديث حالة الطلب';
          setToast({ isOpen: true, message: `❌ ${errorMessage}`, type: 'error' });
        }
      },
    });
    setShowConfirmModal(true);
  };

  const handleSellCode = async (distributionId) => {
    setPromptModalData({
      title: 'بيع الكود للعميل',
      label: 'أدخل بريد العميل أو رقم الهاتف',
      placeholder: 'example@email.com أو 777123456',
      type: 'text',
      onSubmit: async (customerIdentifier) => {
        setShowPromptModal(false);
        
        // Check if we need sale price
        const distribution = codes.find(c => c._id === distributionId);
        if (!distribution) {
          setToast({ isOpen: true, message: '❌ الكود غير موجود', type: 'error' });
          return;
        }

        // Ask for sale price if needed
        const defaultPrice = distribution.walletCode?.amount || 0;
        setPromptModalData({
          title: 'سعر البيع',
          label: 'أدخل سعر البيع (اتركه فارغاً للقيمة الافتراضية)',
          placeholder: defaultPrice.toString(),
          type: 'number',
          defaultValue: defaultPrice.toString(),
          required: false,
          onSubmit: async (salePriceStr) => {
            setShowPromptModal(false);
            let salePrice = defaultPrice;
            if (salePriceStr && salePriceStr.trim()) {
              salePrice = parseFloat(salePriceStr);
              if (isNaN(salePrice)) {
                setToast({ isOpen: true, message: '❌ سعر البيع غير صحيح', type: 'error' });
                return;
              }
            }

            try {
              // Determine if it's email or phone
              const isEmail = customerIdentifier.includes('@');
              
              await posAPI.sellCode(pointId, {
                distributionId,
                salePrice: salePrice,
                [isEmail ? 'customerEmail' : 'customerPhone']: customerIdentifier.trim(),
              });
              setToast({ isOpen: true, message: '✅ تم بيع الكود للعميل بنجاح! سيتم شحن محفظة العميل تلقائياً.', type: 'success' });
              loadCodes();
            } catch (error) {
              setToast({ isOpen: true, message: error.response?.data?.message || 'فشل في بيع الكود. تأكد من أن العميل مسجل في النظام.', type: 'error' });
            }
          },
        });
        setShowPromptModal(true);
      },
    });
    setShowPromptModal(true);
  };

  const handleReturnCode = async (distributionId) => {
    setConfirmModalData({
      title: 'إرجاع الكود',
      message: 'هل تريد إرجاع هذا الكود للإدارة؟',
      type: 'warning',
      onConfirm: async () => {
        setShowConfirmModal(false);
        try {
          await posAPI.returnCode(pointId, { distributionId });
          setToast({ isOpen: true, message: '✅ تم إرجاع الكود للإدارة بنجاح', type: 'success' });
          loadCodes();
        } catch (error) {
          setToast({ isOpen: true, message: error.response?.data?.message || 'فشل في إرجاع الكود', type: 'error' });
        }
      },
    });
    setShowConfirmModal(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'ready':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'delivered':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status) => {
    const statusMap = {
      pending: 'قيد الانتظار',
      processing: 'قيد المعالجة',
      ready: 'جاهز',
      delivered: 'تم التسليم',
      cancelled: 'ملغي',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
      </div>
    );
  }

  if (!point) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-gray-600">النقطة غير موجودة</p>
      </div>
    );
  }

  const allOrders = [...orders.regular, ...orders.smartCart];
  const readyOrders = allOrders.filter(order => order.delivery?.readyForPickup && !order.delivery?.pickedUpAt);
  const pickedUpOrders = allOrders.filter(order => order.delivery?.pickedUpAt);

  return (
    <div className="p-3 md:p-6 space-y-3 md:space-y-6 bg-gray-50 min-h-screen pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold mb-2 text-gradient">لوحة تحكم نقطة البيع</h1>
        <div className="card p-4 bg-gradient-to-r from-primary-600 to-secondary-500 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold truncate mb-1">{point.name}</p>
              {point.code && (
                <p className="text-sm opacity-90 font-mono">{point.code}</p>
              )}
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
              point.status === 'active' 
                ? 'bg-green-500 text-white' 
                : 'bg-gray-400 text-white'
            }`}>
              {point.status === 'active' ? '✓ نشط' : 'غير نشط'}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="card p-4 text-center">
          <FiCheckCircle className="text-xl md:text-2xl text-green-600 mx-auto mb-2" />
          <p className="text-xs text-gray-600 mb-1">جاهزة للاستلام</p>
          <p className="text-lg md:text-xl font-bold text-green-600">{readyOrders.length}</p>
        </div>
        <div className="card p-4 text-center">
          <FiPackage className="text-xl md:text-2xl text-blue-600 mx-auto mb-2" />
          <p className="text-xs text-gray-600 mb-1">إجمالي الطلبات</p>
          <p className="text-lg md:text-xl font-bold text-gray-900">{allOrders.length}</p>
        </div>
        <div className="card p-4 text-center">
          <FiTrendingUp className="text-xl md:text-2xl text-orange-600 mx-auto mb-2" />
          <p className="text-xs text-gray-600 mb-1">إجمالي المبيعات</p>
          <p className="text-lg md:text-xl font-bold text-orange-600">{point.inventory?.totalSales || 0}</p>
        </div>
        <div className="card p-4 text-center">
          <FiCreditCard className="text-xl md:text-2xl text-purple-500 mx-auto mb-2" />
          <p className="text-xs text-gray-600 mb-1">الأكواد المتاحة</p>
          <p className="text-lg md:text-xl font-bold text-purple-500">{point.inventory?.availableCodes || 0}</p>
        </div>
      </div>

      {/* Commissions Card */}
      <div className="card p-4 mb-4">
        <div className="flex items-center gap-3">
          <FiDollarSign className="text-xl md:text-2xl text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-base font-bold text-gray-700 mb-1">
              العمولات ({stats?.commissions?.count || 0})
            </p>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(stats?.commissions?.total || 0, 'SAR')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card mb-3">
        <div className="flex flex-wrap gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
              activeTab === 'stats'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiTrendingUp className="inline ml-1" />
            الإحصائيات
          </button>
          <button
            onClick={() => setActiveTab('commissions')}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
              activeTab === 'commissions'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiDollarSign className="inline ml-1" />
            العمولات ({commissions.length})
          </button>
          <button
            onClick={() => setActiveTab('codes')}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
              activeTab === 'codes'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiCreditCard className="inline ml-1" />
            الأكواد ({codes.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-sm font-medium transition-all border-b-2 ${
              activeTab === 'orders'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FiPackage className="inline ml-1" />
            الطلبات ({allOrders.length})
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div>
            {/* Filters */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">قيد الانتظار</option>
                <option value="processing">قيد المعالجة</option>
                <option value="ready">جاهز</option>
                <option value="delivered">تم التسليم</option>
              </select>
              <select
                value={readyFilter}
                onChange={(e) => setReadyFilter(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">الكل</option>
                <option value="ready">جاهزة للاستلام</option>
                <option value="not_ready">غير جاهزة</option>
              </select>
            </div>

            {loadingOrders ? (
              <div className="flex justify-center py-8">
                <FiLoader className="animate-spin text-lg md:text-xl text-primary-600" />
              </div>
            ) : allOrders.length === 0 ? (
              <div className="text-center py-12">
                <FiPackage className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">لا توجد طلبات</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allOrders.map((order) => (
                  <div key={order._id} className="card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h3 className="font-bold text-sm text-primary-600">#{order.orderNumber}</h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">
                          {order.user?.name || 'عميل'} • {formatDate(order.createdAt)}
                        </p>
                        <p className="text-sm text-gray-700 mb-2">
                          الإجمالي: {formatCurrency(order.pricing?.totalCost || 0, 'SAR')}
                        </p>
                      </div>
                    </div>

                    {/* Products */}
                    <div className="mb-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-2">المنتجات:</p>
                      <div className="space-y-2">
                        {(order.products || []).slice(0, 3).map((product, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <FiShoppingBag className="text-gray-400 flex-shrink-0" />
                            <span className="flex-1 line-clamp-1 min-w-0">{product.name}</span>
                            <span className="text-gray-600 flex-shrink-0">x{product.quantity}</span>
                          </div>
                        ))}
                        {order.products?.length > 3 && (
                          <p className="text-xs text-gray-500">+{order.products.length - 3} منتج آخر</p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    {order.delivery?.type === 'pickup_point' && !order.delivery?.readyForPickup && !order.delivery?.pickedUpAt && (
                      <div className="flex gap-2 pt-3 border-t border-gray-200">
                        <button
                          onClick={() => handleMarkReady(
                            order._id,
                            order.orderType || (order.orderNumber?.startsWith('SC') ? 'smartCart' : 'regular')
                          )}
                          className="flex-1 btn-primary px-4 py-2 text-sm flex items-center justify-center gap-2"
                        >
                          <FiCheckCircle />
                          <span>جاهز للاستلام</span>
                        </button>
                      </div>
                    )}

                    {order.delivery?.readyForPickup && !order.delivery?.pickedUpAt && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                          <FiCheckCircle className="text-green-600 flex-shrink-0" />
                          <p className="text-sm text-green-800 flex-1">
                            جاهز للاستلام - في انتظار العميل
                          </p>
                        </div>
                      </div>
                    )}

                    {order.delivery?.pickedUpAt && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
                          <FiCheckCircle className="text-blue-600 flex-shrink-0" />
                          <p className="text-sm text-blue-700 flex-1">
                            تم الاستلام من العميل ✓
                            {order.delivery.pickedUpAt && (
                              <span className="block text-xs text-blue-600 mt-1">
                                {new Date(order.delivery.pickedUpAt).toLocaleDateString('ar-SA', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Codes Tab */}
        {activeTab === 'codes' && (
          <div>
            {/* Info Banner - Mobile Optimized */}
            <div className="mb-3 md:mb-4 p-2 md:p-3 bg-blue-50 border-r-4 border-blue-500 rounded">
              <p className="text-xs md:text-sm text-blue-700 flex items-center gap-1.5 md:gap-2">
                <FiInfo className="text-blue-600 flex-shrink-0 text-sm" />
                <span>الأكواد المتاحة للبيع للعملاء. يمكنك بيعها أو إرجاعها للإدارة.</span>
              </p>
            </div>

            {/* Filters - Mobile Optimized */}
            <div className="grid grid-cols-2 gap-2 md:gap-3 mb-3 md:mb-4">
              <select
                value={statusFilter === 'all' ? 'all' : statusFilter}
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    setStatusFilter('all');
                  } else {
                    // Filter codes by status
                    setStatusFilter(e.target.value);
                  }
                }}
                className="px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">جميع الأكواد</option>
                <option value="distributed">متاحة</option>
                <option value="sold">مباعة</option>
                <option value="returned">مرتجعة</option>
              </select>
            </div>

            {loadingCodes ? (
              <div className="flex justify-center py-12">
                <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
              </div>
            ) : codes.filter(code => {
              if (statusFilter === 'all') return true;
              if (statusFilter === 'distributed') return code.status === 'distributed';
              if (statusFilter === 'sold') return code.status === 'sold';
              if (statusFilter === 'returned') return code.status === 'returned';
              return true;
            }).length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <FiCreditCard className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-600 font-medium">لا توجد أكواد</p>
                <p className="text-sm text-gray-500 mt-2">اتصل بالإدارة لطلب أكواد جديدة</p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {codes.filter(code => {
                  if (statusFilter === 'all') return true;
                  if (statusFilter === 'distributed') return code.status === 'distributed';
                  if (statusFilter === 'sold') return code.status === 'sold';
                  if (statusFilter === 'returned') return code.status === 'returned';
                  return true;
                }).map((distribution) => (
                  <div key={distribution._id} className="card p-3 md:p-4 hover:shadow-md transition-all border-2 border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                          <div className="bg-primary-100 p-2 md:p-3 rounded-lg flex-shrink-0">
                            <FiCreditCard className="text-primary-600 text-lg md:text-xl" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-mono font-bold text-primary-600 text-base md:text-xl mb-1 truncate">
                              {distribution.walletCode?.code}
                            </h3>
                            <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-lg text-[10px] md:text-xs font-bold border-2 whitespace-nowrap ${
                              distribution.status === 'sold'
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : distribution.status === 'returned'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : 'bg-blue-100 text-blue-700 border-blue-300'
                            }`}>
                              {distribution.status === 'sold' ? '✓ مباع' :
                               distribution.status === 'returned' ? '✗ مرجع' :
                               '✓ متاح للبيع'}
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 md:p-3 space-y-1 mb-2 md:mb-3">
                          <div className="flex justify-between items-center">
                            <span className="text-xs md:text-sm text-gray-600">قيمة الكود:</span>
                            <span className="text-xs md:text-sm font-bold text-primary-700">
                              {formatCurrency(distribution.walletCode?.amount || 0, 'SAR')}
                            </span>
                          </div>
                          {distribution.purchasePrice && (
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] md:text-xs text-gray-500">سعر الشراء:</span>
                              <span className="text-[10px] md:text-xs font-medium text-gray-700">
                                {formatCurrency(distribution.purchasePrice, 'SAR')}
                              </span>
                            </div>
                          )}
                          {distribution.salePrice && (
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] md:text-xs text-gray-500">سعر البيع المحدد:</span>
                              <span className="text-[10px] md:text-xs font-medium text-gray-700">
                                {formatCurrency(distribution.salePrice, 'SAR')}
                              </span>
                            </div>
                          )}
                          {distribution.soldAt && (
                            <div className="flex justify-between items-center pt-1 md:pt-2 border-t border-gray-200">
                              <span className="text-[10px] md:text-xs text-gray-500">تم البيع:</span>
                              <span className="text-[10px] md:text-xs font-medium text-gray-700">
                                {formatDate(distribution.soldAt)}
                              </span>
                            </div>
                          )}
                          {distribution.soldToCustomerBy && (
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] md:text-xs text-gray-500">العميل:</span>
                              <span className="text-[10px] md:text-xs font-medium text-gray-700 truncate">
                                {distribution.soldToCustomerBy?.name || distribution.soldToCustomerBy?.email}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Actions - Mobile Optimized */}
                        {distribution.status === 'distributed' && (
                          <div className="flex gap-2 pt-2 md:pt-3 border-t-2 border-gray-200">
                            <button
                              onClick={() => handleSellCode(distribution._id)}
                              className="flex-1 btn-primary px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-bold flex items-center justify-center gap-1 md:gap-2 shadow-md hover:shadow-lg transition-all"
                            >
                              <FiDollarSign className="text-sm" />
                              <span>بيع للعميل</span>
                            </button>
                            <button
                              onClick={() => handleReturnCode(distribution._id)}
                              className="px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all flex items-center justify-center gap-1 md:gap-2"
                            >
                              <FiXCircle className="text-sm" />
                              <span>إرجاع</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Commissions Tab */}
        {activeTab === 'commissions' && (
          <div>
            {/* Filter - Mobile Optimized */}
            <div className="mb-3 md:mb-4">
              <select
                value={commissionStatusFilter}
                onChange={(e) => setCommissionStatusFilter(e.target.value)}
                className="w-full px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">جميع الحالات</option>
                <option value="pending">معلقة</option>
                <option value="approved">معتمدة</option>
                <option value="paid">مدفوعة</option>
                <option value="cancelled">ملغاة</option>
              </select>
            </div>

            {loadingCommissions ? (
              <div className="flex justify-center py-8">
                <FiLoader className="animate-spin text-lg md:text-xl text-primary-600" />
              </div>
            ) : commissions.length === 0 ? (
              <div className="text-center py-16 bg-gray-50 rounded-lg">
                <FiDollarSign className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
                <p className="text-lg text-gray-600 font-medium">لا توجد عمولات</p>
                <p className="text-sm text-gray-500 mt-2">
                  العمولات تظهر تلقائياً عند استلام العملاء للطلبات
                </p>
              </div>
            ) : (
              <div className="space-y-2 md:space-y-3">
                {commissions.map((commission) => (
                  <div key={commission._id} className="card p-3 md:p-4 hover:shadow-md transition-all border-2 border-gray-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 md:gap-3 mb-2 md:mb-3">
                          <div className="bg-green-100 p-2 md:p-3 rounded-lg flex-shrink-0">
                            <FiDollarSign className="text-green-600 text-lg md:text-xl" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm md:text-base text-gray-900 mb-1 truncate">
                              طلب #{commission.orderNumber}
                            </h3>
                            <span className={`px-2 md:px-3 py-0.5 md:py-1 rounded-lg text-[10px] md:text-xs font-bold border-2 whitespace-nowrap ${
                              commission.status === 'paid'
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : commission.status === 'approved'
                                ? 'bg-blue-100 text-blue-700 border-blue-300'
                                : commission.status === 'cancelled'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                            }`}>
                              {commission.status === 'paid' ? '✓ مدفوعة' :
                               commission.status === 'approved' ? '✓ معتمدة' :
                               commission.status === 'cancelled' ? '✗ ملغاة' :
                               '⏳ معلقة'}
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-2 md:p-3 space-y-1 md:space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs md:text-sm text-gray-600">إجمالي الطلب:</span>
                            <span className="text-xs md:text-sm font-bold text-gray-900">
                              {formatCurrency(commission.orderTotal, 'SAR')}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs md:text-sm text-gray-600">نسبة العمولة:</span>
                            <span className="text-xs md:text-sm font-medium text-primary-700">
                              {commission.commissionRate}%
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1 md:pt-2 border-t border-gray-200">
                            <span className="text-xs md:text-sm font-bold text-gray-700">مبلغ العمولة:</span>
                            <span className="text-sm md:text-lg font-bold text-green-600">
                              {formatCurrency(commission.commissionAmount, 'SAR')}
                            </span>
                          </div>
                          {commission.createdAt && (
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-[10px] md:text-xs text-gray-500">تاريخ الإنشاء:</span>
                              <span className="text-[10px] md:text-xs font-medium text-gray-700">
                                {formatDate(commission.createdAt)}
                              </span>
                            </div>
                          )}
                          {commission.paidAt && (
                            <div className="flex justify-between items-center pt-1">
                              <span className="text-[10px] md:text-xs text-gray-500">تاريخ الدفع:</span>
                              <span className="text-[10px] md:text-xs font-medium text-gray-700">
                                {formatDate(commission.paidAt)}
                              </span>
                            </div>
                          )}
                          {commission.paymentNotes && (
                            <div className="pt-1 md:pt-2 border-t border-gray-200">
                              <span className="text-[10px] md:text-xs text-gray-500 block mb-0.5 md:mb-1">ملاحظات الدفع:</span>
                              <p className="text-[10px] md:text-xs text-gray-700">{commission.paymentNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary - Mobile Optimized */}
            {stats?.commissions && (
              <div className="mt-4 md:mt-6 grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                <div className="card p-2 md:p-3 text-center">
                  <p className="text-[10px] md:text-xs text-gray-600 mb-0.5 md:mb-1">إجمالي العمولات</p>
                  <p className="text-sm md:text-base font-bold text-gray-900">
                    {formatCurrency(stats.commissions.total, 'SAR')}
                  </p>
                </div>
                <div className="card p-2 md:p-3 text-center">
                  <p className="text-[10px] md:text-xs text-gray-600 mb-0.5 md:mb-1">معلقة</p>
                  <p className="text-sm md:text-base font-bold text-yellow-600">
                    {formatCurrency(stats.commissions.pending, 'SAR')}
                  </p>
                </div>
                <div className="card p-2 md:p-3 text-center">
                  <p className="text-[10px] md:text-xs text-gray-600 mb-0.5 md:mb-1">معتمدة</p>
                  <p className="text-sm md:text-base font-bold text-blue-600">
                    {formatCurrency(stats.commissions.approved, 'SAR')}
                  </p>
                </div>
                <div className="card p-2 md:p-3 text-center">
                  <p className="text-[10px] md:text-xs text-gray-600 mb-0.5 md:mb-1">مدفوعة</p>
                  <p className="text-sm md:text-base font-bold text-green-600">
                    {formatCurrency(stats.commissions.paid, 'SAR')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <FiInfo className="text-primary-600" />
                  معلومات النقطة
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">الحالة:</span>
                    <span className="font-medium">{point.status === 'active' ? 'نشطة' : 'غير نشطة'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">نوع الخدمات:</span>
                    <span className="font-medium">
                      {point.type === 'both' ? 'أكواد + استلام' :
                       point.type === 'codes_only' ? 'أكواد فقط' :
                       'استلام فقط'}
                    </span>
                  </div>
                  {point.contact?.phone && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">الهاتف:</span>
                      <span className="font-medium">{point.contact.phone}</span>
                    </div>
                  )}
                  {point.manager && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">المدير:</span>
                      <span className="font-medium">{point.manager?.name || '-'}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="card p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <FiTrendingUp className="text-primary-600" />
                  الإحصائيات
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">الأكواد المتاحة:</span>
                    <span className="font-medium">{point.inventory?.availableCodes || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">الأكواد الموزعة:</span>
                    <span className="font-medium">{point.inventory?.totalCodesDistributed || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">إجمالي المبيعات:</span>
                    <span className="font-medium">{point.inventory?.totalSales || 0}</span>
                  </div>
                  {point.rating && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">التقييم:</span>
                      <span className="font-medium">
                        {point.rating.average ? point.rating.average.toFixed(1) : '0.0'} ⭐
                        ({point.rating.count || 0} تقييم)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
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

      <PromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        onSubmit={promptModalData.onSubmit || (() => {})}
        title={promptModalData.title || 'إدخال البيانات'}
        label={promptModalData.label || ''}
        placeholder={promptModalData.placeholder || ''}
        type={promptModalData.type || 'text'}
        defaultValue={promptModalData.defaultValue || ''}
        required={promptModalData.required !== false}
        loading={promptModalData.loading || false}
      />

      <ToastNotification
        isOpen={toast.isOpen}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ ...toast, isOpen: false })}
      />
    </div>
  );
}

