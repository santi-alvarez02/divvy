import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import BudgetOverview from './BudgetOverview';
import RecentExpenses from './RecentExpenses';
import BalanceSummary from './BalanceSummary';
import {
  getExchangeRatesFromDB,
  convertCurrency,
  updateExchangeRates,
  shouldUpdateRates
} from '../utils/exchangeRates';

const Dashboard = ({ isDarkMode, setIsDarkMode }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [loading, setLoading] = useState(true);
  const [budget, setBudget] = useState({ limit: 0, spent: 0, month: '', year: 0 });
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [roommates, setRoommates] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [groupCurrency, setGroupCurrency] = useState('USD');
  const [userCurrency, setUserCurrency] = useState('USD');
  const [exchangeRates, setExchangeRates] = useState({});

  const currentUserId = user?.id;

  // Fetch user's display currency and exchange rates
  useEffect(() => {
    const fetchCurrencyData = async () => {
      if (!user) return;

      try {
        const [userDataResult, ratesResult] = await Promise.all([
          supabase
            .from('users')
            .select('default_currency')
            .eq('id', user.id)
            .single(),
          getExchangeRatesFromDB()
        ]);

        if (!userDataResult.error && userDataResult.data?.default_currency) {
          setUserCurrency(userDataResult.data.default_currency);
        }

        if (ratesResult.rates) {
          setExchangeRates(ratesResult.rates);
        }

        // Background rate update
        shouldUpdateRates().then(needsUpdate => {
          if (needsUpdate) {
            updateExchangeRates().then(() => {
              getExchangeRatesFromDB().then(({ rates }) => {
                if (rates) setExchangeRates(rates);
              });
            });
          }
        });
      } catch (error) {
        console.error('Error fetching currency data:', error);
      }
    };

    fetchCurrencyData();
  }, [user]);

  // Fetch all data - wait for exchange rates to be loaded first
  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        console.log('Dashboard: No user, skipping data fetch');
        setLoading(false);
        return;
      }

      // Wait for exchange rates to be loaded before fetching expenses
      if (!exchangeRates || Object.keys(exchangeRates).length === 0) {
        console.log('Dashboard: Waiting for exchange rates to load');
        return;
      }

      console.log('Dashboard: Starting data fetch for user:', user.id);

      try {
        // Fetch user's budget and currency
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('monthly_budget, default_currency')
          .eq('id', user.id)
          .single();

        if (userError) {
          console.error('Dashboard: Error fetching user data:', userError);
        } else {
          console.log('Dashboard: User data fetched:', userData);
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

          let transformedMembers = [];
          if (membersError) {
            console.error('Error fetching members:', membersError);
          } else {
            transformedMembers = members.map(member => ({
              id: member.users.id,
              name: member.users.id === user.id ? 'You' : member.users.full_name,
              email: member.users.email,
              avatar_url: member.users.avatar_url
            }));
            setRoommates(transformedMembers);
          }

          // Fetch settlements for this group
          const { data: settlementsData, error: settlementsError } = await supabase
            .from('settlements')
            .select('*')
            .eq('group_id', groupMemberships.groups.id)
            .eq('status', 'completed')
            .order('created_at', { ascending: false });

          if (settlementsError) {
            console.error('Error fetching settlements:', settlementsError);
          }

          const settlementHistory = settlementsData || [];

          // Fetch expenses for this group (all expenses for balance calculation)
          const now = new Date();

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
            // Transform expenses to match expected format with currency conversion
            const transformedExpenses = expensesData?.map(expense => {
              const originalAmount = parseFloat(expense.amount);
              const expenseCurrency = expense.currency || 'USD';

              // Convert to user's display currency
              const convertedAmount = Object.keys(exchangeRates).length > 0
                ? convertCurrency(originalAmount, expenseCurrency, userCurrency, exchangeRates)
                : originalAmount;

              return {
                id: expense.id,
                amount: convertedAmount,
                originalAmount: originalAmount,
                currency: expenseCurrency,
                category: expense.category,
                description: expense.description,
                date: expense.date,
                paidBy: expense.paid_by,
                icon: expense.icon,
                createdAt: expense.created_at,
                splitBetween: expense.expense_splits?.map(split => split.user_id) || []
              };
            }) || [];

            // Filter to current month for display in Recent Expenses
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const currentMonthExpenses = transformedExpenses.filter(expense => {
              const expenseDate = new Date(expense.date);
              return expenseDate >= firstDayOfMonth;
            });

            setExpenses(currentMonthExpenses);

            console.log('Dashboard: All expenses fetched:', transformedExpenses);
            console.log('Dashboard: Current month expenses:', currentMonthExpenses);
            console.log('Dashboard: Current user ID:', currentUserId);

            // Calculate budget spent (user's share of current month expenses)
            const totalSpent = currentMonthExpenses
              .filter(expense => expense.splitBetween.includes(currentUserId))
              .reduce((sum, expense) => {
                const userShare = expense.amount / expense.splitBetween.length;
                return sum + userShare;
              }, 0);

            // Set budget data
            const monthName = now.toLocaleDateString('en-US', { month: 'long' });
            setBudget({
              limit: userData?.monthly_budget || 0,
              spent: totalSpent,
              month: monthName,
              year: now.getFullYear()
            });

            // Helper function to get last settled timestamp between two users
            const getLastSettledTimestamp = (userId1, userId2) => {
              const relevantSettlements = settlementHistory.filter(s =>
                ((s.from_user_id === userId1 && s.to_user_id === userId2) ||
                 (s.from_user_id === userId2 && s.to_user_id === userId1))
              );

              if (relevantSettlements.length === 0) return null;

              const mostRecent = relevantSettlements.sort((a, b) => {
                const dateA = new Date(a.settled_up_to_timestamp || a.completed_at);
                const dateB = new Date(b.settled_up_to_timestamp || b.completed_at);
                return dateB - dateA;
              })[0];

              return mostRecent.settled_up_to_timestamp || mostRecent.completed_at;
            };

            // Calculate balances (who owes whom) - only unsettled expenses
            const balanceMap = {};
            transformedExpenses.forEach(expense => {
              const splitBetween = expense.splitBetween || [];
              const paidBy = expense.paidBy;
              const splitAmount = expense.amount / splitBetween.length;
              const expenseDate = new Date(expense.date);

              // If someone else paid and you're in the split - you owe them
              if (paidBy !== currentUserId && splitBetween.includes(currentUserId)) {
                const lastSettled = getLastSettledTimestamp(currentUserId, paidBy);

                // Only include expense if it's after the last settlement or no settlement exists
                if (!lastSettled || expenseDate > new Date(lastSettled)) {
                  if (!balanceMap[paidBy]) {
                    balanceMap[paidBy] = { amount: 0, userId: paidBy };
                  }
                  balanceMap[paidBy].amount += splitAmount;
                }
              }

              // If you paid and others are in the split - they owe you
              if (paidBy === currentUserId) {
                splitBetween.forEach(personId => {
                  if (personId !== currentUserId) {
                    const lastSettled = getLastSettledTimestamp(currentUserId, personId);

                    // Only include expense if it's after the last settlement or no settlement exists
                    if (!lastSettled || expenseDate > new Date(lastSettled)) {
                      if (!balanceMap[personId]) {
                        balanceMap[personId] = { amount: 0, userId: personId };
                      }
                      balanceMap[personId].amount -= splitAmount;
                    }
                  }
                });
              }
            });

            // Transform to format expected by BalanceSummary component
            console.log('Dashboard: Balance map before filtering:', balanceMap);

            const balanceArray = Object.entries(balanceMap)
              .filter(([, data]) => Math.abs(data.amount) > 0.01)
              .map(([userId, data]) => {
                const roommateInfo = transformedMembers.find(r => r.id === userId);
                return {
                  person: roommateInfo?.name || 'Unknown',
                  userId: userId,
                  amount: Math.abs(data.amount),
                  type: data.amount > 0 ? 'you_owe' : 'owes_you',
                  avatar_url: roommateInfo?.avatar_url
                };
              });

            console.log('Dashboard: Final balance array:', balanceArray);
            setBalances(balanceArray);
          }
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, currentUserId, exchangeRates, userCurrency]);

  const handleAddExpense = () => {
    navigate('/expenses');
  };

  // Loading state
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
      ) : (
        <>
          {/* Dark mode bubbles */}
          {/* Main bubble - top right */}
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
          {/* Bottom left bubble */}
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
          {/* Sidebar area bubble - for glassy effect on sidebar */}
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
      <main
        className="ml-20 lg:ml-64 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10"
        style={{
          borderTop: '2px solid rgba(255, 94, 0, 0.3)',
          boxShadow: '0 -2px 10px rgba(255, 94, 0, 0.1)'
        }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-5xl font-bold font-serif"
            style={{ color: isDarkMode ? '#FF5E00' : '#1f2937' }}
          >
            Overview
          </h1>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Budget Card - Left (narrower - 2 columns) */}
          <div className="md:col-span-2">
            <BudgetOverview budget={budget} currency={userCurrency} isDarkMode={isDarkMode} onClick={() => navigate('/budgets')} />
          </div>

          {/* Who Owes What - Right (wider - 3 columns) */}
          <div className="md:col-span-3">
            <BalanceSummary balances={balances} currency={userCurrency} isDarkMode={isDarkMode} onClick={() => navigate('/balances')} />
          </div>

          {/* Recent Expenses - Full width below */}
          <div className="md:col-span-5">
            <RecentExpenses expenses={expenses} roommates={roommates} currency={userCurrency} isDarkMode={isDarkMode} onClick={() => navigate('/expenses')} onAddExpense={handleAddExpense} />
          </div>
        </div>
      </main>

    </div>
  );
};

export default Dashboard;
