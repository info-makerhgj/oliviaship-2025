import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderAPI, smartCartOrderAPI, posAPI, agentAPI, walletAPI, invoiceAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { getStatusColor, getStatusText, formatDate, formatCurrency } from '../../utils/helpers';
import { 
  FiPackage, 
  FiLoader, 
  FiEye, 
  FiEdit, 
  FiChevronDown,
  FiFilter,
  FiSearch,
  FiCheck,
  FiX,
  FiMapPin,
  FiCheckCircle,
  FiFileText
} from 'react-icons/fi';

const statusOptions = [
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'confirmed', label: 'مؤكد' },
  { value: 'processing', label: 'قيد المعالجة' },
  { value: 'purchased', label: 'تم الشراء' },
  { value: 'shipped', label: 'تم الشحن' },
  { value: 'in_transit', label: 'قيد التوصيل' },
  { value: 'arrived', label: 'وصل' },
  { value: 'arrived_at_point', label: 'وصل لنقطة التسليم' },
  { value: 'ready_for_pickup', label: 'جاهز للاستلام' },
  { value: 'delivered', label: 'تم التسليم' },
  { value: 'cancelled', label: 'ملغي' },
  // Agent-specific statuses
  { value: 'agent_pending', label: 'قيد الانتظار (وكيل)' },
  { value: 'agent_confirmed', label: 'مؤكد من الوكيل' },
  { value: 'agent_processing', label: 'قيد المعالجة (وكيل)' },
];

export default function AdminOrders() {
  const navigate = useNavigate();
  const { success: showSuccess, error: showError } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [showAssignPointModal, setShowAssignPointModal] = useState(false);
  const [selectedOrderForPoint, setSelectedOrderForPoint] = useState(null);
  const [points, setPoints] = useState([]);
  const [loadingPoints, setLoadingPoints] = useState(false);
  const [selectedPointId, setSelectedPointId] = useState('');
  const [assigningPoint, setAssigningPoint] = useState(false);
  const [agentOrders, setAgentOrders] = useState({}); // Map of orderId -> agentOrder
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [paymentData, setPaymentData] = useState({
    paymentMethod: '',
    paymentDate: new Date().toISOString().split('T')[0],
    transactionId: '',
    proofUrl: '',
    notes: '',
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [agentWallet, setAgentWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [orderInvoices, setOrderInvoices] = useState({}); // Map of orderId -> invoice
  const [creatingInvoice, setCreatingInvoice] = useState(null);

  useEffect(() => {
    loadOrders();
    loadPoints();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [orders, statusFilter, searchTerm]);

  const loadPoints = async () => {
    try {
      setLoadingPoints(true);
      const res = await posAPI.getAll({ page: 1, limit: 100, status: 'active' });
      setPoints(res.data.points || []);
    } catch (error) {
      console.error('Failed to load points', error);
    } finally {
      setLoadingPoints(false);
    }
  };

  const handleAssignPoint = (order) => {
    setSelectedOrderForPoint(order);
    setSelectedPointId(order.delivery?.pickupPoint?._id || order.delivery?.pickupPoint || '');
    setShowAssignPointModal(true);
  };

  const assignOrderToPoint = async () => {
    if (!selectedOrderForPoint || !selectedPointId) return;

    setAssigningPoint(true);
    try {
      const api = selectedOrderForPoint.type === 'regular' ? orderAPI : smartCartOrderAPI;
      await api.assignToPoint(selectedOrderForPoint._id, selectedPointId);
      showSuccess('✅ تم توزيع الطلب على النقطة بنجاح');
      setShowAssignPointModal(false);
      setSelectedOrderForPoint(null);
      setSelectedPointId('');
      await loadOrders();
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في توزيع الطلب على النقطة');
    } finally {
      setAssigningPoint(false);
    }
  };

  const loadOrders = async () => {
    try {
      const [ordersRes, smartCartOrdersRes] = await Promise.all([
        orderAPI.getAll().catch(() => ({ data: { orders: [] } })),
        smartCartOrderAPI.getAll().catch(() => ({ data: { orders: [] } })),
      ]);

      const allOrders = [
        ...(ordersRes.data.orders || []).map(order => ({ ...order, type: 'regular' })),
        ...(smartCartOrdersRes.data.orders || []).map(order => ({ ...order, type: 'smartCart' })),
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setOrders(allOrders);

      // Load agent order details for agent orders
      const agentOrdersMap = {};
      const agentOrderPromises = allOrders
        .filter(order => order.metadata?.source === 'agent' && order.metadata?.agentOrderId)
        .map(async (order) => {
          try {
            const agentOrderRes = await agentAPI.getOrder(order.metadata.agentId, order.metadata.agentOrderId);
            if (agentOrderRes.data?.order) {
              agentOrdersMap[order._id] = agentOrderRes.data.order;
            }
          } catch (error) {
            console.error('Failed to load agent order:', error);
          }
        });

      await Promise.all(agentOrderPromises);
      setAgentOrders(agentOrdersMap);

      // Load invoices for orders
      await loadInvoices(allOrders);
    } catch (error) {
      console.error('Failed to load orders', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInvoices = async (ordersList) => {
    // Don't load invoices automatically - too many requests
    // Invoices will be loaded on demand when needed
    setOrderInvoices({});
  };

  const checkInvoiceExists = async (orderId) => {
    // Check if we already know about this invoice
    if (orderInvoices[orderId] !== undefined) {
      return orderInvoices[orderId];
    }

    try {
      const response = await invoiceAPI.getByOrder(orderId);
      if (response.data?.data) {
        setOrderInvoices(prev => ({
          ...prev,
          [orderId]: response.data.data,
        }));
        return response.data.data;
      }
    } catch (error) {
      // Invoice doesn't exist
      setOrderInvoices(prev => ({
        ...prev,
        [orderId]: null,
      }));
    }
    return null;
  };

  const handleCreateInvoice = async (order) => {
    try {
      setCreatingInvoice(order._id);
      
      console.log('Creating invoice for order:', {
        id: order._id,
        orderNumber: order.orderNumber,
        type: order.type,
      });
      
      const response = await invoiceAPI.create({
        orderId: order._id,
        taxRate: 0, // لا ضريبة - المبلغ كما هو
        taxIncluded: false,
        companyInfo: {
          name: 'Olivia Ship - أوليفيا شيب',
          address: 'صنعاء، اليمن',
          phone: '+967 777 123 456',
          email: 'info@oliviaship.com',
        },
        notes: 'شكراً لتعاملكم معنا',
      });
      
      // Update invoices map
      setOrderInvoices(prev => ({
        ...prev,
        [order._id]: response.data.data,
      }));

      showSuccess('تم إنشاء الفاتورة بنجاح');
      
      // Navigate to invoice
      navigate(`/admin/invoices`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      showError(error.response?.data?.message || 'فشل في إنشاء الفاتورة');
    } finally {
      setCreatingInvoice(null);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.orderNumber?.toLowerCase().includes(search) ||
        order.user?.name?.toLowerCase().includes(search) ||
        order.user?.email?.toLowerCase().includes(search) ||
        (order.type === 'regular' && order.product?.name?.toLowerCase().includes(search)) ||
        (order.type === 'smartCart' && order.products?.some(p => p.name?.toLowerCase().includes(search)))
      );
    }

    setFilteredOrders(filtered);
  };

  const handleStatusChange = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNote('');
    setShowStatusModal(true);
  };

  const updateOrderStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    setUpdatingStatus(selectedOrder._id);
    try {
      const api = selectedOrder.type === 'regular' ? orderAPI : smartCartOrderAPI;
      await api.updateStatus(selectedOrder._id, {
        status: newStatus,
        note: statusNote,
      });
      
      // Reload orders
      await loadOrders();
      setShowStatusModal(false);
      setSelectedOrder(null);
      showSuccess('✅ تم تحديث حالة الطلب بنجاح');
    } catch (error) {
      console.error('Failed to update status', error);
      showError(error.response?.data?.message || 'فشل في تحديث الحالة');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleMarkAgentPayment = async (order) => {
    setSelectedOrderForPayment(order);
    setPaymentData({
      paymentMethod: '',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionId: '',
      proofUrl: '',
      notes: '',
    });
    setAgentWallet(null);
    
    // Load agent's wallet balance
    if (order.metadata?.agentId) {
      try {
        setLoadingWallet(true);
        const agentRes = await agentAPI.getOne(order.metadata.agentId);
        if (agentRes.data?.agent?.user?._id) {
          const userId = agentRes.data.agent.user._id;
          try {
            const walletRes = await walletAPI.getByUserId(userId);
            if (walletRes.data?.wallet) {
              setAgentWallet(walletRes.data.wallet);
            }
          } catch (error) {
            // Wallet might not exist yet, that's okay
            console.log('Wallet not found for agent:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load agent wallet:', error);
      } finally {
        setLoadingWallet(false);
      }
    }
    
    setShowPaymentModal(true);
  };

  const submitAgentPayment = async () => {
    if (!selectedOrderForPayment || !paymentData.paymentMethod) {
      showError('يرجى إدخال طريقة الدفع');
      return;
    }

    // For bank transfer, require transaction ID
    if (paymentData.paymentMethod === 'transfer' && !paymentData.transactionId) {
      showError('يرجى إدخال رقم العملية للتحويل البنكي');
      return;
    }

    // For wallet payment, check balance
    if (paymentData.paymentMethod === 'wallet') {
      const agentOrder = agentOrders[selectedOrderForPayment._id];
      const amountToPay = (selectedOrderForPayment.pricing?.totalCost || 0) - (agentOrder?.commission || 0);
      
      if (!agentWallet) {
        showError('فشل في تحميل رصيد المحفظة. يرجى المحاولة مرة أخرى');
        return;
      }
      
      if (agentWallet.balance < amountToPay) {
        showError(`رصيد المحفظة غير كافي. الرصيد المتاح: ${formatCurrency(agentWallet.balance, agentWallet.currency || 'SAR')}`);
        return;
      }
    }

    setSubmittingPayment(true);
    try {
      const agentId = selectedOrderForPayment.metadata?.agentId;
      const agentOrderId = selectedOrderForPayment.metadata?.agentOrderId;
      
      if (!agentId || !agentOrderId) {
        showError('معلومات الطلب غير صحيحة');
        return;
      }

      await agentAPI.markAgentPayment(agentId, agentOrderId, {
        paymentMethod: paymentData.paymentMethod,
        paymentDate: paymentData.paymentDate,
        transactionId: paymentData.transactionId || undefined,
        proofUrl: paymentData.proofUrl || undefined,
        notes: paymentData.notes || undefined,
      });

      showSuccess('✅ تم تسجيل دفع الوكيل بنجاح');
      setShowPaymentModal(false);
      setSelectedOrderForPayment(null);
      setAgentWallet(null);
      await loadOrders();
    } catch (error) {
      console.error('Failed to mark payment', error);
      showError(error.response?.data?.message || 'فشل في تسجيل الدفع');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'partial':
        return 'bg-yellow-100 text-yellow-700';
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'refunded':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusText = (status) => {
    switch (status) {
      case 'paid':
        return 'مدفوع';
      case 'partial':
        return 'جزئي';
      case 'pending':
        return 'معلق';
      case 'refunded':
        return 'مسترد';
      default:
        return 'غير محدد';
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
        <h1 className="text-xl font-bold mb-2 text-gradient">إدارة الطلبات</h1>
        <p className="text-gray-600 text-sm">عرض وإدارة جميع طلبات العملاء</p>
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
              placeholder="ابحث برقم الطلب أو اسم العميل..."
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
              {statusOptions.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Orders Count */}
      <div className="mb-4">
        <p className="text-gray-600">
          إجمالي الطلبات: <span className="font-bold text-primary-600">{filteredOrders.length}</span>
        </p>
      </div>

      {/* Orders List */}
      {filteredOrders.length > 0 ? (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block card overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-4 px-4 font-bold text-gray-700">رقم الطلب</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">العميل</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">المنتج</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">الحالة</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">دفع العميل</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">دفع الوكيل</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">التاريخ</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">الإجمالي</th>
                  <th className="text-right py-4 px-4 font-bold text-gray-700">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const productName = order.type === 'smartCart' 
                    ? order.products && order.products.length > 0
                      ? `${order.products[0].name}${order.products.length > 1 ? ` + ${order.products.length - 1} منتج آخر` : ''}`
                      : 'منتجات متعددة'
                    : order.product?.name || 'منتج غير محدد';
                  
                  const productCount = order.type === 'smartCart'
                    ? order.products?.length || 0
                    : 1;

                  const totalPrice = order.pricing?.totalInYER || order.pricing?.totalCost || 0;

                  // Check if order is from agent
                  const isAgentOrder = order.metadata?.source === 'agent';
                  const customerName = isAgentOrder ? order.metadata?.customerName : order.user?.name;
                  const customerContact = isAgentOrder ? order.metadata?.customerPhone : order.user?.email;
                  const agentOrder = isAgentOrder ? agentOrders[order._id] : null;

                  return (
                    <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-primary-600">#{order.orderNumber}</span>
                          {isAgentOrder && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded">
                              وكيل
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-semibold">{customerName || 'غير محدد'}</p>
                          <p className="text-sm text-gray-500">{customerContact || order.user?.email}</p>
                          {isAgentOrder && order.user && (
                            <p className="text-xs text-gray-400 mt-1">
                              وكيل: {order.user.name}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col max-w-xs">
                          <span className="truncate font-medium">{productName}</span>
                          {order.type === 'smartCart' && productCount > 1 && (
                            <span className="text-xs text-gray-500 mt-1">
                              ({productCount} منتج)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <button
                          onClick={() => handleStatusChange(order)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:shadow-md ${getStatusColor(order.status)}`}
                          title="انقر لتغيير الحالة"
                        >
                          {getStatusText(order.status)}
                        </button>
                      </td>
                      <td className="py-4 px-4">
                        {isAgentOrder && agentOrder ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(agentOrder.customerPaymentStatus)}`}>
                            {getPaymentStatusText(agentOrder.customerPaymentStatus)}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {isAgentOrder && agentOrder ? (
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(agentOrder.agentPaymentStatus)}`}>
                              {getPaymentStatusText(agentOrder.agentPaymentStatus)}
                            </span>
                            {agentOrder.agentPaymentStatus !== 'paid' && (
                              <button
                                onClick={() => handleMarkAgentPayment(order)}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="تسجيل دفع الوكيل"
                              >
                                <FiCheck />
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-600">{formatDate(order.createdAt)}</td>
                      <td className="py-4 px-4">
                        <span className="font-bold text-primary-600">
                          {formatCurrency(totalPrice, 'YER')}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/dashboard/orders/${order._id}`)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="عرض التفاصيل"
                          >
                            <FiEye />
                          </button>
                          <button
                            onClick={() => handleStatusChange(order)}
                            className="p-2 text-secondary-600 hover:bg-secondary-50 rounded-lg transition-colors"
                            title="تغيير الحالة"
                          >
                            <FiEdit />
                          </button>
                          <button
                            onClick={() => handleAssignPoint(order)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="توزيع على نقطة"
                          >
                            <FiMapPin />
                          </button>
                          {orderInvoices[order._id] ? (
                            <button
                              onClick={() => navigate('/admin/invoices')}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="عرض الفاتورة"
                            >
                              <FiCheckCircle />
                            </button>
                          ) : orderInvoices[order._id] === null ? (
                            <button
                              onClick={() => handleCreateInvoice(order)}
                              disabled={creatingInvoice === order._id}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors disabled:opacity-50"
                              title="إنشاء فاتورة"
                            >
                              {creatingInvoice === order._id ? (
                                <FiLoader className="animate-spin" />
                              ) : (
                                <FiFileText />
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={() => checkInvoiceExists(order._id)}
                              className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                              title="التحقق من الفاتورة"
                            >
                              <FiFileText />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-4">
            {filteredOrders.map((order) => {
              const productName = order.type === 'smartCart' 
                ? order.products && order.products.length > 0
                  ? `${order.products[0].name}${order.products.length > 1 ? ` + ${order.products.length - 1} منتج آخر` : ''}`
                  : 'منتجات متعددة'
                : order.product?.name || 'منتج غير محدد';
              
              const productCount = order.type === 'smartCart'
                ? order.products?.length || 0
                : 1;

              const totalPrice = order.pricing?.totalInYER || order.pricing?.totalCost || 0;

              // Check if order is from agent
              const isAgentOrder = order.metadata?.source === 'agent';
              const customerName = isAgentOrder ? order.metadata?.customerName : order.user?.name;
              const customerContact = isAgentOrder ? order.metadata?.customerPhone : order.user?.email;
              const agentOrder = isAgentOrder ? agentOrders[order._id] : null;

              return (
                <div key={order._id} className="card">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-mono font-bold text-primary-600">#{order.orderNumber}</p>
                        {isAgentOrder && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-xs font-medium rounded">
                            وكيل
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                    </div>
                    <button
                      onClick={() => handleStatusChange(order)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${getStatusColor(order.status)}`}
                    >
                      {getStatusText(order.status)}
                    </button>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">العميل</p>
                    <p className="font-semibold">{customerName || 'غير محدد'}</p>
                    <p className="text-xs text-gray-500">{customerContact || order.user?.email}</p>
                    {isAgentOrder && order.user && (
                      <p className="text-xs text-gray-400 mt-1">
                        وكيل: {order.user.name}
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-1">المنتج</p>
                    <p className="font-medium">{productName}</p>
                    {order.type === 'smartCart' && productCount > 1 && (
                      <p className="text-xs text-gray-500 mt-1">({productCount} منتج)</p>
                    )}
                  </div>

                  {isAgentOrder && agentOrder && (
                    <div className="mb-4 grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">دفع العميل</p>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(agentOrder.customerPaymentStatus)}`}>
                          {getPaymentStatusText(agentOrder.customerPaymentStatus)}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">دفع الوكيل</p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPaymentStatusColor(agentOrder.agentPaymentStatus)}`}>
                            {getPaymentStatusText(agentOrder.agentPaymentStatus)}
                          </span>
                          {agentOrder.agentPaymentStatus !== 'paid' && (
                            <button
                              onClick={() => handleMarkAgentPayment(order)}
                              className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                              title="تسجيل دفع الوكيل"
                            >
                              <FiCheck />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mb-4 flex items-center justify-between pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">الإجمالي</p>
                      <p className="text-lg font-bold text-primary-600">
                        {formatCurrency(totalPrice, 'YER')}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/dashboard/orders/${order._id}`)}
                        className="btn-primary px-4 py-2 text-sm"
                      >
                        <FiEye className="ml-2" />
                        عرض التفاصيل
                      </button>
                      <button
                        onClick={() => handleAssignPoint(order)}
                        className="px-4 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                      >
                        <FiMapPin className="ml-2" />
                        توزيع على نقطة
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="card text-center py-16">
          <FiPackage className="text-3xl md:text-4xl text-gray-300 mx-auto mb-4" />
          <p className="text-sm md:text-base text-gray-600 mb-2">لا توجد طلبات</p>
          <p className="text-gray-500">
            {searchTerm || statusFilter !== 'all' 
              ? 'جرب تغيير معايير البحث' 
              : 'لم يتم إنشاء أي طلبات بعد'}
          </p>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4">تغيير حالة الطلب</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">رقم الطلب: <span className="font-bold">#{selectedOrder.orderNumber}</span></p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">الحالة الجديدة</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="input-field w-full"
              >
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">ملاحظة (اختياري)</label>
              <textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="أضف ملاحظة حول تغيير الحالة..."
                className="input-field w-full min-h-[100px]"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedOrder(null);
                  setNewStatus('');
                  setStatusNote('');
                }}
                className="flex-1 btn-secondary"
              >
                <FiX className="ml-2" />
                إلغاء
              </button>
              <button
                onClick={updateOrderStatus}
                disabled={updatingStatus === selectedOrder._id || !newStatus}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updatingStatus === selectedOrder._id ? (
                  <>
                    <FiLoader className="animate-spin ml-2" />
                    جاري التحديث...
                  </>
                ) : (
                  <>
                    <FiCheck className="ml-2" />
                    حفظ
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent Payment Modal */}
      {showPaymentModal && selectedOrderForPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <h2 className="text-lg font-bold mb-4">تسجيل دفع الوكيل</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                رقم الطلب: <span className="font-bold">#{selectedOrderForPayment.orderNumber}</span>
              </p>
              {selectedOrderForPayment.metadata?.customerName && (
                <p className="text-sm text-gray-600">
                  العميل: <span className="font-medium">{selectedOrderForPayment.metadata.customerName}</span>
                </p>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">طريقة الدفع *</label>
              <select
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                className="input-field w-full"
                required
              >
                <option value="">-- اختر طريقة الدفع --</option>
                <option value="wallet">محفظة</option>
                <option value="transfer">تحويل بنكي</option>
              </select>
              {paymentData.paymentMethod === 'wallet' && agentWallet && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    الرصيد المتاح: <span className="font-bold">{formatCurrency(agentWallet.balance || 0, agentWallet.currency || 'SAR')}</span>
                  </p>
                  {selectedOrderForPayment && (
                    <p className="text-xs text-blue-600 mt-1">
                      المبلغ المطلوب: {formatCurrency(
                        (selectedOrderForPayment.pricing?.totalCost || 0) - (agentOrders[selectedOrderForPayment._id]?.commission || 0),
                        'SAR'
                      )}
                    </p>
                  )}
                </div>
              )}
              {paymentData.paymentMethod === 'wallet' && loadingWallet && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                  <FiLoader className="animate-spin" />
                  جاري تحميل رصيد المحفظة...
                </div>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">تاريخ الدفع</label>
              <input
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                className="input-field w-full"
              />
            </div>

            {paymentData.paymentMethod === 'transfer' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2">رقم العملية *</label>
                <input
                  type="text"
                  value={paymentData.transactionId}
                  onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                  placeholder="رقم التحويل أو المرجع"
                  className="input-field w-full"
                  required
                />
              </div>
            )}
            {paymentData.paymentMethod === 'wallet' && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <FiCheckCircle className="inline ml-2" />
                  سيتم خصم المبلغ تلقائياً من محفظة الوكيل
                </p>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">رابط إيصال الدفع (اختياري)</label>
              <input
                type="url"
                value={paymentData.proofUrl}
                onChange={(e) => setPaymentData({ ...paymentData, proofUrl: e.target.value })}
                placeholder="https://..."
                className="input-field w-full"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">ملاحظات (اختياري)</label>
              <textarea
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                placeholder="ملاحظات إضافية..."
                rows={3}
                className="input-field w-full"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedOrderForPayment(null);
                }}
                className="btn-secondary flex-1"
                disabled={submittingPayment}
              >
                إلغاء
              </button>
              <button
                onClick={submitAgentPayment}
                className="btn-primary flex-1"
                disabled={submittingPayment}
              >
                {submittingPayment ? (
                  <>
                    <FiLoader className="animate-spin ml-2" />
                    جاري الحفظ...
                  </>
                ) : (
                  <>
                    <FiCheck className="ml-2" />
                    تسجيل الدفع
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Point Modal */}
      {showAssignPointModal && selectedOrderForPoint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-lg font-bold mb-4">توزيع الطلب على نقطة استلام</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                رقم الطلب: <span className="font-bold">#{selectedOrderForPoint.orderNumber}</span>
              </p>
              <p className="text-sm text-gray-600">
                العميل: <span className="font-medium">{selectedOrderForPoint.user?.name}</span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-semibold mb-2">اختر النقطة</label>
              {loadingPoints ? (
                <div className="flex justify-center py-4">
                  <FiLoader className="animate-spin text-lg md:text-xl text-primary-600" />
                </div>
              ) : points.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">لا توجد نقاط متاحة</p>
              ) : (
                <select
                  value={selectedPointId}
                  onChange={(e) => setSelectedPointId(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">-- اختر النقطة --</option>
                  {points.map(point => (
                    <option key={point._id} value={point._id}>
                      {point.name} - {point.location.city} ({point.location.address})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedOrderForPoint.delivery?.pickupPoint && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  النقطة الحالية: <span className="font-medium">
                    {typeof selectedOrderForPoint.delivery.pickupPoint === 'object' 
                      ? selectedOrderForPoint.delivery.pickupPoint.name 
                      : 'نقطة معينة'}
                  </span>
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAssignPointModal(false);
                  setSelectedOrderForPoint(null);
                  setSelectedPointId('');
                }}
                className="flex-1 btn-secondary"
              >
                <FiX className="ml-2" />
                إلغاء
              </button>
              <button
                onClick={assignOrderToPoint}
                disabled={assigningPoint || !selectedPointId || loadingPoints}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {assigningPoint ? (
                  <>
                    <FiLoader className="animate-spin ml-2" />
                    جاري التوزيع...
                  </>
                ) : (
                  <>
                    <FiCheck className="ml-2" />
                    توزيع
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
