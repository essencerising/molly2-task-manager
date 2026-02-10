// EmptyState Component - Beautiful empty states with illustrations
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Inbox, FolderOpen, Calendar, CheckCircle, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui';

export interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    variant?: 'default' | 'success' | 'muted';
    emoji?: string;
    className?: string;
    children?: ReactNode;
}

const variantStyles = {
    default: {
        iconBg: 'bg-indigo-950/50 ring-1 ring-indigo-500/20',
        iconColor: 'text-indigo-400',
        glow: 'shadow-indigo-500/5',
    },
    success: {
        iconBg: 'bg-emerald-950/50 ring-1 ring-emerald-500/20',
        iconColor: 'text-emerald-400',
        glow: 'shadow-emerald-500/5',
    },
    muted: {
        iconBg: 'bg-slate-800/50 ring-1 ring-slate-700/50',
        iconColor: 'text-slate-500',
        glow: 'shadow-slate-500/5',
    },
};

export function EmptyState({
    icon: Icon = Inbox,
    title,
    description,
    action,
    variant = 'default',
    emoji,
    className,
    children,
}: EmptyStateProps) {
    const styles = variantStyles[variant];

    return (
        <div className={cn('flex flex-col items-center justify-center py-16 px-6 text-center', className)}>
            {/* Decorative background dots */}
            <div className="relative mb-6">
                <div className={cn(
                    'absolute inset-0 rounded-full blur-xl opacity-30',
                    variant === 'default' && 'bg-indigo-500',
                    variant === 'success' && 'bg-emerald-500',
                    variant === 'muted' && 'bg-slate-600',
                )} />
                <div className={cn('relative p-5 rounded-2xl shadow-lg', styles.iconBg, styles.glow)}>
                    {emoji ? (
                        <span className="text-4xl block">{emoji}</span>
                    ) : (
                        <Icon size={36} className={styles.iconColor} strokeWidth={1.5} />
                    )}
                </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>

            {/* Description */}
            {description && (
                <p className="text-sm text-slate-400 max-w-xs leading-relaxed mb-6">{description}</p>
            )}

            {/* Action Button */}
            {action && (
                <Button variant="primary" onClick={action.onClick} className="shadow-lg shadow-indigo-500/20">
                    {action.label}
                </Button>
            )}

            {/* Custom children */}
            {children}
        </div>
    );
}

// Preset Empty States for common scenarios
export function NoTasksEmptyState({ onAddTask }: { onAddTask?: () => void }) {
    return (
        <EmptyState
            emoji="✨"
            title="Minden kész!"
            description="Nincsenek feladataid ebben a nézetben. Hozz létre egyet, vagy pihenj egy kicsit!"
            variant="success"
            action={onAddTask ? { label: '+ Új feladat', onClick: onAddTask } : undefined}
        />
    );
}

export function NoProjectsEmptyState({ onAddProject }: { onAddProject?: () => void }) {
    return (
        <EmptyState
            emoji="📁"
            title="Még nincs projekt"
            description="A projektek segítenek rendszerezni a feladataidat kategóriák szerint. Hozz létre egyet!"
            action={onAddProject ? { label: '+ Új projekt', onClick: onAddProject } : undefined}
        />
    );
}

export function NoEventsEmptyState() {
    return (
        <EmptyState
            emoji="📅"
            title="Szabad nap!"
            description="Erre a napra nincsenek ütemezett feladataid. Használd ki bölcsen!"
            variant="muted"
        />
    );
}

export function NoNotesEmptyState({ onAddNote }: { onAddNote?: () => void }) {
    return (
        <EmptyState
            emoji="📝"
            title="Üres jegyzetfüzet"
            description="Jegyezd fel a gondolataidat, ötleteidet – semmi sem vész el!"
            action={onAddNote ? { label: '+ Első jegyzet', onClick: onAddNote } : undefined}
        />
    );
}
