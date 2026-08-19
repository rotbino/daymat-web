// app/ClientLayout.tsx
'use client';

import { FiltersProvider } from '@/lib/hooks/useFilters';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <FiltersProvider>
            {children}
        </FiltersProvider>
    );
}