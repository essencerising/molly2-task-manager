// WorkspaceSwitcher Component - Modal for switching workspaces
'use client';

import { useState } from 'react';
import { useWorkspaceStore } from '@/stores';
import { Modal, Button, Input } from '@/components/ui';
import { createWorkspace } from '@/lib/workspaceService';
import {
    Building2,
    Plus,
    Check,
    ChevronRight,
    Settings,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WorkspaceSwitcherProps {
    isOpen: boolean;
    onClose: () => void;
}

const colorOptions = [
    '#6366F1', // Indigo
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F97316', // Orange
    '#EAB308', // Yellow
    '#22C55E', // Green
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
];

export function WorkspaceSwitcher({ isOpen, onClose }: WorkspaceSwitcherProps) {
    const {
        workspaces,
        currentWorkspaceId,
        setCurrentWorkspace,
        addWorkspace
    } = useWorkspaceStore();

    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState(colorOptions[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelectWorkspace = (id: string) => {
        setCurrentWorkspace(id);
        onClose();
        toast.success('Workspace váltva');
    };

    const handleCreateWorkspace = async () => {
        if (!newName.trim()) {
            toast.error('Add meg a workspace nevét');
            return;
        }

        setIsSubmitting(true);
        try {
            const workspace = await createWorkspace({
                name: newName.trim(),
                color: newColor,
            });
            addWorkspace(workspace);
            setNewName('');
            setIsCreating(false);
            toast.success('Workspace létrehozva');
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Hiba a létrehozás során');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Workspace váltás"
            size="md"
        >
            <div className="space-y-4">
                {/* Workspace List */}
                <div className="space-y-2">
                    {workspaces.length === 0 ? (
                        <p className="text-slate-400 text-center py-8">
                            Még nincs workspace-ed. Hozz létre egyet!
                        </p>
                    ) : (
                        workspaces.map((ws) => (
                            <button
                                key={ws.id}
                                onClick={() => handleSelectWorkspace(ws.id)}
                                className={cn(
                                    'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                                    'hover:bg-slate-800',
                                    currentWorkspaceId === ws.id
                                        ? 'bg-slate-800 ring-2 ring-indigo-500'
                                        : 'bg-slate-900/50'
                                )}
                            >
                                {/* Icon */}
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                                    style={{ backgroundColor: ws.color }}
                                >
                                    <Building2 size={20} />
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-slate-200">{ws.name}</p>
                                    <p className="text-xs text-slate-500">{ws.slug}</p>
                                </div>

                                {/* Selected indicator */}
                                {currentWorkspaceId === ws.id && (
                                    <Check size={20} className="text-indigo-400" />
                                )}
                            </button>
                        ))
                    )}
                </div>

                {/* Divider */}
                <div className="border-t border-slate-800" />

                {/* Create New Workspace */}
                {isCreating ? (
                    <div className="space-y-4 p-4 bg-slate-900/50 rounded-xl">
                        <Input
                            label="Workspace neve"
                            placeholder="pl. Cégem, Személyes, Projekt X"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            autoFocus
                        />

                        {/* Color Picker */}
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Szín
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {colorOptions.map((color) => (
                                    <button
                                        key={color}
                                        onClick={() => setNewColor(color)}
                                        className={cn(
                                            'w-8 h-8 rounded-lg transition-all',
                                            newColor === color && 'ring-2 ring-white ring-offset-2 ring-offset-slate-900'
                                        )}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 justify-end">
                            <Button
                                variant="ghost"
                                onClick={() => setIsCreating(false)}
                            >
                                Mégse
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleCreateWorkspace}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Létrehozás...' : 'Létrehozás'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3"
                        onClick={() => setIsCreating(true)}
                    >
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
                            <Plus size={20} className="text-slate-400" />
                        </div>
                        <span className="text-slate-300">Új workspace létrehozása</span>
                    </Button>
                )}
            </div>
        </Modal>
    );
}
