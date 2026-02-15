// Header Component - Mobile-first
'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, User } from 'lucide-react';
import { useUIStore } from '@/stores';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabaseClient';

interface HeaderProps {
    title?: string;
    subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
    const { toggleCommandPalette } = useUIStore();
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch user on mount
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        };
        getUser();
    }, []);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
        router.refresh();
    };

    return (
        <header
            className={cn(
                'sticky top-0 z-20 h-16 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800',
                'lg:ml-0',
            )}
        >
            <div className="h-full px-4 md:px-6 flex items-center justify-between">
                {/* Left - Title */}
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
                    {/* Search */}
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

                    {/* Profile Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2 p-1.5 md:p-2"
                            onClick={() => setIsProfileOpen(!isProfileOpen)}
                        >
                            <div className="w-8 h-8 md:w-7 md:h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                                {user?.user_metadata?.full_name ? (
                                    <span className="text-xs font-bold text-white">
                                        {user.user_metadata.full_name.charAt(0).toUpperCase()}
                                    </span>
                                ) : (
                                    <User size={14} className="text-white" />
                                )}
                            </div>
                        </Button>

                        {/* Dropdown Menu */}
                        {isProfileOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-xl shadow-xl py-1 animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 border-b border-slate-800">
                                    <p className="text-sm font-medium text-white truncate">
                                        {user?.user_metadata?.full_name || 'Felhasználó'}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                </div>
                                <button
                                    onClick={() => {
                                        setIsProfileOpen(false);
                                        router.push('/dashboard/profile');
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                                >
                                    Profilom
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors"
                                >
                                    Kijelentkezés
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
