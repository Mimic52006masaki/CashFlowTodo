'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

export const SortableItem = ({ id, children, className, onClick, actions }: { id: string; children: React.ReactNode; className?: string; onClick?: () => void; actions?: React.ReactNode }) => {
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