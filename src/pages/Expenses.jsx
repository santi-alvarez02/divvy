import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from '../components/Sidebar';
import AddExpenseModal from '../components/AddExpenseModal';
import EditExpenseModal from '../components/EditExpenseModal';
import { getCurrencySymbol } from '../utils/currency';
import { getAvatarColor } from '../utils/avatarColors';
import {
  getExchangeRatesFromDB,
  convertCurrency,
  updateExchangeRates,
  shouldUpdateRates
} from '../utils/exchangeRates';

const Expenses = ({ isDarkMode, setIsDarkMode }) => {
  const { user } = useAuth();

  // State management
  const [expenses, setExpenses] = useState([]);
  const [roommates, setRoommates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groupCurrency, setGroupCurrency] = useState('USD');
  const [settlementHistory, setSettlementHistory] = useState([]);
  const [userCurrency, setUserCurrency] = useState('USD'); // User's display currency
  const [exchangeRates, setExchangeRates] = useState({}); // Cached exchange rates
  const [currentUserFullName, setCurrentUserFullName] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState('This Month');
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [hoveredExpenseId, setHoveredExpenseId] = useState(null);
  const categoryScrollRef = React.useRef(null);
  const dateScrollRef = React.useRef(null);


  // Fetch user's group and members
  useEffect(() => {
    const fetchUserGroup = async () => {
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
          // Set group currency
          if (groupMemberships.groups.default_currency) {
            setGroupCurrency(groupMemberships.groups.default_currency);
          }

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
            // Transform members data to match expected format
            const transformedMembers = members.map(member => ({
              id: member.users.id,
              name: member.users.id === user.id ? 'You' : member.users.full_name,
              full_name: member.users.full_name, // Store actual full name for all users
              email: member.users.email
            }));
            setRoommates(transformedMembers);

            // Store current user's full name for avatar initials
            const currentUserData = members.find(m => m.users.id === user.id);
            if (currentUserData) {
              setCurrentUserFullName(currentUserData.users.full_name);
            }
          }
        }
      } catch (error) {
        console.error('Error in fetchUserGroup:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserGroup();
  }, [user]);

  // Fetch user's display currency and exchange rates (runs immediately)
  useEffect(() => {
    const fetchCurrencyData = async () => {
      if (!user) return;

      try {
        // Fetch both user currency and exchange rates in parallel
        const [userDataResult, ratesResult] = await Promise.all([
          supabase
            .from('users')
            .select('default_currency')
            .eq('id', user.id)
            .single(),
          getExchangeRatesFromDB()
        ]);

        // Set user currency immediately
        if (!userDataResult.error && userDataResult.data?.default_currency) {
          setUserCurrency(userDataResult.data.default_currency);
        }

        // Set exchange rates immediately
        if (ratesResult.rates) {
          setExchangeRates(ratesResult.rates);
        }

        console.log('✅ Currency data loaded:', {
          userCurrency: userDataResult.data?.default_currency,
          ratesCount: Object.keys(ratesResult.rates || {}).length
        });

        // Check if we need to update rates (do this in background, don't wait)
        shouldUpdateRates()
          .then(needsUpdate => {
            if (needsUpdate) {
              console.log('📊 Updating exchange rates in background...');
              return updateExchangeRates()
                .then(() => getExchangeRatesFromDB())
                .then(({ rates }) => {
                  if (rates) {
                    setExchangeRates(rates);
                    console.log('✅ Exchange rates refreshed');
                  }
                });
            }
          })
          .catch(error => {
            console.error('Failed to update exchange rates:', error);
            // Continue with existing rates - don't break the app
          });
      } catch (error) {
        console.error('Error fetching currency data:', error);
      }
    };

    fetchCurrencyData();
  }, [user]);

  // Fetch expenses for the user's group
  const fetchExpenses = async () => {
    if (!user || !currentGroup) {
      return;
    }

    try {
      // Fetch expenses with their splits
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          amount,
          currency,
          category,
          description,
          date,
          paid_by,
          icon,
          created_at,
          expense_splits (
            user_id,
            share_amount
          )
        `)
        .eq('group_id', currentGroup.id)
        .order('date', { ascending: false });

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        return;
      }

      // Transform expenses data to match expected format
      const transformedExpenses = expensesData.map(expense => {
        const originalAmount = parseFloat(expense.amount);
        const expenseCurrency = expense.currency || 'USD';

        // Convert amount to user's display currency
        const convertedAmount = Object.keys(exchangeRates).length > 0
          ? convertCurrency(originalAmount, expenseCurrency, userCurrency, exchangeRates)
          : originalAmount;

        return {
          id: expense.id,
          amount: convertedAmount, // Converted amount
          originalAmount: originalAmount, // Store original for reference
          currency: expenseCurrency, // Original currency
          displayCurrency: userCurrency, // Currency being displayed
          category: expense.category,
          description: expense.description,
          date: expense.date,
          paidBy: expense.paid_by,
          icon: expense.icon,
          createdAt: expense.created_at,
          splitBetween: expense.expense_splits.map(split => split.user_id)
        };
      });

      setExpenses(transformedExpenses);

      // Fetch settlement history for the group
      const { data: settlementsData, error: settlementsError } = await supabase
        .from('settlements')
        .select('*')
        .eq('group_id', currentGroup.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      if (settlementsError) {
        console.error('Error fetching settlements:', settlementsError);
      } else {
        setSettlementHistory(settlementsData || []);
      }
    } catch (error) {
      console.error('Error in fetchExpenses:', error);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [user, currentGroup]);

  // Get roommate name by ID
  const getRoommateName = (id) => {
    const roommate = roommates.find(r => r.id === id);
    if (!roommate) return 'Unknown';

    // Sanitize name to prevent XSS - remove potentially dangerous characters
    const name = String(roommate.name || 'Unknown');
    return name.replace(/[<>'"]/g, '');
  };

  // Handle edit expense
  const handleEditExpense = (expense) => {
    setExpenseToEdit(expense);
    setIsEditModalOpen(true);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get split info
  const getSplitInfo = (expense) => {
    // Safety check: ensure splitBetween exists and is an array
    const splitBetween = expense.splitBetween || [];
    const numPeople = splitBetween.length;

    // Handle edge case: no split data
    if (numPeople === 0) {
      return 'Not split';
    }

    // Check against roommates length (with null check)
    if (roommates && numPeople === roommates.length) {
      return 'Split evenly';
    } else if (numPeople === 2) {
      const other = splitBetween.find(id => id !== expense.paidBy);
      // Safety check: ensure 'other' exists before getting name
      return other ? `Split with ${getRoommateName(other)}` : 'Split 2 ways';
    } else {
      return `Split ${numPeople} ways`;
    }
  };

  // Get unique categories
  const categories = ['All', ...new Set(expenses.map(e => e.category))];

  // Date range options - generate current month and previous months with data
  const generateDateRanges = () => {
    const ranges = ['This Week', 'This Month'];
    const currentDate = new Date();

    // Add previous 11 months only if they have expenses
    for (let i = 1; i <= 11; i++) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = targetDate.toLocaleDateString('en-US', { month: 'long' });
      const targetYear = targetDate.getFullYear();
      const targetMonth = targetDate.getMonth();

      // Check if this month has any expenses
      const hasExpenses = expenses.some(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === targetMonth && expenseDate.getFullYear() === targetYear;
      });

      if (hasExpenses) {
        ranges.push(monthName);
      }
    }

    return ranges;
  };

  const dateRanges = generateDateRanges();

  // Category picker scroll effect
  React.useEffect(() => {
    if (!showCategoryPicker || !categoryScrollRef.current) {
      return; // Early return still allows cleanup
    }

    const selectedIndex = categories.indexOf(selectedCategory);
    const itemHeight = 40;
    const scrollTop = selectedIndex * itemHeight;
    const scrollContainer = categoryScrollRef.current;

    scrollContainer.scrollTop = scrollTop;

    const handleScroll = () => {
      const currentScrollTop = scrollContainer.scrollTop;
      const highlightedIndex = Math.round(currentScrollTop / itemHeight);

      const buttons = scrollContainer.querySelectorAll('.category-filter-item');
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
  }, [showCategoryPicker, selectedCategory, categories, isDarkMode]);

  // Date picker scroll effect
  React.useEffect(() => {
    if (!showDatePicker || !dateScrollRef.current) {
      return; // Early return still allows cleanup
    }

    const selectedIndex = dateRanges.indexOf(selectedDateRange);
    const itemHeight = 40;
    const scrollTop = selectedIndex * itemHeight;
    const scrollContainer = dateScrollRef.current;

    scrollContainer.scrollTop = scrollTop;

    const handleScroll = () => {
      const currentScrollTop = scrollContainer.scrollTop;
      const highlightedIndex = Math.round(currentScrollTop / itemHeight);

      const buttons = scrollContainer.querySelectorAll('.date-filter-item');
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
  }, [showDatePicker, selectedDateRange, dateRanges, isDarkMode]);

  // Date filter helper
  const filterByDateRange = (expense) => {
    const expenseDate = new Date(expense.date);
    const now = new Date();

    if (selectedDateRange === 'This Week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return expenseDate >= weekAgo;
    } else if (selectedDateRange === 'This Month') {
      return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear();
    } else {
      // Handle specific month names (September, August, July, etc.)
      const expenseMonthName = expenseDate.toLocaleDateString('en-US', { month: 'long' });

      // Check if the expense month matches the selected month
      // Consider both current year and previous year
      if (expenseMonthName === selectedDateRange) {
        const currentYear = now.getFullYear();
        const expenseYear = expenseDate.getFullYear();

        // Get the month index of the selected month
        const selectedMonthIndex = dateRanges.indexOf(selectedDateRange);
        const monthsBack = selectedMonthIndex - 1; // -1 because first two items are "This Week" and "This Month", and we want 1-indexed months back

        // Calculate the expected year for this month
        const expectedDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
        const expectedYear = expectedDate.getFullYear();

        return expenseYear === expectedYear;
      }

      return false;
    }
  };

  // Filter expenses by date only for charts
  const dateFilteredExpenses = expenses.filter(expense => filterByDateRange(expense));

  // Get current user ID (use authenticated user ID)
  const currentUserId = user?.id;

  // Calculate summary stats from date-filtered expenses
  // Total Spent (Personal) = Your share of expenses YOU paid for
  // (Full amount minus what others owe you)
  const totalSpent = dateFilteredExpenses
    .filter(expense => expense.paidBy === currentUserId)
    .reduce((sum, expense) => {
      const yourShare = expense.amount / expense.splitBetween.length;
      return sum + yourShare;
    }, 0);

  // Helper function to get last settled timestamp for a user pair
  const getLastSettledTimestamp = (userId1, userId2) => {
    const relevantSettlements = settlementHistory.filter(s =>
      ((s.from_user_id === userId1 && s.to_user_id === userId2) ||
       (s.from_user_id === userId2 && s.to_user_id === userId1))
    );

    if (relevantSettlements.length === 0) return null;

    // Get the most recent settlement timestamp
    const mostRecent = relevantSettlements.sort((a, b) => {
      const dateA = new Date(a.settled_up_to_timestamp || a.completed_at);
      const dateB = new Date(b.settled_up_to_timestamp || b.completed_at);
      return dateB - dateA;
    })[0];

    return mostRecent.settled_up_to_timestamp || mostRecent.completed_at;
  };

  // Calculate balances using ALL expenses (not just date-filtered)
  // This matches the Balances page calculation
  const calculateBalances = () => {
    const balances = {};

    expenses.forEach(expense => {
      const splitBetween = expense.splitBetween || [];
      const paidBy = expense.paidBy;
      const splitAmount = expense.amount / splitBetween.length;
      const expenseDate = new Date(expense.date);

      // If someone else paid and you're in the split
      if (paidBy !== currentUserId && splitBetween.includes(currentUserId)) {
        const lastSettled = getLastSettledTimestamp(currentUserId, paidBy);

        if (!lastSettled || expenseDate > new Date(lastSettled)) {
          if (!balances[paidBy]) {
            balances[paidBy] = { amount: 0 };
          }
          balances[paidBy].amount += splitAmount;
        }
      }

      // If you paid and others are in the split
      if (paidBy === currentUserId) {
        splitBetween.forEach(personId => {
          if (personId !== currentUserId) {
            const lastSettled = getLastSettledTimestamp(currentUserId, personId);

            if (!lastSettled || expenseDate > new Date(lastSettled)) {
              if (!balances[personId]) {
                balances[personId] = { amount: 0 };
              }
              balances[personId].amount -= splitAmount;
            }
          }
        });
      }
    });

    return Object.values(balances).filter(b => Math.abs(b.amount) > 0.01);
  };

  const balances = calculateBalances();

  // You Owe = Sum of positive balances (debts)
  const youOwe = balances.filter(b => b.amount > 0).reduce((sum, b) => sum + b.amount, 0);

  // Calculate top categories from date-filtered expenses
  const categoryTotals = dateFilteredExpenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  const topCategories = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));

  const maxCategoryAmount = topCategories.length > 0 ? Math.max(...topCategories.map(c => c.amount)) : 0;

  // Calculate who paid what from date-filtered expenses
  const paidByTotals = dateFilteredExpenses.reduce((acc, expense) => {
    const name = getRoommateName(expense.paidBy);
    acc[name] = (acc[name] || 0) + expense.amount;
    return acc;
  }, {});

  const paidByData = Object.entries(paidByTotals).map(([name, amount]) => ({ name, amount }));
  const maxPaidAmount = paidByData.length > 0 ? Math.max(...paidByData.map(p => p.amount)) : 0;

  // Calculate spending over time from date-filtered expenses
  const spendingByDate = dateFilteredExpenses.reduce((acc, expense) => {
    const date = expense.date;
    acc[date] = (acc[date] || 0) + expense.amount;
    return acc;
  }, {});

  const spendingOverTimeData = Object.entries(spendingByDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const maxSpendingAmount = spendingOverTimeData.length > 0 ? Math.max(...spendingOverTimeData.map(d => d.amount)) : 0;

  // Get display title based on selected date range
  const getDisplayTitle = () => {
    if (selectedDateRange === 'This Week') {
      return 'This Week';
    } else if (selectedDateRange === 'This Month') {
      return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    } else {
      // For specific months like September, August, etc.
      const now = new Date();
      const selectedMonthIndex = dateRanges.indexOf(selectedDateRange);
      const monthsBack = selectedMonthIndex - 1; // -1 because first two items are "This Week" and "This Month", and we want 1-indexed months back
      const targetDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
      return targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  // Filter expenses based on search term, category, and date
  const filteredExpenses = expenses
    .filter(expense => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        expense.description.toLowerCase().includes(searchLower) ||
        expense.category.toLowerCase().includes(searchLower) ||
        expense.amount.toString().includes(searchLower) ||
        getRoommateName(expense.paidBy).toLowerCase().includes(searchLower)
      );

      // Category filter
      const matchesCategory = selectedCategory === 'All' || expense.category === selectedCategory;

      // Date filter
      const matchesDate = filterByDateRange(expense);

      return matchesSearch && matchesCategory && matchesDate;
    })
    .sort((a, b) => {
      // Sort by date first (most recent first)
      const dateComparison = new Date(b.date) - new Date(a.date);

      // If dates are the same, sort by created_at (most recent first)
      if (dateComparison === 0 && a.createdAt && b.createdAt) {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }

      return dateComparison;
    });

  // Loading state
  // Wait for both initial data and currency data before rendering
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
          {/* Light mode bubbles */}
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
      ) : (
        <>
          {/* Dark mode bubbles */}
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
          <div
            className="absolute pointer-events-none"
            style={{
              top: '25%',
              left: '0%',
              width: '400px',
              height: '600px',
              background: 'radial-gradient(circle, rgba(255, 94, 0, 0.18) 0%, rgba(255, 94, 0, 0.1) 50%, transparent 100%)',
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
      <main className="ml-20 lg:ml-64 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">

        {/* Header with Add Expense Button */}
        <div className="mb-6 sm:mb-8 flex justify-between items-center">
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif"
            style={{ color: isDarkMode ? '#FF5E00' : '#1f2937' }}
          >
            Expenses
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-semibold text-white transition-all hover:opacity-90 shadow-lg text-sm sm:text-base"
            style={{ backgroundColor: '#FF5E00' }}
          >
            <span className="hidden sm:inline">+ Add Expense</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 lg:grid-cols-3 gap-3 lg:gap-6 mb-6 sm:mb-8">
          {/* Total Spent */}
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
              Total Spent
            </p>
            <p className={`text-xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {getCurrencySymbol(userCurrency)}{Number.isInteger(totalSpent) ? totalSpent : totalSpent.toFixed(2).replace(/\.00$/, '')}
            </p>
          </div>

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
              {getCurrencySymbol(userCurrency)}{Number.isInteger(youOwe) ? youOwe : youOwe.toFixed(2).replace(/\.00$/, '')}
            </p>
          </div>

          {/* Number of Expenses */}
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
              Total Expenses
            </p>
            <p className={`text-xl lg:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {dateFilteredExpenses.length}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div
          className="rounded-3xl shadow-xl p-4 sm:p-6 mb-6 sm:mb-8"
          style={{
            background: isDarkMode
              ? 'rgba(0, 0, 0, 0.3)'
              : 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
            position: 'relative',
            zIndex: 20
          }}
        >
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search expenses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 rounded-xl font-medium transition-all outline-none"
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'white' : '#1f2937',
                  height: '40px'
                }}
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-3 w-full sm:w-auto">
              {/* Category Filter */}
              <div className="relative flex-1 sm:flex-initial" style={{ minWidth: '0', maxWidth: '100%' }}>
                <button
                  type="button"
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  className="px-4 rounded-xl font-semibold transition-all outline-none w-full"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? 'white' : '#1f2937',
                    height: '40px',
                    backdropFilter: 'blur(16px)'
                  }}
                >
                  {selectedCategory === 'All' ? 'Categories' : selectedCategory}
                </button>

                {/* Category Wheel Picker Overlay */}
                {showCategoryPicker && (
                  <>
                    <div
                      className="fixed inset-0"
                      style={{ zIndex: 1000 }}
                      onClick={() => setShowCategoryPicker(false)}
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

                        {/* Categories list */}
                        <div
                          ref={categoryScrollRef}
                          className="h-full overflow-y-auto scrollbar-hide"
                          style={{
                            paddingTop: '0px',
                            paddingBottom: '80px'
                          }}
                        >
                          {categories.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setSelectedCategory(cat);
                                setShowCategoryPicker(false);
                              }}
                              className="w-full flex items-center justify-center category-filter-item"
                              style={{
                                height: '40px',
                                background: 'transparent',
                                color: '#6b7280',
                                fontSize: '15px',
                                fontWeight: '400',
                                transition: 'color 0.15s ease, font-size 0.15s ease, font-weight 0.15s ease'
                              }}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Date Filter */}
              <div className="relative flex-1 sm:flex-initial" style={{ minWidth: '0', maxWidth: '100%' }}>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="px-4 rounded-xl font-semibold transition-all outline-none w-full"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? 'white' : '#1f2937',
                    height: '40px',
                    backdropFilter: 'blur(16px)'
                  }}
                >
                  {selectedDateRange}
                </button>

                {/* Date Wheel Picker Overlay */}
                {showDatePicker && (
                  <>
                    <div
                      className="fixed inset-0"
                      style={{ zIndex: 1000 }}
                      onClick={() => setShowDatePicker(false)}
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

                        {/* Date ranges list */}
                        <div
                          ref={dateScrollRef}
                          className="h-full overflow-y-auto scrollbar-hide"
                          style={{
                            paddingTop: '0px',
                            paddingBottom: '80px'
                          }}
                        >
                          {dateRanges.map((range) => (
                            <button
                              key={range}
                              type="button"
                              onClick={() => {
                                setSelectedDateRange(range);
                                setShowDatePicker(false);
                              }}
                              className="w-full flex items-center justify-center date-filter-item"
                              style={{
                                height: '40px',
                                background: 'transparent',
                                color: '#6b7280',
                                fontSize: '15px',
                                fontWeight: '400',
                                transition: 'color 0.15s ease, font-size 0.15s ease, font-weight 0.15s ease'
                              }}
                            >
                              {range}
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
        </div>

        {/* Expense List */}
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
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h3 className={`text-lg sm:text-xl font-bold font-serif ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {getDisplayTitle()}
            </h3>
            {(selectedCategory !== 'All' || selectedDateRange !== 'This Month') && filteredExpenses.length > 0 && (
              <div className="text-right">
                <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Total:{' '}
                </span>
                <span className="text-lg font-bold" style={{ color: '#FF5E00' }}>
                  {getCurrencySymbol(userCurrency)}
                  {Number.isInteger(filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0))
                    ? filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
                    : filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0).toFixed(2).replace(/\.00$/, '')}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2 sm:space-y-3 overflow-y-auto" style={{ maxHeight: '600px' }}>
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-12">
                <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No expenses found
                </p>
              </div>
            ) : (
              filteredExpenses.map((expense) => (
              <div
                key={expense.id}
                onClick={() => {
                  // Only allow editing if current user paid for the expense
                  if (expense.paidBy === user?.id) {
                    handleEditExpense(expense);
                  }
                }}
                className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-2xl transition-all ${
                  expense.paidBy === user?.id ? 'cursor-pointer' : ''
                }`}
                style={{
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.03)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                {/* Top section - Details and Amount */}
                <div className="flex items-start justify-between mb-2 sm:mb-0 flex-1">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <p className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {expense.description}
                      </p>
                      <span
                        className="inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                        style={{
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.08)',
                          color: isDarkMode ? '#e5e7eb' : '#6b7280'
                        }}
                      >
                        {expense.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {getRoommateName(expense.paidBy)} paid
                      </p>
                      <span className={isDarkMode ? 'text-gray-500' : 'text-gray-400'}>•</span>
                      {expense.splitBetween.length > 2 || expense.splitBetween.length === roommates.length ? (
                        <div
                          className="relative"
                          style={{ display: 'inline-block', lineHeight: '1' }}
                          onMouseEnter={() => setHoveredExpenseId(expense.id)}
                          onMouseLeave={() => setHoveredExpenseId(null)}
                        >
                          <p
                            className={`text-xs font-medium cursor-pointer transition-opacity hover:opacity-70 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}
                          >
                            {getSplitInfo(expense)}
                          </p>

                          {/* Hover Tooltip */}
                          {hoveredExpenseId === expense.id && (
                            <div
                              className="absolute left-0 bottom-full mb-1 z-50 rounded-xl shadow-lg p-2 min-w-max pointer-events-none"
                              style={{
                                background: isDarkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                                backdropFilter: 'blur(12px)',
                                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
                              }}
                            >
                              <div className="flex items-center gap-2">
                                {expense.splitBetween.map((userId) => {
                                  const roommate = roommates.find(r => r.id === userId);
                                  let initials = '';

                                  // Use full_name for everyone (including current user)
                                  const fullName = roommate?.full_name || '';

                                  if (fullName) {
                                    const nameParts = fullName.split(' ');
                                    if (nameParts.length >= 2) {
                                      initials = nameParts[0].charAt(0).toUpperCase() + nameParts[nameParts.length - 1].charAt(0).toUpperCase();
                                    } else {
                                      // If single name, take first 2 characters
                                      initials = fullName.substring(0, Math.min(2, fullName.length)).toUpperCase();
                                    }
                                  } else {
                                    // Fallback
                                    initials = '??';
                                  }

                                  return (
                                    <div
                                      key={userId}
                                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
                                      style={{
                                        background: getAvatarColor(userId)
                                      }}
                                    >
                                      {initials}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {getSplitInfo(expense)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Amount and Date - Mobile right side */}
                  <div className="text-right shrink-0">
                    <p className="text-base font-bold" style={{ color: '#FF5E00' }}>
                      {getCurrencySymbol(userCurrency)}{Number.isInteger(expense.amount) ? expense.amount : expense.amount.toFixed(2).replace(/\.00$/, '')}
                    </p>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {formatDate(expense.date)}
                    </p>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Top Categories Chart */}
          <div
            className="rounded-3xl shadow-xl p-4 sm:p-6"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h3 className={`text-lg sm:text-xl font-bold font-serif ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Top Categories
              </h3>
              <div
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold"
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: isDarkMode ? 'white' : '#1f2937'
                }}
              >
                {selectedDateRange === 'This Month' ? new Date().toLocaleDateString('en-US', { month: 'long' }) : selectedDateRange}
              </div>
            </div>
            <div className="space-y-4">
              {topCategories.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No category data for this period
                  </p>
                </div>
              ) : (
                topCategories.map((item, index) => {
                  const widthPercent = maxCategoryAmount > 0 ? (item.amount / maxCategoryAmount) * 100 : 0;
                  return (
                    <div key={index}>
                      <div className="flex justify-between items-center mb-2">
                        <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {item.category}
                        </span>
                        <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {getCurrencySymbol(userCurrency)}{item.amount.toFixed(2)}
                        </span>
                      </div>
                      <div
                        className="h-8 rounded-lg relative overflow-hidden"
                        style={{
                          background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                        }}
                      >
                        <div
                          className="h-full rounded-lg transition-all duration-500"
                          style={{
                            width: `${widthPercent}%`,
                            background: `linear-gradient(90deg, #FF5E00 0%, #FF8534 100%)`
                          }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Spending Over Time Chart */}
          <div
            className="rounded-3xl shadow-xl px-4 sm:px-6 pt-4 sm:pt-6 pb-3"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className={`text-lg sm:text-xl font-bold font-serif ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Spending Over Time
              </h3>
              <div
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold"
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  color: isDarkMode ? 'white' : '#1f2937'
                }}
              >
                {selectedDateRange === 'This Month' ? new Date().toLocaleDateString('en-US', { month: 'long' }) : selectedDateRange}
              </div>
            </div>
            <div className="relative">
              {spendingOverTimeData.length === 0 ? (
                <div className="flex items-center justify-center h-64">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    No spending data for this period
                  </p>
                </div>
              ) : spendingOverTimeData.length < 5 ? (
                <div className="flex items-center justify-center h-64">
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Chart will appear after more expenses are added
                  </p>
                </div>
              ) : (
                <>
                  <div className="h-64 flex">
                    {/* Y-axis labels */}
                    <div className="flex flex-col justify-between pr-2" style={{ width: '60px' }}>
                      {[...Array(5)].map((_, i) => {
                        const value = maxSpendingAmount * (1 - i / 4);
                        return (
                          <span
                            key={i}
                            className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                            style={{ lineHeight: '1' }}
                          >
                            {getCurrencySymbol(userCurrency)}{Math.round(value)}
                          </span>
                        );
                      })}
                    </div>

                    {/* Chart */}
                    <div className="flex-1">
                      <svg width="100%" height="100%" viewBox="0 0 800 256" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#FF5E00" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#FF5E00" stopOpacity="0.05" />
                          </linearGradient>
                        </defs>

                        {/* Create path for line and area */}
                        {(() => {
                          const padding = 20;
                          const chartWidth = 800 - (padding * 2);
                          const chartHeight = 256 - (padding * 2);
                          const stepX = chartWidth / (spendingOverTimeData.length - 1 || 1);

                        // Create points for the line
                        const points = spendingOverTimeData.map((data, index) => {
                          const x = padding + (index * stepX);
                          const y = padding + chartHeight - ((data.amount / maxSpendingAmount) * chartHeight);
                          return { x, y, amount: data.amount };
                        });

                        // Create path string for line
                        const linePath = points.map((point, index) =>
                          `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                        ).join(' ');

                        // Create path string for filled area
                        const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`;

                        return (
                          <>
                            {/* Filled area under the line */}
                            <path
                              d={areaPath}
                              fill="url(#areaGradient)"
                            />

                            {/* Line */}
                            <path
                              d={linePath}
                              fill="none"
                              stroke="#FF5E00"
                              strokeWidth="3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Points */}
                            {points.map((point, index) => (
                              <circle
                                key={index}
                                cx={point.x}
                                cy={point.y}
                                r="5"
                                fill="#FF5E00"
                                stroke="white"
                                strokeWidth="2"
                              />
                            ))}
                          </>
                        );
                      })()}
                      </svg>
                    </div>
                  </div>

                  {/* X-axis labels inside card */}
                  <div className="flex justify-between pb-2" style={{ marginLeft: '60px' }}>
                    {spendingOverTimeData.map((data, index) => (
                      <span
                        key={index}
                        className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        {new Date(data.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Who Paid What Chart */}
        <div
          className="rounded-3xl shadow-xl p-4 sm:p-6"
          style={{
            background: isDarkMode
              ? 'rgba(0, 0, 0, 0.3)'
              : 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <div className="flex justify-between items-center mb-4 sm:mb-6">
            <h3 className={`text-lg sm:text-xl font-bold font-serif ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Who Paid What
            </h3>
            <div
              className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold"
              style={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: isDarkMode ? 'white' : '#1f2937'
              }}
            >
              {selectedDateRange === 'This Month' ? new Date().toLocaleDateString('en-US', { month: 'long' }) : selectedDateRange}
            </div>
          </div>
          <div className="space-y-4">
            {paidByData.length === 0 ? (
              <div className="text-center py-8">
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  No payment data for this period
                </p>
              </div>
            ) : (
              paidByData.map((person, index) => {
                const widthPercent = maxPaidAmount > 0 ? (person.amount / maxPaidAmount) * 100 : 0;
                return (
                  <div key={index}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {person.name}
                      </span>
                      <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {getCurrencySymbol(userCurrency)}{person.amount.toFixed(2)}
                      </span>
                    </div>
                    <div
                      className="h-8 rounded-lg relative overflow-hidden"
                      style={{
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                      }}
                    >
                      <div
                        className="h-full rounded-lg transition-all duration-500"
                        style={{
                          width: `${widthPercent}%`,
                          background: `linear-gradient(90deg, #FF5E00 0%, #FF8534 100%)`
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        roommates={roommates}
        isDarkMode={isDarkMode}
        onExpenseAdded={fetchExpenses}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setExpenseToEdit(null);
        }}
        expense={expenseToEdit}
        roommates={roommates}
        isDarkMode={isDarkMode}
        onExpenseUpdated={fetchExpenses}
      />
    </div>
  );
};

export default Expenses;
