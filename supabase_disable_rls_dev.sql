-- Workspace RLS kikapcsolása fejlesztéshez
-- Futtatandó a Supabase SQL Editorban

-- Workspaces tábla RLS kikapcsolása
alter table workspaces disable row level security;

-- Workspace members tábla RLS kikapcsolása  
alter table workspace_members disable row level security;

-- Projects tábla RLS kikapcsolása
alter table projects disable row level security;

-- Később, éles környezetben kapcsold vissza:
-- alter table workspaces enable row level security;
-- alter table workspace_members enable row level security;
-- alter table projects enable row level security;
