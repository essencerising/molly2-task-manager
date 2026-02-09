import { useState, useEffect } from 'react';
import type { Task } from '@/types/tasks';
import type { Person } from '@/types/people';
import { getPeopleByArea, createPerson } from '@/lib/peopleService';
import {
    updateTaskDetails,
    fetchSubtasks,
    fetchComments,
    createSubtask,
    toggleSubtask,
    deleteSubtask,
    createComment
} from '@/lib/tasksService';
import { updateTaskSchema, createPersonSchema } from './taskSchema';
import { z, ZodError } from 'zod';
import { toast } from 'sonner';

interface UseTaskEditorProps {
    task: Task;
    onUpdated?: (task: Task) => void;
}

export function useTaskEditor({ task, onUpdated }: UseTaskEditorProps) {
    // Local state for form fields
    const [title, setTitle] = useState(task.title);
    const [description, setDescription] = useState(task.description ?? '');
    const [assigneeId, setAssigneeId] = useState<string>(task.assignee_id ?? '');
    const [followUpDate, setFollowUpDate] = useState(
        task.follow_up_at
            ? new Date(task.follow_up_at).toISOString().slice(0, 10)
            : ''
    );
    const [recurrenceType, setRecurrenceType] = useState<Task['recurrence_type']>(task.recurrence_type ?? 'none');
    const [recurrenceInterval, setRecurrenceInterval] = useState<number>(task.recurrence_interval ?? 1);

    // People management
    const [people, setPeople] = useState<Person[]>([]);
    const [isAddingPerson, setIsAddingPerson] = useState(false);
    const [newPersonName, setNewPersonName] = useState('');
    const [newPersonEmail, setNewPersonEmail] = useState('');

    // Subtasks & Comments state
    const [subtasks, setSubtasks] = useState<any[]>([]);
    const [comments, setComments] = useState<any[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newCommentContent, setNewCommentContent] = useState('');

    // Status flags
    const [isSaving, setIsSaving] = useState(false);
    const [isSavingPerson, setIsSavingPerson] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [personError, setPersonError] = useState<string | null>(null);

    // Load people on mount/area change
    useEffect(() => {
        let mounted = true;
        async function loadPeople() {
            try {
                const list = await getPeopleByArea(task.area);
                if (mounted) setPeople(list);
            } catch (e) {
                console.error(e);
                if (mounted) setPeople([]);
            }
        }
        loadPeople();
        return () => { mounted = false; };
    }, [task.area]);

    // Sync state with props if task changes externally
    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description ?? '');
        setAssigneeId(task.assignee_id ?? '');
        setFollowUpDate(
            task.follow_up_at
                ? new Date(task.follow_up_at).toISOString().slice(0, 10)
                : ''
        );
        setRecurrenceType(task.recurrence_type ?? 'none');
        setRecurrenceInterval(task.recurrence_interval ?? 1);
    }, [task]);

    // Load extra data (subtasks, comments)
    useEffect(() => {
        let mounted = true;
        async function loadExtras() {
            if (!task.id) return;
            try {
                const [subs, comms] = await Promise.all([
                    fetchSubtasks(task.id),
                    fetchComments(task.id)
                ]);
                if (mounted) {
                    setSubtasks(subs);
                    setComments(comms);
                }
            } catch (e) {
                console.error('Failed to load subtasks/comments', e);
            }
        }
        loadExtras();
        return () => { mounted = false; };
    }, [task.id]);

    const saveTask = async () => {
        setIsSaving(true);
        setError(null);
        try {
            // Validation
            const input = {
                title,
                description: description || null,
                assignee_id: assigneeId || null,
                follow_up_at: followUpDate ? new Date(followUpDate).toISOString() : null,
                recurrence_type: recurrenceType === 'none' ? null : recurrenceType,
                recurrence_interval: recurrenceInterval
            };

            const validated = updateTaskSchema.parse(input);

            // Check for changes
            const hasChanges =
                validated.title !== task.title ||
                validated.description !== task.description ||
                validated.assignee_id !== task.assignee_id ||
                validated.follow_up_at !== task.follow_up_at ||
                // @ts-ignore zod schema inference issue
                validated.recurrence_type !== task.recurrence_type ||
                // @ts-ignore zod schema inference issue
                validated.recurrence_interval !== task.recurrence_interval;

            if (!hasChanges) {
                setIsSaving(false);
                return;
            }

            await updateTaskDetails({
                id: task.id,
                title: validated.title,
                description: validated.description,
                assigneeId: validated.assignee_id,
                followUpAt: validated.follow_up_at,
                // @ts-ignore zod schema inference issue
                recurrenceType: validated.recurrence_type,
                // @ts-ignore zod schema inference issue
                recurrenceInterval: validated.recurrence_interval
            });

            onUpdated?.({
                ...task,
                ...validated,
                updated_at: new Date().toISOString()
            } as Task);

            toast.success('Feladat sikeresen mentve!');

        } catch (err) {
            if (err instanceof ZodError) {
                setError((err as any).errors[0].message);
            } else {
                console.error('Failed to save task:', err);
                setError('Nem sikerült menteni a feladatot.');
            }
            toast.error('Hiba történt a mentés során.');
        } finally {
            setIsSaving(false);
        }
    };

    const addPerson = async () => {
        setPersonError(null);
        setIsSavingPerson(true);
        try {
            const input = {
                name: newPersonName,
                email: newPersonEmail,
                area: task.area
            };

            const validated = createPersonSchema.parse(input);

            const created = await createPerson({
                name: validated.name,
                email: validated.email || undefined,
                area: validated.area
            });

            setPeople(prev => [...prev, created]);
            setAssigneeId(created.id);
            setNewPersonName('');
            setNewPersonEmail('');
            setIsAddingPerson(false);
            toast.success('Személy sikeresen hozzáadva!');

        } catch (err) {
            if (err instanceof ZodError) {
                setPersonError((err as any).errors[0].message);
            } else {
                console.error('Failed to create person:', err);
                setPersonError('Nem sikerült létrehozni a személyt.');
            }
            toast.error('Hiba történt a személy létrehozása során.');
        } finally {
            setIsSavingPerson(false);
        }
    };

    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim()) return;
        try {
            const created = await createSubtask(task.id, newSubtaskTitle.trim());
            setSubtasks(prev => [...prev, created]);
            setNewSubtaskTitle('');
            toast.success('Alfeladat hozzáadva');
        } catch (e) {
            console.error(e);
            toast.error('Hiba az alfeladat hozzáadásakor');
        }
    };

    const handleToggleSubtask = async (subtaskId: string, currentStatus: boolean) => {
        try {
            const updated = await toggleSubtask(subtaskId, !currentStatus);
            setSubtasks(prev => prev.map(st => st.id === subtaskId ? updated : st));
        } catch (e) {
            console.error(e);
            toast.error('Hiba az alfeladat frissítésekor');
        }
    };

    const handleDeleteSubtask = async (subtaskId: string) => {
        try {
            await deleteSubtask(subtaskId);
            setSubtasks(prev => prev.filter(st => st.id !== subtaskId));
            toast.success('Alfeladat törölve');
        } catch (e) {
            console.error(e);
            toast.error('Hiba az alfeladat törlésekor');
        }
    };

    // User state
    const [currentUserEmail, setCurrentUserEmail] = useState<string>('Jelenlegi felhasználó');

    // Load user
    useEffect(() => {
        // Dynamically import to ensure we use the client-side instance
        const { supabase } = require('@/lib/supabaseClient');

        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.email) {
                setCurrentUserEmail(user.email);
            }
        }
        loadUser();
    }, []);

    // ... (existing code)

    const handleAddComment = async () => {
        if (!newCommentContent.trim()) return;
        try {
            const created = await createComment(task.id, newCommentContent.trim(), currentUserEmail);
            setComments(prev => [...prev, created]);
            setNewCommentContent('');
            toast.success('Komment elküldve');
        } catch (e) {
            console.error(e);
            toast.error('Hiba a komment elküldésekor');
        }
    };

    return {
        formState: {
            title, setTitle,
            description, setDescription,
            assigneeId, setAssigneeId,
            followUpDate, setFollowUpDate,
            recurrenceType, setRecurrenceType,
            recurrenceInterval, setRecurrenceInterval
        },
        peopleState: {
            people,
            isAddingPerson, setIsAddingPerson,
            newPersonName, setNewPersonName,
            newPersonEmail, setNewPersonEmail
        },
        extrasState: {
            subtasks,
            comments,
            newSubtaskTitle, setNewSubtaskTitle,
            newCommentContent, setNewCommentContent
        },
        status: {
            isSaving,
            isSavingPerson,
            error,
            personError
        },
        actions: {
            saveTask,
            addPerson,
            handleAddSubtask,
            handleToggleSubtask,
            handleDeleteSubtask,
            handleAddComment
        }
    };
}
