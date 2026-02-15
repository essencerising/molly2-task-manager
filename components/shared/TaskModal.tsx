// TaskModal Component - Main modal shell with tab navigation
'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalFooter, Button } from '@/components/ui';
import { toast } from 'sonner';
import { Tag, CheckSquare, MessageSquare, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores';
import { fetchSubtasks } from '@/lib/subtasksService';
import { fetchComments } from '@/lib/commentsService';
import { fetchContacts } from '@/lib/contactsService';
import { fetchPeople } from '@/lib/peopleService';
import type { Person } from '@/types/people';
import { TaskDetailsTab } from './TaskDetailsTab';
import { TaskSubtasksTab, Subtask } from './TaskSubtasksTab';
import { TaskCommentsTab, Comment } from './TaskCommentsTab';

// Types
export interface TaskData {
    id?: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    area?: string;
    due_date?: string | null;
    follow_up_at?: string | null;
    recurrence_type?: 'none' | 'daily' | 'weekly' | 'monthly';
    recurrence_interval?: number;
    workspace_id?: string;
    project_id?: string | null;
    contact_id?: string | null;
    assignee_id?: string | null;
}

interface TaskModalProps {
    task: TaskData | null;
    isOpen: boolean;
    onClose: () => void;
    onSave?: (task: TaskData) => void;
    onDelete?: (taskId: string) => void;
}

export function TaskModal({ task, isOpen, onClose, onSave, onDelete }: TaskModalProps) {
    const currentWorkspaceId = useWorkspaceStore(state => state.currentWorkspaceId);
    const workspaces = useWorkspaceStore(state => state.workspaces);
    const allProjects = useWorkspaceStore(state => state.projects);

    const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);
    const effectiveWorkspaceId = task?.workspace_id || currentWorkspaceId;
    const workspaceProjects = allProjects.filter(p => p.workspace_id === effectiveWorkspaceId);

    // Form state
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState<TaskData['status']>('todo');
    const [dueDate, setDueDate] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [recurrenceType, setRecurrenceType] = useState<TaskData['recurrence_type']>('none');
    const [recurrenceInterval, setRecurrenceInterval] = useState(1);
    const [projectId, setProjectId] = useState('');
    const [contactId, setContactId] = useState('');
    const [assigneeId, setAssigneeId] = useState('');

    // Data state
    const [workspaceContacts, setWorkspaceContacts] = useState<any[]>([]);
    const [people, setPeople] = useState<Person[]>([]);

    // Tab data
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);

    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'comments'>('details');

    // Load task data
    useEffect(() => {
        if (task) {
            setTitle(task.title || '');
            setDescription(task.description || '');
            setStatus(task.status || 'todo');
            setDueDate(task.due_date?.split('T')[0] || '');
            setFollowUpDate(task.follow_up_at?.split('T')[0] || '');
            setRecurrenceType(task.recurrence_type || 'none');
            setRecurrenceInterval(task.recurrence_interval || 1);
            setProjectId(task.project_id || '');
            setContactId(task.contact_id || '');
            setAssigneeId(task.assignee_id || '');

            if (task.id) {
                fetchSubtasks(task.id)
                    .then(data => setSubtasks(data))
                    .catch(err => console.error('Failed to load subtasks:', err));
                fetchComments(task.id)
                    .then(data => setComments(data))
                    .catch(err => console.error('Failed to load comments:', err));
            } else {
                setSubtasks([]);
                setComments([]);
            }
        } else {
            setTitle(''); setDescription(''); setStatus('todo');
            setDueDate(''); setFollowUpDate('');
            setRecurrenceType('none'); setRecurrenceInterval(1);
            setRecurrenceType('none'); setRecurrenceInterval(1);
            setProjectId(''); setContactId(''); setAssigneeId('');
            setSubtasks([]); setComments([]);
        }
    }, [task]);

    // Load contacts AND people
    useEffect(() => {
        if (effectiveWorkspaceId) {
            fetchContacts(effectiveWorkspaceId)
                .then(setWorkspaceContacts)
                .catch(err => console.error('Failed to load contacts:', err));

            fetchPeople(effectiveWorkspaceId)
                .then(setPeople)
                .catch(err => console.error('Failed to load people:', err));
        }
    }, [effectiveWorkspaceId]);

    // Handlers
    const handleSave = async () => {
        if (!title.trim()) {
            toast.error('A cím megadása kötelező');
            return;
        }
        setIsSaving(true);
        try {
            const updatedTask: TaskData = {
                ...task!,
                title: title.trim(),
                description: description.trim(),
                status,
                due_date: dueDate || undefined,
                follow_up_at: followUpDate || undefined,
                recurrence_type: recurrenceType,
                recurrence_interval: recurrenceInterval,
                project_id: projectId || null,
                contact_id: contactId || null,
                assignee_id: assigneeId || null,
                workspace_id: task?.workspace_id || currentWorkspace?.id,
            };
            onSave?.(updatedTask);
            toast.success('Feladat mentve');
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Hiba a mentés során');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = () => {
        if (!task?.id) return;
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (!task?.id) return;
        onDelete?.(task.id);
        setShowDeleteConfirm(false);
        onClose();
    };

    if (!task) return null;

    const tabs = [
        { id: 'details' as const, label: 'Részletek', icon: Tag },
        { id: 'subtasks' as const, label: `Részfeladatok (${subtasks.length})`, icon: CheckSquare },
        { id: 'comments' as const, label: `Kommentek (${comments.length})`, icon: MessageSquare },
    ];

    return (
        <>
            <Modal
                isOpen={isOpen}
                onClose={onClose}
                title={task.id ? 'Feladat szerkesztése' : 'Új feladat'}
                size="lg"
            >
                {/* Tab Navigation */}
                <div className="flex gap-1 mb-6 p-1 bg-slate-800/50 rounded-lg">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all',
                                activeTab === tab.id
                                    ? 'bg-slate-700 text-slate-100 shadow-sm'
                                    : 'text-slate-400 hover:text-slate-200'
                            )}
                        >
                            <tab.icon size={16} />
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                {activeTab === 'details' && (
                    <TaskDetailsTab
                        title={title} setTitle={setTitle}
                        description={description} setDescription={setDescription}
                        status={status} setStatus={setStatus}
                        dueDate={dueDate} setDueDate={setDueDate}
                        followUpDate={followUpDate} setFollowUpDate={setFollowUpDate}
                        recurrenceType={recurrenceType} setRecurrenceType={setRecurrenceType}
                        recurrenceInterval={recurrenceInterval} setRecurrenceInterval={setRecurrenceInterval}
                        projectId={projectId} setProjectId={setProjectId}
                        workspaceProjects={workspaceProjects}
                        contactId={contactId} setContactId={setContactId}
                        workspaceContacts={workspaceContacts}
                        assigneeId={assigneeId} setAssigneeId={setAssigneeId}
                        people={people}
                    />
                )}

                {activeTab === 'subtasks' && (
                    <TaskSubtasksTab
                        taskId={task.id}
                        subtasks={subtasks}
                        setSubtasks={setSubtasks}
                    />
                )}

                {activeTab === 'comments' && (
                    <TaskCommentsTab
                        taskId={task.id}
                        comments={comments}
                        setComments={setComments}
                    />
                )}

                {/* Footer */}
                <ModalFooter className="flex justify-between">
                    <div>
                        {task.id && (
                            <Button variant="ghost" onClick={handleDelete} className="text-red-400 hover:text-red-300">
                                <Trash2 size={16} />
                                Törlés
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose}>
                            Mégse
                        </Button>
                        <Button variant="primary" onClick={handleSave} isLoading={isSaving}>
                            Mentés
                        </Button>
                    </div>
                </ModalFooter>
            </Modal>

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-sm">
                    <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 shadow-2xl border border-slate-700">
                        <h3 className="text-lg font-semibold text-white mb-2">Biztos törölni szeretnéd?</h3>
                        <p className="text-slate-300 text-sm mb-6">
                            A feladat archiválásra kerül és később visszakereshető lesz az archívumban.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button
                                variant="ghost"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="text-slate-400 hover:text-white"
                            >
                                Mégse
                            </Button>
                            <Button
                                onClick={confirmDelete}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Törlés
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
