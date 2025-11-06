import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Onboarding = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [step, setStep] = useState(1); // 1: Profile, 2: Budget, 3: Account Type, 4: Group
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Profile Picture
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);

  // Step 2: Monthly Budget & Currency
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  // Step 3: Account Type
  const [accountType, setAccountType] = useState(''); // 'solo' or 'group'

  // Step 4: Group (if selected)
  const [groupAction, setGroupAction] = useState(''); // 'create' or 'join'
  const [groupName, setGroupName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  // Handle profile picture selection
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
      // Automatically move to next step after upload
      setTimeout(() => {
        setStep(2);
      }, 500);
    }
  };

  // Upload profile picture to Supabase Storage
  const uploadProfilePicture = async () => {
    if (!profilePicture) {
      console.log('No profile picture to upload');
      return null;
    }

    try {
      console.log('Starting profile picture upload...');
      const fileExt = profilePicture.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log('Uploading to path:', filePath);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, profilePicture, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      console.log('Public URL:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      // Show error to user
      setError(`Failed to upload profile picture: ${error.message}`);
      return null;
    }
  };

  // Step 1: Next (Profile Picture)
  const handleStep1Next = () => {
    setStep(2);
  };

  // Step 2: Next (Monthly Budget)
  const handleStep2Next = () => {
    if (!monthlyBudget || parseFloat(monthlyBudget) <= 0) {
      setError('Please enter a valid budget amount');
      return;
    }
    setError('');
    setStep(3);
  };

  // Step 3: Select Account Type
  const handleAccountTypeSelect = (type) => {
    setAccountType(type);
    if (type === 'solo') {
      // Go directly to finish for solo accounts
      handleFinishOnboarding(type);
    } else {
      // Go to group selection
      setStep(4);
    }
  };

  // Generate random invite code
  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  // Finish onboarding and save to database
  const handleFinishOnboarding = async (accType = accountType) => {
    setLoading(true);
    setError('');

    try {
      // Upload profile picture if exists
      console.log('Profile picture state:', profilePicture);
      const avatarUrl = await uploadProfilePicture();
      console.log('Avatar URL after upload:', avatarUrl);

      // Save user to database
      console.log('Saving user data with avatar_url:', avatarUrl);
      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          avatar_url: avatarUrl,
          account_type: accType,
          monthly_budget: parseFloat(monthlyBudget) || 0,
          default_currency: defaultCurrency,
          created_at: new Date().toISOString()
        })
        .select();

      console.log('User data saved:', userData);
      if (userError) {
        console.error('User save error:', userError);
        throw userError;
      }

      // If group account, handle group creation/joining
      if (accType === 'group') {
        if (groupAction === 'create') {
          // Create new group with user's default currency
          const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .insert({
              name: groupName,
              admin_id: user.id,
              default_currency: defaultCurrency
            })
            .select()
            .single();

          if (groupError) {
            console.error('Group creation error:', groupError);
            throw groupError;
          }

          // Add user as group member
          const { error: memberError } = await supabase
            .from('group_members')
            .insert({
              group_id: groupData.id,
              user_id: user.id,
              role: 'admin'
            });

          if (memberError) throw memberError;
        } else if (groupAction === 'join') {
          // Join existing group
          const { data: groupData, error: groupError } = await supabase
            .from('groups')
            .select('id')
            .eq('invite_code', inviteCode.toUpperCase())
            .single();

          if (groupError) {
            setError('Invalid invite code. Please check and try again.');
            setLoading(false);
            return;
          }

          // Add user as group member
          const { error: memberError } = await supabase
            .from('group_members')
            .insert({
              group_id: groupData.id,
              user_id: user.id,
              role: 'member'
            });

          if (memberError) throw memberError;
        }
      }

      // Onboarding complete - redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('Error completing onboarding:', err);
      setError(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
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
        className="w-full max-w-md mx-auto p-6 sm:p-8 rounded-3xl shadow-xl relative z-10"
        style={{
          background: isDarkMode
            ? 'rgba(31, 41, 55, 0.4)'
            : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(24px)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`
        }}
      >
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Step {step} of {accountType === 'group' ? '4' : '3'}
            </span>
          </div>
          <div className="w-full bg-gray-300 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                width: `${(step / (accountType === 'group' ? 4 : 3)) * 100}%`,
                background: 'linear-gradient(135deg, #FF5E00 0%, #FF8C42 100%)'
              }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
            }`}
          >
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Step 1: Profile Picture */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Add a profile picture
              </h2>
            </div>

            <div className="flex flex-col items-center space-y-4">
              {/* Profile Picture Preview */}
              <div
                className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center"
                style={{
                  background: profilePicturePreview
                    ? 'transparent'
                    : 'linear-gradient(135deg, #FF5E00 0%, #FF8C42 100%)'
                }}
              >
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-5xl text-white">
                    {user?.user_metadata?.full_name?.charAt(0).toUpperCase() || '?'}
                  </span>
                )}
              </div>

              {/* Upload Button */}
              <label
                className={`px-6 py-3 rounded-lg font-semibold cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)',
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.5)'}`
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
                {profilePicture ? 'Change Picture' : 'Upload Picture'}
              </label>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => navigate('/')}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleStep1Next}
                className="flex-1 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #FF5E00 0%, #FF8C42 100%)'
                }}
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Monthly Budget & Currency */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Set Your Monthly Budget
              </h2>
              <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                How much do you plan to spend each month?
              </p>
            </div>

            <div className="space-y-4">
              {/* Currency Selection */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Currency
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                    className={`w-full px-4 py-3 rounded-xl outline-none transition-all font-semibold text-left flex justify-between items-center ${
                      isDarkMode
                        ? 'bg-gray-700/40 text-white'
                        : 'bg-white/80 text-gray-900'
                    }`}
                    style={{
                      border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`
                    }}
                  >
                    <span>
                      {defaultCurrency === 'USD' && '$ USD - US Dollar'}
                      {defaultCurrency === 'EUR' && '€ EUR - Euro'}
                      {defaultCurrency === 'GBP' && '£ GBP - British Pound'}
                      {defaultCurrency === 'CAD' && 'C$ CAD - Canadian Dollar'}
                      {defaultCurrency === 'AUD' && 'A$ AUD - Australian Dollar'}
                    </span>
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className={`transition-transform ${showCurrencyPicker ? 'rotate-180' : ''}`}
                    >
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Currency Dropdown */}
                  {showCurrencyPicker && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowCurrencyPicker(false)}
                      />
                      <div
                        className={`absolute top-full mt-2 left-0 right-0 rounded-xl overflow-hidden z-20 ${
                          isDarkMode
                            ? 'bg-gray-700/95'
                            : 'bg-white/95'
                        }`}
                        style={{
                          border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`,
                          backdropFilter: 'blur(16px)'
                        }}
                      >
                        {[
                          { code: 'USD', symbol: '$', name: 'US Dollar' },
                          { code: 'EUR', symbol: '€', name: 'Euro' },
                          { code: 'GBP', symbol: '£', name: 'British Pound' },
                          { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
                          { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }
                        ].map((currency) => (
                          <button
                            key={currency.code}
                            type="button"
                            onClick={() => {
                              setDefaultCurrency(currency.code);
                              setShowCurrencyPicker(false);
                            }}
                            className={`w-full px-4 py-3 text-left font-semibold transition-all ${
                              defaultCurrency === currency.code
                                ? ''
                                : isDarkMode
                                ? 'hover:bg-white/5'
                                : 'hover:bg-gray-100/50'
                            } ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}
                            style={{
                              background: defaultCurrency === currency.code
                                ? 'linear-gradient(90deg, rgba(255, 94, 0, 0.2) 0%, rgba(255, 133, 52, 0.2) 100%)'
                                : 'transparent'
                            }}
                          >
                            <span className="mr-2">{currency.symbol}</span>
                            {currency.code} - {currency.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Budget Input */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Monthly Budget
                </label>
                <div className="relative">
                  <span className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {defaultCurrency === 'USD' ? '$' : defaultCurrency === 'EUR' ? '€' : defaultCurrency === 'GBP' ? '£' : defaultCurrency === 'CAD' ? 'C$' : 'A$'}
                  </span>
                  <input
                    type="number"
                    placeholder="0"
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(e.target.value)}
                    className={`w-full pl-12 pr-4 py-4 text-2xl font-bold rounded-xl outline-none transition-all ${
                      isDarkMode
                        ? 'bg-gray-700/40 text-white placeholder-gray-500'
                        : 'bg-white/80 text-gray-900 placeholder-gray-400'
                    }`}
                    style={{
                      border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`
                    }}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                  isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Back
              </button>
              <button
                onClick={handleStep2Next}
                disabled={loading}
                className="flex-1 py-3 rounded-lg font-semibold text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #FF5E00 0%, #FF8C42 100%)'
                }}
              >
                {loading ? 'Loading...' : 'Continue'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Account Type */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                How will you use Divvy?
              </h2>
              <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Choose your account type
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Solo Account */}
              <button
                onClick={() => handleAccountTypeSelect('solo')}
                disabled={loading}
                className={`p-8 rounded-xl text-center transition-all hover:scale-105 active:scale-95 ${
                  isDarkMode ? 'bg-gray-700/40 hover:bg-gray-700/60' : 'bg-white/80 hover:bg-white/95'
                }`}
                style={{
                  border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`
                }}
              >
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto" style={{ color: '#FF5E00' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#FF5E00' }}>
                  Solo Account
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Track your personal expenses
                </p>
              </button>

              {/* Group Account */}
              <button
                onClick={() => handleAccountTypeSelect('group')}
                disabled={loading}
                className={`p-8 rounded-xl text-center transition-all hover:scale-105 active:scale-95 ${
                  isDarkMode ? 'bg-gray-700/40 hover:bg-gray-700/60' : 'bg-white/80 hover:bg-white/95'
                }`}
                style={{
                  border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`
                }}
              >
                <div className="mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto" style={{ color: '#FF5E00' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2" style={{ color: '#FF5E00' }}>
                  Group Account
                </h3>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Split expenses with roommates or friends
                </p>
              </button>
            </div>

            {/* Back Button */}
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:scale-105 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #FF5E00 0%, #FF8C42 100%)'
              }}
            >
              Back
            </button>
          </div>
        )}

        {/* Step 4: Group Selection (Create or Join) */}
        {step === 4 && accountType === 'group' && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {groupAction ? (groupAction === 'create' ? 'Create a Group' : 'Join a Group') : 'Set up your group'}
              </h2>
              <p className={`text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {groupAction ? (groupAction === 'create' ? 'Give your group a name' : 'Enter the invite code') : 'Create a new group or join an existing one'}
              </p>
            </div>

            {!groupAction ? (
              <div className="grid md:grid-cols-2 gap-4">
                {/* Create Group */}
                <button
                  onClick={() => setGroupAction('create')}
                  className={`p-8 rounded-xl text-center transition-all hover:scale-105 active:scale-95 ${
                    isDarkMode ? 'bg-gray-700/40 hover:bg-gray-700/60' : 'bg-white/80 hover:bg-white/95'
                  }`}
                  style={{
                    border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`
                  }}
                >
                  <div className="mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto" style={{ color: '#FF5E00' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#FF5E00' }}>
                    Create Group
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Start a new group and invite others
                  </p>
                </button>

                {/* Join Group */}
                <button
                  onClick={() => setGroupAction('join')}
                  className={`p-8 rounded-xl text-center transition-all hover:scale-105 active:scale-95 ${
                    isDarkMode ? 'bg-gray-700/40 hover:bg-gray-700/60' : 'bg-white/80 hover:bg-white/95'
                  }`}
                  style={{
                    border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'}`
                  }}
                >
                  <div className="mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto" style={{ color: '#FF5E00' }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold mb-2" style={{ color: '#FF5E00' }}>
                    Join Group
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Join an existing group with an invite code
                  </p>
                </button>
              </div>
            ) : groupAction === 'create' ? (
              <div className="space-y-6">
                {/* Group Name */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="e.g., Apartment 4B, College Roommates"
                    className={`w-full px-4 py-3 rounded-lg border ${
                      isDarkMode
                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  />
                </div>

                {/* Group Currency */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Group Currency
                  </label>
                  <select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className={`w-full px-4 py-3 rounded-lg border font-semibold ${
                      isDarkMode
                        ? 'bg-gray-700/50 border-gray-600 text-white'
                        : 'bg-white/80 border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  >
                    <option value="USD">$ USD - US Dollar</option>
                    <option value="EUR">€ EUR - Euro</option>
                    <option value="GBP">£ GBP - British Pound</option>
                    <option value="CAD">C$ CAD - Canadian Dollar</option>
                    <option value="AUD">A$ AUD - Australian Dollar</option>
                  </select>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setGroupAction('')}
                    disabled={loading}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handleFinishOnboarding()}
                    disabled={loading || !groupName.trim()}
                    className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all ${
                      loading || !groupName.trim()
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:scale-105 active:scale-95'
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, #FF5E00 0%, #FF8C42 100%)'
                    }}
                  >
                    {loading ? 'Creating...' : 'Create Group'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="Enter 6-character invite code"
                  maxLength={6}
                  className={`w-full px-4 py-3 rounded-lg border text-center text-2xl tracking-widest ${
                    isDarkMode
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white/80 border-gray-300 text-gray-900 placeholder-gray-500'
                  } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => setGroupAction('')}
                    disabled={loading}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-all ${
                      isDarkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Back
                  </button>
                  <button
                    onClick={() => handleFinishOnboarding()}
                    disabled={loading || inviteCode.length !== 6}
                    className={`flex-1 py-3 rounded-lg font-semibold text-white transition-all ${
                      loading || inviteCode.length !== 6
                        ? 'cursor-not-allowed opacity-50'
                        : 'hover:scale-105 active:scale-95'
                    }`}
                    style={{
                      background: 'linear-gradient(135deg, #FF5E00 0%, #FF8C42 100%)'
                    }}
                  >
                    {loading ? 'Joining...' : 'Join Group'}
                  </button>
                </div>
              </div>
            )}

            {/* Back Button - Only show when no action is selected */}
            {!groupAction && (
              <button
                onClick={() => setStep(2)}
                disabled={loading}
                className="w-full py-3 rounded-lg font-semibold text-white transition-all hover:scale-105 active:scale-95"
                style={{
                  background: 'linear-gradient(135deg, #FF5E00 0%, #FF8C42 100%)'
                }}
              >
                Back
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
