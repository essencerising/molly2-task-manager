// TaskSubtasksTab - Subtasks tab for TaskModal
'use client';

import { useState } from 'react';
import { Button, Input } from '@/components/ui';
import { Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createSubtask, toggleSubtask, deleteSubtask } from '@/lib/subtasksService';
import { toast } from 'sonner';

export interface Subtask {
    id: string;
    title: string;
    is_completed: boolean;
}

interface TaskSubtasksTabProps {
    taskId?: string;
    subtasks: Subtask[];
    setSubtasks: React.Dispatch<React.SetStateAction<Subtask[]>>;
}

export function TaskSubtasksTab({ taskId, subtasks, setSubtasks }: TaskSubtasksTabProps) {
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

    const handleAdd = async () => {
        if (!newSubtaskTitle.trim()) return;
        if (!taskId) {
            toast.error('Mentsd el előbb a feladatot!');
            return;
        }

        try {
            const newSubtask = await createSubtask({
                task_id: taskId,
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

    const handleToggle = async (id: string) => {
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

    const handleDelete = async (id: string) => {
        try {
            await deleteSubtask(id);
            setSubtasks(prev => prev.filter(st => st.id !== id));
            toast.success('Részfeladat törölve');
        } catch (error) {
            console.error('Failed to delete subtask:', error);
            toast.error('Hiba a részfeladat törlésekor');
        }
    };

    return (
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
                                onChange={() => handleToggle(st.id)}
                                className="w-5 h-5 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                            />
                            <span className={cn(
                                'flex-1 text-sm',
                                st.is_completed ? 'line-through text-slate-500' : 'text-slate-200'
                            )}>
                                {st.title}
                            </span>
                            <button
                                onClick={() => handleDelete(st.id)}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                    placeholder="Új részfeladat..."
                    className="flex-1"
                />
                <Button onClick={handleAdd} variant="secondary">
                    <Plus size={16} />
                </Button>
            </div>
        </div>
    );
}
