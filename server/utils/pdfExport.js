import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Helper function to format Arabic text for PDF display
function formatArabicForPDF(text) {
  if (!text) return '';
  
  // Check if text contains Arabic characters
  const hasArabic = /[\u0600-\u06FF]/.test(text);
  if (!hasArabic) return text;
  
  // For mixed content (Arabic + numbers/English), keep as is
  // jsPDF will handle RTL automatically with proper font
  return text;
}

class PDFExportService {
  /**
   * تصدير تقرير إلى PDF
   */
  async exportReport(report) {
    try {
      // Use require for jsPDF to avoid constructor issues
      const { jsPDF } = require('jspdf');
      const autoTable = require('jspdf-autotable').default;
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let yPosition = 15;

      // Header with colored background
      doc.setFillColor(14, 165, 233);
      doc.rect(0, 0, 210, 40, 'F');
      
      // Title
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text(this._getTypeLabel(report.type), 105, 20, { align: 'center' });
      
      // Report info
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      const startDate = new Date(report.period.start).toLocaleDateString('en-US');
      const endDate = new Date(report.period.end).toLocaleDateString('en-US');
      doc.text(`Period: ${startDate} - ${endDate}`, 105, 28, { align: 'center' });
      
      const generatedDate = new Date(report.createdAt).toLocaleString('en-US');
      doc.text(`Generated: ${generatedDate}`, 105, 35, { align: 'center' });
      
      // Reset text color
      doc.setTextColor(0, 0, 0);
      yPosition = 50;

      // Summary section
      doc.setFontSize(16);
      doc.setTextColor(14, 165, 233);
      doc.text('Summary', 20, yPosition);
      doc.setTextColor(0, 0, 0);
      yPosition += 2;
      
      // Add line under title
      doc.setDrawColor(14, 165, 233);
      doc.setLineWidth(0.5);
      doc.line(20, yPosition, 190, yPosition);
      yPosition += 8;

      const summaryData = Object.entries(report.data.summary).map(([key, value]) => [
        this._getFieldLabel(key),
        this._formatValue(key, value),
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Metric', 'Value']],
        body: summaryData,
        theme: 'striped',
        styles: { 
          fontSize: 11,
          cellPadding: 5,
        },
        headStyles: { 
          fillColor: [14, 165, 233],
          fontSize: 12,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 100 },
          1: { halign: 'right', cellWidth: 70 },
        },
      });

      // Get the final Y position after the table
      yPosition = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : yPosition + 50;

      // التفاصيل حسب نوع التقرير
      if (report.type === 'revenue') {
        this._addRevenueDetails(doc, report.data, yPosition);
      } else if (report.type === 'sales') {
        this._addSalesDetails(doc, report.data, yPosition);
      } else if (report.type === 'customer') {
        this._addCustomerDetails(doc, report.data, yPosition);
      } else if (report.type === 'performance') {
        this._addPerformanceDetails(doc, report.data, yPosition);
      }

      // حفظ الملف
      const fileName = `report_${report._id}_${Date.now()}.pdf`;
      const uploadsDir = path.join(__dirname, '../../uploads/reports');

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filePath = path.join(uploadsDir, fileName);
      doc.save(filePath);

      return {
        fileName,
        filePath,
        fileUrl: `/uploads/reports/${fileName}`,
      };
    } catch (error) {
      console.error('Error exporting PDF:', error);
      throw error;
    }
  }

  /**
   * إضافة تفاصيل الإيرادات
   */
  _addRevenueDetails(doc, data, startY) {
    // Section title
    doc.setFontSize(16);
    doc.setTextColor(14, 165, 233);
    doc.text('Revenue Details', 20, startY);
    doc.setTextColor(0, 0, 0);
    
    // Add line
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.5);
    doc.line(20, startY + 2, 190, startY + 2);

    const storeData = Object.entries(data.details.revenueByStore || {}).map(([store, info]) => [
      store.toUpperCase(),
      `YER ${info.revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      info.orders.toLocaleString('en-US'),
      `YER ${(info.revenue / info.orders).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    ]);

    const autoTable = require('jspdf-autotable').default;
    autoTable(doc, {
      startY: startY + 8,
      head: [['Store', 'Revenue', 'Orders', 'Avg Order Value']],
      body: storeData.length > 0 ? storeData : [['No data available', '-', '-', '-']],
      theme: 'striped',
      styles: { 
        fontSize: 10,
        cellPadding: 4,
      },
      headStyles: { 
        fillColor: [14, 165, 233],
        fontSize: 11,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' },
        2: { halign: 'center' },
        3: { halign: 'right' },
      },
    });
  }

  /**
   * إضافة تفاصيل المبيعات
   */
  _addSalesDetails(doc, data, startY) {
    // Orders by Status
    doc.setFontSize(16);
    doc.setTextColor(14, 165, 233);
    doc.text('Orders by Status', 20, startY);
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.5);
    doc.line(20, startY + 2, 190, startY + 2);

    const statusData = Object.entries(data.details.ordersByStatus || {}).map(([status, count]) => [
      this._getStatusLabel(status),
      count.toLocaleString('en-US'),
    ]);

    const autoTable = require('jspdf-autotable').default;
    autoTable(doc, {
      startY: startY + 8,
      head: [['Status', 'Count']],
      body: statusData.length > 0 ? statusData : [['No data available', '-']],
      theme: 'striped',
      styles: { 
        fontSize: 10,
        cellPadding: 4,
      },
      headStyles: { 
        fillColor: [14, 165, 233],
        fontSize: 11,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 100 },
        1: { halign: 'center', cellWidth: 70 },
      },
    });

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : startY + 50;

    // Top Products
    if (finalY < 250 && data.details.topProducts && data.details.topProducts.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(14, 165, 233);
      doc.text('Top Products', 20, finalY);
      doc.setTextColor(0, 0, 0);
      doc.line(20, finalY + 2, 190, finalY + 2);

      const productData = data.details.topProducts.slice(0, 10).map((product) => [
        product.name || 'Unknown',
        product.count.toLocaleString('en-US'),
      ]);

      autoTable(doc, {
        startY: finalY + 8,
        head: [['Product', 'Orders']],
        body: productData,
        theme: 'striped',
        styles: { 
          fontSize: 10,
          cellPadding: 4,
        },
        headStyles: { 
          fillColor: [14, 165, 233],
          fontSize: 11,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [245, 247, 250],
        },
        columnStyles: {
          0: { cellWidth: 130 },
          1: { halign: 'center', cellWidth: 40 },
        },
      });
    }
  }

  /**
   * إضافة تفاصيل العملاء
   */
  _addCustomerDetails(doc, data, startY) {
    doc.setFontSize(16);
    doc.setTextColor(14, 165, 233);
    doc.text('Top Customers', 20, startY);
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.5);
    doc.line(20, startY + 2, 190, startY + 2);

    const customerData = (data.details.topCustomers || []).slice(0, 15).map((customer) => [
      customer.name || 'Unknown',
      customer.email || '-',
      `YER ${customer.totalSpent.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      customer.orderCount.toLocaleString('en-US'),
    ]);

    const autoTable = require('jspdf-autotable').default;
    autoTable(doc, {
      startY: startY + 8,
      head: [['Name', 'Email', 'Total Spent', 'Orders']],
      body: customerData.length > 0 ? customerData : [['No data available', '-', '-', '-']],
      theme: 'striped',
      styles: { 
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: { 
        fillColor: [14, 165, 233],
        fontSize: 10,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 60 },
        2: { halign: 'right', cellWidth: 45 },
        3: { halign: 'center', cellWidth: 30 },
      },
    });
  }

  /**
   * إضافة تفاصيل الأداء
   */
  _addPerformanceDetails(doc, data, startY) {
    doc.setFontSize(16);
    doc.setTextColor(14, 165, 233);
    doc.text('Employee Performance', 20, startY);
    doc.setTextColor(0, 0, 0);
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.5);
    doc.line(20, startY + 2, 190, startY + 2);

    const empData = (data.details.employeePerformance || []).map((emp) => [
      emp.name || 'Unknown',
      emp.totalOrders.toLocaleString('en-US'),
      emp.completedOrders.toLocaleString('en-US'),
      emp.cancelledOrders.toLocaleString('en-US'),
      `${((emp.completedOrders / emp.totalOrders) * 100).toFixed(1)}%`,
    ]);

    const autoTable = require('jspdf-autotable').default;
    autoTable(doc, {
      startY: startY + 8,
      head: [['Name', 'Total', 'Completed', 'Cancelled', 'Success Rate']],
      body: empData.length > 0 ? empData : [['No data available', '-', '-', '-', '-']],
      theme: 'striped',
      styles: { 
        fontSize: 10,
        cellPadding: 4,
      },
      headStyles: { 
        fillColor: [14, 165, 233],
        fontSize: 11,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'center', cellWidth: 35 },
        3: { halign: 'center', cellWidth: 35 },
        4: { halign: 'center', cellWidth: 30 },
      },
    });
  }

  /**
   * دوال مساعدة
   */
  _getTypeLabel(type) {
    const labels = {
      revenue: 'Revenue Report',
      sales: 'Sales Report',
      customer: 'Customer Report',
      performance: 'Performance Report',
    };
    return labels[type] || type;
  }

  _getFieldLabel(field) {
    const labels = {
      totalRevenue: 'Total Revenue',
      totalOrders: 'Total Orders',
      averageOrderValue: 'Average Order Value',
      growthRate: 'Growth Rate (%)',
      previousRevenue: 'Previous Period Revenue',
      completedOrders: 'Completed Orders',
      cancelledOrders: 'Cancelled Orders',
      pendingOrders: 'Pending Orders',
      conversionRate: 'Conversion Rate (%)',
      cancellationRate: 'Cancellation Rate (%)',
      totalCustomers: 'Total Customers',
      newCustomers: 'New Customers',
      activeCustomers: 'Active Customers',
      retentionRate: 'Retention Rate (%)',
      customerLifetimeValue: 'Customer Lifetime Value',
      avgProcessingTime: 'Avg Processing Time (days)',
      totalEmployees: 'Total Employees',
      avgOrdersPerEmployee: 'Avg Orders/Employee',
    };
    return labels[field] || field;
  }

  _getStatusLabel(status) {
    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      processing: 'Processing',
      purchased: 'Purchased',
      shipped_abroad: 'Shipped Abroad',
      arrived_warehouse: 'Arrived Warehouse',
      customs_clearance: 'Customs Clearance',
      shipped_local: 'Shipped Local',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      cancelled: 'Cancelled',
      shipped: 'Shipped',
      in_transit: 'In Transit',
      arrived: 'Arrived',
    };
    return labels[status] || status;
  }

  _formatValue(key, value) {
    if (typeof value === 'number') {
      // Format percentages
      if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('percentage')) {
        return `${value.toFixed(2)}%`;
      }
      // Format currency
      if (key.toLowerCase().includes('revenue') || key.toLowerCase().includes('value') || 
          key.toLowerCase().includes('spent') || key.toLowerCase().includes('amount')) {
        return `YER ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      // Format regular numbers
      if (key.toLowerCase().includes('time') || key.toLowerCase().includes('days')) {
        return `${value.toFixed(1)} days`;
      }
      return value.toLocaleString('en-US');
    }
    return value?.toString() || '-';
  }
}

export default new PDFExportService();
