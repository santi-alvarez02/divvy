import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getCurrencySymbol } from '../utils/currency';
import {
  getExchangeRatesFromDB,
  convertCurrency,
  updateExchangeRates,
  shouldUpdateRates
} from '../utils/exchangeRates';
import useOverscrollEffect from '../hooks/useOverscrollEffect';

const Budget = ({ isDarkMode, setIsDarkMode }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timePeriod, setTimePeriod] = useState('month'); // 'month' or 'custom'
  const [selectedMonth, setSelectedMonth] = useState(null); // For custom month selection
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState(0);
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState([]);
  const [roommates, setRoommates] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [currency, setCurrency] = useState('USD');
  const [userCurrency, setUserCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({});
  const [settlementHistory, setSettlementHistory] = useState([]);
  const monthScrollRef = React.useRef(null);
  const { showTopGradient, showBottomGradient } = useOverscrollEffect();

  const currentUserId = user?.id;

  // Fetch group, budget, expenses, and members
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Get user's budget and currency from users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('monthly_budget, default_currency')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError);
        } else {
          console.log('Budget Page - User data:', userData);
          setBudgetLimit(userData?.monthly_budget || 0);
          setCurrency(userData?.default_currency || 'USD');
        }

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
          console.log('Budget Page - Fetched group:', groupMemberships.groups);
          setCurrentGroup(groupMemberships.groups);

          // Fetch all group members
          const { data: members, error: membersError } = await supabase
            .from('group_members')
            .select(`
              user_id,
              role,
              users (
                id,
                full_name,
                email
              )
            `)
            .eq('group_id', groupMemberships.groups.id);

          if (membersError) {
            console.error('Error fetching members:', membersError);
          } else {
            const transformedMembers = members.map(member => ({
              id: member.users.id,
              name: member.users.id === user.id ? 'You' : member.users.full_name,
              email: member.users.email
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
            // Transform expenses to include split_between array and convert amounts
            const transformedExpenses = expensesData?.map(expense => {
              const originalAmount = parseFloat(expense.amount);
              const expenseCurrency = expense.currency || 'USD';

              return {
                ...expense,
                originalAmount,
                expenseCurrency,
                splitBetween: expense.expense_splits?.map(split => split.user_id) || [],
                paidBy: expense.paid_by
              };
            }) || [];
            setExpenses(transformedExpenses);
          }

          // Fetch settlement history for this group
          const { data: settlementsData, error: settlementsError } = await supabase
            .from('settlements')
            .select('*')
            .eq('group_id', groupMemberships.groups.id)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false });

          if (settlementsError) {
            console.error('Error fetching settlements:', settlementsError);
          } else {
            setSettlementHistory(settlementsData || []);
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

  // Get available month options for picker
  const getMonthOptions = () => {
    const options = ['This Month'];
    const monthsSet = new Set();

    expenses.forEach(expense => {
      if (expense.splitBetween.includes(currentUserId)) {
        const expenseDate = new Date(expense.date);
        const monthYear = `${expenseDate.getFullYear()}-${expenseDate.getMonth()}`;
        monthsSet.add(monthYear);
      }
    });

    const months = Array.from(monthsSet)
      .map(monthYear => {
        const [year, month] = monthYear.split('-').map(Number);
        return { year, month };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

    // Add month names, excluding current month
    const now = new Date();
    months.forEach(monthData => {
      if (monthData.month !== now.getMonth() || monthData.year !== now.getFullYear()) {
        const monthName = new Date(monthData.year, monthData.month).toLocaleDateString('en-US', { month: 'long' });
        options.push(monthName);
      }
    });

    return options;
  };

  const monthOptions = getMonthOptions();

  // Month picker scroll effect
  React.useEffect(() => {
    if (showMonthPicker && monthScrollRef.current) {
      const currentSelection = timePeriod === 'month' ? 'This Month' :
        (selectedMonth ? new Date(selectedMonth.year, selectedMonth.month).toLocaleDateString('en-US', { month: 'long' }) : 'This Month');
      const selectedIndex = monthOptions.indexOf(currentSelection);
      const itemHeight = 40;
      const scrollTop = selectedIndex * itemHeight;
      const scrollContainer = monthScrollRef.current;

      scrollContainer.scrollTop = scrollTop;

      const handleScroll = () => {
        const currentScrollTop = scrollContainer.scrollTop;
        const highlightedIndex = Math.round(currentScrollTop / itemHeight);

        const buttons = scrollContainer.querySelectorAll('.month-filter-item');
        buttons.forEach((button, btnIndex) => {
          if (btnIndex === highlightedIndex) {
            button.style.color = isDarkMode ? 'white' : '#000000';
            button.style.fontSize = '17px';
            button.style.fontWeight = '700';
          } else {
            button.style.color = isDarkMode ? '#d1d5db' : '#6b7280';
            button.style.fontSize = '15px';
            button.style.fontWeight = '400';
          }
        });
      };

      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

      requestAnimationFrame(() => {
        handleScroll();
      });

      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [showMonthPicker, timePeriod, selectedMonth, monthOptions, isDarkMode]);

  // Helper to get month data from month name
  const getMonthDataFromName = (monthName) => {
    if (!monthName) {
      console.warn('getMonthDataFromName: monthName is undefined or null');
      return null;
    }

    if (monthName === 'This Month') {
      const now = new Date();
      return { month: now.getMonth(), year: now.getFullYear() };
    }

    // Find the month data from available months
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const targetMonthName = targetDate.toLocaleDateString('en-US', { month: 'long' });
      if (targetMonthName === monthName) {
        return { month: targetDate.getMonth(), year: targetDate.getFullYear() };
      }
    }

    // Month not found - log for debugging
    console.warn(`Month "${monthName}" not found in last 12 months`);
    return null;
  };

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

      if (timePeriod === 'month') {
        return expenseMonth === currentMonth && expenseYear === currentYear;
      } else if (timePeriod === 'custom' && selectedMonth) {
        return expenseMonth === selectedMonth.month && expenseYear === selectedMonth.year;
      }

      return false;
    }).sort((a, b) => {
      // Sort by date first (most recent first)
      const dateComparison = new Date(b.date) - new Date(a.date);

      // If dates are the same, sort by created_at (most recent first)
      if (dateComparison === 0 && a.created_at && b.created_at) {
        return new Date(b.created_at) - new Date(a.created_at);
      }

      return dateComparison;
    });
  };

  const filteredExpenses = getFilteredExpenses();

  // Convert expenses to user's currency
  const convertedExpenses = filteredExpenses.map(expense => {
    // Ensure consistent number type and handle invalid amounts
    const originalAmount = parseFloat(expense.originalAmount ?? expense.amount) || 0;

    // Skip invalid expenses
    if (isNaN(originalAmount) || originalAmount === 0) {
      console.warn('Invalid expense amount:', expense);
      return null;
    }

    const expenseCurrency = expense.expenseCurrency || expense.currency || 'USD';
    const convertedAmount = Object.keys(exchangeRates).length > 0
      ? convertCurrency(originalAmount, expenseCurrency, userCurrency, exchangeRates)
      : originalAmount;

    // Round to 2 decimal places to avoid floating point issues
    const roundedAmount = Math.round(convertedAmount * 100) / 100;

    return {
      ...expense,
      amount: roundedAmount,
      displayCurrency: userCurrency
    };
  }).filter(expense => expense !== null); // Remove invalid expenses

  // My Share = The value of goods/services YOU consumed this month
  // This matches the Expenses page "My Share" calculation exactly
  const totalSpent = convertedExpenses.reduce((sum, expense) => {
    // 1. Personal Expense (Yours) -> Full amount
    if (expense.splitBetween.length === 1 && expense.paidBy === currentUserId) {
      return sum + expense.amount;
    }
    // 2. Personal Expense (Others) -> 0
    if (expense.splitBetween.length === 1 && expense.paidBy !== currentUserId) {
      return sum;
    }

    // 3. Loans (check if isLoan exists or if it's a loan by checking splits)
    // A loan is when one person pays but has 0 share
    const paidByYou = expense.paidBy === currentUserId;
    const yourSplit = expense.expense_splits?.find(s => s.user_id === currentUserId);

    // If you paid but have 0 share, you lent money (not consumption)
    if (paidByYou && yourSplit && yourSplit.share_amount === 0) {
      return sum;
    }

    // If someone else paid and you have the full amount as share, you borrowed (consumption)
    if (!paidByYou && yourSplit && yourSplit.share_amount === expense.amount) {
      return sum + expense.amount;
    }

    // 4. Shared Expenses
    // If you are in the split, add your share
    if (expense.splitBetween.includes(currentUserId)) {
      const userShare = expense.amount / expense.splitBetween.length;
      return sum + userShare;
    }

    return sum;
  }, 0);

  const remaining = budgetLimit - totalSpent;
  const percentageUsed = Math.min((totalSpent / budgetLimit) * 100, 100);
  const percentageRemaining = Math.max((remaining / budgetLimit) * 100, 0);

  // Calculate spending by category - using converted amounts
  const categorySpending = convertedExpenses.reduce((acc, expense) => {
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

  // Calculate spending - current month plus next 2 months (with currency conversion)
  const getMonthlySpending = () => {
    const now = new Date();
    const months = [];

    // Show current month and next 2 upcoming months (3 months total)
    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'short' });
      const monthYear = monthDate.getFullYear();
      const month = monthDate.getMonth();

      const monthExpenses = expenses.filter(expense => {
        if (!expense.splitBetween.includes(currentUserId)) return false;
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === month && expenseDate.getFullYear() === monthYear;
      });

      const spent = monthExpenses.reduce((sum, expense) => {
        const originalAmount = expense.originalAmount || parseFloat(expense.amount);
        const expenseCurrency = expense.expenseCurrency || expense.currency || 'USD';
        const convertedAmount = Object.keys(exchangeRates).length > 0
          ? convertCurrency(originalAmount, expenseCurrency, userCurrency, exchangeRates)
          : originalAmount;
        const userShare = convertedAmount / expense.splitBetween.length;
        return sum + userShare;
      }, 0);

      months.push({
        label: monthName,
        budget: budgetLimit,
        spent: spent,
        isCurrent: i === 0
      });
    }

    return months;
  };

  const monthlyData = getMonthlySpending();

  // Handle budget update
  const handleBudgetUpdate = async (newBudget) => {
    if (!user) return;

    const previousBudget = budgetLimit;

    try {
      const { error } = await supabase
        .from('users')
        .update({ monthly_budget: newBudget })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating budget:', error);
        alert('Failed to update budget. Please try again.');
        // Revert to previous value
        setBudgetLimit(previousBudget);
      } else {
        console.log('Budget updated successfully:', newBudget);
        setBudgetLimit(newBudget);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to update budget. Please try again.');
      setBudgetLimit(previousBudget);
    } finally {
      setIsEditingBudget(false);
    }
  };

  // Show loading state - wait for both data and exchange rates
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
        <main className="ml-20 lg:ml-64 px-4 sm:px-6 lg:px-8 pt-12 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 lg:pb-8 relative z-10"
      >
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
      {/* Overscroll Gradient Overlays */}
      <div
        className="fixed top-0 left-20 lg:left-64 right-0 h-32 pointer-events-none transition-opacity duration-300"
        style={{
          background: isDarkMode
            ? 'linear-gradient(to bottom, rgba(26, 26, 26, 0.95) 0%, rgba(26, 26, 26, 0.7) 30%, transparent 100%)'
            : 'linear-gradient(to bottom, rgba(245, 245, 245, 0.95) 0%, rgba(245, 245, 245, 0.7) 30%, transparent 100%)',
          opacity: showTopGradient ? 1 : 0,
          zIndex: 50
        }}
      />
      <div
        className="fixed bottom-0 left-20 lg:left-64 right-0 h-32 pointer-events-none transition-opacity duration-300"
        style={{
          background: isDarkMode
            ? 'linear-gradient(to top, rgba(26, 26, 26, 0.95) 0%, rgba(26, 26, 26, 0.7) 30%, transparent 100%)'
            : 'linear-gradient(to top, rgba(245, 245, 245, 0.95) 0%, rgba(245, 245, 245, 0.7) 30%, transparent 100%)',
          opacity: showBottomGradient ? 1 : 0,
          zIndex: 50
        }}
      />

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
      <main className="ml-20 lg:ml-64 px-4 sm:px-6 lg:px-8 pt-12 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 lg:pb-8 relative z-10"
      >
        {/* Header with Time Period Selector */}
        <div className="mb-6 sm:mb-8">
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif mb-4"
            style={{ color: isDarkMode ? '#FF5E00' : '#1f2937' }}
          >
            Budget
          </h1>

          {/* Time Period Selector */}
          <div className="flex gap-2 relative">
            {/* This Month Button */}
            <button
              onClick={() => {
                setTimePeriod('month');
                setSelectedMonth(null);
                setShowMonthPicker(false);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                timePeriod === 'month'
                  ? 'text-white'
                  : isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}
              style={{
                backgroundColor: timePeriod === 'month'
                  ? '#FF5E00'
                  : isDarkMode
                  ? 'rgba(255, 255, 255, 0.1)'
                  : 'rgba(0, 0, 0, 0.05)'
              }}
            >
              This Month
            </button>

            {/* Select Month Button */}
            <div className="relative">
              <button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  timePeriod === 'custom'
                    ? 'text-white'
                    : isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}
                style={{
                  backgroundColor: timePeriod === 'custom'
                    ? '#FF5E00'
                    : isDarkMode
                    ? 'rgba(255, 255, 255, 0.1)'
                    : 'rgba(0, 0, 0, 0.05)'
                }}
              >
                {timePeriod === 'custom' && selectedMonth
                  ? new Date(selectedMonth.year, selectedMonth.month).toLocaleDateString('en-US', { month: 'long' })
                  : 'Select Month'}
              </button>

              {/* Month Wheel Picker Overlay */}
              {showMonthPicker && (
                <>
                  <div
                    className="fixed inset-0"
                    style={{ zIndex: 1000 }}
                    onClick={() => setShowMonthPicker(false)}
                  />
                  <div
                    className="absolute rounded-xl overflow-hidden scrollbar-hide"
                    style={{
                      top: '45px',
                      left: '0',
                      right: '0',
                      height: '120px',
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.5)',
                      backdropFilter: 'blur(16px)',
                      zIndex: 1001
                    }}
                  >
                    <div className="relative h-full overflow-hidden">
                      {/* Selection highlight bar */}
                      <div
                        className="absolute left-0 right-0 pointer-events-none rounded-xl"
                        style={{
                          top: '0px',
                          height: '40px',
                          background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
                          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'
                        }}
                      />

                      {/* Month options list */}
                      <div
                        ref={monthScrollRef}
                        className="h-full overflow-y-auto scrollbar-hide"
                        style={{
                          paddingTop: '0px',
                          paddingBottom: '80px'
                        }}
                      >
                        {monthOptions.map((monthName) => (
                          <button
                            key={monthName}
                            type="button"
                            onClick={() => {
                              if (monthName === 'This Month') {
                                setTimePeriod('month');
                                setSelectedMonth(null);
                              } else {
                                const monthData = getMonthDataFromName(monthName);
                                if (monthData) {
                                  setTimePeriod('custom');
                                  setSelectedMonth(monthData);
                                } else {
                                  // Fallback if month data not found
                                  console.error('Could not find month data for:', monthName);
                                  setTimePeriod('month'); // Default to current month
                                  setSelectedMonth(null);
                                }
                              }
                              setShowMonthPicker(false);
                            }}
                            className="w-full flex items-center justify-center month-filter-item"
                            style={{
                              height: '40px',
                              background: 'transparent',
                              color: '#6b7280',
                              fontSize: '15px',
                              fontWeight: '400',
                              transition: 'color 0.15s ease, font-size 0.15s ease, font-weight 0.15s ease'
                            }}
                          >
                            {monthName}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
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
            {/* Header with Month and Edit Button */}
            <div className="flex items-center justify-between mb-8">
              <h2 className={`text-2xl sm:text-3xl font-bold font-serif ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {timePeriod === 'month'
                  ? new Date().toLocaleDateString('en-US', { month: 'long' })
                  : selectedMonth
                  ? new Date(selectedMonth.year, selectedMonth.month).toLocaleDateString('en-US', { month: 'long' })
                  : new Date().toLocaleDateString('en-US', { month: 'long' })}
              </h2>
              <button
                onClick={() => setIsEditingBudget(true)}
                className="px-6 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-80"
                style={{
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                  color: isDarkMode ? '#9ca3af' : '#6b7280'
                }}
              >
                Edit
              </button>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8">
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
                      {remaining < 0 ? '-' : ''}{getCurrencySymbol(userCurrency)}{Math.abs(remaining).toFixed(0)}
                    </p>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {remaining >= 0 ? 'Remaining' : 'Over Budget'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Budget Details - Below on mobile, to the right on desktop */}
              <div className="flex-1 w-full lg:w-auto">
                <div className="flex flex-row justify-center gap-8 lg:flex-col lg:gap-0 lg:space-y-8 text-center lg:text-left">
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
                        onBlur={() => handleBudgetUpdate(budgetLimit)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleBudgetUpdate(budgetLimit);
                          }
                        }}
                        autoFocus
                        className="text-xl lg:text-3xl font-bold bg-transparent border-b-2 border-orange-500 outline-none w-full text-center lg:text-left"
                        style={{ color: isDarkMode ? 'white' : '#1f2937' }}
                      />
                    ) : (
                      <p
                        className="text-xl lg:text-3xl font-bold cursor-pointer hover:opacity-80"
                        style={{ color: isDarkMode ? 'white' : '#1f2937' }}
                        onClick={() => setIsEditingBudget(true)}
                      >
                        {getCurrencySymbol(userCurrency)}{budgetLimit.toFixed(2)}
                      </p>
                    )}
                  </div>

                  {/* Total Spent */}
                  <div>
                    <p className={`text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      Total Spent
                    </p>
                    <p className="text-xl lg:text-3xl font-bold" style={{ color: '#FF5E00' }}>
                      {getCurrencySymbol(userCurrency)}{totalSpent.toFixed(2)}
                    </p>
                  </div>
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
            <h2 className={`text-xl sm:text-2xl md:text-3xl font-bold font-serif mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
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
                  Total Spent
                </span>
              </div>
            </div>

            {/* Column Chart */}
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
                      {getCurrencySymbol(userCurrency)}{Math.round((maxValue * i) / 4)}
                    </span>
                  ));
                })()}
              </div>

              {/* Chart area */}
              <div className="flex-1 relative">
                {/* Grid lines */}
                <div className="absolute inset-0">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="absolute w-full"
                      style={{
                        top: `${i * 25}%`,
                        borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                      }}
                    />
                  ))}
                </div>

                {/* Columns */}
                <div className="relative h-full flex items-end justify-start gap-4 sm:gap-8 md:gap-16 px-4">
                  {monthlyData.map((month, index) => {
                    const maxValue = Math.max(...monthlyData.map(m => Math.max(m.budget, m.spent)));
                    const chartHeight = 280;
                    const budgetHeightPx = (month.budget / maxValue) * chartHeight * 0.9;
                    const spentHeightPx = (month.spent / maxValue) * chartHeight * 0.9;

                    // Only show columns for current month (index 0)
                    const showBudgetColumn = index === 0;
                    const showSpentColumn = index === 0 && month.spent > 0;

                    return (
                      <div key={index} className="flex gap-2 items-end justify-center">
                        {/* Budget Column - only for current month */}
                        {showBudgetColumn && (
                          <div
                            className="rounded-t-lg transition-all duration-500"
                            style={{
                              height: `${budgetHeightPx}px`,
                              backgroundColor: '#6366f1',
                              width: '30px'
                            }}
                          />
                        )}
                        {/* Actual Column - only for current month with spending */}
                        {showSpentColumn && (
                          <div
                            className="rounded-t-lg transition-all duration-500"
                            style={{
                              height: `${spentHeightPx}px`,
                              backgroundColor: '#FF5E00',
                              width: '30px'
                            }}
                          />
                        )}
                        {/* Placeholder for empty months */}
                        {!showBudgetColumn && (
                          <div style={{ width: '68px', height: '1px' }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* X-axis labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-start gap-16 px-4" style={{ transform: 'translateY(25px)' }}>
                  {monthlyData.map((month, index) => (
                    <span
                      key={index}
                      className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      style={{ width: '68px', textAlign: 'center' }}
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
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl sm:text-3xl font-bold font-serif ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Recent Expenses
            </h2>
            <button
              onClick={() => navigate('/expenses')}
              className="px-6 py-2 rounded-full text-sm font-semibold transition-all hover:opacity-80"
              style={{
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                color: isDarkMode ? '#9ca3af' : '#6b7280'
              }}
            >
              View All
            </button>
          </div>

          {convertedExpenses.length === 0 ? (
            <div className="text-center py-12">
              <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                No expenses for this period
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {convertedExpenses.slice(0, 5).map((expense) => {
                const userShare = expense.amount / expense.splitBetween.length;
                const payer = roommates.find(r => r.id === expense.paidBy);
                const currentUser = roommates.find(r => r.name === 'You');
                const splitText = expense.splitBetween.length === roommates.length ? 'Split evenly' :
                                  `Split ${expense.splitBetween.length} ways`;

                return (
                  <div
                    key={expense.id}
                    className="flex items-start justify-between py-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {expense.description}
                        </h3>
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
                            color: isDarkMode ? '#9ca3af' : '#6b7280'
                          }}
                        >
                          {expense.category}
                        </span>
                      </div>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {payer?.id === currentUser?.id ? 'You paid' : `${payer?.name} paid`}
                        <span className="mx-2">•</span>
                        {splitText}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: '#FF5E00' }}>
                        {getCurrencySymbol(userCurrency)}{expense.amount.toFixed(2)}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {new Date(expense.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
