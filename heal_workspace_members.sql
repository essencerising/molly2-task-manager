-- Adat javító script: Biztosítja, hogy a tulajdonosok tagok is legyenek a saját munkaterületükön
-- Ha a policy frissítés nem oldotta meg, ez a script explicit módon kijavítja az adathibát.

insert into public.workspace_members (workspace_id, user_id, role)
select id, owner_id, 'owner'
from public.workspaces
where not exists (
  select 1 from public.workspace_members
  where workspace_id = workspaces.id and user_id = workspaces.owner_id
);

-- Opcionális: Ellenőrzés, hogy bekerültél-e
select w.name as workspace_name, wm.role
from public.workspaces w
join public.workspace_members wm on w.id = wm.workspace_id
where wm.user_id = auth.uid();
