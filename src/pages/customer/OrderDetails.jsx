import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderAPI, smartCartOrderAPI, settingsAPI, posAPI } from '../../utils/api';
import { getStatusColor, getStatusText, formatDate, formatCurrency, getPlaceholderImage } from '../../utils/helpers';
import { FiArrowRight, FiPackage, FiDollarSign, FiTruck, FiFileText, FiLoader, FiExternalLink, FiCheckCircle, FiMapPin } from 'react-icons/fi';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import ToastNotification from '../../components/modals/ToastNotification';

export default function OrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(null);
  const [confirmingPickup, setConfirmingPickup] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'info' });

  useEffect(() => {
    loadOrder();
    loadSettings();
  }, [id]);

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setExchangeRate(res.data.settings?.pricing?.currencyRates?.SAR || 67);
    } catch (error) {
      console.error('Failed to load settings', error);
      setExchangeRate(67); // Default fallback
    }
  };

  const loadOrder = async () => {
    try {
      setLoading(true);
      // Try both APIs in parallel, first successful response wins
      const [regularRes, smartCartRes] = await Promise.allSettled([
        orderAPI.getOne(id),
        smartCartOrderAPI.getOne(id),
      ]);

      // Check regular order first
      if (regularRes.status === 'fulfilled' && regularRes.value?.data?.success && regularRes.value?.data?.order) {
        setOrder(regularRes.value.data.order);
        return;
      }

      // Check smart cart order
      if (smartCartRes.status === 'fulfilled' && smartCartRes.value?.data?.success && smartCartRes.value?.data?.order) {
        setOrder(smartCartRes.value.data.order);
        return;
      }

      // If both failed, order not found
      console.warn('Order not found:', id);
    } catch (error) {
      console.error('Failed to load order', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPickup = async () => {
    setShowConfirmModal(true);
  };

  const confirmPickupAction = async () => {
    setShowConfirmModal(false);
    setConfirmingPickup(true);
    try {
      // Determine order type
      const orderType = order.products ? 'smartCart' : 'regular';
      await posAPI.confirmPickup(order._id, orderType);
      setToast({ isOpen: true, message: '✅ تم تأكيد الاستلام بنجاح!', type: 'success' });
      await loadOrder(); // Reload order to update status
    } catch (error) {
      setToast({ isOpen: true, message: error.response?.data?.message || 'فشل في تأكيد الاستلام', type: 'error' });
    } finally {
      setConfirmingPickup(false);
    }
  };

  const handleDownloadInvoice = async () => {
    try {
      setToast({ isOpen: true, message: 'جاري تحميل الفاتورة...', type: 'info' });
      
      // Get token
      const authStorage = localStorage.getItem('auth-storage');
      const token = authStorage ? JSON.parse(authStorage).token : null;
      
      if (!token) {
        setToast({ isOpen: true, message: 'يرجى تسجيل الدخول أولاً', type: 'error' });
        return;
      }
      
      // Check if running in WebView (mobile app)
      const isWebView = /WebView|wv/.test(navigator.userAgent) || window.ReactNativeWebView;
      
      if (isWebView) {
        // For WebView, open PDF URL directly with token
        const baseUrl = window.location.origin;
        const pdfUrl = `${baseUrl}/api/invoices/order/${order._id}/download?token=${encodeURIComponent(token)}`;
        
        // Try to open in external browser if possible
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'OPEN_URL',
            url: pdfUrl
          }));
        } else {
          window.open(pdfUrl, '_system');
        }
        
        setToast({ isOpen: true, message: '✅ جاري فتح الفاتورة...', type: 'success' });
      } else {
        // For regular browser, download as before
        const response = await smartCartOrderAPI.downloadInvoice(order._id);
        
        // Create blob from response
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice_${order.orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        setToast({ isOpen: true, message: '✅ تم تحميل الفاتورة بنجاح!', type: 'success' });
      }
    } catch (error) {
      console.error('Download invoice error:', error);
      
      let errorMessage = 'فشل في تحميل الفاتورة';
      
      if (error.response?.status === 401) {
        errorMessage = 'يرجى تسجيل الدخول أولاً';
      } else if (error.response?.status === 404) {
        errorMessage = 'الفاتورة غير موجودة';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      setToast({ isOpen: true, message: errorMessage, type: 'error' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="animate-spin text-4xl text-primary-600" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="card text-center py-16">
        <p className="text-xl text-gray-600 mb-4">الطلب غير موجود</p>
        <button onClick={() => navigate('/dashboard/orders')} className="btn-primary">
          العودة للطلبات
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/dashboard/orders')}
          className="flex items-center gap-2 text-gray-600 hover:text-primary-600 mb-4"
        >
          <FiArrowRight className="transform rotate-180" />
          <span>العودة للطلبات</span>
        </button>
        <h1 className="text-xl font-bold mb-2 text-gradient">
          تفاصيل الطلب #{order.orderNumber}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Info - Single or Multiple */}
          {order.products && order.products.length > 0 ? (
            // Multiple Products (Smart Cart Order)
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary-100 p-3 rounded-xl">
                  <FiPackage className="text-primary-600 text-lg md:text-xl" />
                </div>
                <h2 className="text-base md:text-lg font-bold">المنتجات ({order.products.length})</h2>
              </div>
              <div className="space-y-3">
                {order.products.map((product, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex gap-3">
                      {/* Product Image - Small Square */}
                      {product.image && (
                        <div className="flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border border-gray-200"
                            onError={(e) => {
                              e.target.src = getPlaceholderImage(200, 200);
                            }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        {/* Product Name - Compact */}
                        <h3 
                          className="font-bold text-sm md:text-base mb-2 line-clamp-2 break-words" 
                          title={product.name}
                        >
                          {product.name}
                        </h3>

                        {/* Store & Price - Compact */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {product.store && (
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                              {product.store}
                            </span>
                          )}
                          <span className="text-gray-700 font-semibold text-xs md:text-sm">
                            {formatCurrency(product.price, product.currency)} / قطعة
                          </span>
                        </div>

                        {/* Product Details Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                          <div>
                            <span className="text-gray-500 block mb-0.5">الكمية:</span>
                            <span className="font-semibold">{product.quantity || 1}</span>
                          </div>
                          {product.color && (
                            <div>
                              <span className="text-gray-500 block mb-0.5">اللون:</span>
                              <span className="font-semibold">{product.color}</span>
                            </div>
                          )}
                          {product.size && (
                            <div>
                              <span className="text-gray-500 block mb-0.5">المقاس:</span>
                              <span className="font-semibold">{product.size}</span>
                            </div>
                          )}
                        </div>

                        {/* Notes/Specifications */}
                        {product.specifications && (
                          <div className="mb-2 p-2 bg-gray-50 rounded-lg">
                            <span className="text-gray-500 text-xs block mb-0.5">ملاحظات:</span>
                            <p className="text-xs text-gray-700">{product.specifications}</p>
                          </div>
                        )}

                        {/* Product Link */}
                        {product.url && (
                          <a
                            href={product.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline text-xs inline-flex items-center gap-1"
                          >
                            <FiExternalLink className="text-xs" />
                            عرض المنتج الأصلي
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Single Product (Regular Order)
            <div className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-primary-100 p-2 md:p-3 rounded-xl">
                  <FiPackage className="text-primary-600 text-xl md:text-2xl" />
                </div>
                <h2 className="text-base md:text-lg font-bold">معلومات المنتج</h2>
              </div>
              <div className="flex gap-3">
                {order.product?.image && (
                  <div className="flex-shrink-0">
                    <img
                      src={order.product.image}
                      alt={order.product.name}
                      className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg border border-gray-200"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x200?text=No+Image';
                      }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm md:text-base mb-2 line-clamp-2 break-words" title={order.product?.name}>
                    {order.product?.name}
                  </h3>
                  
                  {/* Store & Price */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    {order.product?.store && (
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                        {order.product.store}
                      </span>
                    )}
                    {order.product?.price && (
                      <span className="text-gray-700 font-semibold text-xs md:text-sm">
                        {formatCurrency(order.product.price, order.product.currency || 'SAR')} / قطعة
                      </span>
                    )}
                  </div>

                  {/* Product Details Grid */}
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div>
                      <span className="text-gray-500 block mb-0.5">الكمية:</span>
                      <span className="font-semibold">{order.product?.quantity || 1}</span>
                    </div>
                    {order.product?.color && (
                      <div>
                        <span className="text-gray-500 block mb-0.5">اللون:</span>
                        <span className="font-semibold">{order.product.color}</span>
                      </div>
                    )}
                    {order.product?.size && (
                      <div>
                        <span className="text-gray-500 block mb-0.5">المقاس:</span>
                        <span className="font-semibold">{order.product.size}</span>
                      </div>
                    )}
                  </div>

                  {/* Product Link */}
                  {order.product?.url && (
                    <a
                      href={order.product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline text-xs inline-flex items-center gap-1"
                    >
                      <FiExternalLink className="text-xs" />
                      عرض المنتج الأصلي
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Status Timeline */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <div className="card">
              <h2 className="text-base md:text-lg font-bold mb-4">سجل الحالات</h2>
              <div className="space-y-4">
                {order.statusHistory.map((statusItem, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${
                        idx === 0 ? 'bg-primary-600' : 'bg-gray-300'
                      }`}></div>
                      {idx < order.statusHistory.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(statusItem.status)}`}>
                          {getStatusText(statusItem.status)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatDate(statusItem.timestamp)}
                        </span>
                      </div>
                      {statusItem.note && (
                        <p className="text-gray-600 text-sm">{statusItem.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Status */}
          <div className="card bg-gradient-to-br from-primary-50 to-secondary-50">
            <h3 className="font-bold mb-4">الحالة الحالية</h3>
            <span className={`inline-block px-3 py-1.5 rounded-xl text-sm md:text-base font-semibold ${getStatusColor(order.status)}`}>
              {getStatusText(order.status)}
            </span>
          </div>

          {/* Pricing */}
          {order.pricing && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-green-100 p-3 rounded-xl">
                  <FiDollarSign className="text-green-600 text-lg md:text-xl" />
                </div>
                <h3 className="text-base md:text-lg font-bold">ملخص التكلفة</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between py-1.5 text-sm border-b border-gray-200">
                  <span className="text-gray-600">{order.products ? 'سعر المنتجات' : 'سعر المنتج'}</span>
                  <span className="font-medium">{formatCurrency(order.pricing.productPrice || order.pricing.subtotal || 0, 'SAR')}</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm border-b border-gray-200">
                  <span className="text-gray-600">الشحن {order.products && '(موحد)'}</span>
                  <span className="font-medium">{formatCurrency(order.pricing.shippingCost || 0, 'SAR')}</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm border-b border-gray-200">
                  <span className="text-gray-600">العمولة {order.products && '(موحدة)'}</span>
                  <span className="font-medium">{formatCurrency(order.pricing.commission || 0, 'SAR')}</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm border-b border-gray-200">
                  <span className="text-gray-600">الجمارك</span>
                  <span className="font-medium">{formatCurrency(order.pricing.customsFees || 0, 'SAR')}</span>
                </div>
                {order.pricing.totalDiscount > 0 && (
                  <div className="flex justify-between py-1.5 text-sm border-b border-gray-200">
                    <span className="text-green-600">الخصم</span>
                    <span className="font-medium text-green-600">-{formatCurrency(order.pricing.totalDiscount, 'SAR')}</span>
                  </div>
                )}
                
                {/* Total Section */}
                <div className="py-3 pt-3 border-t-2 border-primary-300 space-y-2">
                  {/* Total in SAR */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-700">الإجمالي (ريال سعودي):</span>
                    <span className="text-base md:text-lg font-bold text-primary-600">
                      {formatCurrency(order.pricing.totalCost || 0, 'SAR')}
                    </span>
                  </div>
                  
                  {/* Exchange Rate Info */}
                  {exchangeRate && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-600 text-center">
                      <span className="font-medium">سعر الصرف:</span> 1 ريال سعودي = {exchangeRate} ريال يمني
                    </div>
                  )}
                  
                  {/* Total in YER */}
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-sm font-semibold text-gray-700">الإجمالي (ريال يمني):</span>
                    <span className="text-base md:text-lg font-bold text-green-600">
                      {formatCurrency(order.pricing.totalInYER || 0, 'YER')}
                    </span>
                  </div>
                </div>

                {/* Download Invoice Button */}
                {(order.payment?.status === 'paid' || order.status === 'confirmed' || order.status === 'processing' || order.status === 'purchased') && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={handleDownloadInvoice}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <FiFileText className="text-lg" />
                      تحميل الفاتورة
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delivery */}
          {order.delivery && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-blue-100 p-3 rounded-xl">
                  {order.delivery.type === 'pickup_point' ? (
                    <FiMapPin className="text-blue-600 text-lg md:text-xl" />
                  ) : (
                    <FiTruck className="text-blue-600 text-lg md:text-xl" />
                  )}
                </div>
                <h3 className="text-base md:text-lg font-bold">معلومات التوصيل</h3>
              </div>
              
              {order.delivery.type === 'pickup_point' ? (
                <div className="space-y-4">
                  {order.delivery.pickupPoint && (
                    <>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <FiMapPin className="text-blue-600 text-xl mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="font-bold text-blue-900 mb-1">
                              {typeof order.delivery.pickupPoint === 'object' 
                                ? order.delivery.pickupPoint.name 
                                : 'نقطة الاستلام'}
                            </p>
                            {typeof order.delivery.pickupPoint === 'object' && (
                              <>
                                <p className="text-sm text-blue-600 mb-1">
                                  {order.delivery.pickupPoint.location?.address}
                                </p>
                                <p className="text-sm text-blue-600">
                                  {order.delivery.pickupPoint.location?.city}
                                </p>
                                {order.delivery.pickupPoint.contact?.phone && (
                                  <p className="text-sm text-blue-600 mt-2">
                                    الهاتف: {order.delivery.pickupPoint.contact.phone}
                                  </p>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Map - Only show if order is ready for pickup and point has coordinates */}
                      {order.delivery.readyForPickup && 
                       typeof order.delivery.pickupPoint === 'object' && 
                       order.delivery.pickupPoint.location?.coordinates && (
                        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                            <p className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              <FiMapPin className="text-primary-600" />
                              موقع النقطة على الخريطة
                            </p>
                          </div>
                          <div className="relative w-full" style={{ height: '300px' }}>
                            <iframe
                              width="100%"
                              height="100%"
                              style={{ border: 0 }}
                              loading="lazy"
                              allowFullScreen
                              referrerPolicy="no-referrer-when-downgrade"
                              src={`https://www.google.com/maps?q=${order.delivery.pickupPoint.location.coordinates.latitude},${order.delivery.pickupPoint.location.coordinates.longitude}&output=embed&zoom=15`}
                            >
                            </iframe>
                          </div>
                          <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${order.delivery.pickupPoint.location.coordinates.latitude},${order.delivery.pickupPoint.location.coordinates.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                            >
                              <FiExternalLink className="text-xs" />
                              فتح في خرائط Google
                            </a>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {order.delivery.readyForPickup && !order.delivery.pickedUpAt && (
                    <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <FiCheckCircle className="text-green-600 text-2xl" />
                        <div>
                          <p className="font-bold text-green-900 mb-1">✓ الطلب جاهز للاستلام</p>
                          <p className="text-sm text-green-700">
                            يمكنك الآن التوجه إلى النقطة واستلام طلبك
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleConfirmPickup}
                        disabled={confirmingPickup}
                        className="w-full btn-primary py-3 font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {confirmingPickup ? (
                          <>
                            <FiLoader className="animate-spin" />
                            جاري التأكيد...
                          </>
                        ) : (
                          <>
                            <FiCheckCircle className="text-xl" />
                            تأكيد الاستلام
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {order.delivery.pickedUpAt && (
                    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <FiCheckCircle className="text-gray-600 text-xl" />
                        <div>
                          <p className="font-bold text-gray-900">✓ تم الاستلام</p>
                          <p className="text-sm text-gray-600">
                            {formatDate(order.delivery.pickedUpAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {order.delivery.address && (
                    <div className="space-y-2 text-gray-700">
                      <p>{order.delivery.address.street}</p>
                      <p>{order.delivery.address.city}, {order.delivery.address.governorate}</p>
                      <p>{order.delivery.address.country}</p>
                    </div>
                  )}
                  {order.delivery.trackingNumber && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-500 mb-1">رقم التتبع</p>
                      <p className="font-bold">{order.delivery.trackingNumber}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmPickupAction}
        title="تأكيد الاستلام"
        message="هل أنت متأكد أنك استلمت الطلب من النقطة؟"
        type="info"
        confirmText="موافق"
        cancelText="إلغاء"
        loading={confirmingPickup}
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
