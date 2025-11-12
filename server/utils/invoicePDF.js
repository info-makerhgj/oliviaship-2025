import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import handlebars from 'handlebars';
// import puppeteer from 'puppeteer'; // Disabled for Railway deployment

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Register Handlebars helpers
handlebars.registerHelper('formatDate', function (date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

handlebars.registerHelper('formatCurrency', function (amount) {
  if (!amount) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
});

handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

class InvoicePDFService {
  /**
   * توليد PDF من فاتورة
   */
  async generateInvoicePDF(invoice) {
    try {
      // قراءة قالب HTML
      const templatePath = path.join(__dirname, '../templates/invoice.hbs');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      // تحويل الفاتورة إلى plain object لتجنب مشاكل Handlebars
      const invoiceObj = invoice.toObject ? invoice.toObject() : invoice;
      
      // تحضير البيانات للقالب
      const data = {
        invoiceNumber: invoiceObj.invoiceNumber,
        createdAt: invoiceObj.createdAt,
        dueDate: invoiceObj.dueDate,
        status: invoiceObj.status,
        companyInfo: invoiceObj.companyInfo || {},
        customerInfo: invoiceObj.customerInfo || {},
        items: (invoiceObj.items || []).map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })),
        subtotal: invoiceObj.subtotal || 0,
        taxRate: invoiceObj.tax?.rate || 0,
        taxAmount: invoiceObj.tax?.amount || 0,
        total: invoiceObj.total || 0,
        currency: invoiceObj.currency || 'SAR',
        totalInYER: invoiceObj.totalInYER || 0,
        conversionRate: invoiceObj.conversionRate || 0,
        notes: invoiceObj.notes || '',
        terms: invoiceObj.terms || '',
      };

      // توليد HTML من القالب
      const html = template(data);

      // إنشاء مجلد التحميلات إذا لم يكن موجوداً
      const uploadsDir = path.join(__dirname, '../../uploads/invoices');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      // اسم الملف
      const fileName = `invoice_${invoice.invoiceNumber}_${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      // توليد PDF باستخدام Puppeteer (معطل مؤقتاً للـ deployment)
      // TODO: Enable puppeteer after configuring Railway with Chrome
      throw new Error('PDF generation temporarily disabled - puppeteer not configured on Railway');

      return {
        fileName,
        filePath,
        fileUrl: `/uploads/invoices/${fileName}`,
      };
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      throw error;
    }
  }

  /**
   * توليد HTML للمعاينة (بدون PDF)
   */
  async generateInvoiceHTML(invoice) {
    try {
      const templatePath = path.join(__dirname, '../templates/invoice.hbs');
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = handlebars.compile(templateSource);

      // تحويل الفاتورة إلى plain object لتجنب مشاكل Handlebars
      const invoiceObj = invoice.toObject ? invoice.toObject() : invoice;
      
      const data = {
        invoiceNumber: invoiceObj.invoiceNumber,
        createdAt: invoiceObj.createdAt,
        dueDate: invoiceObj.dueDate,
        status: invoiceObj.status,
        companyInfo: invoiceObj.companyInfo || {},
        customerInfo: invoiceObj.customerInfo || {},
        items: (invoiceObj.items || []).map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total
        })),
        subtotal: invoiceObj.subtotal || 0,
        taxRate: invoiceObj.tax?.rate || 0,
        taxAmount: invoiceObj.tax?.amount || 0,
        total: invoiceObj.total || 0,
        currency: invoiceObj.currency || 'SAR',
        totalInYER: invoiceObj.totalInYER || 0,
        conversionRate: invoiceObj.conversionRate || 0,
        notes: invoiceObj.notes || '',
        terms: invoiceObj.terms || '',
      };

      return template(data);
    } catch (error) {
      console.error('Error generating invoice HTML:', error);
      throw error;
    }
  }

  /**
   * حذف ملف PDF
   */
  async deleteInvoicePDF(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting invoice PDF:', error);
      return false;
    }
  }
}

export default new InvoicePDFService();
