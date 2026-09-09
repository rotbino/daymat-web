// app/ad/form/StepProgress.tsx
// ✅ نوار پیشرفت مرحله‌ها — آیکون‌های دایره‌ای + خطوط اتصال (RTL)

'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdForm } from './AdFormStore';
import { STEP_TITLES } from './constants';

export function StepProgress() {
    const { currentStep, goToStep } = useAdForm();

    return (
        <div className="flex items-center px-1">
            {STEP_TITLES.map((t, i) => {
                const n = i + 1;
                const active = n === currentStep, done = n < currentStep;
                return (
                    <React.Fragment key={t}>
                        <button
                            type="button"
                            disabled={!done}
                            onClick={() => done && goToStep(n)}
                            className="flex flex-col items-center gap-1.5 flex-shrink-0 w-14 group"
                        >
                            <span className={cn('w-9 h-9 rounded-full grid place-items-center text-xs font-black border-2 transition-all duration-300',
                                active && 'bg-primary text-on-primary border-primary scale-110 shadow-md shadow-primary/25',
                                done && 'bg-primary/10 text-primary border-primary/40 group-hover:bg-primary/20',
                                !active && !done && 'bg-surface-container-high text-on-surface-variant/50 border-outline-variant/30')}>
                                {done ? <Check className="w-4 h-4" /> : n.toLocaleString('fa-IR')}
                            </span>
                            <span className={cn('text-[10px] font-bold whitespace-nowrap transition-colors',
                                active ? 'text-primary' : done ? 'text-primary/70' : 'text-on-surface-variant/60')}>{t}</span>
                        </button>
                        {i < STEP_TITLES.length - 1 && (
                            <div className="flex-1 flex items-center -translate-y-2.5 mx-0.5">
                                <div className="h-1 flex-1 rounded-full overflow-hidden bg-outline-variant/25">
                                    <div className={cn('h-full rounded-full bg-primary transition-all duration-500', done ? 'w-full' : 'w-0')} />
                                </div>
                            </div>
                        )}
                    </React.Fragment>
                );
            })}
        </div>
    );
}
