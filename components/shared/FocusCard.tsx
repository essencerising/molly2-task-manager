// Focus Card Component - For Dashboard
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui';
import { LucideIcon } from 'lucide-react';

interface FocusCardProps {
    title: string;
    count: number;
    icon: LucideIcon;
    color: 'indigo' | 'emerald' | 'amber' | 'red';
    isActive?: boolean;
    onClick?: () => void;
    children?: ReactNode;
}

const colorClasses = {
    indigo: {
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/30',
        activeBorder: 'border-indigo-500',
        icon: 'text-indigo-400',
        count: 'text-indigo-400',
        shadow: 'shadow-indigo-500/10',
    },
    emerald: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        activeBorder: 'border-emerald-500',
        icon: 'text-emerald-400',
        count: 'text-emerald-400',
        shadow: 'shadow-emerald-500/10',
    },
    amber: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        activeBorder: 'border-amber-500',
        icon: 'text-amber-400',
        count: 'text-amber-400',
        shadow: 'shadow-amber-500/10',
    },
    red: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        activeBorder: 'border-red-500',
        icon: 'text-red-400',
        count: 'text-red-400',
        shadow: 'shadow-red-500/10',
    },
};

export function FocusCard({ title, count, icon: Icon, color, isActive, onClick, children }: FocusCardProps) {
    const colors = colorClasses[color];

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full text-left rounded-2xl border p-5 transition-all duration-200',
                colors.bg,
                isActive ? colors.activeBorder : colors.border,
                isActive && `shadow-lg ${colors.shadow}`,
                'hover:scale-[1.02] hover:shadow-lg',
                onClick && 'cursor-pointer'
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <div className={cn('p-2.5 rounded-xl', colors.bg)}>
                    <Icon size={22} className={colors.icon} />
                </div>
                <span className={cn('text-3xl font-bold', colors.count)}>
                    {count}
                </span>
            </div>
            <h3 className="text-sm font-medium text-slate-300 mb-1">{title}</h3>
            {children && (
                <div className="text-xs text-slate-500 mt-2">
                    {children}
                </div>
            )}
        </button>
    );
}
