// app/arm-admin/members/[userId]/components/AdDetailModal.tsx
'use client';

import React from 'react';
import { X, Eye, Phone, Calendar } from 'lucide-react';

interface AdDetailModalProps {
    ad: {
        id: string;
        title: string;
        unitPrice: number;
        createdAt: string;
        viewCount?: number;
        callCount?: number;
        description?: string;
    } | null;
    isOpen: boolean;
    onClose: () => void;
}

export function AdDetailModal({ ad, isOpen, onClose }: AdDetailModalProps) {
    if (!isOpen || !ad) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-surface w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl shadow-2xl border border-outline-variant">
                <div className="flex items-center justify-between p-4 border-b border-outline-variant sticky top-0 bg-surface rounded-t-2xl">
                    <h3 className="text-lg font-semibold text-on-surface">جزئیات آگهی</h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-on-surface-variant" />
                    </button>
                </div>
                <div className="p-4 space-y-4">
                    <div>
                        <h4 className="text-xl font-bold text-on-surface">{ad.title}</h4>
                        <p className="text-sm text-on-surface-variant mt-1">شناسه: {ad.id}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-surface-container-low p-3 rounded-xl">
                            <p className="text-xs text-on-surface-variant">قیمت واحد</p>
                            <p className="text-lg font-bold text-primary">{ad.unitPrice.toLocaleString()} تومان</p>
                        </div>
                        <div className="bg-surface-container-low p-3 rounded-xl">
                            <p className="text-xs text-on-surface-variant">تاریخ ثبت</p>
                            <p className="text-sm font-medium text-on-surface">
                                {new Date(ad.createdAt).toLocaleDateString('fa-IR')}
                            </p>
                        </div>
                        <div className="bg-surface-container-low p-3 rounded-xl">
                            <p className="text-xs text-on-surface-variant">بازدیدها</p>
                            <p className="text-lg font-bold text-on-surface flex items-center gap-1">
                                <Eye className="w-4 h-4 text-on-surface-variant" />
                                {ad.viewCount || 0}
                            </p>
                        </div>
                        <div className="bg-surface-container-low p-3 rounded-xl">
                            <p className="text-xs text-on-surface-variant">تماس‌ها</p>
                            <p className="text-lg font-bold text-on-surface flex items-center gap-1">
                                <Phone className="w-4 h-4 text-on-surface-variant" />
                                {ad.callCount || 0}
                            </p>
                        </div>
                    </div>
                    {ad.description && (
                        <div className="bg-surface-container-low p-3 rounded-xl">
                            <p className="text-xs text-on-surface-variant mb-1">توضیحات</p>
                            <p className="text-sm text-on-surface">{ad.description}</p>
                        </div>
                    )}
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-colors font-medium"
                    >
                        بستن
                    </button>
                </div>
            </div>
        </div>
    );
}