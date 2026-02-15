-- Események tábla létrehozása
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null check (char_length(title) > 0),
  description text,
  start_time timestamp with time zone not null,
  end_time timestamp with time zone not null,
  is_all_day boolean default false,
  location text,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  created_by uuid references auth.users(id) on delete set null,
  
  -- Validáció: A befejezés nem lehet korábban, mint a kezdés
  constraint events_dates_check check (end_time >= start_time)
);

-- RLS (Row Level Security) beállítása
alter table public.events enable row level security;

-- Policy: Mindenki láthatja a saját workspace-ében lévő eseményeket
create policy "Users can view events in their workspaces"
  on public.events for select
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );

-- Policy: Mindenki létrehozhat eseményt a saját workspace-ében
create policy "Users can create events in their workspaces"
  on public.events for insert
  with check (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );

-- Policy: Mindenki szerkesztheti az eseményeket a saját workspace-ében
create policy "Users can update events in their workspaces"
  on public.events for update
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );

-- Policy: Mindenki törölheti az eseményeket a saját workspace-ében
create policy "Users can delete events in their workspaces"
  on public.events for delete
  using (
    workspace_id in (
      select workspace_id from public.workspace_members
      where user_id = auth.uid()
    )
  );

-- Trigger az updated_at frissítésére
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_events_updated_at
  before update on public.events
  for each row
  execute function public.handle_updated_at();
