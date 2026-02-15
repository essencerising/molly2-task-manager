-- Migration script to consolidate duplicate 'people' records and reassign tasks
-- This fixes the issue where tasks were attached to old/legacy IDs but the UI shows new Auth IDs.

BEGIN;

-- 1. Identify duplicates:
-- Find people records that share an email with a Profile (Auth User) but have a DIFFERENT ID.
-- We want to merge the "Legacy ID" (different) into the "Auth ID" (profile).

-- Create a temporary table to map old_id -> new_id
CREATE TEMP TABLE people_merge_map AS
SELECT 
    p_legacy.id as old_id,
    p_auth.id as new_id
FROM public.people p_legacy
JOIN public.people p_auth ON p_legacy.email = p_auth.email
JOIN public.profiles pr ON pr.id = p_auth.id -- Ensure p_auth is the real, auth-linked user
WHERE p_legacy.id != p_auth.id;

-- 2. Update TASKS to point to the new Auth ID
UPDATE public.tasks
SET assignee_id = pm.new_id
FROM people_merge_map pm
WHERE public.tasks.assignee_id = pm.old_id;

-- 3. Update any other references if they exist (e.g. project leads? currently unassigned in schema)
-- If there are other tables referencing people.id, add similar UPDATE statements here.

-- 4. Delete the Legacy records from 'people' table
DELETE FROM public.people
WHERE id IN (SELECT old_id FROM people_merge_map);

-- 5. Drop the temp table
DROP TABLE people_merge_map;

COMMIT;
