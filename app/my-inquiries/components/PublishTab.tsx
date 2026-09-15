// app/my-inquiries/components/PublishTab.tsx
// تب انتشار پنل بازوی خرید — قرینهٔ تب انتشار کاتالوگ قیمت:
//   لینک عمومی + کیت اشتراک‌گذاری (مخاطبان تلفن، واتساپ/تلگرام، QR چاپی)
//   + 🪪 کارت ویزیت برای تامین‌کننده‌ها (استودیو + پیش‌نمایش کارت ذخیره‌شده)
//   + وضعیت انتشار
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Copy, Eye, Globe, IdCard, Link2, Lock, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
    slug?: string | null;
    id: string;
    title: string;
    visibility: 'public' | 'unlisted' | 'private';
    /** باز کردن کیت اشتراک‌گذاری (مخاطبان، واتساپ/تلگرام، QR چاپی) */
    onOpenShare: () => void;
    /** 🪪 باز کردن استودیوی کارت ویزیت (قرینهٔ کاتالوگ قیمت) */
    onOpenCard: () => void;
    /** کارت ذخیره‌شده (metadata.visitCard) — با بودنش پیش‌نمایش کارت نشان داده می‌شود */
    savedCard?: any;
}

export default function PublishTab({ slug, id, title, visibility, onOpenShare, onOpenCard, savedCard }: Props) {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/${slug || id}` : `/${slug || id}`;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            toast.success('لینک کپی شد — بفرستش برای تامین‌کننده‌ها');
        } catch { /* noop */ }
    };

    return (
        <div className="space-y-3">
            {/* لینک عمومی صفحه — همان چیزی که تامین‌کننده می‌بیند */}
            <motion.section
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-stone-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h2 className="mb-3 text-[12px] font-black text-stone-400 dark:text-gray-500">لینک بازوی خرید</h2>
                <div className="flex items-center gap-2">
                    <div dir="ltr" className="flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50 px-3 dark:border-gray-700 dark:bg-gray-950/60">
                        <Link2 className="me-2 size-4 shrink-0 text-brand-contrast" />
                        <span className="truncate text-xs font-bold text-stone-600 dark:text-gray-300">{url}</span>
                    </div>
                    <button onClick={copy} aria-label="کپی لینک"
                        className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-contrast text-white shadow-md shadow-brand-contrast/25 transition-colors hover:bg-brand-contrast-strong">
                        <Copy className="size-4" />
                    </button>
                </div>
            </motion.section>

            {/* کیت اشتراک‌گذاری — مخاطبان تلفن + واتساپ/تلگرام + QR چاپی */}
            <ShareKitButton onOpen={onOpenShare} />

            {/* 🪪 کارت ویزیت بازوی خرید — برای تامین‌کننده‌ها (بنا بر خواستهٔ کاربر) */}
            <VisitCardEntry savedCard={savedCard} onOpen={onOpenCard} />

            {/* وضعیت انتشار + پیش‌نمایش */}
            <motion.section
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className={`rounded-2xl border p-4 ${visibility === 'public'
                    ? 'border-brand-contrast-tint bg-brand-contrast-soft/50 dark:bg-amber-500/5'
                    : 'border-stone-100 bg-stone-50 dark:border-gray-800 dark:bg-gray-950/60'}`}>
                <div className="flex items-start gap-2.5">
                    {visibility === 'public'
                        ? <Globe className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        : <Lock className="mt-0.5 size-4 shrink-0 text-stone-400" />}
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-stone-700 dark:text-gray-200">
                            {visibility === 'private'
                                ? 'این بازوی خرید خصوصیه — فقط تامین‌کننده‌های تاییدشده می‌بینن'
                                : visibility === 'unlisted'
                                    ? 'این بازوی خرید فقط با لینک دیده می‌شه'
                                    : 'این بازوی خرید عمومیه — هرکس لینک را داشته باشد می‌بیند'}
                        </p>
                        <p className="mt-0.5 text-[11px] font-bold leading-5 text-stone-400 dark:text-gray-500">
                            {visibility === 'private'
                                ? 'بازوی خریدت فقط دست اعضای تب «تامین‌کنندگان» می‌رسه.'
                                : 'لینک را برای تامین‌کننده‌ها بفرست — و بعداً می‌تونی صفحه‌ات را به بازارها هم عرضه کنی.'}
                        </p>
                    </div>
                </div>
                <Link href={`/${slug || id}`}
                    className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 text-xs font-extrabold text-stone-600 transition-colors hover:border-brand-contrast hover:text-amber-700 dark:border-gray-700 dark:text-gray-300">
                    <Eye className="size-3.5" />
                    دیدن بازوی خرید
                </Link>
            </motion.section>
        </div>
    );
}

/** دکمهٔ کیت اشتراک‌گذاری — با کلیک، ShareKitModal در پنل باز می‌شود */
function ShareKitButton({ onOpen }: { onOpen: () => void }) {
    return (
        <motion.button type="button" onClick={onOpen}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="flex w-full items-center gap-3.5 rounded-2xl border border-brand-contrast-tint bg-gradient-to-l from-brand-contrast-soft/60 to-transparent p-4 text-right transition-colors hover:border-brand-contrast dark:border-amber-500/20 dark:from-amber-500/10">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-contrast-soft dark:bg-amber-500/15">
                <Share2 className="size-5 text-amber-600 dark:text-amber-400" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-amber-700 dark:text-amber-300">کیت اشتراک‌گذاری صفحه</span>
                <span className="mt-0.5 block text-[11px] font-bold text-stone-400 dark:text-gray-500">
                    لینک + پیام آماده + ارسال به مخاطبین + QR چاپی
                </span>
            </span>
        </motion.button>
    );
}

/** 🪪 کارت ویزیت — با کارت ذخیره‌شده، پیش‌نمایشش همین‌جا دیده می‌شود */
function VisitCardEntry({ savedCard, onOpen }: { savedCard?: any; onOpen: () => void }) {
    const cardPreview = typeof savedCard?.preview === 'string' && savedCard.preview.startsWith('data:image')
        ? savedCard.preview : null;
    const savedLabel = savedCard?.updatedAt
        ? new Date(savedCard.updatedAt).toLocaleDateString('fa-IR')
        : null;

    if (cardPreview) {
        return (
            <motion.button type="button" onClick={onOpen}
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                className={cn('flex w-full items-center gap-3.5 rounded-2xl border border-stone-100 bg-white p-3.5 text-right transition-colors hover:border-brand-contrast dark:border-gray-800 dark:bg-gray-900')}>
                <span className="h-[41px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-stone-200 dark:ring-gray-700">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={cardPreview} alt="کارت ویزیت بازوی خرید" className="size-full object-cover" />
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block text-sm font-extrabold text-stone-800 dark:text-gray-200">کارت ویزیت بازوی خرید</span>
                    <span className="mt-0.5 block truncate text-[11px] font-bold text-stone-400 dark:text-gray-500">
                        {savedLabel ? `ذخیره‌شده در ${savedLabel} — ` : 'ذخیره‌شده — '}برای ویرایش لمس کن
                    </span>
                </span>
                <IdCard className="size-4.5 shrink-0 text-amber-600 dark:text-amber-400" />
            </motion.button>
        );
    }
    return (
        <motion.button type="button" onClick={onOpen}
            initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            className="flex w-full items-center gap-3.5 rounded-2xl border border-stone-100 bg-white p-4 text-right transition-colors hover:border-brand-contrast dark:border-gray-800 dark:bg-gray-900">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-contrast-soft dark:bg-amber-500/15">
                <IdCard className="size-5 text-amber-600 dark:text-amber-400" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold text-amber-700 dark:text-amber-300">ساخت کارت ویزیت برای تامین‌کننده‌ها</span>
                <span className="mt-0.5 block text-[11px] font-bold text-stone-400 dark:text-gray-500">
                    طرح چاپی ۹×۵ با QR بازوی خرید — کلاس‌کار بمان تویی
                </span>
            </span>
        </motion.button>
    );
}
