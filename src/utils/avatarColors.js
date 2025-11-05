// Generate a consistent color based on user ID
export const getAvatarColor = (userId) => {
  const colors = [
    'linear-gradient(135deg, #c084fc 0%, #f472b6 100%)', // purple to pink
    'linear-gradient(135deg, #60a5fa 0%, #22d3ee 100%)', // blue to cyan
    'linear-gradient(135deg, #4ade80 0%, #34d399 100%)', // green to emerald
    'linear-gradient(135deg, #facc15 0%, #fb923c 100%)', // yellow to orange
    'linear-gradient(135deg, #f87171 0%, #fb7185 100%)', // red to rose
    'linear-gradient(135deg, #818cf8 0%, #c084fc 100%)', // indigo to purple
    'linear-gradient(135deg, #2dd4bf 0%, #4ade80 100%)', // teal to green
    'linear-gradient(135deg, #fb923c 0%, #ef4444 100%)', // orange to red
  ];

  // Use user ID to generate a consistent index
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Get Tailwind classes version (for use with className)
export const getAvatarColorClasses = (userId) => {
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
