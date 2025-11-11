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
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-16 md:py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-400 to-pink-600 bg-clip-text text-transparent">{settings?.general?.siteName || 'Olivia Ship - أوليفيا شيب'}</h1>
            <p className="text-sm text-gray-700 mb-6">
              {settings?.general?.siteDescription || 'أوليفيا شيب - خدمة التوصيل الفاخر من المتاجر العالمية إلى اليمن. نوصل منتجاتك من أمازون، نون، شي إن، علي إكسبريس والمزيد بسهولة وأمان.'}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        {/* About Section */}
        <div className="max-w-4xl mx-auto">
          <div className="card mb-12 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <FiGlobe className="text-white text-2xl" />
              </div>
              <h2 className="text-lg font-bold mb-3 bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent">من نحن</h2>
              <p className="text-sm text-gray-600 max-w-2xl mx-auto">
                <strong>Olivia Ship (أوليفيا شيب)</strong> هي علامة تجارية فاخرة متخصصة في خدمة التوصيل الدولي من المتاجر العالمية إلى اليمن. 
                نقدم خدمة شاملة ومميزة تتيح للعملاء طلب منتجات من أشهر المتاجر العالمية مثل أمازون، نون، شي إن، 
                علي إكسبريس، تيمو، iHerb والمزيد. نسعى إلى توفير تجربة تسوق فاخرة وآمنة، مع ضمان وصول منتجاتك 
                بأفضل جودة وأسرع وقت إلى باب منزلك في اليمن. نفتخر بكوننا الشريك الموثوق لجميع متطلباتك من التوصيل الدولي.
              </p>
            </div>
          </div>

          {/* Vision & Mission */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-400 to-blue-500 p-3 rounded-xl shadow-md">
                  <FiCheckCircle className="text-white text-xl" />
                </div>
                <h3 className="text-lg font-bold text-blue-600">رؤيتنا</h3>
              </div>
              <p className="text-sm text-gray-700">
                أن نكون المنصة الأولى في اليمن لتوصيل المنتجات من المتاجر العالمية بسهولة وأمان وموثوقية، 
                ونصبح الشريك المفضل للعملاء اليمنيين في رحلتهم التسوقية العالمية.
              </p>
            </div>

            <div className="card bg-gradient-to-br from-pink-50 to-pink-100 border-2 border-pink-200 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-pink-400 to-pink-500 p-3 rounded-xl shadow-md">
                  <FiPackage className="text-white text-xl" />
                </div>
                <h3 className="text-lg font-bold text-pink-600">رسالتنا</h3>
              </div>
              <p className="text-sm text-gray-700">
                توفير تجربة تسوق عالمية ممتازة للعملاء اليمنيين من خلال خدمة موثوقة وسريعة وآمنة، 
                مع ضمان وصول المنتجات بأفضل الأسعار وأعلى جودة.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="card mb-12 bg-white border-2 border-blue-100">
            <h2 className="text-lg font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent">مميزاتنا</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <div key={idx} className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-xl hover:shadow-lg transition-all hover:scale-105">
                    <div className={`bg-gradient-to-br ${feature.color} w-12 h-12 rounded-xl flex items-center justify-center mb-3 shadow-md`}>
                      <Icon className="text-white text-xl" />
                    </div>
                    <h3 className="text-sm font-semibold mb-2 text-gray-800">{feature.title}</h3>
                    <p className="text-xs text-gray-600">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Supported Stores */}
          <div className="card mb-12 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200">
            <h2 className="text-lg font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">المتاجر المدعومة</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {stores.map((store, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2 bg-white rounded-lg border-2 border-purple-200 hover:border-pink-300 transition-colors shadow-sm hover:shadow-md"
                >
                  <span className={`${store.color} font-semibold text-sm`}>{store.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className="card bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border-2 border-blue-200">
            <h2 className="text-lg font-bold mb-6 text-center bg-gradient-to-r from-blue-600 via-purple-400 to-pink-600 bg-clip-text text-transparent">كيف يعمل النظام؟</h2>
            <div className="space-y-4">
              {[
                { step: '1', title: 'الصق رابط المنتج', desc: 'انسخ رابط المنتج من أي متجر مدعوم والصقه في صفحة الطلب', color: 'from-blue-400 to-blue-500' },
                { step: '2', title: 'احصل على السعر فوراً', desc: 'نقوم بجلب بيانات المنتج وحساب التكلفة الإجمالية تلقائياً', color: 'from-purple-400 to-purple-500' },
                { step: '3', title: 'أكمل طلبك', desc: 'راجع التفاصيل وأضف أي معلومات إضافية ثم أكمل الطلب', color: 'from-pink-400 to-pink-500' },
                { step: '4', title: 'تتبع طلبك', desc: 'تابع حالة طلبك من البداية حتى الوصول إلى باب منزلك', color: 'from-indigo-400 to-indigo-500' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-white border-2 border-purple-200 rounded-xl hover:shadow-lg transition-shadow">
                  <div className={`bg-gradient-to-br ${item.color} text-white w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm shadow-md`}>
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold mb-1 text-gray-800">{item.title}</h4>
                    <p className="text-xs text-gray-600">{item.desc}</p>
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
