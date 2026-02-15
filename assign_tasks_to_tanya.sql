-- Assign homeless tasks to Tanya workspace
-- We found 7 tasks assigned to Jakus Csilla that have NULL workspace_id.
-- We will move them to 'Tanya' workspace so she can see them.

BEGIN;

UPDATE public.tasks
SET workspace_id = 'eca21b92-11ba-41a3-b666-1caafb6e33a2' -- Tanya
WHERE assignee_id = 'fb8d24f1-8b81-439a-84b2-0dfee13e874b' -- Jakus Csilla
AND workspace_id IS NULL;

COMMIT;
