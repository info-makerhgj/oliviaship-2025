import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { orderAPI, smartCartOrderAPI, statsAPI } from '../../utils/api';
import { FiPackage, FiClock, FiCheckCircle, FiTrendingUp, FiShoppingBag } from 'react-icons/fi';
import { getStatusColor, getStatusText, formatCurrency } from '../../utils/helpers';

export default function CustomerDashboard() {
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load both regular orders and smart cart orders
      const [ordersRes, smartCartOrdersRes] = await Promise.all([
        orderAPI.getAll({ limit: 10 }).catch(() => ({ data: { orders: [] } })),
        smartCartOrderAPI.getAll().catch(() => ({ data: { orders: [] } })),
      ]);

      // Combine and sort by date
      const allOrders = [
        ...(ordersRes.data.orders || []).map(order => ({ ...order, type: 'regular' })),
        ...(smartCartOrdersRes.data.orders || []).map(order => ({ ...order, type: 'smartCart' })),
      ]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5); // Get only 5 most recent

      setRecentOrders(allOrders);
      
      // Calculate stats from all orders
      setStats({
        total: allOrders.length,
        pending: allOrders.filter(o => o.status === 'pending').length,
        processing: allOrders.filter(o => ['processing', 'purchased', 'shipped'].includes(o.status)).length,
        delivered: allOrders.filter(o => o.status === 'delivered').length,
      });
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-gray-900">
          مرحباً بك! 👋
        </h1>
        <p className="text-gray-600 text-sm md:text-base">تابع طلباتك وإحصائياتك من هنا</p>
      </div>

      {/* Stats Cards - Mobile Optimized */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {/* Total Orders */}
        <div className="bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex flex-col items-center text-center text-white">
            <div className="bg-white/20 backdrop-blur-sm p-3 md:p-4 rounded-xl mb-3">
              <FiPackage className="text-2xl md:text-3xl" />
            </div>
            <div className="text-3xl md:text-4xl font-bold mb-1">{stats.total || 0}</div>
            <div className="text-xs md:text-sm text-white/90 font-medium">إجمالي الطلبات</div>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex flex-col items-center text-center text-white">
            <div className="bg-white/20 backdrop-blur-sm p-3 md:p-4 rounded-xl mb-3">
              <FiClock className="text-2xl md:text-3xl" />
            </div>
            <div className="text-3xl md:text-4xl font-bold mb-1">{stats.pending || 0}</div>
            <div className="text-xs md:text-sm text-white/90 font-medium">قيد الانتظار</div>
          </div>
        </div>

        {/* Processing */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex flex-col items-center text-center text-white">
            <div className="bg-white/20 backdrop-blur-sm p-3 md:p-4 rounded-xl mb-3">
              <FiTrendingUp className="text-2xl md:text-3xl" />
            </div>
            <div className="text-3xl md:text-4xl font-bold mb-1">{stats.processing || 0}</div>
            <div className="text-xs md:text-sm text-white/90 font-medium">قيد التنفيذ</div>
          </div>
        </div>

        {/* Delivered */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all">
          <div className="flex flex-col items-center text-center text-white">
            <div className="bg-white/20 backdrop-blur-sm p-3 md:p-4 rounded-xl mb-3">
              <FiCheckCircle className="text-2xl md:text-3xl" />
            </div>
            <div className="text-3xl md:text-4xl font-bold mb-1">{stats.delivered || 0}</div>
            <div className="text-xs md:text-sm text-white/90 font-medium">مكتملة</div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Modern Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <Link
          to="/cart"
          className="bg-gradient-to-br from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 rounded-2xl p-5 md:p-6 flex items-center gap-4 group shadow-lg hover:shadow-xl transition-all text-white"
        >
          <div className="bg-white/20 backdrop-blur-sm p-3 md:p-4 rounded-xl group-hover:scale-110 transition-transform">
            <FiShoppingBag className="text-2xl md:text-3xl" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base md:text-lg mb-1">اطلب الآن</h3>
            <p className="text-white/90 text-xs md:text-sm">تسوق من المتاجر العالمية</p>
          </div>
        </Link>

        <Link
          to="/dashboard/orders"
          className="bg-white border-2 border-gray-200 hover:border-primary-300 rounded-2xl p-5 md:p-6 flex items-center gap-4 group shadow-md hover:shadow-lg transition-all"
        >
          <div className="bg-primary-50 group-hover:bg-primary-100 p-3 md:p-4 rounded-xl transition-colors">
            <FiPackage className="text-primary-600 text-2xl md:text-3xl" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-base md:text-lg mb-1 text-gray-900">طلباتي</h3>
            <p className="text-gray-600 text-xs md:text-sm">شاهد وتابع جميع طلباتك</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders - Modern Cards */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 md:p-6">
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-900">آخر الطلبات</h2>
          <Link 
            to="/dashboard/orders" 
            className="text-primary-600 hover:text-primary-700 text-sm md:text-base font-semibold flex items-center gap-1 hover:gap-2 transition-all"
          >
            عرض الكل
            <span>←</span>
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="space-y-3 md:space-y-4">
            {recentOrders.map((order) => (
              <Link
                key={order._id}
                to={`/dashboard/orders/${order._id}`}
                className="block p-4 md:p-5 bg-gray-50 hover:bg-white border-2 border-gray-100 hover:border-primary-200 rounded-xl hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="bg-primary-100 p-2 rounded-lg group-hover:bg-primary-200 transition-colors">
                      <FiPackage className="text-primary-600 text-lg md:text-xl" />
                    </div>
                    <div>
                      <span className="font-bold text-sm md:text-base text-gray-900">#{order.orderNumber}</span>
                    </div>
                  </div>
                  <span className={`px-2 md:px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>
                
                <p className="text-gray-700 font-medium mb-2 text-sm md:text-base line-clamp-1">
                  {order.type === 'smartCart' 
                    ? order.products && order.products.length > 0
                      ? `${order.products[0].name}${order.products.length > 1 ? ` + ${order.products.length - 1} منتج` : ''}`
                      : 'منتجات متعددة'
                    : order.product?.name || 'منتج غير محدد'}
                </p>
                
                <div className="flex items-center justify-between">
                  <p className="text-xs md:text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('ar-YE', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  {order.pricing && (
                    <p className="text-base md:text-lg font-bold text-primary-600">
                      {formatCurrency(order.pricing.totalInYER, 'YER')}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 md:py-16">
            <div className="bg-gray-100 w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiPackage className="text-4xl md:text-5xl text-gray-400" />
            </div>
            <p className="text-lg md:text-xl font-semibold text-gray-700 mb-2">لا توجد طلبات بعد</p>
            <p className="text-sm md:text-base text-gray-500 mb-6">ابدأ التسوق الآن واطلب منتجاتك المفضلة</p>
            <Link 
              to="/cart" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white font-bold px-6 md:px-8 py-3 md:py-4 rounded-xl shadow-lg hover:shadow-xl transition-all"
            >
              <FiShoppingBag className="text-lg md:text-xl" />
              ابدأ التسوق
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
