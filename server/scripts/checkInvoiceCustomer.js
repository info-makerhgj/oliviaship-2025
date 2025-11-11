import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import Invoice from '../models/Invoice.js';
import SmartCartOrder from '../models/SmartCartOrder.js';
import User from '../models/User.js';

async function checkInvoiceCustomer() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const invoice = await Invoice.findOne().sort({ createdAt: -1 });
    
    if (!invoice) {
      console.log('❌ No invoice found');
      process.exit(0);
    }

    console.log('\n📄 Invoice:', invoice.invoiceNumber);
    console.log('  Customer ID:', invoice.customerId);
    console.log('  Order ID:', invoice.orderId);

    // Get order
    const order = await SmartCartOrder.findById(invoice.orderId);
    if (order) {
      console.log('\n📦 Order:', order.orderNumber);
      console.log('  User ID:', order.user);
    }

    // Get all users
    const users = await User.find({}, 'name email role');
    console.log('\n👥 All Users:');
    users.forEach(user => {
      console.log(`  ${user._id} - ${user.name} (${user.email}) - ${user.role}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkInvoiceCustomer();
