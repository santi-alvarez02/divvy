// Mock data for the Divvy app

export const currentUser = {
  id: 1,
  name: 'You',
};

export const roommates = [
  { id: 1, name: 'You', color: 'bg-blue-500' },
  { id: 2, name: 'Sarah', color: 'bg-purple-500' },
  { id: 3, name: 'Mike', color: 'bg-green-500' },
];

export const expenses = [
  {
    id: 1,
    amount: 120.50,
    category: 'Groceries',
    description: 'Weekly groceries at Whole Foods',
    date: '2025-10-24',
    paidBy: 2, // Sarah
    splitBetween: [1, 2, 3],
    icon: '🛒',
  },
  {
    id: 2,
    amount: 85.00,
    category: 'Utilities',
    description: 'Electric bill',
    date: '2025-10-23',
    paidBy: 1, // You
    splitBetween: [1, 2, 3],
    icon: '⚡',
  },
  {
    id: 3,
    amount: 45.75,
    category: 'Food & Dining',
    description: 'Pizza night',
    date: '2025-10-22',
    paidBy: 3, // Mike
    splitBetween: [1, 2, 3],
    icon: '🍕',
  },
  {
    id: 4,
    amount: 60.00,
    category: 'Internet',
    description: 'Monthly internet bill',
    date: '2025-10-20',
    paidBy: 2, // Sarah
    splitBetween: [1, 2, 3],
    icon: '📡',
  },
  {
    id: 5,
    amount: 150.00,
    category: 'Rent',
    description: 'Common area cleaning service',
    date: '2025-10-18',
    paidBy: 1, // You
    splitBetween: [1, 2, 3],
    icon: '🏠',
  },
  {
    id: 6,
    amount: 32.50,
    category: 'Entertainment',
    description: 'Movie tickets',
    date: '2025-10-17',
    paidBy: 3, // Mike
    splitBetween: [1, 3],
    icon: '🎬',
  },
  {
    id: 7,
    amount: 75.20,
    category: 'Groceries',
    description: 'Costco run',
    date: '2025-10-15',
    paidBy: 1, // You
    splitBetween: [1, 2, 3],
    icon: '🛒',
  },
  {
    id: 8,
    amount: 25.00,
    category: 'Household',
    description: 'Cleaning supplies',
    date: '2025-10-14',
    paidBy: 2, // Sarah
    splitBetween: [1, 2, 3],
    icon: '🧹',
  },
  {
    id: 9,
    amount: 180.00,
    category: 'Utilities',
    description: 'Water & sewage bill',
    date: '2025-10-12',
    paidBy: 3, // Mike
    splitBetween: [1, 2, 3],
    icon: '💧',
  },
  {
    id: 10,
    amount: 95.50,
    category: 'Groceries',
    description: 'Trader Joes haul',
    date: '2025-10-10',
    paidBy: 2, // Sarah
    splitBetween: [1, 2, 3],
    icon: '🛒',
  },
  {
    id: 11,
    amount: 120.00,
    category: 'Entertainment',
    description: 'Concert tickets',
    date: '2025-10-08',
    paidBy: 3, // Mike
    splitBetween: [1, 3],
    icon: '🎵',
  },
  // September expenses
  {
    id: 12,
    amount: 200.00,
    category: 'Groceries',
    description: 'Monthly grocery run',
    date: '2025-09-25',
    paidBy: 1,
    splitBetween: [1, 2, 3],
    icon: '🛒',
  },
  {
    id: 13,
    amount: 90.00,
    category: 'Utilities',
    description: 'Electric bill',
    date: '2025-09-20',
    paidBy: 2,
    splitBetween: [1, 2, 3],
    icon: '⚡',
  },
  {
    id: 14,
    amount: 150.00,
    category: 'Entertainment',
    description: 'Weekend trip',
    date: '2025-09-15',
    paidBy: 3,
    splitBetween: [1, 2, 3],
    icon: '🎢',
  },
  {
    id: 15,
    amount: 60.00,
    category: 'Internet',
    description: 'Internet bill',
    date: '2025-09-10',
    paidBy: 1,
    splitBetween: [1, 2, 3],
    icon: '📡',
  },
  {
    id: 16,
    amount: 180.00,
    category: 'Utilities',
    description: 'Water bill',
    date: '2025-09-05',
    paidBy: 2,
    splitBetween: [1, 2, 3],
    icon: '💧',
  },
  // August expenses
  {
    id: 17,
    amount: 250.00,
    category: 'Groceries',
    description: 'Costco shopping',
    date: '2025-08-28',
    paidBy: 1,
    splitBetween: [1, 2, 3],
    icon: '🛒',
  },
  {
    id: 18,
    amount: 95.00,
    category: 'Utilities',
    description: 'Electric bill',
    date: '2025-08-22',
    paidBy: 3,
    splitBetween: [1, 2, 3],
    icon: '⚡',
  },
  {
    id: 19,
    amount: 75.00,
    category: 'Food & Dining',
    description: 'Restaurant dinner',
    date: '2025-08-18',
    paidBy: 2,
    splitBetween: [1, 2, 3],
    icon: '🍽️',
  },
  {
    id: 20,
    amount: 60.00,
    category: 'Internet',
    description: 'Internet bill',
    date: '2025-08-12',
    paidBy: 1,
    splitBetween: [1, 2, 3],
    icon: '📡',
  },
  {
    id: 21,
    amount: 120.00,
    category: 'Entertainment',
    description: 'Concert tickets',
    date: '2025-08-08',
    paidBy: 3,
    splitBetween: [1, 2, 3],
    icon: '🎵',
  },
  // July expenses
  {
    id: 22,
    amount: 180.00,
    category: 'Groceries',
    description: 'Weekly groceries',
    date: '2025-07-26',
    paidBy: 2,
    splitBetween: [1, 2, 3],
    icon: '🛒',
  },
  {
    id: 23,
    amount: 85.00,
    category: 'Utilities',
    description: 'Electric bill',
    date: '2025-07-20',
    paidBy: 1,
    splitBetween: [1, 2, 3],
    icon: '⚡',
  },
  {
    id: 24,
    amount: 110.00,
    category: 'Food & Dining',
    description: 'Birthday dinner',
    date: '2025-07-15',
    paidBy: 3,
    splitBetween: [1, 2, 3],
    icon: '🎂',
  },
  {
    id: 25,
    amount: 60.00,
    category: 'Internet',
    description: 'Internet bill',
    date: '2025-07-10',
    paidBy: 2,
    splitBetween: [1, 2, 3],
    icon: '📡',
  },
  {
    id: 26,
    amount: 90.00,
    category: 'Household',
    description: 'Cleaning supplies',
    date: '2025-07-05',
    paidBy: 1,
    splitBetween: [1, 2, 3],
    icon: '🧹',
  },
];

// Monthly budget
export const monthlyBudget = {
  limit: 1500,
  spent: 594.95, // Sum of current month expenses
  month: 'October',
  year: 2025,
};

// Calculate balances (who owes whom)
// Simplified calculation for mock data
export const balances = [
  {
    person: 'Sarah',
    amount: 45.32,
    type: 'owes_you', // Sarah owes you
  },
  {
    person: 'Mike',
    amount: 23.15,
    type: 'you_owe', // You owe Mike
  },
];
