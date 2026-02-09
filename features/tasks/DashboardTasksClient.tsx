'use client';

import { useState } from 'react';
import { format, isSameDay, isWithinInterval, addDays, startOfDay, endOfDay } from 'date-fns';
import { hu } from 'date-fns/locale/hu';
import Link from 'next/link';


type Task = {
  id: string;
  title: string;
  status: string;
  assigneeEmail?: string;
  dueDate?: string | null;
  followUpDate?: string | null;
  area?: string | null;
};

interface DashboardTasksClientProps {
  tasks: Task[];
}

const VIEW_MODES = [
  { id: 'list', label: 'Lista' },
  { id: 'calendar', label: 'Naptár' },
  { id: 'kanban', label: 'Kanban' },
] as const;

type ViewMode = typeof VIEW_MODES[number]['id'];

export function DashboardTasksClient({ tasks }: DashboardTasksClientProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Default: lista
  const [currentStart, setCurrentStart] = useState(() => startOfDay(new Date()));

  // ------------------
  // Helper functions
  // ------------------
  // Filter logic
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | 'delegated' | 'upcoming'>('all');

  const getFilteredTasks = () => {
    let filtered = tasks;

    // 1. Filter by category
    if (activeFilter === 'today') {
      filtered = filtered.filter(t => {
        if (!t.dueDate) return false;
        return isSameDay(new Date(t.dueDate), new Date());
      });
    } else if (activeFilter === 'delegated') {
      filtered = filtered.filter(t => !!t.assigneeEmail); // TODO: check if it matches current user's delegated
    } else if (activeFilter === 'upcoming') {
      const nextWeek = addDays(new Date(), 7);
      filtered = filtered.filter(t => {
        const d = t.dueDate ? new Date(t.dueDate) : null;
        return d && d > new Date() && d <= nextWeek;
      });
    }

    return filtered;
  };

  const filteredTasks = getFilteredTasks();

  // Stats for KPI cards
  const stats = {
    today: tasks.filter(t => t.dueDate && isSameDay(new Date(t.dueDate), new Date())).length,
    delegated: tasks.filter(t => !!t.assigneeEmail).length,
    upcoming: tasks.filter(t => {
      const d = t.dueDate ? new Date(t.dueDate) : null;
      return d && d > new Date() && d <= addDays(new Date(), 7);
    }).length
  };

  // Re-calculate tasks for views based on FILTERED tasks
  const tasksForView = filteredTasks;

  // ... (Calendar logic using tasksForView instead of tasks)
  const currentEnd = endOfDay(addDays(currentStart, 6));

  const tasksWithRelevantDate = tasksForView
    .map((task) => {
      const due = task.dueDate ? new Date(task.dueDate) : null;
      const follow = task.followUpDate ? new Date(task.followUpDate) : null;

      let mainDate: Date | null = null;
      if (due && follow) {
        mainDate = due < follow ? due : follow;
      } else if (due) {
        mainDate = due;
      } else if (follow) {
        mainDate = follow;
      }

      return { ...task, mainDate };
    })
    .filter((t) => t.mainDate);

  const upcomingTasks = tasksWithRelevantDate.filter((t) =>
    isWithinInterval(t.mainDate!, { start: currentStart, end: currentEnd })
  );

  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = addDays(currentStart, index);
    const dayTasks = upcomingTasks.filter((task) =>
      isSameDay(task.mainDate!, date)
    );
    return { date, tasks: dayTasks };
  });

  // Kanban logic
  const kanbanColumns = [
    { id: 'todo', label: 'Teendő', color: 'border-slate-600' },
    { id: 'in_progress', label: 'Folyamatban', color: 'border-sky-500' },
    { id: 'done', label: 'Kész', color: 'border-emerald-500' },
  ];

  const getTasksByStatus = (status: string) => {
    return tasksForView.filter((t) => t.status === status);
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards (Filters) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => setActiveFilter('all')}
          className={`p-4 rounded-xl border text-left transition-all ${activeFilter === 'all'
            ? 'bg-slate-800 border-sky-500 shadow-lg shadow-sky-900/20'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
        >
          <div className="text-slate-400 text-sm mb-1">Összes feladat</div>
          <div className="text-2xl font-bold text-slate-100">{tasks.length}</div>
        </button>

        <button
          onClick={() => setActiveFilter('today')}
          className={`p-4 rounded-xl border text-left transition-all ${activeFilter === 'today'
            ? 'bg-slate-800 border-sky-500 shadow-lg shadow-sky-900/20'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
        >
          <div className="text-slate-400 text-sm mb-1">Mai teendők</div>
          <div className="text-2xl font-bold text-emerald-400">{stats.today}</div>
        </button>

        <button
          onClick={() => setActiveFilter('delegated')}
          className={`p-4 rounded-xl border text-left transition-all ${activeFilter === 'delegated'
            ? 'bg-slate-800 border-sky-500 shadow-lg shadow-sky-900/20'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
        >
          <div className="text-slate-400 text-sm mb-1">Delegálva</div>
          <div className="text-2xl font-bold text-amber-400">{stats.delegated}</div>
        </button>

        <button
          onClick={() => setActiveFilter('upcoming')}
          className={`p-4 rounded-xl border text-left transition-all ${activeFilter === 'upcoming'
            ? 'bg-slate-800 border-sky-500 shadow-lg shadow-sky-900/20'
            : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
            }`}
        >
          <div className="text-slate-400 text-sm mb-1">Közelgő (7 nap)</div>
          <div className="text-2xl font-bold text-purple-400">{stats.upcoming}</div>
        </button>
      </div>

      {/* Nézetváltó - Modernized UI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800 backdrop-blur-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Feladat áttekintés</h2>
          <p className="text-sm text-slate-400">Válassz nézetet a feladatok kezeléséhez</p>
        </div>

        <div className="flex bg-slate-950 p-1.5 rounded-lg border border-slate-800 shadow-sm">
          {VIEW_MODES.map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${viewMode === mode.id
                ? 'bg-sky-600 text-white shadow-md transform scale-105'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* ------------------ CALENDAR VIEW ------------------ */}
      {viewMode === 'calendar' && (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-slate-400">
              {format(currentStart, 'yyyy.MM.dd.', { locale: hu })} –{' '}
              {format(currentEnd, 'yyyy.MM.dd.', { locale: hu })}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStart((prev) => addDays(prev, -7))}
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:border-sky-500 transition-colors"
              >
                Előző hét
              </button>
              <button
                type="button"
                onClick={() => setCurrentStart((prev) => addDays(prev, 7))}
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:border-sky-500 transition-colors"
              >
                Következő hét
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-7">
            {days.map(({ date, tasks }) => (
              <div
                key={date.toISOString()}
                className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex flex-col min-h-[150px]"
              >
                <div className="text-xs font-semibold text-slate-300 mb-2 border-b border-slate-800 pb-1">
                  {format(date, 'EEE', { locale: hu })} •{' '}
                  {format(date, 'MM.dd.', { locale: hu })}
                </div>
                <div className="space-y-2 flex-1">
                  {tasks.length === 0 ? (
                    <p className="text-xs text-slate-600 italic">Üres</p>
                  ) : (
                    tasks.map((task) => (
                      <TaskItem key={task.id} task={task} />
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ------------------ KANBAN VIEW ------------------ */}
      {viewMode === 'kanban' && (
        <div className="grid gap-6 md:grid-cols-3 h-[600px] overflow-x-auto">
          {kanbanColumns.map((col) => (
            <div
              key={col.id}
              className={`rounded-xl border-t-4 bg-slate-900/50 p-4 flex flex-col ${col.color}`}
            >
              <h3 className="font-semibold text-slate-200 mb-4 flex items-center justify-between">
                {col.label}
                <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full text-slate-400">
                  {getTasksByStatus(col.id).length}
                </span>
              </h3>

              <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {getTasksByStatus(col.id).map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ------------------ LIST VIEW ------------------ */}
      {viewMode === 'list' && (
        <div className="space-y-2">
          {tasksForView.map((task) => (
            <Link
              key={task.id}
              href={`/dashboard/area/${encodeURIComponent(task.area ?? '')}`}
              className="flex items-center justify-between p-4 rounded-lg border border-slate-800 bg-slate-900/60 hover:border-sky-500/50 transition-all group"
            >
              <div>
                <h4 className="font-medium text-slate-200 group-hover:text-sky-400 transition-colors">
                  {task.title}
                </h4>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span className={`px-2 py-0.5 rounded-full ${task.status === 'done' ? 'bg-emerald-950 text-emerald-400' :
                    task.status === 'in_progress' ? 'bg-sky-950 text-sky-400' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                    {task.status === 'todo' ? 'Teendő' :
                      task.status === 'in_progress' ? 'Folyamatban' : 'Kész'}
                  </span>
                  <span>{task.area}</span>
                  {task.dueDate && <span>Határidő: {format(new Date(task.dueDate), 'yyyy.MM.dd.', { locale: hu })}</span>}
                </div>
              </div>
              <div className="text-slate-500 group-hover:text-slate-300">
                →
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Külön komponens a kártyának, hogy ne ismételjük a kódot
function TaskItem({ task }: { task: Task }) {
  return (
    <Link
      href={`/dashboard/area/${encodeURIComponent(task.area ?? '')}`}
      className="block rounded border border-slate-700 bg-slate-800/50 px-3 py-2 hover:border-sky-500 hover:bg-slate-800 transition-all shadow-sm"
    >
      <div className="text-sm font-medium text-slate-200 truncate mb-1">
        {task.title}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-slate-400">
        <span className="bg-slate-900/50 px-1.5 py-0.5 rounded">
          {task.area}
        </span>
        {task.assigneeEmail && (
          <span className="truncate max-w-[100px]">{task.assigneeEmail}</span>
        )}
      </div>
    </Link>
  );
}
