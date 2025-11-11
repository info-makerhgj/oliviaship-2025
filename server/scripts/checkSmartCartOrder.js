import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import SmartCartOrder from '../models/SmartCartOrder.js';
import User from '../models/User.js';

async function checkSmartCartOrder() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const orders = await SmartCartOrder.find().limit(3);
    
    console.log(`\n📊 Found ${orders.length} SmartCartOrders\n`);
    
    for (const order of orders) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📦 Order: ${order.orderNumber}`);
      console.log(`👤 User ID: ${order.user}`);
      console.log(`📅 Created: ${order.createdAt}`);
      console.log(`💰 Total (YER): ${order.pricing?.totalInYER}`);
      console.log(`📦 Products: ${order.products?.length || 0}`);
      
      if (order.products && order.products.length > 0) {
        console.log('\n🛍️ Products:');
        order.products.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name || 'N/A'}`);
          console.log(`     Price: ${product.price} ${product.currency || 'SAR'}`);
          console.log(`     Qty: ${product.quantity || 1}`);
        });
      }
      console.log('');
    }

    await mongoose.connection.close();
    console.log('✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkSmartCartOrder();
