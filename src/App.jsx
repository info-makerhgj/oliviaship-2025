import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import ErrorBoundary from './components/ErrorBoundary';
import { useGoogleAnalytics } from './hooks/useGoogleAnalytics';

// Layouts
import MainLayout from './components/layouts/MainLayout';
import DashboardLayout from './components/layouts/DashboardLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import OrderPage from './pages/public/OrderPage';
import TrackingPage from './pages/public/TrackingPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';
import TermsPage from './pages/public/TermsPage';
import PrivacyPage from './pages/public/PrivacyPage';
import CookiesPage from './pages/public/CookiesPage';
import PointsPage from './pages/public/PointsPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import CartPage from './pages/public/CartPage';

// Customer Pages
import CustomerDashboard from './pages/customer/Dashboard';
import MyOrders from './pages/customer/MyOrders';
import OrderDetails from './pages/customer/OrderDetails';
import WalletPage from './pages/customer/WalletPage';
import ProfilePage from './pages/customer/ProfilePage';
import CustomerChat from './pages/customer/Chat';
import ContactReplies from './pages/customer/ContactReplies';
import StoresPage from './pages/public/StoresPage';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminOrders from './pages/admin/Orders';
import AdminUsers from './pages/admin/Users';
import AdminSettings from './pages/admin/Settings';
import AdminReports from './pages/admin/Reports';
import AdminInvoices from './pages/admin/Invoices';
import AdminPayments from './pages/admin/Payments';
import AdminRoles from './pages/admin/Roles';
import AdminContactMessages from './pages/admin/ContactMessages';
import AdminChat from './pages/admin/AdminChat';
import AdminCoupons from './pages/admin/Coupons';
import WalletCodes from './pages/admin/WalletCodes';
import Wallets from './pages/admin/Wallets';
import PointsOfSale from './pages/admin/PointsOfSale';
import Agents from './pages/admin/Agents';
import AgentPayments from './pages/admin/AgentPayments';
import PointDashboard from './pages/pos/PointDashboard';
import PointManagerRedirect from './pages/pos/PointManagerRedirect';
import AgentDashboard from './pages/agent/AgentDashboard';
import AgentCustomers from './pages/agent/AgentCustomers';
import AgentOrders from './pages/agent/AgentOrders';
import AgentCommissions from './pages/agent/AgentCommissions';

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
    </ErrorBoundary>
  );
}

export default App;
