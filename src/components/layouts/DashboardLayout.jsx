import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { FiHome, FiPackage, FiUser, FiSettings, FiUsers, FiLogOut, FiGlobe, FiMenu, FiX, FiShoppingCart, FiDollarSign, FiCreditCard, FiMapPin, FiShoppingBag, FiShield, FiMail, FiMessageSquare, FiInbox, FiTag, FiBarChart2, FiFileText } from 'react-icons/fi';
import { useState, useEffect, useCallback } from 'react';
import { cartAPI, authAPI, contactAPI, settingsAPI } from '../../utils/api';
import { canAccessRoute } from '../../utils/permissions';

export default function DashboardLayout() {
  const { user, logout, updateUser } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartItemsCount, setCartItemsCount] = useState(0);
  const [userPoint, setUserPoint] = useState(null);
  const [agentStatus, setAgentStatus] = useState(null); // Track agent status
  const [hasContactReplies, setHasContactReplies] = useState(false);
  const [settings, setSettings] = useState(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const isAdmin = user?.role === 'admin';
  // Only show agent dashboard if agent is active
  const isAgent = user?.role === 'agent' && agentStatus === 'active';
  const basePath = isAdmin ? '/admin' : (isAgent ? '/agent' : '/dashboard');

  // Check agent status if user is agent (only once)
  useEffect(() => {
    const checkAgentStatus = async () => {
      if (!user || user.role !== 'agent') {
        setAgentStatus(null);
        return;
      }

      // If status already checked, don't check again
      if (agentStatus !== null) {
        return;
      }

      try {
        const { agentAPI } = await import('../../utils/api');
        const res = await agentAPI.getMyAgent();
        if (res.data?.agent) {
          setAgentStatus(res.data.agent.status);
        }
      } catch (error) {
        // If agent is not active or doesn't exist, set status to inactive
        // Don't log 403 errors as they're expected when agent is disabled
        if (error.response?.status === 403) {
          setAgentStatus('inactive');
          // Silently handle - agent is disabled, this is expected
        } else if (error.response?.status === 404) {
          setAgentStatus(null);
          // Agent doesn't exist - not an agent
        } else {
          // Only log unexpected errors
          console.error('Failed to check agent status:', error);
          setAgentStatus(null);
        }
      }
    };

    checkAgentStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.role]); // Only re-run if user ID or role changes

  // Load settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await settingsAPI.get();
        setSettings(res.data.settings);
      } catch (error) {
        console.error('Failed to load settings', error);
      }
    };
    loadSettings();
  }, []);

  // Load fresh user data from server to get updated role (once on mount)
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      
      try {
        const res = await authAPI.getMe();
        if (res.data?.user) {
          const freshUser = res.data.user;
          // Update user data if role changed (e.g., user was converted to agent)
          // Only update if role changed, to avoid interfering with point manager functionality
          if (freshUser.role !== user.role) {
            updateUser({
              id: freshUser._id || freshUser.id,
              name: freshUser.name,
              email: freshUser.email,
              role: freshUser.role,
              phone: freshUser.phone,
              address: freshUser.address,
            });
            
            // Redirect if role changed to agent or admin
            if (freshUser.role === 'agent' && user.role !== 'agent') {
              navigate('/agent');
            } else if (freshUser.role === 'admin' && user.role !== 'admin') {
              navigate('/admin');
            }
          } else {
            // Even if role didn't change, update other user fields (but keep the same structure)
            // This ensures point manager data is preserved
            const currentUserId = user.id || user._id;
            const freshUserId = freshUser._id || freshUser.id;
            
            // Only update if IDs match (same user)
            if (currentUserId === freshUserId || currentUserId?.toString() === freshUserId?.toString()) {
              // Merge fresh data with existing data to preserve all fields
              updateUser({
                ...user,
                id: freshUser._id || freshUser.id || user.id,
                name: freshUser.name || user.name,
                email: freshUser.email || user.email,
                role: freshUser.role || user.role,
                phone: freshUser.phone || user.phone,
              });
            }
          }
        }
      } catch (error) {
        console.error('Failed to load user data', error);
        // Ignore errors - user might not be authenticated
      }
    };

    // Only run once when component mounts
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  useEffect(() => {
    if (user) {
      loadCartCount();
      loadUserPoint();
      if (user.role === 'customer') {
        checkContactReplies();
      }
    } else {
      setUserPoint(null);
      setHasContactReplies(false);
    }
  }, [user]);

  const checkContactReplies = async () => {
    try {
      const res = await contactAPI.getAll({});
      // Check if there are any messages with replies
      const hasReplies = (res.data.messages || []).some(
        msg => msg.status === 'replied' && msg.replyMessage
      );
      setHasContactReplies(hasReplies);
    } catch (error) {
      // Silently fail - don't show error for this check
      setHasContactReplies(false);
    }
  };

  const loadUserPoint = async () => {
    // Load point for customers and agents (not admin)
    // Both customers and agents can be point managers
    if (!user || user.role === 'admin') {
      setUserPoint(null);
      return;
    }
    
    try {
      const { posAPI } = await import('../../utils/api');
      // Try to get user's managed point
      const res = await posAPI.getMyPoint();
      if (res.data?.point) {
        setUserPoint(res.data.point);
        console.log('✅ Point found:', res.data.point.name);
      } else {
        // User is not a point manager - this is normal, no error
        setUserPoint(null);
        console.log('ℹ️ User is not a point manager');
      }
    } catch (error) {
      // Only log actual errors (not 404 or null responses)
      if (error.response?.status !== 404 && error.response?.data?.point !== null) {
        console.error('❌ Failed to load user point:', error.response?.data?.message || error.message);
      } else {
        // 404 or null means user simply doesn't manage a point - this is normal
        setUserPoint(null);
        console.log('ℹ️ User is not a point manager');
      }
    }
  };

  const loadCartCount = async () => {
    try {
      const res = await cartAPI.get();
      setCartItemsCount(res.data.cart?.totalItems || 0);
    } catch (error) {
      // Ignore errors
    }
  };

  const agentLinks = userPoint ? [
    // Agent with Point Manager role
    { to: '/agent', icon: FiHome, label: 'لوحة الوكيل' },
    { to: `/pos/${userPoint._id}`, icon: FiMapPin, label: `لوحة ${userPoint.name}`, isPointDashboard: true },
    { to: '/agent/customers', icon: FiUsers, label: 'العملاء' },
    { to: '/agent/orders', icon: FiPackage, label: 'الطلبات' },
    { to: '/agent/commissions', icon: FiDollarSign, label: 'العمولات' },
    { to: '/dashboard/wallet', icon: FiDollarSign, label: 'المحفظة' },
    { to: '/dashboard/profile', icon: FiUser, label: 'الملف الشخصي' },
  ] : [
    // Regular Agent
    { to: '/agent', icon: FiHome, label: 'لوحة الوكيل' },
    { to: '/agent/customers', icon: FiUsers, label: 'العملاء' },
    { to: '/agent/orders', icon: FiPackage, label: 'الطلبات' },
    { to: '/agent/commissions', icon: FiDollarSign, label: 'العمولات' },
    { to: '/dashboard/wallet', icon: FiDollarSign, label: 'المحفظة' },
    { to: '/dashboard/profile', icon: FiUser, label: 'الملف الشخصي' },
  ];

  const customerLinksBase = userPoint ? [
    // Point Manager - show point dashboard first
    { to: `/pos/${userPoint._id}`, icon: FiMapPin, label: `لوحة ${userPoint.name}`, isPointDashboard: true },
    { to: '/dashboard', icon: FiHome, label: 'الرئيسية' },
    { to: '/dashboard/orders', icon: FiPackage, label: 'طلباتي' },
    { to: '/dashboard/stores', icon: FiShoppingBag, label: 'المتاجر' },
    { to: '/dashboard/wallet', icon: FiDollarSign, label: 'محفظتي' },
    { to: '/dashboard/chat', icon: FiMessageSquare, label: 'الدعم' },
    { to: '/dashboard/contact-replies', icon: FiInbox, label: 'رسائلي', showOnlyIfHasReplies: true },
    { to: '/dashboard/profile', icon: FiUser, label: 'حسابي' },
  ] : [
    // Regular Customer
    { to: '/dashboard', icon: FiHome, label: 'الرئيسية' },
    { to: '/dashboard/orders', icon: FiPackage, label: 'طلباتي' },
    { to: '/dashboard/stores', icon: FiShoppingBag, label: 'المتاجر' },
    { to: '/dashboard/wallet', icon: FiDollarSign, label: 'محفظتي' },
    { to: '/dashboard/chat', icon: FiMessageSquare, label: 'الدعم' },
    { to: '/dashboard/contact-replies', icon: FiInbox, label: 'رسائلي', showOnlyIfHasReplies: true },
    { to: '/dashboard/profile', icon: FiUser, label: 'حسابي' },
  ];

  // Filter links based on conditions
  const customerLinks = customerLinksBase.filter(link => {
    if (link.showOnlyIfHasReplies && !hasContactReplies) {
      return false;
    }
    return true;
  });

  // Admin links with permissions check
  const adminLinks = [
    { to: '/admin', icon: FiHome, label: 'لوحة التحكم' },
    { to: '/admin/orders', icon: FiPackage, label: 'الطلبات' },
    { to: '/admin/payments', icon: FiDollarSign, label: 'المدفوعات' },
    { to: '/admin/wallet-codes', icon: FiCreditCard, label: 'أكواد الشحن' },
    { to: '/admin/wallets', icon: FiDollarSign, label: 'المحافظ' },
    { to: '/admin/points', icon: FiMapPin, label: 'نقاط البيع' },
    { to: '/admin/agents', icon: FiUsers, label: 'الوكلاء' },
    { to: '/admin/agent-payments', icon: FiDollarSign, label: 'مدفوعات الوكلاء' },
    { to: '/admin/users', icon: FiUsers, label: 'المستخدمين' },
    { to: '/admin/roles', icon: FiShield, label: 'الأدوار والصلاحيات' },
    { to: '/admin/contact-messages', icon: FiMail, label: 'رسائل الاتصال' },
    { to: '/admin/chat', icon: FiMessageSquare, label: 'الدردشة المباشرة' },
    { to: '/admin/coupons', icon: FiTag, label: 'الكوبونات' },
    { to: '/admin/reports', icon: FiBarChart2, label: 'التقارير' },
    { to: '/admin/invoices', icon: FiFileText, label: 'الفواتير' },
    { to: '/admin/settings', icon: FiSettings, label: 'الإعدادات' },
  ].filter(link => canAccessRoute(user, link.to));

  const links = isAdmin ? adminLinks : (isAgent ? agentLinks : customerLinks);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close mobile menu immediately when link is clicked
  const handleLinkClick = useCallback(() => {
    // Close menu immediately without waiting for navigation
    setMobileMenuOpen(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-200"
          onClick={handleLinkClick}
        ></div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col fixed right-0 top-0 h-full w-64 bg-white shadow-xl z-30">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-primary-600 to-secondary-500 w-10 h-10 rounded-xl flex items-center justify-center">
              <FiPackage className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-primary-600">أوليفيا شيب</h2>
              <p className="text-xs text-gray-500">{isAdmin ? 'مدير' : 'عميل'}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-6 py-3 mx-2 rounded-xl text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-all ${
                  isActive ? 'bg-primary-50 text-primary-600 font-semibold shadow-sm' : ''
                }`}
              >
                <Icon className="text-xl" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Visit Website Link */}
          <Link
            to="/"
            className="flex items-center gap-3 px-6 py-3 mx-2 mt-4 rounded-xl text-primary-600 hover:bg-primary-50 transition-all border border-primary-200"
          >
            <FiGlobe className="text-xl" />
            <span>زيارة الموقع</span>
          </Link>

          {/* User Info */}
          <div className="px-6 py-4 mt-auto border-t border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <FiUser className="text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
            >
              <FiLogOut />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Sidebar - Mobile (Hidden - Using Bottom Nav Instead) */}
      <aside
        className="hidden"
      >
        <div className="p-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-primary-600 to-secondary-500 w-8 h-8 rounded-lg flex items-center justify-center">
              <FiPackage className="text-white text-sm" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-primary-600">أوليفيا شيب</h2>
              <p className="text-xs text-gray-500">{isAdmin ? 'مدير' : 'عميل'}</p>
            </div>
          </div>
          <button
            onClick={handleLinkClick}
            className="p-1.5 hover:bg-gray-100 rounded-lg active:bg-gray-200"
          >
            <FiX className="text-lg" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2 min-h-0">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={handleLinkClick}
                className={`flex items-center gap-2 px-4 py-2 mx-2 rounded-lg text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors ${
                  isActive ? 'bg-primary-50 text-primary-600 font-semibold shadow-sm' : ''
                }`}
              >
                <Icon className="text-base" />
                <span>{link.label}</span>
              </Link>
            );
          })}

          {/* Visit Website Link */}
          <Link
            to="/"
            onClick={handleLinkClick}
            className="flex items-center gap-2 px-4 py-2 mx-2 mt-2 rounded-lg text-sm text-primary-600 hover:bg-primary-50 transition-colors border border-primary-200"
          >
            <FiGlobe className="text-base" />
            <span>زيارة الموقع</span>
          </Link>
        </nav>

        {/* User Info - Fixed at bottom */}
        <div className="px-4 py-3 border-t border-gray-200 flex-shrink-0 bg-white">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
              <FiUser className="text-primary-600 text-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-xs truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
          >
            <FiLogOut className="text-base" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 lg:mr-64">
        {/* Mobile Header - Compact */}
        <div className="lg:hidden bg-white shadow-sm sticky top-0 z-20 px-3 py-2 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {/* Logo & Name */}
            <Link to="/" className="flex items-center gap-2">
              {settings?.general?.logo ? (
                <img
                  src={settings.general.logo.startsWith('data:') ? settings.general.logo : (settings.general.logo.startsWith('/uploads/') ? `/api${settings.general.logo}` : settings.general.logo)}
                  alt="Logo"
                  className="h-8 w-auto object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="bg-gradient-to-br from-primary-600 to-secondary-500 w-8 h-8 rounded-lg flex items-center justify-center">
                  <FiPackage className="text-white text-base" />
                </div>
              )}
              <div>
                <div className="text-sm font-bold text-primary-600 leading-tight">
                  {settings?.general?.siteName?.split(' - ')[0] || 'Olivia Ship'}
                </div>
                <div className="text-[10px] text-gray-500 leading-tight">
                  {isAdmin ? 'لوحة الإدارة' : 'حسابي'}
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {/* Cart Icon */}
              {!isAdmin && !isAgent && !userPoint && (
                <Link
                  to="/cart"
                  className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                  onClick={loadCartCount}
                >
                  <FiShoppingCart className="text-xl text-gray-700" />
                  {cartItemsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                      {cartItemsCount > 9 ? '9+' : cartItemsCount}
                    </span>
                  )}
                </Link>
              )}

              {/* User Menu Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiMenu className="text-xl text-gray-700" />
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setUserMenuOpen(false)}
                    ></div>
                    
                    {/* Menu */}
                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
                      <Link
                        to="/dashboard/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <FiUser className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">حسابي</span>
                      </Link>
                      
                      <Link
                        to="/"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
                      >
                        <FiGlobe className="text-gray-600" />
                        <span className="text-sm font-medium text-gray-700">زيارة الموقع</span>
                      </Link>
                      
                      <div className="border-t border-gray-100 my-2"></div>
                      
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition-colors text-red-600"
                      >
                        <FiLogOut />
                        <span className="text-sm font-medium">تسجيل الخروج</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex bg-white shadow-md sticky top-0 z-20 px-6 py-6 items-center justify-between border-b border-gray-200 mb-6">
          <h1 className="text-2xl font-bold text-primary-600">أوليفيا شيب</h1>
          <div className="flex items-center gap-3">
            {/* Show cart only for regular customers (not admins, agents or point managers) */}
            {!isAdmin && !isAgent && !userPoint && (
              <Link
                to="/cart"
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={loadCartCount}
                title="السلة"
              >
                <FiShoppingCart className="text-2xl text-gray-700" />
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                    {cartItemsCount > 9 ? '9+' : cartItemsCount}
                  </span>
                )}
              </Link>
            )}
            <Link
              to="/dashboard/profile"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="الملف الشخصي"
            >
              <FiUser className="text-2xl text-gray-700" />
            </Link>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">
          <Outlet />
        </div>
      </div>

      {/* Bottom Navigation - Mobile Only (Customer Dashboard) - Compact */}
      {!isAdmin && !isAgent && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          <div className="grid grid-cols-5 h-14">
            {links.slice(0, 5).map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex flex-col items-center justify-center gap-0.5 transition-all ${
                    isActive 
                      ? 'text-primary-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className={`text-xl ${isActive ? 'scale-110' : ''} transition-transform`} />
                  <span className={`text-[10px] font-medium ${isActive ? 'font-bold' : ''}`}>
                    {link.label}
                  </span>
                  {isActive && (
                    <div className="absolute bottom-0 w-10 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-t-full"></div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
