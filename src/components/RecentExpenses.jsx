import React from 'react';

const RecentExpenses = ({ expenses, roommates }) => {
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
    <div className="rounded-3xl shadow-xl p-6 glass-card-dark">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">
          Recent Expenses
        </h2>
        <button className="text-sm font-semibold hover:opacity-80 transition-opacity px-4 py-2 rounded-full bg-white bg-opacity-20 text-white">
          View All
        </button>
      </div>

      <div className="space-y-3">
        {expenses.slice(0, 8).map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-white hover:bg-opacity-10"
          >
            {/* Left side - Icon and details */}
            <div className="flex items-center space-x-4 flex-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className="text-sm font-bold truncate text-white">
                    {expense.description}
                  </p>
                  <span
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#e5e7eb'
                    }}
                  >
                    {expense.category}
                  </span>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <p className="text-xs font-medium text-gray-300">
                    {getRoommateName(expense.paidBy)} paid
                  </p>
                  <span className="text-gray-500">•</span>
                  <p className="text-xs font-medium text-gray-300">
                    {getSplitInfo(expense)}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Amount and date */}
            <div className="text-right ml-4">
              <p className="text-base font-bold" style={{ color: '#ef711e' }}>
                ${expense.amount.toFixed(2)}
              </p>
              <p className="text-xs font-medium text-gray-300">
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
