# Divvy Database Migrations

This folder contains all SQL migration files for the Divvy Supabase database.

## Migration Files

### Initial Setup
- `supabase_setup.sql` - Initial database setup
- `create_expenses_tables.sql` - Expenses and splits tables
- `create_settlements_table.sql` - Settlements tracking
- `setup-avatar-storage.sql` - Avatar storage bucket

### Feature Additions
- `add_default_currency_column.sql` - User currency preferences
- `add_group_currency_column.sql` - Group default currency
- `add_monthly_budget_column.sql` - User budget tracking
- `add_invite_code_trigger.sql` - Group invite codes
- `add_settled_up_to_timestamp.sql` - Settlement timestamps
- `add_settlement_dual_currency.sql` - Dual-currency settlements (Session 52)
- `add_recurring_expense_support.sql` - Recurring expenses

### Bug Fixes
- `fix_groups_join.sql` - Group membership fixes
- `fix_groups_rls.sql` - Row Level Security for groups
- `fix_rls_policies.sql` - RLS policy updates
- `fix_rls_policies_v2.sql` - Additional RLS fixes
- `fix_rls_simple.sql` - Simplified RLS policies
- `supabase_fix_policies.sql` - General policy fixes
- `supabase_verify_no_triggers.sql` - Trigger verification

## How to Use

1. **Copy SQL file contents**
2. **Open Supabase Dashboard** → SQL Editor
3. **Paste and run** the SQL
4. **Verify** the changes in the database

## Order of Execution

If setting up from scratch:
1. `supabase_setup.sql`
2. `create_expenses_tables.sql`
3. `create_settlements_table.sql`
4. `setup-avatar-storage.sql`
5. Run feature additions as needed
6. Apply fixes if issues arise

## Notes

- Always backup database before running migrations
- Test migrations on development instance first
- Some migrations may depend on others (check file comments)
- Latest migration: `add_settlement_dual_currency.sql` (Session 52)
