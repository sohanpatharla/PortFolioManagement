const axios = require('axios');
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

const getStockPrice = async (symbol) => {
  try {
    const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
      params: {
        symbol,
        token: FINNHUB_API_KEY
      }
    });
    return response.data.c; // c = current price
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error.message);
    return null;
  }
};

module.exports = { getStockPrice };
