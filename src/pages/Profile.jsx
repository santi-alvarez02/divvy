import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import Sidebar from '../components/Sidebar';

const Profile = ({ isDarkMode, setIsDarkMode }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Personal info edit state
  const [editData, setEditData] = useState({
    full_name: '',
    default_currency: 'USD',
    monthly_budget: 0
  });
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const currencyScrollRef = React.useRef(null);

  // Common currencies list
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'MXN'];

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  // Update editData when userData changes
  useEffect(() => {
    if (userData) {
      setEditData({
        full_name: userData.full_name || '',
        default_currency: userData.default_currency || 'USD',
        monthly_budget: userData.monthly_budget || 0
      });
    }
  }, [userData]);

  // Currency picker scroll effect
  useEffect(() => {
    if (showCurrencyPicker && currencyScrollRef.current) {
      const selectedIndex = currencies.indexOf(editData.default_currency);
      const itemHeight = 40;
      const scrollTop = selectedIndex * itemHeight;
      currencyScrollRef.current.scrollTop = scrollTop;
    }
  }, [showCurrencyPicker, editData.default_currency, currencies]);

  // Get user initials for avatar fallback
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Generate a consistent color based on user ID (same as Sidebar)
  const getAvatarColor = (userId) => {
    if (!userId) return 'from-purple-400 to-pink-400';

    const colors = [
      'from-purple-400 to-pink-400',
      'from-blue-400 to-cyan-400',
      'from-green-400 to-emerald-400',
      'from-yellow-400 to-orange-400',
      'from-red-400 to-rose-400',
      'from-indigo-400 to-purple-400',
      'from-teal-400 to-green-400',
      'from-orange-400 to-red-400',
    ];

    // Use user ID to generate a consistent index
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event) => {
    try {
      setUploadError(null);
      setUploadSuccess(false);

      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setUploadError('Please upload an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setUploadError('Image size must be less than 2MB');
        return;
      }

      setUploading(true);

      // Delete old avatar if exists
      if (userData?.avatar_url) {
        const oldPath = userData.avatar_url.split('/').pop();
        await supabase.storage
          .from('avatars')
          .remove([`${user.id}/${oldPath}`]);
      }

      // Upload new avatar
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${Date.now()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setUserData({ ...userData, avatar_url: publicUrl });
      setUploadSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      setUploadError(error.message || 'Failed to upload avatar');
    } finally {
      setUploading(false);
    }
  };

  // Handle avatar removal
  const handleAvatarRemove = async () => {
    try {
      setUploadError(null);
      setUploadSuccess(false);
      setUploading(true);

      if (!userData?.avatar_url) return;

      // Delete from storage
      const oldPath = userData.avatar_url.split('/').pop();
      await supabase.storage
        .from('avatars')
        .remove([`${user.id}/${oldPath}`]);

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setUserData({ ...userData, avatar_url: null });
      setUploadSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);
    } catch (error) {
      console.error('Error removing avatar:', error);
      setUploadError(error.message || 'Failed to remove avatar');
    } finally {
      setUploading(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    try {
      setPasswordError(null);
      setPasswordSuccess(false);

      // Validation
      if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
        setPasswordError('Please fill in all password fields');
        return;
      }

      if (passwordData.newPassword.length < 8) {
        setPasswordError('New password must be at least 8 characters long');
        return;
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }

      setChangingPassword(true);

      // First, verify current password by attempting to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword
      });

      if (signInError) {
        setPasswordError('Current password is incorrect');
        setChangingPassword(false);
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (updateError) throw updateError;

      // Clear form and show success
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordSuccess(true);

      // Close modal after a short delay
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError(error.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Handle personal info save
  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();

    try {
      setSaveError(null);
      setSaveSuccess(false);
      setSaving(true);

      // Validation
      if (!editData.full_name.trim()) {
        setSaveError('Full name is required');
        setSaving(false);
        return;
      }

      if (editData.monthly_budget < 0) {
        setSaveError('Monthly budget cannot be negative');
        setSaving(false);
        return;
      }

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: editData.full_name.trim(),
          default_currency: editData.default_currency,
          monthly_budget: editData.monthly_budget
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setUserData({
        ...userData,
        full_name: editData.full_name.trim(),
        default_currency: editData.default_currency,
        monthly_budget: editData.monthly_budget
      });

      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving personal info:', error);
      setSaveError(error.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };


  if (loading) {
    return (
      <div
        className="min-h-screen relative overflow-hidden"
        style={{
          background: isDarkMode
            ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
            : '#f5f5f5'
        }}
      >
        <Sidebar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        <main className="ml-20 lg:ml-64 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
          <div className="flex items-center justify-center min-h-screen">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        </main>
      </div>
    );
  }

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

      <Sidebar isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />

      <main className="ml-20 lg:ml-64 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-5xl font-bold font-serif"
            style={{ color: isDarkMode ? '#FF5E00' : '#1f2937' }}
          >
            Profile
          </h1>
        </div>

        {/* Profile Content */}
        <div className="max-w-4xl space-y-6">
          {/* Profile Picture Card */}
          <div
            className="rounded-3xl shadow-xl p-6"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <h2
              className={`text-2xl font-bold font-serif mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Profile Picture
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar Display */}
              <div className="relative">
                {userData?.avatar_url ? (
                  <img
                    src={userData.avatar_url}
                    alt={userData.full_name}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-32 h-32 rounded-full flex items-center justify-center text-4xl font-bold text-white bg-gradient-to-br ${getAvatarColor(user?.id)}`}
                  >
                    {getInitials(userData?.full_name)}
                  </div>
                )}
              </div>

              {/* Avatar Actions */}
              <div className="flex flex-col gap-3">
                <label
                  className={`px-6 py-3 rounded-2xl font-semibold transition-all shadow-lg text-center ${
                    uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90'
                  } ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    backdropFilter: 'blur(12px)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'
                  }}
                >
                  {uploading ? 'Uploading...' : 'Upload Photo'}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    disabled={uploading}
                    onChange={handleAvatarUpload}
                  />
                </label>

                {userData?.avatar_url && (
                  <button
                    onClick={handleAvatarRemove}
                    disabled={uploading}
                    className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
                      uploading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                    } ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-200 text-gray-900'
                    }`}
                  >
                    Remove Photo
                  </button>
                )}

                {/* Success Message */}
                {uploadSuccess && (
                  <div className="px-4 py-2 rounded-xl text-sm font-medium text-green-700 bg-green-100">
                    Avatar updated successfully!
                  </div>
                )}

                {/* Error Message */}
                {uploadError && (
                  <div className="px-4 py-2 rounded-xl text-sm font-medium text-red-700 bg-red-100">
                    {uploadError}
                  </div>
                )}
              </div>
            </div>

            {/* User Info */}
            <div className="mt-6 pt-6 border-t" style={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Full Name
                  </p>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {userData?.full_name || 'Not set'}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Email
                  </p>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {userData?.email}
                  </p>
                </div>
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Member Since
                  </p>
                  <p className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatDate(userData?.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information Card */}
          <div
            className="rounded-3xl shadow-xl p-6"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <h2
              className={`text-2xl font-bold font-serif mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Personal Information
            </h2>

            <form onSubmit={handleSavePersonalInfo} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Full Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-xl font-medium transition-all outline-none"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? 'white' : '#1f2937'
                  }}
                  value={editData.full_name}
                  onChange={(e) => setEditData({ ...editData, full_name: e.target.value })}
                  disabled={saving}
                />
              </div>

              <div className="relative">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Default Currency
                </label>
                <button
                  type="button"
                  onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                  className="w-full px-4 py-3 rounded-xl font-medium transition-all outline-none"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? 'white' : '#1f2937',
                    backdropFilter: 'blur(16px)',
                    textAlign: 'left'
                  }}
                  disabled={saving}
                >
                  {editData.default_currency}
                </button>

                {/* Currency Wheel Picker Overlay */}
                {showCurrencyPicker && (
                  <>
                    <div
                      className="fixed inset-0"
                      style={{ zIndex: 1000 }}
                      onClick={() => setShowCurrencyPicker(false)}
                    />
                    <div
                      className="absolute rounded-xl overflow-hidden scrollbar-hide"
                      style={{
                        top: '70px',
                        left: '0',
                        right: '0',
                        height: '120px',
                        background: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.5)',
                        backdropFilter: 'blur(16px)',
                        zIndex: 1001
                      }}
                    >
                      <div className="relative h-full overflow-hidden">
                        {/* Selection highlight bar */}
                        <div
                          className="absolute left-0 right-0 pointer-events-none rounded-xl"
                          style={{
                            top: '0px',
                            height: '40px',
                            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)',
                            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'
                          }}
                        />

                        {/* Currencies list */}
                        <div
                          ref={currencyScrollRef}
                          className="h-full overflow-y-auto scrollbar-hide"
                          style={{
                            paddingTop: '0px',
                            paddingBottom: '80px'
                          }}
                        >
                          {currencies.map((curr) => (
                            <button
                              key={curr}
                              type="button"
                              onClick={() => {
                                setEditData({ ...editData, default_currency: curr });
                                setShowCurrencyPicker(false);
                              }}
                              className="w-full flex items-center justify-center"
                              style={{
                                height: '40px',
                                background: 'transparent',
                                color: '#6b7280',
                                fontSize: '15px',
                                fontWeight: '400',
                                transition: 'color 0.15s ease, font-size 0.15s ease, font-weight 0.15s ease'
                              }}
                            >
                              {curr}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className="text-sm font-semibold transition-all hover:opacity-80"
                    style={{ color: '#FF5E00' }}
                  >
                    Change Password
                  </button>
                </div>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl font-medium transition-all outline-none"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? 'white' : '#1f2937'
                  }}
                  value="••••••••"
                  readOnly
                  disabled
                />
              </div>

              {/* Success Message */}
              {saveSuccess && (
                <div className="px-4 py-2 rounded-xl text-sm font-medium text-green-700 bg-green-100">
                  Changes saved successfully!
                </div>
              )}

              {/* Error Message */}
              {saveError && (
                <div className="px-4 py-2 rounded-xl text-sm font-medium text-red-700 bg-red-100">
                  {saveError}
                </div>
              )}

              <button
                type="submit"
                disabled={saving}
                className={`px-6 py-3 rounded-2xl font-semibold text-white transition-all shadow-lg ${
                  saving ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                }`}
                style={{ backgroundColor: '#FF5E00' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
          onClick={() => setShowPasswordModal(false)}
        >
          <div
            className="rounded-3xl shadow-2xl p-6 max-w-md w-full"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.9)'
                : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              border: isDarkMode
                ? '1px solid rgba(255, 255, 255, 0.1)'
                : '1px solid rgba(0, 0, 0, 0.1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              className={`text-2xl font-bold font-serif mb-6 ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              Change Password
            </h2>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Current Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl font-medium transition-all outline-none"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? 'white' : '#1f2937'
                  }}
                  placeholder="Enter current password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  disabled={changingPassword}
                  autoFocus
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl font-medium transition-all outline-none"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? 'white' : '#1f2937'
                  }}
                  placeholder="Enter new password (min 8 characters)"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  disabled={changingPassword}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-3 rounded-xl font-medium transition-all outline-none"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? 'white' : '#1f2937'
                  }}
                  placeholder="Confirm new password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  disabled={changingPassword}
                />
              </div>

              {/* Success Message */}
              {passwordSuccess && (
                <div className="px-4 py-2 rounded-xl text-sm font-medium text-green-700 bg-green-100">
                  Password updated successfully!
                </div>
              )}

              {/* Error Message */}
              {passwordError && (
                <div className="px-4 py-2 rounded-xl text-sm font-medium text-red-700 bg-red-100">
                  {passwordError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className={`flex-1 px-6 py-3 rounded-2xl font-semibold text-white transition-all shadow-lg ${
                    changingPassword ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                  }`}
                  style={{ backgroundColor: '#FF5E00' }}
                >
                  {changingPassword ? 'Updating...' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError(null);
                    setPasswordData({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  disabled={changingPassword}
                  className={`px-6 py-3 rounded-2xl font-semibold transition-all ${
                    changingPassword ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'
                  } ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
