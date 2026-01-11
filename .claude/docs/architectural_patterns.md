# Architectural Patterns

## Provider Hierarchy

Providers are nested in a specific order in `app/_layout.tsx:24-52`:
```
GestureHandlerRootView → SafeAreaProvider → AuthProvider → CurrencyInitializer →
DataPreloader → DataRefreshProvider → ThemeProvider → AppThemeProvider → KeyboardProvider → Stack
```

Data-dependent providers (DataRefresh, Theme) come after auth; initializers run early.

## State Management: Zustand with Optimistic Updates

All three stores follow the same pattern (`app/store/`):

1. Local state array + loading flag
2. `load*()` async function fetches from Supabase
3. `*Optimistic()` methods for immediate UI updates
4. Pattern example in `useAccountsStore.ts:33-46`

```
addAccountOptimistic(account)    → append to local state
updateAccountOptimistic(id, updates) → map and merge
deleteAccountOptimistic(id)      → filter out
```

Always call optimistic update first, then fire the API call.

## Cross-Screen Data Refresh

The `DataRefreshContext` (`app/context/DataRefreshContext.tsx`) coordinates refreshes across screens:

1. Each screen registers its refresh function on mount via `register*Refresh()`
2. After mutations (add/edit/delete), call `refreshAll()` or specific `refresh*()` methods
3. Pattern: register in useEffect, trigger after successful API calls

Used by: Dashboard, Accounts, Transaction List screens

## Backend Service Layer

All Supabase calls are centralized in `app/services/backendService.ts`.

**Pattern**: Each function handles one operation, throws on error, returns data.
- CRUD functions: `create*`, `fetch*`, `update*`, `delete*`
- Aggregations use Supabase RPC: `fetchTotalBalance`, `fetchCategoryAggregates`

**Income Exclusion**: Dashboard analytics exclude "Income" category from expense totals. See `fetchCategoryAggregates:178` and `fetchTransactionsByDateRange:125`.

## Dashboard Data Caching

`useDashboardData` hook (`app/hooks/useDashboardData.ts`) implements time-frame caching:

1. Preloads data for all three periods (week, month, year) in parallel
2. Caches results in local state
3. Switching time frames uses cached data instantly
4. `refresh(true)` forces cache invalidation

## Component Organization

Components grouped by parent page in `app/components/`:
- `HomePage/` - Dashboard widgets (charts, summaries, category breakdowns)
- `AddTransactionPage/` - Form fields, category grid, account selector
- `TransactionListPage/` - List items, filters, headers
- `AccountsPage/` - Account cards, add/edit forms
- `Shared/` - Reusable across pages (modals, spinners, date selectors)

## Auth Pattern

`AuthContext` (`app/context/AuthContext.tsx:11-45`) provides:
- `userId: string | null`
- `isLoading: boolean`

Subscribes to Supabase auth state changes. Use `useAuth()` hook to access.

## Styling Conventions

- Dark theme primary: surface `#20283A`, background `#0A0F1F`
- Accent colors defined in `tailwind.config.js:15-18`: teal (edit), blue (confirm), red (delete)
- Category colors under `colors.category` in tailwind config
- Use NativeWind className prop for all styling
