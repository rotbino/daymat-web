// app/my-inquiries/components/PublishTab.tsx
// تب انتشار پنل صفحه خرید — لینک + اشتراک‌گذاری (واتساپ/تلگرام/سیستمی) + وضعیت انتشار
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { toast } from 'sonner';
import { Check, Copy, Eye, Globe, Link2, Lock, MessageCircle, Send, Share2 } from 'lucide-react';

export default function PublishTab({ slug, id, title, visibility }: {
    slug?: string | null;
    id: string;
    title: string;
    visibility: 'public' | 'unlisted' | 'private';
}) {
    const [copied, setCopied] = useState(false);
    const url = typeof window !== 'undefined' ? `${window.location.origin}/inquiries/${slug || id}` : `/inquiries/${slug || id}`;
    const shareText = `صفحه خرید «${title}» — اگه تامین‌کننده‌ای، قیمت بده: ${url}`;

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success('لینک کپی شد — بفرستش برای تامین‌کننده‌ها');
            setTimeout(() => setCopied(false), 1800);
        } catch { /* noop */ }
    };

    const nativeShare = async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: `صفحه خرید — ${title}`, text: shareText, url });
            } else {
                await copy();
            }
        } catch { /* کاربر لغو کرد */ }
    };

    const btn = 'flex h-12 flex-1 flex-col items-center justify-center gap-1 rounded-2xl border border-stone-100 text-[10px] font-extrabold transition-colors hover:border-brand-amber-tint dark:border-gray-800';

    return (
        <div className="space-y-3">
            {/* لینک کاتالوگ */}
            <motion.section
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-stone-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h2 className="mb-3 text-[12px] font-black text-stone-400 dark:text-gray-500">لینک صفحه خرید</h2>
                <div className="flex items-center gap-2">
                    <div dir="ltr" className="flex h-11 min-w-0 flex-1 items-center overflow-hidden rounded-xl border border-stone-200 bg-stone-50 px-3 dark:border-gray-700 dark:bg-gray-950/60">
                        <Link2 className="me-2 size-4 shrink-0 text-brand-amber" />
                        <span className="truncate text-xs font-bold text-stone-600 dark:text-gray-300">{url}</span>
                    </div>
                    <button onClick={copy} aria-label="کپی لینک"
                        className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-amber text-white shadow-md shadow-brand-amber/25 transition-colors hover:bg-brand-amber-strong">
                        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                    </button>
                </div>
            </motion.section>

            {/* اشتراک‌گذاری */}
            <motion.section
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
                className="rounded-2xl border border-stone-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                <h2 className="mb-3 text-[12px] font-black text-stone-400 dark:text-gray-500">اشتراک‌گذاری</h2>
                <div className="flex gap-2">
                    <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className={`${btn} text-emerald-600 hover:text-emerald-700`}>
                        <MessageCircle className="size-5" />
                        واتساپ
                    </a>
                    <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`صفحه خرید «${title}»`)}`} target="_blank" rel="noreferrer" className={`${btn} text-sky-500 hover:text-sky-600`}>
                        <Send className="size-5" />
                        تلگرام
                    </a>
                    <button onClick={nativeShare} className={`${btn} text-stone-500 hover:text-stone-700 dark:text-gray-400`}>
                        <Share2 className="size-5" />
                        بیشتر
                    </button>
                </div>
            </motion.section>

            {/* وضعیت انتشار + پیش‌نمایش */}
            <motion.section
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className={`rounded-2xl border p-4 ${visibility === 'public'
                    ? 'border-brand-amber-tint bg-brand-amber-soft/50 dark:bg-amber-500/5'
                    : 'border-stone-100 bg-stone-50 dark:border-gray-800 dark:bg-gray-950/60'}`}>
                <div className="flex items-start gap-2.5">
                    {visibility === 'public'
                        ? <Globe className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                        : <Lock className="mt-0.5 size-4 shrink-0 text-stone-400" />}
                    <div className="min-w-0 flex-1">
                        <p className="text-xs font-extrabold text-stone-700 dark:text-gray-200">
                            {visibility === 'private'
                                ? 'این صفحه خرید خصوصیه — فقط تامین‌کننده‌های تاییدشده می‌بینن'
                                : visibility === 'unlisted'
                                    ? 'این صفحه خرید فقط با لینک دیده می‌شه'
                                    : 'این صفحه خرید عمومیه — هرکس لینک را داشته باشد می‌بیند'}
                        </p>
                        <p className="mt-0.5 text-[11px] font-bold leading-5 text-stone-400 dark:text-gray-500">
                            {visibility === 'private'
                                ? 'اعلام خریدهات فقط دست اعضای تب «تامین‌کنندگان» می‌رسه.'
                                : 'لینک را برای تامین‌کننده‌ها بفرست — و بعداً می‌تونی صفحه‌ات را به بازارها هم عرضه کنی.'}
                        </p>
                    </div>
                </div>
                <Link href={`/inquiries/${slug || id}`}
                    className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl border border-stone-200 text-xs font-extrabold text-stone-600 transition-colors hover:border-brand-amber hover:text-amber-700 dark:border-gray-700 dark:text-gray-300">
                    <Eye className="size-3.5" />
                    دیدن صفحه خرید
                </Link>
            </motion.section>
        </div>
    );
}
