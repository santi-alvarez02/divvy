import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    const { data, error: signInError } = await signIn(email, password);

    setLoading(false);

    if (signInError) {
      setError(signInError.message || 'Failed to sign in. Please check your credentials.');
    } else if (data) {
      // Redirect to dashboard on success
      navigate('/dashboard');
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: isDarkMode ? '#0f0f0f' : '#f5f5f5'
      }}
    >
      {/* Single gradient bubble in center-right */}
      <div
        className="absolute top-1/2 left-[55%] w-[700px] h-[700px] rounded-full blur-3xl"
        style={{
          background: isDarkMode
            ? 'radial-gradient(circle, rgba(255, 94, 0, 0.3) 0%, rgba(255, 94, 0, 0) 70%)'
            : 'radial-gradient(circle, rgba(255, 94, 0, 0.4) 0%, rgba(255, 94, 0, 0) 70%)',
          transform: 'translate(-50%, -50%)'
        }}
      />

      <div
        className="w-full max-w-md p-8 rounded-3xl shadow-xl relative z-10"
        style={{
          background: isDarkMode
            ? 'rgba(31, 41, 55, 0.4)'
            : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(24px)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`
        }}
      >
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold mb-3" style={{ color: '#FF5E00' }}>
            Divvy
          </h1>
          <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Welcome back
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Message */}
          {error && (
            <div
              className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
              }`}
            >
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg border ${
                isDarkMode
                  ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-orange-500`}
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className={`block text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-200' : 'text-gray-700'
              }`}
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-4 py-3 pr-12 rounded-lg border ${
                  isDarkMode
                    ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500'
                } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                  isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                } transition-colors`}
                disabled={loading}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className={`text-sm ${
                isDarkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'
              }`}
            >
              Forgot password?
            </Link>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold text-white transition-all ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-orange-500 hover:bg-orange-600 active:scale-95'
            }`}
            style={{
              background: loading ? undefined : 'linear-gradient(135deg, #FF5E00 0%, #FF8C42 100%)'
            }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Sign Up Link */}
        <div className={`mt-6 text-center text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Don't have an account?{' '}
          <Link
            to="/signup"
            className={`font-semibold ${
              isDarkMode ? 'text-orange-400 hover:text-orange-300' : 'text-orange-600 hover:text-orange-700'
            }`}
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
