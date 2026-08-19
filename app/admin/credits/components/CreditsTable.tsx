// app/admin/credits/components/CreditsTable.tsx
'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SortField } from '../../page';

interface Props {
    credits: any[];
    pagination: any;
    page: number;
    sortField: SortField;
    sortOrder: 'asc' | 'desc';
    onSort: (f: SortField) => void;
    onPageChange: (p: number) => void;
    onRowClick: (c: any) => void;
    getStatusBadge: (s: string) => React.ReactNode;
    getPaymentBadge: (m: string) => React.ReactNode;
}

export function CreditsTable({ credits, pagination, page, sortField, sortOrder, onSort, onPageChange, onRowClick, getStatusBadge, getPaymentBadge }: Props) {
    const columns: { key: SortField | null; label: string }[] = [
        { key: 'createdAt', label: 'تاریخ' },
        { key: null, label: 'کاربر' },
        { key: 'amount', label: 'مبلغ' },
        { key: 'creditCount', label: 'اعتبار' },
        { key: null, label: 'بازار' },
        { key: null, label: 'روش' },
        { key: null, label: 'وضعیت' },
    ];

    return (
        <>
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                        <tr className="border-b border-outline-variant bg-surface-container-low">
                            {columns.map(col => (
                                <th key={col.key || col.label} className="text-right px-3 py-2.5 text-xs font-semibold text-on-surface-variant whitespace-nowrap">
                                    {col.key ? (
                                        <button onClick={() => onSort(col.key!)} className="flex items-center gap-1 hover:text-primary">
                                            {col.label} {sortField === col.key && (sortOrder === 'asc' ? '↑' : '↓')}
                                        </button>
                                    ) : col.label}
                                </th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {credits.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-on-surface-variant">هیچ تراکنشی یافت نشد</td></tr>
                        ) : credits.map(c => (
                            <tr key={c.id} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors cursor-pointer"
                                onClick={() => onRowClick(c)}>
                                <td className="px-3 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">
                                    {new Date(c.createdAt).toLocaleDateString('fa-IR')}
                                </td>
                                <td className="px-3 py-2.5">
                                    <p className="text-sm font-medium">{c.user?.fullName || 'نامشخص'}</p>
                                    <p className="text-[10px] text-on-surface-variant/50">{c.user?.phone}</p>
                                </td>
                                <td className="px-3 py-2.5 text-sm font-bold whitespace-nowrap">{c.amount?.toLocaleString()} ت</td>
                                <td className="px-3 py-2.5 text-sm whitespace-nowrap">{c.creditCount?.toLocaleString()}</td>
                                <td className="px-3 py-2.5 text-xs">
                                    {c.arm ? (
                                        <span className="inline-flex items-center gap-1">
                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.arm.colorPrimary || '#8b0000' }} />
                                            {c.arm.name}
                                            </span>
                                    ) : '-'}
                                </td>
                                <td className="px-3 py-2.5">{getPaymentBadge(c.paymentMethod)}</td>
                                <td className="px-3 py-2.5">{getStatusBadge(c.status)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-on-surface-variant">{(page - 1) * 20 + 1} تا {Math.min(page * 20, pagination.total)} از {pagination.total}</span>
                    <div className="flex gap-1">
                        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="px-3 py-1.5 border rounded-lg text-xs disabled:opacity-50">قبلی</button>
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const p = pagination.totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= pagination.totalPages - 2 ? pagination.totalPages - 4 + i : page - 2 + i;
                            return <button key={p} onClick={() => onPageChange(p)} className={cn("w-8 h-8 rounded-lg text-xs", p === page ? "bg-primary text-on-primary" : "border hover:bg-surface-container-low")}>{p.toLocaleString('fa-IR')}</button>;
                        })}
                        <button onClick={() => onPageChange(Math.min(pagination.totalPages, page + 1))} disabled={page === pagination.totalPages} className="px-3 py-1.5 border rounded-lg text-xs disabled:opacity-50">بعدی</button>
                    </div>
                </div>
            )}
        </>
    );
}