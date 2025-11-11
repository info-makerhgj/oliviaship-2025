import { useState } from 'react';
import { orderAPI } from '../../utils/api';
import { getStatusColor, getStatusText, formatCurrency, formatDate } from '../../utils/helpers';
import { useToast } from '../../contexts/ToastContext';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiMapPin, FiDollarSign, FiShoppingBag } from 'react-icons/fi';

export default function TrackingPage() {
  const { error: showError } = useToast();
  const [orderNumber, setOrderNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);

  const handleTrack = async (e) => {
    e?.preventDefault();
    if (!orderNumber.trim()) {
      showError('الرجاء إدخال رقم الطلب');
      return;
    }
    
    setLoading(true);
    try {
      const res = await orderAPI.track(orderNumber.trim());
      if (res.data.success && res.data.order) {
        setOrder(res.data.order);
      } else {
        showError('الطلب غير موجود');
        setOrder(null);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'الطلب غير موجود');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleTrack();
    }
  };

  // Get status steps for timeline
  const getStatusSteps = () => {
    // Check if order is from agent (has agent-related status)
    const isAgentOrder = order?.status?.startsWith('agent_');
    
    // Base steps for regular orders
    let steps = [
      { status: 'pending', label: 'قيد الانتظار', icon: FiClock },
      { status: 'confirmed', label: 'مؤكد', icon: FiCheckCircle },
      { status: 'processing', label: 'قيد المعالجة', icon: FiPackage },
      { status: 'purchased', label: 'تم الشراء', icon: FiShoppingBag },
      { status: 'shipped', label: 'تم الشحن', icon: FiTruck },
      { status: 'in_transit', label: 'في الطريق', icon: FiTruck },
    ];
    
    // Add point-specific step if delivery type is pickup_point
    if (order?.delivery?.type === 'pickup_point') {
      steps.push(
        { status: 'arrived', label: 'وصل إلى اليمن', icon: FiMapPin },
        { status: 'arrived_at_point', label: 'وصل لنقطة التسليم', icon: FiMapPin },
        { status: 'ready_for_pickup', label: 'جاهز للاستلام', icon: FiCheckCircle }
      );
    } else {
      steps.push(
        { status: 'arrived', label: 'وصل', icon: FiMapPin }
      );
    }
    
    // Add delivery step
    steps.push({ status: 'delivered', label: 'تم التسليم', icon: FiCheckCircle });
    
    // If agent order, add agent-specific statuses at the beginning
    if (isAgentOrder) {
      steps = [
        { status: 'agent_pending', label: 'قيد الانتظار (وكيل)', icon: FiClock },
        { status: 'agent_confirmed', label: 'مؤكد من الوكيل', icon: FiCheckCircle },
        { status: 'agent_processing', label: 'قيد المعالجة (وكيل)', icon: FiPackage },
        ...steps.slice(3), // Skip first 3 regular steps, add agent steps instead
      ];
    }
    
    const currentIndex = steps.findIndex(s => s.status === order?.status);
    return steps.map((step, index) => ({
      ...step,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FiPackage className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-400 to-pink-600 bg-clip-text text-transparent mb-2">تتبع الطلب</h1>
            <p className="text-gray-600">أدخل رقم الطلب لتتبع حالة طلبك</p>
          </div>

          {/* Search Form */}
          <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl shadow-lg p-6 mb-6 border-2 border-blue-200">
            <form onSubmit={handleTrack}>
              <label className="block mb-3 font-semibold bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent">رقم الطلب</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="YM12345678"
                  className="input-field flex-grow text-lg border-2 border-purple-200 focus:border-purple-400"
                  disabled={loading}
                />
                <button 
                  type="submit"
                  onClick={handleTrack} 
                  disabled={loading || !orderNumber.trim()} 
                  className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 font-medium px-6 py-3 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin">⏳</span>
                      جاري البحث...
                    </span>
                  ) : (
                    'تتبع'
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-2">💡 يمكنك العثور على رقم الطلب في رسالة تأكيد الطلب المرسلة إليك</p>
            </form>
          </div>

          {/* Order Details */}
          {order && (
            <div className="space-y-6">
              {/* Order Status Timeline */}
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl shadow-lg p-6 border-2 border-blue-200">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent">
                  <FiClock className="text-purple-500" />
                  حالة الطلب
                </h2>
                <div className="relative">
                  {getStatusSteps().map((step, index) => {
                    const Icon = step.icon;
                    const isLast = index === getStatusSteps().length - 1;
                    return (
                      <div key={step.status} className="relative flex items-start gap-4 mb-6 last:mb-0">
                        {/* Timeline Line */}
                        {!isLast && (
                          <div className={`absolute right-4 top-8 w-0.5 h-full ${step.completed ? 'bg-gradient-to-b from-blue-400 to-purple-400' : 'bg-gray-200'}`} />
                        )}
                        
                        {/* Icon */}
                        <div className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full shadow-md ${
                          step.completed 
                            ? 'bg-gradient-to-br from-blue-400 to-purple-400 text-white' 
                            : step.current
                            ? 'bg-purple-100 text-purple-500 border-2 border-purple-400'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <Icon className="text-lg" />
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 pt-1">
                          <div className={`font-semibold ${step.completed || step.current ? 'text-gray-900' : 'text-gray-400'}`}>
                            {step.label}
                          </div>
                          {step.current && (
                            <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                              {getStatusText(order.status)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Information */}
              <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-blue-100">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent">
                  <FiPackage className="text-blue-600" />
                  معلومات الطلب
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-500 mb-1">رقم الطلب</div>
                    <div className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent">{order.orderNumber}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">الحالة الحالية</div>
                    <div>
                      <span className={`inline-block px-4 py-2 rounded-full font-semibold ${getStatusColor(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Information - Single Product */}
              {order.product && !order.isCartOrder && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FiShoppingBag className="text-primary-dynamic" />
                    معلومات المنتج
                  </h2>
                  <div className="flex gap-6">
                    {order.product.image && (
                      <img
                        src={order.product.image}
                        alt={order.product.name || 'المنتج'}
                        className="w-24 h-24 object-cover rounded-lg"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <div className="flex-1">
                      <div className="font-bold text-lg text-gray-900 mb-2">
                        {order.product.name || 'منتج بدون اسم'}
                      </div>
                      {order.product.store && (
                        <div className="text-sm text-gray-600 mb-2">
                          المتجر: <span className="font-semibold">{order.product.store}</span>
                        </div>
                      )}
                      {order.product.price && (
                        <div className="text-sm text-gray-600">
                          السعر: <span className="font-semibold">{formatCurrency(order.product.price, order.product.currency || 'USD')}</span>
                        </div>
                      )}
                      {order.product.quantity > 1 && (
                        <div className="text-sm text-gray-600 mt-1">
                          الكمية: <span className="font-semibold">{order.product.quantity}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Products Information - Multiple Products (Cart Order) */}
              {order.products && order.isCartOrder && order.products.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FiShoppingBag className="text-primary-dynamic" />
                    المنتجات ({order.products.length})
                  </h2>
                  <div className="space-y-4">
                    {order.products.map((product, idx) => (
                      <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name || `منتج ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-bold text-gray-900 mb-1">
                            {product.name || `منتج ${idx + 1}`}
                          </div>
                          {product.store && (
                            <div className="text-sm text-gray-600 mb-1">
                              المتجر: <span className="font-semibold">{product.store}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            {product.price && (
                              <span className="text-gray-600">
                                السعر: <span className="font-semibold">{formatCurrency(product.price, product.currency || 'USD')}</span>
                              </span>
                            )}
                            {product.quantity > 1 && (
                              <span className="text-gray-600">
                                الكمية: <span className="font-semibold">{product.quantity}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pricing Information */}
              {order.pricing && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FiDollarSign className="text-primary-dynamic" />
                    معلومات السعر
                  </h2>
                  <div className="space-y-3">
                    {/* For SmartCartOrder, show subtotal; for Order, show productPrice */}
                    {(order.pricing.subtotal || order.pricing.productPrice) && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">سعر المنتجات:</span>
                        <span className="font-semibold">
                          {formatCurrency(order.pricing.subtotal || order.pricing.productPrice, order.pricing.currency || 'SAR')}
                        </span>
                      </div>
                    )}
                    {order.pricing.shippingCost > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">الشحن {order.isCartOrder ? '(موحد)' : ''}:</span>
                        <span className="font-semibold">
                          {formatCurrency(order.pricing.shippingCost, order.pricing.currency || 'SAR')}
                        </span>
                      </div>
                    )}
                    {order.pricing.commission > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">العمولة {order.isCartOrder ? '(موحدة)' : ''}:</span>
                        <span className="font-semibold">
                          {formatCurrency(order.pricing.commission, order.pricing.currency || 'SAR')}
                        </span>
                      </div>
                    )}
                    {order.pricing.customsFees > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">الجمارك:</span>
                        <span className="font-semibold">
                          {formatCurrency(order.pricing.customsFees, order.pricing.currency || 'SAR')}
                        </span>
                      </div>
                    )}
                    {/* Show total in SAR */}
                    {order.pricing.totalCost && (
                      <div className="flex justify-between pt-3 border-t-2 border-purple-200">
                        <span className="font-bold text-lg">الإجمالي (ريال سعودي):</span>
                        <span className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent">
                          {formatCurrency(order.pricing.totalCost, order.pricing.currency || 'SAR')}
                        </span>
                      </div>
                    )}
                    {/* Show exchange rate if available */}
                    {order.pricing.exchangeRate && (
                      <div className="text-xs text-gray-500 text-center pt-2">
                        سعر الصرف: 1 ريال سعودي = {order.pricing.exchangeRate} ريال يمني
                      </div>
                    )}
                    {/* Show total in YER */}
                    {order.pricing.totalInYER && (
                      <div className="flex justify-between pt-2 border-t border-gray-100">
                        <span className="text-gray-600 font-semibold">الإجمالي (ريال يمني):</span>
                        <span className="font-semibold">{formatCurrency(order.pricing.totalInYER, 'YER')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Delivery Information */}
              {order.delivery && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FiMapPin className="text-primary-dynamic" />
                    معلومات التوصيل
                  </h2>
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600">نوع التوصيل:</span>
                      <span className="font-semibold mr-2">
                        {order.delivery.type === 'home' ? 'توصيل إلى المنزل' : 'استلام من نقطة البيع'}
                      </span>
                    </div>
                    {order.delivery.address && (
                      <div>
                        <div className="text-gray-600 mb-1">العنوان:</div>
                        <div className="font-semibold">
                          {[
                            order.delivery.address.street,
                            order.delivery.address.city,
                            order.delivery.address.governorate,
                            order.delivery.address.country
                          ].filter(Boolean).join('، ')}
                        </div>
                      </div>
                    )}
                    {order.delivery.trackingNumber && (
                      <div>
                        <span className="text-gray-600">رقم التتبع:</span>
                        <span className="font-semibold mr-2">{order.delivery.trackingNumber}</span>
                      </div>
                    )}
                    {order.delivery.estimatedDelivery && (
                      <div>
                        <span className="text-gray-600">تاريخ التوصيل المتوقع:</span>
                        <span className="font-semibold mr-2">{formatDate(order.delivery.estimatedDelivery)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Status History */}
              {order.statusHistory && order.statusHistory.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">سجل الحالات</h2>
                  <div className="space-y-4">
                    {order.statusHistory
                      .slice()
                      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                      .map((statusItem, idx) => (
                        <div key={idx} className="flex items-start gap-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                          <div className="w-2 h-2 rounded-full bg-primary-dynamic mt-2" />
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{getStatusText(statusItem.status)}</div>
                            <div className="text-sm text-gray-500 mt-1">
                              {new Date(statusItem.timestamp).toLocaleDateString('ar-YE', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            {statusItem.note && (
                              <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-lg">
                                {statusItem.note}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
