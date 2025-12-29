'use client';

import { useEffect, useState } from 'react';
import { signInAnonymously, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { increment } from 'firebase/firestore';
import { auth } from '@/lib/firebase';
import { useApp } from '@/lib/appContext';
import { TransferTodoRepository } from '@/lib/transferTodoRepository';
import { AccountRepository } from '@/lib/accountRepository';
import { BudgetRepository } from '@/lib/budgetRepository';
import { TransferTodo, Account } from '@/lib/types';
import { TodoList } from '@/components/TodoList';
import { ArrowRightLeft, Loader2, CheckCircle2, Circle, ChevronRight, Plus, X, Save, Trash2, GripVertical, PartyPopper, RotateCcw } from 'lucide-react';

// DND Kit Imports
import {
  DndContext,
  DragEndEvent,
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
const SortableItem = ({ id, children, className, onClick, actions }: { id: string; children: React.ReactNode; className?: string; onClick?: () => void; actions?: React.ReactNode }) => {
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
    <div ref={setNodeRef} style={style} className={className} onClick={onClick}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2 hover:bg-slate-100 rounded text-slate-400 shrink-0">
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="flex-1 flex items-center justify-between min-w-0">
        {children}
      </div>
      {actions && <div className="flex items-center gap-2 ml-2">{actions}</div>}
    </div>
  );
};

export default function HomePage() {
  const { user, setUser, accounts, transferTodos, settings, completedCount, progress, refreshAccounts, refreshTransferTodos, refreshSettings } = useApp();
  const [loading, setLoading] = useState(true);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [editingTodo, setEditingTodo] = useState<TransferTodo | null>(null);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [selectedType, setSelectedType] = useState<'transfer' | 'payment' | 'budget_adjustment'>('transfer');
  const [selectedFromId, setSelectedFromId] = useState<string>('');
  const [selectedToId, setSelectedToId] = useState<string>('');
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);
  const [amountValue, setAmountValue] = useState<number>(0);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser]);



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
      const toId = editingTodo.toId || (editingTodo.type === 'budget_adjustment' ? accounts.find(a => a.id !== editingTodo.fromId)?.id || '' : '');
      setSelectedToId(toId);
      setAmountValue(editingTodo.amount);
    } else {
      setSelectedType('transfer');
      const defaultFrom = settings.monthlyBudgetAccountId || accounts[0]?.id || '';
      setSelectedFromId(defaultFrom);
      const defaultTo = accounts.find(a => a.id !== defaultFrom)?.id || '';
      setSelectedToId(defaultTo);
      setAmountValue(0);
    }
  }, [editingTodo, accounts, settings, isTodoModalOpen]);

  useEffect(() => {
    if (selectedType === 'budget_adjustment') {
      const from = settings.monthlyBudgetAccountId || '';
      setSelectedFromId(from);

      const to = accounts.find(a => a.id !== from)?.id || '';
      setSelectedToId(to);
    }
  }, [selectedType, settings, accounts]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!user) {
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
              onClick={async () => {
                const provider = new GoogleAuthProvider();
                try {
                  await signInWithPopup(auth, provider);
                } catch (error) {
                  console.error('Google login error:', error);
                }
              }}
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
              onClick={async () => {
                try {
                  await signInAnonymously(auth);
                } catch (error) {
                  console.error('Anonymous login error:', error);
                }
              }}
              className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
            >
              ゲストとして利用開始
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 認証済みの場合のホーム画面

  const toggleTodo = async (todoId: string) => {
    console.log('toggleTodo called', todoId, Date.now());
    const todo = transferTodos.find(t => t.id === todoId);
    if (!todo) return;

    const isCompleting = !todo.completed;

    try {
      if (isCompleting) {
        // 出金
        if (todo.fromId) {
          await AccountRepository.updateAccount(todo.fromId, {
            balance: increment(-todo.amount),
          });
        }

        // 入金（transfer / budget_adjustment のみ）
        if (
          (todo.type === 'transfer' || todo.type === 'budget_adjustment') &&
          todo.toId &&
          todo.toId.trim() !== ''
        ) {
          await AccountRepository.updateAccount(todo.toId, {
            balance: increment(todo.amount),
          });
        }
      } else {
        // ロールバック
        if (todo.fromId) {
          await AccountRepository.updateAccount(todo.fromId, {
            balance: increment(todo.amount),
          });
        }

        if (
          (todo.type === 'transfer' || todo.type === 'budget_adjustment') &&
          todo.toId &&
          todo.toId.trim() !== ''
        ) {
          await AccountRepository.updateAccount(todo.toId, {
            balance: increment(-todo.amount),
          });
        }
      }

      await TransferTodoRepository.updateTransferTodo(todoId, {
        completed: isCompleting,
      });

      await refreshAccounts();
      await refreshTransferTodos();
    } catch (e) {
      console.error(e);
      alert('更新に失敗しました');
    }
  };



  const handleDragEndAccounts = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = accounts.findIndex(a => a.id === active.id);
    const newIndex = accounts.findIndex(a => a.id === over.id);
    const newArray = arrayMove(accounts, oldIndex, newIndex);
    const updates = newArray.map((item, index) => ({ id: item.id, order: index }));
    // Account の order を更新
    for (const update of updates) {
      await AccountRepository.updateAccount(update.id, { order: update.order });
    }
    await refreshAccounts();
  };

  const handleDragEndTodos = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id !== over.id) {
      const oldIndex = transferTodos.findIndex(t => t.id === active.id);
      const newIndex = transferTodos.findIndex(t => t.id === over!.id);
      const newArray = arrayMove(transferTodos, oldIndex, newIndex);
      const updates = newArray.map((item, index) => ({ id: item.id, order: index }));
      await TransferTodoRepository.updateOrder(updates);
      await refreshTransferTodos();
    }
  };



  const resetAllTodos = async () => {
    const batch = transferTodos.map(todo => ({ id: todo.id, completed: false }));
    for (const todo of batch) {
      await TransferTodoRepository.updateTransferTodo(todo.id, { completed: todo.completed });
    }
    await refreshTransferTodos();
    setShowSuccessModal(false);
  };

  const totalBalance = accounts.reduce((sum: number, acc) => sum + acc.balance, 0);
  const totalBudget = settings.monthlyBudgetAmount ?? 0;
  const totalPayments = transferTodos.filter(t => t.type === 'payment' && t.completed).reduce((s, t) => s + t.amount, 0);
  const totalSpent = Math.max(0, totalPayments - totalBudget);
  const budgetProgress = totalBudget > 0 ? Math.min((totalPayments / totalBudget) * 100, 100) : 0;

  const accountIds = accounts.map(a => a.id);
  const incompleteTodoIds = transferTodos.filter(t => !t.completed).map(t => t.id);
  const completedTodoIds = transferTodos.filter(t => t.completed).map(t => t.id);

  const handleDragEnd = (event: DragEndEvent) => {
    const isAccount = accounts.some(a => a.id === event.active.id);
    if (isAccount) handleDragEndAccounts(event);
    else handleDragEndTodos(event);
  };

  return (
    <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
      <div className="bg-background-main font-sans text-text-dark selection:bg-cool-blue selection:text-white flex min-h-screen">
      <div className="w-64 bg-background-sidebar shadow-lg flex flex-col p-6 border-r border-border-light shrink-0 z-10">
        <div className="mb-8 flex flex-col h-full">
          <h2 className="text-lg font-bold text-primary-charcoal mb-6 flex items-center gap-2">
            <ArrowRightLeft className="text-cool-blue w-5 h-5" />
            口座
          </h2>
          <div className="space-y-4 mb-4">
            <SortableContext items={accountIds} strategy={verticalListSortingStrategy}>
              {accounts.map(acc => (
                <SortableItem key={acc.id} id={acc.id} className="group bg-white border border-border-light rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => { setEditingAccount(acc); setIsAccountModalOpen(true); }}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-dark-blue-gray/60 uppercase tracking-wide">{acc.name}</span>
                  </div>
                  <p className="text-xl font-bold text-primary-charcoal tracking-tight">¥{acc.balance.toLocaleString()}</p>
                </SortableItem>
              ))}
            </SortableContext>
          </div>
          <button
            onClick={() => { setEditingAccount(null); setIsAccountModalOpen(true); }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-cool-blue/30 text-cool-blue font-semibold hover:bg-cool-blue/5 hover:border-cool-blue transition-all group"
          >
            <Plus className="group-hover:scale-110 transition-transform" />
            <span>口座を追加</span>
          </button>
        </div>
        <div className="mt-auto pt-6 border-t border-border-light">
          <p className="text-xs font-bold text-dark-blue-gray/60 uppercase tracking-wide mb-2">総資産</p>
          <p className="text-2xl font-bold text-cool-blue tracking-tight">¥{totalBalance.toLocaleString()}</p>
        </div>
      </div>
      <div className="flex-1 flex flex-col p-8 overflow-hidden relative">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-primary-charcoal mb-2">資金概要</h1>
          <p className="text-dark-blue-gray/70">財務状況の簡潔なサマリー</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-cool-blue text-white rounded-xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between h-40 cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setIsBudgetModalOpen(true); }}>
            <div className="absolute -top-8 -right-8 size-32 bg-white/10 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <p className="text-sm font-medium opacity-80 mb-2">今月の予算</p>
              <p className="text-4xl font-bold tracking-tight">¥{settings.monthlyBudgetAmount ? settings.monthlyBudgetAmount.toLocaleString() : '未設定'}</p>
            </div>
            <div className="relative z-10 flex items-center gap-2 text-sm font-medium opacity-90">
              <ArrowRightLeft className="w-5 h-5" />
              <span>{accounts.find(a => a.id === settings.monthlyBudgetAccountId)?.name ?? '未設定'}</span>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-md border border-border-light flex flex-col justify-center h-40">
            <div className="flex justify-between text-sm text-dark-blue-gray mb-3 font-medium">
              <span>予算使用状況</span>
              <span>予算額: ¥{totalBudget.toLocaleString()}</span>
            </div>
            <div className="h-3 w-full bg-border-light/50 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-accent-green rounded-full" style={{ width: `${budgetProgress}%` }}></div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-dark-blue-gray/70">使用率: {budgetProgress.toFixed(1)}%</p>
              <span className="text-xs font-semibold text-dark-blue-gray">超過: ¥{totalSpent.toLocaleString()}</span>
            </div>
          </div>
        </div>
        <TodoList
          transferTodos={transferTodos}
          accounts={accounts}
          incompleteTodoIds={incompleteTodoIds}
          completedTodoIds={completedTodoIds}
          completedCount={completedCount}
          onAddTodo={() => { setEditingTodo(null); setIsTodoModalOpen(true); }}
          onToggleTodo={toggleTodo}
          onEditTodo={(todo) => { setEditingTodo(todo); setIsTodoModalOpen(true); }}
          onDeleteTodo={async (id) => { if(confirm('このタスクを削除しますか？')) await TransferTodoRepository.deleteTransferTodo(id); await refreshTransferTodos(); }}
        />
      </div>
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
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Balance (初期残高)</label><input required name="balance" type="number" defaultValue={editingAccount?.balance ?? 0} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold transition-all" /></div>
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
              const monthlyBudgetAmount = Number(f.get('monthlyBudgetAmount')) || undefined;
              const monthlyBudgetAccountId = f.get('monthlyBudgetAccountId') as string || undefined;
              await BudgetRepository.updateSettings({
                monthlyBudgetAmount,
                monthlyBudgetAccountId
              });
              setIsBudgetModalOpen(false);
              await refreshSettings();
            }} className="space-y-4">
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Monthly Budget Amount (今月の予算額)</label><input required name="monthlyBudgetAmount" type="number" defaultValue={settings.monthlyBudgetAmount || 0} className="w-full p-4 bg-slate-50 rounded-xl border-2 border-transparent focus:border-indigo-500 outline-none font-bold transition-all" /></div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Monthly Budget Account (予算対象口座)</label><select required name="monthlyBudgetAccountId" defaultValue={settings.monthlyBudgetAccountId || ''} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all">{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>

              <div className="flex gap-2 pt-2">
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 flex items-center justify-center gap-2 transition-all"><Save className="w-5 h-5" /> 設定を保存</button>
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
              const type = selectedType;
              const fromId = selectedFromId;
              const toId = selectedToId;
              const amount = amountValue;

              if (!fromId) {
                alert('出金口座が不正です');
                return;
              }
              if (type !== 'payment' && !toId) {
                alert('入金口座を選択してください');
                return;
              }
              if (!amount || amount <= 0) {
                alert('金額を正しく入力してください');
                return;
              }
              if (type === 'transfer' && fromId === toId) {
                alert('出金口座と入金口座は異なるものを選択してください');
                return;
              }

              const inputNote = (f.get('note') as string)?.trim();

              const note =
                inputNote ||
                (type === 'budget_adjustment' ? '予算調整' : '');
              const d = {
                type,
                fromId,
                ...(type !== 'payment' && { toId }),
                amount,
                note,
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
                <div className="grid grid-cols-3 gap-2">
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" value="transfer" defaultChecked={!editingTodo || editingTodo.type === 'transfer'} onChange={(e) => setSelectedType(e.target.value as 'transfer' | 'payment' | 'budget_adjustment')} className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold">振替 (口座間移動)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" value="payment" defaultChecked={editingTodo?.type === 'payment'} onChange={(e) => setSelectedType(e.target.value as 'transfer' | 'payment' | 'budget_adjustment')} className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold">振込 (出金のみ)</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" name="type" value="budget_adjustment" defaultChecked={editingTodo?.type === 'budget_adjustment'} onChange={(e) => setSelectedType(e.target.value as 'transfer' | 'payment' | 'budget_adjustment')} className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold">予算調整</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">From (出金)</label>
                    {selectedType === 'budget_adjustment' ? (
                      <>
                        <input type="hidden" name="fromId" value={selectedFromId} />
                        <div className="w-full p-4 bg-slate-200 rounded-xl font-bold text-sm text-slate-600">{accounts.find(a => a.id === selectedFromId)?.name || '未選択'}</div>
                      </>
                    ) : (
                      <select required name="fromId" value={selectedFromId} onChange={(e) => setSelectedFromId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all"><option value="" disabled>選択してください</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                    )}
                  </div>
                  <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">To (入金)</label><select name="toId" disabled={selectedType === 'payment'} value={selectedToId} onChange={(e) => setSelectedToId(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"><option value="" disabled>選択してください</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                </div>


              <div>

                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Amount (金額)</label>

                  <div className="flex gap-2">

                    <input required name="amount" type="number" value={amountValue === 0 ? '' : amountValue} onChange={(e) => setAmountValue(e.target.value === '' ? 0 : Number(e.target.value))} className="flex-1 p-4 bg-slate-50 rounded-xl outline-none font-bold border-2 border-transparent focus:border-indigo-500 transition-all" />

                    {selectedType === 'budget_adjustment' && selectedFromId && settings.monthlyBudgetAmount && settings.monthlyBudgetAmount > 0 && <button type="button" onClick={() => {
                      const account = accounts.find(a => a.id === selectedFromId);
                      if (account) {
                        const adjustment = Math.max(0, account.balance - (settings.monthlyBudgetAmount || 0));
                        setAmountValue(adjustment);
                      }
                    }} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold">自動算出</button>}

                  </div>

                </div>
              <div><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Note (メモ)</label><input name="note" defaultValue={editingTodo?.note} placeholder="例: 家賃分" className="w-full p-4 bg-slate-50 rounded-xl outline-none font-bold text-sm border-2 border-transparent focus:border-indigo-500 transition-all" /></div>
              <div className="flex gap-2 pt-2">
                {editingTodo && <button type="button" onClick={async () => { if(confirm('削除しますか？')) { await TransferTodoRepository.deleteTransferTodo(editingTodo.id); setIsTodoModalOpen(false); setEditingTodo(null); await refreshTransferTodos(); } }} className="p-4 text-red-500 hover:bg-red-50 rounded-xl transition-colors"><Trash2 className="w-5 h-5" /></button>}
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg hover:bg-indigo-700 active:scale-95 flex items-center justify-center gap-2 transition-all"><Save className="w-5 h-5" /> タスクを保存</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
    </DndContext>
  );
};