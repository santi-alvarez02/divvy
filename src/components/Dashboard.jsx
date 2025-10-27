import React from 'react';
import Sidebar from './Sidebar';
import BudgetOverview from './BudgetOverview';
import RecentExpenses from './RecentExpenses';
import BalanceSummary from './BalanceSummary';

const Dashboard = ({ budget, expenses, balances, roommates }) => {
  const handleAddExpense = () => {
    // Placeholder for add expense functionality
    alert('Add expense functionality coming soon!');
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content - with left margin for sidebar */}
      <main className="ml-64 px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold" style={{ color: '#cd5b12' }}>
            Overview
          </h1>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Budget and Balances */}
          <div className="lg:col-span-1 space-y-6">
            <BudgetOverview budget={budget} />
            <BalanceSummary balances={balances} />
          </div>

          {/* Right Column - Recent Expenses */}
          <div className="lg:col-span-2">
            <RecentExpenses expenses={expenses} roommates={roommates} />
          </div>
        </div>
      </main>

    </div>
  );
};

export default Dashboard;
