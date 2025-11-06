import React from 'react';
import { getAvatarColor } from '../utils/avatarColors';

const BalanceSummary = ({ balances, isDarkMode, onClick }) => {
  return (
    <div
      onClick={onClick}
      className="rounded-3xl shadow-xl p-6 cursor-pointer transition-all hover:scale-[1.02]"
      style={{
        background: isDarkMode
          ? 'rgba(0, 0, 0, 0.3)'
          : 'rgba(255, 255, 255, 0.4)',
        backdropFilter: 'blur(12px)',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
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
        <div className="space-y-3">
          {balances.map((balance, index) => {
            const isOwedToYou = balance.type === 'owes_you';

            return (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-2xl"
              >
                <div className="flex items-center space-x-4">
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
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {isOwedToYou ? 'You paid for shared expenses' : 'They paid for shared expenses'}
                    </p>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p
                    className="text-lg font-bold"
                    style={{
                      color: isOwedToYou
                        ? isDarkMode ? '#86efac' : '#16a34a'
                        : isDarkMode ? '#fca5a5' : '#dc2626'
                    }}
                  >
                    {isOwedToYou ? '+' : '-'}${balance.amount.toFixed(2)}
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
