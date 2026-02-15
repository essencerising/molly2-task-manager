// lib/eventsService.ts
import { supabase } from './supabaseClient';

export interface CalendarEvent {
    id: string;
    title: string;
    description: string | null;
    start_time: string;
    end_time: string;
    is_all_day: boolean;
    location: string | null;
    workspace_id: string;
    created_at: string;
    updated_at: string;
    created_by: string | null;
}

export interface CreateEventInput {
    title: string;
    description?: string;
    startTime: string; // ISO string
    endTime: string;   // ISO string
    isAllDay?: boolean;
    location?: string;
    workspaceId: string;
}

export interface UpdateEventInput {
    id: string;
    title?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    isAllDay?: boolean;
    location?: string;
}

export async function fetchEvents(workspaceId: string, startDate?: string, endDate?: string) {
    let query = supabase
        .from('events')
        .select('*')
        .eq('workspace_id', workspaceId);

    // Filter by date range if provided (overlaps)
    if (startDate && endDate) {
        // Event starts before end of view AND ends after start of view
        query = query
            .lt('start_time', endDate)
            .gt('end_time', startDate);
    }

    const { data, error } = await query.order('start_time', { ascending: true });

    if (error) {
        console.error('Error fetching events:', error);
        throw error;
    }

    return data as CalendarEvent[];
}

export async function createEvent(input: CreateEventInput) {
    const { data, error } = await supabase
        .from('events')
        .insert({
            title: input.title,
            description: input.description,
            start_time: input.startTime,
            end_time: input.endTime,
            is_all_day: input.isAllDay ?? false,
            location: input.location,
            workspace_id: input.workspaceId
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating event:', JSON.stringify(error, null, 2));
        throw error;
    }

    return data as CalendarEvent;
}

export async function updateEvent(input: UpdateEventInput) {
    const payload: any = {};
    if (input.title !== undefined) payload.title = input.title;
    if (input.description !== undefined) payload.description = input.description;
    if (input.startTime !== undefined) payload.start_time = input.startTime;
    if (input.endTime !== undefined) payload.end_time = input.endTime;
    if (input.isAllDay !== undefined) payload.is_all_day = input.isAllDay;
    if (input.location !== undefined) payload.location = input.location;

    const { data, error } = await supabase
        .from('events')
        .update(payload)
        .eq('id', input.id)
        .select()
        .single();

    if (error) {
        console.error('Error updating event:', error);
        throw error;
    }

    return data as CalendarEvent;
}

export async function deleteEvent(eventId: string) {
    const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

    if (error) {
        console.error('Error deleting event:', error);
        throw error;
    }
}
