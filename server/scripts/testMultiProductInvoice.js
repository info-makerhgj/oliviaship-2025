import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import invoiceService from '../services/invoiceService.js';
import SmartCartOrder from '../models/SmartCartOrder.js';
import invoicePDF from '../utils/invoicePDF.js';

async function testMultiProductInvoice() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // جلب آخر SmartCartOrder
    const order = await SmartCartOrder.findOne().sort({ createdAt: -1 });
    
    if (!order) {
      console.log('❌ No orders found');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n📦 Order:', order.orderNumber);
    console.log('🛍️ Products:', order.products?.length || 0);
    
    if (order.products && order.products.length > 0) {
      console.log('\n📦 Products:');
      order.products.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name}`);
        console.log(`     ${product.price} ${product.currency} x ${product.quantity}`);
      });
    }

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
    console.log('📦 Items:', invoice.items?.length);
    
    if (invoice.items && invoice.items.length > 0) {
      console.log('\n🛍️ Invoice Items:');
      invoice.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.description}`);
        console.log(`     Qty: ${item.quantity} x ${item.unitPrice} = ${item.total}`);
      });
    }

    console.log('\n💵 Totals:');
    console.log('  Subtotal:', invoice.subtotal);
    console.log('  Total:', invoice.total);

    console.log('\n🔄 Generating PDF...');
    const pdfResult = await invoicePDF.generateInvoicePDF(invoice);
    console.log('✅ PDF generated:', pdfResult.fileName);

    await mongoose.connection.close();
    console.log('\n✅ Done - Check the PDF!');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

testMultiProductInvoice();
