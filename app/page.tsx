'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/auth';
import { getAccounts, getBudgetTasks, getMonthlySessions, completeTask } from '../lib/firestore';
import { Account, BudgetTask, MonthlySession } from '../lib/types';

export default function Home() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [tasks, setTasks] = useState<BudgetTask[]>([]);
  const [session, setSession] = useState<MonthlySession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [user, router]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const accs = await getAccounts(user.uid);
      setAccounts(accs);
      const sessions = await getMonthlySessions(user.uid);
      if (sessions.length > 0) {
        const currentSession = sessions[0];
        setSession(currentSession);
        const tsks = await getBudgetTasks(user.uid, currentSession.id);
        setTasks(tsks);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    if (!user) return;
    try {
      await completeTask(user.uid, taskId);
      fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user || loading) {
    return <div>Loading...</div>;
  }

  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const atmNeeded = tasks.filter(t => !t.isCompleted && t.type === 'withdraw').reduce((sum, t) => sum + t.amount, 0);

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">CashFlowTodo</h1>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">Logout</button>
      </header>

      {session ? (
        <>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">今月の予算: {session.budgetAmount}円</h2>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0}%` }}
              ></div>
            </div>
            <p className="mt-1">{completedTasks} / {tasks.length} 完了</p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">タスク一覧</h2>
            <ul className="space-y-2">
              {tasks.map(task => (
                <li key={task.id} className="flex items-center p-2 border rounded">
                  <input
                    type="checkbox"
                    checked={task.isCompleted}
                    onChange={() => !task.isCompleted && handleCompleteTask(task.id)}
                    className="mr-3"
                  />
                  <span className={task.isCompleted ? 'line-through text-gray-500' : ''}>
                    {task.memo} - {task.amount}円 ({task.type})
                  </span>
                </li>
              ))}
            </ul>
            <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded">+ タスク追加</button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">口座残高</h2>
            <ul className="space-y-1">
              {accounts.map(acc => (
                <li key={acc.id} className="flex justify-between p-2 border rounded">
                  <span>{acc.name} ({acc.category})</span>
                  <span>{acc.balance}円</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold">ATM必要額: {atmNeeded}円</h2>
          </div>
        </>
      ) : (
        <div className="text-center">
          <p className="text-lg mb-4">月次セッションがありません。初回設定を行ってください。</p>
          <button className="bg-blue-500 text-white px-4 py-2 rounded">初回設定</button>
        </div>
      )}
    </main>
  );
}