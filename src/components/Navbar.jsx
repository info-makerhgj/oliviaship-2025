import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FiShoppingCart, FiUser, FiMenu, FiX, FiPackage, FiTrendingUp } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import { cartAPI, settingsAPI } from '../utils/api';

export default function Navbar() {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    loadSettings();
    if (isAuthenticated) {
      loadCartCount();
    }
  }, [isAuthenticated]);

  const loadSettings = async () => {
    try {
      const res = await settingsAPI.get();
      setSettings(res.data.settings);
      
      // Update favicon dynamically - Only use favicon, not logo
      const favicon = res.data.settings?.general?.favicon;
      const logo = res.data.settings?.general?.logo;
      
      // Only update favicon if favicon is set and different from logo
      if (favicon && favicon !== logo) {
        // Remove existing favicon links
        const existingLinks = document.querySelectorAll("link[rel*='icon']");
        existingLinks.forEach(link => link.remove());
        
        // Create new favicon link
        const faviconLink = document.createElement('link');
        faviconLink.rel = 'shortcut icon';
        faviconLink.type = favicon.startsWith('data:') 
          ? favicon.match(/data:([^;]+)/)?.[1] || 'image/x-icon'
          : 'image/x-icon';
        faviconLink.href = favicon.startsWith('data:') 
          ? favicon 
          : (favicon.startsWith('/uploads/') ? `/api${favicon}` : favicon);
        
        document.getElementsByTagName('head')[0].appendChild(faviconLink);
      } else if (!favicon && logo) {
        // If no favicon but logo exists, don't use logo as favicon
        // Remove any existing favicon links
        const existingLinks = document.querySelectorAll("link[rel*='icon']");
        existingLinks.forEach(link => link.remove());
      }
      
      // Update page title and meta tags
      if (res.data.settings?.general?.siteName) {
        document.title = res.data.settings.general.siteName;
      }
      
      // Update meta description
      let metaDescription = document.querySelector('meta[name="description"]');
      if (!metaDescription) {
        metaDescription = document.createElement('meta');
        metaDescription.setAttribute('name', 'description');
        document.getElementsByTagName('head')[0].appendChild(metaDescription);
      }
      metaDescription.setAttribute('content', res.data.settings?.general?.metaDescription || res.data.settings?.general?.siteDescription || 'أوليفيا شيب - خدمة التوصيل الفاخر من المتاجر العالمية إلى اليمن');
      
      // Update meta keywords
      let metaKeywords = document.querySelector('meta[name="keywords"]');
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta');
        metaKeywords.setAttribute('name', 'keywords');
        document.getElementsByTagName('head')[0].appendChild(metaKeywords);
      }
      const defaultKeywords = 'أوليفيا شيب، Olivia Ship، توصيل من أمازون إلى اليمن، توصيل من نون إلى اليمن، توصيل من شي إن إلى اليمن، توصيل من علي إكسبريس إلى اليمن، توصيل من Temu إلى اليمن، شي إن اليمن، شي إن صنعاء، شي إن عدن، شي إن الحديدة، شي إن تعز، أمازون اليمن، أمازون صنعاء، أمازون عدن، أمازون الحديدة، أمازون تعز، نون اليمن، نون صنعاء، نون عدن، نون الحديدة، نون تعز، توصيل من شي إن إلى صنعاء، توصيل من شي إن إلى عدن، توصيل من أمازون إلى صنعاء، توصيل من أمازون إلى عدن، شحن من شي إن إلى صنعاء، شحن من شي إن إلى عدن، شراء من شي إن إلى صنعاء، شراء من شي إن إلى عدن، Amazon to Yemen, Shein to Yemen, Noon to Yemen, Shein to Sanaa, Shein to Aden, Amazon to Sanaa, Amazon to Aden';
      metaKeywords.setAttribute('content', res.data.settings?.general?.metaKeywords || defaultKeywords);
      
      // Apply theme colors dynamically
      if (res.data.settings?.theme) {
        const root = document.documentElement;
        if (res.data.settings.theme.primaryColor) {
          root.style.setProperty('--primary-color', res.data.settings.theme.primaryColor);
          // Calculate hover color (darker version)
          const primaryColor = res.data.settings.theme.primaryColor;
          const hoverColor = darkenColor(primaryColor, 10);
          root.style.setProperty('--primary-hover', hoverColor);
        }
        if (res.data.settings.theme.secondaryColor) {
          root.style.setProperty('--secondary-color', res.data.settings.theme.secondaryColor);
          // Calculate hover color (darker version)
          const secondaryColor = res.data.settings.theme.secondaryColor;
          const hoverColor = darkenColor(secondaryColor, 10);
          root.style.setProperty('--secondary-hover', hoverColor);
        }
        
        // Apply fonts
        if (res.data.settings.theme.headingFont) {
          root.style.setProperty('--heading-font', res.data.settings.theme.headingFont);
        }
        if (res.data.settings.theme.bodyFont) {
          root.style.setProperty('--body-font', res.data.settings.theme.bodyFont);
          document.body.style.fontFamily = `'${res.data.settings.theme.bodyFont}', 'Cairo', 'Tajawal', Arial, sans-serif`;
        }
      }
    } catch (error) {
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

  const loadCartCount = async () => {
    try {
      const res = await cartAPI.get();
      setCartItemsCount(res.data.cart?.totalItems || 0);
    } catch (error) {
      // Ignore errors
    }
  };

  const navLinks = [
    { to: '/', label: 'الرئيسية' },
    { to: '/order', label: 'طلب منتج' },
    { to: '/track', label: 'تتبع الطلب' },
    { to: '/points', label: 'نقاط البيع' },
    { to: '/about', label: 'من نحن' },
    { to: '/contact', label: 'اتصل بنا' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
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
              <FiPackage className="text-white text-lg" />
            </div>
            <div>
              <div className="text-base font-bold text-primary-dynamic">{settings?.general?.siteName?.split(' - ')[0] || 'Olivia Ship'}</div>
              <div className="text-xs text-gray-500">{settings?.general?.siteName?.split(' - ')[1] || 'أوليفيا شيب - التوصيل الفاخر'}</div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`font-medium transition-colors duration-200 ${
                  isActive(link.to)
                    ? 'text-primary-dynamic border-b-2 border-primary-dynamic pb-1'
                    : 'text-gray-700 hover:text-primary-dynamic'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to="/cart" className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors" onClick={loadCartCount}>
                  <FiShoppingCart className="text-xl text-gray-700" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-1 -left-1 bg-primary-dynamic text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                      {cartItemsCount > 9 ? '9+' : cartItemsCount}
                    </span>
                  )}
                </Link>
                <Link
                  to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                >
                  <FiUser className="text-xl" />
                  <span className="font-medium">{user?.name}</span>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-primary-dynamic font-medium transition-colors">
                  تسجيل الدخول
                </Link>
                <Link to="/register" className="btn-primary">
                  إنشاء حساب
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-primary-50 text-primary-dynamic'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-gray-100 mt-2 pt-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/cart"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        loadCartCount();
                      }}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-50"
                    >
                      <div className="relative">
                        <FiShoppingCart />
                        {cartItemsCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-primary-dynamic text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                            {cartItemsCount > 9 ? '9+' : cartItemsCount}
                          </span>
                        )}
                      </div>
                      السلة {cartItemsCount > 0 && `(${cartItemsCount})`}
                    </Link>
                    <Link
                      to={user?.role === 'admin' ? '/admin' : '/dashboard'}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 rounded-lg hover:bg-gray-50"
                    >
                      <FiUser />
                      لوحة التحكم
                    </Link>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Link
                      to="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-4 py-3 rounded-lg text-center font-medium text-primary-dynamic border-2 border-primary-dynamic hover:bg-primary-50 transition-colors"
                    >
                      تسجيل الدخول
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="btn-primary w-full text-center"
                    >
                      إنشاء حساب
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
