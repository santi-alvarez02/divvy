import React, { useState } from 'react';

const Sidebar = () => {
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
    <div className="w-64 h-screen fixed left-0 top-0 shadow-2xl flex flex-col glass-card-dark">
      {/* Logo/App Name */}
      <div className="p-6">
        <h1 className="text-3xl font-bold" style={{ color: '#cd5b12' }}>
          Divvy
        </h1>
        <p className="text-sm mt-1 text-gray-300">
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
                    ? 'bg-white bg-opacity-20 shadow-lg'
                    : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <span
                  className={`font-semibold text-base ${
                    activeItem === item.id
                      ? 'text-white'
                      : 'text-gray-200'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            </li>
          ))}
        </ul>

      </nav>

      {/* User Profile Section */}
      <div className="p-6 mt-auto">
        <div className="flex items-center space-x-3 px-2 py-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br from-purple-400 to-pink-400 shadow-lg">
            Y
          </div>
          <div>
            <p className="text-base font-semibold text-white">
              You
            </p>
            <p className="text-sm text-gray-300">
              View profile
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
