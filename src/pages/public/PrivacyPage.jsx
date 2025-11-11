import { FiShield, FiLock, FiEye, FiUser, FiMail } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { settingsAPI } from '../../utils/api';

export default function PrivacyPage() {
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
          <FiLock className="text-primary-dynamic" />
          مقدمة
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          في <strong>أوليفيا شيب</strong>، نحن ملتزمون بحماية خصوصيتك وأمان معلوماتك الشخصية. تشرح هذه السياسة كيف نجمع ونستخدم ونحمي بياناتك عند استخدام موقعنا وخدماتنا.
        </p>
      </section>

      {/* Information We Collect */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FiUser className="text-primary-dynamic" />
          المعلومات التي نجمعها
        </h2>
        <div className="space-y-4 text-gray-700">
          <div>
            <h3 className="font-semibold mb-2">1. المعلومات الشخصية:</h3>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>الاسم الكامل</li>
              <li>عنوان البريد الإلكتروني</li>
              <li>رقم الهاتف</li>
              <li>العنوان البريدي (للتوصيل)</li>
              <li>معلومات الدفع (يتم تشفيرها ولا نحتفظ بها)</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">2. معلومات الاستخدام:</h3>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>عنوان IP</li>
              <li>نوع المتصفح ونسخته</li>
              <li>نظام التشغيل</li>
              <li>صفحات الموقع التي تزورها</li>
              <li>وقت ومدة الزيارة</li>
              <li>روابط المنتجات التي تبحث عنها</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">3. معلومات الطلبات:</h3>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>تفاصيل المنتجات المطلوبة</li>
              <li>تاريخ ووقت الطلبات</li>
              <li>حالة الطلبات</li>
              <li>سجل المدفوعات</li>
            </ul>
          </div>
        </div>
      </section>

      {/* How We Use Information */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FiEye className="text-primary-dynamic" />
          كيف نستخدم المعلومات
        </h2>
        <div className="space-y-3 text-gray-700">
          <p className="leading-relaxed">نستخدم المعلومات التي نجمعها للأغراض التالية:</p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>تقديم الخدمة:</strong> معالجة الطلبات وتوصيل المنتجات</li>
            <li><strong>التواصل:</strong> إرسال تحديثات الطلبات والإشعارات</li>
            <li><strong>تحسين الخدمة:</strong> تحليل سلوك المستخدمين لتحسين تجربة المستخدم</li>
            <li><strong>الأمان:</strong> منع الاحتيال والأنشطة غير القانونية</li>
            <li><strong>التسويق:</strong> إرسال عروض خاصة ورسائل ترويجية (بموافقتك)</li>
            <li><strong>الدعم الفني:</strong> حل المشاكل والدعم الفني</li>
            <li><strong>الامتثال القانوني:</strong> الالتزام بالقوانين والأنظمة المعمول بها</li>
          </ul>
        </div>
      </section>

      {/* Data Protection */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">حماية البيانات</h2>
        <div className="space-y-3 text-gray-700">
          <p className="leading-relaxed">
            نحن نحمي معلوماتك باستخدام:
          </p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>التشفير:</strong> جميع البيانات الحساسة مشفرة باستخدام تقنيات SSL/TLS</li>
            <li><strong>الخوادم الآمنة:</strong> بياناتك محفوظة على خوادم آمنة ومحمية</li>
            <li><strong>الوصول المقيد:</strong> فقط الموظفون المصرح لهم يمكنهم الوصول إلى بياناتك</li>
            <li><strong>النسخ الاحتياطي:</strong> نسخ احتياطية منتظمة للبيانات</li>
            <li><strong>مراقبة الأمان:</strong> أنظمة مراقبة متقدمة لاكتشاف أي أنشطة مشبوهة</li>
          </ul>
        </div>
      </section>

      {/* Data Sharing */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">مشاركة المعلومات</h2>
        <div className="space-y-3 text-gray-700">
          <p className="leading-relaxed">
            <strong>أوليفيا شيب</strong> لا تبيع أو تؤجر بياناتك الشخصية لأطراف ثالثة. قد نشارك معلوماتك مع:
          </p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>مزودو الخدمة:</strong> شركات الشحن ومعالجة الدفع (لأغراض تقديم الخدمة فقط)</li>
            <li><strong>السلطات القانونية:</strong> عند الالتزام بالقوانين أو أوامر المحاكم</li>
            <li><strong>حماية الحقوق:</strong> لحماية حقوقنا أو حقوق المستخدمين الآخرين</li>
          </ul>
          <p className="leading-relaxed mt-4">
            جميع الأطراف الثالثة ملزمة بمعايير حماية البيانات نفسها التي نتبعها.
          </p>
        </div>
      </section>

      {/* Your Rights */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">حقوقك</h2>
        <div className="space-y-3 text-gray-700">
          <p className="leading-relaxed">لديك الحق في:</p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li><strong>الوصول:</strong> طلب نسخة من بياناتك الشخصية</li>
            <li><strong>التصحيح:</strong> تصحيح أي معلومات غير دقيقة</li>
            <li><strong>الحذف:</strong> طلب حذف بياناتك (مع مراعاة القوانين المعمول بها)</li>
            <li><strong>الاعتراض:</strong> الاعتراض على معالجة بياناتك لأغراض معينة</li>
            <li><strong>القيود:</strong> طلب تقييد معالجة بياناتك</li>
            <li><strong>المنقولية:</strong> نقل بياناتك إلى خدمة أخرى</li>
            <li><strong>إلغاء الاشتراك:</strong> إلغاء الاشتراك في الرسائل التسويقية</li>
          </ul>
          <p className="leading-relaxed mt-4">
            لممارسة أي من هذه الحقوق، يرجى التواصل معنا عبر البريد الإلكتروني.
          </p>
        </div>
      </section>

      {/* Cookies */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">ملفات تعريف الارتباط (Cookies)</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          نستخدم ملفات تعريف الارتباط لتحسين تجربتك على موقعنا. يمكنك إدارة تفضيلات ملفات تعريف الارتباط من إعدادات المتصفح. لمزيد من التفاصيل، يرجى مراجعة <a href="/cookies" className="text-primary-dynamic hover:underline">سياسة ملفات تعريف الارتباط</a>.
        </p>
      </section>

      {/* Third-Party Links */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">روابط أطراف ثالثة</h2>
        <p className="text-gray-700 leading-relaxed">
          قد يحتوي موقعنا على روابط لمواقع خارجية. نحن لسنا مسؤولين عن سياسات الخصوصية أو محتويات هذه المواقع. ننصحك بمراجعة سياسات الخصوصية الخاصة بهم.
        </p>
      </section>

      {/* Children's Privacy */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">خصوصية الأطفال</h2>
        <p className="text-gray-700 leading-relaxed">
          خدماتنا غير موجهة للأطفال دون سن 18 عاماً. لا نجمع معلومات عن الأطفال دون وعي. إذا اكتشفنا أننا جمعنا معلومات من طفل دون موافقة الوالدين، سنقوم بحذف هذه المعلومات فوراً.
        </p>
      </section>

      {/* Changes to Privacy Policy */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">تغييرات سياسة الخصوصية</h2>
        <p className="text-gray-700 leading-relaxed">
          قد نحدث هذه السياسة من وقت لآخر. سنقوم بإشعارك بأي تغييرات مهمة عبر البريد الإلكتروني أو إشعار على الموقع. ننصحك بمراجعة هذه الصفحة بشكل دوري.
        </p>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">الاتصال بنا</h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          إذا كان لديك أي أسئلة أو مخاوف حول سياسة الخصوصية هذه، يرجى التواصل معنا:
        </p>
        <div className="space-y-2 text-gray-700">
          <p className="flex items-center gap-2">
            <FiMail className="text-primary-dynamic" />
            البريد الإلكتروني: <a href="mailto:privacy@oliviaship.com" className="text-primary-dynamic hover:underline">privacy@oliviaship.com</a>
          </p>
          <p>📞 الهاتف: متوفر في صفحة اتصل بنا</p>
        </div>
      </section>
    </>
  );

  // Custom content from settings
  const customContent = settings?.legalPages?.privacy;

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
            <FiShield className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">سياسة الخصوصية</h1>
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
