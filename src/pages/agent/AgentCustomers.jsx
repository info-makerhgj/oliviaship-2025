import { useEffect, useState } from 'react';
import { agentAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, formatDate } from '../../utils/helpers';
import {
  FiUsers,
  FiLoader,
  FiSearch,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiMapPin,
  FiPhone,
  FiMail,
  FiX,
  FiSave,
  FiPackage,
  FiDollarSign,
  FiCalendar,
} from 'react-icons/fi';

export default function AgentCustomers() {
  const { success: showSuccess, error: showError } = useToast();
  const [agent, setAgent] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: {
      street: '',
      city: '',
      governorate: '',
      postalCode: '',
      country: 'Yemen',
      coordinates: {
        latitude: '',
        longitude: '',
      },
      mapLink: '',
      notes: '',
    },
    notes: '',
  });

  useEffect(() => {
    loadAgentAndCustomers();
  }, [pagination.page, searchTerm]);

  const loadAgentAndCustomers = async () => {
    try {
      setLoading(true);
      const agentRes = await agentAPI.getMyAgent();
      if (agentRes?.data?.agent) {
        setAgent(agentRes.data.agent);
        const agentId = agentRes.data.agent._id;

        const params = {
          page: pagination.page,
          limit: 20,
          ...(searchTerm && { search: searchTerm }),
        };

        const customersRes = await agentAPI.getCustomers(agentId, params);
        setCustomers(customersRes.data.customers || []);
        setPagination(customersRes.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('Failed to load data', error);
      showError(error.response?.data?.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      showError('يجب إدخال الاسم ورقم الهاتف');
      return;
    }

    setCreating(true);
    try {
      await agentAPI.createCustomer(agent._id, formData);
      showSuccess('✅ تم إضافة العميل بنجاح');
      setShowCreateModal(false);
      resetForm();
      loadAgentAndCustomers();
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في إضافة العميل');
    } finally {
      setCreating(false);
    }
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.phone) {
      showError('يجب إدخال الاسم ورقم الهاتف');
      return;
    }

    setEditing(true);
    try {
      await agentAPI.updateCustomer(agent._id, selectedCustomer._id, formData);
      showSuccess('✅ تم تحديث بيانات العميل بنجاح');
      setShowEditModal(false);
      setSelectedCustomer(null);
      resetForm();
      loadAgentAndCustomers();
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في تحديث بيانات العميل');
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا العميل؟')) {
      return;
    }

    try {
      await agentAPI.deleteCustomer(agent._id, customerId);
      showSuccess('✅ تم حذف العميل بنجاح');
      loadAgentAndCustomers();
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في حذف العميل');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: {
        street: '',
        city: '',
        governorate: '',
        postalCode: '',
        country: 'Yemen',
        coordinates: {
          latitude: '',
          longitude: '',
        },
        mapLink: '',
        notes: '',
      },
      notes: '',
    });
  };

  const openEditModal = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      address: {
        street: customer.address?.street || '',
        city: customer.address?.city || '',
        governorate: customer.address?.governorate || '',
        postalCode: customer.address?.postalCode || '',
        country: customer.address?.country || 'Yemen',
        coordinates: {
          latitude: customer.address?.coordinates?.latitude || '',
          longitude: customer.address?.coordinates?.longitude || '',
        },
        mapLink: customer.address?.mapLink || '',
        notes: customer.address?.notes || '',
      },
      notes: customer.notes || '',
    });
    setShowEditModal(true);
  };

  if (loading && !agent) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="card text-center py-12">
        <FiUsers className="text-4xl text-gray-300 mx-auto mb-4" />
        <p className="text-lg text-gray-600 mb-4">أنت لست وكيلاً</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-gradient">إدارة العملاء</h1>
          <p className="text-sm sm:text-base text-gray-600">إدارة عملائك وإضافة عملاء جدد</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="btn-primary flex items-center gap-2 text-sm sm:text-base py-2 px-3 sm:py-2.5 sm:px-4"
        >
          <FiPlus className="text-sm" />
          إضافة عميل جديد
        </button>
      </div>

      {/* Search */}
      <div className="card mb-4 md:mb-6 p-3 sm:p-4">
        <div className="relative">
          <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="بحث عن عميل..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="input-field w-full pr-10"
          />
        </div>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
        </div>
      ) : customers.length === 0 ? (
        <div className="card text-center py-12">
          <FiUsers className="text-4xl text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-2">لا يوجد عملاء</p>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn-primary mt-4"
          >
            إضافة عميل جديد
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="card hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 font-semibold">الاسم</th>
                  <th className="text-right py-3 px-4 font-semibold">الهاتف</th>
                  <th className="text-right py-3 px-4 font-semibold">البريد</th>
                  <th className="text-right py-3 px-4 font-semibold">العنوان</th>
                  <th className="text-right py-3 px-4 font-semibold">الطلبات</th>
                  <th className="text-right py-3 px-4 font-semibold">إجمالي المبلغ</th>
                  <th className="text-right py-3 px-4 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <p className="font-semibold">{customer.name}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <FiPhone className="text-gray-400" />
                        <span>{customer.phone}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {customer.email ? (
                        <div className="flex items-center gap-2">
                          <FiMail className="text-gray-400" />
                          <span className="text-sm">{customer.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {customer.address?.city ? (
                        <div className="flex items-center gap-2">
                          <FiMapPin className="text-gray-400" />
                          <span className="text-sm">
                            {customer.address.city}, {customer.address.governorate}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">{customer.stats?.totalOrders || 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-green-600">
                        {formatCurrency(customer.stats?.totalSpent || 0, 'SAR')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(customer)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                          title="تعديل"
                        >
                          <FiEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title="حذف"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-2">
            {customers.map((customer) => (
              <div key={customer._id} className="card p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm mb-1 truncate">{customer.name}</p>
                    <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-0.5">
                      <FiPhone className="flex-shrink-0" />
                      <span className="truncate">{customer.phone}</span>
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 mb-0.5">
                        <FiMail className="flex-shrink-0" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    {customer.address?.city && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <FiMapPin className="flex-shrink-0" />
                        <span className="truncate">{customer.address.city}, {customer.address.governorate}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2 pt-2 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">الطلبات</p>
                    <p className="font-semibold text-sm">{customer.stats?.totalOrders || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">إجمالي المبلغ</p>
                    <p className="font-semibold text-sm text-green-600">
                      {formatCurrency(customer.stats?.totalSpent || 0, 'SAR')}
                    </p>
                  </div>
                </div>

                <div className="flex gap-1.5 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => openEditModal(customer)}
                    className="flex-1 btn-secondary py-1.5 text-xs flex items-center justify-center gap-1"
                  >
                    <FiEdit className="text-xs" />
                    تعديل
                  </button>
                  <button
                    onClick={() => handleDeleteCustomer(customer._id)}
                    className="flex-1 bg-red-100 text-red-700 hover:bg-red-200 py-1.5 text-xs rounded flex items-center justify-center gap-1"
                  >
                    <FiTrash2 className="text-xs" />
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                السابق
              </button>
              <span className="text-sm text-gray-600">
                صفحة {pagination.page} من {pagination.pages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.pages}
                className="btn-secondary disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Customer Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">إضافة عميل جديد</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="input-field w-full"
                    placeholder="اسم العميل"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="input-field w-full"
                    placeholder="7xxxxxxxx"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field w-full"
                    placeholder="example@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المدينة</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
                  <input
                    type="text"
                    value={formData.address.governorate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, governorate: e.target.value },
                      })
                    }
                    className="input-field w-full"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">الشارع</label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value },
                      })
                    }
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رمز بريدي</label>
                  <input
                    type="text"
                    value={formData.address.postalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, postalCode: e.target.value },
                      })
                    }
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رابط خرائط Google</label>
                  <input
                    type="text"
                    value={formData.address.mapLink}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, mapLink: e.target.value },
                      })
                    }
                    className="input-field w-full"
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="input-field w-full"
                    placeholder="ملاحظات عن العميل..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiSave />
                  {creating ? 'جاري الإضافة...' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">تعديل بيانات العميل</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedCustomer(null);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleEditCustomer} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الاسم الكامل *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    رقم الهاتف *
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    className="input-field w-full"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المدينة</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, city: e.target.value },
                      })
                    }
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">المحافظة</label>
                  <input
                    type="text"
                    value={formData.address.governorate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, governorate: e.target.value },
                      })
                    }
                    className="input-field w-full"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">الشارع</label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, street: e.target.value },
                      })
                    }
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رمز بريدي</label>
                  <input
                    type="text"
                    value={formData.address.postalCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, postalCode: e.target.value },
                      })
                    }
                    className="input-field w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رابط خرائط Google</label>
                  <input
                    type="text"
                    value={formData.address.mapLink}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        address: { ...formData.address, mapLink: e.target.value },
                      })
                    }
                    className="input-field w-full"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={editing}
                  className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiSave />
                  {editing ? 'جاري التحديث...' : 'حفظ التغييرات'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedCustomer(null);
                    resetForm();
                  }}
                  className="flex-1 btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

