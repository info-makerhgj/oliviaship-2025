import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { settingsAPI } from '../../utils/api';
import { FiExternalLink, FiShoppingBag, FiLoader } from 'react-icons/fi';

export default function StoresPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStores();
  }, []);

  const loadStores = async () => {
    try {
      const res = await settingsAPI.get();
      setSettings(res.data.settings || {});
    } catch (error) {
      console.error('Failed to load stores', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVisitStore = (storeUrl) => {
    // Open store in new tab
    window.open(storeUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <FiLoader className="animate-spin text-3xl text-primary-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Get only custom supported stores from settings (no predefined stores)
  const allStores = (settings?.supportedStores || [])
    .filter(store => store.enabled)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-primary-100 p-2 rounded-lg">
            <FiShoppingBag className="text-primary-600 text-xl" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">المتاجر المدعومة</h1>
            <p className="text-sm text-gray-600 mt-1">اختر المتجر الذي تريد التصفح فيه</p>
          </div>
        </div>
      </div>

      {/* Stores Grid - 2 columns on mobile */}
      {allStores.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          {allStores.map((store) => (
            <div
              key={store.key || store.name}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-3 md:p-4 flex flex-col items-center text-center border border-gray-100"
            >
              {/* Store Icon/Image - Smaller */}
              <div className="mb-2 md:mb-3">
                {store.icon ? (
                  <img
                    src={store.icon.startsWith('data:') ? store.icon : (store.icon.startsWith('/uploads/') ? `/api${store.icon}` : store.icon)}
                    alt={store.name}
                    className="w-12 h-12 md:w-16 md:h-16 object-contain rounded-lg"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/80?text=' + encodeURIComponent(store.name.charAt(0));
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FiShoppingBag className="text-xl md:text-2xl text-gray-400" />
                  </div>
                )}
              </div>

              {/* Store Name - Smaller */}
              <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-2 md:mb-3 line-clamp-2 min-h-[2.5rem]">
                {store.name}
              </h3>

              {/* Visit Store Button - Smaller */}
              <button
                onClick={() => handleVisitStore(store.url)}
                className="w-full bg-primary-600 text-white px-2 py-1.5 md:px-3 md:py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-1.5 text-xs md:text-sm font-medium"
              >
                <FiExternalLink className="text-sm" />
                <span>زيارة المتجر</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-xl">
          <FiShoppingBag className="text-5xl text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">لا توجد متاجر متاحة حالياً</p>
        </div>
      )}

      {/* Info Section - Compact */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-bold text-blue-900 mb-2">💡 معلومات مهمة</h3>
        <ul className="space-y-1 text-xs md:text-sm text-blue-700">
          <li>• يمكنك الطلب من أي متجر مدعوم</li>
          <li>• جميع المنتجات في سلة واحدة موحدة</li>
          <li>• الشحن والدفع بشكل موحد</li>
        </ul>
      </div>
    </div>
  );
}

