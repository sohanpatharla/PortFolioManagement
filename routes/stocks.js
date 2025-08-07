const axios = require('axios');
const express = require('express');
const router = express.Router();

const API_KEY = process.env.TWELVE_DATA_API_KEY;

router.get('/history/:symbol', async (req, res) => {
  const { symbol } = req.params;
  const { range = '1day' } = req.query;

  const interval = range === '1day' ? '5min' : (range === '1week' ? '30min' : '1day');
  const outputsize = range === '1day' ? 100 : 200;

  try {
    const response = await axios.get('https://api.twelvedata.com/time_series', {
      params: {
        symbol,
        interval,
        outputsize,
        apikey: API_KEY
      }
    });

    if (response.data.values) {
      res.json(response.data.values.reverse());
    } else {
      res.status(500).json({ error: 'Failed to fetch stock data' });
    }
  } catch (error) {
    console.error('Error fetching historical data:', error.message);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

module.exports = router;
