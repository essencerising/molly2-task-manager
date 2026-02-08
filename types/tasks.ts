// types/tasks.ts
export type TaskStatus = 'todo' | 'in_progress' | 'done';

export type TaskArea =
  | 'Tanya'
  | 'CarpLove'
  | 'EssenceRising'
  | 'Coffee under the Stars'
  | 'Tanulás'
  | 'Magánélet'
  | 'Ötletek';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  area: TaskArea;
  status: TaskStatus;
  due_date: string | null;
  assignee_email: string | null;
  assignee_id: string | null;
  follow_up_at: string | null;
  created_at: string;
  updated_at: string;
  delegator_email?: string | null; // ÚJ
}
