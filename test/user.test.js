const request = require('supertest');
const express = require('express');
const session = require('express-session');
const userRoutes = require('../routes/user');
const { requireAuth, getCurrentUser } = require('../middleware/auth');

const app = express();

// Setup middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware
app.use(
  session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
  })
);

// Mock session for logged-in user
app.use((req, res, next) => {
  req.session.userId = 1;
  req.session.userEmail = 'john.doe@example.com';
  req.session.firstName = 'John';
  req.session.lastName = 'Doe';
  next();
});

app.use(getCurrentUser);

// Mount user routes
app.use('/api/user', userRoutes);

describe('User Routes', () => {
  test('GET /api/user/profile returns current user info', async () => {
    const res = await request(app).get('/api/user/profile');

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      id: 1,
      email: 'john.doe@example.com',
      firstName: 'John',
      lastName: 'Doe',
      address: expect.any(String),
      phone: expect.any(String),
      dateOfBirth: expect.any(String),
      createdAt: expect.any(String),
      settings: {
        currency: expect.any(String),
        darkMode: expect.any(Boolean),
        language: expect.any(String),
        notifications: expect.any(Boolean),
      },
    });
  });

  test('GET /api/user/settings returns settings object if authenticated', async () => {
    const res = await request(app).get('/api/user/settings');

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      currency: expect.any(String),
      darkMode: expect.any(Boolean),
      language: expect.any(String),
      notifications: expect.any(Boolean),
    });
  });

  test('GET /api/user/settings without session should return 401', async () => {
    const appNoSession = express();
    appNoSession.use(express.json());
    appNoSession.use(
      session({
        secret: 'test-secret',
        resave: false,
        saveUninitialized: false,
      })
    );

    appNoSession.get(
      '/api/user/settings',
      requireAuth,
      (req, res) => res.json({ message: 'Authenticated' })
    );

    const res = await request(appNoSession).get('/api/user/settings');

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({
      error: 'Authentication required',
      redirect: '/login',
    });
  });
});
