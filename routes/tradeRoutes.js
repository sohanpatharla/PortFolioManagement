const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.post('/', async (req, res) => {
  const userId = req.session.userId;
  const { symbol, quantity, type } = req.body;

  try {
    const [[holding]] = await db.query('SELECT * FROM holdings WHERE user_id = ? AND symbol = ?', [userId, symbol]);
    if (!holding) return res.status(404).send('Holding not found');

    const price = holding.current_price;
    const totalAmount = quantity * price;

    const [[wallet]] = await db.query('SELECT balance FROM wallet WHERE user_id = ?', [userId]);
    let balance = parseFloat(wallet?.balance || 0);

    if (type === 'BUY') {
      if (balance < totalAmount) return res.status(400).send('Insufficient wallet balance');
      await db.query('UPDATE wallet SET balance = balance - ? WHERE user_id = ?', [totalAmount, userId]);

      if (holding) {
      const investedChange = quantity * price;
await db.query(`
  UPDATE holdings
  SET quantity = quantity + ?, 
      invested_amount = invested_amount + ?, 
      total_value = (quantity + ?) * current_price,
      profit_loss = ((quantity + ?) * current_price) - (invested_amount + ?),
      profit_loss_percentage = ROUND((((quantity + ?) * current_price - (invested_amount + ?)) / (invested_amount + ?)) * 100, 2)
  WHERE user_id = ? AND symbol = ?
`, [quantity, investedChange, quantity, quantity, investedChange, quantity, investedChange, investedChange, userId, symbol]);

} else {
        await db.query(`INSERT INTO holdings (user_id, symbol, company_name, quantity, buy_price, current_price, purchase_date)
                        VALUES (?, ?, ?, ?, ?, ?, CURDATE())`, [userId, symbol, symbol, quantity, price, price]);
      }

    } else if (type === 'SELL') {const [[holding]] = await db.query('SELECT quantity, invested_amount FROM holdings WHERE user_id = ? AND symbol = ?', [userId, symbol]);
const totalQty = holding.quantity;
const totalInvested = holding.invested_amount;

const avgInvestedPerUnit = totalInvested / totalQty;
const investedToRemove = avgInvestedPerUnit * quantity;

await db.query(`
  UPDATE holdings
  SET quantity = quantity - ?, 
      invested_amount = invested_amount - ?, 
      total_value = (quantity - ?) * current_price,
      profit_loss = ((quantity - ?) * current_price) - (invested_amount - ?),
      profit_loss_percentage = ROUND((((quantity - ?) * current_price - (invested_amount - ?)) / (invested_amount - ?)) * 100, 2)
  WHERE user_id = ? AND symbol = ?
`, [quantity, investedToRemove, quantity, quantity, investedToRemove, quantity, investedToRemove, investedToRemove, userId, symbol]);

    }

    // Store transaction
    await db.query(`INSERT INTO transactions (user_id, symbol, transaction_type, quantity, price, total_amount, transaction_date)
                    VALUES (?, ?, ?, ?, ?, ?, CURDATE())`, [userId, symbol, type, quantity, price, totalAmount]);

    res.send({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Trade failed');
  }
});

module.exports = router;
