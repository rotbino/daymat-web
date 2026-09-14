// app/inquiries/new/page.tsx
// ساخت کاتالوگ خرید — نسخهٔ ۳ (جریان پنل‌محور بر اساس ایدهٔ مالک):
//   کسب‌وکار را انتخاب کن → کاتالوگ ساخته می‌شود → مستقیم به پنل مدیریت می‌روی؛
//   اقلام بعداً قلم‌به‌قلم از پنل اضافه می‌شوند (مثل کاتالوگ فروش که اول کاتالوگ ساخته می‌شود).
//   ذهن کاربر اولِ کار آمادهٔ واردکردن قلم نیست — پس هیچ قلمی اینجا خواسته نمی‌شود.
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { setCurrentInquiry } from '@/lib/store/slices/catalogSlice';
import { useMyBusinesses, useCreateInquiry, useMyInquiries } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import BusinessSelector from '@/app/components/BusinessSelector';
import { ClipboardList, Loader2, Megaphone, Send, Building2 } from 'lucide-react';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' as const },
    transition: { duration: 0.45, delay, ease: 'easeOut' as const },
});

export default function NewInquiryPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { isAuthenticated, _hydrated } = useSelector((s: RootState) => s.auth) as any;
    const hydrated = _hydrated !== false;

    const [biz, setBiz] = useState<any | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const bizRef = useRef<HTMLDivElement | null>(null);

    const create = useCreateInquiry();
    const { data: myBizData } = useMyBusinesses();
    const myBizs = useMemo(
        () => (myBizData?.items ?? []).filter((b: any) => b.canEdit),
        [myBizData],
    );
    const { data: myInquiries } = useMyInquiries();

    // دیپ‌لینک ?bizId= (از کارت کاتالوگ‌ها در مدیریت کسب‌وکار)
    const [bizParam] = useState(() =>
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('bizId') || '' : '',
    );
    useEffect(() => {
        if (biz || myBizs.length === 0) return;
        if (bizParam && myBizs.some((b: any) => b.id === bizParam)) setBiz(myBizs.find((b: any) => b.id === bizParam));
        else if (myBizs.length === 1) setBiz(myBizs[0]);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [myBizs]);

    // گیت ورود
    useEffect(() => {
        if (hydrated && !isAuthenticated) {
            router.replace(`/login?redirect=${encodeURIComponent('/inquiries/new' + (bizParam ? `?bizId=${bizParam}` : ''))}`);
        }
    }, [hydrated, isAuthenticated, router, bizParam]);

    useEffect(() => {
        document.title = 'کاتالوگ خرید جدید | دیمت';
    }, []);

    // کسب‌وکاری که از قبل کاتالوگ خرید باز دارد → مستقیم به پنلش (کاتالوگ خریدِ هر کسب‌وکار یکی است)
    const checkExisting = (b: any): boolean => {
        const existing = (myInquiries ?? []).find((w: any) => w.businessId === b.id && w.status !== 'archived');
        if (existing) {
            toast.info('این کسب‌وکار از قبل کاتالوگ خرید داره — رفتیم به پنلش');
            dispatch(setCurrentInquiry(existing.id));
            router.replace(`/my-inquiries?catalog=${existing.id}`);
            return true;
        }
        return false;
    };

    const onBizChange = (b: any) => {
        setBiz(b);
        if (b) checkExisting(b);
    };

    const submit = async () => {
        if (!biz) {
            toast.error('اول کسب‌وکار رو انتخاب یا ثبت کن');
            bizRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        if (checkExisting(biz)) return;
        setSubmitting(true);
        try {
            const res = await create.mutateAsync({
                title: `کاتالوگ خرید ${biz.name || ''}`.trim().slice(0, 140),
                businessId: biz.id,
                visibility: 'public',
            });
            toast.success('کاتالوگ خریدت ساخته شد — حالا قلم‌ها رو اضافه کن');
            dispatch(setCurrentInquiry(res.id));
            router.replace(`/my-inquiries?catalog=${res.id}&add=1`);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ساختن کاتالوگ خرید ناموفق بود');
        } finally {
            setSubmitting(false);
        }
    };

    if (!hydrated) {
        return (
            <div className="grid min-h-screen place-items-center bg-[#FFFDF7] dark:bg-gray-950">
                <Loader2 className="size-8 animate-spin text-brand-amber" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFDF7] text-stone-900 dark:bg-gray-950 dark:text-gray-100">
            {/* هدر */}
            <header className="sticky top-0 z-40 border-b border-brand-amber-tint/70 bg-[#FFFDF7]/85 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/85">
                <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
                    <Link href="/inquiries" className="flex items-center gap-1.5 text-sm font-bold text-stone-500 transition-colors hover:text-stone-900 dark:text-gray-400 dark:hover:text-gray-100">
                        دیوار کاتالوگ‌های خرید
                    </Link>
                    <Image src="/logo.png" alt="دیمت" width={30} height={30} className="size-[30px]" unoptimized />
                </div>
            </header>

            <main className="mx-auto max-w-lg px-4 pb-32 pt-8">
                {/* قهرمان — فقط یک جمله */}
                <motion.section {...fadeUp()} className="text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-amber-soft px-3 py-1 text-[11px] font-extrabold text-amber-700 dark:text-amber-400">
                        <ClipboardList className="size-3.5" />
                        کاتالوگ خرید جدید
                    </span>
                    <h1 className="mt-3 text-[22px] font-black leading-9 sm:text-2xl">
                        برای کدام کسب‌وکار می‌سازی؟
                    </h1>
                </motion.section>

                {/* کسب‌وکار — تنها آیتم صفحه تا وقتی انتخاب نشده */}
                <motion.div {...fadeUp(0.06)} ref={bizRef} className="mt-6">
                    <BusinessSelector value={biz} onChange={onBizChange} />
                </motion.div>

                {/* ساخت — بعد از انتخاب کسب‌وکار ظاهر می‌شود */}
                <AnimatePresence>
                    {biz && (
                        <motion.div
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 14 }}
                            transition={{ duration: 0.3 }}
                            className="mt-5">
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={submit}
                                disabled={submitting}
                                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-amber text-[15px] font-extrabold text-white shadow-xl shadow-brand-amber/30 transition-colors hover:bg-brand-amber-strong disabled:opacity-50">
                                {submitting ? <Loader2 className="size-5 animate-spin" /> : <Building2 className="size-5" />}
                                ساخت کاتالوگ خرید
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* سه گام کوچک — راهنمای حداقلی */}
                <motion.div {...fadeUp(0.12)} className="mt-8 grid grid-cols-3 gap-2">
                    {[
                        { icon: ClipboardList, t: 'قلم به قلم اضافه کن' },
                        { icon: Megaphone, t: 'اعلام خرید بزن' },
                        { icon: Send, t: 'لینک رو بفرست' },
                    ].map(({ icon: Icon, t }, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 rounded-2xl border border-stone-100 bg-white px-2 py-3.5 text-center dark:border-gray-800 dark:bg-gray-900">
                            <Icon className="size-4 text-brand-amber" />
                            <span className="text-[10px] font-bold leading-4 text-stone-500 dark:text-gray-400">{t}</span>
                        </div>
                    ))}
                </motion.div>
            </main>
        </div>
    );
}
