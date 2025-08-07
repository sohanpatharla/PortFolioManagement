const { requireAuth, redirectIfAuthenticated, getCurrentUser } = require('../middleware/auth');

describe('Auth Middleware', () => {
  describe('requireAuth', () => {
    it('should call next() if user is authenticated', () => {
      const req = { session: { userId: 1 } };
      const res = {};
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', () => {
      const req = { session: null };
      const json = jest.fn();
      const status = jest.fn(() => ({ json }));
      const res = { status };
      const next = jest.fn();

      requireAuth(req, res, next);

      expect(status).toHaveBeenCalledWith(401);
      expect(json).toHaveBeenCalledWith({
        error: 'Authentication required',
        redirect: '/login'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('redirectIfAuthenticated', () => {
    it('should redirect to /dashboard if user is authenticated', () => {
      const req = { session: { userId: 1 } };
      const redirect = jest.fn();
      const res = { redirect };
      const next = jest.fn();

      redirectIfAuthenticated(req, res, next);

      expect(redirect).toHaveBeenCalledWith('/dashboard');
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next() if user is not authenticated', () => {
      const req = { session: null };
      const res = {};
      const next = jest.fn();

      redirectIfAuthenticated(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('getCurrentUser', () => {
    it('should attach user to req if session exists', () => {
      const req = {
        session: {
          userId: 1,
          userEmail: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe'
        }
      };
      const res = {};
      const next = jest.fn();

      getCurrentUser(req, res, next);

      expect(req.user).toEqual({
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      });
      expect(next).toHaveBeenCalled();
    });

    it('should not attach user if session does not exist', () => {
      const req = { session: null };
      const res = {};
      const next = jest.fn();

      getCurrentUser(req, res, next);

      expect(req.user).toBeUndefined();
      expect(next).toHaveBeenCalled();
    });
  });
});
