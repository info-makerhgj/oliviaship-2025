import { useEffect, useState } from 'react';
import { posAPI } from '../../utils/api';
import { FiMapPin, FiLoader, FiSearch, FiFilter, FiPhone, FiMail, FiClock, FiShoppingBag, FiCreditCard, FiCheckCircle } from 'react-icons/fi';

export default function PointsPage() {
  const [points, setPoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    loadPoints();
  }, [cityFilter, typeFilter]);

  const loadPoints = async () => {
    try {
      setLoading(true);
      const params = {};
      if (cityFilter !== 'all') params.city = cityFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      
      const res = await posAPI.getPublic(params);
      setPoints(res.data.points || []);
      setMapLoaded(true);
    } catch (error) {
      console.error('Failed to load points', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPoints = points.filter(point => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      point.name?.toLowerCase().includes(search) ||
      point.location?.address?.toLowerCase().includes(search) ||
      point.location?.city?.toLowerCase().includes(search) ||
      point.code?.toLowerCase().includes(search)
    );
  });

  // Yemeni cities list (predefined + dynamic from points)
  const yemeniCities = [
    'صنعاء', 'عدن', 'تعز', 'إب', 'الحديدة', 'المكلا', 'مأرب', 'الجوف', 
    'حجة', 'ذمار', 'الضالع', 'لحج', 'أبين', 'شبوة', 'حضرموت', 'المهرة', 
    'سقطرى', 'بيحان', 'يريم', 'زنجبار', 'البيضاء', 'عمران', 'صعدة', 'ريمة'
  ];
  
  // Combine predefined cities with cities from points
  const citiesFromPoints = [...new Set(points.map(p => p.location?.city).filter(Boolean))];
  const allCities = [...new Set([...yemeniCities, ...citiesFromPoints])].sort();

  const getTypeIcon = (type) => {
    switch (type) {
      case 'both':
        return <><FiShoppingBag className="inline ml-1" /><FiCreditCard className="inline ml-1" /></>;
      case 'pickup_only':
        return <FiShoppingBag className="inline ml-1" />;
      case 'codes_only':
        return <FiCreditCard className="inline ml-1" />;
      default:
        return null;
    }
  };

  const getTypeText = (type) => {
    switch (type) {
      case 'both':
        return 'استلام + أكواد';
      case 'pickup_only':
        return 'استلام فقط';
      case 'codes_only':
        return 'أكواد فقط';
      default:
        return 'غير محدد';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 md:py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 md:mb-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gradient mb-2">نقاط البيع والتسليم</h1>
          <p className="text-gray-600 text-sm md:text-base">اعثر على أقرب نقطة لك لاستلام طلباتك أو شراء أكواد الشحن</p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <FiSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث عن نقطة..."
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* City Filter */}
            <div>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">جميع المدن</option>
                {allCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">جميع الأنواع</option>
                <option value="both">استلام + أكواد</option>
                <option value="pickup_only">استلام فقط</option>
                <option value="codes_only">أكواد فقط</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
          </div>
        ) : filteredPoints.length === 0 ? (
          <div className="card text-center py-16">
            <FiMapPin className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
            <p className="text-sm md:text-base text-gray-600 mb-2">لا توجد نقاط متاحة</p>
            <p className="text-gray-500">جرب تغيير الفلاتر أو البحث</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Points List */}
            <div className="space-y-4">
              {filteredPoints.map((point) => (
                <div
                  key={point._id}
                  className={`card p-4 cursor-pointer transition-all hover:shadow-lg ${
                    selectedPoint?._id === point._id ? 'ring-2 ring-primary-500' : ''
                  }`}
                  onClick={() => setSelectedPoint(point)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{point.name}</h3>
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1">
                          <FiCheckCircle className="text-xs" />
                          نشطة
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
                        <FiMapPin className="text-primary-600" />
                        <span>{point.location?.address}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{point.location?.city}</span>
                        {point.code && <span className="font-mono">#{point.code}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-200">
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium">
                      {getTypeText(point.type)}
                      {getTypeIcon(point.type)}
                    </span>
                    {point.contact?.phone && (
                      <a
                        href={`tel:${point.contact.phone}`}
                        className="flex items-center gap-1 text-xs text-gray-600 hover:text-primary-600"
                      >
                        <FiPhone className="text-xs" />
                        {point.contact.phone}
                      </a>
                    )}
                    {point.contact?.whatsapp && (
                      <a
                        href={`https://wa.me/${point.contact.whatsapp.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
                      >
                        واتساب
                      </a>
                    )}
                  </div>

                  {/* Operating Hours */}
                  {point.operatingHours && (
                    <div className="mt-3 pt-3 border-t border-gray-200 flex items-center gap-2 text-xs text-gray-500">
                      <FiClock />
                      <span>
                        {point.operatingHours.from} - {point.operatingHours.to}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Map */}
            <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]">
              <div className="card p-0 overflow-hidden h-full">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                  <h3 className="font-bold text-gray-700 flex items-center gap-2">
                    <FiMapPin className="text-primary-600" />
                    الخريطة
                  </h3>
                </div>
                <div className="relative w-full h-[400px] lg:h-[calc(100%-60px)]">
                  {selectedPoint && selectedPoint.location?.coordinates?.latitude && selectedPoint.location?.coordinates?.longitude ? (
                    <>
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps?q=${selectedPoint.location.coordinates.latitude},${selectedPoint.location.coordinates.longitude}&output=embed&zoom=15`}
                      />
                      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2">
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${selectedPoint.location.coordinates.latitude},${selectedPoint.location.coordinates.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1"
                        >
                          فتح في خرائط Google
                        </a>
                      </div>
                    </>
                  ) : filteredPoints.length > 0 && filteredPoints[0].location?.coordinates?.latitude ? (
                    <>
                      <iframe
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        referrerPolicy="no-referrer-when-downgrade"
                        src={`https://www.google.com/maps?q=${filteredPoints[0].location.coordinates.latitude},${filteredPoints[0].location.coordinates.longitude}&output=embed&zoom=12`}
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-100">
                      <div className="text-center">
                        <FiMapPin className="text-2xl md:text-3xl text-gray-300 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">اختر نقطة لعرض موقعها</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

