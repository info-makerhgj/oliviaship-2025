import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import Settings from './models/Settings.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yemen-delivery');
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Import permissions helper
    const { applyPermissionPreset } = await import('./utils/permissions.js');
    
    // Create Admin User with super_admin permissions
    const admin = await User.create({
      name: 'مدير النظام',
      email: 'admin@example.com',
      password: 'admin123',
      phone: '+967777000000',
      role: 'admin',
      permissions: applyPermissionPreset('super_admin'),
      address: {
        street: 'شارع الزبيري',
        city: 'صنعاء',
        governorate: 'أمانة العاصمة',
        postalCode: '00000',
        country: 'Yemen',
      },
      isActive: true,
      stats: {
        totalOrders: 0,
        totalSpent: 0,
      },
    });
    console.log('✅ Admin user created:', admin.email);

    // Create Customer User
    const customer = await User.create({
      name: 'عميل تجريبي',
      email: 'customer@example.com',
      password: 'customer123',
      phone: '+967777000001',
      role: 'customer',
      address: {
        street: 'شارع الزبيري',
        city: 'صنعاء',
        governorate: 'أمانة العاصمة',
        postalCode: '00000',
        country: 'Yemen',
      },
      isActive: true,
      stats: {
        totalOrders: 0,
        totalSpent: 0,
      },
    });
    console.log('✅ Customer user created:', customer.email);

    // Create Settings if not exists
    const settings = await Settings.getSettings();
    console.log('✅ Settings initialized');

    console.log('\n📋 بيانات الدخول:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👨‍💼 حساب المدير (Admin):');
    console.log('   البريد: admin@example.com');
    console.log('   كلمة المرور: admin123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 حساب العميل (Customer):');
    console.log('   البريد: customer@example.com');
    console.log('   كلمة المرور: customer123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();

