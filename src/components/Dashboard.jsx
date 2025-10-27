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
      {!isDarkMode && (
        <>
          {/* Main bubble - top right */}
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
          {/* Bottom left bubble */}
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
          {/* Sidebar area bubble - for glassy effect on sidebar */}
          <div
            className="absolute pointer-events-none"
            style={{
              top: '25%',
              left: '0%',
              width: '400px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(255, 154, 86, 0.35) 0%, rgba(255, 184, 77, 0.2) 50%, transparent 100%)',
              filter: 'blur(75px)',
              borderRadius: '50%',
              zIndex: 0
            }}
          />
        </>
      )}

      {/* Sidebar */}
      <Sidebar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      {/* Main Content - with left margin for sidebar */}
      <main className="ml-64 px-8 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold font-serif text-gray-900">
            Overview
          </h1>
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

    </div>
  );
};

export default Dashboard;
