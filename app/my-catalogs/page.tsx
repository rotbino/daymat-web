// app_/my-catalogs/page.tsx
'use client';

import React from 'react';
import MyCatalogsContent from './MyCatalogsContent';
import NavTabs from "@/app/home/nav/NavTabs";


export default function MyCatalogsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40
            dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40 pb-24">
            <NavTabs />
            {/* دسکتاپ: max-w-7xl برای چیدمان رِیل + کنسول؛ موبایل/تبلت: همان max-w-3xl قبلی */}
            <main className="max-w-3xl lg:max-w-7xl mx-auto px-4 pt-5">
                <MyCatalogsContent />
            </main>
        </div>
    );
}