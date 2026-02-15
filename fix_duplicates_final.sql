-- FIX DUPLICATES FINAL
-- This script specifically cleans up the "Csilla" duplicates found in the inspection.
-- It merges legacy "Csilla" records into "Jakus Csilla" (Auth User).

BEGIN;

-- 1. Identify the Target User (The one we want to KEEP)
-- ID: fb8d24f1-8b81-439a-84b2-0dfee13e874b (Jakus Csilla, hellocsillu@gmail.com)

-- 2. Update TASKS that might be assigned to the duplicates
-- We look for any 'Csilla' record that has NO EMAIL (Legacy/Ghost)
UPDATE public.tasks
SET assignee_id = 'fb8d24f1-8b81-439a-84b2-0dfee13e874b'
WHERE assignee_id IN (
    SELECT id FROM public.people 
    WHERE name = 'Csilla' AND email IS NULL
);

-- 3. Delete the duplicates
DELETE FROM public.people
WHERE name = 'Csilla' AND email IS NULL;

-- 4. Check for other potential duplicates (by exact name match) that have NULL email vs NOT NULL email
-- (Optional safety cleanup for others if they exist)

COMMIT;
