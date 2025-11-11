import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiFacebook, FiInstagram, FiTwitter, FiLinkedin } from 'react-icons/fi';
import { settingsAPI } from '../utils/api';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setSettings(res.data.settings);
      
      // Apply theme colors dynamically
      if (res.data.settings?.theme) {
        const root = document.documentElement;
        if (res.data.settings.theme.primaryColor) {
          root.style.setProperty('--primary-color', res.data.settings.theme.primaryColor);
          const primaryColor = res.data.settings.theme.primaryColor;
          const hoverColor = darkenColor(primaryColor, 10);
          root.style.setProperty('--primary-hover', hoverColor);
        }
        if (res.data.settings.theme.secondaryColor) {
          root.style.setProperty('--secondary-color', res.data.settings.theme.secondaryColor);
          const secondaryColor = res.data.settings.theme.secondaryColor;
          const hoverColor = darkenColor(secondaryColor, 10);
          root.style.setProperty('--secondary-hover', hoverColor);
        }
      }
    } catch (error) {
      // Use defaults if failed
      console.error('Failed to load settings', error);
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

  // Get footer links from settings or use defaults
  const footerLinks = settings?.footer?.footerLinks || {
    services: [
      { label: 'طلب منتج', url: '/order' },
      { label: 'تتبع الطلب', url: '/track' },
      { label: 'من نحن', url: '/about' },
      { label: 'اتصل بنا', url: '/contact' },
    ],
    information: [
      { label: 'عن الشركة', url: '/about' },
      { label: 'الشروط والأحكام', url: '/terms' },
      { label: 'سياسة الخصوصية', url: '/privacy' },
      { label: 'سياسة ملفات تعريف الارتباط', url: '/cookies' },
      { label: 'الأسئلة الشائعة', url: '#' },
    ],
  };

  // Get social links from settings
  const socialLinksData = settings?.footer?.socialLinks || {};
  const showSocialLinks = settings?.footer?.showSocialLinks !== false;
  
  const socialLinks = [];
  if (socialLinksData.facebook) socialLinks.push({ icon: FiFacebook, href: socialLinksData.facebook, label: 'Facebook' });
  if (socialLinksData.instagram) socialLinks.push({ icon: FiInstagram, href: socialLinksData.instagram, label: 'Instagram' });
  if (socialLinksData.twitter) socialLinks.push({ icon: FiTwitter, href: socialLinksData.twitter, label: 'Twitter' });
  if (socialLinksData.linkedin) socialLinks.push({ icon: FiLinkedin, href: socialLinksData.linkedin, label: 'LinkedIn' });
  if (socialLinksData.whatsapp) socialLinks.push({ icon: FiPhone, href: `https://wa.me/${socialLinksData.whatsapp}`, label: 'WhatsApp' });
  if (socialLinksData.youtube) socialLinks.push({ icon: FiTwitter, href: socialLinksData.youtube, label: 'YouTube' });

  // Don't render if settings is null
  if (!settings) {
    return null;
  }

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* About */}
          {settings?.general?.showInFooter !== false && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                {settings?.general?.logo ? (
                  <img
                    key={settings.general.logo} // Force re-render when logo changes
                    src={settings.general.logo.startsWith('data:') ? settings.general.logo : (settings.general.logo.startsWith('/uploads/') ? `/api${settings.general.logo}` : settings.general.logo)}
                    alt="Logo"
                    className="h-10 w-auto object-contain"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const fallback = e.target.nextElementSibling;
                      if (fallback) {
                        fallback.style.display = 'flex';
                      }
                    }}
                    onLoad={(e) => {
                      // Hide fallback when logo loads successfully
                      const fallback = e.target.nextElementSibling;
                      if (fallback) {
                        fallback.style.display = 'none';
                      }
                    }}
                  />
                ) : null}
                <div className={`gradient-dynamic w-10 h-10 rounded-lg flex items-center justify-center ${settings?.general?.logo ? 'hidden' : ''}`}>
                  <FiMail className="text-white" />
                </div>
                <div>
                  <div className="font-bold text-lg">{settings?.general?.siteName?.split(' - ')[0] || 'Olivia Ship'}</div>
                  <div className="text-sm text-gray-400">{settings?.general?.siteName?.split(' - ')[1] || 'أوليفيا شيب - التوصيل الفاخر'}</div>
                </div>
              </div>
              <p className="text-gray-400 leading-relaxed mb-4">
                {settings?.footer?.footerDescription || settings?.general?.siteDescription || 'أوليفيا شيب - خدمة التوصيل الفاخر من المتاجر العالمية إلى اليمن. نوصل منتجاتك من أمازون، نون، شي إن، علي إكسبريس والمزيد بسهولة وأمان.'}
              </p>
              {showSocialLinks && socialLinks.length > 0 && (
                <div className="flex gap-4">
                  {socialLinks.map((social, idx) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={idx}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-10 h-10 bg-gray-800 hover:bg-primary-dynamic rounded-lg flex items-center justify-center transition-colors"
                        aria-label={social.label}
                      >
                        <Icon className="text-lg" />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Links */}
          {settings.footer?.showFooterLinks !== false && footerLinks.services && footerLinks.services.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-4">خدمات</h3>
              <ul className="space-y-2">
                {footerLinks.services.map((link, idx) => (
                  <li key={idx}>
                    <Link
                      to={link.url || '#'}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {settings.footer?.showFooterLinks !== false && footerLinks.information && footerLinks.information.length > 0 && (
            <div>
              <h3 className="font-bold text-lg mb-4">معلومات</h3>
              <ul className="space-y-2">
                {footerLinks.information.map((link, idx) => (
                  <li key={idx}>
                    <Link
                      to={link.url || '#'}
                      className="text-gray-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact */}
          {settings.footer?.showContactInfo !== false && (
            <div>
              <h4 className="font-bold text-lg mb-4">اتصل بنا</h4>
            <ul className="space-y-4">
              {settings?.general?.contactEmail && (
                <li className="flex items-start gap-3">
                  <FiMail className="text-primary-dynamic opacity-80 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-gray-400 text-sm">البريد الإلكتروني</div>
                    <a href={`mailto:${settings.general.contactEmail}`} className="hover:text-primary-dynamic transition-colors">
                      {settings.general.contactEmail}
                    </a>
                  </div>
                </li>
              )}
              {settings?.general?.contactPhone && (
                <li className="flex items-start gap-3">
                  <FiPhone className="text-primary-dynamic opacity-80 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-gray-400 text-sm">الهاتف</div>
                    <a href={`tel:${settings.general.contactPhone}`} className="hover:text-primary-dynamic transition-colors">
                      {settings.general.contactPhone}
                    </a>
                  </div>
                </li>
              )}
              {settings?.general?.address && (
                <li className="flex items-start gap-3">
                  <FiMapPin className="text-primary-dynamic opacity-80 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-gray-400 text-sm">العنوان</div>
                    <div className="text-gray-300">{settings.general.address}</div>
                  </div>
                </li>
              )}
            </ul>
          </div>
          )}
        </div>

        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-center md:text-right">
              {settings?.footer?.copyrightText 
                ? (settings.footer.copyrightText.includes('{year}') 
                    ? settings.footer.copyrightText.replace('{year}', currentYear.toString())
                    : settings.footer.copyrightText)
                : `© ${currentYear} ${settings?.general?.siteName || 'Olivia Ship - أوليفيا شيب'}. جميع الحقوق محفوظة`}
            </p>
            <div className="flex gap-6 text-gray-400 text-sm">
              <Link to="/terms" className="hover:text-white transition-colors">الشروط</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">الخصوصية</Link>
              <Link to="/cookies" className="hover:text-white transition-colors">الكوكيز</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
