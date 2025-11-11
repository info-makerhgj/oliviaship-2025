import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import Invoice from '../models/Invoice.js';
import invoicePDF from '../utils/invoicePDF.js';

async function testLatestInvoicePDF() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // جلب آخر فاتورة
    const invoice = await Invoice.findOne().sort({ createdAt: -1 });
    
    if (!invoice) {
      console.log('❌ No invoices found');
      process.exit(1);
    }

    console.log(`\n📄 Testing PDF for: ${invoice.invoiceNumber}`);
    console.log(`📦 Items: ${invoice.items?.length || 0}`);
    
    if (invoice.items && invoice.items.length > 0) {
      console.log('\n🛍️ Items:');
      invoice.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.description}`);
        console.log(`     Qty: ${item.quantity} x ${item.unitPrice} = ${item.total}`);
      });
    }

    console.log('\n🔄 Generating PDF...');
    const result = await invoicePDF.generateInvoicePDF(invoice);
    
    console.log('\n✅ PDF generated!');
    console.log(`📁 ${result.fileName}`);
    console.log(`🔗 ${result.fileUrl}`);

    await mongoose.connection.close();
    console.log('\n✅ Done - Check the PDF file!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testLatestInvoicePDF();
