// Design System - Modal Component
'use client';

import { Fragment, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    description?: string;
    children: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Modal({ isOpen, onClose, title, description, children, size = 'md' }: ModalProps) {
    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-sm',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
        full: 'max-w-[90vw] h-[90vh]',
    };

    return (
        <Fragment>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div
                    className={cn(
                        'relative w-full bg-slate-900 rounded-2xl border border-slate-800 shadow-2xl',
                        'animate-in zoom-in-95 slide-in-from-bottom-4 duration-300',
                        'max-h-[90vh] flex flex-col',
                        sizes[size]
                    )}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={title ? 'modal-title' : undefined}
                >
                    {/* Header */}
                    {(title || description) && (
                        <div className="px-6 py-4 border-b border-slate-800 flex-shrink-0">
                            <div className="flex items-start justify-between">
                                <div>
                                    {title && (
                                        <h2 id="modal-title" className="text-lg font-semibold text-slate-100">
                                            {title}
                                        </h2>
                                    )}
                                    {description && (
                                        <p className="mt-1 text-sm text-slate-400">
                                            {description}
                                        </p>
                                    )}
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 -mr-2 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                                    aria-label="Bezárás"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content - with overflow scroll */}
                    <div className="px-6 py-4 overflow-y-auto flex-1">
                        {children}
                    </div>
                </div>
            </div>
        </Fragment>
    );
}

// Modal Footer helper for buttons
export function ModalFooter({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div className={cn('flex items-center justify-end gap-3 pt-4 mt-4 border-t border-slate-800', className)}>
            {children}
        </div>
    );
}
