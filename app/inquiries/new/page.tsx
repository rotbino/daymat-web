// app/inquiries/new/page.tsx
// ساخت بازوی خرید — نسخهٔ ۳ (جریان پنل‌محور بر اساس ایدهٔ مالک):
//   کسب‌وکار را انتخاب کن → بازوی فروش ساخته می‌شود → مستقیم به پنل مدیریت می‌روی؛
//   اقلام بعداً قلم‌به‌قلم از پنل اضافه می‌شوند (مثل بازوی فروش که اول بازوی فروش ساخته می‌شود).
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
import SlugEditor from '@/app/my-catalogs/SlugEditor';
import { ClipboardList, Loader2, Megaphone, Send, Building2, Globe, Lock, Link2 } from 'lucide-react';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' as const },
    transition: { duration: 0.45, delay, ease: 'easeOut' as const },
});

function shortName(n: string, max = 24) {
    return (n || '').length > max ? n.slice(0, max) + '…' : n;
}

export default function NewInquiryPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { isAuthenticated, _hydrated } = useSelector((s: RootState) => s.auth) as any;
    const hydrated = _hydrated !== false;

    const [biz, setBiz] = useState<any | null>(null);
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    // ✅ آدرس عمومی صفحه — مثل بازوی فروش کاربر خودش انتخاب می‌کند (iMach.ir/supey)
    const [slug, setSlug] = useState('');
    const [slugStatus, setSlugStatus] = useState<'taken' | 'reserved' | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const bizRef = useRef<HTMLDivElement | null>(null);

    const create = useCreateInquiry();
    const { data: myBizData } = useMyBusinesses();
    const myBizs = useMemo(
        () => (myBizData?.items ?? []).filter((b: any) => b.canEdit),
        [myBizData],
    );
    const { data: myInquiries } = useMyInquiries();

    // دیپ‌لینک ?bizId= (از کارت بازوهای فروش در مدیریت کسب‌وکار)
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
        document.title = 'بازوی خرید جدید | آی مچ';
    }, []);

    // کسب‌وکاری که از قبل بازوی خرید باز دارد → مستقیم به پنلش (بازوی خریدِ هر کسب‌وکار یکی است)
    const checkExisting = (b: any): boolean => {
        const existing = (myInquiries ?? []).find((w: any) => w.businessId === b.id && w.status !== 'archived');
        if (existing) {
            toast.info('این کسب‌وکار از قبل بازوی خرید داره — رفتیم به پنلش');
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
        // ✅ آدرس عمومی اجباری است — لینک کوتاهِ قابل گفتن (خواستهٔ مالک)
        if (slug.trim().length < 3) {
            toast.error('آدرس صفحه را بنویس — حداقل ۳ حرف انگلیسی');
            return;
        }
        if (slugStatus) {
            toast.error('این آدرس در دسترس نیست — کمی عوضش کن');
            return;
        }
        setSubmitting(true);
        try {
            const res = await create.mutateAsync({
                title: `بازوی خرید ${biz.name || ''}`.trim().slice(0, 140),
                businessId: biz.id,
                visibility,
                slug: slug.trim(),
            });
            toast.success('بازوی خریدت ساخته شد — حالا قلم‌ها رو اضافه کن');
            dispatch(setCurrentInquiry(res.id));
            router.replace(`/my-inquiries?catalog=${res.id}&add=1`);
        } catch (e: any) {
            const code = e?.response?.data?.errorCode;
            if (code === 'SLUG_TAKEN' || code === 'SLUG_RESERVED' || code === 'INVALID_SLUG') {
                toast.error(e?.response?.data?.message || 'این آدرس در دسترس نیست — کمی عوضش کن');
            } else {
                toast.error(e?.response?.data?.message || 'ساختن بازوی خرید ناموفق بود');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (!hydrated) {
        return (
            <div className="grid min-h-screen place-items-center bg-[#FFFDF7] dark:bg-gray-950">
                <Loader2 className="size-8 animate-spin text-brand-contrast" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFDF7] text-stone-900 dark:bg-gray-950 dark:text-gray-100">
            {/* هدر */}
            <header className="sticky top-0 z-40 border-b border-brand-contrast-tint/70 bg-[#FFFDF7]/85 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/85">
                <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
                    <Link href="/my-inquiries" className="flex items-center gap-1.5 text-sm font-bold text-stone-500 transition-colors hover:text-stone-900 dark:text-gray-400 dark:hover:text-gray-100">
                        بازوهای خرید من
                    </Link>
                    <Image src="/logo.png" alt="آی مچ" width={30} height={30} className="size-[30px]" unoptimized />
                </div>
            </header>

            <main className="mx-auto max-w-lg px-4 pb-32 pt-8">
                {/* قهرمان — فقط یک جمله */}
                <motion.section {...fadeUp()} className="text-center">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-contrast-soft px-3 py-1 text-[11px] font-extrabold text-amber-700 dark:text-amber-400">
                        <ClipboardList className="size-3.5" />
                        بازوی خرید جدید
                    </span>
                    <h1 className="mt-3 text-[22px] font-black leading-9 sm:text-2xl">
                        {/* ✅ تا انتخاب نشده سؤال؛ بعد از انتخاب جملهٔ معنی‌دار — خواستهٔ مالک */}
                        {biz ? `ساخت بازوی خرید برای «${shortName(biz.name || '', 24)}»` : 'برای کدام کسب‌وکار می‌سازی؟'}
                    </h1>
                </motion.section>

                {/* کسب‌وکار — تنها آیتم صفحه تا وقتی انتخاب نشده */}
                <motion.div {...fadeUp(0.06)} ref={bizRef} className="mt-6">
                    {/* ✅ برچسب این صفحه «بازوی خرید» است نه بازوی فروش — بعد از انتخاب هم هیچی (تیتر بالای صفحه خودش می‌گوید) */}
                    <BusinessSelector value={biz} onChange={onBizChange}
                                      label="ثبت یا انتخاب کسب و کاری که می خوای براش بازوی خرید بسازی" />
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
                            {/* نمایانی — مفهومش به خود خریدار گفته می‌شود (دو گزینه، یک خط) */}
                            <div className="mb-3 grid grid-cols-2 gap-2">
                                {([['public', 'عمومی', 'بازوی خریدت همه می‌بینند', Globe],
                                   ['private', 'خصوصی', 'فقط تامین‌کننده‌های تاییدشده', Lock]] as const).map(([v, label, hint, Icon]) => (
                                    <button key={v} type="button" onClick={() => setVisibility(v)}
                                        className={`flex items-center gap-2 rounded-2xl border-2 p-3 text-right transition-all ${
                                            visibility === v
                                                ? 'border-brand-contrast bg-brand-contrast-soft/60 dark:bg-amber-500/10'
                                                : 'border-stone-100 hover:border-stone-200 dark:border-gray-800 dark:hover:border-gray-700'
                                        }`}>
                                        <Icon className={`size-4 shrink-0 ${visibility === v ? 'text-amber-600 dark:text-amber-400' : 'text-stone-300 dark:text-gray-600'}`} />
                                        <span className="min-w-0">
                                            <span className={`block text-[12px] font-black ${visibility === v ? 'text-amber-800 dark:text-amber-300' : 'text-stone-600 dark:text-gray-300'}`}>{label}</span>
                                            <span className="block text-[9px] font-bold leading-3 text-stone-400 dark:text-gray-500">{hint}</span>
                                        </span>
                                    </button>
                                ))}
                            </div>
                            {/* 📍 آدرس عمومی صفحه — کاربر خودش انتخاب می‌کند (مثل بازوی فروش) */}
                            <div className="mb-3 rounded-2xl border border-stone-100 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
                                <div className="mb-2 flex items-center gap-1.5">
                                    <Link2 className="size-3.5 text-amber-600 dark:text-amber-400" />
                                    <span className="text-[12px] font-black text-stone-700 dark:text-gray-200">آدرس صفحه</span>
                                    <span className="text-[9px] font-bold text-stone-400 dark:text-gray-500">— لینک کوتاهی که راحت می‌گویی و می‌فرستی</span>
                                </div>
                                <SlugEditor
                                    value={slug}
                                    onChange={(s) => { setSlug(s); setSlugStatus(null); }}
                                    onStatus={setSlugStatus}
                                    placeholder="supey"
                                />
                            </div>

                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={submit}
                                disabled={submitting}
                                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-brand-contrast text-[15px] font-extrabold text-white shadow-xl shadow-brand-contrast/30 transition-colors hover:bg-brand-contrast-strong disabled:opacity-50">
                                {submitting ? <Loader2 className="size-5 animate-spin" /> : <Building2 className="size-5" />}
                                ساخت بازوی خرید
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* سه گام کوچک — راهنمای حداقلی */}
                <motion.div {...fadeUp(0.12)} className="mt-8 grid grid-cols-3 gap-2">
                    {[
                        { icon: ClipboardList, t: 'قلم به قلم اضافه کن' },
                        { icon: Megaphone, t: 'بازوی خرید بزن' },
                        { icon: Send, t: 'لینک رو بفرست' },
                    ].map(({ icon: Icon, t }, i) => (
                        <div key={i} className="flex flex-col items-center gap-1.5 rounded-2xl border border-stone-100 bg-white px-2 py-3.5 text-center dark:border-gray-800 dark:bg-gray-900">
                            <Icon className="size-4 text-brand-contrast" />
                            <span className="text-[10px] font-bold leading-4 text-stone-500 dark:text-gray-400">{t}</span>
                        </div>
                    ))}
                </motion.div>
            </main>
        </div>
    );
}
