import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import Order from '../models/Order.js';
import User from '../models/User.js';

async function checkOrderStructure() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const order = await Order.findOne().populate('user', 'name email phone');
    
    if (!order) {
      console.log('❌ No orders found');
      
      // جرب SmartCartOrder
      const SmartCartOrder = (await import('../models/SmartCartOrder.js')).default;
      const smartOrder = await SmartCartOrder.findOne().populate('user', 'name email phone');
      
      if (smartOrder) {
        console.log('\n📦 SmartCartOrder Structure:');
        console.log(JSON.stringify(smartOrder, null, 2));
      }
      
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('\n📦 Order Structure:');
    console.log('Order ID:', order._id);
    console.log('Order Number:', order.orderNumber);
    console.log('\n🛍️ Product Info:');
    console.log('product:', order.product);
    console.log('\n💰 Pricing Info:');
    console.log('pricing:', order.pricing);
    console.log('\n📊 Full Order:');
    console.log(JSON.stringify(order, null, 2));

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkOrderStructure();
