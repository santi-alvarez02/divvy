import { supabase } from '../lib/supabase';

/**
 * Fetch latest exchange rates from Vercel serverless function
 * This function is secure - API key is stored server-side only
 * @returns {Promise<Object>} Object with rates keyed by currency code
 */
export const fetchExchangeRates = async () => {
  try {
    // Call our Vercel serverless function instead of API directly
    // This keeps the API key secure on the server
    const response = await fetch('/api/exchange-rates');

    if (!response.ok) {
      throw new Error(`Server responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`API error: ${data.error || 'Unknown error'}`);
    }

    return {
      rates: data.rates,
      timestamp: data.timestamp,
      baseCode: data.baseCode
    };
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    throw error;
  }
};

/**
 * Save exchange rates to Supabase database
 * @param {Object} rates - Object with currency codes as keys and rates as values
 * @returns {Promise<void>}
 */
export const saveExchangeRatesToDB = async (rates) => {
  try {
    // Prepare data for bulk insert - rates are USD-based (converted from EUR)
    const rateEntries = Object.entries(rates).map(([currency, rate]) => ({
      from_currency: 'USD',
      to_currency: currency,
      rate: rate,
      updated_at: new Date().toISOString()
    }));

    // Use upsert to insert or update rates
    const { error } = await supabase
      .from('exchange_rates')
      .upsert(rateEntries, {
        onConflict: 'from_currency,to_currency',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error saving rates to database:', error);
      throw error;
    }

    console.log(`✅ Successfully saved ${rateEntries.length} exchange rates to database`);
  } catch (error) {
    console.error('Error in saveExchangeRatesToDB:', error);
    throw error;
  }
};

/**
 * Fetch exchange rates from database
 * @returns {Promise<Object>} Object with currency codes as keys and rates as values
 */
export const getExchangeRatesFromDB = async () => {
  try {
    const { data, error } = await supabase
      .from('exchange_rates')
      .select('from_currency, to_currency, rate, updated_at')
      .eq('from_currency', 'USD');

    if (error) {
      console.error('Error fetching rates from database:', error);
      throw error;
    }

    // Convert to object format: { EUR: 0.93, GBP: 0.79, ... }
    const rates = {};
    data.forEach(row => {
      rates[row.to_currency] = parseFloat(row.rate);
    });

    return {
      rates,
      updatedAt: data.length > 0 ? data[0].updated_at : null
    };
  } catch (error) {
    console.error('Error in getExchangeRatesFromDB:', error);
    throw error;
  }
};

/**
 * Update exchange rates: fetch from API and save to database
 * @returns {Promise<Object>} Updated rates object
 */
export const updateExchangeRates = async () => {
  try {
    const { rates } = await fetchExchangeRates();
    await saveExchangeRatesToDB(rates);
    return rates;
  } catch (error) {
    console.error('Error updating exchange rates:', error);
    throw error;
  }
};

/**
 * Convert amount from one currency to another
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency code (e.g., 'USD')
 * @param {string} toCurrency - Target currency code (e.g., 'EUR')
 * @param {Object} rates - Exchange rates object from database (USD-based)
 * @returns {number} Converted amount
 */
export const convertCurrency = (amount, fromCurrency, toCurrency, rates) => {
  // If same currency, no conversion needed
  if (fromCurrency === toCurrency) {
    return amount;
  }

  // Validate rates object exists
  if (!rates || typeof rates !== 'object') {
    console.warn('convertCurrency: Invalid rates object, returning original amount');
    return amount;
  }

  // Get exchange rates with validation
  const fromRate = rates[fromCurrency];
  const toRate = rates[toCurrency];

  // Validate exchange rates exist and are valid numbers
  if (fromCurrency !== 'USD' && (!fromRate || fromRate === 0 || isNaN(fromRate))) {
    console.warn(`convertCurrency: Missing or invalid exchange rate for ${fromCurrency}, returning original amount`);
    return amount;
  }

  if (toCurrency !== 'USD' && (!toRate || toRate === 0 || isNaN(toRate))) {
    console.warn(`convertCurrency: Missing or invalid exchange rate for ${toCurrency}, returning original amount`);
    return amount;
  }

  // All rates are relative to USD, so we convert through USD
  // Step 1: Convert from source currency to USD
  const amountInUSD = fromCurrency === 'USD'
    ? amount
    : amount / fromRate;

  // Step 2: Convert from USD to target currency
  const convertedAmount = toCurrency === 'USD'
    ? amountInUSD
    : amountInUSD * toRate;

  // Validate result is a valid number
  if (isNaN(convertedAmount) || !isFinite(convertedAmount)) {
    console.error('convertCurrency: Conversion resulted in invalid number, returning original amount');
    return amount;
  }

  return convertedAmount;
};

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} Formatted string with symbol
 */
export const formatCurrencyAmount = (amount, currency) => {
  // Currency symbols mapping
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CNY': '¥',
    'INR': '₹',
    'CAD': 'C$',
    'AUD': 'A$',
    'CHF': 'CHF',
    'MXN': 'MX$',
    'BRL': 'R$',
    'KRW': '₩',
    'RUB': '₽'
  };

  const symbol = symbols[currency] || currency;
  const formattedAmount = Number.isInteger(amount)
    ? amount
    : amount.toFixed(2).replace(/\.00$/, '');

  return `${symbol}${formattedAmount}`;
};

/**
 * Check if exchange rates need updating (older than 8 hours)
 * @returns {Promise<boolean>} True if rates need updating
 */
export const shouldUpdateRates = async () => {
  try {
    const { updatedAt } = await getExchangeRatesFromDB();

    if (!updatedAt) {
      return true; // No rates in database
    }

    const lastUpdate = new Date(updatedAt);
    const now = new Date();
    const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);

    return hoursSinceUpdate >= 8;
  } catch (error) {
    console.error('Error checking if rates need update:', error);
    return false;
  }
};

/**
 * Get hours since last rate update
 * @returns {Promise<number|null>} Hours since update, or null if no data
 */
export const getHoursSinceUpdate = async () => {
  try {
    const { updatedAt } = await getExchangeRatesFromDB();

    if (!updatedAt) {
      return null;
    }

    const lastUpdate = new Date(updatedAt);
    const now = new Date();
    const hours = (now - lastUpdate) / (1000 * 60 * 60);

    return Math.floor(hours);
  } catch (error) {
    console.error('Error getting hours since update:', error);
    return null;
  }
};
