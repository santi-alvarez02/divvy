import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

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
  const [deletingAccount, setDeletingAccount] = useState(false);
  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [currentPaymentType, setCurrentPaymentType] = useState('');
  const [paymentInput, setPaymentInput] = useState('');

  // Load saved usernames from localStorage on mount
  useEffect(() => {
    const savedVenmo = localStorage.getItem('venmoUsername');
    const savedPaypal = localStorage.getItem('paypalUsername');
    const savedZelle = localStorage.getItem('zelleEmail');

    if (savedVenmo) setVenmoUsername(savedVenmo);
    if (savedPaypal) setPaypalUsername(savedPaypal);
    if (savedZelle) setZelleEmail(savedZelle);
  }, []);

  // Open payment modal
  const openPaymentModal = (type) => {
    setCurrentPaymentType(type);
    // Pre-fill with existing value
    if (type === 'venmo') setPaymentInput(venmoUsername);
    else if (type === 'paypal') setPaymentInput(paypalUsername);
    else if (type === 'zelle') setPaymentInput(zelleEmail);
    setShowPaymentModal(true);
  };

  // Save payment info from modal
  const handleSavePayment = () => {
    if (currentPaymentType === 'venmo') {
      setVenmoUsername(paymentInput);
      localStorage.setItem('venmoUsername', paymentInput);
    } else if (currentPaymentType === 'paypal') {
      setPaypalUsername(paymentInput);
      localStorage.setItem('paypalUsername', paymentInput);
    } else if (currentPaymentType === 'zelle') {
      setZelleEmail(paymentInput);
      localStorage.setItem('zelleEmail', paymentInput);
    }
    setShowPaymentModal(false);
    setPaymentInput('');
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
    setDeletingAccount(true);

    try {
      // First, get the user's avatar_url before deleting
      const { data: userData } = await supabase
        .from('users')
        .select('avatar_url')
        .eq('id', user.id)
        .single();

      // Delete user's avatar from storage if exists
      if (userData?.avatar_url) {
        try {
          // Extract filename from the full URL
          const urlParts = userData.avatar_url.split('/');
          const fileName = urlParts[urlParts.length - 1];
          await supabase.storage.from('avatars').remove([fileName]);
        } catch (storageError) {
          console.log('Error deleting avatar (non-critical):', storageError);
          // Don't throw - this is non-critical
        }
      }

      // Call the database function to delete the user account
      // This will delete from auth.users which cascades to the users table and all related data
      const { error: deleteError } = await supabase.rpc('delete_user_account');

      if (deleteError) {
        console.error('Error deleting account:', deleteError);
        throw deleteError;
      }

      // Sign out the user
      await signOut();

      // Close modal and redirect to home page
      setShowDeleteConfirm(false);
      navigate('/');

    } catch (error) {
      console.error('Error deleting account:', error);
      alert(`Failed to delete account: ${error.message}. Please try again or contact support.`);
      setShowDeleteConfirm(false);
    } finally {
      setDeletingAccount(false);
    }
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
      <main className="ml-20 lg:ml-64 px-4 sm:px-6 lg:px-8 pt-12 sm:pt-6 lg:pt-8 pb-4 sm:pb-6 lg:pb-8 relative z-10"
      >
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Venmo Button */}
            <button
              onClick={() => openPaymentModal('venmo')}
              className="flex flex-col items-center justify-center py-4 rounded-2xl font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#008CFF' }}
            >
              <span className="text-lg mb-1">Venmo</span>
              {venmoUsername && (
                <span className="text-xs opacity-90">@{venmoUsername}</span>
              )}
            </button>

            {/* PayPal Button */}
            <button
              onClick={() => openPaymentModal('paypal')}
              className="flex flex-col items-center justify-center py-4 rounded-2xl font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#0070BA' }}
            >
              <span className="text-lg mb-1">PayPal</span>
              {paypalUsername && (
                <span className="text-xs opacity-90">paypal.me/{paypalUsername}</span>
              )}
            </button>

            {/* Zelle Button */}
            <button
              onClick={() => openPaymentModal('zelle')}
              className="flex flex-col items-center justify-center py-4 rounded-2xl font-bold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#6D1ED4' }}
            >
              <span className="text-lg mb-1">Zelle</span>
              {zelleEmail && (
                <span className="text-xs opacity-90 truncate px-2 max-w-full">{zelleEmail}</span>
              )}
            </button>
          </div>
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

      {/* Payment Information Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(8px)'
            }}
            onClick={() => setShowPaymentModal(false)}
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
              {currentPaymentType === 'venmo' && 'Venmo Username'}
              {currentPaymentType === 'paypal' && 'PayPal Username'}
              {currentPaymentType === 'zelle' && 'Zelle Email'}
            </h3>
            <p className="text-base mb-6" style={{ color: '#4a5568' }}>
              {currentPaymentType === 'venmo' && 'Enter your Venmo username (without @)'}
              {currentPaymentType === 'paypal' && 'Enter your PayPal.me username'}
              {currentPaymentType === 'zelle' && 'Enter your Zelle email address'}
            </p>

            <input
              type="text"
              value={paymentInput}
              onChange={(e) => setPaymentInput(e.target.value)}
              placeholder={
                currentPaymentType === 'venmo' ? 'username' :
                currentPaymentType === 'paypal' ? 'username' :
                'email@example.com'
              }
              className="w-full px-4 py-3 rounded-2xl mb-6 text-base font-medium"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                border: '2px solid rgba(0, 0, 0, 0.1)',
                color: '#1a202c',
                outline: 'none'
              }}
              autoFocus
            />

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setPaymentInput('');
                }}
                className="flex-1 py-4 rounded-2xl font-bold text-lg transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#ffffff',
                  color: '#2d3748'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSavePayment}
                className="flex-1 py-4 rounded-2xl font-bold text-lg text-white transition-all hover:opacity-90"
                style={{
                  backgroundColor: '#FF5E00'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
