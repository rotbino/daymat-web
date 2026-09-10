// app/my-catalogs/components/TopBar.tsx
// هدر صفحه — عنوان + دکمهٔ کاتالوگ جدید + منوی گزینه‌ها
'use client';

import React, { useState } from 'react';
import { BookOpen, Ellipsis, Key, Plus } from 'lucide-react';

/** هدر بالای صفحهٔ مدیریت کاتالوگ */
export default function TopBar({ onChangePassword, onNewCatalog }: {
    onChangePassword: () => void;
    onNewCatalog: () => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
                <h1 className="text-base lg:text-xl font-black text-on-surface flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary flex-shrink-0" /> مدیریت کاتالوگ
                </h1>
                <p className="hidden lg:block text-[11px] text-on-surface-variant/70 mt-0.5">
                    محصولات، انتشار در بازارها و آمار — همه در یک کنسول
                </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
                {/* 📍 ایجاد کاتالوگ جدید فقط از منوی سه‌نقطه — در MVP پنهان می‌ماند تا کاربر روی کیفیت بماند */}
                <div className="relative">
                    <button type="button" onClick={() => setMenuOpen((o) => !o)} aria-label="گزینه‌های بیشتر"
                            className="w-10 h-10 rounded-lg grid place-items-center text-on-surface-variant
                                border border-outline-variant/40 dark:border-gray-700 hover:bg-surface-container-high dark:hover:bg-gray-800 transition-colors">
                        <Ellipsis className="w-4.5 h-4.5" />
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                            <div className="absolute top-full end-0 mt-1 z-50 w-52 p-1.5 rounded-2xl bg-white dark:bg-gray-900
                                border border-outline-variant/30 dark:border-gray-700 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                                <button type="button" onClick={() => { setMenuOpen(false); onNewCatalog(); }}
                                        className="w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] text-on-surface hover:bg-surface-container-high dark:hover:bg-gray-800 transition-colors">
                                    <Plus className="w-4 h-4 text-secondary dark:text-[#9db9e3]" /> کاتالوگ جدید
                                </button>
                                <button type="button" onClick={() => { setMenuOpen(false); onChangePassword(); }}
                                        className="w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] text-on-surface hover:bg-surface-container-high transition-colors">
                                    <Key className="w-4 h-4 text-on-surface-variant" /> تغییر رمز عبور
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
