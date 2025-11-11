import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import invoiceService from '../services/invoiceService.js';
import SmartCartOrder from '../models/SmartCartOrder.js';
import User from '../models/User.js';

async function testSmartCartInvoice() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // جلب أول SmartCartOrder
    const order = await SmartCartOrder.findOne();
    
    if (!order) {
      console.log('❌ No SmartCartOrders found');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n📦 SmartCartOrder:', order.orderNumber);
    console.log('🛍️ Products count:', order.products?.length || 0);
    
    if (order.products && order.products.length > 0) {
      console.log('\n📦 Products:');
      order.products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name || 'N/A'}`);
        console.log(`     Price: ${product.price} ${product.currency || 'SAR'}`);
        console.log(`     Quantity: ${product.quantity || 1}`);
      });
    }

    console.log('\n💰 Pricing:');
    console.log('  Subtotal:', order.pricing?.subtotal);
    console.log('  Shipping:', order.pricing?.shippingCost);
    console.log('  Total (YER):', order.pricing?.totalInYER);

    console.log('\n🔄 Creating invoice...');
    
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

    console.log('\n✅ Invoice created!');
    console.log('📄 Invoice Number:', invoice.invoiceNumber);
    console.log('📦 Items count:', invoice.items?.length);
    
    if (invoice.items && invoice.items.length > 0) {
      console.log('\n🛍️ Invoice Items:');
      invoice.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.description}`);
        console.log(`     Qty: ${item.quantity} x ${item.unitPrice} = ${item.total}`);
      });
    }

    console.log('\n💵 Totals:');
    console.log('  Subtotal:', invoice.subtotal);
    console.log('  Tax:', invoice.tax?.amount);
    console.log('  Total:', invoice.total);

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testSmartCartInvoice();
