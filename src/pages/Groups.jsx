import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getCurrencySymbol } from '../utils/currency';

const Groups = ({ isDarkMode, setIsDarkMode }) => {
  const { user } = useAuth();

  // State for database data
  const [groups, setGroups] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // UI state
  const [groupName, setGroupName] = useState('');
  const [groupCurrency, setGroupCurrency] = useState('USD');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCurrency, setNewGroupCurrency] = useState('USD');
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const currencyScrollRef = React.useRef(null);

  // Computed values
  const isAdmin = currentGroup?.admin_id === user?.id;
  const inviteCode = currentGroup?.invite_code || '';
  const hasGroup = groups.length > 0;

  // Fetch user's groups on component mount
  useEffect(() => {
    if (user) {
      fetchUserGroups();
    }
  }, [user]);

  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch groups the user is a member of
      const { data: groupMemberships, error: memberError} = await supabase
        .from('group_members')
        .select(`
          group_id,
          role,
          groups (
            id,
            name,
            admin_id,
            invite_code,
            default_currency,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      // Extract groups from memberships
      const userGroups = groupMemberships.map(membership => ({
        ...membership.groups,
        user_role: membership.role
      }));

      setGroups(userGroups);

      // Set current group (for now, just use the first one)
      if (userGroups.length > 0) {
        setCurrentGroup(userGroups[0]);
        setGroupName(userGroups[0].name);
        setGroupCurrency(userGroups[0].default_currency || 'USD');
        // Fetch members for this group
        fetchGroupMembers(userGroups[0].id);
      }
    } catch (err) {
      console.error('Error fetching groups:', err);
      setError('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMembers = async (groupId) => {
    try {
      const { data, error } = await supabase
        .from('group_members')
        .select(`
          id,
          user_id,
          role,
          joined_at,
          users (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .eq('group_id', groupId);

      if (error) throw error;

      setMembers(data);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  // Generate a consistent color based on user ID
  const getAvatarColor = (userId) => {
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

  const handleShowInviteCode = () => {
    setShowInviteCode(true);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
  };

  const handleJoinGroup = async () => {
    try {
      setError('');

      // Find the group with the invite code
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('invite_code', joinCode.trim().toUpperCase())
        .single();

      if (groupError || !groupData) {
        setError('Invalid invite code. Please check and try again.');
        return;
      }

      // Check if user is already a member
      const { data: existingMember, error: checkError } = await supabase
        .from('group_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('group_id', groupData.id)
        .single();

      if (existingMember) {
        setShowJoinModal(false);
        setJoinCode('');
        return;
      }

      // Add the user as a member of the group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'member'
        });

      if (memberError) throw memberError;

      // Update user's account type to 'group' if it's currently 'solo'
      const { error: updateError } = await supabase
        .from('users')
        .update({ account_type: 'group' })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Close modal and reset
      setShowJoinModal(false);
      setJoinCode('');

      // Refresh the groups list
      await fetchUserGroups();
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Failed to join group. Please try again.');
      setShowJoinModal(false);
    }
  };

  const handleCreateGroup = async () => {
    try {
      setError('');

      // Create the group in the database
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: newGroupName.trim(),
          admin_id: user.id,
          default_currency: newGroupCurrency
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add the user as a member of the group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupData.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      // Update user's account type to 'group' if it's currently 'solo'
      const { error: updateError } = await supabase
        .from('users')
        .update({ account_type: 'group' })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Close modal and reset
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupCurrency('USD');

      // Refresh the groups list
      await fetchUserGroups();
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Failed to create group. Please try again.');
      setShowCreateModal(false);
    }
  };

  const handleLeaveGroup = async () => {
    try {
      setError('');

      // Delete the user's membership from the group
      const { error: deleteError } = await supabase
        .from('group_members')
        .delete()
        .eq('user_id', user.id)
        .eq('group_id', currentGroup.id);

      if (deleteError) throw deleteError;

      // Close the modal
      setShowLeaveConfirm(false);

      // Reset state
      setGroups([]);
      setCurrentGroup(null);
      setMembers([]);
      setGroupName('');
    } catch (err) {
      console.error('Error leaving group:', err);
      setError('Failed to leave group. Please try again.');
      setShowLeaveConfirm(false);
    }
  };

  const handleRemoveMember = (roommateId) => {
    // Placeholder for removing member
    console.log('Remove member:', roommateId);
  };

  const handleUpdateCurrency = async (newCurrency) => {
    try {
      setError('');

      // Update the group currency in the database
      const { error: updateError } = await supabase
        .from('groups')
        .update({ default_currency: newCurrency })
        .eq('id', currentGroup.id);

      if (updateError) throw updateError;

      // Update local state
      setGroupCurrency(newCurrency);

      // Refresh groups to get latest data
      await fetchUserGroups();
    } catch (err) {
      console.error('Error updating currency:', err);
      setError('Failed to update currency. Please try again.');
    }
  };

  // Currency picker scroll effect
  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

  React.useEffect(() => {
    if (showCurrencyPicker && currencyScrollRef.current) {
      const selectedIndex = currencies.indexOf(groupCurrency);
      const itemHeight = 40;
      const scrollTop = selectedIndex * itemHeight;
      const scrollContainer = currencyScrollRef.current;

      scrollContainer.scrollTop = scrollTop;

      const handleScroll = () => {
        const currentScrollTop = scrollContainer.scrollTop;
        const highlightedIndex = Math.round(currentScrollTop / itemHeight);

        const items = scrollContainer.querySelectorAll('.currency-filter-item');
        items.forEach((item, index) => {
          if (index === highlightedIndex) {
            item.style.color = isDarkMode ? 'white' : '#1f2937';
            item.style.fontSize = '17px';
            item.style.fontWeight = '600';
          } else {
            item.style.color = '#6b7280';
            item.style.fontSize = '15px';
            item.style.fontWeight = '400';
          }
        });
      };

      scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

      requestAnimationFrame(() => {
        handleScroll();
      });

      return () => {
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }
  }, [showCurrencyPicker, groupCurrency, currencies, isDarkMode]);

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
            Groups
          </h1>
        </div>

        {/* Error Message */}
        {error && (
          <div
            className={`p-4 rounded-lg mb-6 max-w-3xl ${
              isDarkMode ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-700'
            }`}
          >
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div
              className="animate-spin rounded-full h-16 w-16 border-4"
              style={{
                borderColor: 'rgba(255, 94, 0, 0.2)',
                borderTopColor: '#FF5E00'
              }}
            ></div>
          </div>
        ) : hasGroup ? (
          /* In a Group */
          <div
            className="rounded-3xl shadow-xl p-6 sm:p-8 max-w-3xl"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            {/* Header with Invite Code Button */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                {/* Group Name */}
                <div className="mb-6">
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Group Name
                  </label>
                  {isEditingName ? (
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      autoFocus
                      className="text-3xl font-bold bg-transparent border-b-2 border-orange-500 outline-none w-full"
                      style={{ color: isDarkMode ? 'white' : '#1f2937' }}
                    />
                  ) : (
                    <h2
                      className="text-3xl font-bold cursor-pointer hover:opacity-80"
                      style={{ color: isDarkMode ? 'white' : '#1f2937' }}
                      onClick={() => setIsEditingName(true)}
                    >
                      {groupName}
                    </h2>
                  )}
                </div>

                {/* Group Currency */}
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Group Currency <span style={{ color: '#FF5E00' }}>(Edit)</span>
                  </label>
                  <div className="relative" style={{ maxWidth: '200px' }}>
                    <button
                      type="button"
                      onClick={() => setShowCurrencyPicker(!showCurrencyPicker)}
                      className="px-4 rounded-xl font-semibold transition-all outline-none w-full"
                      style={{
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)',
                        color: isDarkMode ? 'white' : '#1f2937',
                        height: '40px',
                        backdropFilter: 'blur(16px)'
                      }}
                    >
                      {getCurrencySymbol(groupCurrency)} {groupCurrency}
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
                            top: '45px',
                            left: '0',
                            right: '0',
                            height: '120px',
                            background: isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.5)',
                            backdropFilter: 'blur(16px)',
                            border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                            zIndex: 1001
                          }}
                        >
                          <div
                            className="absolute inset-x-0 pointer-events-none"
                            style={{
                              top: '40px',
                              height: '40px',
                              background: isDarkMode
                                ? 'linear-gradient(to bottom, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.05) 100%)'
                                : 'linear-gradient(to bottom, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0.02) 100%)',
                              borderTop: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                              borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
                              zIndex: 2
                            }}
                          />
                          <div
                            ref={currencyScrollRef}
                            className="overflow-y-scroll h-full scrollbar-hide"
                            style={{
                              scrollSnapType: 'y mandatory',
                              scrollBehavior: 'smooth'
                            }}
                          >
                            <div
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
                                    handleUpdateCurrency(curr);
                                    setShowCurrencyPicker(false);
                                  }}
                                  className="w-full flex items-center justify-center currency-filter-item"
                                  style={{
                                    height: '40px',
                                    background: 'transparent',
                                    color: '#6b7280',
                                    fontSize: '15px',
                                    fontWeight: '400',
                                    transition: 'color 0.15s ease, font-size 0.15s ease, font-weight 0.15s ease'
                                  }}
                                >
                                  {getCurrencySymbol(curr)} {curr}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={handleShowInviteCode}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#FF5E00' }}
              >
                Show Invite Code
              </button>
            </div>

            {/* Members Section */}
            <div className="mb-8">
              <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Members
              </h3>

              <div className="space-y-3">
                {members.map((member) => {
                  const memberUser = member.users;
                  const isCurrentUser = member.user_id === user.id;
                  const initials = memberUser?.full_name
                    ? memberUser.full_name.split(' ').map(n => n[0]).join('').toUpperCase()
                    : '?';

                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-4 p-4 rounded-2xl"
                      style={{
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                      }}
                    >
                      {/* Avatar */}
                      {memberUser?.avatar_url ? (
                        <img
                          src={memberUser.avatar_url}
                          alt={memberUser.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg bg-gradient-to-br ${getAvatarColor(member.user_id)}`}
                        >
                          {initials}
                        </div>
                      )}

                      {/* Name */}
                      <div className="flex-1">
                        <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {memberUser?.full_name || 'Unknown User'}
                          {isCurrentUser && (
                            <span className={`ml-2 text-sm font-normal ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              (You)
                            </span>
                          )}
                          {member.role === 'admin' && (
                            <span className={`ml-2 text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-500/10 text-orange-600'}`}>
                              Admin
                            </span>
                          )}
                        </p>
                      </div>

                      {/* Remove button (only for admin, not for current user) */}
                      {isAdmin && !isCurrentUser && (
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className={`text-sm font-medium ${isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'} transition-colors`}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Leave Group */}
            <div className="pt-4 border-t" style={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}>
              <button
                onClick={() => setShowLeaveConfirm(true)}
                className="text-red-500 font-semibold hover:opacity-80 transition-opacity"
              >
                Leave Group
              </button>
            </div>
          </div>
        ) : (
          /* Solo Mode - No Group */
          <div
            className="rounded-3xl shadow-xl p-12 max-w-2xl mx-auto text-center"
            style={{
              background: isDarkMode
                ? 'rgba(0, 0, 0, 0.3)'
                : 'rgba(255, 255, 255, 0.4)',
              backdropFilter: 'blur(12px)',
              border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <div className="text-6xl mb-6">👥</div>
            <h2 className={`text-3xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              You're Tracking Expenses Solo
            </h2>
            <p className={`text-lg mb-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Create a group to split expenses with roommates or join an existing one
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-8 py-4 rounded-2xl text-lg font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: '#FF5E00' }}
              >
                Create a Group
              </button>
              <button
                onClick={() => setShowJoinModal(true)}
                className="px-8 py-4 rounded-2xl text-lg font-semibold transition-all"
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(16px)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'white' : '#1f2937'
                }}
              >
                Join a Group
              </button>
            </div>
          </div>
        )}

        {/* Leave Group Confirmation Modal */}
        {showLeaveConfirm && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowLeaveConfirm(false)}
          >
            <div
              className="rounded-3xl shadow-2xl p-8 max-w-md w-full"
              style={{
                background: isDarkMode
                  ? 'rgba(0, 0, 0, 0.4)'
                  : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(16px)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Leave Group?
              </h3>
              <p className={`text-base mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Are you sure you want to leave "{groupName}"? You won't be able to see shared expenses anymore.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowLeaveConfirm(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(16px)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? 'white' : '#1f2937'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleLeaveGroup}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  Leave Group
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Code Modal */}
        {showInviteCode && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowInviteCode(false)}
          >
            <div
              className="rounded-3xl shadow-2xl p-8 max-w-md w-full"
              style={{
                background: isDarkMode
                  ? 'rgba(0, 0, 0, 0.4)'
                  : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(16px)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Invite Code
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Share this code with someone to add them to your group
              </p>
              <div
                className="text-center p-6 rounded-2xl mb-6"
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)'
                }}
              >
                <p className="text-4xl font-bold tracking-widest" style={{ color: '#FF5E00' }}>
                  {inviteCode}
                </p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowInviteCode(false)}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(16px)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? 'white' : '#1f2937'
                  }}
                >
                  Close
                </button>
                <button
                  onClick={handleCopyCode}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: '#FF5E00' }}
                >
                  Copy Code
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Join Group Modal */}
        {showJoinModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowJoinModal(false)}
          >
            <div
              className="rounded-3xl shadow-2xl p-8 max-w-md w-full"
              style={{
                background: isDarkMode
                  ? 'rgba(0, 0, 0, 0.4)'
                  : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(16px)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Join a Group
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Enter the invite code to join an existing group
              </p>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="Enter code"
                className="w-full px-4 py-3 rounded-xl font-bold text-center text-2xl tracking-widest mb-6 outline-none"
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'white' : '#1f2937'
                }}
                maxLength={6}
              />
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowJoinModal(false);
                    setJoinCode('');
                  }}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(16px)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? 'white' : '#1f2937'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleJoinGroup}
                  disabled={joinCode.length === 0}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#FF5E00' }}
                >
                  Join Group
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Group Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setShowCreateModal(false)}
          >
            <div
              className="rounded-3xl shadow-2xl p-8 max-w-md w-full"
              style={{
                background: isDarkMode
                  ? 'rgba(0, 0, 0, 0.4)'
                  : 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(16px)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(255, 255, 255, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Create a Group
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Choose a name and currency for your group
              </p>

              {/* Group Name */}
              <div className="mb-4">
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Group Name
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="e.g., My Household"
                  className="w-full px-4 py-3 rounded-xl font-medium outline-none"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? 'white' : '#1f2937'
                  }}
                />
              </div>

              {/* Group Currency */}
              <div className="mb-6">
                <label className={`block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Currency
                </label>
                <select
                  value={newGroupCurrency}
                  onChange={(e) => setNewGroupCurrency(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl font-semibold outline-none"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? 'white' : '#1f2937'
                  }}
                >
                  <option value="USD">$ USD - US Dollar</option>
                  <option value="EUR">€ EUR - Euro</option>
                  <option value="GBP">£ GBP - British Pound</option>
                  <option value="CAD">C$ CAD - Canadian Dollar</option>
                  <option value="AUD">A$ AUD - Australian Dollar</option>
                </select>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewGroupName('');
                    setNewGroupCurrency('USD');
                  }}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold transition-all"
                  style={{
                    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                    backdropFilter: 'blur(16px)',
                    border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                    color: isDarkMode ? 'white' : '#1f2937'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateGroup}
                  disabled={newGroupName.trim().length === 0}
                  className="flex-1 px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: '#FF5E00' }}
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Groups;
