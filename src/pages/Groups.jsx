import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';

const Groups = ({ isDarkMode, setIsDarkMode, roommates }) => {
  const [groupName, setGroupName] = useState('My Household');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showInviteCode, setShowInviteCode] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [newGroupName, setNewGroupName] = useState('');

  // Mock data - in real app this would come from backend
  const currentUserId = 1; // Current user is "You"
  const groupAdminId = 1; // Mock: current user is the admin
  const inviteCode = 'ABC123'; // Mock invite code
  const isAdmin = currentUserId === groupAdminId;

  // Check if user is in a group (has roommates besides themselves)
  const hasGroup = roommates && roommates.length > 1;

  const handleShowInviteCode = () => {
    setShowInviteCode(true);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    alert('Invite code copied to clipboard!');
  };

  const handleJoinGroup = () => {
    // Placeholder for joining group with code
    console.log('Join group with code:', joinCode);
    alert(`Joining group with code: ${joinCode}`);
    setShowJoinModal(false);
    setJoinCode('');
  };

  const handleCreateGroup = () => {
    // Placeholder for creating group
    console.log('Create group:', newGroupName);
    alert(`Creating group: ${newGroupName}`);
    setShowCreateModal(false);
    setNewGroupName('');
  };

  const handleLeaveGroup = () => {
    // Placeholder for leaving group
    console.log('Leave group');
    setShowLeaveConfirm(false);
    alert('Leave group functionality coming soon!');
  };

  const handleRemoveMember = (roommateId) => {
    // Placeholder for removing member
    console.log('Remove member:', roommateId);
    alert('Remove member functionality coming soon!');
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
            Groups
          </h1>
        </div>

        {hasGroup ? (
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

            {/* Members Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Members
                </h3>
                {isAdmin && (
                  <button
                    onClick={handleShowInviteCode}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: '#FF5E00' }}
                  >
                    Show Invite Code
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {roommates.map((roommate) => (
                  <div
                    key={roommate.id}
                    className="flex items-center gap-4 p-4 rounded-2xl"
                    style={{
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                    }}
                  >
                    {/* Color Avatar */}
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${roommate.color}`}
                    >
                      {roommate.name.charAt(0)}
                    </div>

                    {/* Name */}
                    <div className="flex-1">
                      <p className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {roommate.name}
                        {roommate.name === 'You' && (
                          <span className={`ml-2 text-sm font-normal ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            (You)
                          </span>
                        )}
                        {isAdmin && roommate.id === groupAdminId && (
                          <span className={`ml-2 text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-orange-500/20 text-orange-400' : 'bg-orange-500/10 text-orange-600'}`}>
                            Admin
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Remove button (only for admin, not for current user) */}
                    {isAdmin && roommate.name !== 'You' && (
                      <button
                        onClick={() => handleRemoveMember(roommate.id)}
                        className={`text-sm font-medium ${isDarkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'} transition-colors`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
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
                Choose a name for your group
              </p>
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., My Household"
                className="w-full px-4 py-3 rounded-xl font-medium mb-6 outline-none"
                style={{
                  background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.6)',
                  border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'white' : '#1f2937'
                }}
              />
              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewGroupName('');
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
