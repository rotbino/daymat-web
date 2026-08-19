// app/admin/ads/components/AdsTable.tsx
'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SortField } from './types';

interface Props {
    ads: any[];
    pagination: any;
    page: number;
    sortField: SortField;
    sortOrder: 'asc' | 'desc';
    onSort: (field: SortField) => void;
    onPageChange: (page: number) => void;
    onRowClick: (ad: any) => void;
    getStatusBadge: (status: string) => React.ReactNode;
}

export function AdsTable({ ads, pagination, page, sortField, sortOrder, onSort, onPageChange, onRowClick, getStatusBadge }: Props) {
    const columns: { key: SortField | null; label: string }[] = [
        { key: 'createdAt', label: 'تاریخ' },
        { key: null, label: 'عنوان' },
        { key: 'unitPrice', label: 'قیمت' },
        { key: null, label: 'بازار' },
        { key: 'viewCount', label: 'بازدید' },
        { key: null, label: 'وضعیت' },
    ];

    return (
        <>
            {/* ══════════════════════════════════════════════════════════
                نسخهٔ دسکتاپ: جدول
            ══════════════════════════════════════════════════════════ */}
            <div className="hidden md:block bg-surface-container-lowest border border-outline-variant/30 rounded-xl overflow-hidden">
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
                        {ads.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-12 text-on-surface-variant">هیچ آگهی یافت نشد</td></tr>
                        ) : ads.map(ad => (
                            <tr key={ad.id} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors cursor-pointer"
                                onClick={() => onRowClick(ad)}>
                                <td className="px-3 py-2.5 text-xs text-on-surface-variant whitespace-nowrap">{new Date(ad.createdAt).toLocaleDateString('fa-IR')}</td>
                                <td className="px-3 py-2.5">
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-sm font-medium text-on-surface truncate max-w-[180px]">{ad.title}</p>
                                            {ad.isBumped && <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full flex-shrink-0">نردبان</span>}
                                        </div>
                                        <p className="text-[10px] text-on-surface-variant/50">{ad.business?.name}</p>
                                    </div>
                                </td>
                                <td className="px-3 py-2.5 text-sm font-bold text-on-surface whitespace-nowrap">
                                    {ad.unitPrice?.toLocaleString()} <span className="text-[10px] font-normal text-on-surface-variant">/{ad.unit?.shortCode}</span>
                                </td>
                                <td className="px-3 py-2.5 text-xs">
                                    <span className="inline-flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ad.arm?.colorPrimary || '#8b0000' }} />
                                        {ad.arm?.name || 'بدون بازار'}
                                    </span>
                                </td>
                                <td className="px-3 py-2.5 text-xs text-on-surface-variant">
                                    <Eye className="w-3 h-3 inline" /> {ad.viewCount?.toLocaleString('fa-IR') || 0}
                                </td>
                                <td className="px-3 py-2.5">{getStatusBadge(ad.status)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ══════════════════════════════════════════════════════════
                نسخهٔ موبایل: کارت‌ها
            ══════════════════════════════════════════════════════════ */}
            <div className="md:hidden space-y-2">
                {ads.length === 0 ? (
                    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-6 text-center text-sm text-on-surface-variant">
                        هیچ آگهی یافت نشد
                    </div>
                ) : ads.map(ad => (
                    <div
                        key={ad.id}
                        onClick={() => onRowClick(ad)}
                        className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 active:scale-[0.99] transition-transform cursor-pointer"
                    >
                        {/* عنوان و نردبان */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="font-medium text-sm text-on-surface truncate">{ad.title}</p>
                                    {ad.isBumped && (
                                        <span className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-full flex-shrink-0">نردبان</span>
                                    )}
                                </div>
                                <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{ad.business?.name}</p>
                            </div>
                            <span className="flex-shrink-0">{getStatusBadge(ad.status)}</span>
                        </div>

                        {/* اطلاعات کلیدی */}
                        <div className="flex items-center justify-between text-xs text-on-surface-variant mb-2">
                            <span className="font-bold text-on-surface">
                                {ad.unitPrice?.toLocaleString()} <span className="font-normal text-[10px]">/{ad.unit?.shortCode}</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                                <Eye className="w-3.5 h-3.5" />
                                {ad.viewCount?.toLocaleString('fa-IR') || 0}
                            </span>
                        </div>

                        {/* بازار و تاریخ */}
                        <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                            <span className="inline-flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ad.arm?.colorPrimary || '#8b0000' }} />
                                {ad.arm?.name || 'بدون بازار'}
                            </span>
                            <span>{new Date(ad.createdAt).toLocaleDateString('fa-IR')}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* پیجینگ */}
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