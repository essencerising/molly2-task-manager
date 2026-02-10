// Sidebar Component - Mobile-first with hamburger menu
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Calendar,
    FolderKanban,
    Settings,
    Plus,
    ChevronLeft,
    ChevronRight,
    Building2,
    Menu,
    X,
    StickyNote,
    Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore, useWorkspaceStore } from '@/stores';
import { Button } from '@/components/ui';
import { WorkspaceSwitcher, CreateProjectModal } from '@/components/shared';
import type { Project } from '@/types/workspace';

const mainNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/calendar', label: 'Naptár', icon: Calendar },
    { href: '/dashboard/projects', label: 'Projektek', icon: FolderKanban },
    { href: '/dashboard/notes', label: 'Jegyzetek', icon: StickyNote },
    { href: '/dashboard/contacts', label: 'Kapcsolatok', icon: Users },
];

export function Sidebar() {
    const pathname = usePathname();
    const { isSidebarOpen, isSidebarCollapsed, toggleSidebar, setSidebarCollapsed, openProjectModal } = useUIStore();

    // Reaktív store használat a getterek helyett
    const currentWorkspaceId = useWorkspaceStore(state => state.currentWorkspaceId);
    const workspaces = useWorkspaceStore(state => state.workspaces);
    const allProjects = useWorkspaceStore(state => state.projects);
    const initialize = useWorkspaceStore(state => state.initialize);

    const [isWorkspaceSwitcherOpen, setIsWorkspaceSwitcherOpen] = useState(false);

    const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);
    const projects = allProjects.filter(p => p.workspace_id === currentWorkspaceId);

    // Initialize workspaces on mount
    useEffect(() => {
        initialize();
    }, [initialize]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        if (window.innerWidth < 1024) {
            useUIStore.getState().toggleSidebar();
        }
    }, [pathname]);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (isSidebarOpen && window.innerWidth < 1024) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isSidebarOpen]);

    return (
        <>
            {/* Mobile Hamburger Button - Fixed */}
            <button
                onClick={toggleSidebar}
                className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all shadow-lg"
                aria-label="Menü megnyitása"
            >
                {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden animate-in fade-in duration-200"
                    onClick={toggleSidebar}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    'fixed left-0 top-0 z-40 h-screen bg-slate-950 border-r border-slate-800 transition-all duration-300',
                    // Mobile: slide in/out
                    'lg:translate-x-0',
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full',
                    // Desktop: collapsible
                    isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64',
                    // Mobile: full width or standard
                    'w-72'
                )}
            >
                {/* Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="text-white font-bold">M</span>
                        </div>
                        {(!isSidebarCollapsed || window.innerWidth < 1024) && (
                            <span className="font-semibold text-slate-100 text-lg">Molly</span>
                        )}
                    </Link>

                    {/* Desktop collapse button */}
                    <button
                        onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
                        className="hidden lg:flex p-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                        aria-label={isSidebarCollapsed ? 'Sidebar kinyitása' : 'Sidebar összecsukása'}
                    >
                        {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                {/* Workspace Switcher */}
                <div className="p-3 border-b border-slate-800">
                    <button
                        onClick={() => setIsWorkspaceSwitcherOpen(true)}
                        className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/70 transition-all duration-200 group',
                            isSidebarCollapsed && 'lg:justify-center lg:p-2'
                        )}
                    >
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                            style={{ backgroundColor: currentWorkspace?.color || '#6366F1' }}
                        >
                            {currentWorkspace?.icon || <Building2 size={18} />}
                        </div>
                        <div className={cn('flex-1 text-left', isSidebarCollapsed && 'lg:hidden')}>
                            <p className="text-sm font-medium text-slate-200 truncate">
                                {currentWorkspace?.name || 'Válassz workspace-t'}
                            </p>
                            <p className="text-xs text-slate-500">Workspace</p>
                        </div>
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 space-y-1.5">
                    {mainNavItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
                                    isActive
                                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70',
                                    isSidebarCollapsed && 'lg:justify-center lg:px-3'
                                )}
                            >
                                <Icon size={22} />
                                <span className={cn('text-sm font-medium', isSidebarCollapsed && 'lg:hidden')}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Projects Section */}
                <div className="px-4 py-2 mt-2">
                    <div className={cn('flex items-center justify-between mb-2', isSidebarCollapsed && 'lg:hidden')}>
                        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            Projektek
                        </h3>
                        <button
                            onClick={() => openProjectModal()}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    <div className="space-y-1">
                        {projects.map((project: Project) => (
                            <Link
                                key={project.id}
                                href={`/dashboard/projects/${project.id}`}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-all group',
                                    isSidebarCollapsed && 'lg:justify-center lg:px-2'
                                )}
                            >
                                <div
                                    className="w-3 h-3 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: project.color || '#6366F1' }}
                                />
                                <span className={cn('text-sm truncate', isSidebarCollapsed && 'lg:hidden')}>
                                    {project.name}
                                </span>
                            </Link>
                        ))}

                        {projects.length === 0 && (
                            <div className={cn('text-xs text-slate-600 px-2 py-1', isSidebarCollapsed && 'lg:hidden')}>
                                Nincsenek projektek
                            </div>
                        )}

                        {isSidebarCollapsed && (
                            <button
                                onClick={() => openProjectModal()}
                                className="w-full flex justify-center p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors lg:flex hidden"
                            >
                                <Plus size={16} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Quick Add Button */}
                <div className="p-3">
                    <Button
                        variant="primary"
                        size="lg"
                        className={cn(
                            'w-full justify-center',
                            isSidebarCollapsed && 'lg:px-3'
                        )}
                        onClick={() => useUIStore.getState().openNewTaskModal()}
                    >
                        <Plus size={20} />
                        <span className={cn(isSidebarCollapsed && 'lg:hidden')}>Új feladat</span>
                    </Button>
                </div>

                {/* Bottom - Settings */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-slate-800">
                    <Link
                        href="/dashboard/settings"
                        className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-all duration-200',
                            isSidebarCollapsed && 'lg:justify-center lg:px-3'
                        )}
                    >
                        <Settings size={22} />
                        <span className={cn('text-sm font-medium', isSidebarCollapsed && 'lg:hidden')}>
                            Beállítások
                        </span>
                    </Link>
                </div>
            </aside>

            {/* Workspace Switcher Modal */}
            <WorkspaceSwitcher
                isOpen={isWorkspaceSwitcherOpen}
                onClose={() => setIsWorkspaceSwitcherOpen(false)}
            />

            {/* Create Project Modal */}
            <CreateProjectModal />
        </>
    );
}
