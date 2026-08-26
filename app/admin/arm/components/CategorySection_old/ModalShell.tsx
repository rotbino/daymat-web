// app/admin/arm/components/CategorySection/ModalShell.tsx
'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ModalShell({ open, onClose, title, subtitle, icon, children, footer, maxWidth = 'max-w-2xl' }: {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    maxWidth?: string;
}) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = prev; };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-6">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
            <div className={cn('relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border-2 border-gray-100 dark:border-gray-700 flex flex-col max-h-[88vh]', maxWidth)}>
                <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b-2 border-gray-100 dark:border-gray-700 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        {icon}
                        <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-gray-100 truncate">{title}</h3>
                            {subtitle && <p className="text-[11px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">{subtitle}</p>}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors flex-shrink-0"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
                {footer && (
                    <div className="px-4 sm:px-5 py-4 border-t-2 border-gray-100 dark:border-gray-700 flex-shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}