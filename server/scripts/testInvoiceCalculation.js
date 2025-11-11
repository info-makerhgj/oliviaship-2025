import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import invoiceService from '../services/invoiceService.js';
import SmartCartOrder from '../models/SmartCartOrder.js';

async function testInvoiceCalculation() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // جلب آخر طلب
    const order = await SmartCartOrder.findOne().sort({ createdAt: -1 });
    
    if (!order) {
      console.log('❌ Order not found');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n📦 Order:', order.orderNumber);
    console.log('🛍️ Products:', order.products?.length || 0);
    
    console.log('\n💰 Order Pricing:');
    console.log('  Subtotal (SAR):', order.pricing?.subtotal);
    console.log('  Shipping (SAR):', order.pricing?.shippingCost);
    console.log('  Total Cost (SAR):', order.pricing?.totalCost);
    console.log('  Total (YER):', order.pricing?.totalInYER);
    
    if (order.pricing?.subtotal && order.pricing?.totalInYER) {
      const rate = order.pricing.totalInYER / order.pricing.subtotal;
      console.log('  Conversion Rate:', rate.toFixed(2));
    }

    console.log('\n📦 Products:');
    let totalSAR = 0;
    order.products.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name}`);
      console.log(`     ${product.price} SAR x ${product.quantity} = ${product.price * product.quantity} SAR`);
      totalSAR += product.price * product.quantity;
    });
    console.log(`  Total Products: ${totalSAR} SAR`);

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
    
    console.log('\n🛍️ Invoice Items:');
    let invoiceItemsTotal = 0;
    invoice.items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.description}`);
      console.log(`     ${item.unitPrice} YER x ${item.quantity} = ${item.total} YER`);
      invoiceItemsTotal += item.total;
    });

    console.log('\n💵 Invoice Totals:');
    console.log('  Items Total:', invoiceItemsTotal, 'YER');
    console.log('  Subtotal:', invoice.subtotal, 'YER');
    console.log('  Tax:', invoice.tax?.amount || 0, 'YER');
    console.log('  Total:', invoice.total, 'YER');
    
    console.log('\n📊 Comparison:');
    console.log('  Order Total (YER):', order.pricing?.totalInYER);
    console.log('  Invoice Total (YER):', invoice.total);
    console.log('  Difference:', Math.abs((order.pricing?.totalInYER || 0) - invoice.total), 'YER');

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testInvoiceCalculation();
