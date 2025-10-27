import React, { useState } from 'react';

const Sidebar = ({ isDarkMode, setIsDarkMode }) => {
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
      className="w-64 h-screen fixed left-0 top-0 shadow-2xl flex flex-col"
      style={{
        background: isDarkMode
          ? 'rgba(0, 0, 0, 0.3)'
          : 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(12px)',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
        borderRight: !isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'
      }}
    >
      {/* Logo/App Name */}
      <div className="p-6">
        <h1 className="text-3xl font-bold font-serif" style={{ color: '#FF5E00' }}>
          Divvy
        </h1>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveItem(item.id)}
                className={`w-full flex items-center px-5 py-3.5 transition-all relative group ${
                  isDarkMode
                    ? 'hover:bg-white hover:bg-opacity-10'
                    : 'hover:bg-gray-50'
                }`}
                style={{
                  borderRadius: '12px'
                }}
              >
                <span
                  className={`font-semibold text-base transition-colors ${
                    activeItem === item.id
                      ? isDarkMode ? 'text-white' : 'text-gray-900'
                      : isDarkMode ? 'text-gray-200' : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </span>
                {/* Underline animation */}
                <div
                  className="absolute bottom-2 left-5 right-5 h-0.5 transition-all duration-300"
                  style={{
                    backgroundColor: '#FF5E00',
                    transform: activeItem === item.id ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left'
                  }}
                />
              </button>
            </li>
          ))}
        </ul>

        {/* Dark Mode Toggle */}
        <div className="mt-6 px-5 py-3 flex items-center space-x-3">
          {/* Sun/Moon Icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isDarkMode ? (
              // Moon icon
              <path
                d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                fill={isDarkMode ? '#9ca3af' : '#4b5563'}
              />
            ) : (
              // Sun icon
              <>
                <circle cx="12" cy="12" r="4" fill="#4b5563" />
                <path
                  d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                  stroke="#4b5563"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </>
            )}
          </svg>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              isDarkMode ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                isDarkMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-6 mt-auto">
        <div className="flex items-center space-x-3 px-2 py-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg bg-gradient-to-br from-purple-400 to-pink-400 shadow-lg" style={{ color: 'white' }}>
            Y
          </div>
          <div>
            <p className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              You
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              View profile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
