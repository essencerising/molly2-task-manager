// Comments Service - CRUD operations for task comments
import { supabase } from './supabaseClient';

export interface Comment {
    id: string;
    task_id: string;
    content: string;
    author_email: string | null;
    created_at: string;
}

export interface CreateCommentInput {
    task_id: string;
    content: string;
    author_email?: string;
}

// Fetch comments for a task
export async function fetchComments(taskId: string): Promise<Comment[]> {
    const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('fetchComments error:', error);
        throw error;
    }

    return data || [];
}

// Create a new comment
export async function createComment(input: CreateCommentInput): Promise<Comment> {
    const { data, error } = await supabase
        .from('comments')
        .insert({
            task_id: input.task_id,
            content: input.content,
            author_email: input.author_email || 'Felhasználó',
        })
        .select()
        .single();

    if (error) {
        console.error('createComment error:', error);
        throw error;
    }

    return data;
}

// Delete a comment
export async function deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

    if (error) {
        console.error('deleteComment error:', error);
        throw error;
    }
}
