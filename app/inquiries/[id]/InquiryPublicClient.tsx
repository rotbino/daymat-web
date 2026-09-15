// app/inquiries/[id]/InquiryPublicClient.tsx
// کلاینت صفحهٔ اعلان خرید عمومی — همان چیزی که تامین‌کننده با لینک می‌بیند:
//   ۱) «اقلام فعال» بالای صفحه — اقلامی که خریدار همین حالا قیمت می‌خواهد
//   ۲) «سایر کالاهایی که معمولا می‌خرد» — قیمت‌گیری‌شان بسته به تنظیمات خریدار
//   پیشنهاد قیمت قلم‌به‌قلم در شیت ثبت می‌شود؛ مالک: مدیریت در پنل.
// ✅ طراحی ۱۴۰۴ (بازطراحی به خواست مالک):
//   - بستر سفید + کارت‌های سایه‌دار مثل کاتالوگ فروش (پس‌زمینهٔ کهربایی حذف شد)
//   - لیستِ لیستی حفظ شد؛ دکمهٔ قیمت برای «همه» فعال است
//   - فهرست خرید خصوصی: دکمه فعال می‌ماند؛ لمسش → پیام «درخواست همکاری» + مدال عضویت
//   - موبایل: CTA جمع‌وجور فوتر «پیشنهاد قیمت»؛ دسکتاپ: باکس «می‌تونی این لیست رو تامین کنی؟»
//   - حذف از صفحهٔ مالک برداشته شد — کاتالوگ حذف نمی‌شود، فقط پذیرش قیمت متوقف/بسته می‌شود
//   - تماس + ذخیرهٔ مخاطب (vCard) برای بازدیدکننده
// ✅ مشترک دو مسیر: /{slug} (ریشهٔ سایت — اسلاگ دلخواه) و /inquiries/{id} (لینک‌های قدیمی)
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useInquiry, useAddOffer, useUpdateOfferStatus, useUpdateInquiry, useRequestInquiryAccess } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    ClipboardList, MapPin, Clock, User, Share2, Check, Loader2,
    Send, Package, Store, Eye, Ban, RotateCcw, MessageSquareText,
    Truck, Wallet, ExternalLink, Phone, Megaphone, PackageSearch, X, Settings,
    Lock, Handshake, PhoneCall, UserPlus, ShieldCheck,
} from 'lucide-react';
import { faNum, faPrice, faTimeAgo, faDeadlineLeft, STATUS_FA, STATUS_CHIP } from '../utils';
import OfferSheet from '@/app/components/OfferSheet';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' as const },
    transition: { duration: 0.45, delay, ease: 'easeOut' as const },
});

// ✅ کارت سایه‌دار — هم‌خانوادهٔ کاتالوگ فروش؛ بستر سفید، سایهٔ نرم، بوردر خنثی
const CARD = 'border border-outline-variant/30 bg-white shadow-[0_2px_12px_-6px_rgba(15,23,42,0.14)] dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_2px_12px_-6px_rgba(0,0,0,0.6)]';

export default function InquiryPublicClient({ idOrSlug }: { idOrSlug: string }) {
    // ⚠️ مقدار از مسیر (یا resolver ریشه) دیکودشده می‌آید — اینجا دیگر encode نمی‌شود
    const id = idOrSlug;
    const router = useRouter();
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);

    const { data: inquiry, isLoading, isError, refetch } = useInquiry(id);
    const updateOfferStatus = useUpdateOfferStatus();
    const updateInquiry = useUpdateInquiry();

    const [copied, setCopied] = useState(false);
    const [offerTarget, setOfferTarget] = useState<{ id?: string; name: string; quantity?: number | null; unit?: string | null } | null>(null);
    const [privOpen, setPrivOpen] = useState(false);
    // بعد از ثبت درخواست همکاری — بنر حالت «در انتظار تایید» می‌شود
    const [requestedSelf, setRequestedSelf] = useState(false);

    useEffect(() => {
        if (inquiry?.title) document.title = `${inquiry.title} | فهرست خرید دیمت`;
    }, [inquiry?.title]);

    const isOwner = !!inquiry?.isOwner;
    const limited = !!(inquiry as any)?.limited; // خصوصی + بازدیدکننده غیرعضو
    const items = inquiry?.items ?? [];
    const urgentItems = useMemo(() => items.filter((it: any) => it.urgent), [items]);
    const otherItems = useMemo(() => items.filter((it: any) => !it.urgent), [items]);
    const allowOther = inquiry?.allowNonUrgentOffers !== false;
    const isOpen = inquiry?.status === 'open';
    const deadlineOver = dl_over(inquiry?.deadline);

    const dl = useMemo(() => faDeadlineLeft(inquiry?.deadline), [inquiry?.deadline]);
    // ✅ آدرس کوتاه ریشه‌ای — همان چیزی که کاربر به هم می‌گوید (روز ۱ اسلاگ دلخواه)
    const shareUrl = typeof window !== 'undefined' && inquiry
        ? `${window.location.origin}/${inquiry.slug || inquiry.id}`
        : '';

    // ✅ canonical — لینک‌های قدیمی /inquiries/{slug} هم لود می‌شوند ولی سئو به آدرس ریشه‌ای اشاره می‌کند
    useEffect(() => {
        if (!inquiry?.slug || typeof window === 'undefined') return;
        const href = `${window.location.origin}/${inquiry.slug}`;
        let tag = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
        if (!tag) {
            tag = document.createElement('link');
            tag.rel = 'canonical';
            document.head.appendChild(tag);
        }
        tag.href = href;
    }, [inquiry?.slug]);

    // دکمهٔ قیمت — برای «همه» فعال است (خواستهٔ مالک)؛ محدودیت در لحظهٔ لمس گفته می‌شود
    const canTouchOffer = !isOwner && isOpen && !deadlineOver;
    const showItemOffer = (it: any) => canTouchOffer && (it.urgent || allowOther);
    const canOfferWholeList = canTouchOffer && items.length > 0 && (allowOther || urgentItems.length === items.length);

    // لمس دکمهٔ قیمت: مهمان → ورود | خصوصی و غیرعضو → درخواست همکاری | بقیه → شیت قیمت
    const handleOffer = (target: { id?: string; name: string; quantity?: number | null; unit?: string | null }) => {
        if (!inquiry) return;
        if (!isAuthenticated) {
            router.push(`/login?redirect=${encodeURIComponent(`/${inquiry.slug || inquiry.id}`)}`);
            return;
        }
        if (limited) {
            setPrivOpen(true);
            return;
        }
        setOfferTarget(target);
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('لینک کپی شد — بفرستش برای تامین‌کننده‌ها');
            setTimeout(() => setCopied(false), 1800);
        } catch { /* noop */ }
    };

    // ☎️ تماس با خریدار — شمارهٔ کسب‌وکار
    const bizPhone: string | undefined = inquiry?.business?.phone || undefined;

    // 💾 ذخیرهٔ مخاطب — vCard استاندارد؛ موبایل بازش می‌کند و به مخاطبین اضافه می‌شود
    const saveContact = () => {
        if (!inquiry) return;
        const name = inquiry.business?.name || inquiry.owner?.fullName || inquiry.title;
        const vcf = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${name}`,
            bizPhone ? `TEL;TYPE=CELL:${bizPhone}` : null,
            inquiry.city ? `ADR;TYPE=WORK:;;${inquiry.city};;;;` : null,
            `NOTE:فهرست خرید «${inquiry.title}» — دیمت`,
            shareUrl ? `URL:${shareUrl}` : null,
            'END:VCARD',
        ].filter(Boolean).join('\n');
        const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.vcf`.replace(/\s+/g, '-');
        a.click();
        URL.revokeObjectURL(url);
        toast.success('مخاطب ذخیره شد — فایل مخاطبین را باز کن');
    };

    const setOfferState = async (offerId: string, status: 'accepted' | 'rejected') => {
        try {
            await updateOfferStatus.mutateAsync({ offerId, status });
            toast.success(status === 'accepted' ? 'پیشنهاد پذیرفته شد' : 'پیشنهاد رد شد');
            refetch();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'تغییر وضعیت ناموفق بود');
        }
    };

    // ✅ توقف/ادامهٔ پذیرش قیمت — کاتالوگ هرگز حذف نمی‌شود (تصمیم مالک)
    const toggleStatus = async () => {
        if (!inquiry) return;
        const next = inquiry.status === 'open' ? 'closed' : 'open';
        try {
            await updateInquiry.mutateAsync({ id: inquiry.id, data: { status: next } });
            toast.success(next === 'open' ? 'فهرست خرید باز شد' : 'پذیرش قیمت متوقف شد');
            refetch();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'تغییر وضعیت ناموفق بود');
        }
    };

    if (isLoading) {
        return (
            <div className="grid min-h-screen place-items-center bg-white dark:bg-gray-950">
                <Loader2 className="size-8 animate-spin text-brand-amber" />
            </div>
        );
    }

    if (isError || !inquiry) {
        return (
            <div className="grid min-h-screen place-items-center bg-white px-4 text-center dark:bg-gray-950">
                <div>
                    <Package className="mx-auto size-14 text-stone-300 dark:text-gray-700" />
                    <h1 className="mt-4 text-xl font-black">این فهرست خرید پیدا نشد</h1>
                    <p className="mt-2 text-sm text-stone-500">ممکن است حذف شده باشد یا لینک اشتباه باشد.</p>
                    <Link href="/" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-brand-amber px-6 text-sm font-extrabold text-white">
                        رفتن به دیمت
                    </Link>
                </div>
            </div>
        );
    }

    const showFooterCta = canTouchOffer && !isOwner;

    return (
        <div className="min-h-screen bg-white text-stone-900 dark:bg-gray-950 dark:text-gray-100">
            {/* هدر */}
            <header className="sticky top-0 z-40 border-b border-stone-100 bg-white/90 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90">
                <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-1.5 text-sm font-bold text-stone-500 transition-colors hover:text-stone-900 dark:text-gray-400 dark:hover:text-gray-100">
                        دیمت
                    </Link>
                    <div className="flex items-center gap-1.5">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${STATUS_CHIP[inquiry.status] ?? ''}`}>
                            {STATUS_FA[inquiry.status]}
                        </span>
                        <button onClick={copyLink} aria-label="کپی لینک"
                            className="grid size-9 place-items-center rounded-full border border-stone-200 text-stone-500 transition-colors hover:border-brand-amber hover:text-amber-600 dark:border-gray-700">
                            {copied ? <Check className="size-4 text-emerald-500" /> : <Share2 className="size-4" />}
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 pb-32 pt-6">
                {/* کارت سرآیند */}
                <motion.section {...fadeUp()} className={`p-5 sm:p-6 ${CARD} rounded-3xl`}>
                    <div className="flex items-start gap-3">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand-amber-soft text-amber-600 dark:text-amber-400">
                            <ClipboardList className="size-6" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl font-black leading-8 sm:text-2xl">{inquiry.title}</h1>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-stone-400 dark:text-gray-500">
                                <span className="flex items-center gap-1"><User className="size-3.5" /> {inquiry.business?.name || inquiry.owner?.fullName || 'کاربر دیمت'}</span>
                                {inquiry.city && <span className="flex items-center gap-1"><MapPin className="size-3.5" /> {inquiry.city}</span>}
                                <span>{faTimeAgo(inquiry.createdAt)}</span>
                                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><Eye className="size-3.5" /> {faNum(inquiry.viewCount)}</span>
                            </div>
                        </div>
                    </div>

                    {inquiry.description && (
                        <p className="mt-4 rounded-2xl bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-600 dark:bg-gray-950/60 dark:text-gray-300">
                            {inquiry.description}
                        </p>
                    )}

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                        {dl && (
                            <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-extrabold ${dl.urgent ? 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' : 'bg-stone-100 text-stone-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                <Clock className="size-3.5" /> {dl.text}
                            </span>
                        )}
                        {inquiry.deliveryNote && (
                            <span className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-[11px] font-bold text-stone-500 dark:bg-gray-800 dark:text-gray-400">
                                <Truck className="size-3.5" /> {inquiry.deliveryNote}
                            </span>
                        )}
                        {inquiry.paymentTerms && (
                            <span className="flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1 text-[11px] font-bold text-stone-500 dark:bg-gray-800 dark:text-gray-400">
                                <Wallet className="size-3.5" /> {inquiry.paymentTerms}
                            </span>
                        )}
                        {inquiry.tags.map((t) => (
                            <span key={t} className="rounded-full bg-brand-amber-soft px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">{t}</span>
                        ))}
                    </div>

                    {/* ☎️💾 اکشن‌های بازدیدکننده — تماس + ذخیرهٔ مخاطب (خواستهٔ مالک) */}
                    {!isOwner && (
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed border-stone-100 pt-4 dark:border-gray-800">
                            {bizPhone && (
                                <a href={`tel:${bizPhone}`} dir="ltr"
                                    className="flex h-10 items-center gap-1.5 rounded-full border border-stone-200 px-4 text-xs font-extrabold text-stone-700 transition-colors hover:border-emerald-400 hover:text-emerald-600 dark:border-gray-700 dark:text-gray-200">
                                    <PhoneCall className="size-3.5 text-emerald-500" />
                                    تماس
                                </a>
                            )}
                            <button onClick={saveContact}
                                className="flex h-10 items-center gap-1.5 rounded-full border border-stone-200 px-4 text-xs font-extrabold text-stone-700 transition-colors hover:border-brand-amber hover:text-amber-700 dark:border-gray-700 dark:text-gray-200">
                                <UserPlus className="size-3.5 text-brand-amber" />
                                ذخیره مخاطب
                            </button>
                        </div>
                    )}

                    {/* اکشن‌های مالک — بدون حذف؛ فقط توقف/ادامهٔ پذیرش قیمت */}
                    {isOwner && (
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed border-stone-100 pt-4 dark:border-gray-800">
                            <Link href={`/my-inquiries?catalog=${inquiry.id}`}
                                className="flex h-10 items-center gap-1.5 rounded-full bg-brand-amber px-4 text-xs font-extrabold text-white shadow-md shadow-brand-amber/25 transition-colors hover:bg-brand-amber-strong">
                                <Settings className="size-3.5" />
                                مدیریت در پنل
                            </Link>
                            <button onClick={toggleStatus}
                                className="flex h-10 items-center gap-1.5 rounded-full border border-stone-200 px-4 text-xs font-bold text-stone-600 transition-colors hover:border-stone-400 dark:border-gray-700 dark:text-gray-300">
                                {inquiry.status === 'open' ? <><Ban className="size-3.5" /> توقف پذیرش قیمت</> : <><RotateCcw className="size-3.5" /> بازکردن دوباره</>}
                            </button>
                        </div>
                    )}
                </motion.section>

                {/* ═══ بنر فهرست خرید خصوصی — لیست دیده می‌شود، قیمت فقط برای اعضا ═══ */}
                {limited && (
                    <motion.div {...fadeUp(0.05)}
                        className="mt-4 flex items-center gap-3 rounded-2xl border border-brand-amber/30 bg-brand-amber-soft/50 px-4 py-3.5 dark:border-amber-500/25 dark:bg-amber-500/5">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm dark:bg-gray-900">
                            <Lock className="size-4 text-amber-600 dark:text-amber-400" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-black text-amber-800 dark:text-amber-300">این فهرست خرید خصوصیه</p>
                            <p className="mt-0.5 text-[10.5px] font-bold leading-4 text-amber-700/80 dark:text-amber-400/80">
                                {requestedSelf
                                    ? 'درخواست همکاری‌ات ثبت شد — به‌محض تایید خریدار، دکمهٔ قیمت برایت فعال می‌شود'
                                    : 'همه لیست را می‌بینند؛ ولی فقط تامین‌کننده‌های تاییدشدهٔ خریدار می‌توانند قیمت بدهند'}
                            </p>
                        </div>
                        {!requestedSelf && (
                            <button onClick={() => (isAuthenticated ? setPrivOpen(true) : router.push(`/login?redirect=${encodeURIComponent(`/${inquiry.slug || inquiry.id}`)}`))}
                                className="shrink-0 rounded-full bg-brand-amber px-3.5 py-2 text-[11px] font-extrabold text-white shadow-sm transition-colors hover:bg-brand-amber-strong">
                                {isAuthenticated ? 'درخواست همکاری' : 'ورود'}
                            </button>
                        )}
                    </motion.div>
                )}

                {/* ═══ اقلام فعال — بالای صفحه ═══ */}
                <section className="mt-6">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-stone-700 dark:text-gray-300">
                        <Megaphone className="size-4 text-brand-amber" />
                        اقلام فعال
                        <span className="rounded-full bg-brand-amber px-2 py-0.5 text-[9px] font-black text-white">{faNum(urgentItems.length)}</span>
                    </h2>

                    {items.length === 0 ? (
                        <div className={`${CARD} rounded-2xl px-4 py-8 text-center`}>
                            <PackageSearch className="mx-auto size-8 text-stone-200 dark:text-gray-700" />
                            <p className="mt-2 text-xs font-bold text-stone-400 dark:text-gray-500">
                                لیست خرید این کسب‌وکار هنوز خالیه — بعداً سر بزن.
                            </p>
                        </div>
                    ) : urgentItems.length === 0 ? (
                        <div className={`${CARD} rounded-2xl px-4 py-5 text-center`}>
                            <p className="text-xs font-bold text-stone-400 dark:text-gray-500">
                                فعلاً قلم فعالی نیست — لیست معمول خرید پایین‌تره.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {urgentItems.map((it: any, i: number) => (
                                <motion.div
                                    key={it.id}
                                    {...fadeUp(Math.min(i, 8) * 0.05)}
                                    className={`p-4 ${CARD} rounded-2xl transition-shadow hover:shadow-[0_6px_20px_-8px_rgba(15,23,42,0.22)]`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                <h3 className="font-extrabold text-stone-800 dark:text-gray-200">{it.name}</h3>
                                                <span className="shrink-0 rounded-full bg-brand-amber px-1.5 py-0.5 text-[8.5px] font-black text-white">فعال</span>
                                            </div>
                                            {it.brand && <p className="mt-0.5 text-xs font-bold text-stone-400 dark:text-gray-500">{it.brand}</p>}
                                        </div>
                                        {(it.quantity || it.unit) && (
                                            <span className="shrink-0 rounded-full bg-brand-amber-soft px-3 py-1 text-xs font-extrabold text-amber-700 dark:text-amber-400">
                                                {faNum(it.quantity)} {it.unit}
                                            </span>
                                        )}
                                    </div>

                                    {it.specs && it.specs.length > 0 && (
                                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                                            {it.specs.map((sp: any, si: number) => (
                                                <div key={si} className="rounded-xl bg-stone-50 px-3 py-1.5 text-[11px] dark:bg-gray-950/60">
                                                    <span className="font-bold text-stone-400">{sp.key}: </span>
                                                    <span className="font-extrabold text-stone-700 dark:text-gray-300">{sp.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {it.note && <p className="mt-2 text-xs leading-6 text-stone-500 dark:text-gray-400">{it.note}</p>}

                                    <div className="mt-3 flex items-center justify-between gap-2">
                                        {it.referenceUrl ? (
                                            <a href={it.referenceUrl} target="_blank" rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-400 hover:text-amber-600 dark:text-gray-500">
                                                <ExternalLink className="size-3" /> نمونه / کاتالوگ سازنده
                                            </a>
                                        ) : <span />}
                                        {showItemOffer(it) && (
                                            <motion.button
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => handleOffer({ id: it.id, name: it.name, quantity: it.quantity, unit: it.unit })}
                                                className="flex h-9 items-center gap-1.5 rounded-full bg-brand-amber px-4 text-xs font-extrabold text-white shadow-md shadow-brand-amber/25 transition-colors hover:bg-brand-amber-strong">
                                                <Send className="size-3.5" />
                                                پیشنهاد قیمت
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ═══ سایر کالاها — لیست معمول خرید ═══ */}
                {otherItems.length > 0 && (
                    <section className="mt-7">
                        <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-stone-500 dark:text-gray-400">
                            <PackageSearch className="size-4" />
                            سایر کالاهایی که معمولا می‌خرد
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold text-stone-400 dark:bg-gray-800">{faNum(otherItems.length)}</span>
                        </h2>

                        {!allowOther && (
                            <p className="mb-3 flex items-center gap-1.5 rounded-xl bg-stone-50 px-3 py-2 text-[11px] font-bold text-stone-400 dark:bg-gray-950/60 dark:text-gray-500">
                                <Ban className="size-3.5" />
                                خریدار فعلاً برای این بخش قیمت نمی‌گیرد.
                            </p>
                        )}

                        <div className="space-y-2.5">
                            {otherItems.map((it: any, i: number) => (
                                <motion.div
                                    key={it.id}
                                    {...fadeUp(Math.min(i, 8) * 0.04)}
                                    className={`p-4 ${CARD} rounded-2xl transition-shadow hover:shadow-[0_6px_20px_-8px_rgba(15,23,42,0.22)]`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="font-extrabold text-stone-800 dark:text-gray-200">{it.name}</h3>
                                            {it.brand && <p className="mt-0.5 text-xs font-bold text-stone-400 dark:text-gray-500">{it.brand}</p>}
                                        </div>
                                        {(it.quantity || it.unit) && (
                                            <span className="shrink-0 rounded-full bg-stone-100 px-3 py-1 text-xs font-extrabold text-stone-500 dark:bg-gray-800 dark:text-gray-400">
                                                {faNum(it.quantity)} {it.unit}
                                            </span>
                                        )}
                                    </div>

                                    {it.specs && it.specs.length > 0 && (
                                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                                            {it.specs.map((sp: any, si: number) => (
                                                <div key={si} className="rounded-xl bg-stone-50 px-3 py-1.5 text-[11px] dark:bg-gray-950/60">
                                                    <span className="font-bold text-stone-400">{sp.key}: </span>
                                                    <span className="font-extrabold text-stone-700 dark:text-gray-300">{sp.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {it.note && <p className="mt-2 text-xs leading-6 text-stone-500 dark:text-gray-400">{it.note}</p>}

                                    <div className="mt-3 flex items-center justify-between gap-2">
                                        {it.referenceUrl ? (
                                            <a href={it.referenceUrl} target="_blank" rel="noreferrer"
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-400 hover:text-amber-600 dark:text-gray-500">
                                                <ExternalLink className="size-3" /> نمونه / کاتالوگ سازنده
                                            </a>
                                        ) : <span />}
                                        {showItemOffer(it) && (
                                            <motion.button
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => handleOffer({ id: it.id, name: it.name, quantity: it.quantity, unit: it.unit })}
                                                className="flex h-9 items-center gap-1.5 rounded-full border border-brand-amber/60 px-4 text-xs font-extrabold text-amber-700 transition-colors hover:bg-brand-amber-soft dark:text-amber-400">
                                                <Send className="size-3.5" />
                                                پیشنهاد قیمت
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* پیشنهاد کل لیست — فقط وقتی مجاز (دسکتاپ؛ موبایل فوتر دارد) */}
                {canOfferWholeList && items.length > 1 && (
                    <motion.div {...fadeUp()} className="mt-6 hidden text-center lg:block">
                        <button onClick={() => handleOffer({ name: 'کل لیست' })}
                            className="text-xs font-bold text-stone-400 underline decoration-dotted underline-offset-4 transition-colors hover:text-amber-600 dark:text-gray-500">
                            پیشنهاد برای کل لیست
                        </button>
                    </motion.div>
                )}

                {/* بسته/مهلت — بازدیدکننده */}
                {!isOwner && (!isOpen || deadlineOver) && (
                    <p className="mt-6 rounded-2xl bg-stone-50 px-4 py-3 text-center text-sm text-stone-500 dark:bg-gray-950/60 dark:text-gray-400">
                        پذیرش قیمت این فهرست خرید بسته شده است.
                    </p>
                )}

                {/* ─── باکس مهمان — فقط دسکتاپ (موبایل: فوتر جمع‌وجور «پیشنهاد قیمت») ─── */}
                {!isAuthenticated && canTouchOffer && (
                    <motion.section {...fadeUp()} className="mt-8 hidden rounded-3xl bg-stone-900 px-6 py-8 text-center text-white dark:bg-gray-800 lg:block">
                        <h3 className="text-lg font-black">می‌تونی این لیست رو تامین کنی؟</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-gray-300">
                            وارد شو و همین حالا قیمتت رو بذار — خریدار مستقیم باهات در تماسه.
                        </p>
                        <Link href={`/login?redirect=${encodeURIComponent(`/${inquiry.slug || inquiry.id}`)}`}
                            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-brand-amber px-7 text-sm font-extrabold text-white shadow-lg shadow-brand-amber/30 hover:bg-brand-amber-strong">
                            ورود و ثبت پیشنهاد
                        </Link>
                    </motion.section>
                )}

                {/* ─── پیشنهادها (مالک) ─── */}
                {isOwner && (
                    <section className="mt-8">
                        <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-stone-500 dark:text-gray-400">
                            <MessageSquareText className="size-4 text-brand-amber" />
                            پیشنهادهای دریافتی — {faNum(inquiry.offers?.length ?? 0)}
                        </h2>
                        {(inquiry.offers?.length ?? 0) === 0 ? (
                            <div className={`${CARD} rounded-3xl px-6 py-10 text-center`}>
                                <p className="text-sm font-bold text-stone-500 dark:text-gray-400">هنوز پیشنهادی نیومده.</p>
                                <p className="mt-1 text-xs text-stone-400 dark:text-gray-500">لینک اعلام خریدت رو برای تامین‌کننده‌ها بفرست.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {inquiry.offers!.map((o, i) => (
                                        <motion.div
                                            key={o.id}
                                            layout
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.97 }}
                                            transition={{ delay: Math.min(i, 6) * 0.05 }}
                                            className={`p-4 ${CARD} rounded-2xl ${o.status === 'accepted' ? '!border-emerald-300 dark:!border-emerald-500/40' : ''}`}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-center gap-2.5">
                                                    {o.business?.logoUrl ? (
                                                        <Image src={o.business.logoUrl} alt="" width={40} height={40} className="size-10 rounded-xl object-cover" unoptimized />
                                                    ) : (
                                                        <span className="grid size-10 place-items-center rounded-xl bg-brand-amber-soft text-xs font-black text-amber-700 dark:text-amber-400">
                                                            {(o.business?.name || o.offerer?.fullName || 'ت').charAt(0)}
                                                        </span>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-extrabold">{o.business?.name || o.offerer?.fullName || 'تامین‌کننده'}</p>
                                                        <p className="text-[11px] text-stone-400 dark:text-gray-500">{faTimeAgo(o.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <p className="text-base font-black text-brand-amber">{faPrice(o.price)}</p>
                                                    {o.priceBasis && <p className="text-[10px] font-bold text-stone-400">{o.priceBasis}</p>}
                                                </div>
                                            </div>

                                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-stone-400">
                                                {o.itemName && (
                                                    <span className="rounded-full bg-brand-amber-soft px-2 py-0.5 text-amber-700 dark:text-amber-400">{o.itemName}</span>
                                                )}
                                                {o.deliveryDays != null && <span className="flex items-center gap-1"><Truck className="size-3" /> {faNum(o.deliveryDays)} روزه</span>}
                                                {o.contactPhone && <span className="flex items-center gap-1" dir="ltr"><Phone className="size-3" /> {o.contactPhone}</span>}
                                                <span className={`rounded-full px-2 py-0.5 ${STATUS_CHIP[o.status] ?? ''}`}>{STATUS_FA[o.status]}</span>
                                            </div>

                                            {o.message && (
                                                <p className="mt-2 rounded-xl bg-stone-50 px-3 py-2 text-xs leading-6 text-stone-600 dark:bg-gray-950/60 dark:text-gray-300">{o.message}</p>
                                            )}

                                            {o.status === 'pending' && (
                                                <div className="mt-3 flex gap-2">
                                                    <button
                                                        onClick={() => setOfferState(o.id, 'accepted')}
                                                        className="h-10 flex-1 rounded-full bg-emerald-500 text-xs font-extrabold text-white transition-colors hover:bg-emerald-600">
                                                        پذیرش
                                                    </button>
                                                    <button
                                                        onClick={() => setOfferState(o.id, 'rejected')}
                                                        className="h-10 flex-1 rounded-full border border-red-100 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10">
                                                        رد
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </section>
                )}
            </main>

            {/* ═══ فوتر موبایل — CTA جمع‌وجور «پیشنهاد قیمت» (خواستهٔ مالک) ═══ */}
            {showFooterCta && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-100 bg-white/95 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/95 lg:hidden"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                    <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-3 px-4">
                        <div className="min-w-0">
                            <p className="truncate text-[12px] font-black text-stone-800 dark:text-gray-200">می‌تونی این لیست رو تامین کنی؟</p>
                            <p className="truncate text-[10px] font-bold text-stone-400 dark:text-gray-500">
                                {limited ? 'فهرست خرید خصوصیه — اول درخواست همکاری' : 'قیمت بده، خریدار باهات تماس می‌گیره'}
                            </p>
                        </div>
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleOffer({ name: 'کل لیست' })}
                            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-brand-amber px-5 text-[13px] font-extrabold text-white shadow-lg shadow-brand-amber/30 transition-colors hover:bg-brand-amber-strong">
                            <Send className="size-4" />
                            پیشنهاد قیمت
                        </motion.button>
                    </div>
                </div>
            )}

            {/* ═══ مدال درخواست همکاری — فهرست خرید خصوصی ═══ */}
            {privOpen && (
                <PrivateRequestModal
                    inquiry={inquiry as any}
                    onClose={() => setPrivOpen(false)}
                    onRequested={() => { setRequestedSelf(true); setPrivOpen(false); refetch(); }}
                />
            )}

            {/* شیت ثبت پیشنهاد */}
            <OfferSheet inquiry={inquiry} item={offerTarget} onClose={() => setOfferTarget(null)} />
        </div>
    );
}

// مهلت گذشته؟ — سبک و مستقل از هوک
function dl_over(deadline?: string | null): boolean {
    if (!deadline) return false;
    try {
        return new Date(deadline).getTime() < Date.now();
    } catch { return false; }
}

// ═══ مدال درخواست همکاری — با کاتالوگ فروشت به خریدار درخواست می‌دهی؛
//     بعد از تایید او، همیشه می‌توانی به درخواست‌های قیمتش پیشنهاد بدهی ═══
function PrivateRequestModal({ inquiry, onClose, onRequested }: { inquiry: any; onClose: () => void; onRequested: () => void }) {
    const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);
    const requestAccess = useRequestInquiryAccess();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[70] grid place-items-end sm:place-items-center">
            <div className="absolute inset-0 bg-stone-950/50 backdrop-blur-[2px]" onClick={onClose} />
            <motion.div
                initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white p-6 text-center shadow-2xl dark:bg-gray-900"
                style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
                <button onClick={onClose} aria-label="بستن"
                    className="absolute end-4 top-4 grid size-8 place-items-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 dark:hover:bg-gray-800">
                    <X className="size-4" />
                </button>

                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-amber-soft dark:bg-amber-500/10">
                    <ShieldCheck className="size-6 text-amber-600 dark:text-amber-400" />
                </span>
                <h1 className="mt-4 text-lg font-black">فهرست خرید خصوصیه</h1>
                {inquiry.title && <p className="mt-1 text-sm font-bold text-stone-500 dark:text-gray-400">«{inquiry.title}»</p>}
                <p className="mx-auto mt-3 max-w-xs text-[12px] font-bold leading-6 text-stone-500 dark:text-gray-400">
                    فقط تامین‌کننده‌های تاییدشدهٔ خریدار می‌توانند قیمت بدهند —
                    با کاتالوگ فروشت بهش درخواست همکاری بده؛ وقتی پذیرفت، همیشه می‌توانی به درخواست‌های قیمتش پیشنهاد بدهی.
                </p>
                <ModalBody inquiry={inquiry} isAuthenticated={isAuthenticated} requestAccess={requestAccess} onRequested={onRequested} />
            </motion.div>
        </div>,
        document.body,
    );
}

function ModalBody({ inquiry, isAuthenticated, requestAccess, onRequested }: {
    inquiry: any;
    isAuthenticated: boolean;
    requestAccess: { mutateAsync: (v: { inquiryId: string; catalogId: string }) => Promise<any>; isPending: boolean; isSuccess: boolean };
    onRequested: () => void;
}) {
    // کاتالوگ‌های فروش من — برای درخواست همکاری
    const { data: catalogsRaw, isLoading: catsLoading } = useQuery({
        queryKey: ['catalogs'],
        queryFn: () => apiService.catalog.getAll(),
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
    const myCatalogs: any[] = catalogsRaw ?? [];
    const [catalogId, setCatalogId] = useState<string>('');

    const loginHref = `/login?redirect=${encodeURIComponent(`/${inquiry.slug || inquiry.id}`)}`;

    const send = async () => {
        if (!catalogId) return;
        try {
            await requestAccess.mutateAsync({ inquiryId: inquiry.id, catalogId });
            toast.success('درخواست همکاری‌ات ثبت شد — منتظر تایید خریدار باش');
            onRequested();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ارسال درخواست ناموفق بود');
        }
    };

    if (!isAuthenticated) {
        return (
            <Link href={loginHref}
                className="mt-5 inline-flex h-12 items-center gap-2 rounded-full bg-brand-amber px-8 text-sm font-extrabold text-white shadow-lg shadow-brand-amber/25 transition-colors hover:bg-brand-amber-strong">
                <Handshake className="size-4" />
                ورود و درخواست همکاری
            </Link>
        );
    }
    if (catsLoading) {
        return <Loader2 className="mx-auto mt-5 size-5 animate-spin text-stone-300" />;
    }
    if (myCatalogs.length === 0) {
        return (
            <>
                <p className="mt-5 text-[12px] font-bold text-stone-500 dark:text-gray-400">برای درخواست همکاری اول یک کاتالوگ فروش بساز</p>
                <Link href="/business/register"
                    className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-brand-amber px-6 text-sm font-extrabold text-white transition-colors hover:bg-brand-amber-strong">
                    ساخت کاتالوگ فروش
                </Link>
            </>
        );
    }
    return (
        <>
            <div className="mt-5 max-h-44 space-y-1.5 overflow-y-auto pl-1 text-right">
                {myCatalogs.map((c: any) => (
                    <button key={c.id} type="button" onClick={() => setCatalogId(c.id)}
                        className={`flex w-full items-center gap-2 rounded-xl border-2 p-2.5 text-right transition-all ${
                            catalogId === c.id
                                ? 'border-brand-amber bg-brand-amber-soft/50 dark:bg-amber-500/10'
                                : 'border-stone-100 hover:border-stone-200 dark:border-gray-800'
                        }`}>
                        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-stone-100 dark:bg-gray-800">
                            {c.logoUrl
                                ? // eslint-disable-next-line @next/next/no-img-element
                                  <img src={c.logoUrl} alt="" className="size-full object-cover" />
                                : <Store className="size-3.5 text-stone-400" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12px] font-black text-stone-800 dark:text-gray-200">{c.name}</span>
                        {catalogId === c.id && <Check className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />}
                    </button>
                ))}
            </div>
            <motion.button whileTap={{ scale: 0.97 }} disabled={!catalogId || requestAccess.isPending} onClick={send}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-amber text-sm font-extrabold text-white shadow-lg shadow-brand-amber/25 transition-colors hover:bg-brand-amber-strong disabled:opacity-50">
                {requestAccess.isPending ? <Loader2 className="size-4 animate-spin" /> : <Handshake className="size-4" />}
                درخواست همکاری
            </motion.button>
        </>
    );
}
