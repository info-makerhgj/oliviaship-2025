import { FiSettings, FiShield, FiInfo, FiSliders } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { settingsAPI } from '../../utils/api';

export default function CookiesPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setSettings(res.data.settings);
    } catch (error) {
      console.error('Failed to load settings', error);
    } finally {
      setLoading(false);
    }
  };

  // Default content
  const defaultContent = (
    <>
      {/* Introduction */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FiInfo className="text-primary-dynamic" />
          ما هي ملفات تعريف الارتباط؟
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          ملفات تعريف الارتباط (Cookies) هي ملفات نصية صغيرة يتم تخزينها على جهازك (الكمبيوتر، الهاتف، أو الجهاز اللوحي) عند زيارة موقعنا. تساعدنا هذه الملفات في تحسين تجربتك على الموقع وتقديم خدمات أفضل.
        </p>
      </section>

      {/* Types of Cookies */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FiSettings className="text-primary-dynamic" />
          أنواع ملفات تعريف الارتباط التي نستخدمها
        </h2>
        <div className="space-y-6 text-gray-700">
          {/* Essential Cookies */}
          <div className="border-r-4 border-primary-dynamic pr-4">
            <h3 className="font-bold text-lg mb-2">1. ملفات تعريف الارتباط الضرورية</h3>
            <p className="mb-2">هذه الملفات ضرورية لعمل الموقع بشكل صحيح:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>تسجيل الدخول والحفاظ على جلسة المستخدم</li>
              <li>حفظ تفضيلات اللغة والمنطقة</li>
              <li>حفظ عناصر سلة التسوق</li>
              <li>الأمان ومنع الاحتيال</li>
            </ul>
            <p className="mt-2 text-sm text-gray-600">⚠️ لا يمكن تعطيل هذه الملفات دون التأثير على وظائف الموقع</p>
          </div>

          {/* Performance Cookies */}
          <div className="border-r-4 border-blue-500 pr-4">
            <h3 className="font-bold text-lg mb-2">2. ملفات تعريف الارتباط الخاصة بالأداء</h3>
            <p className="mb-2">تساعدنا في فهم كيفية استخدام الزوار للموقع:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>عدد الزوار والصفحات التي يزورونها</li>
              <li>مدة زيارة الموقع</li>
              <li>مصادر الزيارات (Google، روابط مباشرة، إلخ)</li>
              <li>الأخطاء التي قد تحدث</li>
            </ul>
            <p className="mt-2 text-sm text-gray-600">✅ يمكن تعطيل هذه الملفات من إعدادات المتصفح</p>
          </div>

          {/* Functionality Cookies */}
          <div className="border-r-4 border-purple-500 pr-4">
            <h3 className="font-bold text-lg mb-2">3. ملفات تعريف الارتباط الوظيفية</h3>
            <p className="mb-2">تحسن تجربة المستخدم بتذكر تفضيلاتك:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>الإعدادات المفضلة (اللغة، العملة، إلخ)</li>
              <li>تذكر معلومات تسجيل الدخول</li>
              <li>تفضيلات العرض (الخط، الحجم، إلخ)</li>
              <li>تخصيص المحتوى حسب اهتماماتك</li>
            </ul>
            <p className="mt-2 text-sm text-gray-600">✅ يمكن تعطيل هذه الملفات، لكن قد تتأثر بعض الوظائف</p>
          </div>

          {/* Marketing Cookies */}
          <div className="border-r-4 border-pink-500 pr-4">
            <h3 className="font-bold text-lg mb-2">4. ملفات تعريف الارتباط التسويقية</h3>
            <p className="mb-2">تُستخدم لتتبع زياراتك عبر المواقع لعرض إعلانات مخصصة:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>تتبع الإعلانات التي رأيتها</li>
              <li>قياس فعالية الحملات التسويقية</li>
              <li>عرض إعلانات مخصصة حسب اهتماماتك</li>
              <li>منع عرض نفس الإعلان مرات متعددة</li>
            </ul>
            <p className="mt-2 text-sm text-gray-600">✅ يمكن تعطيل هذه الملفات دائماً من إعدادات المتصفح</p>
          </div>
        </div>
      </section>

      {/* Third-Party Cookies */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">ملفات تعريف الارتباط لطرف ثالث</h2>
        <div className="space-y-3 text-gray-700">
          <p className="leading-relaxed">
            نستخدم أيضاً ملفات تعريف الارتباط من خدمات خارجية:
          </p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>Google Analytics:</strong> لتحليل سلوك الزوار وتحسين الموقع</li>
            <li><strong>Google Ads:</strong> لعرض إعلانات مخصصة</li>
            <li><strong>Facebook Pixel:</strong> لتتبع فعالية الإعلانات على Facebook</li>
            <li><strong>خدمات الدفع:</strong> لمعالجة المدفوعات بشكل آمن</li>
          </ul>
          <p className="leading-relaxed mt-4">
            هذه الخدمات قد تجمع معلومات عنك حسب سياسات الخصوصية الخاصة بها. ننصحك بمراجعة سياسات الخصوصية لهذه الخدمات.
          </p>
        </div>
      </section>

      {/* How to Manage Cookies */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FiShield className="text-primary-dynamic" />
          كيفية إدارة ملفات تعريف الارتباط
        </h2>
        <div className="space-y-4 text-gray-700">
          <p className="leading-relaxed">
            يمكنك التحكم في ملفات تعريف الارتباط من خلال:
          </p>
          
          <div>
            <h3 className="font-semibold mb-2">1. إعدادات المتصفح:</h3>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li><strong>Google Chrome:</strong> الإعدادات → الخصوصية والأمان → ملفات تعريف الارتباط</li>
              <li><strong>Firefox:</strong> الإعدادات → الخصوصية والأمان → ملفات تعريف الارتباط</li>
              <li><strong>Safari:</strong> التفضيلات → الخصوصية → ملفات تعريف الارتباط</li>
              <li><strong>Edge:</strong> الإعدادات → ملفات تعريف الارتباط وأذونات الموقع</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. إعدادات الموقع:</h3>
            <p className="leading-relaxed">
              يمكنك إدارة تفضيلات ملفات تعريف الارتباط من خلال لوحة التحكم في حسابك أو من خلال إشعار ملفات تعريف الارتباط الذي يظهر عند أول زيارة.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-800 text-sm">
              ⚠️ <strong>ملاحظة مهمة:</strong> تعطيل ملفات تعريف الارتباط الضرورية قد يؤثر على وظائف الموقع وقد لا تتمكن من استخدام بعض الميزات مثل تسجيل الدخول أو إضافة منتجات إلى السلة.
            </p>
          </div>
        </div>
      </section>

      {/* Cookie Duration */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">مدة صلاحية ملفات تعريف الارتباط</h2>
        <div className="space-y-3 text-gray-700">
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>ملفات تعريف الارتباط الجلسة:</strong> تُحذف تلقائياً عند إغلاق المتصفح</li>
            <li><strong>ملفات تعريف الارتباط الدائمة:</strong> تبقى لمدة تتراوح بين 30 يوم إلى سنة واحدة</li>
            <li><strong>ملفات تعريف الارتباط الطرف الثالث:</strong> تخضع لسياسات الخدمات الخارجية</li>
          </ul>
        </div>
      </section>

      {/* Do Not Track */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">إشارة "عدم التتبع" (Do Not Track)</h2>
        <p className="text-gray-700 leading-relaxed">
          بعض المتصفحات تدعم ميزة "عدم التتبع" (DNT). حالياً، لا نستجيب لإشارات DNT لأننا لا نملك معياراً موحداً لتفسيرها. نحن نرحب بإنشاء معيار موحد في المستقبل.
        </p>
      </section>

      {/* Updates */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">تحديثات سياسة ملفات تعريف الارتباط</h2>
        <p className="text-gray-700 leading-relaxed">
          قد نحدث هذه السياسة من وقت لآخر لتعكس تغييرات في استخدامنا لملفات تعريف الارتباط أو لأسباب تشغيلية أو قانونية أو تنظيمية. ننصحك بمراجعة هذه الصفحة بشكل دوري.
        </p>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">الاتصال بنا</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          إذا كان لديك أي أسئلة حول استخدامنا لملفات تعريف الارتباط، يرجى التواصل معنا:
        </p>
        <div className="space-y-2 text-gray-700">
          <p>📧 البريد الإلكتروني: <a href="mailto:privacy@oliviaship.com" className="text-primary-dynamic hover:underline">privacy@oliviaship.com</a></p>
          <p>📞 الهاتف: متوفر في صفحة اتصل بنا</p>
        </div>
      </section>
    </>
  );

  // Custom content from settings
  const customContent = settings?.legalPages?.cookies;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-dynamic mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="gradient-dynamic w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FiSliders className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">سياسة ملفات تعريف الارتباط (Cookies)</h1>
          <p className="text-gray-600">آخر تحديث: {new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-8">
          {customContent && customContent.trim() ? (
            <div 
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: customContent }}
            />
          ) : (
            defaultContent
          )}

          {/* Footer */}
          <div className="border-t pt-6 mt-8">
            <p className="text-sm text-gray-500 text-center">
              © {new Date().getFullYear()} أوليفيا شيب. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
