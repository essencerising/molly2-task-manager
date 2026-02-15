// Calendar Page
'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Calendar, TaskModal, TaskItemData, EventModal } from '@/components/shared';
import { useWorkspaceStore } from '@/stores';
import { fetchTasks, updateTask, archiveTask } from '@/lib/tasksService';
import { fetchEvents, createEvent, updateEvent, deleteEvent, CalendarEvent } from '@/lib/eventsService';
import { toast } from 'sonner';
import { Button } from '@/components/ui';
import { Plus } from 'lucide-react';
import { addDays, differenceInDays } from 'date-fns';

export default function CalendarPage() {
    const currentWorkspaceId = useWorkspaceStore(state => state.currentWorkspaceId);
    const [tasks, setTasks] = useState<TaskItemData[]>([]);
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [loading, setLoading] = useState(true);

    // Task Modal State
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    // Event Modal State
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [isEventModalOpen, setIsEventModalOpen] = useState(false);
    const [newEventDate, setNewEventDate] = useState<Date | null>(null);

    // Load data
    const loadData = async () => {
        if (!currentWorkspaceId) return;

        try {
            setLoading(true);

            // 1. Fetch Tasks
            const tasksResult = await fetchTasks({ limit: 500 });
            const workspaceTasks = (tasksResult.data ?? [])
                .filter(task => {
                    const hasWorkspace = task.workspace_id === currentWorkspaceId;
                    const hasDueDate = task.dueDate != null;
                    return hasWorkspace && hasDueDate;
                })
                .map((row: any) => ({
                    id: row.id,
                    title: row.title,
                    status: row.status,
                    dueDate: row.dueDate,
                    assigneeName: row.assigneeEmail?.split('@')[0],
                    projectName: row.projectName,
                    projectColor: row.projectColor,
                    workspaceName: row.workspaceName,
                    workspaceIcon: row.workspaceIcon,
                    workspaceColor: row.workspaceColor,
                }));
            setTasks(workspaceTasks);

            // 2. Fetch Events
            const eventsData = await fetchEvents(currentWorkspaceId);
            setEvents(eventsData || []);

        } catch (error) {
            console.error('Failed to load calendar data:', error);
            toast.error('Hiba az adatok betöltésekor');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [currentWorkspaceId]);

    // --- Task Handlers ---

    const handleTaskClick = async (task: TaskItemData) => {
        try {
            // Fetch full task data
            const result = await fetchTasks({ limit: 500 });
            const fullTask = result.data?.find((t: any) => t.id === task.id);

            if (fullTask) {
                setSelectedTask({
                    id: fullTask.id,
                    title: fullTask.title,
                    description: fullTask.description || '',
                    status: fullTask.status,
                    area: fullTask.area || '',
                    due_date: fullTask.dueDate || null,
                    follow_up_at: fullTask.followUpDate || null,
                    recurrence_type: fullTask.recurrenceType || 'none',
                    recurrence_interval: fullTask.recurrenceInterval || 1,
                    workspace_id: fullTask.workspace_id,
                    project_id: fullTask.project_id || null,
                    contact_id: fullTask.contact_id || null,
                });
                setIsTaskModalOpen(true);
            }
        } catch (error) {
            console.error('Failed to load task details:', error);
            toast.error('Hiba a feladat betöltésekor');
        }
    };

    const handleSaveTask = async (updatedTask: any) => {
        try {
            await updateTask({ id: updatedTask.id, ...updatedTask });
            await loadData(); // Reload all to refresh
            toast.success('Feladat frissítve');
        } catch (error) {
            console.error('Failed to save task:', error);
            toast.error('Hiba a mentés során');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            await archiveTask(taskId);
            setTasks(prev => prev.filter(t => t.id !== taskId));
            toast.success('Feladat törölve');
        } catch (error) {
            console.error('Failed to delete task:', error);
            toast.error('Hiba a törlés során');
        }
    };

    const handleTaskMove = async (taskId: string, newDate: string) => {
        // Optimistic update
        const task = tasks.find(t => t.id === taskId);
        if (!task) return;

        // Keep time part if exists, update date part
        const oldDateTime = task.dueDate || '';
        const timePart = oldDateTime.includes('T') ? oldDateTime.split('T')[1] : '09:00:00';
        const newDateTime = `${newDate}T${timePart}`;

        const updatedTask = { ...task, dueDate: newDateTime };
        setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));

        try {
            await updateTask({ id: taskId, dueDate: newDateTime });
            toast.success('Feladat átmozgatva');
        } catch (error) {
            console.error('Failed to move task:', error);
            toast.error('Hiba a mozgatás során');
            // Revert
            loadData();
        }
    };

    // --- Event Handlers ---

    const handleEventClick = (event: CalendarEvent) => {
        setSelectedEvent(event);
        setIsEventModalOpen(true);
    };

    const handleNewEvent = () => {
        setSelectedEvent(null);
        setNewEventDate(new Date());
        setIsEventModalOpen(true);
    };

    const handleSaveEvent = async (eventData: any) => {
        try {
            if (eventData.id) {
                await updateEvent(eventData);
                toast.success('Esemény frissítve');
            } else {
                await createEvent(eventData);
                toast.success('Esemény létrehozva');
            }
            await loadData();
        } catch (error) {
            console.error('Failed to save event:', error);
            toast.error('Hiba a mentés során');
            throw error; // Propagate to modal
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        try {
            await deleteEvent(eventId);
            setEvents(prev => prev.filter(e => e.id !== eventId));
            toast.success('Esemény törölve');
        } catch (error) {
            console.error('Failed to delete event:', error);
            toast.error('Hiba a törlés során');
            throw error;
        }
    };

    const handleEventMove = async (eventId: string, newDate: string) => {
        const event = events.find(e => e.id === eventId);
        if (!event) return;

        // Calculate duration and preserve it
        const start = new Date(event.start_time);
        const end = new Date(event.end_time);
        const durationMs = end.getTime() - start.getTime();

        // New start time
        const timePart = event.start_time.split('T')[1];
        const newStartStr = `${newDate}T${timePart}`;
        const newStart = new Date(newStartStr);

        // New end time
        const newEnd = new Date(newStart.getTime() + durationMs);

        // Optimistic update
        const updatedEvent = {
            ...event,
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString()
        };
        setEvents(prev => prev.map(e => e.id === eventId ? updatedEvent : e));

        try {
            await updateEvent({
                id: eventId,
                startTime: newStart.toISOString(),
                endTime: newEnd.toISOString()
            });
            toast.success('Esemény átmozgatva');
        } catch (error) {
            console.error('Failed to move event:', error);
            toast.error('Hiba a mozgatás során');
            loadData();
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <div className="text-slate-400">Betöltés...</div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="h-full flex flex-col p-6">
                <div className="flex justify-end mb-4">
                    <Button onClick={handleNewEvent} className="gap-2">
                        <Plus size={16} />
                        Új esemény
                    </Button>
                </div>

                <Calendar
                    tasks={tasks}
                    events={events}
                    onTaskClick={handleTaskClick}
                    onEventClick={handleEventClick}
                    onTaskMove={handleTaskMove}
                    onEventMove={handleEventMove}
                />
            </div>

            {/* Task Modal */}
            <TaskModal
                task={selectedTask}
                isOpen={isTaskModalOpen}
                onClose={() => { setSelectedTask(null); setIsTaskModalOpen(false); }}
                onSave={handleSaveTask}
                onDelete={handleDeleteTask}
            />

            {/* Event Modal */}
            <EventModal
                event={selectedEvent}
                isOpen={isEventModalOpen}
                onClose={() => { setSelectedEvent(null); setIsEventModalOpen(false); }}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                initialDate={newEventDate}
            />
        </DashboardLayout>
    );
}
