import { useEffect, useState } from 'react';
import { contactAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { formatDate } from '../../utils/helpers';
import { 
  FiMail, 
  FiLoader, 
  FiSearch,
  FiFilter,
  FiEye,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiCornerUpLeft,
  FiArchive,
  FiMessageSquare,
  FiMoreVertical
} from 'react-icons/fi';

const statusLabels = {
  new: { label: 'جديدة', color: 'bg-blue-100 text-blue-700', icon: FiClock },
  read: { label: 'مقروءة', color: 'bg-gray-100 text-gray-800', icon: FiEye },
  replied: { label: 'تم الرد', color: 'bg-green-100 text-green-800', icon: FiCheckCircle },
  archived: { label: 'مؤرشف', color: 'bg-yellow-100 text-yellow-800', icon: FiArchive },
};

export default function AdminContactMessages() {
  const { error: showError, success: showSuccess } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredMessages, setFilteredMessages] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [actionMenu, setActionMenu] = useState(null);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadMessages();
  }, []);

  useEffect(() => {
    filterMessages();
  }, [messages, statusFilter, searchTerm]);

  const loadMessages = async () => {
    try {
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      const res = await contactAPI.getAll(params);
      setMessages(res.data.messages || []);
    } catch (error) {
      console.error('Failed to load messages', error);
      showError('فشل تحميل الرسائل');
    } finally {
      setLoading(false);
    }
  };

  const filterMessages = () => {
    let filtered = [...messages];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(msg => msg.status === statusFilter);
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.name?.toLowerCase().includes(search) ||
        msg.email?.toLowerCase().includes(search) ||
        msg.subject?.toLowerCase().includes(search) ||
        msg.message?.toLowerCase().includes(search)
      );
    }

    setFilteredMessages(filtered);
  };

  const handleViewMessage = async (messageId) => {
    try {
      const res = await contactAPI.getOne(messageId);
      setSelectedMessage(res.data.message);
      await loadMessages(); // Reload to update status
    } catch (error) {
      console.error('Failed to load message', error);
      showError('فشل تحميل الرسالة');
    }
  };

  const handleUpdateStatus = async (messageId, status) => {
    try {
      await contactAPI.updateStatus(messageId, { status });
      await loadMessages();
      setActionMenu(null);
      showSuccess('تم تحديث الحالة بنجاح');
    } catch (error) {
      console.error('Failed to update status', error);
      showError(error.response?.data?.message || 'فشل تحديث الحالة');
    }
  };

  const handleReply = async (messageId) => {
    if (!replyText.trim()) {
      showError('يرجى كتابة رسالة الرد');
      return;
    }

    setReplying(true);
    try {
      await contactAPI.reply(messageId, { replyMessage: replyText });
      await loadMessages();
      setSelectedMessage(null);
      setReplyText('');
      showSuccess('تم إرسال الرد بنجاح');
    } catch (error) {
      console.error('Failed to reply', error);
      showError(error.response?.data?.message || 'فشل إرسال الرد');
    } finally {
      setReplying(false);
    }
  };

  const handleDelete = async (messageId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
      return;
    }

    try {
      await contactAPI.delete(messageId);
      await loadMessages();
      setActionMenu(null);
      if (selectedMessage?._id === messageId) {
        setSelectedMessage(null);
      }
      showSuccess('تم حذف الرسالة بنجاح');
    } catch (error) {
      console.error('Failed to delete message', error);
      showError(error.response?.data?.message || 'فشل حذف الرسالة');
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
        <h1 className="text-xl font-bold mb-2 text-gradient">رسائل الاتصال</h1>
        <p className="text-gray-600 text-sm">عرض وإدارة رسائل العملاء من صفحة "اتصل بنا"</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium mb-1">إجمالي الرسائل</p>
              <p className="text-xl font-bold text-blue-900">{messages.length}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-xl">
              <FiMail className="text-lg md:text-xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 font-medium mb-1">رسائل جديدة</p>
              <p className="text-xl font-bold text-green-900">
                {messages.filter(m => m.status === 'new').length}
              </p>
            </div>
            <div className="bg-green-200 p-3 rounded-xl">
              <FiClock className="text-lg md:text-xl text-green-700" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-400 font-medium mb-1">تم الرد</p>
              <p className="text-xl font-bold text-purple-900">
                {messages.filter(m => m.status === 'replied').length}
              </p>
            </div>
            <div className="bg-purple-200 p-3 rounded-xl">
              <FiCheckCircle className="text-lg md:text-xl text-purple-400" />
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-700 font-medium mb-1">مقروءة</p>
              <p className="text-xl font-bold text-gray-900">
                {messages.filter(m => m.status === 'read').length}
              </p>
            </div>
            <div className="bg-gray-200 p-3 rounded-xl">
              <FiEye className="text-lg md:text-xl text-gray-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث في الرسائل..."
              className="input-field pr-12 w-full"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FiFilter className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field pr-12 w-full appearance-none cursor-pointer"
            >
              <option value="all">جميع الحالات</option>
              <option value="new">جديدة</option>
              <option value="read">مقروءة</option>
              <option value="replied">تم الرد</option>
              <option value="archived">مؤرشف</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages List and Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-1 space-y-3">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((message) => {
              const statusInfo = statusLabels[message.status] || statusLabels.new;
              const StatusIcon = statusInfo.icon;
              return (
                <div
                  key={message._id}
                  onClick={() => handleViewMessage(message._id)}
                  className={`card cursor-pointer transition-all hover:shadow-md ${
                    selectedMessage?._id === message._id ? 'ring-2 ring-primary-500' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <StatusIcon className="text-sm" />
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <h3 className="font-bold text-sm mb-1">{message.subject}</h3>
                      <p className="text-xs text-gray-600 mb-2">{message.name}</p>
                      <p className="text-xs text-gray-500 line-clamp-2">{message.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{formatDate(message.createdAt)}</p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="card text-center py-12">
              <FiMail className="text-3xl text-gray-300 mx-auto mb-4" />
              <p className="text-sm text-gray-600">لا توجد رسائل</p>
            </div>
          )}
        </div>

        {/* Message Detail */}
        {selectedMessage && (
          <div className="lg:col-span-2">
            <div className="card">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold mb-2">{selectedMessage.subject}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      statusLabels[selectedMessage.status]?.color || ''
                    }`}>
                      {statusLabels[selectedMessage.status]?.label || selectedMessage.status}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setActionMenu(actionMenu === selectedMessage._id ? null : selectedMessage._id)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                  >
                    <FiMoreVertical />
                  </button>
                  {actionMenu === selectedMessage._id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setActionMenu(null)}
                      />
                      <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[160px]">
                        {selectedMessage.status !== 'read' && (
                          <button
                            onClick={() => handleUpdateStatus(selectedMessage._id, 'read')}
                            className="w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <FiEye className="ml-auto" />
                            <span>تعليم كمقروء</span>
                          </button>
                        )}
                        {selectedMessage.status !== 'archived' && (
                          <button
                            onClick={() => handleUpdateStatus(selectedMessage._id, 'archived')}
                            className="w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors flex items-center gap-2"
                          >
                            <FiArchive className="ml-auto" />
                            <span>أرشفة</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(selectedMessage._id)}
                          className="w-full text-right px-4 py-2 hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2"
                        >
                          <FiTrash2 className="ml-auto" />
                          <span>حذف</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">الاسم</p>
                  <p className="font-medium">{selectedMessage.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">البريد الإلكتروني</p>
                  <a href={`mailto:${selectedMessage.email}`} className="text-primary-600 hover:underline">
                    {selectedMessage.email}
                  </a>
                </div>
                {selectedMessage.phone && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">رقم الهاتف</p>
                    <a href={`tel:${selectedMessage.phone}`} className="text-primary-600 hover:underline">
                      {selectedMessage.phone}
                    </a>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 mb-1">تاريخ الإرسال</p>
                  <p className="font-medium">{formatDate(selectedMessage.createdAt)}</p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-500 mb-2">الرسالة</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>

              {selectedMessage.repliedAt && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FiCornerUpLeft className="text-green-600" />
                    <p className="font-semibold text-green-800">تم الرد على هذه الرسالة</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {selectedMessage.repliedBy?.name && `بواسطة: ${selectedMessage.repliedBy.name}`}
                    {selectedMessage.repliedAt && ` - ${formatDate(selectedMessage.repliedAt)}`}
                  </p>
                  <div className="bg-white p-3 rounded border border-green-200">
                    <p className="whitespace-pre-wrap">{selectedMessage.replyMessage}</p>
                  </div>
                </div>
              )}

              {!selectedMessage.repliedAt && (
                <div className="border-t border-gray-200 pt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    الرد على الرسالة
                  </label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows="4"
                    className="input-field w-full mb-3"
                    placeholder="اكتب ردك هنا..."
                  />
                  <button
                    onClick={() => handleReply(selectedMessage._id)}
                    disabled={replying || !replyText.trim()}
                    className="btn-primary flex items-center gap-2"
                  >
                    {replying ? (
                      <>
                        <FiLoader className="animate-spin" />
                        جاري الإرسال...
                      </>
                    ) : (
                      <>
                        <FiCornerUpLeft />
                        إرسال الرد
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

