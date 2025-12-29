'use client';

import { Account } from '@/lib/types';
import { SortableItem } from './SortableItem';
import { Plus } from 'lucide-react';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

interface AccountListProps {
  accounts: Account[];
  accountIds: string[];
  totalBalance: number;
  onAddAccount: () => void;
  onEditAccount: (account: Account) => void;
}

export function AccountList({ accounts, accountIds, totalBalance, onAddAccount, onEditAccount }: AccountListProps) {
  return (
    <div className="w-64 bg-background-sidebar shadow-lg flex flex-col p-6 border-r border-border-light shrink-0 z-10">
      <div className="mb-8 flex flex-col h-full">
        <h2 className="text-lg font-bold text-primary-charcoal mb-6 flex items-center gap-2">
          <span>口座</span>
        </h2>
        <div className="space-y-4 mb-4">
          <SortableContext items={accountIds} strategy={verticalListSortingStrategy}>
            {accounts.map(acc => (
              <SortableItem key={acc.id} id={acc.id} className="group bg-white border border-border-light rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => onEditAccount(acc)}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-dark-blue-gray/60 uppercase tracking-wide">{acc.name}</span>
                </div>
                <p className="text-xl font-bold text-primary-charcoal tracking-tight">¥{acc.balance.toLocaleString()}</p>
              </SortableItem>
            ))}
          </SortableContext>
        </div>
        <button onClick={onAddAccount} className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-cool-blue/30 text-cool-blue font-semibold hover:bg-cool-blue/5 hover:border-cool-blue transition-all group">
          <Plus className="group-hover:scale-110 transition-transform" />
          <span>口座を追加</span>
        </button>
      </div>
      <div className="mt-auto pt-6 border-t border-border-light">
        <p className="text-xs font-bold text-dark-blue-gray/60 uppercase tracking-wide mb-2">総資産</p>
        <p className="text-2xl font-bold text-cool-blue tracking-tight">¥{totalBalance.toLocaleString()}</p>
      </div>
    </div>
  );
}