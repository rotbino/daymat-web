// app/admin/arm/components/CategorySection/EmptyState.tsx
'use client';

import { cn } from '@/lib/utils';

export function EmptyState({ icon, title, description, action, color = 'amber', compact = false }: {
    icon: React.ReactNode;
    title: string;
    description?: string;
    action?: { label: string; onClick: () => void };
    color?: string;
    compact?: boolean;
}) {
    const colorMap: Record<string, string> = {
        amber: 'text-amber-300 dark:text-amber-700',
        blue: 'text-blue-300 dark:text-blue-700',
    };
    return (
        <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8 px-4' : 'py-12 px-4')}>
            <div className={cn('mb-3', colorMap[color] || colorMap.amber)}>{icon}</div>
            <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">{title}</h4>
            {description && <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 max-w-[240px]">{description}</p>}
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-xs font-medium hover:bg-primary/20 transition-colors"
                >
                    {action.label}
                </button>
            )}
        </div>
    );
}