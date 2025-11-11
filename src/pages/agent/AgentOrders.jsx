import { useEffect, useState } from 'react';
import { agentAPI, productAPI } from '../../utils/api';
import { useToast } from '../../contexts/ToastContext';
import { formatCurrency, formatDate, getStatusText } from '../../utils/helpers';
import {
  FiPackage,
  FiLoader,
  FiSearch,
  FiPlus,
  FiEye,
  FiEdit,
  FiCheck,
  FiX,
  FiDollarSign,
  FiSend,
  FiFilter,
  FiClock,
  FiUser,
  FiShoppingCart,
  FiTrash2,
  FiSave,
  FiExternalLink,
  FiShoppingBag,
} from 'react-icons/fi';

export default function AgentOrders() {
  const { success: showSuccess, error: showError } = useToast();
  const [agent, setAgent] = useState(null);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showCustomerPaymentModal, setShowCustomerPaymentModal] = useState(false);
  const [showAgentPaymentModal, setShowAgentPaymentModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrdersForBatch, setSelectedOrdersForBatch] = useState([]);
  
  const [creating, setCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [markingPayment, setMarkingPayment] = useState(false);

  // Create order form
  const [formData, setFormData] = useState({
    customerId: '',
    products: [{ url: '', name: '', price: '', currency: 'SAR', quantity: 1, image: '', color: '', size: '', specifications: '', store: 'amazon' }],
    delivery: {
      type: 'home',
      address: null,
    },
    notes: '',
  });

  useEffect(() => {
    loadAgentAndOrders();
  }, [pagination.page, statusFilter, customerFilter]);

  const loadAgentAndOrders = async () => {
    try {
      setLoading(true);
      const agentRes = await agentAPI.getMyAgent();
      if (agentRes?.data?.agent) {
        setAgent(agentRes.data.agent);
        const agentId = agentRes.data.agent._id;

        const params = {
          page: pagination.page,
          limit: 20,
          ...(statusFilter !== 'all' && { status: statusFilter }),
          ...(customerFilter !== 'all' && { customerId: customerFilter }),
          ...(searchTerm && { search: searchTerm }),
        };

        const ordersRes = await agentAPI.getOrders(agentId, params);
        setOrders(ordersRes.data.orders || []);
        setPagination(ordersRes.data.pagination || { page: 1, limit: 20, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('Failed to load data', error);
      showError(error.response?.data?.message || 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const agentRes = await agentAPI.getMyAgent();
      if (agentRes?.data?.agent) {
        const agentId = agentRes.data.agent._id;
        const customersRes = await agentAPI.getCustomers(agentId, { page: 1, limit: 100 });
        setCustomers(customersRes.data.customers || []);
      }
    } catch (error) {
      console.error('Failed to load customers', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    
    if (!formData.customerId) {
      showError('يجب اختيار عميل');
      return;
    }

    if (formData.products.length === 0 || !formData.products[0].url) {
      showError('يجب إضافة منتج على الأقل');
      return;
    }

    setCreating(true);
    try {
      const agentRes = await agentAPI.getMyAgent();
      if (agentRes?.data?.agent) {
        const orderData = {
          customerId: formData.customerId,
          products: formData.products.map(p => ({
            url: p.url,
            name: p.name,
            price: parseFloat(p.price) || 0,
            currency: p.currency || 'SAR',
            quantity: parseInt(p.quantity) || 1,
            image: p.image || '',
            color: p.color || '',
            size: p.size || '',
            specifications: p.specifications || '',
            store: p.store || 'amazon',
          })),
          delivery: formData.delivery,
          notes: formData.notes,
        };

        await agentAPI.createOrder(agentRes.data.agent._id, orderData);
        showSuccess('✅ تم إنشاء الطلب بنجاح');
        setShowCreateModal(false);
        resetForm();
        loadAgentAndOrders();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في إنشاء الطلب');
    } finally {
      setCreating(false);
    }
  };

  const handleSubmitOrder = async (orderId) => {
    if (!window.confirm('هل أنت متأكد من إرسال هذا الطلب للمنصة؟')) {
      return;
    }

    setSubmitting(true);
    try {
      const agentRes = await agentAPI.getMyAgent();
      if (agentRes?.data?.agent) {
        await agentAPI.submitOrder(agentRes.data.agent._id, orderId);
        showSuccess('✅ تم إرسال الطلب للمنصة بنجاح');
        setShowSubmitModal(false);
        loadAgentAndOrders();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchSubmit = async () => {
    if (selectedOrdersForBatch.length === 0) {
      showError('يجب اختيار طلبات للإرسال');
      return;
    }

    if (!window.confirm(`هل أنت متأكد من إرسال ${selectedOrdersForBatch.length} طلب للمنصة؟`)) {
      return;
    }

    setSubmitting(true);
    try {
      const agentRes = await agentAPI.getMyAgent();
      if (agentRes?.data?.agent) {
        await agentAPI.batchSubmitOrders(agentRes.data.agent._id, {
          orderIds: selectedOrdersForBatch,
        });
        showSuccess(`✅ تم إرسال ${selectedOrdersForBatch.length} طلب بنجاح`);
        setSelectedOrdersForBatch([]);
        loadAgentAndOrders();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في إرسال الطلبات');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkCustomerPayment = async (paymentData) => {
    setMarkingPayment(true);
    try {
      const agentRes = await agentAPI.getMyAgent();
      if (agentRes?.data?.agent) {
        await agentAPI.markCustomerPayment(agentRes.data.agent._id, selectedOrder._id, paymentData);
        showSuccess('✅ تم تسجيل دفع العميل بنجاح');
        setShowCustomerPaymentModal(false);
        setSelectedOrder(null);
        loadAgentAndOrders();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في تسجيل الدفع');
    } finally {
      setMarkingPayment(false);
    }
  };

  const handleMarkAgentPayment = async (paymentData) => {
    setMarkingPayment(true);
    try {
      const agentRes = await agentAPI.getMyAgent();
      if (agentRes?.data?.agent) {
        await agentAPI.markAgentPayment(agentRes.data.agent._id, selectedOrder._id, paymentData);
        showSuccess('✅ تم تسجيل دفع الوكيل بنجاح');
        setShowAgentPaymentModal(false);
        setSelectedOrder(null);
        loadAgentAndOrders();
      }
    } catch (error) {
      showError(error.response?.data?.message || 'فشل في تسجيل الدفع');
    } finally {
      setMarkingPayment(false);
    }
  };

  const [fetchingUrl, setFetchingUrl] = useState('');
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const resetForm = () => {
    setFormData({
      customerId: '',
      products: [],
      delivery: {
        type: 'home',
        address: null,
      },
      notes: '',
    });
    setFetchingUrl('');
    setFetchError('');
  };

  // Fetch product from URL (Smart Cart way)
  const handleFetchProduct = async () => {
    if (!fetchingUrl.trim()) {
      setFetchError('يرجى إدخال رابط المنتج');
      return;
    }

    setFetching(true);
    setFetchError('');

    try {
      const res = await productAPI.fetchFromUrl(fetchingUrl.trim());

      if (res.data.success && res.data.product) {
        const product = res.data.product.product || res.data.product;

        // Add to products list
        const newProduct = {
          url: fetchingUrl.trim(),
          name: product.name || '',
          price: product.price || 0,
          currency: product.currency || 'SAR',
          quantity: 1,
          image: product.image || '',
          color: product.color || '',
          size: product.size || '',
          specifications: product.specifications || '',
          store: product.store || 'amazon',
        };

        setFormData({
          ...formData,
          products: [...formData.products, newProduct],
        });

        setFetchingUrl('');
        showSuccess('✅ تم جلب المنتج بنجاح');
      } else {
        setFetchError('فشل في جلب بيانات المنتج. يرجى التأكد من صحة الرابط');
      }
    } catch (error) {
      setFetchError(error.response?.data?.message || 'فشل في جلب المنتج');
    } finally {
      setFetching(false);
    }
  };

  const removeProduct = (index) => {
    const newProducts = formData.products.filter((_, i) => i !== index);
    setFormData({ ...formData, products: newProducts });
  };

  const updateProduct = (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index] = { ...newProducts[index], [field]: value };
    setFormData({ ...formData, products: newProducts });
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-700',
      processing: 'bg-purple-100 text-purple-700',
      purchased: 'bg-indigo-100 text-indigo-800',
      shipped: 'bg-cyan-100 text-cyan-800',
      in_transit: 'bg-orange-100 text-orange-800',
      arrived: 'bg-teal-100 text-teal-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-orange-100 text-orange-800',
      refunded: 'bg-red-100 text-red-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && !agent) {
    return (
      <div className="flex items-center justify-center py-20">
        <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="card text-center py-12">
        <FiPackage className="text-4xl text-gray-300 mx-auto mb-4" />
        <p className="text-lg text-gray-600 mb-4">أنت لست وكيلاً</p>
      </div>
    );
  }

  const draftOrders = orders.filter(o => o.status === 'draft');
  const canSubmitOrders = draftOrders.length > 0;

  return (
    <div>
      {/* Header */}
      <div className="mb-4 md:mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold mb-1 sm:mb-2 text-gradient">إدارة الطلبات</h1>
          <p className="text-sm sm:text-base text-gray-600">إنشاء وإدارة طلبات العملاء</p>
        </div>
        <div className="flex gap-2">
          {canSubmitOrders && (
            <button
              onClick={handleBatchSubmit}
              disabled={selectedOrdersForBatch.length === 0 || submitting}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 text-sm sm:text-base py-2 px-3 sm:py-2.5 sm:px-4"
            >
              <FiSend className="text-sm" />
              <span className="hidden sm:inline">إرسال المحدد</span>
              <span className="sm:hidden">إرسال</span>
              {selectedOrdersForBatch.length > 0 && (
                <span className="bg-white bg-opacity-30 rounded-full px-1.5 py-0.5 text-xs">
                  {selectedOrdersForBatch.length}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => {
              loadCustomers();
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn-primary flex items-center gap-2 text-sm sm:text-base py-2 px-3 sm:py-2.5 sm:px-4"
          >
            <FiPlus className="text-sm" />
            <span className="hidden sm:inline">طلب جديد</span>
            <span className="sm:hidden">جديد</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-3 md:mb-6 p-2 sm:p-3 md:p-4">
        <div className="flex flex-col md:flex-row gap-1.5 sm:gap-2 md:gap-4">
          <div className="flex-1">
            <div className="relative">
              <FiSearch className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="بحث..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination({ ...pagination, page: 1 });
                }}
                className="input-field w-full pr-8 sm:pr-10 text-sm sm:text-base py-2 sm:py-2.5"
              />
            </div>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="input-field text-sm sm:text-base py-2 sm:py-2.5"
          >
            <option value="all">جميع الحالات</option>
            <option value="draft">مسودة</option>
            <option value="pending">قيد الانتظار</option>
            <option value="confirmed">مؤكد</option>
            <option value="processing">قيد المعالجة</option>
            <option value="purchased">تم الشراء</option>
            <option value="shipped">تم الشحن</option>
            <option value="delivered">تم التسليم</option>
            <option value="cancelled">ملغي</option>
          </select>
          <select
            value={customerFilter}
            onChange={(e) => {
              setCustomerFilter(e.target.value);
              setPagination({ ...pagination, page: 1 });
            }}
            className="input-field text-sm sm:text-base py-2 sm:py-2.5"
          >
            <option value="all">جميع العملاء</option>
            {customers.map((customer) => (
              <option key={customer._id} value={customer._id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <FiLoader className="animate-spin text-xl md:text-2xl text-primary-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center py-12">
          <FiPackage className="text-4xl text-gray-300 mx-auto mb-4" />
          <p className="text-lg text-gray-600 mb-2">لا توجد طلبات</p>
          <button
            onClick={() => {
              loadCustomers();
              resetForm();
              setShowCreateModal(true);
            }}
            className="btn-primary mt-4"
          >
            إنشاء طلب جديد
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="card hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-right py-3 px-4 font-semibold w-12">
                    <input
                      type="checkbox"
                      checked={selectedOrdersForBatch.length === draftOrders.length && draftOrders.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrdersForBatch(draftOrders.map(o => o._id));
                        } else {
                          setSelectedOrdersForBatch([]);
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="text-right py-3 px-4 font-semibold">رقم الطلب</th>
                  <th className="text-right py-3 px-4 font-semibold">العميل</th>
                  <th className="text-right py-3 px-4 font-semibold">المبلغ</th>
                  <th className="text-right py-3 px-4 font-semibold">دفع العميل</th>
                  <th className="text-right py-3 px-4 font-semibold">دفع الوكيل</th>
                  <th className="text-right py-3 px-4 font-semibold">الحالة</th>
                  <th className="text-right py-3 px-4 font-semibold">التاريخ</th>
                  <th className="text-right py-3 px-4 font-semibold">الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {order.status === 'draft' && (
                        <input
                          type="checkbox"
                          checked={selectedOrdersForBatch.includes(order._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedOrdersForBatch([...selectedOrdersForBatch, order._id]);
                            } else {
                              setSelectedOrdersForBatch(selectedOrdersForBatch.filter(id => id !== order._id));
                            }
                          }}
                          className="rounded"
                        />
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono font-semibold text-primary-600">{order.orderNumber}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-semibold">{order.customer?.name || 'عميل'}</p>
                        <p className="text-xs text-gray-500">{order.customer?.phone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold">
                        {formatCurrency(order.pricing?.totalCost || 0, 'SAR')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${getPaymentStatusBadge(order.customerPaymentStatus)}`}>
                        {order.customerPaymentStatus === 'paid' ? 'مدفوع' : 'معلق'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${getPaymentStatusBadge(order.agentPaymentStatus)}`}>
                        {order.agentPaymentStatus === 'paid' ? 'مدفوع' : 'معلق'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(order.status)}`}>
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">{formatDate(order.createdAt)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setShowViewModal(true);
                          }}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                          title="عرض"
                        >
                          <FiEye />
                        </button>
                        {order.status === 'draft' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowSubmitModal(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-50 rounded"
                            title="إرسال للمنصة"
                          >
                            <FiSend />
                          </button>
                        )}
                        {order.customerPaymentStatus === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowCustomerPaymentModal(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            title="تسجيل دفع العميل"
                          >
                            <FiDollarSign />
                          </button>
                        )}
                        {order.customerPaymentStatus === 'paid' && order.agentPaymentStatus === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedOrder(order);
                              setShowAgentPaymentModal(true);
                            }}
                            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded"
                            title="تسجيل دفع الوكيل"
                          >
                            <FiDollarSign />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-2">
            {orders.map((order) => (
              <div key={order._id} className="card p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-semibold text-sm text-primary-600 mb-0.5 truncate">{order.orderNumber}</p>
                    <p className="font-medium text-sm truncate">{order.customer?.name || 'عميل'}</p>
                    <p className="text-xs text-gray-500 truncate">{order.customer?.phone}</p>
                  </div>
                  {order.status === 'draft' && (
                    <input
                      type="checkbox"
                      checked={selectedOrdersForBatch.includes(order._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedOrdersForBatch([...selectedOrdersForBatch, order._id]);
                        } else {
                          setSelectedOrdersForBatch(selectedOrdersForBatch.filter(id => id !== order._id));
                        }
                      }}
                      className="rounded mt-1 flex-shrink-0 ml-2"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-2 pt-2 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">المبلغ</p>
                    <p className="font-semibold text-sm">
                      {formatCurrency(order.pricing?.totalCost || 0, 'SAR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">الحالة</p>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${getStatusBadge(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">دفع العميل</p>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${getPaymentStatusBadge(order.customerPaymentStatus)}`}>
                      {order.customerPaymentStatus === 'paid' ? 'مدفوع' : 'معلق'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">دفع الوكيل</p>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs ${getPaymentStatusBadge(order.agentPaymentStatus)}`}>
                      {order.agentPaymentStatus === 'paid' ? 'مدفوع' : 'معلق'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setSelectedOrder(order);
                      setShowViewModal(true);
                    }}
                    className="flex-1 min-w-[80px] btn-secondary py-1.5 text-xs flex items-center justify-center gap-1"
                  >
                    <FiEye className="text-xs" />
                    عرض
                  </button>
                  {order.status === 'draft' && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowSubmitModal(true);
                      }}
                      className="flex-1 min-w-[80px] bg-green-100 text-green-700 hover:bg-green-200 py-1.5 text-xs rounded flex items-center justify-center gap-1"
                    >
                      <FiSend className="text-xs" />
                      إرسال
                    </button>
                  )}
                  {order.customerPaymentStatus === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowCustomerPaymentModal(true);
                      }}
                      className="flex-1 min-w-[80px] bg-blue-100 text-blue-600 hover:bg-blue-200 py-1.5 text-xs rounded flex items-center justify-center gap-1"
                    >
                      <FiDollarSign className="text-xs" />
                      دفع عميل
                    </button>
                  )}
                  {order.customerPaymentStatus === 'paid' && order.agentPaymentStatus === 'pending' && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowAgentPaymentModal(true);
                      }}
                      className="flex-1 min-w-[80px] bg-yellow-100 text-yellow-700 hover:bg-yellow-200 py-1.5 text-xs rounded flex items-center justify-center gap-1"
                    >
                      <FiDollarSign className="text-xs" />
                      دفع وكيل
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="btn-secondary disabled:opacity-50"
              >
                السابق
              </button>
              <span className="text-sm text-gray-600">
                صفحة {pagination.page} من {pagination.pages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page >= pagination.pages}
                className="btn-secondary disabled:opacity-50"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Order Modal - Very large, will implement simplified version */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">إنشاء طلب جديد</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  العميل *
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                  required
                  className="input-field w-full"
                  disabled={loadingCustomers}
                >
                  <option value="">اختر عميلاً</option>
                  {customers.map((customer) => (
                    <option key={customer._id} value={customer._id}>
                      {customer.name} - {customer.phone}
                    </option>
                  ))}
                </select>
              </div>

              {/* Products - Smart Cart Style */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المنتجات *
                </label>
                
                {/* Add Product by URL - Smart Cart */}
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-semibold text-blue-900 mb-2">
                    إضافة منتج من الرابط (مثل السلة الذكية)
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={fetchingUrl}
                      onChange={(e) => {
                        setFetchingUrl(e.target.value);
                        setFetchError('');
                      }}
                      onKeyPress={(e) => e.key === 'Enter' && handleFetchProduct()}
                      placeholder="https://www.amazon.com/... أو https://www.noon.com/..."
                      className="input-field flex-1 text-sm"
                      disabled={fetching}
                    />
                    <button
                      type="button"
                      onClick={handleFetchProduct}
                      disabled={fetching || !fetchingUrl.trim()}
                      className="btn-primary whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
                    >
                      {fetching ? (
                        <>
                          <FiLoader className="animate-spin" />
                          جاري الجلب...
                        </>
                      ) : (
                        <>
                          <FiShoppingBag />
                          جلب وإضافة
                        </>
                      )}
                    </button>
                  </div>
                  {fetchError && (
                    <p className="text-xs text-red-600 mt-2">{fetchError}</p>
                  )}
                </div>

                {/* Products List */}
                {formData.products.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
                    <FiShoppingBag className="text-3xl text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">لا توجد منتجات</p>
                    <p className="text-xs text-gray-400 mt-1">استخدم الحقل أعلاه لإضافة منتجات</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {formData.products.map((product, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">
                              {product.name || `منتج ${index + 1}`}
                            </h4>
                            <p className="text-xs text-gray-500 break-all">{product.url}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeProduct(index)}
                            className="text-red-600 hover:text-red-700 p-1"
                            title="حذف المنتج"
                          >
                            <FiTrash2 />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">السعر</label>
                            <input
                              type="number"
                              value={product.price}
                              onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="input-field w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">العملة</label>
                            <select
                              value={product.currency}
                              onChange={(e) => updateProduct(index, 'currency', e.target.value)}
                              className="input-field w-full text-sm"
                            >
                              <option value="SAR">SAR</option>
                              <option value="USD">USD</option>
                              <option value="EUR">EUR</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">الكمية</label>
                            <input
                              type="number"
                              value={product.quantity}
                              onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                              min="1"
                              className="input-field w-full text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">المتجر</label>
                            <select
                              value={product.store}
                              onChange={(e) => updateProduct(index, 'store', e.target.value)}
                              className="input-field w-full text-sm"
                            >
                              <option value="amazon">Amazon</option>
                              <option value="ebay">eBay</option>
                              <option value="noon">Noon</option>
                              <option value="other">أخرى</option>
                            </select>
                          </div>
                        </div>

                        {/* Optional fields */}
                        <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">اللون (اختياري)</label>
                            <input
                              type="text"
                              value={product.color}
                              onChange={(e) => updateProduct(index, 'color', e.target.value)}
                              className="input-field w-full text-sm"
                              placeholder="مثل: أسود، أبيض..."
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">المقاس (اختياري)</label>
                            <input
                              type="text"
                              value={product.size}
                              onChange={(e) => updateProduct(index, 'size', e.target.value)}
                              className="input-field w-full text-sm"
                              placeholder="مثل: L، 42..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="input-field w-full"
                  placeholder="ملاحظات عن الطلب..."
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <FiSave />
                  {creating ? 'جاري الإنشاء...' : 'إنشاء الطلب'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetForm();
                  }}
                  className="flex-1 btn-secondary"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Order Modal */}
      {showViewModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">تفاصيل الطلب #{selectedOrder.orderNumber}</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setSelectedOrder(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="text-xl" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">العميل</p>
                  <p className="font-semibold">{selectedOrder.customer?.name}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.customer?.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">الحالة</p>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(selectedOrder.status)}`}>
                    {getStatusText(selectedOrder.status)}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">إجمالي المبلغ</p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(selectedOrder.pricing?.totalCost || 0, 'SAR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">العمولة</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(selectedOrder.commission || 0, 'SAR')}
                  </p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">المنتجات</h3>
                <div className="space-y-2">
                  {selectedOrder.products?.map((product, index) => (
                    <div key={index} className="border border-gray-200 rounded p-3">
                      <p className="font-semibold">{product.name || 'منتج'}</p>
                      <p className="text-sm text-gray-600">{product.url}</p>
                      <div className="flex gap-4 mt-2 text-sm">
                        <span>الكمية: {product.quantity}</span>
                        <span>السعر: {formatCurrency(product.price || 0, product.currency || 'SAR')}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    setShowCustomerPaymentModal(true);
                  }}
                  disabled={selectedOrder.customerPaymentStatus === 'paid'}
                  className="flex-1 btn-secondary disabled:opacity-50"
                >
                  تسجيل دفع العميل
                </button>
                {selectedOrder.status === 'draft' && (
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      setShowSubmitModal(true);
                    }}
                    className="flex-1 btn-primary"
                  >
                    إرسال للمنصة
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit Order Confirmation Modal */}
      {showSubmitModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-4 md:p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">تأكيد الإرسال</h2>
            <p className="text-gray-600 mb-4">
              هل أنت متأكد من إرسال الطلب #{selectedOrder.orderNumber} للمنصة؟
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleSubmitOrder(selectedOrder._id)}
                disabled={submitting}
                className="flex-1 btn-primary disabled:opacity-50"
              >
                {submitting ? 'جاري الإرسال...' : 'تأكيد'}
              </button>
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setSelectedOrder(null);
                }}
                className="flex-1 btn-secondary"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Payment Modal */}
      {showCustomerPaymentModal && selectedOrder && (
        <CustomerPaymentModal
          order={selectedOrder}
          onClose={() => {
            setShowCustomerPaymentModal(false);
            setSelectedOrder(null);
          }}
          onSubmit={handleMarkCustomerPayment}
          loading={markingPayment}
        />
      )}

      {/* Agent Payment Modal */}
      {showAgentPaymentModal && selectedOrder && (
        <AgentPaymentModal
          order={selectedOrder}
          onClose={() => {
            setShowAgentPaymentModal(false);
            setSelectedOrder(null);
          }}
          onSubmit={handleMarkAgentPayment}
          loading={markingPayment}
        />
      )}
    </div>
  );
}

// Customer Payment Modal Component
function CustomerPaymentModal({ order, onClose, onSubmit, loading }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      paymentMethod,
      paymentDate,
      notes,
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-3 md:p-4">
      <div className="bg-white rounded-lg max-w-sm sm:max-w-md w-full p-3 sm:p-4 md:p-5 max-h-[85vh] overflow-y-auto shadow-xl">
        <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">تسجيل دفع العميل</h2>
        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">طريقة الدفع</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input-field w-full text-sm sm:text-base py-2 sm:py-2.5 px-3"
              required
            >
              <option value="cash">نقداً</option>
              <option value="transfer">تحويل بنكي</option>
              <option value="other">أخرى</option>
            </select>
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">تاريخ الدفع</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="input-field w-full text-sm sm:text-base py-2 sm:py-2.5 px-3"
              required
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input-field w-full text-sm sm:text-base py-2 sm:py-2.5 px-3"
              placeholder="ملاحظات عن الدفع..."
            />
          </div>
          <div className="flex gap-2 sm:gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 text-sm sm:text-base py-2 sm:py-2.5"
            >
              {loading ? 'جاري التسجيل...' : 'تسجيل'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 btn-secondary text-sm sm:text-base py-2 sm:py-2.5">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Agent Payment Modal Component
function AgentPaymentModal({ order, onClose, onSubmit, loading }) {
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionId, setTransactionId] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [wallet, setWallet] = useState(null);
  const [loadingWallet, setLoadingWallet] = useState(false);

  useEffect(() => {
    // Load wallet balance when modal opens or when payment method changes to wallet
    if (paymentMethod === 'wallet') {
      loadWallet();
    } else {
      setWallet(null);
    }
  }, [paymentMethod]);

  const loadWallet = async () => {
    try {
      setLoadingWallet(true);
      const { walletAPI } = await import('../../utils/api');
      const res = await walletAPI.get();
      if (res.data?.wallet) {
        setWallet(res.data.wallet);
      }
    } catch (error) {
      console.error('Failed to load wallet:', error);
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // For bank transfer, require transaction ID
    if (paymentMethod === 'transfer' && !transactionId) {
      alert('يرجى إدخال رقم العملية للتحويل البنكي');
      return;
    }

    // For wallet payment, check balance
    if (paymentMethod === 'wallet') {
      const amountToPay = (order.pricing?.totalCost || 0) - (order.commission || 0);
      if (!wallet) {
        alert('فشل في تحميل رصيد المحفظة. يرجى المحاولة مرة أخرى');
        return;
      }
      if (wallet.balance < amountToPay) {
        alert(`رصيد المحفظة غير كافي. الرصيد المتاح: ${formatCurrency(wallet.balance, wallet.currency || 'SAR')}`);
        return;
      }
    }

    onSubmit({
      paymentMethod,
      paymentDate,
      transactionId,
      proofUrl,
      notes,
    });
  };

  const amountToPay = (order.pricing?.totalCost || 0) - (order.commission || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-end sm:items-center z-50 p-2 sm:p-3 md:p-4">
      <div className="bg-white rounded-t-xl sm:rounded-lg w-full sm:max-w-md sm:w-auto p-3 sm:p-4 md:p-5 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto shadow-xl sm:shadow-2xl">
        <h2 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">تسجيل دفع الوكيل للمنصة</h2>
        <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3 md:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">طريقة الدفع</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="input-field w-full text-sm sm:text-base py-2 sm:py-2.5 px-3"
              required
            >
              <option value="">-- اختر طريقة الدفع --</option>
              <option value="wallet">محفظة</option>
              <option value="transfer">تحويل بنكي</option>
            </select>
            {paymentMethod === 'wallet' && wallet && (
              <div className="mt-1.5 sm:mt-2 p-2 sm:p-3 bg-blue-50 rounded-lg">
                <p className="text-xs sm:text-sm text-blue-700">
                  الرصيد المتاح: <span className="font-bold">{formatCurrency(wallet.balance || 0, wallet.currency || 'SAR')}</span>
                </p>
                <p className="text-xs text-blue-600 mt-0.5 sm:mt-1">
                  المبلغ المطلوب: {formatCurrency(amountToPay, 'SAR')}
                </p>
                {wallet.balance < amountToPay && (
                  <p className="text-xs text-red-600 mt-0.5 sm:mt-1">
                    ⚠️ الرصيد غير كافي
                  </p>
                )}
              </div>
            )}
            {paymentMethod === 'wallet' && loadingWallet && (
              <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-600">
                <FiLoader className="animate-spin text-xs sm:text-sm" />
                جاري تحميل رصيد المحفظة...
              </div>
            )}
            {paymentMethod === 'wallet' && wallet && wallet.balance >= amountToPay && (
              <div className="mt-1.5 sm:mt-2 p-1.5 sm:p-2 bg-green-50 rounded-lg">
                <p className="text-xs text-green-800">
                  ✓ سيتم خصم المبلغ تلقائياً من المحفظة
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">تاريخ الدفع</label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="input-field w-full text-sm sm:text-base py-2 sm:py-2.5 px-3"
              required
            />
          </div>
          {paymentMethod === 'transfer' && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">رقم العملية *</label>
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                className="input-field w-full text-sm sm:text-base py-2 sm:py-2.5 px-3"
                placeholder="رقم العملية أو المرجع..."
                required
              />
            </div>
          )}
          {paymentMethod === 'wallet' && wallet && wallet.balance >= amountToPay && (
            <div className="p-1.5 sm:p-2 md:p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-green-800">
                ✓ سيتم خصم المبلغ تلقائياً من المحفظة عند التأكيد
              </p>
            </div>
          )}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">رابط إيصال الدفع</label>
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              className="input-field w-full text-sm sm:text-base py-2 sm:py-2.5 px-3"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="input-field w-full text-sm sm:text-base py-2 sm:py-2.5 px-3"
              placeholder="ملاحظات عن الدفع..."
            />
          </div>
          <div className="flex gap-2 sm:gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 btn-primary disabled:opacity-50 text-sm sm:text-base py-2 sm:py-2.5"
            >
              {loading ? 'جاري التسجيل...' : 'تسجيل'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 btn-secondary text-sm sm:text-base py-2 sm:py-2.5">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

