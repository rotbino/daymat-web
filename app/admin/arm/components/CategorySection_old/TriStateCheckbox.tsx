// app/admin/arm/components/CategorySection/TriStateCheckbox.tsx
'use client';

import { Check, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CheckState } from './types';

export function TriStateCheckbox({ state, onClick, disabled = false, tone = 'amber' }: {
    state: CheckState;
    onClick?: () => void;
    disabled?: boolean;
    tone?: 'amber' | 'emerald';
}) {
    const tones: Record<string, { on: string; partial: string; off: string }> = {
        amber: {
            on: 'bg-amber-500 border-amber-500 text-white',
            partial: 'bg-amber-100 border-amber-400 text-amber-600 dark:bg-amber-900/60 dark:border-amber-500 dark:text-amber-300',
            off: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-amber-400',
        },
        emerald: {
            on: 'bg-emerald-500 border-emerald-500 text-white',
            partial: 'bg-emerald-100 border-emerald-400 text-emerald-600 dark:bg-emerald-900/60 dark:border-emerald-500 dark:text-emerald-300',
            off: 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-emerald-400',
        },
    };
    const t = tones[tone] || tones.amber;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={cn(
                'w-5 h-5 rounded-[6px] border-2 flex items-center justify-center transition-all flex-shrink-0',
                state === 'checked' && t.on,
                state === 'indeterminate' && t.partial,
                state === 'unchecked' && t.off,
                disabled && 'cursor-not-allowed',
            )}
        >
            {state === 'checked' && <Check className="w-3.5 h-3.5" strokeWidth={3.5} />}
            {state === 'indeterminate' && <Minus className="w-3 h-3" strokeWidth={3.5} />}
        </button>
    );
}