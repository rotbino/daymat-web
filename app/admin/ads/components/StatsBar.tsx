// app/admin/ads/components/StatsBar.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StatItem {
    label: string;
    value: string | number;
    color: string;
}

export function StatsBar({ stats }: { stats: StatItem[] }) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-4">
            {stats.map(s => (
                <div key={s.label} className="bg-surface-container-lowest border border-outline-variant/20 rounded-lg p-2 text-center">
                    <p className={cn("text-sm font-bold", s.color)}>{typeof s.value === 'number' ? s.value.toLocaleString('fa-IR') : s.value}</p>
                    <p className="text-[10px] text-on-surface-variant">{s.label}</p>
                </div>
            ))}
        </div>
    );
}