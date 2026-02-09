// Calendar Day Component
'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { TaskItemData } from './TaskItem';

interface CalendarDayProps {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    tasks: TaskItemData[];
    onTaskClick: (task: TaskItemData) => void;
}

export function CalendarDay({ date, isCurrentMonth, isToday, tasks, onTaskClick }: CalendarDayProps) {
    const dayNumber = date.getDate();
    const maxVisibleTasks = 3;
    const visibleTasks = tasks.slice(0, maxVisibleTasks);
    const remainingCount = tasks.length - maxVisibleTasks;

    return (
        <div
            className={cn(
                'min-h-[120px] border border-slate-800 p-2 transition-colors',
                isCurrentMonth ? 'bg-slate-900/50' : 'bg-slate-900/20',
                isToday && 'ring-2 ring-indigo-500'
            )}
        >
            {/* Day Number */}
            <div className="flex items-center justify-between mb-2">
                <span
                    className={cn(
                        'text-sm font-medium',
                        isToday && 'bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center',
                        !isToday && isCurrentMonth && 'text-slate-300',
                        !isToday && !isCurrentMonth && 'text-slate-600'
                    )}
                >
                    {dayNumber}
                </span>
                {tasks.length > 0 && (
                    <span className="text-xs text-slate-500">{tasks.length}</span>
                )}
            </div>

            {/* Tasks */}
            <div className="space-y-1">
                {visibleTasks.map((task) => (
                    <button
                        key={task.id}
                        onClick={() => onTaskClick(task)}
                        className="w-full text-left group"
                    >
                        <div
                            className={cn(
                                'text-xs px-2 py-1 rounded truncate transition-all',
                                'hover:shadow-md hover:scale-[1.02]'
                            )}
                            style={{
                                backgroundColor: task.projectColor ? `${task.projectColor}20` : '#6366F120',
                                borderLeft: `3px solid ${task.projectColor || '#6366F1'}`,
                            }}
                        >
                            <div className="flex items-center gap-1">
                                {task.status === 'done' && (
                                    <span className="text-green-500">✓</span>
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
                ))}

                {/* More tasks indicator */}
                {remainingCount > 0 && (
                    <div className="text-xs text-slate-500 px-2">
                        +{remainingCount} több
                    </div>
                )}
            </div>
        </div>
    );
}
