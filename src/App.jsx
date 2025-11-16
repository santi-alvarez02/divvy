import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import GetStarted from './pages/GetStarted';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthCallback from './pages/AuthCallback';
import Onboarding from './pages/Onboarding';
import Dashboard from './components/Dashboard';
import Expenses from './pages/Expenses';
import Balances from './pages/Balances';
import Budget from './pages/Budget';
import Groups from './pages/Groups';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import OfflineBanner from './components/OfflineBanner';
import InstallPrompt from './components/InstallPrompt';
import { registerServiceWorker } from './utils/registerServiceWorker';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Register service worker on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Update theme-color meta tag and background when dark mode changes
  useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDarkMode ? '#1a1a1a' : '#f5f5f5');
    }
    // Update html and body background for overscroll
    document.documentElement.style.backgroundColor = isDarkMode ? '#1a1a1a' : '#f5f5f5';
    document.body.style.backgroundColor = isDarkMode ? '#1a1a1a' : '#f5f5f5';
  }, [isDarkMode]);

  return (
    <AuthProvider>
      <Router>
        {/* PWA Components */}
        <OfflineBanner />
        <InstallPrompt />

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
            path="/auth/callback"
            element={<AuthCallback isDarkMode={isDarkMode} />}
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
          <Route
            path="/profile"
            element={
              <ProtectedRoute isDarkMode={isDarkMode}>
                <Profile
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
