import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { invoiceAPI } from '../../utils/api';
import {
  FiFileText,
  FiDownload,
  FiMail,
  FiEye,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiDollarSign,
} from 'react-icons/fi';
import { Link } from 'react-router-dom';

export default function Invoices() {
  const { success: showSuccess, error: showError } = useToast();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchInvoices();
    fetchStats();
  }, [pagination.page, filters]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      const response = await invoiceAPI.getAll(params);
      setInvoices(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching invoices:', error);
      showError('فشل في تحميل الفواتير');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await invoiceAPI.getStats();
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDownload = async (invoiceId, invoiceNumber) => {
    try {
      const response = await invoiceAPI.download(invoiceId);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      showSuccess('تم تحميل الفاتورة بنجاح');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      showError('فشل في تحميل الفاتورة');
    }
  };

  const handleSendEmail = async (invoiceId) => {
    try {
      await invoiceAPI.sendEmail(invoiceId);
      showSuccess('تم إرسال الفاتورة بالإيميل بنجاح');
      fetchInvoices(); // Refresh to update sentAt
    } catch (error) {
      console.error('Error sending email:', error);
      showError(error.response?.data?.message || 'فشل في إرسال الفاتورة');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { label: 'مسودة', class: 'bg-gray-100 text-gray-800' },
      sent: { label: 'تم الإرسال', class: 'bg-blue-100 text-blue-800' },
      paid: { label: 'مدفوعة', class: 'bg-green-100 text-green-800' },
      overdue: { label: 'متأخرة', class: 'bg-red-100 text-red-800' },
      cancelled: { label: 'ملغاة', class: 'bg-gray-100 text-gray-600' },
    };

    const config = statusConfig[status] || statusConfig.draft;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.class}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('ar-SA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-2 text-gradient">الفواتير</h1>
        <p className="text-gray-600">إدارة ومتابعة جميع الفواتير</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الفواتير</p>
                <p className="text-2xl font-bold text-gradient">{stats.totalInvoices}</p>
              </div>
              <FiFileText className="text-3xl text-primary-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">مدفوعة</p>
                <p className="text-2xl font-bold text-green-600">{stats.paidInvoices}</p>
              </div>
              <FiDollarSign className="text-3xl text-green-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">قيد الانتظار</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pendingInvoices}</p>
              </div>
              <FiCalendar className="text-3xl text-yellow-600" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">إجمالي الإيرادات</p>
                <p className="text-lg font-bold text-primary-600">
                  {formatCurrency(stats.totalRevenue)} ريال
                </p>
              </div>
              <FiDollarSign className="text-3xl text-primary-600" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="text-primary-dynamic" />
          <h2 className="text-lg font-bold">فلاتر البحث</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold mb-2">الحالة</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field w-full"
            >
              <option value="">جميع الحالات</option>
              <option value="draft">مسودة</option>
              <option value="sent">تم الإرسال</option>
              <option value="paid">مدفوعة</option>
              <option value="overdue">متأخرة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">من تاريخ</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">إلى تاريخ</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">بحث</label>
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="رقم الفاتورة أو العميل..."
                className="input-field w-full pr-10"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-right p-4">رقم الفاتورة</th>
                <th className="text-right p-4">العميل</th>
                <th className="text-right p-4">المبلغ</th>
                <th className="text-right p-4">الحالة</th>
                <th className="text-right p-4">تاريخ الإصدار</th>
                <th className="text-right p-4">تاريخ الاستحقاق</th>
                <th className="text-center p-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center p-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-gray-500">
                    لا توجد فواتير
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => (
                  <tr key={invoice._id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <span className="font-semibold text-primary-600">
                        {invoice.invoiceNumber}
                      </span>
                    </td>
                    <td className="p-4">
                      <div>
                        <div className="font-semibold">{invoice.customerInfo?.name || 'غير معروف'}</div>
                        <div className="text-sm text-gray-500">{invoice.customerInfo?.email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold">{formatCurrency(invoice.total)} ريال</span>
                    </td>
                    <td className="p-4">{getStatusBadge(invoice.status)}</td>
                    <td className="p-4">
                      {new Date(invoice.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="p-4">
                      {new Date(invoice.dueDate).toLocaleDateString('ar-SA')}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/admin/invoices/${invoice._id}`}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="عرض"
                        >
                          <FiEye />
                        </Link>
                        <button
                          onClick={() => handleDownload(invoice._id, invoice.invoiceNumber)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="تحميل PDF"
                        >
                          <FiDownload />
                        </button>
                        <button
                          onClick={() => handleSendEmail(invoice._id)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="إرسال بالإيميل"
                        >
                          <FiMail />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-gray-600">
              عرض {invoices.length} من {pagination.total} فاتورة
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <span className="px-4 py-2">
                صفحة {pagination.page} من {pagination.pages}
              </span>
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.pages}
                className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
