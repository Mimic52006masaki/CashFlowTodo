import { Account, TransferTodo } from './types';

export function calculateBalances(accounts: Account[], transferTodos: TransferTodo[]): Account[] {
  const balances = new Map<string, number>();

  // 初期残高を設定
  accounts.forEach(account => {
    balances.set(account.id, account.balance);
  });

  // 完了済みタスクのみ計算
  const completedTodos = transferTodos.filter(todo => todo.completed);

  // 振替処理
  completedTodos.forEach(todo => {
    const fromBalance = balances.get(todo.fromId) || 0;
    balances.set(todo.fromId, fromBalance - todo.amount);

    if ((todo.type === 'transfer' || !todo.type) && todo.toId) {
      const toBalance = balances.get(todo.toId) || 0;
      balances.set(todo.toId, toBalance + todo.amount);
    }
    // budget_adjustment, payment, expense も出金のみ
  });

  // 計算結果を反映
  return accounts.map(account => ({
    ...account,
    balance: balances.get(account.id) || account.balance,
  }));
}

