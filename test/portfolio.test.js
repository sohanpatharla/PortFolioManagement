const request = require('supertest');
const express = require('express');
const session = require('express-session');
const portfolioRoutes = require('../routes/portfolio');
const db = require('../config/database');
const finnhub = require('../utils/finnhub');

jest.mock('../config/database');
jest.mock('../utils/finnhub');

const app = express();
app.use(express.json());

// Mock session middleware
app.use(
  session({
    secret: 'test',
    resave: false,
    saveUninitialized: false
  })
);

// Middleware to simulate a logged-in user
app.use((req, res, next) => {
  req.session.userId = 1;
  req.session.userEmail = 'test@example.com';
  req.session.firstName = 'Test';
  req.session.lastName = 'User';
  next();
});

app.use('/portfolio', portfolioRoutes);

describe('Portfolio Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /portfolio/summary', () => {
    it('should return portfolio summary', async () => {
      db.execute.mockResolvedValueOnce([
        [
          { investedAmount: '1000.00', totalValue: '1200.00' },
          { investedAmount: '500.00', totalValue: '400.00' }
        ]
      ]);

      const res = await request(app).get('/portfolio/summary');

      expect(res.statusCode).toBe(200);
      expect(res.body.totalInvestment).toBe('1500.00');
      expect(res.body.currentValue).toBe('1600.00');
      expect(res.body.totalProfitLoss).toBe('100.00');
      expect(res.body.holdingsCount).toBe(2);
    });
  });

  describe('GET /portfolio/holdings', () => {
    it('should return updated holdings', async () => {
      db.query.mockResolvedValueOnce([
        [
          {
            id: 1,
            userId: 1,
            symbol: 'AAPL',
            companyName: 'Apple Inc.',
            quantity: 5,
            buyPrice: 100,
            currentPrice: 110,
            purchaseDate: '2023-01-01',
            totalValue: 500,
            profitLoss: 0,
            profitLossPercentage: 0,
            investedAmount: 500
          }
        ]
      ]);

      finnhub.getStockPrice.mockResolvedValueOnce({ currentPrice: 120 });

      db.query.mockResolvedValueOnce([{}]); // Mock update query

      const res = await request(app).get('/portfolio/holdings');

      expect(res.statusCode).toBe(200);
      expect(res.body[0].symbol).toBe('AAPL');
      expect(res.body[0].currentPrice).toBe(120);
    });
  });

  describe('POST /portfolio/watchlist', () => {
    it('should add a stock to watchlist', async () => {
      db.execute.mockResolvedValueOnce([[]]); // No existing watchlist entry
      db.execute.mockResolvedValueOnce([{}]); // Insert success

      const res = await request(app)
        .post('/portfolio/watchlist')
        .send({ symbol: 'TSLA', companyName: 'Tesla Inc.' });

      expect(res.statusCode).toBe(201);
      expect(res.body.symbol).toBe('TSLA');
    });

    it('should return 400 if symbol is missing', async () => {
      const res = await request(app)
        .post('/portfolio/watchlist')
        .send({ companyName: 'Tesla Inc.' });

      expect(res.statusCode).toBe(400);
    });
  });
});
