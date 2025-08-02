// Authentication middleware
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
    redirectIfAuthenticated,
    getCurrentUser
  };