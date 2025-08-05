const express = require('express');
const router = express.Router();
const db = require('../config/database'); // Update path to your db connection

// Get wallet balance
router.get('/', async (req, res) => {
  const userId = req.session.userId;
  const [rows] = await db.query('SELECT balance FROM wallet WHERE user_id = ?', [userId]);
  res.json({ balance: rows[0]?.balance || 0 });
});

// Deposit money
router.post('/deposit', async (req, res) => {
  const userId = req.session.userId;
  const { amount } = req.body;

  if (amount <= 0) return res.status(400).send('Invalid amount');

  await db.query(`
    INSERT INTO wallet (user_id, balance) VALUES (?, ?)
    ON DUPLICATE KEY UPDATE balance = balance + VALUES(balance)
  `, [userId, amount]);

  res.send({ success: true });
});

module.exports = router;
