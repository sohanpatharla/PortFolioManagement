const request = require('supertest');
const express = require('express');
const session = require('express-session');

const authRoutes = require('../routes/auth'); // Adjust path as needed

// Set up express app for testing
const app = express();

// Middleware setup matching your main server
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'test-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));
app.use('/api/auth', authRoutes);

// Helper function to get session cookie from response
function getSessionCookie(res) {
  return res.headers['set-cookie'].find(cookie => cookie.startsWith('connect.sid'));
}

describe('Auth Routes', () => {
  let server;

  beforeAll(() => {
    server = app.listen(); // Open a server for requests
  });

  afterAll((done) => {
    server.close(done); // Close server after tests
  });

  describe('POST /api/auth/signup', () => {
    it('should create a new user if all data is valid', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'testuser@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('message', 'User created successfully');
      expect(res.body.user).toMatchObject({
        email: 'testuser@example.com',
        firstName: 'Test',
        lastName: 'User'
      });
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Test',
          email: 'testuser2@example.com',
          password: 'password123',
          confirmPassword: 'password123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'All fields are required');
    });

    it('should return 400 if passwords do not match', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'testuser3@example.com',
          password: 'password123',
          confirmPassword: 'password124'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Passwords do not match');
    });

    it('should return 400 if password is too short', async () => {
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'testuser4@example.com',
          password: '123',
          confirmPassword: '123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Password must be at least 6 characters long');
    });

    it('should return 400 if user already exists', async () => {
      // `john.doe@example.com` exists in dummyUsers
      const res = await request(app)
        .post('/api/auth/signup')
        .send({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password*123',
          confirmPassword: 'password*123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'User already exists with this email');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login user with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password*123' // The correct password for john.doe in dummyUsers
        });

      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('message', 'Login successful');
      expect(res.body.user).toMatchObject({
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe'
      });
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should return 400 if email or password missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
        });
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email and password are required');
    });

    it('should return 401 if user does not exist', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'notfound@example.com',
          password: 'password123'
        });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid email or password');
    });

    it('should return 401 if password is incorrect', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'wrongpassword'
        });
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid email or password');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout the user and destroy session', async () => {
      // First login to get session cookie
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password*123'
        });

      const cookie = getSessionCookie(loginRes);
      expect(cookie).toBeDefined();

      // Then logout
      const logoutRes = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', cookie)
        .send();

      expect(logoutRes.statusCode).toBe(200);
      expect(logoutRes.body).toHaveProperty('message', 'Logout successful');
    });
  });

  describe('GET /api/auth/status', () => {
    it('should return authenticated: false when not logged in', async () => {
      const res = await request(app)
        .get('/api/auth/status');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ authenticated: false });
    });

    it('should return authenticated: true with user info when logged in', async () => {
      // Login to get session cookie
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john.doe@example.com',
          password: 'password*123'
        });

      const cookie = getSessionCookie(loginRes);
      expect(cookie).toBeDefined();

      const statusRes = await request(app)
        .get('/api/auth/status')
        .set('Cookie', cookie);

      expect(statusRes.statusCode).toBe(200);
      expect(statusRes.body).toHaveProperty('authenticated', true);
      expect(statusRes.body.user).toMatchObject({
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe'
      });
    });
  });
});
