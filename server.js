const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const userRoutes = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'portfolio-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/user', userRoutes);

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'signup.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'dashboard.html'));
});

app.get('/holdings', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'holdings.html'));
});

app.get('/transactions', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'transactions.html'));
});

app.get('/watchlist', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'watchlist.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'profile.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'settings.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Page not found' });
});

app.listen(PORT, () => {
  console.log(`Portfolio Management App running on http://localhost:${PORT}`);
  console.log('Available routes:');
  console.log('- Landing Page: http://localhost:' + PORT);
  console.log('- Login: http://localhost:' + PORT + '/login');
  console.log('- Signup: http://localhost:' + PORT + '/signup');
  console.log('- Dashboard: http://localhost:' + PORT + '/dashboard');
});