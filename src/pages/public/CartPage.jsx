import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartAPI, productAPI, settingsAPI, walletAPI, posAPI, couponAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency } from '../../utils/helpers';
import CartItemCard from '../../components/CartItemCard';
import LoadingSkeleton from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { 
  FiShoppingCart, 
  FiLoader, 
  FiAlertCircle,
  FiCheck,
  FiShoppingBag,
  FiCreditCard,
  FiTruck,
  FiPlus,
  FiDollarSign,
  FiMapPin,
  FiHome,
  FiX,
  FiTag
} from 'react-icons/fi';

export default function CartPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const { success: showSuccess, error: showError, warning: showWarning, info: showInfo } = useToast();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchingUrl, setFetchingUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [fetchMessage, setFetchMessage] = useState('');
  const [totalPricing, setTotalPricing] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [settings, setSettings] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [walletLoading, setWalletLoading] = useState(false);
  const [deliveryType, setDeliveryType] = useState('home'); // 'home' or 'pickup_point'
  const [selectedPickupPoint, setSelectedPickupPoint] = useState(null);
  const [nearbyPoints, setNearbyPoints] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [showPickupPointsModal, setShowPickupPointsModal] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [appliedCoupons, setAppliedCoupons] = useState([]);
  const [supportedStores, setSupportedStores] = useState([]);
  const [mobileOffers, setMobileOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showOfferModal, setShowOfferModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
      loadSettings();
      loadWallet();
      getCurrentLocation();
    }
    loadStores(); // Load stores even if not authenticated
  }, [isAuthenticated]);

  const loadStores = async () => {
    try {
      const res = await settingsAPI.get();
      const stores = (res.data.settings?.supportedStores || [])
        .filter(store => store.enabled)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setSupportedStores(stores);
      
      // Load mobile offers
      const offers = (res.data.settings?.mobileOffers || [])
        .filter(offer => offer.enabled && offer.image && offer.couponCode)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      console.log('Mobile Offers loaded:', offers);
      setMobileOffers(offers);
    } catch (error) {
      console.error('Failed to load stores', error);
    }
  };

  useEffect(() => {
    if (cart && cart.coupons) {
      setAppliedCoupons(cart.coupons);
    }
  }, [cart]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location access denied or error:', error);
        }
      );
    }
  };

  useEffect(() => {
    if (deliveryType === 'pickup_point' && userLocation && nearbyPoints.length === 0) {
      loadNearbyPoints();
    }
  }, [deliveryType, userLocation]);

  const loadNearbyPoints = async () => {
    if (!userLocation) {
      showWarning('يرجى السماح بالوصول إلى موقعك لتحديد أقرب نقطة');
      getCurrentLocation();
      return;
    }

    setLoadingPoints(true);
    try {
      const res = await posAPI.getNearestPoints({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        type: 'pickup',
        maxDistance: 50,
      });
      setNearbyPoints(res.data.points || []);
      if (res.data.points && res.data.points.length > 0 && !selectedPickupPoint) {
        setSelectedPickupPoint(res.data.points[0]);
      }
    } catch (error) {
      console.error('Failed to load nearby points', error);
    } finally {
      setLoadingPoints(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setSettings(res.data.settings);
      // Set default payment method based on what's enabled
      if (res.data.settings?.payment?.cashOnDeliveryEnabled) {
        setPaymentMethod('cash_on_delivery');
      } else if (res.data.settings?.payment?.stripeEnabled) {
        setPaymentMethod('stripe');
      }
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  };

  const loadWallet = async () => {
    try {
      setWalletLoading(true);
      const res = await walletAPI.get();
      setWallet(res.data.wallet);
    } catch (error) {
      console.error('Failed to load wallet', error);
      // Wallet might not exist for old users, that's OK
    } finally {
      setWalletLoading(false);
    }
  };

  useEffect(() => {
    if (cart && cart.items.length > 0 && settings) {
      calculateTotalPricing();
    }
  }, [cart, settings]);

  const loadCart = async () => {
    try {
      const res = await cartAPI.get();
      setCart(res.data.cart);
    } catch (error) {
      console.error('Failed to load cart', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPricing = async () => {
    if (!cart || cart.items.length === 0) {
      setTotalPricing(null);
      return;
    }
    
    setCalculating(true);
    try {
      // Use new cart pricing endpoint that calculates by store
      const pricingRes = await cartAPI.getPricing();
      
      if (pricingRes.data.success && pricingRes.data.pricing) {
        const finalPricing = pricingRes.data.pricing;
        
        // Get exchange rate from settings
        const exchangeRate = settings?.pricing?.currencyRates?.SAR || 67;
        finalPricing.exchangeRate = exchangeRate; // Store exchange rate for display

        setTotalPricing(finalPricing);
      } else {
        setTotalPricing(null);
      }
    } catch (error) {
      console.error('Failed to calculate pricing', error);
      setTotalPricing(null);
    } finally {
      setCalculating(false);
    }
  };

  const handleFetchAndAdd = async () => {
    if (!fetchingUrl.trim()) {
      setFetchError('يرجى إدخال رابط المنتج');
      return;
    }

    setFetching(true);
    setFetchError('');
    setFetchSuccess(false);
    setFetchMessage('');
    
    try {
      const res = await cartAPI.fetchAndAdd({
        url: fetchingUrl.trim(),
        quantity: 1,
      });
      
      if (res.data.success) {
        setFetchSuccess(true);
        setFetchMessage(res.data.message || 'تم إضافة المنتج بنجاح');
        setFetchingUrl('');
        setCart(res.data.cart);
        
        // Recalculate pricing will be triggered by useEffect
        setTimeout(() => {
          setFetchSuccess(false);
          setFetchMessage('');
        }, 3000);
      } else {
        // عرض رسالة الخطأ مع التفاصيل والاقتراحات إن وجدت
        let errorMsg = res.data.message || res.data.error || 'فشل في جلب المنتج';
        if (res.data.details) {
          errorMsg += '\n' + res.data.details;
        }
        if (res.data.suggestion) {
          errorMsg += '\n' + res.data.suggestion;
        }
        setFetchError(errorMsg);
      }
    } catch (error) {
      // Better error handling
      let errorMessage = 'فشل في جلب المنتج';
      
      if (error.isNetworkError) {
        errorMessage = error.message || 'فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
        if (error.response.data.details) {
          errorMessage += '\n' + error.response.data.details;
        }
        if (error.response.data.suggestion) {
          errorMessage += '\n' + error.response.data.suggestion;
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
        if (error.response.data.details) {
          errorMessage += '\n' + error.response.data.details;
        }
        if (error.response.data.suggestion) {
          errorMessage += '\n' + error.response.data.suggestion;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setFetchError(errorMessage);
      console.error('Fetch product error:', {
        error,
        message: errorMessage,
        response: error.response?.data,
      });
    } finally {
      setFetching(false);
    }
  };

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      await cartAPI.updateQuantity(itemId, newQuantity);
      const res = await cartAPI.get();
      setCart(res.data.cart);
      // Recalculate pricing will be triggered by useEffect
    } catch (error) {
      console.error('Failed to update quantity', error);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      await cartAPI.removeItem(itemId);
      const res = await cartAPI.get();
      setCart(res.data.cart);
      // Recalculate pricing will be triggered by useEffect
    } catch (error) {
      console.error('Failed to remove item', error);
    }
  };

  const handleUpdateOptions = async (itemId, options) => {
    try {
      await cartAPI.updateOptions(itemId, options);
      const res = await cartAPI.get();
      setCart(res.data.cart);
    } catch (error) {
      console.error('Failed to update options', error);
    }
  };

  const handleCheckout = async () => {
    if (!cart || cart.items.length === 0 || !totalPricing) return;
    
    setCheckingOut(true);
    try {
      // If Stripe is selected, create Stripe checkout session WITHOUT creating order
      // Order will be created only after successful payment via webhook
      if (paymentMethod === 'stripe' && settings?.payment?.stripeEnabled) {
        try {
          // Import stripe API
          const { default: api } = await import('../../utils/api');
          const stripeRes = await api.post('/stripe/create-checkout-session', {
            amount: totalPricing.totalCost, // Amount in SAR
            cartId: cart._id, // Send cart ID instead of order ID
          });

          if (stripeRes.data.success && stripeRes.data.url) {
            // Redirect to Stripe checkout - DON'T clear cart yet
            window.location.href = stripeRes.data.url;
            return;
          }
        } catch (error) {
          console.error('Stripe error:', error);
          showError(error.response?.data?.message || 'فشل في إنشاء جلسة الدفع');
          setCheckingOut(false);
          return;
        }
      }

      // If Cash Pay is selected, create order and payment request together
      // Similar to Stripe - order will be created via webhook after payment
      if (paymentMethod === 'cash_pay' && settings?.payment?.cashPayEnabled) {
        try {
          // Validate pickup point selection first
          if (deliveryType === 'pickup_point' && !selectedPickupPoint) {
            showWarning('يرجى اختيار نقطة الاستلام');
            setCheckingOut(false);
            return;
          }

          // Prepare delivery data
          const deliveryData = {
            type: deliveryType,
            ...(deliveryType === 'pickup_point' && selectedPickupPoint && {
              pickupPoint: selectedPickupPoint._id,
            }),
          };

          // Create order first (pending payment status)
          const orderRes = await cartAPI.checkout({
            delivery: deliveryData,
            paymentMethod: 'cash_pay',
          });

          if (!orderRes.data.success) {
            throw new Error(orderRes.data.message || 'فشل في إنشاء الطلب');
          }

          const orderId = orderRes.data.orderId || orderRes.data.order?._id;

          // Create Cash Pay payment request
          const { cashPayAPI } = await import('../../utils/api');
          const cashPayRes = await cashPayAPI.createPayment({
            orderId: null, // Cash Pay uses SmartCartOrder
            smartCartOrderId: orderId,
          });

          if (cashPayRes.data.success && cashPayRes.data.paymentUrl) {
            // Redirect to Cash Pay payment page
            // Order will remain pending until payment is confirmed via webhook/callback
            window.location.href = cashPayRes.data.paymentUrl;
            return;
          } else {
            // Payment creation failed - delete the order or mark it as cancelled
            throw new Error(cashPayRes.data.message || 'فشل في إنشاء رابط الدفع');
          }
        } catch (error) {
          console.error('Cash Pay error:', error);
          const errorMessage = error.response?.data?.message || error.message || 'فشل في إنشاء جلسة الدفع';
          
          // Try to delete the order if it was created
          try {
            const orderId = error.response?.data?.orderId || null;
            if (orderId) {
              // Optionally delete or cancel the order
              console.warn('Order created but payment failed, orderId:', orderId);
            }
          } catch (cleanupError) {
            console.error('Failed to cleanup order:', cleanupError);
          }
          
          showError(errorMessage);
          setCheckingOut(false);
          return;
        }
      }

      // Validate pickup point selection
      if (deliveryType === 'pickup_point' && !selectedPickupPoint) {
        showWarning('يرجى اختيار نقطة الاستلام');
        setCheckingOut(false);
        return;
      }

      // Prepare delivery data
      const deliveryData = {
        type: deliveryType,
        ...(deliveryType === 'pickup_point' && selectedPickupPoint && {
          pickupPoint: selectedPickupPoint._id,
        }),
      };

      // For cash on delivery or wallet, create order directly
      const res = await cartAPI.checkout({
        delivery: deliveryData,
        paymentMethod: paymentMethod,
      });
      
      if (!res.data.success) {
        throw new Error(res.data.message || 'فشل في إنشاء الطلب');
      }

      const orderId = res.data.orderId || res.data.order?._id;
      
      // Reload wallet if payment was from wallet
      if (paymentMethod === 'wallet' && res.data.wallet) {
        setWallet(res.data.wallet);
        const amount = res.data.order?.pricing?.totalCost || res.data.wallet?.balance || 0;
        showSuccess(`✅ تم إنشاء الطلب بنجاح! تم خصم ${formatCurrency(amount, 'SAR')} من المحفظة.\nالرصيد المتبقي: ${formatCurrency(res.data.wallet.balance, res.data.wallet.currency)}`);
      } else {
        showSuccess('✅ تم إنشاء الطلب بنجاح!');
      }
      
      navigate(`/dashboard/orders/${orderId}`);
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في إنشاء الطلب');
    } finally {
      setCheckingOut(false);
    }
  };

  // Check for payment status on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const sessionId = params.get('session_id');
    const paymentId = params.get('paymentId');
    const transactionId = params.get('transactionId');
    
    // Stripe callback
    if (paymentStatus === 'cancelled') {
      showWarning('تم إلغاء عملية الدفع. المنتجات لا تزال في السلة.');
      window.history.replaceState({}, '', '/cart');
    } else if (paymentStatus === 'success' && sessionId) {
      // Verify Stripe payment was successful
      verifyPayment(sessionId);
    }
    
    // Cash Pay callback
    if (paymentId) {
      verifyCashPayPayment(paymentId);
    } else if (transactionId) {
      // If callback from Cash Pay but no paymentId, redirect to orders
      showInfo('جارٍ التحقق من حالة الدفع...');
      navigate('/dashboard/orders');
      window.history.replaceState({}, '', '/cart');
    }
  }, []);

  const verifyPayment = async (sessionId) => {
    try {
      const { stripeAPI } = await import('../../utils/api');
      const res = await stripeAPI.verifySession(sessionId);
      
      if (res.data.success && res.data.paid && res.data.orderId) {
        // Payment successful, order created
        showSuccess('✅ تم الدفع بنجاح! تم إنشاء الطلب.');
        // Reload cart (should be empty now)
        await loadCart();
        // Navigate to orders page
        navigate(`/dashboard/orders/${res.data.orderId}`);
      } else {
        // Payment might be pending or failed
        showInfo('جارٍ التحقق من حالة الدفع... يرجى التحقق من الطلبات لاحقاً.');
        await loadCart();
      }
      
      // Clean URL
      window.history.replaceState({}, '', '/cart');
    } catch (error) {
      console.error('Failed to verify payment:', error);
      showWarning('تم إعادة توجيهك. يرجى التحقق من الطلبات.');
      await loadCart();
      window.history.replaceState({}, '', '/cart');
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      showError('يرجى إدخال كود الكوبون');
      return;
    }

    setApplyingCoupon(true);
    try {
      await couponAPI.apply(couponCode.trim());
      showSuccess('تم تطبيق الكوبون بنجاح');
      setCouponCode('');
      await loadCart();
      await calculateTotalPricing();
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في تطبيق الكوبون');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const verifyCashPayPayment = async (paymentId) => {
    try {
      const { cashPayAPI } = await import('../../utils/api');
      const res = await cashPayAPI.verifyPayment(paymentId);
      
      if (res.data.success && res.data.payment?.status === 'paid') {
        // Payment successful
        showSuccess('✅ تم الدفع بنجاح عبر Cash Pay! تم تأكيد الطلب.');
        await loadCart();
        if (res.data.payment?.order || res.data.payment?.smartCartOrder) {
          const orderId = res.data.payment.order || res.data.payment.smartCartOrder;
          navigate(`/dashboard/orders/${orderId}`);
        } else {
          navigate('/dashboard/orders');
        }
      } else {
        // Payment might be pending or failed
        showInfo('جارٍ التحقق من حالة الدفع... يرجى التحقق من الطلبات لاحقاً.');
        await loadCart();
        navigate('/dashboard/orders');
      }
      
      // Clean URL
      window.history.replaceState({}, '', '/cart');
    } catch (error) {
      console.error('Failed to verify Cash Pay payment:', error);
      showWarning('تم إعادة توجيهك. يرجى التحقق من الطلبات.');
      await loadCart();
      navigate('/dashboard/orders');
      window.history.replaceState({}, '', '/cart');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 flex items-center justify-center px-4 py-12 min-h-[60vh]">
        <div className="card text-center max-w-md">
          <FiShoppingCart className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
          <p className="text-sm md:text-base text-gray-600 mb-4">يجب تسجيل الدخول لعرض السلة</p>
          <button onClick={() => navigate('/login')} className="btn-primary">
            تسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 flex items-center justify-center py-12 min-h-[60vh]">
        <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 py-4 sm:py-6 md:py-8 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto pb-4">
          {/* Supported Stores Slider */}
          <div className="mb-4 sm:mb-6">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 pb-2">
                {supportedStores.map((store) => (
                  <a
                    key={store._id || store.name}
                    href={store.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-shrink-0 flex flex-col items-center gap-2 p-3 rounded-xl border-2 bg-white border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 hover:scale-105 min-w-[70px]"
                  >
                    {store.icon ? (
                      <img src={store.icon} alt={store.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <div className="text-2xl">🛍️</div>
                    )}
                    <span className="text-xs font-medium text-gray-700 text-center">{store.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile Offers Slider */}
          {mobileOffers && mobileOffers.length > 0 && (
            <div className="mb-4 sm:mb-6">
              <h3 className="text-sm font-bold text-gray-700 mb-3">🎁 عروض وأكواد خصم حصرية</h3>
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 pb-2">
                  {mobileOffers.map((offer, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedOffer(offer);
                        setShowOfferModal(true);
                      }}
                      className="flex-shrink-0 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 border-2 border-blue-200 hover:border-purple-300"
                    >
                      <img
                        src={offer.image}
                        alt="عرض خاص"
                        className="w-40 h-40 object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Cart Items & Fetch */}
            <div className="lg:col-span-2 space-y-6">
              {/* Fetch Product Section */}
              <div className="card bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 p-3 sm:p-4 md:p-6">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <div className="bg-gradient-to-br from-blue-400 to-purple-400 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl shadow-md">
                    <FiShoppingBag className="text-white text-base sm:text-lg md:text-xl" />
                  </div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent">جلب منتج جديد</h2>
                </div>
                
              {/* Fetch Product Section */}
              <div className="flex gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                <input
                  type="url"
                  value={fetchingUrl}
                  onChange={(e) => {
                    setFetchingUrl(e.target.value);
                    setFetchError('');
                  }}
                  placeholder="الصق رابط المنتج هنا..."
                  className="input-field flex-grow text-sm sm:text-base py-2 sm:py-2.5 px-3"
                  onKeyPress={(e) => e.key === 'Enter' && handleFetchAndAdd()}
                />
                <button
                  onClick={handleFetchAndAdd}
                  disabled={fetching}
                  className="btn-primary whitespace-nowrap flex items-center justify-center gap-1.5 sm:gap-2 disabled:opacity-50 text-xs sm:text-sm md:text-base py-2 sm:py-2.5 px-3 sm:px-4"
                >
                  {fetching ? (
                    <>
                      <FiLoader className="animate-spin text-sm" />
                      <span className="hidden sm:inline">جاري الجلب...</span>
                    </>
                  ) : (
                    <>
                      <FiPlus className="text-sm" />
                      <span>إضافة</span>
                    </>
                  )}
                </button>
              </div>
                
                {fetchError && (
                  <div className="p-3 bg-red-50 border-2 border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-sm animate-pulse shadow-sm">
                    <FiAlertCircle className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="whitespace-pre-line">
                        {fetchError.split('\n').map((line, idx) => (
                          <p key={idx} className={idx === 0 ? 'font-medium' : idx === 1 ? 'mt-1' : 'mt-0.5 text-xs'}>
                            {line}
                          </p>
                        ))}
                      </div>
                      {(fetchError.includes('الاتصال') || fetchError.includes('الخادم')) && (
                        <p className="text-xs mt-1 text-red-600">تأكد من أن السيرفر يعمل وأنك متصل بالإنترنت</p>
                      )}
                    </div>
                  </div>
                )}

                {fetchSuccess && fetchMessage && (
                  <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm animate-fade-in shadow-sm">
                    <FiCheck className="flex-shrink-0" />
                    <span>{fetchMessage}</span>
                  </div>
                )}

                <p className="text-[10px] sm:text-xs text-gray-500 mt-2 sm:mt-3">
                  يمكنك إضافة منتجات من Amazon, Noon, SHEIN, AliExpress, Temu, iHerb, Nice One, Namshi, Trendyol
                </p>
              </div>

              {/* Cart Items */}
              {cart && cart.items.length > 0 ? (
                <div className="space-y-4">
                  {cart.items.map((item) => (
                    <CartItemCard 
                      key={item._id} 
                      item={item}
                      onUpdateQuantity={(newQuantity) => handleUpdateQuantity(item._id, newQuantity)}
                      onRemove={() => handleRemoveItem(item._id)}
                      onUpdateOptions={(options) => handleUpdateOptions(item._id, options)}
                    />
                  ))}
                </div>
              ) : (
                <div className="card text-center py-16">
                  <FiShoppingCart className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
                  <p className="text-sm md:text-base text-gray-600 mb-4">السلة فارغة</p>
                  <p className="text-gray-500 mb-4">استخدم القسم أعلاه لجلب منتجات جديدة</p>
                  <button onClick={() => navigate('/order')} className="btn-primary inline-flex items-center justify-center gap-2">
                    <FiShoppingBag />
                    طلب منتج جديد
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Summary */}
            {cart && cart.items.length > 0 && (
              <div className="lg:col-span-1">
                <div className="card bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200 sticky top-4 shadow-xl">
                  <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent">ملخص الطلب</h3>
                  
                  {calculating ? (
                    <div className="flex items-center justify-center py-8">
                      <FiLoader className="animate-spin text-lg md:text-xl text-primary-600" />
                    </div>
                  ) : totalPricing ? (
                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                        <span className="text-gray-600">سعر المنتجات:</span>
                        <span className="font-medium">{formatCurrency(totalPricing.productPrice, 'SAR')}</span>
                      </div>
                      {/* Store Breakdown - Show shipping details per store */}
                      {totalPricing.storeBreakdown && totalPricing.storeBreakdown.length > 0 && (
                        <div className="space-y-2 mb-3">
                          {totalPricing.storeBreakdown.map((storeInfo, idx) => {
                            const storeNames = {
                              shein: 'Shein',
                              amazon: 'Amazon',
                              noon: 'Noon',
                              aliexpress: 'AliExpress',
                              temu: 'Temu',
                              iherb: 'iHerb',
                              niceonesa: 'Nice One',
                              namshi: 'Namshi',
                              trendyol: 'Trendyol',
                              other: 'متجر آخر',
                            };
                            const storeName = storeNames[storeInfo.store] || storeInfo.store;
                            
                            return (
                              <div key={idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-semibold text-gray-700">{storeName}</span>
                                  <span className="text-xs text-gray-600">{storeInfo.itemCount} منتج</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                  <span>المجموع:</span>
                                  <span className="font-medium">{formatCurrency(storeInfo.productPrice, 'SAR')}</span>
                                </div>
                                {storeInfo.isKnownStore && storeInfo.belowMinimum && storeInfo.minOrderValue > 0 && !totalPricing.hasFreeShipping && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                      <div className="flex items-start gap-2">
                                        <FiAlertCircle className="text-yellow-600 text-sm mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                          <p className="text-xs font-semibold text-yellow-800 mb-1">
                                            شحن مجاني متاح!
                                          </p>
                                          <p className="text-xs text-yellow-700">
                                            أضف منتجات بقيمة{' '}
                                            <span className="font-bold">
                                              {formatCurrency(storeInfo.minOrderValue - storeInfo.productPrice, 'SAR')}
                                            </span>{' '}
                                            أخرى لتوفير{' '}
                                            <span className="font-bold">
                                              {formatCurrency(storeInfo.shippingFee, 'SAR')}
                                            </span>{' '}
                                            رسوم الشحن
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {storeInfo.isKnownStore && storeInfo.message && (
                                  <div className="mt-2 pt-2 border-t border-gray-200">
                                    <div className="bg-green-50 border border-green-200 rounded p-2">
                                      <div className="flex items-start gap-2">
                                        <FiCheck className="text-green-600 text-sm mt-0.5 flex-shrink-0" />
                                        <p className="text-xs text-green-700">
                                          {storeInfo.message}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {storeInfo.isKnownStore && storeInfo.shippingFee > 0 && (
                                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                                    <span>رسوم الشحن:</span>
                                    <span className="font-medium text-red-600">+{formatCurrency(storeInfo.shippingFee, 'SAR')}</span>
                                  </div>
                                )}
                                {storeInfo.isKnownStore && storeInfo.shippingFee === 0 && storeInfo.minOrderValue > 0 && !storeInfo.belowMinimum && (
                                  <div className="flex justify-between text-xs text-green-600 mt-1">
                                    <span>✓ شحن مجاني</span>
                                    <span className="font-medium">✓</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      
                      {/* Unified International Shipping - يظهر دائماً إذا كان موجود */}
                      {totalPricing.internationalShipping > 0 && (
                        <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                          <span className="text-gray-600">الشحن الدولي الموحد:</span>
                          <span className="font-medium">{formatCurrency(totalPricing.internationalShipping, 'SAR')}</span>
                        </div>
                      )}
                      
                      {/* Store-specific shipping (if any) */}
                      {totalPricing.storeShippingCost > 0 && (
                        <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                          <span className="text-gray-600">رسوم الشحن حسب المتجر:</span>
                          <span className="font-medium">{formatCurrency(totalPricing.storeShippingCost, 'SAR')}</span>
                        </div>
                      )}
                      
                      {/* إجمالي الشحن - يظهر فقط إذا كان هناك رسوم شحن محلية + دولي (لجمعهم) */}
                      {totalPricing.storeShippingCost > 0 && totalPricing.internationalShipping > 0 && (
                        <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                          <span className="text-gray-600">إجمالي الشحن:</span>
                          <span className="font-medium">{formatCurrency(totalPricing.shippingCost, 'SAR')}</span>
                        </div>
                      )}
                      <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                        <span className="text-gray-600">العمولة الموحدة (على السلة الكاملة):</span>
                        <span className="font-medium">{formatCurrency(totalPricing.commission, 'SAR')}</span>
                      </div>
                      <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                        <span className="text-gray-600">الجمارك الموحدة (على السلة الكاملة):</span>
                        <span className="font-medium">{formatCurrency(totalPricing.customsFees, 'SAR')}</span>
                      </div>
                      
                      {/* Coupon Section */}
                      <div className="py-3 border-b border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                          <FiTag className="text-purple-500" />
                          <span className="text-sm font-semibold text-gray-700">كوبون الخصم</span>
                        </div>
                        
                        {appliedCoupons.length > 0 ? (
                          <div className="space-y-2">
                            {appliedCoupons.map((coupon, idx) => {
                              const storeNames = {
                                shein: 'Shein',
                                amazon: 'Amazon',
                                noon: 'Noon',
                                aliexpress: 'AliExpress',
                                temu: 'Temu',
                                iherb: 'iHerb',
                                niceonesa: 'Nice One',
                                namshi: 'Namshi',
                                trendyol: 'Trendyol',
                                other: 'متاجر أخرى',
                              };
                              const applicableStores = coupon.applicableStores || [];
                              
                              // Load local stores from settings to match domains
                              const getStoreName = (store) => {
                                // Check if it's a known store
                                if (storeNames[store]) {
                                  return storeNames[store];
                                }
                                // Check if it's a domain (local store)
                                if (store.includes('.') || store.startsWith('http')) {
                                  // Try to get name from settings
                                  if (settings?.localStores) {
                                    const localStore = settings.localStores.find(ls => {
                                      const lsDomain = (ls.domain || '').toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
                                      const storeDomain = store.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
                                      return lsDomain && storeDomain && (storeDomain.includes(lsDomain) || lsDomain.includes(storeDomain));
                                    });
                                    if (localStore) {
                                      return localStore.name;
                                    }
                                  }
                                  // Fallback: extract domain name
                                  try {
                                    const domain = store.replace(/^https?:\/\//, '').split('/')[0];
                                    return domain.split('.')[0] || domain;
                                  } catch (e) {
                                    return store;
                                  }
                                }
                                return store;
                              };
                              
                              return (
                                <div key={idx} className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-2 shadow-sm">
                                  <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                      <FiCheck className="text-green-600" />
                                      <code className="text-xs font-mono bg-white px-2 py-1 rounded">
                                        {coupon.code}
                                      </code>
                                    </div>
                                    <button
                                      onClick={async () => {
                                        try {
                                          await couponAPI.remove(coupon._id || coupon.couponId);
                                          showSuccess('تم إزالة الكوبون');
                                          await loadCart();
                                          await calculateTotalPricing();
                                        } catch (error) {
                                          showError(error.response?.data?.message || 'فشل في إزالة الكوبون');
                                        }
                                      }}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      <FiX className="text-sm" />
                                    </button>
                                  </div>
                                  {applicableStores.length > 0 && (
                                    <div className="mt-1 text-xs text-gray-600">
                                      <span className="font-medium">يطبق على:</span>{' '}
                                      {applicableStores.map((store, i) => (
                                        <span key={store}>
                                          {getStoreName(store)}
                                          {i < applicableStores.length - 1 && '، '}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              placeholder="أدخل كود الكوبون"
                              className="input-field flex-1 text-sm py-2 px-3"
                              onKeyPress={(e) => e.key === 'Enter' && handleApplyCoupon()}
                            />
                            <button
                              onClick={handleApplyCoupon}
                              disabled={applyingCoupon || !couponCode.trim()}
                              className="btn-secondary text-sm py-2 px-4 disabled:opacity-50"
                            >
                              {applyingCoupon ? (
                                <FiLoader className="animate-spin" />
                              ) : (
                                'تطبيق'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                      
                      {/* Discount Display */}
                      {totalPricing.totalDiscount > 0 && (
                        <div className="flex justify-between py-2 text-sm border-b border-gray-200">
                          <span className="text-gray-600">الخصم:</span>
                          <span className="font-medium bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                            -{formatCurrency(totalPricing.totalDiscount, 'SAR')}
                          </span>
                        </div>
                      )}
                      
                      {/* Total Section */}
                      <div className="py-3 pt-3 border-t-2 border-primary-300 space-y-2">
                        {/* Total in SAR */}
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold text-gray-700">الإجمالي (ريال سعودي):</span>
                          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent">
                            {formatCurrency(totalPricing.totalCost, 'SAR')}
                          </span>
                        </div>
                        
                        {/* Exchange Rate Info */}
                        {totalPricing.exchangeRate && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-xs text-blue-600 text-center">
                            <span className="font-medium">سعر الصرف:</span> 1 ريال سعودي = {totalPricing.exchangeRate} ريال يمني
                          </div>
                        )}
                        
                        {/* Total in YER */}
                        <div className="flex justify-between items-center pt-1">
                          <span className="text-sm font-semibold text-gray-700">الإجمالي (ريال يمني):</span>
                          <span className="text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
                            {formatCurrency(totalPricing.totalInYER, 'YER')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}

                  {/* Delivery Type Selection */}
                  <div className="mb-6 border-t border-gray-300 pt-4">
                    <h4 className="font-bold mb-3">نوع التسليم</h4>
                    <div className="space-y-2">
                      <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                        style={{
                          borderColor: deliveryType === 'home' ? '#2563eb' : '#e5e7eb',
                          backgroundColor: deliveryType === 'home' ? '#eff6ff' : 'transparent'
                        }}>
                        <input
                          type="radio"
                          name="deliveryType"
                          value="home"
                          checked={deliveryType === 'home'}
                          onChange={(e) => setDeliveryType(e.target.value)}
                          className="w-5 h-5 text-primary-600"
                        />
                        <FiHome className="text-xl text-primary-600" />
                        <div className="flex-1">
                          <div className="font-semibold">التسليم للمنزل</div>
                          <div className="text-xs text-gray-500">نقوم بتسليم الطلب إلى عنوانك</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                        style={{
                          borderColor: deliveryType === 'pickup_point' ? '#2563eb' : '#e5e7eb',
                          backgroundColor: deliveryType === 'pickup_point' ? '#eff6ff' : 'transparent'
                        }}>
                        <input
                          type="radio"
                          name="deliveryType"
                          value="pickup_point"
                          checked={deliveryType === 'pickup_point'}
                          onChange={(e) => {
                            setDeliveryType(e.target.value);
                            if (e.target.value === 'pickup_point' && userLocation) {
                              loadNearbyPoints();
                              setShowPickupPointsModal(true);
                            } else if (e.target.value === 'pickup_point') {
                              getCurrentLocation();
                              setShowPickupPointsModal(true);
                            }
                          }}
                          className="w-5 h-5 text-primary-600"
                        />
                        <FiMapPin className="text-xl text-primary-600" />
                        <div className="flex-1">
                          <div className="font-semibold">استلام من نقطة</div>
                          <div className="text-xs text-gray-500">
                            {selectedPickupPoint 
                              ? `نقطة ${selectedPickupPoint.name} - ${selectedPickupPoint.distanceFormatted || ''}` 
                              : 'اختر أقرب نقطة استلام'}
                          </div>
                        </div>
                        {selectedPickupPoint && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPickupPointsModal(true);
                            }}
                            className="text-xs text-primary-600 hover:underline"
                          >
                            تغيير
                          </button>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Payment Method Selection */}
                  {settings && (
                    <div className="mb-6 border-t border-gray-300 pt-4">
                      <h4 className="font-bold mb-3">طريقة الدفع</h4>
                      <div className="space-y-2">
                        {/* Wallet Payment */}
                        {wallet && !walletLoading && (
                          <label className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            wallet.balance >= (totalPricing?.totalCost || 0) ? 'hover:bg-gray-50' : 'opacity-60 cursor-not-allowed'
                          }`}
                            style={{
                              borderColor: paymentMethod === 'wallet' ? '#2563eb' : '#e5e7eb',
                              backgroundColor: paymentMethod === 'wallet' ? '#eff6ff' : 'transparent'
                            }}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="wallet"
                              checked={paymentMethod === 'wallet'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="w-5 h-5 text-primary-600"
                              disabled={wallet.balance < (totalPricing?.totalCost || 0)}
                            />
                            <FiDollarSign className="text-xl text-primary-600" />
                            <div className="flex-1">
                              <div className="font-semibold">الدفع من المحفظة</div>
                              <div className="text-xs text-gray-500">
                                الرصيد: {formatCurrency(wallet.balance, wallet.currency || 'SAR')}
                                {wallet.balance < (totalPricing?.totalCost || 0) && (
                                  <span className="text-red-600 block mt-0.5">
                                    الرصيد غير كافٍ ({formatCurrency((totalPricing?.totalCost || 0) - wallet.balance, wallet.currency || 'SAR')} مطلوب)
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                        )}

                        {settings.payment?.cashOnDeliveryEnabled && (
                          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                            style={{
                              borderColor: paymentMethod === 'cash_on_delivery' ? '#2563eb' : '#e5e7eb',
                              backgroundColor: paymentMethod === 'cash_on_delivery' ? '#eff6ff' : 'transparent'
                            }}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cash_on_delivery"
                              checked={paymentMethod === 'cash_on_delivery'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="w-5 h-5 text-primary-600"
                            />
                            <FiTruck className="text-xl text-primary-600" />
                            <div className="flex-1">
                              <div className="font-semibold">الدفع عند الاستلام</div>
                              <div className="text-xs text-gray-500">ادفع عند استلام طلبك</div>
                            </div>
                          </label>
                        )}
                        
                        {settings.payment?.stripeEnabled && (
                          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                            style={{
                              borderColor: paymentMethod === 'stripe' ? '#2563eb' : '#e5e7eb',
                              backgroundColor: paymentMethod === 'stripe' ? '#eff6ff' : 'transparent'
                            }}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="stripe"
                              checked={paymentMethod === 'stripe'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="w-5 h-5 text-primary-600"
                            />
                            <FiCreditCard className="text-xl text-primary-600" />
                            <div className="flex-1">
                              <div className="font-semibold">الدفع بالبطاقة الائتمانية</div>
                              <div className="text-xs text-gray-500">دفع آمن عبر Stripe</div>
                            </div>
                          </label>
                        )}

                        {settings.payment?.cashPayEnabled && (
                          <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                            style={{
                              borderColor: paymentMethod === 'cash_pay' ? '#2563eb' : '#e5e7eb',
                              backgroundColor: paymentMethod === 'cash_pay' ? '#eff6ff' : 'transparent'
                            }}>
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cash_pay"
                              checked={paymentMethod === 'cash_pay'}
                              onChange={(e) => setPaymentMethod(e.target.value)}
                              className="w-5 h-5 text-primary-600"
                            />
                            <FiShoppingBag className="text-xl text-primary-600" />
                            <div className="flex-1">
                              <div className="font-semibold">Cash Pay</div>
                              <div className="text-xs text-gray-500">دفع إلكتروني آمن عبر Cash Pay</div>
                            </div>
                          </label>
                        )}

                        {(!wallet || walletLoading) && !settings.payment?.cashOnDeliveryEnabled && !settings.payment?.stripeEnabled && !settings.payment?.cashPayEnabled && (
                          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-yellow-800 text-sm">
                            <FiAlertCircle className="inline-block ml-2" />
                            لا توجد طرق دفع متاحة حالياً. يرجى تفعيل طريقة دفع من الإعدادات.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCheckout}
                    disabled={
                      checkingOut || 
                      !totalPricing || 
                      (
                        !wallet && 
                        !settings?.payment?.cashOnDeliveryEnabled && 
                        !settings?.payment?.stripeEnabled &&
                        !settings?.payment?.cashPayEnabled
                      ) ||
                      (paymentMethod === 'wallet' && wallet && wallet.balance < (totalPricing?.totalCost || 0))
                    }
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkingOut ? (
                      <>
                        <FiLoader className="animate-spin" />
                        جاري المعالجة...
                      </>
                    ) : (
                      <>
                        <FiCheck />
                        {paymentMethod === 'stripe' ? 'الدفع الآن' : 
                         paymentMethod === 'cash_pay' ? 'الدفع عبر Cash Pay' :
                         paymentMethod === 'wallet' ? 'الدفع من المحفظة' : 
                         'إتمام الطلب'}
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 mt-4 text-center">
                    جميع الرسوم محسوبة بشكل موحد لجميع المنتجات
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pickup Points Modal */}
      {showPickupPointsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">اختر نقطة الاستلام</h2>
                <button
                  onClick={() => setShowPickupPointsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="text-xl" />
                </button>
              </div>

              {!userLocation ? (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">جاري تحديد موقعك...</p>
                  <button
                    onClick={getCurrentLocation}
                    className="btn-primary"
                  >
                    السماح بالوصول للموقع
                  </button>
                </div>
              ) : loadingPoints ? (
                <div className="flex justify-center py-8">
                  <FiLoader className="animate-spin text-lg md:text-xl text-primary-600" />
                </div>
              ) : nearbyPoints.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">لا توجد نقاط استلام قريبة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {nearbyPoints.map((point) => (
                    <div
                      key={point._id}
                      onClick={() => {
                        setSelectedPickupPoint(point);
                        setShowPickupPointsModal(false);
                      }}
                      className={`p-4 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                        selectedPickupPoint?._id === point._id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900 mb-1">{point.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{point.location.address}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {point.distanceFormatted && (
                              <span className="flex items-center gap-1">
                                <FiMapPin />
                                {point.distanceFormatted}
                              </span>
                            )}
                            {point.contact?.phone && (
                              <span>{point.contact.phone}</span>
                            )}
                          </div>
                        </div>
                        {selectedPickupPoint?._id === point._id && (
                          <FiCheck className="text-primary-600 text-xl" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Offer Modal */}
      {showOfferModal && selectedOffer && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in" 
          onClick={() => setShowOfferModal(false)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full relative animate-scale-in shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowOfferModal(false)}
              className="absolute top-4 left-4 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
            >
              <FiX className="text-gray-600 text-xl" />
            </button>

            {/* Offer Image */}
            <div className="text-center mb-4">
              <img 
                src={selectedOffer.image} 
                alt="عرض خاص" 
                className="w-full h-48 object-cover rounded-xl mb-4 shadow-md" 
              />
              <h3 className="text-xl font-bold mb-2 text-gray-900">
                👑 {selectedOffer.title || 'أقوى أكواد الخصم'}
              </h3>
              {selectedOffer.description && (
                <p className="text-sm text-gray-600 mb-3">{selectedOffer.description}</p>
              )}
            </div>
            
            {/* Coupon Code Section */}
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 rounded-xl p-4 mb-4 border-2 border-blue-200 shadow-md">
              <p className="text-sm text-gray-600 mb-2 text-center font-medium">كود الخصم</p>
              <div className="flex items-center gap-2 bg-white rounded-lg p-3 border-2 border-dashed border-purple-300 shadow-sm">
                <span className="flex-grow text-center font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent tracking-wider">
                  {selectedOffer.couponCode}
                </span>
                <button
                  onClick={async () => {
                    try {
                      // Try modern clipboard API first
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(selectedOffer.couponCode);
                        showSuccess('تم نسخ الكود ✓');
                      } else {
                        // Fallback for older browsers
                        const textArea = document.createElement('textarea');
                        textArea.value = selectedOffer.couponCode;
                        textArea.style.position = 'fixed';
                        textArea.style.left = '-999999px';
                        document.body.appendChild(textArea);
                        textArea.select();
                        try {
                          document.execCommand('copy');
                          showSuccess('تم نسخ الكود ✓');
                        } catch (err) {
                          showError('فشل نسخ الكود');
                        }
                        document.body.removeChild(textArea);
                      }
                    } catch (err) {
                      console.error('Copy failed:', err);
                      showError('فشل نسخ الكود');
                    }
                  }}
                  className="bg-gradient-to-r from-blue-400 to-purple-400 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-500 hover:to-purple-500 transition-all hover:scale-105 active:scale-95 shadow-md"
                >
                  نسخ
                </button>
              </div>
              {selectedOffer.discount && (
                <p className="text-xs text-center text-gray-500 mt-2">
                  خصم {selectedOffer.discount}
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {selectedOffer.storeUrl && (
                <a
                  href={selectedOffer.storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white py-3 rounded-xl font-medium hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                  onClick={async (e) => {
                    // Copy code automatically when going to store
                    try {
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(selectedOffer.couponCode);
                        showInfo('تم نسخ الكود! الصقه عند الدفع 🛍️');
                      } else {
                        const textArea = document.createElement('textarea');
                        textArea.value = selectedOffer.couponCode;
                        textArea.style.position = 'fixed';
                        textArea.style.left = '-999999px';
                        document.body.appendChild(textArea);
                        textArea.select();
                        document.execCommand('copy');
                        document.body.removeChild(textArea);
                        showInfo('تم نسخ الكود! الصقه عند الدفع 🛍️');
                      }
                    } catch (err) {
                      console.error('Copy failed:', err);
                    }
                  }}
                >
                  <FiShoppingBag className="text-lg" />
                  الانتقال للمتجر
                </a>
              )}
              <button
                onClick={() => setShowOfferModal(false)}
                className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                إغلاق
              </button>
            </div>

            {/* Terms if available */}
            {selectedOffer.terms && (
              <p className="text-xs text-gray-400 text-center mt-3">
                {selectedOffer.terms}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
