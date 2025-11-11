import { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import api from '../../utils/api';
import {
  FiFileText,
  FiDownload,
  FiFilter,
  FiTrendingUp,
  FiShoppingCart,
  FiUsers,
  FiActivity,
  FiLoader,
} from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export default function Reports() {
  const { success: showSuccess, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState('revenue');
  const [periodType, setPeriodType] = useState('this_month');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });
  const [filters, setFilters] = useState({ store: '', status: '' });
  const [reportData, setReportData] = useState(null);
  const [exporting, setExporting] = useState(false);

  const reportTypes = [
    { value: 'revenue', label: 'تقرير الإيرادات', icon: FiTrendingUp, color: 'text-green-600' },
    { value: 'sales', label: 'تقرير المبيعات', icon: FiShoppingCart, color: 'text-blue-600' },
    { value: 'customer', label: 'تقرير العملاء', icon: FiUsers, color: 'text-purple-600' },
    {
      value: 'performance',
      label: 'تقرير الأداء',
      icon: FiActivity,
      color: 'text-orange-600',
    },
  ];

  const periodTypes = [
    { value: 'today', label: 'اليوم' },
    { value: 'yesterday', label: 'أمس' },
    { value: 'this_week', label: 'هذا الأسبوع' },
    { value: 'last_week', label: 'الأسبوع الماضي' },
    { value: 'this_month', label: 'هذا الشهر' },
    { value: 'last_month', label: 'الشهر الماضي' },
    { value: 'this_year', label: 'هذه السنة' },
    { value: 'last_year', label: 'السنة الماضية' },
    { value: 'custom', label: 'فترة مخصصة' },
  ];

  const stores = [
    { value: '', label: 'جميع المتاجر' },
    { value: 'amazon', label: 'Amazon' },
    { value: 'noon', label: 'Noon' },
    { value: 'shein', label: 'SHEIN' },
    { value: 'aliexpress', label: 'AliExpress' },
    { value: 'temu', label: 'Temu' },
  ];

  const statuses = [
    { value: '', label: 'جميع الحالات' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'confirmed', label: 'مؤكد' },
    { value: 'processing', label: 'قيد المعالجة' },
    { value: 'delivered', label: 'تم التوصيل' },
    { value: 'cancelled', label: 'ملغي' },
  ];

  const generateReport = async () => {
    setLoading(true);
    try {
      const params = {};

      if (periodType === 'custom' && customDates.start && customDates.end) {
        params.startDate = customDates.start;
        params.endDate = customDates.end;
      } else {
        params.periodType = periodType;
      }

      if (filters.store) params.store = filters.store;
      if (filters.status) params.status = filters.status;

      const response = await api.get(`/reports/${reportType}`, { params });

      setReportData(response.data.data);
      showSuccess('تم توليد التقرير بنجاح');
    } catch (error) {
      console.error('Error generating report:', error);
      showError(error.response?.data?.message || 'فشل في توليد التقرير');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    if (!reportData) {
      showError('يرجى توليد التقرير أولاً');
      return;
    }

    setExporting(true);
    try {
      // حفظ التقرير أولاً
      const saveResponse = await api.post('/reports', {
        type: reportType,
        periodType: periodType === 'custom' ? undefined : periodType,
        startDate: periodType === 'custom' ? customDates.start : undefined,
        endDate: periodType === 'custom' ? customDates.end : undefined,
        filters,
      });

      const reportId = saveResponse.data.data._id;

      // تصدير التقرير
      const exportResponse = await api.get(`/reports/${reportId}/export`, {
        params: { format },
      });

      // تحميل الملف
      const fileUrl = exportResponse.data.data.fileUrl;
      const baseUrl = import.meta.env.VITE_API_URL 
        ? import.meta.env.VITE_API_URL.replace('/api', '')
        : 'http://localhost:5000';
      window.open(`${baseUrl}${fileUrl}`, '_blank');

      showSuccess(`تم تصدير التقرير بصيغة ${format === 'excel' ? 'Excel' : 'PDF'} بنجاح`);
    } catch (error) {
      console.error('Error exporting report:', error);
      showError(error.response?.data?.message || 'فشل في تصدير التقرير');
    } finally {
      setExporting(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('ar-SA').format(num || 0);
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('ar-SA', {
      style: 'currency',
      currency: 'YER',
      minimumFractionDigits: 0,
    }).format(num || 0);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold mb-2 text-gradient">التقارير والإحصائيات</h1>
        <p className="text-gray-600">توليد تقارير مفصلة عن الإيرادات والمبيعات والعملاء</p>
      </div>

      {/* Filters Card */}
      <div className="card mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FiFilter className="text-primary-dynamic" />
          <h2 className="text-lg font-bold">فلاتر التقرير</h2>
        </div>

        <div className="space-y-4">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-semibold mb-2">نوع التقرير</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => setReportType(type.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      reportType === type.value
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    <Icon className={`text-2xl mb-2 ${type.color}`} />
                    <div className="text-sm font-semibold">{type.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-semibold mb-2">الفترة الزمنية</label>
            <select
              value={periodType}
              onChange={(e) => setPeriodType(e.target.value)}
              className="input-field w-full md:w-auto"
            >
              {periodTypes.map((period) => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Dates */}
          {periodType === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">من تاريخ</label>
                <input
                  type="date"
                  value={customDates.start}
                  onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })}
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">إلى تاريخ</label>
                <input
                  type="date"
                  value={customDates.end}
                  onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                  className="input-field w-full"
                />
              </div>
            </div>
          )}

          {/* Additional Filters */}
          {(reportType === 'revenue' || reportType === 'sales') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2">المتجر</label>
                <select
                  value={filters.store}
                  onChange={(e) => setFilters({ ...filters, store: e.target.value })}
                  className="input-field w-full"
                >
                  {stores.map((store) => (
                    <option key={store.value} value={store.value}>
                      {store.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">الحالة</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="input-field w-full"
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="flex gap-3">
            <button
              onClick={generateReport}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading ? (
                <>
                  <FiLoader className="animate-spin" />
                  جاري التوليد...
                </>
              ) : (
                <>
                  <FiFileText />
                  توليد التقرير
                </>
              )}
            </button>

            {reportData && (
              <>
                <button
                  onClick={() => exportReport('excel')}
                  disabled={exporting}
                  className="btn-secondary flex items-center gap-2"
                >
                  <FiDownload />
                  تصدير Excel
                </button>
                <button
                  onClick={() => exportReport('pdf')}
                  disabled={exporting}
                  className="btn-secondary flex items-center gap-2"
                >
                  <FiDownload />
                  تصدير PDF
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(reportData.summary).map(([key, value]) => (
              <div key={key} className="card">
                <div className="text-sm text-gray-600 mb-1">{getFieldLabel(key)}</div>
                <div className="text-2xl font-bold text-gradient">
                  {key.includes('Rate') || key.includes('rate')
                    ? `${value.toFixed(2)}%`
                    : key.includes('Revenue') ||
                      key.includes('revenue') ||
                      key.includes('Value') ||
                      key.includes('value')
                    ? formatCurrency(value)
                    : formatNumber(value)}
                </div>
              </div>
            ))}
          </div>

          {/* Details Section */}
          {reportData.details && (
            <div className="space-y-4">
              {/* Revenue by Store */}
              {reportData.details.revenueByStore && Object.keys(reportData.details.revenueByStore).length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-bold mb-4">الإيرادات حسب المتجر</h3>
                  <div className="space-y-2">
                    {Object.entries(reportData.details.revenueByStore).map(([store, revenue]) => (
                      <div key={store} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="font-semibold capitalize">{store}</span>
                        <span className="text-primary-600 font-bold">{formatCurrency(revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Revenue by Period */}
              {reportData.details.revenueByPeriod && reportData.details.revenueByPeriod.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-bold mb-4">الإيرادات حسب الفترة</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-3">التاريخ</th>
                          <th className="text-right p-3">القيمة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.details.revenueByPeriod
                          .filter(item => item.value > 0)
                          .map((item, index) => (
                            <tr key={index} className="border-b hover:bg-gray-50">
                              <td className="p-3">{new Date(item.date).toLocaleDateString('ar-SA')}</td>
                              <td className="p-3 font-semibold text-primary-600">{formatCurrency(item.value)}</td>
                            </tr>
                          ))}
                        {reportData.details.revenueByPeriod.every(item => item.value === 0) && (
                          <tr>
                            <td colSpan="2" className="p-6 text-center text-gray-500">
                              لا توجد إيرادات في هذه الفترة
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Orders by Status */}
              {reportData.details.ordersByStatus && Object.keys(reportData.details.ordersByStatus).length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-bold mb-4">الطلبات حسب الحالة</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(reportData.details.ordersByStatus).map(([status, count]) => (
                      <div key={status} className="p-4 bg-gray-50 rounded-lg text-center">
                        <div className="text-2xl font-bold text-primary-600">{formatNumber(count)}</div>
                        <div className="text-sm text-gray-600 mt-1 capitalize">{getStatusLabel(status)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Products */}
              {reportData.details.topProducts && reportData.details.topProducts.length > 0 && (
                <div className="card">
                  <h3 className="text-lg font-bold mb-4">المنتجات الأكثر مبيعاً</h3>
                  <div className="space-y-2">
                    {reportData.details.topProducts.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-semibold">{product.name || product.title}</div>
                          <div className="text-sm text-gray-600">الكمية: {formatNumber(product.quantity)}</div>
                        </div>
                        <span className="text-primary-600 font-bold">{formatCurrency(product.revenue)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!reportData && !loading && (
        <div className="card text-center py-12">
          <FiFileText className="text-6xl text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-600 mb-2">لا يوجد تقرير</h3>
          <p className="text-gray-500">اختر نوع التقرير والفترة ثم اضغط على "توليد التقرير"</p>
        </div>
      )}
    </div>
  );
}

// Helper functions
function getFieldLabel(field) {
  const labels = {
    totalRevenue: 'إجمالي الإيرادات',
    totalOrders: 'إجمالي الطلبات',
    averageOrderValue: 'متوسط قيمة الطلب',
    growthRate: 'معدل النمو',
    previousRevenue: 'إيرادات الفترة السابقة',
    completedOrders: 'طلبات مكتملة',
    cancelledOrders: 'طلبات ملغاة',
    pendingOrders: 'طلبات قيد المعالجة',
    conversionRate: 'معدل التحويل',
    cancellationRate: 'معدل الإلغاء',
    totalCustomers: 'إجمالي العملاء',
    newCustomers: 'عملاء جدد',
    activeCustomers: 'عملاء نشطين',
    retentionRate: 'معدل الاحتفاظ',
    customerLifetimeValue: 'القيمة الدائمة للعميل',
    avgProcessingTime: 'متوسط وقت المعالجة',
    totalEmployees: 'إجمالي الموظفين',
    avgOrdersPerEmployee: 'متوسط الطلبات/موظف',
  };
  return labels[field] || field;
}

function getStatusLabel(status) {
  const labels = {
    pending: 'قيد الانتظار',
    confirmed: 'مؤكد',
    processing: 'قيد المعالجة',
    shipped: 'تم الشحن',
    delivered: 'تم التوصيل',
    cancelled: 'ملغي',
    refunded: 'مسترجع',
  };
  return labels[status] || status;
}
