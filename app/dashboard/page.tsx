// New Dashboard Page - v3
'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { FocusCard, TaskItem, TaskItemData, TaskModal, NoTasksEmptyState, KanbanBoard } from '@/components/shared';
import { Button, Badge } from '@/components/ui';
import { useUIStore, useWorkspaceStore } from '@/stores';
import { updateTask, archiveTask, updateTaskStatus, createTask } from '@/lib/tasksService';
import {
  CalendarDays,
  Clock,
  AlertTriangle,
  LayoutGrid,
  List,
  Calendar,
  Plus,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchTasks } from '@/lib/tasksService';
import { isSameDay, addDays, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';
import { hu } from 'date-fns/locale/hu';

type ViewMode = 'list' | 'kanban' | 'calendar';
type FilterType = 'all' | 'today' | 'followup' | 'overdue';

export default function DashboardPage() {
  const { dashboardViewMode, setDashboardViewMode, isNewTaskModalOpen, closeNewTaskModal } = useUIStore();
  const currentWorkspaceId = useWorkspaceStore(state => state.currentWorkspaceId);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [tasks, setTasks] = useState<TaskItemData[]>([]);
  const [loading, setLoading] = useState(true);

  // Task Modal state
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleOpenTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setIsTaskModalOpen(true);
    }
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
    setIsTaskModalOpen(false);
  };

  const handleNewTask = () => {
    // Create empty task template
    setSelectedTask({
      id: '', // Empty ID indicates new task
      title: '',
      description: '',
      status: 'todo',
      area: '',
      due_date: null,
      workspace_id: currentWorkspaceId, // ÚJ - Aktuális workspace
    });
    setIsTaskModalOpen(true);
  };

  // Sync with global new task modal state (from Sidebar)
  useEffect(() => {
    if (isNewTaskModalOpen) {
      handleNewTask();
      closeNewTaskModal();
    }
  }, [isNewTaskModalOpen, closeNewTaskModal]);

  const handleSaveTask = async (updatedTask: any) => {
    try {
      if (!updatedTask.id) {
        // New task - create it
        await createTask({
          title: updatedTask.title,
          area: updatedTask.area || 'Magánélet',
          description: updatedTask.description,
          dueDate: updatedTask.due_date,
          workspaceId: updatedTask.workspace_id,
          projectId: updatedTask.project_id,
        });

        // Refresh task list instead of full page reload
        const result = await fetchTasks({ limit: 100 });
        const normalized: TaskItemData[] = (result.data ?? []).map((row: any) => ({
          id: row.id,
          title: row.title,
          status: row.status,
          dueDate: row.dueDate,
          assigneeName: row.assigneeEmail?.split('@')[0],
          projectName: row.projectName,
          projectColor: row.projectColor,
          workspaceName: row.workspaceName,
          workspaceIcon: row.workspaceIcon,
          workspaceColor: row.workspaceColor, // ÚJ - workspace színek
        }));
        setTasks(normalized);

      } else {
        // Existing task - update it
        await updateTask({ id: updatedTask.id, ...updatedTask });
        setTasks(prev => prev.map(t => t.id === updatedTask.id ? { ...t, ...updatedTask } : t));
      }
    } catch (err) {
      console.error('Failed to save task:', err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await archiveTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  // Handle task move (Kanban drag & drop)
  const handleTaskMove = async (taskId: string, newStatus: string) => {
    try {
      // Optimistic update
      setTasks(prev => prev.map(t =>
        t.id === taskId ? { ...t, status: newStatus as TaskItemData['status'] } : t
      ));
      // Persist to database
      await updateTaskStatus(taskId, newStatus as 'todo' | 'in_progress' | 'done');
    } catch (err) {
      console.error('Failed to move task:', err);
    }
  };

  // Fetch tasks
  useEffect(() => {
    async function loadTasks() {
      try {
        const result = await fetchTasks({ limit: 100 });
        const normalized: TaskItemData[] = (result.data ?? []).map((row: any) => ({
          id: row.id,
          title: row.title,
          status: row.status,
          dueDate: row.dueDate,
          assigneeName: row.assigneeEmail?.split('@')[0],
          projectName: row.projectName,
          projectColor: row.projectColor,
          workspaceName: row.workspaceName,
          workspaceIcon: row.workspaceIcon,
          workspaceColor: row.workspaceColor, // ÚJ - workspace színek
        }));
        setTasks(normalized);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        setLoading(false);
      }
    }
    loadTasks();
  }, []);

  // Calculate stats
  const today = new Date();
  const stats = {
    today: tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), today)).length,
    followup: tasks.filter(t => t.status !== 'done' && t.dueDate).length, // Placeholder
    overdue: tasks.filter(t => {
      if (!t.dueDate || t.status === 'done') return false;
      return new Date(t.dueDate) < startOfDay(today);
    }).length,
    total: tasks.length,
  };

  // Filter tasks
  const getFilteredTasks = () => {
    switch (activeFilter) {
      case 'today':
        return tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), today));
      case 'followup':
        return tasks.filter(t => t.status !== 'done' && t.dueDate);
      case 'overdue':
        return tasks.filter(t => {
          if (!t.dueDate || t.status === 'done') return false;
          return new Date(t.dueDate) < startOfDay(today);
        });
      default:
        return tasks;
    }
  };

  const filteredTasks = getFilteredTasks();

  // Kanban columns
  const kanbanColumns = [
    { id: 'todo', label: 'Teendő', color: 'border-slate-600' },
    { id: 'in_progress', label: 'Folyamatban', color: 'border-sky-500' },
    { id: 'done', label: 'Kész', color: 'border-emerald-500' },
  ];

  const getTasksByStatus = (status: string) => {
    return filteredTasks.filter(t => t.status === status);
  };

  // Calendar view - get days
  const [calendarStart, setCalendarStart] = useState(() => startOfDay(new Date()));
  const calendarDays = Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(calendarStart, i);
    const dayTasks = filteredTasks.filter(t =>
      t.dueDate && isSameDay(new Date(t.dueDate), date)
    );
    return { date, tasks: dayTasks };
  });

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={format(today, "yyyy. MMMM d., EEEE", { locale: hu })}
    >
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Focus Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FocusCard
            title="Mai feladatok"
            count={stats.today}
            icon={CalendarDays}
            color="indigo"
            isActive={activeFilter === 'today'}
            onClick={() => setActiveFilter(activeFilter === 'today' ? 'all' : 'today')}
          />
          <FocusCard
            title="Follow-up"
            count={stats.followup}
            icon={Clock}
            color="amber"
            isActive={activeFilter === 'followup'}
            onClick={() => setActiveFilter(activeFilter === 'followup' ? 'all' : 'followup')}
          />
          <FocusCard
            title="Késésben"
            count={stats.overdue}
            icon={AlertTriangle}
            color="red"
            isActive={activeFilter === 'overdue'}
            onClick={() => setActiveFilter(activeFilter === 'overdue' ? 'all' : 'overdue')}
          />
        </section>

        {/* View Controls */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-100">Feladatok</h2>
            <Badge variant="outline">{filteredTasks.length}</Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* View mode switcher */}
            <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
              {[
                { id: 'list' as ViewMode, icon: List, label: 'Lista' },
                { id: 'kanban' as ViewMode, icon: LayoutGrid, label: 'Kanban' },
                { id: 'calendar' as ViewMode, icon: Calendar, label: 'Naptár' },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setDashboardViewMode(mode.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2',
                    dashboardViewMode === mode.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  )}
                >
                  <mode.icon size={16} />
                  <span className="hidden sm:inline">{mode.label}</span>
                </button>
              ))}
            </div>

            <Button variant="primary" onClick={handleNewTask}>
              <Plus size={16} />
              <span className="hidden sm:inline">Új feladat</span>
            </Button>
          </div>
        </section>

        {/* Task Views */}
        <section>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-slate-900/60 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* List View */}
              {dashboardViewMode === 'list' && (
                <div className="space-y-3">
                  {filteredTasks.length === 0 ? (
                    <NoTasksEmptyState onAddTask={() => setIsTaskModalOpen(true)} />
                  ) : (
                    filteredTasks.map(task => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onClick={() => handleOpenTask(task.id)}
                      />
                    ))
                  )}
                </div>
              )}

              {/* Kanban View */}
              {dashboardViewMode === 'kanban' && (
                <KanbanBoard
                  tasks={filteredTasks}
                  onTaskClick={handleOpenTask}
                  onTaskMove={handleTaskMove}
                />
              )}

              {/* Calendar View */}
              {dashboardViewMode === 'calendar' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-400">
                      {format(calendarStart, 'yyyy. MMMM', { locale: hu })}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setCalendarStart(d => addDays(d, -7))}>
                        ← Előző hét
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setCalendarStart(d => addDays(d, 7))}>
                        Következő hét →
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-7">
                    {calendarDays.map(({ date, tasks }) => (
                      <div
                        key={date.toISOString()}
                        className={cn(
                          'rounded-xl border border-slate-800 bg-slate-900/60 p-3 min-h-[150px]',
                          isSameDay(date, today) && 'border-indigo-500 bg-indigo-500/5'
                        )}
                      >
                        <div className="text-xs font-semibold text-slate-300 mb-2 pb-1 border-b border-slate-800">
                          {format(date, 'EEE', { locale: hu })} • {format(date, 'd.', { locale: hu })}
                        </div>
                        <div className="space-y-2">
                          {tasks.length === 0 ? (
                            <p className="text-xs text-slate-600 italic">Üres</p>
                          ) : (
                            tasks.map(task => (
                              <TaskItem
                                key={task.id}
                                task={task}
                                compact
                                onClick={() => handleOpenTask(task.id)}
                              />
                            ))
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>
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
