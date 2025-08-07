const request = require('supertest');
const express = require('express');
const session = require('express-session');
const tradeRoutes = require('../routes/tradeRoutes');
const db = require('../config/database');

jest.mock('../config/database');

const app = express();
app.use(express.json());
app.use(session({
  secret: 'test-secret',
  resave: false,
  saveUninitialized: false,
}));

// Fake session middleware to simulate logged-in user
app.use((req, res, next) => {
  req.session.userId = 1;
  next();
});

app.use('/trade', tradeRoutes);

describe('POST /trade', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should execute a successful BUY trade', async () => {
    // Mock DB query sequence
    db.query
      .mockResolvedValueOnce([[{ current_price: 100, quantity: 10, invested_amount: 1000 }]]) // holding
      .mockResolvedValueOnce([[{ balance: 10000 }]]) // wallet
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // wallet update
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // holdings update
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // transaction insert

    const response = await request(app)
      .post('/trade')
      .send({
        symbol: 'AAPL',
        quantity: 5,
        type: 'BUY',
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true });
  });

  it('should return 400 for insufficient wallet balance', async () => {
    db.query
      .mockResolvedValueOnce([[{ current_price: 100, quantity: 10, invested_amount: 1000 }]]) // holding
      .mockResolvedValueOnce([[{ balance: 200 }]]); // wallet

    const response = await request(app)
      .post('/trade')
      .send({
        symbol: 'AAPL',
        quantity: 5,
        type: 'BUY',
      });

    expect(response.status).toBe(400);
    expect(response.text).toBe('Insufficient wallet balance');
  });

  it('should return 404 if holding not found', async () => {
    db.query
      .mockResolvedValueOnce([[]]); // No holding found

    const response = await request(app)
      .post('/trade')
      .send({
        symbol: 'GOOGL',
        quantity: 5,
        type: 'SELL',
      });

    expect(response.status).toBe(404);
    expect(response.text).toBe('Holding not found');
  });

  it('should return 500 on unexpected DB error', async () => {
    db.query.mockRejectedValueOnce(new Error('DB error'));

    const response = await request(app)
      .post('/trade')
      .send({
        symbol: 'MSFT',
        quantity: 2,
        type: 'SELL',
      });

    expect(response.status).toBe(500);
    expect(response.text).toBe('Trade failed');
  });
});
