import { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

// Hook to manage PWA install prompt
export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      setDeferredPrompt(null);
      setCanInstall(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) {
      return false;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted install');
    }

    setDeferredPrompt(null);
    setCanInstall(false);
    return outcome === 'accepted';
  };

  return { canInstall, install };
}

// Standalone install button component (used in GetStarted page)
export function InstallButton({ className = '', style = {}, isDarkMode = false }) {
  const { canInstall, install } = usePWAInstall();

  if (!canInstall) return null;

  return (
    <button
      onClick={install}
      className={`px-12 py-4 rounded-full text-xl font-semibold transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-3 justify-center backdrop-blur-md border ${className}`}
      style={{
        background: isDarkMode
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(255, 255, 255, 0.4)',
        border: isDarkMode
          ? '2px solid rgba(255, 255, 255, 0.2)'
          : '2px solid rgba(255, 94, 0, 0.2)',
        color: isDarkMode ? '#fff' : '#FF5E00',
        boxShadow: isDarkMode
          ? '0 10px 30px rgba(0, 0, 0, 0.3)'
          : '0 10px 30px rgba(255, 94, 0, 0.15)',
        ...style
      }}
    >
      <Download size={24} />
      Install App
    </button>
  );
}

// Default export - empty component (no floating card)
export default function InstallPrompt() {
  return null;
}
