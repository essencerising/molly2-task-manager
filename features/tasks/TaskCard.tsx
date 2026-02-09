// features/tasks/TaskCard.tsx
import type { Task } from '../../types/tasks';
import { useTaskEditor } from './useTaskEditor';

interface TaskCardProps {
  task: Task;
  onClose: () => void;
  onUpdated?: (task: Task) => void;
}

export function TaskCard({ task, onClose, onUpdated }: TaskCardProps) {
  const { formState, peopleState, extrasState, status, actions } = useTaskEditor({
    task,
    onUpdated,
  });

  const {
    title, setTitle,
    description, setDescription,
    assigneeId, setAssigneeId,
    followUpDate, setFollowUpDate,
    recurrenceType, setRecurrenceType,
    recurrenceInterval, setRecurrenceInterval
  } = formState;

  const {
    people,
    isAddingPerson, setIsAddingPerson,
    newPersonName, setNewPersonName,
    newPersonEmail, setNewPersonEmail
  } = peopleState;

  const {
    subtasks,
    comments,
    newSubtaskTitle, setNewSubtaskTitle,
    newCommentContent, setNewCommentContent
  } = extrasState || { subtasks: [], comments: [] };

  const { isSaving, isSavingPerson, error, personError } = status;
  const {
    saveTask,
    addPerson,
    handleAddSubtask,
    handleToggleSubtask,
    handleDeleteSubtask,
    handleAddComment
  } = actions;

  return (
    <div className="mt-6 rounded-lg border border-slate-800 bg-slate-950 p-4 text-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between w-full">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-slate-400">
              Cím
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="mt-2 text-xs text-slate-400 hover:text-slate-200 md:mt-0 md:ml-4"
          >
            Bezárás
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded bg-red-900/20 p-2 text-xs text-red-200 border border-red-900/50">
          {error}
        </div>
      )}

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
            {task.created_at
              ? new Date(task.created_at).toLocaleString('hu-HU')
              : 'ismeretlen'}
          </span>
        </p>
        <p className="text-xs text-slate-400">
          Utolsó módosítás:{' '}
          <span className="text-slate-100">
            {task.updated_at
              ? new Date(task.updated_at).toLocaleString('hu-HU')
              : 'ismeretlen'}
          </span>
        </p>

        <div className="pt-2">
          <p className="text-xs text-slate-400 mb-1">Leírás</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none min-h-[80px]"
            placeholder="Rövid leírás a feladatról…"
          />
        </div>

        <div className="pt-4 space-y-3">
          <p className="text-xs text-slate-400 font-semibold">
            Delegálás és follow-up
          </p>

          <div className="flex flex-col gap-2 md:flex-row">
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
                    onClick={addPerson}
                    className="rounded bg-sky-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-sky-500 disabled:opacity-60"
                  >
                    {isSavingPerson ? 'Mentés…' : 'Személy mentése'}
                  </button>
                </div>
              )}
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

          <div className="pt-2 border-t border-slate-800/50">
            <label className="mb-2 block text-xs text-slate-400 font-semibold">
              Ismétlődés
            </label>
            <div className="flex gap-2 items-center">
              <select
                value={recurrenceType ?? 'none'}
                onChange={(e) => setRecurrenceType(e.target.value as any)}
                className="rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none"
              >
                <option value="none">Nincs ismétlődés</option>
                <option value="daily">Naponta</option>
                <option value="weekly">Hetente</option>
                <option value="monthly">Havonta</option>
                <option value="yearly">Évente</option>
              </select>

              {(recurrenceType && recurrenceType !== 'none') && (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Minden</span>
                  <input
                    type="number"
                    min={1}
                    value={recurrenceInterval}
                    onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                    className="w-12 rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none text-center"
                  />
                  <span>. {recurrenceType === 'daily' ? 'nap' : recurrenceType === 'weekly' ? 'hét' : recurrenceType === 'monthly' ? 'hónap' : 'év'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Subtasks Section */}
      <div className="pt-4 border-t border-slate-800/50 space-y-3">
        <h3 className="text-xs font-semibold text-slate-400">Alfeladatok</h3>

        <div className="space-y-2">
          {subtasks?.map((st: any) => (
            <div key={st.id} className="flex items-center gap-2 group">
              <input
                type="checkbox"
                checked={st.is_completed}
                onChange={() => handleToggleSubtask(st.id, st.is_completed)}
                className="rounded border-slate-700 bg-slate-900 text-sky-500 focus:ring-sky-500/20"
              />
              <span className={`flex-1 text-sm ${st.is_completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                {st.title}
              </span>
              <button
                type="button"
                onClick={() => handleDeleteSubtask(st.id)}
                className="text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                Törlés
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newSubtaskTitle || ''}
            onChange={(e) => setNewSubtaskTitle?.(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
            placeholder="Új alfeladat..."
            className="flex-1 rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddSubtask}
            className="rounded border border-slate-700 px-2 py-1 text-xs text-slate-300 hover:bg-slate-800"
          >
            Hozzáadás
          </button>
        </div>
      </div>

      {/* Comments Section */}
      <div className="pt-4 border-t border-slate-800/50 space-y-3">
        <h3 className="text-xs font-semibold text-slate-400">Megjegyzések</h3>

        <div className="space-y-3 max-h-40 overflow-y-auto pr-1">
          {comments?.length === 0 && <p className="text-xs text-slate-600 italic">Nincs még megjegyzés.</p>}
          {comments?.map((c: any) => (
            <div key={c.id} className="bg-slate-900/50 rounded p-2 text-xs">
              <div className="flex justify-between items-baseline mb-1">
                <span className="font-semibold text-sky-400">{c.author_email || 'Ismeretlen'}</span>
                <span className="text-[10px] text-slate-500">{new Date(c.created_at).toLocaleString('hu-HU')}</span>
              </div>
              <p className="text-slate-300">{c.content}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 items-start">
          <textarea
            value={newCommentContent || ''}
            onChange={(e) => setNewCommentContent?.(e.target.value)}
            placeholder="Írj egy megjegyzést..."
            className="flex-1 rounded border border-slate-800 bg-slate-900 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none min-h-[40px]"
          />
          <button
            type="button"
            onClick={handleAddComment}
            disabled={!newCommentContent?.trim()}
            className="rounded bg-sky-600 px-3 py-1 text-xs font-medium text-white hover:bg-sky-500 disabled:opacity-50 mt-1"
          >
            Küldés
          </button>
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2 pt-4 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          className="rounded border border-slate-700 px-3 py-1 text-xs text-slate-300 hover:bg-slate-800"
        >
          Mégse
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={saveTask}
          className="rounded bg-emerald-600 px-3 py-1 text-xs font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {isSaving ? 'Mentés…' : 'Mentés'}
        </button>
      </div>
    </div>
  );
}
