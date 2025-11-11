# Divvy App - Development Session 52

## Session 52: Fix Settlement Currency Display Bug

**Date**: 2025-11-11

### Objective

Fix the settlement currency display bug where receivers see the wrong currency amount. When a payer (e.g., Santiago with USD) marks a settlement as paid to a receiver (e.g., Liam with EUR), the receiver was seeing the amount in the payer's currency instead of their own currency.

---

### Problem Description

**User Report:**
- Liam Fisher (EUR account) sees "Santiago Alvarez owes you +€53.44" in Active Balances
- But in Settlements section: "Santiago Alvarez paid you €61.98" (wrong amount)
- The €61.98 is actually $61.98 converted from Santiago's USD perspective

**Root Cause:**
- Settlements table only stored a single `amount` field
- This amount was calculated from the payer's perspective
- When displayed to the receiver, it showed the payer's currency amount, not the receiver's

**Example:**
- Santiago (USD) owes Liam (EUR) €53.44
- In Santiago's USD perspective, this is $61.98
- Settlement was created with amount = 61.98
- Liam sees "paid you $61.98" (converted to €61.98) instead of €53.44

---

### Solution Implemented: Dual-Currency Settlement Storage

**Approach:** Store both payer's and receiver's amounts/currencies in the settlement record.

This ensures:
1. Each user sees the amount in their own currency
2. The amount matches their Active Balances
3. No confusion about conversion rates
4. Historical accuracy for both parties

---

### Files Modified

#### 1. Database Schema Migration

**File:** `/add_settlement_dual_currency.sql` (NEW)

**Changes:**
- Added 4 new columns to settlements table:
  - `from_amount DECIMAL(10, 2)`: Amount in payer's currency
  - `from_currency VARCHAR(3)`: Payer's currency code (e.g., 'USD')
  - `to_amount DECIMAL(10, 2)`: Amount in receiver's currency
  - `to_currency VARCHAR(3)`: Receiver's currency code (e.g., 'EUR')
- Added check constraints to ensure positive amounts
- Created migration function to update existing settlements
- Old `amount` column kept for backwards compatibility

**SQL Migration:**
```sql
ALTER TABLE settlements
ADD COLUMN IF NOT EXISTS from_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS from_currency VARCHAR(3),
ADD COLUMN IF NOT EXISTS to_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS to_currency VARCHAR(3);
```

---

#### 2. Settlement Creation Logic

**File:** `/src/pages/Balances.jsx:375-462`

**Function:** `handleMarkAsPaid(roommateId, amount)`

**Changes:**
1. Fetch receiver's default currency from database
2. Convert settlement amount from payer's currency to receiver's currency using exchange rates
3. Store both perspectives in the settlement record

**Key Code:**
```javascript
// Get receiver's currency
const { data: receiverData } = await supabase
  .from('users')
  .select('default_currency')
  .eq('id', roommateId)
  .single();

const receiverCurrency = receiverData?.default_currency || 'USD';

// Convert amount to receiver's currency
const receiverAmount = userCurrency === receiverCurrency
  ? amount
  : convertCurrency(amount, userCurrency, receiverCurrency, exchangeRates);

// Insert settlement with both perspectives
const { data } = await supabase
  .from('settlements')
  .insert({
    group_id: currentGroup.id,
    from_user_id: currentUserId,
    to_user_id: roommateId,
    amount: amount, // Keep for backwards compatibility
    from_amount: amount,
    from_currency: userCurrency,
    to_amount: receiverAmount,
    to_currency: receiverCurrency,
    status: 'pending',
    settled_up_to_timestamp: mostRecentExpenseDate
  });
```

---

#### 3. Settlement Display Logic - Pending Settlements (Received)

**File:** `/src/pages/Balances.jsx:959-1036`

**Section:** Payments to confirm (received by current user)

**Changes:**
- Use `to_amount` and `to_currency` for receiver's perspective
- Fallback to old `amount` field for backwards compatibility

```javascript
{receivedSettlements.map((settlement) => {
  // Use receiver's perspective
  const displayAmount = settlement.to_amount || settlement.amount;
  const displayCurrency = settlement.to_currency || userCurrency;

  return (
    <div>
      <p>{getUserName(settlement.from_user_id)} paid you</p>
      <p>{getCurrencySymbol(displayCurrency)}{displayAmount.toFixed(2)}</p>
    </div>
  );
})}
```

---

#### 4. Settlement Display Logic - Pending Settlements (Sent)

**File:** `/src/pages/Balances.jsx:1038-1065`

**Section:** Payments sent (waiting for confirmation)

**Changes:**
- Use `from_amount` and `from_currency` for payer's perspective
- Shows the amount the payer actually sent

```javascript
{sentSettlements.map((settlement) => {
  // Use payer's perspective
  const displayAmount = settlement.from_amount || settlement.amount;
  const displayCurrency = settlement.from_currency || userCurrency;

  return (
    <div>
      <p>Waiting for {getUserName(settlement.to_user_id)} to confirm</p>
      <p>{getCurrencySymbol(displayCurrency)}{displayAmount.toFixed(2)}</p>
    </div>
  );
})}
```

---

#### 5. Settlement History Display

**File:** `/src/pages/Balances.jsx:1328-1372`

**Section:** Settlement History list view

**Changes:**
- Determine user perspective (payer or receiver)
- Display appropriate amount and currency based on perspective

```javascript
{filteredHistory.map((settlement) => {
  const isPayer = settlement.from_user_id === currentUserId;
  const displayAmount = isPayer
    ? (settlement.from_amount || settlement.amount)
    : (settlement.to_amount || settlement.amount);
  const displayCurrency = isPayer
    ? (settlement.from_currency || userCurrency)
    : (settlement.to_currency || userCurrency);

  return (
    <div>
      <p>{isPayer ? `You paid ${getUserName(settlement.to_user_id)}` : `${getUserName(settlement.from_user_id)} paid you`}</p>
      <p>{getCurrencySymbol(displayCurrency)}{displayAmount.toFixed(2)}</p>
    </div>
  );
})}
```

---

#### 6. Settlement History Detail View

**File:** `/src/pages/Balances.jsx:1157-1173`

**Section:** Selected settlement detail header

**Changes:**
- Same perspective-based logic as history list
- Shows correct amount when viewing settlement details

```javascript
{(() => {
  const isPayer = selectedSettlement.from_user_id === currentUserId;
  const displayAmount = isPayer
    ? (selectedSettlement.from_amount || selectedSettlement.amount)
    : (selectedSettlement.to_amount || selectedSettlement.amount);
  const displayCurrency = isPayer
    ? (selectedSettlement.from_currency || userCurrency)
    : (selectedSettlement.to_currency || userCurrency);
  return `${getCurrencySymbol(displayCurrency)}${displayAmount.toFixed(2)}`;
})()}
```

---

### Technical Details

**Currency Conversion:**
- Uses existing `convertCurrency()` utility function
- Leverages cached exchange rates from the database
- Skips conversion when currencies match (avoids floating-point errors)

**Backwards Compatibility:**
- Old settlements without dual-currency data fall back to `amount` field
- Migration function available to update existing settlements
- No breaking changes to existing functionality

**User Experience:**
- Payer sees: amount they sent in their currency
- Receiver sees: amount they received in their currency
- Both amounts reflect the same debt, just in different currencies
- Matches the Active Balances display

---

### Example Scenarios

#### Scenario 1: USD Payer → EUR Receiver
```
Santiago (USD) owes Liam (EUR):
- Active Balance shows: "Santiago owes you €53.44"
- Santiago marks as paid: $61.98 (his perspective)
- Settlement stored:
  - from_amount: 61.98, from_currency: 'USD'
  - to_amount: 53.44, to_currency: 'EUR'
- Santiago sees: "Waiting for Liam to confirm $61.98"
- Liam sees: "Santiago paid you €53.44" ✅ CORRECT
```

#### Scenario 2: EUR Payer → USD Receiver
```
Liam (EUR) owes Santiago (USD):
- Active Balance shows: "Liam owes you $61.98"
- Liam marks as paid: €53.44 (his perspective)
- Settlement stored:
  - from_amount: 53.44, from_currency: 'EUR'
  - to_amount: 61.98, to_currency: 'USD'
- Liam sees: "Waiting for Santiago to confirm €53.44"
- Santiago sees: "Liam paid you $61.98" ✅ CORRECT
```

---

### Testing Instructions

1. **Run Database Migration:**
   ```sql
   -- In Supabase SQL Editor:
   -- Execute the contents of add_settlement_dual_currency.sql
   ```

2. **Test Settlement Creation:**
   - Login as User A (e.g., USD account)
   - Navigate to Balances page
   - Mark a settlement as paid to User B (e.g., EUR account)
   - Verify settlement is created with both currencies

3. **Test Settlement Display (Payer Perspective):**
   - As User A, check "Settlements" section
   - Should show "Waiting for [User B] to confirm" with USD amount
   - Amount should match what you marked as paid

4. **Test Settlement Display (Receiver Perspective):**
   - Login as User B (EUR account)
   - Navigate to Balances page
   - Should show "[User A] paid you" with EUR amount
   - Amount should match the Active Balances amount
   - Accept the settlement

5. **Test Settlement History:**
   - Both users should see correct amounts in their currencies
   - Amounts should match their respective perspectives

---

### Benefits

1. **Accuracy**: Each user sees the exact amount they expect in their currency
2. **Clarity**: No confusion about currency conversions
3. **Consistency**: Settlements match Active Balances
4. **Historical Record**: Both perspectives preserved for auditing
5. **International Support**: Better multi-currency support

---

### Future Enhancements

1. **Exchange Rate Display**: Show conversion rate used at time of settlement
2. **Currency Mismatch Warning**: Alert users when paying in different currency
3. **Settlement Notes**: Allow users to add notes explaining conversion
4. **Batch Settlements**: Support settling multiple debts at once with proper conversions

---

### Related Sessions

- **Session 50**: Worked on settlement bugs (context from session summary)
- **Session 51**: Fixed Total Spent calculation to match across pages
- **Session 52**: Fixed settlement currency display bug (this session)

---

### Summary

Successfully implemented dual-currency settlement storage to fix the currency display bug. Now when users mark settlements as paid, both the payer and receiver see the correct amount in their own currency, matching their Active Balances display. This improves the user experience significantly for multi-currency groups.

**Status**: ✅ Implementation Complete - Ready for Testing
