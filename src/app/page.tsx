'use client';

import { useEffect, useState } from 'react';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useApp } from '@/lib/appContext';
import { TransferTodoRepository } from '@/lib/transferTodoRepository';
import { AccountRepository } from '@/lib/accountRepository';
import { BudgetRepository } from '@/lib/budgetRepository';
import { TransferTodo, Account, Budget } from '@/lib/types';
import { calculateBudgetRemaining } from '@/lib/balanceCalculator';
import { ArrowRightLeft, Loader2, CheckCircle2, Circle, ChevronRight, Plus, X, Save, Trash2, GripVertical, PartyPopper, RotateCcw } from 'lucide-react';

// DND Kit Imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Sortable Item Component ---
const SortableItem = ({ id, children, className }: { id: string; children: React.ReactNode; className?: string }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 hover:bg-slate-100 rounded text-slate-400 shrink-0">
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1 flex items-center justify-between min-w-0">
        {children}
      </div>
    </div>
  );
};

const LoginPage = () => {
  const { user, setUser } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser]);

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Google login error:', error);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Anonymous login error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (user) {
    // 認証済みならホーム画面に遷移（実際にはリダイレクトやコンポーネント切り替え）
    return <HomePage />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <div className="bg-indigo-600 p-3 rounded-2xl">
            <ArrowRightLeft className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter">CashFlowTodo</h1>
        </div>

        {/* Tagline */}
        <p className="text-lg text-slate-600 font-medium leading-relaxed">
          毎月の振替をタスク化して、<br />
          キャッシュフローを可視化しよう
        </p>

        {/* Buttons */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 border border-slate-200 hover:border-indigo-300"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Googleでログイン
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gradient-to-br from-indigo-50 to-white text-slate-500">または</span>
            </div>
          </div>

          <button
            onClick={handleGuestLogin}
            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
          >
            ゲストとして利用開始
          </button>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const { user, accounts, transferTodos, budgets, completedCount, progress, currentBalances, refreshAccounts, refreshTransferTodos, refreshBudgets } = useApp();
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TransferTodo | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'transfer' | 'payment' | 'budget_adjustment' | 'expense'>('transfer');
  const [selectedFromId, setSelectedFromId] = useState<string>('');
  const [selectedBudgetId, setSelectedBudgetId] = useState<string>('');
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);
  const [amountValue, setAmountValue] = useState<number>(0);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const toggleTodo = async (todoId: string) => {
    const todo = transferTodos.find(t => t.id === todoId);
    if (!todo) return;
    const isCompleting = !todo.completed;

    // 残高不足チェック（実行は可能）
    if (isCompleting) {
      const fromAccount = currentBalances.find(a => a.id === todo.fromId);
      if (fromAccount && fromAccount.balance < todo.amount) {
        alert(`注意: ${fromAccount.name} の残高が不足しています。`);
      }
    }

    try {
      await TransferTodoRepository.updateTransferTodo(todoId, { completed: isCompleting });
      await refreshTransferTodos();
    } catch (error) {
      alert('更新に失敗しました。再度お試しください。');
      console.error(error);
    }
  };

  const handleNumberInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === "0") {
      e.target.value = "";
    }
  };

  const handleDragEndAccounts = async ({ active, over }: any) => {
    if (active.id !== over.id) {
      const oldIndex = accounts.findIndex(a => a.id === active.id);
      const newIndex = accounts.findIndex(a => a.id === over.id);
      const newArray = arrayMove(accounts, oldIndex, newIndex);
      const updates = newArray.map((item, index) => ({ id: item.id, order: index }));
      // Account の order を更新
      for (const update of updates) {
        await AccountRepository.updateAccount(update.id, { order: update.order });
      }
      await refreshAccounts();
    }
  };

  const handleDragEndTodos = async ({ active, over }: any) => {
    if (active.id !== over.id) {
      const oldIndex = transferTodos.findIndex(t => t.id === active.id);
      const newIndex = transferTodos.findIndex(t => t.id === over.id);
      const newArray = arrayMove(transferTodos, oldIndex, newIndex);
      const updates = newArray.map((item, index) => ({ id: item.id, order: index }));
      await TransferTodoRepository.updateOrder(updates);
      await refreshTransferTodos();
    }
  };

  useEffect(() => {
    if (transferTodos.length > 0 && transferTodos.every(t => t.completed)) {
      setShowSuccessModal(true);
    } else {
      setShowSuccessModal(false);
    }
  }, [transferTodos]);

  useEffect(() => {
    if (editingTodo) {
      setSelectedType(editingTodo.type || 'transfer');
      setSelectedFromId(editingTodo.fromId);
      setSelectedBudgetId(editingTodo.budgetId || '');
      setCalculatedAmount(editingTodo.amount);
      setAmountValue(editingTodo.amount);
    } else {
      setSelectedType('transfer');
      setSelectedFromId('');
      setSelectedBudgetId('');
      setCalculatedAmount(0);
      setAmountValue(0);
    }
  }, [editingTodo]);

  useEffect(() => {
    if (selectedType === 'budget_adjustment' && selectedFromId) {
      const accountBudget = budgets.find(b => b.accountId === selectedFromId);
      if (accountBudget) {
        const remaining = calculateBudgetRemaining(accountBudget, transferTodos);
        const overBudget = Math.max(0, accountBudget.amount - remaining);
        setCalculatedAmount(overBudget);
        setAmountValue(overBudget);
      } else {
        setCalculatedAmount(0);
        setAmountValue(0);
      }
    } else if (selectedType === 'expense' && selectedBudgetId) {
      const budget = budgets.find(b => b.id === selectedBudgetId);
      if (budget) {
        const remaining = calculateBudgetRemaining(budget, transferTodos);
        setCalculatedAmount(Math.max(0, remaining));
        setAmountValue(Math.max(0, remaining));
      } else {
        setCalculatedAmount(0);
        setAmountValue(0);
      }
    } else {
      setCalculatedAmount(0);
      if (!editingTodo) {
        setAmountValue(0);
      }
    }
  }, [selectedType, selectedFromId, selectedBudgetId, budgets, transferTodos, editingTodo]);

  const resetAllTodos = async () => {
    const batch = transferTodos.map(todo => ({ id: todo.id, completed: false }));
    for (const todo of batch) {
      await TransferTodoRepository.updateTransferTodo(todo.id, { completed: todo.completed });
    }
    await refreshTransferTodos();
    setShowSuccessModal(false);
  };

  const totalBalance = currentBalances.reduce((sum, acc) => sum + acc.balance, 0);
  const totalBudget = budgets.reduce((sum, budget) => sum + budget.amount, 0);
  const totalSpent = budgets.reduce((sum, budget) => {
    const spent = transferTodos.filter(t => t.fromId === budget.accountId && t.type === 'payment' && t.completed).reduce((s, t) => s + t.amount, 0);
    return sum + Math.max(0, spent - budget.amount);
  }, 0);

  return (
    <div className="h-screen flex flex-col bg-[#F8FAFC] overflow-hidden text-slate-900 max-w-3xl mx-auto">
      {/* Fixed Header */}
      <header className="bg-white border-b px-4 py-3 shrink-0 flex justify-between items-center z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <ArrowRightLeft className="text-white w-4 h-4" />
          </div>
          <h1 className="text-lg font-black italic tracking-tighter whitespace-nowrap">CashFlowTodo</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right whitespace-nowrap">
            <p className="text-[9px] font-bold text-slate-400 uppercase leading-none">Total Prediction</p>
            <p className="text-lg font-black text-indigo-600">¥{totalBalance.toLocaleString()}</p>
          </div>
        </div>
      </header>

      {/* Progress Sticky Bar */}
      <div className="bg-white px-4 py-2 border-b shrink-0 flex flex-col gap-1.5 shadow-sm">
        <div className="flex justify-between items-end">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress</span>
          <span className="text-xs font-black text-indigo-600">{progress}%</span>
        </div>
        <div className="bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div className="bg-indigo-600 h-full transition-all duration-700 shadow-[0_0_10px_rgba(79,70,229,0.3)]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Budget Area */}
      <section className="bg-white border-b shrink-0 z-20">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/50 border-b border-slate-100">
          <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            💰 予算設定
          </h2>
          <button
            onClick={() => { setEditingBudget(null); setIsBudgetModalOpen(true); }}
            className="flex items-center gap-1 text-[10px] font-black bg-indigo-600 text-white px-2.5 py-1.5 rounded-full shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus className="w-3 h-3" /> 予算を追加
          </button>
        </div>
        <div className="flex overflow-x-auto gap-3 p-4 no-scrollbar">
          {budgets.map(budget => {
            const account = accounts.find(a => a.id === budget.accountId);
            const spent = transferTodos.filter(t => t.fromId === budget.accountId && t.type === 'payment' && t.completed).reduce((sum, t) => sum + t.amount, 0);
            const remaining = budget.amount - spent;
            const isOverBudget = remaining < 0;
            const canAutoTransfer = remaining > 0 && budget.savingAccountId;
            return (
              <div key={budget.id} className="min-w-[200px] max-w-[200px] bg-white border border-slate-200 rounded-xl p-4 shrink-0 relative overflow-hidden group hover:border-indigo-400 hover:shadow-md transition-all">
                <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: account?.color || '#6366f1' }} />
                <div className="flex-1 ml-2 min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase truncate mb-0.5">{account?.name || '不明な口座'}</p>
                  <p className="text-[10px] font-medium text-slate-600 truncate mb-1">{budget.name}</p>
                  <p className={`text-lg font-black whitespace-nowrap truncate ${isOverBudget ? 'text-red-600' : 'text-indigo-600'}`}>¥{remaining.toLocaleString()}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">予算: ¥{budget.amount.toLocaleString()}</p>
                </div>
                <div className="flex flex-col gap-1 ml-1">
                  {canAutoTransfer && (
                    <button
                      onClick={async () => {
                        const savingAccount = accounts.find(a => a.id === budget.savingAccountId);
                        if (savingAccount) {
                          await TransferTodoRepository.createTransferTodo({
                            type: 'transfer',
                            fromId: budget.accountId,
                            toId: budget.savingAccountId,
                            amount: remaining,
                            note: `${budget.name} 残り自動入金`,
                            completed: false,
                            order: transferTodos.length
                          });
                          await refreshTransferTodos();
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-green-600 shrink-0 bg-slate-50 rounded-lg transition-all text-xs"
                      title="残りを自動入金"
                    >
                      💰
                    </button>
                  )}
                  <button onClick={() => { setEditingBudget(budget); setIsBudgetModalOpen(true); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-indigo-600 shrink-0 bg-slate-50 rounded-lg transition-all">Edit</button>
                </div>
              </div>
            );
          })}
          {budgets.length === 0 && (
            <div className="flex-1 border-2 border-dashed border-slate-100 rounded-xl py-6 px-6 text-center">
              <p className="text-[10px] text-slate-300 font-bold uppercase">No Budgets Yet</p>
              <p className="text-[9px] text-slate-400 mt-1">各口座の予算を設定しましょう</p>
            </div>
          )}
        </div>
      </section>
      {/* Account Area */}
      <section className="bg-white border-b shrink-0 z-30">
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50/50 border-b border-slate-100">
          <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
            <ArrowRightLeft className="w-3.5 h-3.5" /> 口座リスト
          </h2>
          <button
            onClick={() => { setEditingAccount(null); setIsAccountModalOpen(true); }}
            className="flex items-center gap-1 text-[10px] font-black bg-indigo-600 text-white px-2.5 py-1.5 rounded-full shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
          >
            <Plus className="w-3 h-3" /> 口座を追加
          </button>
        </div>
        <div className="flex overflow-x-auto gap-3 p-4 no-scrollbar">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndAccounts}>
            <SortableContext items={accounts.map(a => a.id)}>
              {currentBalances.map(acc => (
                <SortableItem key={acc.id} id={acc.id} className="min-w-[160px] max-w-[160px] bg-white border border-slate-200 rounded-xl p-3 shrink-0 relative overflow-hidden group hover:border-indigo-400 hover:shadow-md transition-all">
                  <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: acc.color }} />
                  <div className="flex-1 ml-2 min-w-0">
                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate mb-0.5">{acc.name}</p>
                    <p className="text-base font-black whitespace-nowrap truncate">¥{acc.balance.toLocaleString()}</p>
                  </div>
                  <button onClick={() => { setEditingAccount(acc); setIsAccountModalOpen(true); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-indigo-600 shrink-0 bg-slate-50 rounded-lg transition-all ml-1">Edit</button>
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>
          {currentBalances.length === 0 && (
            <div className="flex-1 border-2 border-dashed border-slate-100 rounded-xl py-4 px-6 text-center">
              <p className="text-[10px] text-slate-300 font-bold uppercase">No Accounts Yet</p>
            </div>
          )}
        </div>
      </section>


      {/* Main Task List */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="max-w-3xl mx-auto space-y-4 pb-20">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5" /> 振替タスク
            </h3>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">全 {transferTodos.length} 件</span>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndTodos}>
            <SortableContext items={transferTodos.map(t => t.id)} strategy={verticalListSortingStrategy}>
              {transferTodos.map(todo => (
                <SortableItem key={todo.id} id={todo.id} className={`group p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${todo.completed ? 'bg-slate-50 border-transparent opacity-60 shadow-inner' : 'bg-white border-white shadow-sm hover:border-indigo-100 hover:shadow-md'}`}>
                  <button onClick={() => toggleTodo(todo.id)} className={`shrink-0 transition-transform active:scale-90 ${todo.completed ? "text-green-500" : "text-slate-200 group-hover:text-indigo-300"}`}>
                    {todo.completed ? <CheckCircle2 className="w-8 h-8" /> : <Circle className="w-8 h-8" />}
                  </button>
                  <div className="flex-1 min-w-0" onClick={() => toggleTodo(todo.id)}>
                    <div className="flex items-center gap-1.5 mb-1 text-[10px] font-black uppercase overflow-hidden">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded truncate max-w-[90px]">{currentBalances.find(a => a.id === todo.fromId)?.name || '...'}</span>
                      {todo.type === 'transfer' && (
                        <>
                          <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
                          <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded truncate max-w-[90px]">{currentBalances.find(a => a.id === todo.toId)?.name || '...'}</span>
                        </>
                      )}
                      {todo.type === 'payment' && (
                        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[8px]">振込</span>
                      )}
                      {todo.type === 'expense' && (
                        <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded text-[8px]">支出</span>
                      )}
                    </div>
                    <div className={`text-2xl font-black whitespace-nowrap truncate ${todo.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>¥{todo.amount.toLocaleString()}</div>
                    {todo.note && <p className="text-[10px] text-slate-400 italic mt-0.5 truncate flex items-center gap-1"><span className="opacity-50 font-serif">#</span> {todo.note}</p>}
                  </div>
                </SortableItem>
              ))}
            </SortableContext>
          </DndContext>

          {transferTodos.length === 0 && (
            <div className="w-full py-8 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-black flex flex-col items-center justify-center gap-3">
              <span className="text-base tracking-tight">タスクがありません</span>
            </div>
          )}

          <button
            onClick={() => { setEditingTodo(null); setIsTodoModalOpen(true); }}
            className="w-full py-8 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-black hover:bg-white hover:border-indigo-400 hover:text-indigo-600 hover:shadow-lg transition-all flex flex-col items-center justify-center gap-3 group"
          >
            <div className="p-3 rounded-full bg-slate-50 group-hover:bg-indigo-50 transition-colors">
              <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
            </div>
            <span className="text-base tracking-tight">新しい振替タスクを追加する</span>
          </button>
        </div>
      </main>

      {/* Account Modal */}
      {isAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-md p-8 sm:p-10 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black italic">口座設定</h3>
              <button onClick={() => setIsAccountModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.target as HTMLFormElement);
              const d = {
                name: f.get('name') as string,
                balance: Number(f.get('balance')),
                color: f.get('color') as string,
                order: editingAccount?.order || accounts.length
              };
              if (editingAccount) {
                await AccountRepository.updateAccount(editingAccount.id, d);
              } else {
                await AccountRepository.createAccount(d as Omit<Account, 'id'>);
              }
              setIsAccountModalOpen(false);
              setEditingAccount(null);
              await refreshAccounts();
            }} className="space-y-4">
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Account Name (銀行名など)</label><input required name="name" defaultValue={editingAccount?.name} placeholder="例: メイン銀行" className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold transition-all" /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Balance (初期残高)</label><input required name="balance" type="number" defaultValue={editingAccount?.balance ?? 0} onFocus={handleNumberInputFocus} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold transition-all" /></div>
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border-2 border-transparent">
                <input name="color" type="color" defaultValue={editingAccount?.color || '#6366f1'} className="w-14 h-10 bg-white rounded-lg cursor-pointer shadow-sm" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Theme Color</p>
                  <p className="text-[10px] text-slate-400 font-medium">口座の識別カラーを選択</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                {editingAccount && <button type="button" onClick={async () => { if(confirm('削除しますか？')) { await AccountRepository.deleteAccount(editingAccount.id); setIsAccountModalOpen(false); setEditingAccount(null); await refreshAccounts(); } }} className="p-4 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>}
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 flex items-center justify-center gap-2 transition-all"><Save className="w-5 h-5" /> 口座を保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Todo Modal */}
      {isTodoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-md p-8 sm:p-10 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black italic">振替設定</h3>
              <button onClick={() => setIsTodoModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.target as HTMLFormElement);
              const type = f.get('type') as 'transfer' | 'payment' | 'budget_adjustment' | 'expense';
              const fromId = f.get('fromId') as string;
              const toId = f.get('toId') as string;
              const budgetId = f.get('budgetId') as string;
              const amount = amountValue;

              if (!amount || amount <= 0) {
                alert('金額を正しく入力してください');
                return;
              }
              if (type === 'transfer' && fromId === toId) {
                alert('出金口座と入金口座は異なるものを選択してください');
                return;
              }
              if (type === 'expense' && !budgetId) {
                alert('予算を選択してください');
                return;
              }

              let finalFromId = fromId;
              let finalBudgetId = undefined;
              if (type === 'expense') {
                const budget = budgets.find(b => b.id === budgetId);
                finalFromId = budget?.accountId || '';
                finalBudgetId = budgetId;
              }

              const d = {
                type,
                fromId: finalFromId,
                ...(type === 'transfer' && { toId }),
                ...(finalBudgetId && { budgetId: finalBudgetId }),
                amount,
                note: f.get('note') as string,
                completed: editingTodo?.completed || false,
                order: editingTodo?.order || transferTodos.length
              };
              try {
                if (editingTodo) {
                  await TransferTodoRepository.updateTransferTodo(editingTodo.id, d);
                } else {
                  await TransferTodoRepository.createTransferTodo(d as Omit<TransferTodo, 'id'>);
                }
                setIsTodoModalOpen(false);
                setEditingTodo(null);
                await refreshTransferTodos();
              } catch (error) {
                alert('保存に失敗しました。再度お試しください。');
                console.error(error);
              }
            }} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Type (種類)</label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" value="transfer" defaultChecked={!editingTodo || editingTodo.type === 'transfer'} onChange={(e) => setSelectedType(e.target.value as 'transfer' | 'payment' | 'budget_adjustment' | 'expense')} className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold">振替 (口座間移動)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" value="payment" defaultChecked={editingTodo?.type === 'payment'} onChange={(e) => setSelectedType(e.target.value as 'transfer' | 'payment' | 'budget_adjustment' | 'expense')} className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold">振込 (出金のみ)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" value="budget_adjustment" defaultChecked={editingTodo?.type === 'budget_adjustment'} onChange={(e) => setSelectedType(e.target.value as 'transfer' | 'payment' | 'budget_adjustment' | 'expense')} className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold">予算調整</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" value="expense" defaultChecked={editingTodo?.type === 'expense'} onChange={(e) => setSelectedType(e.target.value as 'transfer' | 'payment' | 'budget_adjustment' | 'expense')} className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold">支出 (予算から)</span>
                  </label>
                </div>
              </div>
              {selectedType !== 'expense' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">From (出金)</label><select required={selectedType !== 'expense'} name="fromId" disabled={selectedType === 'expense'} defaultValue={editingTodo?.fromId || accounts[0]?.id} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">To (入金)</label><select name="toId" disabled={selectedType === 'payment' || selectedType === 'expense'} defaultValue={editingTodo?.toId || accounts[1]?.id} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                </div>
              )}
              {selectedType === 'expense' && (
                <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Budget (対象予算)</label><select required name="budgetId" defaultValue={editingTodo?.budgetId || budgets[0]?.id} onChange={(e) => setSelectedBudgetId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all">{budgets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select></div>
              )}
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Amount (金額)</label><input required name="amount" type="number" value={amountValue} readOnly={selectedType === 'expense' || selectedType === 'budget_adjustment'} onChange={(e) => setAmountValue(Number(e.target.value))} onFocus={handleNumberInputFocus} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold border-2 border-transparent focus:border-indigo-500 transition-all" /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Note (メモ)</label><input name="note" defaultValue={editingTodo?.note} placeholder="例: 家賃分" className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all" /></div>
              <div className="flex gap-2 pt-2">
                {editingTodo && <button type="button" onClick={async () => { if(confirm('削除しますか？')) { await TransferTodoRepository.deleteTransferTodo(editingTodo.id); setIsTodoModalOpen(false); setEditingTodo(null); await refreshTransferTodos(); } }} className="p-4 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>}
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 flex items-center justify-center gap-2 transition-all"><Save className="w-5 h-5" /> タスクを保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Modal */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-t-[2rem] sm:rounded-[2.5rem] w-full max-w-md p-8 sm:p-10 shadow-2xl animate-in slide-in-from-bottom-20 duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black italic">予算設定</h3>
              <button onClick={() => setIsBudgetModalOpen(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.target as HTMLFormElement);
              const savingAccountId = f.get('savingAccountId') as string;
              const d = {
                name: f.get('name') as string,
                amount: Number(f.get('amount')),
                accountId: f.get('accountId') as string,
                ...(savingAccountId && { savingAccountId })
              };
              if (editingBudget) {
                await BudgetRepository.updateBudget(editingBudget.id, d);
              } else {
                await BudgetRepository.createBudget(d as Omit<Budget, 'id'>);
              }
              setIsBudgetModalOpen(false);
              setEditingBudget(null);
              await refreshBudgets();
            }} className="space-y-4">
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Budget Name (予算名)</label><input required name="name" defaultValue={editingBudget?.name} placeholder="例: 食費予算" className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold transition-all" /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Amount (予算額)</label><input required name="amount" type="number" defaultValue={editingBudget?.amount ?? 0} onFocus={handleNumberInputFocus} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold transition-all" /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Account (対象口座)</label><select required name="accountId" defaultValue={editingBudget?.accountId || accounts[0]?.id} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all">{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Saving Account (残り自動入金先 - 任意)</label><select name="savingAccountId" defaultValue={editingBudget?.savingAccountId || ''} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all"><option value="">なし</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              <div className="flex gap-2 pt-2">
                {editingBudget && <button type="button" onClick={async () => { if(confirm('削除しますか？')) { await BudgetRepository.deleteBudget(editingBudget.id); setIsBudgetModalOpen(false); setEditingBudget(null); await refreshBudgets(); } }} className="p-4 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>}
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 flex items-center justify-center gap-2 transition-all"><Save className="w-5 h-5" /> 予算を保存</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;