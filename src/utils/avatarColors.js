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
    'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)', // violet to pink
    'linear-gradient(135deg, #38bdf8 0%, #06b6d4 100%)', // sky to cyan
    'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)', // emerald to teal
    'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', // amber to yellow
    'linear-gradient(135deg, #f472b6 0%, #ec4899 100%)', // pink to rose
    'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)', // indigo to violet
    'linear-gradient(135deg, #14b8a6 0%, #06b6d4 100%)', // teal to cyan
    'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', // orange to deep orange
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
    'from-violet-400 to-pink-400',
    'from-sky-400 to-cyan-400',
    'from-emerald-400 to-teal-400',
    'from-amber-400 to-yellow-400',
    'from-pink-400 to-rose-400',
    'from-indigo-400 to-violet-400',
    'from-teal-400 to-cyan-400',
    'from-orange-500 to-orange-600',
  ];

  // Use user ID to generate a consistent index
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};
