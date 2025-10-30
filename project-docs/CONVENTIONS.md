# Divvy Coding Conventions

This document outlines the coding patterns, styles, and conventions used throughout the Divvy project.

---

## Component Structure

### Functional Components Only
All components use functional components with hooks. No class components are used.

**Pattern:**
```javascript
import React, { useState, useEffect, useRef } from 'react';

const ComponentName = ({ prop1, prop2 }) => {
  // State declarations
  const [state, setState] = useState(initialValue);

  // Refs
  const myRef = useRef(null);

  // Effects
  useEffect(() => {
    // Side effects
  }, [dependencies]);

  // Event handlers
  const handleEvent = () => {
    // Handler logic
  };

  // Helper functions
  const helperFunction = (param) => {
    return result;
  };

  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  );
};

export default ComponentName;
```

### Props Destructuring
Always destructure props in function signature for clarity.

**Good:**
```javascript
const Dashboard = ({ budget, expenses, balances, isDarkMode, setIsDarkMode }) => {
  // Use props directly
  return <div>{budget.spent}</div>;
};
```

**Avoid:**
```javascript
const Dashboard = (props) => {
  // Don't use props.something everywhere
  return <div>{props.budget.spent}</div>;
};
```

---

## Naming Conventions

### Components (PascalCase)
```javascript
Dashboard.jsx
BudgetOverview.jsx
AddExpenseModal.jsx
```

### Variables (camelCase)
```javascript
const monthlyBudget = {...};
const isDarkMode = false;
const userName = 'John';
```

### Functions (camelCase)
```javascript
const handleClick = () => {...};
const getRoommateName = (id) => {...};
const formatDate = (date) => {...};
```

### Constants (UPPER_SNAKE_CASE) - When used
```javascript
const MAX_EXPENSES_PER_PAGE = 50;
const DEFAULT_CATEGORY = 'Groceries';
```

### Boolean Variables (is/has/should prefix)
```javascript
const isModalOpen = false;
const hasExpenses = true;
const shouldShowPicker = false;
```

### Event Handlers (handle prefix)
```javascript
const handleSubmit = (e) => {...};
const handleAddExpense = () => {...};
const handleOpenModal = () => {...};
```

### Setter Functions (set prefix)
```javascript
const [isOpen, setIsOpen] = useState(false);
const [selectedDate, setSelectedDate] = useState(null);
```

---

## File Organization

### Folder Structure
```
src/
├── components/     # Reusable components
├── pages/          # Route-based page components
├── data/           # Mock data and constants
├── App.jsx         # Root component
└── main.jsx        # Entry point
```

### Component Files
- One component per file
- File name matches component name exactly
- Export as default at bottom of file

### Import Order
```javascript
// 1. React and external libraries
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 2. Internal components
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';

// 3. Data/utils
import { mockData } from '../data/mockData';
```

---

## Styling Patterns

### Tailwind CSS Utilities
Primary styling method. Use utility classes for most styling.

**Pattern:**
```jsx
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow">
  <span className="text-lg font-semibold text-gray-900">Content</span>
</div>
```

### Inline Styles (For Complex Cases)
Use inline styles only for:
- Complex gradients
- Dynamic colors
- Backdrop filters
- Conditional complex styles

**Pattern:**
```jsx
<div
  style={{
    background: isDarkMode
      ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
      : '#f5f5f5'
  }}
>
```

### Conditional Classes
```jsx
// Using template literals
className={`base-class ${condition ? 'conditional-class' : 'alt-class'}`}

// Using template literals with multiple conditions
className={`
  flex items-center
  ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}
  ${isActive ? 'border-orange-500' : 'border-transparent'}
`}
```

### Dark Mode Pattern
All components receive `isDarkMode` boolean and conditionally style.

**Pattern:**
```jsx
<div
  className={`p-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
>
```

---

## State Management

### useState Hook
Used for local component state.

**Pattern:**
```javascript
// Simple state
const [count, setCount] = useState(0);

// Object state
const [formData, setFormData] = useState({
  name: '',
  email: ''
});

// Array state
const [items, setItems] = useState([]);

// Boolean state
const [isOpen, setIsOpen] = useState(false);
```

### State Update Patterns

**Updating Arrays:**
```javascript
// Add item
setItems([...items, newItem]);

// Remove item
setItems(items.filter(item => item.id !== idToRemove));

// Update item
setItems(items.map(item =>
  item.id === targetId ? { ...item, ...updates } : item
));
```

**Updating Objects:**
```javascript
setFormData({
  ...formData,
  email: newEmail
});
```

### useEffect Hook
Used for side effects.

**Pattern:**
```javascript
// Run once on mount
useEffect(() => {
  // Setup code
  return () => {
    // Cleanup code
  };
}, []); // Empty dependency array

// Run when dependencies change
useEffect(() => {
  // Effect code
}, [dependency1, dependency2]);
```

### useRef Hook
Used for DOM refs and mutable values.

**Pattern:**
```javascript
const scrollRef = useRef(null);

// Access DOM element
scrollRef.current.scrollTo(0, 100);
```

---

## Props Patterns

### Prop Types
No TypeScript or PropTypes currently used. Props documented in component files.

### Common Props Pattern
```javascript
// Theme props (almost all components)
isDarkMode: Boolean
setIsDarkMode: Function

// Data props
expenses: Array
roommates: Array
budget: Object

// Callback props
onSubmit: Function
onClose: Function
```

### Passing Props
```jsx
<Component
  prop1={value1}
  prop2={value2}
  onEvent={handleEvent}
/>
```

### Spreading Props (Avoid Currently)
Not currently used, but acceptable for wrapper components:
```jsx
<WrappedComponent {...commonProps} specificProp={value} />
```

---

## Event Handling

### Event Handler Pattern
```javascript
// In component body
const handleClick = (e) => {
  e.preventDefault(); // If needed
  // Handle logic
};

// In JSX
<button onClick={handleClick}>Click</button>
```

### Event Handler with Parameters
```javascript
// Method 1: Arrow function in JSX
<button onClick={() => handleDelete(id)}>Delete</button>

// Method 2: Curried function
const handleDelete = (id) => () => {
  // Delete logic with id
};

<button onClick={handleDelete(id)}>Delete</button>
```

### Form Handling
```javascript
const handleSubmit = (e) => {
  e.preventDefault();
  // Form logic
};

<form onSubmit={handleSubmit}>
  <input
    value={value}
    onChange={(e) => setValue(e.target.value)}
  />
</form>
```

---

## Data Handling

### Mock Data Import
```javascript
import { expenses, roommates, monthlyBudget } from './data/mockData';
```

### Data Filtering Pattern
```javascript
const filtered = expenses.filter(expense => {
  // Date filter
  const matchesDate = selectedDateRange === 'All' ||
    isInDateRange(expense.date, selectedDateRange);

  // Category filter
  const matchesCategory = selectedCategory === 'All' ||
    expense.category === selectedCategory;

  // Search filter
  const matchesSearch = expense.description
    .toLowerCase()
    .includes(searchTerm.toLowerCase());

  return matchesDate && matchesCategory && matchesSearch;
});
```

### Data Transformation
```javascript
// Get unique categories
const categories = ['All', ...new Set(expenses.map(e => e.category))];

// Calculate totals
const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);

// Sort by date
const sorted = [...expenses].sort((a, b) =>
  new Date(b.date) - new Date(a.date)
);
```

---

## Helper Functions

### Placement
Helper functions defined inside component (not exported).

**Pattern:**
```javascript
const ComponentName = ({ data }) => {
  // Helper functions here
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getRoommateName = (id) => {
    const roommate = roommates.find(r => r.id === id);
    return roommate ? roommate.name : 'Unknown';
  };

  return <div>...</div>;
};
```

### Utility Functions (Future)
For shared helpers, create `src/utils/` folder:
```
src/utils/
├── dateHelpers.js
├── formatters.js
└── calculations.js
```

---

## JSX Patterns

### Conditional Rendering

**If/Else:**
```jsx
{condition ? (
  <ComponentA />
) : (
  <ComponentB />
)}
```

**If Only:**
```jsx
{condition && <Component />}
```

**Multiple Conditions:**
```jsx
{isLoading ? (
  <Loading />
) : hasError ? (
  <Error />
) : (
  <Content />
)}
```

### Lists (map)
```jsx
{items.map(item => (
  <div key={item.id}>
    {item.name}
  </div>
))}
```

**Always include key prop!**

### Fragments
```jsx
// Short syntax
<>
  <Child1 />
  <Child2 />
</>

// With key (when needed)
<React.Fragment key={item.id}>
  <Child1 />
  <Child2 />
</React.Fragment>
```

---

## Comments

### Component Comments
```javascript
// Component description at top
const Dashboard = ({ budget, expenses }) => {
  // Section comments for complex logic
  // Calculate total expenses for the month
  const monthlyTotal = expenses
    .filter(e => e.month === currentMonth)
    .reduce((sum, e) => sum + e.amount, 0);

  return <div>...</div>;
};
```

### JSX Comments
```jsx
<div>
  {/* Comment inside JSX */}
  <Component />
</div>
```

### TODO Comments
```javascript
// TODO: Add authentication
// TODO: Replace mock data with API call
// FIXME: Bug with date calculation
```

---

## Code Formatting

### Indentation
- 2 spaces (not tabs)
- Consistent throughout project

### Line Length
- Aim for ~80-100 characters
- Break long lines sensibly

### Quotes
- Prefer single quotes for strings: `'hello'`
- Use double quotes in JSX: `<div className="class">`

### Semicolons
- Used consistently throughout
- Added at end of statements

### Spacing
```javascript
// Space after keywords
if (condition) {
  // code
}

// Space around operators
const result = a + b;

// No space in function calls
functionName(arg1, arg2);

// Space in object literals
const obj = { key: value };
```

---

## Error Handling (Future)

Currently minimal error handling. When backend is added:

### Try/Catch for Async
```javascript
const fetchData = async () => {
  try {
    const data = await api.getData();
    setData(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

### Error Boundaries
```jsx
// To be added
<ErrorBoundary>
  <Component />
</ErrorBoundary>
```

---

## localStorage Usage

### Current Pattern (Temporary)
```javascript
// Save
localStorage.setItem('venmoUsername', username);

// Load
const username = localStorage.getItem('venmoUsername') || '';
```

### Future Pattern (With Backend)
Replace with database storage:
```javascript
// Save to Supabase
await supabase
  .from('user_settings')
  .update({ venmo_username: username })
  .eq('user_id', userId);
```

---

## Performance Considerations

### Current (No Optimization)
Components re-render freely. This works for current mock data scale.

### Future Optimizations
```javascript
// Memoize expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>...</div>;
});

// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Memoize callbacks
const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

---

## Testing (Not Yet Implemented)

When tests are added, follow these conventions:

### File Naming
```
Component.jsx
Component.test.jsx
```

### Test Structure
```javascript
describe('ComponentName', () => {
  it('should render correctly', () => {
    // Test
  });

  it('should handle user interaction', () => {
    // Test
  });
});
```

---

## Git Commit Messages

Based on existing commit history:

### Pattern
```
<type>: <description>

Examples:
UI done for overview
added search functionality and filters
almost done with balances page
made everything responsive for all screens
```

### Future Recommended Pattern
```
feat: Add expense filtering
fix: Correct balance calculation
refactor: Extract reusable modal component
docs: Update README with setup instructions
style: Format code with Prettier
test: Add tests for expense calculations
```

---

## Anti-Patterns (Avoid)

### Don't:
- ❌ Use class components
- ❌ Mutate state directly
- ❌ Forget key prop in lists
- ❌ Use indexes as keys (when items can reorder)
- ❌ Create functions inside JSX render (unless necessary)
- ❌ Inline complex logic in JSX
- ❌ Use var (use const/let)
- ❌ Commit console.log statements
- ❌ Leave TODO comments forever

### Do:
- ✅ Use functional components with hooks
- ✅ Keep components small and focused
- ✅ Extract reusable logic
- ✅ Use meaningful variable names
- ✅ Comment complex logic
- ✅ Handle edge cases
- ✅ Provide user feedback for actions
- ✅ Make UI accessible

---

**Last Updated:** 2025-10-30
**Style Guide Version:** 1.0
**TypeScript:** Not yet implemented (consider for v2)
**Linting:** Not configured (consider ESLint + Prettier)
