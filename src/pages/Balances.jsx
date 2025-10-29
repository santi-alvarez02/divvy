import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

const Balances = ({ isDarkMode, setIsDarkMode, expenses, roommates }) => {
  // Get current user
  const currentUser = roommates.find(r => r.name === 'You');
  const currentUserId = currentUser ? currentUser.id : null;

  // Get payment usernames for roommates from localStorage
  // In production, this would come from a database
  const getPaymentUsername = (roommateId, platform) => {
    // For demo purposes, we'll use the current user's saved usernames
    // In production, each roommate would have their own
    if (platform === 'venmo') return localStorage.getItem('venmoUsername') || '';
    if (platform === 'paypal') return localStorage.getItem('paypalUsername') || '';
    if (platform === 'zelle') return localStorage.getItem('zelleEmail') || '';
    return '';
  };

  // Mock data for testing - remove this in production
  const getMockSettlementHistory = () => {
    const now = new Date();
    const sarahId = roommates.find(r => r.name === 'Sarah')?.id;
    const mikeId = roommates.find(r => r.name === 'Mike')?.id;

    return [
      {
        id: 1,
        from: currentUserId,
        fromName: 'You',
        to: sarahId,
        toName: 'Sarah',
        amount: 45.50,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5).toISOString(),
        status: 'completed',
        completedDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 5).toISOString()
      },
      {
        id: 2,
        from: mikeId,
        fromName: 'Mike',
        to: currentUserId,
        toName: 'You',
        amount: 30.00,
        date: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 12).toISOString(),
        status: 'completed',
        completedDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 12).toISOString()
      },
      {
        id: 3,
        from: currentUserId,
        fromName: 'You',
        to: mikeId,
        toName: 'Mike',
        amount: 25.75,
        date: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString(),
        status: 'completed',
        completedDate: new Date(now.getFullYear(), now.getMonth() - 1, 15).toISOString()
      },
      {
        id: 4,
        from: sarahId,
        fromName: 'Sarah',
        to: currentUserId,
        toName: 'You',
        amount: 60.00,
        date: new Date(now.getFullYear(), now.getMonth() - 2, 20).toISOString(),
        status: 'completed',
        completedDate: new Date(now.getFullYear(), now.getMonth() - 2, 20).toISOString()
      },
      {
        id: 5,
        from: currentUserId,
        fromName: 'You',
        to: sarahId,
        toName: 'Sarah',
        amount: 15.25,
        date: new Date(now.getFullYear(), now.getMonth() - 4, 10).toISOString(),
        status: 'completed',
        completedDate: new Date(now.getFullYear(), now.getMonth() - 4, 10).toISOString()
      }
    ];
  };

  const [pendingSettlements, setPendingSettlements] = useState([]);
  const [settlementHistory, setSettlementHistory] = useState(getMockSettlementHistory());
  const [historyFilter, setHistoryFilter] = useState('all'); // 'all', 'month', 'lastMonth', 'last3Months'
  const [selectedBalance, setSelectedBalance] = useState(null); // Track which balance detail view is showing
  const [showSettleUpModal, setShowSettleUpModal] = useState(false); // Track Settle Up modal visibility

  // Calculate balances between you and each roommate
  const calculateBalances = () => {
    const balances = {};

    expenses.forEach(expense => {
      const splitAmount = expense.amount / expense.splitBetween.length;

      // If someone else paid and you're in the split
      if (expense.paidBy !== currentUserId && expense.splitBetween.includes(currentUserId)) {
        const payerName = roommates.find(r => r.id === expense.paidBy)?.name;
        if (!balances[expense.paidBy]) {
          balances[expense.paidBy] = { name: payerName, id: expense.paidBy, amount: 0, expenses: [] };
        }
        balances[expense.paidBy].amount += splitAmount;
        balances[expense.paidBy].expenses.push({ ...expense, yourShare: splitAmount });
      }

      // If you paid and others are in the split
      if (expense.paidBy === currentUserId) {
        expense.splitBetween.forEach(personId => {
          if (personId !== currentUserId) {
            const personName = roommates.find(r => r.id === personId)?.name;
            if (!balances[personId]) {
              balances[personId] = { name: personName, id: personId, amount: 0, expenses: [] };
            }
            balances[personId].amount -= splitAmount;
            balances[personId].expenses.push({ ...expense, theirShare: splitAmount });
          }
        });
      }
    });

    return Object.values(balances).filter(b => Math.abs(b.amount) > 0.01);
  };

  const balances = calculateBalances();

  // Calculate summary stats
  const youOwe = balances.filter(b => b.amount > 0).reduce((sum, b) => sum + b.amount, 0);
  const youreOwed = Math.abs(balances.filter(b => b.amount < 0).reduce((sum, b) => sum + b.amount, 0));
  const netBalance = youreOwed - youOwe;

  // Handle marking payment as sent
  const handleMarkAsPaid = (roommateId, amount) => {
    const roommate = roommates.find(r => r.id === roommateId);
    const newSettlement = {
      id: Date.now(),
      from: currentUserId,
      fromName: 'You',
      to: roommateId,
      toName: roommate.name,
      amount: amount,
      date: new Date().toISOString(),
      status: 'pending'
    };
    setPendingSettlements([...pendingSettlements, newSettlement]);
  };

  // Handle accepting payment
  const handleAcceptPayment = (settlementId) => {
    const settlement = pendingSettlements.find(s => s.id === settlementId);
    if (settlement) {
      setSettlementHistory([...settlementHistory, { ...settlement, status: 'completed', completedDate: new Date().toISOString() }]);
      setPendingSettlements(pendingSettlements.filter(s => s.id !== settlementId));
    }
  };

  // Handle rejecting payment
  const handleRejectPayment = (settlementId) => {
    setPendingSettlements(pendingSettlements.filter(s => s.id !== settlementId));
  };

  // Get pending settlements sent by you
  const sentSettlements = pendingSettlements.filter(s => s.from === currentUserId);

  // Get pending settlements to confirm (sent to you)
  const receivedSettlements = pendingSettlements.filter(s => s.to === currentUserId);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Filter settlement history based on selected period
  const getFilteredHistory = () => {
    if (historyFilter === 'all') return settlementHistory;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return settlementHistory.filter(settlement => {
      const settlementDate = new Date(settlement.completedDate);
      const settlementMonth = settlementDate.getMonth();
      const settlementYear = settlementDate.getFullYear();

      switch (historyFilter) {
        case 'month':
          return settlementMonth === currentMonth && settlementYear === currentYear;
        case 'lastMonth':
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return settlementMonth === lastMonth && settlementYear === lastMonthYear;
        case 'last3Months':
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          return settlementDate >= threeMonthsAgo;
        default:
          return true;
      }
    });
  };

  const filteredHistory = getFilteredHistory();

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
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif"
            style={{ color: isDarkMode ? '#FF5E00' : '#1f2937' }}
          >
            Balances
          </h1>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* You Owe */}
          <div
            className="rounded-3xl shadow-xl p-6"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              You Owe
            </p>
            <p className="text-3xl font-bold" style={{ color: '#FF5E00' }}>
              ${Number.isInteger(youOwe) ? youOwe : youOwe.toFixed(2).replace(/\.00$/, '')}
            </p>
          </div>

          {/* You're Owed */}
          <div
            className="rounded-3xl shadow-xl p-6"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              You're Owed
            </p>
            <p className="text-3xl font-bold" style={{ color: '#10b981' }}>
              ${Number.isInteger(youreOwed) ? youreOwed : youreOwed.toFixed(2).replace(/\.00$/, '')}
            </p>
          </div>

          {/* Net Balance */}
          <div
            className="rounded-3xl shadow-xl p-6"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Net Balance
            </p>
            <p className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {netBalance >= 0 ? '+' : ''}${Number.isInteger(netBalance) ? netBalance : netBalance.toFixed(2).replace(/\.00$/, '')}
            </p>
          </div>
        </div>

        {/* Pending Confirmations (Payments to Accept/Reject) */}
        {receivedSettlements.length > 0 && (
          <div
            className="rounded-3xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <h3 className={`text-lg sm:text-xl font-bold font-serif mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Pending Confirmations
            </h3>
            <div className="space-y-3">
              {receivedSettlements.map((settlement) => (
                <div
                  key={settlement.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl"
                  style={{
                    background: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)'
                  }}
                >
                  <div className="flex-1 mb-3 sm:mb-0">
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {settlement.fromName} paid you
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatDate(settlement.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-xl font-bold" style={{ color: '#10b981' }}>
                      ${settlement.amount.toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleAcceptPayment(settlement.id)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                        style={{ backgroundColor: '#10b981' }}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRejectPayment(settlement.id)}
                        className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                        style={{
                          background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                          color: isDarkMode ? 'white' : '#1f2937'
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Balances and Pending Settlements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 sm:mb-8">
          {/* Active Balances */}
          <div
            className="rounded-3xl shadow-xl p-6"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
              minHeight: '280px'
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className={`text-2xl sm:text-3xl font-bold font-serif ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Active Balances
              </h2>
              <button
                onClick={() => setShowSettleUpModal(true)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:scale-[1.01] ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-900'}`}
              >
                Settle Up
              </button>
            </div>

            {balances.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  All settled up! 🎉
                </p>
              </div>
            ) : selectedBalance ? (
              // Detail view - showing expenses for selected balance
              <div className="space-y-4">
                {/* Back button card */}
                <div
                  onClick={() => setSelectedBalance(null)}
                  className="flex items-center justify-between p-3 rounded-3xl cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)'
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-3xl flex items-center justify-center font-bold text-xl shadow-lg"
                      style={{
                        background: selectedBalance.amount > 0
                          ? 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
                          : 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                        color: 'white'
                      }}
                    >
                      {selectedBalance.name.charAt(0)}
                    </div>
                    <div>
                      <p className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedBalance.amount > 0 ? `You owe ${selectedBalance.name}` : `${selectedBalance.name} owes you`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl sm:text-2xl font-bold" style={{ color: selectedBalance.amount > 0 ? '#FF5E00' : '#10b981' }}>
                      {selectedBalance.amount > 0 ? '-' : '+'}${Math.abs(selectedBalance.amount).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Expense list */}
                <div className="space-y-2">
                  {selectedBalance.expenses && selectedBalance.expenses.map((expense, idx) => {
                    const isDebt = selectedBalance.amount > 0;
                    const yourShare = isDebt ? expense.yourShare : expense.theirShare;

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-2xl"
                        style={{
                          background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)'
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {expense.description}
                              </h3>
                              <span
                                className="px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  background: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
                                  color: isDarkMode ? '#d1d5db' : '#6b7280'
                                }}
                              >
                                {expense.category}
                              </span>
                            </div>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {selectedBalance.name} paid
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              ${yourShare ? yourShare.toFixed(2) : (expense.amount / expense.splitBetween.length).toFixed(2)}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              // List view - showing all balances
              <div className="space-y-3">
                {balances.map((balance) => {
                  const isDebt = balance.amount > 0; // You owe them

                  return (
                    <div
                      key={balance.id}
                      onClick={() => setSelectedBalance(balance)}
                      className="flex items-center justify-between p-3 rounded-3xl cursor-pointer transition-all hover:scale-[1.01]"
                      style={{
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-12 h-12 rounded-3xl flex items-center justify-center font-bold text-xl shadow-lg"
                          style={{
                            background: isDebt
                              ? 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
                              : 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                            color: 'white'
                          }}
                        >
                          {balance.name.charAt(0)}
                        </div>
                        <div>
                          <p className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {isDebt ? `You owe ${balance.name}` : `${balance.name} owes you`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xl sm:text-2xl font-bold" style={{ color: isDebt ? '#FF5E00' : '#10b981' }}>
                          {isDebt ? '-' : '+'}${Math.abs(balance.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Pending Settlements (Payments you sent) */}
          <div
            className="rounded-3xl shadow-xl p-6"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
              minHeight: '280px'
            }}
          >
            <h3 className={`text-2xl sm:text-3xl font-bold font-serif mb-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Pending Settlements
            </h3>
            {sentSettlements.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No pending settlements
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {sentSettlements.map((settlement) => (
                  <div
                    key={settlement.id}
                    className="flex items-center justify-between p-4 rounded-2xl"
                    style={{
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    <div>
                      <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Waiting for {settlement.toName} to confirm
                      </p>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {formatDate(settlement.date)}
                      </p>
                    </div>
                    <p className="text-xl font-bold" style={{ color: '#FF5E00' }}>
                      ${settlement.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Settlement History */}
        <div
          className="rounded-3xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8"
          style={{
            background: isDarkMode
              ? 'rgba(0, 0, 0, 0.3)'
              : 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h3 className={`text-lg sm:text-xl font-bold font-serif ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Settlement History
            </h3>
            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              {[
                { value: 'all', label: 'All Time' },
                { value: 'month', label: 'This Month' },
                { value: 'lastMonth', label: 'Last Month' },
                { value: 'last3Months', label: 'Last 3 Months' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setHistoryFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    historyFilter === filter.value
                      ? 'text-white'
                      : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}
                  style={{
                    backgroundColor: historyFilter === filter.value
                      ? '#FF5E00'
                      : isDarkMode
                      ? 'rgba(255, 255, 255, 0.1)'
                      : 'rgba(0, 0, 0, 0.05)'
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {settlementHistory.length === 0
                  ? 'No settlements yet'
                  : `No settlements in ${historyFilter === 'all' ? 'all time' : historyFilter === 'month' ? 'this month' : historyFilter === 'lastMonth' ? 'last month' : 'the last 3 months'}`}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.slice().reverse().map((settlement) => (
                <div
                  key={settlement.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <div className="flex-1 mb-2 sm:mb-0">
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {settlement.from === currentUserId
                        ? `You paid ${settlement.toName}`
                        : `${settlement.fromName} paid you`}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatDate(settlement.completedDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold" style={{
                      color: settlement.from === currentUserId ? '#FF5E00' : '#10b981'
                    }}>
                      ${settlement.amount.toFixed(2)}
                    </p>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700'}`}>
                      Completed
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Settle Up Modal */}
      {showSettleUpModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={() => setShowSettleUpModal(false)}
        >
          <div
            className="rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
            style={{
              background: isDarkMode ? '#2d2d2d' : '#F5F5F5'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 flex items-center justify-between">
              <h2 className={`text-3xl font-bold font-serif ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Settle Up
              </h2>
              <button
                onClick={() => setShowSettleUpModal(false)}
                className={`text-2xl font-light hover:scale-110 transition-transform ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 pb-6 space-y-4">
              {balances.filter(b => b.amount > 0).length === 0 ? (
                <div className="text-center py-12">
                  <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    You don't owe anyone! 🎉
                  </p>
                </div>
              ) : (
                <>
                  {balances.filter(b => b.amount > 0).map((balance) => (
                    <div
                      key={balance.id}
                      className="rounded-2xl p-5 shadow-sm"
                      style={{
                        background: isDarkMode ? '#1a1a1a' : '#ffffff'
                      }}
                    >
                      {/* Debt info */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-xl shadow-md"
                            style={{
                              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
                              color: 'white'
                            }}
                          >
                            {balance.name.charAt(0)}
                          </div>
                          <div>
                            <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {balance.name}
                            </p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              You owe
                            </p>
                          </div>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: '#FF5E00' }}>
                          ${balance.amount.toFixed(2)}
                        </p>
                      </div>

                      {/* Payment method buttons */}
                      <div className="mb-4">
                        <p className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          Quick pay with:
                        </p>
                        <div className="grid grid-cols-3 gap-3">
                          <button
                            onClick={() => {
                              const venmoUsername = getPaymentUsername(balance.id, 'venmo');
                              if (!venmoUsername) {
                                alert('Please add your Venmo username in Settings first!');
                                return;
                              }
                              // Try to open Venmo app, fallback to web
                              const venmoUrl = `venmo://paycharge?txn=pay&recipients=${venmoUsername}&amount=${balance.amount.toFixed(2)}&note=Divvy%20payment`;
                              const venmoWebUrl = `https://venmo.com/${venmoUsername}?txn=pay&amount=${balance.amount.toFixed(2)}&note=Divvy%20payment`;

                              // Try app first, fallback to web after a short delay
                              window.location.href = venmoUrl;
                              setTimeout(() => {
                                window.open(venmoWebUrl, '_blank');
                              }, 500);
                            }}
                            className="px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 shadow-sm"
                            style={{ backgroundColor: '#008CFF' }}
                          >
                            Venmo
                          </button>
                          <button
                            onClick={() => {
                              const paypalUsername = getPaymentUsername(balance.id, 'paypal');
                              if (!paypalUsername) {
                                alert('Please add your PayPal username in Settings first!');
                                return;
                              }
                              // Open PayPal.me link (works for both mobile and web)
                              const paypalUrl = `https://paypal.me/${paypalUsername}/${balance.amount.toFixed(2)}`;
                              window.open(paypalUrl, '_blank');
                            }}
                            className="px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 shadow-sm"
                            style={{ backgroundColor: '#0070BA' }}
                          >
                            PayPal
                          </button>
                          <button
                            onClick={() => {
                              const zelleEmail = getPaymentUsername(balance.id, 'zelle');
                              if (!zelleEmail) {
                                alert('Please add your Zelle email/phone in Settings first!');
                                return;
                              }
                              // Copy Zelle info to clipboard and show instructions
                              navigator.clipboard.writeText(zelleEmail).then(() => {
                                alert(`Zelle info copied!\n\nSend $${balance.amount.toFixed(2)} to:\n${zelleEmail}\n\nOpen your banking app to complete the payment.`);
                              }).catch(() => {
                                alert(`Send $${balance.amount.toFixed(2)} via Zelle to:\n${zelleEmail}\n\nOpen your banking app to complete the payment.`);
                              });
                            }}
                            className="px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 shadow-sm"
                            style={{ backgroundColor: '#6D1ED4' }}
                          >
                            Zelle
                          </button>
                        </div>
                      </div>

                      {/* Mark as Paid button */}
                      <button
                        onClick={() => {
                          handleMarkAsPaid(balance.id, balance.amount);
                          setShowSettleUpModal(false);
                        }}
                        className="w-full px-4 py-3 rounded-xl text-base font-semibold border-2 transition-all"
                        style={{
                          background: isDarkMode ? '#2d2d2d' : '#ffffff',
                          color: isDarkMode ? 'white' : '#1f2937',
                          borderColor: isDarkMode ? '#404040' : '#e5e7eb'
                        }}
                      >
                        Mark as Paid
                      </button>
                    </div>
                  ))}

                  {/* Bottom Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowSettleUpModal(false)}
                      className="flex-1 px-6 py-4 rounded-2xl text-base font-semibold border-2 transition-all hover:opacity-90"
                      style={{
                        background: isDarkMode ? '#2d2d2d' : '#ffffff',
                        color: isDarkMode ? 'white' : '#1f2937',
                        borderColor: isDarkMode ? '#404040' : '#e5e7eb'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        // Mark all as paid
                        balances.filter(b => b.amount > 0).forEach(balance => {
                          handleMarkAsPaid(balance.id, balance.amount);
                        });
                        setShowSettleUpModal(false);
                      }}
                      className="flex-1 px-6 py-4 rounded-2xl text-base font-semibold text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: '#FF5E00' }}
                    >
                      Mark All as Paid
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Balances;
