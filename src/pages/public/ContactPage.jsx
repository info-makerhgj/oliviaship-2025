import { useState, useEffect } from 'react';
import { FiMail, FiPhone, FiMapPin, FiClock, FiSend, FiLoader, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { settingsAPI, contactAPI } from '../../utils/api';

export default function ContactPage() {
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    setSuccess(false);

    try {
      await contactAPI.send(formData);
      
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'فشل في إرسال الرسالة. يرجى المحاولة لاحقاً.');
    } finally {
      setSending(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="gradient-primary text-white py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-xl font-bold mb-4">اتصل بنا</h1>
            <p className="text-sm text-primary-100">
              نحن هنا للإجابة على استفساراتك ومساعدتك في أي وقت
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-1 space-y-6">
              <div className="card">
                <h2 className="text-lg font-bold mb-6">معلومات الاتصال</h2>
                
                {settings?.general?.contactEmail && (
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-primary-100 p-3 rounded-xl flex-shrink-0">
                      <FiMail className="text-primary-600 text-xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold mb-1">البريد الإلكتروني</h3>
                      <a
                        href={`mailto:${settings.general.contactEmail}`}
                        className="text-sm text-primary-600 hover:underline"
                      >
                        {settings.general.contactEmail}
                      </a>
                    </div>
                  </div>
                )}

                {settings?.general?.contactPhone && (
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-blue-100 p-3 rounded-xl flex-shrink-0">
                      <FiPhone className="text-blue-600 text-xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold mb-1">رقم الهاتف</h3>
                      <a
                        href={`tel:${settings.general.contactPhone}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {settings.general.contactPhone}
                      </a>
                    </div>
                  </div>
                )}

                {settings?.general?.address && (
                  <div className="flex items-start gap-4 mb-6">
                    <div className="bg-green-100 p-3 rounded-xl flex-shrink-0">
                      <FiMapPin className="text-green-600 text-xl" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold mb-1">العنوان</h3>
                      <p className="text-sm text-gray-600">{settings.general.address}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="bg-purple-100 p-3 rounded-xl flex-shrink-0">
                    <FiClock className="text-purple-500 text-xl" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold mb-1">ساعات العمل</h3>
                    <p className="text-sm text-gray-600">
                      من السبت إلى الخميس<br />
                      9 صباحاً - 6 مساءً
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <div className="card">
                <h2 className="text-lg font-bold mb-6">أرسل لنا رسالة</h2>

                {success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                    <FiCheck />
                    تم إرسال رسالتك بنجاح! سنتواصل معك قريباً.
                  </div>
                )}

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                    <FiAlertCircle />
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">الاسم الكامل</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="input-field w-full"
                        placeholder="اسمك الكامل"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">البريد الإلكتروني</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="input-field w-full"
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="input-field w-full"
                      placeholder="+967 XXX XXX XXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">الموضوع</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="input-field w-full"
                      placeholder="موضوع الرسالة"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold mb-2">الرسالة</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows="6"
                      className="input-field w-full"
                      placeholder="اكتب رسالتك هنا..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    {sending ? (
                      <>
                        <FiLoader className="animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <FiSend />
                        إرسال الرسالة
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
