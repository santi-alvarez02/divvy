import React from 'react';
import Dashboard from './components/Dashboard';
import { monthlyBudget, expenses, balances, roommates } from './data/mockData';

function App() {
  return (
    <Dashboard
      budget={monthlyBudget}
      expenses={expenses}
      balances={balances}
      roommates={roommates}
    />
  );
}

export default App;
