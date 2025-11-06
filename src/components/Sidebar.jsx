import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// Cache user data globally to persist across component re-mounts
let cachedUserData = null;
let isFetching = false;
const fetchPromises = [];

const Sidebar = ({ isDarkMode, setIsDarkMode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [userData, setUserData] = useState(cachedUserData);

  // Fetch user data from database with global caching
  useEffect(() => {
    if (!user) {
      // Clear cache when user logs out
      cachedUserData = null;
      setUserData(null);
      return;
    }

    // Check if cached data belongs to a different user
    if (cachedUserData && userData && userData.id !== user.id) {
      cachedUserData = null; // Clear cache for different user
    }

    // If we already have cached data for THIS user, use it immediately
    if (cachedUserData && cachedUserData.id === user.id) {
      setUserData(cachedUserData);
      return;
    }

    // If already fetching, wait for that promise
    if (isFetching) {
      return;
    }

    isFetching = true;

    const fetchUserData = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, full_name, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user data:', error);
          const fallbackData = {
            id: user.id,
            full_name: user.user_metadata?.full_name || 'User',
            avatar_url: null
          };
          cachedUserData = fallbackData;
          setUserData(fallbackData);
        } else if (data) {
          cachedUserData = data;
          setUserData(data);
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
        const fallbackData = {
          id: user.id,
          full_name: user.user_metadata?.full_name || 'User',
          avatar_url: null
        };
        cachedUserData = fallbackData;
        setUserData(fallbackData);
      } finally {
        isFetching = false;
      }
    };

    fetchUserData();
  }, [user, userData]);

  // Separate useEffect for realtime subscription
  useEffect(() => {
    if (!user) return;

    // Set up realtime subscription for user data changes
    const channel = supabase
      .channel('user_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'users', filter: `id=eq.${user.id}` },
        (payload) => {
          if (payload.new) {
            const newData = {
              full_name: payload.new.full_name,
              avatar_url: payload.new.avatar_url
            };
            cachedUserData = newData; // Update cache
            setUserData(newData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Get user initials from full name
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  // Generate a consistent color based on user ID
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

  const menuItems = [
    {
      id: 'overview',
      label: 'Overview',
      path: '/dashboard',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <polyline points="9 22 9 12 15 12 15 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      id: 'expenses',
      label: 'Expenses',
      path: '/expenses',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="2" y1="10" x2="22" y2="10" stroke="currentColor" strokeWidth="2"/>
        </svg>
      )
    },
    {
      id: 'budgets',
      label: 'Budgets',
      path: '/budgets',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="4" y="4" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
          <line x1="7" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="7" y1="10" x2="10" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="11" y1="10" x2="13" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="7" y1="13" x2="10" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <line x1="11" y1="13" x2="13" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <ellipse cx="18" cy="16" rx="3.5" ry="2.5" stroke="currentColor" strokeWidth="2"/>
          <path d="M18 13.5c1.933 0 3.5 1.119 3.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M14.5 16c0 1.381 1.567 2.5 3.5 2.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 'balances',
      label: 'Balances',
      path: '/balances',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 'groups',
      label: 'Groups',
      path: '/groups',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      id: 'settings',
      label: 'Settings',
      path: '/settings',
      icon: (
        <svg width="20" height="20" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z" fill="currentColor"/>
        </svg>
      )
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Overlay when expanded */}
      {isMobileExpanded && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsMobileExpanded(false)}
        />
      )}

      {/* Sidebar - Collapsed on mobile, full on desktop */}
      <div
        onClick={() => {
          if (window.innerWidth < 1024) {
            setIsMobileExpanded(!isMobileExpanded);
          }
        }}
        className={`${isMobileExpanded ? 'w-48' : 'w-20'} lg:w-64 h-screen fixed left-0 top-0 shadow-2xl flex flex-col z-40 transition-all duration-300`}
        style={{
          background: isDarkMode
            ? 'rgba(0, 0, 0, 0.3)'
            : 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(12px)',
          border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)',
          borderRight: !isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'
        }}
      >
      {/* Logo/App Name */}
      <div className={`p-6 flex ${isMobileExpanded ? 'justify-start' : 'justify-center'} lg:justify-start`}>
        <h1 className="text-2xl lg:text-3xl font-bold font-serif" style={{ color: '#FF5E00' }}>
          <span className={`${isMobileExpanded ? 'inline' : 'hidden'} lg:inline`}>Divvy</span>
          <span className={`${isMobileExpanded ? 'hidden' : 'inline'} lg:hidden`}>D</span>
        </h1>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-2 lg:p-4">
        <ul className="space-y-1 lg:space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(item.path);
                  setIsMobileExpanded(false);
                }}
                className={`w-full flex items-center ${isMobileExpanded ? 'justify-start' : 'justify-center'} lg:justify-start px-3 lg:px-5 py-3 lg:py-3.5 transition-all relative group ${
                  isDarkMode
                    ? 'hover:bg-white hover:bg-opacity-10'
                    : 'hover:bg-gray-50'
                }`}
                style={{
                  borderRadius: '12px'
                }}
              >
                <div
                  className={`transition-colors ${
                    isActive(item.path)
                      ? isDarkMode ? 'text-white' : 'text-gray-900'
                      : isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}
                >
                  {item.icon}
                </div>
                <span
                  className={`${isMobileExpanded ? 'inline' : 'hidden'} lg:inline font-semibold text-base transition-colors ml-3 ${
                    isActive(item.path)
                      ? isDarkMode ? 'text-white' : 'text-gray-900'
                      : isDarkMode ? 'text-gray-200' : 'text-gray-600'
                  }`}
                >
                  {item.label}
                </span>
                {/* Active indicator - dot on mobile collapsed */}
                <div
                  className="lg:hidden absolute -left-1 w-1 h-6 rounded-r transition-opacity duration-300"
                  style={{
                    backgroundColor: '#FF5E00',
                    opacity: (isActive(item.path) && !isMobileExpanded) ? 1 : 0
                  }}
                />
                {/* Underline animation - desktop */}
                <div
                  className="hidden lg:block absolute bottom-2 left-5 right-5 h-0.5 transition-transform duration-300 ease-out"
                  style={{
                    backgroundColor: '#FF5E00',
                    transform: isActive(item.path) ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left'
                  }}
                />
                {/* Underline for expanded mobile */}
                <div
                  className="lg:hidden absolute bottom-2 left-5 right-5 h-0.5 transition-transform duration-300 ease-out"
                  style={{
                    backgroundColor: '#FF5E00',
                    transform: (isActive(item.path) && isMobileExpanded) ? 'scaleX(1)' : 'scaleX(0)',
                    transformOrigin: 'left'
                  }}
                />
              </button>
            </li>
          ))}
        </ul>

        {/* Dark Mode Toggle */}
        <div className={`mt-4 lg:mt-6 px-2 lg:px-5 py-3 flex items-center ${isMobileExpanded ? 'justify-start space-x-3' : 'justify-center'} lg:justify-start lg:space-x-3`}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsDarkMode(!isDarkMode);
            }}
            className={`${isMobileExpanded ? 'hidden' : 'block'} lg:hidden p-2 rounded-lg transition-colors`}
            style={{
              background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isDarkMode ? (
                <path
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                  fill={isDarkMode ? '#9ca3af' : '#4b5563'}
                />
              ) : (
                <>
                  <circle cx="12" cy="12" r="4" fill="#4b5563" />
                  <path
                    d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                    stroke="#4b5563"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </>
              )}
            </svg>
          </button>
          <div className={`${isMobileExpanded ? 'flex' : 'hidden'} lg:flex items-center space-x-3`}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isDarkMode ? (
                <path
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
                  fill={isDarkMode ? '#9ca3af' : '#4b5563'}
                />
              ) : (
                <>
                  <circle cx="12" cy="12" r="4" fill="#4b5563" />
                  <path
                    d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
                    stroke="#4b5563"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </>
              )}
            </svg>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsDarkMode(!isDarkMode);
              }}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                isDarkMode ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 lg:p-6 mt-auto">
        <div className={`flex items-center ${isMobileExpanded ? 'justify-start space-x-3' : 'justify-center'} lg:justify-start lg:space-x-3 px-0 lg:px-2 py-2`}>
          {userData?.avatar_url ? (
            <img
              key={userData.avatar_url}
              src={userData.avatar_url}
              alt="Profile"
              className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover shadow-lg transition-opacity duration-150"
              loading="eager"
              style={{ opacity: userData ? 1 : 0 }}
            />
          ) : (
            <div className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full flex items-center justify-center font-bold text-base lg:text-lg bg-gradient-to-br ${getAvatarColor(user?.id)} shadow-lg transition-opacity duration-150`} style={{ color: 'white', opacity: userData ? 1 : 0 }}>
              {getInitials(userData?.full_name || user?.user_metadata?.full_name)}
            </div>
          )}
          <div className={`${isMobileExpanded ? 'block' : 'hidden'} lg:block`}>
            <p className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {userData?.full_name || user?.user_metadata?.full_name || 'User'}
            </p>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              View profile
            </p>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default Sidebar;
