// CalendarWeekView - Weekly view for the calendar
'use client';

import { useMemo } from 'react';
import {
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    isToday,
    addWeeks,
    subWeeks,
} from 'date-fns';
import { hu } from 'date-fns/locale';
import { Button } from '@/components/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TaskItemData } from './TaskItem';
import { cn } from '@/lib/utils';

import { CalendarEvent } from '@/lib/eventsService';

interface CalendarWeekViewProps {
    tasks: TaskItemData[];
    onTaskClick: (task: TaskItemData) => void;
    currentDate: Date;
    onDateChange: (date: Date) => void;
    events?: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
}

const STATUS_COLORS: Record<string, string> = {
    todo: 'bg-amber-600',
    in_progress: 'bg-sky-600',
    done: 'bg-emerald-600',
};

export function CalendarWeekView({ tasks, onTaskClick, currentDate, onDateChange, events = [], onEventClick }: CalendarWeekViewProps) {
    const weekDays = useMemo(() => {
        const start = startOfWeek(currentDate, { weekStartsOn: 1 });
        const end = endOfWeek(currentDate, { weekStartsOn: 1 });
        return eachDayOfInterval({ start, end });
    }, [currentDate]);

    const tasksByDate = useMemo(() => {
        const grouped = new Map<string, TaskItemData[]>();
        tasks.forEach(task => {
            if (task.dueDate) {
                const dateKey = task.dueDate.split('T')[0];
                if (!grouped.has(dateKey)) grouped.set(dateKey, []);
                grouped.get(dateKey)!.push(task);
            }
        });
        return grouped;
    }, [tasks]);

    const eventsByDate = useMemo(() => {
        const grouped = new Map<string, CalendarEvent[]>();
        if (!events) return grouped;
        events.forEach(event => {
            const dateKey = event.start_time.split('T')[0];
            if (!grouped.has(dateKey)) grouped.set(dateKey, []);
            grouped.get(dateKey)!.push(event);
        });
        return grouped;
    }, [events]);

    const getTasksForDay = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return tasksByDate.get(dateKey) || [];
    };

    const getEventsForDay = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return eventsByDate.get(dateKey) || [];
    };

    const weekRange = `${format(weekDays[0], 'MMM d.', { locale: hu })} – ${format(weekDays[6], 'MMM d.', { locale: hu })}`;

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-lg md:text-2xl font-bold">{weekRange}</h2>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => onDateChange(new Date())}
                        className="text-slate-400 hover:text-white text-xs"
                    >
                        Ma
                    </Button>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => onDateChange(subWeeks(currentDate, 1))} className="text-slate-400 hover:text-white">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDateChange(addWeeks(currentDate, 1))} className="text-slate-400 hover:text-white">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Week Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-7 gap-px bg-slate-800/30 rounded-xl overflow-hidden">
                {weekDays.map((day) => {
                    const dayTasks = getTasksForDay(day);
                    const dayEvents = getEventsForDay(day);
                    const today = isToday(day);

                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                'flex flex-col p-3 bg-slate-900/50 min-h-[80px] md:min-h-[200px]',
                                today && 'ring-2 ring-indigo-500 ring-inset'
                            )}
                        >
                            {/* Day Header */}
                            <div className="flex items-center gap-2 mb-2">
                                <span className={cn(
                                    'text-xs font-medium uppercase tracking-wide',
                                    today ? 'text-indigo-400' : 'text-slate-500'
                                )}>
                                    {format(day, 'EEE', { locale: hu })}
                                </span>
                                <span className={cn(
                                    'text-sm md:text-lg font-bold',
                                    today ? 'bg-indigo-600 text-white rounded-full w-7 h-7 flex items-center justify-center' : 'text-slate-300'
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {(dayTasks.length + dayEvents.length) > 0 && (
                                    <span className="text-xs text-slate-500 ml-auto">{dayTasks.length + dayEvents.length}</span>
                                )}
                            </div>

                            {/* Items */}
                            <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
                                {/* Events */}
                                {dayEvents.map((event) => (
                                    <button
                                        key={event.id}
                                        onClick={() => onEventClick?.(event)}
                                        className="w-full text-left"
                                    >
                                        <div
                                            className="text-xs px-2 py-1.5 rounded-md transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-1.5 bg-indigo-600/20 border-l-2 border-indigo-500"
                                        >
                                            <span className="text-[10px] text-indigo-300 font-mono flex-shrink-0">
                                                {event.is_all_day ? 'Egész' : event.start_time.split('T')[1].substring(0, 5)}
                                            </span>
                                            <span className="truncate text-indigo-100 font-medium">
                                                {event.title}
                                            </span>
                                        </div>
                                    </button>
                                ))}

                                {/* Tasks */}
                                {dayTasks.map((task) => (
                                    <button
                                        key={task.id}
                                        onClick={() => onTaskClick(task)}
                                        className="w-full text-left"
                                    >
                                        <div
                                            className="text-xs px-2 py-1.5 rounded-md transition-all hover:shadow-md hover:scale-[1.01] flex items-center gap-1.5"
                                            style={{
                                                backgroundColor: task.projectColor ? `${task.projectColor}20` : '#6366F120',
                                                borderLeft: `3px solid ${task.projectColor || '#6366F1'}`,
                                            }}
                                        >
                                            <span className={cn(
                                                'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                                STATUS_COLORS[task.status] || 'bg-slate-500'
                                            )} />
                                            <span className={cn(
                                                'truncate',
                                                task.status === 'done' && 'line-through text-slate-500'
                                            )}>
                                                {task.title}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
