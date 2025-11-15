import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const AuthCallback = ({ isDarkMode }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for code parameter (PKCE flow - email confirmation)
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');

        // Check for hash params (implicit flow - email confirmation tokens)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('Auth callback - URL params:', { code: !!code });
        console.log('Auth callback - Hash params:', { access_token: !!access_token, refresh_token: !!refresh_token, type });

        // Handle PKCE flow (code parameter)
        // Let Supabase handle the code exchange automatically via detectSessionInUrl
        if (code) {
          console.log('PKCE code detected, letting Supabase handle exchange...');

          // Wait a moment for Supabase to process the URL automatically
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Now check if session was established
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            console.error('Error getting session after code exchange:', sessionError);
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
          } else {
            console.error('No session after code exchange - code may be invalid or expired');
            setStatus('error');
            setTimeout(() => navigate('/login'), 3000);
            return;
          }
        }

        // Handle implicit flow (hash tokens)
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
      className="min-h-screen flex items-center justify-center"
      style={{
        background: isDarkMode ? '#0f0f0f' : '#f5f5f5'
      }}
    >
      <div
        className="animate-spin rounded-full h-12 w-12 border-4"
        style={{
          borderColor: 'rgba(255, 94, 0, 0.2)',
          borderTopColor: '#FF5E00'
        }}
      />
    </div>
  );
};

export default AuthCallback;
