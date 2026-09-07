// app/components/FloatingAdminButton.tsx
'use client';

import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import Link from 'next/link';
import { Settings, LayoutDashboard, UserCog, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FloatingAdminButton() {
    const { user } = useSelector((s: RootState) => s.auth);
    const { currentArm } = useSelector((s: RootState) => s.arm);
    const [isOpen, setIsOpen] = useState(false);

    // ✅ از استور می‌خونیم
    const isSystemAdmin = user?.role === 'system_admin';

    // ✅ از بک‌اند میاد
    const isArmOwner = currentArm?.isArmOwner || false;

    // اگر نه مدیر سیستم هست و نه مالک بازار، چیزی نشون نده
    if (!isSystemAdmin && !isArmOwner) return null;

    const hasBoth = isSystemAdmin && isArmOwner;

    return (
        <div className="fixed bottom-20 left-6 z-50">
            {/* مگامنو */}
            {isOpen && (
                <div className="absolute bottom-32 left-0 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-outline-variant/20 dark:border-gray-700 p-2 min-w-[150px] space-y-1 animate-in fade-in slide-in-from-bottom-4 duration-200">
                    {isSystemAdmin && (
                        <Link
                            href="/admin"
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-surface-container-high dark:hover:bg-gray-800 transition-all text-sm text-on-surface dark:text-gray-200"
                        >
                            <Settings className="w-4 h-4 text-primary" />
                            پنل سیستم
                        </Link>
                    )}
                    {isArmOwner && (
                        <Link
                            href="/arm-admin"
                            onClick={() => setIsOpen(false)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-surface-container-high dark:hover:bg-gray-800 transition-all text-sm text-on-surface dark:text-gray-200"
                        >
                            <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                            پنل بازار
                        </Link>
                    )}
                    {hasBoth && (
                        <div className="border-t border-outline-variant/20 dark:border-gray-700 my-1" />
                    )}
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-surface-container-high dark:hover:bg-gray-800 transition-all text-sm text-on-surface-variant/60 dark:text-gray-500"
                    >
                        <X className="w-4 h-4" />
                        بستن
                    </button>
                </div>
            )}

            {/* دکمه اصلی */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95",
                    isOpen
                        ? "bg-error text-white rotate-90"
                        : "bg-primary text-white hover:bg-primary/90"
                )}
            >
                {isOpen ? (
                    <X className="w-5 h-5" />
                ) : (
                    <UserCog className="w-5 h-5" />
                )}
            </button>

            {/* نشان ۲ برای کسانی که هر دو نقش رو دارن */}
            {hasBoth && !isOpen && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-900 flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">2</span>
                </div>
            )}
        </div>
    );
}