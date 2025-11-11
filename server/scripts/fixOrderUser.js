import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixOrderUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // البحث عن طلب بدون user
    const order = await Order.findOne({ user: { $exists: false } });
    
    if (!order) {
      console.log('✅ All orders have users!');
      process.exit(0);
    }

    console.log(`📦 Found order without user: ${order.orderNumber}`);

    // البحث عن أي عميل
    const customer = await User.findOne({ role: 'customer' });
    
    if (!customer) {
      console.log('❌ No customer found. Creating a test customer...');
      const newCustomer = await User.create({
        name: 'عميل تجريبي',
        email: 'test@customer.com',
        password: 'password123',
        role: 'customer',
        phone: '+967 777 123 456',
      });
      console.log(`✅ Created customer: ${newCustomer.name}`);
      
      // تحديث الطلب
      order.user = newCustomer._id;
      await order.save();
      console.log(`✅ Updated order ${order.orderNumber} with customer ${newCustomer.name}`);
    } else {
      // تحديث الطلب
      order.user = customer._id;
      await order.save();
      console.log(`✅ Updated order ${order.orderNumber} with customer ${customer.name}`);
    }

    // تحديث جميع الطلبات الأخرى بدون user
    const ordersWithoutUser = await Order.find({ user: { $exists: false } });
    
    if (ordersWithoutUser.length > 1) {
      console.log(`\n📦 Found ${ordersWithoutUser.length - 1} more orders without user. Updating...`);
      
      for (const o of ordersWithoutUser) {
        if (o._id.toString() !== order._id.toString()) {
          o.user = customer._id;
          await o.save();
        }
      }
      
      console.log(`✅ Updated all orders!`);
    }

    console.log('\n✅ All done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixOrderUser();
