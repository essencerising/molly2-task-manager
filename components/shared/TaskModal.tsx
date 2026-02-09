// TaskModal Component - Full task editing
'use client';

import { useState, useEffect } from 'react';
import { Modal, ModalFooter, Button, Input, Badge } from '@/components/ui';
import { useUIStore } from '@/stores';
import { fetchSubtasks, createSubtask, toggleSubtask, deleteSubtask } from '@/lib/subtasksService';
import { toast } from 'sonner';
import {
    Calendar,
    User,
    Tag,
    Repeat,
    CheckSquare,
    MessageSquare,
    Paperclip,
    Trash2,
    Plus,
    X,
    FolderKanban
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspaceStore } from '@/stores';

// Types
interface Subtask {
    id: string;
    title: string;
    is_completed: boolean;
}

interface Comment {
    id: string;
    content: string;
    author_email: string;
    created_at: string;
}

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
    project_id?: string | null; // ÚJ
}

interface TaskModalProps {
    task: TaskData | null;
    isOpen: boolean;
    onClose: () => void;
    onSave?: (task: TaskData) => void;
    onDelete?: (taskId: string) => void;
}

export function TaskModal({ task, isOpen, onClose, onSave, onDelete }: TaskModalProps) {
    // Reaktív store használat a getterek helyett
    const currentWorkspaceId = useWorkspaceStore(state => state.currentWorkspaceId);
    const workspaces = useWorkspaceStore(state => state.workspaces);
    const allProjects = useWorkspaceStore(state => state.projects);

    const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);
    // Ha van task workspace, akkor azt használjuk, különben az aktuálisat (ha nincs task, akkor újat hozunk létre az aktuálisban)
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
    const [projectId, setProjectId] = useState<string>(''); // ÚJ

    // Subtasks & Comments
    const [subtasks, setSubtasks] = useState<Subtask[]>([]);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [newCommentContent, setNewCommentContent] = useState('');

    // UI State
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'subtasks' | 'comments'>('details');

    // Load task data when it changes
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

            // Load subtasks from database
            if (task.id) {
                fetchSubtasks(task.id)
                    .then(data => setSubtasks(data))
                    .catch(err => console.error('Failed to load subtasks:', err));
            } else {
                setSubtasks([]);
            }

            // TODO: Load comments from database
            setComments([]);
        } else {
            // Reset all form fields when task is null
            setTitle('');
            setDescription('');
            setStatus('todo');
            setDueDate('');
            setFollowUpDate('');
            setRecurrenceType('none');
            setRecurrenceInterval(1);
            setProjectId('');
            setSubtasks([]);
            setComments([]);
        }
    }, [task]);

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
                project_id: projectId || null, // ÚJ (ha üres string, akkor null)
                workspace_id: task?.workspace_id || currentWorkspace?.id, // Meglévő vagy aktuális
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

    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim()) return;
        if (!task?.id) {
            toast.error('Mentsd el előbb a feladatot!');
            return;
        }

        try {
            const newSubtask = await createSubtask({
                task_id: task.id,
                title: newSubtaskTitle.trim(),
            });
            setSubtasks(prev => [...prev, newSubtask]);
            setNewSubtaskTitle('');
            toast.success('Részfeladat hozzáadva');
        } catch (error) {
            console.error('Failed to create subtask:', error);
            toast.error('Hiba a részfeladat létrehozásakor');
        }
    };

    const handleToggleSubtask = async (id: string) => {
        const subtask = subtasks.find(st => st.id === id);
        if (!subtask) return;

        try {
            await toggleSubtask(id, !subtask.is_completed);
            setSubtasks(prev =>
                prev.map(st => st.id === id ? { ...st, is_completed: !st.is_completed } : st)
            );
        } catch (error) {
            console.error('Failed to toggle subtask:', error);
            toast.error('Hiba a részfeladat frissítésekor');
        }
    };

    const handleDeleteSubtask = async (id: string) => {
        try {
            await deleteSubtask(id);
            setSubtasks(prev => prev.filter(st => st.id !== id));
            toast.success('Részfeladat törölve');
        } catch (error) {
            console.error('Failed to delete subtask:', error);
            toast.error('Hiba a részfeladat törlésekor');
        }
    };

    const handleAddComment = () => {
        if (!newCommentContent.trim()) return;

        const newComment: Comment = {
            id: `temp-${Date.now()}`,
            content: newCommentContent.trim(),
            author_email: 'Jelenlegi felhasználó',
            created_at: new Date().toISOString(),
        };

        setComments(prev => [...prev, newComment]);
        setNewCommentContent('');
    };

    const handleDelete = () => {
        if (!task?.id) return;
        if (confirm('Biztosan törlöd ezt a feladatot?')) {
            onDelete?.(task.id);
            onClose();
        }
    };

    const statusOptions = [
        { value: 'todo', label: 'Teendő', color: 'bg-amber-600' },
        { value: 'in_progress', label: 'Folyamatban', color: 'bg-sky-600' },
        { value: 'done', label: 'Kész', color: 'bg-emerald-600' },
    ];

    const recurrenceOptions = [
        { value: 'none', label: 'Nincs ismétlődés' },
        { value: 'daily', label: 'Naponta' },
        { value: 'weekly', label: 'Hetente' },
        { value: 'monthly', label: 'Havonta' },
        { value: 'yearly', label: 'Évente' },
    ];

    if (!task) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={task.id ? 'Feladat szerkesztése' : 'Új feladat'}
            size="lg"
        >
            {/* Tab Navigation */}
            <div className="flex gap-1 mb-6 p-1 bg-slate-800/50 rounded-lg">
                {[
                    { id: 'details' as const, label: 'Részletek', icon: Tag },
                    { id: 'subtasks' as const, label: `Részfeladatok (${subtasks.length})`, icon: CheckSquare },
                    { id: 'comments' as const, label: `Kommentek (${comments.length})`, icon: MessageSquare },
                ].map((tab) => (
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

            {/* Details Tab */}
            {activeTab === 'details' && (
                <div className="space-y-5">
                    {/* Title */}
                    <Input
                        label="Cím"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Mi a feladat?"
                    />

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300">Leírás</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Részletek, megjegyzések..."
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] resize-none"
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300">Státusz</label>
                        <div className="flex gap-2">
                            {statusOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setStatus(opt.value as TaskData['status'])}
                                    className={cn(
                                        'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                        status === opt.value
                                            ? `${opt.color} text-white shadow-lg`
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    )}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Project Selector (ÚJ) */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                            <FolderKanban size={14} />
                            Projekt
                        </label>
                        <select
                            value={projectId}
                            onChange={(e) => setProjectId(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="">Nincs projekt</option>
                            {/* Csak az aktuális workspace projektjeit listázzuk, vagy ha van task workspace, akkor azt */}
                            {/* Csak az adott workspace projektjeit listázzuk */}
                            {workspaceProjects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.icon ? `${p.icon} ` : ''}{p.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Dates Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                                <Calendar size={14} />
                                Határidő
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                                <User size={14} />
                                Follow-up
                            </label>
                            <input
                                type="date"
                                value={followUpDate}
                                onChange={(e) => setFollowUpDate(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>
                    </div>

                    {/* Recurrence */}
                    <div className="space-y-1.5">
                        <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
                            <Repeat size={14} />
                            Ismétlődés
                        </label>
                        <div className="flex gap-2 items-center">
                            <select
                                value={recurrenceType}
                                onChange={(e) => setRecurrenceType(e.target.value as TaskData['recurrence_type'])}
                                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                {recurrenceOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>

                            {recurrenceType && recurrenceType !== 'none' && (
                                <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <span>Minden</span>
                                    <input
                                        type="number"
                                        min={1}
                                        value={recurrenceInterval}
                                        onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                                        className="w-16 px-2 py-1 rounded border border-slate-700 bg-slate-900 text-slate-100 text-center"
                                    />
                                    <span>
                                        {recurrenceType === 'daily' ? 'nap' :
                                            recurrenceType === 'weekly' ? 'hét' :
                                                recurrenceType === 'monthly' ? 'hónap' : 'év'}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Subtasks Tab */}
            {activeTab === 'subtasks' && (
                <div className="space-y-4">
                    {/* Subtask list */}
                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {subtasks.length === 0 ? (
                            <p className="text-sm text-slate-500 italic text-center py-8">
                                Még nincs részfeladat. Adj hozzá egyet!
                            </p>
                        ) : (
                            subtasks.map((st) => (
                                <div
                                    key={st.id}
                                    className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 group"
                                >
                                    <input
                                        type="checkbox"
                                        checked={st.is_completed}
                                        onChange={() => handleToggleSubtask(st.id)}
                                        className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                                    />
                                    <span className={cn(
                                        'flex-1 text-sm',
                                        st.is_completed ? 'line-through text-slate-500' : 'text-slate-200'
                                    )}>
                                        {st.title}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteSubtask(st.id)}
                                        className="p-1 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add subtask */}
                    <div className="flex gap-2">
                        <Input
                            value={newSubtaskTitle}
                            onChange={(e) => setNewSubtaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                            placeholder="Új részfeladat..."
                            className="flex-1"
                        />
                        <Button onClick={handleAddSubtask} variant="secondary">
                            <Plus size={16} />
                        </Button>
                    </div>
                </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
                <div className="space-y-4">
                    {/* Comment list */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                        {comments.length === 0 ? (
                            <p className="text-sm text-slate-500 italic text-center py-8">
                                Még nincs komment.
                            </p>
                        ) : (
                            comments.map((c) => (
                                <div key={c.id} className="p-3 rounded-lg bg-slate-800/50">
                                    <div className="flex justify-between items-baseline mb-2">
                                        <span className="font-medium text-indigo-400 text-sm">{c.author_email}</span>
                                        <span className="text-xs text-slate-500">
                                            {new Date(c.created_at).toLocaleString('hu-HU')}
                                        </span>
                                    </div>
                                    <p className="text-sm text-slate-300 whitespace-pre-wrap">{c.content}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add comment */}
                    <div className="flex gap-2 items-start">
                        <textarea
                            value={newCommentContent}
                            onChange={(e) => setNewCommentContent(e.target.value)}
                            placeholder="Írj egy kommentet..."
                            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-700 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[60px] resize-none"
                        />
                        <Button onClick={handleAddComment} variant="primary">
                            Küldés
                        </Button>
                    </div>
                </div>
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
    );
}
