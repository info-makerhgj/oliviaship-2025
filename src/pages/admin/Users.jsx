import { useEffect, useState } from 'react';
import { userAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/helpers';
import { 
  FiUsers, 
  FiLoader, 
  FiSearch,
  FiFilter,
  FiEdit,
  FiPower,
  FiUserCheck,
  FiUserX,
  FiMail,
  FiCalendar,
  FiPackage,
  FiCheckCircle,
  FiXCircle,
  FiMoreVertical
} from 'react-icons/fi';

const roleLabels = {
  admin: 'مدير',
  customer: 'عميل',
};

const roleColors = {
  admin: 'bg-purple-100 text-purple-700',
  customer: 'bg-blue-100 text-blue-700',
};

export default function AdminUsers() {
  const { error: showError, success: showSuccess } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [togglingStatus, setTogglingStatus] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, roleFilter, statusFilter, searchTerm]);

  const loadUsers = async () => {
    try {
      const res = await userAPI.getAll();
      setUsers(res.data.users || []);
    } catch (error) {
      console.error('Failed to load users', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        if (statusFilter === 'active') return user.isActive === true;
        if (statusFilter === 'inactive') return user.isActive === false;
        return true;
      });
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(search) ||
        user.email?.toLowerCase().includes(search) ||
        user.phone?.toLowerCase().includes(search)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleToggleStatus = async (userId) => {
    setTogglingStatus(userId);
    try {
      await userAPI.toggleStatus(userId);
      await loadUsers();
      setActionMenu(null);
      showSuccess('✅ تم تحديث الحالة بنجاح');
    } catch (error) {
      console.error('Failed to toggle status', error);
      showError(error.response?.data?.message || 'فشل في تغيير الحالة');
    } finally {
      setTogglingStatus(null);
    }
  };

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
        <h1 className="text-xl font-bold mb-2 text-gradient">إدارة المستخدمين</h1>
        <p className="text-gray-600 text-sm">عرض وإدارة جميع المستخدمين المسجلين</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium mb-1">إجمالي المستخدمين</p>
              <p className="text-xl font-bold text-blue-900">{users.length}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <FiUsers className="text-lg md:text-xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 font-medium mb-1">المستخدمون النشطون</p>
              <p className="text-xl font-bold text-green-900">
                {users.filter(u => u.isActive).length}
              </p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <FiUserCheck className="text-lg md:text-xl text-green-700" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-400 font-medium mb-1">المديرون</p>
              <p className="text-xl font-bold text-purple-900">
                {users.filter(u => u.role === 'admin').length}
              </p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <FiUsers className="text-lg md:text-xl text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-700 font-medium mb-1">العملاء</p>
              <p className="text-xl font-bold text-orange-900">
                {users.filter(u => u.role === 'customer').length}
              </p>
            </div>
            <div className="bg-orange-200 p-3 rounded-xl">
              <FiUsers className="text-lg md:text-xl text-orange-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث بالاسم أو البريد الإلكتروني..."
              className="input-field pr-12 w-full"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <FiFilter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="input-field pr-12 w-full appearance-none cursor-pointer"
            >
              <option value="all">جميع الأدوار</option>
              <option value="admin">مدير</option>
              <option value="customer">عميل</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FiFilter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pr-12 w-full appearance-none cursor-pointer"
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">معطل</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Count */}
      <div className="mb-4">
        <p className="text-gray-600">
          إجمالي المستخدمين: <span className="font-bold text-primary-600">{filteredUsers.length}</span>
        </p>
      </div>

      {/* Users List */}
      {filteredUsers.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-4 px-4 font-bold text-gray-700">المستخدم</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">الدور</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">الحالة</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">تاريخ التسجيل</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">الطلبات</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-bold text-lg">
                            {user.name?.charAt(0)?.toUpperCase() || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.name || 'غير محدد'}</p>
                          <p className="text-sm text-gray-500 flex items-center gap-1">
                            <FiMail className="text-xs" />
                            {user.email}
                          </p>
                          {user.phone && (
                            <p className="text-xs text-gray-400">{user.phone}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-lg text-sm font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1 w-fit ${
                        user.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.isActive ? (
                          <>
                            <FiCheckCircle className="text-xs" />
                            نشط
                          </>
                        ) : (
                          <>
                            <FiXCircle className="text-xs" />
                            معطل
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <FiCalendar className="text-sm" />
                        <span className="text-sm">{formatDate(user.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <FiPackage className="text-sm" />
                        <span className="font-semibold">{user.stats?.totalOrders || 0}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="relative">
                        <button
                          onClick={() => setActionMenu(actionMenu === user._id ? null : user._id)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <FiMoreVertical />
                        </button>
                        {actionMenu === user._id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={() => setActionMenu(null)}
                            />
                            <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                              <button
                                onClick={() => handleToggleStatus(user._id)}
                                disabled={togglingStatus === user._id}
                                className={`w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                                  user.isActive ? 'text-red-600' : 'text-green-600'
                                }`}
                              >
                                {togglingStatus === user._id ? (
                                  <>
                                    <FiLoader className="animate-spin ml-auto" />
                                    <span>جاري التحديث...</span>
                                  </>
                                ) : user.isActive ? (
                                  <>
                                    <FiUserX className="ml-auto" />
                                    <span>تعطيل المستخدم</span>
                                  </>
                                ) : (
                                  <>
                                    <FiUserCheck className="ml-auto" />
                                    <span>تفعيل المستخدم</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredUsers.map((user) => (
              <div key={user._id} className="card">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-600 font-bold text-xl">
                        {user.name?.charAt(0)?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-lg">{user.name || 'غير محدد'}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <FiMail className="text-xs" />
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="relative">
                    <button
                      onClick={() => setActionMenu(actionMenu === user._id ? null : user._id)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <FiMoreVertical />
                    </button>
                    {actionMenu === user._id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setActionMenu(null)}
                        />
                        <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                          <button
                            onClick={() => handleToggleStatus(user._id)}
                            disabled={togglingStatus === user._id}
                            className={`w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                              user.isActive ? 'text-red-600' : 'text-green-600'
                            }`}
                          >
                            {togglingStatus === user._id ? (
                              <>
                                <FiLoader className="animate-spin ml-auto" />
                                <span>جاري التحديث...</span>
                              </>
                            ) : user.isActive ? (
                              <>
                                <FiUserX className="ml-auto" />
                                <span>تعطيل المستخدم</span>
                              </>
                            ) : (
                              <>
                                <FiUserCheck className="ml-auto" />
                                <span>تفعيل المستخدم</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">الدور</p>
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
                      {roleLabels[user.role] || user.role}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">الحالة</p>
                    <span className={`px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-1 ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? (
                        <>
                          <FiCheckCircle className="text-xs" />
                          نشط
                        </>
                      ) : (
                        <>
                          <FiXCircle className="text-xs" />
                          معطل
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {user.phone && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">الهاتف</p>
                    <p className="font-medium">{user.phone}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-1 text-gray-600">
                    <FiCalendar className="text-sm" />
                    <span className="text-sm">{formatDate(user.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600">
                    <FiPackage className="text-sm" />
                    <span className="font-semibold">{user.stats?.totalOrders || 0} طلب</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="card text-center py-16">
          <FiUsers className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
          <p className="text-sm md:text-base text-gray-600 mb-2">لا يوجد مستخدمين</p>
          <p className="text-gray-500">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'جرب تغيير معايير البحث' 
              : 'لم يتم تسجيل أي مستخدمين بعد'}
          </p>
        </div>
      )}
    </div>
  );
}
