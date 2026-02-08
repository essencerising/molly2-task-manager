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

type ViewMode = 'list' | 'calendar';

export function DashboardTasksClient({ tasks }: DashboardTasksClientProps) {
  const [currentStart, setCurrentStart] = useState(() => startOfDay(new Date()));

  const currentEnd = endOfDay(addDays(currentStart, 6));


  const tasksWithRelevantDate = tasks
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

  return (
  <div className="space-y-6">
    {/* Cím – csak naptár */}
    <div className="flex items-center justify-between">
  <div>
    <h2 className="text-lg font-semibold">
      Heti naptár nézet
    </h2>
    <p className="text-xs text-slate-400">
      {format(currentStart, 'yyyy.MM.dd.', { locale: hu })} –{' '}
      {format(currentEnd, 'yyyy.MM.dd.', { locale: hu })}
    </p>
  </div>
  <div className="flex items-center gap-2">
    <button
      type="button"
      onClick={() => setCurrentStart((prev) => addDays(prev, -7))}
      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:border-sky-500 hover:text-sky-300 transition-colors"
    >
      Előző hét
    </button>
    <button
      type="button"
      onClick={() => setCurrentStart((prev) => addDays(prev, 7))}
      className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 hover:border-sky-500 hover:text-sky-300 transition-colors"
    >
      Következő hét
    </button>
  </div>
</div>

    {/* Csak naptár */}
    <div className="grid gap-4 md:grid-cols-7">
      {days.map(({ date, tasks }) => (
        <div
          key={date.toISOString()}
          className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 flex flex-col"
        >
          <div className="text-xs font-semibold text-slate-300 mb-2">
            {format(date, 'EEE', { locale: hu })} •{' '}
            {format(date, 'MM.dd.', { locale: hu })}
          </div>
          <div className="space-y-2">
            {tasks.length === 0 ? (
              <p className="text-xs text-slate-500">Nincs feladat.</p>
            ) : (
              tasks.map((task) => (
                <Link
                  key={task.id}
                  href={`/dashboard/area/${encodeURIComponent(
                    task.area ?? ''
                  )}`}
                  className="block rounded border border-slate-700 bg-slate-900/80 px-2 py-1 hover:border-sky-500 hover:bg-slate-900 transition-colors"
                >
                  <div className="text-xs font-medium truncate">
                    {task.title}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {task.area && <span className="mr-1">{task.area}</span>}
                    {task.assigneeEmail && (
                      <span className="mr-1">• {task.assigneeEmail}</span>
                    )}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  </div>
);
}

