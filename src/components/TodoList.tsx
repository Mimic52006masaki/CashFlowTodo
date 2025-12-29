'use client';

import { TransferTodo, Account } from '@/lib/types';
import { SortableItem } from './SortableItem';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, Trash2, CheckCircle2, ArrowRightLeft } from 'lucide-react';

interface TodoListProps {
  transferTodos: TransferTodo[];
  accounts: Account[];
  incompleteTodoIds: string[];
  completedTodoIds: string[];
  completedCount: number;
  onAddTodo: () => void;
  onToggleTodo: (id: string) => void;
  onEditTodo: (todo: TransferTodo) => void;
  onDeleteTodo: (id: string) => void;
}

export function TodoList({ transferTodos, accounts, incompleteTodoIds, completedTodoIds, completedCount, onAddTodo, onToggleTodo, onEditTodo, onDeleteTodo }: TodoListProps) {
  return (
    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20">
      <div className="flex items-center justify-between mb-5 sticky top-0 bg-background-main z-10 py-2">
        <h3 className="text-xl font-bold text-primary-charcoal">未完了の資金タスク</h3>
      </div>
      <button onClick={onAddTodo} className="w-full py-4 rounded-xl border-2 border-dashed border-cool-blue/30 text-cool-blue font-semibold hover:bg-cool-blue/5 hover:border-cool-blue transition-all flex items-center justify-center gap-2 group">
        <Plus className="group-hover:scale-110 transition-transform" />
        <span>タスクを追加</span>
      </button>
      <div className="space-y-4 mb-8 max-h-96 overflow-y-auto">
        <SortableContext items={incompleteTodoIds} strategy={verticalListSortingStrategy}>
          {transferTodos.filter(t => !t.completed).map(todo => {
            const fromAccount = accounts.find(a => a.id === todo.fromId);
            const toAccount = accounts.find(a => a.id === todo.toId);
            const isLowBalance = fromAccount && fromAccount.balance < todo.amount;
            return (
              <SortableItem key={todo.id} id={todo.id} onClick={() => onToggleTodo(todo.id)} className={`bg-white p-5 rounded-lg shadow-sm border border-border-light hover:shadow-md transition-shadow group ${isLowBalance ? 'border-warning-red/30' : ''}`} actions={
                <>
                  <button onClick={(e) => { e.stopPropagation(); onEditTodo(todo); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button onClick={async (e) => { e.stopPropagation(); if(confirm('このタスクを削除しますか？')) onDeleteTodo(todo.id); }} className="p-2 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              }>
                <div className="w-full flex items-center gap-4 cursor-pointer">
                  <div className="size-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 shrink-0 shadow-sm border border-orange-100">
                    <ArrowRightLeft className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-primary-charcoal font-semibold truncate text-base group-hover:text-cool-blue transition-colors">{todo.note || `${fromAccount?.name} → ${toAccount?.name}`}</p>
                    <p className="text-dark-blue-gray/70 text-sm mt-1 flex items-center gap-2">
                      <span className="font-medium bg-border-light/50 px-2 py-0.5 rounded text-xs text-dark-blue-gray">{fromAccount?.name}</span>
                      {isLowBalance && (
                        <>
                          <span className="size-1 bg-dark-blue-gray/30 rounded-full"></span>
                          <span className="text-warning-red font-medium">残高不足の可能性あり</span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-primary-charcoal font-bold text-lg">¥{todo.amount.toLocaleString()}</p>
                    <button onClick={(e) => { e.stopPropagation(); onToggleTodo(todo.id); }} className="size-6 rounded-full border-2 border-border-light group-hover:border-cool-blue transition-colors flex items-center justify-center">
                      <div className="size-3 bg-cool-blue rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                  </div>
                </div>
              </SortableItem>
            );
          })}
        </SortableContext>
      </div>
      <div>
        <div className="mb-3">
          <h3 className="text-sm font-bold text-dark-blue-gray uppercase tracking-wider flex items-center gap-2">
            完了済みタスク
            <span className="bg-border-light text-dark-blue-gray px-2 py-0.5 rounded text-xs">{completedCount}</span>
          </h3>
        </div>
        <div className="space-y-4 mb-8 max-h-96 overflow-y-auto">
          <SortableContext items={completedTodoIds} strategy={verticalListSortingStrategy}>
            {transferTodos.filter(t => t.completed).map(todo => {
              const fromAccount = accounts.find(a => a.id === todo.fromId);
              return (
                <SortableItem key={todo.id} id={todo.id} onClick={() => onToggleTodo(todo.id)} className="bg-white/60 p-5 rounded-lg shadow-sm border border-border-light/60 opacity-70 grayscale-[0.5] hover:opacity-100 hover:grayscale-0 transition-all" actions={
                  <button onClick={async (e) => { e.stopPropagation(); if(confirm('この完了済みタスクを削除しますか？')) onDeleteTodo(todo.id); }} className="p-2 hover:bg-red-50 rounded-full transition-colors text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                }>
                  <div className="w-full flex items-center gap-4 cursor-pointer">
                    <div className="size-12 rounded-full bg-border-light flex items-center justify-center text-dark-blue-gray shrink-0">
                      <ArrowRightLeft className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-primary-charcoal font-semibold truncate line-through decoration-dark-blue-gray">{todo.note || `${fromAccount?.name} 振替`}</p>
                      <p className="text-dark-blue-gray/70 text-sm mt-1">{fromAccount?.name}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-dark-blue-gray font-bold text-lg line-through">¥{todo.amount.toLocaleString()}</p>
                      <div className="size-6 rounded-full bg-accent-green text-white flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </SortableItem>
              );
            })}
          </SortableContext>
        </div>
      </div>
    </div>
  );
}