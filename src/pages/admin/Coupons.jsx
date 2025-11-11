import { useEffect, useState } from 'react';
import { couponAPI, settingsAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { formatDate, formatCurrency } from '../../utils/helpers';
import { 
  FiTag, 
  FiLoader, 
  FiSearch,
  FiFilter,
  FiEdit,
  FiTrash2,
  FiPower,
  FiPlus,
  FiX,
  FiCheck,
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiPercent,
  FiShoppingBag,
  FiEye,
  FiCopy
} from 'react-icons/fi';

export default function AdminCoupons() {
  const { error: showError, success: showSuccess } = useToast();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredCoupons, setFilteredCoupons] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '',
    maxDiscountAmount: '',
    applicableStores: [],
    validFrom: '',
    validUntil: '',
    usageLimit: '',
    usageLimitPerUser: '1',
    priority: '0',
    isActive: true,
  });

  const [storeOptions, setStoreOptions] = useState([
    { value: 'amazon', label: 'Amazon' },
    { value: 'noon', label: 'Noon' },
    { value: 'shein', label: 'Shein' },
    { value: 'aliexpress', label: 'AliExpress' },
    { value: 'temu', label: 'Temu' },
    { value: 'iherb', label: 'iHerb' },
    { value: 'niceonesa', label: 'Nice One' },
    { value: 'namshi', label: 'Namshi' },
    { value: 'trendyol', label: 'Trendyol' },
    { value: 'other', label: 'متاجر أخرى' },
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCoupons();
    loadStoreOptions();
  }, []);

  const loadStoreOptions = async () => {
    try {
      const res = await settingsAPI.get();
      const settings = res.data.settings;
      
      // Default stores
      const defaultStores = [
        { value: 'amazon', label: 'Amazon' },
        { value: 'noon', label: 'Noon' },
        { value: 'shein', label: 'Shein' },
        { value: 'aliexpress', label: 'AliExpress' },
        { value: 'temu', label: 'Temu' },
        { value: 'iherb', label: 'iHerb' },
        { value: 'niceonesa', label: 'Nice One' },
        { value: 'namshi', label: 'Namshi' },
        { value: 'trendyol', label: 'Trendyol' },
        { value: 'other', label: 'متاجر أخرى' },
      ];
      
      if (settings?.localStores && Array.isArray(settings.localStores)) {
        // Extract enabled local stores - use domain as identifier
        const localStores = settings.localStores
          .filter(store => store.enabled && store.name && store.domain)
          .map(store => {
            // Extract domain from URL if needed
            let domain = store.domain;
            if (domain.startsWith('http://') || domain.startsWith('https://')) {
              try {
                const url = new URL(domain);
                domain = url.hostname;
              } catch (e) {
                domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
              }
            } else {
              domain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
            }
            
            return {
              value: domain.toLowerCase(), // Use domain as identifier
              label: store.name,
              isLocal: true,
              domain: domain,
            };
          });
        
        // Combine with default stores
        setStoreOptions([...defaultStores, ...localStores]);
      } else {
        // No local stores, just use defaults
        setStoreOptions(defaultStores);
      }
    } catch (error) {
      console.error('Failed to load store options:', error);
      // Keep default stores if error
    }
  };

  useEffect(() => {
    filterCoupons();
  }, [coupons, statusFilter, searchTerm]);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const res = await couponAPI.getAll();
      setCoupons(res.data.coupons || []);
    } catch (error) {
      console.error('Failed to load coupons', error);
      showError('فشل في تحميل الكوبونات');
    } finally {
      setLoading(false);
    }
  };

  const filterCoupons = () => {
    let filtered = [...coupons];

    if (statusFilter !== 'all') {
      const now = new Date();
      if (statusFilter === 'active') {
        filtered = filtered.filter(c => 
          c.isActive && new Date(c.validUntil) >= now && (!c.validFrom || new Date(c.validFrom) <= now)
        );
      } else if (statusFilter === 'inactive') {
        filtered = filtered.filter(c => !c.isActive);
      } else if (statusFilter === 'expired') {
        filtered = filtered.filter(c => new Date(c.validUntil) < now);
      }
    }

    if (searchTerm) {
      filtered = filtered.filter(c => 
        c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.description && c.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredCoupons(filtered);
  };

  const handleAdd = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: '',
      maxDiscountAmount: '',
      applicableStores: [],
      validFrom: '',
      validUntil: '',
      usageLimit: '',
      usageLimitPerUser: '1',
      priority: '0',
      isActive: true,
    });
    setShowAddModal(true);
  };

  const handleEdit = (coupon) => {
    setSelectedCoupon(coupon);
    setFormData({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || '',
      maxDiscountAmount: coupon.maxDiscountAmount || '',
      applicableStores: Array.isArray(coupon.applicableStores) ? coupon.applicableStores : [],
      validFrom: coupon.validFrom ? new Date(coupon.validFrom).toISOString().split('T')[0] : '',
      validUntil: coupon.validUntil ? new Date(coupon.validUntil).toISOString().split('T')[0] : '',
      usageLimit: coupon.usageLimit || '',
      usageLimitPerUser: coupon.usageLimitPerUser || '1',
      priority: coupon.priority || '0',
      isActive: coupon.isActive,
    });
    setShowEditModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        ...formData,
        discountValue: parseFloat(formData.discountValue),
        minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0,
        maxDiscountAmount: formData.maxDiscountAmount ? parseFloat(formData.maxDiscountAmount) : null,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
        usageLimitPerUser: parseInt(formData.usageLimitPerUser) || 1,
        priority: parseInt(formData.priority) || 0,
        validFrom: formData.validFrom ? new Date(formData.validFrom).toISOString() : new Date().toISOString(),
        validUntil: new Date(formData.validUntil).toISOString(),
      };

      if (showAddModal) {
        await couponAPI.create(data);
        showSuccess('تم إنشاء الكوبون بنجاح');
      } else {
        await couponAPI.update(selectedCoupon._id, data);
        showSuccess('تم تحديث الكوبون بنجاح');
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setSelectedCoupon(null);
      loadCoupons();
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في حفظ الكوبون');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`هل أنت متأكد من حذف الكوبون "${coupon.code}"؟`)) return;

    setDeleting(coupon._id);
    try {
      await couponAPI.delete(coupon._id);
      showSuccess('تم حذف الكوبون بنجاح');
      loadCoupons();
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في حذف الكوبون');
    } finally {
      setDeleting(null);
    }
  };

  const handleToggleStatus = async (coupon) => {
    setToggling(coupon._id);
    try {
      await couponAPI.toggleStatus(coupon._id);
      showSuccess(`تم ${coupon.isActive ? 'تعطيل' : 'تفعيل'} الكوبون بنجاح`);
      loadCoupons();
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في تغيير حالة الكوبون');
    } finally {
      setToggling(null);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    showSuccess('تم نسخ الكود');
  };

  const getStatusBadge = (coupon) => {
    const now = new Date();
    if (!coupon.isActive) {
      return <span className="badge bg-gray-100 text-gray-800">غير نشط</span>;
    }
    if (new Date(coupon.validUntil) < now) {
      return <span className="badge bg-red-100 text-red-800">منتهي</span>;
    }
    if (coupon.validFrom && new Date(coupon.validFrom) > now) {
      return <span className="badge bg-yellow-100 text-yellow-800">قادم</span>;
    }
    return <span className="badge bg-green-100 text-green-800">نشط</span>;
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
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold mb-2 text-gradient">إدارة الكوبونات</h1>
          <p className="text-gray-600 text-sm">إنشاء وإدارة كوبونات الخصم</p>
        </div>
        <button
          onClick={handleAdd}
          className="btn-primary flex items-center gap-2"
        >
          <FiPlus className="text-lg" />
          إضافة كوبون جديد
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-primary-700 font-medium mb-1">إجمالي الكوبونات</p>
              <p className="text-xl font-bold text-primary-900">{coupons.length}</p>
            </div>
            <div className="bg-primary-200 p-3 rounded-xl">
              <FiTag className="text-lg md:text-xl text-primary-700" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 font-medium mb-1">الكوبونات النشطة</p>
              <p className="text-xl font-bold text-green-900">
                {coupons.filter(c => {
                  const now = new Date();
                  return c.isActive && new Date(c.validUntil) >= now && (!c.validFrom || new Date(c.validFrom) <= now);
                }).length}
              </p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <FiCheck className="text-lg md:text-xl text-green-700" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium mb-1">إجمالي الاستخدامات</p>
              <p className="text-xl font-bold text-blue-900">
                {coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0)}
              </p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <FiUsers className="text-lg md:text-xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-400 font-medium mb-1">إجمالي الخصومات</p>
              <p className="text-xl font-bold text-purple-900">
                {formatCurrency(coupons.reduce((sum, c) => sum + (c.stats?.totalDiscountGiven || 0), 0), 'SAR')}
              </p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <FiDollarSign className="text-lg md:text-xl text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="البحث عن كوبون..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pr-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
            <option value="expired">منتهي</option>
          </select>
        </div>
      </div>

      {/* Coupons List */}
      <div className="card">
        {filteredCoupons.length === 0 ? (
          <div className="text-center py-12">
            <FiTag className="mx-auto text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600">لا توجد كوبونات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-right py-3 px-4 font-semibold">الكود</th>
                  <th className="text-right py-3 px-4 font-semibold">الاسم</th>
                  <th className="text-right py-3 px-4 font-semibold">نوع الخصم</th>
                  <th className="text-right py-3 px-4 font-semibold">القيمة</th>
                  <th className="text-right py-3 px-4 font-semibold">الاستخدامات</th>
                  <th className="text-right py-3 px-4 font-semibold">الحالة</th>
                  <th className="text-right py-3 px-4 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoupons.map((coupon) => (
                  <tr key={coupon._id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="text-gray-400 hover:text-primary-600"
                          title="نسخ الكود"
                        >
                          <FiCopy className="text-sm" />
                        </button>
                      </div>
                      {coupon.applicableStores && coupon.applicableStores.length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {coupon.applicableStores.slice(0, 3).map((store) => {
                            const storeName = storeOptions.find(s => s.value === store)?.label || store;
                            return (
                              <span
                                key={store}
                                className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded"
                              >
                                {storeName}
                              </span>
                            );
                          })}
                          {coupon.applicableStores.length > 3 && (
                            <span className="text-xs text-gray-500">
                              +{coupon.applicableStores.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{coupon.name}</p>
                        {coupon.description && (
                          <p className="text-sm text-gray-500">{coupon.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge bg-blue-100 text-blue-700">
                        {coupon.discountType === 'percentage' ? (
                          <><FiPercent className="inline text-xs" /> نسبة</>
                        ) : (
                          <><FiDollarSign className="inline text-xs" /> مبلغ ثابت</>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-green-600">
                        {coupon.discountType === 'percentage' 
                          ? `${coupon.discountValue}%`
                          : formatCurrency(coupon.discountValue, 'SAR')
                        }
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-sm">
                        <p>{coupon.usedCount || 0} / {coupon.usageLimit || '∞'}</p>
                        {coupon.usageLimitPerUser && (
                          <p className="text-gray-500 text-xs">
                            {coupon.usageLimitPerUser} لكل مستخدم
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(coupon)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="text-blue-600 hover:text-blue-700"
                          title="تعديل"
                        >
                          <FiEdit className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(coupon)}
                          disabled={toggling === coupon._id}
                          className={`${coupon.isActive ? 'text-yellow-600 hover:text-yellow-800' : 'text-green-600 hover:text-green-800'}`}
                          title={coupon.isActive ? 'تعطيل' : 'تفعيل'}
                        >
                          {toggling === coupon._id ? (
                            <FiLoader className="text-lg animate-spin" />
                          ) : (
                            <FiPower className="text-lg" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(coupon)}
                          disabled={deleting === coupon._id}
                          className="text-red-600 hover:text-red-800"
                          title="حذف"
                        >
                          {deleting === coupon._id ? (
                            <FiLoader className="text-lg animate-spin" />
                          ) : (
                            <FiTrash2 className="text-lg" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-secondary-500 text-white border-b p-4 flex items-center justify-between rounded-t-lg">
              <h2 className="text-lg font-bold">
                {showAddModal ? 'إضافة كوبون جديد' : 'تعديل الكوبون'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  setSelectedCoupon(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    كود الكوبون <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="مثال: SUMMER2024"
                  />
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    اسم الكوبون <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="مثال: خصم الصيف"
                  />
                </div>

                <div className="md:col-span-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الوصف</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                    rows="3"
                    placeholder="وصف الكوبون..."
                  />
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    نوع الخصم <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت</option>
                  </select>
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    قيمة الخصم <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder={formData.discountType === 'percentage' ? 'مثال: 20' : 'مثال: 50'}
                  />
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الحد الأدنى للطلب</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="0"
                  />
                </div>

                {formData.discountType === 'percentage' && (
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">الحد الأقصى للخصم</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.maxDiscountAmount}
                      onChange={(e) => setFormData({ ...formData, maxDiscountAmount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                      placeholder="لا يوجد حد"
                    />
                  </div>
                )}

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">تاريخ البداية</label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    تاريخ الانتهاء <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">حد الاستخدام</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="لا يوجد حد"
                  />
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">حد الاستخدام لكل مستخدم</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.usageLimitPerUser}
                    onChange={(e) => setFormData({ ...formData, usageLimitPerUser: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>

                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الأولوية</label>
                  <input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    placeholder="0"
                  />
                  <p className="text-xs text-gray-500 mt-2">كلما زادت القيمة، زادت الأولوية</p>
                </div>

                <div className="md:col-span-2 bg-white p-4 rounded-lg border border-gray-200">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    المتاجر المطبقة عليها الكوبون
                  </label>
                  <p className="text-xs text-gray-500 mb-3">
                    اختر المتاجر التي يطبق عليها هذا الكوبون. إذا لم تختر أي متجر، سيُطبق على جميع المتاجر.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {storeOptions.map((store) => (
                      <label
                        key={store.value}
                        className="flex items-center gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={formData.applicableStores.includes(store.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                applicableStores: [...formData.applicableStores, store.value],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                applicableStores: formData.applicableStores.filter(
                                  s => s !== store.value
                                ),
                              });
                            }
                          }}
                          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm text-gray-700">{store.label}</span>
                      </label>
                    ))}
                  </div>
                  {formData.applicableStores.length > 0 && (
                    <p className="text-xs text-green-600 mt-2">
                      ✓ سيُطبق الكوبون على {formData.applicableStores.length} متجر محدد
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 mt-4 border-t border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer bg-white p-3 rounded-lg border border-gray-200 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm font-medium text-gray-700">نشط</span>
                </label>
              </div>

              <div className="flex gap-4 pt-6 mt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1"
                >
                  {submitting ? (
                    <>
                      <FiLoader className="animate-spin mr-2" />
                      جاري الحفظ...
                    </>
                  ) : (
                    'حفظ'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setSelectedCoupon(null);
                  }}
                  className="btn-secondary"
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

