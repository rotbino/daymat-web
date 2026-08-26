// app/ad/edit/[id]/page.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { AdForm } from '@/app/ad/AdForm';

export default function EditAdPage() {
    const params = useParams();
    const adId = params.id as string;

    return <AdForm adId={adId} />;
}