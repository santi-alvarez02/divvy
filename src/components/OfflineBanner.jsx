import { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);

      // Show "Back online" message briefly
      setShowBanner(true);
      setTimeout(() => {
        setShowBanner(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-3 text-white text-center text-sm font-medium transition-transform duration-300 ${
        isOnline
          ? 'bg-emerald-500'
          : 'bg-red-500'
      }`}
      style={{
        transform: showBanner ? 'translateY(0)' : 'translateY(-100%)'
      }}
    >
      <div className="flex items-center justify-center gap-2">
        {isOnline ? (
          <>
            <Wifi size={18} />
            <span>You're back online</span>
          </>
        ) : (
          <>
            <WifiOff size={18} />
            <span>You're offline - Divvy requires internet to sync</span>
          </>
        )}
      </div>
    </div>
  );
}
