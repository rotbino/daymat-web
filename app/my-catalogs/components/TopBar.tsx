// app/my-catalogs/components/TopBar.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Ellipsis, Key, Plus, Share2 } from 'lucide-react';
import CatalogSwitcher from './CatalogSwitcher';

/** نوار بالای صفحه — عنوان + سوییچر کاتالوگ + منوی گزینه‌ها */
export default function TopBar({ catalogs, currentCatalog, currentId, onSelectCatalog, onShare, onChangePassword }: {
    catalogs: any[];
    currentCatalog: any;
    currentId: string | null;
    onSelectCatalog: (id: string) => void;
    onShare: () => void;
    onChangePassword: () => void;
}) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <div className="flex items-center justify-between">
            <h1 className="text-[14px] font-black text-on-surface flex items-center gap-1.5">
                <BookOpen className="w-4.5 h-4.5 text-primary" /> کاتالوگ دیمت من
            </h1>
            <div className="flex items-center gap-2">
                {catalogs.length > 1 && (
                    <CatalogSwitcher catalogs={catalogs} currentId={currentId} onSelect={onSelectCatalog} />
                )}
                <div className="relative">
                    <button onClick={() => setMenuOpen((o) => !o)} aria-label="گزینه‌های بیشتر"
                            className="w-9 h-9 rounded-full grid place-items-center text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <Ellipsis />
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                            <div className="absolute top-full end-0 mt-1 z-50 w-52 p-1.5 rounded-2xl bg-white dark:bg-gray-900
                                border border-outline-variant/30 shadow-xl animate-in fade-in zoom-in-95 duration-150">
                                <button type="button" onClick={() => { setMenuOpen(false); router.push('/business/register'); }}
                                        className="w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] text-on-surface hover:bg-surface-container-high transition-colors">
                                    <Plus className="w-4 h-4 text-amber-500" /> کاتالوگ جدید
                                </button>
                                {currentCatalog.slug && (
                                    <button type="button" onClick={() => { setMenuOpen(false); onShare(); }}
                                            className="w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] text-on-surface hover:bg-surface-container-high transition-colors">
                                        <Share2 className="w-4 h-4 text-on-surface-variant" /> اشتراک‌گذاری کاتالوگ
                                    </button>
                                )}
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
