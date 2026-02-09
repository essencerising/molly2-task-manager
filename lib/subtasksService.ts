// Subtasks Service
import { supabase } from './supabaseClient';

export interface Subtask {
    id: string;
    task_id: string;
    title: string;
    is_completed: boolean;
    created_at: string;
}

export interface CreateSubtaskInput {
    task_id: string;
    title: string;
}

// Fetch subtasks for a task
export async function fetchSubtasks(taskId: string): Promise<Subtask[]> {
    const { data, error } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('fetchSubtasks error:', error);
        throw error;
    }

    return data || [];
}

// Create a new subtask
export async function createSubtask(input: CreateSubtaskInput): Promise<Subtask> {
    const { data, error } = await supabase
        .from('subtasks')
        .insert({
            task_id: input.task_id,
            title: input.title,
            is_completed: false,
        })
        .select()
        .single();

    if (error) {
        console.error('createSubtask error:', error);
        throw error;
    }

    return data;
}

// Toggle subtask completion
export async function toggleSubtask(subtaskId: string, isCompleted: boolean): Promise<void> {
    const { error } = await supabase
        .from('subtasks')
        .update({ is_completed: isCompleted })
        .eq('id', subtaskId);

    if (error) {
        console.error('toggleSubtask error:', error);
        throw error;
    }
}

// Delete a subtask
export async function deleteSubtask(subtaskId: string): Promise<void> {
    const { error } = await supabase
        .from('subtasks')
        .delete()
        .eq('id', subtaskId);

    if (error) {
        console.error('deleteSubtask error:', error);
        throw error;
    }
}
