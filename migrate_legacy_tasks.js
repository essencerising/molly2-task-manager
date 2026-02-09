
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://bivloufqwnwusmgtgdwa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpdmxvdWZxd253dXNtZ3RnZHdhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NDYyNDMsImV4cCI6MjA4NjEyMjI0M30.n33bHtt70058QB12egWETqvNeMTQzvP7CQeN4NYSNIY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('--- Starting Migration ---');

    // 1. Get Workspaces
    const { data: workspaces, error: wsError } = await supabase
        .from('workspaces')
        .select('id, name');

    if (wsError) {
        console.error('Error fetching workspaces:', wsError);
        return;
    }

    const workspaceMap = {};
    workspaces.forEach(w => {
        // Normalizáljuk a neveket kisbetűre a biztonságosabb egyezésért
        workspaceMap[w.name.trim().toLowerCase()] = w.id;
    });

    console.log('Available Workspaces:', workspaceMap);

    // 2. Get Active Legacy Tasks (no workspace_id, not archived)
    // Megjegyzés: A 'tasks' táblában ellenőrizzük az 'archived_at' oszlopot
    const { data: tasks, error: taskError } = await supabase
        .from('tasks')
        .select('id, title, area')
        .is('workspace_id', null)
        .is('archived_at', null);

    if (taskError) {
        console.error('Error fetching tasks:', taskError);
        return;
    }

    console.log(`Found ${tasks.length} active legacy tasks.`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const task of tasks) {
        if (!task.area) {
            console.log(`Skipping task "${task.title}" (no area)`);
            skippedCount++;
            continue;
        }

        const targetWorkspaceId = workspaceMap[task.area.trim().toLowerCase()];

        if (targetWorkspaceId) {
            console.log(`Migrating "${task.title}" (${task.area}) -> Workspace ID: ${targetWorkspaceId}`);

            const { error: updateError } = await supabase
                .from('tasks')
                .update({ workspace_id: targetWorkspaceId })
                .eq('id', task.id);

            if (updateError) {
                console.error(`Failed to update task ${task.id}:`, updateError);
            } else {
                migratedCount++;
            }
        } else {
            console.log(`Skipping "${task.title}" - No matching workspace found for area "${task.area}"`);
            skippedCount++;
        }
    }

    console.log('--- Migration Completed ---');
    console.log(`Migrated: ${migratedCount}`);
    console.log(`Skipped: ${skippedCount}`);
}

migrate();
