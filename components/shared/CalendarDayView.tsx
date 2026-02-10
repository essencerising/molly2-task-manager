// CalendarDayView - Daily view for the calendar
'use client';

import { useMemo } from 'react';
import { format, addDays, subDays, isToday } from 'date-fns';
import { hu } from 'date-fns/locale';
import { Button } from '@/components/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TaskItemData } from './TaskItem';
import { cn } from '@/lib/utils';

interface CalendarDayViewProps {
    tasks: TaskItemData[];
    onTaskClick: (task: TaskItemData) => void;
    currentDate: Date;
    onDateChange: (date: Date) => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    todo: { label: 'Teendő', color: 'bg-amber-600' },
    in_progress: { label: 'Folyamatban', color: 'bg-sky-600' },
    done: { label: 'Kész', color: 'bg-emerald-600' },
};

export function CalendarDayView({ tasks, onTaskClick, currentDate, onDateChange }: CalendarDayViewProps) {
    const dayTasks = useMemo(() => {
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        return tasks.filter(t => t.dueDate?.split('T')[0] === dateKey);
    }, [tasks, currentDate]);

    const today = isToday(currentDate);
    const grouped = useMemo(() => {
        const groups: Record<string, TaskItemData[]> = { todo: [], in_progress: [], done: [] };
        dayTasks.forEach(t => {
            if (groups[t.status]) groups[t.status].push(t);
            else groups.todo.push(t);
        });
        return groups;
    }, [dayTasks]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg md:text-2xl font-bold">
                        {format(currentDate, 'yyyy. MMMM d., EEEE', { locale: hu })}
                    </h2>
                    {today && (
                        <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">Ma</span>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {!today && (
                        <Button variant="secondary" size="sm" onClick={() => onDateChange(new Date())} className="text-slate-400 hover:text-white text-xs mr-2">
                            Ma
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => onDateChange(subDays(currentDate, 1))} className="text-slate-400 hover:text-white">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDateChange(addDays(currentDate, 1))} className="text-slate-400 hover:text-white">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Summary bar */}
            <div className="flex gap-3 mb-4">
                {Object.entries(STATUS_LABELS).map(([key, { label, color }]) => (
                    <div key={key} className="flex items-center gap-1.5 text-xs text-slate-400">
                        <span className={cn('w-2.5 h-2.5 rounded-full', color)} />
                        <span>{label}: <span className="text-slate-200 font-medium">{grouped[key]?.length || 0}</span></span>
                    </div>
                ))}
            </div>

            {/* Tasks */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {dayTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500">
                        <p className="text-lg mb-1">Nincs feladat erre a napra</p>
                        <p className="text-sm">📅 {format(currentDate, 'MMMM d.', { locale: hu })}</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(STATUS_LABELS).map(([statusKey, { label, color }]) => {
                            const statusTasks = grouped[statusKey];
                            if (!statusTasks?.length) return null;

                            return (
                                <div key={statusKey}>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className={cn('w-3 h-3 rounded-full', color)} />
                                        <h3 className="text-sm font-semibold text-slate-300">{label}</h3>
                                        <span className="text-xs text-slate-500">({statusTasks.length})</span>
                                    </div>
                                    <div className="space-y-2">
                                        {statusTasks.map((task) => (
                                            <button
                                                key={task.id}
                                                onClick={() => onTaskClick(task)}
                                                className="w-full text-left"
                                            >
                                                <div
                                                    className="p-3 rounded-lg transition-all hover:shadow-lg hover:scale-[1.005] flex items-center gap-3"
                                                    style={{
                                                        backgroundColor: task.projectColor ? `${task.projectColor}15` : '#6366F115',
                                                        borderLeft: `4px solid ${task.projectColor || '#6366F1'}`,
                                                    }}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p className={cn(
                                                            'text-sm font-medium truncate',
                                                            task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-200'
                                                        )}>
                                                            {task.title}
                                                        </p>
                                                        {task.projectName && (
                                                            <p className="text-xs text-slate-500 mt-0.5">{task.projectName}</p>
                                                        )}
                                                    </div>
                                                    {task.status === 'done' && (
                                                        <span className="text-green-500 text-sm">✓</span>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
