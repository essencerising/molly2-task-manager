// Contacts Service - CRUD operations for address book
import { supabase } from './supabaseClient';

export interface Contact {
    id: string;
    workspace_id: string;
    name: string;
    email: string | null;
    phone: string | null;
    company: string | null;
    role: string | null;
    notes: string;
    avatar_color: string | null;
    is_favorite: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateContactInput {
    workspace_id: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    role?: string;
    notes?: string;
    avatar_color?: string;
}

export interface UpdateContactInput {
    id: string;
    name?: string;
    email?: string | null;
    phone?: string | null;
    company?: string | null;
    role?: string | null;
    notes?: string;
    avatar_color?: string | null;
    is_favorite?: boolean;
}

// Generate a random avatar color
const AVATAR_COLORS = ['#6366F1', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#06B6D4', '#EF4444', '#F97316'];
export function randomAvatarColor(): string {
    return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

// Fetch all contacts for a workspace
export async function fetchContacts(workspaceId: string): Promise<Contact[]> {
    const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('is_favorite', { ascending: false })
        .order('name', { ascending: true });

    if (error) {
        console.error('fetchContacts error:', error);
        throw error;
    }

    return data || [];
}

// Create a new contact
export async function createContact(input: CreateContactInput): Promise<Contact> {
    const { data, error } = await supabase
        .from('contacts')
        .insert({
            workspace_id: input.workspace_id,
            name: input.name,
            email: input.email || null,
            phone: input.phone || null,
            company: input.company || null,
            role: input.role || null,
            notes: input.notes || '',
            avatar_color: input.avatar_color || randomAvatarColor(),
        })
        .select()
        .single();

    if (error) {
        console.error('createContact error:', error);
        throw error;
    }

    return data;
}

// Update a contact
export async function updateContact(input: UpdateContactInput): Promise<Contact> {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (input.name !== undefined) updateData.name = input.name;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.company !== undefined) updateData.company = input.company;
    if (input.role !== undefined) updateData.role = input.role;
    if (input.notes !== undefined) updateData.notes = input.notes;
    if (input.avatar_color !== undefined) updateData.avatar_color = input.avatar_color;
    if (input.is_favorite !== undefined) updateData.is_favorite = input.is_favorite;

    const { data, error } = await supabase
        .from('contacts')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

    if (error) {
        console.error('updateContact error:', error);
        throw error;
    }

    return data;
}

// Delete a contact
export async function deleteContact(contactId: string): Promise<void> {
    const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

    if (error) {
        console.error('deleteContact error:', error);
        throw error;
    }
}
