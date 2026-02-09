-- Workspace létrehozás javítása fejlesztői környezethez (Auth nélkül)
-- Futtasd le a Supabase SQL Editorban!

-- 1. RLS (Row Level Security) kikapcsolása a biztonság kedvéért
alter table workspaces disable row level security;
alter table workspace_members disable row level security;
alter table projects disable row level security;

-- 2. Foreign Key kényszerek eltávolítása az auth.users tábláról
-- Ez teszi lehetővé, hogy bejelentkezés nélkül (fake user ID-val) is létrehozhass workspace-t.

DO $$
BEGIN
    -- workspaces.owner_id kényszer eltávolítása
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'workspaces_owner_id_fkey') THEN
        ALTER TABLE workspaces DROP CONSTRAINT workspaces_owner_id_fkey;
    END IF;

    -- workspace_members.user_id kényszer eltávolítása
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'workspace_members_user_id_fkey') THEN
        ALTER TABLE workspace_members DROP CONSTRAINT workspace_members_user_id_fkey;
    END IF;

    -- projects.created_by kényszer eltávolítása
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'projects_created_by_fkey') THEN
        ALTER TABLE projects DROP CONSTRAINT projects_created_by_fkey;
    END IF;
END $$;

-- 3. Opcionális: Ha a fenti constraint nevek nem egyeznek, próbáld meg kikeresni őket:
-- SELECT constraint_name, table_name FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_name IN ('workspaces', 'workspace_members', 'projects');
