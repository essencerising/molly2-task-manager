-- 1. LISTÁZZUK KI A WORKSPACE-EK TULAJDONAIT
-- Ez megmutatja, hogy melyik workspace kihez tartozik (owner_id).
-- Ha az 'owner_email' mező ÜRES vagy az ID csupa 0, akkor az "árva" workspace.

select 
  w.name as workspace_name, 
  w.owner_id, 
  u.email as owner_email,
  w.created_at
from public.workspaces w
left join auth.users u on w.owner_id = u.id;

-- 2. LISTÁZZUK KI A TE JELENLEGI FELHASZNÁLÓDAT
-- Hasonlítsd össze a fenti listában lévő 'owner_id'-val! 
-- Ha az ID-k megegyeznek, akkor máris a tied a workspace. Ha különböznek, futtatni kell a migrációt.

select id as my_user_id, email as my_email from auth.users order by created_at desc limit 1;
