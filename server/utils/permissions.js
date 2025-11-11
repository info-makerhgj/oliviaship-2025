// Permission definitions and helper functions

// Permission presets based on admin type
export const PERMISSION_PRESETS = {
  super_admin: {
    canManageOrders: true,
    canManageUsers: true,
    canManagePayments: true,
    canManageAgents: true,
    canManagePoints: true,
    canManageSettings: true,
    canManageWallets: true,
  },
  orders_manager: {
    canManageOrders: true,
    canManageUsers: false,
    canManagePayments: false,
    canManageAgents: false,
    canManagePoints: false,
    canManageSettings: false,
    canManageWallets: false,
  },
  users_manager: {
    canManageOrders: false,
    canManageUsers: true,
    canManagePayments: false,
    canManageAgents: false,
    canManagePoints: false,
    canManageSettings: false,
    canManageWallets: false,
  },
  payments_manager: {
    canManageOrders: false,
    canManageUsers: false,
    canManagePayments: true,
    canManageAgents: false,
    canManagePoints: false,
    canManageSettings: false,
    canManageWallets: true,
  },
  settings_manager: {
    canManageOrders: false,
    canManageUsers: false,
    canManagePayments: false,
    canManageAgents: false,
    canManagePoints: false,
    canManageSettings: true,
    canManageWallets: false,
  },
};

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
 * Apply permission preset to user permissions
 */
export const applyPermissionPreset = (permissionType) => {
  const preset = PERMISSION_PRESETS[permissionType];
  if (!preset) {
    return null;
  }

  return {
    adminType: permissionType,
    ...preset,
  };
};

