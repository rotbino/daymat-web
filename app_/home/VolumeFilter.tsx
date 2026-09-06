// app/home/VolumeFilter.tsx
'use client';
import React from 'react';
import { cn } from '@/lib/utils';

interface Props {
    selectedUnit: string;
    minQuantity: number;
    onChange: (value: number) => void;
    isDesktop?: boolean;
}

const VOLUMES = [10, 50, 100, 500, 1000];

export default function VolumeFilter({ selectedUnit, minQuantity, onChange, isDesktop }: Props) {
    return (
        <div
            className={cn(
                isDesktop
                    ? "max-h-[300px] overflow-y-auto border border-outline-variant/30 rounded-xl p-2 space-y-1"
                    : "flex items-center gap-2 overflow-x-auto scrollbar-hide py-2"
            )}
        >
      <span className="text-xs font-medium text-on-surface-variant whitespace-nowrap">
        {isDesktop ? 'حجم خرید:' : 'حجم:'}
      </span>
            {VOLUMES.map((vol) => {
                const isActive = minQuantity === vol;
                const label = isDesktop
                    ? `خرید ${vol.toLocaleString()} ${selectedUnit}`
                    : `${vol.toLocaleString()} ${selectedUnit}`;

                return (
                    <button
                        key={vol}
                        onClick={() => onChange(isActive ? 0 : vol)}
                        className={cn(
                            isDesktop
                                ? "flex items-center gap-2 w-full text-right px-3 py-2 rounded-lg text-sm transition-colors border border-transparent"
                                : "whitespace-nowrap px-3.5 py-1.5 text-xs rounded border transition-colors flex-shrink-0",
                            isActive
                                ? isDesktop
                                    ? "bg-primary/10 border-primary text-primary font-medium"
                                    : "bg-primary text-on-primary border-primary"
                                : isDesktop
                                    ? "text-on-surface-variant hover:bg-surface-container-low"
                                    : "text-on-surface-variant border-outline-variant hover:border-primary"
                        )}
                    >
                        {label}
                    </button>
                );
            })}
        </div>
    );
}