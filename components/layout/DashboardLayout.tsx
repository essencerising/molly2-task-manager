// Dashboard Layout - Mobile-first
'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
    children: ReactNode;
    title?: string;
    subtitle?: string;
}

export function DashboardLayout({ children, title, subtitle }: DashboardLayoutProps) {
    const { isSidebarCollapsed } = useUIStore();

    return (
        <div className="min-h-screen bg-slate-950">
            <Sidebar />
            <div
                className={cn(
                    'transition-all duration-300',
                    // Mobile: no margin (sidebar overlays)
                    'ml-0',
                    // Desktop: sidebar margin
                    isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
                )}
            >
                <Header title={title} subtitle={subtitle} />
                <main className="p-4 md:p-6 pt-20 lg:pt-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
