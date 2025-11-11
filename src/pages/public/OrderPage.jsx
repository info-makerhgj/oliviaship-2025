import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI, cartAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { FiShoppingBag, FiLoader, FiAlertCircle, FiCheck, FiShoppingCart } from 'react-icons/fi';

export default function OrderPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleFetchAndAddToCart = async () => {
    if (!url.trim()) {
      setError('يرجى إدخال رابط المنتج');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      // Fetch product
      const res = await productAPI.fetchFromUrl(url);
      
      if (res.data.success && (res.data.product.success || res.data.product.name)) {
        const product = res.data.product.product || res.data.product;
        
        // Add to cart
        await cartAPI.fetchAndAdd({
          url: url,
          quantity: 1,
        });
        
        setSuccess(true);
        setUrl('');
        setTimeout(() => {
          navigate('/cart');
        }, 1500);
      } else {
        setError('فشل في جلب بيانات المنتج. يرجى التأكد من صحة الرابط');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'فشل في جلب المنتج');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-xl md:text-2xl font-bold mb-4 text-gradient">طلب منتج جديد</h1>
            <p className="text-sm md:text-base text-gray-600">الصق رابط المنتج من أي متجر عالمي وسيتم إضافته للسلة</p>
          </div>

          {/* Main Card */}
          <div className="card p-4 md:p-6">
            <div className="mb-4">
              <label className="block mb-2 font-bold text-base">رابط المنتج</label>
              <div className="flex gap-3 flex-col sm:flex-row">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError('');
                    setSuccess(false);
                  }}
                  placeholder="https://www.amazon.com/... أو https://www.noon.com/..."
                  className="input-field flex-grow text-sm md:text-base"
                  onKeyPress={(e) => e.key === 'Enter' && handleFetchAndAddToCart()}
                />
                <button
                  onClick={handleFetchAndAddToCart}
                  disabled={loading || !isAuthenticated}
                  className="btn-primary whitespace-nowrap flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <FiLoader className="animate-spin" />
                      جاري الجلب...
                    </>
                  ) : (
                    <>
                      <FiShoppingBag />
                      جلب وإضافة للسلة
                    </>
                  )}
                </button>
              </div>
              
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700">
                  <FiAlertCircle />
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700">
                  <FiCheck />
                  تم جلب المنتج وإضافته للسلة بنجاح! جاري الانتقال للسلة...
                </div>
              )}

              {!isAuthenticated && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700">
                  يجب تسجيل الدخول لإضافة المنتجات للسلة
                </div>
              )}
            </div>

            {/* Supported Stores */}
            <div className="pt-4 border-t border-gray-200">
              <p className="text-gray-600 mb-3 text-sm font-medium">المتاجر المدعومة:</p>
              <div className="flex flex-wrap gap-2">
                {['Amazon', 'Noon', 'SHEIN', 'AliExpress', 'Temu'].map((store) => (
                  <span key={store} className="px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs md:text-sm font-medium">
                    {store}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Info Card */}
          <div className="card mt-4 p-4 md:p-5 bg-gradient-to-br from-primary-50 to-secondary-50 border border-primary-200">
            <div className="flex items-start gap-3">
              <FiShoppingCart className="text-lg md:text-xl text-primary-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-base mb-2">كيف يعمل النظام؟</h3>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold text-xs">1.</span>
                    <span>الصق رابط المنتج واضغط "جلب وإضافة للسلة"</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold text-xs">2.</span>
                    <span>سيتم جلب بيانات المنتج تلقائياً وإضافته للسلة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold text-xs">3.</span>
                    <span>يمكنك إضافة منتجات متعددة للسلة</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary-600 font-bold text-xs">4.</span>
                    <span>اذهب للسلة لإتمام الطلب مع حساب موحد للرسوم</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
