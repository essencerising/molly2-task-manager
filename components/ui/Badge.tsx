// Design System - Badge Component
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
    size?: 'sm' | 'md';
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
    ({ className, variant = 'default', size = 'sm', ...props }, ref) => {
        const baseStyles = 'inline-flex items-center font-medium rounded-full transition-colors';

        const variants = {
            default: 'bg-slate-800 text-slate-300',
            success: 'bg-emerald-950 text-emerald-400 border border-emerald-800/50',
            warning: 'bg-amber-950 text-amber-400 border border-amber-800/50',
            danger: 'bg-red-950 text-red-400 border border-red-800/50',
            info: 'bg-sky-950 text-sky-400 border border-sky-800/50',
            outline: 'bg-transparent border border-slate-700 text-slate-400',
        };

        const sizes = {
            sm: 'px-2 py-0.5 text-xs',
            md: 'px-3 py-1 text-sm',
        };

        return (
            <span
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            />
        );
    }
);

Badge.displayName = 'Badge';

export { Badge };
