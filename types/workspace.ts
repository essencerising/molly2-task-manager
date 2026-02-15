// types/workspace.ts - Workspace és Project típusok

export type WorkspaceMemberRole = 'owner' | 'admin' | 'member' | 'viewer';
export type ProjectStatus = 'active' | 'archived' | 'completed';

export interface Workspace {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    color: string;
    icon: string | null;
    owner_id: string;
    created_at: string;
    updated_at: string;
}

export interface WorkspaceMember {
    id: string;
    workspace_id: string;
    user_id: string;
    role: WorkspaceMemberRole;
    joined_at: string;
    // Joined user data
    user?: {
        id: string;
        email: string;
        full_name: string | null;
        avatar_url: string | null;
    };
}

export interface Project {
    id: string;
    workspace_id: string;
    name: string;
    description: string | null;
    color: string;
    icon: string | null;
    status: ProjectStatus;
    due_date: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    // Computed/joined fields
    task_count?: number;
    completed_task_count?: number;
}

// Input types for CRUD operations
export interface CreateWorkspaceInput {
    name: string;
    slug?: string;
    description?: string;
    color?: string;
    icon?: string;
}

export interface UpdateWorkspaceInput {
    id: string;
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
}

export interface CreateProjectInput {
    workspace_id: string;
    name: string;
    description?: string;
    color?: string;
    icon?: string;
    due_date?: string;
}

export interface UpdateProjectInput {
    id: string;
    name?: string;
    description?: string;
    color?: string;
    icon?: string;
    status?: ProjectStatus;
    due_date?: string | null;
}

export interface InviteMemberInput {
    workspace_id: string;
    email: string;
    role?: WorkspaceMemberRole;
}
