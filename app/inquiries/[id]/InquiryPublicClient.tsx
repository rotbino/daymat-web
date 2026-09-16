// app/inquiries/[id]/InquiryPublicClient.tsx
// کلاینت صفحهٔ اعلان خرید عمومی — همان چیزی که تامین‌کننده با لینک می‌بیند:
//   ۱) «اقلام فعال» بالای صفحه — اقلامی که خریدار همین حالا قیمت می‌خواهد
//   ۲) «سایر کالاهایی که معمولا می‌خرد» — قیمت‌گیری‌شان بسته به تنظیمات خریدار
//   پیشنهاد قیمت قلم‌به‌قلم در شیت ثبت می‌شود؛ مالک: مدیریت در پنل.
// ✅ طراحی ۱۴۰۴ (بازطراحی به خواست مالک):
//   - بستر سفید + کارت‌های سایه‌دار مثل کاتالوگ قیمت (پس‌زمینهٔ کهربایی حذف شد)
//   - لیستِ لیستی حفظ شد؛ دکمهٔ قیمت برای «همه» فعال است
//   - بازوی خرید خصوصی: دکمه فعال می‌ماند؛ لمسش → پیام «درخواست همکاری» + مدال عضویت
//   - موبایل: CTA جمع‌وجور فوتر «پیشنهاد قیمت»؛ دسکتاپ: باکس «می‌تونی این لیست رو تامین کنی؟»
//   - حذف از صفحهٔ مالک برداشته شد — کاتالوگ حذف نمی‌شود، فقط پذیرش قیمت متوقف/بسته می‌شود
//   - تماس + ذخیرهٔ مخاطب (vCard) برای بازدیدکننده
// ✅ مشترک دو مسیر: /{slug} (ریشهٔ سایت — اسلاگ دلخواه) و /inquiries/{id} (لینک‌های قدیمی)
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useInquiry, useAddOffer, useUpdateOfferStatus, useUpdateInquiry, useRequestInquiryAccess, useSavedInquiries, useInquirySavedStatus, useInquirySaveToggle } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    ClipboardList, Clock, User, Share2, Check, Loader2,
    Send, Package, Ban, MessageSquareText, Store,
    Truck, Wallet, ExternalLink, Phone, Megaphone, PackageSearch, X, Settings,
    Lock, Handshake, PhoneCall, UserPlus, Gift, Sparkles,
    Bookmark, ChevronDown, ArrowRight, Pause, Play,
} from 'lucide-react';
import { faNum, faPrice, faTimeAgo, faDeadlineLeft, STATUS_FA, STATUS_CHIP } from '../utils';
import OfferSheet from '@/app/components/OfferSheet';
import ArmFooter from './ArmFooter';
import { useMyInquiries } from '@/lib/api/apiHooks';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' as const },
    transition: { duration: 0.45, delay, ease: 'easeOut' as const },
});

// ✅ کارت سایه‌دار — هم‌خانوادهٔ کاتالوگ قیمت؛ بستر سفید، سایهٔ نرم، بوردر خنثی
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
    // 🦠 قیف تامین‌کننده — مهمان پیش از ورود، راهنمای «ثبت‌نام + ساخت کاتالوگ» می‌بیند
    const [supOpen, setSupOpen] = useState(false);

    // 💾 سوییچر بازوهای خرید ذخیره‌شده + نشانک این بازو (قرینهٔ کاتالوگ)
    const [savedOpen, setSavedOpen] = useState(false);
    const savedDropdownRef = useRef<HTMLDivElement>(null);
    const { data: savedInquiries = [] } = useSavedInquiries();
    const saveToggle = useInquirySaveToggle();
    const { data: savedStatusData } = useInquirySavedStatus(inquiry?.id);
    const [savedOpt, setSavedOpt] = useState<boolean | null>(null);
    const isSaved = savedOpt ?? savedStatusData?.isSaved ?? false;

    useEffect(() => {
        if (!savedOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (savedDropdownRef.current && !savedDropdownRef.current.contains(e.target as Node)) {
                setSavedOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [savedOpen]);

    const handleSaveToggle = () => {
        if (!inquiry) return;
        if (!isAuthenticated) {
            router.push(`/login?redirect=${encodeURIComponent(`/${inquiry.slug || inquiry.id}`)}`);
            return;
        }
        const next = !isSaved;
        setSavedOpt(next); // خوش‌بینانه — حس فوری
        saveToggle.mutate(
            { id: inquiry.id, save: next },
            {
                onError: () => {
                    setSavedOpt(!next);
                    toast.error(next ? 'ذخیره نشد — دوباره تلاش کن' : 'حذف از ذخیره‌ها ناموفق بود');
                },
                onSuccess: () => toast.success(next ? 'در سوییچر «بازوهای ذخیره‌شده» دیده می‌شود' : 'از ذخیره‌ها حذف شد'),
            },
        );
    };

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) router.back();
        else router.push('/');
    };

    const scrollToOffers = () => document.getElementById('offers')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // ✅ شمارش پیشنهاد هر قلم (مالک) — پیشنهادِ کلِ لیست itemId ندارد
    const offersByItem = useMemo(() => {
        const m = new Map<string, number>();
        (inquiry?.offers ?? []).forEach((o: any) => {
            if (o.itemId) m.set(o.itemId, (m.get(o.itemId) ?? 0) + 1);
        });
        return m;
    }, [inquiry?.offers]);
    const wholeListOffers = useMemo(() => (inquiry?.offers ?? []).filter((o: any) => !o.itemId).length, [inquiry?.offers]);

    useEffect(() => {
        if (inquiry?.title) document.title = `${inquiry.title} | بازوی خرید دیمت`;
    }, [inquiry?.title]);

    const isOwner = !!inquiry?.isOwner;
    // ✅ وضعیت رابطهٔ من با این بازو — برای دکمهٔ «ارسال درخواست تامین» سه‌حالته (بک می‌فرستد)
    const accessState = ((inquiry as any)?.accessState ?? 'none') as 'owner' | 'member' | 'pending' | 'none';
    const suppliersCount = (inquiry as any)?.suppliersCount ?? 0;
    const savesCount = (inquiry as any)?.savesCount ?? 0;
    const limited = !!(inquiry as any)?.limited; // خصوصی + بازدیدکننده غیرعضو

    // 🦠 لینک‌های ویروسی — فقط برای کسانی که بازو ندارند (خواستهٔ مالک):
    //    مالکِ بازو و کسی که قبلاً بازو ساخته هرگز نبینند؛ مهمان‌ها همیشه می‌بینند
    const { data: myInqData } = useMyInquiries();
    const hasArm = (myInqData?.length ?? 0) > 0;
    const viralReady = !isAuthenticated || myInqData !== undefined; // قبل از لود، فلش نزند
    const showViral = viralReady && !isOwner && !hasArm;
    // ✅ کد دعوت مالک — انتساب هر ثبت‌نام از این صفحه به صاحب بازو (بک برمی‌گرداند)
    const refCode: string | undefined = (inquiry as any)?.owner?.referralCode ?? undefined;
    const q = refCode ? `?ref=${refCode}` : '';
    const supplierJoinHref = `/login?redirect=${encodeURIComponent(`/business/register${q}`)}&intent=catalog`; // ثبت‌نام + ساخت کاتالوگ
    const armJoinHref = `/login?redirect=${encodeURIComponent(`/inquiries/new${q}`)}`; // ثبت‌نام + ساخت بازوی خرید (انتساب با RefCapture)
    const armHref = isAuthenticated ? `/inquiries/new${q}` : armJoinHref;
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

    // لمس دکمهٔ قیمت: مهمان → قیف تامین‌کننده | خصوصی و غیرعضو → درخواست همکاری | بقیه → شیت قیمت
    const handleOffer = (target: { id?: string; name: string; quantity?: number | null; unit?: string | null }) => {
        if (!inquiry) return;
        // 🦠 مهمان: قبل از صفحهٔ ورودِ شماره، مدالِ راهنمای تامین — مسیر: ثبت‌نام → کاتالوگ → تامین
        if (!isAuthenticated) {
            setSupOpen(true);
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
            `NOTE:بازوی خرید «${inquiry.title}» — دیمت`,
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
            toast.success(next === 'open' ? 'بازوی خرید باز شد' : 'پذیرش قیمت متوقف شد');
            refetch();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'تغییر وضعیت ناموفق بود');
        }
    };

    if (isLoading) {
        return (
            <div className="grid min-h-screen place-items-center bg-white dark:bg-gray-950">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (isError || !inquiry) {
        return (
            <div className="grid min-h-screen place-items-center bg-white px-4 text-center dark:bg-gray-950">
                <div>
                    <Package className="mx-auto size-14 text-stone-300 dark:text-gray-700" />
                    <h1 className="mt-4 text-xl font-black">این بازوی خرید پیدا نشد</h1>
                    <p className="mt-2 text-sm text-stone-500">ممکن است حذف شده باشد یا لینک اشتباه باشد.</p>
                    <Link href="/" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-extrabold text-on-primary">
                        رفتن به دیمت
                    </Link>
                </div>
            </div>
        );
    }

    const showFooterCta = canTouchOffer && !isOwner;
    const bizLogo = inquiry.business?.logoUrl || null;
    const ownerAvatar = inquiry.owner?.avatarUrl || null;
    const isLive = isOpen && !deadlineOver;

    // ✅ ارتباط تجاری سه‌حالته — «ارسال درخواست تامین» (خواستهٔ مالک): هم عمومی هم خصوصی
    //     none → دکمه | pending → چیپ «در انتظار تایید» | member → چیپ «تاییدشده»
    const openCoop = () => {
        // 🦠 مهمان: قیف تامین‌کننده — اول توضیح، بعد ثبت‌نام و ساخت کاتالوگ
        if (!isAuthenticated) {
            setSupOpen(true);
            return;
        }
        setPrivOpen(true);
    };

    const CoopAction = ({ className = '' }: { className?: string }) => {
        if (isOwner) return null;
        if (accessState === 'member') return (
            <span aria-label="ارتباط تامین شما با این خریدار برقرار است"
                className={`flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-200/70 bg-emerald-50 text-sm font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300 ${className}`}>
                <Check className="size-4" />
                تامین‌کنندهٔ تاییدشدهٔ این خریدار هستی
            </span>
        );
        if (accessState === 'pending' || requestedSelf) return (
            <span aria-label="درخواست تامین در انتظار تایید خریدار است"
                className={`flex h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-brand-accent-tint bg-brand-accent-soft text-sm font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300 ${className}`}>
                <Clock className="size-4" />
                درخواست تامین در انتظار تایید خریدار
            </span>
        );
        return (
            <button onClick={openCoop} aria-label="ارسال درخواست تامین"
                title="با کاتالوگ قیمتت به این خریدار درخواست تامین بده"
                className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-on-primary shadow-lg shadow-primary/25 transition-all hover:scale-[1.01] hover:opacity-95 active:scale-95 ${className}`}>
                <Handshake className="size-4" />
                ارسال درخواست تامین
            </button>
        );
    };

    // آمار کارت هویت — اعداد مفید صفحه (خواستهٔ مالک: ۳-۴ عدد کاربردی + بازدید و ذخیره)
    const Stat = ({ v, l, lSm, accent = false }: { v: number; l: string; lSm?: string; accent?: boolean }) => (
        <div className="text-center">
            <p className={`text-sm font-black sm:text-base ${accent ? 'text-primary' : 'text-stone-900 dark:text-gray-100'}`}>{faNum(v)}</p>
            <p className="mt-0.5 text-[8.5px] font-bold text-stone-400 dark:text-gray-500 sm:text-[10px]">
                <span className="hidden sm:inline">{l}</span>
                <span className="sm:hidden">{lSm || l}</span>
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-white text-stone-900 dark:bg-gray-950 dark:text-gray-100">
            {/* ═══ نوار ابزار — قرینهٔ کاتالوگ: بازگشت | سوییچر بازوهای ذخیره‌شده | تنظیمات/ذخیره/اشتراک ═══ */}
            <header className="sticky top-0 z-40 border-b border-stone-100/80 bg-white/90 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/90">
                <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-1 px-4">
                    {/* بازگشت */}
                    <button onClick={handleBack} aria-label="بازگشت"
                        className="grid size-10 shrink-0 place-items-center rounded-full border border-stone-200/80 bg-white text-stone-600 shadow-sm transition-all hover:scale-105 active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                        <ArrowRight className="size-5" />
                    </button>

                    {/* ═══ سوییچر بازوهای ذخیره‌شده (کاربر لاگین) یا چیپ پروفایل خریدار (مهمان) — وسط ═══ */}
                    {isAuthenticated ? (
                    <div className="relative flex min-w-0 flex-1 justify-center" ref={savedDropdownRef}>
                            <button onClick={() => setSavedOpen((v) => !v)} aria-label="سوییچ بین بازوهای خرید ذخیره‌شده"
                                className="inline-flex min-w-0 items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-800 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-100">
                                <Bookmark className="hidden size-3.5 sm:block" />
                                <span className="hidden sm:inline">بازوهای ذخیره‌شده</span>
                                <span className="sm:hidden">ذخیره‌ها</span>
                                <span className="rounded-full bg-stone-100 px-1.5 py-0.5 text-[10px] dark:bg-gray-800">{faNum(savedInquiries.length)}</span>
                                <ChevronDown className={`size-3.5 transition-transform duration-200 ${savedOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {savedOpen && (
                                <div className="absolute top-full mt-1 w-72 overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                                    <div className="max-h-72 overflow-y-auto py-1">
                                        {savedInquiries.length === 0 ? (
                                            <p className="px-4 py-6 text-center text-[11px] font-bold leading-5 text-stone-400 dark:text-gray-500">
                                                هنوز بازویی ذخیره نکردی —<br />با آیکون نشانکِ بالای همین صفحه ذخیره کن
                                            </p>
                                        ) : savedInquiries.map((s: any) => {
                                            const arm = s.inquiry ?? {};
                                            const armSlug = arm.slug || arm.id;
                                            const active = armSlug === (inquiry.slug || inquiry.id);
                                            return (
                                                <button key={s.id} onClick={() => { setSavedOpen(false); if (!active) router.push(`/${armSlug}`); }}
                                                    className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-right transition-colors ${active ? 'bg-brand-primary-soft dark:bg-primary/10' : 'hover:bg-stone-50 dark:hover:bg-gray-800/50'}`}>
                                                    <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-stone-100 dark:bg-gray-800">
                                                        {arm.business?.logoUrl
                                                            ? <Image src={arm.business.logoUrl} alt="" width={32} height={32} className="size-full object-cover" unoptimized />
                                                            : <ClipboardList className="size-3.5 text-stone-400" />}
                                                    </span>
                                                    <span className="min-w-0 flex-1">
                                                        <span className="block truncate text-xs font-bold">{arm.title}</span>
                                                        {arm.city && <span className="block text-[9px] text-stone-400">{arm.city}</span>}
                                                    </span>
                                                    {active && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : null}

                    {/* 👤 چیپ پروفایل خریدار در هدر — مهمان‌ها (مخاطب اصلی لینک) هویت صاحب بازو را در هدر ببینند (خواستهٔ مالک — الگو از هدر کاتالوگ) */}
                    {!isAuthenticated && (
                        <button onClick={() => document.getElementById('buyer-box')?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                            aria-label="پروفایل خریدار" title="پروفایل خریدار"
                            className="flex min-w-0 flex-1 items-center justify-center gap-2">
                            {ownerAvatar ? (
                                <Image src={ownerAvatar} alt={inquiry.owner?.fullName || ''} width={32} height={32}
                                    className="size-7 shrink-0 rounded-full object-cover ring-1 ring-stone-200 dark:ring-gray-700" unoptimized />
                            ) : (
                                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-stone-100 dark:bg-gray-800">
                                    <User className="size-3.5 text-stone-400" />
                                </span>
                            )}
                            <span className="min-w-0 truncate text-[11px] font-black text-stone-600 dark:text-gray-300">
                                {inquiry.owner?.fullName || inquiry.business?.name || 'خریدار دیمت'}
                            </span>
                        </button>
                    )}
                    <div className="flex shrink-0 items-center gap-1.5">
                        {isOwner && (
                            <Link href={`/my-inquiries?catalog=${inquiry.id}`} aria-label="مدیریت بازوی خرید در پنل" title="مدیریت در پنل"
                                className="grid size-10 place-items-center rounded-full border border-stone-200/80 bg-white text-stone-600 shadow-sm transition-all hover:scale-105 active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                                <Settings className="size-5" />
                            </Link>
                        )}
                        <button onClick={handleSaveToggle} aria-label={isSaved ? 'حذف از ذخیره‌ها' : 'ذخیرهٔ بازوی خرید'} title={isSaved ? 'حذف از ذخیره‌ها' : 'ذخیره'}
                            className={`grid size-10 place-items-center rounded-full border shadow-sm transition-all hover:scale-105 active:scale-95 ${isSaved ? 'border-primary/30 bg-brand-primary-soft text-primary dark:bg-primary/15' : 'border-stone-200/80 bg-white text-stone-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200'}`}>
                            <Bookmark className={`size-5 ${isSaved ? 'fill-primary' : ''}`} />
                        </button>
                        <button onClick={copyLink} aria-label="اشتراک‌گذاری" title="اشتراک‌گذاری"
                            className="grid size-10 place-items-center rounded-full border border-stone-200/80 bg-white text-stone-600 shadow-sm transition-all hover:scale-105 active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                            {copied ? <Check className="size-5 text-emerald-500" /> : <Share2 className="size-5" />}
                        </button>
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-4 pb-32 pt-5">
                {/* ═══ کارت هویت بازو — هم‌خانوادهٔ هدر کاتالوگ قیمت ═══ */}
                <motion.section {...fadeUp()} className={`overflow-hidden ${CARD} rounded-3xl`}>
                    <div className="h-1 bg-gradient-to-l from-primary via-brand-accent to-brand-primary/50" />
                    <div className="p-5 sm:p-6">
                        {/* ردیف هویت — لوگو + عنوان + بج زندهٔ «در حال قیمت گیری» */}
                        <div className="flex items-center gap-3.5">
                            <div className="size-16 shrink-0 overflow-hidden rounded-2xl bg-brand-primary-soft sm:size-20">
                                {bizLogo ? (
                                    <Image src={bizLogo} alt={inquiry.business?.name || inquiry.title} width={80} height={80} className="size-full object-cover" unoptimized />
                                ) : (
                                    <span className="grid size-full place-items-center"><ClipboardList className="size-7 text-primary sm:size-8" /></span>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                                    <h1 className="text-lg font-black leading-7 sm:text-2xl sm:leading-9">{inquiry.title}</h1>
                                    {isLive ? (
                                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-primary-soft px-2.5 py-1 text-[9px] font-black text-brand-primary dark:bg-primary/15 sm:text-[10.5px]">
                                            <span className="size-1.5 animate-pulse rounded-full bg-primary" />
                                            در حال قیمت گیری
                                        </span>
                                    ) : (
                                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-stone-100 px-2.5 py-1 text-[9px] font-black text-stone-500 dark:bg-gray-800 dark:text-gray-400 sm:text-[10.5px]">
                                            <Pause className="size-3" />
                                            توقف قیمت گیری
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 text-[11px] font-bold text-stone-400 dark:text-gray-500">
                                    {inquiry.business?.name || inquiry.owner?.fullName || 'کاربر دیمت'}
                                    {inquiry.city ? ` · ${inquiry.city}` : ''} · {faTimeAgo(inquiry.createdAt)}
                                </p>
                            </div>
                        </div>

                        {/* آمار — قیمت‌گیری/اقلام/تامین‌کننده/بازدید/ذخیره */}
                        <div className="mt-4 grid grid-cols-5 gap-1 border-y border-stone-100 py-3 dark:border-gray-800">
                            <Stat v={urgentItems.length} l="در حال قیمت‌گیری" lSm="قیمت‌گیری" accent />
                            <Stat v={items.length} l="قلم خرید" lSm="قلم" />
                            <Stat v={suppliersCount} l="تامین‌کننده" lSm="تامین" />
                            <Stat v={inquiry.viewCount} l="بازدید" />
                            <Stat v={savesCount} l="ذخیره" />
                        </div>

                        {/* ✅ ارتباط — «ارسال درخواست تامین» برای همه دیده می‌شود (عمومی و خصوصی) */}
                        {!isOwner && <CoopAction className="mt-4" />}

                        {/* 👤 باکس خریدار — عکس پروفایل + تماس؛ برای همه رندر می‌شود (هویت صاحب بازو — خواستهٔ مالک) */}
                        <div id="buyer-box" className="mt-3 flex items-center gap-2.5 rounded-2xl bg-stone-50 px-3.5 py-3 dark:bg-gray-950/60">
                            {ownerAvatar ? (
                                <Image src={ownerAvatar} alt={inquiry.owner?.fullName || ''} width={48} height={48}
                                    className="size-11 shrink-0 rounded-full object-cover ring-2 ring-white dark:ring-gray-800" unoptimized />
                            ) : (
                                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white shadow-sm dark:bg-gray-900">
                                    <User className="size-5 text-stone-300 dark:text-gray-600" />
                                </span>
                            )}
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-black">{inquiry.owner?.fullName || inquiry.business?.name || 'خریدار'}</p>
                                <p className="mt-0.5 text-[10px] font-bold text-stone-400 dark:text-gray-500">
                                    {isOwner ? 'این بازوی خرید مال توست' : 'خریدار — برای هماهنگی تامین در دسترسه'}
                                </p>
                            </div>
                            {!isOwner && bizPhone && (
                                <a href={`tel:${bizPhone}`} aria-label="تماس با خریدار"
                                    className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg bg-primary px-3.5 text-[11px] font-extrabold text-on-primary transition active:scale-95">
                                    <PhoneCall className="size-3.5" />
                                    تماس
                                </a>
                            )}
                            {!isOwner && (
                                <button onClick={saveContact}
                                    className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-stone-200 bg-white px-3 text-[11px] font-extrabold text-stone-600 transition active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200">
                                    <UserPlus className="size-3.5 text-primary" />
                                    ذخیره مخاطب
                                </button>
                            )}
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
                                <span key={t} className="rounded-full bg-brand-accent-soft px-3 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">{t}</span>
                            ))}
                        </div>
                    </div>
                </motion.section>

                {/* ═══ 🦠 قیف تامین‌کننده — فقط مهمان؛ تامین‌کننده به کاتالوگ نیاز دارد نه بازو (خواستهٔ مالک) ═══ */}
                {!isAuthenticated && (
                    <motion.div {...fadeUp(0.05)}
                        className="mt-4 flex items-center gap-3 rounded-2xl border border-brand-accent/30 bg-brand-accent-soft/60 px-4 py-3.5 dark:border-amber-500/25 dark:bg-amber-500/5">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm dark:bg-gray-900">
                            <Store className="size-4 text-amber-600 dark:text-amber-400" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-black text-amber-800 dark:text-amber-300">تامین‌کننده هستی؟ اول کاتالوگت را بساز</p>
                            <p className="mt-0.5 text-[10.5px] font-bold leading-4 text-amber-700/80 dark:text-amber-400/80">
                                در دیمت ثبت‌نام کن و در یک دقیقه کاتالوگ محصولات بساز — از این پس تامین‌کنندهٔ صدها بازوی خرید باش
                            </p>
                        </div>
                        <button onClick={() => router.push(supplierJoinHref)}
                            className="shrink-0 rounded-full bg-amber-500 px-3.5 py-2 text-[11px] font-extrabold text-white shadow-sm transition-opacity hover:opacity-90">
                            ثبت‌نام تامین‌کننده
                        </button>
                    </motion.div>
                )}

                {/* ═══ 🦠 نوار ویروسی ساخت بازو — فقط کسانی که بازو ندارند (مهمان/بدون بازو) ═══ */}
                {showViral && (
                    <motion.button {...fadeUp(0.08)} onClick={() => router.push(armHref)}
                        className="mt-3 flex w-full items-center gap-3 rounded-2xl border border-primary/25 bg-gradient-to-l from-brand-primary-soft via-brand-primary-soft/60 to-transparent px-4 py-3.5 text-right shadow-sm transition-all hover:shadow-md active:scale-[0.99] dark:border-primary/20 dark:from-primary/10 dark:via-primary/5 dark:to-transparent">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm dark:bg-gray-900">
                            <Gift className="size-4 text-primary" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-[12.5px] font-black text-brand-primary dark:text-emerald-300">این بازوی خرید را می‌خواهی؟ برای خودت هم بساز</span>
                            <span className="mt-0.5 block text-[10.5px] font-bold leading-4 text-brand-primary/70 dark:text-emerald-300/70">
                                لیست خریدت را بساز، برای تامین‌کننده‌ها بفرست و قیمت‌ها را یک‌جا بگیر
                            </span>
                        </span>
                        <span className="shrink-0 rounded-full bg-primary px-3.5 py-2 text-[11px] font-extrabold text-on-primary shadow-sm">ساخت بازو</span>
                    </motion.button>
                )}
                {isOwner && (inquiry.offers?.length ?? 0) > 0 && (
                    <motion.button {...fadeUp(0.05)} onClick={scrollToOffers}
                        className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-primary/25 bg-brand-primary-soft px-4 py-3.5 text-right shadow-sm transition-all hover:shadow-md active:scale-[0.99] dark:border-primary/20 dark:bg-primary/10">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm dark:bg-gray-900">
                            <MessageSquareText className="size-4 text-primary" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block text-[12.5px] font-black text-brand-primary dark:text-emerald-300">
                                {faNum(inquiry.offers!.length)} پیشنهاد قیمت دریافتی
                            </span>
                            <span className="mt-0.5 block text-[10.5px] font-bold leading-4 text-brand-primary/70 dark:text-emerald-300/70">
                                تامین‌کننده‌ها واکنش داده‌اند — ببین چی پیشنهاد دادن
                            </span>
                        </span>
                        <ChevronDown className="size-4 shrink-0 -rotate-90 text-brand-primary dark:text-emerald-300" />
                    </motion.button>
                )}

                {/* ═══ بنر بازوی خرید خصوصی — فقط کاربر لاگین‌شده؛ مهمان به‌جایش قیف تامین‌کننده را می‌بیند
                    (برای غیرعضو مهم نیست «خصوصیه» بداند — باید راه تامین را ببیند: خواستهٔ مالک) ═══ */}
                {limited && isAuthenticated && (
                    <motion.div {...fadeUp(0.05)}
                        className="mt-4 flex items-center gap-3 rounded-2xl border border-brand-accent/30 bg-brand-accent-soft/70 px-4 py-3.5 dark:border-amber-500/25 dark:bg-amber-500/5">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm dark:bg-gray-900">
                            <Lock className="size-4 text-amber-600 dark:text-amber-400" />
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-black text-amber-800 dark:text-amber-300">این بازوی خرید خصوصیه</p>
                            <p className="mt-0.5 text-[10.5px] font-bold leading-4 text-amber-700/80 dark:text-amber-400/80">
                                {(accessState === 'pending' || requestedSelf)
                                    ? 'درخواست تامینت ثبت شد — به‌محض تایید خریدار می‌توانی قیمت بفرستی'
                                    : 'همه لیست را می‌بینند؛ ولی فقط تامین‌کننده‌های تاییدشدهٔ خریدار می‌توانند قیمت بدهند'}
                            </p>
                        </div>
                        {accessState !== 'pending' && !requestedSelf && (
                            <button onClick={openCoop}
                                className="shrink-0 rounded-full bg-primary px-3.5 py-2 text-[11px] font-extrabold text-on-primary shadow-sm transition-opacity hover:opacity-90">
                                {isAuthenticated ? 'ارسال درخواست تامین' : 'ورود'}
                            </button>
                        )}
                    </motion.div>
                )}

                {/* ═══ در حال قیمت گیری — بالای صفحه (نام جدید به خواستهٔ مالک) ═══ */}
                <section className="mt-6">
                    <div className="mb-3 flex items-center justify-between gap-2">
                        <h2 className="flex items-center gap-2 text-sm font-black text-stone-700 dark:text-gray-300">
                            <Megaphone className="size-4 text-primary" />
                            در حال قیمت گیری
                            <span className="rounded-full bg-primary px-2 py-0.5 text-[9px] font-black text-on-primary">{faNum(urgentItems.length)}</span>
                        </h2>

                        {/* ⏯️ مالک: توقف/شروع قیمت‌گیری — آیکون پلی/پاز جای دکمهٔ بزرگ (خواستهٔ مالک) */}
                        {isOwner && items.length > 0 && (
                            <button onClick={toggleStatus} disabled={updateInquiry.isPending}
                                title={isOpen ? 'توقف قیمت‌گیری — پیشنهاد جدید پذیرفته نمی‌شود' : 'شروع قیمت‌گیری'}
                                aria-label={isOpen ? 'توقف قیمت‌گیری' : 'شروع قیمت‌گیری'}
                                className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-extrabold transition-all active:scale-95 disabled:opacity-50 ${isOpen ? 'border-stone-200 bg-white text-stone-500 hover:border-red-200 hover:text-red-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400' : 'border-primary/40 bg-brand-primary-soft text-primary dark:bg-primary/15'}`}>
                                {isOpen ? (
                                    <><Pause className="size-3.5" /><span className="hidden sm:inline">توقف قیمت‌گیری</span></>
                                ) : (
                                    <><Play className="size-3.5" /><span className="hidden sm:inline">شروع قیمت‌گیری</span></>
                                )}
                            </button>
                        )}
                    </div>

                    {!isLive && items.length > 0 && (
                        <p className="mb-3 flex items-center gap-1.5 rounded-xl bg-stone-50 px-3 py-2 text-[11px] font-bold text-stone-400 dark:bg-gray-950/60 dark:text-gray-500">
                            <Pause className="size-3.5" />
                            قیمت‌گیری این بازو فعلاً متوقفه — پیشنهاد جدید پذیرفته نمی‌شود.
                        </p>
                    )}

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
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="font-extrabold text-stone-800 dark:text-gray-200">{it.name}</h3>
                                                {isOwner && (offersByItem.get(it.id) ?? 0) > 0 && (
                                                    <button onClick={scrollToOffers} title="دیدن پیشنهادهای این قلم"
                                                        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-accent-soft px-2 py-0.5 text-[9.5px] font-black text-amber-700 transition-colors hover:bg-brand-accent-tint dark:bg-amber-500/10 dark:text-amber-400">
                                                        <MessageSquareText className="size-3" />
                                                        {faNum(offersByItem.get(it.id))} پیشنهاد
                                                    </button>
                                                )}
                                                {isLive && (
                                                    <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[8.5px] font-black text-on-primary">فعال</span>
                                                )}
                                            </div>
                                            {it.brand && <p className="mt-0.5 text-xs font-bold text-stone-400 dark:text-gray-500">{it.brand}</p>}
                                        </div>
                                        {(it.quantity || it.unit) && (
                                            <span className="shrink-0 rounded-full bg-brand-accent-soft px-3 py-1 text-xs font-extrabold text-amber-700 dark:text-amber-400">
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
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-400 hover:text-primary dark:text-gray-500">
                                                <ExternalLink className="size-3" /> نمونه / کاتالوگ سازنده
                                            </a>
                                        ) : <span />}
                                        {showItemOffer(it) && (
                                            <motion.button
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => handleOffer({ id: it.id, name: it.name, quantity: it.quantity, unit: it.unit })}
                                                className="flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-extrabold text-on-primary shadow-md shadow-primary/25 transition-opacity hover:opacity-95">
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
                                                className="inline-flex items-center gap-1 text-[11px] font-bold text-stone-400 hover:text-primary dark:text-gray-500">
                                                <ExternalLink className="size-3" /> نمونه / کاتالوگ سازنده
                                            </a>
                                        ) : <span />}
                                        {showItemOffer(it) && (
                                            <motion.button
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => handleOffer({ id: it.id, name: it.name, quantity: it.quantity, unit: it.unit })}
                                                className="flex h-9 items-center gap-1.5 rounded-full border border-primary/40 px-4 text-xs font-extrabold text-primary transition-colors hover:bg-brand-primary-soft dark:text-emerald-300">
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
                            className="text-xs font-bold text-stone-400 underline decoration-dotted underline-offset-4 transition-colors hover:text-primary dark:text-gray-500">
                            پیشنهاد برای کل لیست
                        </button>
                    </motion.div>
                )}

                {/* بسته/مهلت — بازدیدکننده */}
                {!isOwner && (!isOpen || deadlineOver) && (
                    <p className="mt-6 rounded-2xl bg-stone-50 px-4 py-3 text-center text-sm text-stone-500 dark:bg-gray-950/60 dark:text-gray-400">
                        پذیرش قیمت این بازوی خرید بسته شده است.
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
                            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-7 text-sm font-extrabold text-on-primary shadow-lg shadow-primary/30 hover:opacity-95">
                            ورود و ثبت پیشنهاد
                        </Link>
                    </motion.section>
                )}

                {/* ─── پیشنهادها (مالک) ─── */}
                {isOwner && (
                    <section id="offers" className="mt-8 scroll-mt-20">
                        <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-stone-500 dark:text-gray-400">
                            <MessageSquareText className="size-4 text-primary" />
                            پیشنهادهای دریافتی — {faNum(inquiry.offers?.length ?? 0)}
                        </h2>
                        {(inquiry.offers?.length ?? 0) === 0 ? (
                            <div className={`${CARD} rounded-3xl px-6 py-10 text-center`}>
                                <p className="text-sm font-bold text-stone-500 dark:text-gray-400">هنوز پیشنهادی نیومده.</p>
                                <p className="mt-1 text-xs text-stone-400 dark:text-gray-500">لینک بازوی خریدت رو برای تامین‌کننده‌ها بفرست.</p>
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
                                                        <span className="grid size-10 place-items-center rounded-xl bg-brand-contrast-soft text-xs font-black text-amber-700 dark:text-amber-400">
                                                            {(o.business?.name || o.offerer?.fullName || 'ت').charAt(0)}
                                                        </span>
                                                    )}
                                                    <div>
                                                        <p className="text-sm font-extrabold">{o.business?.name || o.offerer?.fullName || 'تامین‌کننده'}</p>
                                                        <p className="text-[11px] text-stone-400 dark:text-gray-500">{faTimeAgo(o.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="text-end">
                                                    <p className="text-base font-black text-primary dark:text-emerald-300">{faPrice(o.price)}</p>
                                                    {o.priceBasis && <p className="text-[10px] font-bold text-stone-400">{o.priceBasis}</p>}
                                                </div>
                                            </div>

                                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-stone-400">
                                                {o.itemName && (
                                                    <span className="rounded-full bg-brand-accent-soft px-2 py-0.5 text-amber-700 dark:text-amber-400">{o.itemName}</span>
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

            {/* ═══ فوتر بازوی خرید — اطلاعات خریدار + بلوک‌های ویروسی (فقط بدون بازو) ═══ */}
            <ArmFooter inquiry={inquiry} showViral={showViral} bottomBar={showFooterCta} />

            {/* ═══ فوتر موبایل — CTA جمع‌وجور «پیشنهاد قیمت» (خواستهٔ مالک) ═══ */}
            {showFooterCta && (
                <div className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-100 bg-white/95 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/95 lg:hidden"
                    style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                    <div className="mx-auto flex h-16 max-w-2xl items-center justify-between gap-3 px-4">
                        <div className="min-w-0">
                            <p className="truncate text-[12px] font-black text-stone-800 dark:text-gray-200">می‌تونی این لیست رو تامین کنی؟</p>
                            <p className="truncate text-[10px] font-bold text-stone-400 dark:text-gray-500">
                                {limited ? 'بازوی خرید خصوصیه — اول درخواست تامین' : 'قیمت بده، خریدار باهات تماس می‌گیره'}
                            </p>
                        </div>
                        <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleOffer({ name: 'کل لیست' })}
                            className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-primary px-5 text-[13px] font-extrabold text-on-primary shadow-lg shadow-primary/30 transition-opacity hover:opacity-95">
                            <Send className="size-4" />
                            پیشنهاد قیمت
                        </motion.button>
                    </div>
                </div>
            )}

            {/* ═══ مدال درخواست همکاری — بازوی خرید خصوصی ═══ */}
            {privOpen && (
                <PrivateRequestModal
                    inquiry={inquiry as any}
                    onClose={() => setPrivOpen(false)}
                    onRequested={() => { setRequestedSelf(true); setPrivOpen(false); refetch(); }}
                />
            )}

            {/* ═══ 🦠 مدال قیف تامین‌کننده — مهمان قبل از ورود؛ مسیر: ثبت‌نام ← کاتالوگ ← تامین ═══ */}
            {supOpen && (
                <SupplierOnboardModal
                    inquiry={inquiry as any}
                    onClose={() => setSupOpen(false)}
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

// ═══ مدال ارسال درخواست تامین — با کاتالوگ قیمتت به خریدار درخواست می‌دهی؛
//     هم روی بازوی عمومی هم خصوصی دیده می‌شود (خواستهٔ مالک)؛
//     بعد از تایید او، هم از همین صفحه هم از کاتالوگش می‌توانی پیشنهاد قیمت بفرستی ═══
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

                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-primary-soft dark:bg-primary/10">
                    <Handshake className="size-6 text-primary" />
                </span>
                <h1 className="mt-4 text-lg font-black">ارسال درخواست تامین</h1>
                {inquiry.title && <p className="mt-1 text-sm font-bold text-stone-500 dark:text-gray-400">«{inquiry.title}»</p>}
                <p className="mx-auto mt-3 max-w-xs text-[12px] font-bold leading-6 text-stone-500 dark:text-gray-400">
                    با یکی از کاتالوگ‌های قیمتت به این خریدار درخواست تامین بده؛
                    وقتی پذیرفت، هم از همین صفحه هم از کاتالوگش می‌توانی برایش پیشنهاد قیمت بفرستی.
                </p>
                {inquiry.visibility === 'private' && (
                    <p className="mx-auto mt-2 max-w-xs rounded-xl bg-brand-accent-soft px-3 py-2 text-[11px] font-bold leading-5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        این بازوی خرید خصوصیه — فقط تامین‌کننده‌های تاییدشدهٔ خریدار می‌توانند قیمت بدهند.
                    </p>
                )}
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
    // کاتالوگ‌های قیمت من — برای درخواست همکاری
    const { data: catalogsRaw, isLoading: catsLoading } = useQuery({
        queryKey: ['catalogs'],
        queryFn: () => apiService.catalog.getAll(),
        enabled: isAuthenticated,
        staleTime: 60_000,
    });
    const myCatalogs: any[] = catalogsRaw ?? [];
    const [catalogId, setCatalogId] = useState<string>('');

    const send = async () => {
        if (!catalogId) return;
        try {
            await requestAccess.mutateAsync({ inquiryId: inquiry.id, catalogId });
            toast.success('درخواست تامینت ثبت شد — منتظر تایید خریدار باش');
            onRequested();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ارسال درخواست ناموفق بود');
        }
    };

    if (!isAuthenticated) {
        // 🦠 مهمان: به‌جای پرش خشک به ورود — توضیح مسیر تامین + CTA ثبت‌نام و ساخت کاتالوگ
        const refQ = inquiry?.owner?.referralCode ? `?ref=${inquiry.owner.referralCode}` : '';
        const joinHref = `/login?redirect=${encodeURIComponent(`/business/register${refQ}`)}&intent=catalog`;
        return (
            <>
                <p className="mx-auto mt-4 max-w-xs rounded-xl bg-brand-accent-soft px-3 py-2.5 text-[11.5px] font-bold leading-6 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
                    برای تامین این بازوی خرید اول عضو دیمت شو و کاتالوگ محصولاتت را بساز —
                    بعد با کاتالوگت به این خریدار درخواست تامین بده.
                </p>
                <Link href={joinHref}
                    className="mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-extrabold text-on-primary shadow-lg shadow-primary/25 transition-opacity hover:opacity-95">
                    <Store className="size-4" />
                    ثبت‌نام و ساخت کاتالوگ تامین
                </Link>
                <Link href={`/login?redirect=${encodeURIComponent(`/${inquiry.slug || inquiry.id}`)}`}
                    className="mt-2.5 block text-center text-[11px] font-bold text-stone-400 hover:text-primary dark:text-gray-500">
                    قبلا عضو دیمت هستم — فقط ورود
                </Link>
            </>
        );
    }
    if (catsLoading) {
        return <Loader2 className="mx-auto mt-5 size-5 animate-spin text-stone-300" />;
    }
    if (myCatalogs.length === 0) {
        return (
            <>
                <p className="mt-5 text-[12px] font-bold text-stone-500 dark:text-gray-400">برای درخواست تامین اول یک کاتالوگ قیمت بساز</p>
                <Link href="/business/register"
                    className="mt-3 inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-extrabold text-on-primary transition-opacity hover:opacity-95">
                    ساخت کاتالوگ قیمت
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
                                ? 'border-primary bg-brand-primary-soft/60 dark:bg-primary/10'
                                : 'border-stone-100 hover:border-stone-200 dark:border-gray-800'
                        }`}>
                        <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-stone-100 dark:bg-gray-800">
                            {c.logoUrl
                                ? // eslint-disable-next-line @next/next/no-img-element
                                  <img src={c.logoUrl} alt="" className="size-full object-cover" />
                                : <Store className="size-3.5 text-stone-400" />}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[12px] font-black text-stone-800 dark:text-gray-200">{c.name}</span>
                        {catalogId === c.id && <Check className="size-4 shrink-0 text-primary" />}
                    </button>
                ))}
            </div>
            <motion.button whileTap={{ scale: 0.97 }} disabled={!catalogId || requestAccess.isPending} onClick={send}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-extrabold text-on-primary shadow-lg shadow-primary/25 transition-opacity hover:opacity-95 disabled:opacity-50">
                {requestAccess.isPending ? <Loader2 className="size-4 animate-spin" /> : <Handshake className="size-4" />}
                ارسال درخواست تامین
            </motion.button>
        </>
    );
}

// ═══ 🦠 مدال قیف تامین‌کننده — مهمان که دکمهٔ قیمت/درخواست را لمس کرد،
//     قبل از صفحهٔ ورودِ شماره، مسیرِ تامین را می‌بیند:
//     ثبت‌نام در دیمت ← ساخت کاتالوگ محصولات ← تامین این خریدار و صدها خریدار دیگر
//     (خواستهٔ مالک: ابزارها تامین‌کننده را به‌طور طبیعی به ثبت‌نام و ساخت کاتالوگ برسانند) ═══
function SupplierOnboardModal({ inquiry, onClose }: { inquiry: any; onClose: () => void }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null;

    const refQ = inquiry?.owner?.referralCode ? `?ref=${inquiry.owner.referralCode}` : '';
    const joinHref = `/login?redirect=${encodeURIComponent(`/business/register${refQ}`)}&intent=catalog`;
    const backHref = `/login?redirect=${encodeURIComponent(`/${inquiry?.slug || inquiry?.id || ''}`)}`;

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

                <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-accent-soft dark:bg-amber-500/10">
                    <Store className="size-6 text-amber-600 dark:text-amber-400" />
                </span>
                <h1 className="mt-4 text-lg font-black">می‌خواهی این لیست را تامین کنی؟</h1>
                {inquiry?.title && <p className="mt-1 text-sm font-bold text-stone-500 dark:text-gray-400">«{inquiry.title}»</p>}
                <p className="mx-auto mt-3 max-w-xs text-[12px] font-bold leading-6 text-stone-500 dark:text-gray-400">
                    برای تامین، اول عضو دیمت شو و در یک دقیقه کاتالوگ محصولاتت را بساز؛
                    از این پس با کاتالوگت می‌توانی این خریدار را تامین کنی و تامین‌کنندهٔ صدها بازوی خرید دیگر باشی.
                </p>
                <Link href={joinHref}
                    className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-extrabold text-on-primary shadow-lg shadow-primary/25 transition-opacity hover:opacity-95">
                    <Sparkles className="size-4" />
                    ثبت‌نام و ساخت کاتالوگ محصولات
                </Link>
                <Link href={backHref}
                    className="mt-2.5 block text-center text-[11px] font-bold text-stone-400 hover:text-primary dark:text-gray-500">
                    قبلا عضو دیمت هستم — فقط ورود
                </Link>
            </motion.div>
        </div>,
        document.body,
    );
}
