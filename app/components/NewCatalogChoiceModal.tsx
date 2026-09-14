// app/components/NewCatalogChoiceModal.tsx
// مدال دو-گزینه‌ای «کاتالوگ جدید» — ایدهٔ مالک: داخل درآپ‌داونِ عنوان کاتالوگ،
// یک «کاتالوگ جدید» که اول بپرسد خرید یا فروش؛ بعد به مسیر همان محصول برود.
// دو گام = ضد خطا (کاربر راه به راه کاتالوگ نمی‌سازد) و هم‌زمان آموزش دو محصول.
// رنگ‌ها همان رنگ لندینگ و سوییچرها: فروش = قرمز برند | خرید = کهربایی برند.
'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Store, X } from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
    /** مقصد بعد از انتخاب نوع — والد مسیر می‌سازد و مدال را می‌بندد */
    onPick: (kind: 'sale' | 'purchase') => void;
}

const OPTIONS: { kind: 'sale' | 'purchase'; title: string; desc: string; icon: React.ElementType;
    card: string; iconWrap: string; iconCls: string; arrow: string }[] = [
    {
        kind: 'sale',
        title: 'کاتالوگ فروش',
        desc: 'نمایش و تبلیغ کالا و قیمت‌ها',
        icon: Store,
        card: 'border-brand-red-tint bg-brand-red-soft/60 hover:bg-brand-red-soft hover:border-brand-red/40 active:scale-[0.985]',
        iconWrap: 'bg-brand-red-soft ring-brand-red-tint',
        iconCls: 'text-brand-red dark:text-brand-red-strong',
        arrow: 'text-brand-red/60',
    },
    {
        kind: 'purchase',
        title: 'صفحه درخواست قیمت',
        desc: 'گرفتن قیمت از تامین‌کننده‌ها',
        icon: ClipboardList,
        card: 'border-brand-amber-tint bg-brand-amber-soft/70 hover:bg-brand-amber-soft hover:border-brand-amber/50 active:scale-[0.985]',
        iconWrap: 'bg-brand-amber-soft ring-brand-amber-tint',
        iconCls: 'text-amber-600 dark:text-amber-400',
        arrow: 'text-amber-600/60 dark:text-amber-400/60',
    },
];

export default function NewCatalogChoiceModal({ open, onClose, onPick }: Props) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return createPortal(
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center sm:p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50"
                        onClick={onClose}
                    />
                    <motion.div
                        role="dialog" aria-modal="true" aria-label="ساخت کاتالوگ جدید"
                        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        className="relative w-full sm:max-w-sm max-h-[92dvh] overflow-y-auto scrollbar-slim
                            rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-900 shadow-2xl">
                        {/* سرآیند — حداقلِ متن: خودِ مدال می‌پرسد */}
                        <div className="flex items-center justify-between px-5 pb-1 pt-4">
                            <h2 className="text-[15px] font-black text-stone-900 dark:text-gray-100">کاتالوگ جدید</h2>
                            <button onClick={onClose} aria-label="بستن"
                                className="grid size-8 place-items-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 dark:hover:bg-gray-800">
                                <X className="size-4" />
                            </button>
                        </div>
                        <p className="px-5 pb-3 text-[11px] font-bold text-stone-400 dark:text-gray-500">کدام را می‌سازی؟</p>

                        {/* دو گزینه — هم‌رنگ دو محصول */}
                        <div className="space-y-2.5 px-5 pb-5 pt-1">
                            {OPTIONS.map((o, i) => (
                                <motion.button
                                    key={o.kind}
                                    type="button"
                                    onClick={() => onPick(o.kind)}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.06 + i * 0.06, duration: 0.2 }}
                                    className={`flex w-full items-center gap-3 rounded-2xl border-2 p-3.5 text-right transition-all ${o.card}`}
                                >
                                    <span className={`grid size-11 shrink-0 place-items-center rounded-xl ring-1 ${o.iconWrap}`}>
                                        <o.icon className={`size-5 ${o.iconCls}`} />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-[14px] font-black text-stone-900 dark:text-gray-100">{o.title}</span>
                                        <span className="mt-0.5 block text-[11px] font-medium text-stone-500 dark:text-gray-400">{o.desc}</span>
                                    </span>
                                    <span className={`h-2 w-2 shrink-0 rounded-full bg-current opacity-40 ${o.arrow}`} />
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
}
