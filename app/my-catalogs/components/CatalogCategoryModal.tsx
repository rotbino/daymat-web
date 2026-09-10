// app/my-catalogs/components/CatalogCategoryModal.tsx
'use client';

import React from 'react';
import { AlertTriangle, Layers, X } from 'lucide-react';
import CategoryPicker from '@/app/ad/components/CategoryPicker';

/** مودال تعیین دستهٔ بازاری برای یک کالای بی‌دسته */
export default function CatalogCategoryModal({ ad, tree, armName, pending, onClose, onPick }: {
    ad: any | null;
    tree: any[];
    armName: string;
    pending: boolean;
    onClose: () => void;
    onPick: (categoryId: string) => void;
}) {
    if (!ad) return null;

    return (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center sm:justify-center bg-black/50 animate-in fade-in duration-200 sm:p-4"
             onClick={onClose}>
            <div onClick={(e) => e.stopPropagation()}
                 className="bg-surface w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl min-h-[60dvh] max-h-[90dvh]
                     flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Layers className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                        </span>
                        <div>
                            <h3 className="text-sm font-extrabold text-on-surface">دسته‌بندی در بازار</h3>
                            <p className="text-[10px] text-on-surface-variant/70 truncate max-w-[220px]">
                                {ad.productType || ad.title}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="بستن"
                            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-4">
                    <div className="rounded-xl bg-amber-50/70 dark:bg-amber-900/10 border border-amber-300/40 dark:border-amber-800/40 p-3">
                        <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-6">
                            این دسته تعیین می‌کند کالای تو در کدام شاخهٔ <b>تابلوی قیمت {armName}</b> دیده شود —
                            خریدارها از فیلتر همین دسته‌ها به تو می‌رسند.
                        </p>
                    </div>
                    {tree.length === 0 ? (
                        <div className="rounded-xl border border-amber-300/50 bg-amber-50/60 dark:bg-amber-900/10 p-4 text-center">
                            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-300">درخت دسته‌بندی بازار هنوز ساخته نشده</p>
                        </div>
                    ) : (
                        <CategoryPicker
                            value=""
                            onChange={(categoryId: string) => { if (categoryId) onPick(categoryId); }}
                            tree={tree}
                            disabled={pending}
                        />
                    )}
                </div>

                <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant/20">
                    <button onClick={onClose}
                            className="w-full h-10 rounded-xl border border-outline-variant/60 text-xs font-bold
                                text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        بعداً انجام می‌دهم
                    </button>
                </div>
            </div>
        </div>
    );
}
