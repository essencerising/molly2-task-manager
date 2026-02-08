// features/tasks/TaskList.tsx
import type { Task } from '@/types/tasks';

interface TaskListProps {
  tasks: Task[];
  onToggleStatus: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  onArchiveTask: (task: Task) => void;
}

const getStatusClasses = (status: Task['status']) => {
  if (status === 'todo') {
    return 'border-yellow-500 text-yellow-300';
  }
  if (status === 'in_progress') {
    return 'border-sky-500 text-sky-300';
  }
  return 'border-emerald-500 text-emerald-300';
};

export function TaskList({
  tasks,
  onToggleStatus,
  onSelectTask,
  onArchiveTask,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        Nincs feladat a kiválasztott szűrővel.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => {
        const anyTask = task as any;

        return (
          <li
            key={task.id}
            className="flex flex-col gap-1 rounded border border-slate-800 bg-slate-950 p-3 text-sm md:flex-row md:items-center md:justify-between"
          >
            <div>
              <button
                type="button"
                onClick={() => onSelectTask(task)}
                className="font-medium text-left hover:text-sky-300"
              >
                {task.title}
              </button>

              <p className="text-xs text-slate-400">
                Terület: {task.area}
              </p>

              {task.assignee_email && (
  <p className="text-xs text-slate-400">
    Felelős: {task.assignee_email}
  </p>
)}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <button
                type="button"
                onClick={() => onToggleStatus(task)}
                className={`rounded border px-2 py-1 text-xs bg-slate-900 ${getStatusClasses(task.status)}`}
              >
                Státusz: {task.status}
              </button>

              {task.status === 'done' && (
                <button
                  type="button"
                  onClick={() => onArchiveTask(task)}
                  className="ml-2 rounded bg-slate-700 px-2 py-1 text-xs text-slate-100 hover:bg-slate-600"
                >
                  Archiválás
                </button>
              )}

              <span>
                {task.due_date
                  ? `Határidő: ${new Date(task.due_date).toLocaleDateString('hu-HU')}`
                  : 'Nincs határidő'}
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
