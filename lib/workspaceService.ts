// lib/workspaceService.ts - Workspace és Project CRUD műveletek
import { supabase } from './supabaseClient';
import type {
    Workspace,
    WorkspaceMember,
    Project,
    CreateWorkspaceInput,
    UpdateWorkspaceInput,
    CreateProjectInput,
    UpdateProjectInput,
} from '@/types/workspace';

// ------------------
// Workspace CRUD
// ------------------

// Generate slug from name
function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[áàâä]/g, 'a')
        .replace(/[éèêë]/g, 'e')
        .replace(/[íìîï]/g, 'i')
        .replace(/[óòôöő]/g, 'o')
        .replace(/[úùûüű]/g, 'u')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
}

// Fetch all workspaces for current user
export async function fetchWorkspaces(): Promise<Workspace[]> {
    const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        // Table may not exist yet or RLS blocking - return empty
        console.warn('fetchWorkspaces: Skipping (table may not exist yet)');
        return [];
    }

    return data || [];
}

// Fetch single workspace by ID
export async function fetchWorkspaceById(id: string): Promise<Workspace | null> {
    const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('fetchWorkspaceById error:', error);
        return null;
    }

    return data;
}

// Create new workspace
export async function createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
    const { data: userData } = await supabase.auth.getUser();

    // For development - allow creating workspace without auth
    const ownerId = userData.user?.id || '00000000-0000-0000-0000-000000000000';

    const slug = input.slug || generateSlug(input.name) + '-' + Date.now().toString(36);

    const { data, error } = await supabase
        .from('workspaces')
        .insert({
            name: input.name,
            slug,
            description: input.description || null,
            color: input.color || '#6366F1',
            icon: input.icon || null,
            owner_id: ownerId,
        })
        .select()
        .single();

    if (error) {
        console.error('createWorkspace error:', error);
        throw error;
    }

    // Also add owner as a member (only if authenticated)
    if (userData.user?.id) {
        await supabase.from('workspace_members').insert({
            workspace_id: data.id,
            user_id: userData.user.id,
            role: 'owner',
        });
    }

    return data;
}

// Update workspace
export async function updateWorkspace(input: UpdateWorkspaceInput): Promise<Workspace> {
    const { id, ...updates } = input;

    const { data, error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('updateWorkspace error:', error);
        throw error;
    }

    return data;
}

// Delete workspace
export async function deleteWorkspace(id: string): Promise<void> {
    const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('deleteWorkspace error:', error);
        throw error;
    }
}

// ------------------
// Workspace Members
// ------------------

// Fetch workspace members
export async function fetchWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    const { data, error } = await supabase
        .from('workspace_members')
        .select(`
      *,
      user:profiles(id, email, name, avatar_url)
    `)
        .eq('workspace_id', workspaceId)
        .order('joined_at', { ascending: true });

    if (error) {
        console.error('fetchWorkspaceMembers error:', error);
        throw error;
    }

    return data || [];
}

// ------------------
// Project CRUD
// ------------------

// Fetch all projects for a workspace
export async function fetchProjects(workspaceId: string): Promise<Project[]> {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('fetchProjects error:', error);
        throw error;
    }

    return data || [];
}

// Fetch all projects (all workspaces)
export async function fetchAllProjects(): Promise<Project[]> {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        // Table may not exist yet or RLS blocking - return empty
        console.warn('fetchAllProjects: Skipping (table may not exist yet)');
        return [];
    }

    return data || [];
}

// Fetch single project by ID
export async function fetchProjectById(id: string): Promise<Project | null> {
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('fetchProjectById error:', error);
        return null;
    }

    return data;
}

// Create new project
export async function createProject(input: CreateProjectInput): Promise<Project> {
    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
        .from('projects')
        .insert({
            workspace_id: input.workspace_id,
            name: input.name,
            description: input.description || null,
            color: input.color || '#6366F1',
            icon: input.icon || null,
            due_date: input.due_date || null,
            created_by: userData.user?.id,
        })
        .select()
        .single();

    if (error) {
        console.error('createProject error:', error);
        throw error;
    }

    return data;
}

// Update project
export async function updateProject(input: UpdateProjectInput): Promise<Project> {
    const { id, ...updates } = input;

    const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('updateProject error:', error);
        throw error;
    }

    return data;
}

// Delete (archive) project
export async function archiveProject(id: string): Promise<void> {
    const { error } = await supabase
        .from('projects')
        .update({ status: 'archived' })
        .eq('id', id);

    if (error) {
        console.error('archiveProject error:', error);
        throw error;
    }
}

// Hard delete project
export async function deleteProject(id: string): Promise<void> {
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('deleteProject error:', error);
        throw error;
    }
}
