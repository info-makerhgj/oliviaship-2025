import { useEffect, useState } from 'react';
import { settingsAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { 
  FiSettings, 
  FiLoader, 
  FiSave,
  FiCheck,
  FiGlobe,
  FiDollarSign,
  FiShoppingBag,
  FiCreditCard,
  FiBell,
  FiTruck,
  FiMail,
  FiPhone,
  FiMapPin,
  FiInfo,
  FiCode,
  FiPlus,
  FiX,
  FiFileText,
  FiShield,
  FiTag
} from 'react-icons/fi';

export default function AdminSettings() {
  const { success: showSuccess, error: showError } = useToast();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.get();
      console.log('Loaded settings from server:', res.data.settings);
      console.log('Mobile Offers from server:', res.data.settings?.mobileOffers);
      setSettings(res.data.settings || {});
    } catch (error) {
      console.error('Failed to load settings', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (path, value) => {
    const keys = path.split('.');
    setSettings(prev => {
      const newSettings = JSON.parse(JSON.stringify(prev || {}));
      let current = newSettings;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      
      // Debug log for mobileOffers
      if (path === 'mobileOffers') {
        console.log('Updated mobileOffers:', value);
      }
      
      return newSettings;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('Saving settings:', settings);
      console.log('Mobile Offers:', settings.mobileOffers);
      await settingsAPI.update(settings);
      showSuccess('✅ تم حفظ الإعدادات بنجاح');
      
      // Apply theme colors immediately after saving
      if (settings.theme) {
        applyThemeColors(settings.theme);
      }
    } catch (error) {
      console.error('Failed to save settings', error);
      showError(error.response?.data?.message || 'فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };
  
  // Helper function to apply theme colors
  const applyThemeColors = (theme) => {
    const root = document.documentElement;
    
    if (theme.primaryColor) {
      root.style.setProperty('--primary-color', theme.primaryColor);
      const hoverColor = darkenColor(theme.primaryColor, 10);
      root.style.setProperty('--primary-hover', hoverColor);
    }
    
    if (theme.secondaryColor) {
      root.style.setProperty('--secondary-color', theme.secondaryColor);
      const hoverColor = darkenColor(theme.secondaryColor, 10);
      root.style.setProperty('--secondary-hover', hoverColor);
    }
    
    if (theme.bodyFont) {
      document.body.style.fontFamily = `'${theme.bodyFont}', 'Cairo', 'Tajawal', Arial, sans-serif`;
    }
    
    if (theme.headingFont) {
      root.style.setProperty('--heading-font', theme.headingFont);
      // Apply to all headings
      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
        heading.style.fontFamily = `'${theme.headingFont}', 'Cairo', 'Tajawal', Arial, sans-serif`;
      });
    }
  };
  
  // Helper function to darken a color
  const darkenColor = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, Math.min(255, (num >> 16) + -amt));
    const G = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + -amt));
    const B = Math.max(0, Math.min(255, (num & 0x0000FF) + -amt));
    return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
  };

  // Apply theme on mount and when settings change
  useEffect(() => {
    if (settings?.theme) {
      applyThemeColors(settings.theme);
    }
  }, [settings?.theme]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="animate-spin text-xl md:text-2xl text-primary-dynamic" />
      </div>
    );
  }

  if (!settings) {
    return <div className="text-center py-12">فشل في تحميل الإعدادات</div>;
  }

  const tabs = [
    { id: 'general', label: 'عام', icon: FiSettings },
    { id: 'theme', label: 'المظهر', icon: FiGlobe },
    { id: 'footer', label: 'نهاية الصفحة', icon: FiInfo },
    { id: 'legal', label: 'الصفحات القانونية', icon: FiFileText },
    { id: 'pricing', label: 'الأسعار', icon: FiDollarSign },
    { id: 'stores', label: 'المتاجر', icon: FiShoppingBag },
    { id: 'payment', label: 'المدفوعات', icon: FiCreditCard },
    { id: 'shipping', label: 'الشحن', icon: FiTruck },
    { id: 'notifications', label: 'الإشعارات', icon: FiBell },
    { id: 'advanced', label: 'متقدم', icon: FiCode },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-2 text-gradient">الإعدادات</h1>
        <p className="text-gray-600">إدارة إعدادات الموقع والتحكم في العمليات</p>
      </div>

      {/* Tabs */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Icon />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Content */}
      <div className="card">
        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiGlobe />
                الإعدادات العامة
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">اسم الموقع</label>
                <input
                  type="text"
                  value={settings.general?.siteName || ''}
                  onChange={(e) => handleChange('general.siteName', e.target.value)}
                  className="input-field w-full"
                  placeholder="اسم الموقع"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">رابط الموقع</label>
                <input
                  type="url"
                  value={settings.general?.siteUrl || ''}
                  onChange={(e) => handleChange('general.siteUrl', e.target.value)}
                  className="input-field w-full"
                  placeholder="https://example.com"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">وصف الموقع</label>
                <textarea
                  value={settings.general?.siteDescription || ''}
                  onChange={(e) => handleChange('general.siteDescription', e.target.value)}
                  className="input-field w-full min-h-[100px]"
                  placeholder="وصف الموقع..."
                />
              </div>

              {/* Logo Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">شعار الموقع</label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">رفع شعار من الجهاز:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setSaving(true);
                            const res = await settingsAPI.uploadImage(file);
                            if (res.data.success) {
                              handleChange('general.logo', res.data.dataUrl);
                              showSuccess('✅ تم رفع الشعار بنجاح');
                            }
                          } catch (error) {
                            console.error('Upload error:', error);
                            showError('فشل في رفع الشعار');
                          } finally {
                            setSaving(false);
                            e.target.value = '';
                          }
                        }
                      }}
                      className="input-field w-full text-sm"
                      disabled={saving}
                    />
                    <p className="text-xs text-gray-500 mt-1">أو</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">أو رابط الشعار:</label>
                    <input
                      type="url"
                      value={settings.general?.logo || ''}
                      onChange={(e) => handleChange('general.logo', e.target.value)}
                      className="input-field w-full"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                  {settings.general?.logo && (
                    <div className="mt-3">
                      <label className="block text-xs text-gray-600 mb-1">معاينة الشعار:</label>
                      <img
                        src={settings.general.logo.startsWith('data:') ? settings.general.logo : (settings.general.logo.startsWith('/uploads/') ? `/api${settings.general.logo}` : settings.general.logo)}
                        alt="Logo Preview"
                        className="w-32 h-32 object-contain border border-gray-200 rounded-lg p-2 bg-gray-50"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Favicon Upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2">أيقونة الموقع (Favicon)</label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">رفع أيقونة من الجهاز:</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            setSaving(true);
                            const res = await settingsAPI.uploadImage(file);
                            if (res.data.success) {
                              handleChange('general.favicon', res.data.dataUrl);
                              showSuccess('✅ تم رفع الأيقونة بنجاح');
                            }
                          } catch (error) {
                            console.error('Upload error:', error);
                            showError('فشل في رفع الأيقونة');
                          } finally {
                            setSaving(false);
                            e.target.value = '';
                          }
                        }
                      }}
                      className="input-field w-full text-sm"
                      disabled={saving}
                    />
                    <p className="text-xs text-gray-500 mt-1">أو</p>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">أو رابط الأيقونة:</label>
                    <input
                      type="url"
                      value={settings.general?.favicon || ''}
                      onChange={(e) => handleChange('general.favicon', e.target.value)}
                      className="input-field w-full"
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                  {settings.general?.favicon && (
                    <div className="mt-3">
                      <label className="block text-xs text-gray-600 mb-1">معاينة الأيقونة:</label>
                      <img
                        src={settings.general.favicon.startsWith('data:') ? settings.general.favicon : (settings.general.favicon.startsWith('/uploads/') ? `/api${settings.general.favicon}` : settings.general.favicon)}
                        alt="Favicon Preview"
                        className="w-16 h-16 object-contain border border-gray-200 rounded-lg p-2 bg-gray-50"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <FiMail />
                  البريد الإلكتروني للاتصال
                </label>
                <input
                  type="email"
                  value={settings.general?.contactEmail || ''}
                  onChange={(e) => handleChange('general.contactEmail', e.target.value)}
                  className="input-field w-full"
                  placeholder="contact@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <FiPhone />
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={settings.general?.contactPhone || ''}
                  onChange={(e) => handleChange('general.contactPhone', e.target.value)}
                  className="input-field w-full"
                  placeholder="+967 7XX XXX XXX"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <FiMapPin />
                  العنوان
                </label>
                <textarea
                  value={settings.general?.address || ''}
                  onChange={(e) => handleChange('general.address', e.target.value)}
                  className="input-field w-full min-h-[80px]"
                  placeholder="العنوان الكامل..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">العملة الافتراضية</label>
                <select
                  value={settings.general?.currency || 'YER'}
                  onChange={(e) => handleChange('general.currency', e.target.value)}
                  className="input-field w-full"
                >
                  <option value="YER">ريال يمني (YER)</option>
                  <option value="SAR">ريال سعودي (SAR)</option>
                  <option value="USD">دولار أمريكي (USD)</option>
                  <option value="EUR">يورو (EUR)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">المنطقة الزمنية</label>
                <select
                  value={settings.general?.timezone || 'Asia/Aden'}
                  onChange={(e) => handleChange('general.timezone', e.target.value)}
                  className="input-field w-full"
                >
                  <option value="Asia/Aden">Asia/Aden</option>
                  <option value="Asia/Riyadh">Asia/Riyadh</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>

              {/* SEO Settings */}
              <div className="md:col-span-2 border-t pt-6 mt-6">
                <h3 className="text-base font-bold mb-4">إعدادات SEO (تحسين محركات البحث)</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">عنوان الصفحة (Meta Title)</label>
                    <input
                      type="text"
                      value={settings.general?.metaTitle || ''}
                      onChange={(e) => handleChange('general.metaTitle', e.target.value)}
                      className="input-field w-full"
                      placeholder="عنوان يظهر في نتائج البحث..."
                    />
                    <p className="text-xs text-gray-500 mt-1">العنوان الذي يظهر في نتائج البحث (مثالي: 50-60 حرف)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">وصف الصفحة (Meta Description)</label>
                    <textarea
                      value={settings.general?.metaDescription || ''}
                      onChange={(e) => handleChange('general.metaDescription', e.target.value)}
                      className="input-field w-full min-h-[80px]"
                      placeholder="وصف يظهر في نتائج البحث..."
                    />
                    <p className="text-xs text-gray-500 mt-1">الوصف الذي يظهر في نتائج البحث (مثالي: 150-160 حرف)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">الكلمات المفتاحية (Meta Keywords)</label>
                    <input
                      type="text"
                      value={settings.general?.metaKeywords || ''}
                      onChange={(e) => handleChange('general.metaKeywords', e.target.value)}
                      className="input-field w-full"
                      placeholder="كلمة1, كلمة2, كلمة3..."
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      الكلمات المفتاحية مفصولة بفواصل (مهمة لتحسين محركات البحث). 
                      <br />
                      💡 نصيحة: استخدم كلمات مفتاحية قوية مثل "توصيل من أمازون إلى اليمن"، "شحن من نون إلى اليمن"، إلخ
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Settings */}
              <div className="md:col-span-2 border-t pt-6 mt-6">
                <h3 className="text-base font-bold mb-4">إعدادات إضافية</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.general?.showInFooter !== false}
                      onChange={(e) => handleChange('general.showInFooter', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-semibold">إظهار معلومات الموقع في Footer</span>
                  </label>
                  <p className="text-xs text-gray-500">إظهار/إخفاء قسم معلومات الموقع (الاسم، الوصف، إلخ) في Footer</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Theme Settings */}
        {activeTab === 'theme' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiGlobe />
                إعدادات المظهر والألوان
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">اللون الأساسي (Primary)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.theme?.primaryColor || '#0ea5e9'}
                    onChange={(e) => handleChange('theme.primaryColor', e.target.value)}
                    className="w-20 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.theme?.primaryColor || '#0ea5e9'}
                    onChange={(e) => {
                      handleChange('theme.primaryColor', e.target.value);
                      // Apply immediately for preview
                      const root = document.documentElement;
                      root.style.setProperty('--primary-color', e.target.value);
                      const hoverColor = darkenColor(e.target.value, 10);
                      root.style.setProperty('--primary-hover', hoverColor);
                    }}
                    className="input-field flex-1"
                    placeholder="#0ea5e9"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">اللون الأساسي المستخدم في الأزرار والعناوين</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">اللون الثانوي (Secondary)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settings.theme?.secondaryColor || '#d946ef'}
                    onChange={(e) => handleChange('theme.secondaryColor', e.target.value)}
                    className="w-20 h-10 rounded border border-gray-300 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.theme?.secondaryColor || '#d946ef'}
                    onChange={(e) => {
                      handleChange('theme.secondaryColor', e.target.value);
                      // Apply immediately for preview
                      const root = document.documentElement;
                      root.style.setProperty('--secondary-color', e.target.value);
                      const hoverColor = darkenColor(e.target.value, 10);
                      root.style.setProperty('--secondary-hover', hoverColor);
                    }}
                    className="input-field flex-1"
                    placeholder="#d946ef"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">اللون الثانوي المستخدم في التدرجات والتفاصيل</p>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.theme?.darkMode || false}
                    onChange={(e) => handleChange('theme.darkMode', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-semibold">تفعيل الوضع الليلي (Dark Mode)</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">تفعيل الوضع الليلي للموقع (قيد التطوير)</p>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
              <label className="block text-sm font-semibold mb-3">معاينة الألوان:</label>
              <div className="flex gap-4">
                <div className="flex-1">
                  <div
                    className="h-16 rounded-lg flex items-center justify-center text-white font-bold mb-2"
                    style={{ backgroundColor: settings.theme?.primaryColor || '#0ea5e9' }}
                  >
                    اللون الأساسي
                  </div>
                </div>
                <div className="flex-1">
                  <div
                    className="h-16 rounded-lg flex items-center justify-center text-white font-bold mb-2"
                    style={{ backgroundColor: settings.theme?.secondaryColor || '#d946ef' }}
                  >
                    اللون الثانوي
                  </div>
                </div>
                <div className="flex-1">
                  <div
                    className="h-16 rounded-lg flex items-center justify-center text-white font-bold mb-2"
                    style={{
                      background: `linear-gradient(to right, ${settings.theme?.primaryColor || '#0ea5e9'}, ${settings.theme?.secondaryColor || '#d946ef'})`
                    }}
                  >
                    التدرج
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Theme Settings */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-base font-bold mb-4">إعدادات إضافية للمظهر</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">خط العناوين</label>
                  <select
                    value={settings.theme?.headingFont || 'Cairo'}
                    onChange={(e) => {
                      handleChange('theme.headingFont', e.target.value);
                      // Apply immediately
                      document.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
                        heading.style.fontFamily = `'${e.target.value}', 'Cairo', 'Tajawal', Arial, sans-serif`;
                      });
                    }}
                    className="input-field w-full"
                  >
                    <option value="Cairo">Cairo</option>
                    <option value="Tajawal">Tajawal</option>
                    <option value="Arial">Arial</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">خط النصوص</label>
                  <select
                    value={settings.theme?.bodyFont || 'Tajawal'}
                    onChange={(e) => {
                      handleChange('theme.bodyFont', e.target.value);
                      // Apply immediately
                      document.body.style.fontFamily = `'${e.target.value}', 'Cairo', 'Tajawal', Arial, sans-serif`;
                    }}
                    className="input-field w-full"
                  >
                    <option value="Tajawal">Tajawal</option>
                    <option value="Cairo">Cairo</option>
                    <option value="Arial">Arial</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Settings */}
        {activeTab === 'footer' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiInfo />
                إعدادات نهاية الصفحة (Footer)
              </h2>
            </div>

            <div className="space-y-6">
              {/* Footer Description */}
              <div>
                <label className="block text-sm font-semibold mb-2">وصف Footer</label>
                <textarea
                  value={settings.footer?.footerDescription || ''}
                  onChange={(e) => handleChange('footer.footerDescription', e.target.value)}
                  className="input-field w-full min-h-[100px]"
                  placeholder="وصف يظهر في Footer..."
                />
                <p className="text-xs text-gray-500 mt-1">الوصف الذي يظهر في قسم "من نحن" في Footer</p>
              </div>

              {/* Copyright Text */}
              <div>
                <label className="block text-sm font-semibold mb-2">نص حقوق النشر</label>
                <input
                  type="text"
                  value={settings.footer?.copyrightText || 'جميع الحقوق محفوظة'}
                  onChange={(e) => handleChange('footer.copyrightText', e.target.value)}
                  className="input-field w-full"
                  placeholder="جميع الحقوق محفوظة"
                />
                <p className="text-xs text-gray-500 mt-1">النص الذي يظهر في نهاية Footer (سيتم إضافة السنة تلقائياً)</p>
              </div>

              {/* Social Links */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold">روابط وسائل التواصل الاجتماعي</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.footer?.showSocialLinks !== false}
                      onChange={(e) => handleChange('footer.showSocialLinks', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm">إظهار روابط وسائل التواصل</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Facebook</label>
                    <input
                      type="url"
                      value={settings.footer?.socialLinks?.facebook || ''}
                      onChange={(e) => handleChange('footer.socialLinks.facebook', e.target.value)}
                      className="input-field w-full"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Instagram</label>
                    <input
                      type="url"
                      value={settings.footer?.socialLinks?.instagram || ''}
                      onChange={(e) => handleChange('footer.socialLinks.instagram', e.target.value)}
                      className="input-field w-full"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Twitter</label>
                    <input
                      type="url"
                      value={settings.footer?.socialLinks?.twitter || ''}
                      onChange={(e) => handleChange('footer.socialLinks.twitter', e.target.value)}
                      className="input-field w-full"
                      placeholder="https://twitter.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">LinkedIn</label>
                    <input
                      type="url"
                      value={settings.footer?.socialLinks?.linkedin || ''}
                      onChange={(e) => handleChange('footer.socialLinks.linkedin', e.target.value)}
                      className="input-field w-full"
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">WhatsApp</label>
                    <input
                      type="text"
                      value={settings.footer?.socialLinks?.whatsapp || ''}
                      onChange={(e) => handleChange('footer.socialLinks.whatsapp', e.target.value)}
                      className="input-field w-full"
                      placeholder="967XXXXXXXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">YouTube</label>
                    <input
                      type="url"
                      value={settings.footer?.socialLinks?.youtube || ''}
                      onChange={(e) => handleChange('footer.socialLinks.youtube', e.target.value)}
                      className="input-field w-full"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Footer Links - Services */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold">روابط الخدمات</h3>
                  <button
                    onClick={() => {
                      const newLinks = [...(settings.footer?.footerLinks?.services || []), { label: '', url: '' }];
                      handleChange('footer.footerLinks.services', newLinks);
                    }}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    <FiPlus />
                    إضافة رابط
                  </button>
                </div>
                <div className="space-y-3">
                  {(settings.footer?.footerLinks?.services || []).map((link, index) => (
                    <div key={index} className="flex gap-3 items-start border border-gray-200 rounded-lg p-3">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={link.label || ''}
                          onChange={(e) => {
                            const newLinks = [...(settings.footer?.footerLinks?.services || [])];
                            newLinks[index].label = e.target.value;
                            handleChange('footer.footerLinks.services', newLinks);
                          }}
                          className="input-field"
                          placeholder="اسم الرابط"
                        />
                        <input
                          type="url"
                          value={link.url || ''}
                          onChange={(e) => {
                            const newLinks = [...(settings.footer?.footerLinks?.services || [])];
                            newLinks[index].url = e.target.value;
                            handleChange('footer.footerLinks.services', newLinks);
                          }}
                          className="input-field"
                          placeholder="/order أو https://..."
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newLinks = (settings.footer?.footerLinks?.services || []).filter((_, i) => i !== index);
                          handleChange('footer.footerLinks.services', newLinks);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiX className="text-lg" />
                      </button>
                    </div>
                  ))}
                  {(!settings.footer?.footerLinks?.services || settings.footer.footerLinks.services.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">لا توجد روابط مضافة</p>
                  )}
                </div>
              </div>

              {/* Footer Links - Information */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold">روابط المعلومات</h3>
                  <button
                    onClick={() => {
                      const newLinks = [...(settings.footer?.footerLinks?.information || []), { label: '', url: '' }];
                      handleChange('footer.footerLinks.information', newLinks);
                    }}
                    className="btn-primary text-sm flex items-center gap-2"
                  >
                    <FiPlus />
                    إضافة رابط
                  </button>
                </div>
                <div className="space-y-3">
                  {(settings.footer?.footerLinks?.information || []).map((link, index) => (
                    <div key={index} className="flex gap-3 items-start border border-gray-200 rounded-lg p-3">
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={link.label || ''}
                          onChange={(e) => {
                            const newLinks = [...(settings.footer?.footerLinks?.information || [])];
                            newLinks[index].label = e.target.value;
                            handleChange('footer.footerLinks.information', newLinks);
                          }}
                          className="input-field"
                          placeholder="اسم الرابط"
                        />
                        <input
                          type="url"
                          value={link.url || ''}
                          onChange={(e) => {
                            const newLinks = [...(settings.footer?.footerLinks?.information || [])];
                            newLinks[index].url = e.target.value;
                            handleChange('footer.footerLinks.information', newLinks);
                          }}
                          className="input-field"
                          placeholder="/about أو https://..."
                        />
                      </div>
                      <button
                        onClick={() => {
                          const newLinks = (settings.footer?.footerLinks?.information || []).filter((_, i) => i !== index);
                          handleChange('footer.footerLinks.information', newLinks);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <FiX className="text-lg" />
                      </button>
                    </div>
                  ))}
                  {(!settings.footer?.footerLinks?.information || settings.footer.footerLinks.information.length === 0) && (
                    <p className="text-sm text-gray-500 text-center py-4">لا توجد روابط مضافة</p>
                  )}
                </div>
              </div>

              {/* Footer Additional Settings */}
              <div className="border-t pt-6">
                <h3 className="text-base font-bold mb-4">إعدادات إضافية للـ Footer</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.footer?.showContactInfo !== false}
                      onChange={(e) => handleChange('footer.showContactInfo', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm">إظهار قسم "اتصل بنا"</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.footer?.showFooterLinks !== false}
                      onChange={(e) => handleChange('footer.showFooterLinks', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm">إظهار روابط Footer</span>
                  </label>
                </div>
              </div>

              {/* Footer Preview */}
              <div className="border-t pt-6 mt-6">
                <h3 className="text-base font-bold mb-4">معاينة Footer</h3>
                {(() => {
                  // Calculate preview data
                  const previewFooterLinks = settings.footer?.footerLinks || {
                    services: [],
                    information: [],
                  };
                  const previewSocialLinksData = settings.footer?.socialLinks || {};
                  const previewShowSocialLinks = settings.footer?.showSocialLinks !== false;
                  
                  const previewSocialLinks = [];
                  if (previewSocialLinksData.facebook) previewSocialLinks.push({ icon: FiFacebook });
                  if (previewSocialLinksData.instagram) previewSocialLinks.push({ icon: FiInstagram });
                  if (previewSocialLinksData.twitter) previewSocialLinks.push({ icon: FiTwitter });
                  if (previewSocialLinksData.linkedin) previewSocialLinks.push({ icon: FiLinkedin });
                  
                  return (
                    <div className="bg-gray-900 text-white rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                        {/* About Section */}
                        {settings.general?.showInFooter !== false && (
                          <div>
                            <div className="font-bold text-lg mb-2">{settings?.general?.siteName || 'Olivia Ship - أوليفيا شيب'}</div>
                            <p className="text-gray-400 text-sm leading-relaxed mb-4">
                              {settings.footer?.footerDescription || settings?.general?.siteDescription || 'أوليفيا شيب - خدمة التوصيل الفاخر...'}
                            </p>
                            {previewShowSocialLinks && previewSocialLinks.length > 0 && (
                              <div className="flex gap-2">
                                {previewSocialLinks.map((social, idx) => {
                                  const Icon = social.icon;
                                  return (
                                    <div key={idx} className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                                      <Icon className="text-sm" />
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Service Links Preview */}
                        {settings.footer?.showFooterLinks !== false && previewFooterLinks.services && previewFooterLinks.services.length > 0 && (
                          <div>
                            <h4 className="font-bold mb-3">خدمات</h4>
                            <ul className="space-y-2">
                              {previewFooterLinks.services.slice(0, 4).map((link, idx) => (
                                <li key={idx} className="text-gray-400 text-sm hover:text-white">
                                  {link.label || 'رابط'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Information Links Preview */}
                        {settings.footer?.showFooterLinks !== false && previewFooterLinks.information && previewFooterLinks.information.length > 0 && (
                          <div>
                            <h4 className="font-bold mb-3">معلومات</h4>
                            <ul className="space-y-2">
                              {previewFooterLinks.information.slice(0, 4).map((link, idx) => (
                                <li key={idx} className="text-gray-400 text-sm hover:text-white">
                                  {link.label || 'رابط'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Contact Preview */}
                        {settings.footer?.showContactInfo !== false && (
                          <div>
                            <h4 className="font-bold mb-3">اتصل بنا</h4>
                            <ul className="space-y-2 text-sm text-gray-400">
                              {settings.general?.contactEmail && <li>📧 {settings.general.contactEmail}</li>}
                              {settings.general?.contactPhone && <li>📞 {settings.general.contactPhone}</li>}
                              {settings.general?.address && <li>📍 {settings.general.address}</li>}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      {/* Copyright Preview */}
                      <div className="border-t border-gray-800 pt-4">
                        <p className="text-gray-400 text-sm text-center">
                          &copy; {new Date().getFullYear()} {settings?.general?.siteName || 'Olivia Ship - أوليفيا شيب'}. {settings.footer?.copyrightText || 'جميع الحقوق محفوظة'}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        )}

        {/* Pricing Settings */}
        {activeTab === 'legal' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiFileText />
                إدارة الصفحات القانونية
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                يمكنك تعديل محتوى الصفحات القانونية (الشروط والأحكام، سياسة الخصوصية، وملفات تعريف الارتباط)
              </p>
            </div>

            <div className="space-y-8">
              {/* Terms Page */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <FiFileText className="text-primary-dynamic" />
                  صفحة الشروط والأحكام
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  يمكنك تعديل محتوى صفحة الشروط والأحكام. المحتوى يدعم HTML الأساسي.
                </p>
                <textarea
                  value={settings.legalPages?.terms || ''}
                  onChange={(e) => handleChange('legalPages.terms', e.target.value)}
                  className="input-field w-full min-h-[400px] font-mono text-sm"
                  placeholder="أدخل محتوى صفحة الشروط والأحكام هنا... (يمكنك استخدام HTML)"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 نصيحة: إذا تركت الحقل فارغاً، سيتم استخدام المحتوى الافتراضي
                </p>
              </div>

              {/* Privacy Page */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <FiShield className="text-primary-dynamic" />
                  صفحة سياسة الخصوصية
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  يمكنك تعديل محتوى صفحة سياسة الخصوصية. المحتوى يدعم HTML الأساسي.
                </p>
                <textarea
                  value={settings.legalPages?.privacy || ''}
                  onChange={(e) => handleChange('legalPages.privacy', e.target.value)}
                  className="input-field w-full min-h-[400px] font-mono text-sm"
                  placeholder="أدخل محتوى صفحة سياسة الخصوصية هنا... (يمكنك استخدام HTML)"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 نصيحة: إذا تركت الحقل فارغاً، سيتم استخدام المحتوى الافتراضي
                </p>
              </div>

              {/* Cookies Page */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2">
                  <FiSettings className="text-primary-dynamic" />
                  صفحة سياسة ملفات تعريف الارتباط
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  يمكنك تعديل محتوى صفحة سياسة ملفات تعريف الارتباط (Cookies). المحتوى يدعم HTML الأساسي.
                </p>
                <textarea
                  value={settings.legalPages?.cookies || ''}
                  onChange={(e) => handleChange('legalPages.cookies', e.target.value)}
                  className="input-field w-full min-h-[400px] font-mono text-sm"
                  placeholder="أدخل محتوى صفحة سياسة ملفات تعريف الارتباط هنا... (يمكنك استخدام HTML)"
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 نصيحة: إذا تركت الحقل فارغاً، سيتم استخدام المحتوى الافتراضي
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-700 flex items-start gap-2">
                  <FiInfo className="text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>ملاحظة:</strong> عند إدخال محتوى مخصص، سيتم استبدال المحتوى الافتراضي بالكامل. 
                    يمكنك استخدام HTML الأساسي مثل &lt;strong&gt;، &lt;p&gt;، &lt;ul&gt;، &lt;li&gt;، إلخ.
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'pricing' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiDollarSign />
                إعدادات الأسعار
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">نسبة العمولة الموحدة (%)</label>
                <input
                  type="number"
                  value={settings.pricing?.commissionPercentage || 15}
                  onChange={(e) => handleChange('pricing.commissionPercentage', parseFloat(e.target.value) || 0)}
                  className="input-field w-full"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  نسبة موحدة تُحسب على مجموع السلة الكاملة (مثل: 15% من مجموع المنتجات)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">نسبة الجمارك الموحدة (%)</label>
                <input
                  type="number"
                  value={settings.pricing?.customsPercentage || 5}
                  onChange={(e) => handleChange('pricing.customsPercentage', parseFloat(e.target.value) || 0)}
                  className="input-field w-full"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  نسبة موحدة تُحسب على مجموع السلة الكاملة (مثل: 5% من مجموع المنتجات)
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">الشحن الدولي الموحد</label>
                <input
                  type="number"
                  value={settings.pricing?.shippingRate || 10}
                  onChange={(e) => handleChange('pricing.shippingRate', parseFloat(e.target.value) || 0)}
                  className="input-field w-full"
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  مبلغ ثابت للطلب الكامل (مثل: 10 ر.س للطلب كاملاً بغض النظر عن عدد المنتجات)
                </p>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-bold mb-4">أسعار صرف العملات</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">USD → YER</label>
                  <input
                    type="number"
                    value={settings.pricing?.currencyRates?.USD || 250}
                    onChange={(e) => handleChange('pricing.currencyRates.USD', parseFloat(e.target.value) || 0)}
                    className="input-field w-full"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">SAR → YER</label>
                  <input
                    type="number"
                    value={settings.pricing?.currencyRates?.SAR || 67}
                    onChange={(e) => handleChange('pricing.currencyRates.SAR', parseFloat(e.target.value) || 0)}
                    className="input-field w-full"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">EUR → YER</label>
                    <input
                      type="number"
                      value={settings.pricing?.currencyRates?.EUR || 270}
                      onChange={(e) => handleChange('pricing.currencyRates.EUR', parseFloat(e.target.value) || 0)}
                      className="input-field w-full"
                      min="0"
                    />
                  </div>
              </div>
            </div>
          </div>
        )}

        {/* Stores Settings */}
        {activeTab === 'stores' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiShoppingBag />
                إعدادات المتاجر
              </h2>
            </div>

            {/* Mobile App Offers Section - Moved to top */}
            <div className="border-2 border-primary-200 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <FiTag className="text-primary-600" />
                    عروض التطبيق
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    إضافة صور عروض مع أكواد خصم تظهر في صفحة السلة (للموبايل فقط)
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newOffers = [...(settings.mobileOffers || []), { 
                      image: '', 
                      couponCode: '', 
                      title: '',
                      description: '',
                      storeUrl: '',
                      discount: '',
                      terms: '',
                      enabled: true, 
                      order: (settings.mobileOffers?.length || 0) 
                    }];
                    handleChange('mobileOffers', newOffers);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiPlus />
                  إضافة عرض
                </button>
              </div>

              {settings.mobileOffers && settings.mobileOffers.length > 0 ? (
                <div className="space-y-4">
                  {settings.mobileOffers.map((offer, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={offer.enabled ?? true}
                              onChange={(e) => {
                                const newOffers = [...settings.mobileOffers];
                                newOffers[index].enabled = e.target.checked;
                                handleChange('mobileOffers', newOffers);
                              }}
                              className="w-5 h-5"
                            />
                            <span className="text-sm font-medium">مفعل</span>
                          </label>
                          <span className="text-xs text-gray-500">عرض #{index + 1}</span>
                        </div>
                        <button
                          onClick={() => {
                            const newOffers = settings.mobileOffers.filter((_, i) => i !== index);
                            handleChange('mobileOffers', newOffers);
                          }}
                          className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                        >
                          <FiX />
                          حذف
                        </button>
                      </div>

                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-2">صورة العرض *</label>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={async (e) => {
                                const file = e.target.files[0];
                                if (file) {
                                  try {
                                    const res = await settingsAPI.uploadImage(file);
                                    if (res.data.success) {
                                      const newOffers = [...settings.mobileOffers];
                                      newOffers[index].image = res.data.dataUrl;
                                      handleChange('mobileOffers', newOffers);
                                      showSuccess('✅ تم رفع الصورة بنجاح');
                                    }
                                  } catch (error) {
                                    showError('فشل رفع الصورة');
                                  }
                                }
                              }}
                              className="input-field w-full text-sm"
                              disabled={!offer.enabled}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-2">كود الخصم *</label>
                            <input
                              type="text"
                              value={offer.couponCode || ''}
                              onChange={(e) => {
                                const newOffers = [...settings.mobileOffers];
                                newOffers[index].couponCode = e.target.value;
                                handleChange('mobileOffers', newOffers);
                              }}
                              className="input-field w-full"
                              placeholder="مثال: SAVE20"
                              disabled={!offer.enabled}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold mb-2">عنوان العرض</label>
                            <input
                              type="text"
                              value={offer.title || ''}
                              onChange={(e) => {
                                const newOffers = [...settings.mobileOffers];
                                newOffers[index].title = e.target.value;
                                handleChange('mobileOffers', newOffers);
                              }}
                              className="input-field w-full"
                              placeholder="مثال: أقوى أكواد الخصم"
                              disabled={!offer.enabled}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold mb-2">قيمة الخصم</label>
                            <input
                              type="text"
                              value={offer.discount || ''}
                              onChange={(e) => {
                                const newOffers = [...settings.mobileOffers];
                                newOffers[index].discount = e.target.value;
                                handleChange('mobileOffers', newOffers);
                              }}
                              className="input-field w-full"
                              placeholder="مثال: 20% أو 50 ريال"
                              disabled={!offer.enabled}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">وصف العرض</label>
                          <textarea
                            value={offer.description || ''}
                            onChange={(e) => {
                              const newOffers = [...settings.mobileOffers];
                              newOffers[index].description = e.target.value;
                              handleChange('mobileOffers', newOffers);
                            }}
                            className="input-field w-full"
                            placeholder="وصف مختصر للعرض..."
                            rows="2"
                            disabled={!offer.enabled}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">رابط المتجر</label>
                          <input
                            type="url"
                            value={offer.storeUrl || ''}
                            onChange={(e) => {
                              const newOffers = [...settings.mobileOffers];
                              newOffers[index].storeUrl = e.target.value;
                              handleChange('mobileOffers', newOffers);
                            }}
                            className="input-field w-full"
                            placeholder="https://example.com"
                            disabled={!offer.enabled}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">الشروط والأحكام</label>
                          <textarea
                            value={offer.terms || ''}
                            onChange={(e) => {
                              const newOffers = [...settings.mobileOffers];
                              newOffers[index].terms = e.target.value;
                              handleChange('mobileOffers', newOffers);
                            }}
                            className="input-field w-full"
                            placeholder="شروط استخدام الكود..."
                            rows="2"
                            disabled={!offer.enabled}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold mb-2">ترتيب العرض</label>
                          <input
                            type="number"
                            value={offer.order ?? index}
                            onChange={(e) => {
                              const newOffers = [...settings.mobileOffers];
                              newOffers[index].order = parseInt(e.target.value) || 0;
                              handleChange('mobileOffers', newOffers);
                            }}
                            className="input-field w-full"
                            placeholder="0"
                            disabled={!offer.enabled}
                          />
                        </div>
                      </div>

                      {offer.image && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <label className="block text-sm font-semibold mb-2">معاينة:</label>
                          <img
                            src={offer.image}
                            alt="Offer Preview"
                            className="w-full max-w-md h-32 object-cover rounded-lg shadow-md"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg bg-white">
                  <FiTag className="text-4xl text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 font-medium">لا توجد عروض مضافة</p>
                  <p className="text-sm text-gray-400 mt-2">انقر على "إضافة عرض" لإضافة عرض جديد</p>
                </div>
              )}
            </div>

            {/* Supported Stores Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-bold mb-4">المتاجر المدعومة</h3>
            </div>

            {['amazon', 'noon', 'shein', 'aliexpress', 'temu', 'iherb', 'niceonesa', 'namshi', 'trendyol'].map((store) => {
              const storeSettings = settings.stores?.[store] || {};
              const isNiceOne = store === 'niceonesa';
              
              // الأقسام المتاحة لـ Nice One
              const niceOneCategories = [
                { value: 'makeup', label: 'المكياج' },
                { value: 'perfume', label: 'العطور' },
                { value: 'care', label: 'العناية' },
                { value: 'devices', label: 'الأجهزة' },
                { value: 'premium', label: 'بريميوم' },
                { value: 'nails', label: 'الأظافر' },
                { value: 'gifts', label: 'الهدايا' },
                { value: 'lenses', label: 'العدسات' },
                { value: 'home-scents', label: 'معطرات المنزل' },
              ];
              
              return (
                <div key={store} className="border border-gray-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold capitalize">{store}</h3>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={storeSettings.enabled ?? true}
                        onChange={(e) => handleChange(`stores.${store}.enabled`, e.target.checked)}
                        className="w-5 h-5"
                      />
                      <span className="text-sm font-medium">مفعل</span>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">الحد الأدنى للطلب (ر.س)</label>
                      <input
                        type="number"
                        value={storeSettings.minOrderValue || 0}
                        onChange={(e) => handleChange(`stores.${store}.minOrderValue`, parseFloat(e.target.value) || 0)}
                        className="input-field w-full"
                        min="0"
                        disabled={!storeSettings.enabled}
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">إذا كان الطلب أقل من هذا الحد، سيتم إضافة رسوم الشحن</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">رسوم الشحن (ر.س)</label>
                      <input
                        type="number"
                        value={storeSettings.shippingFee || 0}
                        onChange={(e) => handleChange(`stores.${store}.shippingFee`, parseFloat(e.target.value) || 0)}
                        className="input-field w-full"
                        min="0"
                        disabled={!storeSettings.enabled}
                        placeholder="0"
                      />
                      <p className="text-xs text-gray-500 mt-1">رسوم الشحن عند عدم الوصول للحد الأدنى</p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">الحد الأقصى للطلب (ر.س)</label>
                      <input
                        type="number"
                        value={storeSettings.maxOrderValue || ''}
                        onChange={(e) => handleChange(`stores.${store}.maxOrderValue`, e.target.value ? parseFloat(e.target.value) : null)}
                        className="input-field w-full"
                        min="0"
                        disabled={!storeSettings.enabled}
                        placeholder="لا يوجد حد"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <strong>ملاحظة:</strong> العمولة موحدة على السلة الكاملة ويتم تحديدها من إعدادات الأسعار (الأسعار → نسبة العمولة الموحدة)
                    </p>
                  </div>
                  
                  {/* الأقسام المتاحة لـ Nice One */}
                  {isNiceOne && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <label className="block text-sm font-semibold mb-3">الأقسام المتاحة</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {niceOneCategories.map((category) => {
                          const isChecked = (storeSettings.availableCategories || niceOneCategories.map(c => c.value)).includes(category.value);
                          return (
                            <label key={category.value} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  const currentCategories = storeSettings.availableCategories || niceOneCategories.map(c => c.value);
                                  let newCategories;
                                  if (e.target.checked) {
                                    newCategories = [...currentCategories, category.value];
                                  } else {
                                    newCategories = currentCategories.filter(c => c !== category.value);
                                  }
                                  handleChange(`stores.${store}.availableCategories`, newCategories);
                                }}
                                className="w-4 h-4"
                                disabled={!storeSettings.enabled}
                              />
                              <span className="text-sm">{category.label}</span>
                            </label>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        المنتجات من الأقسام غير المحددة ستظهر رسالة بأن القسم غير متوفر
                      </p>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Local Stores Section */}
            <div className="mt-8 border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">المتاجر المحلية</h3>
                <p className="text-sm text-gray-600 mt-1">
                  إضافة متاجر محلية في السعودية (مثل الماجد، ليفيرا، إلخ) - النظام يتعرف عليها تلقائياً من الدومين
                </p>
              </div>
              <button
                onClick={() => {
                  const newStores = [...(settings.localStores || []), { name: '', domain: '', enabled: true, minOrderValue: 0, shippingFee: 0 }];
                  handleChange('localStores', newStores);
                }}
                className="btn-primary flex items-center gap-2"
              >
                <FiPlus />
                إضافة متجر محلي
              </button>
            </div>

            {settings.localStores && settings.localStores.length > 0 ? (
              <div className="space-y-4">
                {settings.localStores.map((localStore, index) => (
                  <div key={index} className="border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={localStore.enabled ?? true}
                            onChange={(e) => {
                              const newStores = [...settings.localStores];
                              newStores[index].enabled = e.target.checked;
                              handleChange('localStores', newStores);
                            }}
                            className="w-5 h-5"
                          />
                          <span className="text-sm font-medium">مفعل</span>
                        </label>
                      </div>
                      <button
                        onClick={() => {
                          const newStores = settings.localStores.filter((_, i) => i !== index);
                          handleChange('localStores', newStores);
                        }}
                        className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                      >
                        <FiX />
                        حذف
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">اسم المتجر</label>
                        <input
                          type="text"
                          value={localStore.name || ''}
                          onChange={(e) => {
                            const newStores = [...settings.localStores];
                            newStores[index].name = e.target.value;
                            handleChange('localStores', newStores);
                          }}
                          className="input-field w-full"
                          placeholder="مثال: الماجد"
                          disabled={!localStore.enabled}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">الدومين</label>
                        <input
                          type="text"
                          value={localStore.domain || ''}
                          onChange={(e) => {
                            const newStores = [...settings.localStores];
                            newStores[index].domain = e.target.value;
                            handleChange('localStores', newStores);
                          }}
                          className="input-field w-full"
                          placeholder="مثال: almjid.com"
                          disabled={!localStore.enabled}
                        />
                        <p className="text-xs text-gray-500 mt-1">بدون http:// أو https://</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">الحد الأدنى للطلب (ر.س)</label>
                        <input
                          type="number"
                          value={localStore.minOrderValue || 0}
                          onChange={(e) => {
                            const newStores = [...settings.localStores];
                            newStores[index].minOrderValue = parseFloat(e.target.value) || 0;
                            handleChange('localStores', newStores);
                          }}
                          className="input-field w-full"
                          min="0"
                          disabled={!localStore.enabled}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">رسوم الشحن (ر.س)</label>
                        <input
                          type="number"
                          value={localStore.shippingFee || 0}
                          onChange={(e) => {
                            const newStores = [...settings.localStores];
                            newStores[index].shippingFee = parseFloat(e.target.value) || 0;
                            handleChange('localStores', newStores);
                          }}
                          className="input-field w-full"
                          min="0"
                          disabled={!localStore.enabled}
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">لا توجد متاجر محلية مضافة</p>
                <p className="text-sm text-gray-400 mt-2">انقر على "إضافة متجر محلي" لإضافة متجر جديد</p>
              </div>
            )}
            </div>

            {/* Supported Stores Section (for display on stores page) */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">المتاجر المدعومة (عرض في صفحة المتاجر)</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    إضافة متاجر جديدة لعرضها في صفحة "المتاجر المدعومة" مع أيقونات وروابط
                  </p>
                </div>
                <button
                  onClick={() => {
                    const newStores = [...(settings.supportedStores || []), { name: '', url: '', icon: '', enabled: true, order: (settings.supportedStores?.length || 0) }];
                    handleChange('supportedStores', newStores);
                  }}
                  className="btn-primary flex items-center gap-2"
                >
                  <FiPlus />
                  إضافة متجر جديد
                </button>
              </div>

              {settings.supportedStores && settings.supportedStores.length > 0 ? (
                <div className="space-y-4">
                  {settings.supportedStores.map((store, index) => (
                    <div key={index} className="border border-gray-200 rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={store.enabled ?? true}
                              onChange={(e) => {
                                const newStores = [...settings.supportedStores];
                                newStores[index].enabled = e.target.checked;
                                handleChange('supportedStores', newStores);
                              }}
                              className="w-5 h-5"
                            />
                            <span className="text-sm font-medium">مفعل</span>
                          </label>
                        </div>
                        <button
                          onClick={() => {
                            const newStores = settings.supportedStores.filter((_, i) => i !== index);
                            handleChange('supportedStores', newStores);
                          }}
                          className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                        >
                          <FiX />
                          حذف
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-semibold mb-2">اسم المتجر</label>
                          <input
                            type="text"
                            value={store.name || ''}
                            onChange={(e) => {
                              const newStores = [...settings.supportedStores];
                              newStores[index].name = e.target.value;
                              handleChange('supportedStores', newStores);
                            }}
                            className="input-field w-full"
                            placeholder="مثال: Amazon"
                            disabled={!store.enabled}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">رابط المتجر</label>
                          <input
                            type="url"
                            value={store.url || ''}
                            onChange={(e) => {
                              const newStores = [...settings.supportedStores];
                              newStores[index].url = e.target.value;
                              handleChange('supportedStores', newStores);
                            }}
                            className="input-field w-full"
                            placeholder="https://www.example.com"
                            disabled={!store.enabled}
                          />
                        </div>
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="block text-sm font-semibold mb-2">الأيقونة/الصورة</label>
                          <div className="space-y-2">
                            {/* Upload File Input */}
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">رفع صورة من الجهاز:</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    try {
                                      setSaving(true);
                                      const res = await settingsAPI.uploadImage(file);
                                      if (res.data.success) {
                                        const newStores = [...settings.supportedStores];
                                        // Store base64 data URL in database
                                        newStores[index].icon = res.data.dataUrl;
                                        handleChange('supportedStores', newStores);
                                        showSuccess('✅ تم رفع الصورة بنجاح');
                                      }
                                    } catch (error) {
                                      console.error('Upload error:', error);
                                      showError('فشل في رفع الصورة');
                                    } finally {
                                      setSaving(false);
                                      // Reset input
                                      e.target.value = '';
                                    }
                                  }
                                }}
                                className="input-field w-full text-sm"
                                disabled={!store.enabled || saving}
                              />
                              <p className="text-xs text-gray-500 mt-1">أو</p>
                            </div>
                            {/* URL Input */}
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">أو رابط الصورة:</label>
                              <textarea
                                value={store.icon || ''}
                                onChange={(e) => {
                                  const newStores = [...settings.supportedStores];
                                  newStores[index].icon = e.target.value;
                                  handleChange('supportedStores', newStores);
                                }}
                                className="input-field w-full text-sm resize-none"
                                style={{ minHeight: '60px', wordBreak: 'break-all' }}
                                placeholder="https://example.com/icon.png"
                                disabled={!store.enabled}
                                rows="2"
                              />
                            </div>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold mb-2">ترتيب العرض</label>
                          <input
                            type="number"
                            value={store.order || 0}
                            onChange={(e) => {
                              const newStores = [...settings.supportedStores];
                              newStores[index].order = parseInt(e.target.value) || 0;
                              handleChange('supportedStores', newStores);
                            }}
                            className="input-field w-full"
                            min="0"
                            disabled={!store.enabled}
                          />
                          <p className="text-xs text-gray-500 mt-1">ترتيب المتجر في صفحة المتاجر (0 = الأول)</p>
                        </div>
                      </div>

                      {/* Preview */}
                      {store.icon && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <label className="block text-sm font-semibold mb-2">معاينة:</label>
                          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <img
                              src={store.icon.startsWith('data:') ? store.icon : (store.icon.startsWith('/uploads/') ? `/api${store.icon}` : store.icon)}
                              alt={store.name || 'Preview'}
                              className="w-16 h-16 object-contain rounded-lg"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                            <div>
                              <p className="font-semibold">{store.name || 'اسم المتجر'}</p>
                              {store.url && (
                                <a
                                  href={store.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary-600 hover:underline"
                                >
                                  {store.url}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500">لا توجد متاجر مدعومة مضافة</p>
                  <p className="text-sm text-gray-400 mt-2">انقر على "إضافة متجر جديد" لإضافة متجر</p>
                </div>
              )}
            </div>


          </div>
        )}

        {/* Payment Settings */}
        {activeTab === 'payment' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiCreditCard />
                إعدادات المدفوعات
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Stripe</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.payment?.stripeEnabled || false}
                      onChange={(e) => handleChange('payment.stripeEnabled', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">مفعل</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Publishable Key</label>
                    <input
                      type="text"
                      value={settings.payment?.stripePublishableKey || ''}
                      onChange={(e) => handleChange('payment.stripePublishableKey', e.target.value)}
                      className="input-field w-full"
                      disabled={!settings.payment?.stripeEnabled}
                      placeholder="pk_..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Secret Key</label>
                    <input
                      type="password"
                      value={settings.payment?.stripeSecretKey || ''}
                      onChange={(e) => handleChange('payment.stripeSecretKey', e.target.value)}
                      className="input-field w-full"
                      disabled={!settings.payment?.stripeEnabled}
                      placeholder="sk_..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Webhook Secret</label>
                    <input
                      type="password"
                      value={settings.payment?.stripeWebhookSecret || ''}
                      onChange={(e) => handleChange('payment.stripeWebhookSecret', e.target.value)}
                      className="input-field w-full"
                      disabled={!settings.payment?.stripeEnabled}
                      placeholder="whsec_..."
                    />
                    <p className="text-xs text-gray-500 mt-1">لإكمال إعداد Stripe، قم بتكوين Webhook في Stripe Dashboard وأضف Secret هنا</p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">Cash Pay</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.payment?.cashPayEnabled || false}
                      onChange={(e) => handleChange('payment.cashPayEnabled', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">مفعل</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">API Key</label>
                    <input
                      type="text"
                      value={settings.payment?.cashPayApiKey || ''}
                      onChange={(e) => handleChange('payment.cashPayApiKey', e.target.value)}
                      className="input-field w-full"
                      disabled={!settings.payment?.cashPayEnabled}
                      placeholder="API Key من Cash Pay"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">API Secret</label>
                    <input
                      type="password"
                      value={settings.payment?.cashPayApiSecret || ''}
                      onChange={(e) => handleChange('payment.cashPayApiSecret', e.target.value)}
                      className="input-field w-full"
                      disabled={!settings.payment?.cashPayEnabled}
                      placeholder="API Secret من Cash Pay"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Merchant ID</label>
                    <input
                      type="text"
                      value={settings.payment?.cashPayMerchantId || ''}
                      onChange={(e) => handleChange('payment.cashPayMerchantId', e.target.value)}
                      className="input-field w-full"
                      disabled={!settings.payment?.cashPayEnabled}
                      placeholder="Merchant ID من Cash Pay"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Base URL</label>
                    <input
                      type="text"
                      value={settings.payment?.cashPayBaseUrl || ''}
                      onChange={(e) => handleChange('payment.cashPayBaseUrl', e.target.value)}
                      className="input-field w-full"
                      disabled={!settings.payment?.cashPayEnabled}
                      placeholder="https://api.cash.com.ye"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">البيئة (Environment)</label>
                    <select
                      value={settings.payment?.cashPayEnvironment || 'sandbox'}
                      onChange={(e) => handleChange('payment.cashPayEnvironment', e.target.value)}
                      className="input-field w-full"
                      disabled={!settings.payment?.cashPayEnabled}
                    >
                      <option value="sandbox">Sandbox (تجريبي)</option>
                      <option value="production">Production (الإنتاج)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">استخدم Sandbox للاختبار و Production للاستخدام الفعلي</p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">الدفع عند الاستلام</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.payment?.cashOnDeliveryEnabled ?? true}
                      onChange={(e) => handleChange('payment.cashOnDeliveryEnabled', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">مفعل</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shipping Settings */}
        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiTruck />
                إعدادات الشحن
              </h2>
            </div>

            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                <strong>ملاحظة:</strong> الشحن الدولي الموحد ونسبة الجمارك الموحدة موجودة في تبويب "الأسعار" (إعدادات الأسعار)
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2">حد الشحن المجاني</label>
                <input
                  type="number"
                  value={settings.shipping?.freeShippingThreshold || ''}
                  onChange={(e) => handleChange('shipping.freeShippingThreshold', e.target.value ? parseFloat(e.target.value) : null)}
                  className="input-field w-full"
                  min="0"
                  placeholder="اتركه فارغاً لإلغاء الشحن المجاني"
                />
                <p className="text-xs text-gray-500 mt-1">
                  إذا كان مجموع الطلب يساوي أو يزيد عن هذا الحد، سيتم إلغاء جميع رسوم الشحن
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">أيام الشحن المقدرة (خارجي)</label>
                <input
                  type="number"
                  value={settings.shipping?.estimatedDaysAbroad || 10}
                  onChange={(e) => handleChange('shipping.estimatedDaysAbroad', parseInt(e.target.value) || 0)}
                  className="input-field w-full"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">أيام الشحن المقدرة (محلي)</label>
                <input
                  type="number"
                  value={settings.shipping?.estimatedDaysLocal || 5}
                  onChange={(e) => handleChange('shipping.estimatedDaysLocal', parseInt(e.target.value) || 0)}
                  className="input-field w-full"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">الوزن الأقصى (كجم)</label>
                <input
                  type="number"
                  value={settings.shipping?.maxWeight || ''}
                  onChange={(e) => handleChange('shipping.maxWeight', e.target.value ? parseFloat(e.target.value) : null)}
                  className="input-field w-full"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiCode />
                الإعدادات المتقدمة
              </h2>
            </div>

            {/* Google Analytics */}
            <div className="border border-gray-200 rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">Google Analytics</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    تتبع زوار الموقع وتحليل سلوك المستخدمين باستخدام Google Analytics
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.analytics?.googleAnalytics?.enabled || false}
                    onChange={(e) => handleChange('analytics.googleAnalytics.enabled', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium">مفعل</span>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Measurement ID</label>
                  <input
                    type="text"
                    value={settings.analytics?.googleAnalytics?.measurementId || ''}
                    onChange={(e) => handleChange('analytics.googleAnalytics.measurementId', e.target.value)}
                    className="input-field w-full"
                    disabled={!settings.analytics?.googleAnalytics?.enabled}
                    placeholder="G-XXXXXXXXXX"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    احصل على Measurement ID من{' '}
                    <a 
                      href="https://analytics.google.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      Google Analytics Dashboard
                    </a>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    يبدأ عادة بـ G- متبوعاً بأرقام وحروف (مثال: G-XXXXXXXXXX)
                  </p>
                </div>

                {settings.analytics?.googleAnalytics?.measurementId && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-700 flex items-center gap-2">
                      <FiCheck />
                      Measurement ID محفوظ: {settings.analytics.googleAnalytics.measurementId}
                    </p>
                  </div>
                )}

                {settings.analytics?.googleAnalytics?.enabled && !settings.analytics?.googleAnalytics?.measurementId && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-700 flex items-center gap-2">
                      <FiInfo />
                      يرجى إدخال Measurement ID لتفعيل Google Analytics
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* ScraperAPI */}
            <div className="border border-gray-200 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold">ScraperAPI</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    مفتاح API لجلب بيانات المنتجات من المواقع المحمية (Trendyol, Shein, Temu)
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.scraperAPI?.enabled || false}
                    onChange={(e) => handleChange('scraperAPI.enabled', e.target.checked)}
                    className="w-5 h-5"
                  />
                  <span className="text-sm font-medium">مفعل</span>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">API Key</label>
                  <input
                    type="password"
                    value={settings.scraperAPI?.apiKey || ''}
                    onChange={(e) => handleChange('scraperAPI.apiKey', e.target.value)}
                    className="input-field w-full"
                    disabled={!settings.scraperAPI?.enabled}
                    placeholder="أدخل مفتاح ScraperAPI هنا"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    احصل على مفتاح API من{' '}
                    <a 
                      href="https://www.scraperapi.com/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      https://www.scraperapi.com/
                    </a>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    بدون هذا المفتاح، قد لا تعمل بعض المتاجر المحمية مثل Trendyol بشكل صحيح
                  </p>
                </div>

                {settings.scraperAPI?.apiKey && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-700 flex items-center gap-2">
                      <FiInfo />
                      المفتاح محفوظ: {settings.scraperAPI.apiKey.substring(0, 8)}...
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Settings */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FiBell />
                إعدادات الإشعارات
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold">الإشعارات عبر البريد</h3>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.notifications?.emailNotifications ?? true}
                      onChange={(e) => handleChange('notifications.emailNotifications', e.target.checked)}
                      className="w-5 h-5"
                    />
                    <span className="text-sm font-medium">مفعل</span>
                  </label>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">SMTP Host</label>
                    <input
                      type="text"
                      value={settings.notifications?.smtpHost || ''}
                      onChange={(e) => handleChange('notifications.smtpHost', e.target.value)}
                      className="input-field w-full"
                      disabled={!settings.notifications?.emailNotifications}
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">SMTP Port</label>
                    <input
                      type="number"
                      value={settings.notifications?.smtpPort || ''}
                      onChange={(e) => handleChange('notifications.smtpPort', parseInt(e.target.value) || null)}
                      className="input-field w-full"
                      disabled={!settings.notifications?.emailNotifications}
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">SMTP User</label>
                    <input
                      type="email"
                      value={settings.notifications?.smtpUser || ''}
                      onChange={(e) => handleChange('notifications.smtpUser', e.target.value)}
                      className="input-field w-full"
                      disabled={!settings.notifications?.emailNotifications}
                      placeholder="email@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">SMTP Password</label>
                    <input
                      type="password"
                      value={settings.notifications?.smtpPassword || ''}
                      onChange={(e) => handleChange('notifications.smtpPassword', e.target.value)}
                      className="input-field w-full"
                      disabled={!settings.notifications?.emailNotifications}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">الإشعار عند طلب جديد</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications?.notifyOnNewOrder ?? true}
                        onChange={(e) => handleChange('notifications.notifyOnNewOrder', e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">الإشعار عند الدفع</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications?.notifyOnPayment ?? true}
                        onChange={(e) => handleChange('notifications.notifyOnPayment', e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">الإشعار عند تغيير الحالة</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.notifications?.notifyOnStatusChange ?? true}
                        onChange={(e) => handleChange('notifications.notifyOnStatusChange', e.target.checked)}
                        className="w-5 h-5"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary px-6 py-3 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <FiLoader className="animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <FiSave />
                حفظ الإعدادات
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

