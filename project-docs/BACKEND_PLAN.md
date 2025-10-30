# Divvy Backend Implementation Plan

## Executive Summary

This document outlines the strategic plan for adding backend functionality to Divvy, prioritizing security, clean code, and incremental implementation.

**Recommended Stack:** Supabase + PostgreSQL
**Timeline:** 8-10 weeks
**Philosophy:** Build security in from the start, not as an afterthought

---

## Backend Technology Comparison

### Option 1: Supabase ⭐ **RECOMMENDED**

**What is it:**
- Open-source Firebase alternative
- PostgreSQL database
- Built-in authentication with JWT
- Real-time subscriptions
- RESTful API + GraphQL
- File storage
- Row Level Security (RLS) built-in

**Pros:**
- ✅ **Security by default** - RLS is built into PostgreSQL
- ✅ **Perfect for relational data** - Expense splitting needs joins
- ✅ **Real-time updates** - See when roommates add expenses
- ✅ **Generous free tier** - 500MB DB, 50k monthly active users
- ✅ **Great DX** - Excellent documentation and React SDK
- ✅ **No backend code needed** - Focus on frontend
- ✅ **Built-in auth** - Handles JWT, sessions, password hashing
- ✅ **TypeScript support** - Auto-generated types from schema

**Cons:**
- ⚠️ Vendor lock-in (but can self-host)
- ⚠️ RLS can be complex for beginners
- ⚠️ Limited to PostgreSQL

**Best for:** Apps needing relational data, real-time features, and security

---

### Option 2: Firebase

**What is it:**
- Google's BaaS (Backend as a Service)
- NoSQL Firestore database
- Built-in authentication
- Real-time listeners
- Cloud functions
- File storage

**Pros:**
- ✅ Massive scale
- ✅ Excellent documentation
- ✅ Great mobile SDK
- ✅ Generous free tier

**Cons:**
- ❌ **NoSQL is awkward for expense splitting** - Need lots of queries
- ❌ **Security rules are complex** - Easier to make mistakes
- ❌ No native SQL - Have to denormalize data
- ❌ Limited querying capabilities
- ❌ Vendor lock-in (can't self-host)

**Best for:** Mobile apps, document-based data, simple read/write patterns

---

### Option 3: Custom API (Node.js + PostgreSQL)

**What is it:**
- Express/Fastify REST API
- PostgreSQL database
- Self-hosted or cloud (Railway, Render)
- DIY authentication (Passport.js, JWT)

**Pros:**
- ✅ Complete control
- ✅ No vendor lock-in
- ✅ Can optimize exactly as needed

**Cons:**
- ❌ **Months of setup time** - Build everything from scratch
- ❌ **Security is your responsibility** - Easy to make mistakes
- ❌ Need separate hosting
- ❌ More expensive to scale
- ❌ More moving parts to maintain

**Best for:** Teams with backend expertise, complex custom logic, high scale

---

## Why Supabase is the Best Choice

### 1. Security First
Supabase RLS policies enforce security at the database level:
```sql
-- Users can only see expenses from their groups
CREATE POLICY "Users can see group expenses"
ON expenses FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
);
```

This is **impossible to bypass** from the client. With Firebase, security rules can be complex and error-prone.

### 2. Perfect Data Model Fit
Expense splitting is inherently relational:
- Users belong to Groups (many-to-many)
- Expenses belong to Groups (one-to-many)
- Expenses split between Users (many-to-many)
- Settlements between Users (many-to-many)

PostgreSQL handles this beautifully with foreign keys and joins. NoSQL requires data duplication.

### 3. Real-time is Built-in
```javascript
// Listen for new expenses in your group
supabase
  .from('expenses')
  .on('INSERT', payload => {
    // Update UI when roommate adds expense
  })
  .subscribe();
```

### 4. TypeScript Heaven
Supabase CLI generates TypeScript types from your schema:
```bash
npx supabase gen types typescript --local > src/types/database.ts
```

No more type guessing!

### 5. Developer Experience
```javascript
// Insert expense
const { data, error } = await supabase
  .from('expenses')
  .insert({
    amount: 120.50,
    category: 'Groceries',
    paid_by: userId
  });

// Query with joins
const { data } = await supabase
  .from('expenses')
  .select(`
    *,
    paid_by_user:users(name),
    expense_splits(
      user:users(name),
      share_amount
    )
  `);
```

Clean, readable, type-safe.

---

## Database Schema Design

### Complete Schema with RLS Policies

#### 1. Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Users can only see themselves
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data"
ON users FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
ON users FOR UPDATE
USING (auth.uid() = id);
```

#### 2. Groups Table
```sql
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invite_code VARCHAR(6) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Automatic invite code generation
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.invite_code = UPPER(substring(md5(random()::text) from 1 for 6));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invite_code
BEFORE INSERT ON groups
FOR EACH ROW
EXECUTE FUNCTION generate_invite_code();

-- RLS: Users can only see their groups
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their groups"
ON groups FOR SELECT
USING (
  id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can create groups"
ON groups FOR INSERT
WITH CHECK (auth.uid() = admin_id);

CREATE POLICY "Admins can update their groups"
ON groups FOR UPDATE
USING (auth.uid() = admin_id);

CREATE POLICY "Admins can delete their groups"
ON groups FOR DELETE
USING (auth.uid() = admin_id);
```

#### 3. Group Members Table
```sql
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  color VARCHAR(50) DEFAULT 'bg-blue-500',
  UNIQUE(group_id, user_id)
);

-- RLS: Users can see members of their groups
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group members"
ON group_members FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can join groups"
ON group_members FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
ON group_members FOR DELETE
USING (auth.uid() = user_id);
```

#### 4. Expenses Table
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  category VARCHAR(100) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  icon VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for performance
CREATE INDEX idx_expenses_group ON expenses(group_id);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);

-- RLS: Users can see expenses in their groups
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view group expenses"
ON expenses FOR SELECT
USING (
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Group members can create expenses"
ON expenses FOR INSERT
WITH CHECK (
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own expenses"
ON expenses FOR UPDATE
USING (auth.uid() = paid_by);

CREATE POLICY "Users can delete their own expenses"
ON expenses FOR DELETE
USING (auth.uid() = paid_by);
```

#### 5. Expense Splits Table
```sql
CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  share_amount DECIMAL(10, 2) NOT NULL CHECK (share_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(expense_id, user_id)
);

-- Index for performance
CREATE INDEX idx_splits_expense ON expense_splits(expense_id);
CREATE INDEX idx_splits_user ON expense_splits(user_id);

-- RLS: Users can see splits for expenses they can see
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view relevant splits"
ON expense_splits FOR SELECT
USING (
  expense_id IN (
    SELECT id FROM expenses WHERE group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Group members can create splits"
ON expense_splits FOR INSERT
WITH CHECK (
  expense_id IN (
    SELECT id FROM expenses WHERE group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  )
);
```

#### 6. Settlements Table
```sql
CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  from_user UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  date TIMESTAMPTZ DEFAULT now(),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  payment_method VARCHAR(50),
  notes TEXT,
  completed_at TIMESTAMPTZ
);

-- Index for performance
CREATE INDEX idx_settlements_from ON settlements(from_user);
CREATE INDEX idx_settlements_to ON settlements(to_user);
CREATE INDEX idx_settlements_status ON settlements(status);

-- RLS: Users can see settlements involving them
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their settlements"
ON settlements FOR SELECT
USING (auth.uid() = from_user OR auth.uid() = to_user);

CREATE POLICY "Users can create settlements"
ON settlements FOR INSERT
WITH CHECK (auth.uid() = from_user);

CREATE POLICY "Users can update their settlements"
ON settlements FOR UPDATE
USING (auth.uid() = from_user OR auth.uid() = to_user);
```

#### 7. User Settings Table
```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  venmo_username VARCHAR(100),
  paypal_email VARCHAR(255),
  zelle_email VARCHAR(255),
  theme VARCHAR(10) DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  notification_new_expense BOOLEAN DEFAULT true,
  notification_settlement BOOLEAN DEFAULT true,
  notification_reminder BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Users can only access their own settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
ON user_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON user_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
ON user_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

## Phased Implementation Plan

### **Phase 1: Foundation (Week 1-2)**

#### Goals:
- Set up Supabase project
- Implement authentication
- Create database schema
- Set up RLS policies
- Basic user profile management

#### Tasks:

**Week 1: Setup & Authentication**
1. Create Supabase project
2. Install Supabase client: `npm install @supabase/supabase-js`
3. Add environment variables:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
4. Create `src/lib/supabase.js`:
   ```javascript
   import { createClient } from '@supabase/supabase-js'

   export const supabase = createClient(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_ANON_KEY
   )
   ```

5. Create Auth Context:
   ```javascript
   // src/contexts/AuthContext.jsx
   import { createContext, useContext, useEffect, useState } from 'react';
   import { supabase } from '../lib/supabase';

   const AuthContext = createContext({});

   export const useAuth = () => useContext(AuthContext);

   export const AuthProvider = ({ children }) => {
     const [user, setUser] = useState(null);
     const [loading, setLoading] = useState(true);

     useEffect(() => {
       // Check active session
       supabase.auth.getSession().then(({ data: { session } }) => {
         setUser(session?.user ?? null);
         setLoading(false);
       });

       // Listen for auth changes
       const { data: { subscription } } = supabase.auth.onAuthStateChange(
         (_event, session) => {
           setUser(session?.user ?? null);
         }
       );

       return () => subscription.unsubscribe();
     }, []);

     const value = {
       signUp: (data) => supabase.auth.signUp(data),
       signIn: (data) => supabase.auth.signInWithPassword(data),
       signOut: () => supabase.auth.signOut(),
       user,
     };

     return (
       <AuthContext.Provider value={value}>
         {!loading && children}
       </AuthContext.Provider>
     );
   };
   ```

6. Create Auth pages (Login, Sign Up, Forgot Password)
7. Add protected routes
8. Test authentication flow end-to-end

**Week 2: Database Schema & Users**
1. Create database tables in Supabase SQL editor
2. Set up RLS policies for `users` table
3. Create user profile on signup (database trigger)
4. Build Profile page
5. Implement avatar upload to Supabase Storage:
   ```javascript
   const uploadAvatar = async (file) => {
     const fileExt = file.name.split('.').pop();
     const fileName = `${user.id}.${fileExt}`;
     const { error } = await supabase.storage
       .from('avatars')
       .upload(fileName, file);

     if (error) throw error;

     const { data } = supabase.storage
       .from('avatars')
       .getPublicUrl(fileName);

     return data.publicUrl;
   };
   ```
6. Update user profile functionality
7. Test user CRUD operations

#### Deliverables:
- ✅ Working authentication (signup, login, logout)
- ✅ Protected routes
- ✅ User profiles with avatars
- ✅ RLS policies for users

#### Security Checklist:
- [x] All secrets in .env (never committed)
- [x] RLS enabled on all tables
- [x] Password requirements enforced (8+ chars, complexity)
- [x] Email verification enabled (optional for MVP)
- [x] Session timeouts configured

---

### **Phase 2: Groups (Week 3)**

#### Goals:
- Create and join groups
- Generate invite codes
- Manage group members
- RLS for multi-user access

#### Tasks:
1. Create `groups`, `group_members` tables
2. Set up RLS policies
3. Create hooks:
   ```javascript
   // src/hooks/useGroups.js
   export const useGroups = () => {
     const { user } = useAuth();
     const [groups, setGroups] = useState([]);

     useEffect(() => {
       fetchGroups();

       // Subscribe to changes
       const subscription = supabase
         .from('group_members')
         .on('*', fetchGroups)
         .subscribe();

       return () => subscription.unsubscribe();
     }, [user]);

     const fetchGroups = async () => {
       const { data } = await supabase
         .from('groups')
         .select(`
           *,
           members:group_members(
             user:users(id, full_name, avatar_url)
           )
         `);
       setGroups(data);
     };

     const createGroup = async (name) => {
       const { data, error } = await supabase
         .from('groups')
         .insert({ name, admin_id: user.id })
         .select()
         .single();

       if (error) throw error;

       // Add creator as member
       await supabase
         .from('group_members')
         .insert({ group_id: data.id, user_id: user.id });

       return data;
     };

     const joinGroup = async (inviteCode) => {
       // Find group by invite code
       const { data: group, error } = await supabase
         .from('groups')
         .select('id')
         .eq('invite_code', inviteCode)
         .single();

       if (error) throw new Error('Invalid invite code');

       // Join group
       await supabase
         .from('group_members')
         .insert({ group_id: group.id, user_id: user.id });
     };

     return { groups, createGroup, joinGroup };
   };
   ```

4. Update Groups page to use real data
5. Implement create/join flows
6. Add member management
7. Test invite code system

#### Deliverables:
- ✅ Create groups with auto-generated invite codes
- ✅ Join groups via invite code
- ✅ View group members
- ✅ RLS ensures users only see their groups

#### Security Checklist:
- [x] RLS policies prevent unauthorized access
- [x] Validate invite codes server-side (via RLS)
- [x] Only group admins can delete groups
- [x] Users can only leave (not delete) groups

---

### **Phase 3: Expenses (Week 4-5)**

#### Goals:
- Add, edit, delete expenses
- Store split information
- Real-time updates for group members
- Replace mock data completely

#### Tasks:

**Week 4: Basic Expense CRUD**
1. Create `expenses` and `expense_splits` tables
2. Set up RLS policies
3. Create `useExpenses` hook:
   ```javascript
   // src/hooks/useExpenses.js
   export const useExpenses = (groupId) => {
     const [expenses, setExpenses] = useState([]);
     const { user } = useAuth();

     useEffect(() => {
       fetchExpenses();

       // Real-time subscription
       const subscription = supabase
         .from('expenses')
         .on('*', fetchExpenses)
         .subscribe();

       return () => subscription.unsubscribe();
     }, [groupId]);

     const fetchExpenses = async () => {
       const { data } = await supabase
         .from('expenses')
         .select(`
           *,
           paid_by_user:users!paid_by(full_name),
           expense_splits(
             user:users(full_name),
             share_amount
           )
         `)
         .eq('group_id', groupId)
         .order('date', { ascending: false });

       setExpenses(data);
     };

     const addExpense = async (expenseData) => {
       // Start transaction
       const { data: expense, error } = await supabase
         .from('expenses')
         .insert({
           group_id: groupId,
           ...expenseData,
           paid_by: user.id
         })
         .select()
         .single();

       if (error) throw error;

       // Add splits
       const splits = expenseData.splitWith.map(userId => ({
         expense_id: expense.id,
         user_id: userId,
         share_amount: expenseData.amount / expenseData.splitWith.length
       }));

       await supabase
         .from('expense_splits')
         .insert(splits);

       return expense;
     };

     return { expenses, addExpense };
   };
   ```

4. Update Expenses page to use real data
5. Connect AddExpenseModal to database
6. Add loading states
7. Add error handling with toast notifications

**Week 5: Advanced Features**
1. Implement expense editing
2. Implement expense deletion
3. Add expense categories management
4. Test real-time updates (open two browsers)
5. Add form validation with Zod:
   ```javascript
   import { z } from 'zod';

   const expenseSchema = z.object({
     amount: z.number().positive('Amount must be positive'),
     category: z.string().min(1, 'Category is required'),
     description: z.string().optional(),
     date: z.date(),
     splitWith: z.array(z.string()).min(1, 'Select at least one person')
   });
   ```

#### Deliverables:
- ✅ Add expenses with splits
- ✅ Edit/delete own expenses
- ✅ Real-time updates when roommates add expenses
- ✅ Form validation
- ✅ Loading/error states

#### Security Checklist:
- [x] Users can only add expenses to their groups
- [x] Users can only edit/delete their own expenses
- [x] Validate amounts are positive
- [x] Validate splits sum to expense amount
- [x] RLS prevents unauthorized access

---

### **Phase 4: Balance Calculations (Week 6)**

#### Goals:
- Calculate who owes whom
- Optimize transactions (minimize payments)
- Display real-time balances

#### Tasks:
1. Create database function for balance calculation:
   ```sql
   CREATE OR REPLACE FUNCTION calculate_balances(p_group_id UUID)
   RETURNS TABLE(
     from_user UUID,
     to_user UUID,
     amount DECIMAL
   ) AS $$
   BEGIN
     -- Calculate net balances for each user
     WITH user_balances AS (
       SELECT
         es.user_id,
         SUM(es.share_amount) as total_owed,
         SUM(CASE WHEN e.paid_by = es.user_id THEN e.amount ELSE 0 END) as total_paid
       FROM expense_splits es
       JOIN expenses e ON e.id = es.expense_id
       WHERE e.group_id = p_group_id
       GROUP BY es.user_id
     ),
     net_balances AS (
       SELECT
         user_id,
         (total_paid - total_owed) as net_balance
       FROM user_balances
     )
     -- TODO: Implement transaction optimization algorithm
     -- For now, return simple pairwise balances
     RETURN QUERY
     SELECT
       a.user_id as from_user,
       b.user_id as to_user,
       ABS(a.net_balance) as amount
     FROM net_balances a
     CROSS JOIN net_balances b
     WHERE a.net_balance < 0 AND b.net_balance > 0
     AND ABS(a.net_balance) > 0.01;
   END;
   $$ LANGUAGE plpgsql;
   ```

2. Create `useBalances` hook:
   ```javascript
   export const useBalances = (groupId) => {
     const [balances, setBalances] = useState([]);

     useEffect(() => {
       calculateBalances();
     }, [groupId]);

     const calculateBalances = async () => {
       const { data } = await supabase
         .rpc('calculate_balances', { p_group_id: groupId });
       setBalances(data);
     };

     return { balances };
   };
   ```

3. Update Balance page with real calculations
4. Implement balance optimization algorithm (optional for MVP)
5. Add balance history view

#### Deliverables:
- ✅ Real-time balance calculations
- ✅ "Who owes whom" display
- ✅ Updates automatically when expenses change

#### Performance:
- Index on expense_splits for fast queries
- Cache balance calculations (optional)

---

### **Phase 5: Settlements (Week 7)**

#### Goals:
- Record payment settlements
- Mark debts as paid
- Settlement history

#### Tasks:
1. Create `settlements` table with RLS
2. Create `useSettlements` hook:
   ```javascript
   export const useSettlements = (groupId) => {
     const { user } = useAuth();

     const recordSettlement = async (toUserId, amount, method) => {
       const { data, error } = await supabase
         .from('settlements')
         .insert({
           group_id: groupId,
           from_user: user.id,
           to_user: toUserId,
           amount,
           payment_method: method,
           status: 'pending'
         })
         .select()
         .single();

       if (error) throw error;
       return data;
     };

     const confirmSettlement = async (settlementId) => {
       await supabase
         .from('settlements')
         .update({
           status: 'completed',
           completed_at: new Date().toISOString()
         })
         .eq('id', settlementId);
     };

     return { recordSettlement, confirmSettlement };
   };
   ```

3. Update Balances page with settlement flow
4. Add settlement history display
5. Implement undo settlement (within 24 hours)

#### Deliverables:
- ✅ Record settlements
- ✅ Confirm payments
- ✅ Settlement history
- ✅ Integration with payment apps (Venmo, PayPal, Zelle)

---

### **Phase 6: Budget & Analytics (Week 8)**

#### Goals:
- Set monthly budgets
- Track spending vs budget
- Category analytics
- Historical data views

#### Tasks:
1. Create budgets functionality
2. Aggregate spending by category
3. Build charts with Chart.js or Recharts
4. Add monthly/yearly views
5. Export data feature

#### Deliverables:
- ✅ Budget management
- ✅ Spending analytics
- ✅ Visual charts
- ✅ Data export

---

### **Phase 7: Polish & Production (Week 9-10)**

#### Goals:
- Error handling
- Loading states
- Form validation everywhere
- Testing
- Deployment

#### Tasks:
1. Add error boundaries
2. Add loading skeletons
3. Add toast notifications (react-hot-toast)
4. Write unit tests (Vitest)
5. Write E2E tests (Playwright)
6. Security audit:
   - Test all RLS policies
   - Check for SQL injection vulnerabilities
   - Verify input validation
   - Test rate limiting
7. Performance optimization:
   - Add React.memo where needed
   - Implement pagination for expenses
   - Add database indexes
   - Optimize images
8. Deploy to Vercel/Netlify
9. Set up monitoring (Sentry)

#### Deliverables:
- ✅ Production-ready app
- ✅ All security requirements met
- ✅ Error handling everywhere
- ✅ Tests passing
- ✅ Deployed and live

---

## Security Implementation Guide

### 1. Authentication Security

**Requirements:**
```javascript
// Enforce password requirements
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain lowercase')
  .regex(/[A-Z]/, 'Password must contain uppercase')
  .regex(/[0-9]/, 'Password must contain a number');
```

**Email Verification:**
```javascript
// In Supabase dashboard: Authentication > Settings
// Enable "Confirm email" under Email Auth
```

**Session Management:**
```javascript
// Supabase handles this automatically with JWT
// Set reasonable session timeout (24 hours default)
```

### 2. Row Level Security Policies

**Testing RLS:**
```sql
-- Test as specific user
SELECT set_config('request.jwt.claims', '{"sub": "user-uuid"}', true);

-- Run query to verify access
SELECT * FROM expenses WHERE group_id = 'group-uuid';
```

**Common RLS Patterns:**
```sql
-- User can see their own data
USING (auth.uid() = user_id)

-- User can see data from groups they belong to
USING (
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
)

-- User can modify their own records
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by)
```

### 3. Input Validation

**Always validate on client AND database:**
```javascript
// Client-side with Zod
const expenseSchema = z.object({
  amount: z.number().positive().max(999999),
  category: z.string().min(1).max(100),
  description: z.string().max(500),
});

// Database-side with constraints
CREATE TABLE expenses (
  amount DECIMAL(10,2) CHECK (amount > 0 AND amount < 1000000),
  category VARCHAR(100) NOT NULL,
  description TEXT CHECK (char_length(description) <= 500)
);
```

### 4. API Rate Limiting

**Supabase has built-in rate limiting:**
- Auth endpoints: Limited automatically
- Database queries: Configure per-project
- Storage uploads: 100 per hour default

**For additional protection:**
```javascript
// Add rate limiting to API calls
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

### 5. XSS Prevention

**React handles this by default, but:**
```javascript
// Never use dangerouslySetInnerHTML without sanitization
import DOMPurify from 'dompurify';

<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(userContent)
}} />

// Prefer plain text display
<div>{userDescription}</div> // React escapes this
```

### 6. HTTPS & CORS

**HTTPS:**
- Supabase uses HTTPS by default
- Vercel/Netlify deploy with HTTPS automatically

**CORS:**
```javascript
// In Supabase dashboard: Settings > API
// Configure allowed origins
```

### 7. Secrets Management

**Never commit:**
```
# .env.local
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_anon_key

# .env.production
VITE_SUPABASE_URL=production_url
VITE_SUPABASE_ANON_KEY=production_key
```

**Add to .gitignore:**
```
.env.local
.env.production
```

---

## Performance Optimization Plan

### Database Indexes
```sql
-- Expenses: Query by group, date, paid_by frequently
CREATE INDEX idx_expenses_group ON expenses(group_id);
CREATE INDEX idx_expenses_date ON expenses(date DESC);
CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);

-- Expense splits: Query by expense and user
CREATE INDEX idx_splits_expense ON expense_splits(expense_id);
CREATE INDEX idx_splits_user ON expense_splits(user_id);

-- Group members: Query by group and user
CREATE INDEX idx_members_group ON group_members(group_id);
CREATE INDEX idx_members_user ON group_members(user_id);
```

### Query Optimization
```javascript
// Bad: Fetch all expenses then filter in JS
const { data } = await supabase
  .from('expenses')
  .select('*');
const filtered = data.filter(e => e.date > startDate);

// Good: Filter in database
const { data } = await supabase
  .from('expenses')
  .select('*')
  .gt('date', startDate)
  .limit(50);
```

### React Optimization
```javascript
// Memoize expensive components
const ExpenseList = React.memo(({ expenses }) => {
  return expenses.map(e => <ExpenseCard key={e.id} expense={e} />);
});

// Memoize calculations
const totalSpent = useMemo(() => {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}, [expenses]);
```

### Pagination
```javascript
const [page, setPage] = useState(0);
const PAGE_SIZE = 50;

const { data } = await supabase
  .from('expenses')
  .select('*')
  .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)
  .order('date', { ascending: false });
```

---

## Testing Strategy

### Unit Tests (Vitest)
```javascript
// tests/calculations.test.js
import { describe, it, expect } from 'vitest';
import { calculateBalances } from '../src/utils/calculations';

describe('calculateBalances', () => {
  it('should calculate simple balance', () => {
    const expenses = [
      { amount: 100, paid_by: 'user1', split: ['user1', 'user2'] }
    ];
    const balances = calculateBalances(expenses);
    expect(balances).toEqual([
      { from: 'user2', to: 'user1', amount: 50 }
    ]);
  });
});
```

### Integration Tests
```javascript
// tests/integration/expenses.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '../src/lib/supabase';

describe('Expenses API', () => {
  beforeEach(async () => {
    // Clear test data
  });

  it('should create expense with splits', async () => {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        amount: 100,
        category: 'Groceries',
        group_id: testGroupId
      });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
});
```

### E2E Tests (Playwright)
```javascript
// e2e/expense-flow.spec.js
import { test, expect } from '@playwright/test';

test('add expense flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.click('[data-testid="add-expense"]');
  await page.fill('[name="amount"]', '50');
  await page.click('button[type="submit"]');

  await expect(page.locator('text=$50.00')).toBeVisible();
});
```

---

## Migration from Mock Data

### Step-by-Step Process:

1. **Keep mock data temporarily** - Don't delete yet
2. **Add feature flags**:
   ```javascript
   const USE_REAL_DATA = import.meta.env.VITE_USE_REAL_DATA === 'true';
   ```
3. **Create parallel hooks**:
   ```javascript
   const useExpenses = () => {
     if (USE_REAL_DATA) {
       return useExpensesDB();
     } else {
       return useExpensesMock();
     }
   };
   ```
4. **Test thoroughly with real data**
5. **Remove mock data** once confidence is high

---

## Deployment Checklist

### Pre-Deployment:
- [ ] All environment variables set
- [ ] All tests passing
- [ ] No console.logs in code
- [ ] Security audit completed
- [ ] RLS policies tested
- [ ] Error handling everywhere
- [ ] Loading states everywhere
- [ ] Form validation everywhere

### Deployment:
- [ ] Deploy to Vercel/Netlify
- [ ] Configure custom domain
- [ ] Set up SSL (automatic)
- [ ] Configure Supabase prod instance
- [ ] Set production env variables
- [ ] Test production build locally first

### Post-Deployment:
- [ ] Monitor errors (Sentry)
- [ ] Check performance (Lighthouse)
- [ ] Test authentication flow
- [ ] Verify RLS policies working
- [ ] Test on mobile devices
- [ ] Set up database backups

---

## Cost Estimates

### Supabase Free Tier:
- 500MB database storage
- 2GB file storage
- 50k monthly active users
- 2GB bandwidth

**This is plenty for MVP!**

### Paid Tier ($25/month):
- 8GB database
- 100GB file storage
- 100k monthly active users
- 250GB bandwidth

Upgrade when you have 100+ active users.

---

**Last Updated:** 2025-10-30
**Recommended Start Date:** Immediately after documentation review
**Estimated Completion:** 8-10 weeks for full backend
**Budget:** $0 (free tier sufficient for MVP)
