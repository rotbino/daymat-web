// app/inquiries/page.tsx
// دیوار عمومی کاتالوگ‌های خرید — محصول دوم دیمت (کهربایی برند)
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { usePublicInquiries } from '@/lib/api/apiHooks';
import {
    ClipboardList, Search, MapPin, Clock, Users, ShoppingBasket,
    ArrowLeft, Plus, Store, PackageSearch, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { faNum, faTimeAgo, faDeadlineLeft } from './utils';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' as const },
    transition: { duration: 0.5, delay, ease: 'easeOut' as const },
});

export default function InquiriesWallPage() {
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);

    const [q, setQ] = useState('');
    const [qInput, setQInput] = useState('');
    const [page, setPage] = useState(1);

    // دیبانس سبک بدون وابستگی
    useEffect(() => {
        const t = setTimeout(() => {
            setQ(qInput);
            setPage(1);
        }, 400);
        return () => clearTimeout(t);
    }, [qInput]);

    const { data, isLoading, isFetching } = usePublicInquiries({ q, page, limit: 12 });
    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / 12));

    const newHref = useMemo(
        () => (isAuthenticated ? '/inquiries/new' : `/login?redirect=${encodeURIComponent('/inquiries/new')}`),
        [isAuthenticated],
    );

    // عنوان صفحه
    useEffect(() => {
        document.title = 'کاتالوگ‌های خرید باز | دیمت';
    }, []);

    return (
        <div className="min-h-screen bg-[#FFFDF7] text-stone-900 dark:bg-gray-950 dark:text-gray-100">
            {/* ─── هدر ─── */}
            <header className="sticky top-0 z-40 border-b border-brand-amber-tint/70 bg-[#FFFDF7]/85 backdrop-blur-md
                dark:border-gray-800 dark:bg-gray-950/85">
                <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-3 px-4 sm:px-6">
                    <Link href="/" className="flex items-center gap-2" aria-label="دیمت">
                        <Image src="/images/logo3.png" alt="دیمت" width={96} height={33} className="h-8 w-auto object-contain" unoptimized priority />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Link href="/my-inquiries"
                            className="hidden rounded-full border border-stone-300 px-4 py-2 text-xs font-bold text-stone-700 transition-colors hover:border-stone-900
                            dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300 sm:block">
                            کاتالوگ‌های خرید من
                        </Link>
                        <Link href={newHref}
                            className="flex h-9 items-center gap-1.5 rounded-full bg-brand-amber px-4 text-xs font-extrabold text-white shadow-md shadow-brand-amber/30 transition-colors hover:bg-brand-amber-strong">
                            <Plus className="size-4" />
                            بساز
                        </Link>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
                {/* ─── هیرو ─── */}
                <section className="pb-6 pt-10 text-center sm:pt-14">
                    <motion.span {...fadeUp()}
                        className="inline-flex items-center gap-1.5 rounded-full border border-brand-amber-tint bg-brand-amber-soft px-4 py-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <ClipboardList className="size-3.5" />
                        دیوار کاتالوگ‌های خرید
                    </motion.span>
                    <motion.h1 {...fadeUp(0.08)} className="mx-auto mt-4 max-w-2xl text-3xl font-black leading-[1.4] sm:text-4xl">
                        چیزی می‌خری؟ <span className="text-brand-amber">لیستت رو بذار</span>، قیمت‌ها رو بگیر
                    </motion.h1>
                    <motion.p {...fadeUp(0.16)} className="mx-auto mt-3 max-w-xl leading-7 text-stone-600 dark:text-gray-400">
                        اینجا لیست خرید بقیه رو می‌بینی — اگه تامین‌کننده‌ای، روش قیمت بذار؛
                        اگه خریداری، با یک دکمه کاتالوگ خرید خودت رو بساز.
                    </motion.p>
                </section>

                {/* ─── جستجو ─── */}
                <motion.div {...fadeUp(0.2)} className="sticky top-16 z-30 -mx-4 bg-[#FFFDF7]/90 px-4 py-3 backdrop-blur-sm dark:bg-gray-950/90 sm:mx-0 sm:rounded-2xl sm:px-4">
                    <div className="relative">
                        <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
                        <input
                            value={qInput}
                            onChange={(e) => setQInput(e.target.value)}
                            placeholder="جستجو در کاتالوگ‌های خرید… مثلاً روغن، گوجه، یاتاقان"
                            className="h-12 w-full rounded-2xl border-2 border-stone-200 bg-white ps-12 pe-4 text-sm font-medium outline-none transition-colors
                            placeholder:text-stone-400 focus:border-brand-amber
                            dark:border-gray-700 dark:bg-gray-900 dark:placeholder:text-gray-500"
                        />
                        {isFetching && (
                            <span className="absolute end-4 top-1/2 size-4 -translate-y-1/2 animate-spin rounded-full border-2 border-brand-amber border-t-transparent" />
                        )}
                    </div>
                </motion.div>

                {/* ─── شمارش ─── */}
                <div className="mt-2 flex items-center justify-between px-1 text-xs font-bold text-stone-400 dark:text-gray-500">
                    <span>{isLoading ? '…' : `${faNum(total)} کاتالوگ خرید باز`}</span>
                    <span>تازه‌ها اول</span>
                </div>

                {/* ─── لیست ─── */}
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                    <AnimatePresence mode="popLayout">
                        {isLoading
                            ? Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="h-40 animate-pulse rounded-3xl border border-stone-100 bg-white/60 dark:border-gray-800 dark:bg-gray-900/60" />
                            ))
                            : items.map((w, i) => {
                                const dl = faDeadlineLeft(w.deadline);
                                return (
                                    <motion.div
                                        key={w.id}
                                        layout
                                        initial={{ opacity: 0, y: 18 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        transition={{ duration: 0.35, delay: Math.min(i, 6) * 0.05 }}
                                    >
                                        <Link
                                            href={`/inquiries/${w.slug || w.id}`}
                                            className="group flex h-full flex-col rounded-3xl border-2 border-stone-100 bg-white p-5 shadow-sm transition-all
                                            hover:-translate-y-1 hover:border-brand-amber-tint hover:shadow-lg hover:shadow-brand-amber/10
                                            dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
                                        >
                                            {/* سرتیتر */}
                                            <div className="flex items-start gap-3">
                                                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-amber-soft text-amber-600 dark:text-amber-400">
                                                    <ShoppingBasket className="size-5" />
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="line-clamp-1 text-base font-black text-stone-900 transition-colors group-hover:text-amber-700 dark:text-gray-100 dark:group-hover:text-amber-400">
                                                        {w.title}
                                                    </h3>
                                                    <p className="mt-0.5 truncate text-xs text-stone-400 dark:text-gray-500">
                                                        {w.business?.name || w.owner?.fullName || 'کاربر دیمت'}
                                                    </p>
                                                </div>
                                                {w.status === 'open' ? (
                                                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-extrabold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                        <span className="size-1.5 rounded-full bg-emerald-500" />
                                                        باز
                                                    </span>
                                                ) : null}
                                            </div>

                                            {/* متا */}
                                            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] font-bold text-stone-500 dark:text-gray-400">
                                                {(w._count?.items ?? 0) > 0 && (
                                                    <span className="flex items-center gap-1"><ClipboardList className="size-3.5 text-stone-400" /> {faNum(w._count?.items)} قلم</span>
                                                )}
                                                {w.city && <span className="flex items-center gap-1"><MapPin className="size-3.5 text-stone-400" /> {w.city}</span>}
                                                {dl && (
                                                    <span className={`flex items-center gap-1 ${dl.urgent ? 'text-red-500 dark:text-red-400' : ''}`}>
                                                        <Clock className="size-3.5" /> {dl.text}
                                                    </span>
                                                )}
                                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                    <Users className="size-3.5" /> {faNum(w.offerCount)} پیشنهاد
                                                </span>
                                            </div>

                                            {/* برچسب‌ها */}
                                            {w.tags.length > 0 && (
                                                <div className="mt-3 flex flex-wrap gap-1.5">
                                                    {w.tags.slice(0, 3).map((t) => (
                                                        <span key={t} className="rounded-full bg-stone-100 px-2.5 py-0.5 text-[10px] font-bold text-stone-500 dark:bg-gray-800 dark:text-gray-400">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* پایین کارت */}
                                            <div className="mt-4 flex items-center justify-between border-t border-dashed border-stone-100 pt-3 dark:border-gray-800">
                                                <span className="text-[10px] text-stone-400 dark:text-gray-500">{faTimeAgo(w.createdAt)}</span>
                                                <span className="flex items-center gap-1 text-xs font-extrabold text-amber-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-amber-400">
                                                    دیدن لیست
                                                    <ArrowLeft className="size-3.5" />
                                                </span>
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                    </AnimatePresence>
                </div>

                {/* ─── خالی ─── */}
                {!isLoading && items.length === 0 && (
                    <motion.div {...fadeUp()} className="mt-8 flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-brand-amber-tint bg-white px-6 py-14 text-center dark:bg-gray-900">
                        <span className="grid size-16 place-items-center rounded-full bg-brand-amber-soft text-amber-500">
                            <PackageSearch className="size-8" />
                        </span>
                        <div>
                            <h3 className="text-lg font-black">هنوز کاتالوگ خریدی با این جستجو نیست</h3>
                            <p className="mt-1 text-sm text-stone-500 dark:text-gray-400">اولین نفر باش؛ لیست خریدت رو بذار تا تامین‌کننده‌ها سراغت بیان.</p>
                        </div>
                        <Link href={newHref}
                            className="flex h-11 items-center gap-2 rounded-full bg-brand-amber px-6 text-sm font-extrabold text-white shadow-lg shadow-brand-amber/30 transition-colors hover:bg-brand-amber-strong">
                            <Plus className="size-4" />
                            کاتالوگ خریدم رو می‌سازم
                        </Link>
                    </motion.div>
                )}

                {/* ─── صفحه‌بندی ─── */}
                {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-3">
                        <button
                            disabled={page <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 font-bold transition-colors disabled:opacity-30 enabled:hover:border-brand-amber dark:border-gray-700">
                            <ChevronRight className="size-4" />
                        </button>
                        <span className="text-sm font-black text-stone-500 dark:text-gray-400">
                            {faNum(page)} از {faNum(totalPages)}
                        </span>
                        <button
                            disabled={page >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-stone-200 font-bold transition-colors disabled:opacity-30 enabled:hover:border-brand-amber dark:border-gray-700">
                            <ChevronLeft className="size-4" />
                        </button>
                    </div>
                )}

                {/* ─── CTA پایانی: تامین‌کننده هستی؟ ─── */}
                <motion.section {...fadeUp()} className="mt-14 rounded-3xl bg-stone-900 px-6 py-8 text-center text-white dark:bg-gray-800">
                    <h3 className="text-lg font-black sm:text-xl">تامین‌کننده هستی؟ این لیست‌ها مشتری‌اند</h3>
                    <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-gray-300">
                        روی هر کاتالوگ خرید که بتونی جواب بدی، قیمت بذار؛ خریدار مستقیم با تو معامله می‌کنه.
                    </p>
                    <Link href={newHref}
                        className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-brand-amber px-6 text-sm font-extrabold text-white shadow-lg shadow-brand-amber/30 transition-colors hover:bg-brand-amber-strong">
                        <Store className="size-4" />
                        منم کاتالوگ خرید می‌سازم
                    </Link>
                </motion.section>
            </main>

            {/* فوتر کوچک */}
            <footer className="border-t border-stone-200 py-6 text-center text-xs text-stone-400 dark:border-gray-800 dark:text-gray-500">
                <Link href="/" className="font-bold hover:text-brand-amber">دیمت</Link>
                {' '}— فروش با کاتالوگ فروش، خرید با کاتالوگ خرید
            </footer>
        </div>
    );
}
