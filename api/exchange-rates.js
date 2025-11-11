// Vercel Serverless Function - Exchange Rates API
// This function securely fetches exchange rates without exposing the API key to the client

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get API key from environment variable (server-side only, not exposed to client)
  const API_KEY = process.env.EXCHANGERATESAPI_KEY;

  if (!API_KEY) {
    console.error('EXCHANGERATESAPI_KEY environment variable is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  const API_BASE_URL = 'https://api.exchangeratesapi.io/v1';

  try {
    // Fetch latest exchange rates from exchangeratesapi.io
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

    // Return converted rates with cache headers
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.status(200).json({
      success: true,
      rates: usdBasedRates,
      timestamp: data.timestamp,
      baseCode: 'USD'
    });

  } catch (error) {
    console.error('Error fetching exchange rates:', error);

    // Don't expose internal error details to client
    res.status(500).json({
      success: false,
      error: 'Failed to fetch exchange rates',
      message: error.message
    });
  }
}
