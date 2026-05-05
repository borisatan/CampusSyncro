# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Perfin is a personal finance mobile app for tracking transactions, managing accounts, managing and following budgets and viewing spending analytics with customizable categories.

## Tech Stack

- **Framework**: React Native with Expo SDK 54
- **Language**: TypeScript
- **Backend**: Supabase (auth, database, RPC functions)
- **State**: Zustand stores + React Context
- **Styling**: NativeWind (TailwindCSS for RN)
- **Navigation**: Expo Router (file-based routing)

## Commands

```bash
npm install              # Install dependencies
npx expo start           # Start dev server
npm run android          # Run on Android
npm run ios              # Run on iOS
npm run lint             # ESLint
```

## Project Structure

```
app/
├── _layout.tsx          # Root layout, provider hierarchy
├── (auth)/              # Sign-in, sign-up screens
├── (tabs)/              # Main tab screens (dashboard, accounts, add-transaction, etc.)
├── components/          # UI components organized by page
│   ├── HomePage/
│   ├── AddTransactionPage/
│   ├── TransactionListPage/
│   ├── AccountsPage/
│   └── Shared/
├── context/             # React contexts (Auth, Theme, DataRefresh)
├── design reference/    # React files with a template design for certain pages
├── hooks/               # Custom hooks (useDashboardData, useCurrency, useAccountData)
├── services/            # API layer (backendService.ts)
├── store/               # Zustand stores (accounts, categories, currency)
├── types/               # TypeScript definitions (types.ts)
└── utils/               # Helpers (supabase client, date/chart utils)
```

## Key Files

| Purpose | Location |
|---------|----------|
| Supabase client | `app/utils/supabase.ts` |
| All API calls | `app/services/backendService.ts` |
| Type definitions | `app/types/types.ts` |
| Tailwind config | `tailwind.config.js` |
| Provider hierarchy | `app/_layout.tsx:24-52` |
| Tab navigator | `app/(tabs)/_layout.tsx` |

## Supabase Schema

**Tables**: Transactions, Accounts, Categories, Profiles

**RPC Functions**:
- `fetch_total_balance` - Sum all account balances
- `get_transaction_total` - Sum transactions by date range
- `fetch_category_aggregates` - Category spending by date range

## Known Pitfalls

### Currency Amount Input — canonical pattern

The canonical amount input is in `app/components/AddTransactionPage/TransactionHero.tsx`. **Always match this exactly** — never deviate with different font sizes, padding, or lineHeight values:

```tsx
<View className="flex-row items-center px-4 rounded-xl border bg-inputDark border-borderDark">
  <Text
    className="text-2xl mr-1 text-slate400"
    style={{ lineHeight: 24 }}
  >
    {currencySymbol}
  </Text>
  <TextInput
    keyboardType="decimal-pad"
    placeholder="0.00"
    placeholderTextColor="#475569"
    className="flex-1 py-4 text-2xl text-textDark"
    style={{ lineHeight: 24 }}
  />
</View>
```

Rules:
- Container: `flex-row items-center px-4 rounded-xl border` — **no** `py-*` on the container; vertical padding lives on `TextInput` only (`py-4`)
- Both `Text` (currency symbol) and `TextInput`: `text-2xl` + `style={{ lineHeight: 24 }}`
- Currency symbol: `mr-1` (not `mr-2`), color `text-slate400`
- `TextInput` placeholder: `"0.00"`
- Never use `text-lg` / `lineHeight: 18` for amount inputs — that was wrong

## Additional Documentation

Check these files for detailed patterns when working on related features:

| Topic | File |
|-------|------|
| Architecture & patterns | `.claude/docs/architectural_patterns.md` |
