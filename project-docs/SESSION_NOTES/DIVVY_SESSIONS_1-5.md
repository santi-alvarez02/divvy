# Divvy Development Session Notes - Sessions 1-5

This document covers the initial UI development phases.

---

## Development History (From Git Log)

### Session 1: Project Initialization
**Date:** (Initial commit)
**Git Commit:** `f453e23 Initial commit`

**Goal:** Set up React project with Vite and initial structure

**Changes Made:**
- Created Vite + React project
- Set up Tailwind CSS
- Created basic folder structure
- Added initial dependencies

**Status:** ✅ Complete

---

### Session 2: Dark Mode Implementation
**Date:** (After initial commit)
**Git Commits:**
- `376ec1a working dark mode`
- `027c8d9 light mode done`

**Goal:** Implement theme toggle functionality

**Changes Made:**
- Built dark mode toggle
- Implemented dark theme with gradient backgrounds
- Created light theme with different color palette
- Added `isDarkMode` state management
- Conditional styling throughout components

**Technical Details:**
- Dark mode uses muted orange gradients (`rgba(255, 94, 0, *)`)
- Light mode uses vibrant orange gradients (`rgba(255, 154, 86, *)`)
- Props drilling for `isDarkMode` and `setIsDarkMode`

**Status:** ✅ Complete

---

### Session 3: Dashboard/Overview Page
**Date:** (After light mode)
**Git Commit:** `5a2a387 UI done for overview`

**Goal:** Build main dashboard page with widgets

**Changes Made:**
- Created Dashboard component
- Built BudgetOverview widget
- Built RecentExpenses widget
- Built BalanceSummary widget
- Added Sidebar navigation
- Integrated mock data
- Glass-morphism design implementation

**Technical Details:**
- Dashboard layout: Sidebar + 3 widget columns
- Widgets show:
  - Budget progress (spent vs limit)
  - Last 8 expenses
  - Who owes what summary
- Orange gradient "bubble" backgrounds

**Status:** ✅ Complete

---

### Session 4: Add Expense Modal
**Date:** (After dashboard)
**Git Commit:** `2141894 Modal to add expense is almost done`

**Goal:** Create modal form for adding expenses

**Changes Made:**
- Built AddExpenseModal component
- Form fields for expense details
- Category selector
- Roommate selection (who paid, split with)
- Split type options (even, by amount, by percentage)
- Modal overlay and close functionality

**Technical Details:**
- Modal state managed by parent components
- Form validation (basic)
- Currently shows alert() on submit (no backend yet)

**Challenges:**
- Deciding on split type UI
- Making modal responsive

**Status:** ✅ Complete (UI only)

---

### Session 5: Custom Scrollers
**Date:** (After modal)
**Git Commits:**
- `847e375 Scroller v1`
- `1127fb5 Scroller done v1`
- `949dca2 Scroller finally done`

**Goal:** Build custom scrollable pickers for filters

**Changes Made:**
- Created custom scroll picker component
- Implemented auto-scroll to selected item
- Added smooth scrolling animations
- Built for both category and date filters

**Technical Details:**
- Used useRef for scroll container
- Calculated scroll positions based on item height
- Smooth scroll behavior with CSS

**Challenges:**
- Getting scroll position calculations right
- Handling different item heights
- Making scrolling feel natural

**Status:** ✅ Complete
