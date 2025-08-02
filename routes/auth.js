const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../config/database');
const router = express.Router();

// Static dummy data for now (replace with database later)
const dummyUsers = [
  {
    id: 1,
    email: 'john.doe@example.com',
    password: '$2y$10$oji3jh.bWWu02zmONNrW/ubwdTEzvNilkrPtJg6.o4YieRztjjnfO', // 'password*123'
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1-555-0123',
    dateOfBirth: '1990-05-15',
    address: '123 Investment Street, Finance City, FC 12345',
    createdAt: '2023-01-15'
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
    createdAt: '2023-03-10'
  }
];

// Register new user
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, confirmPassword } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists (using dummy data for now)
    const existingUser = dummyUsers.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // For now, simulate successful user creation
    const newUser = {
      id: dummyUsers.length + 1,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: '',
      dateOfBirth: '',
      address: '',
      createdAt: new Date().toISOString().split('T')[0]
    };

    // Add to dummy users (in real app, save to database)
    dummyUsers.push(newUser);

    // Create session
    req.session.userId = newUser.id;
    req.session.userEmail = newUser.email;
    req.session.firstName = newUser.firstName;
    req.session.lastName = newUser.lastName;

    res.status(201).json({ 
      message: 'User created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user (using dummy data for now)
    const user = dummyUsers.find(user => user.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Create session
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.firstName = user.firstName;
    req.session.lastName = user.lastName;

    res.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout user
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// Check authentication status
router.get('/status', (req, res) => {
  if (req.session && req.session.userId) {
    res.json({ 
      authenticated: true,
      user: {
        id: req.session.userId,
        email: req.session.userEmail,
        firstName: req.session.firstName,
        lastName: req.session.lastName
      }
    });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;