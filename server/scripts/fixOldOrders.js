import mongoose from 'mongoose';
import Order from '../models/Order.js';
import dotenv from 'dotenv';

dotenv.config();

async function fixOldOrders() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // البحث عن الطلبات بدون قيمة
    const ordersWithoutValue = await Order.find({
      $and: [
        { 'pricing.totalInYER': { $exists: false } },
        { 'pricing.totalCost': { $exists: false } },
        { 'totalAmount': { $exists: false } }
      ]
    });

    console.log(`Found ${ordersWithoutValue.length} orders without value\n`);

    if (ordersWithoutValue.length === 0) {
      console.log('✅ All orders have values!');
      process.exit(0);
    }

    // إضافة قيمة افتراضية بناءً على سعر المنتج
    let fixed = 0;
    for (const order of ordersWithoutValue) {
      const productPrice = order.product?.price || 0;
      
      if (productPrice > 0) {
        // إضافة حقل totalAmount
        order.totalAmount = productPrice;
        await order.save();
        console.log(`✅ Fixed order ${order.orderNumber}: Added totalAmount = ${productPrice}`);
        fixed++;
      } else {
        console.log(`⚠️  Order ${order.orderNumber}: No product price found, skipping`);
      }
    }

    console.log(`\n✅ Fixed ${fixed} orders`);
    console.log(`⚠️  Skipped ${ordersWithoutValue.length - fixed} orders (no price)`);

    // عرض ملخص بعد الإصلاح
    console.log('\n📊 Summary after fix:');
    const totalOrders = await Order.countDocuments();
    const ordersWithValue = await Order.countDocuments({
      $or: [
        { 'pricing.totalInYER': { $exists: true, $ne: null } },
        { 'pricing.totalCost': { $exists: true, $ne: null } },
        { 'totalAmount': { $exists: true, $ne: null } }
      ]
    });
    console.log(`Total Orders: ${totalOrders}`);
    console.log(`Orders with value: ${ordersWithValue}`);
    console.log(`Orders without value: ${totalOrders - ordersWithValue}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixOldOrders();
