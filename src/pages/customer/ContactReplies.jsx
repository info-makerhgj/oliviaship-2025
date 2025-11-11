import { useEffect, useState } from 'react';
import { contactAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/helpers';
import { 
  FiMail, 
  FiLoader, 
  FiCheckCircle,
  FiClock,
  FiCornerUpLeft
} from 'react-icons/fi';

export default function ContactReplies() {
  const { error: showError } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMyMessages();
  }, []);

  const loadMyMessages = async () => {
    try {
      const res = await contactAPI.getAll({});
      // Filter only messages with replies
      const repliedMessages = (res.data.messages || []).filter(
        msg => msg.status === 'replied' && msg.replyMessage
      );
      setMessages(repliedMessages);
    } catch (error) {
      console.error('Failed to load messages', error);
      showError('فشل تحميل الرسائل');
    } finally {
      setLoading(false);
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
        <h1 className="text-xl font-bold mb-2 text-gradient">ردود على رسائلي</h1>
        <p className="text-gray-600 text-sm">عرض ردود فريق الدعم على رسائلك من صفحة "اتصل بنا"</p>
      </div>

      {/* Messages List */}
      {messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message._id} className="card">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{message.subject}</h3>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium flex items-center gap-1">
                    <FiCheckCircle />
                    تم الرد
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {formatDate(message.createdAt)}
                </p>
              </div>

              {/* Original Message */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-semibold text-gray-700 mb-2">رسالتك:</p>
                <p className="text-gray-800 whitespace-pre-wrap">{message.message}</p>
              </div>

              {/* Reply */}
              {message.replyMessage && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FiCornerUpLeft className="text-green-600" />
                    <p className="font-semibold text-green-800">رد فريق الدعم:</p>
                  </div>
                  {message.repliedBy?.name && (
                    <p className="text-sm text-gray-600 mb-2">
                      بواسطة: {message.repliedBy.name} - {formatDate(message.repliedAt)}
                    </p>
                  )}
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="whitespace-pre-wrap text-gray-900">{message.replyMessage}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-16">
          <FiMail className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
          <p className="text-sm md:text-base text-gray-600 mb-2">لا توجد ردود</p>
          <p className="text-gray-500">
            لم يتم الرد على أي من رسائلك بعد
          </p>
        </div>
      )}
    </div>
  );
}

