import express from 'express';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// Setup admin endpoint - REMOVE THIS IN PRODUCTION!
router.post('/create-admin', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        message: 'Email and password required' 
      });
    }

    // Check if user exists
    let user = await User.findOne({ email });
    
    if (user) {
      // Update existing user
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.role = 'admin';
      user.isActive = true;
      user.name = name || user.name;
      await user.save();
      
      return res.json({
        success: true,
        message: 'Admin updated successfully',
        user: {
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    }
    
    // Create new admin
    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({
      name: name || 'Admin',
      email,
      password: hashedPassword,
      role: 'admin',
      isActive: true
    });
    
    res.json({
      success: true,
      message: 'Admin created successfully',
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ 
      message: 'Error creating admin',
      error: error.message 
    });
  }
});

// List all users (for debugging)
router.get('/list-users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({
      success: true,
      count: users.length,
      users: users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        isActive: u.isActive
      }))
    });
  } catch (error) {
    res.status(500).json({ 
      message: 'Error listing users',
      error: error.message 
    });
  }
});

// Test login - bypasses password check (REMOVE IN PRODUCTION!)
router.post('/test-login', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email required' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate token without password check
    const jwt = await import('jsonwebtoken');
    const token = jwt.default.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions
      }
    });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ 
      message: 'Error in test login',
      error: error.message 
    });
  }
});

export default router;
