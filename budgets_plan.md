# Budgets Feature Implementation Plan

## Overview
Implement budgeting functionality with "Budgets" (supercategories) that group spending categories. Users can set spending limits as fixed amounts or percentages of income, with visual progress tracking.

---

## Database Schema

### New `Budgets` Table
```sql
CREATE TABLE Budgets (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7) NOT NULL,  -- Hex color e.g., "#FF5722"
  amount_type VARCHAR(10) NOT NULL CHECK (amount_type IN ('dollar', 'percentage')),
  amount DECIMAL(12, 2) NOT NULL,  -- Dollar amount or percentage value
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'custom')),
  custom_start_date DATE,  -- Required if period_type = 'custom'
  custom_end_date DATE,    -- Required if period_type = 'custom'
  manual_income DECIMAL(12, 2),  -- Manual income for percentage budgets
  use_dynamic_income BOOLEAN DEFAULT FALSE,  -- Toggle for income source
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE Budgets ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own budgets
CREATE POLICY "Users can manage own budgets" ON Budgets
  FOR ALL USING (auth.uid() = user_id);
```

### Modify `Categories` Table
```sql
ALTER TABLE Categories
ADD COLUMN budget_id INTEGER REFERENCES Budgets(id) ON DELETE SET NULL;
```

### New RPC Function: Fetch Income for Period
```sql
CREATE OR REPLACE FUNCTION fetch_income_for_period(
  p_start_date DATE,
  p_end_date DATE
)
RETURNS DECIMAL AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount)
     FROM Transactions
     WHERE user_id = auth.uid()
       AND category_name = 'Income'
       AND created_at >= p_start_date
       AND created_at < p_end_date + INTERVAL '1 day'),
    0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Type Definitions

**File:** `app/types/types.ts`

```typescript
// New types to add
export type BudgetAmountType = 'dollar' | 'percentage';
export type BudgetPeriodType = 'weekly' | 'monthly' | 'custom';

export interface Budget {
  id: number;
  user_id: string;
  name: string;
  color: string;
  amount_type: BudgetAmountType;
  amount: number;
  period_type: BudgetPeriodType;
  custom_start_date?: string;  // ISO date string
  custom_end_date?: string;
  manual_income?: number;
  use_dynamic_income: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetWithSpent extends Budget {
  spent: number;           // Calculated from transactions
  limit: number;           // Resolved limit (handles percentage conversion)
  percentage_used: number; // spent / limit * 100
  categories: Category[];  // Categories assigned to this budget
}
```

**Modify Category interface:**
```typescript
export interface Category {
  // ... existing fields
  budget_id?: number | null;  // Add this field
}
```

---

## Files to Create/Modify

### 1. Backend Service
**File:** `app/services/backendService.ts`

Add functions:
- `fetchBudgets()` - Get all budgets for current user
- `saveBudget(payload, id?)` - Create or update budget
- `deleteBudget(id)` - Remove budget
- `fetchIncomeForPeriod(startDate, endDate)` - Get income for date range
- `assignCategoryToBudget(categoryId, budgetId)` - Update category's budget_id
- `unassignCategoryFromBudget(categoryId)` - Set category's budget_id to null
- `fetchBudgetSpending(budgetId, startDate, endDate)` - Sum spending for budget's categories

### 2. Zustand Store
**File:** `app/store/useBudgetsStore.ts` (new file)

```typescript
interface BudgetsState {
  budgets: Budget[];
  isLoading: boolean;
  loadBudgets: () => Promise<void>;
  addBudgetOptimistic: (budget: Budget) => void;
  updateBudgetOptimistic: (id: number, updates: Partial<Budget>) => void;
  deleteBudgetOptimistic: (id: number) => void;
}
```

### 3. Navigation & Routing

**File:** `app/(tabs)/profile.tsx`
- Add "Budgets" menu item below "Currency" section
- Navigate to `/budgets` on tap

**New Files:**
- `app/budgets/_layout.tsx` - Stack layout for budgets screens
- `app/budgets/index.tsx` - Main budgets list page
- `app/budgets/edit.tsx` - Full-screen create/edit form

### 4. UI Components

**New Directory:** `app/components/BudgetsPage/`

| Component | Purpose |
|-----------|---------|
| `BudgetCard.tsx` | Individual budget card with progress bar |
| `BudgetProgressBar.tsx` | Visual progress with color states |
| `IncomeSummary.tsx` | Shows income (manual or dynamic) with edit option |
| `CategorySelector.tsx` | Grid for assigning categories to budget |
| `PeriodSelector.tsx` | Weekly/Monthly/Custom period picker |
| `ColorPicker.tsx` | Color selection grid for budget |

---

## Implementation Steps

### Phase 1: Database & Backend
1. Create `Budgets` table in Supabase (user handles SQL)
2. Add `budget_id` column to `Categories` table
3. Create `fetch_income_for_period` RPC function
4. Add budget CRUD functions to `backendService.ts`
5. Create `useBudgetsStore.ts` Zustand store

### Phase 2: Budgets List Screen
1. Create `app/budgets/_layout.tsx` stack navigator
2. Create `app/budgets/index.tsx` main screen
3. Build `BudgetCard.tsx` component with:
   - Budget name and color indicator
   - Spent vs limit display
   - Progress bar (green → yellow at 80% → red at 100%+)
   - Category chips showing assigned categories
4. Build `IncomeSummary.tsx` for percentage budget income display
5. Add "Budgets" link to profile page

### Phase 3: Create/Edit Budget Screen
1. Create `app/budgets/edit.tsx` full-screen form
2. Build form sections:
   - Name input
   - Color picker (grid of colors)
   - Amount type toggle (Fixed Amount / Percentage)
   - Amount input with dynamic label ($ or %)
   - Period selector (Weekly / Monthly / Custom)
   - Custom date range picker (when Custom selected)
   - Income source toggle (for percentage budgets)
   - Manual income input (when toggle is off)
   - Category assignment grid
3. Implement save/delete logic with optimistic updates

### Phase 4: Budget Calculations
1. Implement period date range calculation:
   - Weekly: Current week (or rolling 7 days from last reset)
   - Monthly: Current month (or rolling 30 days)
   - Custom: Calculate current cycle based on start/end dates
2. Implement spending aggregation per budget
3. Implement dynamic income fetching for percentage budgets
4. Calculate and display budget status (good/warning/over)

### Phase 5: Integration
1. Update `useCategoriesStore` to include `budget_id` field
2. Hook into `DataRefreshContext` for budget data refresh
3. Update category editor to show which budget a category belongs to (read-only indicator)

---

## UI/UX Specifications

### Budget Card Visual States
| State | Condition | Color |
|-------|-----------|-------|
| Good | < 80% spent | Green |
| Warning | 80-99% spent | Yellow/Amber |
| Over Budget | >= 100% spent | Red |

### Progress Bar
- Fills left to right based on percentage spent
- Can overflow past 100% (shows overspending visually)
- Smooth color transitions

### Budget List Screen Layout
```
+----------------------------------+
| <- Budgets                    +  |  (Header with add button)
+----------------------------------+
| +------------------------------+ |
| | Income This Month    [Edit]  | |  (For percentage budgets)
| | $4,500.00                    | |
| +------------------------------+ |
+----------------------------------+
| +------------------------------+ |
| | [green] Food & Dining        | |
| | $245 / $400                  | |
| | ============-------- 61%     | |
| | [Groceries] [Restaurants]    | |
| +------------------------------+ |
| +------------------------------+ |
| | [yellow] Entertainment       | |
| | $180 / $200                  | |
| | ================---- 90%     | |
| | [Movies] [Games] [Streaming] | |
| +------------------------------+ |
| +------------------------------+ |
| | [red] Shopping               | |
| | $520 / $300                  | |
| | ==================== 173%    | |
| | [Clothing] [Electronics]     | |
| +------------------------------+ |
+----------------------------------+
```

### Create/Edit Budget Screen Layout
```
+----------------------------------+
| <- Create Budget          [Save] |
+----------------------------------+
| Budget Name                      |
| +------------------------------+ |
| | Food & Dining                | |
| +------------------------------+ |
+----------------------------------+
| Color                            |
| [red][orange][yellow][green]     |
| [blue][purple][black][white]     |
+----------------------------------+
| Budget Type                      |
| [Fixed Amount] [Percentage]      |
+----------------------------------+
| Amount                           |
| +------------------------------+ |
| | $ 400.00                     | |
| +------------------------------+ |
+----------------------------------+
| Period                           |
| [Weekly] [Monthly] [Custom]      |
+----------------------------------+
| Categories                       |
| +-----+ +-----+ +-----+          |
| | [x] | | [x] | |     |          |
| |Groc.| |Rest.| |Cafe |          |
| +-----+ +-----+ +-----+          |
+----------------------------------+
|           [Delete Budget]        |  (Only for existing budgets)
+----------------------------------+
```

---

## Period Reset Logic

### Weekly
- Resets every Monday at 00:00
- Date range: Monday -> Sunday of current week

### Monthly
- Resets on the 1st of each month at 00:00
- Date range: 1st -> last day of current month

### Custom
- User defines start and end date
- Duration = end_date - start_date (e.g., 8 days)
- Resets every N days from the original start date
- Example: Start Jan 1, End Jan 8 -> resets Jan 9, Jan 17, Jan 25...

```typescript
function getCurrentCustomPeriod(startDate: Date, endDate: Date): { start: Date, end: Date } {
  const periodDays = differenceInDays(endDate, startDate);
  const today = new Date();
  const daysSinceStart = differenceInDays(today, startDate);
  const currentCycle = Math.floor(daysSinceStart / periodDays);

  const cycleStart = addDays(startDate, currentCycle * periodDays);
  const cycleEnd = addDays(cycleStart, periodDays - 1);

  return { start: cycleStart, end: cycleEnd };
}
```

---

## Verification & Testing

1. **Create budget**: Navigate Profile -> Budgets -> "+" -> Fill form -> Save
2. **Assign categories**: Edit budget -> Select categories -> Save
3. **View spending**: Add transactions in assigned categories -> Verify budget updates
4. **Progress colors**: Test thresholds at 79%, 80%, 99%, 100%, 150%
5. **Period reset**: Verify weekly/monthly/custom budgets reset correctly
6. **Percentage budgets**: Toggle income source -> Verify limit calculation
7. **Delete budget**: Verify categories are unassigned (budget_id -> null)
8. **Edge cases**:
   - Budget with no categories (shows $0 spent)
   - Category reassignment between budgets
   - Custom period spanning year boundary

---

## Key Files Summary

| File | Action |
|------|--------|
| `app/types/types.ts` | Add Budget types |
| `app/services/backendService.ts` | Add budget CRUD functions |
| `app/store/useBudgetsStore.ts` | Create new store |
| `app/(tabs)/profile.tsx` | Add Budgets navigation link |
| `app/budgets/_layout.tsx` | Create stack layout |
| `app/budgets/index.tsx` | Create list screen |
| `app/budgets/edit.tsx` | Create form screen |
| `app/components/BudgetsPage/*.tsx` | Create UI components |

---

## Design Decisions Summary

| Decision | Choice |
|----------|--------|
| Terminology | "Budgets" (supercategories) |
| Category assignment | One category -> one budget only (nullable) |
| Time periods | Weekly, Monthly, Custom (up to 1 year) |
| Limit types | Fixed dollar OR percentage of income |
| Income source | Toggle: manual (default) or dynamic from transactions |
| Dynamic income period | Matches budget's period |
| Rollover | None - resets based on period |
| Navigation | Profile page -> full screen Budgets page |
| Unassigned categories | Not tracked in any budget (user's choice) |
| Visual alerts | Green (<80%) -> Yellow (80-99%) -> Red (>=100%) |
| Budget colors | User-selected when creating/editing |
| Forms | Full-screen forms |
| Transfer feature | Not included (future enhancement) |
