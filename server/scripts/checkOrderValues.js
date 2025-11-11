import mongoose from 'mongoose';
import Order from '../models/Order.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkValues() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const orders = await Order.find().lean();
    
    console.log('📦 Checking all orders:\n');
    
    let totalRevenue = 0;
    
    orders.forEach(order => {
      const pricingTotalInYER = order.pricing?.totalInYER || null;
      const pricingTotalCost = order.pricing?.totalCost || null;
      const totalAmount = order.totalAmount || null;
      const productPrice = order.product?.price || null;
      
      const calculatedValue = pricingTotalInYER || pricingTotalCost || totalAmount || 0;
      totalRevenue += calculatedValue;
      
      console.log(`Order: ${order.orderNumber}`);
      console.log(`  Status: ${order.status}`);
      console.log(`  Product: ${order.product?.name || 'N/A'}`);
      console.log(`  Product Price: ${productPrice}`);
      console.log(`  pricing.totalInYER: ${pricingTotalInYER}`);
      console.log(`  pricing.totalCost: ${pricingTotalCost}`);
      console.log(`  totalAmount: ${totalAmount}`);
      console.log(`  ➡️  Calculated Value: ${calculatedValue} YER`);
      console.log('');
    });
    
    console.log(`\n💰 Total Revenue: ${totalRevenue.toLocaleString()} YER`);
    console.log(`📊 Total Orders: ${orders.length}`);
    console.log(`📈 Average Order Value: ${(totalRevenue / orders.length).toFixed(2)} YER`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkValues();
