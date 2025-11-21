# Divvy

A modern web application for tracking and splitting shared expenses between roommates, couples, or groups.

## Overview

Divvy simplifies shared expense management by providing real-time balance tracking, automatic currency conversion, and flexible splitting options. Built with React and Supabase, it offers a seamless experience across all devices.

## Features

- **Expense Management**: Add, edit, and track personal and shared expenses with support for multiple currencies
- **Smart Splitting**: Split expenses evenly or create custom splits with loan/IOU tracking
- **Live Balance Tracking**: Real-time calculation of who owes what with automatic currency conversion
- **Budget Management**: Set and monitor budgets across different categories with visual progress tracking
- **Settlement System**: Track payments and maintain settlement history between group members
- **Groups**: Create and manage multiple expense-sharing groups
- **Multi-Currency Support**: Automatic currency conversion using live exchange rates
- **Responsive Design**: Fully optimized interface for mobile and desktop devices

## Tech Stack

- **Frontend**: React 19 with Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time subscriptions)
- **Data Visualization**: Recharts
- **Currency API**: Live exchange rate integration

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React Context providers (Auth, etc.)
├── pages/              # Main application pages (Dashboard, Expenses, Balances, etc.)
├── utils/              # Helper functions (currency conversion, date formatting)
└── lib/                # Third-party library configurations
```

## How It Works

1. Users create an account and set up a group with roommates or friends
2. Group members add expenses and choose how to split them
3. The app automatically calculates balances and converts currencies
4. Users can view who owes what and settle up through the built-in payment tracking
5. Budget tracking provides insights into spending patterns across categories
