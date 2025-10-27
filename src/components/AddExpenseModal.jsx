import React, { useState } from 'react';

const AddExpenseModal = ({ isOpen, onClose, roommates, isDarkMode }) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('');
  const [isPersonal, setIsPersonal] = useState(false);
  const [splitWith, setSplitWith] = useState({});
  const [error, setError] = useState('');

  const categories = [
    'Groceries',
    'Rent',
    'Utilities',
    'Entertainment',
    'Transportation',
    'Dining Out',
    'Shopping',
    'Healthcare',
    'Other'
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

  const handleSplitWithToggle = (roommateId) => {
    setSplitWith(prev => ({
      ...prev,
      [roommateId]: !prev[roommateId]
    }));
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Clear previous errors
    setError('');

    // Validation: Check all required fields
    if (!description.trim()) {
      setError('Please complete the form to add an expense');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please complete the form to add an expense');
      return;
    }

    if (!category) {
      setError('Please complete the form to add an expense');
      return;
    }

    // Validation: For split expenses, at least one roommate must be selected
    if (!isPersonal && Object.keys(splitWith).filter(key => splitWith[key]).length === 0) {
      setError('Please complete the form to add an expense');
      return;
    }

    // Placeholder for actual submit logic
    // The current user (id: 1) is assumed to have paid for this expense
    // For split expenses, current user is automatically included in the split
    const splitBetweenIds = isPersonal
      ? [1] // Personal expense - only current user
      : [1, ...Object.keys(splitWith).filter(key => splitWith[key]).map(Number)]; // Current user + selected roommates

    console.log({
      description,
      amount: parseFloat(amount),
      currency,
      category,
      paidBy: 1, // Current user ID
      splitBetween: splitBetweenIds,
      isPersonal
    });

    onClose();
  };

  const handleReset = () => {
    setDescription('');
    setAmount('');
    setCurrency('USD');
    setCategory('');
    setIsPersonal(false);
    setSplitWith({});
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={onClose}
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
            Add Expense
          </h2>
          <button
            onClick={onClose}
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
              className="w-full px-4 py-3 rounded-xl font-medium transition-all outline-none"
              style={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                color: isDarkMode ? 'white' : '#1f2937'
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
                className="flex-1 px-4 py-3 rounded-xl font-medium transition-all outline-none"
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'white' : '#1f2937'
                }}
              />
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="px-4 py-3 rounded-xl font-semibold transition-all outline-none"
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'white' : '#1f2937'
                }}
              >
                {currencies.map(curr => (
                  <option key={curr} value={curr}>{curr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Category
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 rounded-xl font-medium transition-all outline-none"
              style={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                color: isDarkMode ? 'white' : '#1f2937'
              }}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

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

            {/* Split Between */}
            {!isPersonal && (
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
                  {roommates.filter(r => r.id !== 1).map(roommate => (
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
              onClick={() => {
                handleReset();
                onClose();
              }}
              className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all"
              style={{
                background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                color: isDarkMode ? 'white' : '#374151'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: 'linear-gradient(135deg, #FF5E00 0%, #FF8534 100%)'
              }}
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExpenseModal;
