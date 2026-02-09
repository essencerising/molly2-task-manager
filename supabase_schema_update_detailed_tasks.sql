-- Részletes Feladatlap (Subtasks & Comments) adatbázis frissítés

-- 1. Alfeladatok (Checklist) tábla
create table if not exists subtasks (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  title text not null,
  is_completed boolean default false,
  created_at timestamptz default now()
);

-- 2. Kommentek tábla
create table if not exists comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade not null,
  content text not null,
  author_email text,
  created_at timestamptz default now()
);

-- Indexek a gyorsabb lekérdezéshez
create index if not exists idx_subtasks_task_id on subtasks(task_id);
create index if not exists idx_comments_task_id on comments(task_id);
