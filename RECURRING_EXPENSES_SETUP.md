# Recurring Expenses Setup Guide

## Session 48: Automatic Recurring Expenses

This guide explains how to set up and use the automatic recurring expenses feature in Divvy.

---

## Overview

Recurring expenses are **fully automatic**:
- ✅ No separate page or manual processing required
- ✅ Automatically creates new expense instances each month
- ✅ Runs silently when you visit the Expenses page
- ✅ Recurring templates show an orange "Recurring" badge

---

## Step 1: Run Database Migration

**IMPORTANT**: You must run this SQL migration in your Supabase SQL Editor before using recurring expenses.

1. Open your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the following SQL:

```sql
-- Add is_recurring column to expenses table
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;

-- Add last_recurring_date to track when this expense was last auto-created
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS last_recurring_date DATE;

-- Add index for efficient querying of recurring expenses
CREATE INDEX IF NOT EXISTS idx_expenses_recurring
ON expenses(is_recurring, last_recurring_date)
WHERE is_recurring = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN expenses.is_recurring IS 'Whether this expense should automatically recur every month';
COMMENT ON COLUMN expenses.last_recurring_date IS 'The last date this recurring expense was automatically created';
```

4. Click "Run" to execute the migration

**Alternative**: The migration file is saved at:
`supabase/migrations/002_add_recurring_expense_support.sql`

---

## Step 2: Using Recurring Expenses

### Creating a Recurring Expense

1. Navigate to the Expenses page
2. Click "+ Add Expense"
3. Fill in the expense details:
   - Description (e.g., "Netflix Subscription")
   - Amount (e.g., 15.99)
   - Category (e.g., "Entertainment")
   - Currency
   - Split settings
4. **Check the "Recurring Expense" checkbox**
5. Click "Add Expense"

The expense will be created with:
- `is_recurring = true`
- `last_recurring_date` set to today
- An orange "Recurring" badge will appear on this expense

### How Automatic Processing Works

**No action required!** The system handles everything automatically:

1. **When you visit the Expenses page**:
   - System checks all recurring expenses in your group
   - Compares `last_recurring_date` with current month/year
   - If different month: Creates new expense instance automatically
   - If same month: Skips (already processed)

2. **What gets created**:
   - New expense with today's date
   - Same amount, category, and description
   - Same split configuration
   - NOT marked as recurring (it's an instance, not a template)

3. **Result**:
   - New expense appears in your list automatically
   - Original template stays with "Recurring" badge
   - `last_recurring_date` updated to prevent duplicates

### Visual Indicators

- **Recurring Templates**: Show orange "Recurring" badge
- **Monthly Instances**: Appear as normal expenses (no badge)
- Both are visible in the Expenses page

### Key Features

✅ **Fully Automatic**: No buttons to click, no pages to visit
✅ **Smart Duplicate Prevention**: Won't create duplicates even if you reload the page
✅ **Preserves Split Configuration**: All split participants and amounts carry over
✅ **Currency Support**: Works with all supported currencies
✅ **Silent Operation**: Runs in background, doesn't interrupt your workflow
✅ **Error Resilient**: If processing fails, it won't break the Expenses page

---

## Technical Details

### Database Schema Changes

```sql
expenses table:
  - is_recurring: BOOLEAN DEFAULT FALSE
  - last_recurring_date: DATE (nullable)
```

### Processing Logic

1. **On Expenses page load** (`fetchExpenses()` function):
   - Calls `processRecurringExpenses(groupId)` in background
   - Doesn't block loading of expenses

2. **Processing function**:
   - Fetches all expenses with `is_recurring = true`
   - For each expense:
     - Check if `last_recurring_date` month/year matches current month/year
     - If yes: Skip (already processed this month)
     - If no: Create new expense instance
   - New instance:
     - Uses today's date
     - Copies all fields except `is_recurring` (set to false)
     - Creates matching expense_splits
   - Update original's `last_recurring_date` to today

3. **Error handling**:
   - Runs with `.catch()` so errors don't break page load
   - Logs errors to console
   - Continues with normal expense fetching

### Files Modified

1. **Database**:
   - `/supabase/migrations/002_add_recurring_expense_support.sql` - Migration
   - `/add_recurring_expense_support.sql` - Standalone version

2. **Frontend**:
   - `/src/components/AddExpenseModal.jsx` - Saves `is_recurring` flag
   - `/src/utils/recurringExpenses.js` - Processing utility function
   - `/src/pages/Expenses.jsx` - Auto-processing integration & UI badge

---

## Future Enhancements (Optional)

Consider implementing these features in future sessions:

1. **Edit Recurring Templates**: Allow users to modify the original recurring expense
2. **Delete Recurring**: Option to stop future recurrences
3. **Custom Frequencies**: Support weekly, bi-weekly, quarterly, etc.
4. **Parent-Child Tracking**: Add `parent_expense_id` to link instances to templates
5. **Notification**: Toast message when new recurring expenses are auto-created
6. **Recurring Badge on Instances**: Show "(from Recurring)" on auto-created expenses

---

## Troubleshooting

**Issue**: Recurring expenses not being created
**Solution**: Make sure you ran the SQL migration in Step 1. Check browser console for errors.

**Issue**: Duplicate expenses created
**Solution**: This shouldn't happen due to `last_recurring_date` checking. If it does, there may be a timezone issue. Report it as a bug.

**Issue**: Orange "Recurring" badge not showing
**Solution**: The badge only shows on the ORIGINAL template expense, not on the monthly instances.

---

## Ready to Use!

The recurring expenses feature is now fully functional. Users can:
- ✅ Mark expenses as recurring when creating them
- ✅ Have monthly instances automatically created (no action required)
- ✅ See recurring templates with an orange "Recurring" badge
- ✅ All processing happens automatically in the background

Enjoy automatic recurring expense management! 🎉
