const mongoose = require('mongoose');
require('dotenv').config();

async function deleteAllInvoices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const Invoice = mongoose.model('Invoice', new mongoose.Schema({}, { strict: false }));
    
    const result = await Invoice.deleteMany({});
    
    console.log(`✅ Deleted ${result.deletedCount} invoices`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteAllInvoices();
