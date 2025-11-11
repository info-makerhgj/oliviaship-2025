/**
 * إنشاء فاتورة تلقائياً للطلب بعد الدفع
 */
export async function createInvoiceForOrder(orderId, userId) {
  try {
    const invoiceService = (await import('../services/invoiceService.js')).default;
    
    // التحقق من عدم وجود فاتورة سابقة
    const existingInvoice = await invoiceService.getInvoiceByOrderId(orderId);
    
    if (!existingInvoice) {
      const invoice = await invoiceService.createInvoiceFromOrder(
        orderId,
        userId,
        {
          companyName: 'Olivia Ship - أوليفيا شيب',
          companyAddress: 'اليمن',
          companyPhone: '772515482',
          companyEmail: 'info@oliviaship.com',
          taxRate: 0,
          invoiceNotes: 'شكراً لتعاملكم معنا',
        }
      );
      console.log('✅ Invoice created automatically:', invoice.invoiceNumber, 'for order:', orderId);
      return invoice;
    } else {
      console.log('ℹ️ Invoice already exists for order:', orderId);
      return existingInvoice;
    }
  } catch (error) {
    console.error('❌ Failed to create invoice for order:', orderId, error.message);
    return null;
  }
}
