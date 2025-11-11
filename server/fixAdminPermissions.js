import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';
import { applyPermissionPreset } from './utils/permissions.js';

dotenv.config();

const fixAdminPermissions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/yemen-delivery');
    console.log('✅ Connected to MongoDB');

    // Find all admin users without permissions
    const adminsWithoutPermissions = await User.find({
      role: 'admin',
      $or: [
        { 'permissions.adminType': { $exists: false } },
        { 'permissions.adminType': null },
        { permissions: { $exists: false } },
      ],
    });

    console.log(`📋 Found ${adminsWithoutPermissions.length} admin(s) without permissions`);

    if (adminsWithoutPermissions.length === 0) {
      console.log('✅ All admins already have permissions set');
      process.exit(0);
    }

    // Update each admin with super_admin permissions
    for (const admin of adminsWithoutPermissions) {
      admin.permissions = applyPermissionPreset('super_admin');
      await admin.save();
      console.log(`✅ Updated permissions for: ${admin.email} (${admin.name})`);
    }

    // Also update specific admin@example.com if exists
    const adminExample = await User.findOne({ email: 'admin@example.com' });
    if (adminExample && adminExample.role === 'admin') {
      if (!adminExample.permissions?.adminType) {
        adminExample.permissions = applyPermissionPreset('super_admin');
        await adminExample.save();
        console.log('✅ Updated admin@example.com with super_admin permissions');
      } else {
        console.log('ℹ️  admin@example.com already has permissions');
      }
    }

    console.log('\n✅ All admin permissions updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing admin permissions:', error);
    process.exit(1);
  }
};

fixAdminPermissions();

