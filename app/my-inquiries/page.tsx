// app/my-inquiries/page.tsx
// کاتالوگ‌های خرید من — مدیریت لیست‌های استعلام (محصول دوم دیمت)
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useMyInquiries, useUpdateInquiry, useDeleteInquiry } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import NavTabs from '@/app/home/nav/NavTabs';
import {
    ClipboardList, Plus, MapPin, Clock, Users, Loader2,
    Ban, RotateCcw, Trash2, ArrowLeft, PackageSearch, Eye,
} from 'lucide-react';
import { faNum, faTimeAgo, faDeadlineLeft, STATUS_FA, STATUS_CHIP } from '../inquiries/utils';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' as const },
    transition: { duration: 0.5, delay, ease: 'easeOut' as const },
});

export default function MyInquiriesPage() {
    const router = useRouter();
    const { isAuthenticated, _hydrated } = useSelector((s: RootState) => s.auth) as any;
    const hydrated = _hydrated !== false;

    const { data: items, isLoading } = useMyInquiries();
    const updateInquiry = useUpdateInquiry();
    const deleteInquiry = useDeleteInquiry();
    const [busyId, setBusyId] = useState<string | null>(null);

    useEffect(() => {
        document.title = 'کاتالوگ‌های خرید من | دیمت';
    }, []);

    useEffect(() => {
        if (hydrated && !isAuthenticated) {
            router.replace(`/login?redirect=${encodeURIComponent('/my-inquiries')}`);
        }
    }, [hydrated, isAuthenticated, router]);

    const toggleStatus = async (id: string, current: string) => {
        setBusyId(id);
        try {
            await updateInquiry.mutateAsync({ id, data: { status: current === 'open' ? 'closed' : 'open' } });
            toast.success(current === 'open' ? 'لیست بسته شد' : 'لیست باز شد');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'تغییر وضعیت ناموفق بود');
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (id: string) => {
        if (!window.confirm('این کاتالوگ خرید برای همیشه حذف شود؟')) return;
        setBusyId(id);
        try {
            await deleteInquiry.mutateAsync(id);
            toast.success('حذف شد');
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'حذف ناموفق بود');
        } finally {
            setBusyId(null);
        }
    };

    if (!hydrated || !isAuthenticated) {
        return (
            <div className="grid min-h-screen place-items-center bg-gradient-to-b from-surface to-surface-container-low/40 dark:from-gray-950 dark:to-gray-900/40">
                <Loader2 className="size-8 animate-spin text-brand-amber" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40
            dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40 pb-24">
            <NavTabs />
            <main className="mx-auto max-w-4xl px-4 md:pt-6">
                {/* سرآیند */}
                <motion.div {...fadeUp()} className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 className="flex items-center gap-2 text-xl font-black sm:text-2xl">
                            <span className="grid size-9 place-items-center rounded-xl bg-brand-amber-soft text-amber-600 dark:text-amber-400">
                                <ClipboardList className="size-5" />
                            </span>
                            کاتالوگ‌های خرید من
                        </h1>
                        <p className="mt-1 text-xs text-stone-400 dark:text-gray-500">
                            لیست‌های خریدت اینجان؛ لینک هر کدوم رو بده تامین‌کننده‌ها تا قیمت بدن.
                        </p>
                    </div>
                    <Link href="/inquiries/new"
                        className="flex h-11 items-center gap-2 rounded-full bg-brand-amber px-5 text-sm font-extrabold text-white shadow-lg shadow-brand-amber/30 transition-colors hover:bg-brand-amber-strong">
                        <Plus className="size-4" />
                        کاتالوگ خرید جدید
                    </Link>
                </motion.div>

                {/* لیست */}
                {isLoading ? (
                    <div className="grid gap-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-28 animate-pulse rounded-3xl bg-white/70 dark:bg-gray-900/70" />
                        ))}
                    </div>
                ) : (items ?? []).length === 0 ? (
                    <motion.div {...fadeUp(0.1)} className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-brand-amber-tint bg-white px-6 py-16 text-center dark:bg-gray-900">
                        <span className="grid size-16 place-items-center rounded-full bg-brand-amber-soft text-amber-500">
                            <PackageSearch className="size-8" />
                        </span>
                        <div>
                            <h3 className="text-lg font-black">هنوز کاتالوگ خریدی نساختی</h3>
                            <p className="mt-1 text-sm text-stone-500 dark:text-gray-400">
                                لیست خریدت رو بنویس — از چند قلم ساده شروع کن، تامین‌کننده‌ها قیمت می‌دن.
                            </p>
                        </div>
                        <Link href="/inquiries/new"
                            className="flex h-11 items-center gap-2 rounded-full bg-brand-amber px-6 text-sm font-extrabold text-white shadow-lg shadow-brand-amber/30 transition-colors hover:bg-brand-amber-strong">
                            <Plus className="size-4" />
                            ساخت اولین کاتالوگ خرید
                        </Link>
                    </motion.div>
                ) : (
                    <div className="grid gap-3">
                        <AnimatePresence>
                            {(items ?? []).map((w, i) => {
                                const dl = faDeadlineLeft(w.deadline);
                                const busy = busyId === w.id;
                                return (
                                    <motion.div
                                        key={w.id}
                                        layout
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.97 }}
                                        transition={{ delay: Math.min(i, 8) * 0.04 }}
                                        className="rounded-3xl border-2 border-stone-100 bg-white p-4 shadow-sm transition-colors hover:border-brand-amber-tint dark:border-gray-800 dark:bg-gray-900 sm:p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <Link href={`/inquiries/${w.slug || w.id}`} className="group min-w-0 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="truncate text-base font-black text-stone-900 transition-colors group-hover:text-amber-700 dark:text-gray-100 dark:group-hover:text-amber-400">
                                                        {w.title}
                                                    </h3>
                                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${STATUS_CHIP[w.status] ?? ''}`}>
                                                        {STATUS_FA[w.status]}
                                                    </span>
                                                    {w.visibility === 'unlisted' && (
                                                        <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-400 dark:bg-gray-800">
                                                            فقط با لینک
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-bold text-stone-400 dark:text-gray-500">
                                                    <span>{faNum(w._count?.items)} قلم</span>
                                                    {w.city && <span className="flex items-center gap-1"><MapPin className="size-3" /> {w.city}</span>}
                                                    {dl && (
                                                        <span className={`flex items-center gap-1 ${dl.urgent ? 'text-red-500 dark:text-red-400' : ''}`}>
                                                            <Clock className="size-3" /> {dl.text}
                                                        </span>
                                                    )}
                                                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                                                        <Users className="size-3" /> {faNum(w.offerCount)} پیشنهاد
                                                    </span>
                                                    <span>{faTimeAgo(w.createdAt)}</span>
                                                </div>
                                            </Link>

                                            {/* اکشن‌ها */}
                                            <div className="flex shrink-0 items-center gap-1">
                                                <Link href={`/inquiries/${w.slug || w.id}`} aria-label="مشاهده"
                                                    className="grid size-9 place-items-center rounded-xl text-stone-400 transition-colors hover:bg-brand-amber-soft hover:text-amber-600">
                                                    <Eye className="size-4" />
                                                </Link>
                                                <button onClick={() => toggleStatus(w.id, w.status)} disabled={busy} aria-label={w.status === 'open' ? 'بستن' : 'بازکردن'}
                                                    className="grid size-9 place-items-center rounded-xl text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700 disabled:opacity-40 dark:hover:bg-gray-800 dark:hover:text-gray-200">
                                                    {busy ? <Loader2 className="size-4 animate-spin" /> : w.status === 'open' ? <Ban className="size-4" /> : <RotateCcw className="size-4" />}
                                                </button>
                                                <button onClick={() => remove(w.id)} disabled={busy} aria-label="حذف"
                                                    className="grid size-9 place-items-center rounded-xl text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-40 dark:hover:bg-red-500/10">
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>
                )}

                {/* پیش‌نمایش دیوار */}
                {!isLoading && (items ?? []).length > 0 && (
                    <motion.div {...fadeUp(0.15)} className="mt-6 flex items-center justify-between rounded-2xl border border-brand-amber-tint bg-brand-amber-soft/60 px-4 py-3 dark:bg-brand-amber-soft/20">
                        <p className="text-xs font-bold text-amber-800 dark:text-amber-300">کاتالوگ‌های خرید باز همه روی دیوار عمومی هم دیده می‌شن.</p>
                        <Link href="/inquiries" className="flex shrink-0 items-center gap-1 text-xs font-extrabold text-amber-700 hover:underline dark:text-amber-400">
                            دیوار <ArrowLeft className="size-3.5" />
                        </Link>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
