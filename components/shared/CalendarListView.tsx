// CalendarListView - List view for events (Agenda style)
'use client';

import { useMemo, useEffect, useRef } from 'react';
import {
    format,
    isSameMonth,
    isToday,
    compareAsc,
    parseISO,
    isSameDay,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval
} from 'date-fns';
import { hu } from 'date-fns/locale';
import { Button } from '@/components/ui';
import { CalendarEvent } from '@/lib/eventsService';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarListViewProps {
    currentDate: Date;
    onDateChange: (date: Date) => void;
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarListView({ currentDate, onDateChange, events = [], onEventClick }: CalendarListViewProps) {

    // Filter events for the current month and sort them
    const monthEvents = useMemo(() => {
        if (!events.length) return [];

        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);

        return events
            .filter(event => {
                const eventDate = parseISO(event.start_time);
                return isSameMonth(eventDate, currentDate);
            })
            .sort((a, b) => compareAsc(parseISO(a.start_time), parseISO(b.start_time)));
    }, [events, currentDate]);

    // Group events by day
    const groupedEvents = useMemo(() => {
        const groups = new Map<string, CalendarEvent[]>();

        monthEvents.forEach(event => {
            const dateKey = event.start_time.split('T')[0];
            if (!groups.has(dateKey)) {
                groups.set(dateKey, []);
            }
            groups.get(dateKey)!.push(event);
        });

        return groups;
    }, [monthEvents]);

    // Get sorted dates that have events
    const eventDates = useMemo(() => {
        return Array.from(groupedEvents.keys()).sort();
    }, [groupedEvents]);

    const listRef = useRef<HTMLDivElement>(null);

    // Scroll to date logic
    useEffect(() => {
        // Find the element for the current date
        const dateKey = format(currentDate, 'yyyy-MM-dd');
        const element = document.getElementById(`date-${dateKey}`);

        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            // If the exact date is not found (e.g. no events today), scroll to the top
            // This ensures that when switching months, we start at the top
            if (listRef.current) {
                listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    }, [currentDate, eventDates]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl md:text-2xl font-bold">
                        {format(currentDate, 'yyyy. MMMM', { locale: hu })}
                    </h2>
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
                    <Button variant="ghost" size="sm" onClick={() => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="text-slate-400 hover:text-white">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDateChange(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="text-slate-400 hover:text-white">
                        <ChevronRight className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* List Content */}
            <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {eventDates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-70">
                        <span className="text-4xl mb-3">📅</span>
                        <p className="text-lg font-semibold text-slate-200 mb-1">Nincsenek események</p>
                        <p className="text-sm text-slate-500">Ebben a hónapban üres a naptárad.</p>
                    </div>
                ) : (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        {eventDates.map((dateStr) => {
                            const date = new Date(dateStr);
                            const dayEvents = groupedEvents.get(dateStr) || [];
                            const isTodayDate = isToday(date);

                            return (
                                <div key={dateStr} id={`date-${dateStr}`} className="flex gap-4 md:gap-6 group">
                                    {/* Date Column */}
                                    <div className="flex flex-col items-center w-14 md:w-16 flex-shrink-0 pt-1">
                                        <span className={cn(
                                            "text-xs font-medium uppercase",
                                            isTodayDate ? "text-indigo-400" : "text-slate-500"
                                        )}>
                                            {format(date, 'EEE', { locale: hu })}
                                        </span>
                                        <span className={cn(
                                            "text-xl md:text-2xl font-bold mt-0.5",
                                            isTodayDate ? "text-indigo-500" : "text-slate-300"
                                        )}>
                                            {format(date, 'd')}
                                        </span>
                                        {isTodayDate && (
                                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded mt-1">
                                                Ma
                                            </span>
                                        )}
                                    </div>

                                    {/* Events Column */}
                                    <div className="flex-1 space-y-3 pb-6 border-b border-slate-800/50 group-last:border-0">
                                        {dayEvents.map(event => (
                                            <button
                                                key={event.id}
                                                onClick={() => onEventClick?.(event)}
                                                className="w-full text-left"
                                            >
                                                <div className="bg-slate-900/50 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/30 rounded-lg p-3 md:p-4 transition-all hover:shadow-lg hover:scale-[1.01] group/card">
                                                    <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
                                                        {/* Time */}
                                                        <div className="flex-shrink-0 w-24">
                                                            <div className="text-sm font-mono text-indigo-300 group-hover/card:text-indigo-200 transition-colors">
                                                                {event.is_all_day ? (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-indigo-500/10 text-indigo-400">
                                                                        Egész nap
                                                                    </span>
                                                                ) : (
                                                                    <span>
                                                                        {event.start_time.split('T')[1].substring(0, 5)}
                                                                        <span className="text-slate-600 mx-1">-</span>
                                                                        {event.end_time.split('T')[1].substring(0, 5)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {/* Details */}
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-medium text-slate-200 group-hover/card:text-white truncate text-base md:text-lg">
                                                                {event.title}
                                                            </h3>
                                                            {(event.location || event.description) && (
                                                                <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 group-hover/card:text-slate-400">
                                                                    {event.location && (
                                                                        <span className="flex items-center gap-1 truncate max-w-[200px]">
                                                                            📍 {event.location}
                                                                        </span>
                                                                    )}
                                                                    {event.description && (
                                                                        <span className="truncate max-w-[300px]">
                                                                            📝 {event.description}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
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
