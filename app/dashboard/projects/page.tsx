'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore, useUIStore } from '@/stores';
import { Button, Badge } from '@/components/ui';
import { Plus, FolderKanban, ArrowLeft } from 'lucide-react';
import type { Project } from '@/types/workspace';

export default function ProjectsPage() {
    const router = useRouter();
    const { projects, workspaces, currentWorkspaceId, initialize, isInitialized } = useWorkspaceStore();
    const { openProjectModal } = useUIStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function init() {
            if (!isInitialized) {
                await initialize();
            }
            setLoading(false);
        }
        init();
    }, [isInitialized, initialize]);

    const handleProjectClick = (projectId: string) => {
        router.push(`/dashboard/projects/${projectId}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-slate-400">
                <p>Betöltés...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-slate-950 text-slate-100 p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard')}
                        className="text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Vissza
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Projektek</h1>
                        <p className="text-slate-400 text-sm mt-1">
                            Összes projekt: {projects.length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Projects Grid */}
            {projects.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-16">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 rounded-full blur-xl opacity-30 bg-indigo-500" />
                        <div className="relative p-5 rounded-2xl bg-indigo-950/50 ring-1 ring-indigo-500/20">
                            <span className="text-4xl block">📁</span>
                        </div>
                    </div>
                    <p className="text-lg font-semibold text-slate-200 mb-2">Még nincs projekt</p>
                    <p className="text-sm text-slate-400">A projektek segítenek rendszerezni a feladataidat. Hozz létre egyet!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.map((project) => (
                        <ProjectCard
                            key={project.id}
                            project={project}
                            onClick={() => handleProjectClick(project.id)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

interface ProjectCardProps {
    project: Project;
    onClick: () => void;
}

function ProjectCard({ project, onClick }: ProjectCardProps) {
    const workspaces = useWorkspaceStore(state => state.workspaces);
    const workspace = workspaces.find(w => w.id === project.workspace_id);

    return (
        <div
            onClick={onClick}
            className="group bg-slate-900/50 rounded-xl border border-slate-800 p-5 cursor-pointer hover:border-indigo-500/50 hover:bg-slate-800/80 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-200"
        >
            <div className="flex items-start gap-4">
                {/* Project Icon */}
                <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0"
                    style={{ backgroundColor: project.color || '#6366F1' }}
                >
                    <span className="text-xl font-bold text-white uppercase">
                        {project.icon || project.name.substring(0, 2)}
                    </span>
                </div>

                {/* Project Info */}
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-200 group-hover:text-slate-100 truncate">
                        {project.name}
                    </h3>
                    {project.description && (
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">
                            {project.description}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-3 text-xs">
                        {/* Workspace badge */}
                        {workspace && (
                            <Badge
                                variant="outline"
                                size="sm"
                                className="text-[10px]"
                                style={{
                                    backgroundColor: workspace.color ? `${workspace.color}15` : 'rgb(30 41 59)',
                                    borderColor: workspace.color || 'rgb(51 65 85)'
                                }}
                            >
                                {workspace.icon ? (
                                    <span className="mr-1">{workspace.icon}</span>
                                ) : (
                                    <span
                                        className="w-2 h-2 rounded-full mr-1"
                                        style={{ backgroundColor: workspace.color || '#6366F1' }}
                                    />
                                )}
                                {workspace.name}
                            </Badge>
                        )}
                        <span className="text-slate-500">
                            {new Date(project.created_at).toLocaleDateString('hu-HU')}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
