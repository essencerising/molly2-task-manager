-- Jegyzetek (Notes) tábla létrehozása
-- Futtasd a Supabase SQL Editor-ban

create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  title text not null default '',
  content text default '',
  is_pinned boolean default false,
  color text default null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index a gyorsabb lekérdezéshez
create index if not exists idx_notes_workspace_id on notes(workspace_id);

-- RLS policies (ha szükséges, állítsd be)
-- alter table notes enable row level security;
