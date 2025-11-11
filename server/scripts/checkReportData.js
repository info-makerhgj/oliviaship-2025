import mongoose from 'mongoose';
import Order from '../models/Order.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // فحص الطلبات
    console.log('\n📦 Checking Orders...');
    const totalOrders = await Order.countDocuments();
    console.log(`Total Orders: ${totalOrders}`);

    if (totalOrders > 0) {
      // عرض أول طلب كمثال
      const sampleOrder = await Order.findOne().lean();
      console.log('\n📋 Sample Order Structure:');
      console.log(JSON.stringify(sampleOrder, null, 2));

      // فحص حقل pricing
      console.log('\n💰 Pricing Fields Check:');
      const ordersWithPricing = await Order.countDocuments({ 'pricing.totalInYER': { $exists: true, $ne: null } });
      const ordersWithTotal = await Order.countDocuments({ 'pricing.total': { $exists: true, $ne: null } });
      console.log(`Orders with pricing.totalInYER: ${ordersWithPricing}`);
      console.log(`Orders with pricing.total: ${ordersWithTotal}`);

      // فحص حقل product.store
      console.log('\n🏪 Store Fields Check:');
      const ordersWithProductStore = await Order.countDocuments({ 'product.store': { $exists: true, $ne: null } });
      const ordersWithStore = await Order.countDocuments({ 'store': { $exists: true, $ne: null } });
      console.log(`Orders with product.store: ${ordersWithProductStore}`);
      console.log(`Orders with store: ${ordersWithStore}`);

      // فحص حقل user
      console.log('\n👤 User Fields Check:');
      const ordersWithUser = await Order.countDocuments({ 'user': { $exists: true, $ne: null } });
      const ordersWithCustomer = await Order.countDocuments({ 'customer': { $exists: true, $ne: null } });
      console.log(`Orders with user: ${ordersWithUser}`);
      console.log(`Orders with customer: ${ordersWithCustomer}`);

      // حساب إجمالي الإيرادات
      console.log('\n💵 Revenue Calculation:');
      const revenueFromTotalInYER = await Order.aggregate([
        { $match: { 'pricing.totalInYER': { $exists: true, $ne: null } } },
        { $group: { _id: null, total: { $sum: '$pricing.totalInYER' } } }
      ]);
      const revenueFromTotal = await Order.aggregate([
        { $match: { 'pricing.total': { $exists: true, $ne: null } } },
        { $group: { _id: null, total: { $sum: '$pricing.total' } } }
      ]);
      console.log(`Revenue from pricing.totalInYER: ${revenueFromTotalInYER[0]?.total || 0} YER`);
      console.log(`Revenue from pricing.total: ${revenueFromTotal[0]?.total || 0}`);

      // فحص الحالات
      console.log('\n📊 Order Status Distribution:');
      const statusDistribution = await Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      statusDistribution.forEach(item => {
        console.log(`  ${item._id}: ${item.count}`);
      });

      // فحص المتاجر
      console.log('\n🏬 Store Distribution:');
      const storeDistribution = await Order.aggregate([
        { $match: { 'product.store': { $exists: true, $ne: null } } },
        { $group: { _id: '$product.store', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      if (storeDistribution.length > 0) {
        storeDistribution.forEach(item => {
          console.log(`  ${item._id}: ${item.count}`);
        });
      } else {
        console.log('  No stores found in product.store field');
        // جرب الحقل القديم
        const oldStoreDistribution = await Order.aggregate([
          { $match: { 'store': { $exists: true, $ne: null } } },
          { $group: { _id: '$store', count: { $sum: 1 } } },
          { $sort: { count: -1 } }
        ]);
        if (oldStoreDistribution.length > 0) {
          console.log('  Found in old "store" field:');
          oldStoreDistribution.forEach(item => {
            console.log(`    ${item._id}: ${item.count}`);
          });
        }
      }
    }

    // فحص العملاء
    console.log('\n👥 Checking Users...');
    const totalUsers = await User.countDocuments();
    const customers = await User.countDocuments({ role: 'customer' });
    console.log(`Total Users: ${totalUsers}`);
    console.log(`Customers: ${customers}`);

    console.log('\n✅ Data check completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkData();
