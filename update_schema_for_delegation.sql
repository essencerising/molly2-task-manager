-- DELEGÁLÁS ÉS CSAPATMUNKA PÓTLÁSOK
-- Futtasd ezt a Supabase SQL Editorban!

-- 1. Tasks tábla bővítése: Felelős hozzáadása
alter table public.tasks 
add column if not exists assignee_id uuid references auth.users(id) on delete set null,
add column if not exists assignee_email text;

create index if not exists idx_tasks_assignee on public.tasks(assignee_id);


-- 2. Profiles tábla bővítése: Email cím tárolása (hogy lássuk kit hívunk meg)
alter table public.profiles
add column if not exists email text;

-- 3. Trigger frissítése: Hogy az email cím is bekerüljön regisztrációkor
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

-- 4. Meglévő profilok frissítése (Best effort)
-- Mivel az auth.users táblából nehéz tömegesen átmásolni SQL-ből (permission miatt), 
-- a meglévő profiloknál az email üres maradhat. 
-- De ha a saját profilodnál frissítesz egyet (pl. név mentés), a kliens beküldheti.
