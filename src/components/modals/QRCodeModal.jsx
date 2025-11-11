import { FiX, FiDownload, FiCopy } from 'react-icons/fi';
import { useToast } from '../../contexts/ToastContext';

export default function QRCodeModal({ isOpen, onClose, qrUrl, code, amount, currency, codeId }) {
  const { success: showSuccess } = useToast();
  
  if (!isOpen) return null;

  const handleDownload = () => {
    if (!qrUrl) return;
    
    // Create a link to download the QR code
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `QR-${code || codeId || 'code'}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCode = () => {
    if (code) {
      navigator.clipboard.writeText(code);
      showSuccess('✅ تم نسخ الكود!');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FiX className="text-gray-600 text-xl" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">QR Code للكود</h2>
          <p className="text-sm text-gray-600">امسح الكود لاستخدامه</p>
        </div>

        {/* QR Code Display */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
            {qrUrl ? (
              <img 
                src={qrUrl} 
                alt="QR Code" 
                className="w-64 h-64 object-contain"
                onError={(e) => {
                  e.target.src = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(code || '')}`;
                }}
              />
            ) : (
              <div className="w-64 h-64 bg-gray-100 flex items-center justify-center rounded">
                <p className="text-gray-500">جاري تحميل QR Code...</p>
              </div>
            )}
          </div>

          {/* Code Info */}
          <div className="bg-gray-50 rounded-lg p-4 w-full text-center">
            <div className="mb-2">
              <span className="text-xs text-gray-500 block mb-1">الكود</span>
              <div className="flex items-center justify-center gap-2">
                <code className="text-lg font-bold text-primary-600 bg-white px-3 py-1 rounded border border-primary-200">
                  {code || 'غير متوفر'}
                </code>
                {code && (
                  <button
                    onClick={handleCopyCode}
                    className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                    title="نسخ الكود"
                  >
                    <FiCopy className="text-gray-600 text-sm" />
                  </button>
                )}
              </div>
            </div>
            {amount && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-xs text-gray-500 block mb-1">المبلغ</span>
                <p className="text-lg font-bold text-gray-900">
                  {amount} {currency || 'SAR'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <FiDownload />
            تحميل QR Code
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 px-4 rounded-lg transition-colors font-medium"
          >
            إغلاق
          </button>
        </div>

        {/* Instructions */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-600 text-center">
            💡 يمكنك طباعة هذا QR Code أو إرساله للعملاء ليستخدموه في شحن محافظهم
          </p>
        </div>
      </div>
    </div>
  );
}

