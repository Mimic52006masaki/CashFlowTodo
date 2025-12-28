'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { Account, TransferTodo, Budget } from './types';
import { calculateBalances } from './balanceCalculator';
import { AccountRepository } from './accountRepository';
import { TransferTodoRepository } from './transferTodoRepository';
import { BudgetRepository } from './budgetRepository';

interface AppContextType {
  user: User | null;
  accounts: Account[];
  transferTodos: TransferTodo[];
  budgets: Budget[];
  completedCount: number;
  progress: number;
  currentBalances: Account[];
  setUser: (user: User | null) => void;
  refreshAccounts: () => Promise<void>;
  refreshTransferTodos: () => Promise<void>;
  refreshBudgets: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transferTodos, setTransferTodos] = useState<TransferTodo[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const completedCount = transferTodos.filter(todo => todo.completed).length;
  const progress = transferTodos.length > 0 ? (completedCount / transferTodos.length) * 100 : 0;
  const currentBalances = calculateBalances(accounts, transferTodos, budgets);

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

  const refreshBudgets = async () => {
    if (user) {
      const fetchedBudgets = await BudgetRepository.getBudgets();
      setBudgets(fetchedBudgets);
    }
  };

  useEffect(() => {
    if (user) {
      refreshAccounts();
      refreshTransferTodos();
      refreshBudgets();
    } else {
      setAccounts([]);
      setTransferTodos([]);
      setBudgets([]);
    }
  }, [user]);

  return (
    <AppContext.Provider value={{
      user,
      accounts,
      transferTodos,
      budgets,
      completedCount,
      progress,
      currentBalances,
      setUser,
      refreshAccounts,
      refreshTransferTodos,
      refreshBudgets,
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