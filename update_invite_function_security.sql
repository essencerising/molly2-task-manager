-- Function to add a team member by email
-- UPDATED: Added security check for auth.uid() role
-- UPDATED: Sync to people table to ensure Task Assignments work
CREATE OR REPLACE FUNCTION add_team_member_by_email(
    p_workspace_id UUID,
    p_email TEXT,
    p_role TEXT DEFAULT 'member'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/service_role)
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_profile_exists BOOLEAN;
    v_current_user_role TEXT;
BEGIN
    -- 0. Security Check: Ensure caller is admin or owner of the workspace
    SELECT role INTO v_current_user_role
    FROM public.workspace_members
    WHERE workspace_id = p_workspace_id
    AND user_id = auth.uid();

    IF v_current_user_role IS NULL OR v_current_user_role NOT IN ('owner', 'admin') THEN
         RETURN json_build_object(
            'success', FALSE,
            'message', 'Nincs jogosultsága új tagot hozzáadni ehhez a munkaterülethez.'
        );
    END IF;

    -- 1. Look up user by email in profiles table
    -- (We assume profiles are synced with auth.users and contain emails)
    SELECT id INTO v_user_id
    FROM public.profiles
    WHERE email = p_email
    LIMIT 1;

    -- 2. If user not found, return error
    IF v_user_id IS NULL THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', 'Nem található felhasználó ezzel az email címmel a rendszerben.'
        );
    END IF;

    -- 3. Check if already a member
    IF EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = p_workspace_id AND user_id = v_user_id
    ) THEN
        RETURN json_build_object(
            'success', FALSE,
            'message', 'Ez a felhasználó már tagja a munkaterületnek.'
        );
    END IF;

    -- 4. Insert into workspace_members
    INSERT INTO public.workspace_members (workspace_id, user_id, role)
    VALUES (p_workspace_id, v_user_id, p_role);

    -- 5. Sync to people table (for Task Assignments)
    -- Use ON CONFLICT (id) because 'id' is the primary key and guaranteed unique
    INSERT INTO public.people (id, name, email)
    SELECT 
        v_user_id, 
        (SELECT full_name FROM public.profiles WHERE id = v_user_id),
        p_email
    ON CONFLICT (id) DO UPDATE 
    SET 
        name = COALESCE(EXCLUDED.name, public.people.name),
        email = COALESCE(EXCLUDED.email, public.people.email);

    RETURN json_build_object(
        'success', TRUE,
        'message', 'Felhasználó sikeresen hozzáadva!',
        'user_id', v_user_id
    );

EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', FALSE,
        'message', 'Hiba történt a művelet során: ' || SQLERRM
    );
END;
$$;

-- ONE-TIME SYNC: Populate people table from existing profiles/members
-- Use ON CONFLICT (id) to update existing records or insert new ones
-- Use DISTINCT ON (p.id) to avoid trying to insert/update the same ID key multiple times if user is in multiple workspaces
INSERT INTO public.people (id, name, email)
SELECT DISTINCT ON (p.id)
    p.id,
    COALESCE(p.full_name, p.email),
    p.email
FROM public.profiles p
JOIN public.workspace_members wm ON wm.user_id = p.id
ORDER BY p.id
ON CONFLICT (id) DO UPDATE 
SET 
    name = COALESCE(EXCLUDED.name, public.people.name),
    email = COALESCE(EXCLUDED.email, public.people.email);
