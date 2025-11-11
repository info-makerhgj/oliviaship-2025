import { useEffect, useState } from 'react';
import { userAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { useAuthStore } from '../../store/authStore';
import { 
  FiUsers, 
  FiLoader, 
  FiSearch,
  FiShield,
  FiPackage,
  FiDollarSign,
  FiSettings,
  FiUser,
  FiCreditCard,
  FiMapPin,
  FiCheck,
  FiX,
  FiEdit,
  FiPlus,
  FiMail,
  FiPhone,
  FiLock
} from 'react-icons/fi';

const PERMISSION_TYPES = {
  super_admin: {
    label: 'مدير النظام الكامل',
    description: 'صلاحيات كاملة على جميع الوظائف',
    icon: FiShield,
    color: 'bg-purple-100 text-purple-700',
  },
  orders_manager: {
    label: 'مدير الطلبات',
    description: 'إدارة الطلبات فقط',
    icon: FiPackage,
    color: 'bg-blue-100 text-blue-700',
  },
  users_manager: {
    label: 'مدير المستخدمين',
    description: 'إدارة المستخدمين فقط',
    icon: FiUser,
    color: 'bg-green-100 text-green-800',
  },
  payments_manager: {
    label: 'مدير المدفوعات',
    description: 'إدارة المدفوعات والمحافظ',
    icon: FiDollarSign,
    color: 'bg-yellow-100 text-yellow-800',
  },
  settings_manager: {
    label: 'مدير الإعدادات',
    description: 'إدارة إعدادات المنصة فقط',
    icon: FiSettings,
    color: 'bg-gray-100 text-gray-800',
  },
};

export default function AdminRoles() {
  const { error: showError, success: showSuccess } = useToast();
  const { user: currentUser } = useAuthStore();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredAdmins, setFilteredAdmins] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPermission, setEditingPermission] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    permissionType: 'orders_manager',
  });

  useEffect(() => {
    loadAdmins();
  }, []);

  useEffect(() => {
    filterAdmins();
  }, [admins, searchTerm]);

  const loadAdmins = async () => {
    try {
      const res = await userAPI.getAll();
      // Filter only admin users
      const adminUsers = (res.data.users || []).filter(u => u.role === 'admin');
      setAdmins(adminUsers);
    } catch (error) {
      console.error('Failed to load admins', error);
      showError('فشل تحميل قائمة المديرين');
    } finally {
      setLoading(false);
    }
  };

  const filterAdmins = () => {
    let filtered = [...admins];

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(admin => 
        admin.name?.toLowerCase().includes(search) ||
        admin.email?.toLowerCase().includes(search)
      );
    }

    setFilteredAdmins(filtered);
  };

  const handleUpdatePermission = async (adminId, permissionType) => {
    setUpdating(true);
    try {
      await userAPI.updatePermissions(adminId, { permissionType });
      await loadAdmins();
      setEditingPermission(null);
      showSuccess('تم تحديث الصلاحيات بنجاح');
    } catch (error) {
      console.error('Failed to update permissions', error);
      showError(error.response?.data?.message || 'فشل تحديث الصلاحيات');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await userAPI.createAdmin(newAdmin);
      await loadAdmins();
      setShowAddModal(false);
      setNewAdmin({
        name: '',
        email: '',
        password: '',
        phone: '',
        permissionType: 'orders_manager',
      });
      showSuccess('تم إنشاء حساب المدير بنجاح');
    } catch (error) {
      console.error('Failed to create admin', error);
      showError(error.response?.data?.message || 'فشل إنشاء حساب المدير');
    } finally {
      setCreating(false);
    }
  };

  const isSuperAdmin = (user) => {
    return user?.permissions?.adminType === 'super_admin';
  };

  const getPermissionLabel = (user) => {
    const permType = user?.permissions?.adminType;
    if (!permType) return 'لا توجد صلاحيات محددة';
    return PERMISSION_TYPES[permType]?.label || permType;
  };

  const getPermissionColor = (user) => {
    const permType = user?.permissions?.adminType;
    if (!permType) return 'bg-gray-100 text-gray-800';
    return PERMISSION_TYPES[permType]?.color || 'bg-gray-100 text-gray-800';
  };

  // Check if current user is super admin
  const canEdit = isSuperAdmin(currentUser);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-2 text-gradient">إدارة الأدوار والصلاحيات</h1>
        <p className="text-gray-600 text-sm">
          {canEdit 
            ? 'إدارة صلاحيات المديرين وتخصيص الأدوار' 
            : 'عرض صلاحيات المديرين (مدير النظام فقط يمكنه التعديل)'}
        </p>
      </div>

      {/* Warning if not super admin */}
      {!canEdit && (
        <div className="card bg-yellow-50 border-yellow-200 mb-6">
          <div className="flex items-center gap-3">
            <FiShield className="text-yellow-600 text-xl" />
            <div>
              <p className="font-semibold text-yellow-800">صلاحيات محدودة</p>
              <p className="text-sm text-yellow-700">
                فقط مدير النظام الكامل يمكنه تعديل الصلاحيات
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-400 font-medium mb-1">إجمالي المديرين</p>
              <p className="text-xl font-bold text-purple-900">{admins.length}</p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <FiUsers className="text-lg md:text-xl text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium mb-1">مدير النظام</p>
              <p className="text-xl font-bold text-blue-900">
                {admins.filter(a => isSuperAdmin(a)).length}
              </p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <FiShield className="text-lg md:text-xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 font-medium mb-1">مديرو الطلبات</p>
              <p className="text-xl font-bold text-green-900">
                {admins.filter(a => a.permissions?.adminType === 'orders_manager').length}
              </p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <FiPackage className="text-lg md:text-xl text-green-700" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-700 font-medium mb-1">مديرو المدفوعات</p>
              <p className="text-xl font-bold text-yellow-900">
                {admins.filter(a => a.permissions?.adminType === 'payments_manager').length}
              </p>
            </div>
            <div className="bg-yellow-200 p-3 rounded-xl">
              <FiDollarSign className="text-lg md:text-xl text-yellow-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Add Button */}
      <div className="card mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <FiSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم أو البريد الإلكتروني..."
              className="input-field pr-12 w-full"
            />
          </div>
          {canEdit && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center gap-2 whitespace-nowrap"
            >
              <FiPlus />
              <span>إضافة مدير جديد</span>
            </button>
          )}
        </div>
      </div>

      {/* Admins List */}
      {filteredAdmins.length > 0 ? (
        <div className="space-y-4">
          {filteredAdmins.map((admin) => (
            <div key={admin._id} className="card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-bold text-xl">
                      {admin.name?.charAt(0)?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-bold text-lg">{admin.name}</h3>
                      {isSuperAdmin(admin) && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                          مدير النظام
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{admin.email}</p>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${getPermissionColor(admin)}`}>
                        {getPermissionLabel(admin)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {canEdit && (
                  <div className="relative">
                    <button
                      onClick={() => setEditingPermission(editingPermission === admin._id ? null : admin._id)}
                      disabled={updating}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <FiEdit />
                    </button>
                    
                    {editingPermission === admin._id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setEditingPermission(null)}
                        />
                        <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[280px]">
                          <div className="p-2">
                            <p className="text-sm font-semibold text-gray-700 mb-2 px-2">اختر نوع الصلاحيات:</p>
                            {Object.entries(PERMISSION_TYPES).map(([key, value]) => {
                              const Icon = value.icon;
                              const isSelected = admin.permissions?.adminType === key;
                              return (
                                <button
                                  key={key}
                                  onClick={() => {
                                    if (!isSelected) {
                                      handleUpdatePermission(admin._id, key);
                                    }
                                  }}
                                  disabled={updating || isSelected}
                                  className={`w-full text-right px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                                    isSelected ? 'bg-primary-50 text-primary-600' : ''
                                  } disabled:opacity-50`}
                                >
                                  <Icon className="text-lg" />
                                  <div className="flex-1 text-right">
                                    <p className="font-medium">{value.label}</p>
                                    <p className="text-xs text-gray-500">{value.description}</p>
                                  </div>
                                  {isSelected && <FiCheck className="text-primary-600" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <FiUsers className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
          <p className="text-sm md:text-base text-gray-600 mb-2">لا يوجد مديرين</p>
          <p className="text-gray-500">
            {searchTerm
              ? 'جرب تغيير معايير البحث' 
              : 'لم يتم تسجيل أي مديرين بعد'}
          </p>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddModal && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40" 
            onClick={() => setShowAddModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">إضافة مدير جديد</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiX className="text-lg" />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAdmin.name}
                    onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
                    className="input-field w-full"
                    placeholder="أدخل اسم المدير"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني *
                  </label>
                  <div className="relative">
                    <FiMail className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={newAdmin.email}
                      onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                      className="input-field w-full pr-10"
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    كلمة المرور *
                  </label>
                  <div className="relative">
                    <FiLock className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newAdmin.password}
                      onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                      className="input-field w-full pr-10"
                      placeholder="6 أحرف على الأقل"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف
                  </label>
                  <div className="relative">
                    <FiPhone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={newAdmin.phone}
                      onChange={(e) => setNewAdmin({ ...newAdmin, phone: e.target.value })}
                      className="input-field w-full pr-10"
                      placeholder="+967777000000"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    نوع الصلاحيات *
                  </label>
                  <select
                    value={newAdmin.permissionType}
                    onChange={(e) => setNewAdmin({ ...newAdmin, permissionType: e.target.value })}
                    className="input-field w-full"
                  >
                    {Object.entries(PERMISSION_TYPES).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {PERMISSION_TYPES[newAdmin.permissionType]?.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 btn-secondary"
                    disabled={creating}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-primary"
                    disabled={creating}
                  >
                    {creating ? (
                      <>
                        <FiLoader className="animate-spin ml-2" />
                        جاري الإنشاء...
                      </>
                    ) : (
                      <>
                        <FiPlus className="ml-2" />
                        إنشاء حساب
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

