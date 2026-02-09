'use client';

import { useState, useEffect } from 'react';
import { useUIStore, useWorkspaceStore } from '@/stores';
import { Modal, ModalFooter, Button } from '@/components/ui';
import { createProject as createProjectService, updateProject as updateProjectService } from '@/lib/workspaceService';
import { toast } from 'sonner';
import { Building2 } from 'lucide-react';

const COLORS = [
    '#6366F1', // Indigo
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Emerald
    '#3B82F6', // Blue
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#64748B', // Slate
];

export function CreateProjectModal() {
    const { isProjectModalOpen, closeProjectModal, editingProjectId } = useUIStore();
    const { getCurrentWorkspace, addProject, updateProject, projects } = useWorkspaceStore();

    const currentWorkspace = getCurrentWorkspace();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [color, setColor] = useState(COLORS[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initial load for editing
    useEffect(() => {
        if (isProjectModalOpen && editingProjectId) {
            const project = projects.find(p => p.id === editingProjectId);
            if (project) {
                setName(project.name);
                setDescription(project.description || '');
                setColor(project.color || COLORS[0]);
            }
        } else {
            // Reset form for new project
            setName('');
            setDescription('');
            setColor(COLORS[0]);
        }
    }, [isProjectModalOpen, editingProjectId, projects]);

    const handleClose = () => {
        closeProjectModal();
        // Reset form slightly delayed to avoid flicker
        setTimeout(() => {
            setName('');
            setDescription('');
            setColor(COLORS[0]);
        }, 300);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) return;
        if (!currentWorkspace) {
            toast.error('Nincs kiválasztott workspace');
            return;
        }

        setIsSubmitting(true);
        try {
            if (editingProjectId) {
                // Update existing
                const updated = await updateProjectService({
                    id: editingProjectId,
                    name,
                    description,
                    color,
                });
                updateProject(updated.id, updated);
                toast.success('Projekt frissítve');
            } else {
                // Create new
                const created = await createProjectService({
                    workspace_id: currentWorkspace.id,
                    name,
                    description,
                    color,
                });
                addProject(created);
                toast.success('Projekt létrehozva');
            }
            handleClose();
        } catch (error) {
            console.error(error);
            toast.error('Hiba történt a mentés során');
        } finally {
            setIsSubmitting(false);
        }
    };

    const isEditing = !!editingProjectId;

    return (
        <Modal
            isOpen={isProjectModalOpen}
            onClose={handleClose}
            title={isEditing ? 'Projekt szerkesztése' : 'Új projekt létrehozása'}
            description={isEditing ? 'Módosítsd a projekt adatait.' : 'Hozz létre egy új projektet a feladatok rendszerezéséhez.'}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Workspace Info (only for new projects) */}
                {currentWorkspace && !isEditing && (
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 flex items-center gap-3">
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: currentWorkspace.color || '#6366F1' }}
                        >
                            {currentWorkspace.icon ? (
                                <span className="text-lg">{currentWorkspace.icon}</span>
                            ) : (
                                <Building2 size={18} />
                            )}
                        </div>
                        <div>
                            <span className="block text-xs text-slate-500 uppercase tracking-wider font-medium">
                                Workspace
                            </span>
                            <span className="block text-sm font-semibold text-slate-200">
                                {currentWorkspace.name}
                            </span>
                        </div>
                    </div>
                )}

                {/* Name */}
                <div className="space-y-2">
                    <label htmlFor="project-name" className="text-sm font-medium text-slate-200">
                        Projekt neve
                    </label>
                    <input
                        id="project-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="pl. Weboldal Redesign"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                        autoFocus
                    />
                </div>

                {/* Description */}
                <div className="space-y-2">
                    <label htmlFor="project-desc" className="text-sm font-medium text-slate-200">
                        Leírás (opcionális)
                    </label>
                    <textarea
                        id="project-desc"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Rövid leírás a projektről..."
                        rows={3}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all resize-none"
                    />
                </div>

                {/* Color Picker */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-200">
                        Színkód
                    </label>
                    <div className="flex flex-wrap gap-3">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                type="button"
                                onClick={() => setColor(c)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${color === c
                                    ? 'border-white scale-110'
                                    : 'border-transparent hover:scale-105'
                                    }`}
                                style={{ backgroundColor: c }}
                                aria-label={`Szín választása: ${c}`}
                            />
                        ))}
                    </div>
                </div>

                <ModalFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Mégse
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={!name.trim() || isSubmitting}
                    >
                        {isSubmitting ? 'Mentés...' : (isEditing ? 'Mentés' : 'Létrehozás')}
                    </Button>
                </ModalFooter>
            </form>
        </Modal>
    );
}
