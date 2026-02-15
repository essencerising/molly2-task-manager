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
import { fetchPeople, Person } from '@/lib/peopleService';
import { isSameDay, addDays, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';
import { hu } from 'date-fns/locale/hu';
import { toast } from 'sonner';

type ViewMode = 'list' | 'kanban';
type FilterType = 'all' | 'today' | 'followup' | 'overdue';

export default function DashboardPage() {
  const { dashboardViewMode, setDashboardViewMode, isNewTaskModalOpen, closeNewTaskModal } = useUIStore();
  const currentWorkspaceId = useWorkspaceStore(state => state.currentWorkspaceId);

  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [people, setPeople] = useState<Person[]>([]);
  const [tasks, setTasks] = useState<TaskItemData[]>([]);
  const [loading, setLoading] = useState(true);

  // Load people
  useEffect(() => {
    if (currentWorkspaceId) {
      fetchPeople(currentWorkspaceId).then(setPeople);
    }
  }, [currentWorkspaceId]);

  // Task Modal state
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const handleOpenTask = async (taskId: string) => {
    try {
      // Fetch full task data from database
      const result = await fetchTasks({ limit: 100 });
      const fullTask = result.data?.find((t: any) => t.id === taskId);

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
          contact_id: fullTask.contact_id || null,
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
      workspace_id: currentWorkspaceId,
      project_id: null,
      contact_id: null,
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
          followUpDate: updatedTask.follow_up_at,
          recurrenceType: updatedTask.recurrence_type,
          recurrenceInterval: updatedTask.recurrence_interval,
          workspaceId: updatedTask.workspace_id,
          projectId: updatedTask.project_id,
          contactId: updatedTask.contact_id,
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

  // Greeting based on time of day
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Jó reggelt' : hour < 18 ? 'Szép napot' : 'Jó estét';
  const todayTasks = tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), today));
  const doneTodayCount = todayTasks.filter(t => t.status === 'done').length;

  return (
    <DashboardLayout
      title="Dashboard"
      subtitle={format(today, "yyyy. MMMM d., EEEE", { locale: hu })}
    >
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Welcome Section */}
        <section className="bg-gradient-to-r from-indigo-600/10 via-slate-900/50 to-slate-900/50 rounded-xl border border-indigo-500/20 p-4 md:p-6">
          <h2 className="text-lg md:text-xl font-bold text-slate-100 mb-1">
            {greeting}! 👋
          </h2>
          <p className="text-sm text-slate-400">
            {stats.overdue > 0 && (
              <span className="text-red-400 font-medium">⚠️ {stats.overdue} lejárt feladatod van. </span>
            )}
            {stats.today > 0 ? (
              <>Ma <span className="text-indigo-300 font-medium">{stats.today}</span> feladatod van{doneTodayCount > 0 && <>, ebből <span className="text-emerald-400 font-medium">{doneTodayCount} kész</span></>}.</>
            ) : (
              <span className="text-emerald-400">Nincs mai feladatod – pihenj vagy tervezz előre! 🎉</span>
            )}
          </p>
        </section>

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
            {/* Assignee Filter */}
            <select
              className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
            >
              <option value="all">Mindenki</option>
              {people.map(person => (
                <option key={person.id} value={person.id}>{person.name}</option>
              ))}
            </select>

            {/* View mode switcher */}
            <div className="flex items-center gap-2">
              {[
                { id: 'list' as ViewMode, icon: List, label: 'Lista' },
                { id: 'kanban' as ViewMode, icon: LayoutGrid, label: 'Kanban' },
              ].map((mode) => (
                <Button
                  key={mode.id}
                  onClick={() => setDashboardViewMode(mode.id)}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    dashboardViewMode === mode.id
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  )}
                >
                  <mode.icon className="h-4 w-4 mr-2" />
                  {mode.label}
                </Button>
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
