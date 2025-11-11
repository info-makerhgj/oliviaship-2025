import { useEffect, useState, useRef } from 'react';
import { chatAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils/helpers';
import { 
  FiMessageSquare,
  FiSend,
  FiLoader,
  FiCheck,
  FiCheckCircle,
  FiUser,
  FiShield
} from 'react-icons/fi';

export default function CustomerChat() {
  const { error: showError, success: showSuccess } = useToast();
  const { user } = useAuthStore();
  const [chat, setChat] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  useEffect(() => {
    loadChat();
    // Poll for new messages every 3 seconds
    const interval = setInterval(() => {
      if (chat?._id) {
        loadChat();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChat = async () => {
    try {
      const res = await chatAPI.getMyChat();
      setChat(res.data.chat);
    } catch (error) {
      console.error('Failed to load chat', error);
      showError('فشل تحميل المحادثة');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const chatId = chat?._id;
      const res = await chatAPI.sendMessage(chatId, message.trim());
      setChat(res.data.chat);
      setMessage('');
      showSuccess('تم إرسال الرسالة');
    } catch (error) {
      console.error('Failed to send message', error);
      showError(error.response?.data?.message || 'فشل إرسال الرسالة');
    } finally {
      setSending(false);
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <FiMessageSquare className="text-primary-600 text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-bold">الدردشة مع الدعم</h1>
            <p className="text-sm text-gray-600">
              {chat?.admin ? `محادثة مع ${chat.admin.name}` : 'في انتظار رد الفريق'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 card overflow-y-auto mb-4"
        style={{ maxHeight: 'calc(100vh - 300px)' }}
      >
        {chat?.messages && chat.messages.length > 0 ? (
          <div className="space-y-4 py-4">
            {chat.messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              const isRead = msg.read;
              
              return (
                <div
                  key={index}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start gap-2 max-w-[75%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isUser ? 'bg-primary-100' : 'bg-gray-100'
                    }`}>
                      {isUser ? (
                        <FiUser className="text-primary-600" />
                      ) : (
                        <FiShield className="text-gray-600" />
                      )}
                    </div>
                    <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2 rounded-lg ${
                        isUser 
                          ? 'bg-primary-600 text-white' 
                          : 'bg-gray-100 text-gray-900'
                      }`}>
                        <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                        {isUser && (
                          <>
                            {isRead ? (
                              <FiCheckCircle className="text-blue-500" />
                            ) : (
                              <FiCheck />
                            )}
                          </>
                        )}
                        <span>{formatDate(msg.createdAt || new Date())}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FiMessageSquare className="text-4xl text-gray-300 mb-4" />
            <p className="text-gray-600 mb-2">لا توجد رسائل بعد</p>
            <p className="text-sm text-gray-500">ابدأ المحادثة بإرسال رسالة</p>
          </div>
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="card">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب رسالتك هنا..."
            className="input-field flex-1"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending || !message.trim()}
            className="btn-primary flex items-center gap-2 px-4"
          >
            {sending ? (
              <>
                <FiLoader className="animate-spin" />
                <span className="hidden sm:inline">جاري الإرسال...</span>
              </>
            ) : (
              <>
                <FiSend />
                <span className="hidden sm:inline">إرسال</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}






