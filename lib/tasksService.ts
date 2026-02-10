// lib/tasksService.ts
import { supabase } from './supabaseClient';
import type { Task, TaskArea } from '@/types/tasks';

// Segédtípus a Supabase válaszhoz
interface TaskRow {
  id: string;
  title: string;
  status: Task['status'];
  area: TaskArea;
  description: string | null;
  assignee_email: string | null;
  delegator_email: string | null;
  due_date: string | null;
  follow_up_at: string | null;
  recurrence_type: 'none' | 'daily' | 'weekly' | 'monthly' | null;
  recurrence_interval: number | null;
  created_at: string;
  updated_at: string;
  assignee_id: string | null;
  workspace_id: string;
  project_id: string | null;
  contact_id: string | null; // ÚJ (CRM)
  projects?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
  workspaces?: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
  } | null;
  assignee?: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  contacts?: { // ÚJ (CRM)
    id: string;
    name: string;
    avatar_color: string | null;
  } | null;
}

// Összes feladat lekérése lapozással
interface FetchTasksOptions {
  page?: number;
  limit?: number;
}

interface FetchTasksResult {
  data: any[];
  count: number;
}

export async function fetchTasks({ page = 1, limit = 20 }: FetchTasksOptions = {}): Promise<FetchTasksResult> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('tasks')
    .select('*, assignee:people!tasks_assignee_id_fkey(id, name, email), projects(id, name, color), workspaces(id, name, color, icon), contacts(id, name, avatar_color)', { count: 'exact' })
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw error;
  }

  const rows = data as unknown as TaskRow[];

  const normalized = rows.map((row) => ({
    id: row.id,
    title: row.title,
    status: row.status,
    area: row.area,
    workspace_id: row.workspace_id,
    project_id: row.project_id,
    contact_id: row.contact_id, // ÚJ
    projectName: row.projects?.name || row.area,
    projectColor: row.projects?.color || '#6366F1',
    workspaceName: row.workspaces?.name,
    workspaceColor: row.workspaces?.color,
    workspaceIcon: row.workspaces?.icon,
    contactName: row.contacts?.name, // ÚJ 
    contactAvatarColor: row.contacts?.avatar_color, // ÚJ
    description: row.description,
    assigneeEmail: row.assignee_email,
    delegatorEmail: row.delegator_email,
    dueDate: row.due_date,
    followUpDate: row.follow_up_at,
    recurrenceType: row.recurrence_type,
    recurrenceInterval: row.recurrence_interval,
    created_at: row.created_at,
    updated_at: row.updated_at,
    assignee_id: row.assignee_id,
  }));

  return {
    data: normalized,
    count: count ?? 0,
  };
}

// ------------------
// Create
// ------------------

interface CreateTaskInput {
  title: string;
  area: TaskArea;
  dueDate?: string | null;
  followUpDate?: string | null;
  description?: string | null;
  assigneeId?: string | null;
  delegatorEmail?: string | null;
  recurrenceType?: Task['recurrence_type'];
  recurrenceInterval?: number | null;
  workspaceId?: string;
  projectId?: string | null;
  contactId?: string | null; // ÚJ (CRM)
}

export async function createTask(input: CreateTaskInput) {
  const {
    title,
    area,
    dueDate,
    followUpDate,
    description,
    assigneeId,
    delegatorEmail,
    recurrenceType,
    recurrenceInterval,
    workspaceId,
    projectId,
    contactId
  } = input;

  const payload: Partial<Task> = {
    title,
    area,
    status: 'todo',
    workspace_id: workspaceId,
    project_id: projectId,
    contact_id: contactId
  };

  if (dueDate) {
    payload.due_date = dueDate as any; // Supabase dátum típuskezelés miatt
  }

  if (followUpDate) {
    payload.follow_up_at = followUpDate as any;
  }

  if (description) {
    payload.description = description;
  }

  if (delegatorEmail) {
    payload.delegator_email = delegatorEmail;
  }

  if (assigneeId) {
    payload.assignee_id = assigneeId as any;
  }

  if (recurrenceType) {
    payload.recurrence_type = recurrenceType;
  }

  if (recurrenceInterval) {
    payload.recurrence_interval = recurrenceInterval;
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert(payload)
    .select()
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

  // Check if we need to spawn a recurring task
  if (nextStatus === 'done' && data && data.recurrence_type && data.recurrence_type !== 'none') {
    try {
      const interval = data.recurrence_interval || 1;
      let nextDueDate = new Date(); // default to now if no due date
      if (data.due_date) {
        nextDueDate = new Date(data.due_date);
      }

      // Calculate next date
      switch (data.recurrence_type) {
        case 'daily':
          nextDueDate.setDate(nextDueDate.getDate() + interval);
          break;
        case 'weekly':
          nextDueDate.setDate(nextDueDate.getDate() + (interval * 7));
          break;
        case 'monthly':
          nextDueDate.setMonth(nextDueDate.getMonth() + interval);
          break;
        case 'yearly':
          nextDueDate.setFullYear(nextDueDate.getFullYear() + interval);
          break;
      }

      // Create the next task
      await createTask({
        title: data.title,
        area: data.area,
        dueDate: nextDueDate.toISOString(),
        description: data.description,
        assigneeId: data.assignee_id,
        delegatorEmail: data.delegator_email,
      });

      // Update the new task with recurrence settings (so it also recurs)
      // Note: createTask doesn't accept recurrence params yet, so we update it immediately or update createTask to accept them.
      // Better: let's update createTask signature in a future step or just use update logic here.
      // For now, simpler to just let user manually set it on next one? No, it should persist.
      // We'll insert strictly logic here.

      // Wait, createTask returns the task. We should update IT with recurrence info.
      // Actually, let's just use supabase insert directly here to include everything in one go if createTask is limited.
      // BUT, createTask is imported. Let's just call it, then update it.

      // Actually, I can just update the `createTask` function to accept recurrence.
      // BUT for now in this scope:
      const { data: newData, error: newError } = await supabase
        .from('tasks')
        .insert({
          title: data.title,
          area: data.area,
          status: 'todo',
          due_date: nextDueDate, // Supabase handles Date object
          description: data.description,
          assignee_id: data.assignee_id,
          delegator_email: data.delegator_email,
          recurrence_type: data.recurrence_type,
          recurrence_interval: data.recurrence_interval
        })
        .select()
        .single();

      if (newError) console.error('Failed to create recurring task', newError);

    } catch (e) {
      console.error('Error handling recurrence', e);
    }
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
// Részletek frissítése
// ------------------

interface UpdateTaskDetailsInput {
  id: string;
  title?: string;
  description?: string | null;
  assigneeId?: string | null;
  followUpAt?: string | null;
  assigneeEmail?: string | null;
  recurrenceType?: Task['recurrence_type'];
  recurrenceInterval?: number | null;
  projectId?: string | null;
  contactId?: string | null;
}

export async function updateTaskDetails(input: UpdateTaskDetailsInput) {
  const {
    id,
    title,
    description,
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
  if (assigneeId !== undefined) {
    payload.assignee_id = assigneeId as any;
  }
  // Support both followUpAt (camelCase) and follow_up_at (snake_case)
  const followUpValue = followUpAt !== undefined ? followUpAt : (input as any).follow_up_at;
  if (followUpValue !== undefined) {
    payload.follow_up_at = followUpValue as any;
  }
  if (input.recurrenceType !== undefined) {
    payload.recurrence_type = input.recurrenceType;
  }
  if (input.recurrenceInterval !== undefined) {
    payload.recurrence_interval = input.recurrenceInterval;
  }
  // Support both camelCase and snake_case for projectId
  const projectIdValue = input.projectId !== undefined ? input.projectId : (input as any).project_id;
  if (projectIdValue !== undefined) {
    payload.project_id = projectIdValue;
  }

  // Support both camelCase and snake_case for contactId
  const contactIdValue = input.contactId !== undefined ? input.contactId : (input as any).contact_id;
  if (contactIdValue !== undefined) {
    payload.contact_id = contactIdValue;
  }
  // Support both dueDate and due_date
  const dueDateValue = (input as any).dueDate !== undefined ? (input as any).dueDate : (input as any).due_date;
  if (dueDateValue !== undefined) {
    payload.due_date = dueDateValue as any;
  }
  // Support status updates
  if ((input as any).status !== undefined) {
    payload.status = (input as any).status;
  }

  const { error } = await supabase
    .from('tasks')
    .update(payload)
    .eq('id', id);

  if (error) {
    console.error('updateTaskDetails error', error);
    throw error;
  }
}

// Alias for updateTaskDetails (used by Dashboard)
export const updateTask = updateTaskDetails;

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
  const { data, error } = await supabase
    .from('tasks')
    .select('*, assignee:people!tasks_assignee_id_fkey(id, name, email)')
    .eq('area', area)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchTasksByArea error:', error);
    throw error;
  }

  return data as any[];
}
// ------------------
// Mai feladataid lekérése dashboardhoz
// ------------------

interface FetchTodayTasksOptions {
  assigneeEmail?: string;
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
  ).toISOString();

  const endOfDay = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59,
    999,
  ).toISOString();

  let query = supabase
    .from('tasks')
    .select('*, assignee:people!tasks_assignee_id_fkey(id, name, email)')
    .gte('due_date', startOfDay)
    .lte('due_date', endOfDay)
    .order('due_date', { ascending: true });

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
  delegatorEmail?: string;
}

export async function fetchDelegatedTasks(
  options: FetchDelegatedTasksOptions = {},
) {
  const { delegatorEmail } = options;

  let query = supabase
    .from('tasks')
    .select('*, assignee:people!tasks_assignee_id_fkey(id, name, email)')
    .neq('status', 'done')
    .not('assignee_id', 'is', null);

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
  assigneeEmail?: string;
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

// ------------------
// Subtasks (Alfeladatok)
// ------------------

export async function fetchSubtasks(taskId: string) {
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as any[];
}

export async function createSubtask(taskId: string, title: string) {
  const { data, error } = await supabase
    .from('subtasks')
    .insert({ task_id: taskId, title, is_completed: false })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleSubtask(subtaskId: string, isCompleted: boolean) {
  const { data, error } = await supabase
    .from('subtasks')
    .update({ is_completed: isCompleted })
    .eq('id', subtaskId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSubtask(subtaskId: string) {
  const { error } = await supabase
    .from('subtasks')
    .delete()
    .eq('id', subtaskId);

  if (error) throw error;
}

// ------------------
// Comments (Megjegyzések)
// ------------------

export async function fetchComments(taskId: string) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true }); // vagy false, ha újabb felül

  if (error) throw error;
  return data as any[];
}

export async function createComment(taskId: string, content: string, authorEmail?: string) {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      task_id: taskId,
      content,
      author_email: authorEmail
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ------------------
// Tasks for Contact (CRM)
// ------------------

export async function fetchTasksByContact(contactId: string) {
  const { data, error } = await supabase
    .from('tasks')
    .select(`
      id,
      title,
      status,
      due_date,
      projects (
        name,
        color
      )
    `)
    .eq('contact_id', contactId)
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('fetchTasksByContact error:', error);
    throw error;
  }

  // Normalize project data structure
  return (data || []).map((t: any) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    dueDate: t.due_date,
    projectName: t.projects?.name,
    projectColor: t.projects?.color
  }));
}
