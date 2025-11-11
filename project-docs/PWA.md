# Divvy PWA Implementation Plan

## Session 53: Convert Divvy to Progressive Web App (PWA)

**Date**: 2025-11-11
**Status**: ✅ COMPLETED

---

## ✅ Implementation Complete!

All PWA features have been successfully implemented:

- ✅ Web App Manifest with app metadata
- ✅ Service Worker for offline support
- ✅ Offline detection banner
- ✅ Custom install prompt
- ✅ PWA meta tags and icons
- ✅ Build successfully tested

**Next Steps**:
1. Deploy to Vercel (with environment variables)
2. Test installation on iPhone
3. See `PWA_TESTING.md` for comprehensive testing guide

---

## Overview

Convert Divvy into an installable Progressive Web App (PWA) that can be installed on mobile devices while maintaining its online-only nature. The app requires internet connection for API calls (currency conversion, Supabase), so the PWA will cache UI assets only and show clear offline messaging.

---

## Current Architecture

- **Framework**: React (Vite)
- **Database**: Supabase (PostgreSQL)
- **APIs**: External currency conversion API
- **Hosting**: TBD (likely Vercel/Netlify)
- **Dependencies**: Internet connection required

---

## PWA Implementation Strategy

### Phase 1: Manifest & Icons (30 min)
Create app manifest and generate icons for installation

### Phase 2: Service Worker (45 min)
Implement caching strategy for UI assets only

### Phase 3: Offline Detection (30 min)
Add user feedback for offline state

### Phase 4: Install Prompt (30 min)
Create install banner for mobile users

### Phase 5: Testing & Verification (30 min)
Test PWA functionality and installation

**Total Estimated Time**: ~3 hours

---

## Detailed Implementation Plan

### Phase 1: Manifest & Icons

#### 1.1 Create `/public/manifest.json`
```json
{
  "name": "Divvy - Split Expenses with Roommates",
  "short_name": "Divvy",
  "description": "Split expenses with roommates, track budgets, and manage group finances effortlessly",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FF5E00",
  "theme_color": "#FF5E00",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/screenshot-1.png",
      "sizes": "1170x2532",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/screenshot-2.png",
      "sizes": "1170x2532",
      "type": "image/png",
      "form_factor": "narrow"
    }
  ],
  "categories": ["finance", "productivity"],
  "prefer_related_applications": false
}
```

#### 1.2 Create Icon Placeholders
**Folder**: `/public/icons/`

Create placeholder icons for now (user will need to replace with actual designs):
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

**Design specs:**
- Orange background (#FF5E00)
- White "D" or "Divvy" text
- Simple, recognizable design
- Maskable safe zone (80% content area)

#### 1.3 Create Apple Touch Icons
**For iOS compatibility:**
- `/public/apple-touch-icon.png` (180x180)
- `/public/apple-touch-icon-precomposed.png` (180x180)

---

### Phase 2: Service Worker Setup

#### 2.1 Create `/public/service-worker.js`

**Strategy**: Cache-first for static assets, network-only for API calls

```javascript
const CACHE_NAME = 'divvy-v1';
const STATIC_CACHE = 'divvy-static-v1';

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Vite generates these dynamically, so we'll cache them on fetch
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip caching for:
  // 1. Supabase API calls
  // 2. External APIs (currency conversion)
  // 3. Chrome extensions
  if (
    url.origin.includes('supabase.co') ||
    url.origin.includes('exchangeratesapi.io') ||
    url.origin.includes('apilayer.com') ||
    url.protocol === 'chrome-extension:' ||
    request.method !== 'GET'
  ) {
    // Network only - don't cache API responses
    event.respondWith(fetch(request));
    return;
  }

  // For static assets: cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(request).then((response) => {
        // Don't cache if not successful
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }

        // Clone the response
        const responseToCache = response.clone();

        // Cache the fetched response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    })
  );
});

// Message event - for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

#### 2.2 Register Service Worker in `/src/main.jsx`

Add after React render:

```javascript
// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('Service Worker registered:', registration);

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
```

---

### Phase 3: Offline Detection & Feedback

#### 3.1 Create `/src/components/OfflineBanner.jsx`

```jsx
import React, { useState, useEffect } from 'react';

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Keep banner visible for 2 seconds to show "Back online" message
      setTimeout(() => setShowBanner(false), 2000);
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
      className="fixed top-0 left-0 right-0 z-[9999] px-4 py-3 text-center font-semibold shadow-lg"
      style={{
        backgroundColor: isOnline ? '#10b981' : '#FF5E00',
        color: 'white'
      }}
    >
      {isOnline ? (
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Back online</span>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span>No internet connection - Divvy requires internet to function</span>
        </div>
      )}
    </div>
  );
};

export default OfflineBanner;
```

#### 3.2 Add OfflineBanner to `/src/App.jsx`

```jsx
import OfflineBanner from './components/OfflineBanner';

// In the return statement, add at the top:
<>
  <OfflineBanner />
  {/* Rest of app */}
</>
```

#### 3.3 Create Online Check Hook `/src/hooks/useOnlineStatus.js`

```javascript
import { useState, useEffect } from 'react';

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
```

**Usage in components** (optional - can disable actions when offline):
```javascript
import { useOnlineStatus } from '../hooks/useOnlineStatus';

const MyComponent = () => {
  const isOnline = useOnlineStatus();

  const handleAddExpense = () => {
    if (!isOnline) {
      alert('Internet connection required to add expenses');
      return;
    }
    // ... rest of logic
  };
};
```

---

### Phase 4: Install Prompt

#### 4.1 Create `/src/components/InstallPrompt.jsx`

```jsx
import React, { useState, useEffect } from 'react';

const InstallPrompt = ({ isDarkMode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches;
    if (isInstalled) return;

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem('install-prompt-dismissed');
    if (dismissed) return;

    const handleBeforeInstallPrompt = (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install prompt
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    console.log(`User response to the install prompt: ${outcome}`);

    // Clear the deferredPrompt
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 rounded-2xl shadow-2xl p-4 z-50 border"
      style={{
        background: isDarkMode ? '#2d2d2d' : '#ffffff',
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
      }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl flex-shrink-0"
          style={{ backgroundColor: '#FF5E00', color: 'white' }}
        >
          D
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className={`font-bold text-base mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Install Divvy
          </h3>
          <p className={`text-sm mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Install Divvy on your home screen for quick access
          </p>

          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ backgroundColor: '#FF5E00' }}
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                isDarkMode ? 'bg-white/10 text-white' : 'bg-black/5 text-gray-900'
              }`}
            >
              Not now
            </button>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className={`text-xl font-light hover:opacity-70 transition-opacity ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;
```

#### 4.2 Add InstallPrompt to `/src/App.jsx`

```jsx
import InstallPrompt from './components/InstallPrompt';

// In the return statement:
<>
  <OfflineBanner />
  <InstallPrompt isDarkMode={isDarkMode} />
  {/* Rest of app */}
</>
```

---

### Phase 5: Update HTML & Meta Tags

#### 5.1 Update `/index.html`

Add in `<head>`:

```html
<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Theme color -->
<meta name="theme-color" content="#FF5E00">

<!-- Mobile optimization -->
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Divvy">

<!-- Apple Touch Icons -->
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- Favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-192x192.png">
<link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-192x192.png">

<!-- Description for SEO and app stores -->
<meta name="description" content="Split expenses with roommates, track budgets, and manage group finances effortlessly">

<!-- Open Graph / Social Media -->
<meta property="og:type" content="website">
<meta property="og:title" content="Divvy - Split Expenses with Roommates">
<meta property="og:description" content="Split expenses with roommates, track budgets, and manage group finances effortlessly">
<meta property="og:image" content="/icons/icon-512x512.png">

<!-- Twitter -->
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="Divvy - Split Expenses with Roommates">
<meta name="twitter:description" content="Split expenses with roommates, track budgets, and manage group finances effortlessly">
<meta name="twitter:image" content="/icons/icon-512x512.png">
```

---

## Testing Plan

### Local Testing

1. **Build the app:**
   ```bash
   npm run build
   npm run preview
   ```

2. **Test service worker:**
   - Open DevTools > Application > Service Workers
   - Verify service worker is registered
   - Check "Update on reload" during development

3. **Test offline mode:**
   - Open DevTools > Network
   - Select "Offline" from throttling dropdown
   - Verify offline banner appears
   - Verify UI still loads (cached assets)
   - Verify API calls fail gracefully

4. **Test manifest:**
   - Open DevTools > Application > Manifest
   - Verify all fields are correct
   - Check icons are loading

### Mobile Testing (Android)

1. **Deploy to HTTPS hosting** (required for PWA)
   - Vercel, Netlify, or similar

2. **Open in Chrome on Android:**
   - Navigate to the deployed URL
   - Look for "Install app" banner
   - Or: Menu > "Add to Home Screen"

3. **Test installed app:**
   - Tap the icon on home screen
   - Verify it opens in standalone mode (no browser UI)
   - Test offline behavior

### Mobile Testing (iOS)

1. **Open in Safari on iOS:**
   - Navigate to the deployed URL
   - Tap Share button
   - Tap "Add to Home Screen"

2. **Test installed app:**
   - Tap the icon on home screen
   - Verify it opens in standalone mode
   - Test offline behavior

**Note**: iOS has limited PWA support compared to Android

---

## Deployment Checklist

### Before Deployment:

- [ ] Create all icon files (72x72 to 512x512)
- [ ] Create Apple touch icon (180x180)
- [ ] Create screenshots for app stores (1170x2532)
- [ ] Test service worker registration
- [ ] Test offline detection
- [ ] Test install prompt
- [ ] Verify manifest.json is accessible

### During Deployment:

- [ ] Deploy to HTTPS hosting (Vercel/Netlify)
- [ ] Verify service worker works on production URL
- [ ] Test installation on Android device
- [ ] Test installation on iOS device
- [ ] Verify offline banner works
- [ ] Test cache invalidation (update service worker version)

### After Deployment:

- [ ] Add PWA to Google Play Store (optional, via TWA)
- [ ] Add PWA to Apple App Store (limited support)
- [ ] Monitor service worker errors
- [ ] Track installation metrics

---

## User Installation Instructions

### Android (Chrome, Edge, Samsung Internet)

1. **Automatic Prompt:**
   - Open Divvy in browser
   - Look for "Install app" prompt at bottom
   - Tap "Install"

2. **Manual Installation:**
   - Open Divvy in Chrome
   - Tap menu (⋮) in top right
   - Tap "Install app" or "Add to Home Screen"
   - Tap "Install" or "Add"

3. **Launch:**
   - Find "Divvy" icon on home screen
   - Tap to launch

### iOS (Safari)

1. **Manual Installation (Safari only):**
   - Open Divvy in Safari
   - Tap Share button (square with arrow)
   - Scroll down and tap "Add to Home Screen"
   - Edit name if desired
   - Tap "Add"

2. **Launch:**
   - Find "Divvy" icon on home screen
   - Tap to launch

**Note**: On iOS, PWA installation only works in Safari, not Chrome or other browsers.

---

## Maintenance & Updates

### Updating the Service Worker

When you make changes to the app:

1. Update `CACHE_NAME` version in service-worker.js:
   ```javascript
   const CACHE_NAME = 'divvy-v2'; // Increment version
   ```

2. Service worker will automatically update on next visit

3. Show update notification to users (optional):
   ```javascript
   // In service worker
   self.addEventListener('message', (event) => {
     if (event.data === 'SKIP_WAITING') {
       self.skipWaiting();
     }
   });

   // In app
   navigator.serviceWorker.addEventListener('controllerchange', () => {
     window.location.reload();
   });
   ```

### Cache Size Management

Service worker will cache:
- HTML, CSS, JS files (~2-5 MB)
- Images, fonts (~1-2 MB)
- Icons (~500 KB)

**Total estimated cache**: ~5-10 MB

Monitor cache size in production and clear old caches periodically.

---

## Limitations & Known Issues

### General Limitations:
1. **Requires Internet**: App won't function offline due to API dependencies
2. **Cache Size**: Limited by browser cache quotas
3. **iOS Limitations**: Safari has limited PWA support (no push notifications, limited background sync)

### Browser Support:
- ✅ Chrome/Edge (Android): Full support
- ✅ Safari (iOS): Partial support (no install prompt, limited features)
- ✅ Samsung Internet: Full support
- ⚠️ Firefox: Limited support

### Known Issues:
1. iOS Safari doesn't show install prompt - users must manually add to home screen
2. iOS PWAs lose state when closed for extended periods
3. Service worker doesn't update immediately - requires page refresh

---

## Benefits After Implementation

1. **Installation**: Users can install Divvy like a native app
2. **Faster Loading**: Cached UI loads instantly
3. **Offline Awareness**: Clear feedback when connection is lost
4. **App-like Experience**: Standalone mode removes browser UI
5. **Home Screen Icon**: Easy access from device home screen
6. **Engagement**: Installed apps have higher engagement rates

---

## Next Steps After PWA Implementation

1. **Analytics**: Track PWA install rates and usage
2. **Push Notifications**: Add for expense reminders (requires backend changes)
3. **Background Sync**: Queue actions when offline, sync when online
4. **App Store Submission**: Submit to Google Play via TWA (Trusted Web Activity)
5. **Performance**: Further optimize bundle size and loading

---

## Files to Create/Modify

### New Files:
- `/public/manifest.json`
- `/public/service-worker.js`
- `/public/icons/icon-*.png` (8 sizes)
- `/public/apple-touch-icon.png`
- `/src/components/OfflineBanner.jsx`
- `/src/components/InstallPrompt.jsx`
- `/src/hooks/useOnlineStatus.js`

### Files to Modify:
- `/index.html` (add meta tags and manifest link)
- `/src/main.jsx` (register service worker)
- `/src/App.jsx` (add OfflineBanner and InstallPrompt)

### Total Files: 13 new/modified files

---

## Estimated Timeline

- **Phase 1** (Manifest & Icons): 30 minutes
- **Phase 2** (Service Worker): 45 minutes
- **Phase 3** (Offline Detection): 30 minutes
- **Phase 4** (Install Prompt): 30 minutes
- **Phase 5** (Testing): 30 minutes
- **Icon Creation**: 1-2 hours (if designing from scratch)

**Total**: 3-4 hours

---

## Questions Before Starting

1. **Icon Design**: Do you have a logo/icon design, or should we create a simple placeholder?
2. **Screenshots**: Should we create app screenshots for the manifest?
3. **Testing Devices**: Do you have Android and iOS devices for testing?
4. **Hosting**: Where will you deploy (Vercel, Netlify, other)?

---

## Ready to Implement?

Once you approve this plan, I will:
1. Create all necessary files
2. Implement service worker
3. Add offline detection
4. Add install prompt
5. Update index.html with meta tags
6. Create placeholder icons
7. Provide testing instructions

**Please review and let me know if you want to proceed or if you'd like any changes to the plan!**
