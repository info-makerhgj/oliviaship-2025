import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class ExcelExportService {
  /**
   * تصدير تقرير إلى Excel
   */
  async exportReport(report) {
    try {
      const workbook = XLSX.utils.book_new();

      // ورقة الملخص
      const summarySheet = this._createSummarySheet(report);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'الملخص');

      // ورقة التفاصيل حسب نوع التقرير
      if (report.type === 'revenue') {
        const detailsSheet = this._createRevenueDetailsSheet(report.data);
        XLSX.utils.book_append_sheet(workbook, detailsSheet, 'التفاصيل');
      } else if (report.type === 'sales') {
        const detailsSheet = this._createSalesDetailsSheet(report.data);
        XLSX.utils.book_append_sheet(workbook, detailsSheet, 'التفاصيل');
      } else if (report.type === 'customer') {
        const detailsSheet = this._createCustomerDetailsSheet(report.data);
        XLSX.utils.book_append_sheet(workbook, detailsSheet, 'التفاصيل');
      } else if (report.type === 'performance') {
        const detailsSheet = this._createPerformanceDetailsSheet(report.data);
        XLSX.utils.book_append_sheet(workbook, detailsSheet, 'التفاصيل');
      }

      // حفظ الملف
      const fileName = `report_${report._id}_${Date.now()}.xlsx`;
      const uploadsDir = path.join(__dirname, '../../uploads/reports');

      // إنشاء المجلد إذا لم يكن موجوداً
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, fileName);
      XLSX.writeFile(workbook, filePath);

      return {
        fileName,
        filePath,
        fileUrl: `/uploads/reports/${fileName}`,
      };
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      throw error;
    }
  }

  /**
   * إنشاء ورقة الملخص
   */
  _createSummarySheet(report) {
    const data = [
      ['تقرير', report.title],
      ['الوصف', report.description],
      ['النوع', this._getTypeLabel(report.type)],
      ['من تاريخ', new Date(report.period.start).toLocaleDateString('ar-SA')],
      ['إلى تاريخ', new Date(report.period.end).toLocaleDateString('ar-SA')],
      ['تم الإنشاء', new Date(report.createdAt).toLocaleString('ar-SA')],
      [],
      ['الملخص'],
    ];

    // إضافة بيانات الملخص
    const summary = report.data.summary;
    Object.entries(summary).forEach(([key, value]) => {
      data.push([this._getFieldLabel(key), this._formatValue(value)]);
    });

    return XLSX.utils.aoa_to_sheet(data);
  }

  /**
   * إنشاء ورقة تفاصيل الإيرادات
   */
  _createRevenueDetailsSheet(data) {
    const rows = [['المتجر', 'الإيرادات', 'عدد الطلبات', 'متوسط قيمة الطلب']];

    if (data.details.revenueByStore) {
      Object.entries(data.details.revenueByStore).forEach(([store, info]) => {
        rows.push([
          store,
          info.revenue.toFixed(2),
          info.orders,
          (info.revenue / info.orders).toFixed(2),
        ]);
      });
    }

    rows.push([]);
    rows.push(['التاريخ', 'الإيرادات']);

    if (data.details.revenueByPeriod) {
      data.details.revenueByPeriod.forEach((item) => {
        rows.push([item.date, item.value.toFixed(2)]);
      });
    }

    return XLSX.utils.aoa_to_sheet(rows);
  }

  /**
   * إنشاء ورقة تفاصيل المبيعات
   */
  _createSalesDetailsSheet(data) {
    const rows = [['الحالة', 'عدد الطلبات']];

    if (data.details.ordersByStatus) {
      Object.entries(data.details.ordersByStatus).forEach(([status, count]) => {
        rows.push([this._getStatusLabel(status), count]);
      });
    }

    rows.push([]);
    rows.push(['أكثر المنتجات طلباً']);
    rows.push(['المنتج', 'عدد الطلبات']);

    if (data.details.topProducts) {
      data.details.topProducts.forEach((product) => {
        rows.push([product.name, product.count]);
      });
    }

    return XLSX.utils.aoa_to_sheet(rows);
  }

  /**
   * إنشاء ورقة تفاصيل العملاء
   */
  _createCustomerDetailsSheet(data) {
    const rows = [['أفضل العملاء'], ['الاسم', 'البريد', 'إجمالي الإنفاق', 'عدد الطلبات']];

    if (data.details.topCustomers) {
      data.details.topCustomers.forEach((customer) => {
        rows.push([
          customer.name,
          customer.email,
          customer.totalSpent.toFixed(2),
          customer.orderCount,
        ]);
      });
    }

    return XLSX.utils.aoa_to_sheet(rows);
  }

  /**
   * إنشاء ورقة تفاصيل الأداء
   */
  _createPerformanceDetailsSheet(data) {
    const rows = [['أداء الموظفين'], ['الاسم', 'البريد', 'إجمالي الطلبات', 'مكتملة', 'ملغاة']];

    if (data.details.employeePerformance) {
      data.details.employeePerformance.forEach((emp) => {
        rows.push([
          emp.name,
          emp.email,
          emp.totalOrders,
          emp.completedOrders,
          emp.cancelledOrders,
        ]);
      });
    }

    return XLSX.utils.aoa_to_sheet(rows);
  }

  /**
   * دوال مساعدة
   */
  _getTypeLabel(type) {
    const labels = {
      revenue: 'الإيرادات',
      sales: 'المبيعات',
      customer: 'العملاء',
      performance: 'الأداء',
    };
    return labels[type] || type;
  }

  _getFieldLabel(field) {
    const labels = {
      totalRevenue: 'إجمالي الإيرادات',
      totalOrders: 'إجمالي الطلبات',
      averageOrderValue: 'متوسط قيمة الطلب',
      growthRate: 'معدل النمو (%)',
      previousRevenue: 'إيرادات الفترة السابقة',
      completedOrders: 'طلبات مكتملة',
      cancelledOrders: 'طلبات ملغاة',
      pendingOrders: 'طلبات قيد المعالجة',
      conversionRate: 'معدل التحويل (%)',
      cancellationRate: 'معدل الإلغاء (%)',
      totalCustomers: 'إجمالي العملاء',
      newCustomers: 'عملاء جدد',
      activeCustomers: 'عملاء نشطين',
      retentionRate: 'معدل الاحتفاظ (%)',
      customerLifetimeValue: 'القيمة الدائمة للعميل',
      avgProcessingTime: 'متوسط وقت المعالجة (أيام)',
      totalEmployees: 'إجمالي الموظفين',
      avgOrdersPerEmployee: 'متوسط الطلبات لكل موظف',
    };
    return labels[field] || field;
  }

  _getStatusLabel(status) {
    const labels = {
      pending: 'قيد الانتظار',
      confirmed: 'مؤكد',
      processing: 'قيد المعالجة',
      purchased: 'تم الشراء',
      shipped_abroad: 'شحن دولي',
      arrived_warehouse: 'وصل المخزن',
      customs_clearance: 'تخليص جمركي',
      shipped_local: 'شحن محلي',
      out_for_delivery: 'خارج للتوصيل',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي',
    };
    return labels[status] || status;
  }

  _formatValue(value) {
    if (typeof value === 'number') {
      return value.toFixed(2);
    }
    return value;
  }
}

export default new ExcelExportService();
