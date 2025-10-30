import React from 'react';
import { useNavigate } from 'react-router-dom';

const GetStarted = ({ isDarkMode }) => {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: isDarkMode
          ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
          : '#f5f5f5'
      }}
    >
      {/* Orange gradient bubbles - matching app style */}
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

      {/* Main Content */}
      <div className="max-w-2xl mx-auto text-center relative z-10">
        {/* Heading */}
        <h1
          className="text-6xl md:text-8xl font-bold mb-12"
          style={{ color: '#FF5E00' }}
        >
          Divvy
        </h1>

        {/* Description */}
        <p
          className={`text-xl md:text-2xl mb-16 max-w-xl mx-auto leading-relaxed ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}
        >
          Track shared expenses with roommates and friends effortlessly.
        </p>

        {/* Get Started Button */}
        <button
          onClick={() => navigate('/login')}
          className="px-12 py-4 rounded-full text-xl font-semibold text-white transition-all hover:scale-105 active:scale-95 shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #FF5E00 0%, #FF8C42 100%)',
            boxShadow: '0 10px 30px rgba(255, 94, 0, 0.4)'
          }}
        >
          Get Started
        </button>
      </div>
    </div>
  );
};

export default GetStarted;
