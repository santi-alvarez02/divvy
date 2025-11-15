import React from 'react';
import { getCurrencySymbol } from '../utils/currency';

const BudgetOverview = ({ budget, currency = 'USD', isDarkMode, onClick }) => {
  const { limit, spent, month, year } = budget;
  const percentageUsed = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
  const percentageLeft = 100 - percentageUsed;
  const remaining = limit - spent;

  // Donut chart calculations
  const size = 180;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentageLeft / 100) * circumference;

  // Always use orange color for consistency
  const getProgressColor = () => {
    return '#FF5E00';
  };

  return (
    <div
      onClick={onClick}
      className="rounded-3xl shadow-xl p-6 cursor-pointer transition-all hover:scale-[1.02] h-full"
      style={{
        background: isDarkMode
          ? 'rgba(0, 0, 0, 0.3)'
          : 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(12px)',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
        minHeight: '450px'
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold font-serif ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Monthly Budget
        </h2>
        {month && year > 0 && (
          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {month} {year}
          </span>
        )}
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
              stroke={isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"}
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
            <span className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {percentageLeft.toFixed(0)}%
            </span>
            <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Left
            </span>
          </div>
        </div>

        {/* Budget info */}
        <div className="w-full space-y-3">
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Budget
            </span>
            <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {getCurrencySymbol(currency)}{limit.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Total Spent
            </span>
            <span className="text-lg font-bold" style={{ color: '#FF5E00' }}>
              {getCurrencySymbol(currency)}{spent.toFixed(2)}
            </span>
          </div>
          <div
            className="border-t"
            style={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
          />
          <div className="flex justify-between items-center">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Remaining
            </span>
            <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {getCurrencySymbol(currency)}{remaining.toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetOverview;
