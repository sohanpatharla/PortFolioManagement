const express = require('express');
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

// Static dummy user data (will be replaced with database later)
const dummyUsers = [
  {
    id: 1,
    email: 'john.doe@example.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.7qsm8QWG/xfP4UWW3hhAOeEqpT/F2u', // 'password123'
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1-555-0123',
    dateOfBirth: '1990-05-15',
    address: '123 Investment Street, Finance City, FC 12345',
    createdAt: '2023-01-15',
    settings: {
      darkMode: false,
      notifications: true,
      currency: 'USD',
      language: 'en'
    }
  },
  {
    id: 2,
    email: 'jane.smith@example.com',
    password: '$2a$10$N9qo8uLOickgx2ZMRZoMye.7qsm8QWG/xfP4UWW3hhAOeEqpT/F2u', // 'password123'
    firstName: 'Jane',
    lastName: 'Smith',
    phone: '+1-555-0456',
    dateOfBirth: '1985-09-22',
    address: '456 Portfolio Avenue, Wealth City, WC 67890',
    createdAt: '2023-03-10',
    settings: {
      darkMode: true,
      notifications: false,
      currency: 'USD',
      language: 'en'
    }
  }
];

// Apply authentication middleware to all user routes
router.use(requireAuth);

// Get user profile
router.get('/profile', (req, res) => {
  try {
    const user = dummyUsers.find(u => u.id === req.session.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data without password
    const { password, ...userProfile } = user;
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.put('/profile', (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, address } = req.body;
    const userIndex = dummyUsers.findIndex(u => u.id === req.session.userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = dummyUsers[userIndex];
    
    // Update fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (address) user.address = address;

    // Update session data
    req.session.firstName = user.firstName;
    req.session.lastName = user.lastName;

    const { password, ...userProfile } = user;
    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Change password
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: 'All password fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'New passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const userIndex = dummyUsers.findIndex(u => u.id === req.session.userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = dummyUsers[userIndex];
    
    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
    
    user.password = hashedNewPassword;

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Get user settings
router.get('/settings', (req, res) => {
  try {
    const user = dummyUsers.find(u => u.id === req.session.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user.settings || {
      darkMode: false,
      notifications: true,
      currency: 'USD',
      language: 'en'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update user settings
router.put('/settings', (req, res) => {
  try {
    const { darkMode, notifications, currency, language } = req.body;
    const userIndex = dummyUsers.findIndex(u => u.id === req.session.userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = dummyUsers[userIndex];
    
    if (!user.settings) {
      user.settings = {};
    }

    // Update settings if provided
    if (typeof darkMode === 'boolean') user.settings.darkMode = darkMode;
    if (typeof notifications === 'boolean') user.settings.notifications = notifications;
    if (currency) user.settings.currency = currency;
    if (language) user.settings.language = language;

    res.json(user.settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Export portfolio data as CSV
router.get('/export/csv', (req, res) => {
  try {
    // This would normally fetch user's portfolio data from database
    // For now, using dummy data
    const csvData = `Symbol,Company Name,Quantity,Buy Price,Current Price,Total Value,Profit/Loss,P&L %
AAPL,Apple Inc.,50,150.25,175.80,8790.00,1277.50,17.02%
GOOGL,Alphabet Inc.,25,2450.75,2680.30,67007.50,5738.75,9.36%
MSFT,Microsoft Corporation,40,285.60,312.45,12498.00,1074.00,9.40%
TSLA,Tesla Inc.,15,220.80,195.25,2928.75,-383.25,-11.58%
AMZN,Amazon.com Inc.,35,3180.50,3385.20,118482.00,7164.50,6.44%`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="portfolio-export.csv"');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export portfolio data' });
  }
});

module.exports = router;