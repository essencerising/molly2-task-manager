'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore, useWorkspaceStore } from '@/stores';
import { deleteProject } from '@/lib/workspaceService';
import { Button } from '@/components/ui';
import { CreateProjectModal } from '@/components/shared';
import { Trash2, Edit, ArrowLeft, MoreVertical } from 'lucide-react';
import { toast } from 'sonner';

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id } = use(params);

    const router = useRouter();
    const { projects, removeProject, initialize, isInitialized } = useWorkspaceStore();
    const { openProjectModal } = useUIStore();

    useEffect(() => {
        if (!isInitialized) initialize();
    }, [isInitialized, initialize]);

    // Find project from store
    const project = projects.find(p => p.id === id);

    const handleDelete = async () => {
        if (!project) return;
        if (!confirm('Biztosan törölni szeretnéd ezt a projektet? A művelet nem visszavonható.')) return;

        try {
            await deleteProject(project.id);
            removeProject(project.id);
            toast.success('Projekt törölve');
            router.push('/dashboard');
        } catch (error) {
            console.error('Delete project error:', error);
            toast.error('Hiba a projekt törlésekor');
        }
    };

    if (!project) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <p>A projekt nem található vagy törölve lett.</p>
                <Button variant="ghost" className="mt-4" onClick={() => router.push('/dashboard')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Vissza a Dashboardra
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                        style={{ backgroundColor: project.color || '#6366F1' }}
                    >
                        <span className="text-xl font-bold text-white uppercase">
                            {project.name.substring(0, 2)}
                        </span>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">{project.name}</h1>
                        {project.description && (
                            <p className="text-slate-400 text-sm mt-1">{project.description}</p>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openProjectModal(project.id)}
                        className="text-slate-400 hover:text-white"
                    >
                        <Edit className="h-4 w-4 mr-2" />
                        Szerkesztés
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Törlés
                    </Button>
                </div>
            </div>

            {/* Content Placeholder */}
            <div className="flex-1 bg-slate-900/50 rounded-xl border border-slate-800 p-6 flex flex-col items-center justify-center text-slate-500">
                <p>Itt lesznek a projekt feladatai listázva.</p>
                <p className="text-sm mt-2">(Fejlesztés alatt)</p>
            </div>

            {/* Modal for editing is already mounted in Sidebar/Layout, but we can rely on it being global */}
        </div>
    );
}
