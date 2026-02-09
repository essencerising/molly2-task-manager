// UI Store - Zustand (sidebar, modals, theme)
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ViewMode = 'list' | 'kanban' | 'calendar';
type Theme = 'light' | 'dark' | 'system';

interface UIState {
    // Sidebar
    isSidebarOpen: boolean;
    isSidebarCollapsed: boolean;

    // View preferences
    dashboardViewMode: ViewMode;

    // Theme
    theme: Theme;

    // Modals
    isTaskModalOpen: boolean;
    editingTaskId: string | null;
    isNewTaskModalOpen: boolean;
    isProjectModalOpen: boolean;
    editingProjectId: string | null;

    // Command palette
    isCommandPaletteOpen: boolean;

    // Actions
    toggleSidebar: () => void;
    setSidebarCollapsed: (collapsed: boolean) => void;
    setDashboardViewMode: (mode: ViewMode) => void;
    setTheme: (theme: Theme) => void;
    openTaskModal: (taskId: string) => void;
    closeTaskModal: () => void;
    openNewTaskModal: () => void;
    closeNewTaskModal: () => void;
    openProjectModal: (projectId?: string) => void;
    closeProjectModal: () => void;
    toggleCommandPalette: () => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            // Initial state
            isSidebarOpen: true,
            isSidebarCollapsed: false,
            dashboardViewMode: 'list',
            theme: 'dark',
            isTaskModalOpen: false,
            editingTaskId: null,
            isNewTaskModalOpen: false,
            isProjectModalOpen: false,
            editingProjectId: null,
            isCommandPaletteOpen: false,

            // Actions
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            setSidebarCollapsed: (collapsed) => set({ isSidebarCollapsed: collapsed }),
            setDashboardViewMode: (mode) => set({ dashboardViewMode: mode }),
            setTheme: (theme) => set({ theme }),
            openTaskModal: (taskId) => set({ isTaskModalOpen: true, editingTaskId: taskId }),
            closeTaskModal: () => set({ isTaskModalOpen: false, editingTaskId: null }),
            openNewTaskModal: () => set({ isNewTaskModalOpen: true }),
            closeNewTaskModal: () => set({ isNewTaskModalOpen: false }),
            openProjectModal: (projectId) => set({ isProjectModalOpen: true, editingProjectId: projectId || null }),
            closeProjectModal: () => set({ isProjectModalOpen: false, editingProjectId: null }),
            toggleCommandPalette: () => set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
        }),
        {
            name: 'molly-ui-storage',
            partialize: (state) => ({
                isSidebarCollapsed: state.isSidebarCollapsed,
                dashboardViewMode: state.dashboardViewMode,
                theme: state.theme,
            }),
        }
    )
);
