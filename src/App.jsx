import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import Expenses from './pages/Expenses';
import { monthlyBudget, expenses, balances, roommates } from './data/mockData';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Dashboard
              budget={monthlyBudget}
              expenses={expenses}
              balances={balances}
              roommates={roommates}
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
            />
          }
        />
        <Route
          path="/expenses"
          element={
            <Expenses
              isDarkMode={isDarkMode}
              setIsDarkMode={setIsDarkMode}
              expenses={expenses}
              roommates={roommates}
            />
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
