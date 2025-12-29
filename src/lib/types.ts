export interface Account {
  id: string;
  name: string;
  balance: number;
  color: string;
  order: number;
}

export interface TransferTodo {
  id: string;
  type: 'transfer' | 'payment' | 'budget_adjustment';
  fromId: string;
  toId?: string; // paymentの場合は不要
  amount: number;
  note?: string;
  completed: boolean;
  order: number;
}

export interface Settings {
  autoResetEnabled: boolean;
  monthlyBudgetAmount?: number;
  monthlyBudgetAccountId?: string;
}