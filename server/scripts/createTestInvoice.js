import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import invoiceService from '../services/invoiceService.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

async function createTestInvoice() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // جلب أول طلب
    const order = await Order.findOne();
    
    if (!order) {
      console.log('❌ No orders found');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n📦 Creating invoice for order:', order.orderNumber);
    console.log('🛍️ Product:', order.product?.name);
    console.log('💰 Price:', order.product?.price);
    console.log('📊 Total:', order.totalAmount);

    // إنشاء فاتورة
    const invoice = await invoiceService.createInvoiceFromOrder(
      order._id,
      order.user,
      {
        companyName: 'Olivia Ship - أوليفيا شيب',
        companyAddress: 'اليمن',
        companyPhone: '772515482',
        companyEmail: 'info@oliviaship.com',
        taxRate: 0,
        invoiceNotes: 'شكراً لتعاملكم معنا',
      }
    );

    console.log('\n✅ Invoice created successfully!');
    console.log('📄 Invoice Number:', invoice.invoiceNumber);
    console.log('📦 Items count:', invoice.items?.length);
    
    if (invoice.items && invoice.items.length > 0) {
      console.log('\n🛍️ Items:');
      invoice.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.description}`);
        console.log(`     Quantity: ${item.quantity}`);
        console.log(`     Unit Price: ${item.unitPrice}`);
        console.log(`     Total: ${item.total}`);
      });
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createTestInvoice();
