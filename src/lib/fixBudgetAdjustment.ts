import { TransferTodoRepository } from './transferTodoRepository';
import { AccountRepository } from './accountRepository';
import { signInAnonymously } from 'firebase/auth';
import { auth } from './firebase';

async function fixBudgetAdjustment() {
  await signInAnonymously(auth);

  const todos = await TransferTodoRepository.getTransferTodos();
  const accounts = await AccountRepository.getAccounts();

  for (const todo of todos) {
    if (todo.type === 'budget_adjustment' && (!todo.toId || todo.toId.trim() === '')) {
      const toId = accounts.find(a => a.id !== todo.fromId)?.id || '';
      if (toId) {
        await TransferTodoRepository.updateTransferTodo(todo.id, { toId });
        console.log(`Fixed todo ${todo.id}: set toId to ${toId}`);
      }
    }
  }
}

fixBudgetAdjustment();