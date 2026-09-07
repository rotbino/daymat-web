// app/components/ThemeToggle.tsx
'use client';

import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { setThemeMode, ThemeMode } from '@/lib/store/slices/themeSlice';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
    const dispatch = useDispatch();
    const theme = useSelector((state: RootState) => state.theme.mode);

    const modes: { id: ThemeMode; icon: any; label: string }[] = [
        { id: 'light', icon: Sun, label: 'تاریک' },
        { id: 'dark', icon: Moon, label: 'روشن' },
        //{ id: 'system', icon: Monitor, label: 'سیستم' },
    ];

    const cycleTheme = () => {
        const currentIndex = modes.findIndex(m => m.id === theme);
        const next = modes[(currentIndex + 1) % modes.length];
        dispatch(setThemeMode(next.id));
    };

    const currentMode = modes.find(m => m.id === theme) || modes[0];
    const Icon = currentMode.icon;

    return (
        <button
            onClick={cycleTheme}
            className={cn(
                "flex items-center justify-center p-2 rounded-lg transition-colors",
                "text-on-surface-variant hover:text-on-surface hover:bg-surface-container",
                className
            )}
            title={`تم: ${currentMode.label}`}
        >

            <Icon className="w-5 h-5 mx-2" />
            {`تم ${currentMode.label}`}

        </button>
    );
}