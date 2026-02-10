'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore, useWorkspaceStore } from '@/stores';
import { deleteProject } from '@/lib/workspaceService';
import { fetchTasks, archiveTask } from '@/lib/tasksService';
import { Button } from '@/components/ui';
import { CreateProjectModal, TaskItem, TaskItemData, TaskModal } from '@/components/shared';
import { Trash2, Edit, ArrowLeft, MoreVertical, CheckCircle2, Circle, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id } = use(params);

    const router = useRouter();
    const { projects, removeProject, initialize, isInitialized } = useWorkspaceStore();
    const { openProjectModal } = useUIStore();

    const [tasks, setTasks] = useState<TaskItemData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    useEffect(() => {
        if (!isInitialized) initialize();
    }, [isInitialized, initialize]);

    // Find project from store
    const project = projects.find(p => p.id === id);

    // Load project tasks
    useEffect(() => {
        async function loadProjectTasks() {
            if (!project) return;

            try {
                setLoading(true);
                const result = await fetchTasks({ limit: 100 });

                // Filter tasks by project_id
                const projectTasks = (result.data ?? [])
                    .filter((row: any) => row.project_id === project.id)
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

                setTasks(projectTasks);
            } catch (error) {
                console.error('Failed to load project tasks:', error);
                toast.error('Hiba a feladatok betöltésekor');
            } finally {
                setLoading(false);
            }
        }

        loadProjectTasks();
    }, [project]);

    const handleDelete = async () => {
        if (!project) return;
        if (!confirm('Biztosan törölni szeretnéd ezt a projektet? A művelet nem visszavonható.')) return;

        try {
            await deleteProject(project.id);
            removeProject(project.id);
            toast.success('Projekt törölve');
            router.push('/dashboard');
        } catch (error) {
            console.error('Delete project error:', error);
            toast.error('Hiba a projekt törlésekor');
        }
    };

    const handleTaskClick = async (task: TaskItemData) => {
        try {
            // Fetch full task data from database
            const result = await fetchTasks({ limit: 100 });
            const fullTask = result.data?.find((t: any) => t.id === task.id);

            if (fullTask) {
                // Convert to the format TaskModal expects
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
            } else {
                toast.error('Feladat nem található');
            }
        } catch (error) {
            console.error('Failed to load task details:', error);
            toast.error('Hiba a feladat betöltésekor');
        }
    };

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p>A projekt nem található vagy törölve lett.</p>
                <Button variant="ghost" className="mt-4" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Vissza a Dashboardra
                </Button>
            </div>
        );
    }

    // Calculate statistics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'done').length;
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
    const todoTasks = tasks.filter(t => t.status === 'todo').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-4 md:p-6 space-y-4 md:space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 md:gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard/projects')}
                        className="text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1 md:mr-2" />
                        <span className="hidden sm:inline">Vissza</span>
                    </Button>
                    <div
                        className="w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                        style={{ backgroundColor: project.color || '#6366F1' }}
                    >
                        <span className="text-base md:text-xl font-bold text-white uppercase">
                            {project.name.substring(0, 2)}
                        </span>
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-2xl font-bold truncate">{project.name}</h1>
                        {project.description && (
                            <p className="text-slate-400 text-xs md:text-sm mt-1 line-clamp-1">{project.description}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                        <Trash2 className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Törlés</span>
                    </Button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-3 md:p-4">
                    <div className="flex items-center gap-2 text-slate-400 text-xs md:text-sm mb-1">
                        <Circle className="h-3 w-3 md:h-4 md:w-4" />
                        <span>Összes</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">{totalTasks}</div>
                </div>
                <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-3 md:p-4">
                    <div className="flex items-center gap-2 text-amber-400 text-xs md:text-sm mb-1">
                        <Clock className="h-3 w-3 md:h-4 md:w-4" />
                        <span>Folyamatban</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">{inProgressTasks}</div>
                </div>
                <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-3 md:p-4">
                    <div className="flex items-center gap-2 text-green-400 text-xs md:text-sm mb-1">
                        <CheckCircle2 className="h-3 w-3 md:h-4 md:w-4" />
                        <span>Kész</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">{completedTasks}</div>
                </div>
                <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-3 md:p-4">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs md:text-sm mb-1">
                        <span>Készültség</span>
                    </div>
                    <div className="text-xl md:text-2xl font-bold">{completionRate}%</div>
                </div>
            </div>

            {/* Tasks List */}
            <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-800 p-6 overflow-auto">
                <h2 className="text-lg font-semibold mb-4">Feladatok</h2>

                {loading ? (
                    <div className="flex items-center justify-center h-32 text-slate-500">
                        <p>Betöltés...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-slate-500">
                        <p>Még nincs feladat ebben a projektben.</p>
                        <p className="text-sm mt-2">Hozz létre egy új feladatot a Dashboard-on!</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {tasks.map(task => (
                            <TaskItem
                                key={task.id}
                                task={task}
                                onClick={() => handleTaskClick(task)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Task Modal */}
            {selectedTask && (
                <TaskModal
                    task={selectedTask}
                    isOpen={isTaskModalOpen}
                    onClose={() => {
                        setIsTaskModalOpen(false);
                        setSelectedTask(null);
                    }}
                    onSave={async (updatedTask) => {
                        // Refresh tasks after save
                        const result = await fetchTasks({ limit: 100 });
                        const projectTasks = (result.data ?? [])
                            .filter((row: any) => row.project_id === project.id)
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
                        setTasks(projectTasks);
                        setIsTaskModalOpen(false);
                        setSelectedTask(null);
                    }}
                    onDelete={async (taskId) => {
                        try {
                            await archiveTask(taskId);
                            setTasks(prev => prev.filter(t => t.id !== taskId));
                            setIsTaskModalOpen(false);
                            setSelectedTask(null);
                            toast.success('Feladat archiválva');
                        } catch (error) {
                            console.error('Failed to archive task:', error);
                            toast.error('Hiba törlés közben');
                        }
                    }}
                />
            )}
        </div>
    );
}
