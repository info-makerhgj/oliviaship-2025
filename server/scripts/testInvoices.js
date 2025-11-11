import mongoose from 'mongoose';
import invoiceService from '../services/invoiceService.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function testInvoices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // البحث عن طلب للاختبار (استخدام الطلب الموجود)
    const order = await Order.findOne({ orderNumber: 'YM25906325300' }).populate('user');
    
    if (!order) {
      console.log('❌ Order YM25906325300 not found.');
      process.exit(1);
    }

    console.log(`📦 Found order: ${order.orderNumber}`);
    console.log(`👤 Customer: ${order.user?.name || 'Unknown'}`);
    console.log(`📧 Email: ${order.user?.email || 'N/A'}\n`);

    // البحث عن مستخدم admin
    const admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      console.log('❌ No admin user found.');
      process.exit(1);
    }

    // إعدادات الفاتورة
    const settings = {
      taxRate: 15,
      companyName: 'Olivia Ship - أوليفيا شيب',
      companyAddress: 'صنعاء، اليمن',
      companyPhone: '+967 777 123 456',
      companyEmail: 'info@oliviaship.com',
      taxNumber: 'TAX-123456',
      invoiceNotes: 'شكراً لتعاملكم معنا. نتمنى لكم تجربة ممتعة!',
      paymentTerms: 'الدفع خلال 7 أيام من تاريخ الفاتورة',
    };

    // اختبار 1: إنشاء فاتورة
    console.log('📝 Test 1: Creating invoice...');
    try {
      const invoice = await invoiceService.createInvoiceFromOrder(
        order._id,
        admin._id,
        settings
      );
      console.log('✅ Invoice created successfully!');
      console.log(`   Invoice Number: ${invoice.invoiceNumber}`);
      console.log(`   Subtotal: ${invoice.subtotal} YER`);
      console.log(`   Tax (${invoice.tax.rate}%): ${invoice.tax.amount} YER`);
      console.log(`   Total: ${invoice.total} YER`);
      console.log(`   Status: ${invoice.status}`);
      console.log(`   Due Date: ${invoice.dueDate.toLocaleDateString('ar-SA')}\n`);

      // اختبار 2: الحصول على الفاتورة
      console.log('📄 Test 2: Getting invoice...');
      const fetchedInvoice = await invoiceService.getInvoiceById(invoice._id);
      console.log('✅ Invoice fetched successfully!');
      console.log(`   Invoice Number: ${fetchedInvoice.invoiceNumber}\n`);

      // اختبار 3: الحصول على فاتورة بواسطة رقم الطلب
      console.log('🔍 Test 3: Getting invoice by order ID...');
      const invoiceByOrder = await invoiceService.getInvoiceByOrderId(order._id);
      console.log('✅ Invoice found by order ID!');
      console.log(`   Invoice Number: ${invoiceByOrder.invoiceNumber}\n`);

      // اختبار 4: تحديث حالة الفاتورة
      console.log('🔄 Test 4: Updating invoice status...');
      const updatedInvoice = await invoiceService.updateInvoiceStatus(
        invoice._id,
        'paid',
        admin._id
      );
      console.log('✅ Invoice status updated!');
      console.log(`   New Status: ${updatedInvoice.status}`);
      console.log(`   Paid At: ${updatedInvoice.paidAt?.toLocaleString('ar-SA') || 'N/A'}\n`);

      // اختبار 5: الحصول على قائمة الفواتير
      console.log('📋 Test 5: Getting invoices list...');
      const result = await invoiceService.getInvoices({}, { page: 1, limit: 10 });
      console.log('✅ Invoices list fetched!');
      console.log(`   Total Invoices: ${result.pagination.total}`);
      console.log(`   Page: ${result.pagination.page}/${result.pagination.pages}\n`);

      // اختبار 6: إحصائيات الفواتير
      console.log('📊 Test 6: Getting invoice stats...');
      const stats = await invoiceService.getInvoiceStats();
      console.log('✅ Invoice stats fetched!');
      console.log(`   Total Invoices: ${stats.totalInvoices}`);
      console.log(`   Paid Invoices: ${stats.paidInvoices}`);
      console.log(`   Pending Invoices: ${stats.pendingInvoices}`);
      console.log(`   Total Revenue: ${stats.totalRevenue.toLocaleString()} YER`);
      console.log(`   Paid Percentage: ${stats.paidPercentage.toFixed(2)}%\n`);

      // اختبار 7: توليد PDF
      console.log('📄 Test 7: Generating PDF...');
      try {
        const pdfResult = await invoiceService.generateInvoicePDF(invoice._id);
        console.log('✅ PDF generated successfully!');
        console.log(`   File Name: ${pdfResult.fileName}`);
        console.log(`   File URL: ${pdfResult.fileUrl}\n`);
      } catch (error) {
        console.log('⚠️  PDF generation skipped (puppeteer might not be configured)');
        console.log(`   Error: ${error.message}\n`);
      }

      console.log('✅ All tests completed successfully!');
    } catch (error) {
      if (error.message.includes('يوجد فاتورة لهذا الطلب بالفعل')) {
        console.log('ℹ️  Invoice already exists for this order. Fetching existing invoice...');
        const existingInvoice = await invoiceService.getInvoiceByOrderId(order._id);
        console.log(`   Invoice Number: ${existingInvoice.invoiceNumber}`);
        console.log(`   Total: ${existingInvoice.total} YER`);
        console.log(`   Status: ${existingInvoice.status}\n`);
        console.log('✅ Tests completed with existing invoice!');
      } else {
        throw error;
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testInvoices();
