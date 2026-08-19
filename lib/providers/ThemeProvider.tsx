// lib/providers/ThemeProvider.tsx
'use client';

import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { setThemeMode, ThemeMode } from '@/lib/store/slices/themeSlice';

const LIGHT_COLORS: Record<string, string> = {
    '--primary': '#8b0000',
    '--primary-container': '#8b0000',
    '--primary-fixed': '#ffdad4',
    '--primary-fixed-dim': '#ffb4a8',
    '--on-primary': '#ffffff',
    '--on-primary-container': '#ff907f',
    '--secondary': '#904d00',
    '--secondary-container': '#fd8b00',
    '--on-secondary': '#ffffff',
    '--on-secondary-container': '#603100',
    '--surface': '#f9f9fc',
    '--surface-bright': '#f9f9fc',
    '--surface-dim': '#dadadc',
    '--surface-container': '#eeeef0',
    '--surface-container-low': '#f3f3f6',
    '--surface-container-lowest': '#ffffff',
    '--surface-container-high': '#e8e8ea',
    '--surface-container-highest': '#e2e2e5',
    '--outline': '#8e706b',
    '--outline-variant': '#e3beb8',
    '--background': '#f9f9fc',
    '--on-background': '#1a1c1e',
    '--on-surface': '#1a1c1e',
    '--on-surface-variant': '#5a403c',
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
    '--primary': '#ffb4a8',
    '--primary-container': '#8b0000',
    '--primary-fixed': '#ffdad4',
    '--primary-fixed-dim': '#ffb4a8',
    '--on-primary': '#550000',
    '--on-primary-container': '#ffdad4',
    '--secondary': '#ffb870',
    '--secondary-container': '#6d3700',
    '--on-secondary': '#482200',
    '--on-secondary-container': '#ffddba',
    '--surface': '#131316',
    '--surface-bright': '#39393b',
    '--surface-dim': '#131316',
    '--surface-container': '#1f1f22',
    '--surface-container-low': '#1b1b1e',
    '--surface-container-lowest': '#0e0e11',
    '--surface-container-high': '#29292c',
    '--surface-container-highest': '#343437',
    '--outline': '#9f8c88',
    '--outline-variant': '#53433f',
    '--background': '#131316',
    '--on-background': '#e3e2e6',
    '--on-surface': '#e3e2e6',
    '--on-surface-variant': '#d8c2bd',
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