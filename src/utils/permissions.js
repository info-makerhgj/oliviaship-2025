// Frontend permission helpers

/**
 * Check if user has a specific permission
 */
export const hasPermission = (user, permission) => {
  if (!user || user.role !== 'admin') {
    return false;
  }

  // Super admin has all permissions
  if (user.permissions?.adminType === 'super_admin') {
    return true;
  }

  // Check specific permission
  return user.permissions?.[permission] === true;
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = (user) => {
  return user?.role === 'admin' && user?.permissions?.adminType === 'super_admin';
};

/**
 * Permission mappings for admin links
 */
export const PERMISSION_MAP = {
  '/admin': () => true, // Dashboard always accessible
  '/admin/orders': (user) => hasPermission(user, 'canManageOrders'),
  '/admin/payments': (user) => hasPermission(user, 'canManagePayments'),
  '/admin/wallet-codes': (user) => hasPermission(user, 'canManageWallets'),
  '/admin/wallets': (user) => hasPermission(user, 'canManageWallets'),
  '/admin/points': (user) => hasPermission(user, 'canManagePoints'),
  '/admin/agents': (user) => hasPermission(user, 'canManageAgents'),
  '/admin/agent-payments': (user) => hasPermission(user, 'canManageAgents'),
  '/admin/users': (user) => hasPermission(user, 'canManageUsers'),
  '/admin/settings': (user) => hasPermission(user, 'canManageSettings'),
  '/admin/roles': (user) => isSuperAdmin(user), // Only super admin can manage roles
  '/admin/contact-messages': (user) => hasPermission(user, 'canManageSettings') || hasPermission(user, 'canManageUsers'), // Settings or users managers can view
  '/admin/chat': (user) => hasPermission(user, 'canManageSettings') || hasPermission(user, 'canManageUsers'), // Settings or users managers can chat
  '/admin/coupons': (user) => hasPermission(user, 'canManageSettings') || hasPermission(user, 'canManageOrders'), // Settings or orders managers can manage coupons
};

/**
 * Check if user can access a route
 */
export const canAccessRoute = (user, route) => {
  const checkPermission = PERMISSION_MAP[route];
  if (!checkPermission) {
    return true; // Unknown routes - allow by default
  }
  return checkPermission(user);
};

