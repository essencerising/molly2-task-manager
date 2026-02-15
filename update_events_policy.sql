-- Javított RLS policy-k az events táblához
-- Futtasd ezt a Supabase SQL Editorban!

-- 1. Régi policy-k törlése
drop policy if exists "Users can view events in their workspaces" on public.events;
drop policy if exists "Users can create events in their workspaces" on public.events;
drop policy if exists "Users can update events in their workspaces" on public.events;
drop policy if exists "Users can delete events in their workspaces" on public.events;

-- 2. Új policy-k létrehozása (Owner check hozzáadása)

-- Megtekintés (Owner VAGY Tag)
create policy "Users can view events in their workspaces"
  on public.events for select
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

-- Létrehozás (Owner VAGY Tag)
create policy "Users can create events in their workspaces"
  on public.events for insert
  with check (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

-- Szerkesztés (Owner VAGY Tag)
create policy "Users can update events in their workspaces"
  on public.events for update
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

-- Törlés (Owner VAGY Tag)
create policy "Users can delete events in their workspaces"
  on public.events for delete
  using (
    workspace_id in (
      select id from public.workspaces where owner_id = auth.uid()
      union
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );
