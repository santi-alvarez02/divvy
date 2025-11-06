# Database Migrations

## How to Run Migrations

### Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project: https://bfxkozuebuaciocsssjd.supabase.co
2. Navigate to **SQL Editor** in the left sidebar
3. Click **+ New query**
4. Open `001_add_currency_support.sql` in your code editor
5. Copy the entire contents
6. Paste into the Supabase SQL Editor
7. Click **Run** (or press Cmd/Ctrl + Enter)
8. Verify success: You should see "Success. No rows returned"

### Verify Migration Success

After running the migration, test it with these queries:

```sql
-- Check if exchange_rates table exists
SELECT * FROM exchange_rates LIMIT 5;

-- Check if currency column was added to expenses
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'expenses' AND column_name = 'currency';

-- Test the upsert function
SELECT upsert_exchange_rate('USD', 'EUR', 0.93);

-- Verify the rate was inserted/updated
SELECT * FROM exchange_rates WHERE from_currency = 'USD' AND to_currency = 'EUR';
```

## Migration Files

### 001_add_currency_support.sql

**What it does:**
- Adds `currency` column to `expenses` table (stores original currency of expense)
- Creates `exchange_rates` table for caching daily rates
- Sets up Row Level Security (RLS) policies
- Creates `upsert_exchange_rate()` function for easy rate updates
- Inserts initial default rates for 10 major currencies

**After running this migration:**
- All new expenses will have a currency (defaults to USD)
- Exchange rates can be cached in database
- Frontend can fetch rates and convert amounts

## Next Steps After Migration

1. **Test API key:** Run this in your browser console (on localhost:5173):
   ```javascript
   fetch('https://v6.exchangerate-api.com/v6/2ba4f7c396e6abe9bd9e9e17/latest/USD')
     .then(r => r.json())
     .then(d => console.log('API Test:', d));
   ```

2. **Test utility functions:** Create a test page or use console:
   ```javascript
   import { updateExchangeRates, getExchangeRatesFromDB, convertCurrency } from './utils/exchangeRates';

   // Update rates
   await updateExchangeRates();

   // Get rates
   const { rates } = await getExchangeRatesFromDB();
   console.log('Rates:', rates);

   // Convert $100 USD to EUR
   const converted = convertCurrency(100, 'USD', 'EUR', rates);
   console.log('$100 USD =', converted, 'EUR');
   ```

3. **Update Add Expense Modal** to include currency dropdown

4. **Update display logic** to convert amounts based on user's currency

## Troubleshooting

**Error: "relation exchange_rates already exists"**
- The table already exists. You can skip creating it or drop it first:
  ```sql
  DROP TABLE IF EXISTS exchange_rates CASCADE;
  ```

**Error: "column currency already exists"**
- The column was already added. Safe to ignore or use:
  ```sql
  ALTER TABLE expenses DROP COLUMN IF EXISTS currency;
  ```

**RLS Policy errors**
- Drop existing policies first:
  ```sql
  DROP POLICY IF EXISTS "Anyone can view exchange rates" ON exchange_rates;
  DROP POLICY IF EXISTS "Service role can insert rates" ON exchange_rates;
  DROP POLICY IF EXISTS "Service role can update rates" ON exchange_rates;
  ```
