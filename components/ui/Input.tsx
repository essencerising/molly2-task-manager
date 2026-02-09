// Design System - Input Component
import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, hint, id, ...props }, ref) => {
        const inputId = id || label?.toLowerCase().replace(/\s/g, '-');

        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={inputId} className="block text-sm font-medium text-slate-300">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    className={cn(
                        'w-full px-4 py-2.5 rounded-lg border bg-slate-900 text-slate-100 placeholder-slate-500',
                        'transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950',
                        error
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-slate-700 focus:border-indigo-500 focus:ring-indigo-500',
                        className
                    )}
                    {...props}
                />
                {hint && !error && (
                    <p className="text-xs text-slate-500">{hint}</p>
                )}
                {error && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';

export { Input };
