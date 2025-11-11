import { useState, useEffect } from 'react';
import { authAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../contexts/ToastContext';
import { FiUser, FiMail, FiPhone, FiMapPin, FiSave, FiLoader } from 'react-icons/fi';

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const { error: showError, success: showSuccess } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      governorate: '',
      postalCode: '',
    },
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || {
          street: '',
          city: '',
          governorate: '',
          postalCode: '',
        },
      });
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authAPI.updateProfile(formData);
      updateUser(res.data.user);
      showSuccess('✅ تم تحديث الملف الشخصي بنجاح!');
    } catch (error) {
      showError(error.response?.data?.message || 'فشل تحديث الملف الشخصي');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <h1 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-gradient">الملف الشخصي</h1>
        <p className="text-gray-600 text-xs sm:text-sm">إدارة معلوماتك الشخصية والعنوان</p>
      </div>

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="card p-4 sm:p-5 md:p-6">
          {/* Personal Information */}
          <div className="mb-5 sm:mb-6 md:mb-8">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
              <div className="bg-primary-100 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl">
                <FiUser className="text-primary-600 text-base sm:text-lg md:text-xl" />
              </div>
              <h2 className="text-base sm:text-lg font-bold">المعلومات الشخصية</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              <div>
                <label className="block mb-1.5 sm:mb-2 text-sm sm:text-base font-medium">الاسم الكامل</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field text-sm sm:text-base py-2 sm:py-2.5"
                  required
                />
              </div>
              <div>
                <label className="block mb-1.5 sm:mb-2 text-sm sm:text-base font-medium">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={formData.email}
                  className="input-field bg-gray-50 text-sm sm:text-base py-2 sm:py-2.5"
                  disabled
                />
                <p className="text-xs text-gray-500 mt-1">لا يمكن تغيير البريد الإلكتروني</p>
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1.5 sm:mb-2 text-sm sm:text-base font-medium">رقم الهاتف</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field text-sm sm:text-base py-2 sm:py-2.5"
                  placeholder="+967 777 000 000"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div>
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 md:mb-6">
              <div className="bg-blue-100 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl">
                <FiMapPin className="text-blue-600 text-base sm:text-lg md:text-xl" />
              </div>
              <h2 className="text-base sm:text-lg font-bold">العنوان</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6">
              <div className="md:col-span-2">
                <label className="block mb-1.5 sm:mb-2 text-sm sm:text-base font-medium">اسم الشارع</label>
                <input
                  type="text"
                  value={formData.address.street}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, street: e.target.value },
                    })
                  }
                  className="input-field text-sm sm:text-base py-2 sm:py-2.5"
                  placeholder="شارع الزبيري"
                />
              </div>
              <div>
                <label className="block mb-1.5 sm:mb-2 text-sm sm:text-base font-medium">المدينة</label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, city: e.target.value },
                    })
                  }
                  className="input-field text-sm sm:text-base py-2 sm:py-2.5"
                  placeholder="صنعاء"
                />
              </div>
              <div>
                <label className="block mb-1.5 sm:mb-2 text-sm sm:text-base font-medium">المحافظة</label>
                <input
                  type="text"
                  value={formData.address.governorate}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, governorate: e.target.value },
                    })
                  }
                  className="input-field text-sm sm:text-base py-2 sm:py-2.5"
                  placeholder="أمانة العاصمة"
                />
              </div>
              <div>
                <label className="block mb-1.5 sm:mb-2 text-sm sm:text-base font-medium">الرمز البريدي</label>
                <input
                  type="text"
                  value={formData.address.postalCode}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      address: { ...formData.address, postalCode: e.target.value },
                    })
                  }
                  className="input-field text-sm sm:text-base py-2 sm:py-2.5"
                  placeholder="00000"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-5 sm:mt-6 md:mt-8 pt-4 sm:pt-5 md:pt-6 border-t border-gray-200">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full md:w-auto min-w-[150px] sm:min-w-[200px] flex items-center justify-center gap-2 text-sm sm:text-base py-2 sm:py-2.5 px-4"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin text-sm sm:text-base" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <FiSave className="text-sm sm:text-base" />
                  حفظ التغييرات
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
