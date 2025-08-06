// Authentication middleware

const jwt = require('jsonwebtoken');
require('dotenv').config();

const requireAuth = (req, res, next) => {
    if (req.session && req.session.userId) {
      return next();
    } else {
      return res.status(401).json({ 
        error: 'Authentication required',
        redirect: '/login'
      });
    }
  };

const requireJWTAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access token missing or malformed' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // user info (e.g., id, email) from token
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
  
  // Check if user is already logged in
  const redirectIfAuthenticated = (req, res, next) => {
    if (req.session && req.session.userId) {
      return res.redirect('/dashboard');
    }
    next();
  };
  
  // Get current user info from session
  const getCurrentUser = (req, res, next) => {
    if (req.session && req.session.userId) {
      req.user = {
        id: req.session.userId,
        email: req.session.userEmail,
        firstName: req.session.firstName,
        lastName: req.session.lastName
      };
    }
    next();
  };
  
  module.exports = {
    requireAuth,
    requireJWTAuth,
    redirectIfAuthenticated,
    getCurrentUser
  };