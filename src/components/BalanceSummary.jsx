import React from 'react';

const BalanceSummary = ({ balances }) => {
  return (
    <div className="rounded-3xl shadow-xl p-6 glass-card-dark">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">
          Who Owes What
        </h2>
        <button className="text-sm font-semibold hover:opacity-80 transition-opacity px-4 py-2 rounded-full bg-white bg-opacity-20 text-white">
          Settle Up
        </button>
      </div>

      {balances.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">✨</div>
          <p className="font-bold text-white">All settled up!</p>
          <p className="text-sm mt-2 text-gray-300">
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
                className="flex items-center justify-between p-4 rounded-2xl transition-all hover:bg-white hover:bg-opacity-10"
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar/Initial */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg ${
                    isOwedToYou ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-gradient-to-br from-orange-400 to-red-500'
                  }`}>
                    {balance.person.charAt(0)}
                  </div>

                  {/* Text */}
                  <div>
                    <p className="text-sm font-bold text-white">
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
                    <p className="text-xs font-medium text-gray-300">
                      {isOwedToYou ? 'They paid for shared expenses' : 'For shared expenses'}
                    </p>
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    isOwedToYou ? 'text-green-300' : 'text-red-300'
                  }`}>
                    {isOwedToYou ? '+' : '-'}${balance.amount.toFixed(2)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick settle note */}
      {balances.length > 0 && (
        <div
          className="mt-4 p-4 rounded-2xl"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
        >
          <p className="text-xs font-medium text-gray-300">
            <span className="font-bold">💡 Tip:</span> Click "Settle Up" to mark debts as paid
          </p>
        </div>
      )}
    </div>
  );
};

export default BalanceSummary;
