import { FiX, FiUser, FiDollarSign } from 'react-icons/fi';
import { useState, useEffect } from 'react';

export default function PromptModal({
  isOpen,
  onClose,
  onSubmit,
  title = 'إدخال البيانات',
  label,
  placeholder = '',
  type = 'text', // 'text', 'email', 'tel', 'number'
  confirmText = 'موافق',
  cancelText = 'إلغاء',
  defaultValue = '',
  required = true,
  loading = false
}) {
  const [value, setValue] = useState(defaultValue);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError('');
    }
  }, [isOpen, defaultValue]);

  const handleSubmit = () => {
    if (required && !value.trim()) {
      setError('هذا الحقل مطلوب');
      return;
    }

    if (type === 'email' && value.trim() && !value.includes('@')) {
      setError('يرجى إدخال بريد إلكتروني صحيح');
      return;
    }

    if (type === 'number' && value.trim() && isNaN(parseFloat(value))) {
      setError('يرجى إدخال رقم صحيح');
      return;
    }

    onSubmit(value.trim());
  };

  if (!isOpen) return null;

  const getIcon = () => {
    if (type === 'email' || type === 'tel') return <FiUser className="text-primary-600 text-xl" />;
    if (type === 'number') return <FiDollarSign className="text-primary-600 text-xl" />;
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            {getIcon() && (
              <div className="flex-shrink-0">
                {getIcon()}
              </div>
            )}
            <h3 className="text-base md:text-lg font-bold text-gray-900 flex-1">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            >
              <FiX className="text-xl" />
            </button>
          </div>

          {/* Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {label}
            </label>
            <input
              type={type}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError('');
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit();
                }
              }}
              placeholder={placeholder}
              className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                error ? 'border-red-300' : 'border-gray-300'
              }`}
              autoFocus
            />
            {error && (
              <p className="mt-1 text-xs text-red-600">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm md:text-base border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (required && !value.trim())}
              className="btn-primary px-4 py-2 text-sm md:text-base disabled:opacity-50 flex items-center gap-2"
            >
              {loading && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


