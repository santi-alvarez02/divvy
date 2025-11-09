import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getCurrencySymbol } from '../utils/currency';
import { getAvatarColor } from '../utils/avatarColors';
import {
  getExchangeRatesFromDB,
  convertCurrency,
  updateExchangeRates,
  shouldUpdateRates
} from '../utils/exchangeRates';

const Balances = ({ isDarkMode, setIsDarkMode }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [roommates, setRoommates] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groupCurrency, setGroupCurrency] = useState('USD');

  // Helper function to validate avatar URLs
  const isValidAvatarUrl = (url) => {
    if (!url || typeof url !== 'string') return false;
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (e) {
      return false;
    }
  };

  // Helper function to display balance amounts consistently
  const displayBalance = (amount) => {
    // Round to 2 decimal places
    const rounded = Math.round(amount * 100) / 100;

    // Hide amounts less than 1 cent
    if (Math.abs(rounded) < 0.01) {
      return '0';
    }

    // Format to 2 decimals and remove trailing .00
    return rounded.toFixed(2).replace(/\.00$/, '');
  };
  const [userCurrency, setUserCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({});
  const [pendingSettlements, setPendingSettlements] = useState([]);
  const [settlementHistory, setSettlementHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [showSettleUpModal, setShowSettleUpModal] = useState(false);
  const [showPaymentMethodAlert, setShowPaymentMethodAlert] = useState(false);
  const [paymentAlertMessage, setPaymentAlertMessage] = useState('');

  const currentUserId = user?.id;

  // Fetch user's group, members, and expenses
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Get user's group membership
        const { data: groupMemberships, error: groupError } = await supabase
          .from('group_members')
          .select(`
            group_id,
            groups (
              id,
              name,
              default_currency
            )
          `)
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (groupError) {
          console.error('Error fetching group:', groupError);
          setLoading(false);
          return;
        }

        if (groupMemberships && groupMemberships.groups) {
          setCurrentGroup(groupMemberships.groups);
          setGroupCurrency(groupMemberships.groups.default_currency || 'USD');

          // Fetch all group members
          const { data: members, error: membersError } = await supabase
            .from('group_members')
            .select(`
              user_id,
              role,
              users (
                id,
                full_name,
                email,
                avatar_url
              )
            `)
            .eq('group_id', groupMemberships.groups.id);

          if (membersError) {
            console.error('Error fetching members:', membersError);
          } else {
            const transformedMembers = members.map(member => ({
              id: member.users.id,
              name: member.users.id === user.id ? 'You' : member.users.full_name,
              email: member.users.email,
              avatar_url: member.users.avatar_url
            }));
            setRoommates(transformedMembers);
          }

          // Fetch expenses for this group with splits and currency
          const { data: expensesData, error: expensesError } = await supabase
            .from('expenses')
            .select(`
              *,
              currency,
              expense_splits (
                user_id,
                share_amount
              )
            `)
            .eq('group_id', groupMemberships.groups.id)
            .order('date', { ascending: false });

          if (expensesError) {
            console.error('Error fetching expenses:', expensesError);
          } else {
            console.log('Raw expenses from database:', expensesData);
            // Transform expenses to include split_between array
            const transformedExpenses = expensesData?.map(expense => ({
              ...expense,
              split_between: expense.expense_splits?.map(split => split.user_id) || []
            })) || [];
            console.log('Transformed expenses:', transformedExpenses);
            setExpenses(transformedExpenses);
          }

          // Fetch settlements for this group where current user is involved
          const { data: settlementsData, error: settlementsError } = await supabase
            .from('settlements')
            .select('*')
            .eq('group_id', groupMemberships.groups.id)
            .order('created_at', { ascending: false});

          if (settlementsError) {
            console.error('Error fetching settlements:', settlementsError);
          } else {
            // Filter to only settlements involving the current user
            const userSettlements = settlementsData?.filter(s =>
              s.from_user_id === user.id || s.to_user_id === user.id
            ) || [];

            // Split into pending and completed
            const pending = userSettlements.filter(s => s.status === 'pending');
            const completed = userSettlements.filter(s => s.status === 'completed');
            setPendingSettlements(pending);
            setSettlementHistory(completed);
          }
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Fetch currency data
  useEffect(() => {
    const fetchCurrencyData = async () => {
      if (!user) return;

      const [userDataResult, ratesResult] = await Promise.all([
        supabase
          .from('users')
          .select('default_currency')
          .eq('id', user.id)
          .single(),
        getExchangeRatesFromDB()
      ]);

      if (userDataResult.data?.default_currency) {
        setUserCurrency(userDataResult.data.default_currency);
      }
      if (ratesResult.rates) {
        setExchangeRates(ratesResult.rates);
      }

      // Background rate update (non-blocking)
      shouldUpdateRates()
        .then(needsUpdate => {
          if (needsUpdate) {
            return updateExchangeRates()
              .then(() => getExchangeRatesFromDB())
              .then(({ rates }) => {
                if (rates) setExchangeRates(rates);
              });
          }
        })
        .catch(error => {
          console.error('Failed to update exchange rates:', error);
          // Continue with existing rates - don't break the app
        });
    };

    fetchCurrencyData();
  }, [user]);

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

  // Helper function to get user name from ID
  const getUserName = (userId) => {
    if (userId === currentUserId) return 'You';
    const roommate = roommates.find(r => r.id === userId);
    return roommate?.name || 'Unknown';
  };

  // Calculate balances between you and each roommate
  const calculateBalances = () => {
    const balances = {};

    // Debug logging
    console.log('Calculating balances for user:', currentUserId);
    console.log('Total expenses:', expenses.length);
    console.log('Expenses data:', expenses);
    console.log('Settlement history:', settlementHistory);

    // Get the most recent settlement timestamp for each user pair
    const getLastSettledTimestamp = (userId1, userId2) => {
      const relevantSettlements = settlementHistory.filter(s =>
        s.status === 'completed' &&
        ((s.from_user_id === userId1 && s.to_user_id === userId2) ||
         (s.from_user_id === userId2 && s.to_user_id === userId1))
      );

      if (relevantSettlements.length === 0) return null;

      // Sort by settled_up_to_timestamp or completed_at, get the most recent
      // Use ID as secondary sort for deterministic ordering when timestamps match
      const mostRecent = relevantSettlements.sort((a, b) => {
        const dateA = new Date(a.settled_up_to_timestamp || a.completed_at);
        const dateB = new Date(b.settled_up_to_timestamp || b.completed_at);
        const dateDiff = dateB - dateA;
        // If timestamps are equal, use ID for consistent ordering
        return dateDiff !== 0 ? dateDiff : b.id.localeCompare(a.id);
      })[0];

      return mostRecent.settled_up_to_timestamp || mostRecent.completed_at;
    };

    // First, calculate balances from UNSETTLED expenses only (with currency conversion)
    expenses.forEach(expense => {
      const splitBetween = expense.split_between || [];
      const paidBy = expense.paid_by;

      // Convert expense amount to user's currency
      const originalAmount = parseFloat(expense.amount);
      const expenseCurrency = expense.currency || 'USD';

      // Skip conversion if currencies are the same to avoid floating-point errors
      const convertedAmount = expenseCurrency === userCurrency
        ? originalAmount
        : (Object.keys(exchangeRates).length > 0
          ? convertCurrency(originalAmount, expenseCurrency, userCurrency, exchangeRates)
          : originalAmount);

      const splitAmount = convertedAmount / splitBetween.length;
      const expenseDate = new Date(expense.date);

      console.log('Processing expense:', {
        description: expense.description,
        originalAmount: originalAmount,
        expenseCurrency: expenseCurrency,
        userCurrency: userCurrency,
        convertedAmount: convertedAmount,
        paidBy,
        splitBetween,
        splitAmount,
        date: expense.date
      });

      // If someone else paid and you're in the split
      if (paidBy !== currentUserId && splitBetween.includes(currentUserId)) {
        const lastSettled = getLastSettledTimestamp(currentUserId, paidBy);

        // Only include expense if it's after the last settlement or no settlement exists
        if (!lastSettled || expenseDate > new Date(lastSettled)) {
          const payer = roommates.find(r => r.id === paidBy);
          if (!balances[paidBy]) {
            balances[paidBy] = {
              name: payer?.name,
              id: paidBy,
              amount: 0,
              expenses: [],
              avatar_url: payer?.avatar_url
            };
          }
          balances[paidBy].amount += splitAmount;
          balances[paidBy].expenses.push({
            ...expense,
            yourShare: splitAmount,
            convertedAmount,
            displayCurrency: userCurrency
          });
        }
      }

      // If you paid and others are in the split
      if (paidBy === currentUserId) {
        splitBetween.forEach(personId => {
          if (personId !== currentUserId) {
            const lastSettled = getLastSettledTimestamp(currentUserId, personId);

            // Only include expense if it's after the last settlement or no settlement exists
            if (!lastSettled || expenseDate > new Date(lastSettled)) {
              const person = roommates.find(r => r.id === personId);
              if (!balances[personId]) {
                balances[personId] = {
                  name: person?.name,
                  id: personId,
                  amount: 0,
                  expenses: [],
                  avatar_url: person?.avatar_url
                };
              }
              balances[personId].amount -= splitAmount;
              balances[personId].expenses.push({
                ...expense,
                theirShare: splitAmount,
                convertedAmount,
                displayCurrency: userCurrency
              });
            }
          }
        });
      }
    });

    // No need to subtract settlements anymore - we're filtering expenses by timestamp
    const finalBalances = Object.values(balances).filter(b => Math.abs(b.amount) > 0.01);

    console.log('=== FINAL BALANCE CALCULATION ===');
    finalBalances.forEach(balance => {
      console.log(`${balance.name}: ${balance.amount > 0 ? 'You owe them' : 'They owe you'} $${Math.abs(balance.amount).toFixed(2)}`);
    });

    return finalBalances;
  };

  const balances = calculateBalances();

  // Calculate summary stats
  const youOwe = balances.filter(b => b.amount > 0).reduce((sum, b) => sum + b.amount, 0);
  const youreOwed = Math.abs(balances.filter(b => b.amount < 0).reduce((sum, b) => sum + b.amount, 0));
  const netBalance = youreOwed - youOwe;

  // Handle marking payment as sent
  const handleMarkAsPaid = async (roommateId, amount) => {
    if (!currentGroup) return;

    try {
      // Find the most recent expense between these two users to set settled_up_to_timestamp
      const relevantExpenses = expenses.filter(expense => {
        const splitBetween = expense.split_between || [];
        const paidBy = expense.paid_by;

        // Check if this expense involves both users
        return (
          (paidBy === roommateId && splitBetween.includes(currentUserId)) ||
          (paidBy === currentUserId && splitBetween.includes(roommateId))
        );
      });

      // Validate settlement data before insertion
      if (!amount || amount <= 0) {
        throw new Error('Invalid settlement amount');
      }

      if (!roommateId) {
        throw new Error('Invalid recipient user');
      }

      // Get the most recent expense date (expenses are already sorted by date DESC)
      const mostRecentExpenseDate = relevantExpenses.length > 0
        ? relevantExpenses[0].date
        : new Date().toISOString();

      const { data, error } = await supabase
        .from('settlements')
        .insert({
          group_id: currentGroup.id,
          from_user_id: currentUserId,
          to_user_id: roommateId,
          amount: amount,
          status: 'pending',
          settled_up_to_timestamp: mostRecentExpenseDate
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating settlement:', error);
        throw new Error(error.message || 'Failed to create settlement');
      }

      if (!data) {
        throw new Error('Settlement created but no data returned');
      }

      // Only update UI state after successful DB operation
      setPendingSettlements(prev => [...prev, data]);
    } catch (error) {
      console.error('Error in handleMarkAsPaid:', error);
      alert('Failed to create settlement. Please try again.');
    }
  };

  // Handle accepting payment
  const handleAcceptPayment = async (settlementId) => {
    try {
      const { data, error } = await supabase
        .from('settlements')
        .update({ status: 'completed' })
        .eq('id', settlementId)
        .select()
        .single();

      if (error) {
        console.error('Error accepting payment:', error);
        alert('Failed to accept payment. Please try again.');
        return;
      }

      // Update local state
      setPendingSettlements(pendingSettlements.filter(s => s.id !== settlementId));
      setSettlementHistory([data, ...settlementHistory]);
    } catch (error) {
      console.error('Error in handleAcceptPayment:', error);
      alert('Failed to accept payment. Please try again.');
    }
  };

  // Handle rejecting payment
  const handleRejectPayment = async (settlementId) => {
    try {
      const { error } = await supabase
        .from('settlements')
        .update({ status: 'rejected' })
        .eq('id', settlementId);

      if (error) {
        console.error('Error rejecting payment:', error);
        alert('Failed to reject payment. Please try again.');
        return;
      }

      // Remove from local state
      setPendingSettlements(pendingSettlements.filter(s => s.id !== settlementId));
    } catch (error) {
      console.error('Error in handleRejectPayment:', error);
      alert('Failed to reject payment. Please try again.');
    }
  };

  // Get pending settlements sent by you
  const sentSettlements = pendingSettlements.filter(s => s.from_user_id === currentUserId);

  // Get pending settlements to confirm (sent to you)
  const receivedSettlements = pendingSettlements.filter(s => s.to_user_id === currentUserId);

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
      const settlementDate = new Date(settlement.completed_at || settlement.created_at);
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

  // Loading State - wait for both data and exchange rates
  if (loading || !exchangeRates || Object.keys(exchangeRates).length === 0) {
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

        <Sidebar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        <main className="ml-20 lg:ml-64 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
          <div className="flex items-center justify-center min-h-screen">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        </main>
      </div>
    );
  }

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
      <main className="ml-20 lg:ml-64 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10"
      >
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
        <div className="grid grid-cols-3 lg:grid-cols-3 gap-3 lg:gap-6 mb-6 sm:mb-8">
          {/* You Owe */}
          <div
            className="rounded-3xl shadow-xl p-3 lg:p-6"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <p className={`text-xs lg:text-sm font-medium mb-1 lg:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              You Owe
            </p>
            <p className="text-xl lg:text-3xl font-bold" style={{ color: '#FF5E00' }}>
              {getCurrencySymbol(userCurrency)}{displayBalance(youOwe)}
            </p>
          </div>

          {/* You're Owed */}
          <div
            className="rounded-3xl shadow-xl p-3 lg:p-6"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <p className={`text-xs lg:text-sm font-medium mb-1 lg:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              You're Owed
            </p>
            <p className="text-xl lg:text-3xl font-bold" style={{ color: '#10b981' }}>
              {getCurrencySymbol(userCurrency)}{displayBalance(youreOwed)}
            </p>
          </div>

          {/* Net Balance */}
          <div
            className="rounded-3xl shadow-xl p-3 lg:p-6"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <p className={`text-xs lg:text-sm font-medium mb-1 lg:mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Net Balance
            </p>
            <p className={`text-xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {netBalance >= 0 ? '+' : ''}{getCurrencySymbol(userCurrency)}{displayBalance(Math.abs(netBalance))}
            </p>
          </div>
        </div>

        {/* Active Balances and Settlements Grid */}
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
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all hover:scale-[1.01] ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  backdropFilter: 'blur(10px)'
                }}
              >
                Settle Up
              </button>
            </div>

            {balances.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No active balances!
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
                    {isValidAvatarUrl(selectedBalance.avatar_url) ? (
                      <img
                        src={selectedBalance.avatar_url}
                        alt={selectedBalance.name}
                        className="w-12 h-12 rounded-3xl object-cover shadow-lg"
                      />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-3xl flex items-center justify-center font-bold text-xl shadow-lg"
                        style={{
                          background: getAvatarColor(selectedBalance.id),
                          color: 'white'
                        }}
                      >
                        {selectedBalance.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedBalance.amount > 0 ? `You owe ${selectedBalance.name}` : `${selectedBalance.name} owes you`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xl sm:text-2xl font-bold" style={{ color: selectedBalance.amount > 0 ? '#FF5E00' : '#10b981' }}>
                      {selectedBalance.amount > 0 ? '-' : '+'}{getCurrencySymbol(userCurrency)}{Math.abs(selectedBalance.amount).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Expense list */}
                <div className="space-y-2">
                  {selectedBalance.expenses && selectedBalance.expenses.map((expense, idx) => {
                    const isDebt = selectedBalance.amount > 0;
                    const yourShare = isDebt ? expense.yourShare : expense.theirShare;

                    // Determine who paid: if expense has yourShare, they paid; if theirShare, you paid
                    const whoPaid = expense.yourShare ? selectedBalance.name : 'You';
                    // Color: green if you paid, orange if they paid
                    const amountColor = expense.yourShare ? '#FF5E00' : '#10b981';

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
                              {whoPaid} paid
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-base font-bold" style={{ color: amountColor }}>
                              {getCurrencySymbol(userCurrency)}{(yourShare !== undefined && yourShare !== null) ? yourShare.toFixed(2) : (expense.convertedAmount / (expense.split_between?.length || 1)).toFixed(2)}
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
                        {isValidAvatarUrl(balance.avatar_url) ? (
                          <img
                            src={balance.avatar_url}
                            alt={balance.name}
                            className="w-12 h-12 rounded-3xl object-cover shadow-lg"
                          />
                        ) : (
                          <div
                            className="w-12 h-12 rounded-3xl flex items-center justify-center font-bold text-xl shadow-lg"
                            style={{
                              background: getAvatarColor(balance.id),
                              color: 'white'
                            }}
                          >
                            {balance.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {isDebt ? `You owe ${balance.name}` : `${balance.name} owes you`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-xl sm:text-2xl font-bold" style={{ color: isDebt ? '#FF5E00' : '#10b981' }}>
                          {isDebt ? '-' : '+'}{getCurrencySymbol(userCurrency)}{Math.abs(balance.amount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Settlements (Both received and sent) */}
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
              Settlements
            </h3>
            {sentSettlements.length === 0 && receivedSettlements.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No pending settlements
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Payments to confirm (received) */}
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
                        {getUserName(settlement.from_user_id)} paid you
                      </p>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {formatDate(settlement.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-xl font-bold" style={{ color: '#10b981' }}>
                        {getCurrencySymbol(userCurrency)}{settlement.amount.toFixed(2)}
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

                {/* Payments sent (waiting for confirmation) */}
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
                        Waiting for {getUserName(settlement.to_user_id)} to confirm
                      </p>
                      <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {formatDate(settlement.created_at)}
                      </p>
                    </div>
                    <p className="text-xl font-bold" style={{ color: '#FF5E00' }}>
                      {getCurrencySymbol(userCurrency)}{settlement.amount.toFixed(2)}
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
          ) : selectedSettlement ? (
            // Detail view for selected settlement - shows related expenses
            <div className="space-y-3">
              {/* Back button */}
              <div
                onClick={() => setSelectedSettlement(null)}
                className="flex items-center justify-between p-4 rounded-3xl cursor-pointer transition-all hover:scale-[1.01]"
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)'
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-3xl flex items-center justify-center font-bold text-xl shadow-lg"
                    style={{
                      background: selectedSettlement.from_user_id === currentUserId
                        ? getAvatarColor(selectedSettlement.to_user_id)
                        : getAvatarColor(selectedSettlement.from_user_id),
                      color: 'white'
                    }}
                  >
                    {selectedSettlement.from_user_id === currentUserId
                      ? getUserName(selectedSettlement.to_user_id).charAt(0)
                      : getUserName(selectedSettlement.from_user_id).charAt(0)}
                  </div>
                  <div>
                    <p className={`text-base sm:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {selectedSettlement.from_user_id === currentUserId
                        ? `You paid ${getUserName(selectedSettlement.to_user_id)}`
                        : `${getUserName(selectedSettlement.from_user_id)} paid you`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xl sm:text-2xl font-bold" style={{
                    color: selectedSettlement.from_user_id === currentUserId ? '#FF5E00' : '#10b981'
                  }}>
                    {getCurrencySymbol(userCurrency)}{selectedSettlement.amount.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Expense list - EXACT SAME as Active Balances */}
              <div className="space-y-2">
                {(() => {
                  // Get the other person involved in this settlement
                  const otherUserId = selectedSettlement.from_user_id === currentUserId
                    ? selectedSettlement.to_user_id
                    : selectedSettlement.from_user_id;

                  const otherUserName = getUserName(otherUserId);

                  // Build a balance-like object to get expenses
                  const settlementBalance = {
                    name: otherUserName,
                    id: otherUserId,
                    amount: selectedSettlement.to_user_id === currentUserId ? selectedSettlement.amount : -selectedSettlement.amount,
                    expenses: []
                  };

                  // Get the timestamp cutoff for this settlement
                  const settledUpTo = selectedSettlement.settled_up_to_timestamp
                    ? new Date(selectedSettlement.settled_up_to_timestamp)
                    : new Date(selectedSettlement.completed_at || selectedSettlement.created_at);

                  // Get the previous settlement timestamp (if any) to know the range
                  const previousSettlements = settlementHistory.filter(s =>
                    s.status === 'completed' &&
                    s.id !== selectedSettlement.id &&
                    ((s.from_user_id === currentUserId && s.to_user_id === otherUserId) ||
                     (s.from_user_id === otherUserId && s.to_user_id === currentUserId))
                  ).sort((a, b) => {
                    const dateA = new Date(a.settled_up_to_timestamp || a.completed_at);
                    const dateB = new Date(b.settled_up_to_timestamp || b.completed_at);
                    return dateB - dateA;
                  });

                  // Find the settlement right before this one
                  const previousSettlement = previousSettlements.find(s => {
                    const sDate = new Date(s.settled_up_to_timestamp || s.completed_at);
                    return sDate < settledUpTo;
                  });

                  const previousSettledUpTo = previousSettlement
                    ? new Date(previousSettlement.settled_up_to_timestamp || previousSettlement.completed_at)
                    : null;

                  // Gather ONLY expenses that were part of THIS settlement (with currency conversion)
                  // (after previous settlement, up to this settlement's timestamp)
                  expenses.forEach(expense => {
                    const splitBetween = expense.split_between || [];
                    const paidBy = expense.paid_by;

                    // Convert expense amount to user's currency
                    const originalAmount = parseFloat(expense.amount);
                    const expenseCurrency = expense.currency || 'USD';

                    // Skip conversion if currencies are the same to avoid floating-point errors
                    const convertedAmount = expenseCurrency === userCurrency
                      ? originalAmount
                      : (Object.keys(exchangeRates).length > 0
                        ? convertCurrency(originalAmount, expenseCurrency, userCurrency, exchangeRates)
                        : originalAmount);

                    const splitAmount = convertedAmount / splitBetween.length;
                    const expenseDate = new Date(expense.date);

                    // Only include if expense is in the range for this settlement
                    const isInRange = expenseDate <= settledUpTo &&
                      (!previousSettledUpTo || expenseDate > previousSettledUpTo);

                    if (!isInRange) return;

                    // If other person paid and we're in the split
                    if (paidBy === otherUserId && splitBetween.includes(currentUserId)) {
                      settlementBalance.expenses.push({
                        ...expense,
                        yourShare: splitAmount,
                        convertedAmount,
                        displayCurrency: userCurrency
                      });
                    }

                    // If we paid and other person is in split
                    if (paidBy === currentUserId && splitBetween.includes(otherUserId)) {
                      settlementBalance.expenses.push({
                        ...expense,
                        theirShare: splitAmount,
                        convertedAmount,
                        displayCurrency: userCurrency
                      });
                    }
                  });

                  // Use EXACT SAME rendering as Active Balances
                  if (settlementBalance.expenses.length === 0) {
                    return (
                      <div
                        className="p-4 rounded-2xl text-center"
                        style={{
                          background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)'
                        }}
                      >
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          Payment settled
                        </p>
                      </div>
                    );
                  }

                  const isDebt = settlementBalance.amount > 0;

                  return settlementBalance.expenses.map((expense, idx) => {
                    const yourShare = isDebt ? expense.yourShare : expense.theirShare;

                    // Determine who paid: if expense has yourShare, they paid; if theirShare, you paid
                    const whoPaid = expense.yourShare ? settlementBalance.name : 'You';
                    // Color: green if you paid, orange if they paid
                    const amountColor = expense.yourShare ? '#FF5E00' : '#10b981';

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
                              {whoPaid} paid
                            </p>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-base font-bold" style={{ color: amountColor }}>
                              {getCurrencySymbol(userCurrency)}{(yourShare !== undefined && yourShare !== null) ? yourShare.toFixed(2) : (expense.convertedAmount / expense.split_between.length).toFixed(2)}
                            </p>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.slice().reverse().map((settlement) => (
                <div
                  key={settlement.id}
                  onClick={() => setSelectedSettlement(settlement)}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.01]"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <div className="flex-1 mb-2 sm:mb-0">
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {settlement.from_user_id === currentUserId
                        ? `You paid ${getUserName(settlement.to_user_id)}`
                        : `${getUserName(settlement.from_user_id)} paid you`}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatDate(settlement.completed_at || settlement.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-bold" style={{
                      color: settlement.from_user_id === currentUserId ? '#FF5E00' : '#10b981'
                    }}>
                      {getCurrencySymbol(userCurrency)}{settlement.amount.toFixed(2)}
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
                    You don't owe anyone!
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
                          {getCurrencySymbol(userCurrency)}{balance.amount.toFixed(2)}
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
                              if (venmoUsername) {
                                // If username exists, try to open Venmo app, fallback to web
                                const venmoUrl = `venmo://paycharge?txn=pay&recipients=${venmoUsername}&amount=${balance.amount.toFixed(2)}&note=Divvy%20payment`;
                                const venmoWebUrl = `https://venmo.com/${venmoUsername}?txn=pay&amount=${balance.amount.toFixed(2)}&note=Divvy%20payment`;

                                // Try app first, fallback to web after a short delay
                                window.location.href = venmoUrl;
                                setTimeout(() => {
                                  window.open(venmoWebUrl, '_blank');
                                }, 500);
                              } else {
                                // If no username, just open Venmo homepage
                                window.open('https://venmo.com', '_blank');
                              }
                            }}
                            className="px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105 shadow-sm"
                            style={{ backgroundColor: '#008CFF' }}
                          >
                            Venmo
                          </button>
                          <button
                            onClick={() => {
                              const paypalUsername = getPaymentUsername(balance.id, 'paypal');
                              // If username exists, use PayPal.me link with amount
                              // Otherwise, just open PayPal.com so user can search and pay manually
                              const paypalUrl = paypalUsername
                                ? `https://paypal.me/${paypalUsername}/${balance.amount.toFixed(2)}`
                                : 'https://www.paypal.com';
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
                              if (zelleEmail) {
                                // Copy Zelle info to clipboard and show instructions
                                navigator.clipboard.writeText(zelleEmail).then(() => {
                                  alert(`Zelle info copied!\n\nSend ${getCurrencySymbol(userCurrency)}${balance.amount.toFixed(2)} to:\n${zelleEmail}\n\nOpen your banking app to complete the payment.`);
                                }).catch(() => {
                                  alert(`Send ${getCurrencySymbol(userCurrency)}${balance.amount.toFixed(2)} via Zelle to:\n${zelleEmail}\n\nOpen your banking app to complete the payment.`);
                                });
                              } else {
                                // If no Zelle info, open Zelle website
                                window.open('https://www.zelle.com', '_blank');
                              }
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

      {/* Payment Method Alert Modal */}
      {showPaymentMethodAlert && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4"
          style={{ backdropFilter: 'blur(8px)' }}
          onClick={() => setShowPaymentMethodAlert(false)}
        >
          <div
            className="rounded-3xl shadow-2xl max-w-sm w-full p-6"
            style={{
              background: isDarkMode ? '#2d2d2d' : '#F5F5F5'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <h3 className={`text-xl font-bold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Setup Required
              </h3>
              <p className={`text-base mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {paymentAlertMessage}
              </p>
              <button
                onClick={() => setShowPaymentMethodAlert(false)}
                className="w-full px-6 py-3 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#FF5E00' }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Balances;
