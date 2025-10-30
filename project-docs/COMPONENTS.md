# Divvy Components Inventory

## Component Organization

Components are organized into two categories:
- **Pages** (`src/pages/`): Full-page views with routing
- **Components** (`src/components/`): Reusable UI widgets and layouts

---

## Page Components

### 1. Dashboard.jsx
**Location:** `src/components/Dashboard.jsx`
**Route:** `/`

**Purpose:**
Main landing page showing overview of expenses, budget, and balances.

**Props:**
```javascript
{
  budget: Object,        // Monthly budget data
  expenses: Array,       // All expenses
  balances: Array,       // Who owes what
  roommates: Array,      // Group members
  isDarkMode: Boolean,   // Theme state
  setIsDarkMode: Function // Theme toggle
}
```

**Features:**
- Glass-morphism layout with gradient backgrounds
- 3 main widgets (Budget, Recent Expenses, Balances)
- Sidebar navigation
- "Add Expense" button (calls placeholder alert)
- Dark/Light mode toggle in header
- Responsive design (desktop/mobile layouts)

**Sub-components:**
- `<Sidebar />`
- `<BudgetOverview />`
- `<RecentExpenses />`
- `<BalanceSummary />`

**State:**
- None (stateless, data from props)

---

### 2. Expenses.jsx
**Location:** `src/pages/Expenses.jsx`
**Route:** `/expenses`

**Purpose:**
Full expense list with search and filtering capabilities.

**Props:**
```javascript
{
  isDarkMode: Boolean,
  setIsDarkMode: Function,
  expenses: Array,
  roommates: Array
}
```

**Features:**
- Search bar (filter by description)
- Category filter with custom scroll picker
- Date range filter (This Week, This Month, specific months)
- Expense cards/list items showing:
  - Amount
  - Category icon
  - Description
  - Date
  - Who paid
  - Split information
- Custom scrollable picker UI
- Empty state for no results
- Responsive layout

**State:**
```javascript
const [isModalOpen, setIsModalOpen] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
const [selectedCategory, setSelectedCategory] = useState('All');
const [selectedDateRange, setSelectedDateRange] = useState('This Month');
const [showCategoryPicker, setShowCategoryPicker] = useState(false);
const [showDatePicker, setShowDatePicker] = useState(false);
```

**Helper Functions:**
- `getRoommateName(id)` - Get roommate name by ID
- `formatDate(dateString)` - Format date for display
- `getSplitInfo(expense)` - Generate split description
- `generateDateRanges()` - Create date filter options

**Refs:**
- `categoryScrollRef` - For scroll positioning
- `dateScrollRef` - For scroll positioning

---

### 3. Balances.jsx
**Location:** `src/pages/Balances.jsx`
**Route:** `/balances`

**Purpose:**
Manage who owes what and settle up debts.

**Props:**
```javascript
{
  isDarkMode: Boolean,
  setIsDarkMode: Function,
  expenses: Array,
  roommates: Array
}
```

**Features:**
- Balance summary (who owes you / you owe them)
- "Settle Up" button for each balance
- Multi-step settle modal:
  1. Select person and amount
  2. Choose payment method
  3. Open payment app
  4. Confirm payment
- Payment platform integration (Venmo, PayPal, Zelle)
- Settlement history display
- Status tracking (pending/completed)
- Animated checkmarks

**State:**
```javascript
// Settlement flow state
const [showSettleModal, setShowSettleModal] = useState(false);
const [settleStep, setSettleStep] = useState(1);
const [selectedPerson, setSelectedPerson] = useState(null);
const [settleAmount, setSettleAmount] = useState('');
const [selectedPlatform, setSelectedPlatform] = useState('');
const [showSuccess, setShowSuccess] = useState(false);

// History and pending
const [settlementHistory, setSettlementHistory] = useState([]);
const [pendingSettlements, setPendingSettlements] = useState([]);
```

**Helper Functions:**
- `calculateBalances()` - Compute who owes whom
- `getPaymentUsername(roommateId, platform)` - Get stored payment info
- `handleSettle(person, amount)` - Open settle modal
- `handleOpenPaymentApp()` - Generate payment link
- `handleConfirmPayment()` - Mark as paid
- `getMockSettlementHistory()` - Generate mock history

**localStorage Usage:**
- `venmoUsername`
- `paypalUsername`
- `zelleEmail`

---

### 4. Budget.jsx
**Location:** `src/pages/Budget.jsx`
**Route:** `/budgets`

**Purpose:**
Visualize budget and spending by category.

**Props:**
```javascript
{
  isDarkMode: Boolean,
  setIsDarkMode: Function,
  expenses: Array,
  roommates: Array
}
```

**Features:**
- Monthly budget overview
- Spending by category charts
- Budget vs actual comparison
- Category breakdown
- Month-over-month trends
- Visual progress indicators

**State:**
- Budget state management
- Chart data formatting

---

### 5. Groups.jsx
**Location:** `src/pages/Groups.jsx`
**Route:** `/groups`

**Purpose:**
Manage group membership and settings.

**Props:**
```javascript
{
  isDarkMode: Boolean,
  setIsDarkMode: Function,
  roommates: Array
}
```

**Features:**
- Current group display
- Member list with avatars
- Add member button
- Invite code display/generation
- Create new group
- Join existing group
- Leave group option
- Group settings

**State:**
- Group management state
- Member list state
- Invite modal state

---

### 6. Settings.jsx
**Location:** `src/pages/Settings.jsx`
**Route:** `/settings`

**Purpose:**
User profile and app configuration.

**Props:**
```javascript
{
  isDarkMode: Boolean,
  setIsDarkMode: Function
}
```

**Features:**
- User profile section
  - Name and email display
  - Profile picture upload (UI only)
- Payment integration settings
  - Venmo username input
  - PayPal email input
  - Zelle email/phone input
  - Save to localStorage
- Theme preferences (Dark/Light)
- Notification settings (UI only)
- Account actions (Delete, Logout - UI only)

**State:**
```javascript
const [venmoUsername, setVenmoUsername] = useState('');
const [paypalUsername, setPaypalUsername] = useState('');
const [zelleEmail, setZelleEmail] = useState('');
```

**localStorage Operations:**
- Loads payment info on mount
- Saves on form submit

---

## Reusable Components

### 1. Sidebar.jsx
**Location:** `src/components/Sidebar.jsx`

**Purpose:**
Navigation menu for all pages.

**Props:**
```javascript
{
  isDarkMode: Boolean,
  setIsDarkMode: Function
}
```

**Features:**
- Navigation links with icons
- Active route highlighting
- Dark mode toggle button
- User profile section (top)
- Responsive (collapsible on mobile)
- Glass-morphism styling

**Navigation Items:**
- Overview (Home icon)
- Expenses (Receipt icon)
- Balances (Scale icon)
- Budgets (Chart icon)
- Groups (Users icon)
- Settings (Gear icon)

**State:**
- None (stateless)

**Styling:**
- Fixed positioning
- Height 100vh on desktop
- Collapse to hamburger on mobile
- Active link highlighted with orange color

---

### 2. BudgetOverview.jsx
**Location:** `src/components/BudgetOverview.jsx`

**Purpose:**
Display monthly budget progress widget.

**Props:**
```javascript
{
  budget: {
    limit: Number,
    spent: Number,
    month: String,
    year: Number
  },
  isDarkMode: Boolean
}
```

**Features:**
- Progress bar visualization
- Percentage calculation
- Spent vs limit display
- Color-coded (green/yellow/red based on usage)
- Animated progress bar
- Responsive sizing

**Calculations:**
```javascript
const percentageSpent = (budget.spent / budget.limit) * 100;
const remaining = budget.limit - budget.spent;
```

**Conditional Styling:**
- Green: < 70% spent
- Yellow: 70-90% spent
- Red: > 90% spent

---

### 3. RecentExpenses.jsx
**Location:** `src/components/RecentExpenses.jsx`

**Purpose:**
Display last 8 expenses on dashboard.

**Props:**
```javascript
{
  expenses: Array,
  roommates: Array,
  isDarkMode: Boolean
}
```

**Features:**
- Shows last 8 expenses (sorted by date)
- Each expense shows:
  - Category icon
  - Description
  - Amount
  - Who paid
  - Date
- "View All" link to expenses page
- Scrollable container
- Empty state

**Helper Functions:**
- `getRoommateName(id)` - Get name from roommate ID
- `formatDate(date)` - Format date string

---

### 4. BalanceSummary.jsx
**Location:** `src/components/BalanceSummary.jsx`

**Purpose:**
Display who owes what on dashboard.

**Props:**
```javascript
{
  balances: Array<{
    person: String,
    amount: Number,
    type: 'owes_you' | 'you_owe'
  }>,
  isDarkMode: Boolean
}
```

**Features:**
- Color-coded balances:
  - Green: They owe you
  - Red: You owe them
- Amount display with $ symbol
- Person name
- "Settle Up" button for each
- Total summary at bottom
- "View All" link to balances page

**Calculations:**
```javascript
const totalOwedToYou = balances
  .filter(b => b.type === 'owes_you')
  .reduce((sum, b) => sum + b.amount, 0);

const totalYouOwe = balances
  .filter(b => b.type === 'you_owe')
  .reduce((sum, b) => sum + b.amount, 0);

const netBalance = totalOwedToYou - totalYouOwe;
```

---

### 5. AddExpenseModal.jsx
**Location:** `src/components/AddExpenseModal.jsx`

**Purpose:**
Modal form to create new expenses.

**Props:**
```javascript
{
  isOpen: Boolean,
  onClose: Function,
  roommates: Array,
  isDarkMode: Boolean
}
```

**Features:**
- Modal overlay (click outside to close)
- Form fields:
  - Amount (number input with $ prefix)
  - Category (dropdown)
  - Description (text input)
  - Date (date picker)
  - Paid by (dropdown of roommates)
  - Split with (checkboxes for roommates)
- Split type options:
  - Even split
  - By amount
  - By percentage
- Cancel and Submit buttons
- Form validation (basic)
- Currently shows alert() on submit

**State:**
```javascript
const [amount, setAmount] = useState('');
const [category, setCategory] = useState('');
const [description, setDescription] = useState('');
const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
const [paidBy, setPaidBy] = useState(null);
const [splitWith, setSplitWith] = useState([]);
const [splitType, setSplitType] = useState('even');
```

**Categories:**
- Groceries 🛒
- Utilities ⚡
- Food & Dining 🍕
- Internet 📡
- Rent 🏠
- Entertainment 🎬
- Household 🧹

---

## Mock Data Structure

### Location
`src/data/mockData.js`

### Data Exports

#### 1. currentUser
```javascript
{
  id: Number,
  name: String
}
```

#### 2. roommates
```javascript
[
  {
    id: Number,
    name: String,
    color: String // Tailwind class like 'bg-blue-500'
  }
]
```

**Example:**
```javascript
[
  { id: 1, name: 'You', color: 'bg-blue-500' },
  { id: 2, name: 'Sarah', color: 'bg-purple-500' },
  { id: 3, name: 'Mike', color: 'bg-green-500' }
]
```

#### 3. expenses
```javascript
[
  {
    id: Number,
    amount: Number,
    category: String,
    description: String,
    date: String, // ISO date format 'YYYY-MM-DD'
    paidBy: Number, // Roommate ID
    splitBetween: Array<Number>, // Array of roommate IDs
    icon: String // Emoji
  }
]
```

**Example:**
```javascript
{
  id: 1,
  amount: 120.50,
  category: 'Groceries',
  description: 'Weekly groceries at Whole Foods',
  date: '2025-10-24',
  paidBy: 2, // Sarah
  splitBetween: [1, 2, 3], // All roommates
  icon: '🛒'
}
```

**Categories in Use:**
- Groceries
- Utilities
- Food & Dining
- Internet
- Rent
- Entertainment
- Household

**Date Range:**
- July 2025 - October 2025
- 26 total expenses
- Distributed across multiple months for testing filters

#### 4. monthlyBudget
```javascript
{
  limit: Number,
  spent: Number,
  month: String,
  year: Number
}
```

**Example:**
```javascript
{
  limit: 1500,
  spent: 594.95,
  month: 'October',
  year: 2025
}
```

#### 5. balances
```javascript
[
  {
    person: String,
    amount: Number,
    type: 'owes_you' | 'you_owe'
  }
]
```

**Example:**
```javascript
[
  {
    person: 'Sarah',
    amount: 45.32,
    type: 'owes_you'
  },
  {
    person: 'Mike',
    amount: 23.15,
    type: 'you_owe'
  }
]
```

---

## Future Database Schema (When Backend is Added)

Based on current mock data, here's the recommended database structure:

### users table
```sql
id: UUID (primary key)
email: VARCHAR
full_name: VARCHAR
avatar_url: VARCHAR
created_at: TIMESTAMP
```

### groups table
```sql
id: UUID (primary key)
name: VARCHAR
admin_id: UUID (foreign key -> users.id)
invite_code: VARCHAR (unique)
created_at: TIMESTAMP
```

### group_members table
```sql
id: UUID (primary key)
group_id: UUID (foreign key -> groups.id)
user_id: UUID (foreign key -> users.id)
joined_at: TIMESTAMP
color: VARCHAR (for avatar color)
```

### expenses table
```sql
id: UUID (primary key)
group_id: UUID (foreign key -> groups.id)
amount: DECIMAL
category: VARCHAR
description: TEXT
date: DATE
paid_by: UUID (foreign key -> users.id)
icon: VARCHAR (emoji)
created_at: TIMESTAMP
updated_at: TIMESTAMP
```

### expense_splits table
```sql
id: UUID (primary key)
expense_id: UUID (foreign key -> expenses.id)
user_id: UUID (foreign key -> users.id)
share_amount: DECIMAL
```

### settlements table
```sql
id: UUID (primary key)
from_user: UUID (foreign key -> users.id)
to_user: UUID (foreign key -> users.id)
amount: DECIMAL
date: TIMESTAMP
status: ENUM('pending', 'completed')
payment_method: VARCHAR
```

### user_settings table
```sql
id: UUID (primary key)
user_id: UUID (foreign key -> users.id)
venmo_username: VARCHAR
paypal_email: VARCHAR
zelle_email: VARCHAR
theme: ENUM('light', 'dark')
```

---

## Component Dependencies

```
App.jsx
├── Dashboard.jsx
│   ├── Sidebar.jsx
│   ├── BudgetOverview.jsx
│   ├── RecentExpenses.jsx
│   └── BalanceSummary.jsx
├── Expenses.jsx
│   ├── Sidebar.jsx
│   └── AddExpenseModal.jsx
├── Balances.jsx
│   └── Sidebar.jsx
├── Budget.jsx
│   └── Sidebar.jsx
├── Groups.jsx
│   └── Sidebar.jsx
└── Settings.jsx
    └── Sidebar.jsx
```

---

**Last Updated:** 2025-10-30
**Total Components:** 11 (6 pages + 5 reusable)
**Mock Data Objects:** 5
