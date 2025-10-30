# Divvy Architecture Documentation

## Tech Stack

### Frontend Framework
- **React** 19.2.0 (latest)
  - Functional components only
  - React Hooks for state management
  - No class components used

### Build Tool
- **Vite** 7.1.12
  - Fast HMR (Hot Module Replacement)
  - Optimized build process
  - Plugin: `@vitejs/plugin-react` 5.1.0

### Routing
- **React Router DOM** 7.9.4
  - Client-side routing
  - Currently implements: Dashboard, Expenses, Balances, Budget, Groups, Settings

### Styling
- **Tailwind CSS** 3.4.18
  - Utility-first CSS framework
  - Custom gradient backgrounds
  - Glass-morphism design pattern
- **PostCSS** 8.5.6 with Autoprefixer 10.4.21
  - Automatic vendor prefixing
  - CSS processing

### Development Dependencies
```json
{
  "react": "^19.2.0",
  "react-dom": "^19.2.0",
  "react-router-dom": "^7.9.4",
  "@vitejs/plugin-react": "^5.1.0",
  "autoprefixer": "^10.4.21",
  "postcss": "^8.5.6",
  "tailwindcss": "^3.4.18",
  "vite": "^7.1.12"
}
```

## Folder Structure

```
Divvy/
├── node_modules/
├── public/                    # Static assets
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── Dashboard.jsx         # Main dashboard layout
│   │   ├── Sidebar.jsx           # Navigation sidebar
│   │   ├── BudgetOverview.jsx    # Budget widget
│   │   ├── RecentExpenses.jsx    # Recent expenses widget
│   │   ├── BalanceSummary.jsx    # Balance summary widget
│   │   └── AddExpenseModal.jsx   # Add expense modal form
│   ├── pages/                # Page-level components
│   │   ├── Expenses.jsx          # Expenses list with filters
│   │   ├── Balances.jsx          # Who owes what page
│   │   ├── Budget.jsx            # Budget visualization page
│   │   ├── Groups.jsx            # Group management page
│   │   └── Settings.jsx          # User settings page
│   ├── data/                 # Data layer
│   │   └── mockData.js           # Mock data for development
│   ├── App.jsx               # Root component with routing
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles + Tailwind imports
├── project-docs/             # Project documentation
├── package.json              # Dependencies and scripts
├── vite.config.js            # Vite configuration
├── tailwind.config.js        # Tailwind configuration
├── postcss.config.js         # PostCSS configuration
├── .gitignore                # Git ignore rules
├── .env.local                # Environment variables (not committed)
└── README.md                 # Project overview

```

## Build Configuration

### Vite Configuration (`vite.config.js`)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
```

**Key Features:**
- React Fast Refresh for instant updates
- Optimized production builds
- Development server on port 5173
- ES modules support

### Tailwind Configuration (`tailwind.config.js`)
- Content paths: All JS/JSX files in src/
- Default theme extended with custom colors
- JIT (Just-In-Time) compilation enabled

### PostCSS Configuration (`postcss.config.js`)
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## Design Decisions & Patterns

### 1. **Glass-Morphism Design System**
The app uses a distinctive glass-morphism (glassmorphism) design pattern:
- Semi-transparent backgrounds with backdrop blur
- Layered gradient "bubbles" for depth
- Subtle borders and shadows
- High contrast for readability

**Implementation:**
```jsx
style={{
  background: 'rgba(255, 255, 255, 0.4)',
  backdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.2)'
}}
```

### 2. **Orange Brand Color (#FF5E00)**
- Primary action buttons
- Logo and branding
- Gradient backgrounds (orange variations)
- Hover states and active indicators

### 3. **Dark/Light Mode Support**
- Toggle available in Dashboard
- Controlled by `isDarkMode` boolean prop
- Conditional rendering of gradients and colors
- Dark mode: Darker backgrounds with muted orange gradients
- Light mode: Off-white backgrounds with vibrant orange gradients

### 4. **Responsive Design Strategy**
- Mobile-first approach with Tailwind breakpoints
- Sidebar collapses on mobile
- Touch-optimized buttons and controls
- Responsive grid layouts
- Floating action buttons on mobile

**Breakpoints Used:**
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px
- `xl:` 1280px

### 5. **Component Architecture**
**Pages vs Components:**
- `pages/`: Full page views with their own data handling and layout
- `components/`: Reusable widgets and UI elements

**Props Pattern:**
- All components receive `isDarkMode` and `setIsDarkMode` for theme control
- Data passed via props (currently mock data)
- Event handlers passed down from parent components

### 6. **State Management**
- **Local State:** `useState` for component-specific UI state (modals, dropdowns, filters)
- **Props Drilling:** Used for dark mode toggle (passed from App.jsx)
- **No Global State:** Currently no Redux/Context API (will be needed for backend)

### 7. **Routing Strategy**
- Single Page Application (SPA) architecture
- Client-side routing with React Router DOM
- Routes defined in `App.jsx`
- All routes render at root level (no nested routes currently)

**Current Routes:**
- `/` → Dashboard
- `/expenses` → Expenses page
- `/balances` → Balances page
- `/budgets` → Budget page
- `/groups` → Groups page
- `/settings` → Settings page

### 8. **Data Flow (Current - Mock Data)**
```
mockData.js
    ↓
  App.jsx (imports and passes as props)
    ↓
  Page Components (consume and display)
    ↓
  Widget Components (receive via props)
```

**Future State (With Backend):**
```
Supabase Database
    ↓
  API/Hooks Layer (useExpenses, useGroups, etc.)
    ↓
  Context Providers (global state)
    ↓
  Page Components
    ↓
  Widget Components
```

### 9. **Performance Considerations**
**Current Optimizations:**
- Vite's fast HMR for development
- Tailwind's JIT compilation (smaller CSS bundles)
- No unnecessary re-renders (functional components with proper dependencies)

**Future Optimizations Needed:**
- React.memo for expensive components
- useMemo for complex calculations
- Virtualization for long expense lists
- Code splitting with React.lazy()
- Image optimization for receipts

### 10. **Accessibility Considerations**
**Currently Implemented:**
- Semantic HTML elements
- Hover states on interactive elements
- Focus states for keyboard navigation
- Sufficient color contrast (orange on white/dark backgrounds)

**To Be Added:**
- ARIA labels for screen readers
- Keyboard shortcuts for common actions
- Focus trapping in modals
- Skip navigation links
- Alt text for images

## Build & Development Commands

```bash
# Install dependencies
npm install

# Run development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Environment Variables

Currently using `.env.local` for configuration (not committed to git).

**Future Environment Variables:**
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

Note: Vite requires `VITE_` prefix for client-side env variables.

## Known Technical Debt

1. **No TypeScript** - Consider migration for type safety
2. **No Tests** - Unit tests and E2E tests needed
3. **Props Drilling** - Dark mode passed through many levels
4. **No Error Boundaries** - App will crash on component errors
5. **No Loading States** - Will be needed for async operations
6. **Mock Data Hardcoded** - Need to abstract data layer
7. **No Form Validation** - Will be critical for backend integration
8. **No Code Splitting** - All JS loaded upfront

## Dependencies Rationale

### Why React 19?
- Latest stable version with improved performance
- Better concurrent rendering
- Enhanced developer experience

### Why Vite?
- Dramatically faster than Create React App
- Better developer experience with instant HMR
- Optimized production builds
- Modern ES modules support

### Why Tailwind CSS?
- Rapid UI development
- Consistent design system
- Smaller final CSS bundle (with PurgeCSS)
- Excellent responsive design utilities
- No CSS naming conventions needed

### Why React Router?
- Industry standard for React routing
- Great documentation and community
- Supports all routing patterns (nested, dynamic, protected)

## Future Architecture Considerations

When adding backend:

1. **Add State Management**
   - Consider Zustand (lightweight) or Context API
   - Or use Supabase's built-in real-time subscriptions

2. **API Layer**
   - Create `src/services/` folder
   - Abstract all Supabase calls
   - Create custom hooks (useExpenses, useAuth, etc.)

3. **Authentication**
   - Add protected routes
   - Store auth state globally
   - Implement auth guards

4. **Form Handling**
   - Add React Hook Form
   - Add Zod for validation
   - Centralize form components

5. **Error Handling**
   - Add error boundaries
   - Toast notifications for user feedback
   - Sentry for error tracking (optional)

---

**Last Updated:** 2025-10-30
**Status:** UI Complete - Backend Not Implemented
