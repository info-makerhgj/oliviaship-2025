import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import Invoice from '../models/Invoice.js';

async function checkInvoiceItems() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const invoices = await Invoice.find().limit(5);
    
    console.log(`\n📊 Found ${invoices.length} invoices\n`);
    
    for (const invoice of invoices) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`📄 Invoice: ${invoice.invoiceNumber}`);
      console.log(`📅 Created: ${invoice.createdAt}`);
      console.log(`💰 Total: ${invoice.total} ${invoice.currency || 'YER'}`);
      console.log(`📦 Items count: ${invoice.items?.length || 0}`);
      
      if (invoice.items && invoice.items.length > 0) {
        console.log('\n🛍️ Items:');
        invoice.items.forEach((item, index) => {
          console.log(`  ${index + 1}. ${item.description}`);
          console.log(`     Quantity: ${item.quantity}`);
          console.log(`     Unit Price: ${item.unitPrice}`);
          console.log(`     Total: ${item.total}`);
        });
      } else {
        console.log('⚠️ NO ITEMS FOUND!');
      }
      
      console.log(`\n💵 Subtotal: ${invoice.subtotal}`);
      console.log(`📊 Tax: ${invoice.tax?.amount || 0} (${invoice.tax?.rate || 0}%)`);
      console.log(`💳 Total: ${invoice.total}`);
      console.log('');
    }

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkInvoiceItems();
