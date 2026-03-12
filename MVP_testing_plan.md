# Perfin MVP Testing Plan

## Overview

This testing plan covers all critical functionality of the Perfin personal finance app, focusing on main features, potential failure points, and edge cases that could break the user experience.

---

## 1. Authentication & Security Testing

### 1.1 Email/Password Sign Up

**What could break:**

- Email validation failing
- Password requirements not enforced
- Duplicate email registration
- Profile creation failing after auth success
- No redirect to dashboard after successful signup

**How to test:**

- [ ] Sign up with valid email and password → Should create account and redirect to dashboard
- [ ] Sign up with invalid email formats (no @, missing domain) → Should show validation error
- [ ] Sign up with weak password → Should show password requirements
- [ ] Sign up with already registered email → Should show error message
- [ ] Sign up and verify profile created in Supabase → Check Profiles table has entry
- [ ] Complete signup and close app → Reopen should remember session

### 1.2 OAuth Sign Up (Google/Apple)

**What could break:**

- OAuth redirect failing
- Callback URL not configured
- Profile not created after OAuth
- Session not persisted

**How to test:**

- [ ] Sign up with Google → Should redirect, authenticate, and land on dashboard
- [ ] Sign up with Apple → Should redirect, authenticate, and land on dashboard
- [ ] Complete OAuth and verify profile created → Check Profiles table
- [ ] OAuth signup and close app → Reopen should maintain session

### 1.3 Sign In

**What could break:**

- Incorrect credentials not handled
- Session not persisting
- Biometric auth failing when enabled
- Redirect loop if already authenticated

**How to test:**

- [ ] Sign in with correct email/password → Should access dashboard
- [ ] Sign in with wrong password → Should show error
- [ ] Sign in with non-existent email → Should show error
- [ ] Sign in with biometric enabled → Should prompt for fingerprint/Face ID
- [ ] Sign in with biometric disabled → Should use password only
- [ ] Sign in and close app → Reopen should stay logged in
- [ ] Sign out and reopen app → Should require login again

### 1.4 App Lock & Biometric

**What could break:**

- Biometric not available on device
- User denies biometric permission
- Credentials not saved securely
- App lock not triggering when enabled

**How to test:**

- [ ] Enable app lock without biometric hardware → Should disable or show message
- [ ] Enable app lock with biometric → Should save preference
- [ ] Lock app and reopen → Should prompt for biometric
- [ ] Fail biometric 3 times → Should fallback to password
- [ ] Disable app lock → Should no longer prompt on reopen

---

## 2. Onboarding Flow Testing

### 2.1 Complete Onboarding Flow

**What could break:**

- Navigation between steps failing
- Data not persisting between steps
- Skip functionality breaking flow
- Categories not created after preselection
- Budget allocations not saved
- Practice transaction not creating real transaction

**How to test:**

- [ ] Complete all 10 onboarding steps in sequence → Should reach subscription trial
- [ ] Select categories in step 2 → Should create those categories in database
- [ ] Enter monthly income in step 3 → Should save to profile
- [ ] Choose AI budget setup → Should generate budget allocations
- [ ] Choose manual budget setup → Should allow manual entry
- [ ] Create practice transaction in step 9 → Should create real transaction in database
- [ ] Skip from step 5 → Should jump to sign-up without saving partial data
- [ ] Close app at step 4 and reopen → Should resume at step 4

### 2.2 Onboarding Resumption

**What could break:**

- Progress not saved locally
- Resume loading wrong step
- Data from previous session lost

**How to test:**

- [ ] Start onboarding, complete step 3, close app → Reopen should be at step 4
- [ ] Complete onboarding halfway, sign up, sign out → Next login should not show onboarding
- [ ] Skip onboarding, sign up → Should not show onboarding again

---

## 3. Transaction Management Testing

### 3.1 Add Transaction (Expense)

**What could break:**

- Amount validation failing (negative, zero, non-numeric)
- Category not selected causing crash
- Account not selected causing crash
- Account balance not updating after transaction
- Date picker allowing future dates when it shouldn't
- Transaction not appearing in transaction list

**How to test:**

- [ ] Add expense transaction with all fields → Should create successfully
- [ ] Add transaction with amount 0 → Should show validation error or allow based on requirements
- [ ] Add transaction with negative amount → Should convert to positive or show error
- [ ] Add transaction without selecting category → Should show validation error
- [ ] Add transaction without selecting account → Should show validation error
- [ ] Add transaction and check account balance → Should decrease by transaction amount
- [ ] Add transaction with future date → Should create with that date
- [ ] Add transaction and check transaction list → Should appear immediately
- [ ] Add transaction and check dashboard → Should update totals and category aggregates

### 3.2 Add Transaction (Income)

**What could break:**

- Income not increasing account balance
- Income appearing in expense calculations
- Income categories not filtered correctly

**How to test:**

- [ ] Add income transaction → Should increase account balance
- [ ] Add income and check dashboard expense total → Should not include income
- [ ] Add income and check dashboard income total → Should include it
- [ ] Add income to investment account → Should be allowed

### 3.3 Edit Transaction

**What could break:**

- Balance not reverting when transaction modified
- Changed category not updating aggregates
- Changed account not updating balances correctly
- Date change not reordering transaction list

**How to test:**

- [ ] Edit transaction amount from $100 to $150 → Account balance should decrease by additional $50
- [ ] Edit transaction amount from $100 to $50 → Account balance should increase by $50
- [ ] Edit transaction category → Old category aggregate should decrease, new should increase
- [ ] Edit transaction account from A to B → Account A balance should increase, B should decrease
- [ ] Edit transaction date → Should reorder in transaction list
- [ ] Edit transaction description → Should update without affecting balances

### 3.4 Delete Transaction

**What could break:**

- Account balance not reverting
- Transaction still showing in list after deletion
- Dashboard not updating after deletion

**How to test:**

- [ ] Delete $100 expense transaction → Account balance should increase by $100
- [ ] Delete transaction and check transaction list → Should disappear
- [ ] Delete transaction and check dashboard → Totals and aggregates should update
- [ ] Delete transaction from edit screen → Should return to transaction list without that transaction
- [ ] Delete transaction from transaction list swipe → Should remove from list

### 3.5 Transaction List & Filtering

**What could break:**

- Pagination not loading more transactions
- Filters not applying correctly
- Search not finding transactions
- Pull-to-refresh not updating data
- Date grouping showing wrong dates

**How to test:**

- [ ] Load transaction list with 60+ transactions → Should paginate at 50 items
- [ ] Scroll to bottom → Should load next page
- [ ] Filter by category → Should show only transactions with that category
- [ ] Filter by account → Should show only transactions from that account
- [ ] Filter by date range → Should show only transactions in that range
- [ ] Filter by transaction type (expense only) → Should hide income
- [ ] Search for transaction description → Should find matching transactions
- [ ] Pull down to refresh → Should reload transactions
- [ ] Check date grouping → Transactions should be grouped by date correctly

---

## 4. Account Management Testing

### 4.1 Create Account

**What could break:**

- Account name validation
- Initial balance not set correctly
- Account type not saving
- Account not appearing in account list or dropdowns

**How to test:**

- [ ] Create account with name "Checking" and balance $1000 → Should create successfully
- [ ] Create account with empty name → Should show validation error
- [ ] Create account with negative balance → Should allow (overdraft) or show error based on requirements
- [ ] Create account with type "Checking" → Should save type correctly
- [ ] Create account and check accounts list → Should appear
- [ ] Create account and check add transaction account dropdown → Should be available for selection
- [ ] Create account and check total balance on dashboard → Should include new account balance

### 4.2 Edit Account

**What could break:**

- Name change not updating in transactions
- Balance change not reflecting in totals
- Type change affecting transaction creation
- Savings goal not saving

**How to test:**

- [ ] Edit account name from "Checking" to "Main Checking" → All existing transactions should show new name
- [ ] Edit account balance from $1000 to $1500 → Dashboard total balance should increase by $500
- [ ] Edit account type from "Checking" to "Investment" → Should update
- [ ] Set savings goal on account → Should save and display in accounts list
- [ ] Edit account and check dashboard → Should reflect changes immediately

### 4.3 Delete Account

**What could break:**

- Transactions associated with account become orphaned
- Total balance not updating
- Account still appearing in dropdowns
- Cannot delete account with existing transactions

**How to test:**

- [ ] Delete account with no transactions → Should delete successfully
- [ ] Delete account with transactions → Should show warning or prevent deletion
- [ ] Delete account and check total balance → Should update correctly
- [ ] Delete account and check account dropdowns → Should no longer appear
- [ ] Delete account with savings goal → Should handle goal deletion or prevention

### 4.4 Transfer Between Accounts

**What could break:**

- Source account not decreasing
- Destination account not increasing
- Transfer amount not matching
- Transfer creating duplicate transactions
- Deleting transfer not reversing balances

**How to test:**

- [ ] Transfer $200 from Checking to Savings → Checking should decrease $200, Savings should increase $200
- [ ] Transfer more than source account balance → Should allow overdraft or show error
- [ ] Transfer $0 → Should show validation error
- [ ] Transfer and check transaction list → Should show transfer transaction(s)
- [ ] Delete transfer transaction → Both account balances should revert correctly
- [ ] Transfer and check dashboard total balance → Should remain the same (internal transfer)

### 4.5 Reorder Accounts

**What could break:**

- Drag-and-drop not working
- Order not persisting
- Account list showing wrong order after reopen

**How to test:**

- [ ] Drag account to new position → Should reorder visually
- [ ] Reorder accounts and close app → Reopen should maintain order
- [ ] Reorder and check sort_order field in database → Should update correctly

---

## 5. Budget Management Testing

### 5.1 Set Budget Amounts

**What could break:**

- Budget amount not saving
- Budget percentage calculation wrong
- Budget not displaying on dashboard
- Budget health card showing incorrect data

**How to test:**

- [ ] Set budget for "Groceries" to $500 → Should save successfully
- [ ] Set budget and check dashboard budget health → Should show progress bar
- [ ] Spend $300 on groceries → Budget health should show 60% spent
- [ ] Spend $600 on groceries (over budget) → Should show over budget warning
- [ ] Set budget using percentage mode → Should calculate correct dollar amount from income
- [ ] Change income amount → Percentage-based budgets should recalculate

### 5.2 AI Budget Setup

**What could break:**

- AI service failing
- Budget allocations not applying to categories
- Total budget not matching income
- Cache not working

**How to test:**

- [ ] Use AI budget setup with income $3000 → Should generate allocations
- [ ] Check that total allocated equals income → Should match or be close
- [ ] Apply AI budget → All category budgets should update
- [ ] Run AI budget twice → Should use cache second time (faster)
- [ ] Use AI budget with no spending history → Should use default 50/30/20 rule

### 5.3 Budget Dashboard Visibility

**What could break:**

- Toggle not saving
- Dashboard not updating when category toggled off
- Category still showing after being toggled off

**How to test:**

- [ ] Toggle category off in budgets → Should not show on dashboard budget health
- [ ] Toggle category on → Should reappear on dashboard
- [ ] Toggle setting persisting after app restart → Should maintain setting

### 5.4 Income Settings

**What could break:**

- Dynamic income calculation wrong
- Manual income not saving
- Savings target not persisting
- Income mode toggle not working

**How to test:**

- [ ] Set dynamic income mode → Should calculate from income transactions
- [ ] Add income transaction → Dynamic income should update
- [ ] Set manual income mode to $4000 → Should use $4000 for budget calculations
- [ ] Set savings target to $500/month → Should show on dashboard
- [ ] Change income settings and close app → Reopen should persist settings

### 5.5 Category Reordering

**What could break:**

- Drag-and-drop not functioning
- Order not persisting
- Wrong categories being reordered

**How to test:**

- [ ] Drag category to new position in budgets list → Should reorder
- [ ] Reorder and close app → Reopen should maintain order
- [ ] Reorder and check dashboard → Should display in new order

---

## 6. Dashboard Testing

### 6.1 Total Balance

**What could break:**

- Balance not summing all accounts
- Balance not updating after transactions
- Balance showing wrong currency

**How to test:**

- [ ] Create 3 accounts with $100, $200, $300 → Dashboard should show $600 total
- [ ] Add $50 expense → Total should decrease to $550
- [ ] Add $100 income → Total should increase to $650
- [ ] Change currency → Balance should display with correct currency symbol

### 6.2 Income & Expenses Display

**What could break:**

- Wrong time period being calculated
- Income/expense not filtering correctly
- Transfer transactions being counted as income/expense

**How to test:**

- [ ] Select "This Week" timeframe → Should show current week's income/expenses
- [ ] Select "This Month" → Should show current month's totals
- [ ] Select "This Year" → Should show current year's totals
- [ ] Navigate to previous period → Should show previous week/month/year
- [ ] Add transaction and check period total → Should update immediately
- [ ] Create transfer → Should not appear in income or expense totals

### 6.3 Spending Trend Chart

**What could break:**

- Chart data not loading
- Chart showing wrong time period
- Chart not updating after transactions
- Navigation to previous/next period broken

**How to test:**

- [ ] View chart → Should display spending data
- [ ] Navigate to previous week → Should show previous week's data
- [ ] Navigate to next week (if not current) → Should show next week's data
- [ ] Add transaction in current period → Chart should update
- [ ] Switch between week/month/year views → Chart should recalculate and display correctly

### 6.4 Category Breakdown (Donut Chart)

**What could break:**

- Categories not summing correctly
- Income/Transfer categories appearing in breakdown
- Chart not showing proportions correctly
- Clicking category not navigating to transaction list

**How to test:**

- [ ] View category donut chart → Should show expense categories only
- [ ] Check proportions match spending → Should be accurate
- [ ] Click on category slice → Should navigate to transaction list filtered by that category
- [ ] Add transaction to category → Donut chart should update proportion
- [ ] Verify Income/Transfer categories excluded → Should not appear in chart

### 6.5 Budget Health Card

**What could break:**

- Budget progress wrong
- Categories not showing when toggled on
- Over-budget categories not highlighted
- Spending not matching transaction totals

**How to test:**

- [ ] Set budget and view budget health → Should show progress bar
- [ ] Spend exactly budget amount → Should show 100% full
- [ ] Spend over budget → Should show warning/red indicator
- [ ] Toggle category off → Should disappear from budget health
- [ ] Toggle category on → Should reappear

### 6.6 Savings Progress Card

**What could break:**

- Savings target not displaying
- Progress calculation wrong
- Monthly savings not calculating from transactions
- Card not showing when savings target not set

**How to test:**

- [ ] Set monthly savings target to $500 → Card should appear
- [ ] Save $300 this month → Should show 60% progress
- [ ] Remove savings target → Card should disappear
- [ ] Set target and check calculation → Should match income minus expenses

---

## 7. Savings Goals Testing

### 7.1 Create Goal

**What could break:**

- Goal name validation
- Target amount validation
- Account association not saving
- Goal not appearing in goals list

**How to test:**

- [ ] Create goal "Vacation" with target $2000 on Savings account → Should create successfully
- [ ] Create goal with empty name → Should show validation error
- [ ] Create goal with $0 target → Should show validation error or allow based on requirements
- [ ] Create goal and check goals list → Should appear
- [ ] Create goal and check account → Should show associated goal

### 7.2 Contribute to Goal

**What could break:**

- Contribution not increasing goal progress
- Source account not decreasing
- Goal account not increasing
- Contribution amount exceeding source account balance

**How to test:**

- [ ] Contribute $500 to goal from Checking → Goal progress should increase by $500
- [ ] Contribute and check source account balance → Should decrease by $500
- [ ] Contribute and check goal account balance → Should increase by $500
- [ ] Contribute more than source account balance → Should show error or allow overdraft
- [ ] Contribute and check contribution history → Should appear in history

### 7.3 Withdraw from Goal

**What could break:**

- Withdrawal not decreasing goal progress
- Withdrawal exceeding goal current amount
- Account balances not updating correctly

**How to test:**

- [ ] Withdraw $200 from goal to Checking → Goal progress should decrease by $200
- [ ] Withdraw more than goal current amount → Should show error or allow negative
- [ ] Withdraw and check account balances → Should update correctly
- [ ] Withdraw and check contribution history → Should show as negative contribution

### 7.4 Edit Goal

**What could break:**

- Name change not saving
- Target amount change not updating progress percentage
- Color/icon change not displaying

**How to test:**

- [ ] Edit goal name → Should update everywhere
- [ ] Edit target amount from $2000 to $3000 → Progress percentage should recalculate
- [ ] Edit goal color and icon → Should display new color/icon
- [ ] Edit and close app → Changes should persist

### 7.5 Delete Goal

**What could break:**

- Goal with contributions not deleting
- Goal account balance not handling deleted goal
- Contributions becoming orphaned

**How to test:**

- [ ] Delete goal with no contributions → Should delete successfully
- [ ] Delete goal with contributions → Should show warning or prevent deletion
- [ ] Delete goal and check account → Goal should no longer be associated
- [ ] Delete goal and check contribution history → Should handle cleanup

---

## 8. Settings & Profile Testing

### 8.1 Currency Selection

**What could break:**

- Currency not saving
- Currency symbol not updating throughout app
- Transaction amounts displaying wrong currency

**How to test:**

- [ ] Change currency from USD to EUR → Should save immediately
- [ ] Check dashboard → All amounts should show € symbol
- [ ] Check transaction list → Should display € symbol
- [ ] Check budgets → Should display € symbol
- [ ] Close app and reopen → Currency should persist
- [ ] Create new transaction → Should use € symbol

### 8.2 Notification Settings

**What could break:**

- Frequency not saving
- Notifications not scheduling
- Permission request not triggering
- Messages not sending at correct frequency

**How to test:**

- [ ] Set notification frequency to 2 times/day → Should save preference
- [ ] Check notification permission → Should request if not granted
- [ ] Deny notification permission → Should handle gracefully
- [ ] Set frequency and wait for notification time → Should receive notification (requires waiting)
- [ ] Log transaction before notification → Notification should skip if already logged today
- [ ] View notification logs → Should show sent/dismissed status

### 8.3 Sign Out

**What could break:**

- Session not clearing
- User data still accessible after sign out
- Redirect not working
- Can access app without re-authenticating

**How to test:**

- [ ] Sign out → Should redirect to sign-in screen
- [ ] Sign out and try to access dashboard → Should require login
- [ ] Sign out and close app → Reopen should require login
- [ ] Sign out and check local storage → Session should be cleared

### 8.4 Reset Onboarding

**What could break:**

- Onboarding not showing after reset
- User data being deleted unintentionally
- Onboarding resuming at wrong step

**How to test:**

- [ ] Reset onboarding → Should mark onboarding as incomplete
- [ ] Reset and sign out/in → Should show onboarding from step 1
- [ ] Reset and verify user data intact → Transactions, accounts should remain

---

## 9. Data Integrity Testing

### 9.1 Account Balance Accuracy

**What could break:**

- Balance out of sync with transactions
- Concurrent updates causing race conditions
- Optimistic updates failing to revert on error

**How to test:**

- [ ] Create account with $1000 balance
- [ ] Add 10 transactions totaling -$400
- [ ] Manually calculate expected balance ($600)
- [ ] Check account balance matches calculation
- [ ] Transfer $200 out, $100 in
- [ ] Verify balance is $500
- [ ] Edit old transaction amount
- [ ] Verify balance recalculates correctly

### 9.2 Category Aggregate Accuracy

**What could break:**

- Aggregates including wrong time period
- Categories summing incorrectly
- Deleted transactions still counted
- Transfer/Income categories in expense aggregates

**How to test:**

- [ ] Add 5 transactions to "Groceries" totaling $500
- [ ] View dashboard category breakdown → Should show $500 for groceries
- [ ] Delete one $100 transaction
- [ ] Category aggregate should show $400
- [ ] Change transaction category from "Groceries" to "Dining"
- [ ] Groceries should decrease $100, Dining should increase $100

### 9.3 Budget vs Spending Accuracy

**What could break:**

- Budget calculations using wrong time period
- Spending not matching transaction totals
- Budget percentage mode calculating wrong amounts

**How to test:**

- [ ] Set budget for "Groceries" to $500 for current month
- [ ] Add transactions totaling $300
- [ ] Budget health should show 60% spent ($300/$500)
- [ ] Add $100 transaction from previous month
- [ ] Current month budget should still show $300 spent (not $400)
- [ ] Set percentage-based budget at 20% with $3000 income
- [ ] Budget should calculate to $600

---

## 10. Error Handling & Edge Cases

### 10.1 Network Errors

**What could break:**

- App crashes when offline
- Optimistic updates not reverting on failure
- Error messages not user-friendly
- Infinite loading states

**How to test:**

- [ ] Turn off network and try to create transaction → Should show error message
- [ ] Turn off network and try to load dashboard → Should show cached data or error
- [ ] Make optimistic update with network off → Should revert when it fails
- [ ] Reconnect network → Should retry and succeed
- [ ] Slow network → Should show loading state and eventually complete

### 10.2 Empty States

**What could break:**

- Crashes when no data exists
- Division by zero in calculations
- Charts/graphs not rendering with no data

**How to test:**

- [ ] New user with no transactions → Dashboard should show zeros or empty state
- [ ] No accounts created → Add transaction should show "create account first" message
- [ ] No categories → Should have default categories or prevent transaction creation
- [ ] No budgets set → Budget health should show empty or prompt to set budgets
- [ ] View chart with no transactions → Should show empty chart or message

### 10.3 Large Data Sets

**What could break:**

- Performance degradation with 1000+ transactions
- Pagination breaking
- Memory leaks from too much data in memory
- Slow queries on aggregations

**How to test:**

- [ ] Create 500+ transactions → Transaction list should paginate smoothly
- [ ] Create 100+ categories → Category selectors should remain performant
- [ ] Load dashboard with 1000+ transactions → Aggregates should calculate in reasonable time
- [ ] Scroll through large transaction list → Should not crash or lag severely

### 10.4 Concurrent Updates

**What could break:**

- Two devices updating same data simultaneously
- Race conditions in balance updates
- Stale data being displayed

**How to test:**

- [ ] Log in on two devices
- [ ] Create transaction on device A
- [ ] Pull to refresh on device B → Should show new transaction
- [ ] Edit same transaction on both devices → Should handle conflict (last write wins or error)
- [ ] Delete account on device A while device B has transaction form open → Device B should handle error

### 10.5 Invalid Data

**What could break:**

- SQL injection through inputs
- XSS through transaction descriptions
- Extremely large numbers breaking calculations
- Special characters in names breaking UI

**How to test:**

- [ ] Enter transaction description: `<script>alert('xss')</script>` → Should display as text, not execute
- [ ] Enter account name: `'; DROP TABLE accounts; --` → Should save as text, not execute SQL
- [ ] Enter amount: 999999999999999 → Should handle large number or show validation error
- [ ] Enter category name with emoji: `🍕 Pizza` → Should display correctly
- [ ] Enter description with newlines and special chars → Should display correctly

---

## 11. Platform-Specific Testing

### 11.1 iOS-Specific

**What could break:**

- Face ID not working
- Safe area insets cutting off content
- iOS keyboard covering inputs
- Apple sign-in failing

**How to test:**

- [ ] Enable Face ID app lock → Should prompt for Face ID
- [ ] Test on iPhone with notch → Content should not be cut off by notch
- [ ] Focus input field → Keyboard should not cover input
- [ ] Sign in with Apple → Should complete OAuth flow
- [ ] Test on different iOS versions → Should work consistently

### 11.2 Android-Specific

**What could break:**

- Fingerprint authentication not working
- Back button behavior incorrect
- Hardware back button conflicts
- Google sign-in failing

**How to test:**

- [ ] Enable fingerprint app lock → Should prompt for fingerprint
- [ ] Press hardware back button on various screens → Should navigate correctly
- [ ] Sign in with Google → Should complete OAuth flow
- [ ] Test on different Android versions → Should work consistently
- [ ] Test on various screen sizes → Layout should adapt

---

## 12. Critical User Journeys (End-to-End)

### Journey 1: New User → First Transaction

1. Download app
2. Complete onboarding (all 10 steps)
3. Sign up with email
4. Create first account
5. Add first transaction
6. View transaction on dashboard
7. Check account balance updated

**Success criteria:** User can see their transaction on dashboard with correct balance

### Journey 2: Set Budget → Track Spending

1. Sign in
2. Go to Budgets tab
3. Set budget for "Groceries" at $500
4. Add $300 transaction in Groceries category
5. View dashboard budget health → Should show 60% progress
6. Add another $300 transaction (total $600, over budget)
7. Dashboard should show over-budget warning

**Success criteria:** Budget tracking accurate and visual indicators correct

### Journey 3: Multi-Account Management

1. Create 3 accounts: Checking ($1000), Savings ($500), Credit Card (-$200)
2. Add expense from Credit Card account
3. Transfer $200 from Checking to pay off Credit Card
4. Verify balances: Checking $800, Savings $500, Credit Card $0
5. Dashboard total balance should be $1300

**Success criteria:** All balances accurate, total balance correct

### Journey 4: Savings Goal Workflow

1. Create savings account with $500
2. Create goal "Emergency Fund" target $5000 on savings account
3. Contribute $500 from checking
4. Goal should show $1000 current amount (original $500 + contribution $500)
5. Withdraw $200 for emergency
6. Goal should show $800 current amount

**Success criteria:** Goal progress accurate through contributions and withdrawals

### Journey 5: Monthly Budget Review

1. Set budgets for 5 categories at start of month
2. Add transactions throughout month in various categories
3. View dashboard at month end
4. Verify spending matches category aggregates
5. Identify over-budget categories
6. Adjust budgets for next month

**Success criteria:** All numbers accurate, budget adjustments save correctly

---

## 13. Regression Testing Checklist

After any code changes, verify these critical paths still work:

- [ ] Sign up → Onboarding → Dashboard loads
- [ ] Sign in → Session persists → Sign out works
- [ ] Add transaction → Balance updates → Transaction appears in list
- [ ] Edit transaction → Changes save → Balance recalculates
- [ ] Delete transaction → Balance reverts → Removed from list
- [ ] Create account → Appears in dropdowns → Usable for transactions
- [ ] Transfer between accounts → Both balances update correctly
- [ ] Set budget → Dashboard shows budget health → Progress accurate
- [ ] Create goal → Contribute → Withdraw → All balances correct
- [ ] Change currency → All amounts display with new symbol
- [ ] Dashboard aggregates → Match transaction totals for period
- [ ] Filter transactions → Results match filter criteria
- [ ] App lock → Biometric prompts → Grants access when authenticated

---

## 14. Pre-Launch Final Verification

Before shipping to production, complete this final checklist:

### Data & Privacy

- [ ] Verify all Supabase RLS policies are active and correct
- [ ] Test that users can only see their own data
- [ ] Verify no sensitive data in console logs
- [ ] Check that passwords are never stored in plain text

### Performance

- [ ] Dashboard loads in < 2 seconds on average device
- [ ] Transaction list scrolls smoothly with 500+ items
- [ ] App size is reasonable (< 50MB)
- [ ] No memory leaks during extended use

### Security

- [ ] OAuth redirect URLs configured correctly in Supabase
- [ ] API keys not exposed in client code
- [ ] Biometric data stored securely
- [ ] Session expiration working correctly

### User Experience

- [ ] All error messages are user-friendly
- [ ] Loading states shown for all async operations
- [ ] Success confirmations for important actions
- [ ] No broken links or navigation dead ends

### App Store Requirements

- [ ] Privacy policy accessible
- [ ] Terms of service accessible
- [ ] App permissions explained
- [ ] Screenshots and description accurate

---

## Testing Priority

**P0 (Critical - Must work perfectly):**

- Authentication (sign up, sign in, sign out)
- Add transaction
- Account balance accuracy
- Data security (RLS, user isolation)

**P1 (High - Core features):**

- Edit/delete transaction
- Create/manage accounts
- Set budgets
- Dashboard aggregates
- Transfer between accounts

**P2 (Medium - Important but not critical):**

- Savings goals
- Category customization
- AI budget setup
- Notifications
- Onboarding flow

**P3 (Low - Nice to have):**

- Category reordering
- Account reordering
- Custom notification messages
- Theme customization

---

## Recommended Testing Approach

1. **Manual Testing First**: Go through all P0 and P1 tests manually on both iOS and Android
2. **Use Real Data**: Create realistic transactions and accounts to catch calculation errors
3. **Test Edge Cases**: Don't just test happy paths - try to break things
4. **Multiple Devices**: Test on different screen sizes and OS versions
5. **Fresh Start**: Test with completely new account to catch onboarding issues
6. **Existing User**: Test with account that has lots of data to catch performance issues
7. **Network Conditions**: Test on slow/offline network to catch error handling issues
8. **Keep Notes**: Document any bugs found with steps to reproduce

## Bug Severity Classification

**Critical (Ship Blocker):**

- App crashes
- Data loss or corruption
- Security vulnerabilities
- Unable to create transactions
- Unable to sign in/up

**High (Must fix before launch):**

- Wrong balance calculations
- Missing transactions
- Budget calculations incorrect
- UI completely broken on specific screen

**Medium (Fix if time permits):**

- Minor UI glitches
- Inconsistent styling
- Performance slowdowns
- Non-critical features not working

**Low (Can fix post-launch):**

- Typos in text
- Minor visual inconsistencies
- Nice-to-have features missing
- Rare edge cases
