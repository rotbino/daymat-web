// app/admin/arm/components/CategorySection/PanelHeader.tsx
'use client';

import { cn } from '@/lib/utils';
import { toFa } from './utils';

export function PanelHeader({ icon, title, subtitle, count, color, children }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    count?: number;
    color: 'amber' | 'blue';
    children?: React.ReactNode;
}) {
    const colorMap = color === 'blue'
        ? { bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' }
        : { bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' };

    return (
        <div className="flex items-center justify-between gap-3 px-3 sm:px-4 py-3 border-b-2 border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 min-w-0">
                <div className={cn('p-2 rounded-xl flex-shrink-0', colorMap.bg, colorMap.text)}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">{title}</h3>
                        {count !== undefined && (
                            <span className={cn(
                                'text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 tabular-nums',
                                colorMap.bg,
                                colorMap.text
                            )}>
                                {toFa(count)}
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{subtitle}</p>
                    )}
                </div>
            </div>
            {children && (
                <div className="flex items-center gap-2 flex-shrink-0">{children}</div>
            )}
        </div>
    );
}