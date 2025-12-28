export interface Account {
  id: string;
  name: string;
  balance: number;
  color: string;
  order: number;
}

export interface TransferTodo {
  id: string;
  type: 'transfer' | 'payment' | 'budget_adjustment' | 'expense';
  fromId: string;
  toId?: string; // paymentの場合は不要
  budgetId?: string; // expenseの場合に使用
  amount: number;
  note?: string;
  completed: boolean;
  order: number;
}

export interface Budget {
  id: string;
  name: string;
  amount: number;
  accountId: string; // 予算に関連する口座
  savingAccountId?: string; // 残りを自動転送する口座
}

export interface Settings {
  autoResetEnabled: boolean;
}