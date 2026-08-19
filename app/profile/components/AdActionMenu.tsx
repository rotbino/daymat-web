// app/profile/components/AdActionMenu.tsx
'use client';

import React, { useState } from 'react';
import { MoreVertical, Copy, Trash2, Power, PowerOff } from 'lucide-react';
import { toast } from 'sonner';
import { CopyAdModal } from '@/app/ad/components/CopyAdModal';

interface AdActionMenuProps {
    ad: any;
    onToggleActive?: (ad: any) => void;
    onDeleteClick?: (ad: any) => void;
    onRefresh?: () => void;
}

export function AdActionMenu({ ad, onToggleActive, onDeleteClick, onRefresh }: AdActionMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
    const expired = ad.status === 'expired' || new Date(ad.expiresAt).getTime() < Date.now();
    const isActive = ad.status === 'active' && !expired;

    return (
        <>
            <div className="relative">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded-full transition-colors"
                >
                    <MoreVertical className="w-4 h-4" />
                </button>

                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                        <div className="absolute left-0 top-8 z-50 w-40 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden py-1">
                            {/* کپی آگهی */}
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    setIsCopyModalOpen(true);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Copy className="w-4 h-4" />
                                کپی آگهی
                            </button>

                            {/* غیرفعال/فعال کردن (فقط برای آگهی‌های غیر منقضی) */}
                            {!expired && onToggleActive && (
                                <button
                                    onClick={() => {
                                        setIsOpen(false);
                                        onToggleActive(ad);
                                    }}
                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    {isActive ? (
                                        <>
                                            <PowerOff className="w-4 h-4 text-amber-500" />
                                            غیرفعال کردن
                                        </>
                                    ) : (
                                        <>
                                            <Power className="w-4 h-4 text-emerald-500" />
                                            فعال کردن
                                        </>
                                    )}
                                </button>
                            )}

                            {/* حذف آگهی */}
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    if (window.confirm('آیا از حذف این آگهی اطمینان دارید؟')) {
                                        onDeleteClick?.(ad);
                                    }
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                حذف آگهی
                            </button>
                        </div>
                    </>
                )}
            </div>

            <CopyAdModal
                isOpen={isCopyModalOpen}
                onClose={() => setIsCopyModalOpen(false)}
                ad={ad}
                onSuccess={onRefresh}
            />
        </>
    );
}