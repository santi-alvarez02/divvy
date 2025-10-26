import React from 'react';

const BudgetOverview = ({ budget, isDarkMode }) => {
  const { limit, spent, month, year } = budget;
  const percentage = Math.min((spent / limit) * 100, 100);
  const remaining = limit - spent;

  // Donut chart calculations
  const size = 180;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  // Determine color based on budget usage
  const getProgressColor = () => {
    if (percentage >= 90) return '#ef4444';
    if (percentage >= 70) return '#f59e0b';
    return '#10b981';
  };

  return (
    <div
      className={`rounded-3xl shadow-xl p-6 transition-all duration-300 ${
        isDarkMode ? 'glass-card-dark' : 'glass-card'
      }`}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}>
          Monthly Budget
        </h2>
        <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-white opacity-80'}`}>
          {month} {year}
        </span>
      </div>

      <div className="flex flex-col items-center">
        {/* Donut Chart */}
        <div className="relative mb-6">
          <svg width={size} height={size} className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={getProgressColor()}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}>
              {percentage.toFixed(0)}%
            </span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-white opacity-80'}`}>
              used
            </span>
          </div>
        </div>

        {/* Budget info */}
        <div className="w-full space-y-3">
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-white opacity-80'}`}>
              Spent
            </span>
            <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}>
              ${spent.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-white opacity-80'}`}>
              Remaining
            </span>
            <span className={`text-lg font-bold`} style={{ color: getProgressColor() }}>
              ${remaining.toFixed(2)}
            </span>
          </div>
          <div
            className="h-px w-full"
            style={{ backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)' }}
          />
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-white opacity-80'}`}>
              Budget
            </span>
            <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}>
              ${limit.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetOverview;
