// features/dashboard/UpcomingFollowupsPanel.tsx
import Link from 'next/link';
import type { Task } from '@/types/tasks';
import { fetchUpcomingFollowups } from '@/lib/tasksService';

interface UpcomingFollowupsPanelProps {
  daysAhead?: number;
  assigneeEmail?: string;
}

export async function UpcomingFollowupsPanel({
  daysAhead = 7,
  assigneeEmail,
}: UpcomingFollowupsPanelProps) {
  const tasks = (await fetchUpcomingFollowups({
    daysAhead,
    assigneeEmail,
  })) as any[];

  return (
    <section
      id="followups"
      className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">
            Közelgő follow‑upok (következő {daysAhead} nap)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Azok a feladatok, amelyekhez follow‑up dátumot állítottál be, és a következő napokban esedékesek.
          </p>
        </div>
        <Link
          href="/"
          className="text-[11px] text-sky-300 hover:text-sky-200"
        >
          Ugrás a teljes listára
        </Link>
      </div>

      {tasks.length === 0 ? (
        <p className="text-xs text-slate-500">
          A következő {daysAhead} napban nincs esedékes follow‑up. Jó jel – vagy ideje újakat beírni. :)
        </p>
      ) : (
        <ul className="space-y-2 text-xs">
          {tasks.map((task: Task) => {
            const anyTask = task as any;

            return (
              <Link
                key={task.id}
                href={`/dashboard/area/${encodeURIComponent(task.area)}`}
                className="group flex flex-col rounded border border-slate-800 bg-slate-950 p-3 md:flex-row md:items-center md:justify-between hover:border-emerald-500 hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <div className="space-y-1">
                  <p className="font-medium text-slate-50 group-hover:text-emerald-300 transition-colors">
                    {task.title}
                  </p>
                  <p className="text-slate-400">
                    Terület: {task.area}
                  </p>
                  {anyTask.assignee && (
                    <p className="text-slate-400">
                      Felelős: {anyTask.assignee.name}{' '}
                      {anyTask.assignee.email
                        ? `(${anyTask.assignee.email})`
                        : ''}
                    </p>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 md:mt-0">
                  <span className="text-[11px] rounded-full border border-emerald-500 bg-emerald-500/20 px-2 py-0.5 text-emerald-200">
                    Follow‑up:{' '}
                    {task.follow_up_at
                      ? new Date(task.follow_up_at).toLocaleString('hu-HU', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Státusz: {task.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </ul>
      )}
    </section>
  );
}
