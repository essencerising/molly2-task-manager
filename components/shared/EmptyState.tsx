// EmptyState Component - For when there's no data
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon, Inbox, FolderOpen, Calendar, CheckCircle } from 'lucide-react';
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
    className?: string;
    children?: ReactNode;
}

const variantStyles = {
    default: {
        iconBg: 'bg-slate-800',
        iconColor: 'text-slate-400',
    },
    success: {
        iconBg: 'bg-emerald-950',
        iconColor: 'text-emerald-400',
    },
    muted: {
        iconBg: 'bg-slate-900',
        iconColor: 'text-slate-600',
    },
};

export function EmptyState({
    icon: Icon = Inbox,
    title,
    description,
    action,
    variant = 'default',
    className,
    children,
}: EmptyStateProps) {
    const styles = variantStyles[variant];

    return (
        <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
            {/* Icon */}
            <div className={cn('mb-4 p-4 rounded-2xl', styles.iconBg)}>
                <Icon size={32} className={styles.iconColor} strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-slate-200 mb-2">{title}</h3>

            {/* Description */}
            {description && (
                <p className="text-sm text-slate-400 max-w-sm mb-6">{description}</p>
            )}

            {/* Action Button */}
            {action && (
                <Button variant="primary" onClick={action.onClick}>
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
            icon={CheckCircle}
            title="Nincs feladat"
            description="Még nincsenek feladataid ebben a nézetben. Hozz létre egyet az induláshoz!"
            variant="success"
            action={onAddTask ? { label: 'Új feladat létrehozása', onClick: onAddTask } : undefined}
        />
    );
}

export function NoProjectsEmptyState({ onAddProject }: { onAddProject?: () => void }) {
    return (
        <EmptyState
            icon={FolderOpen}
            title="Nincs projekt"
            description="A projektek segítenek rendszerezni a feladataidat. Hozz létre egyet!"
            action={onAddProject ? { label: 'Új projekt', onClick: onAddProject } : undefined}
        />
    );
}

export function NoEventsEmptyState() {
    return (
        <EmptyState
            icon={Calendar}
            title="Nincs esemény"
            description="Erre a napra nincsenek ütemezett feladataid."
            variant="muted"
        />
    );
}
