import React from 'react';

const RecentExpenses = ({ expenses, roommates, isDarkMode, onClick }) => {
  // Get roommate name by ID
  const getRoommateName = (id) => {
    const roommate = roommates.find(r => r.id === id);
    return roommate ? roommate.name : 'Unknown';
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
        <button
          className="text-sm font-semibold hover:opacity-80 transition-opacity px-4 py-2 rounded-full"
          style={{
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.05)',
            color: isDarkMode ? 'white' : '#374151'
          }}
        >
          View All
        </button>
      </div>

      <div className="space-y-3">
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
                ${expense.amount.toFixed(2)}
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
