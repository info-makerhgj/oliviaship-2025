import { useEffect, useState, useRef } from 'react';
import { chatAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/helpers';
import { 
  FiMessageSquare,
  FiSend,
  FiLoader,
  FiSearch,
  FiUser,
  FiShield,
  FiCheckCircle,
  FiClock,
  FiX
} from 'react-icons/fi';

export default function AdminChat() {
  const { error: showError, success: showSuccess } = useToast();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadChats();
    // Poll for new messages every 2 seconds
    const interval = setInterval(() => {
      loadChats();
      if (selectedChat?._id) {
        loadSelectedChat();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedChat?._id) {
      loadSelectedChat();
    }
  }, [selectedChat?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChats = async () => {
    try {
      const params = {};
      if (searchTerm) {
        params.search = searchTerm;
      }
      const res = await chatAPI.getAllChats(params);
      setChats(res.data.chats || []);
      
      // Update selected chat if it exists
      if (selectedChat?._id) {
        const updated = res.data.chats.find(c => c._id === selectedChat._id);
        if (updated) {
          setSelectedChat(updated);
        }
      }
    } catch (error) {
      console.error('Failed to load chats', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedChat = async () => {
    if (!selectedChat?._id) return;
    
    try {
      const res = await chatAPI.getChat(selectedChat._id);
      setSelectedChat(res.data.chat);
      
      // Update in chats list
      setChats(prev => prev.map(c => 
        c._id === selectedChat._id ? res.data.chat : c
      ));
    } catch (error) {
      console.error('Failed to load chat', error);
    }
  };

  const handleSelectChat = async (chat) => {
    try {
      const res = await chatAPI.getChat(chat._id);
      setSelectedChat(res.data.chat);
    } catch (error) {
      console.error('Failed to load chat', error);
      showError('فشل تحميل المحادثة');
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending || !selectedChat) return;

    setSending(true);
    try {
      const res = await chatAPI.sendMessage(selectedChat._id, message.trim());
      setSelectedChat(res.data.chat);
      setMessage('');
      
      // Update in chats list
      setChats(prev => prev.map(c => 
        c._id === selectedChat._id ? res.data.chat : c
      ));
      
      showSuccess('تم إرسال الرسالة');
    } catch (error) {
      console.error('Failed to send message', error);
      showError(error.response?.data?.message || 'فشل إرسال الرسالة');
    } finally {
      setSending(false);
    }
  };

  const unreadCount = chats.reduce((sum, chat) => sum + (chat.unreadCount?.admin || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
      </div>
    );
  }

  return (
    <div className="h-full flex gap-4">
      {/* Chats List */}
      <div className="w-80 flex-shrink-0">
        <div className="card mb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">المحادثات</h2>
            {unreadCount > 0 && (
              <span className="bg-primary-600 text-white text-xs px-2 py-1 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث في المحادثات..."
              className="input-field pr-10 w-full"
            />
          </div>
        </div>

        <div className="card overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          {chats.length > 0 ? (
            <div className="space-y-2">
              {chats.map((chat) => {
                const lastMessage = chat.messages?.[chat.messages.length - 1];
                const unread = chat.unreadCount?.admin || 0;
                const isSelected = selectedChat?._id === chat._id;
                
                return (
                  <div
                    key={chat._id}
                    onClick={() => handleSelectChat(chat)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'bg-primary-50 border-2 border-primary-500' 
                        : 'hover:bg-gray-50 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <FiUser className="text-primary-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{chat.user?.name || 'عميل'}</p>
                          <p className="text-xs text-gray-500 truncate">{chat.user?.email}</p>
                          {lastMessage && (
                            <p className="text-xs text-gray-600 mt-1 truncate">
                              {lastMessage.message}
                            </p>
                          )}
                        </div>
                      </div>
                      {unread > 0 && (
                        <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full flex-shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    {lastMessage && (
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDate(chat.lastMessageAt)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <FiMessageSquare className="text-3xl text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-600">لا توجد محادثات</p>
            </div>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="card mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                    <FiUser className="text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold">{selectedChat.user?.name || 'عميل'}</h3>
                    <p className="text-sm text-gray-600">{selectedChat.user?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedChat(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <FiX />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              className="flex-1 card overflow-y-auto mb-4"
              style={{ maxHeight: 'calc(100vh - 300px)' }}
            >
              {selectedChat.messages && selectedChat.messages.length > 0 ? (
                <div className="space-y-4 py-4">
                  {selectedChat.messages.map((msg, index) => {
                    const isAdmin = msg.sender === 'admin';
                    
                    return (
                      <div
                        key={index}
                        className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`flex items-start gap-2 max-w-[75%] ${isAdmin ? 'flex-row-reverse' : 'flex-row'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            isAdmin ? 'bg-primary-100' : 'bg-gray-100'
                          }`}>
                            {isAdmin ? (
                              <FiShield className="text-primary-600" />
                            ) : (
                              <FiUser className="text-gray-600" />
                            )}
                          </div>
                          <div className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                            <div className={`px-4 py-2 rounded-lg ${
                              isAdmin 
                                ? 'bg-primary-600 text-white' 
                                : 'bg-gray-100 text-gray-900'
                            }`}>
                              <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                            </div>
                            <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                              <span>{formatDate(msg.createdAt || new Date())}</span>
                              {isAdmin && msg.read && (
                                <FiCheckCircle className="text-blue-500" />
                              )}
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
                  placeholder="اكتب ردك هنا..."
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
          </>
        ) : (
          <div className="card flex items-center justify-center h-full">
            <div className="text-center">
              <FiMessageSquare className="text-4xl text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">اختر محادثة من القائمة</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}






