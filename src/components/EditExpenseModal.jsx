import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const EditExpenseModal = ({ isOpen, onClose, expense, roommates, isDarkMode, onExpenseUpdated }) => {
  const { user } = useAuth();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('Select a category');
  const [isPersonal, setIsPersonal] = useState(false);
  const [splitWith, setSplitWith] = useState({});
  const [isLoan, setIsLoan] = useState(false);
  const [loanPerson, setLoanPerson] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const categoryScrollRef = useRef(null);

  const categories = [
    'Select a category',
    'Groceries',
    'Rent',
    'Utilities',
    'Entertainment',
    'Transportation',
    'Dining Out',
    'Shopping',
    'Healthcare',
    'Travel',
    'Other'
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

  // Initialize form with expense data
  useEffect(() => {
    if (expense && isOpen) {
      setDescription(expense.description || '');
      setAmount(expense.originalAmount?.toString() || expense.amount?.toString() || '');
      setCategory(expense.category || 'Select a category');
      setCurrency(expense.currency || expense.displayCurrency || 'USD');

      // Check if it's a loan
      const isLoanExpense = expense.isLoan === true;
      setIsLoan(isLoanExpense);

      // Determine if personal or split
      const isPersonalExpense = expense.splitBetween?.length === 1;
      setIsPersonal(isPersonalExpense);

      if (isLoanExpense) {
        // Find the person who owes (non-zero share)
        const borrower = expense.splits?.find(s => s.share_amount > 0)?.user_id;
        setLoanPerson(borrower || '');
        setSplitWith({});
      } else if (!isPersonalExpense && expense.splitBetween) {
        // Set split with state for non-personal expenses
        const splitState = {};
        expense.splitBetween.forEach(userId => {
          if (userId !== user?.id) {
            splitState[userId] = true;
          }
        });
        setSplitWith(splitState);
        setLoanPerson('');
      } else {
        setSplitWith({});
        setLoanPerson('');
      }
    }
  }, [expense, isOpen, user?.id]);

  useEffect(() => {
    if (showCategoryPicker && categoryScrollRef.current) {
      const selectedIndex = categories.indexOf(category);
      const itemHeight = 40;
      const scrollTop = selectedIndex * itemHeight;
      const scrollContainer = categoryScrollRef.current;

      scrollContainer.scrollTop = scrollTop;

      const handleScroll = () => {
        const currentScrollTop = scrollContainer.scrollTop;
        const highlightedIndex = Math.round(currentScrollTop / itemHeight);

        const buttons = scrollContainer.querySelectorAll('.category-item');
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
  }, [showCategoryPicker, category, categories, isDarkMode]);

  const handleSplitWithToggle = (roommateId) => {
    setSplitWith(prev => ({
      ...prev,
      [roommateId]: !prev[roommateId]
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    // Validation
    if (!description.trim()) {
      setError('Please complete the form to update the expense');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please complete the form to update the expense');
      return;
    }

    if (!isLoan && (!category || category === 'Select a category')) {
      setError('Please complete the form to update the expense');
      return;
    }

    // Validation: For loan expenses, a person must be selected
    if (isLoan && !loanPerson) {
      setError('Please select who owes you this money');
      return;
    }

    if (!isPersonal && !isLoan && Object.keys(splitWith).filter(key => splitWith[key]).length === 0) {
      setError('Please complete the form to update the expense');
      return;
    }

    setLoading(true);

    try {
      // Determine who is splitting the expense
      let splitBetweenIds;
      let isLoanExpense = false;

      if (isPersonal) {
        splitBetweenIds = [user.id]; // Personal expense - only current user
      } else if (isLoan) {
        splitBetweenIds = [user.id, loanPerson]; // Loan - both people in split
        isLoanExpense = true;
      } else {
        splitBetweenIds = [user.id, ...Object.keys(splitWith).filter(key => splitWith[key])]; // Current user + selected roommates
      }

      const expenseAmount = parseFloat(amount);

      // Update the expense
      const { error: expenseError } = await supabase
        .from('expenses')
        .update({
          amount: expenseAmount,
          category: category,
          description: description
        })
        .eq('id', expense.id);

      if (expenseError) {
        console.error('Error updating expense:', expenseError);
        setError('Failed to update expense. Please try again.');
        setLoading(false);
        return;
      }

      // Delete old splits
      const { error: deleteSplitsError } = await supabase
        .from('expense_splits')
        .delete()
        .eq('expense_id', expense.id);

      if (deleteSplitsError) {
        console.error('Error deleting old splits:', deleteSplitsError);
        setError('Failed to update expense splits. Please try again.');
        setLoading(false);
        return;
      }

      // Verify splits were actually deleted
      const { data: remainingSplits, error: verifyError } = await supabase
        .from('expense_splits')
        .select('id')
        .eq('expense_id', expense.id);

      if (verifyError) {
        console.error('Error verifying split deletion:', verifyError);
        setError('Failed to verify expense splits deletion. Please try again.');
        setLoading(false);
        return;
      }

      if (remainingSplits && remainingSplits.length > 0) {
        console.error('Old splits still exist after deletion:', remainingSplits);
        setError('Failed to delete old expense splits. Please try again.');
        setLoading(false);
        return;
      }

      // Create new splits
      // For loans: payer's share = 0, borrower's share = full amount
      // For normal splits: everyone pays equally
      const splits = splitBetweenIds.map(userId => {
        if (isLoanExpense) {
          // If it's a loan, the person who paid (current user) has 0 share
          // The person who owes (loanPerson) has the full amount as their share
          const shareAmount = userId === user.id ? 0 : expenseAmount;
          return {
            expense_id: expense.id,
            user_id: userId,
            share_amount: shareAmount
          };
        } else {
          // Normal split - everyone pays equally
          const splitAmount = expenseAmount / splitBetweenIds.length;
          return {
            expense_id: expense.id,
            user_id: userId,
            share_amount: splitAmount
          };
        }
      });

      const { error: splitsError } = await supabase
        .from('expense_splits')
        .insert(splits);

      if (splitsError) {
        console.error('Error creating new splits:', splitsError);
        setError('Failed to save expense splits. Please try again.');
        setLoading(false);
        return;
      }

      // Success! Notify parent component to refresh
      if (onExpenseUpdated) {
        onExpenseUpdated();
      }

      handleClose();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setDescription('');
    setAmount('');
    setCurrency('USD');
    setCategory('Select a category');
    setIsPersonal(false);
    setSplitWith({});
    setIsLoan(false);
    setLoanPerson('');
    setError('');
    setShowCategoryPicker(false);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleDelete = async () => {
    setLoading(true);

    try {
      // Delete expense splits first (due to foreign key constraint)
      const { error: splitsError } = await supabase
        .from('expense_splits')
        .delete()
        .eq('expense_id', expense.id);

      if (splitsError) {
        console.error('Error deleting expense splits:', splitsError);
        setError('Failed to delete expense. Please try again.');
        setLoading(false);
        return;
      }

      // Delete the expense
      const { error: expenseError } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expense.id);

      if (expenseError) {
        console.error('Error deleting expense:', expenseError);
        setError('Failed to delete expense. Please try again.');
        setLoading(false);
        return;
      }

      // Success! Notify parent component to refresh
      if (onExpenseUpdated) {
        onExpenseUpdated();
      }

      handleClose();
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !expense) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={handleClose}
    >
      <div
        className="rounded-3xl shadow-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        style={{
          background: isDarkMode
            ? 'rgba(0, 0, 0, 0.4)'
            : 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(16px)',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-3xl font-bold font-serif ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Edit Expense
          </h2>
          <button
            onClick={handleClose}
            className={`text-2xl font-bold hover:opacity-70 transition-opacity ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description Field */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setError('');
              }}
              placeholder="What's this expense for?"
              className="w-full px-4 rounded-xl font-medium transition-all outline-none"
              style={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                color: isDarkMode ? 'white' : '#1f2937',
                height: '40px'
              }}
            />
          </div>

          {/* Amount and Currency */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Amount
            </label>
            <div className="flex space-x-3">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError('');
                }}
                placeholder="0.00"
                className="flex-1 px-4 rounded-xl font-medium transition-all outline-none"
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'white' : '#1f2937',
                  height: '40px'
                }}
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="px-4 rounded-xl font-semibold transition-all outline-none"
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'white' : '#1f2937',
                  height: '40px',
                  backdropFilter: 'blur(16px)'
                }}
              >
                {currencies.map(curr => (
                  <option
                    key={curr}
                    value={curr}
                    style={{
                      background: isDarkMode ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                      color: isDarkMode ? 'white' : '#1f2937',
                      backdropFilter: 'blur(16px)'
                    }}
                  >
                    {curr}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          {!isLoan && (
            <div className="relative">
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Category
              </label>

              <div
                className="w-full rounded-xl overflow-hidden"
                style={{
                  background: showCategoryPicker
                    ? 'transparent'
                    : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)'),
                  backdropFilter: showCategoryPicker ? 'none' : 'blur(16px)',
                  border: showCategoryPicker
                    ? 'none'
                    : (isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'),
                  height: showCategoryPicker ? '120px' : '40px',
                  transition: 'height 0.25s cubic-bezier(0.4, 0, 0.2, 1), background 0.2s ease, border 0.2s ease'
                }}
              >
                {!showCategoryPicker ? (
                  <button
                    type="button"
                    onClick={() => setShowCategoryPicker(true)}
                    className="w-full h-full px-4 font-medium outline-none text-left flex justify-between items-center"
                    style={{
                      color: (category && category !== 'Select a category') ? (isDarkMode ? 'white' : '#1f2937') : (isDarkMode ? '#9ca3af' : '#6b7280')
                    }}
                  >
                    <span>{category || 'Select a category'}</span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                ) : (
                  <>
                    <div
                      className="fixed inset-0"
                      style={{ zIndex: -1 }}
                      onClick={() => setShowCategoryPicker(false)}
                    />

                    <div className="relative h-full overflow-hidden">
                      <div
                        className="absolute left-0 right-0 pointer-events-none rounded-xl"
                        style={{
                          top: '0px',
                          height: '40px',
                          background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
                          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'
                        }}
                      />

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
                              setCategory(cat);
                              setError('');
                              setShowCategoryPicker(false);
                            }}
                            className="w-full flex items-center justify-center category-item"
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
                  </>
                )}
              </div>
            </div>
          )}

          {/* Personal Expense or Split Between */}
          <div>
            <label className={`block text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Expense Type
            </label>

            {/* Personal Expense Checkbox */}
            <div className="mb-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isPersonal}
                    onChange={(e) => {
                      setIsPersonal(e.target.checked);
                      if (e.target.checked) {
                        setSplitWith({});
                        setIsLoan(false);
                        setLoanPerson('');
                      }
                      setError('');
                    }}
                    className="w-5 h-5 rounded cursor-pointer appearance-none"
                    style={{
                      background: isPersonal ? '#FF5E00' : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)'),
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  {isPersonal && (
                    <svg
                      className="absolute top-0 left-0 w-5 h-5 pointer-events-none"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16 6L7.5 14.5L4 11"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Personal Expense
                </span>
              </label>
            </div>

            {/* Loan/IOU Checkbox */}
            <div className="mb-4">
              <label className="flex items-center space-x-3 cursor-pointer">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isLoan}
                    onChange={(e) => {
                      setIsLoan(e.target.checked);
                      if (e.target.checked) {
                        setIsPersonal(false);
                        setSplitWith({});
                      } else {
                        setLoanPerson('');
                      }
                      setError('');
                    }}
                    className="w-5 h-5 rounded cursor-pointer appearance-none"
                    style={{
                      background: isLoan ? '#FF5E00' : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)'),
                      border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  {isLoan && (
                    <svg
                      className="absolute top-0 left-0 w-5 h-5 pointer-events-none"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M16 6L7.5 14.5L4 11"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Someone owes me
                  </span>
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Record money owed to you
                  </span>
                </div>
              </label>
            </div>

            {/* Loan Person Selection */}
            {isLoan && (
              <div
                className="p-4 rounded-xl mb-4"
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'
                }}
              >
                <p className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Who owes you this money?
                </p>
                <div className="space-y-2">
                  {roommates.filter(r => r.id !== user?.id).map(roommate => (
                    <label key={roommate.id} className="flex items-center space-x-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={loanPerson === roommate.id}
                          onChange={() => {
                            setLoanPerson(loanPerson === roommate.id ? '' : roommate.id);
                            setError('');
                          }}
                          className="w-5 h-5 rounded cursor-pointer appearance-none"
                          style={{
                            background: loanPerson === roommate.id ? '#FF5E00' : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)'),
                            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        {loanPerson === roommate.id && (
                          <svg
                            className="absolute top-0 left-0 w-5 h-5 pointer-events-none"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16 6L7.5 14.5L4 11"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {roommate.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Split Between */}
            {!isPersonal && !isLoan && (
              <div
                className="p-4 rounded-xl"
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'
                }}
              >
                <p className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Split Between
                </p>
                <p className={`text-xs mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  You are automatically included in the split
                </p>
                <div className="space-y-2">
                  {roommates.filter(r => r.id !== user?.id).map(roommate => (
                    <label key={roommate.id} className="flex items-center space-x-3 cursor-pointer">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={splitWith[roommate.id] || false}
                          onChange={() => handleSplitWithToggle(roommate.id)}
                          className="w-5 h-5 rounded cursor-pointer appearance-none"
                          style={{
                            background: splitWith[roommate.id] ? '#FF5E00' : (isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)'),
                            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'
                          }}
                        />
                        {splitWith[roommate.id] && (
                          <svg
                            className="absolute top-0 left-0 w-5 h-5 pointer-events-none"
                            viewBox="0 0 20 20"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              d="M16 6L7.5 14.5L4 11"
                              stroke="white"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>
                      <span className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                        {roommate.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="pt-2">
              <p className="text-red-500 text-sm font-semibold text-center">
                {error}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: '#dc2626'
              }}
            >
              {loading ? 'Deleting...' : 'Delete Expense'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #FF5E00 0%, #FF8534 100%)'
              }}
            >
              {loading ? 'Updating...' : 'Update Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditExpenseModal;
