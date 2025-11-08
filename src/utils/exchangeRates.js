import { supabase } from '../lib/supabase';

const API_KEY = import.meta.env.VITE_EXCHANGERATESAPI_KEY;
const API_BASE_URL = 'https://api.exchangeratesapi.io/v1';

/**
 * Fetch latest exchange rates from exchangeratesapi.io API
 * @returns {Promise<Object>} Object with rates keyed by currency code
 */
export const fetchExchangeRates = async () => {
  try {
    // Use access_key query parameter for authentication
    // Free tier only supports EUR base, so we don't specify base parameter
    const response = await fetch(`${API_BASE_URL}/latest?access_key=${API_KEY}`);

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`API error: ${data.error?.type || 'Unknown error'}`);
    }

    // API returns EUR-based rates, convert to USD-based for our app
    const eurToUsd = data.rates.USD; // How many USD per 1 EUR
    const usdBasedRates = {};

    // Convert all EUR-based rates to USD-based rates
    Object.entries(data.rates).forEach(([currency, eurRate]) => {
      // eurRate is how many of that currency per 1 EUR
      // We want: how many of that currency per 1 USD
      // Formula: usdRate = eurRate / eurToUsd
      usdBasedRates[currency] = eurRate / eurToUsd;
    });

    // Log the conversion for debugging
    console.log('📊 API Response (EUR-based):', {
      base: data.base,
      timestamp: new Date(data.timestamp * 1000).toLocaleString(),
      eurToUsd: eurToUsd,
      sampleEURRates: {
        USD: data.rates.USD,
        EUR: data.rates.EUR,
        GBP: data.rates.GBP,
        JPY: data.rates.JPY
      }
    });

    console.log('📊 Converted to USD-based:', {
      sampleUSDRates: {
        USD: usdBasedRates.USD,
        EUR: usdBasedRates.EUR,
        GBP: usdBasedRates.GBP,
        JPY: usdBasedRates.JPY
      }
    });

    return {
      rates: usdBasedRates,
      timestamp: data.timestamp,
      baseCode: 'USD' // We converted to USD base
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
    console.log('📊 Fetching latest exchange rates from API...');
    const { rates } = await fetchExchangeRates();

    console.log('💾 Saving rates to database...');
    await saveExchangeRatesToDB(rates);

    console.log('✅ Exchange rates updated successfully');
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

  // Log the conversion details
  console.log('💱 Converting:', {
    amount,
    from: fromCurrency,
    to: toCurrency,
    rateFrom: rates[fromCurrency],
    rateTo: rates[toCurrency]
  });

  // All rates are relative to USD, so we convert through USD
  // Step 1: Convert from source currency to USD
  const amountInUSD = fromCurrency === 'USD'
    ? amount
    : amount / rates[fromCurrency];

  // Step 2: Convert from USD to target currency
  const convertedAmount = toCurrency === 'USD'
    ? amountInUSD
    : amountInUSD * rates[toCurrency];

  console.log('💱 Conversion result:', {
    amountInUSD,
    convertedAmount
  });

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
