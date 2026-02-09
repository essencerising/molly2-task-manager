// Calendar Page
'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Calendar, TaskModal, TaskItemData } from '@/components/shared';
import { useWorkspaceStore } from '@/stores';
import { fetchTasks, updateTask, archiveTask } from '@/lib/tasksService';
import { toast } from 'sonner';

export default function CalendarPage() {
    const currentWorkspaceId = useWorkspaceStore(state => state.currentWorkspaceId);
    const [tasks, setTasks] = useState<TaskItemData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    // Load tasks
    useEffect(() => {
        async function loadTasks() {
            try {
                setLoading(true);
                const result = await fetchTasks({ limit: 500 }); // Load more for calendar view

                console.log('📅 Calendar - All tasks:', result.data?.length);
                console.log('📅 Calendar - Current workspace:', currentWorkspaceId);

                // Filter by current workspace and only tasks with due dates
                const workspaceTasks = (result.data ?? [])
                    .filter(task => {
                        const hasWorkspace = task.workspace_id === currentWorkspaceId;
                        const hasDueDate = task.dueDate != null;

                        if (!hasWorkspace) console.log('❌ Task filtered (wrong workspace):', task.title);
                        if (!hasDueDate) console.log('❌ Task filtered (no due date):', task.title);

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

                console.log('✅ Calendar - Filtered tasks:', workspaceTasks.length);
                console.log('✅ Calendar - Tasks:', workspaceTasks);

                setTasks(workspaceTasks);
            } catch (error) {
                console.error('Failed to load tasks:', error);
                toast.error('Hiba a feladatok betöltésekor');
            } finally {
                setLoading(false);
            }
        }

        if (currentWorkspaceId) {
            loadTasks();
        }
    }, [currentWorkspaceId]);

    // Handle task click
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
                });
                setIsTaskModalOpen(true);
            }
        } catch (error) {
            console.error('Failed to load task details:', error);
            toast.error('Hiba a feladat betöltésekor');
        }
    };

    const handleCloseTaskModal = () => {
        setSelectedTask(null);
        setIsTaskModalOpen(false);
    };

    const handleSaveTask = async (updatedTask: any) => {
        try {
            await updateTask({ id: updatedTask.id, ...updatedTask });

            // Refresh tasks
            const result = await fetchTasks({ limit: 500 });
            const workspaceTasks = (result.data ?? [])
                .filter(task =>
                    task.workspace_id === currentWorkspaceId &&
                    task.dueDate != null
                )
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
                <Calendar tasks={tasks} onTaskClick={handleTaskClick} />
            </div>

            {/* Task Modal */}
            <TaskModal
                task={selectedTask}
                isOpen={isTaskModalOpen}
                onClose={handleCloseTaskModal}
                onSave={handleSaveTask}
                onDelete={handleDeleteTask}
            />
        </DashboardLayout>
    );
}
