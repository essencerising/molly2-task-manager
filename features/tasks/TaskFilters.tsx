// features/tasks/TaskFilters.tsx
import type { TaskArea } from '@/types/tasks';

interface TaskFiltersProps {
  selectedArea: 'ALL' | TaskArea;
  onChangeArea: (area: 'ALL' | TaskArea) => void;
  onRefresh: () => void;
}

const AREAS: TaskArea[] = [
  'Tanya',
  'CarpLove',
  'EssenceRising',
  'Coffee under the Stars',
  'Tanulás',
  'Magánélet',
  'Ötletek',
];

export function TaskFilters({
  selectedArea,
  onChangeArea,
  onRefresh,
}: TaskFiltersProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <h2 className="text-xl font-semibold">Feladatok</h2>

      <div className="flex items-center gap-3">
        <select
          value={selectedArea}
          onChange={(e) =>
            onChangeArea(
              e.target.value === 'ALL'
                ? 'ALL'
                : (e.target.value as TaskArea)
            )
          }
          className="rounded border border-slate-700 bg-slate-950 px-3 py-1 text-xs focus:border-sky-500 focus:outline-none"
        >
          <option value="ALL">Összes terület</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onRefresh}
          className="text-xs text-sky-400 hover:text-sky-300"
        >
          Frissítés
        </button>
      </div>
    </div>
  );
}
