-- Kapcsolatok javítása a táblák között
-- Ez szükséges ahhoz, hogy a Supabase össze tudja kapcsolni a táblákat (pl. tagok + profil képek)

-- 1. Workspace Members -> Profiles kapcsolat
-- Ha ez hiányzik, a "user:profiles" join nem működik
DO $$
BEGIN
    -- Először eldobjuk a régi kényszert, ha létezik (hogy ne akadjon össze)
    BEGIN
        ALTER TABLE public.workspace_members
        DROP CONSTRAINT IF EXISTS workspace_members_user_id_fkey;
    EXCEPTION
        WHEN undefined_object THEN NULL;
    END;

    -- Létrehozzuk az újat, ami direktbe a profiles táblára mutat
    ALTER TABLE public.workspace_members
    ADD CONSTRAINT workspace_members_profile_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
END $$;

-- 2. Tasks -> Profiles kapcsolat (Assignee)
-- Ellenőrzés: biztosítjuk, hogy a tasks tábla is a profiles-ra mutasson
DO $$
BEGIN
    BEGIN
        ALTER TABLE public.tasks
        DROP CONSTRAINT IF EXISTS tasks_assignee_id_fkey;
    EXCEPTION
        WHEN undefined_object THEN NULL;
    END;

    ALTER TABLE public.tasks
    ADD CONSTRAINT tasks_assignee_id_fkey
    FOREIGN KEY (assignee_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
END $$;
