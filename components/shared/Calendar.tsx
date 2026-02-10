// Calendar Component - Hub with view switcher (Month, Week, Day)
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
import { CalendarWeekView } from './CalendarWeekView';
import { CalendarDayView } from './CalendarDayView';
import { TaskItemData } from './TaskItem';
import { cn } from '@/lib/utils';

interface CalendarProps {
    tasks: TaskItemData[];
    onTaskClick: (task: TaskItemData) => void;
}

type ViewMode = 'month' | 'week' | 'day';

const WEEKDAYS = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];

const VIEW_LABELS: Record<ViewMode, string> = {
    day: 'Nap',
    week: 'Hét',
    month: 'Hónap',
};

export function Calendar({ tasks, onTaskClick }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');

    // --- Month View Logic ---
    const calendarDays = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(currentDate);
        const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
        const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
        return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
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

    const getTasksForDay = (date: Date): TaskItemData[] => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return tasksByDate.get(dateKey) || [];
    };

    // Navigation
    const goToPreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1));
    const goToNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Week/Day views delegate navigation through props
    if (viewMode === 'week') {
        return (
            <div className="flex flex-col h-full">
                <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />
                <CalendarWeekView
                    tasks={tasks}
                    onTaskClick={onTaskClick}
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                />
            </div>
        );
    }

    if (viewMode === 'day') {
        return (
            <div className="flex flex-col h-full">
                <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />
                <CalendarDayView
                    tasks={tasks}
                    onTaskClick={onTaskClick}
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                />
            </div>
        );
    }

    // Month View (default)
    return (
        <div className="flex flex-col h-full">
            <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />

            {/* Month Header */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
                <div className="flex items-center gap-3 md:gap-4">
                    <h2 className="text-lg md:text-2xl font-bold">
                        {format(currentDate, 'yyyy. MMMM', { locale: hu })}
                    </h2>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={goToToday}
                        className="text-slate-400 hover:text-white text-xs"
                    >
                        Ma
                    </Button>
                </div>
                <div className="flex items-center gap-1 md:gap-2">
                    <Button variant="ghost" size="sm" onClick={goToPreviousMonth} className="text-slate-400 hover:text-white">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={goToNextMonth} className="text-slate-400 hover:text-white">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-px mb-px">
                {WEEKDAYS.map((day) => (
                    <div key={day} className="bg-slate-800/50 p-1.5 md:p-2 text-center text-xs md:text-sm font-medium text-slate-400">
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

// View Switcher sub-component
function ViewSwitcher({ viewMode, onChange }: { viewMode: ViewMode; onChange: (v: ViewMode) => void }) {
    return (
        <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg mb-4 w-fit">
            {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
                <button
                    key={mode}
                    onClick={() => onChange(mode)}
                    className={cn(
                        'px-3 py-1.5 rounded-md text-xs md:text-sm font-medium transition-all',
                        viewMode === mode
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                    )}
                >
                    {VIEW_LABELS[mode]}
                </button>
            ))}
        </div>
    );
}
