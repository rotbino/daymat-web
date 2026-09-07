// app/ad/edit/[id]/page.tsx
'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { AdForm } from '@/app/ad/AdForm';

export default function EditAdPage() {
    const params = useParams();
    const adId = params.id as string;

    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-amber-500 border-t-transparent" />
            </div>
        }>
            <AdForm adId={adId} />
        </Suspense>
    );
}