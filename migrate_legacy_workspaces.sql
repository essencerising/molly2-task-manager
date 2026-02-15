-- HELYREÁLLÍTÓ SZKRIPT: Régi Workspace-ek átvétele
-- Ezt akkor futtasd, ha vannak olyan workspace-ek, amiket még bejelentkezés előtt hoztál létre!

do $$
declare
  v_new_user_id uuid;
  v_dummy_id uuid := '00000000-0000-0000-0000-000000000000';
begin
  -- 1. Kérjük le a SAJÁT felhasználói ID-dat.
  -- Mivel te vagy a legutóbbi regisztráló, lekérjük a legfrissebb felhasználót.
  select id into v_new_user_id from auth.users order by created_at desc limit 1;
  
  -- Ellenőrzés: Találtunk felhasználót?
  if v_new_user_id is null then
    raise notice 'Nem találtam felhasználót! Előbb regisztrálj/lépj be.';
    return;
  end if;

  raise notice 'A munkaterületek átadása a következő felhasználónak: %', v_new_user_id;

  -- 2. Frissítsük a Workspaces táblát
  update public.workspaces
  set owner_id = v_new_user_id
  where owner_id = v_dummy_id;
  
  -- 3. Frissítsük a Projects táblát (ha van olyan, amit a dummy user hozott létre)
  update public.projects
  set created_by = v_new_user_id
  where created_by = v_dummy_id;

  -- 4. Adjuk hozzá a felhasználót tagként is ezekhez a workspace-ekhez (ha még nincs benne)
  insert into public.workspace_members (workspace_id, user_id, role)
  select id, v_new_user_id, 'owner'
  from public.workspaces
  where owner_id = v_new_user_id
  on conflict (workspace_id, user_id) 
  do update set role = 'owner';

  raise notice 'Sikeres átadás! Most már látnod kell a régi workspace-eket is.';
end $$;
