'use client';

import { useEffect, useState } from 'react';
import type { Task, TaskArea } from '@/types/tasks';
import { TaskList } from '../features/tasks/TaskList';
import { TaskFilters } from '../features/tasks/TaskFilters';
import { TaskCard } from '../features/tasks/TaskCard';
import { fetchTasks as fetchTasksFromService, createTask, updateTaskStatus, archiveTask, } from '../lib/tasksService';
import type { Person } from '@/types/people';
import { getPeopleByArea, createPerson } from '@/lib/peopleService';

const AREAS: TaskArea[] = [
  'Tanya',
  'CarpLove',
  'EssenceRising',
  'Coffee under the Stars',
  'Tanulás',
  'Magánélet',
  'Ötletek',
];

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Új feladat űrlap state
  const [title, setTitle] = useState('');
  const [area, setArea] = useState<TaskArea>('Tanya');
  const [dueDate, setDueDate] = useState<string>(''); // yyyy-mm-dd
  const [selectedArea, setSelectedArea] = useState<'ALL' | TaskArea>('ALL');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');

  // Felelős kiválasztása people táblából
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [people, setPeople] = useState<Person[]>([]);

  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonEmail, setNewPersonEmail] = useState('');
  const [isAddingPerson, setIsAddingPerson] = useState(false);
  const [personError, setPersonError] = useState<string | null>(null);
  const [isSavingPerson, setIsSavingPerson] = useState(false);

  const getNextStatus = (current: Task['status']): Task['status'] => {
    if (current === 'todo') return 'in_progress';
    if (current === 'in_progress') return 'done';
    return 'todo';
  };

        const fetchTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchTasksFromService(); // camelCase-es kimenet

      const normalized: Task[] = (data ?? []).map((row: any) => ({
        id: row.id,
        title: row.title,
        status: row.status,
        area: row.area,
        description: row.description,
        assignee_email: row.assigneeEmail,
        delegator_email: row.delegatorEmail,
        due_date: row.dueDate,
        follow_up_at: row.followUpDate,
        assignee_id: row.assignee_id ?? null,
        created_at: row.created_at ?? null,
        updated_at: row.updated_at ?? null,
      }));

      setTasks(normalized);
    } catch (err) {
      console.error(err);
      setError('Nem sikerült betölteni a feladatokat.');
    } finally {
      setLoading(false);
    }
  };
    const handleToggleStatus = async (task: Task) => {
    const nextStatus = getNextStatus(task.status);

    try {
      await updateTaskStatus(task.id, nextStatus);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: nextStatus } : t
        )
      );

         // ha a kiválasztott taskot is nézed, ott is érdemes frissíteni
      setSelectedTask((prev) =>
        prev && prev.id === task.id ? { ...prev, status: nextStatus } : prev
      );
    } catch (err) {
      console.error(err);
      setError('Nem sikerült frissíteni a feladat státuszát.');
    }
  };

  const handleArchiveTask = async (task: Task) => {
  try {
    // 1) archiválás a DB-ben
    await archiveTask(task.id);

    // 2) lokális state-ből kivesszük
    setTasks((prev) => prev.filter((t) => t.id === task.id ? false : true));

    // 3) ha épp meg volt nyitva a TaskCard, zárjuk
    setSelectedTask((prev) =>
      prev && prev.id === task.id ? null : prev
    );
  } catch (err) {
    console.error(err);
    setError('Nem sikerült archiválni a feladatot.');
  }
};

  useEffect(() => {
  fetchTasks();
}, []);

useEffect(() => {
  async function loadPeople() {
    try {
      const list = await getPeopleByArea(area);
      setPeople(list);
    } catch (e) {
      console.error(e);
      setPeople([]);
    }
  }

  loadPeople();
}, [area]);

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
      area,
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

    const handleCreateTask = async (e: React.SyntheticEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError(null);

  if (!title.trim()) {
    setError('A cím kötelező.');
    return;
  }

  const dueDateIso = dueDate ? new Date(dueDate).toISOString() : null;

  try {
    await createTask({
      title: title.trim(),
      area,
      dueDate: dueDateIso ?? undefined,
      description: description.trim() || undefined,
      assigneeId: assigneeId || undefined,
      delegatorEmail: 'te@emailed.vagy.placeholder', // EGYELŐRE HARDKÓD
    });

    setTitle('');
    setArea('Tanya');
    setDueDate('');
    setDescription('');
    setAssigneeId('');
    setPeople([]);

    await fetchTasks();
  } catch (err) {
    console.error(err);
    setError('Nem sikerült létrehozni a feladatot.');
  }
};

    const filteredTasks =
    selectedArea === 'ALL'
      ? tasks
      : tasks.filter((task) => task.area === selectedArea);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Molly 2.0 – Feladatkezelő</h1>

        {/* Új feladat űrlap */}
        <section className="mb-10 rounded-lg bg-slate-900 p-4 shadow">
          <h2 className="text-xl font-semibold mb-4">Új feladat</h2>
          {error && (
            <p className="mb-4 text-sm text-red-400">
              {error}
            </p>
          )}
          <form onSubmit={handleCreateTask} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Cím
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                placeholder="Feladat címe…"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Terület
              </label>
              <select
                value={area}
                onChange={(e) => setArea(e.target.value as TaskArea)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              >
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Határidő (opcionális)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
              />
            </div>
                <div className="space-y-2">
  <label className="block text-sm font-medium">
    Felelős (opcionális)
  </label>

  <div className="flex gap-2">
    <select
      value={assigneeId}
      onChange={(e) => setAssigneeId(e.target.value)}
      className="flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
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
      className="rounded border border-sky-500 px-3 py-2 text-sm text-sky-300 hover:bg-sky-900"
    >
      {isAddingPerson ? 'Mégse' : 'Új személy'}
    </button>
  </div>

  {isAddingPerson && (
  <div className="mt-2 space-y-2 rounded border border-slate-700 p-3">
    <div>
      <label className="mb-1 block text-xs font-medium">Név</label>
      <input
        type="text"
        value={newPersonName}
        onChange={(e) => setNewPersonName(e.target.value)}
        className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none"
        placeholder="pl. Kovács János"
      />
    </div>

    <div>
      <label className="mb-1 block text-xs font-medium">
        E-mail (opcionális)
      </label>
      <input
        type="email"
        value={newPersonEmail}
        onChange={(e) => setNewPersonEmail(e.target.value)}
        className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm focus:border-sky-500 focus:outline-none"
        placeholder="pl. janos@example.com"
      />
    </div>

    {personError && (
      <p className="text-xs text-red-400">{personError}</p>
    )}

    <button
      type="button"
      disabled={isSavingPerson}
      onClick={handleAddPerson}
      className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-60"
    >
      {isSavingPerson ? 'Mentés...' : 'Személy mentése'}
    </button>
  </div>
)}
</div>
            <div>
  <label className="mb-1 block text-sm font-medium">
    Leírás (opcionális)
  </label>
  <textarea
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
    rows={3}
    placeholder="Rövid leírás a feladatról…"
  />
</div>
            <button
              type="submit"
              className="rounded bg-sky-600 px-4 py-2 text-sm font-medium hover:bg-sky-500"
            >
              Feladat létrehozása
            </button>
          </form>
        </section>

        {/* Feladatlista */}
        <section className="rounded-lg bg-slate-900 p-4 shadow">
  <TaskFilters
    selectedArea={selectedArea}
    onChangeArea={setSelectedArea}
    onRefresh={fetchTasks}
  />

  {loading ? (
    <p className="text-sm text-slate-400">Betöltés…</p>
  ) : (
    <TaskList
      tasks={filteredTasks}
      onToggleStatus={handleToggleStatus}
      onSelectTask={setSelectedTask}
      onArchiveTask={handleArchiveTask}
    />
  )}

  {selectedTask && (
  <TaskCard
    task={selectedTask}
    onClose={() => setSelectedTask(null)}
    onUpdated={(updated) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      setSelectedTask(updated);
    }}
  />
)}
</section>
      </div>
    </main>
  );
}
