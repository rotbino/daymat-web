// lib/providers/ThemeProvider.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { setThemeMode, ThemeMode } from '@/lib/store/slices/themeSlice';

const LIGHT_COLORS: Record<string, string> = {
    '--primary': '#0f7b52',
    '--primary-container': '#0f7b52',
    '--primary-fixed': '#d3e9dd',
    '--primary-fixed-dim': '#a8d9c0',
    '--on-primary': '#ffffff',
    '--on-primary-container': '#8fd9b6',
    '--secondary': '#4c6b5d',
    '--secondary-container': '#3f6b56',
    '--on-secondary': '#ffffff',
    '--on-secondary-container': '#cfeedd',
    '--surface': '#f9f9fc',
    '--surface-bright': '#f9f9fc',
    '--surface-dim': '#dadadc',
    '--surface-container': '#eeeef0',
    '--surface-container-low': '#f3f3f6',
    '--surface-container-lowest': '#ffffff',
    '--surface-container-high': '#e8e8ea',
    '--surface-container-highest': '#e2e2e5',
    '--outline': '#7d8c84',
    '--outline-variant': '#d8e2dc',
    '--background': '#f9f9fc',
    '--on-background': '#1a1c1e',
    '--on-surface': '#1a1c1e',
    '--on-surface-variant': '#4f6159',
    '--error': '#ba1a1a',
    '--error-container': '#ffdad6',
    '--on-error': '#ffffff',
    '--on-error-container': '#93000a',
    '--tertiary': '#003420',
    '--tertiary-container': '#004d31',
    '--on-tertiary': '#ffffff',
    '--on-tertiary-container': '#58c390',
    '--color-background': '#f9f9fc',
    '--color-foreground': '#1a1c1e',
};

const DARK_COLORS: Record<string, string> = {
    '--primary': '#a8d9c0',
    '--primary-container': '#0f7b52',
    '--primary-fixed': '#d3e9dd',
    '--primary-fixed-dim': '#a8d9c0',
    '--on-primary': '#06281b',
    '--on-primary-container': '#d3e9dd',
    '--secondary': '#a9c8b8',
    '--secondary-container': '#294737',
    '--on-secondary': '#10231a',
    '--on-secondary-container': '#c6e5d4',
    '--surface': '#131316',
    '--surface-bright': '#39393b',
    '--surface-dim': '#131316',
    '--surface-container': '#1f1f22',
    '--surface-container-low': '#1b1b1e',
    '--surface-container-lowest': '#0e0e11',
    '--surface-container-high': '#29292c',
    '--surface-container-highest': '#343437',
    '--outline': '#8ea298',
    '--outline-variant': '#3c4a44',
    '--background': '#131316',
    '--on-background': '#e3e2e6',
    '--on-surface': '#e3e2e6',
    '--on-surface-variant': '#c0d2c8',
    '--error': '#ffb4ab',
    '--error-container': '#93000a',
    '--on-error': '#690005',
    '--on-error-container': '#ffdad6',
    '--tertiary': '#6cdba6',
    '--tertiary-container': '#005235',
    '--on-tertiary': '#003821',
    '--on-tertiary-container': '#89f7be',
    '--color-background': '#131316',
    '--color-foreground': '#e3e2e6',
};

function lightenColor(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, (num >> 16) + Math.round(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0x00ff) + Math.round(255 * amount));
    const b = Math.min(255, (num & 0x0000ff) + Math.round(255 * amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const dispatch = useDispatch();
    const { currentArm } = useSelector((state: RootState) => state.arm);
    const theme = useSelector((state: RootState) => state.theme.mode);

    const applyColors = useCallback((colors: Record<string, string>) => {
        const root = document.documentElement;
        Object.entries(colors).forEach(([key, value]) => {
            root.style.setProperty(key, value);
        });
    }, []);

    useEffect(() => {
        const root = document.documentElement;
        let isDark = theme === 'dark';

        if (theme === 'system') {
            isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }

        applyColors(isDark ? DARK_COLORS : LIGHT_COLORS);
        root.classList.toggle('dark', isDark);

        const appearance = currentArm?.config?.appearance;
        const primaryColor = appearance?.primaryColor || currentArm?.colorPrimary;
        const secondaryColor = appearance?.secondaryColor || currentArm?.colorSecondary;
        const surfaceColor = appearance?.surfaceColor;
        const headerBgColor = appearance?.headerBgColor;

        if (primaryColor) {
            root.style.setProperty('--primary', isDark ? lightenColor(primaryColor, 0.3) : primaryColor);
            root.style.setProperty('--primary-container', primaryColor);
            root.style.setProperty('--on-primary', isDark ? '#000000' : '#ffffff');
        }

        if (secondaryColor) {
            root.style.setProperty('--secondary', isDark ? lightenColor(secondaryColor, 0.3) : secondaryColor);
            root.style.setProperty('--secondary-container', secondaryColor);
            root.style.setProperty('--on-secondary', isDark ? '#000000' : '#ffffff');
        }

        if (surfaceColor) {
            root.style.setProperty('--surface', surfaceColor);
            root.style.setProperty('--background', surfaceColor);
            root.style.setProperty('--color-background', surfaceColor);
            root.style.setProperty('--surface-container-low', surfaceColor);
        }

        if (headerBgColor) {
            root.style.setProperty('--surface-container-lowest', headerBgColor);
        }

        if (theme === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = (e: MediaQueryListEvent) => {
                applyColors(e.matches ? DARK_COLORS : LIGHT_COLORS);
                root.classList.toggle('dark', e.matches);

                if (primaryColor) {
                    root.style.setProperty('--primary', e.matches ? lightenColor(primaryColor, 0.3) : primaryColor);
                }
                if (secondaryColor) {
                    root.style.setProperty('--secondary', e.matches ? lightenColor(secondaryColor, 0.3) : secondaryColor);
                }
            };
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, [theme, currentArm?.config?.appearance, currentArm?.colorPrimary, currentArm?.colorSecondary, applyColors]);

    useEffect(() => {
        const saved = localStorage.getItem('theme') as ThemeMode | null;
        if (saved) dispatch(setThemeMode(saved));
    }, [dispatch]);

    return <>{children}</>;
}