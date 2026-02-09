// Design System - Card Component
import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'elevated' | 'bordered' | 'interactive';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = 'default', children, ...props }, ref) => {
        const baseStyles = 'rounded-xl transition-all duration-200';

        const variants = {
            default: 'bg-slate-900/60 border border-slate-800',
            elevated: 'bg-slate-900 shadow-xl shadow-black/20 border border-slate-800/50',
            bordered: 'bg-transparent border-2 border-slate-700',
            interactive: 'bg-slate-900/60 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/60 cursor-pointer hover:shadow-lg hover:shadow-indigo-500/5',
        };

        return (
            <div
                ref={ref}
                className={cn(baseStyles, variants[variant], className)}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';

// Card Header
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('px-5 py-4 border-b border-slate-800', className)} {...props} />
    )
);
CardHeader.displayName = 'CardHeader';

// Card Content
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('px-5 py-4', className)} {...props} />
    )
);
CardContent.displayName = 'CardContent';

// Card Footer
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
    ({ className, ...props }, ref) => (
        <div ref={ref} className={cn('px-5 py-4 border-t border-slate-800 bg-slate-950/50', className)} {...props} />
    )
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardContent, CardFooter };
