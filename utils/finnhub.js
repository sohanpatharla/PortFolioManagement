const axios = require('axios');
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;

const getStockPrice = async (symbol) => {
  try {
    //console.log(`Fetching price for: ${symbol}`);
    const response = await axios.get(`https://finnhub.io/api/v1/quote`, {
      params: {
        symbol,
        token: FINNHUB_API_KEY
      }
    });
    
    // Debug: Log the raw API response
    //console.log(`API Response for ${symbol}:`, JSON.stringify(response.data, null, 2));
    
    // Check if we got valid data
    if (!response.data) {
      console.warn(`No data returned for ${symbol}`);
      return null;
    }
    
    // Check for specific error responses from Finnhub
    if (response.data.error) {
      console.error(`Finnhub API error for ${symbol}:`, response.data.error);
      return null;
    }
    
    // Check if current price is valid
    if (response.data.c === undefined || response.data.c === null || response.data.c === 0) {
      console.warn(`No valid current price for ${symbol}. Current price:`, response.data.c);
      return null;
    }
    
    const result = {
      currentPrice: response.data.c,
      changePercent: response.data.dp !== undefined ? response.data.dp : null,
      previousClose: response.data.pc !== undefined ? response.data.pc : null,
      dayChange: response.data.d !== undefined ? response.data.d : null
    };
    
    //console.log(`Processed data for ${symbol}:`, result);
    return result;
    
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error.message);
    if (error.response) {
      console.error(`Status: ${error.response.status}, Data:`, error.response.data);
    }
    return null;
  }
};

module.exports = { getStockPrice };
