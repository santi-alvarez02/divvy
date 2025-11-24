# Exchange Rate Update Mechanism

## Overview
Divvy uses a client-side polling mechanism to ensure exchange rates are kept up-to-date while the application is in use. This ensures accurate currency conversion for expenses and balances without requiring a dedicated backend server process.

## Update Frequency
*   **Interval**: Every 8 hours (3 times per day).
*   **Trigger**: Client-side check running every 1 minute.

## Implementation Details

### 1. The Watchdog (`Expenses.jsx`)
A `setInterval` runs every 60 seconds in the main `Expenses` component.
```javascript
const intervalId = setInterval(() => {
  shouldUpdateRates().then(needsUpdate => {
    if (needsUpdate) {
      // Trigger update...
    }
  });
}, 60000);
```

### 2. The Check (`exchangeRates.js`)
The `shouldUpdateRates` function compares the current time with the `updated_at` timestamp from the database.
*   If `Current Time - Last Update Time >= 8 hours`, it returns `true`.
*   This check is lightweight and does not consume API quota.

### 3. The Update Action
When an update is triggered:
1.  **Fetch**: Calls the Vercel serverless function (`/api/exchange-rates`) to get fresh rates.
2.  **Save**: Stores the new rates in the Supabase `exchange_rates` table.
3.  **Refresh**: Updates the local React state to reflect the new rates immediately.

## Why This Approach?
*   **Efficiency**: No API calls are made unless the 8-hour window has passed.
*   **Simplicity**: Uses standard React hooks and browser APIs; no complex cron jobs or external schedulers required.
*   **Reliability**: Guarantees fresh rates even if the user leaves the tab open for days.
