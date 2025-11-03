import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GetStarted from './pages/GetStarted';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './components/Dashboard';
import Expenses from './pages/Expenses';
import Balances from './pages/Balances';
import Budget from './pages/Budget';
import Groups from './pages/Groups';
import Settings from './pages/Settings';
import { monthlyBudget, expenses, balances, roommates } from './data/mockData';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route
            path="/"
            element={<GetStarted isDarkMode={isDarkMode} />}
          />
          <Route
            path="/login"
            element={<Login isDarkMode={isDarkMode} />}
          />
          <Route
            path="/signup"
            element={<Signup isDarkMode={isDarkMode} />}
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute isDarkMode={isDarkMode}>
                <Onboarding isDarkMode={isDarkMode} />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute isDarkMode={isDarkMode}>
                <Dashboard
                  budget={monthlyBudget}
                  expenses={expenses}
                  balances={balances}
                  roommates={roommates}
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/expenses"
            element={
              <ProtectedRoute isDarkMode={isDarkMode}>
                <Expenses
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                  expenses={expenses}
                  roommates={roommates}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/balances"
            element={
              <ProtectedRoute isDarkMode={isDarkMode}>
                <Balances
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                  expenses={expenses}
                  roommates={roommates}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/budgets"
            element={
              <ProtectedRoute isDarkMode={isDarkMode}>
                <Budget
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                  expenses={expenses}
                  roommates={roommates}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute isDarkMode={isDarkMode}>
                <Groups
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                  roommates={roommates}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute isDarkMode={isDarkMode}>
                <Settings
                  isDarkMode={isDarkMode}
                  setIsDarkMode={setIsDarkMode}
                />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
