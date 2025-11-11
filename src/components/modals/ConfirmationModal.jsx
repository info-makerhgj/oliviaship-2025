import { FiAlertCircle, FiCheckCircle, FiX } from 'react-icons/fi';

export default function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = 'تأكيد العملية',
  message,
  confirmText = 'موافق',
  cancelText = 'إلغاء',
  type = 'warning', // 'warning', 'danger', 'info', 'success'
  loading = false
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <FiX className="text-red-600 text-2xl" />;
      case 'success':
        return <FiCheckCircle className="text-green-600 text-2xl" />;
      case 'info':
        return <FiAlertCircle className="text-blue-600 text-2xl" />;
      default:
        return <FiAlertCircle className="text-yellow-600 text-2xl" />;
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-600 hover:bg-red-700';
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'info':
        return 'bg-blue-600 hover:bg-blue-400';
      default:
        return 'bg-primary-600 hover:bg-primary-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full transform transition-all">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className={`flex-shrink-0 ${
              type === 'danger' ? 'text-red-600' :
              type === 'success' ? 'text-green-600' :
              type === 'info' ? 'text-blue-600' :
              'text-yellow-600'
            }`}>
              {getIcon()}
            </div>
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

          {/* Message */}
          <div className="mb-6">
            <p className="text-sm md:text-base text-gray-700 whitespace-pre-line">
              {message}
            </p>
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
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm md:text-base text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 ${getButtonColor()}`}
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


