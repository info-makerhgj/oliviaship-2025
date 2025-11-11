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
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-2 text-gradient">مرحباً بك!</h1>
        <p className="text-gray-600 text-sm">إليك ملخص طلباتك وإحصائياتك</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-2 md:p-3 rounded-xl">
              <FiPackage className="text-xl md:text-2xl" />
            </div>
          </div>
          <div className="text-lg md:text-xl font-bold mb-1">{stats.total || 0}</div>
          <div className="text-primary-100 text-xs">إجمالي الطلبات</div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-400 to-yellow-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-2 md:p-3 rounded-xl">
              <FiClock className="text-xl md:text-2xl" />
            </div>
          </div>
          <div className="text-lg md:text-xl font-bold mb-1">{stats.pending || 0}</div>
          <div className="text-yellow-100 text-xs">قيد الانتظار</div>
        </div>

        <div className="card bg-gradient-to-br from-blue-500 to-blue-700 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-2 md:p-3 rounded-xl">
              <FiTrendingUp className="text-xl md:text-2xl" />
            </div>
          </div>
          <div className="text-lg md:text-xl font-bold mb-1">{stats.processing || 0}</div>
          <div className="text-blue-100 text-xs">قيد التنفيذ</div>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="bg-white bg-opacity-20 p-2 md:p-3 rounded-xl">
              <FiCheckCircle className="text-xl md:text-2xl" />
            </div>
          </div>
          <div className="text-lg md:text-xl font-bold mb-1">{stats.delivered || 0}</div>
          <div className="text-green-100 text-xs">مكتملة</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link
          to="/order"
          className="card-hover p-6 flex items-center gap-4 group"
        >
          <div className="bg-primary-100 group-hover:bg-primary-200 p-4 rounded-xl transition-colors">
            <FiShoppingBag className="text-primary-600 text-2xl" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">طلب منتج جديد</h3>
            <p className="text-gray-600 text-xs">اطلب منتجاتك من المتاجر العالمية</p>
          </div>
        </Link>

        <Link
          to="/dashboard/orders"
          className="card-hover p-6 flex items-center gap-4 group"
        >
          <div className="bg-blue-100 group-hover:bg-blue-200 p-4 rounded-xl transition-colors">
            <FiPackage className="text-blue-600 text-2xl" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm mb-1">عرض جميع الطلبات</h3>
            <p className="text-gray-600 text-xs">شاهد ومتابع جميع طلباتك</p>
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">الطلبات الأخيرة</h2>
          <Link to="/dashboard/orders" className="text-primary-600 hover:underline text-sm font-medium">
            عرض الكل
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="space-y-4">
            {recentOrders.map((order) => (
              <Link
                key={order._id}
                to={`/dashboard/orders/${order._id}`}
                className="block p-4 border border-gray-200 rounded-xl hover:shadow-lg hover:border-primary-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-primary-600">#{order.orderNumber}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                    <p className="text-gray-700 font-medium mb-1 text-sm">
                      {order.type === 'smartCart' 
                        ? order.products && order.products.length > 0
                          ? `${order.products[0].name}${order.products.length > 1 ? ` + ${order.products.length - 1} منتج آخر` : ''}`
                          : 'منتجات متعددة'
                        : order.product?.name || 'منتج غير محدد'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('ar-YE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  {order.pricing && (
                    <div className="text-left sm:text-right">
                      <p className="text-lg font-bold text-primary-600">
                        {formatCurrency(order.pricing.totalInYER, 'YER')}
                      </p>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <FiPackage className="text-6xl text-gray-300 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-4">لا توجد طلبات بعد</p>
            <Link to="/order" className="btn-primary inline-flex items-center gap-2">
              <FiShoppingBag />
              طلب منتج الآن
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
