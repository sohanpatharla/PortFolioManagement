const express = require('express');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const db = require('../config/database');

// Static dummy data for portfolio (replace with database later)
const dummyHoldings = [
  {
    id: 1,
    userId: 1,
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    quantity: 50,
    buyPrice: 150.25,
    currentPrice: 175.80,
    purchaseDate: '2023-03-15',
    totalValue: 8790.00,
    profitLoss: 1277.50,
    profitLossPercentage: 17.02
  },
  {
    id: 2,
    userId: 1,
    symbol: 'GOOGL',
    companyName: 'Alphabet Inc.',
    quantity: 25,
    buyPrice: 2450.75,
    currentPrice: 2680.30,
    purchaseDate: '2023-02-10',
    totalValue: 67007.50,
    profitLoss: 5738.75,
    profitLossPercentage: 9.36
  },
  {
    id: 3,
    userId: 1,
    symbol: 'MSFT',
    companyName: 'Microsoft Corporation',
    quantity: 40,
    buyPrice: 285.60,
    currentPrice: 312.45,
    purchaseDate: '2023-01-20',
    totalValue: 12498.00,
    profitLoss: 1074.00,
    profitLossPercentage: 9.40
  },
  {
    id: 4,
    userId: 1,
    symbol: 'TSLA',
    companyName: 'Tesla Inc.',
    quantity: 15,
    buyPrice: 220.80,
    currentPrice: 195.25,
    purchaseDate: '2023-04-05',
    totalValue: 2928.75,
    profitLoss: -383.25,
    profitLossPercentage: -11.58
  },
  {
    id: 5,
    userId: 1,
    symbol: 'AMZN',
    companyName: 'Amazon.com Inc.',
    quantity: 35,
    buyPrice: 3180.50,
    currentPrice: 3385.20,
    purchaseDate: '2023-03-08',
    totalValue: 118482.00,
    profitLoss: 7164.50,
    profitLossPercentage: 6.44
  }
];

const dummyTransactions = [
  {
    id: 1,
    userId: 1,
    symbol: 'AAPL',
    type: 'BUY',
    quantity: 50,
    price: 150.25,
    total: 7512.50,
    date: '2023-03-15',
    fees: 9.99
  },
  {
    id: 2,
    userId: 1,
    symbol: 'GOOGL',
    type: 'BUY',
    quantity: 25,
    price: 2450.75,
    total: 61268.75,
    date: '2023-02-10',
    fees: 15.99
  },
  {
    id: 3,
    userId: 1,
    symbol: 'MSFT',
    type: 'BUY',
    quantity: 40,
    price: 285.60,
    total: 11424.00,
    date: '2023-01-20',
    fees: 12.99
  },
  {
    id: 4,
    userId: 1,
    symbol: 'TSLA',
    type: 'BUY',
    quantity: 15,
    price: 220.80,
    total: 3312.00,
    date: '2023-04-05',
    fees: 8.99
  },
  {
    id: 5,
    userId: 1,
    symbol: 'AMZN',
    type: 'BUY',
    quantity: 35,
    price: 3180.50,
    total: 111317.50,
    date: '2023-03-08',
    fees: 18.99
  },
  {
    id: 6,
    userId: 1,
    symbol: 'AAPL',
    type: 'SELL',
    quantity: 10,
    price: 172.30,
    total: 1723.00,
    date: '2023-05-12',
    fees: 7.99
  }
];

const dummyWatchlist = [
  {
    id: 1,
    userId: 1,
    symbol: 'NVDA',
    companyName: 'NVIDIA Corporation',
    currentPrice: 485.20,
    changePercent: 2.45,
    addedDate: '2023-05-01'
  },
  {
    id: 2,
    userId: 1,
    symbol: 'META',
    companyName: 'Meta Platforms Inc.',
    currentPrice: 298.75,
    changePercent: -1.23,
    addedDate: '2023-04-28'
  },
  {
    id: 3,
    userId: 1,
    symbol: 'NFLX',
    companyName: 'Netflix Inc.',
    currentPrice: 425.60,
    changePercent: 0.87,
    addedDate: '2023-05-10'
  },
  {
    id: 4,
    userId: 1,
    symbol: 'AMD',
    companyName: 'Advanced Micro Devices Inc.',
    currentPrice: 102.85,
    changePercent: 3.21,
    addedDate: '2023-05-05'
  }
];

// Apply authentication middleware to all portfolio routes
//router.use(requireAuth);

// Get portfolio summary
// Get portfolio summary
router.get('/summary', async (req, res) => {
  try {
    const [holdings] = await db.execute(
      `SELECT quantity, buy_price AS buyPrice, total_value AS totalValue
       FROM holdings
       WHERE user_id = ?`,
      [req.session.userId]
    );

    const totalInvestment = holdings.reduce((sum, h) => 
      sum + (parseFloat(h.quantity || 0) * parseFloat(h.buyPrice || 0)), 0
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


// Get all holdings
router.get('/holdings', async (req, res) => {
  // try {
  //   const userHoldings = dummyHoldings.filter(holding => holding.userId === req.session.userId);
  //   console.log(userHoldings);
    
  //   res.json(userHoldings);
  // } catch (error) {
  //   res.status(500).json({ error: 'Failed to fetch holdings' });
  // }
  const userId = req.session.userId; // assuming session is set
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    try {
        const [rows] = await db.query(
            'SELECT id,user_id as userId,symbol, company_name as companyName, quantity, buy_price as buyPrice, current_price as currentPrice,purchase_date as purchaseDate,total_value as totalValue,profit_loss as profitLoss,profit_loss_percentage as profitLossPercentage FROM holdings WHERE user_id = ?',
            [userId]
        );
        //console.log(rows);
        
        res.json(rows);
    } catch (err) {
        console.error(err);
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

    const currentPrice = parsedBuyPrice * (0.9 + Math.random() * 0.2);
    const totalInvestment = parsedQuantity * parsedBuyPrice;
    const totalValue = parsedQuantity * currentPrice;
    const profitLoss = totalValue - totalInvestment;
    const profitLossPercentage = totalInvestment !== 0 ? (profitLoss / totalInvestment) * 100 : 0;

    const insertQuery = `
      INSERT INTO holdings (
        user_id, symbol, company_name, quantity, buy_price, current_price, purchase_date,
        total_value, profit_loss, profit_loss_percentage
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      parseFloat(profitLoss.toFixed(2)),
      parseFloat(profitLossPercentage.toFixed(2))
    ]);

    res.status(201).json({ success: true });

  } catch (error) {
    console.error('Error inserting holding:', error);
    res.status(500).json({ error: 'Failed to add holding' });
  }
});

// Add new holding
// router.post('/holdings', async (req, res) => {
//   try {
//     const { symbol, companyName, quantity, buyPrice, purchaseDate } = req.body;
    
    
//     if (!symbol || !quantity || !buyPrice) {
//       return res.status(400).json({ error: 'Symbol, quantity, and buy price are required' });
//     }

//     // Simulate current price (in real app, fetch from API)
//     const currentPrice = buyPrice * (0.9 + Math.random() * 0.2); // Random price within 10% of buy price
//     const totalValue = quantity * currentPrice;
//     const totalInvestment = quantity * buyPrice;
//     const profitLoss = totalValue - totalInvestment;
//     const profitLossPercentage = (profitLoss / totalInvestment) * 100;

//     // const newHolding = {
//     //   id: dummyHoldings.length + 1,
//     //   userId: req.session.userId,
//     //   symbol: symbol.toUpperCase(),
//     //   companyName: companyName || symbol,
//     //   quantity: parseFloat(quantity),
//     //   buyPrice: parseFloat(buyPrice),
//     //   currentPrice: parseFloat(currentPrice.toFixed(2)),
//     //   purchaseDate: purchaseDate || new Date().toISOString().split('T')[0],
//     //   totalValue: parseFloat(totalValue.toFixed(2)),
//     //   profitLoss: parseFloat(profitLoss.toFixed(2)),
//     //   profitLossPercentage: parseFloat(profitLossPercentage.toFixed(2))
//     // };

//     // dummyHoldings.push(newHolding);
//     // res.status(201).json(newHolding);
    
// const insertQuery = `
//   INSERT INTO holdings (
//     user_id, symbol, company_name, quantity, buy_price, current_price, purchase_date,
//     total_value, profit_loss, profit_loss_percentage
//   ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
// `;

//     await db.execute(insertQuery, [
//   req.session.userId,
//   symbol.toUpperCase(),
//   companyName || symbol,
//   parseFloat(quantity),
//   parseFloat(buyPrice),
//   parseFloat(currentPrice.toFixed(2)),
//   purchaseDate || new Date().toISOString().split('T')[0],
//   parseFloat(totalValue.toFixed(2)),
//   parseFloat(profitLoss.toFixed(2)),
//   parseFloat(profitLossPercentage.toFixed(2))
// ]);

// res.status(201).json({ success: true });

//   } catch (error) {
//     res.status(500).json({ error: 'Failed to add holding' });
//   }
// });

// // Update holding
// router.put('/holdings/:id', (req, res) => {
//   try {
//     const holdingId = parseInt(req.params.id);
//     const { quantity, buyPrice } = req.body;
    
//     const holdingIndex = dummyHoldings.findIndex(h => h.id === holdingId && h.userId === req.session.userId);
    
//     if (holdingIndex === -1) {
//       return res.status(404).json({ error: 'Holding not found' });
//     }

//     const holding = dummyHoldings[holdingIndex];
    
//     if (quantity) holding.quantity = parseFloat(quantity);
//     if (buyPrice) holding.buyPrice = parseFloat(buyPrice);
    
//     // Recalculate values
//     const totalValue = holding.quantity * holding.currentPrice;
//     const totalInvestment = holding.quantity * holding.buyPrice;
//     const profitLoss = totalValue - totalInvestment;
//     const profitLossPercentage = (profitLoss / totalInvestment) * 100;
    
//     holding.totalValue = parseFloat(totalValue.toFixed(2));
//     holding.profitLoss = parseFloat(profitLoss.toFixed(2));
//     holding.profitLossPercentage = parseFloat(profitLossPercentage.toFixed(2));

//     res.json(holding);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to update holding' });
//   }
// });

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

// // Delete holding
// router.delete('/holdings/:id', (req, res) => {
//   try {
//     const holdingId = parseInt(req.params.id);
//     const holdingIndex = dummyHoldings.findIndex(h => h.id === holdingId && h.userId === req.session.userId);
    
//     if (holdingIndex === -1) {
//       return res.status(404).json({ error: 'Holding not found' });
//     }

//     dummyHoldings.splice(holdingIndex, 1);
//     res.json({ message: 'Holding deleted successfully' });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to delete holding' });
//   }
// });
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

// Get all transactions
// router.get('/transactions', (req, res) => {
//   try {
//     const userTransactions = dummyTransactions.filter(transaction => transaction.userId === req.session.userId);
//     console.log("userTransactions:", userTransactions);
    
//     res.json(userTransactions);
    
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch transactions' });
//   }
// });
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

// // Get watchlist
// router.get('/watchlist', (req, res) => {
//   try {
//     const userWatchlist = dummyWatchlist.filter(item => item.userId === req.session.userId);
//     res.json(userWatchlist);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to fetch watchlist' });
//   }
// });
// Get watchlist
router.get('/watchlist', async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, symbol, company_name AS companyName, current_price AS currentPrice, 
              change_percent AS changePercent, added_date AS addedDate
       FROM watchlist
       WHERE user_id = ?`,
      [req.session.userId]
    );

    res.json(rows);
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
// // Add to watchlist
// router.post('/watchlist', (req, res) => {
//   try {
//     const { symbol, companyName } = req.body;
    
//     if (!symbol) {
//       return res.status(400).json({ error: 'Symbol is required' });
//     }

//     // Check if already in watchlist
//     const exists = dummyWatchlist.find(item => 
//       item.userId === req.session.userId && item.symbol === symbol.toUpperCase()
//     );
    
//     if (exists) {
//       return res.status(400).json({ error: 'Stock already in watchlist' });
//     }

//     // Simulate current price and change
//     const currentPrice = 100 + Math.random() * 400; // Random price between 100-500
//     const changePercent = (Math.random() - 0.5) * 10; // Random change between -5% to +5%

//     const newWatchlistItem = {
//       id: dummyWatchlist.length + 1,
//       userId: req.session.userId,
//       symbol: symbol.toUpperCase(),
//       companyName: companyName || symbol,
//       currentPrice: parseFloat(currentPrice.toFixed(2)),
//       changePercent: parseFloat(changePercent.toFixed(2)),
//       addedDate: new Date().toISOString().split('T')[0]
//     };

//     dummyWatchlist.push(newWatchlistItem);
//     res.status(201).json(newWatchlistItem);
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to add to watchlist' });
//   }
// });

// Remove from watchlist
router.delete('/watchlist/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const itemIndex = dummyWatchlist.findIndex(item => item.id === itemId && item.userId === req.session.userId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }

    dummyWatchlist.splice(itemIndex, 1);
    res.json({ message: 'Item removed from watchlist' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

module.exports = router;