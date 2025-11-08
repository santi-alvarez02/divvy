# Divvy App - Development Sessions 39-45

## Session 39: Fix Settlement History Filter Bug ✅

**Date**: 2025-11-08

### Problem

Settlement history was showing settlements that didn't involve the current user.

**Specific Issue:**
- User: Liam Fisher
- Settlement displayed: "Miguel Lopez paid you $3.33"
- Actual settlement: Santiago Alvarez paid Miguel Lopez $3.33
- Liam Fisher was not involved in this settlement at all

This created confusion and showed incorrect settlement information to users who weren't part of specific transactions.

### Root Cause

The settlement history query was fetching ALL settlements in the group without filtering by user involvement:

**Problematic code:** `src/pages/Balances.jsx:118-131`
```javascript
// Fetch settlements for this group
const { data: settlementsData, error: settlementsError } = await supabase
  .from('settlements')
  .select('*')
  .eq('group_id', groupMemberships.groups.id)
  .order('created_at', { ascending: false });

// Split into pending and completed - NO USER FILTER!
const pending = settlementsData?.filter(s => s.status === 'pending') || [];
const completed = settlementsData?.filter(s => s.status === 'completed') || [];
setPendingSettlements(pending);
setSettlementHistory(completed);
```

This approach filtered by status but not by user involvement, so all group settlements were shown to every member.

### Solution Implemented

Added a filter to only include settlements where the current user is either the payer (`from_user`) or the recipient (`to_user`).

**Fixed code:** `src/pages/Balances.jsx:117-137`

```javascript
// Fetch settlements for this group where current user is involved
const { data: settlementsData, error: settlementsError } = await supabase
  .from('settlements')
  .select('*')
  .eq('group_id', groupMemberships.groups.id)
  .order('created_at', { ascending: false});

if (settlementsError) {
  console.error('Error fetching settlements:', settlementsError);
} else {
  // Filter to only settlements involving the current user
  const userSettlements = settlementsData?.filter(s =>
    s.from_user === user.id || s.to_user === user.id
  ) || [];

  // Split into pending and completed
  const pending = userSettlements.filter(s => s.status === 'pending');
  const completed = userSettlements.filter(s => s.status === 'completed');
  setPendingSettlements(pending);
  setSettlementHistory(completed);
}
```

### Key Changes

1. **Added user involvement filter:**
   - `s.from_user === user.id` - User is the payer
   - `s.to_user === user.id` - User is the recipient
   - Only settlements matching either condition are shown

2. **Two-step filtering:**
   - First: Filter by user involvement (`userSettlements`)
   - Second: Filter by status (pending vs completed)

### Data Flow

**Before (Incorrect):**
```
Database Query
  ↓
All settlements in group (including unrelated ones)
  ↓
Filter by status only
  ↓
Show to user (includes settlements they're not part of) ❌
```

**After (Correct):**
```
Database Query
  ↓
All settlements in group
  ↓
Filter by user involvement (from_user OR to_user)
  ↓
Filter by status
  ↓
Show to user (only their settlements) ✅
```

### Example Scenarios

**Scenario 1: Liam Fisher views Balances page**
- Settlement 1: Liam → Miguel ($10) ✅ Shows (Liam is from_user)
- Settlement 2: Santiago → Liam ($20) ✅ Shows (Liam is to_user)
- Settlement 3: Santiago → Miguel ($3.33) ❌ Hidden (Liam not involved)

**Scenario 2: Miguel Lopez views Balances page**
- Settlement 1: Liam → Miguel ($10) ✅ Shows (Miguel is to_user)
- Settlement 2: Santiago → Liam ($20) ❌ Hidden (Miguel not involved)
- Settlement 3: Santiago → Miguel ($3.33) ✅ Shows (Miguel is to_user)

### Testing

**Test Cases:**
- ✅ User only sees settlements where they are the payer
- ✅ User only sees settlements where they are the recipient
- ✅ User does NOT see settlements between other group members
- ✅ Pending settlements filtered correctly
- ✅ Completed settlements (history) filtered correctly

**Example from Production:**
- Liam Fisher's Balances page previously showed: "Miguel Lopez paid you $3.33"
- After fix: Settlement removed from Liam's view
- Santiago and Miguel still see this settlement correctly

### Files Modified

**`/Users/santiagoalvarez/Documents/ai_projects/Divvy/src/pages/Balances.jsx`**
- Lines 117-137: Added user involvement filter to settlement query

### Key Learnings

1. **Data Privacy:** Users should only see settlements they're directly involved in
2. **Filter Order Matters:** Filter by user involvement BEFORE filtering by status
3. **Two-party Transactions:** Always check both `from_user` and `to_user` when filtering settlements
4. **Group Context:** Being in a group doesn't mean you should see all group transactions

---
