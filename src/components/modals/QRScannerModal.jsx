import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FiX, FiCamera, FiAlertCircle } from 'react-icons/fi';
import { useToast } from '../../contexts/ToastContext';

export default function QRScannerModal({ isOpen, onClose, onScanSuccess }) {
  const { error: showError, warning: showWarning } = useToast();
  const scannerRef = useRef(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure modal is fully rendered and DOM is ready
      const timer = setTimeout(() => {
        if (!html5QrCodeRef.current) {
          startScanning();
        }
      }, 300);

      return () => {
        clearTimeout(timer);
        stopScanning();
      };
    } else {
      stopScanning();
    }
  }, [isOpen]);

  const startScanning = async () => {
    try {
      setCameraError('');
      setScanning(true);

      // Check if camera is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('المتصفح لا يدعم الوصول إلى الكاميرا. يرجى استخدام متصفح حديث مثل Chrome أو Firefox.');
      }

      // Check if HTTPS or localhost (required for camera access on mobile)
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.startsWith('192.168.') ||
                       window.location.hostname.startsWith('10.') ||
                       window.location.hostname.startsWith('172.');
      
      if (!isSecure && window.location.hostname !== 'localhost') {
        console.warn('Camera access may require HTTPS on mobile devices');
      }

      // Request camera permission first (test access)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: { ideal: 'environment' }, // Prefer back camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
        // Stop the test stream immediately
        stream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        console.error('Permission error:', permError);
        if (permError.name === 'NotAllowedError' || permError.name === 'PermissionDeniedError') {
          throw new Error('تم رفض الوصول إلى الكاميرا. يرجى السماح بالوصول في إعدادات المتصفح ثم اضغط "إعادة المحاولة".');
        } else if (permError.name === 'NotFoundError' || permError.name === 'DevicesNotFoundError') {
          throw new Error('لم يتم العثور على كاميرا. يرجى التأكد من وجود كاميرا على الجهاز.');
        } else if (permError.name === 'NotReadableError' || permError.name === 'TrackStartError') {
          throw new Error('الكاميرا مستخدمة من قبل تطبيق آخر. يرجى إغلاق التطبيقات الأخرى والمحاولة مرة أخرى.');
        } else if (permError.name === 'OverconstrainedError') {
          throw new Error('الكاميرا لا تدعم الإعدادات المطلوبة. جرب الكاميرا الأمامية أو كاميرا أخرى.');
        } else {
          throw new Error(`فشل في الوصول إلى الكاميرا: ${permError.message || permError.name}. يرجى التحقق من الصلاحيات.`);
        }
      }

      // Initialize Html5Qrcode
      const html5QrCode = new Html5Qrcode('qr-reader');
      html5QrCodeRef.current = html5QrCode;

      // Configuration
      const config = {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          // Make QR box responsive
          const minEdgePercentage = 0.7;
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: qrboxSize,
            height: qrboxSize
          };
        },
        aspectRatio: 1.0,
        disableFlip: false,
        videoConstraints: {
          facingMode: { ideal: 'environment' } // Back camera preferred
        }
      };

      // Start camera with back camera first
      try {
        await html5QrCode.start(
          { facingMode: 'environment' }, // Back camera
          config,
          (decodedText, decodedResult) => {
            // Success callback - stop scanning after first successful scan
            handleScanSuccess(decodedText);
          },
          (errorMessage) => {
            // Ignore continuous scan errors (normal while scanning)
            // Only log for debugging
            // console.debug('Scan error (normal):', errorMessage);
          }
        );
      } catch (err) {
        console.log('Back camera failed, trying front camera...', err);
        // Try front camera if back camera fails
        try {
          await html5QrCode.start(
            { facingMode: 'user' }, // Front camera
            config,
            (decodedText) => {
              handleScanSuccess(decodedText);
            },
            () => {}
          );
        } catch (frontErr) {
          console.error('Both cameras failed:', frontErr);
          let errorMessage = 'فشل في فتح الكاميرا.';
          
          if (frontErr.message) {
            if (frontErr.message.includes('Permission') || frontErr.message.includes('NotAllowed')) {
              errorMessage = 'تم رفض الوصول إلى الكاميرا. يرجى السماح بالوصول في إعدادات المتصفح.';
            } else if (frontErr.message.includes('NotFound')) {
              errorMessage = 'لم يتم العثور على كاميرا. يرجى التأكد من وجود كاميرا على الجهاز.';
            } else {
              errorMessage = frontErr.message || errorMessage;
            }
          }
          
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      console.error('QR Scanner Error:', error);
      const errorMsg = error.message || 'فشل في تشغيل الكاميرا. يرجى التحقق من الصلاحيات.';
      setCameraError(errorMsg);
      setScanning(false);
      showError(errorMsg);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
    setCameraError('');
  };

  const handleScanSuccess = async (decodedText) => {
    // Stop scanning immediately to prevent multiple scans
    await stopScanning();
    
    // Parse QR code data
    let code = '';
    
    try {
      // Try to parse as JSON first (if QR contains JSON with code field)
      const parsed = JSON.parse(decodedText);
      if (parsed.code) {
        code = parsed.code.toString().trim().toUpperCase();
      } else {
        // If JSON but no code field, use the original text
        code = decodedText.trim().toUpperCase();
      }
    } catch {
      // If not JSON, use as plain text
      code = decodedText.trim().toUpperCase();
    }

    if (code) {
      // Small delay to show success before closing
      setTimeout(() => {
        // Call success callback with the code
        if (onScanSuccess) {
          onScanSuccess(code);
        }
        
        // Close modal
        onClose();
      }, 200);
    }
  };

  const handleClose = async () => {
    await stopScanning();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
        >
          <FiX className="text-gray-600 text-xl" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-2">مسح QR Code</h2>
          <p className="text-sm text-gray-600">وجه الكاميرا نحو QR Code</p>
        </div>

        {/* Scanner Container */}
        <div className="relative mb-4 bg-gray-900 rounded-lg overflow-hidden" style={{ minHeight: '300px', maxHeight: '400px' }}>
          <div
            id="qr-reader"
            className="w-full h-full"
          ></div>
          
          {/* Scanning Overlay - Guide Frame */}
          {scanning && !cameraError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
              <div className="relative">
                {/* Corner borders for scanning guide */}
                <div className="border-2 border-primary-500 rounded-lg" style={{ width: '250px', height: '250px' }}>
                  {/* Top-left corner */}
                  <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary-500 rounded-tl-lg"></div>
                  {/* Top-right corner */}
                  <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary-500 rounded-tr-lg"></div>
                  {/* Bottom-left corner */}
                  <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary-500 rounded-bl-lg"></div>
                  {/* Bottom-right corner */}
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary-500 rounded-br-lg"></div>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-95 rounded-lg p-4 z-20">
              <FiAlertCircle className="text-red-500 text-5xl mb-3" />
              <p className="text-white text-sm text-center font-medium mb-2 px-2">{cameraError}</p>
            </div>
          )}

          {/* Loading */}
          {!scanning && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-90 rounded-lg z-10">
              <FiCamera className="text-white text-5xl mb-3 animate-pulse" />
              <p className="text-white text-sm">جاري تشغيل الكاميرا...</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        {!cameraError && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-blue-700 text-center">
              💡 تأكد من أن QR Code واضح ومضاء جيداً
            </p>
          </div>
        )}

        {/* Camera Error Help */}
        {cameraError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-800 font-semibold mb-2">حل المشكلة:</p>
            <ul className="text-xs text-yellow-700 space-y-1.5 list-disc list-inside">
              <li>في Chrome/Edge: اضغط على أيقونة القفل في شريط العنوان → اسمح بالوصول إلى الكاميرا</li>
              <li>في Firefox: اضغط على أيقونة الدرع → اسمح بالوصول إلى الكاميرا</li>
              <li>في Safari: إعدادات → Safari → الكاميرا → اسمح للموقع</li>
              <li>أغلق التطبيقات الأخرى التي تستخدم الكاميرا (مثل Zoom, Instagram)</li>
              <li>تأكد من وجود كاميرا على الجهاز وأنها تعمل</li>
              <li>جرب تحديث الصفحة (F5) وإعادة المحاولة</li>
              {window.location.protocol === 'http:' && !window.location.hostname.startsWith('192.168.') && (
                <li className="font-semibold text-red-600">⚠️ على الجوال، قد تحتاج إلى HTTPS للوصول إلى الكاميرا</li>
              )}
              {window.location.protocol === 'http:' && window.location.hostname.startsWith('192.168.') && (
                <li className="font-semibold text-orange-600">💡 استخدام HTTP على الشبكة المحلية - تأكد من السماح بالكاميرا في المتصفح</li>
              )}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {cameraError && (
            <button
              onClick={startScanning}
              className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2.5 px-4 rounded-lg transition-colors font-medium"
            >
              إعادة المحاولة
            </button>
          )}
          <button
            onClick={handleClose}
            className={`${cameraError ? 'flex-1' : 'w-full'} bg-gray-200 hover:bg-gray-300 text-gray-800 py-2.5 px-4 rounded-lg transition-colors font-medium`}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}

