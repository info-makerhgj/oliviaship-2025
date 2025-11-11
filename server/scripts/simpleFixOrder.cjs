const mongoose = require('mongoose');
require('dotenv').config();

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
  const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));
  
  const customer = await User.findOne({ role: 'customer' });
  
  if (!customer) {
    console.log('❌ No customer found');
    process.exit(1);
  }
  
  // تحديث جميع الطلبات بدون user
  const result = await Order.updateMany(
    { user: { $exists: false } },
    { $set: { user: customer._id } }
  );
  
  console.log(`✅ Updated ${result.modifiedCount} orders with customer: ${customer.name}`);
  
  process.exit(0);
}

fix();
