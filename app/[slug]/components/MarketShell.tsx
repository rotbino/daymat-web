// app/[slug]/components/MarketShell.tsx
'use client';

import React from 'react';
import { useMarketInit } from '@/lib/hooks/useMarketInit';
import MarketContent from '@/app/market/MarketContent';
import { Loader2, Store } from 'lucide-react';

interface Props {
    slug: string;
    search?: string;
}

/**
 * پوستهٔ بازار — بدون dynamic import (فیکس ارور lazy/promise)
 * useMarketInit بازِ بازار را در Redux آب می‌کند
 */
export default function MarketShell({ slug, search }: Props) {
    const { loading, armNotFound } = useMarketInit(slug);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
            </div>
        );
    }

    if (armNotFound) {
        return (
            <div className="min-h-screen grid place-items-center bg-surface dark:bg-gray-950 text-center px-4">
                <div>
                    <Store className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
                    <p className="text-lg font-bold text-on-surface">بازار یافت نشد</p>
                    <p className="text-xs text-on-surface-variant mt-2">ممکن است این بازار غیرفعال شده باشد.</p>
                    <a href="/" className="mt-4 inline-block text-primary text-sm font-bold">رفتن به صفحهٔ اصلی</a>
                </div>
            </div>
        );
    }

    return <MarketContent search={search} />;
}