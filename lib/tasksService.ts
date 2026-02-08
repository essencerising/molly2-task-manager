// lib/tasksService.ts
import { supabase } from './supabaseClient';
import type { Task, TaskArea } from '@/types/tasks';

// Összes feladat lekérése
export async function fetchTasks() {
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:people!tasks_assignee_id_fkey(id, name, email)')
    .is('archived_at', null) // ← csak NEM archivált feladatok
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

 return (data ?? []).map((row: any) => ({
  id: row.id,
  title: row.title,
  status: row.status,
  area: row.area,
  description: row.description,
  assigneeEmail: row.assignee_email,
  delegatorEmail: row.delegator_email,
  // DÁTUMOK – ezek kellenek a naptárnak:
  dueDate: row.due_date,
  followUpDate: row.follow_up_at,
  created_at: row.created_at ?? null,
  updated_at: row.updated_at ?? null,
}));
}

// ------------------
// Create
// ------------------

interface CreateTaskInput {
  title: string;
  area: TaskArea;
  dueDate?: string | null;       // ISO string vagy null
  description?: string | null;
  assigneeEmail?: string | null; // régi e-mail alapú delegálás (átmenetileg marad)
  assigneeId?: string | null;    // ÚJ: kapcsolat a people.id-hoz
  delegatorEmail?: string | null; // ÚJ
}

export async function createTask(input: CreateTaskInput) {
  const {
    title,
    area,
    dueDate,
    description,
    assigneeEmail,
    assigneeId,
    delegatorEmail,
  } = input;

  const payload: Partial<Task> = {
    title,
    area,
    status: 'todo',
  };

  if (dueDate) {
    payload.due_date = dueDate as any;
  }

  if (description) {
    payload.description = description;
  }

  if (assigneeEmail) {
    payload.assignee_email = assigneeEmail;
  }

  if (delegatorEmail) {
    payload.delegator_email = delegatorEmail;
  }

  if (assigneeId) {
    payload.assignee_id = assigneeId as any;
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select('id, title, description, status, area, assignee_email, assignee_id, due_date, follow_up_at, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return data as Task;
}

// ------------------
// Status frissítése
// ------------------

export async function updateTaskStatus(
  taskId: string,
  nextStatus: Task['status'],
) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ status: nextStatus })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Task;
}

export async function archiveTask(taskId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', taskId);

  if (error) {
    console.error('Nem sikerült archiválni a feladatot:', error);
    throw error;
  }

  return data;
}

// ------------------
// Részletek frissítése (assignee + followUp)
// ------------------

interface UpdateTaskDetailsInput {
  id: string;
  title?: string;
  description?: string | null;
  assigneeEmail?: string | null;
  assigneeId?: string | null;
  followUpAt?: string | null;
}

export async function updateTaskDetails(input: UpdateTaskDetailsInput) {
  const {
    id,
    title,
    description,
    assigneeEmail,
    assigneeId,
    followUpAt,
  } = input;

  const payload: Partial<Task> = {};

  if (title !== undefined) {
    payload.title = title;
  }
  if (description !== undefined) {
    payload.description = description;
  }
  if (assigneeEmail !== undefined) {
    payload.assignee_email = assigneeEmail;
  }
  if (assigneeId !== undefined) {
    payload.assignee_id = assigneeId as any;
  }
  if (followUpAt !== undefined) {
    payload.follow_up_at = followUpAt as any;
  }

  const { error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id); // itt elég a sikeres update, nem kell .single()

  if (error) {
    console.error('updateTaskDetails error', error);
    throw error;
  }
}

// ------------------
// Distinct area-k lekérése dashboardhoz
// ------------------

export async function fetchAreas() {
  const { data, error } = await supabase
    .from('tasks')
    .select('area')
    .order('area', { ascending: true });

  if (error) {
    throw error;
  }

  // összes area -> egyedi lista (null/üres kizárva)
  const allAreas = (data ?? [])
    .map((row) => row.area)
    .filter((area): area is TaskArea => Boolean(area));

  const uniqueAreas = Array.from(new Set(allAreas));

  return uniqueAreas;
}
// ------------------
// Feladatok lekérése egy adott area-hoz
// ------------------

export async function fetchTasksByArea(area: string) {
  console.log('fetchTasksByArea area param:', area);

  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:people!tasks_assignee_id_fkey(id, name, email)')
    .eq('area', area)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchTasksByArea error:', error);
    throw error;
  }

  console.log('fetchTasksByArea rows count:', data?.length ?? 0);

  return data as any[];
}
// ------------------
// Mai feladataid lekérése dashboardhoz
// ------------------

interface FetchTodayTasksOptions {
  assigneeEmail?: string; // később: userId, workspaceId stb.
}

export async function fetchTodayTasks(options: FetchTodayTasksOptions = {}) {
  const { assigneeEmail } = options;

  const today = new Date();
  const startOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    0,
    0,
    0,
    0,
  );
  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999,
  );

  let query = supabase
    .from('tasks')
    .select('*, assignee:people!tasks_assignee_id_fkey(id, name, email)')
    .gte('due_date', startOfDay.toISOString())
    .lte('due_date', endOfDay.toISOString())
    .order('due_date', { ascending: true });

  // Egyszerű személyre szabás: ha megadunk e-mailt, arra szűrünk.
  if (assigneeEmail) {
    query = query.eq('assignee_email', assigneeEmail);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data as any[];
}

// ------------------
// Általad delegált feladatok lekérése
// ------------------

interface FetchDelegatedTasksOptions {
  delegatorEmail?: string; // később: userId, workspaceId stb.
}

export async function fetchDelegatedTasks(
  options: FetchDelegatedTasksOptions = {},
) {
  const { delegatorEmail } = options;

  let query = supabase
    .from('tasks')
    .select('*, assignee:people!tasks_assignee_id_fkey(id, name, email)')
    .neq('status', 'done')
    .not('assignee_id', 'is', null); // csak delegált (van felelős)

  if (delegatorEmail) {
    query = query.eq('delegator_email', delegatorEmail);
  }

  const { data, error } = await query.order('due_date', {
    ascending: true,
  });

  if (error) {
    throw error;
  }

  return data as any[];
}
// ------------------
// Közelgő follow-upok lekérése
// ------------------

interface FetchUpcomingFollowupsOptions {
  daysAhead?: number;
  assigneeEmail?: string; // később: userId, workspaceId stb.
}

export async function fetchUpcomingFollowups(
  options: FetchUpcomingFollowupsOptions = {},
) {
  const { daysAhead = 7, assigneeEmail } = options;

  const now = new Date();
  const from = now.toISOString();

  const toDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysAhead,
    23,
    59,
    59,
    999,
  );
  const to = toDate.toISOString();

  let query = supabase
    .from('tasks')
    .select('*, assignee:people!tasks_assignee_id_fkey(id, name, email)')
    .not('follow_up_at', 'is', null)
    .gte('follow_up_at', from)
    .lte('follow_up_at', to)
    .order('follow_up_at', { ascending: true });

  if (assigneeEmail) {
    query = query.eq('assignee_email', assigneeEmail);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data as any[];
}