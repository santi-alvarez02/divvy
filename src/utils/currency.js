// Currency utility functions

export const getCurrencySymbol = (currencyCode) => {
  const symbols = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'CAD': 'C$',
    'AUD': 'A$'
  };
  return symbols[currencyCode] || '$';
};

export const formatCurrency = (amount, currencyCode = 'USD') => {
  const symbol = getCurrencySymbol(currencyCode);
  const formattedAmount = Number.isInteger(amount)
    ? amount
    : amount.toFixed(2).replace(/\.00$/, '');

  return `${symbol}${formattedAmount}`;
};
