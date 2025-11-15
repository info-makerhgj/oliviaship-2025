import { Link } from 'react-router-dom';
import { FiShoppingBag, FiTruck, FiShield, FiClock, FiCheck, FiPackage, FiDollarSign, FiGlobe, FiZap, FiStar, FiArrowLeft } from 'react-icons/fi';
import { FaAmazon, FaShoppingCart } from 'react-icons/fa';
import { SiShein, SiAliexpress } from 'react-icons/si';
import SEO from '../../components/SEO';
import StructuredData from '../../components/StructuredData';

export default function HomePage() {
  const stores = [
    { 
      name: 'Amazon', 
      icon: FaAmazon, 
      color: 'bg-gradient-to-br from-orange-400 to-orange-600',
      desc: 'ملايين المنتجات'
    },
    { 
      name: 'Noon', 
      icon: FiShoppingBag,
      color: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
      desc: 'أفضل العروض'
    },
    { 
      name: 'SHEIN', 
      icon: SiShein,
      color: 'bg-gradient-to-br from-pink-400 to-pink-600',
      desc: 'أحدث الموضة'
    },
    { 
      name: 'AliExpress', 
      icon: SiAliexpress,
      color: 'bg-gradient-to-br from-red-500 to-red-700',
      desc: 'أسعار منافسة'
    },
    { 
      name: 'Temu', 
      icon: FiPackage,
      color: 'bg-gradient-to-br from-blue-500 to-blue-700',
      desc: 'تشكيلة واسعة'
    },
  ];

  const howItWorks = [
    { 
      icon: FiShoppingBag, 
      title: 'اختر منتجك', 
      desc: 'تصفح المتاجر العالمية واختر ما يعجبك',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      icon: FiDollarSign, 
      title: 'احسب التكلفة', 
      desc: 'نحسب لك السعر الشامل (المنتج + الشحن + الجمارك)',
      color: 'from-green-500 to-green-600'
    },
    { 
      icon: FiTruck, 
      title: 'نشتري ونشحن', 
      desc: 'نشتري المنتج ونشحنه من المتجر إلى مستودعنا',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      icon: FiCheck, 
      title: 'استلم طلبك', 
      desc: 'نوصل المنتج لباب بيتك بأمان وسرعة',
      color: 'from-pink-500 to-pink-600'
    },
  ];

  const features = [
    { 
      icon: FiZap, 
      title: 'حساب فوري', 
      desc: 'احسب تكلفة طلبك في ثوانٍ',
      color: 'text-yellow-600',
      bg: 'bg-yellow-50'
    },
    { 
      icon: FiShield, 
      title: 'شحن آمن', 
      desc: 'ضمان وصول منتجاتك بأمان',
      color: 'text-green-600',
      bg: 'bg-green-50'
    },
    { 
      icon: FiGlobe, 
      title: 'متاجر عالمية', 
      desc: 'نوصل من أشهر المتاجر العالمية',
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    { 
      icon: FiStar, 
      title: 'خدمة مميزة', 
      desc: 'دعم عملاء 24/7 لخدمتك',
      color: 'text-purple-600',
      bg: 'bg-purple-50'
    },
  ];

  const stats = [
    { number: '10,000+', label: 'طلب مكتمل', icon: FiPackage },
    { number: '5,000+', label: 'عميل سعيد', icon: FiStar },
    { number: '98%', label: 'رضا العملاء', icon: FiCheck },
    { number: '24/7', label: 'دعم متواصل', icon: FiClock },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO */}
      <SEO 
        title="الصفحة الرئيسية"
        description="أوليفيا شيب - خدمة التوصيل الفاخر من المتاجر العالمية إلى اليمن. نوصل منتجاتك من أمازون، نون، شي إن، علي إكسبريس والمزيد بسهولة وأمان."
        keywords="أوليفيا شيب، Olivia Ship، توصيل من أمازون إلى اليمن، توصيل من نون إلى اليمن، توصيل من شي إن إلى اليمن، شحن دولي إلى اليمن"
      />
      
      {/* Structured Data */}
      <StructuredData type="organization" />
      <StructuredData type="website" />
      <StructuredData type="service" />

      {/* Hero Section - Modern & Clear */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 text-white py-12 md:py-20 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6 text-sm">
              <FiStar className="text-yellow-300" />
              <span>الخدمة الأولى للتوصيل من المتاجر العالمية</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              اطلب من أي متجر عالمي
              <br />
              <span className="text-yellow-300">ونوصلها لباب بيتك!</span>
            </h1>
            
            {/* Description */}
            <p className="text-lg md:text-xl mb-8 text-white/90 leading-relaxed max-w-2xl mx-auto">
              أمازون، نون، شي إن، علي إكسبريس وأكثر...
              <br className="hidden md:block" />
              <span className="font-semibold">نحسب التكلفة، نشتري، ونوصل لك بأمان 🚀</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link 
                to="/cart" 
                className="bg-white text-primary-600 hover:bg-gray-50 text-base md:text-lg font-bold px-8 py-4 rounded-2xl inline-flex items-center justify-center gap-3 transition-all shadow-2xl hover:shadow-3xl hover:scale-105 group"
              >
                <FiShoppingBag className="text-xl group-hover:rotate-12 transition-transform" />
                ابدأ التسوق الآن
                <FiArrowLeft className="text-xl group-hover:-translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/track" 
                className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-2 border-white/30 text-base md:text-lg font-semibold px-8 py-4 rounded-2xl inline-flex items-center justify-center gap-3 transition-all"
              >
                <FiTruck className="text-xl" />
                تتبع طلبك
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <FiCheck className="text-green-300" />
                <span>شحن آمن ومضمون</span>
              </div>
              <div className="flex items-center gap-2">
                <FiShield className="text-blue-300" />
                <span>دفع عند الاستلام</span>
              </div>
              <div className="flex items-center gap-2">
                <FiClock className="text-yellow-300" />
                <span>دعم 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - Clean & Modern */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="text-center p-4 rounded-xl hover:bg-gray-50 transition-colors group">
                  <Icon className="text-3xl text-primary-600 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                  <div className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{stat.number}</div>
                  <div className="text-xs md:text-sm text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works - Visual & Clear */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 text-gray-900">
              كيف تعمل الخدمة؟
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              4 خطوات بسيطة توصلك لمنتجاتك المفضلة 🎯
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {howItWorks.map((step, idx) => {
              const Icon = step.icon;
              return (
                <div key={idx} className="relative">
                  {/* Connector Line (Desktop only) */}
                  {idx < howItWorks.length - 1 && (
                    <div className="hidden lg:block absolute top-16 left-full w-full h-1 bg-gradient-to-r from-primary-300 to-transparent -translate-x-1/2 z-0"></div>
                  )}
                  
                  {/* Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 relative z-10 border-2 border-gray-100 hover:border-primary-200">
                    {/* Step Number */}
                    <div className="absolute -top-4 -right-4 w-10 h-10 bg-gradient-to-br from-primary-500 to-secondary-500 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                      {idx + 1}
                    </div>
                    
                    {/* Icon */}
                    <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                      <Icon className="text-white text-2xl" />
                    </div>
                    
                    {/* Content */}
                    <h3 className="text-lg md:text-xl font-bold mb-2 text-gray-900 text-center">
                      {step.title}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed text-center">
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* CTA Button */}
          <div className="text-center mt-12">
            <Link 
              to="/cart" 
              className="inline-flex items-center gap-3 bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700 text-base md:text-lg font-bold px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all hover:scale-105"
            >
              <FiShoppingBag className="text-xl" />
              ابدأ الآن مجاناً
              <FiArrowLeft />
            </Link>
          </div>
        </div>
      </section>

      {/* Supported Stores - Eye-catching */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 text-gray-900">
              نوصل من أشهر المتاجر العالمية
            </h2>
            <p className="text-base md:text-lg text-gray-600">
              اختر من ملايين المنتجات من متاجرك المفضلة 🛍️
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6 max-w-5xl mx-auto">
            {stores.map((store, idx) => {
              const Icon = store.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2 border-2 border-gray-100 hover:border-primary-200 group cursor-pointer"
                >
                  {/* Icon with Gradient Background */}
                  <div className={`${store.color} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <Icon className="text-white text-3xl" />
                  </div>
                  
                  {/* Store Name */}
                  <h3 className="font-bold text-base md:text-lg text-gray-900 text-center mb-1">
                    {store.name}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-xs md:text-sm text-gray-500 text-center">
                    {store.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* More Stores Badge */}
          <div className="text-center mt-8">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-50 to-secondary-50 border-2 border-primary-200 px-6 py-3 rounded-full text-primary-700 font-semibold">
              <FiGlobe />
              <span>+ أي متجر عالمي آخر</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Why Choose Us */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3 text-gray-900">
              ليش تختار أوليفيا شيب؟
            </h2>
            <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
              نوفر لك تجربة تسوق سهلة وآمنة من المتاجر العالمية 💎
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={idx} 
                  className={`${feature.bg} rounded-2xl p-6 border-2 border-gray-200 hover:border-primary-300 transition-all hover:shadow-lg group`}
                >
                  {/* Icon */}
                  <div className={`w-14 h-14 ${feature.color} bg-white rounded-xl flex items-center justify-center mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="text-2xl" />
                  </div>
                  
                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  
                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Additional Benefits */}
          <div className="mt-12 max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-xl border-2 border-gray-100">
              <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
                مميزات إضافية تجعلنا الأفضل ⭐
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'حساب تلقائي شامل لجميع التكاليف',
                  'تتبع كامل لطلبك من الشراء حتى التوصيل',
                  'أسعار شفافة بدون رسوم مخفية',
                  'دفع عند الاستلام متاح',
                  'ضمان استرجاع الأموال',
                  'دعم عملاء محترف 24/7',
                ].map((benefit, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="w-6 h-6 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <FiCheck className="text-white text-sm" />
                    </div>
                    <p className="text-sm md:text-base font-medium text-gray-700">{benefit}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Strong & Clear */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 text-white relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-3xl mx-auto">
            {/* Icon */}
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6">
              <FaShoppingCart className="text-4xl text-white" />
            </div>

            {/* Heading */}
            <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              جاهز لبدء التسوق؟
            </h2>
            
            {/* Description */}
            <p className="text-lg md:text-xl mb-8 text-white/90 leading-relaxed">
              ابدأ الآن واطلب منتجاتك المفضلة من أي متجر عالمي
              <br />
              <span className="font-bold text-yellow-300">نوصلها لك بسرعة وأمان! 🚀</span>
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link 
                to="/cart" 
                className="bg-white text-primary-600 hover:bg-gray-50 text-lg md:text-xl font-bold px-10 py-5 rounded-2xl inline-flex items-center justify-center gap-3 transition-all shadow-2xl hover:shadow-3xl hover:scale-105 group"
              >
                <FiShoppingBag className="text-2xl group-hover:rotate-12 transition-transform" />
                ابدأ التسوق الآن
                <FiArrowLeft className="text-2xl group-hover:-translate-x-1 transition-transform" />
              </Link>
              <Link 
                to="/about" 
                className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-2 border-white/30 text-lg md:text-xl font-semibold px-10 py-5 rounded-2xl inline-flex items-center justify-center gap-3 transition-all"
              >
                اعرف أكثر عنا
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm md:text-base text-white/80 pt-8 border-t border-white/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-400 rounded-full flex items-center justify-center">
                  <FiCheck className="text-white" />
                </div>
                <span>توصيل مضمون</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center">
                  <FiShield className="text-white" />
                </div>
                <span>دفع آمن</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                  <FiStar className="text-white" />
                </div>
                <span>خدمة ممتازة</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
