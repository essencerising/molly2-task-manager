-- Add contact_id to tasks table for CRM integration
-- Run this in Supabase SQL Editor

-- 1. Add contact_id column
alter table tasks 
add column if not exists contact_id uuid references contacts(id) on delete set null;

-- 2. Create index for faster lookups (e.g. "show all tasks for this contact")
create index if not exists idx_tasks_contact_id on tasks(contact_id);

-- 3. Update RLS policies (usually not needed if just adding a column, but good practice to verify)
-- Existing policies for 'tasks' should cover this new column automatically 
-- as long as they are row-based (select * from tasks where workspace_id = ...).
