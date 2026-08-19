// app/arm-admin/members/[userId]/components/TransactionCard.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface TransactionCardProps {
    tx: {
        id: string;
        amount: number;
        creditCount: number;
        status: string;
        statusLabel: string;
        transactionType: string;
        description: string;
        createdAt: string;
        isCreditRequest?: boolean;
    };
}

export function TransactionCard({ tx }: TransactionCardProps) {
    const getStatusColor = () => {
        if (tx.status === 'success' || tx.status === 'approved') return 'text-green-600 bg-green-50';
        if (tx.status === 'pending') return 'text-yellow-600 bg-yellow-50';
        return 'text-red-600 bg-red-50';
    };

    return (
        <div className="bg-surface-container-low border border-outline-variant p-4 rounded-xl hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-on-surface">
                            {tx.creditCount || 0} اعتبار
                        </span>
                        <span className="text-sm text-on-surface-variant">
                            {tx.amount?.toLocaleString() || 0} تومان
                        </span>
                        {tx.isCreditRequest && (
                            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                فیشی
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-on-surface-variant truncate mt-0.5">
                        {tx.description || tx.transactionType || 'بدون توضیحات'}
                    </p>
                </div>
                <div className="text-right flex-shrink-0">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full", getStatusColor())}>
                        {tx.statusLabel || tx.status}
                    </span>
                    <p className="text-xs text-on-surface-variant mt-1">
                        {new Date(tx.createdAt).toLocaleDateString('fa-IR')}
                    </p>
                </div>
            </div>
        </div>
    );
}