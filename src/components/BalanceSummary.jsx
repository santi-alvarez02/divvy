import React from 'react';
import { getAvatarColor } from '../utils/avatarColors';
import { getCurrencySymbol } from '../utils/currency';

const BalanceSummary = ({ balances, currency = 'USD', isDarkMode, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="rounded-3xl shadow-xl p-6 cursor-pointer transition-all hover:scale-[1.02] h-full"
      style={{
        background: isDarkMode
          ? 'rgba(0, 0, 0, 0.3)'
          : 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(12px)',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
        minHeight: '450px'
      }}
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold font-serif ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Who Owes What
        </h2>
        <button
          className="text-sm font-semibold hover:opacity-80 transition-opacity px-4 py-2 rounded-full"
          style={{
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.05)',
            color: isDarkMode ? 'white' : '#374151'
          }}
        >
          Settle Up
        </button>
      </div>

      {balances.length === 0 ? (
        <div className="text-center py-8">
          <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>All settled up!</p>
          <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            No outstanding balances
          </p>
        </div>
      ) : (
        <div
          className="space-y-2"
          style={{
            maxHeight: balances.length > 5 ? '350px' : 'none',
            overflowY: balances.length > 5 ? 'auto' : 'visible'
          }}
        >
          {balances.map((balance, index) => {
            const isOwedToYou = balance.type === 'owes_you';

            return (
              <div
                key={index}
                className="flex items-center justify-between py-3 px-2"
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar/Initial */}
                  {balance.avatar_url ? (
                    <img
                      src={balance.avatar_url}
                      alt={balance.person}
                      className="w-12 h-12 rounded-2xl object-cover shadow-lg"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg"
                      style={{
                        background: balance.userId ? getAvatarColor(balance.userId) : 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)'
                      }}
                    >
                      {balance.person.charAt(0)}
                    </div>
                  )}

                  {/* Text */}
                  <div>
                    <p className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {isOwedToYou ? (
                        <>
                          <span className="font-bold">{balance.person}</span> owes you
                        </>
                      ) : (
                        <>
                          You owe <span className="font-bold">{balance.person}</span>
                        </>
                      )}
                    </p>
                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {isOwedToYou ? 'You paid for shared expenses' : 'They paid for shared expenses'}
                    </p>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right ml-2">
                  <p
                    className="text-lg font-bold"
                    style={{
                      color: isOwedToYou ? '#10b981' : '#FF5E00'
                    }}
                  >
                    {isOwedToYou ? '+' : '-'}{getCurrencySymbol(currency)}{balance.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BalanceSummary;
