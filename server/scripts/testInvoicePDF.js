import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import Invoice from '../models/Invoice.js';
import invoicePDF from '../utils/invoicePDF.js';

async function testInvoicePDF() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // جلب أول فاتورة
    const invoice = await Invoice.findOne();
    
    if (!invoice) {
      console.log('❌ No invoices found');
      process.exit(1);
    }

    console.log(`\n📄 Testing PDF generation for invoice: ${invoice.invoiceNumber}`);
    console.log(`📦 Items in invoice: ${invoice.items?.length || 0}`);
    
    if (invoice.items && invoice.items.length > 0) {
      console.log('\n🛍️ Items:');
      invoice.items.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.description} - Qty: ${item.quantity} - Price: ${item.unitPrice}`);
      });
    }

    // توليد PDF
    console.log('\n🔄 Generating PDF...');
    const result = await invoicePDF.generateInvoicePDF(invoice);
    
    console.log('\n✅ PDF generated successfully!');
    console.log(`📁 File: ${result.fileName}`);
    console.log(`📂 Path: ${result.filePath}`);
    console.log(`🔗 URL: ${result.fileUrl}`);

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testInvoicePDF();
