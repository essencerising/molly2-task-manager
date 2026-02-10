// Notes Service - CRUD operations for quick notes
import { supabase } from './supabaseClient';

export interface Note {
    id: string;
    workspace_id: string;
    title: string;
    content: string;
    is_pinned: boolean;
    color: string | null;
    created_at: string;
    updated_at: string;
}

export interface CreateNoteInput {
    workspace_id: string;
    title: string;
    content?: string;
    color?: string;
}

export interface UpdateNoteInput {
    id: string;
    title?: string;
    content?: string;
    is_pinned?: boolean;
    color?: string | null;
}

// Fetch all notes for a workspace
export async function fetchNotes(workspaceId: string): Promise<Note[]> {
    const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('is_pinned', { ascending: false })
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('fetchNotes error:', error);
        throw error;
    }

    return data || [];
}

// Create a new note
export async function createNote(input: CreateNoteInput): Promise<Note> {
    const { data, error } = await supabase
        .from('notes')
        .insert({
            workspace_id: input.workspace_id,
            title: input.title,
            content: input.content || '',
            color: input.color || null,
        })
        .select()
        .single();

    if (error) {
        console.error('createNote error:', error);
        throw error;
    }

    return data;
}

// Update a note
export async function updateNote(input: UpdateNoteInput): Promise<Note> {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (input.title !== undefined) updateData.title = input.title;
    if (input.content !== undefined) updateData.content = input.content;
    if (input.is_pinned !== undefined) updateData.is_pinned = input.is_pinned;
    if (input.color !== undefined) updateData.color = input.color;

    const { data, error } = await supabase
        .from('notes')
        .update(updateData)
        .eq('id', input.id)
        .select()
        .single();

    if (error) {
        console.error('updateNote error:', error);
        throw error;
    }

    return data;
}

// Delete a note
export async function deleteNote(noteId: string): Promise<void> {
    const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

    if (error) {
        console.error('deleteNote error:', error);
        throw error;
    }
}
