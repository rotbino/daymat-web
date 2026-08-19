// app/admin/ads/components/AdDetailModal.tsx
'use client';

import React from 'react';
import { X, Trash2 } from 'lucide-react';

interface Props {
    ad: any;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange: (status: string) => void;
    onDelete: () => void;
}

export function AdDetailModal({ ad, isOpen, onClose, onStatusChange, onDelete }: Props) {
    if (!isOpen || !ad) return null;

    const infoItems = [
        ['قیمت', `${ad.unitPrice?.toLocaleString()} تومان`],
        ['واحد', ad.unit?.title],
        ['حداقل سفارش', `${ad.minQuantity} ${ad.unit?.shortCode}`],
        ['وضعیت', ad.status === 'active' ? 'فعال' : ad.status],
        ['بازار', ad.arm?.name],
        ['کسب‌وکار', ad.business?.name],
        ['ایجادکننده', ad.createdBy?.fullName || ad.createdBy?.phone],
        ['شهر', `${ad.city}${ad.province ? `، ${ad.province}` : ''}`],
        ['بازدید', ad.viewCount?.toLocaleString('fa-IR')],
        ['تماس', ad.callCount?.toLocaleString('fa-IR')],
        ['تاریخ ثبت', new Date(ad.createdAt).toLocaleDateString('fa-IR')],
        ['انقضا', new Date(ad.expiresAt).toLocaleDateString('fa-IR')],
    ];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface w-full max-w-2xl rounded-2xl shadow-2xl border border-outline-variant max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-surface rounded-t-2xl z-10">
                    <h3 className="text-lg font-semibold">جزئیات آگهی</h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-surface-container-high rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <h4 className="text-xl font-bold">{ad.title}</h4>
                        <p className="text-sm text-on-surface-variant mt-1">{ad.description || 'بدون توضیحات'}</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {infoItems.map(([l, v]) => (
                            <div key={l} className="bg-surface-container-low p-3 rounded-xl">
                                <p className="text-[10px] text-on-surface-variant">{l}</p>
                                <p className="text-sm font-medium text-on-surface mt-0.5">{v}</p>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-3 pt-2 border-t">
                        {ad.status !== 'active' && (
                            <button onClick={() => onStatusChange('active')} className="flex-1 h-10 bg-green-600 text-white rounded-xl text-sm">فعال کردن</button>
                        )}
                        {ad.status === 'active' && (
                            <button onClick={() => onStatusChange('expired')} className="flex-1 h-10 bg-yellow-600 text-white rounded-xl text-sm">منقضی کردن</button>
                        )}
                        {ad.status === 'pending' && (
                            <>
                                <button onClick={() => onStatusChange('active')} className="flex-1 h-10 bg-green-600 text-white rounded-xl text-sm">تأیید و فعال کردن</button>
                                <button onClick={() => onStatusChange('rejected')} className="flex-1 h-10 bg-red-600 text-white rounded-xl text-sm">رد</button>
                            </>
                        )}
                        {ad.status === 'rejected' && (
                            <button onClick={() => onStatusChange('active')} className="flex-1 h-10 bg-green-600 text-white rounded-xl text-sm">فعال کردن مجدد</button>
                        )}
                        <button onClick={onDelete} className="flex-1 h-10 bg-error text-on-error rounded-xl text-sm flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" />حذف</button>
                    </div>
                </div>
            </div>
        </div>
    );
}