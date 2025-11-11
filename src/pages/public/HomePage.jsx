import { Link } from 'react-router-dom';
import { FiShoppingBag, FiTruck, FiShield, FiClock, FiCheck, FiTrendingUp, FiUsers, FiPackage } from 'react-icons/fi';
import { FaAmazon, FaShoppingCart } from 'react-icons/fa';
import SEO from '../../components/SEO';
import StructuredData from '../../components/StructuredData';

export default function HomePage() {
  const stores = [
    { name: 'Amazon', icon: FaAmazon, color: 'text-orange-500' },
    { name: 'Noon', color: 'text-red-500' },
    { name: 'SHEIN', color: 'text-pink-500' },
    { name: 'AliExpress', color: 'text-red-600' },
    { name: 'Temu', color: 'text-blue-600' },
  ];

  const features = [
    { icon: FiShoppingBag, title: 'طلب سهل', desc: 'الصق رابط المنتج واحصل على السعر فوراً' },
    { icon: FiClock, title: 'حساب سريع', desc: 'حساب تلقائي للتكلفة الشاملة خلال ثوان' },
    { icon: FiTruck, title: 'شحن موثوق', desc: 'شحن آمن وموثوق من المتاجر العالمية' },
    { icon: FiShield, title: 'توصيل مضمون', desc: 'ضمان وصول المنتج بأمان إلى باب منزلك' },
  ];

  const stats = [
    { number: '10,000+', label: 'طلبات منفذة' },
    { number: '5,000+', label: 'عميل سعيد' },
    { number: '98%', label: 'معدل الرضا' },
    { number: '24/7', label: 'خدمة متاحة' },
  ];

  return (
    <div className="min-h-screen">
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 text-gray-800 py-20 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight bg-gradient-to-r from-blue-600 via-purple-400 to-pink-600 bg-clip-text text-transparent">
              أوليفيا شيب - خدمة التوصيل الفاخر إلى اليمن
            </h1>
            <p className="text-sm md:text-base mb-6 text-gray-700 leading-relaxed">
              نوصل منتجاتك من المتاجر العالمية الفاخرة مثل أمازون، نون، شي إن، علي إكسبريس والمزيد. 
              <br className="hidden md:block" />
              نحسب التكلفة الشاملة، نشتري المنتج، ونوصلها لك بأمان وثقة!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/cart" className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-sm md:text-base px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:scale-105">
                <FiShoppingBag />
                اذهب إلى السلة
              </Link>
              <Link to="/track" className="bg-white text-gray-700 hover:bg-gray-50 border-2 border-purple-300 text-sm md:text-base px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 transition-all duration-300 shadow-md hover:shadow-lg">
                <FiTruck />
                تتبع طلبك
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 border-b border-purple-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center bg-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-shadow">
                <div className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-400 bg-clip-text text-transparent mb-1">{stat.number}</div>
                <div className="text-xs md:text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-xl md:text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-400 to-pink-600 bg-clip-text text-transparent">كيف نعمل</h2>
            <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
              عملية بسيطة في 4 خطوات فقط
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const cardColors = [
                {
                  gradient: 'from-blue-300 to-blue-400',
                  bg: 'bg-blue-100',
                  text: 'text-blue-600',
                  border: 'border-blue-200'
                },
                {
                  gradient: 'from-purple-300 to-purple-400',
                  bg: 'bg-purple-100',
                  text: 'text-purple-400',
                  border: 'border-purple-200'
                },
                {
                  gradient: 'from-pink-300 to-pink-400',
                  bg: 'bg-pink-100',
                  text: 'text-pink-600',
                  border: 'border-pink-200'
                },
                {
                  gradient: 'from-indigo-300 to-indigo-400',
                  bg: 'bg-indigo-100',
                  text: 'text-indigo-600',
                  border: 'border-indigo-200'
                }
              ];
              const color = cardColors[idx];
              return (
                <div key={idx} className={`card-hover text-center group ${color.bg} border-2 ${color.border}`}>
                  <div className={`bg-gradient-to-br ${color.gradient} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon className="text-white text-xl" />
                  </div>
                  <div className={`bg-white ${color.text} w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-sm shadow-md border-2 ${color.border}`}>
                    {idx + 1}
                  </div>
                  <h3 className={`text-base md:text-lg font-bold mb-2 ${color.text}`}>{feature.title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Supported Stores */}
      <section className="py-20 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-400 to-pink-600 bg-clip-text text-transparent">المتاجر المدعومة</h2>
            <p className="text-sm md:text-base text-gray-600">نوصل من جميع المتاجر العالمية الكبرى</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 max-w-4xl mx-auto">
            {stores.map((store, idx) => {
              const Icon = store.icon || FiPackage;
              return (
                <div key={idx} className="card-hover text-center p-6">
                  <Icon className={`text-3xl md:text-4xl mx-auto mb-3 ${store.color || 'text-gray-600'}`} />
                  <h3 className="font-bold text-sm md:text-base">{store.name}</h3>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-xl md:text-2xl font-bold mb-3 bg-gradient-to-r from-blue-600 via-purple-400 to-pink-600 bg-clip-text text-transparent">لماذا نحن؟</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                'حساب تلقائي شامل لجميع التكاليف',
                'دعم عملاء متواصل على مدار الساعة',
                'تتبع كامل لطلبك من الشراء حتى التوصيل',
                'أسعار شفافة بدون مفاجآت',
                'توصيل آمن ومضمون',
                'دعم جميع طرق الدفع',
              ].map((benefit, idx) => (
                <div key={idx} className="flex items-start gap-4 card p-4 bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 hover:border-purple-300 transition-colors">
                  <FiCheck className="text-purple-500 text-lg flex-shrink-0 mt-0.5" />
                  <p className="text-sm md:text-base font-medium text-gray-700">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-200 to-purple-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl"></div>
        </div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-xl md:text-2xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-400 to-pink-600 bg-clip-text text-transparent">جاهز لطلب منتجاتك؟</h2>
          <p className="text-sm md:text-base mb-6 text-gray-700 max-w-2xl mx-auto">
            ابدأ الآن واطلب منتجاتك من المتاجر العالمية بسهولة وأمان
          </p>
          <Link to="/cart" className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-white hover:from-blue-500 hover:via-purple-500 hover:to-pink-500 text-sm md:text-base px-6 py-3 rounded-xl inline-flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-xl hover:scale-105">
            <FaShoppingCart />
            اذهب إلى السلة
          </Link>
        </div>
      </section>
    </div>
  );
}
