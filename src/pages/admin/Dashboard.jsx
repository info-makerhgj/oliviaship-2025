import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { statsAPI, orderAPI, smartCartOrderAPI } from '../../utils/api';
import { FiPackage, FiUsers, FiDollarSign, FiTrendingUp, FiEye, FiLoader, FiArrowLeft } from 'react-icons/fi';
import { getStatusColor, getStatusText, formatDate, formatCurrency } from '../../utils/helpers';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({});
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsRes, ordersRes, smartCartOrdersRes] = await Promise.all([
        statsAPI.getDashboard().catch(() => ({ data: { stats: {} } })),
        orderAPI.getAll({ limit: 5 }).catch(() => ({ data: { orders: [] } })),
        smartCartOrderAPI.getAll().catch(() => ({ data: { orders: [] } })),
      ]);

      setStats(statsRes.data.stats || {});

      // Combine and sort by date
      const allOrders = [
        ...(ordersRes.data.orders || []).map(order => ({ ...order, type: 'regular' })),
        ...(smartCartOrdersRes.data.orders || []).map(order => ({ ...order, type: 'smartCart' })),
      ]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5); // Get only 5 most recent

      setRecentOrders(allOrders);
    } catch (error) {
      console.error('Failed to load data', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-bold mb-6 text-gradient">لوحة تحكم الإدارة</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-primary-700 font-medium mb-1">إجمالي الطلبات</p>
              <p className="text-xl font-bold text-primary-900">{stats.totalOrders || 0}</p>
            </div>
            <div className="bg-primary-200 p-3 rounded-xl">
              <FiPackage className="text-lg md:text-xl text-primary-700" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium mb-1">إجمالي العملاء</p>
              <p className="text-xl font-bold text-blue-900">{stats.totalUsers || 0}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <FiUsers className="text-lg md:text-xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 font-medium mb-1">المدفوعات</p>
              <p className="text-xl font-bold text-green-900">{stats.totalPayments || 0}</p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <FiDollarSign className="text-lg md:text-xl text-green-700" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-400 font-medium mb-1">طلبات هذا الشهر</p>
              <p className="text-xl font-bold text-purple-900">{stats.ordersThisMonth || 0}</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <FiTrendingUp className="text-lg md:text-xl text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">الطلبات الأخيرة</h2>
          <button
            onClick={() => navigate('/admin/orders')}
            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
          >
            عرض الكل
            <FiArrowLeft className="transform rotate-180" />
          </button>
        </div>

        {recentOrders.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-right py-3 px-4 font-bold text-gray-700">رقم الطلب</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-700">العميل</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-700">المنتج</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-700">الحالة</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-700">التاريخ</th>
                    <th className="text-right py-3 px-4 font-bold text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => {
                    const productName = order.type === 'smartCart' 
                      ? order.products && order.products.length > 0
                        ? `${order.products[0].name}${order.products.length > 1 ? ` + ${order.products.length - 1} منتج آخر` : ''}`
                        : 'منتجات متعددة'
                      : order.product?.name || 'منتج غير محدد';
                    
                    const productCount = order.type === 'smartCart'
                      ? order.products?.length || 0
                      : 1;

                    return (
                      <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-semibold text-primary-600">#{order.orderNumber}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-semibold">{order.user?.name || 'غير محدد'}</p>
                            {order.user?.email && (
                              <p className="text-xs text-gray-500">{order.user.email}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="max-w-xs">
                            <p className="truncate font-medium">{productName}</p>
                            {order.type === 'smartCart' && productCount > 1 && (
                              <p className="text-xs text-gray-500 mt-1">({productCount} منتج)</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-3 py-1.5 rounded-lg text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => navigate(`/dashboard/orders/${order._id}`)}
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

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-3">
              {recentOrders.map((order) => {
                const productName = order.type === 'smartCart' 
                  ? order.products && order.products.length > 0
                    ? `${order.products[0].name}${order.products.length > 1 ? ` + ${order.products.length - 1} منتج آخر` : ''}`
                    : 'منتجات متعددة'
                  : order.product?.name || 'منتج غير محدد';
                
                const productCount = order.type === 'smartCart'
                  ? order.products?.length || 0
                  : 1;

                const totalPrice = order.pricing?.totalInYER || order.pricing?.totalCost || 0;

                return (
                  <div key={order._id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-mono font-bold text-primary-600 mb-1">#{order.orderNumber}</p>
                        <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">العميل</p>
                      <p className="font-semibold">{order.user?.name || 'غير محدد'}</p>
                    </div>

                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-1">المنتج</p>
                      <p className="font-medium text-sm">{productName}</p>
                      {order.type === 'smartCart' && productCount > 1 && (
                        <p className="text-xs text-gray-500 mt-1">({productCount} منتج)</p>
                      )}
                    </div>

                    {totalPrice > 0 && (
                      <div className="mb-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">الإجمالي</p>
                        <p className="font-bold text-primary-600">{formatCurrency(totalPrice, 'YER')}</p>
                      </div>
                    )}

                    <button
                      onClick={() => navigate(`/dashboard/orders/${order._id}`)}
                      className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2"
                    >
                      <FiEye />
                      عرض التفاصيل
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <FiPackage className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">لا توجد طلبات حديثة</p>
          </div>
        )}
      </div>
    </div>
  );
}
