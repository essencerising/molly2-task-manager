-- Profilok Email címének pótlása
-- Futtasd ezt a Supabase SQL Editorban a meglévő felhasználók javításához!

update public.profiles
set email = users.email
from auth.users
where profiles.id = users.id
and (profiles.email is null or profiles.email = '');

-- Ellenőrzés: Listázzuk ki a javított profilokat
select full_name, email from public.profiles;
