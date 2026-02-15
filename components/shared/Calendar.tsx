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
import { CalendarListView } from './CalendarListView';
import { TaskItemData } from './TaskItem';
import { cn } from '@/lib/utils';
import { CalendarEvent } from '@/lib/eventsService';
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    TouchSensor
} from '@dnd-kit/core';

interface CalendarProps {
    tasks: TaskItemData[];
    events?: CalendarEvent[];
    onTaskClick: (task: TaskItemData) => void;
    onEventClick?: (event: CalendarEvent) => void;
    onTaskMove?: (taskId: string, newDate: string) => void;
    onEventMove?: (eventId: string, newDate: string) => void;
}

type ViewMode = 'month' | 'week' | 'day' | 'list';

const WEEKDAYS = ['H', 'K', 'Sze', 'Cs', 'P', 'Szo', 'V'];

const VIEW_LABELS: Record<ViewMode, string> = {
    day: 'Nap',
    week: 'Hét',
    month: 'Hónap',
    list: 'Lista',
};

export function Calendar({ tasks, events = [], onTaskClick, onEventClick, onTaskMove, onEventMove }: CalendarProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<ViewMode>('month');

    // Sensors for drag and drop
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 200,
                tolerance: 5,
            },
        })
    );

    const [activeDragItem, setActiveDragItem] = useState<{ id: string; type: 'task' | 'event'; data: any } | null>(null);

    const handleDragStart = (event: any) => {
        const { active } = event;
        const taskId = active.id.toString();

        // Check if it's a task or event (based on prefix or lookup)
        // For now, let's assume tasks have normal IDs. We might need to prefix them in Draggable.
        // Actually, let's prefix in CalendarDay.

        if (taskId.startsWith('task-')) {
            const realId = taskId.replace('task-', '');
            const task = tasks.find(t => t.id === realId);
            if (task) setActiveDragItem({ id: realId, type: 'task', data: task });
        } else if (taskId.startsWith('event-')) {
            const realId = taskId.replace('event-', '');
            const eventItem = events.find(e => e.id === realId);
            if (eventItem) setActiveDragItem({ id: realId, type: 'event', data: eventItem });
        }
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;
        setActiveDragItem(null);

        if (!over) return;

        const targetDateStr = over.id as string; // We'll use date string as droppable ID

        if (active.id.startsWith('task-')) {
            const taskId = active.id.replace('task-', '');
            const task = tasks.find(t => t.id === taskId);
            // Only move if date changed
            if (task && task.dueDate?.split('T')[0] !== targetDateStr) {
                onTaskMove?.(taskId, targetDateStr);
            }
        } else if (active.id.startsWith('event-')) {
            const eventId = active.id.replace('event-', '');
            const eventItem = events.find(e => e.id === eventId);
            // Only move if date changed (start date)
            if (eventItem && eventItem.start_time.split('T')[0] !== targetDateStr) {
                onEventMove?.(eventId, targetDateStr);
            }
        }
    };

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

    const eventsByDate = useMemo(() => {
        const grouped = new Map<string, CalendarEvent[]>();
        events.forEach(event => {
            const startDate = new Date(event.start_time);
            const endDate = new Date(event.end_time);

            // Handle potentially invalid dates
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return;

            const days = eachDayOfInterval({ start: startDate, end: endDate });

            days.forEach(day => {
                const dateKey = format(day, 'yyyy-MM-dd');
                if (!grouped.has(dateKey)) grouped.set(dateKey, []);
                // Avoid duplicates if interval includes same day multiple times (unlikely with eachDayOfInterval but safe)
                const dayEvents = grouped.get(dateKey)!;
                if (!dayEvents.some(e => e.id === event.id)) {
                    dayEvents.push(event);
                }
            });
        });
        return grouped;
    }, [events]);

    const getTasksForDay = (date: Date): TaskItemData[] => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return tasksByDate.get(dateKey) || [];
    };

    const getEventsForDay = (date: Date): CalendarEvent[] => {
        const dateKey = format(date, 'yyyy-MM-dd');
        return eventsByDate.get(dateKey) || [];
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
                    events={events} // Pass events
                    onEventClick={onEventClick}
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
                    events={events} // Pass events
                    onEventClick={onEventClick}
                />
            </div>
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="flex flex-col h-full">
                <ViewSwitcher viewMode={viewMode} onChange={setViewMode} />
                <CalendarListView
                    currentDate={currentDate}
                    onDateChange={setCurrentDate}
                    events={events}
                    onEventClick={onEventClick}
                />
            </div>
        );
    }

    // Month View (default)
    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
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
                            events={getEventsForDay(day)}
                            onTaskClick={onTaskClick}
                            onEventClick={onEventClick}
                        />
                    ))}
                </div>
            </div>
            <DragOverlay>
                {activeDragItem ? (
                    <div className="opacity-90 rotate-3 scale-105 pointer-events-none">
                        {activeDragItem.type === 'task' ? (
                            <div className="bg-slate-800 border border-indigo-500/50 p-2 rounded shadow-xl text-xs text-white w-32 truncate">
                                {activeDragItem.data.title}
                            </div>
                        ) : (
                            <div className="bg-indigo-600 p-2 rounded shadow-xl text-xs text-white w-32 truncate">
                                {activeDragItem.data.title}
                            </div>
                        )}
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

// View Switcher sub-component
function ViewSwitcher({ viewMode, onChange }: { viewMode: ViewMode; onChange: (v: ViewMode) => void }) {
    return (
        <div className="flex gap-1 p-1 bg-slate-800/50 rounded-lg mb-4 w-fit">
            {(['day', 'week', 'month', 'list'] as ViewMode[]).map((mode) => (
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
