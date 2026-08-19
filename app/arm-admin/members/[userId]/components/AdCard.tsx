// app/arm-admin/members/[userId]/components/AdCard.tsx
'use client';

import React from 'react';
import {Eye} from 'lucide-react';

interface AdCardProps {
    ad: {
        id: string;
        title: string;
        unitPrice: number;
        createdAt: string;
    };
    onView?: () => void;
}

export function AdCard({ad, onView}: AdCardProps) {
    return (
        <div
            className="bg-surface-container-low border border-outline-variant p-4 rounded-xl hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-on-surface truncate">{ad.title}</h4>
                    <p className="text-sm text-on-surface-variant">
                        {ad.unitPrice.toLocaleString()} تومان
                    </p>
                </div>
                <div className="text-right flex-shrink-0">
                    <p className="text-xs text-on-surface-variant">
                        {new Date(ad.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                    {onView && (
                        <button
                            onClick={onView}
                            className="text-xs text-primary hover:underline mt-1 flex items-center gap-1"
                        >
                            <Eye className="w-3 h-3"/>
                            جزئیات
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}