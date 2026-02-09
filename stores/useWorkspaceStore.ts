// Workspace Store - Zustand (with async data loading)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace, Project } from '@/types/workspace';
import { fetchWorkspaces, fetchProjects, fetchAllProjects } from '@/lib/workspaceService';

interface WorkspaceState {
    // Loading states
    isLoading: boolean;
    isInitialized: boolean;

    // Current selections
    currentWorkspaceId: string | null;
    currentProjectId: string | null;

    // Data
    workspaces: Workspace[];
    projects: Project[];

    // Actions
    initialize: () => Promise<void>;
    setCurrentWorkspace: (id: string | null) => void;
    setCurrentProject: (id: string | null) => void;
    setWorkspaces: (workspaces: Workspace[]) => void;
    setProjects: (projects: Project[]) => void;
    addWorkspace: (workspace: Workspace) => void;
    addProject: (project: Project) => void;
    updateWorkspace: (id: string, updates: Partial<Workspace>) => void;
    updateProject: (id: string, updates: Partial<Project>) => void;
    removeWorkspace: (id: string) => void;
    removeProject: (id: string) => void;
    loadProjectsForWorkspace: (workspaceId: string) => Promise<void>;

    // Computed
    getCurrentWorkspace: () => Workspace | undefined;
    getProjectsForCurrentWorkspace: () => Project[];
}

export const useWorkspaceStore = create<WorkspaceState>()(
    persist(
        (set, get) => ({
            // Initial state
            isLoading: false,
            isInitialized: false,
            currentWorkspaceId: null,
            currentProjectId: null,
            workspaces: [],
            projects: [],

            // Initialize - load workspaces and projects
            initialize: async () => {
                if (get().isInitialized) return;

                set({ isLoading: true });
                try {
                    const [workspaces, projects] = await Promise.all([
                        fetchWorkspaces(),
                        fetchAllProjects(),
                    ]);

                    set({
                        workspaces,
                        projects,
                        isInitialized: true,
                        // Auto-select first workspace if none selected
                        currentWorkspaceId: get().currentWorkspaceId || (workspaces[0]?.id ?? null),
                    });
                } catch (error) {
                    console.error('Failed to initialize workspaces:', error);
                } finally {
                    set({ isLoading: false });
                }
            },

            // Actions
            setCurrentWorkspace: (id) => set({
                currentWorkspaceId: id,
                currentProjectId: null
            }),

            setCurrentProject: (id) => set({ currentProjectId: id }),

            setWorkspaces: (workspaces) => set({ workspaces }),

            setProjects: (projects) => set({ projects }),

            addWorkspace: (workspace) => set((state) => ({
                workspaces: [workspace, ...state.workspaces],
                currentWorkspaceId: workspace.id, // Auto-select new workspace
            })),

            addProject: (project) => set((state) => ({
                projects: [project, ...state.projects]
            })),

            updateWorkspace: (id, updates) => set((state) => ({
                workspaces: state.workspaces.map(w =>
                    w.id === id ? { ...w, ...updates } : w
                ),
            })),

            updateProject: (id, updates) => set((state) => ({
                projects: state.projects.map(p =>
                    p.id === id ? { ...p, ...updates } : p
                ),
            })),

            removeWorkspace: (id) => set((state) => ({
                workspaces: state.workspaces.filter(w => w.id !== id),
                projects: state.projects.filter(p => p.workspace_id !== id),
                currentWorkspaceId: state.currentWorkspaceId === id ? null : state.currentWorkspaceId,
            })),

            removeProject: (id) => set((state) => ({
                projects: state.projects.filter(p => p.id !== id),
                currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
            })),

            loadProjectsForWorkspace: async (workspaceId) => {
                try {
                    const projects = await fetchProjects(workspaceId);
                    set((state) => ({
                        projects: [
                            ...state.projects.filter(p => p.workspace_id !== workspaceId),
                            ...projects,
                        ],
                    }));
                } catch (error) {
                    console.error('Failed to load projects:', error);
                }
            },

            // Computed
            getCurrentWorkspace: () => {
                const state = get();
                return state.workspaces.find(w => w.id === state.currentWorkspaceId);
            },

            getProjectsForCurrentWorkspace: () => {
                const state = get();
                return state.projects.filter(p => p.workspace_id === state.currentWorkspaceId);
            },
        }),
        {
            name: 'molly-workspace-storage',
            partialize: (state) => ({
                currentWorkspaceId: state.currentWorkspaceId,
                currentProjectId: state.currentProjectId,
            }),
        }
    )
);
