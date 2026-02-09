-- Workspace & Project rendszer adatbázis séma
-- Futtatandó a Supabase SQL Editorban

-- 1. Workspaces tábla
create table if not exists workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  color text default '#6366F1',
  icon text,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Workspace tagság (members) tábla
create table if not exists workspace_members (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  joined_at timestamptz default now(),
  unique(workspace_id, user_id)
);

-- 3. Projects tábla
create table if not exists projects (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid references workspaces(id) on delete cascade not null,
  name text not null,
  description text,
  color text default '#6366F1',
  icon text,
  status text default 'active' check (status in ('active', 'archived', 'completed')),
  due_date date,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Tasks tábla bővítése workspace és project hivatkozással
-- Ha még nincs workspace_id és project_id oszlop:
alter table tasks add column if not exists workspace_id uuid references workspaces(id) on delete set null;
alter table tasks add column if not exists project_id uuid references projects(id) on delete set null;

-- 5. Indexek a gyorsabb lekérdezéshez
create index if not exists idx_workspaces_owner on workspaces(owner_id);
create index if not exists idx_workspace_members_workspace on workspace_members(workspace_id);
create index if not exists idx_workspace_members_user on workspace_members(user_id);
create index if not exists idx_projects_workspace on projects(workspace_id);
create index if not exists idx_tasks_workspace on tasks(workspace_id);
create index if not exists idx_tasks_project on tasks(project_id);

-- 6. RLS (Row Level Security) policies
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table projects enable row level security;

-- Workspace policies
create policy "Users can view workspaces they are members of"
  on workspaces for select
  using (
    owner_id = auth.uid() or
    id in (select workspace_id from workspace_members where user_id = auth.uid())
  );

create policy "Users can create workspaces"
  on workspaces for insert
  with check (owner_id = auth.uid());

create policy "Owners can update their workspaces"
  on workspaces for update
  using (owner_id = auth.uid());

create policy "Owners can delete their workspaces"
  on workspaces for delete
  using (owner_id = auth.uid());

-- Workspace members policies
create policy "Users can view workspace members"
  on workspace_members for select
  using (
    workspace_id in (
      select id from workspaces where owner_id = auth.uid()
      union
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "Workspace owners/admins can manage members"
  on workspace_members for all
  using (
    workspace_id in (
      select id from workspaces where owner_id = auth.uid()
      union
      select workspace_id from workspace_members where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Project policies
create policy "Users can view projects in their workspaces"
  on projects for select
  using (
    workspace_id in (
      select id from workspaces where owner_id = auth.uid()
      union
      select workspace_id from workspace_members where user_id = auth.uid()
    )
  );

create policy "Workspace members can create projects"
  on projects for insert
  with check (
    workspace_id in (
      select id from workspaces where owner_id = auth.uid()
      union
      select workspace_id from workspace_members where user_id = auth.uid() and role in ('owner', 'admin', 'member')
    )
  );

create policy "Workspace members can update projects"
  on projects for update
  using (
    workspace_id in (
      select id from workspaces where owner_id = auth.uid()
      union
      select workspace_id from workspace_members where user_id = auth.uid() and role in ('owner', 'admin', 'member')
    )
  );

-- 7. Trigger az updated_at automatikus frissítéséhez
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_workspaces_updated_at
  before update on workspaces
  for each row execute function update_updated_at_column();

create trigger update_projects_updated_at
  before update on projects
  for each row execute function update_updated_at_column();
