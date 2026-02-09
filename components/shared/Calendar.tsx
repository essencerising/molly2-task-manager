// Calendar Component
'use client';

import { useState, useMemo } from 'react';
import {
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    format,
    addMonths,
    subMonths,
    isSameDay,
    isToday,
    isSameMonth
} from 'date-fns';
import { hu } from 'date-fns/locale';
import { Button } from '@/components/ui';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarDay } from './CalendarDay';
import { TaskItemData } from './TaskItem';

interface CalendarProps {
    tasks: TaskItemData[];
    onTaskClick: (task: TaskItemData) => void;
}

const WEEKDAYS = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];

export function Calendar({ tasks, onTaskClick }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Generate calendar days
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
    }, [currentDate]);

    // Group tasks by date
    const tasksByDate = useMemo(() => {
        const grouped = new Map<string, TaskItemData[]>();

        tasks.forEach(task => {
            if (task.dueDate) {
                const dateKey = task.dueDate.split('T')[0]; // YYYY-MM-DD
                if (!grouped.has(dateKey)) {
                    grouped.set(dateKey, []);
                }
                grouped.get(dateKey)!.push(task);
            }
        });

        return grouped;
    }, [tasks]);

    // Get tasks for a specific day
    const getTasksForDay = (date: Date): TaskItemData[] => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return tasksByDate.get(dateKey) || [];
    };

    // Navigation
    const goToPreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1));
    const goToNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
    const goToToday = () => setCurrentDate(new Date());

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold">
                        {format(currentDate, 'yyyy. MMMM', { locale: hu })}
                    </h2>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={goToToday}
                        className="text-slate-400 hover:text-white"
                    >
                        Ma
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToPreviousMonth}
                        className="text-slate-400 hover:text-white"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={goToNextMonth}
                        className="text-slate-400 hover:text-white"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-px mb-px">
                {WEEKDAYS.map((day) => (
                    <div
                        key={day}
                        className="bg-slate-800/50 p-2 text-center text-sm font-medium text-slate-400"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-px flex-1 bg-slate-800/30">
                {calendarDays.map((day) => (
                    <CalendarDay
                        key={day.toISOString()}
                        date={day}
                        isCurrentMonth={isSameMonth(day, currentDate)}
                        isToday={isToday(day)}
                        tasks={getTasksForDay(day)}
                        onTaskClick={onTaskClick}
                    />
                ))}
            </div>
        </div>
    );
}
