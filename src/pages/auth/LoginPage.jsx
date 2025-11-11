import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../utils/api';
import { useAuthStore } from '../../store/authStore';
import { useToast } from '../../contexts/ToastContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const { error: showError } = useToast();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await authAPI.login(formData);
      login(res.data.user, res.data.token);
      
      // Redirect based on role
      if (res.data.user.role === 'admin') {
        navigate('/admin');
      } else if (res.data.user.role === 'agent') {
        navigate('/agent');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      showError(error.response?.data?.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full">
        <div className="card">
          <h2 className="text-xl font-bold text-center mb-4">تسجيل الدخول</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">البريد الإلكتروني</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <div>
              <label className="block mb-2">كلمة المرور</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input-field"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
          <p className="text-center mt-4 text-gray-600">
            ليس لديك حساب؟ <Link to="/register" className="text-primary-600 hover:underline">إنشاء حساب</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
