import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';
import { useGoogleAnalytics } from './hooks/useGoogleAnalytics';

// Loading Component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

// Layouts - Keep these as regular imports (small files)
import MainLayout from './components/layouts/MainLayout';
import DashboardLayout from './components/layouts/DashboardLayout';

// Lazy load all pages
// Public Pages
const HomePage = lazy(() => import('./pages/public/HomePage'));
const OrderPage = lazy(() => import('./pages/public/OrderPage'));
const TrackingPage = lazy(() => import('./pages/public/TrackingPage'));
const AboutPage = lazy(() => import('./pages/public/AboutPage'));
const ContactPage = lazy(() => import('./pages/public/ContactPage'));
const TermsPage = lazy(() => import('./pages/public/TermsPage'));
const PrivacyPage = lazy(() => import('./pages/public/PrivacyPage'));
const CookiesPage = lazy(() => import('./pages/public/CookiesPage'));
const PointsPage = lazy(() => import('./pages/public/PointsPage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));
const CartPage = lazy(() => import('./pages/public/CartPage'));
const StoresPage = lazy(() => import('./pages/public/StoresPage'));

// Customer Pages
const CustomerDashboard = lazy(() => import('./pages/customer/Dashboard'));
const MyOrders = lazy(() => import('./pages/customer/MyOrders'));
const OrderDetails = lazy(() => import('./pages/customer/OrderDetails'));
const WalletPage = lazy(() => import('./pages/customer/WalletPage'));
const ProfilePage = lazy(() => import('./pages/customer/ProfilePage'));
const CustomerChat = lazy(() => import('./pages/customer/Chat'));
const ContactReplies = lazy(() => import('./pages/customer/ContactReplies'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminOrders = lazy(() => import('./pages/admin/Orders'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminInvoices = lazy(() => import('./pages/admin/Invoices'));
const AdminPayments = lazy(() => import('./pages/admin/Payments'));
const AdminRoles = lazy(() => import('./pages/admin/Roles'));
const AdminContactMessages = lazy(() => import('./pages/admin/ContactMessages'));
const AdminChat = lazy(() => import('./pages/admin/AdminChat'));
const AdminCoupons = lazy(() => import('./pages/admin/Coupons'));
const WalletCodes = lazy(() => import('./pages/admin/WalletCodes'));
const Wallets = lazy(() => import('./pages/admin/Wallets'));
const PointsOfSale = lazy(() => import('./pages/admin/PointsOfSale'));
const Agents = lazy(() => import('./pages/admin/Agents'));
const AgentPayments = lazy(() => import('./pages/admin/AgentPayments'));

// POS & Agent Pages
const PointDashboard = lazy(() => import('./pages/pos/PointDashboard'));
const PointManagerRedirect = lazy(() => import('./pages/pos/PointManagerRedirect'));
const AgentDashboard = lazy(() => import('./pages/agent/AgentDashboard'));
const AgentCustomers = lazy(() => import('./pages/agent/AgentCustomers'));
const AgentOrders = lazy(() => import('./pages/agent/AgentOrders'));
const AgentCommissions = lazy(() => import('./pages/agent/AgentCommissions'));

// Private Route Component
const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Admin Route Component
const AdminRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

function App() {
  // Initialize Google Analytics
  useGoogleAnalytics();

  return (
    <ErrorBoundary>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="order" element={<OrderPage />} />
        <Route path="track" element={<TrackingPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="terms" element={<TermsPage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="cookies" element={<CookiesPage />} />
        <Route path="points" element={<PointsPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="cart" element={<CartPage />} />
      </Route>

      {/* Customer Dashboard */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<CustomerDashboard />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="chat" element={<CustomerChat />} />
        <Route path="contact-replies" element={<ContactReplies />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="stores" element={<StoresPage />} />
      </Route>

      {/* Point of Sale Dashboard */}
      <Route path="/pos" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route path=":pointId" element={<PointDashboard />} />
      </Route>
      
      {/* Auto-redirect to user's point dashboard */}
      <Route path="/point-dashboard" element={<PrivateRoute><PointManagerRedirect /></PrivateRoute>} />

      {/* Agent Dashboard */}
      <Route path="/agent" element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
        <Route index element={<AgentDashboard />} />
        <Route path="customers" element={<AgentCustomers />} />
        <Route path="orders" element={<AgentOrders />} />
        <Route path="commissions" element={<AgentCommissions />} />
      </Route>

      {/* Admin Dashboard */}
      <Route path="/admin" element={<AdminRoute><DashboardLayout /></AdminRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="roles" element={<AdminRoles />} />
        <Route path="contact-messages" element={<AdminContactMessages />} />
        <Route path="chat" element={<AdminChat />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="payments" element={<AdminPayments />} />
        <Route path="wallet-codes" element={<WalletCodes />} />
        <Route path="wallets" element={<Wallets />} />
        <Route path="points" element={<PointsOfSale />} />
        <Route path="agents" element={<Agents />} />
        <Route path="agent-payments" element={<AgentPayments />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="invoices" element={<AdminInvoices />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
