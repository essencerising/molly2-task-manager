// Header Component - Mobile-first
'use client';

import { Bell, Search, User } from 'lucide-react';
import { useUIStore } from '@/stores';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface HeaderProps {
    title?: string;
    subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
    const { toggleCommandPalette, isSidebarCollapsed } = useUIStore();

    return (
        <header
            className={cn(
                'sticky top-0 z-20 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800',
                // Mobile: full width, left padding for hamburger
                'lg:ml-0',
                // Desktop: adjust for sidebar - this is handled by parent now
            )}
        >
            <div className="h-full px-4 md:px-6 flex items-center justify-between">
                {/* Left - Title (with spacing for mobile hamburger) */}
                <div className="pl-12 lg:pl-0">
                    {title && (
                        <h1 className="text-base md:text-lg font-semibold text-slate-100 truncate">
                            {title}
                        </h1>
                    )}
                    {subtitle && (
                        <p className="text-xs md:text-sm text-slate-400 truncate hidden sm:block">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Right - Actions */}
                <div className="flex items-center gap-1 md:gap-2">
                    {/* Search - Hidden on mobile, visible on tablet+ */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleCommandPalette}
                        className="hidden md:flex items-center gap-2 text-slate-400 hover:text-slate-200"
                    >
                        <Search size={16} />
                        <span className="text-sm hidden lg:inline">Keresés</span>
                        <kbd className="hidden lg:inline px-1.5 py-0.5 text-[10px] font-medium bg-slate-800 border border-slate-700 rounded">
                            ⌘K
                        </kbd>
                    </Button>

                    {/* Mobile Search Icon */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleCommandPalette}
                        className="md:hidden p-2"
                    >
                        <Search size={20} />
                    </Button>

                    {/* Notifications */}
                    <Button variant="ghost" size="sm" className="relative p-2 md:p-2.5">
                        <Bell size={20} />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    </Button>

                    {/* Profile */}
                    <Button variant="ghost" size="sm" className="gap-2 p-1.5 md:p-2">
                        <div className="w-8 h-8 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                            <User size={14} className="text-white" />
                        </div>
                    </Button>
                </div>
            </div>
        </header>
    );
}
