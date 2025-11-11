import axios from 'axios';

// Use relative path to utilize Vite proxy, or environment variable if set
// This allows it to work from any network IP (192.168.x.x, etc.)
const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Validate JWT token format (basic check)
const isValidJWTFormat = (token) => {
  if (!token || typeof token !== 'string') return false;
  // JWT should have 3 parts separated by dots
  const parts = token.split('.');
  return parts.length === 3 && parts.every(part => part.length > 0);
};

// Add token to requests
api.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth-storage');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Try different storage formats
      const token = parsed.token || parsed.state?.token || parsed.state?.user?.token;
      
      if (token) {
        // Validate token format before using it
        if (isValidJWTFormat(token)) {
          config.headers.Authorization = `Bearer ${token}`;
        } else {
          console.warn('⚠️ Invalid JWT token format detected, clearing storage');
          localStorage.removeItem('auth-storage');
          // Redirect to login if not already there
          if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
            window.location.href = '/login';
          }
        }
      }
    } catch (e) {
      // Clear corrupted storage
      console.error('Failed to parse auth storage, clearing:', e);
      localStorage.removeItem('auth-storage');
    }
  }
  return config;
});

// Handle 401/403 responses (unauthorized/forbidden)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle network errors (no response from server)
    if (!error.response) {
      const networkError = new Error('فشل الاتصال بالخادم. يرجى التحقق من الاتصال بالإنترنت.');
      networkError.isNetworkError = true;
      return Promise.reject(networkError);
    }

    // Handle 401 unauthorized or JWT errors
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || '';
      
      // Check if it's a JWT-related error
      if (errorMessage.includes('jwt') || errorMessage.includes('token') || errorMessage.includes('رمز')) {
        console.warn('🔐 JWT token error detected, clearing storage');
      }
      
      // Clear auth storage and redirect to login
      localStorage.removeItem('auth-storage');
      sessionStorage.clear();
      
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
        window.location.href = '/login';
      }
    }
    
    // Suppress console errors for silent order lookups (expected 404s)
    // This is normal - we check both order types, one will always return 404
    if (error.silent || error.suppressConsole || 
        (error.response?.status === 404 && 
         error.config?.url && 
         (error.config.url.includes('/orders/') || error.config.url.includes('/smart-cart-orders/')))) {
      // Don't log to console, just reject silently
      // This is expected behavior when checking order type
      return Promise.reject(error);
    }
    
    // Suppress 403 errors for /agents/me when agent is disabled (expected behavior)
    if (error.response?.status === 403 && 
        error.config?.url && 
        error.config.url.includes('/agents/me')) {
      // Don't log to console - this is expected when agent is disabled
      // Just reject silently
      return Promise.reject(error);
    }
    
    // Only log actual errors (not expected ones like 404 for order lookups or 403 for disabled agents)
    if (error.response?.status >= 500 || (!error.silent && error.response?.status !== 404 && error.response?.status !== 403)) {
      console.error('API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      });
    }
    
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

// Product APIs
export const productAPI = {
  fetchFromUrl: (url) => api.post('/products/fetch-from-url', { url }),
  calculateCost: (data) => api.post('/products/calculate-cost', data),
  validateUrl: (url) => api.post('/products/validate-url', { url }),
};

// Helper function to make silent requests (for order type detection)
// This prevents 404 errors from appearing in console
const silentGet = (url) => {
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Create silent console temporarily
  let errorSuppressed = false;
  console.error = (...args) => {
    const msg = args[0]?.toString() || '';
    const fullMsg = args.map(a => a?.toString() || '').join(' ');
    // Suppress 404 errors for order endpoints completely
    if ((msg.includes('404') || fullMsg.includes('404')) && 
        (fullMsg.includes('/orders/') || fullMsg.includes('/smart-cart-orders/'))) {
      errorSuppressed = true;
      return; // Suppress this error completely
    }
    originalError.apply(console, args);
  };
  
  console.warn = (...args) => {
    const msg = args[0]?.toString() || '';
    const fullMsg = args.map(a => a?.toString() || '').join(' ');
    // Suppress 404 warnings for order endpoints completely
    if ((msg.includes('404') || fullMsg.includes('404')) && 
        (fullMsg.includes('/orders/') || fullMsg.includes('/smart-cart-orders/'))) {
      return; // Suppress this warning completely
    }
    originalWarn.apply(console, args);
  };

  return api.get(url, {
    validateStatus: (status) => {
      // Accept all status codes, we'll handle them manually
      // This prevents axios from logging 404 errors to console
      return true;
    }
  })
  .then((response) => {
    // Restore console immediately
    console.error = originalError;
    console.warn = originalWarn;
    
    // If it's a 404, treat it as an error but silently
    if (response.status === 404) {
      const error = new Error('Not found');
      error.response = response;
      error.config = response.config;
      error.isAxiosError = true;
      error.silent = true;
      error.suppressConsole = true; // Mark to suppress in interceptor
      return Promise.reject(error);
    }
    
    // Return successful responses normally
    if (response.status >= 200 && response.status < 300) {
      return response;
    }
    
    // For other error statuses, reject
    const error = new Error(`Request failed with status ${response.status}`);
    error.response = response;
    error.config = response.config;
    error.isAxiosError = true;
    return Promise.reject(error);
  })
  .catch((error) => {
    // Restore console in catch
    console.error = originalError;
    console.warn = originalWarn;
    
    // Mark 404s as silent
    if (error.response?.status === 404) {
      error.silent = true;
      error.suppressConsole = true;
    }
    return Promise.reject(error);
  });
};

// Order APIs
export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getAll: (params) => api.get('/orders', { params }),
  getOne: (id) => silentGet(`/orders/${id}`),
  updateStatus: (id, data) => api.put(`/orders/${id}/status`, data),
  assignToPoint: (id, pointId) => api.put(`/orders/${id}/assign-point`, { pointId }),
  track: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
};

// Smart Cart Order APIs
export const smartCartOrderAPI = {
  getAll: (params) => api.get('/smart-cart-orders', { params }),
  getOne: (id) => silentGet(`/smart-cart-orders/${id}`),
  updateStatus: (id, data) => api.put(`/smart-cart-orders/${id}/status`, data),
  assignToPoint: (id, pointId) => api.put(`/smart-cart-orders/${id}/assign-point`, { pointId }),
  downloadInvoice: (orderId) => api.get(`/invoices/order/${orderId}/download`, { responseType: 'blob' }),
};

// Cart APIs
export const cartAPI = {
  getPricing: () => api.get('/cart/pricing'),
  get: () => api.get('/cart'),
  fetchAndAdd: (data) => api.post('/cart/fetch-and-add', data),
  updateQuantity: (itemId, quantity) => api.put(`/cart/items/${itemId}/quantity`, { quantity }),
  updateOptions: (itemId, options) => api.put(`/cart/items/${itemId}/options`, options),
  removeItem: (itemId) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart/clear'),
  checkout: (data) => api.post('/cart/checkout', data),
};

// Stats APIs
export const statsAPI = {
  getDashboard: () => api.get('/stats/dashboard'),
};

// Settings APIs
export const settingsAPI = {
  get: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/settings/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Notification APIs
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
};

// User APIs
// Payment APIs
export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getOne: (id) => api.get(`/payments/${id}`),
  getMyPayments: (params) => api.get('/payments/my/all', { params }),
  create: (data) => api.post('/payments', data),
  updateStatus: (id, data) => api.put(`/payments/${id}/status`, data),
  processRefund: (id, data) => api.post(`/payments/${id}/refund`, data),
  getStats: (params) => api.get('/payments/stats', { params }),
};

// Stripe APIs
export const stripeAPI = {
  verifySession: (sessionId) => api.get(`/stripe/verify-session/${sessionId}`),
};

// Cash Pay APIs
export const cashPayAPI = {
  createPayment: (data) => api.post('/payments/cashpay/create', data),
  verifyPayment: (paymentId) => api.get(`/payments/cashpay/verify/${paymentId}`),
};

// Wallet APIs
export const walletAPI = {
  get: () => api.get('/wallet'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  redeemCode: (code) => api.post('/wallet/redeem-code', { code }),
  // Admin
  getByUserId: (userId) => api.get('/wallet/by-user', { params: { userId } }),
  exportTransactions: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/wallet/transactions/export?${queryString}`, {
      responseType: 'blob',
    });
  },
  // Admin
  createCode: (data) => api.post('/wallet/codes', data),
  getAllCodes: (params) => api.get('/wallet/codes', { params }),
  exportCodes: (params) => {
    const queryString = new URLSearchParams(params).toString();
    return api.get(`/wallet/codes/export?${queryString}`, {
      responseType: 'blob',
    });
  },
  getCodeQR: (codeId) => api.get(`/wallet/codes/${codeId}/qr`),
  getAllWallets: (params) => api.get('/wallet/all', { params }),
  adjustBalance: (data) => api.post('/wallet/adjust', data),
  getWalletTransactions: (walletId, params) => api.get(`/wallet/${walletId}/transactions`, { params }),
};

// Point of Sale APIs
export const posAPI = {
  // Public
  getPublic: (params) => api.get('/pos/public', { params }),
  // Customer
  getNearestPoints: (params) => api.get('/pos/nearest', { params }),
  confirmPickup: (orderId, orderType) => api.put(`/pos/orders/${orderId}/confirm-pickup`, { orderType }),
  // Admin
  create: (data) => api.post('/pos', data),
  getAll: (params) => api.get('/pos', { params }),
  getOne: (id) => api.get(`/pos/${id}`),
  update: (id, data) => api.put(`/pos/${id}`, data),
  delete: (id) => api.delete(`/pos/${id}`),
  toggleStatus: (id) => api.patch(`/pos/${id}/toggle-status`),
  distributeCodes: (id, data) => api.post(`/pos/${id}/distribute-codes`, data),
  getStats: (id) => api.get(`/pos/${id}/stats`),
  getAdminStats: (id) => api.get(`/pos/${id}/admin-stats`),
  // Point Manager
  getMyPoint: () => api.get('/pos/my-point'),
  getCodes: (id, params) => api.get(`/pos/${id}/codes`, { params }),
  getOrders: (id, params) => api.get(`/pos/${id}/orders`, { params }),
  sellCode: (id, data) => api.post(`/pos/${id}/sell-code`, data),
  returnCode: (id, data) => api.post(`/pos/${id}/return-code`, data),
  requestCodes: (id, data) => api.post(`/pos/${id}/request-codes`, data),
  markOrderReady: (id, orderId, orderType) => api.put(`/pos/${id}/orders/${orderId}/ready?orderType=${orderType}`, {}),
  getCommissions: (id, params) => api.get(`/pos/${id}/commissions`, { params }),
  updateCommissionStatus: (commissionId, data) => api.put(`/pos/commissions/${commissionId}`, data),
};

export const userAPI = {
  getAll: () => api.get('/users'),
  getOne: (id) => api.get(`/users/${id}`),
  createAdmin: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  toggleStatus: (id) => api.patch(`/users/${id}/toggle-status`),
  updatePermissions: (id, data) => api.patch(`/users/${id}/permissions`, data),
};

// Contact APIs
export const contactAPI = {
  send: (data) => api.post('/contact', data),
  getAll: (params) => api.get('/contact', { params }),
  getOne: (id) => api.get(`/contact/${id}`),
  updateStatus: (id, data) => api.patch(`/contact/${id}/status`, data),
  reply: (id, data) => api.post(`/contact/${id}/reply`, data),
  delete: (id) => api.delete(`/contact/${id}`),
};

// Coupon APIs
export const couponAPI = {
  getActive: () => api.get('/coupons/active'),
  validate: (code) => api.post('/coupons/validate', { code }),
  apply: (code) => api.post('/coupons/apply', { code }),
  remove: (couponId) => api.delete(`/coupons/remove/${couponId}`),
  // Admin
  getAll: (params) => api.get('/coupons', { params }),
  getOne: (id) => api.get(`/coupons/${id}`),
  create: (data) => api.post('/coupons', data),
  update: (id, data) => api.put(`/coupons/${id}`, data),
  delete: (id) => api.delete(`/coupons/${id}`),
  toggleStatus: (id) => api.patch(`/coupons/${id}/toggle-status`),
};

// Chat APIs
export const chatAPI = {
  getMyChat: () => api.get('/chat/my-chat'),
  getAllChats: (params) => api.get('/chat', { params }),
  getChat: (id) => api.get(`/chat/${id}`),
  sendMessage: (chatId, message) => api.post('/chat/send', { chatId, message }),
  markAsRead: (id) => api.patch(`/chat/${id}/read`),
  updateStatus: (id, data) => api.patch(`/chat/${id}/status`, data),
};

// Invoice APIs
export const invoiceAPI = {
  getAll: (params) => api.get('/invoices', { params }),
  getOne: (id) => api.get(`/invoices/${id}`),
  getByOrder: (orderId) => api.get(`/invoices/order/${orderId}`),
  create: (data) => api.post('/invoices', data),
  updateStatus: (id, status) => api.patch(`/invoices/${id}/status`, { status }),
  cancel: (id, reason) => api.post(`/invoices/${id}/cancel`, { reason }),
  sendEmail: (id) => api.post(`/invoices/${id}/send-email`),
  generatePDF: (id) => api.post(`/invoices/${id}/generate-pdf`),
  download: (id) => api.get(`/invoices/${id}/download`, { responseType: 'blob' }),
  downloadByOrder: (orderId) => api.get(`/invoices/order/${orderId}/download`, { responseType: 'blob' }),
  getStats: (params) => api.get('/invoices/stats', { params }),
};

// Agent APIs
export const agentAPI = {
  // Agent profile
  getMyAgent: () => api.get('/agents/me'),
  getOne: (id) => api.get(`/agents/${id}`),
  getStats: (id) => api.get(`/agents/${id}/stats`),
  // Admin
  create: (data) => api.post('/agents', data),
  getAll: (params) => api.get('/agents', { params }),
  update: (id, data) => api.put(`/agents/${id}`, data),
  toggleStatus: (id) => api.patch(`/agents/${id}/toggle-status`),
  delete: (id) => api.delete(`/agents/${id}`),
  // Customers
  createCustomer: (agentId, data) => api.post(`/agents/${agentId}/customers`, data),
  getCustomers: (agentId, params) => api.get(`/agents/${agentId}/customers`, { params }),
  getCustomer: (agentId, customerId) => api.get(`/agents/${agentId}/customers/${customerId}`),
  updateCustomer: (agentId, customerId, data) => api.put(`/agents/${agentId}/customers/${customerId}`, data),
  deleteCustomer: (agentId, customerId) => api.delete(`/agents/${agentId}/customers/${customerId}`),
  // Orders
  createOrder: (agentId, data) => api.post(`/agents/${agentId}/orders`, data),
  getOrders: (agentId, params) => api.get(`/agents/${agentId}/orders`, { params }),
  getOrder: (agentId, orderId) => api.get(`/agents/${agentId}/orders/${orderId}`),
  updateOrderStatus: (agentId, orderId, data) => api.put(`/agents/${agentId}/orders/${orderId}/status`, data),
  markCustomerPayment: (agentId, orderId, data) => api.post(`/agents/${agentId}/orders/${orderId}/customer-payment`, data),
  submitOrder: (agentId, orderId) => api.post(`/agents/${agentId}/orders/${orderId}/submit`),
  batchSubmitOrders: (agentId, data) => api.post(`/agents/${agentId}/orders/batch-submit`, data),
  markAgentPayment: (agentId, orderId, data) => api.post(`/agents/${agentId}/orders/${orderId}/agent-payment`, data),
  // Payments (Admin)
  getAgentPayments: (params) => api.get('/agents/payments/all', { params }),
  getAgentPaymentStats: (params) => api.get('/agents/payments/stats', { params }),
};

export default api;
