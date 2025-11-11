import invoiceService from '../services/invoiceService.js';
import { catchAsync } from '../utils/catchAsync.js';
import { AppError } from '../utils/appError.js';

/**
 * إنشاء فاتورة من طلب
 */
export const createInvoice = catchAsync(async (req, res) => {
  const { orderId, taxRate, companyInfo, notes, terms } = req.body;

  if (!orderId) {
    throw new AppError('رقم الطلب مطلوب', 400);
  }

  const settings = {
    taxRate,
    ...companyInfo,
    invoiceNotes: notes,
    paymentTerms: terms,
  };

  const invoice = await invoiceService.createInvoiceFromOrder(
    orderId,
    req.user._id,
    settings
  );

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الفاتورة بنجاح',
    data: invoice,
  });
});

/**
 * الحصول على فاتورة بالمعرف
 */
export const getInvoice = catchAsync(async (req, res) => {
  const invoice = await invoiceService.getInvoiceById(req.params.id);

  res.status(200).json({
    success: true,
    data: invoice,
  });
});

/**
 * الحصول على فاتورة بواسطة رقم الطلب
 */
export const getInvoiceByOrder = catchAsync(async (req, res) => {
  const invoice = await invoiceService.getInvoiceByOrderId(req.params.orderId);

  if (!invoice) {
    return res.status(404).json({
      success: false,
      message: 'لا توجد فاتورة لهذا الطلب',
    });
  }

  res.status(200).json({
    success: true,
    data: invoice,
  });
});

/**
 * الحصول على قائمة الفواتير
 */
export const getInvoices = catchAsync(async (req, res) => {
  const { status, customer, startDate, endDate, page, limit, sort } = req.query;

  const filters = { status, customer, startDate, endDate };
  const options = { page: parseInt(page) || 1, limit: parseInt(limit) || 10, sort };

  const result = await invoiceService.getInvoices(filters, options);

  res.status(200).json({
    success: true,
    data: result.invoices,
    pagination: result.pagination,
  });
});

/**
 * تحديث حالة الفاتورة
 */
export const updateInvoiceStatus = catchAsync(async (req, res) => {
  const { status } = req.body;

  if (!status) {
    throw new AppError('حالة الفاتورة مطلوبة', 400);
  }

  const invoice = await invoiceService.updateInvoiceStatus(
    req.params.id,
    status,
    req.user._id
  );

  res.status(200).json({
    success: true,
    message: 'تم تحديث حالة الفاتورة بنجاح',
    data: invoice,
  });
});

/**
 * إلغاء فاتورة
 */
export const cancelInvoice = catchAsync(async (req, res) => {
  const { reason } = req.body;

  if (!reason) {
    throw new AppError('سبب الإلغاء مطلوب', 400);
  }

  const invoice = await invoiceService.cancelInvoice(req.params.id, reason, req.user._id);

  res.status(200).json({
    success: true,
    message: 'تم إلغاء الفاتورة بنجاح',
    data: invoice,
  });
});

/**
 * إرسال فاتورة بالإيميل
 */
export const sendInvoiceEmail = catchAsync(async (req, res) => {
  const result = await invoiceService.sendInvoiceEmail(req.params.id);

  res.status(200).json({
    success: true,
    message: 'تم إرسال الفاتورة بالإيميل بنجاح',
    data: result,
  });
});

/**
 * توليد PDF للفاتورة
 */
export const generateInvoicePDF = catchAsync(async (req, res) => {
  const result = await invoiceService.generateInvoicePDF(req.params.id);

  res.status(200).json({
    success: true,
    message: 'تم توليد PDF بنجاح',
    data: result,
  });
});

/**
 * تحميل PDF للفاتورة
 */
export const downloadInvoicePDF = catchAsync(async (req, res) => {
  const result = await invoiceService.downloadInvoicePDF(req.params.id);

  res.download(result.filePath, result.fileName);
});

/**
 * تحميل فاتورة بواسطة رقم الطلب (للعميل)
 */
export const downloadInvoiceByOrder = catchAsync(async (req, res) => {
  const invoice = await invoiceService.getInvoiceByOrderId(req.params.orderId);

  if (!invoice) {
    throw new AppError('لا توجد فاتورة لهذا الطلب', 404);
  }

  // التحقق من أن المستخدم يملك هذا الطلب
  // Allow if user is admin, employee, or the customer who owns the invoice
  // Handle both ObjectId and populated object
  const customerIdStr = invoice.customerId?._id 
    ? invoice.customerId._id.toString() 
    : invoice.customerId?.toString();
  
  const isOwner = customerIdStr === req.user._id.toString();
  const isAuthorized = req.user.role === 'admin' || req.user.role === 'employee' || isOwner;
  
  if (!isAuthorized) {
    throw new AppError('غير مصرح لك بتحميل هذه الفاتورة', 403);
  }

  const result = await invoiceService.downloadInvoicePDF(invoice._id);

  // Set headers to force download instead of opening in browser
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${result.fileName}"`);
  
  res.download(result.filePath, result.fileName);
});

/**
 * الحصول على إحصائيات الفواتير
 */
export const getInvoiceStats = catchAsync(async (req, res) => {
  const { startDate, endDate } = req.query;

  const stats = await invoiceService.getInvoiceStats(startDate, endDate);

  res.status(200).json({
    success: true,
    data: stats,
  });
});

/**
 * تحديث الفواتير المتأخرة
 */
export const updateOverdueInvoices = catchAsync(async (req, res) => {
  const result = await invoiceService.updateOverdueInvoices();

  res.status(200).json({
    success: true,
    message: `تم تحديث ${result.modifiedCount} فاتورة متأخرة`,
    data: result,
  });
});
