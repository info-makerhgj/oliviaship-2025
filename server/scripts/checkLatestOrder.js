import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import SmartCartOrder from '../models/SmartCartOrder.js';
import Invoice from '../models/Invoice.js';
import Payment from '../models/Payment.js';

async function checkLatestOrder() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // جلب آخر طلب
    const order = await SmartCartOrder.findOne().sort({ createdAt: -1 });
    
    if (!order) {
      console.log('❌ No orders found');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n📦 Latest Order:');
    console.log('  Order Number:', order.orderNumber);
    console.log('  Order ID:', order._id);
    console.log('  Status:', order.status);
    console.log('  Payment Status:', order.payment?.status);
    console.log('  Created:', order.createdAt);

    // البحث عن الدفعة
    const payment = await Payment.findOne({ smartCartOrder: order._id });
    console.log('\n💳 Payment:');
    if (payment) {
      console.log('  Payment ID:', payment._id);
      console.log('  Method:', payment.method);
      console.log('  Status:', payment.status);
      console.log('  Amount:', payment.amount, payment.currency);
      console.log('  Paid At:', payment.paidAt);
    } else {
      console.log('  ❌ No payment found');
    }

    // البحث عن الفاتورة
    const invoice = await Invoice.findOne({ orderId: order._id });
    console.log('\n📄 Invoice:');
    if (invoice) {
      console.log('  Invoice Number:', invoice.invoiceNumber);
      console.log('  Invoice ID:', invoice._id);
      console.log('  Status:', invoice.status);
      console.log('  Total (SAR):', invoice.total);
      console.log('  Total (YER):', invoice.totalInYER);
      console.log('  Items:', invoice.items.length);
      console.log('  Created:', invoice.createdAt);
    } else {
      console.log('  ❌ No invoice found');
      console.log('\n🔄 Creating invoice now...');
      
      const { createInvoiceForOrder } = await import('../utils/autoInvoice.js');
      const newInvoice = await createInvoiceForOrder(order._id, order.user);
      
      if (newInvoice) {
        console.log('  ✅ Invoice created:', newInvoice.invoiceNumber);
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkLatestOrder();
