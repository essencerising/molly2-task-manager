import { fetchWorkspaceMembers } from './workspaceService';
import { supabase } from './supabaseClient';
import type { Person } from '@/types/people';

export async function fetchPeople(workspaceId: string): Promise<Person[]> {
  if (!workspaceId) return [];

  try {
    // 1. Fetch from 'people' table (Legacy & Synced) - This is the primary source for Task Assignments
    const { data: peopleData, error: peopleError } = await supabase
      .from('people')
      .select('*')
      // If people table has workspace_id, filter by it. If not, we might get everyone?
      // Assuming it does, or we filter later. 
      // Safe bet: Fetch all and let's see. 
      // Actually, if we don't know the schema, we should be careful.
      // But we know 'createPerson' used to work.
      // Let's assume there is NO RLS on people or it allows access.
      .order('name');

    if (peopleError) {
      console.error('Error fetching people table:', peopleError);
      // Fallback to workspace members if people table fails?
      // No, if people table fails, we have bigger issues.
    }

    // 2. Fetch workspace members for Roles
    const { data: members, error: memberError } = await supabase
      .from('workspace_members')
      .select(`
            user_id,
            role,
            user:profiles(email)
        `)
      .eq('workspace_id', workspaceId);

    const people = peopleData || [];
    const memberMap = new Map();
    if (members) {
      members.forEach((m: any) => {
        if (m.user?.email) {
          memberMap.set(m.user.email, m.role);
        }
      });
    }

    // 3. Merge
    // We strictly return people from the 'people' table because tasks point to them.
    const mergedPeople = people.map((p: any) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      avatar_url: p.avatar_url || null, // If people table has avatar
      role: memberMap.get(p.email) || 'member', // Default to member if not in workspace list but in people list
      area: p.area,
      created_at: p.created_at
    }));
    return mergedPeople;

  } catch (error) {
    console.error('Error fetching people:', error);
    return [];
  }
}
// ------------------------------------------------------------------
// Legacy / Compatibility functions for Task Editor
// ------------------------------------------------------------------

import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { inviteMember } from './workspaceService';

export async function getPeopleByArea(area: string): Promise<Person[]> {
  // In the new system, people belong to the workspace, not specific areas.
  // We fetch all members of the current workspace.
  // We access the store directly to get the ID (outside React component).
  const workspaceId = useWorkspaceStore.getState().currentWorkspaceId;

  if (!workspaceId) {
    console.warn('getPeopleByArea: No workspace selected.');
    return [];
  }

  return fetchPeople(workspaceId);
}

export async function createPerson(input: { name: string; email?: string; area?: string }): Promise<Person> {
  const workspaceId = useWorkspaceStore.getState().currentWorkspaceId;

  if (!workspaceId) {
    throw new Error('Nem hozható létre személy: nincs kiválasztott munkaterület.');
  }

  // If email is provided, we try to invite the user to the workspace
  if (input.email) {
    const result = await inviteMember(workspaceId, input.email);

    if (!result.success) {
      throw new Error(result.message);
    }

    // If successful, we return a Person object.
    // Ideally we should fetch the profile, but for now we construct it optimistically.
    return {
      id: result.user_id || crypto.randomUUID(), // Fallback ID if RPC didn't return one (shouldn't happen)
      name: input.name, // The user's real name might be different, but this is what we have now
      email: input.email,
      avatar_url: null,
      role: 'member'
    };
  }

  // If NO email is provided (legacy "local" person?), we can't really support it in the new system
  // where tasks are assigned to Users (Profiles).
  // Depending on requirements, we could block this or create a placeholder.
  // For now, to allow the UI to function, we throw an error explaining this limitation.
  throw new Error('Személy hozzáadásához kötelező az email cím megadása (meghívás a munkaterületre).');
}
