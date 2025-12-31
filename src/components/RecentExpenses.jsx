import React from 'react';
import { getCurrencySymbol } from '../utils/currency';

const RecentExpenses = ({ expenses, roommates, currency = 'USD', isDarkMode, onClick, onAddExpense, currentUserId }) => {
  // Get roommate name by ID
  const getRoommateName = (id) => {
    const roommate = roommates.find(r => r.id === id);
    return roommate ? roommate.name : 'Unknown';
  };

  // Calculate display amount for an expense (matches Expenses page logic)
  const getUserShare = (expense) => {
    // Personal expense by current user -> full amount
    if (expense.splitBetween.length === 1 && expense.paidBy === currentUserId) {
      return expense.amount;
    }
    // Personal expense by someone else -> 0 (shouldn't be displayed)
    if (expense.splitBetween.length === 1 && expense.paidBy !== currentUserId) {
      return 0;
    }

    // Loans
    const paidByYou = expense.paidBy === currentUserId;
    const yourSplit = expense.splits?.find(s => s.user_id === currentUserId);

    // If you paid but have 0 share, you lent money -> full amount (money that left your pocket)
    if (paidByYou && yourSplit && yourSplit.share_amount === 0) {
      return expense.amount;
    }

    // If someone else paid and you have the full amount as share, you borrowed -> full amount
    if (!paidByYou && yourSplit && yourSplit.share_amount === expense.amount) {
      return expense.amount;
    }

    // Shared expenses
    if (expense.splitBetween.includes(currentUserId)) {
      // If YOU paid -> show FULL amount (money that left your pocket)
      if (expense.paidBy === currentUserId) {
        return expense.amount;
      }
      // If someone else paid -> show YOUR share (what you owe)
      return expense.amount / expense.splitBetween.length;
    }

    return 0;
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  // Get split info
  const getSplitInfo = (expense) => {
    const numPeople = expense.splitBetween.length;
    if (numPeople === roommates.length) {
      return 'Split evenly';
    } else if (numPeople === 2) {
      const other = expense.splitBetween.find(id => id !== expense.paidBy);
      return `Split with ${getRoommateName(other)}`;
    } else {
      return `Split ${numPeople} ways`;
    }
  };

  return (
    <div
      onClick={onClick}
      className="rounded-3xl shadow-xl p-6 cursor-pointer transition-all hover:scale-[1.02]"
      style={{
        background: isDarkMode
          ? 'rgba(0, 0, 0, 0.3)'
          : 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(12px)',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold font-serif ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Recent Expenses
        </h2>
        {expenses.length === 0 ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onAddExpense) onAddExpense();
            }}
            className="text-sm font-semibold hover:opacity-80 transition-opacity px-4 py-2 rounded-full"
            style={{
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.05)',
              color: isDarkMode ? 'white' : '#374151'
            }}
          >
            Add Expense
          </button>
        ) : (
          <button
            className="text-sm font-semibold hover:opacity-80 transition-opacity px-4 py-2 rounded-full"
            style={{
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.05)',
              color: isDarkMode ? 'white' : '#374151'
            }}
          >
            View All
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-[400px] overflow-hidden">
        {expenses.slice(0, 8).map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between p-4 rounded-2xl"
          >
            {/* Left side - Icon and details */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {expense.description}
                  </p>
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                      color: isDarkMode ? '#e5e7eb' : '#6b7280'
                    }}
                  >
                    {expense.category}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {getRoommateName(expense.paidBy)} paid
                  </p>
                  <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>•</span>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    {getSplitInfo(expense)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Amount and date */}
            <div className="text-right ml-4">
              <p className="text-base font-bold" style={{ color: '#FF5E00' }}>
                {getCurrencySymbol(currency)}{getUserShare(expense).toFixed(2)}
              </p>
              <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {formatDate(expense.date)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentExpenses;
