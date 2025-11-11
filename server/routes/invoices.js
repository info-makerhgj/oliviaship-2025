import express from 'express';
import * as invoiceController from '../controllers/invoiceController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// جميع المسارات تتطلب تسجيل الدخول
router.use(protect);

// إحصائيات الفواتير
router.get('/stats', authorize('admin', 'employee'), invoiceController.getInvoiceStats);

// تحديث الفواتير المتأخرة
router.post(
  '/update-overdue',
  authorize('admin'),
  invoiceController.updateOverdueInvoices
);

// الحصول على قائمة الفواتير
router.get('/', authorize('admin', 'employee'), invoiceController.getInvoices);

// إنشاء فاتورة جديدة
router.post('/', authorize('admin', 'employee'), invoiceController.createInvoice);

// الحصول على فاتورة بواسطة رقم الطلب
router.get('/order/:orderId', invoiceController.getInvoiceByOrder);

// تحميل فاتورة بواسطة رقم الطلب (للعميل)
router.get('/order/:orderId/download', invoiceController.downloadInvoiceByOrder);

// الحصول على فاتورة بالمعرف
router.get('/:id', invoiceController.getInvoice);

// تحديث حالة الفاتورة
router.patch('/:id/status', authorize('admin', 'employee'), invoiceController.updateInvoiceStatus);

// إلغاء فاتورة
router.post('/:id/cancel', authorize('admin'), invoiceController.cancelInvoice);

// إرسال فاتورة بالإيميل
router.post('/:id/send-email', authorize('admin', 'employee'), invoiceController.sendInvoiceEmail);

// توليد PDF للفاتورة
router.post('/:id/generate-pdf', authorize('admin', 'employee'), invoiceController.generateInvoicePDF);

// تحميل PDF للفاتورة
router.get('/:id/download', invoiceController.downloadInvoicePDF);

export default router;
