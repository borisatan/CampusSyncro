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

## Additional Documentation

Check these files for detailed patterns when working on related features:

| Topic | File |
|-------|------|
| Architecture & patterns | `.claude/docs/architectural_patterns.md` |
