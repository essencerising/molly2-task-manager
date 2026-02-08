// features/tasks/TaskCard.tsx
import { useState, useEffect } from 'react';
import type { Task } from '../../types/tasks';
import type { Person } from '@/types/people';
import { getPeopleByArea, createPerson } from '@/lib/peopleService';
import { updateTaskDetails } from '../../lib/tasksService';

interface TaskCardProps {
  task: Task;
  onClose: () => void;
  onUpdated?: (task: Task) => void;
}

export function TaskCard({ task, onClose, onUpdated }: TaskCardProps) {
  const [assigneeEmail, setAssigneeEmail] = useState(task.assignee_email ?? '');
  const [followUpDate, setFollowUpDate] = useState(
    task.follow_up_at
      ? new Date(task.follow_up_at).toISOString().slice(0, 10)
      : ''
  );

// ÚJ: people alapú felelős
const [assigneeId, setAssigneeId] = useState<string>(task.assignee_id ?? '');
const [people, setPeople] = useState<Person[]>([]);

const [newPersonName, setNewPersonName] = useState('');
const [newPersonEmail, setNewPersonEmail] = useState('');
const [isAddingPerson, setIsAddingPerson] = useState(false);
const [personError, setPersonError] = useState<string | null>(null);
const [isSavingPerson, setIsSavingPerson] = useState(false);

  const [saving, setSaving] = useState(false);

useEffect(() => {
    setAssigneeEmail(task.assignee_email ?? '');
    setFollowUpDate(
      task.follow_up_at
        ? new Date(task.follow_up_at).toISOString().slice(0, 10)
        : ''
    );
  }, [task.id, task.assignee_email, task.follow_up_at]);

   const handleSave = async () => {
  setSaving(true);
  try {
    await updateTaskDetails({
      id: task.id,
      assigneeEmail: assigneeEmail.trim() || null,
      assigneeId: assigneeId || null, // ÚJ
      followUpAt: followUpDate ? new Date(followUpDate).toISOString() : null,
    });

    onUpdated?.({
      ...task,
      assignee_email: assigneeEmail.trim() || null,
      assignee_id: assigneeId || null,
      follow_up_at: followUpDate ? new Date(followUpDate).toISOString() : null,
    });
  } catch (e) {
    console.error(e);
  } finally {
    setSaving(false);
  }
};
  const handleAddPerson = async () => {
  setPersonError(null);

  if (!newPersonName.trim()) {
    setPersonError('A név kötelező.');
    return;
  }

  try {
    setIsSavingPerson(true);

    const created = await createPerson({
      name: newPersonName.trim(),
      email: newPersonEmail.trim() || undefined,
      area: task.area,
    });

    setPeople((prev) => [...prev, created]);
    setAssigneeId(created.id);

    setNewPersonName('');
    setNewPersonEmail('');
    setIsAddingPerson(false);
  } catch (err) {
    console.error(err);
    setPersonError('Nem sikerült létrehozni a személyt.');
  } finally {
    setIsSavingPerson(false);
  }
};

  useEffect(() => {
  async function loadPeople() {
    try {
      const list = await getPeopleByArea(task.area);
      setPeople(list);
    } catch (e) {
      console.error(e);
      setPeople([]);
    }
  }

  loadPeople();
}, [task.area]);

  return (
    <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Részletek: {task.title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          Bezárás
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-xs text-slate-400">
          Terület: <span className="text-slate-100">{task.area}</span>
        </p>
        <p className="text-xs text-slate-400">
          Státusz: <span className="text-slate-100">{task.status}</span>
        </p>
        <p className="text-xs text-slate-400">
          Határidő:{' '}
          <span className="text-slate-100">
            {task.due_date
              ? new Date(task.due_date).toLocaleDateString('hu-HU')
              : 'Nincs határidő'}
          </span>
        </p>
        <p className="text-xs text-slate-400">
          Létrehozva:{' '}
          <span className="text-slate-100">
            {new Date(task.created_at).toLocaleString('hu-HU')}
          </span>
        </p>
        <p className="text-xs text-slate-400">
          Utolsó módosítás:{' '}
          <span className="text-slate-100">
            {new Date(task.updated_at).toLocaleString('hu-HU')}
          </span>
        </p>

                <div className="pt-2">
          <p className="text-xs text-slate-400 mb-1">Leírás</p>
          <div className="rounded border border-slate-800 bg-slate-900 p-2 min-h-[40px]">
            {task.description ?? 'Még nincs leírás.'}
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <p className="text-xs text-slate-400 font-semibold">
  Delegálás és follow-up
</p>

<div className="flex flex-col gap-2 md:flex-row">
  {/* Felelős név + e-mail mező (külön) */}
  <div className="flex-1 space-y-1">
    <label className="block text-xs text-slate-400">
      Felelős (people lista)
    </label>

    <div className="flex gap-2">
      <select
        value={assigneeId}
        onChange={(e) => setAssigneeId(e.target.value)}
        className="flex-1 rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none"
      >
        <option value="">Nincs felelős</option>
        {people.map((person) => (
          <option key={person.id} value={person.id}>
            {person.name} {person.email ? `(${person.email})` : ''}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() => {
          setIsAddingPerson((prev) => !prev);
          setPersonError(null);
        }}
        className="rounded border border-sky-500 px-2 py-1 text-xs text-sky-300 hover:bg-sky-900"
      >
        {isAddingPerson ? 'Mégse' : 'Új'}
      </button>
    </div>

    {isAddingPerson && (
      <div className="mt-1 space-y-2 rounded border border-slate-800 p-2">
        <div>
          <label className="mb-1 block text-[10px] font-medium">
            Név
          </label>
          <input
            type="text"
            value={newPersonName}
            onChange={(e) => setNewPersonName(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none"
            placeholder="pl. Kovács János"
          />
        </div>

        <div>
          <label className="mb-1 block text-[10px] font-medium">
            E-mail (opcionális)
          </label>
          <input
            type="email"
            value={newPersonEmail}
            onChange={(e) => setNewPersonEmail(e.target.value)}
            className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none"
            placeholder="pl. janos@example.com"
          />
        </div>

        {personError && (
          <p className="text-[10px] text-red-400">{personError}</p>
        )}

        <button
          type="button"
          disabled={isSavingPerson}
          onClick={handleAddPerson}
          className="rounded bg-sky-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {isSavingPerson ? 'Mentés…' : 'Személy mentése'}
        </button>
      </div>
    )}

    {/* Ha akarod, meghagyhatjuk külön az e-mail inputot is */}
    <div className="mt-2">
      <label className="mb-1 block text-xs text-slate-400">
        Felelős e-mail címe (szabad szöveg)
      </label>
      <input
        type="email"
        value={assigneeEmail}
        onChange={(e) => setAssigneeEmail(e.target.value)}
        className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none"
        placeholder="pl. valaki@domain.hu"
      />
    </div>
  </div>

  <div className="flex-1">
    <label className="mb-1 block text-xs text-slate-400">
      Follow-up dátum
    </label>
    <input
      type="date"
      value={followUpDate}
      onChange={(e) => setFollowUpDate(e.target.value)}
      className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none"
    />
  </div>
</div>

<button
  type="button"
  disabled={saving}
  onClick={handleSave}
  className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium hover:bg-emerald-500 disabled:opacity-50"
>
  {saving ? 'Mentés…' : 'Változások mentése (delegálás / follow-up)'}
</button>

        </div>
      </div>
    </div>
  );
}
