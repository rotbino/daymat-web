// app/my-inquiries/components/OffersTab.tsx
// تب پیشنهادهای دریافتی پنل بازوی خرید — پذیرش/رد همین‌جا (قبلاً فقط صفحه عمومی بود)
'use client';

import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquareText, Truck, Phone, Megaphone, Share2,
} from 'lucide-react';
import { faNum, faPrice, faTimeAgo, STATUS_FA, STATUS_CHIP } from '../../inquiries/utils';
import type { InquiryDetail, InquiryItem, InquiryOffer } from '@/lib/api/apiTypes';

interface Props {
    detail: InquiryDetail;
    offers: InquiryOffer[];
    loading: boolean;
    onDecide: (offerId: string, status: 'accepted' | 'rejected') => void;
    onGoPublish: () => void;
    busyOfferId: string | null;
}

export default function OffersTab({ detail, offers, loading, onDecide, onGoPublish, busyOfferId }: Props) {
    const items = detail.items ?? [];
    const itemNameById = items.reduce<Record<string, string>>((acc, it: InquiryItem) => {
        acc[it.id] = it.name;
        return acc;
    }, {});

    return (
        <div className="space-y-3">
            {loading ? (
                <div className="space-y-3">
                    {[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/70 dark:bg-gray-900/70" />)}
                </div>
            ) : offers.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-brand-contrast-tint bg-white px-6 py-14 text-center dark:bg-gray-900">
                    <span className="grid size-16 place-items-center rounded-full bg-brand-contrast-soft text-amber-500">
                        <MessageSquareText className="size-8" />
                    </span>
                    <div>
                        <h3 className="text-base font-black">هنوز پیشنهادی نیومده</h3>
                        <p className="mt-1 text-xs font-bold text-stone-400 dark:text-gray-500">
                            لینک بازوی خریدت رو برای تامین‌کننده‌ها بفرست.
                        </p>
                    </div>
                    <button onClick={onGoPublish}
                        className="flex h-10 items-center gap-2 rounded-full bg-brand-contrast px-5 text-xs font-extrabold text-white shadow-md shadow-brand-contrast/25 transition-colors hover:bg-brand-contrast-strong">
                        <Share2 className="size-3.5" />
                        اشتراک‌گذاری
                    </button>
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    {offers.map((o, i) => {
                        const busy = busyOfferId === o.id;
                        const ctx = o.itemName || (o.itemId ? itemNameById[o.itemId] : null);
                        return (
                            <motion.div
                                key={o.id}
                                layout
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ delay: Math.min(i, 6) * 0.04 }}
                                className={`rounded-2xl border-2 bg-white p-4 dark:bg-gray-900 ${
                                    o.status === 'accepted' ? 'border-emerald-300 dark:border-emerald-500/40' : 'border-stone-100 dark:border-gray-800'
                                } ${busy ? 'opacity-60' : ''}`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-2.5">
                                        {o.business?.logoUrl ? (
                                            <Image src={o.business.logoUrl} alt="" width={40} height={40} className="size-10 rounded-xl object-cover" unoptimized />
                                        ) : (
                                            <span className="grid size-10 place-items-center rounded-xl bg-brand-contrast-soft text-xs font-black text-amber-700 dark:text-amber-400">
                                                {(o.business?.name || o.offerer?.fullName || 'ت').charAt(0)}
                                            </span>
                                        )}
                                        <div>
                                            <p className="text-sm font-extrabold text-stone-900 dark:text-gray-100">{o.business?.name || o.offerer?.fullName || 'تامین‌کننده'}</p>
                                            <p className="text-[11px] text-stone-400 dark:text-gray-500">{faTimeAgo(o.createdAt)}</p>
                                        </div>
                                    </div>
                                    <div className="text-end">
                                        <p className="text-base font-black text-brand-contrast">{faPrice(o.price)}</p>
                                        {o.priceBasis && <p className="text-[10px] font-bold text-stone-400">{o.priceBasis}</p>}
                                    </div>
                                </div>

                                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-stone-400">
                                    {ctx && (
                                        <span className="flex items-center gap-1 rounded-full bg-brand-contrast-soft px-2 py-0.5 text-amber-700 dark:text-amber-400">
                                            <Megaphone className="size-3" /> {ctx}
                                        </span>
                                    )}
                                    {o.deliveryDays != null && <span className="flex items-center gap-1"><Truck className="size-3" /> {faNum(o.deliveryDays)} روزه</span>}
                                    {o.contactPhone && (
                                        <a href={`tel:${o.contactPhone}`} className="flex items-center gap-1 hover:text-amber-600" dir="ltr">
                                            <Phone className="size-3" /> {o.contactPhone}
                                        </a>
                                    )}
                                    <span className={`rounded-full px-2 py-0.5 ${STATUS_CHIP[o.status] ?? ''}`}>{STATUS_FA[o.status]}</span>
                                </div>

                                {o.message && (
                                    <p className="mt-2 rounded-xl bg-stone-50 px-3 py-2 text-xs leading-6 text-stone-600 dark:bg-gray-950/60 dark:text-gray-300">{o.message}</p>
                                )}

                                {o.status === 'pending' && (
                                    <div className="mt-3 flex gap-2">
                                        <button onClick={() => onDecide(o.id, 'accepted')} disabled={busy}
                                            className="h-10 flex-1 rounded-full bg-emerald-500 text-xs font-extrabold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50">
                                            پذیرش
                                        </button>
                                        <button onClick={() => onDecide(o.id, 'rejected')} disabled={busy}
                                            className="h-10 flex-1 rounded-full border border-red-100 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20 dark:hover:bg-red-500/10">
                                            رد
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            )}
        </div>
    );
}
