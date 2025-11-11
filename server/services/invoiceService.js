import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { AppError } from '../utils/appError.js';

class InvoiceService {
  /**
   * إنشاء فاتورة من طلب
   */
  async createInvoiceFromOrder(orderId, userId, settings = {}) {
    try {
      // التحقق من وجود الطلب - جرب كلا النموذجين
      let order = await Order.findById(orderId).populate('user', 'name email phone');
      let userId = null;
      
      // إذا لم يُعثر عليه في orders، جرب smart cart orders
      if (!order) {
        const SmartCartOrder = (await import('../models/SmartCartOrder.js')).default;
        order = await SmartCartOrder.findById(orderId);
        
        if (order && order.user) {
          // حفظ user ID قبل populate
          userId = order.user;
          
          // محاولة populate
          const User = (await import('../models/User.js')).default;
          const user = await User.findById(order.user);
          if (user) {
            order.user = user;
          }
        }
      } else {
        userId = order.user?._id || order.user;
      }
      
      if (!order) {
        throw new AppError('الطلب غير موجود', 404);
      }

      // التحقق من عدم وجود فاتورة سابقة
      const existingInvoice = await Invoice.findOne({ orderId: orderId });
      if (existingInvoice) {
        throw new AppError('يوجد فاتورة لهذا الطلب بالفعل', 400);
      }

      // توليد رقم فاتورة
      const invoiceNumber = await Invoice.generateInvoiceNumber();

      // إنشاء عناصر الفاتورة - نفس ملخص الطلب بالضبط
      const items = [];
      const currency = 'SAR'; // العملة الأساسية
      
      // التحقق من نوع الطلب
      if (order.products && Array.isArray(order.products) && order.products.length > 0) {
        // SmartCartOrder - منتجات متعددة
        for (const product of order.products) {
          const productName = product.name || product.title || 'منتج';
          const productQuantity = product.quantity || 1;
          const productPrice = product.price || 0;
          
          items.push({
            description: productName,
            quantity: productQuantity,
            unitPrice: productPrice,
            total: productPrice * productQuantity,
          });
        }
      } else if (order.product) {
        // Order عادي - منتج واحد
        const productName = order.product.name || order.product.title || 'منتج';
        const productQuantity = order.product.quantity || 1;
        const productPrice = order.product.price || 0;
        
        items.push({
          description: productName,
          quantity: productQuantity,
          unitPrice: productPrice,
          total: productPrice * productQuantity,
        });
      }

      // حساب المجموع الفرعي (سعر المنتجات فقط)
      let subtotal = order.pricing?.subtotal || items.reduce((sum, item) => sum + item.total, 0);

      // إضافة العمولة إذا وجدت
      if (order.pricing?.commission && order.pricing.commission > 0) {
        items.push({
          description: 'العمولة',
          quantity: 1,
          unitPrice: order.pricing.commission,
          total: order.pricing.commission,
        });
      }

      // إضافة الجمارك إذا وجدت
      if (order.pricing?.customsFees && order.pricing.customsFees > 0) {
        items.push({
          description: 'الجمارك',
          quantity: 1,
          unitPrice: order.pricing.customsFees,
          total: order.pricing.customsFees,
        });
      }

      // إضافة رسوم الشحن إذا وجدت
      if (order.pricing?.shippingCost && order.pricing.shippingCost > 0) {
        items.push({
          description: 'رسوم الشحن',
          quantity: 1,
          unitPrice: order.pricing.shippingCost,
          total: order.pricing.shippingCost,
        });
      }

      // إضافة رسوم المعالجة إذا وجدت
      if (order.pricing?.processingFee && order.pricing.processingFee > 0) {
        items.push({
          description: 'رسوم المعالجة',
          quantity: 1,
          unitPrice: order.pricing.processingFee,
          total: order.pricing.processingFee,
        });
      }

      // إضافة رسوم المناولة إذا وجدت
      if (order.pricing?.handlingFee && order.pricing.handlingFee > 0) {
        items.push({
          description: 'رسوم المناولة',
          quantity: 1,
          unitPrice: order.pricing.handlingFee,
          total: order.pricing.handlingFee,
        });
      }

      // إضافة رسوم التأمين إذا وجدت
      if (order.pricing?.insuranceFee && order.pricing.insuranceFee > 0) {
        items.push({
          description: 'رسوم التأمين',
          quantity: 1,
          unitPrice: order.pricing.insuranceFee,
          total: order.pricing.insuranceFee,
        });
      }

      // إضافة رسوم التغليف إذا وجدت
      if (order.pricing?.packagingFee && order.pricing.packagingFee > 0) {
        items.push({
          description: 'رسوم التغليف',
          quantity: 1,
          unitPrice: order.pricing.packagingFee,
          total: order.pricing.packagingFee,
        });
      }

      // المجموع بالريال السعودي
      const totalSAR = order.pricing?.totalCost || items.reduce((sum, item) => sum + item.total, 0);
      
      // المجموع بالريال اليمني
      const totalYER = order.pricing?.totalInYER || totalSAR;

      // حساب الضريبة (إذا كانت مطلوبة)
      const taxRate = settings.taxRate || 0;
      let taxAmount = 0;
      
      if (taxRate > 0) {
        taxAmount = this.calculateTax(totalSAR, taxRate);
      }

      // معلومات الشركة من الإعدادات
      const companyInfo = {
        name: settings.companyName || 'Olivia Ship - أوليفيا شيب',
        address: settings.companyAddress || 'اليمن',
        phone: settings.companyPhone || '',
        email: settings.companyEmail || 'info@oliviaship.com',
        taxId: settings.taxNumber || '',
        logo: settings.companyLogo || '',
      };

      // معلومات العميل
      const customerInfo = {
        name: order.user?.name || 'عميل',
        email: order.user?.email || '',
        phone: order.user?.phone || '',
        address: order.delivery?.address
          ? `${order.delivery.address.street || ''}, ${order.delivery.address.city || ''}, ${order.delivery.address.governorate || ''}`
          : '',
      };

      // إنشاء الفاتورة
      const customerId = order.user?._id || userId;
      
      if (!customerId) {
        throw new AppError('لا يمكن العثور على معرف العميل', 400);
      }
      
      const invoice = await Invoice.create({
        invoiceNumber,
        orderId: orderId,
        customerId: customerId,
        items,
        subtotal,
        tax: {
          rate: taxRate,
          amount: taxAmount,
        },
        total: totalSAR,
        currency: 'SAR',
        totalInYER: totalYER,
        conversionRate: totalYER / totalSAR,
        status: order.payment?.status === 'paid' ? 'paid' : 'draft',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 أيام
        companyInfo,
        customerInfo,
        notes: settings.invoiceNotes || 'شكراً لتعاملكم معنا',
      });

      return invoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      throw error;
    }
  }

  /**
   * حساب الضريبة
   */
  calculateTax(amount, taxRate) {
    if (!taxRate || taxRate <= 0) return 0;
    return Math.round((amount * taxRate) / 100);
  }

  /**
   * الحصول على فاتورة بالمعرف
   */
  async getInvoiceById(invoiceId) {
    const invoice = await Invoice.findById(invoiceId)
      .populate('orderId')
      .populate('customerId', 'name email phone');

    if (!invoice) {
      throw new AppError('الفاتورة غير موجودة', 404);
    }

    return invoice;
  }

  /**
   * الحصول على فاتورة بواسطة رقم الطلب
   */
  async getInvoiceByOrderId(orderId) {
    const invoice = await Invoice.findOne({ orderId: orderId })
      .populate('orderId')
      .populate('customerId', 'name email phone');

    return invoice;
  }

  /**
   * الحصول على قائمة الفواتير
   */
  async getInvoices(filters = {}, options = {}) {
    const { status, customer, startDate, endDate } = filters;
    const { page = 1, limit = 10, sort = '-createdAt' } = options;

    const query = {};

    if (status) query.status = status;
    if (customer) query.customerId = customer;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const [invoices, total] = await Promise.all([
      Invoice.find(query)
        .populate('orderId', 'orderNumber status')
        .populate('customerId', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Invoice.countDocuments(query),
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * تحديث حالة الفاتورة
   */
  async updateInvoiceStatus(invoiceId, status, userId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new AppError('الفاتورة غير موجودة', 404);
    }

    const validStatuses = ['pending', 'paid', 'overdue', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      throw new AppError('حالة الفاتورة غير صحيحة', 400);
    }

    invoice.status = status;

    // تحديث تاريخ الدفع إذا كانت الحالة مدفوعة
    if (status === 'paid' && !invoice.paidAt) {
      invoice.paidAt = new Date();
    }

    await invoice.save();

    return invoice;
  }

  /**
   * إلغاء فاتورة
   */
  async cancelInvoice(invoiceId, reason, userId) {
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      throw new AppError('الفاتورة غير موجودة', 404);
    }

    if (invoice.status === 'paid') {
      throw new AppError('لا يمكن إلغاء فاتورة مدفوعة', 400);
    }

    invoice.status = 'cancelled';
    invoice.notes = `${invoice.notes}\n\nسبب الإلغاء: ${reason}`;
    await invoice.save();

    return invoice;
  }

  /**
   * إرسال فاتورة بالإيميل
   */
  async sendInvoiceEmail(invoiceId) {
    const invoice = await this.getInvoiceById(invoiceId);
    
    // التحقق من وجود إيميل العميل
    if (!invoice.customerInfo?.email) {
      throw new AppError('لا يوجد إيميل للعميل', 400);
    }
    
    // توليد PDF إذا لم يكن موجوداً
    let pdfPath = null;
    if (!invoice.pdfUrl) {
      const pdfResult = await this.generateInvoicePDF(invoiceId);
      pdfPath = pdfResult.filePath;
    } else {
      // استخدام PDF الموجود
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const { dirname } = await import('path');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      pdfPath = path.join(__dirname, '../../uploads/invoices', invoice.pdfUrl.split('/').pop());
    }
    
    // إرسال الإيميل
    const emailService = await import('../utils/emailService.js');
    const result = await emailService.sendInvoiceEmail(invoice, pdfPath);
    
    if (result.success) {
      // تحديث تاريخ الإرسال
      invoice.sentAt = new Date();
      if (invoice.status === 'draft') {
        invoice.status = 'sent';
      }
      await invoice.save();
    }
    
    return result;
  }

  /**
   * توليد PDF للفاتورة
   */
  async generateInvoicePDF(invoiceId) {
    const invoice = await this.getInvoiceById(invoiceId);
    
    // استيراد خدمة PDF
    const invoicePDF = (await import('../utils/invoicePDF.js')).default;
    
    // توليد PDF
    const result = await invoicePDF.generateInvoicePDF(invoice);
    
    // تحديث الفاتورة بمعلومات الملف
    invoice.pdfUrl = result.fileUrl;
    await invoice.save();
    
    return result;
  }

  /**
   * تحميل PDF للفاتورة
   */
  async downloadInvoicePDF(invoiceId) {
    const invoice = await this.getInvoiceById(invoiceId);
    
    // إذا لم يكن هناك PDF، نولده
    if (!invoice.pdfUrl) {
      await this.generateInvoicePDF(invoiceId);
      // إعادة جلب الفاتورة بعد التحديث
      const updatedInvoice = await this.getInvoiceById(invoiceId);
      
      const path = await import('path');
      const { fileURLToPath } = await import('url');
      const { dirname } = await import('path');
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      
      const fileName = updatedInvoice.pdfUrl.split('/').pop();
      const fullPath = path.join(__dirname, '../../uploads/invoices', fileName);
      
      return {
        filePath: fullPath,
        fileName: `invoice_${updatedInvoice.invoiceNumber}.pdf`,
      };
    }
    
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const { dirname } = await import('path');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    
    const fileName = invoice.pdfUrl.split('/').pop();
    const fullPath = path.join(__dirname, '../../uploads/invoices', fileName);
    
    return {
      filePath: fullPath,
      fileName: `invoice_${invoice.invoiceNumber}.pdf`,
    };
  }

  /**
   * حساب إحصائيات الفواتير
   */
  async getInvoiceStats(startDate, endDate) {
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const [totalInvoices, paidInvoices, pendingInvoices, overdueInvoices, totalRevenue] =
      await Promise.all([
        Invoice.countDocuments(query),
        Invoice.countDocuments({ ...query, status: 'paid' }),
        Invoice.countDocuments({ ...query, status: 'pending' }),
        Invoice.countDocuments({ ...query, status: 'overdue' }),
        Invoice.aggregate([
          { $match: { ...query, status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ]),
      ]);

    return {
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      totalRevenue: totalRevenue[0]?.total || 0,
      paidPercentage: totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0,
    };
  }

  /**
   * تحديث الفواتير المتأخرة
   */
  async updateOverdueInvoices() {
    const now = new Date();
    const result = await Invoice.updateMany(
      {
        status: 'pending',
        dueDate: { $lt: now },
      },
      {
        $set: { status: 'overdue' },
      }
    );

    return result;
  }
}

export default new InvoiceService();
