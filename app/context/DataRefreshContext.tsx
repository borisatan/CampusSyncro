import React, { createContext, useContext, useRef, useCallback } from 'react';
import { Transaction } from '../types/types';

type RefreshFunction = () => void | Promise<void>;

type DataRefreshContextValue = {
  registerDashboardRefresh: (fn: RefreshFunction) => void;
  registerAccountsRefresh: (fn: RefreshFunction) => void;
  registerTransactionListRefresh: (fn: RefreshFunction) => void;
  registerOptimisticDeleteTransaction: (fn: (id: number) => void) => void;
  registerOptimisticUpdateTransaction: (fn: (tx: Transaction) => void) => void;
  refreshDashboard: () => Promise<void>;
  refreshAccounts: () => Promise<void>;
  refreshTransactionList: () => Promise<void>;
  refreshAll: () => Promise<void>;
  optimisticDeleteTransaction: (id: number) => void;
  optimisticUpdateTransaction: (tx: Transaction) => void;
};

const DataRefreshContext = createContext<DataRefreshContextValue | undefined>(undefined);

export const DataRefreshProvider = ({ children }: { children: React.ReactNode }) => {
  const dashboardRefreshRef = useRef<RefreshFunction | null>(null);
  const accountsRefreshRef = useRef<RefreshFunction | null>(null);
  const transactionListRefreshRef = useRef<RefreshFunction | null>(null);
  const optimisticDeleteRef = useRef<((id: number) => void) | null>(null);
  const optimisticUpdateRef = useRef<((tx: Transaction) => void) | null>(null);

  const registerDashboardRefresh = useCallback((fn: RefreshFunction) => {
    dashboardRefreshRef.current = fn;
  }, []);

  const registerAccountsRefresh = useCallback((fn: RefreshFunction) => {
    accountsRefreshRef.current = fn;
  }, []);

  const registerTransactionListRefresh = useCallback((fn: RefreshFunction) => {
    transactionListRefreshRef.current = fn;
  }, []);

  const registerOptimisticDeleteTransaction = useCallback((fn: (id: number) => void) => {
    optimisticDeleteRef.current = fn;
  }, []);

  const registerOptimisticUpdateTransaction = useCallback((fn: (tx: Transaction) => void) => {
    optimisticUpdateRef.current = fn;
  }, []);

  const refreshDashboard = useCallback(async () => {
    if (dashboardRefreshRef.current) {
      await dashboardRefreshRef.current();
    }
  }, []);

  const refreshAccounts = useCallback(async () => {
    if (accountsRefreshRef.current) {
      await accountsRefreshRef.current();
    }
  }, []);

  const refreshTransactionList = useCallback(async () => {
    if (transactionListRefreshRef.current) {
      await transactionListRefreshRef.current();
    }
  }, []);

  const optimisticDeleteTransaction = useCallback((id: number) => {
    if (optimisticDeleteRef.current) optimisticDeleteRef.current(id);
  }, []);

  const optimisticUpdateTransaction = useCallback((tx: Transaction) => {
    if (optimisticUpdateRef.current) optimisticUpdateRef.current(tx);
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshDashboard(),
      refreshAccounts(),
      refreshTransactionList(),
    ]);
  }, [refreshDashboard, refreshAccounts, refreshTransactionList]);

  const value = {
    registerDashboardRefresh,
    registerAccountsRefresh,
    registerTransactionListRefresh,
    registerOptimisticDeleteTransaction,
    registerOptimisticUpdateTransaction,
    refreshDashboard,
    refreshAccounts,
    refreshTransactionList,
    refreshAll,
    optimisticDeleteTransaction,
    optimisticUpdateTransaction,
  };

  return (
    <DataRefreshContext.Provider value={value}>
      {children}
    </DataRefreshContext.Provider>
  );
};

export const useDataRefresh = () => {
  const context = useContext(DataRefreshContext);
  if (context === undefined) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider');
  }
  return context;
};

