import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { orderAPI, smartCartOrderAPI, stripeAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { getStatusColor, getStatusText, formatDate, formatCurrency, getPlaceholderImage } from '../../utils/helpers';
import { FiPackage, FiSearch, FiFilter, FiLoader, FiCheckCircle, FiXCircle, FiAlertCircle, FiEye } from 'react-icons/fi';

export default function MyOrders() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError, warning: showWarning, info: showInfo } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  // Check for payment status on mount
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const sessionId = searchParams.get('session_id');
    
    if (paymentStatus === 'success' && sessionId) {
      verifyPayment(sessionId);
    } else if (paymentStatus === 'cancelled') {
      showWarning('تم إلغاء عملية الدفع.');
      // Clean URL
      setSearchParams({});
    }
  }, []);

  const verifyPayment = async (sessionId, retryCount = 0) => {
    setVerifying(true);
    try {
      const res = await stripeAPI.verifySession(sessionId);
      
      if (res.data.success && res.data.paid && res.data.orderId) {
        // Payment successful, order created
        showSuccess('✅ تم الدفع بنجاح! تم إنشاء الطلب.');
        // Clean URL and reload orders
        setSearchParams({});
        await loadOrders();
        // Navigate to order details
        navigate(`/dashboard/orders/${res.data.orderId}`, { replace: true });
      } else if (res.data.paid && !res.data.orderId) {
        // Payment successful but order not created yet (webhook might be delayed)
        if (retryCount < 3) {
          // Retry after 2 seconds
          setTimeout(() => verifyPayment(sessionId, retryCount + 1), 2000);
        } else {
          showInfo('تم الدفع بنجاح، لكن الطلب قيد الإنشاء. يرجى تحديث الصفحة لاحقاً.');
          setSearchParams({});
          await loadOrders();
        }
      } else {
        // Payment failed or pending
        const status = res.data.paymentStatus || 'unknown';
        if (status === 'unpaid' || status === 'no_payment_required') {
          showError('❌ لم يتم الدفع. يرجى المحاولة مرة أخرى.');
        } else {
          showWarning(`⚠️ حالة الدفع: ${status}. يرجى التحقق من الطلبات لاحقاً.`);
        }
        setSearchParams({});
        await loadOrders();
      }
    } catch (error) {
      console.error('Failed to verify payment:', error);
      if (retryCount < 2) {
        // Retry on error
        setTimeout(() => verifyPayment(sessionId, retryCount + 1), 1000);
      } else {
        showWarning('⚠️ فشل التحقق من حالة الدفع. يرجى التحقق من الطلبات يدوياً.');
        setSearchParams({});
        await loadOrders();
      }
    } finally {
      setVerifying(false);
    }
  };

  const loadOrders = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      // Load both regular orders and smart cart orders
      const [ordersRes, smartCartOrdersRes] = await Promise.all([
        orderAPI.getAll(params).catch(() => ({ data: { orders: [] } })),
        smartCartOrderAPI.getAll(params).catch(() => ({ data: { orders: [] } })),
      ]);

      // Combine and sort by date, add type to each order
      const allOrders = [
        ...(ordersRes.data.orders || []).map(order => ({ ...order, type: 'regular' })),
        ...(smartCartOrdersRes.data.orders || []).map(order => ({ ...order, type: 'smartCart' })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setOrders(allOrders);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        order.orderNumber?.toLowerCase().includes(search) ||
        order.product?.name?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  const statuses = [
    { value: 'all', label: 'الكل' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'processing', label: 'قيد المعالجة' },
    { value: 'shipped', label: 'تم الشحن' },
    { value: 'delivered', label: 'مكتمل' },
  ];

  if (loading || verifying) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <FiLoader className="animate-spin text-4xl text-primary-600 mb-4" />
        <p className="text-gray-600">
          {verifying ? 'جارٍ التحقق من حالة الدفع...' : 'جاري التحميل...'}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-gradient">طلباتي</h1>
        <p className="text-gray-600 text-xs sm:text-sm">عرض ومتابعة جميع طلباتك</p>
      </div>

      {/* Filters */}
      <div className="card mb-4 sm:mb-6 p-3 sm:p-4 md:p-6">
        {/* Search */}
        <div className="mb-3 sm:mb-4">
          <div className="relative">
            <FiSearch className="absolute right-2 sm:right-3 md:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث برقم الطلب أو اسم المنتج..."
              className="input-field pr-8 sm:pr-10 md:pr-12 text-sm sm:text-base py-2 sm:py-2.5 px-3"
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block mb-1.5 sm:mb-2 font-semibold text-xs sm:text-sm">التصفية حسب الحالة:</label>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => setStatusFilter(status.value)}
                className={`px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium transition-all ${
                  statusFilter === status.value
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            // Get product image and name
            const productImage = order.product?.image || order.products?.[0]?.image;
            const productName = order.product?.name || order.products?.[0]?.name || 'منتج غير محدد';
            const productStore = order.product?.store || order.products?.[0]?.store;
            const productCount = order.products?.length || 1;
            const totalQuantity = order.products 
              ? order.products.reduce((sum, p) => sum + (p.quantity || 1), 0)
              : (order.product?.quantity || 1);
            const totalPrice = order.pricing?.totalInYER || order.pricing?.totalCost || 0;

            return (
              <Link
                key={order._id}
                to={`/dashboard/orders/${order._id}`}
                className="block"
              >
                <div className="card p-4">
                  <div className="flex gap-3">
                    {/* Product Image - Small Square */}
                    {productImage && (
                      <div className="flex-shrink-0">
                        <img
                          src={productImage}
                          alt={productName}
                          className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            e.target.src = getPlaceholderImage(200, 200);
                          }}
                        />
                      </div>
                    )}

                    {/* Order Info - Main Content */}
                    <div className="flex-1 min-w-0">
                      {/* Order Number & Status */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="font-bold text-xs md:text-sm text-primary-600">
                          #{order.orderNumber}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                        {order.products && productCount > 1 && (
                          <span className="px-2 py-0.5 bg-secondary-100 text-secondary-700 rounded text-xs font-medium">
                            {productCount} منتج
                          </span>
                        )}
                      </div>

                      {/* Product Name - Compact */}
                      <h3 
                        className="font-semibold text-sm md:text-base mb-2 line-clamp-2 break-words" 
                        title={productName}
                      >
                        {productName}
                        {order.products && productCount > 1 && (
                          <span className="text-gray-500 text-xs mr-1">+ {productCount - 1} منتج آخر</span>
                        )}
                      </h3>

                      {/* Store & Details */}
                      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs text-gray-600">
                        {productStore && (
                          <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                            {productStore}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <FiPackage className="text-xs" />
                          {formatDate(order.createdAt)}
                        </span>
                        {order.type === 'smartCart' ? (
                          <span>إجمالي: {totalQuantity} قطعة</span>
                        ) : (
                          order.product?.quantity && (
                            <span>الكمية: {order.product.quantity}</span>
                          )
                        )}
                      </div>

                      {/* Bottom Row: View & Price */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        {/* View Button */}
                        <div className="flex items-center gap-1 text-primary-600 text-xs font-medium">
                          <FiEye className="text-sm" />
                          <span>عرض التفاصيل</span>
                        </div>

                        {/* Total Price */}
                        {order.pricing && (
                          <div className="text-left">
                            <p className="text-gray-500 text-xs mb-0.5">الإجمالي</p>
                            <p className="text-base md:text-lg font-bold text-primary-600">
                              {formatCurrency(totalPrice, 'YER')}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-16">
          <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
          <p className="text-sm md:text-base text-gray-600 mb-2">
            {searchTerm || statusFilter !== 'all' ? 'لا توجد نتائج' : 'لا توجد طلبات بعد'}
          </p>
          {!searchTerm && statusFilter === 'all' && (
            <Link to="/order" className="btn-primary inline-flex items-center gap-2 mt-4">
              طلب منتج الآن
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
