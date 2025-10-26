import React, { useState } from 'react';

const Sidebar = ({ isDarkMode, onToggleDarkMode }) => {
  const [activeItem, setActiveItem] = useState('overview');

  const menuItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'budgets', label: 'Budgets' },
    { id: 'balances', label: 'Balances' },
    { id: 'groups', label: 'Groups' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <div
      className={`w-64 h-screen fixed left-0 top-0 shadow-2xl flex flex-col transition-all duration-300 ${
        isDarkMode ? 'glass-card-dark' : 'glass-card'
      }`}
    >
      {/* Logo/App Name */}
      <div className="p-6">
        <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-white'}`}>
          Divvy
        </h1>
        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-300' : 'text-white opacity-80'}`}>
          Expense Tracker
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveItem(item.id)}
                className={`w-full flex items-center px-5 py-3.5 rounded-2xl transition-all ${
                  activeItem === item.id
                    ? (isDarkMode ? 'bg-white bg-opacity-20 shadow-lg' : 'bg-black bg-opacity-20 shadow-lg')
                    : (isDarkMode ? 'hover:bg-white hover:bg-opacity-10' : 'hover:bg-white hover:bg-opacity-20')
                }`}
              >
                <span
                  className={`font-semibold text-base ${
                    activeItem === item.id
                      ? 'text-white'
                      : (isDarkMode ? 'text-gray-200' : 'text-white opacity-70')
                  }`}
                >
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {/* Dark Mode Toggle */}
        <div className="mt-6 px-4">
          <div className="flex items-center space-x-3">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={isDarkMode ? 'text-white' : 'text-white opacity-80'}
            >
              <path
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <button
              onClick={onToggleDarkMode}
              className="relative inline-flex h-7 w-14 items-center rounded-full transition-all shadow-lg"
              style={{
                backgroundColor: isDarkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.3)'
              }}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full transition-transform shadow-md ${
                  isDarkMode ? 'translate-x-8 bg-black' : 'translate-x-1 bg-white'
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-6 mt-auto">
        <div className="flex items-center space-x-3 px-2 py-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-purple-400 to-pink-400 shadow-lg">
            Y
          </div>
          <div>
            <p className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-white'}`}>
              You
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-white opacity-70'}`}>
              View profile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
