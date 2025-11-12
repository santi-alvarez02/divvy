import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for hash params (email confirmation tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('Auth callback - Hash params:', { access_token: !!access_token, refresh_token: !!refresh_token, type });

        // If we have tokens in the hash, exchange them for a session
        if (access_token && type === 'signup') {
          console.log('Email confirmation detected, setting session...');

          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });

          if (sessionError) {
            console.error('Error setting session:', sessionError);
            setStatus('error');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }

          if (session) {
            console.log('Email confirmed! Session set:', session);
            setStatus('success');

            // Check if user has completed onboarding by checking for a group
            const { data: groupData, error: groupError } = await supabase
              .from('group_members')
              .select('group_id')
              .eq('user_id', session.user.id)
              .limit(1)
              .maybeSingle();

            if (groupError) {
              console.error('Error checking groups:', groupError);
            }

            console.log('Group check result:', groupData);

            // If user has no group, redirect to onboarding
            // Otherwise, redirect to dashboard
            setTimeout(() => {
              if (!groupData) {
                console.log('No group found, redirecting to onboarding');
                navigate('/onboarding');
              } else {
                console.log('Group found, redirecting to dashboard');
                navigate('/dashboard');
              }
            }, 2000);
            return;
          }
        }

        // Fallback: try to get existing session
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          setStatus('error');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (session) {
          console.log('Existing session found:', session);
          setStatus('success');

          // Check if user has completed onboarding by checking for a group
          const { data: groupData, error: groupError } = await supabase
            .from('group_members')
            .select('group_id')
            .eq('user_id', session.user.id)
            .limit(1)
            .maybeSingle();

          if (groupError) {
            console.error('Error checking groups:', groupError);
          }

          // If user has no group, redirect to onboarding
          // Otherwise, redirect to dashboard
          setTimeout(() => {
            if (!groupData) {
              navigate('/onboarding');
            } else {
              navigate('/dashboard');
            }
          }, 2000);
        } else {
          console.error('No session found');
          setStatus('error');
          setTimeout(() => navigate('/login'), 3000);
        }
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        setStatus('error');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: isDarkMode ? '#0f0f0f' : '#f5f5f5'
      }}
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

      <div
        className="w-full max-w-md p-8 rounded-3xl shadow-xl relative z-10 text-center"
        style={{
          background: isDarkMode
            ? 'rgba(31, 41, 55, 0.4)'
            : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(24px)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)'}`
        }}
      >
        <h1 className="text-5xl font-bold mb-6" style={{ color: '#FF5E00' }}>
          Divvy
        </h1>

        {status === 'processing' && (
          <>
            <div
              className="inline-block animate-spin rounded-full h-16 w-16 border-4 mb-6"
              style={{
                borderColor: 'rgba(255, 94, 0, 0.2)',
                borderTopColor: '#FF5E00'
              }}
            />
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Confirming your email...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto"
                style={{ color: '#FF5E00' }}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Email Confirmed!
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Redirecting you to your account...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mb-6">
              <svg
                className="w-16 h-16 mx-auto text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Something went wrong
            </h2>
            <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Redirecting you to login...
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
