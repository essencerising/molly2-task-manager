import { fetchWorkspaceMembers } from './workspaceService';
import type { Person } from '@/types/people';

export async function fetchPeople(workspaceId: string): Promise<Person[]> {
  if (!workspaceId) return [];

  try {
    const members = await fetchWorkspaceMembers(workspaceId);

    // Transform WorkspaceMember to Person format for easier UI consumption
    return members.map(member => ({
      id: member.user_id,
      name: member.user?.full_name || member.user?.email || 'Névtelen',
      email: member.user?.email || '',
      avatar_url: member.user?.avatar_url || null,
      role: member.role,
      // Legacy fields to satisfy type if needed, or left undefined since they are optional now
    }));
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
