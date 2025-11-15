import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from '../Navbar';
import Footer from '../Footer';
import { settingsAPI } from '../../utils/api';
import { FiHome, FiShoppingBag, FiPackage, FiUser, FiGrid } from 'react-icons/fi';
import { useAuthStore } from '../../store/authStore';

export default function MainLayout() {
  useEffect(() => {
    // Load theme settings on mount
    loadThemeSettings();
  }, []);

  const loadThemeSettings = async () => {
    try {
      const res = await settingsAPI.get();
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
        if (res.data.settings.theme.bodyFont) {
          document.body.style.fontFamily = `'${res.data.settings.theme.bodyFont}', 'Cairo', 'Tajawal', Arial, sans-serif`;
        }
      }
      
      // Update meta tags
      if (res.data.settings?.general) {
        // Meta description
        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
          metaDescription = document.createElement('meta');
          metaDescription.setAttribute('name', 'description');
          document.getElementsByTagName('head')[0].appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', res.data.settings.general.metaDescription || res.data.settings.general.siteDescription || 'أوليفيا شيب - خدمة التوصيل الفاخر من المتاجر العالمية إلى اليمن');
        
        // Meta keywords
        let metaKeywords = document.querySelector('meta[name="keywords"]');
        if (!metaKeywords) {
          metaKeywords = document.createElement('meta');
          metaKeywords.setAttribute('name', 'keywords');
          document.getElementsByTagName('head')[0].appendChild(metaKeywords);
        }
        const defaultKeywords = 'أوليفيا شيب، Olivia Ship، توصيل من أمازون إلى اليمن، توصيل من نون إلى اليمن، توصيل من شي إن إلى اليمن، شي إن اليمن، شي إن صنعاء، شي إن عدن، شي إن الحديدة، شي إن تعز، أمازون اليمن، أمازون صنعاء، أمازون عدن، نون اليمن، نون صنعاء، نون عدن، توصيل من شي إن إلى صنعاء، توصيل من شي إن إلى عدن، شحن من شي إن إلى صنعاء، شراء من شي إن إلى صنعاء، Amazon to Yemen, Shein to Yemen, Noon to Yemen, Shein to Sanaa, Shein to Aden';
        metaKeywords.setAttribute('content', res.data.settings.general.metaKeywords || defaultKeywords);
      }
    } catch (error) {
      console.error('Failed to load theme settings', error);
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

  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  // Bottom Navigation Items
  const navItems = [
    { 
      path: '/', 
      icon: FiHome, 
      label: 'الرئيسية',
      exact: true
    },
    { 
      path: '/cart', 
      icon: FiShoppingBag, 
      label: 'السلة'
    },
    { 
      path: '/points', 
      icon: FiGrid, 
      label: 'النقاط'
    },
    { 
      path: '/track', 
      icon: FiPackage, 
      label: 'تتبع'
    },
    { 
      path: isAuthenticated ? '/dashboard' : '/login', 
      icon: FiUser, 
      label: isAuthenticated ? 'حسابي' : 'دخول'
    },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pb-20 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      
      {/* Bottom Navigation - Mobile Only - Compact */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="grid grid-cols-5 h-14">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                  active 
                    ? 'text-primary-600' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`text-xl ${active ? 'scale-110' : ''} transition-transform`} />
                <span className={`text-[10px] font-medium ${active ? 'font-bold' : ''}`}>
                  {item.label}
                </span>
                {active && (
                  <div className="absolute bottom-0 w-10 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-t-full"></div>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

