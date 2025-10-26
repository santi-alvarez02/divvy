# Divvy - Shared Expense Tracker

A modern, clean web app for roommates and couples to track and split shared expenses.

## Features

### Current Dashboard Includes:
- **Monthly Budget Overview** - Visual progress bar showing spending vs budget limit
- **Recent Expenses List** - Last 8 expenses with details (amount, category, who paid, split status)
- **Who Owes What Summary** - Clear breakdown of balances between roommates
- **Quick Add Expense Button** - Prominent CTA (mobile floating button + desktop header button)

## Tech Stack
- React 19 with Vite
- Tailwind CSS for styling
- Fully responsive design (mobile-friendly)

## Getting Started

### Install dependencies
```bash
npm install
```

### Run development server
```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

### Build for production
```bash
npm run build
```

## Current Status

This is the initial build focusing on UI/UX with mock data.

**What's Working:**
- Beautiful, modern dashboard layout
- Responsive design (mobile and desktop)
- Mock data with 3 roommates and sample expenses
- Visual budget tracking
- Color-coded balance indicators

**What's NOT Implemented Yet:**
- Authentication/login
- Database/persistence
- Actual expense splitting calculations
- Add expense functionality
- The AI prompt feature

## Project Structure

```
src/
├── components/
│   ├── Dashboard.jsx         # Main dashboard layout
│   ├── BudgetOverview.jsx    # Monthly budget widget
│   ├── RecentExpenses.jsx    # Expense list component
│   └── BalanceSummary.jsx    # Who owes what widget
├── data/
│   └── mockData.js           # Sample data for testing
├── App.jsx                   # Root component
├── main.jsx                  # Entry point
└── index.css                 # Tailwind imports + global styles
```

## Next Steps

Future iterations could include:
- Backend API integration
- User authentication
- Real expense splitting logic
- Payment tracking
- Receipt uploads
- Expense categories customization
- Monthly/yearly analytics
