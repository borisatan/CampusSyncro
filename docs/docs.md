# Tabs Folder Documentation

This document provides an overview of each file in the `app/(tabs)` folder, explaining their purpose and functionality.

## File Overview

### `_layout.tsx`
**Purpose**: Tab navigation layout configuration
- Configures the bottom tab bar navigation for the app
- Defines 4 main tabs: Dashboard, Add Transaction, Transaction List, and Profile
- Sets up tab styling with dark theme colors and safe area handling
- Hides the index route from the tab bar (used for redirects only)

### `index.tsx`
**Purpose**: Default route redirect
- Simple redirect component that automatically navigates users to the dashboard
- Acts as the entry point when users land on the root tab route

### `dashboard.tsx`
**Purpose**: Main financial overview screen
- Displays financial summary with total balance and expenses
- Shows budget progress bar and spending breakdown by category
- Features time period toggles (Daily, Weekly, Monthly)
- Includes spending circle chart and category expense cards
- Implements data caching and preloading for better performance
- Supports pull-to-refresh functionality

### `add-transaction.tsx`
**Purpose**: Transaction creation and category management
- Allows users to add new financial transactions
- Provides account selection and category grid interface
- Supports both transaction creation and category management modes
- Includes category editing, deletion, and creation capabilities
- Features transaction modal for amount and description input
- Integrates with Supabase for data persistence

### `transaction-list.tsx`
**Purpose**: Transaction history and filtering
- Displays paginated list of all transactions grouped by date
- Provides search functionality across transaction details
- Includes advanced filtering by category, account, and date range
- Supports infinite scrolling with pagination
- Features pull-to-refresh for data updates
- Shows category icons and transaction details

### `profile.tsx`
**Purpose**: Account management interface
- Displays all user accounts with current balances
- Allows editing of account names and balances
- Features modal-based editing interface
- Supports dark/light theme switching
- Formats currency display in EUR
- Provides account overview with visual balance indicators

## Key Features Across Files

- **Theme Support**: All files support both dark and light themes
- **Safe Area Handling**: Proper safe area insets for different device types
- **Data Persistence**: Integration with Supabase backend
- **Loading States**: Proper loading indicators and error handling
- **Responsive Design**: Mobile-first design with proper spacing and typography
- **Accessibility**: Proper text sizing and contrast for readability

## Components by Screen

### `dashboard.tsx`
- **`HeaderSection`**: Displays total balance and expenses summary.
- **`BudgetProgressBar`**: Shows progress toward a budget target.
- **`SpendingCircleChart`**: Visualizes spending distribution by category.
- **`TimePeriodToggles`**: Switches between Daily/Weekly/Monthly views.
- **`ExpenseCategoryCard`**: Lists categories with amounts and percentages.

### `add-transaction.tsx`
- **`Header`**: Toggles edit mode; provides page-level actions.
- **`AccountSelector`**: Selects the account for the transaction.
- **`CategoryGrid`**: Grid of categories; supports selection and edit/delete actions.
- **`TransactionModal`**: Collects amount, description, and account; submits to backend.
- **`CategoryModalWrapper`**: Creates/edits categories and updates the list.

### `transaction-list.tsx`
- **`TransactionsHeader`**: Search input and filter trigger.
- **`TransactionsList`**: Sectioned list grouped by date; supports refresh and infinite scroll.
- **`FilterModal`**: Filters by date range and accounts.

### `profile.tsx`
- (Uses only base React Native and safe area components.)
  - Modal UI to edit selected account name and balance.

### `_layout.tsx`
- (Navigation-only file.)
  - Configures `Tabs` with icons and styles; no reusable UI components.
