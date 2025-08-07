const express = require('express');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const db = require('../config/database');
const { getStockPrice } = require('../utils/finnhub');


// Apply authentication middleware to all portfolio routes
router.use(requireAuth);

// Get portfolio summary

router.get('/summary', async (req, res) => {
  try {
    const [holdings] = await db.execute(
      `SELECT invested_amount AS investedAmount, total_value AS totalValue
       FROM holdings
       WHERE user_id = ?`,
      [req.session.userId]
    );

    const totalInvestment = holdings.reduce((sum, h) => 
      sum + parseFloat(h.investedAmount || 0), 0
    );
    
    const currentValue = holdings.reduce((sum, h) => 
      sum + parseFloat(h.totalValue || 0), 0
    );

    const totalProfitLoss = currentValue - totalInvestment;
    const totalProfitLossPercentage = totalInvestment > 0 
      ? (totalProfitLoss / totalInvestment) * 100 
      : 0;

    res.json({
      totalInvestment: totalInvestment.toFixed(2),
      currentValue: currentValue.toFixed(2),
      totalProfitLoss: totalProfitLoss.toFixed(2),
      totalProfitLossPercentage: totalProfitLossPercentage.toFixed(2),
      holdingsCount: holdings.length
    });
  } catch (error) {
    console.error("Error fetching summary:", error);
    res.status(500).json({ error: 'Failed to fetch portfolio summary' });
  }
});



router.get('/holdings', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ error: 'Not authenticated' });

  try {
    // Fetch holdings from database
    const [rows] = await db.query(
      'SELECT id, user_id as userId, symbol, company_name as companyName, quantity, buy_price as buyPrice, current_price as currentPrice, purchase_date as purchaseDate, total_value as totalValue, profit_loss as profitLoss, profit_loss_percentage as profitLossPercentage ,invested_amount as investedAmount FROM holdings WHERE user_id = ?',
      [userId]
    );

    // Update current prices and recalculate values
    const updatedHoldings = await Promise.all(
      rows.map(async (holding) => {
        try {
          // Fetch current price from API
          const stockData = await getStockPrice(holding.symbol);
          const currentPrice = parseFloat(stockData.currentPrice);
          
          if (currentPrice !== null) {
            // Calculate updated values
            const totalValue = parseFloat(holding.quantity) * parseFloat(currentPrice);
            const profitLoss = parseFloat(totalValue) - parseFloat(holding.invested_amount);
const profitLossPercentage = holding.invested_amount !== 0
  ? (parseFloat(profitLoss / holding.invested_amount) * 100)
  : 0;

//   console.log('Debug values:', {
//   symbol: holding.symbol,
//   quantity: holding.quantity,
//   investedAmount: holding.invested_amount,
//   currentPrice: currentPrice,
//   totalValue: totalValue,
//   profitLoss: profitLoss
// });

            // Update database with new values
            await db.query(
              'UPDATE holdings SET current_price = ?, total_value = ?, profit_loss = ?, profit_loss_percentage = ? WHERE id = ?',
              [currentPrice, totalValue, profitLoss, profitLossPercentage, holding.id]
            );

            // Return updated holding
            return {
              ...holding,
              investedAmount: holding.invested_amount,
              currentPrice: currentPrice,
              totalValue: totalValue,
              profitLoss: profitLoss,
              profitLossPercentage: profitLossPercentage
            };
          } else {
            // If API call failed, return holding with existing data
            console.warn(`Failed to fetch current price for ${holding.symbol}, using stored price`);
            return holding;
          }
        } catch (error) {
          //console.error(`Error processing holding ${holding.symbol}:`, error);
          return holding; // Return original holding if processing fails
        }
      })
    );

    res.json(updatedHoldings);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});
router.post('/holdings', async (req, res) => {
  try {
    const { symbol, companyName, quantity, buyPrice, purchaseDate } = req.body;

    if (!symbol || !quantity || !buyPrice) {
      return res.status(400).json({ error: 'Symbol, quantity, and buy price are required' });
    }

    const parsedQuantity = parseFloat(quantity);
    const parsedBuyPrice = parseFloat(buyPrice);

    if (isNaN(parsedQuantity) || isNaN(parsedBuyPrice)) {
      return res.status(400).json({ error: 'Quantity and Buy Price must be valid numbers' });
    }

    //const currentPrice = parsedBuyPrice * (0.9 + Math.random() * 0.2);
    // const currentPrice = await getStockPrice(symbol.toUpperCase());
     const stockData = await getStockPrice(symbol.toUpperCase());
          const currentPrice = stockData.currentPrice;
    if (currentPrice === null) {
      return res.status(500).json({ error: 'Failed to fetch current stock price' });
    }
    const totalInvestment = parsedQuantity * parsedBuyPrice;
    const totalValue = holding.quantity * currentPrice;
const profitLoss = totalValue - holding.investedAmount;
const profitLossPercentage = holding.investedAmount !== 0
  ? (profitLoss / holding.investedAmount) * 100
  : 0;


    const insertQuery = `
    INSERT INTO holdings (
  user_id, symbol, company_name, quantity, buy_price, current_price, purchase_date,
  total_value, invested_amount, profit_loss, profit_loss_percentage
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

    `;

   await db.execute(insertQuery, [
  req.session.userId,
  symbol.toUpperCase(),
  companyName || symbol,
  parsedQuantity,
  parsedBuyPrice,
  parseFloat(currentPrice.toFixed(2)),
  purchaseDate || new Date().toISOString().split('T')[0],
  parseFloat(totalValue.toFixed(2)),
  parseFloat(totalInvestment.toFixed(2)), // invested_amount
  parseFloat(profitLoss.toFixed(2)),
  parseFloat(profitLossPercentage.toFixed(2))
]);


    res.status(201).json({ success: true });

  } catch (error) {
    console.error('Error inserting holding:', error);
    res.status(500).json({ error: 'Failed to add holding' });
  }
});



// Update holding
router.put('/holdings/:id', async (req, res) => {
  try {
    const holdingId = parseInt(req.params.id);
    const { quantity, buyPrice } = req.body;

    if (!quantity && !buyPrice) {
      return res.status(400).json({ error: 'Nothing to update' });
    }

    // Fetch current holding for current user
    const [rows] = await db.execute('SELECT * FROM holdings WHERE id = ? AND user_id = ?', [
      holdingId,
      req.session.userId
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    const holding = rows[0];

    // Apply updates
    const updatedQuantity = quantity ? parseFloat(quantity) : holding.quantity;
    const updatedBuyPrice = buyPrice ? parseFloat(buyPrice) : holding.buy_price;

    // Recalculate values
    const totalValue = updatedQuantity * holding.current_price;
    const totalInvestment = updatedQuantity * updatedBuyPrice;
    const profitLoss = totalValue - totalInvestment;
    const profitLossPercentage = (profitLoss / totalInvestment) * 100;

    // Update in DB
    const updateQuery = `
      UPDATE holdings SET
        quantity = ?, 
        buy_price = ?, 
        total_value = ?, 
        profit_loss = ?, 
        profit_loss_percentage = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;

    await db.execute(updateQuery, [
      updatedQuantity,
      updatedBuyPrice,
      totalValue.toFixed(2),
      profitLoss.toFixed(2),
      profitLossPercentage.toFixed(2),
      holdingId,
      req.session.userId
    ]);

    res.json({
      id: holdingId,
      quantity: updatedQuantity,
      buyPrice: updatedBuyPrice,
      currentPrice: holding.current_price,
      totalValue: totalValue.toFixed(2),
      profitLoss: profitLoss.toFixed(2),
      profitLossPercentage: profitLossPercentage.toFixed(2)
    });

  } catch (error) {
    console.error("Error updating holding:", error);
    res.status(500).json({ error: 'Failed to update holding' });
  }
});

router.delete('/holdings/:id', async (req, res) => {
  try {
    const holdingId = parseInt(req.params.id);

    // Check if holding exists for this user
    const [rows] = await db.execute('SELECT id FROM holdings WHERE id = ? AND user_id = ?', [
      holdingId,
      req.session.userId
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Holding not found' });
    }

    // Delete holding
    await db.execute('DELETE FROM holdings WHERE id = ? AND user_id = ?', [
      holdingId,
      req.session.userId
    ]);

    res.json({ message: 'Holding deleted successfully' });
  } catch (error) {
    console.error("Error deleting holding:", error);
    res.status(500).json({ error: 'Failed to delete holding' });
  }
});


// Get all transactions for the logged-in user
router.get('/transactions', async (req, res) => {
  try {
    const [transactions] = await db.execute(
      `SELECT id,user_id as userId,symbol,transaction_type as type,quantity,price,total_amount as total,transaction_date as date FROM transactions WHERE user_id = ? ORDER BY transaction_date DESC`,
      [req.session.userId]
    );
    //console.log(transactions);
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get watchlist
router.get('/watchlist', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, symbol, company_name AS companyName ,added_date AS addedDate
       FROM watchlist
       WHERE user_id = ?`,
      [req.session.userId]
    );

    // Update each row with real-time data
    const updatedRows = await Promise.all(rows.map(async (row) => {
      const data = await getStockPrice(row.symbol);
      if (data && data.currentPrice !== null) {
        // Update the DB with new price and percent
        await db.execute(
          `UPDATE watchlist 
           SET current_price = ?, change_percent = ? 
           WHERE id = ?`,
          [data.currentPrice, data.changePercent, row.id]
        );

        return {
          ...row,
          currentPrice: parseFloat(data.currentPrice.toFixed(2)),
          changePercent: parseFloat((data.changePercent || 0).toFixed(2)),
        };
      } else {
        // Return row with old/default values if fetch failed
        return {
          ...row,
          currentPrice: null,
          changePercent: null,
        };
      }
    }));

    res.json(updatedRows);
  } catch (error) {
    console.error("Error fetching watchlist:", error);
    res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});
// Add to watchlist
router.post('/watchlist', async (req, res) => {
  try {
    const { symbol, companyName } = req.body;

    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    // Check if already in watchlist
    const [existing] = await db.execute(
      `SELECT id FROM watchlist WHERE user_id = ? AND symbol = ?`,
      [req.session.userId, symbol.toUpperCase()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Stock already in watchlist' });
    }

    const currentPrice = 100 + Math.random() * 400;
    const changePercent = (Math.random() - 0.5) * 10;
    const addedDate = new Date().toISOString().split('T')[0];

    const insertQuery = `
      INSERT INTO watchlist (user_id, symbol, company_name, added_date, current_price, change_percent)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    await db.execute(insertQuery, [
      req.session.userId,
      symbol.toUpperCase(),
      companyName || symbol,
      addedDate,
      parseFloat(currentPrice.toFixed(2)),
      parseFloat(changePercent.toFixed(2))
    ]);

    res.status(201).json({
      symbol: symbol.toUpperCase(),
      companyName: companyName || symbol,
      currentPrice: parseFloat(currentPrice.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      addedDate
    });

  } catch (error) {
    console.error("Error adding to watchlist:", error);
    res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});
router.get('/performance', async (req, res) => {
  const userId = req.session.userId;

  const [rows] = await db.query(`
      SELECT 
          purchase_date,
          SUM(quantity * current_price) AS value
      FROM holdings
      WHERE user_id = ?
      GROUP BY purchase_date
      ORDER BY purchase_date
  `, [userId]);

  // Fill missing dates and accumulate values (simulate portfolio timeline)
  const performance = [];
  let currentDate = new Date(rows[0]?.purchase_date || new Date());
  let today = new Date();
  let index = 0;
  let lastValue = 0;

  while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split('T')[0];

      if (index < rows.length && rows[index].purchase_date.toISOString().split('T')[0] === dateStr) {
          lastValue += parseFloat(rows[index].value);
          index++;
      }

      performance.push({
          date: dateStr,
          value: lastValue
      });

      currentDate.setDate(currentDate.getDate() + 1);
  }

  res.json(performance);
});


router.delete('/watchlist/:id', async (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const userId = req.session.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const [result] = await db.execute(
      'DELETE FROM watchlist WHERE id = ? AND user_id = ?',
      [itemId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Watchlist item not found or not authorized to delete' });
    }

    res.json({ message: 'Item removed from watchlist' });
  } catch (error) {
    console.error('Error deleting watchlist item:', error);
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});


module.exports = router;