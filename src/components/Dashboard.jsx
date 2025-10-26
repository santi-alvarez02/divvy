import React, { useState } from 'react';
import Sidebar from './Sidebar';
import BudgetOverview from './BudgetOverview';
import RecentExpenses from './RecentExpenses';
import BalanceSummary from './BalanceSummary';

const Dashboard = ({ budget, expenses, balances, roommates }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleAddExpense = () => {
    // Placeholder for add expense functionality
    alert('Add expense functionality coming soon!');
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <div
      className="min-h-screen transition-colors duration-300"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : 'linear-gradient(135deg, #FF9A56 0%, #FFB84D 50%, #FFC670 100%)'
      }}
    >
      {/* Sidebar */}
      <Sidebar isDarkMode={isDarkMode} onToggleDarkMode={toggleDarkMode} />

      {/* Main Content - with left margin for sidebar */}
      <main className="ml-64 px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className={`text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}>
              Overview
            </h1>
            <p className={`text-base mt-2 ${isDarkMode ? 'text-gray-300' : 'text-white opacity-90'}`}>
              Overview of your shared expenses
            </p>
          </div>

          {/* Quick Add Expense Button - Desktop */}
          <button
            onClick={handleAddExpense}
            className="hidden sm:flex items-center space-x-2 text-white font-semibold px-8 py-4 rounded-full shadow-lg transition-all hover:shadow-xl hover:scale-105"
            style={{ backgroundColor: isDarkMode ? '#4ac4dc' : '#000000' }}
          >
            <span className="text-xl">+</span>
            <span>Add Expense</span>
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Budget and Balances */}
          <div className="lg:col-span-1 space-y-6">
            <BudgetOverview budget={budget} isDarkMode={isDarkMode} />
            <BalanceSummary balances={balances} isDarkMode={isDarkMode} />
          </div>

          {/* Right Column - Recent Expenses */}
          <div className="lg:col-span-2">
            <RecentExpenses expenses={expenses} roommates={roommates} isDarkMode={isDarkMode} />
          </div>
        </div>
      </main>

      {/* Floating Add Button - Mobile */}
      <button
        onClick={handleAddExpense}
        className="sm:hidden fixed bottom-6 right-6 w-16 h-16 text-white rounded-full shadow-lg flex items-center justify-center text-2xl transition-all hover:shadow-xl hover:scale-110"
        style={{ backgroundColor: isDarkMode ? '#4ac4dc' : '#000000' }}
      >
        +
      </button>
    </div>
  );
};

export default Dashboard;
