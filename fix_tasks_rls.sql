-- Fix RLS policies for Tasks table
-- The user is seemingly unable to see tasks even in their own workspace.
-- We will reset the policies to ensure proper access.

BEGIN;

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop potential existing policies to ensure clean slate
DROP POLICY IF EXISTS "Enable read access for workspace members" ON public.tasks;
DROP POLICY IF EXISTS "Enable insert for workspace members" ON public.tasks;
DROP POLICY IF EXISTS "Enable update for workspace members" ON public.tasks;
DROP POLICY IF EXISTS "Enable delete for workspace members" ON public.tasks;

DROP POLICY IF EXISTS "Users can view tasks in their workspaces" ON public.tasks;
DROP POLICY IF EXISTS "Users can view tasks assigned to them" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their workspaces" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their workspaces" ON public.tasks;

-- 1. READ: Allow users to see tasks if they are in the workspace OR assigned to the task
CREATE POLICY "Enable read access for workspace members and assignees" ON public.tasks
FOR SELECT
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
  OR
  assignee_id = auth.uid()
);

-- 2. INSERT: Allow users to create tasks in workspaces they belong to
CREATE POLICY "Enable insert for workspace members" ON public.tasks
FOR INSERT
WITH CHECK (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

-- 3. UPDATE: Allow users to update tasks in their workspaces
CREATE POLICY "Enable update for workspace members" ON public.tasks
FOR UPDATE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

-- 4. DELETE: Allow users to delete tasks in their workspaces
CREATE POLICY "Enable delete for workspace members" ON public.tasks
FOR DELETE
USING (
  workspace_id IN (
    SELECT workspace_id FROM public.workspace_members
    WHERE user_id = auth.uid()
  )
);

COMMIT;
