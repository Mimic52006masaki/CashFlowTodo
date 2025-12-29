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
    <div ref={setNodeRef} style={style} className={className}>
      {/* ドラッグ専用ハンドル */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 hover:bg-slate-100 rounded text-slate-400 shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="w-4 h-4" />
      </div>
      {/* クリック領域 */}
      <div
        className="flex-1 flex items-center justify-between min-w-0 cursor-pointer"
        onClick={onClick}
      >
        {children}
      </div>
      {actions && (
        <div
          className="flex items-center gap-2 ml-2"
          onClick={(e) => e.stopPropagation()}
        >
          {actions}
        </div>
      )}
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
  const totalTodos = transferTodos.length;
  const completedTodos = transferTodos.filter(t => t.completed).length;

  const taskProgress =
    totalTodos > 0
      ? Math.round((completedTodos / totalTodos) * 100)
      : 0;

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
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 bg-white border-r border-slate-200 flex-col z-30 shrink-0 h-full">
        <div className="p-6 border-b border-slate-50">
          <div className="flex items-center gap-2 mb-6">
            <div className="bg-cool-blue rounded-lg p-1.5 text-white">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black tracking-tight">CashFlowTodo</h2>
          </div>
          <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Total Assets</p>
            <p className="text-xl font-black">¥{totalBalance.toLocaleString()}</p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">連携口座</p>
          <div className="flex flex-col gap-3">
            <SortableContext items={accountIds} strategy={verticalListSortingStrategy}>
              {accounts.map(acc => (
                <SortableItem key={acc.id} id={acc.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 group hover:border-cool-blue/30 transition-all cursor-pointer" onClick={() => { setEditingAccount(acc); setIsAccountModalOpen(true); }}>
                  <p className="text-[10px] font-bold text-slate-400 truncate">{acc.name}</p>
                  <p className="text-sm font-black text-slate-800">¥{acc.balance.toLocaleString()}</p>
                </SortableItem>
              ))}
            </SortableContext>
            <button onClick={() => { setEditingAccount(null); setIsAccountModalOpen(true); }} className="border-2 border-dashed border-slate-200 rounded-xl p-3 flex items-center justify-center text-slate-400 hover:text-cool-blue hover:border-cool-blue transition-all">
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="bg-white lg:bg-transparent border-b lg:border-none p-4 lg:p-8 shrink-0 z-20">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-cool-blue rounded-2xl p-5 lg:p-6 text-white shadow-xl shadow-blue-100 flex items-center justify-between relative overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow" onClick={() => { setIsBudgetModalOpen(true); }}>
                <div className="absolute -right-10 -top-10 size-32 bg-white/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                <div>
                  <p className="text-blue-100 font-bold text-xs mb-1">今月の予算額</p>
                  <h3 className="text-3xl lg:text-4xl font-black tracking-tighter">¥{settings.monthlyBudgetAmount ? settings.monthlyBudgetAmount.toLocaleString() : '未設定'}</h3>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/10 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Remaining</p>
                  <p className="text-sm font-black">¥{settings.monthlyBudgetAmount ? (settings.monthlyBudgetAmount - (totalBalance - (accounts.find(a => a.id === settings.monthlyBudgetAccountId)?.balance || 0))).toLocaleString() : '0'}</p>
                </div>
              </div>
            </div>

            <div className="lg:hidden">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                {accounts.map(acc => (
                  <div key={acc.id} className="bg-slate-50 border border-slate-100 rounded-xl p-3 min-w-[140px] shrink-0 cursor-pointer hover:border-cool-blue/30 transition-all" onClick={() => { setEditingAccount(acc); setIsAccountModalOpen(true); }}>
                    <p className="text-[9px] font-bold text-slate-400 truncate">{acc.name}</p>
                    <p className="text-sm font-black text-slate-800">¥{acc.balance.toLocaleString()}</p>
                  </div>
                ))}
                <button onClick={() => { setEditingAccount(null); setIsAccountModalOpen(true); }} className="bg-slate-100/30 border border-slate-100 rounded-xl px-4 flex items-center justify-center shrink-0 cursor-pointer hover:text-cool-blue hover:border-cool-blue transition-all">
                  <Plus className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 flex flex-col overflow-hidden px-4 lg:px-8">
          <div className="max-w-4xl mx-auto w-full flex flex-col h-full">
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
        </section>
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

              const fromAccount = accounts.find(a => a.id === fromId);
              const toAccount = accounts.find(a => a.id === toId);

              const inputNote = (f.get('note') as string)?.trim();

              const note =
                inputNote ||
                (type === 'budget_adjustment' ? '予算調整' : '');
              const d = {
                type,
                fromId,
                fromName: fromAccount?.name ?? '',
                ...(type !== 'payment' && {
                  toId,
                  toName: toAccount?.name ?? '',
                }),
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