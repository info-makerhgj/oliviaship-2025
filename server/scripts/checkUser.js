import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  isActive: Boolean
});

const User = mongoose.model('User', userSchema);

async function checkUser() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/oliviaship';
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB\n');

    const email = 'admin@example.com';
    const testPassword = 'admin123456';

    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found!');
      console.log('Email:', email);
      await mongoose.connection.close();
      process.exit(1);
    }

    console.log('✅ User found!');
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    console.log('Active:', user.isActive);
    console.log('Password hash:', user.password.substring(0, 20) + '...');
    
    // Test password
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log('\n🔐 Password test:');
    console.log('Test password:', testPassword);
    console.log('Match:', isMatch ? '✅ YES' : '❌ NO');

    if (!isMatch) {
      console.log('\n⚠️ Password does not match! Updating...');
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      user.password = hashedPassword;
      await user.save();
      console.log('✅ Password updated!');
      
      // Test again
      const isMatchNow = await bcrypt.compare(testPassword, user.password);
      console.log('Match now:', isMatchNow ? '✅ YES' : '❌ NO');
    }

    await mongoose.connection.close();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkUser();
