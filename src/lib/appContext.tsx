'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { Account, TransferTodo, Settings } from './types';
import { calculateBalances } from './balanceCalculator';
import { AccountRepository } from './accountRepository';
import { TransferTodoRepository } from './transferTodoRepository';
import { BudgetRepository } from './budgetRepository';

interface AppContextType {
  user: User | null;
  accounts: Account[];
  transferTodos: TransferTodo[];
  settings: Settings;
  completedCount: number;
  progress: number;
  setUser: (user: User | null) => void;
  refreshAccounts: () => Promise<void>;
  refreshTransferTodos: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transferTodos, setTransferTodos] = useState<TransferTodo[]>([]);
  const [settings, setSettings] = useState<Settings>({ autoResetEnabled: false, monthlyBudgetAmount: undefined, monthlyBudgetAccountId: undefined });

  const completedCount = transferTodos.filter(todo => todo.completed).length;
  const progress = transferTodos.length > 0 ? (completedCount / transferTodos.length) * 100 : 0;

  const refreshAccounts = async () => {
    if (user) {
      const fetchedAccounts = await AccountRepository.getAccounts();
      setAccounts(fetchedAccounts);
    }
  };

  const refreshTransferTodos = async () => {
    if (user) {
      const fetchedTodos = await TransferTodoRepository.getTransferTodos();
      setTransferTodos(fetchedTodos);
    }
  };

  const refreshSettings = async () => {
    if (user) {
      const fetchedSettings = await BudgetRepository.getSettings();
      setSettings(fetchedSettings);
    }
  };

  useEffect(() => {
    if (user) {
      refreshAccounts();
      refreshTransferTodos();
      refreshSettings();
    } else {
      setAccounts([]);
      setTransferTodos([]);
      setSettings({ autoResetEnabled: false });
    }
  }, [user]);

  return (
    <AppContext.Provider value={{
      user,
      accounts,
      transferTodos,
      settings,
      completedCount,
      progress,
      setUser,
      refreshAccounts,
      refreshTransferTodos,
      refreshSettings,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}