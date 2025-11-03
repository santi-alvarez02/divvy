import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, isDarkMode }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center relative overflow-hidden"
        style={{ background: isDarkMode ? '#0f0f0f' : '#f5f5f5' }}
      >
        {/* Orange gradient bubble */}
        <div
          className="absolute top-1/2 left-[55%] w-[700px] h-[700px] rounded-full blur-3xl"
          style={{
            background: isDarkMode
              ? 'radial-gradient(circle, rgba(255, 94, 0, 0.3) 0%, rgba(255, 94, 0, 0) 70%)'
              : 'radial-gradient(circle, rgba(255, 94, 0, 0.4) 0%, rgba(255, 94, 0, 0) 70%)',
            transform: 'translate(-50%, -50%)'
          }}
        />

        <div className="text-center relative z-10">
          {/* Orange spinner */}
          <div
            className="inline-block animate-spin rounded-full h-16 w-16 border-4"
            style={{
              borderColor: 'rgba(255, 94, 0, 0.2)',
              borderTopColor: '#FF5E00'
            }}
          ></div>
          <p className="mt-6 text-lg font-medium" style={{ color: '#FF5E00' }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Redirect to get started page if not authenticated
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Render children if authenticated
  return children;
};

export default ProtectedRoute;
