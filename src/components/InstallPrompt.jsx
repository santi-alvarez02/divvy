import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed or installed
    const isDismissed = localStorage.getItem('pwa-install-dismissed');
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;

    if (isDismissed || isInstalled) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default mini-infobar
      e.preventDefault();

      // Save the event for later use
      setDeferredPrompt(e);

      // Show install prompt after a short delay (better UX)
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000); // Show after 3 seconds
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed successfully');
      setDeferredPrompt(null);
      setShowPrompt(false);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;
    console.log('[PWA] User response to install prompt:', outcome);

    if (outcome === 'accepted') {
      console.log('[PWA] User accepted the install prompt');
    } else {
      console.log('[PWA] User dismissed the install prompt');
    }

    // Clear the saved prompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);

    // Remember dismissal for 7 days
    const dismissedUntil = Date.now() + (7 * 24 * 60 * 60 * 1000);
    localStorage.setItem('pwa-install-dismissed', dismissedUntil.toString());
  };

  // Check if dismissal has expired
  useEffect(() => {
    const checkDismissal = () => {
      const dismissedUntil = localStorage.getItem('pwa-install-dismissed');
      if (dismissedUntil && Date.now() > parseInt(dismissedUntil)) {
        localStorage.removeItem('pwa-install-dismissed');
      }
    };

    checkDismissal();
  }, []);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Download size={20} />
            <span className="font-semibold">Install Divvy</span>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white hover:bg-white/20 rounded p-1 transition-colors"
            aria-label="Dismiss"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-gray-700 text-sm mb-4">
            Install Divvy on your device for quick access and a better experience.
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleInstallClick}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Not Now
            </button>
          </div>

          {/* Features list */}
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-emerald-500">✓</span>
              <span>Works like a native app</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-emerald-500">✓</span>
              <span>Quick access from home screen</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="text-emerald-500">✓</span>
              <span>No app store needed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
