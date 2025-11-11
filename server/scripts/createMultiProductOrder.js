import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

import SmartCartOrder from '../models/SmartCartOrder.js';
import User from '../models/User.js';

async function createMultiProductOrder() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // جلب أول مستخدم
    const user = await User.findOne();
    
    if (!user) {
      console.log('❌ No users found');
      await mongoose.connection.close();
      process.exit(0);
    }

    console.log('👤 User:', user.name);

    // إنشاء طلب بمنتجات متعددة
    const order = await SmartCartOrder.create({
      orderNumber: `ORD-TEST-${Date.now()}`,
      user: user._id,
      products: [
        {
          name: 'مجموعة سيرم من نيفر',
          price: 195,
          currency: 'SAR',
          quantity: 1,
          store: 'shein',
          url: 'https://ar.shein.com/test1',
        },
        {
          name: 'مجموعة الاستحمام - لها',
          price: 45,
          currency: 'SAR',
          quantity: 1,
          store: 'shein',
          url: 'https://ar.shein.com/test2',
        },
        {
          name: 'مجموعة الوجه - له',
          price: 179,
          currency: 'SAR',
          quantity: 1,
          store: 'shein',
          url: 'https://ar.shein.com/test3',
        },
        {
          name: 'مجموعة لجي',
          price: 175,
          currency: 'SAR',
          quantity: 1,
          store: 'shein',
          url: 'https://ar.shein.com/test4',
        },
      ],
      pricing: {
        subtotal: 594,
        shippingCost: 10,
        totalCost: 604,
        totalInYER: 1368105,
      },
      status: 'pending',
      payment: {
        status: 'pending',
      },
      delivery: {
        type: 'home',
        address: {
          street: '',
          city: '',
          governorate: 'اليمن',
        },
      },
    });

    console.log('\n✅ Order created!');
    console.log('📦 Order Number:', order.orderNumber);
    console.log('🛍️ Products:', order.products.length);
    
    order.products.forEach((product, index) => {
      console.log(`  ${index + 1}. ${product.name} - ${product.price} ${product.currency}`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Done');
  } catch (error) {
    console.error('❌ Error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

createMultiProductOrder();
