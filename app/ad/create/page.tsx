// app/ad/create/page.tsx
'use client';

import React, { Suspense } from 'react';
import { AdForm } from '@/app/ad/AdForm';

export default function CreateAdPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent" />
            </div>
        }>
            <AdForm />
        </Suspense>
    );
}