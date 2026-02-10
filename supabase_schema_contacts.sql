-- Kapcsolatok (Contacts) tábla létrehozása
-- Futtasd a Supabase SQL Editor-ban

create table if not exists contacts (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  name text not null,
  email text default null,
  phone text default null,
  company text default null,
  role text default null,
  notes text default '',
  avatar_color text default null,
  is_favorite boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Index
create index if not exists idx_contacts_workspace_id on contacts(workspace_id);
