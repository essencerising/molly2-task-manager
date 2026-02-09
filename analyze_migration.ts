
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bivloufqwnwusmgtgdwa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpdmxvdWZxd253dXNtZ3RnZHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDYyNDMsImV4cCI6MjA4NjEyMjI0M30.n33bHtt70058QB12egWETqvNeMTQzvP7CQeN4NYSNIY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyze() {
    console.log('--- Analyzing Legacy Areas ---');
    // Get all unique areas from tasks where workspace_id is null
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select('area, id')
        .is('workspace_id', null);

    if (error) {
        console.error('Error fetching tasks:', error);
        return;
    }

    const areaCounts: Record<string, number> = {};
    tasks.forEach((t: any) => {
        if (t.area) {
            areaCounts[t.area] = (areaCounts[t.area] || 0) + 1;
        }
    });

    console.log('Legacy Areas found (tasks without workspace):');
    console.table(areaCounts);

    console.log('\n--- Existing Workspaces ---');
    const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id, name, slug');

    if (wsError) {
        console.error('Error fetching workspaces:', wsError);
        return;
    }

    console.table(workspaces);
}

analyze();
