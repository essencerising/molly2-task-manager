import { fetchWorkspaceMembers } from './workspaceService';
import type { WorkspaceMember } from '@/types/workspace';

export interface Person {
  id: string; // User ID
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
}

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
      role: member.role
    }));
  } catch (error) {
    console.error('Error fetching people:', error);
    return [];
  }
}
