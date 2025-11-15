import { FiPackage, FiShield, FiTruck, FiClock, FiCheckCircle, FiGlobe } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { settingsAPI } from '../../utils/api';

export default function AboutPage() {
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setSettings(res.data.settings);
    } catch (error) {
      console.error('Failed to load settings', error);
    }
  };

  const features = [
    {
      icon: FiPackage,
      title: 'طلب سهل',
      description: 'الصق رابط المنتج واحصل على السعر فوراً',
      color: 'from-blue-300 to-blue-400',
    },
    {
      icon: FiClock,
      title: 'حساب سريع',
      description: 'حساب تلقائي للتكلفة الشاملة خلال ثوان',
      color: 'from-purple-300 to-purple-400',
    },
    {
      icon: FiTruck,
      title: 'شحن موثوق',
      description: 'شحن آمن وموثوق من المتاجر العالمية',
      color: 'from-pink-300 to-pink-400',
    },
    {
      icon: FiShield,
      title: 'توصيل مضمون',
      description: 'ضمان وصول المنتج بأمان إلى باب منزلك',
      color: 'from-indigo-300 to-indigo-400',
    },
  ];

  const stores = [
    { name: 'Amazon', color: 'text-orange-500' },
    { name: 'Noon', color: 'text-red-500' },
    { name: 'SHEIN', color: 'text-pink-500' },
    { name: 'AliExpress', color: 'text-red-600' },
    { name: 'Temu', color: 'text-blue-600' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section - Modern */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 text-white py-12 md:py-20 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
              <FiGlobe className="text-4xl text-white" />
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              من نحن؟
            </h1>
            
            {/* Description */}
            <p className="text-lg md:text-xl mb-6 text-white/90 leading-relaxed max-w-3xl mx-auto">
              {settings?.general?.siteName?.split(' - ')[0] || 'Olivia Ship'} - خدمتك المميزة للتوصيل من المتاجر العالمية
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* About Section */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-10 mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900">
                قصتنا 📖
              </h2>
              <p className="text-base md:text-lg text-gray-700 leading-relaxed max-w-3xl mx-auto">
                <strong className="text-primary-600">{settings?.general?.siteName?.split(' - ')[0] || 'Olivia Ship'}</strong> هي علامة تجارية مميزة متخصصة في خدمة التوصيل الدولي من المتاجر العالمية إلى اليمن. 
                نقدم خدمة شاملة تتيح للعملاء طلب منتجات من أشهر المتاجر العالمية مثل <strong>أمازون، نون، شي إن، 
                علي إكسبريس، تيمو، iHerb</strong> والمزيد. نسعى إلى توفير تجربة تسوق آمنة وسهلة، مع ضمان وصول منتجاتك 
                بأفضل جودة وأسرع وقت إلى باب منزلك في اليمن. 🚀
              </p>
            </div>
          </div>

          {/* Vision & Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 md:p-8 shadow-xl text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <FiCheckCircle className="text-white text-2xl" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">رؤيتنا 🎯</h3>
              </div>
              <p className="text-base md:text-lg text-white/90 leading-relaxed">
                أن نكون المنصة الأولى في اليمن لتوصيل المنتجات من المتاجر العالمية بسهولة وأمان، 
                ونصبح الشريك المفضل للعملاء اليمنيين في رحلتهم التسوقية العالمية.
              </p>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 md:p-8 shadow-xl text-white">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                  <FiPackage className="text-white text-2xl" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold">رسالتنا 💎</h3>
              </div>
              <p className="text-base md:text-lg text-white/90 leading-relaxed">
                توفير تجربة تسوق عالمية ممتازة للعملاء اليمنيين من خلال خدمة موثوقة وسريعة وآمنة، 
                مع ضمان وصول المنتجات بأفضل الأسعار وأعلى جودة.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-10 mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-gray-900">
              ليش تختارنا؟ ⭐
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="bg-gray-50 hover:bg-white border-2 border-gray-100 hover:border-primary-200 rounded-2xl p-6 transition-all hover:shadow-lg group">
                    <div className={`bg-gradient-to-br ${feature.color} w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                      <Icon className="text-white text-2xl" />
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-gray-900">{feature.title}</h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supported Stores */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 md:p-10 mb-12 border border-gray-200">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-gray-900">
              المتاجر المدعومة 🛍️
            </h2>
            <div className="flex flex-wrap justify-center gap-4">
              {stores.map((store, idx) => (
                <div
                  key={idx}
                  className="px-6 py-3 bg-white rounded-xl border-2 border-gray-200 hover:border-primary-300 transition-all shadow-md hover:shadow-lg hover:-translate-y-1"
                >
                  <span className={`${store.color} font-bold text-base md:text-lg`}>{store.name}</span>
                </div>
              ))}
            </div>
            <p className="text-center text-gray-600 mt-6 text-sm md:text-base">
              + أي متجر عالمي آخر 🌍
            </p>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 md:p-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center text-gray-900">
              كيف يعمل النظام؟ 🚀
            </h2>
            <div className="space-y-4 md:space-y-6">
              {[
                { step: '1', title: 'الصق رابط المنتج', desc: 'انسخ رابط المنتج من أي متجر مدعوم والصقه في صفحة الطلب', color: 'from-blue-500 to-blue-600' },
                { step: '2', title: 'احصل على السعر فوراً', desc: 'نقوم بجلب بيانات المنتج وحساب التكلفة الإجمالية تلقائياً', color: 'from-green-500 to-green-600' },
                { step: '3', title: 'أكمل طلبك', desc: 'راجع التفاصيل وأضف أي معلومات إضافية ثم أكمل الطلب', color: 'from-purple-500 to-purple-600' },
                { step: '4', title: 'تتبع طلبك', desc: 'تابع حالة طلبك من البداية حتى الوصول إلى باب منزلك', color: 'from-pink-500 to-pink-600' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 md:gap-6 p-5 md:p-6 bg-gray-50 hover:bg-white border-2 border-gray-100 hover:border-primary-200 rounded-2xl hover:shadow-lg transition-all group">
                  <div className={`bg-gradient-to-br ${item.color} text-white w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center flex-shrink-0 font-bold text-lg md:text-xl shadow-lg group-hover:scale-110 transition-transform`}>
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-base md:text-lg font-bold mb-2 text-gray-900">{item.title}</h4>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
