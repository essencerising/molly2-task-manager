-- Function to add a team member by email
-- This encapsulates the logic: Lookup user -> Insert member -> Handle duplicates
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
BEGIN
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
