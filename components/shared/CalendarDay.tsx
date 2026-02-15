import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { TaskItemData } from './TaskItem';
import { useState } from 'react';
import { CalendarEvent } from '@/lib/eventsService';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';

interface CalendarDayProps {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    tasks: TaskItemData[];
    events?: CalendarEvent[];
    onTaskClick: (task: TaskItemData) => void;
    onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarDay({ date, isCurrentMonth, isToday, tasks, events = [], onTaskClick, onEventClick }: CalendarDayProps) {
    const dayNumber = date.getDate();
    const dateStr = format(date, 'yyyy-MM-dd');
    const [showAll, setShowAll] = useState(false);

    const { setNodeRef, isOver } = useDroppable({
        id: dateStr,
    });

    const maxVisibleItems = 3;
    const allItems = [
        ...events.map(e => ({ type: 'event' as const, data: e, sortTime: e.is_all_day ? '00:00' : e.start_time.split('T')[1] })),
        ...tasks.map(t => ({ type: 'task' as const, data: t, sortTime: t.dueDate?.split('T')[1] || '23:59' }))
    ].sort((a, b) => a.sortTime.localeCompare(b.sortTime));

    const visibleItems = showAll ? allItems : allItems.slice(0, maxVisibleItems);
    const remainingCount = allItems.length - maxVisibleItems;

    return (
        <div
            ref={setNodeRef}
            className={cn(
                'min-h-[80px] md:min-h-[120px] border border-slate-800 p-1 md:p-2 transition-colors',
                isCurrentMonth ? 'bg-slate-900/50' : 'bg-slate-900/20',
                isToday && 'ring-1 md:ring-2 ring-indigo-500',
                isOver && 'bg-slate-800/80 ring-2 ring-indigo-400/50'
            )}
        >
            {/* Day Number */}
            <div className="flex items-center justify-between mb-1 md:mb-2">
                <span
                    className={cn(
                        'text-xs md:text-sm font-medium',
                        isToday && 'bg-indigo-600 text-white rounded-full w-5 h-5 md:w-6 md:h-6 flex items-center justify-center text-[10px] md:text-sm',
                        !isToday && isCurrentMonth && 'text-slate-300',
                        !isToday && !isCurrentMonth && 'text-slate-600'
                    )}
                >
                    {dayNumber}
                </span>
                {allItems.length > 0 && (
                    <span className="text-[10px] md:text-xs text-slate-500">{allItems.length}</span>
                )}
            </div>

            {/* Items */}
            <div className="space-y-1">
                {visibleItems.map((item) => {
                    if (item.type === 'task') {
                        return (
                            <DraggableTaskItem
                                key={item.data.id}
                                task={item.data as TaskItemData}
                                onClick={onTaskClick}
                            />
                        );
                    } else {
                        return (
                            <DraggableEventItem
                                key={item.data.id}
                                event={item.data as CalendarEvent}
                                onClick={onEventClick}
                            />
                        );
                    }
                })}

                {/* More items indicator */}
                {remainingCount > 0 && !showAll && (
                    <button
                        onClick={() => setShowAll(true)}
                        className="text-[10px] md:text-xs text-indigo-400 hover:text-indigo-300 px-1 md:px-2 py-0.5 md:py-1 hover:bg-slate-800/50 rounded transition-colors w-full text-left"
                    >
                        +{remainingCount} több
                    </button>
                )}

                {/* Show less button */}
                {showAll && allItems.length > maxVisibleItems && (
                    <button
                        onClick={() => setShowAll(false)}
                        className="text-[10px] md:text-xs text-slate-500 hover:text-slate-400 px-1 md:px-2 py-0.5 md:py-1 hover:bg-slate-800/50 rounded transition-colors w-full text-left"
                    >
                        Kevesebb
                    </button>
                )}
            </div>
        </div>
    );
}

function DraggableTaskItem({ task, onClick }: { task: TaskItemData; onClick: (t: TaskItemData) => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `task-${task.id}`,
        data: { type: 'task', title: task.title }
    });

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
    } : undefined;

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                className="opacity-50 text-[10px] md:text-xs px-1 md:px-2 py-0.5 md:py-1 rounded bg-slate-800 border border-slate-700"
                style={style}
            >
                {task.title}
            </div>
        );
    }

    return (
        <button
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={() => onClick(task)}
            className="w-full text-left group touch-manipulation"
        >
            <div
                className={cn(
                    'text-[10px] md:text-xs px-1 md:px-2 py-0.5 md:py-1 rounded truncate transition-all',
                    'hover:shadow-md hover:scale-[1.02] cursor-grab active:cursor-grabbing'
                )}
                style={{
                    backgroundColor: task.projectColor ? `${task.projectColor}20` : '#6366F120',
                    borderLeft: `2px md:3px solid ${task.projectColor || '#6366F1'}`,
                }}
            >
                <div className="flex items-center gap-0.5 md:gap-1">
                    {task.status === 'done' && (
                        <span className="text-green-500 text-[10px] md:text-xs">✓</span>
                    )}
                    <span className={cn(
                        'truncate',
                        task.status === 'done' && 'line-through text-slate-500'
                    )}>
                        {task.title}
                    </span>
                </div>
            </div>
        </button>
    );
}

function DraggableEventItem({ event, onClick }: { event: CalendarEvent; onClick?: (e: CalendarEvent) => void }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `event-${event.id}`,
        data: { type: 'event', title: event.title }
    });

    const style = transform ? {
        transform: CSS.Translate.toString(transform),
    } : undefined;

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                className="opacity-50 text-[10px] md:text-xs px-1 md:px-2 py-0.5 md:py-1 rounded bg-indigo-900 border border-indigo-700"
                style={style}
            >
                {event.title}
            </div>
        );
    }

    return (
        <button
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={() => onClick?.(event)}
            className="w-full text-left group touch-manipulation"
        >
            <div
                className={cn(
                    'text-[10px] md:text-xs px-1 md:px-2 py-0.5 md:py-1 rounded truncate transition-all',
                    'hover:shadow-md hover:scale-[1.02] cursor-grab active:cursor-grabbing',
                    'bg-indigo-600/20 border-l-2 md:border-l-3 border-indigo-500'
                )}
            >
                <div className="flex items-center gap-0.5 md:gap-1">
                    <span className="text-[9px] text-indigo-300 font-mono">
                        {event.is_all_day
                            ? 'Egész nap'
                            : `${event.start_time.split('T')[1].substring(0, 5)} - ${event.end_time.split('T')[1].substring(0, 5)}`
                        }
                    </span>
                    <span className="truncate text-indigo-100">
                        {event.title}
                    </span>
                </div>
            </div>
        </button>
    );
}
