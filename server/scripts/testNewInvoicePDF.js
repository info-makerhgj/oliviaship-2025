import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import Invoice from '../models/Invoice.js';
import invoicePDF from '../utils/invoicePDF.js';

async function testNewInvoicePDF() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const invoice = await Invoice.findOne().sort({ createdAt: -1 });
    
    if (!invoice) {
      console.log('❌ No invoices found');
      process.exit(1);
    }

    console.log('\n📄 Invoice:', invoice.invoiceNumber);
    console.log('💰 Total (SAR):', invoice.total);
    console.log('💰 Total (YER):', invoice.totalInYER);
    console.log('📊 Conversion Rate:', invoice.conversionRate);
    console.log('📦 Items:', invoice.items.length);

    console.log('\n🔄 Generating PDF...');
    const result = await invoicePDF.generateInvoicePDF(invoice);
    
    console.log('\n✅ PDF generated!');
    console.log('📁', result.fileName);

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testNewInvoicePDF();
