// KanbanColumn Component - Droppable column
'use client';

import { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';

interface KanbanColumnProps {
    id: string;
    title: string;
    count: number;
    borderColor: string;
    headerColor: string;
    children: ReactNode;
}

export function KanbanColumn({
    id,
    title,
    count,
    borderColor,
    headerColor,
    children,
}: KanbanColumnProps) {
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'rounded-xl border-t-4 bg-slate-900/50 p-4 flex flex-col transition-all duration-200',
                borderColor,
                isOver && 'bg-slate-800/70 ring-2 ring-indigo-500/50 ring-offset-2 ring-offset-slate-950'
            )}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className={cn('w-2 h-2 rounded-full', headerColor)} />
                    <h3 className="font-semibold text-slate-200">{title}</h3>
                </div>
                <Badge variant="outline" size="sm">{count}</Badge>
            </div>

            {/* Column Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1">
                {children}
            </div>

            {/* Empty state */}
            {count === 0 && (
                <div className="flex items-center justify-center h-24 border-2 border-dashed border-slate-800 rounded-lg text-slate-600 text-sm">
                    Húzz ide egy feladatot
                </div>
            )}
        </div>
    );
}
