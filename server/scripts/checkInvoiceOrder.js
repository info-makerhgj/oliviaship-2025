import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import Invoice from '../models/Invoice.js';
import Order from '../models/Order.js';
import User from '../models/User.js';

async function checkInvoiceOrder() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const invoice = await Invoice.findOne().populate('orderId');
    
    if (!invoice) {
      console.log('❌ No invoices found');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n📄 Invoice:', invoice.invoiceNumber);
    console.log('📦 Items in invoice:');
    invoice.items.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.description}`);
    });

    console.log('\n📦 Order ID:', invoice.orderId);
    
    if (invoice.orderId) {
      const order = await Order.findById(invoice.orderId);
      
      if (order) {
        console.log('\n🛍️ Order Product Info:');
        console.log('Product Name:', order.product?.name);
        console.log('Product Price:', order.product?.price);
        console.log('Product Quantity:', order.product?.quantity);
        console.log('Product Store:', order.product?.store);
      } else {
        console.log('⚠️ Order not found in Order collection');
        
        // جرب SmartCartOrder
        const SmartCartOrder = (await import('../models/SmartCartOrder.js')).default;
        const smartOrder = await SmartCartOrder.findById(invoice.orderId);
        
        if (smartOrder) {
          console.log('\n🛍️ SmartCartOrder Product Info:');
          console.log('Product Name:', smartOrder.product?.name);
          console.log('Product Price:', smartOrder.product?.price);
          console.log('Product Quantity:', smartOrder.product?.quantity);
        }
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkInvoiceOrder();
