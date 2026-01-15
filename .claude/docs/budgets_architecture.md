# Budgets CRUD Architecture

This document explains how budgets are created, read, updated, and deleted in the Perfin app, and how data flows between the UI, Zustand store, and Supabase database.

## Overview

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   UI Components  │ ←→ │  Zustand Store   │ ←→ │    Supabase DB   │
│                  │    │ (useBudgetsStore)│    │  (Budgets table) │
└──────────────────┘    └──────────────────┘    └──────────────────┘
        ↕                        ↕
   budget-edit.tsx         backendService.ts
   budgets.tsx
```

## Key Files

| File | Purpose |
|------|---------|
| `app/(tabs)/budgets.tsx` | Budget list screen - displays all budgets |
| `app/(tabs)/budget-edit.tsx` | Create/Edit budget screen |
| `app/store/useBudgetsStore.ts` | Zustand store for budget state management |
| `app/services/backendService.ts` | API layer for Supabase operations |
| `app/hooks/useBudgetsData.ts` | Custom hook for fetching budget data with spending |
| `app/types/types.ts` | Budget TypeScript interfaces |

---

## Data Model

### Budget Interface (`app/types/types.ts:81-96`)

```typescript
export interface Budget {
  id: number;
  user_id: string;
  name: string;
  color: string;
  amount_type: 'money_amount' | 'percentage';
  amount: number;
  period_type: 'weekly' | 'monthly' | 'custom';
  custom_start_date?: string;
  custom_end_date?: string;
  manual_income?: number;
  use_dynamic_income: boolean;
  created_at: string;
  updated_at: string;
  sort_order?: number;
}
```

### BudgetWithSpent (Extended for display)

```typescript
export interface BudgetWithSpent extends Budget {
  spent: number;        // Amount spent in current period
  limit: number;        // Budget limit (resolved from percentage if needed)
  percentage_used: number;
  categories: Category[];
}
```

---

## Zustand Store (`app/store/useBudgetsStore.ts`)

The store provides centralized state management for budgets with optimistic updates.

### State

```typescript
interface BudgetsState {
  budgets: Budget[];
  isLoading: boolean;
}
```

### Actions

| Action | Description |
|--------|-------------|
| `loadBudgets()` | Fetches all budgets from Supabase, sorts by `sort_order` |
| `setBudgets(budgets)` | Directly sets the budgets array |
| `addBudgetOptimistic(budget)` | Adds a budget to local state immediately |
| `updateBudgetOptimistic(id, updates)` | Updates a budget in local state |
| `deleteBudgetOptimistic(id)` | Removes a budget from local state |
| `reorderBudgets(reordered)` | Sets a reordered budget list |

### Data Flow for `loadBudgets()`

```
1. Store sets isLoading = true
2. Calls fetchBudgets() from backendService
3. Backend queries Supabase: SELECT * FROM Budgets ORDER BY sort_order
4. Results sorted and stored
5. Store sets isLoading = false
```

---

## Backend Service Functions (`app/services/backendService.ts`)

### READ: `fetchBudgets()` (line 435)

```typescript
export const fetchBudgets = async (): Promise<Budget[]> => {
  const { data, error } = await supabase
    .from('Budgets')
    .select('*')
    .order('sort_order', { ascending: true, nullsFirst: false });
  return data ?? [];
};
```

### CREATE/UPDATE: `saveBudget()` (line 445)

Handles both create and update based on whether `id` is provided.

```typescript
export const saveBudget = async (
  payload: Omit<Budget, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
  id?: number
): Promise<Budget> => {
  if (id) {
    // UPDATE: Uses .update() with .eq('id', id)
  } else {
    // CREATE: Uses .insert() with user_id from auth
  }
};
```

### DELETE: `deleteBudget()` (line 480)

```typescript
export const deleteBudget = async (id: number): Promise<void> => {
  await supabase
    .from('Budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);
};
```

### Supporting Functions

| Function | Purpose |
|----------|---------|
| `updateCategoryBudgetId()` | Links/unlinks categories to budgets |
| `fetchBudgetSpending()` | Gets total spending for budget's categories |
| `updateBudgetSortOrder()` | Updates a single budget's sort order |
| `reorderBudgetPosition()` | Handles reordering when moving a budget up/down |
| `shiftBudgetsForInsert()` | Shifts existing budgets to make room for new one |
| `updateBudgetsOrder()` | Batch updates sort_order for multiple budgets |

---

## CRUD Operations Flow

### CREATE Budget (`budget-edit.tsx` - handleSave)

```
1. User fills form and taps "Create Budget"
2. validateForm() checks:
   - Name is not empty
   - Amount > 0
   - Percentage ≤ 100% (when combined with other budgets)
   - Amount ≤ remaining income (for fixed amounts)
3. shiftBudgetsForInsert() makes room at chosen position
4. saveBudget(payload) inserts into Supabase
5. updateCategoryBudgetId() links selected categories
6. addBudgetOptimistic() updates local store
7. loadBudgets() refreshes from database
8. Navigate back to budgets list
```

### READ Budgets (`budgets.tsx`)

```
1. useBudgetsData() hook initializes
2. Calls loadBudgets() → fetchBudgets() → Supabase query
3. For each budget, calculates:
   - Period dates (weekly/monthly/custom)
   - Spending via fetchBudgetSpending()
   - Limit (converts percentage to amount if needed)
   - Usage percentage
4. Returns budgetsWithSpent array for rendering
```

### UPDATE Budget (`budget-edit.tsx` - handleSave with budgetId)

```
1. Form pre-populated from existingBudget
2. User makes changes and taps "Update Budget"
3. validateForm() runs
4. saveBudget(payload, budgetId) updates in Supabase
5. reorderBudgetPosition() if sort_order changed
6. Category assignments updated (add new, remove old)
7. updateBudgetOptimistic() updates local store
8. loadBudgets() refreshes from database
```

### DELETE Budget (`budget-edit.tsx` - handleDelete)

```
1. User taps trash icon
2. Confirmation alert shown
3. Categories unlinked (budget_id set to null)
4. deleteBudget(budgetId) removes from Supabase
5. deleteBudgetOptimistic(budgetId) updates local store
6. loadBudgets() refreshes from database
7. Navigate back to budgets list
```

---

## Optimistic Updates Pattern

The app uses optimistic updates for responsive UI:

```typescript
// Example: Delete flow
handleDelete = async () => {
  // 1. Update UI immediately (optimistic)
  deleteBudgetOptimistic(budgetId);

  // 2. Perform actual database operation
  await deleteBudget(budgetId);

  // 3. Refresh from source of truth
  await loadBudgets();
};
```

This provides instant feedback while ensuring data consistency.

---

## Category-Budget Relationship

Budgets track spending via linked categories:

- `Categories` table has `budget_id` foreign key
- One budget can have many categories
- Categories fetched via `useCategoriesStore`
- Spending calculated by summing transactions in those categories

```typescript
// In useBudgetsData.ts
const budgetCategories = categories.filter(cat => cat.budget_id === budget.id);
const categoryNames = budgetCategories.map(cat => cat.category_name);
const spent = await fetchBudgetSpending(categoryNames, startDate, endDate);
```

---

## Income Integration

Budgets support two income modes:

1. **Dynamic Income**: Calculated from "Income" category transactions
2. **Manual Income**: User-specified fixed amount

For percentage-based budgets, the limit is calculated:
```typescript
if (budget.amount_type === 'percentage') {
  limit = (budget.amount / 100) * effectiveIncome;
}
```

Income settings stored in `useIncomeStore` (AsyncStorage, not Supabase).

---

## Validation (Added in budget-edit.tsx)

Budget creation/editing includes validation to prevent over-allocation:

1. **Percentage budgets**: Sum of all percentage budgets cannot exceed 100%
2. **Fixed amount budgets**: Sum of all budget amounts cannot exceed total income

The validation calculates what other budgets have already allocated and limits the current budget accordingly.
