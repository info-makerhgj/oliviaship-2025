import { FiFileText, FiShield, FiCheckCircle } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { settingsAPI } from '../../utils/api';

export default function TermsPage() {
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
          <FiCheckCircle className="text-primary-dynamic" />
          مقدمة
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          مرحباً بك في منصة <strong>أوليفيا شيب</strong>. باستخدامك لموقعنا وخدماتنا، فإنك توافق على الالتزام بالشروط والأحكام التالية. يرجى قراءة هذه الشروط بعناية قبل استخدام خدماتنا.
        </p>
      </section>

      {/* Acceptance of Terms */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <FiShield className="text-primary-dynamic" />
          قبول الشروط
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          عند الوصول إلى موقعنا واستخدامه، فإنك تقر بأنك قد قرأت وفهمت ووافقت على الالتزام بالشروط والأحكام الواردة هنا. إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام موقعنا.
        </p>
      </section>

      {/* Service Description */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">وصف الخدمة</h2>
        <div className="space-y-3 text-gray-700">
          <p className="leading-relaxed">
            <strong>أوليفيا شيب</strong> هي منصة رقمية تقدم خدمات التوصيل والتسوق من المتاجر العالمية إلى اليمن. تشمل خدماتنا:
          </p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>جلب المنتجات من المتاجر العالمية (Amazon, Noon, Shein, AliExpress, وغيرها)</li>
            <li>حساب التكلفة الشاملة (سعر المنتج + الشحن + العمولة + الجمارك)</li>
            <li>توصيل المنتجات إلى عنوانك في اليمن</li>
            <li>تتبع الطلبات من لحظة الشراء حتى التوصيل</li>
          </ul>
        </div>
      </section>

      {/* User Responsibilities */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">مسؤوليات المستخدم</h2>
        <div className="space-y-3 text-gray-700">
          <p className="leading-relaxed">يوافق المستخدمون على:</p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>توفير معلومات دقيقة وصحيحة عند إنشاء الحساب وإتمام الطلبات</li>
            <li>الحفاظ على سرية معلومات الحساب وكلمة المرور</li>
            <li>استخدام الخدمة لأغراض قانونية فقط</li>
            <li>عدم استخدام الخدمة لأي نشاط غير قانوني أو احتيالي</li>
            <li>التحقق من صحة روابط المنتجات قبل إرسال الطلبات</li>
            <li>الالتزام بجميع القوانين المحلية والدولية المعمول بها</li>
          </ul>
        </div>
      </section>

      {/* Pricing and Payments */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">الأسعار والدفع</h2>
        <div className="space-y-3 text-gray-700">
          <p className="leading-relaxed">
            <strong>التكلفة الإجمالية</strong> تشمل:
          </p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>سعر المنتج من المتجر الأصلي</li>
            <li>رسوم الشحن الدولي والمحلي</li>
            <li>العمولة (نسبة مئوية من سعر المنتج)</li>
            <li>رسوم الجمارك والاستيراد (إن وجدت)</li>
            <li>رسوم إضافية (التغليف، التأمين، إلخ)</li>
          </ul>
          <p className="leading-relaxed mt-4">
            جميع الأسعار معروضة بالريال السعودي (SAR) ويمكن تحويلها إلى الريال اليمني (YER) حسب سعر الصرف المعمول به. نحتفظ بالحق في تعديل الأسعار في أي وقت دون إشعار مسبق.
          </p>
        </div>
      </section>

      {/* Order Processing */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">معالجة الطلبات</h2>
        <div className="space-y-3 text-gray-700">
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>جميع الطلبات تخضع للموافقة والتحقق من قبل فريقنا</li>
            <li>قد نحتاج إلى التواصل معك لتأكيد تفاصيل الطلب</li>
            <li>نحتفظ بالحق في رفض أي طلب دون إبداء سبب</li>
            <li>مدة التوصيل التقديرية: 10-30 يوم عمل (حسب المتجر والوجهة)</li>
            <li>قد تحدث تأخيرات بسبب ظروف خارجة عن إرادتنا (الجو، الجمارك، إلخ)</li>
          </ul>
        </div>
      </section>

      {/* Returns and Refunds */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">الإرجاع والاسترداد</h2>
        <div className="space-y-3 text-gray-700">
          <p className="leading-relaxed">
            <strong>سياسة الإرجاع:</strong>
          </p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>يمكن إرجاع المنتجات خلال 7 أيام من تاريخ الاستلام</li>
            <li>يجب أن يكون المنتج في حالته الأصلية (غير مستخدم، في العبوة الأصلية)</li>
            <li>رسوم الإرجاع والشحن على عاتق العميل</li>
            <li>لا يمكن إرجاع المنتجات القابلة للتلف أو المخصصة</li>
          </ul>
          <p className="leading-relaxed mt-4">
            <strong>سياسة الاسترداد:</strong> في حالة الإرجاع المعتمد، سيتم استرداد المبلغ خلال 5-10 أيام عمل. رسوم الشحن والعمولة غير قابلة للاسترداد.
          </p>
        </div>
      </section>

      {/* Limitation of Liability */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">حدود المسؤولية</h2>
        <div className="space-y-3 text-gray-700">
          <p className="leading-relaxed">
            <strong>أوليفيا شيب</strong> لا تتحمل مسؤولية:
          </p>
          <ul className="list-disc list-inside space-y-2 mr-4">
            <li>تأخيرات الشحن بسبب ظروف خارجة عن إرادتنا</li>
            <li>تلف المنتجات أثناء النقل (ما لم يكن لدينا تغطية تأمين)</li>
            <li>تغيير أسعار المنتجات من المتاجر الأصلية بعد تأكيد الطلب</li>
            <li>عدم توفر المنتجات في المتجر الأصلي</li>
            <li>مشاكل الجودة أو عدم مطابقة المنتج للوصف (يجب التواصل مع المتجر الأصلي)</li>
          </ul>
        </div>
      </section>

      {/* Intellectual Property */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">الملكية الفكرية</h2>
        <p className="text-gray-700 leading-relaxed">
          جميع محتويات الموقع (النصوص، الصور، الشعارات، التصاميم) محمية بحقوق الملكية الفكرية. لا يجوز نسخ أو استخدام أي محتوى دون إذن كتابي من <strong>أوليفيا شيب</strong>.
        </p>
      </section>

      {/* Modifications */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">تعديلات الشروط</h2>
        <p className="text-gray-700 leading-relaxed">
          نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم إشعارك بأي تغييرات عبر الموقع أو البريد الإلكتروني. استمرار استخدامك للخدمة بعد التعديلات يعني موافقتك على الشروط المحدثة.
        </p>
      </section>

      {/* Contact */}
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-4">الاتصال بنا</h2>
        <p className="text-gray-700 leading-relaxed">
          إذا كان لديك أي أسئلة حول هذه الشروط والأحكام، يرجى التواصل معنا عبر:
        </p>
        <div className="mt-4 space-y-2 text-gray-700">
          <p>📧 البريد الإلكتروني: <a href="mailto:support@oliviaship.com" className="text-primary-dynamic hover:underline">support@oliviaship.com</a></p>
          <p>📞 الهاتف: متوفر في صفحة اتصل بنا</p>
        </div>
      </section>
    </>
  );

  // Custom content from settings
  const customContent = settings?.legalPages?.terms;

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
            <FiFileText className="text-white text-2xl" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">الشروط والأحكام</h1>
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
