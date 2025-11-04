import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';

const Settings = ({ isDarkMode, setIsDarkMode }) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  // Payment usernames state
  const [venmoUsername, setVenmoUsername] = useState('');
  const [paypalUsername, setPaypalUsername] = useState('');
  const [zelleEmail, setZelleEmail] = useState('');
  // Sign out confirmation state
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load saved usernames from localStorage on mount
  useEffect(() => {
    const savedVenmo = localStorage.getItem('venmoUsername');
    const savedPaypal = localStorage.getItem('paypalUsername');
    const savedZelle = localStorage.getItem('zelleEmail');

    if (savedVenmo) setVenmoUsername(savedVenmo);
    if (savedPaypal) setPaypalUsername(savedPaypal);
    if (savedZelle) setZelleEmail(savedZelle);
  }, []);

  // Save usernames to localStorage
  const handleSavePaymentInfo = () => {
    localStorage.setItem('venmoUsername', venmoUsername);
    localStorage.setItem('paypalUsername', paypalUsername);
    localStorage.setItem('zelleEmail', zelleEmail);
    alert('Payment information saved!');
  };

  // Handle sign out
  const handleSignOut = async () => {
    setShowSignOutConfirm(false);
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    } else {
      alert('Error signing out. Please try again.');
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    setShowDeleteConfirm(false);
    // TODO: Implement account deletion logic
    alert('Account deletion will be implemented soon. This will permanently delete all your data.');
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : '#f5f5f5'
      }}
    >
      {/* Orange Gradient Bubble Backgrounds */}
      {!isDarkMode ? (
        <>
          <div
            className="absolute pointer-events-none"
            style={{
              top: '10%',
              right: '20%',
              width: '700px',
              height: '700px',
              background: 'radial-gradient(circle, rgba(255, 154, 86, 0.5) 0%, rgba(255, 184, 77, 0.35) 35%, rgba(255, 198, 112, 0.2) 60%, transparent 100%)',
              filter: 'blur(80px)',
              borderRadius: '50%',
              zIndex: 0
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: '10%',
              left: '15%',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(255, 198, 112, 0.4) 0%, rgba(255, 184, 77, 0.25) 40%, transparent 100%)',
              filter: 'blur(70px)',
              borderRadius: '50%',
              zIndex: 0
            }}
          />
        </>
      ) : (
        <>
          <div
            className="absolute pointer-events-none"
            style={{
              top: '10%',
              right: '20%',
              width: '700px',
              height: '700px',
              background: 'radial-gradient(circle, rgba(255, 94, 0, 0.25) 0%, rgba(255, 94, 0, 0.15) 35%, rgba(255, 94, 0, 0.08) 60%, transparent 100%)',
              filter: 'blur(80px)',
              borderRadius: '50%',
              zIndex: 0
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: '10%',
              left: '15%',
              width: '500px',
              height: '500px',
              background: 'radial-gradient(circle, rgba(255, 94, 0, 0.2) 0%, rgba(255, 94, 0, 0.1) 40%, transparent 100%)',
              filter: 'blur(70px)',
              borderRadius: '50%',
              zIndex: 0
            }}
          />
        </>
      )}

      {/* Sidebar */}
      <Sidebar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      {/* Main Content */}
      <main className="ml-20 lg:ml-64 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-5xl font-bold font-serif"
            style={{ color: isDarkMode ? '#FF5E00' : '#1f2937' }}
          >
            Settings
          </h1>
        </div>

        {/* Payment Information Section */}
        <div
          className="rounded-3xl shadow-xl p-6 mb-6"
          style={{
            background: isDarkMode
              ? 'rgba(0, 0, 0, 0.3)'
              : 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <h2 className={`text-2xl font-bold font-serif mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Payment Information
          </h2>
          <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Add your payment usernames to make settling up easier. Your roommates will be able to pay you directly.
          </p>

          <div className="space-y-4">
            {/* Venmo Username */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Venmo Username
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="px-3 py-2 rounded-xl font-semibold text-sm"
                  style={{
                    backgroundColor: '#008CFF',
                    color: 'white'
                  }}
                >
                  @
                </div>
                <input
                  type="text"
                  value={venmoUsername}
                  onChange={(e) => setVenmoUsername(e.target.value)}
                  placeholder="your-venmo-username"
                  className="flex-1 px-4 py-3 rounded-xl border-2 transition-all focus:outline-none"
                  style={{
                    background: isDarkMode ? '#1a1a1a' : '#ffffff',
                    color: isDarkMode ? 'white' : '#1f2937',
                    borderColor: isDarkMode ? '#404040' : '#e5e7eb'
                  }}
                />
              </div>
            </div>

            {/* PayPal Username */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                PayPal.me Username
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="px-3 py-2 rounded-xl font-semibold text-sm"
                  style={{
                    backgroundColor: '#0070BA',
                    color: 'white'
                  }}
                >
                  paypal.me/
                </div>
                <input
                  type="text"
                  value={paypalUsername}
                  onChange={(e) => setPaypalUsername(e.target.value)}
                  placeholder="your-paypal-username"
                  className="flex-1 px-4 py-3 rounded-xl border-2 transition-all focus:outline-none"
                  style={{
                    background: isDarkMode ? '#1a1a1a' : '#ffffff',
                    color: isDarkMode ? 'white' : '#1f2937',
                    borderColor: isDarkMode ? '#404040' : '#e5e7eb'
                  }}
                />
              </div>
            </div>

            {/* Zelle Email/Phone */}
            <div>
              <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Zelle Email or Phone
              </label>
              <div className="flex items-center gap-3">
                <div
                  className="px-3 py-2 rounded-xl font-semibold text-sm"
                  style={{
                    backgroundColor: '#6D1ED4',
                    color: 'white'
                  }}
                >
                  📧
                </div>
                <input
                  type="text"
                  value={zelleEmail}
                  onChange={(e) => setZelleEmail(e.target.value)}
                  placeholder="email@example.com or phone"
                  className="flex-1 px-4 py-3 rounded-xl border-2 transition-all focus:outline-none"
                  style={{
                    background: isDarkMode ? '#1a1a1a' : '#ffffff',
                    color: isDarkMode ? 'white' : '#1f2937',
                    borderColor: isDarkMode ? '#404040' : '#e5e7eb'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSavePaymentInfo}
            className="mt-6 px-6 py-3 rounded-2xl text-base font-semibold text-white transition-all hover:opacity-90"
            style={{ backgroundColor: '#FF5E00' }}
          >
            Save Payment Information
          </button>
        </div>

        {/* App Preferences Section */}
        <div
          className="rounded-3xl shadow-xl p-6"
          style={{
            background: isDarkMode
              ? 'rgba(0, 0, 0, 0.3)'
              : 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <h2 className={`text-2xl font-bold font-serif mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            App Preferences
          </h2>

          {/* Dark Mode Toggle */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Dark Mode
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Switch between light and dark theme
              </p>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`w-14 h-8 rounded-full transition-all ${isDarkMode ? 'bg-orange-500' : 'bg-gray-300'}`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transition-all ${
                  isDarkMode ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Account Section */}
        <div
          className="rounded-3xl shadow-xl p-6 mt-6"
          style={{
            background: isDarkMode
              ? 'rgba(0, 0, 0, 0.3)'
              : 'rgba(255, 255, 255, 0.4)',
            backdropFilter: 'blur(12px)',
            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <h2 className={`text-2xl font-bold font-serif mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Account
          </h2>

          {/* User Info */}
          {user && (
            <div className="mb-6 space-y-4">
              {/* Email */}
              <div>
                <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Signed in as
                </p>
                <p className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user.email}
                </p>
              </div>

              {/* Full Name */}
              {user.user_metadata?.full_name && (
                <div>
                  <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Full Name
                  </p>
                  <p className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user.user_metadata.full_name}
                  </p>
                </div>
              )}

              {/* Account Created */}
              <div>
                <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Member Since
                </p>
                <p className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {/* Sign Out Button */}
            <button
              onClick={() => setShowSignOutConfirm(true)}
              className="px-6 py-3 rounded-2xl text-base font-semibold transition-all hover:opacity-90"
              style={{
                backgroundColor: isDarkMode ? '#dc2626' : '#ef4444',
                color: 'white'
              }}
            >
              Sign Out
            </button>

            {/* Delete Account Button */}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-6 py-3 rounded-2xl text-base font-semibold transition-all hover:opacity-90"
              style={{
                backgroundColor: 'transparent',
                color: isDarkMode ? '#dc2626' : '#ef4444',
                border: `2px solid ${isDarkMode ? '#dc2626' : '#ef4444'}`
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </main>

      {/* Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)'
            }}
            onClick={() => setShowSignOutConfirm(false)}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md p-8 rounded-3xl shadow-2xl"
            style={{
              background: 'rgba(200, 200, 200, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <h3 className="text-3xl font-bold mb-4" style={{ color: '#1a202c' }}>
              Sign Out?
            </h3>
            <p className="text-base mb-8" style={{ color: '#4a5568' }}>
              Are you sure you want to sign out of your account?
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="flex-1 py-4 rounded-2xl font-bold text-lg transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#2d3748'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 py-4 rounded-2xl font-bold text-lg text-white transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#e53e3e'
                }}
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)'
            }}
            onClick={() => setShowDeleteConfirm(false)}
          />

          {/* Modal */}
          <div
            className="relative w-full max-w-md p-8 rounded-3xl shadow-2xl"
            style={{
              background: 'rgba(200, 200, 200, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            <h3 className="text-3xl font-bold mb-4" style={{ color: '#1a202c' }}>
              Delete Account?
            </h3>
            <p className="text-base mb-8" style={{ color: '#4a5568' }}>
              This action cannot be undone. All your data, expenses, and group memberships will be permanently deleted.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-4 rounded-2xl font-bold text-lg transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#2d3748'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="flex-1 py-4 rounded-2xl font-bold text-lg text-white transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#e53e3e'
                }}
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
