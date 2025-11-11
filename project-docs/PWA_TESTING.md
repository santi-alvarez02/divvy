# PWA Testing Guide

## Overview

Divvy has been converted to a Progressive Web App (PWA). This guide explains how to test all PWA features on different devices and browsers.

## What's Implemented

### ✅ Core PWA Features

1. **Web App Manifest** - App metadata for installation
2. **Service Worker** - Offline support and caching
3. **Offline Detection** - Banner showing connection status
4. **Install Prompt** - Custom install UI for users
5. **App Icons** - Various sizes for different devices
6. **Meta Tags** - Mobile optimization and theme colors

### ✅ Caching Strategy

- **UI Assets**: Cached for offline viewing
- **API Calls**: Network-only (requires internet)
- **Navigation**: Falls back to offline page when no connection

## Testing Locally

### Option 1: Using Vercel CLI (Recommended)

Service workers only work in production or with HTTPS. Vercel CLI provides a local dev environment that simulates production:

```bash
# Install Vercel CLI (if not installed)
npm install -g vercel

# Start development server
vercel dev
```

This will start the app on `http://localhost:3000` with service worker support.

### Option 2: Preview Production Build

```bash
# Build the app
npm run build

# Serve the production build
npx serve -s dist -l 3000
```

Then open `http://localhost:3000` in your browser.

## Testing on Desktop

### Chrome/Edge (Chromium)

1. **Open DevTools** → `Application` tab
2. **Check Manifest**:
   - Go to `Manifest` section
   - Verify name: "Divvy - Split Bills & Share Expenses"
   - Verify icons are loading
   - Click icons to see different sizes

3. **Check Service Worker**:
   - Go to `Service Workers` section
   - Verify service worker is registered
   - Status should be "activated and running"
   - Test update: Click "Update" to trigger update check

4. **Test Offline Mode**:
   - Check `Offline` checkbox in DevTools
   - Navigate pages - should show offline page
   - Uncheck `Offline` - banner should say "You're back online"

5. **Test Installation**:
   - Look for install icon in address bar (⊕ or install button)
   - Click to install
   - App should open in standalone window
   - Check if it appears in your app launcher

6. **Test Cache**:
   - Go to `Cache Storage` section
   - Verify `divvy-v1` cache exists
   - Expand to see cached files

### Firefox

1. **Open DevTools** → `Storage` tab
2. **Service Workers**:
   - Check registration status
   - Verify worker is running

3. **Manifest**:
   - View in `about:debugging#/runtime/this-firefox`
   - Look for Divvy in installed web apps

4. **Offline Test**:
   - File → Work Offline
   - Navigate - should show offline page

### Safari (macOS)

1. **Enable Developer Menu**: Safari → Preferences → Advanced → Show Develop menu
2. **Service Workers**:
   - Develop → Service Workers
   - Find Divvy worker

3. **Offline Test**:
   - Develop → Network Throttling → Offline
   - Test navigation

## Testing on iPhone

### Prerequisites
- iPhone running iOS 14.0 or later
- Safari browser
- Access to your deployed Vercel URL

### Installation Steps

1. **Deploy to Vercel first** (PWA features don't work on `localhost` from iPhone)

2. **Open Safari** on iPhone

3. **Navigate to your Vercel URL** (e.g., `https://divvy.vercel.app`)

4. **Install the App**:
   - Tap the **Share** button (⬆️) in Safari toolbar
   - Scroll down and tap **"Add to Home Screen"**
   - Edit name if desired (should show "Divvy")
   - Tap **"Add"** in top right

5. **Verify Installation**:
   - Exit Safari
   - Find Divvy icon on home screen
   - Tap to open - should open as standalone app (no Safari UI)
   - Check splash screen appears during launch

### Testing PWA Features on iPhone

#### Test 1: Standalone Mode
- ✓ No Safari address bar or navigation buttons
- ✓ Status bar matches theme color (#10b981 - emerald green)
- ✓ Splash screen shows on launch

#### Test 2: Offline Detection
- Open Divvy app
- Enable Airplane Mode
- Red banner should appear: "You're offline - Divvy requires internet to sync"
- Disable Airplane Mode
- Green banner should appear: "You're back online" (for 3 seconds)

#### Test 3: Navigation
- Try navigating to different pages while online - should work normally
- Enable Airplane Mode
- Try navigating to new page - should show offline page
- Offline page should explain why internet is needed

#### Test 4: Background Behavior
- Use app normally
- Press home button (minimize app)
- Wait 30 seconds
- Reopen app - should resume where you left off
- State should be preserved

#### Test 5: Updates
- After new deployment
- Close app completely (swipe up from app switcher)
- Reopen app
- Should download new version automatically
- May show update prompt

### Common Issues on iPhone

**Issue: Icons not showing**
- Solution: Clear Safari cache, reinstall app
- Settings → Safari → Clear History and Website Data

**Issue: App opens in Safari instead of standalone**
- Solution: Delete from home screen, reinstall via "Add to Home Screen"

**Issue: Offline banner not showing**
- Solution: Make sure app is updated, try force-closing and reopening

**Issue: Can't add to home screen**
- Check iOS version (needs 14.0+)
- Make sure using Safari (not Chrome or Firefox)
- Verify HTTPS connection

## Testing on Android

### Chrome on Android

1. **Open Chrome** on Android device

2. **Navigate to deployed URL** (e.g., `https://divvy.vercel.app`)

3. **Install Prompt**:
   - Custom install prompt should appear after 3 seconds
   - Shows "Install Divvy" card at bottom
   - Tap "Install" to add to home screen
   - OR use Chrome menu → "Install app"

4. **Verify Installation**:
   - App icon appears in app drawer
   - Open app - should launch in standalone mode
   - No browser UI visible

5. **Test Features**:
   - Same tests as iPhone (offline, navigation, etc.)

## Testing Checklist

Use this checklist to verify all PWA features:

### Pre-Deployment (Local Testing)

- [ ] Run `vercel dev` successfully
- [ ] Service worker registers without errors
- [ ] Manifest loads correctly
- [ ] All icons load (check DevTools → Application → Manifest)
- [ ] Offline page displays when disconnected
- [ ] Online/offline banner works
- [ ] Install prompt appears (if applicable in dev)

### Post-Deployment (Production Testing)

#### Desktop (Chrome/Edge)
- [ ] Service worker registers and activates
- [ ] Manifest is valid (no errors in DevTools)
- [ ] All 8 icon sizes load correctly
- [ ] Install icon appears in address bar
- [ ] Can install as desktop app
- [ ] Offline mode shows offline page
- [ ] Online/offline banner toggles correctly
- [ ] Cache storage contains expected files

#### iPhone (Safari)
- [ ] "Add to Home Screen" option available
- [ ] App name shows as "Divvy"
- [ ] Icon appears correctly on home screen
- [ ] App launches in standalone mode (no Safari UI)
- [ ] Status bar matches theme color (#10b981)
- [ ] Splash screen shows on launch
- [ ] Offline banner appears in airplane mode
- [ ] Online banner appears when reconnected
- [ ] Offline page shows when navigating offline
- [ ] App icon has no "Safari" badge

#### Android (Chrome)
- [ ] Install prompt appears (custom or browser)
- [ ] App installs to app drawer
- [ ] Launches in standalone mode
- [ ] All features work as expected

### Functional Tests (All Platforms)

- [ ] Login/signup works
- [ ] Dashboard loads correctly
- [ ] Can create expenses
- [ ] Can view balances
- [ ] Settlements work
- [ ] Multi-currency conversion works
- [ ] Notifications work (if applicable)
- [ ] App persists state after minimizing

## Debugging Tips

### Service Worker Not Registering

**Check Console for Errors**:
```javascript
// Open console, look for these messages:
[PWA] Service Worker registered: ...
[PWA] Service Worker registration failed: ...
```

**Common Fixes**:
- Ensure HTTPS or localhost
- Check `public/service-worker.js` exists
- Verify no syntax errors in service worker
- Try hard refresh (Cmd/Ctrl + Shift + R)

### Manifest Not Loading

**Check Network Tab**:
- Look for `/manifest.json` request
- Should return 200 status
- Content-Type should be `application/json`

**Validate Manifest**:
- Chrome DevTools → Application → Manifest
- Check for errors/warnings
- Verify all icon paths are correct

### Icons Not Showing

**Verify Icon Files**:
```bash
# Check icons exist
ls -la public/icons/

# Should show:
icon-72x72.png
icon-96x96.png
icon-128x128.png
icon-144x144.png
icon-152x152.png
icon-192x192.png
icon-384x384.png
icon-512x512.png
```

**Check Icon Paths in Manifest**:
- All paths should start with `/icons/`
- No leading `./` or `public/`

### Install Prompt Not Showing

**Reasons Install Prompt Might Not Appear**:
- Already installed (check home screen)
- Recently dismissed (wait 7 days or clear localStorage)
- Not HTTPS (except localhost)
- Browser doesn't support (Safari doesn't show browser prompt)
- Manifest or service worker not valid

**Force Show Install Prompt** (for testing):
```javascript
// In browser console:
localStorage.removeItem('pwa-install-dismissed');
location.reload();
```

### Offline Banner Not Appearing

**Debug Steps**:
1. Open DevTools Console
2. Toggle offline mode
3. Check for JavaScript errors
4. Verify OfflineBanner component is rendered

**Manual Test**:
```javascript
// In console:
window.dispatchEvent(new Event('offline')); // Should show red banner
window.dispatchEvent(new Event('online'));   // Should show green banner
```

## Performance Optimization

### Lighthouse Audit

1. Open Chrome DevTools → Lighthouse tab
2. Select "Progressive Web App" category
3. Run audit
4. Target scores:
   - PWA: 100/100
   - Performance: 90+/100
   - Best Practices: 95+/100

### Expected Lighthouse PWA Checks

- ✅ Registers a service worker
- ✅ Responds with 200 when offline
- ✅ Has a web app manifest
- ✅ Configured for a custom splash screen
- ✅ Sets a theme color
- ✅ Content sized correctly for viewport
- ✅ Has a `<meta name="viewport">` tag
- ✅ Provides a valid apple-touch-icon

## Troubleshooting by Platform

### iPhone/Safari Issues

**App won't install**:
- Must use Safari (not Chrome, Firefox, etc.)
- Must be on HTTPS domain
- Try clearing Safari cache
- Restart Safari

**Wrong icon showing**:
- Delete app from home screen
- Clear Safari cache
- Re-add to home screen

**Not launching in standalone**:
- Check `apple-mobile-web-app-capable` meta tag
- Verify manifest `display: "standalone"`
- Try reinstalling

### Android/Chrome Issues

**Custom prompt not appearing**:
- Check localStorage hasn't dismissed it
- Verify service worker is registered
- Check manifest is valid

**App installs but won't open**:
- Check for JavaScript errors
- Verify service worker is active
- Try clearing Chrome cache

### Desktop Issues

**Can't install from browser**:
- Check address bar for install icon
- Try Chrome flags: `chrome://flags/#enable-desktop-pwas`
- Verify manifest and service worker

**Service worker updating issues**:
```javascript
// Force update in console:
navigator.serviceWorker.getRegistrations().then(function(registrations) {
  registrations.forEach(function(registration) {
    registration.update();
  });
});
```

## Next Steps After Testing

Once you've verified all features work:

1. ✅ **Deploy to production** - Push to Vercel
2. ✅ **Test on real devices** - iPhone and Android
3. ✅ **Monitor errors** - Check Vercel logs for issues
4. ✅ **Collect feedback** - Ask users about installation experience
5. ✅ **Optimize** - Run Lighthouse audits and improve scores

## Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [web.dev: PWA Checklist](https://web.dev/pwa-checklist/)
- [iOS PWA Guide](https://developer.apple.com/documentation/webkit/progressive_web_apps)
- [Chrome PWA Documentation](https://developer.chrome.com/docs/workbox/)

---

**Last Updated:** 2025-11-11
**Session:** 52 - PWA Implementation
