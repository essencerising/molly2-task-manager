// Calendar Day Component
'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui';
import { TaskItemData } from './TaskItem';
import { useState } from 'react';

interface CalendarDayProps {
    date: Date;
    isCurrentMonth: boolean;
    isToday: boolean;
    tasks: TaskItemData[];
    onTaskClick: (task: TaskItemData) => void;
}

export function CalendarDay({ date, isCurrentMonth, isToday, tasks, onTaskClick }: CalendarDayProps) {
    const dayNumber = date.getDate();
    const [showAll, setShowAll] = useState(false);
    const maxVisibleTasks = 3;
    const visibleTasks = showAll ? tasks : tasks.slice(0, maxVisibleTasks);
    const remainingCount = tasks.length - maxVisibleTasks;

    return (
        <div
            className={cn(
                'min-h-[80px] md:min-h-[120px] border border-slate-800 p-1 md:p-2 transition-colors',
                isCurrentMonth ? 'bg-slate-900/50' : 'bg-slate-900/20',
                isToday && 'ring-1 md:ring-2 ring-indigo-500'
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
                {tasks.length > 0 && (
                    <span className="text-[10px] md:text-xs text-slate-500">{tasks.length}</span>
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
                                'text-[10px] md:text-xs px-1 md:px-2 py-0.5 md:py-1 rounded truncate transition-all',
                                'hover:shadow-md hover:scale-[1.02]'
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
                ))}

                {/* More tasks indicator - now clickable */}
                {remainingCount > 0 && !showAll && (
                    <button
                        onClick={() => setShowAll(true)}
                        className="text-[10px] md:text-xs text-indigo-400 hover:text-indigo-300 px-1 md:px-2 py-0.5 md:py-1 hover:bg-slate-800/50 rounded transition-colors w-full text-left"
                    >
                        +{remainingCount} több
                    </button>
                )}

                {/* Show less button */}
                {showAll && tasks.length > maxVisibleTasks && (
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
