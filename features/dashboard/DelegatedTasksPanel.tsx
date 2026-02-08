// features/dashboard/DelegatedTasksPanel.tsx
import Link from 'next/link';
import type { Task } from '@/types/tasks';
import { fetchDelegatedTasks } from '@/lib/tasksService';

interface DelegatedTasksPanelProps {
  delegatorEmail?: string; // később: aktuális user
}

export async function DelegatedTasksPanel({
  delegatorEmail,
}: DelegatedTasksPanelProps) {
  const tasks = (await fetchDelegatedTasks({ delegatorEmail })) as any[];

  return (
    <section
      id="delegated"
      className="mt-8 rounded-xl border border-slate-800 bg-slate-900/60 p-4"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">
            Általad delegált feladatok
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Azok a feladatok, amelyeket másnak adtál ki, és még nincsenek lezárva.
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
          Jelenleg nincs olyan feladat, amit delegáltál volna (vagy már minden kész).
        </p>
      ) : (
        <ul className="space-y-2 text-xs">
          {tasks.map((task: Task) => {
            const anyTask = task as any;

            return (
              <Link
  key={task.id}
  href={`/dashboard/area/${encodeURIComponent(task.area)}`}
  className="group flex flex-col rounded border border-slate-800 bg-slate-950 p-3 md:flex-row md:items-center md:justify-between hover:border-sky-500 hover:bg-slate-900 transition-colors cursor-pointer"
>
  <div className="space-y-1">
    <p className="font-medium text-slate-50 group-hover:text-sky-300 transition-colors">
      {task.title}
    </p>
    <p className="text-slate-400 text-xs">
      Terület: {task.area}
    </p>
    {anyTask.assignee && (
      <p className="text-slate-400 text-xs">
        Felelős: {anyTask.assignee.name}{' '}
        {anyTask.assignee.email ? `(${anyTask.assignee.email})` : ''}
      </p>
    )}
  </div>

  <div className="mt-2 flex flex-wrap items-center gap-3 md:mt-0">
    {/* ide jön a státusz badge a fenti színezéssel */}
    <span
      className={`text-[11px] rounded-full border px-2 py-0.5 font-semibold
        ${
          task.status === 'done'
            ? 'border-emerald-500 bg-emerald-400 text-emerald-950'
            : task.status === 'in_progress'
            ? 'border-sky-500 bg-sky-400 text-sky-950'
            : 'border-amber-500 bg-amber-400 text-amber-950'
        }`}
    >
      Státusz: {task.status}
    </span>
    <span className="text-[11px] text-slate-400">
      Határidő:{' '}
      {task.due_date
        ? new Date(task.due_date).toLocaleDateString('hu-HU')
        : 'Nincs határidő'}
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
