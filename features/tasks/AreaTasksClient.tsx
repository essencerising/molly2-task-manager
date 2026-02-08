// features/tasks/AreaTasksClient.tsx
'use client';

import { useState } from 'react';
import type { Task } from '@/types/tasks';
import { TaskCard } from './TaskCard';

interface AreaTasksClientProps {
  area: string;
  tasks: Task[];
}

export function AreaTasksClient({ area, tasks }: AreaTasksClientProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const handleSelectTask = (task: Task) => {
    setSelectedTask(task);
  };

  const handleUpdatedTask = (updated: Task) => {
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === updated.id ? (updated as any) : t)),
    );
    setSelectedTask(updated);
  };

  return (
    <div className="space-y-4">
      {/* Nézetváltó: Lista / Naptár */}
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-400">
          Nézet: {view === 'list' ? 'Lista' : 'Naptár (következő 7 nap)'}
        </p>
        <div className="inline-flex rounded border border-slate-700 bg-slate-900 text-[11px]">
          <button
            type="button"
            onClick={() => setView('list')}
            className={`px-2 py-1 rounded-l ${
              view === 'list'
                ? 'bg-slate-800 text-sky-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Lista
          </button>
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={`px-2 py-1 rounded-r border-l border-slate-700 ${
              view === 'calendar'
                ? 'bg-slate-800 text-sky-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Naptár
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <>
          <ul className="space-y-2">
            {localTasks.length === 0 ? (
              <p className="text-sm text-slate-500">
                Ehhez az area‑hoz még nincs egyetlen feladat sem.
              </p>
            ) : (
              localTasks.map((task) => {
                const anyTask = task as any;

                return (
                  <li
                    key={task.id}
                    className="flex flex-col gap-1 rounded border border-slate-800 bg-slate-950 p-3 text-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <button
                        type="button"
                        onClick={() => handleSelectTask(task)}
                        className="font-medium text-left hover:text-sky-300"
                      >
                        {task.title}
                      </button>

                      <p className="text-xs text-slate-400">
                        Terület: {task.area}
                      </p>

                      {anyTask.assignee && (
                        <p className="text-xs text-slate-400">
                          Felelős: {anyTask.assignee.name}{' '}
                          {anyTask.assignee.email
                            ? `(${anyTask.assignee.email})`
                            : ''}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span>Státusz: {task.status}</span>
                      <span>
                        {task.due_date
                          ? `Határidő: ${new Date(
                              task.due_date,
                            ).toLocaleDateString('hu-HU')}`
                          : 'Nincs határidő'}
                      </span>
                    </div>
                  </li>
                );
              })
            )}
          </ul>

          {/* Részletek panel – TaskCard újrahasznosítva */}
          {selectedTask && (
            <TaskCard
              task={selectedTask}
              onClose={() => setSelectedTask(null)}
              onUpdated={handleUpdatedTask}
            />
          )}
        </>
      ) : (
        <AreaTasksCalendar tasks={localTasks} />
      )}
    </div>
  );
}

interface AreaTasksCalendarProps {
  tasks: Task[];
}

function AreaTasksCalendar({ tasks }: AreaTasksCalendarProps) {
  const today = new Date();

  // következő 7 nap
  const days = Array.from({ length: 7 }).map((_, index) => {
    const date = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + index,
    );
    return date;
  });

  const tasksByDay = days.map((day) => {
    const dayStart = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      0,
      0,
      0,
      0,
    );
    const dayEnd = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      23,
      59,
      59,
      999,
    );

    const inDay = tasks.filter((task) => {
      const matchesDue =
        task.due_date &&
        new Date(task.due_date) >= dayStart &&
        new Date(task.due_date) <= dayEnd;

      const matchesFollowUp =
        task.follow_up_at &&
        new Date(task.follow_up_at) >= dayStart &&
        new Date(task.follow_up_at) <= dayEnd;

      return matchesDue || matchesFollowUp;
    });

    return {
      date: day,
      tasks: inDay,
    };
  });

  return (
    <div className="mt-2 grid gap-3 md:grid-cols-7">
      {tasksByDay.map(({ date, tasks }) => {
        const dateLabel = date.toLocaleDateString('hu-HU', {
          month: '2-digit',
          day: '2-digit',
        });
        const weekday = date.toLocaleDateString('hu-HU', {
          weekday: 'short',
        });

        return (
          <div
            key={date.toISOString()}
            className="flex flex-col rounded border border-slate-800 bg-slate-950 p-2 text-[11px]"
          >
            <div className="mb-2 flex items-baseline justify-between">
              <div>
                <p className="font-semibold text-slate-100">{weekday}</p>
                <p className="text-slate-400">{dateLabel}</p>
              </div>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                {tasks.length} db
              </span>
            </div>

            {tasks.length === 0 ? (
              <p className="mt-2 text-[10px] text-slate-600">
                Nincs feladat.
              </p>
            ) : (
              <ul className="space-y-1">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className="rounded border border-slate-800 bg-slate-900 px-2 py-1"
                  >
                    <p className="font-medium text-[11px] text-slate-50">
                      {task.title}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {task.due_date && (
                        <>
                          Határidő:{' '}
                          {new Date(task.due_date).toLocaleTimeString(
                            'hu-HU',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </>
                      )}
                      {task.follow_up_at && (
                        <>
                          {task.due_date && ' • '}
                          Follow‑up:{' '}
                          {new Date(task.follow_up_at).toLocaleTimeString(
                            'hu-HU',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            },
                          )}
                        </>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Státusz: {task.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
