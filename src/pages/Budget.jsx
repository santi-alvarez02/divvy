import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

const Budget = ({ isDarkMode, setIsDarkMode, expenses, roommates }) => {
  const [timePeriod, setTimePeriod] = useState('month'); // 'month', 'lastMonth', 'last3Months'
  const [budgetLimit, setBudgetLimit] = useState(1500);
  const [isEditingBudget, setIsEditingBudget] = useState(false);

  // Calculate current user's share of expenses
  const currentUser = roommates.find(r => r.name === 'You');
  const currentUserId = currentUser ? currentUser.id : null;

  // Filter expenses by time period
  const getFilteredExpenses = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses.filter(expense => {
      // Only include expenses where current user is involved
      if (!expense.splitBetween.includes(currentUserId)) return false;

      const expenseDate = new Date(expense.date);
      const expenseMonth = expenseDate.getMonth();
      const expenseYear = expenseDate.getFullYear();

      switch (timePeriod) {
        case 'month':
          return expenseMonth === currentMonth && expenseYear === currentYear;
        case 'lastMonth':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return expenseMonth === lastMonth && expenseYear === lastMonthYear;
        case 'last3Months':
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          return expenseDate >= threeMonthsAgo;
        default:
          return true;
      }
    });
  };

  const filteredExpenses = getFilteredExpenses();

  // Calculate total spent (user's share)
  const totalSpent = filteredExpenses.reduce((sum, expense) => {
    const userShare = expense.amount / expense.splitBetween.length;
    return sum + userShare;
  }, 0);

  const remaining = budgetLimit - totalSpent;
  const percentageUsed = Math.min((totalSpent / budgetLimit) * 100, 100);
  const percentageRemaining = Math.max((remaining / budgetLimit) * 100, 0);

  // Calculate spending by category
  const categorySpending = filteredExpenses.reduce((acc, expense) => {
    const userShare = expense.amount / expense.splitBetween.length;
    if (!acc[expense.category]) {
      acc[expense.category] = {
        amount: 0,
        count: 0,
        icon: expense.icon
      };
    }
    acc[expense.category].amount += userShare;
    acc[expense.category].count += 1;
    return acc;
  }, {});

  const categories = Object.entries(categorySpending)
    .map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
      icon: data.icon,
      percentage: (data.amount / totalSpent) * 100
    }))
    .sort((a, b) => b.amount - a.amount);

  // Progress circle color - always orange
  const progressColor = '#FF5E00';

  // Calculate spending for last few months
  const getMonthlySpending = () => {
    const now = new Date();
    const months = [];

    for (let i = 0; i < 4; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      const monthYear = monthDate.getFullYear();
      const month = monthDate.getMonth();

      const monthExpenses = expenses.filter(expense => {
        if (!expense.splitBetween.includes(currentUserId)) return false;
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month && expenseDate.getFullYear() === monthYear;
      });

      const spent = monthExpenses.reduce((sum, expense) => {
        const userShare = expense.amount / expense.splitBetween.length;
        return sum + userShare;
      }, 0);

      months.push({
        label: monthName,
        budget: budgetLimit,
        spent: spent,
        isCurrent: i === 0
      });
    }

    return months.reverse();
  };

  const monthlyData = getMonthlySpending();

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : '#f5f5f5'
      }}
    >
      {/* Orange Gradient Bubble Backgrounds */}
      {!isDarkMode ? (
        <>
          <div
            className="absolute pointer-events-none"
            style={{
              top: '10%',
              right: '20%',
              width: '700px',
              height: '700px',
              background: 'radial-gradient(circle, rgba(255, 154, 86, 0.5) 0%, rgba(255, 184, 77, 0.35) 35%, rgba(255, 198, 112, 0.2) 60%, transparent 100%)',
              filter: 'blur(80px)',
              borderRadius: '50%',
              zIndex: 0
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: '10%',
              left: '15%',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(255, 198, 112, 0.4) 0%, rgba(255, 184, 77, 0.25) 40%, transparent 100%)',
              filter: 'blur(70px)',
              borderRadius: '50%',
              zIndex: 0
            }}
          />
        </>
      ) : (
        <>
          <div
            className="absolute pointer-events-none"
            style={{
              top: '10%',
              right: '20%',
              width: '700px',
              height: '700px',
              background: 'radial-gradient(circle, rgba(255, 94, 0, 0.25) 0%, rgba(255, 94, 0, 0.15) 35%, rgba(255, 94, 0, 0.08) 60%, transparent 100%)',
              filter: 'blur(80px)',
              borderRadius: '50%',
              zIndex: 0
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: '10%',
              left: '15%',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(255, 94, 0, 0.2) 0%, rgba(255, 94, 0, 0.1) 40%, transparent 100%)',
              filter: 'blur(70px)',
              borderRadius: '50%',
              zIndex: 0
            }}
          />
        </>
      )}

      {/* Sidebar */}
      <Sidebar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      {/* Main Content */}
      <main className="ml-20 lg:ml-64 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
        {/* Header with Time Period Selector */}
        <div className="mb-6 sm:mb-8">
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif mb-4"
            style={{ color: isDarkMode ? '#FF5E00' : '#1f2937' }}
          >
            Budget
          </h1>

          {/* Time Period Selector */}
          <div className="flex gap-2">
            {[
              { value: 'month', label: 'This Month' },
              { value: 'lastMonth', label: 'Last Month' },
              { value: 'last3Months', label: 'Last 3 Months' }
            ].map(period => (
              <button
                key={period.value}
                onClick={() => setTimePeriod(period.value)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  timePeriod === period.value
                    ? 'text-white'
                    : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
                style={{
                  backgroundColor: timePeriod === period.value
                    ? '#FF5E00'
                    : isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)'
                }}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Budget Overview and Category Breakdown Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
          {/* Budget Overview Card */}
          <div
            className="rounded-3xl shadow-xl p-6 sm:p-8"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
              minHeight: '450px'
            }}
          >
            <div className="flex items-center justify-center h-full gap-8">
              {/* Circular Progress */}
              <div className="flex flex-col items-center">
                <div className="relative" style={{ width: '200px', height: '200px' }}>
                  {/* Background Circle */}
                  <svg className="transform -rotate-90" width="200" height="200">
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                      strokeWidth="20"
                      fill="none"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="100"
                      cy="100"
                      r="85"
                      stroke={progressColor}
                      strokeWidth="20"
                      fill="none"
                      strokeDasharray={`${(percentageRemaining / 100) * 534} 534`}
                      strokeLinecap="round"
                      style={{ transition: 'stroke-dasharray 0.5s ease' }}
                    />
                  </svg>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-4xl font-bold" style={{ color: '#FF5E00' }}>
                      ${Math.abs(remaining).toFixed(0)}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Remaining
                    </p>
                  </div>
                </div>
              </div>

              {/* Budget Details - To the Right */}
              <div className="flex-1 space-y-8">
                {/* Monthly Budget */}
                <div>
                  <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Monthly Budget
                  </p>
                  {isEditingBudget ? (
                    <input
                      type="number"
                      value={budgetLimit}
                      onChange={(e) => setBudgetLimit(Number(e.target.value))}
                      onBlur={() => setIsEditingBudget(false)}
                      autoFocus
                      className="text-3xl font-bold bg-transparent border-b-2 border-orange-500 outline-none w-full"
                      style={{ color: isDarkMode ? 'white' : '#1f2937' }}
                    />
                  ) : (
                    <p
                      className="text-3xl font-bold cursor-pointer hover:opacity-80"
                      style={{ color: isDarkMode ? 'white' : '#1f2937' }}
                      onClick={() => setIsEditingBudget(true)}
                    >
                      ${budgetLimit.toFixed(2)}
                    </p>
                  )}
                </div>

                {/* Total Spent */}
                <div>
                  <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Total Spent
                  </p>
                  <p className="text-3xl font-bold" style={{ color: '#FF5E00' }}>
                    ${totalSpent.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Budget vs Actual Chart */}
          <div
            className="rounded-3xl shadow-xl p-6 sm:p-8"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
              minHeight: '450px'
            }}
          >
            <h2 className={`text-2xl sm:text-3xl font-bold font-serif mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Budget vs Actual
            </h2>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 rounded" style={{ backgroundColor: '#6366f1' }} />
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Budget
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-1 rounded" style={{ backgroundColor: '#FF5E00' }} />
                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Actual
                </span>
              </div>
            </div>

            {/* Line Chart */}
            <div className="relative flex" style={{ height: '280px' }}>
              {/* Y-axis labels */}
              <div className="flex flex-col justify-between py-2 pr-4" style={{ width: '60px' }}>
                {(() => {
                  const maxValue = Math.max(...monthlyData.map(m => Math.max(m.budget, m.spent)));
                  return [4, 3, 2, 1, 0].map((i) => (
                    <span
                      key={i}
                      className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      ${Math.round((maxValue * i) / 4)}
                    </span>
                  ));
                })()}
              </div>

              {/* Chart area */}
              <div className="flex-1 relative">
                <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  {/* Grid lines */}
                  {[0, 1, 2, 3, 4].map((i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={i * 25}
                      x2="100"
                      y2={i * 25}
                      stroke={isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}
                      strokeWidth="0.2"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}

                  {/* Budget Line */}
                  <polyline
                    fill="none"
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    points={monthlyData.map((month, index) => {
                      const maxValue = Math.max(...monthlyData.map(m => Math.max(m.budget, m.spent)));
                      const x = (index / (monthlyData.length - 1)) * 100;
                      const y = 100 - ((month.budget / maxValue) * 90);
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Actual Spent Line */}
                  <polyline
                    fill="none"
                    stroke="#FF5E00"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    vectorEffect="non-scaling-stroke"
                    points={monthlyData.map((month, index) => {
                      const maxValue = Math.max(...monthlyData.map(m => Math.max(m.budget, m.spent)));
                      const x = (index / (monthlyData.length - 1)) * 100;
                      const y = 100 - ((month.spent / maxValue) * 90);
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Data points for Budget */}
                  {monthlyData.map((month, index) => {
                    const maxValue = Math.max(...monthlyData.map(m => Math.max(m.budget, m.spent)));
                    const x = (index / (monthlyData.length - 1)) * 100;
                    const y = 100 - ((month.budget / maxValue) * 90);
                    return (
                      <circle
                        key={`budget-${index}`}
                        cx={x}
                        cy={y}
                        r="1.5"
                        fill="#6366f1"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}

                  {/* Data points for Actual */}
                  {monthlyData.map((month, index) => {
                    const maxValue = Math.max(...monthlyData.map(m => Math.max(m.budget, m.spent)));
                    const x = (index / (monthlyData.length - 1)) * 100;
                    const y = 100 - ((month.spent / maxValue) * 90);
                    return (
                      <circle
                        key={`spent-${index}`}
                        cx={x}
                        cy={y}
                        r="1.5"
                        fill="#FF5E00"
                        vectorEffect="non-scaling-stroke"
                      />
                    );
                  })}
                </svg>

                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2" style={{ transform: 'translateY(25px)' }}>
                  {monthlyData.map((month, index) => (
                    <span
                      key={index}
                      className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                    >
                      {month.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Expenses */}
        <div
          className="rounded-3xl shadow-xl p-6 sm:p-8 mb-6 sm:mb-8"
          style={{
            background: isDarkMode
              ? 'rgba(0, 0, 0, 0.3)'
              : 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <h2 className={`text-2xl sm:text-3xl font-bold font-serif mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Recent Expenses
          </h2>

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12">
              <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No expenses for this period
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.slice(0, 5).map((expense) => {
                const userShare = expense.amount / expense.splitBetween.length;
                const payer = roommates.find(r => r.id === expense.paidBy);

                return (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 rounded-2xl"
                    style={{
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{expense.icon}</span>
                      <div>
                        <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {expense.description}
                        </p>
                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {payer?.name} paid • {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        ${userShare.toFixed(2)}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Your share
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Budget;
