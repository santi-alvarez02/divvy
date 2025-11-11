# Divvy Deployment Instructions

## Prerequisites

1. Vercel account (free tier works)
2. New Exchange Rate API key from https://exchangeratesapi.io/
3. Git repository connected to Vercel

## Environment Variables Setup

### Local Development (.env.local)

Your `.env.local` file should contain:

```bash
# Supabase Configuration (Client-side - Safe to expose)
VITE_SUPABASE_URL=https://bfxkozuebuaciocsssjd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# DO NOT add EXCHANGERATESAPI_KEY here
# The API key should only be in Vercel environment variables
```

### Vercel Environment Variables

You need to add the following environment variables in Vercel:

1. Go to your Vercel project
2. Navigate to **Settings** → **Environment Variables**
3. Add the following variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://bfxkozuebuaciocsssjd.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Production, Preview, Development |
| `EXCHANGERATESAPI_KEY` | Your new API key | Production, Preview, Development |

**Important Notes:**
- `EXCHANGERATESAPI_KEY` does NOT have the `VITE_` prefix (server-side only)
- All three environments should have the same values
- Never commit API keys to git

## Deployment Steps

### Step 1: Add Environment Variables to Vercel

1. Log in to [Vercel](https://vercel.com)
2. Select your Divvy project
3. Go to **Settings** → **Environment Variables**
4. Add `EXCHANGERATESAPI_KEY` with your new API key
5. Select all three environments: Production, Preview, Development
6. Click **Save**

### Step 2: Deploy to Vercel

If your repository is already connected to Vercel, deployment is automatic:

```bash
# Commit your changes
git add .
git commit -m "Secure API key in serverless function"
git push origin main
```

Vercel will automatically:
- Detect the push
- Build your application
- Deploy the serverless function in `/api/exchange-rates.js`
- Make environment variables available to the serverless function

If you haven't connected your repository yet:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your Git repository
4. Configure project:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Add environment variables (see Step 1)
6. Click **Deploy**

### Step 3: Verify Deployment

After deployment, verify that everything works:

1. Open your production URL (e.g., `https://divvy.vercel.app`)
2. Log in to your account
3. Go to **Dashboard** or **Expenses** page
4. Check browser DevTools Console for errors
5. Verify exchange rates are loading:
   - Create an expense in a foreign currency
   - Check that conversion works correctly
   - Verify no API key is visible in Network tab

**Testing Exchange Rates:**
1. Open browser DevTools → Network tab
2. Filter by "exchange-rates"
3. You should see a request to `/api/exchange-rates` (NOT to exchangeratesapi.io)
4. Click on the request → Preview
5. Verify you see: `{ "success": true, "rates": {...}, "timestamp": ..., "baseCode": "USD" }`

## Serverless Function Architecture

### How It Works

```
┌─────────────┐        ┌──────────────────┐        ┌─────────────────────┐
│   Browser   │───────▶│ Vercel Serverless│───────▶│ exchangeratesapi.io │
│  (Client)   │        │    Function      │        │   (API Provider)    │
└─────────────┘        └──────────────────┘        └─────────────────────┘
     ↑                          │                            │
     │                          │                            │
     └──────────────────────────┘                            │
           Returns rates                                     │
         (API key hidden)                     API key sent here (secure)
```

### Files Involved

1. **`/api/exchange-rates.js`** - Vercel serverless function
   - Runs on Vercel's edge network (server-side)
   - Has access to `process.env.EXCHANGERATESAPI_KEY`
   - Fetches rates from exchangeratesapi.io
   - Converts EUR-based rates to USD-based
   - Returns sanitized response to client

2. **`/src/utils/exchangeRates.js`** - Client-side utility
   - Calls `/api/exchange-rates` endpoint
   - NO access to API key
   - Processes response and caches rates

### Caching Strategy

- **Server-side cache**: 1 hour (`s-maxage=3600`)
- **Client-side cache**: 24 hours (`stale-while-revalidate=86400`)
- **Database cache**: 8 hours (rates stored in Supabase)

This means:
- API is called at most once per hour
- Users see cached rates for up to 8 hours
- Reduces API costs and improves performance

## Local Development with Vercel CLI

To test the serverless function locally:

### Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

### Step 2: Link Project

```bash
vercel link
```

Follow prompts to link to your Vercel project.

### Step 3: Pull Environment Variables

```bash
vercel env pull .env.local
```

This downloads your Vercel environment variables to `.env.local`.

### Step 4: Run Development Server

```bash
vercel dev
```

This runs:
- Vite dev server on `http://localhost:3000`
- Serverless functions with access to environment variables
- Hot reloading for both client and server code

**Note:** `npm run dev` will NOT work with serverless functions locally. You must use `vercel dev` to test the `/api/exchange-rates` endpoint.

## Troubleshooting

### Issue: "API key not configured" error

**Cause:** `EXCHANGERATESAPI_KEY` not set in Vercel environment variables

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Add `EXCHANGERATESAPI_KEY` with your API key
3. Redeploy: `vercel --prod`

### Issue: Exchange rates not loading

**Symptoms:**
- Console error: "Failed to fetch exchange rates"
- Network tab shows 500 error on `/api/exchange-rates`

**Debug Steps:**
1. Check Vercel Function Logs:
   - Go to your Vercel project
   - Click on **Deployments** → Select latest deployment
   - Click **Functions** tab
   - Find `/api/exchange-rates` function
   - Check logs for errors

2. Verify API key is valid:
   - Test directly: `curl "https://api.exchangeratesapi.io/v1/latest?access_key=YOUR_KEY"`
   - Should return JSON with rates

3. Check Vercel environment variable:
   - Settings → Environment Variables
   - Verify `EXCHANGERATESAPI_KEY` is set for Production
   - Try redeploying after confirming

### Issue: API key visible in browser

**Cause:** API key accidentally added to `.env.local` with `VITE_` prefix

**Fix:**
1. Remove `VITE_EXCHANGERATESAPI_KEY` from `.env.local`
2. Only keep `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
3. API key should ONLY be in Vercel environment variables (no `VITE_` prefix)
4. Rebuild: `npm run build`
5. Check `dist/assets/*.js` files - API key should NOT appear

### Issue: CORS errors

**Symptoms:** Browser console shows CORS policy errors

**Cause:** Vercel serverless function not configured for CORS (rare)

**Fix:** Already handled in `/api/exchange-rates.js` - function returns proper headers

### Issue: Rate limiting / Too many requests

**Symptoms:**
- API returns 429 error
- Function logs show "Too Many Requests"

**Cause:** Free tier API limits exceeded

**Fix:**
1. Check your API usage at https://exchangeratesapi.io/dashboard
2. Upgrade plan if needed
3. Increase database cache duration in `src/utils/exchangeRates.js` (currently 8 hours)

## Security Checklist

Before going to production, verify:

- [ ] `EXCHANGERATESAPI_KEY` is NOT in `.env.local` with `VITE_` prefix
- [ ] New API key added to Vercel environment variables
- [ ] `.env.local` is in `.gitignore` (it is)
- [ ] No API keys committed to git repository
- [ ] Tested exchange rates work in production
- [ ] Checked Network tab - no API key visible in requests
- [ ] Verified `/api/exchange-rates` endpoint returns expected data
- [ ] Function logs show no errors in Vercel dashboard

## Cost Estimates

### Vercel (Free Tier)
- 100 GB bandwidth
- 100 GB-hours serverless function execution
- Unlimited deployments

**Divvy Usage Estimate:**
- API function: ~1-5ms per request
- With caching: ~1-10 requests per hour
- Well within free tier limits

### Exchange Rate API (Free Tier)
- 250 API calls per month
- 1 currency pair

**Divvy Usage Estimate:**
- With 1-hour cache: ~720 API calls per month
- **Recommendation:** Upgrade to Basic plan ($9.99/month for 100,000 requests)

### Supabase (Free Tier)
- 500 MB database
- 50,000 monthly active users
- 2 GB bandwidth

**Divvy Usage Estimate:**
- Current database: <10 MB
- Well within free tier limits

## Monitoring

### Vercel Analytics

Enable Vercel Analytics to monitor:
- Page views
- Serverless function invocations
- Error rates
- Performance metrics

**Setup:**
1. Go to Vercel → Analytics
2. Click **Enable**
3. Free for up to 10,000 events per month

### Function Logs

Monitor serverless function health:
1. Vercel Dashboard → Your Project
2. Click **Functions** tab
3. Select `/api/exchange-rates`
4. View real-time logs and errors

### Uptime Monitoring

Consider free uptime monitoring:
- [UptimeRobot](https://uptimerobot.com) (free for 50 monitors)
- [Pingdom](https://www.pingdom.com) (free trial)
- [Better Uptime](https://betteruptime.com) (free tier)

Monitor:
- Main app URL: `https://your-app.vercel.app`
- API endpoint: `https://your-app.vercel.app/api/exchange-rates`

## Next Steps After Deployment

1. **PWA Implementation** - Convert to Progressive Web App (see `PWA.md`)
2. **Content Security Policy** - Add CSP headers (see `SECURITY_AUDIT_REPORT.md`)
3. **Error Tracking** - Set up Sentry or LogRocket
4. **Rate Limiting** - Add client-side rate limiting for API calls
5. **Testing** - Test on multiple devices (iPhone, Android)

## Support

If you encounter issues:
1. Check Vercel Function Logs first
2. Review Network tab in browser DevTools
3. Verify environment variables are set correctly
4. Test API key with curl command
5. Check Vercel status page: https://www.vercel-status.com/

---

**Last Updated:** 2025-11-11
**Session:** 52 - API Security Fix
