import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import Invoice from '../models/Invoice.js';

async function deleteAllInvoices() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // جلب جميع الفواتير
    const invoices = await Invoice.find();
    
    console.log(`\n📊 Found ${invoices.length} invoices to delete\n`);
    
    if (invoices.length === 0) {
      console.log('✅ No invoices to delete');
      await mongoose.connection.close();
      process.exit(0);
    }

    // حذف ملفات PDF
    const uploadsDir = path.join(__dirname, '../../uploads/invoices');
    let deletedFiles = 0;
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      console.log(`📁 Found ${files.length} PDF files`);
      
      for (const file of files) {
        const filePath = path.join(uploadsDir, file);
        try {
          fs.unlinkSync(filePath);
          deletedFiles++;
          console.log(`  ✅ Deleted: ${file}`);
        } catch (error) {
          console.log(`  ❌ Failed to delete: ${file}`);
        }
      }
    }

    // حذف الفواتير من قاعدة البيانات
    const result = await Invoice.deleteMany({});
    
    console.log(`\n✅ Deleted ${result.deletedCount} invoices from database`);
    console.log(`✅ Deleted ${deletedFiles} PDF files`);

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteAllInvoices();
