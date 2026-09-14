// app/my-inquiries/components/ItemsTab.tsx
// تب اقلام پنل صفحه درخواست خرید — دو بخش:
//   ۱) اعلام خریدهای فعال (بالای کاتالوگ عمومی، قیمت‌پذیر)
//   ۲) سایر کالاها (لیست معمول خرید — قیمت‌گیری بسته به تنظیمات)
// ردیف‌ها با layout انیمیت می‌شوند؛ جابه‌جایی بین بخش‌ها نرم است.
'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Megaphone, BellOff, Pencil, Trash2, Plus, MessageSquareText,
    PackageSearch, Loader2,
} from 'lucide-react';
import { faNum } from '../../inquiries/utils';
import type { InquiryDetail, InquiryItem, InquiryOffer } from '@/lib/api/apiTypes';

interface Props {
    detail: InquiryDetail;
    offers: InquiryOffer[];
    loading: boolean;
    onAdd: () => void;
    onEdit: (item: InquiryItem) => void;
    onToggleUrgent: (item: InquiryItem) => void;
    onDelete: (item: InquiryItem) => void;
    onGoOffers: () => void;
    busyItemId: string | null;
}

function ItemRow({ item, offerCount, variant, busy, onEdit, onToggleUrgent, onDelete, onGoOffers }: {
    item: InquiryItem;
    offerCount: number;
    variant: 'urgent' | 'regular';
    busy: boolean;
    onEdit: () => void;
    onToggleUrgent: () => void;
    onDelete: () => void;
    onGoOffers: () => void;
}) {
    const urgent = variant === 'urgent';
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={`rounded-2xl border-2 bg-white p-3.5 dark:bg-gray-900 ${
                urgent
                    ? 'border-brand-amber/40 bg-brand-amber-soft/30 dark:bg-amber-500/5'
                    : 'border-stone-100 dark:border-gray-800'
            } ${busy ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
                <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${
                    urgent ? 'bg-brand-amber text-white' : 'bg-stone-100 text-stone-400 dark:bg-gray-800'
                }`}>
                    {urgent ? <Megaphone className="size-4" /> : <PackageSearch className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[14px] font-extrabold text-stone-900 dark:text-gray-100">{item.name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                        {item.brand && (
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-500 dark:bg-gray-800 dark:text-gray-400">
                                {item.brand}
                            </span>
                        )}
                        {(item.quantity || item.unit) && (
                            <span className="rounded-full bg-brand-amber-soft px-2 py-0.5 text-amber-700 dark:text-amber-400">
                                {item.quantity ? faNum(item.quantity) : ''} {item.unit}
                            </span>
                        )}
                        {!!item.specs?.length && (
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-400 dark:bg-gray-800 dark:text-gray-500">
                                {faNum(item.specs.length)} ویژگی
                            </span>
                        )}
                        {item.note && <span className="text-stone-300 dark:text-gray-600">یادداشت دارد</span>}
                    </div>
                </div>
                {offerCount > 0 && (
                    <button onClick={onGoOffers} title="دیدن پیشنهادها"
                        className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <MessageSquareText className="size-3" />
                        {faNum(offerCount)} پیشنهاد
                    </button>
                )}
            </div>

            <div className="mt-3 flex items-center gap-1.5 border-t border-dashed border-stone-100 pt-2.5 dark:border-gray-800">
                {urgent ? (
                    <button onClick={onToggleUrgent} disabled={busy}
                        className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 disabled:opacity-50 dark:hover:bg-gray-800">
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <BellOff className="size-3.5" />}
                        پایان اعلام
                    </button>
                ) : (
                    <button onClick={onToggleUrgent} disabled={busy}
                        className="flex h-8 items-center gap-1.5 rounded-lg bg-brand-amber-soft px-2.5 text-[11px] font-extrabold text-amber-700 transition-colors hover:bg-brand-amber-tint disabled:opacity-50 dark:bg-amber-500/10 dark:text-amber-400">
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Megaphone className="size-3.5" />}
                        اعلام خرید
                    </button>
                )}
                <button onClick={onEdit} aria-label="ویرایش قلم" title="ویرایش"
                    className="grid size-8 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-gray-800">
                    <Pencil className="size-3.5" />
                </button>
                <span className="flex-1" />
                <button onClick={onDelete} aria-label="حذف قلم" title="حذف"
                    className="grid size-8 place-items-center rounded-lg text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10">
                    <Trash2 className="size-3.5" />
                </button>
            </div>
        </motion.div>
    );
}

export default function ItemsTab({ detail, offers, loading, onAdd, onEdit, onToggleUrgent, onDelete, onGoOffers, busyItemId }: Props) {
    const items = detail.items ?? [];
    const urgentItems = items.filter((i) => i.urgent);
    const otherItems = items.filter((i) => !i.urgent);
    const countByItem = offers.reduce<Record<string, number>>((acc, o) => {
        if (o.itemId) acc[o.itemId] = (acc[o.itemId] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-4">
            {/* دکمه افزودن */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onAdd}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-amber/60 bg-brand-amber-soft/40 text-sm font-extrabold text-amber-700 transition-colors hover:bg-brand-amber-soft dark:bg-amber-500/10 dark:text-amber-400">
                <Plus className="size-4" />
                افزودن قلم خرید
            </motion.button>

            {loading ? (
                <div className="space-y-3">
                    {[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/70 dark:bg-gray-900/70" />)}
                </div>
            ) : items.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-brand-amber-tint bg-white px-6 py-14 text-center dark:bg-gray-900">
                    <span className="grid size-16 place-items-center rounded-full bg-brand-amber-soft text-amber-500">
                        <PackageSearch className="size-8" />
                    </span>
                    <div>
                        <h3 className="text-lg font-black">اولین قلمت رو اضافه کن</h3>
                        <p className="mt-1.5 text-xs font-bold leading-6 text-stone-400 dark:text-gray-500">
                            قلم به قلم لیست خریدت ساخته می‌شه —
                            <br />
                            هر قلم رو می‌تونی همین حالا «اعلام خرید» کنی.
                        </p>
                    </div>
                </motion.div>
            ) : (
                <>
                    {/* اعلام خریدهای فعال */}
                    {urgentItems.length > 0 && (
                        <section>
                            <h2 className="mb-2 flex items-center gap-2 px-1 text-[13px] font-black text-amber-700 dark:text-amber-400">
                                <Megaphone className="size-4" />
                                اعلام خریدهای فعال
                                <span className="rounded-full bg-brand-amber px-2 py-0.5 text-[9px] font-black text-white">
                                    {faNum(urgentItems.length)}
                                </span>
                            </h2>
                            <div className="space-y-2.5">
                                <AnimatePresence mode="popLayout">
                                    {urgentItems.map((it) => (
                                        <ItemRow key={it.id} item={it} variant="urgent" busy={busyItemId === it.id}
                                            offerCount={countByItem[it.id] || 0}
                                            onEdit={() => onEdit(it)}
                                            onToggleUrgent={() => onToggleUrgent(it)}
                                            onDelete={() => onDelete(it)}
                                            onGoOffers={onGoOffers}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>
                    )}

                    {/* سایر کالاها */}
                    {otherItems.length > 0 && (
                        <section>
                            <h2 className="mb-2 flex items-center gap-2 px-1 text-[13px] font-black text-stone-500 dark:text-gray-400">
                                <PackageSearch className="size-4" />
                                سایر کالاها
                                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold text-stone-400 dark:bg-gray-800">
                                    {faNum(otherItems.length)}
                                </span>
                                {!detail.allowNonUrgentOffers && (
                                    <span className="ms-auto text-[10px] font-bold text-stone-300 dark:text-gray-600">قیمت‌گیری بسته</span>
                                )}
                            </h2>
                            <div className="space-y-2.5">
                                <AnimatePresence mode="popLayout">
                                    {otherItems.map((it) => (
                                        <ItemRow key={it.id} item={it} variant="regular" busy={busyItemId === it.id}
                                            offerCount={countByItem[it.id] || 0}
                                            onEdit={() => onEdit(it)}
                                            onToggleUrgent={() => onToggleUrgent(it)}
                                            onDelete={() => onDelete(it)}
                                            onGoOffers={onGoOffers}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
