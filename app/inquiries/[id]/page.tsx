// app/inquiries/[id]/page.tsx
// کاتالوگ خرید عمومی — همان چیزی که تامین‌کننده با لینک می‌بیند:
//   ۱) «اعلام خریدهای فعال» بالای صفحه — اقلامی که خریدار همین حالا قیمت می‌خواهد
//   ۲) «سایر کالاهایی که معمولا می‌خرد» — قیمت‌گیری‌شان بسته به تنظیمات خریدار
//      (امکان ارسال قیمت برای خریدهای غیر فوری)
//   پیشنهاد قیمت قلم‌به‌قلم در شیت ثبت می‌شود؛ مالک: مدیریت در پنل.
'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useInquiry, useAddOffer, useUpdateOfferStatus, useUpdateInquiry, useDeleteInquiry } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import {
    ClipboardList, MapPin, Clock, User, Share2, Check, Loader2,
    Send, Package, Store, Eye, Trash2, Ban, RotateCcw, MessageSquareText,
    Truck, Wallet, ExternalLink, Phone, Megaphone, PackageSearch, X, Settings,
} from 'lucide-react';
import { faNum, faPrice, faTimeAgo, faDeadlineLeft, STATUS_FA, STATUS_CHIP } from '../utils';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' as const },
    transition: { duration: 0.45, delay, ease: 'easeOut' as const },
});

const BASIS_OPTIONS = ['جمع کل', 'هر کیلو', 'هر عدد', 'هر کارتن', 'هر متر'];

/** شیت ثبت پیشنهاد قیمت — برای یک قلم یا کل لیست */
function OfferSheet({ inquiry, item, onClose }: {
    inquiry: any;
    item: { id?: string; name: string; quantity?: number | null; unit?: string | null } | null;
    onClose: () => void;
}) {
    const addOffer = useAddOffer();
    const [price, setPrice] = useState('');
    const [basis, setBasis] = useState('جمع کل');
    const [days, setDays] = useState('');
    const [message, setMessage] = useState('');
    const [phone, setPhone] = useState('');
    const [sending, setSending] = useState(false);
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const submit = async () => {
        const p = Number((price || '').replace(/[^\d.]/g, ''));
        if (!p || p <= 0) {
            toast.error('مبلغ پیشنهاد را بنویس');
            return;
        }
        setSending(true);
        try {
            await addOffer.mutateAsync({
                inquiryId: inquiry.id,
                data: {
                    itemId: item?.id,
                    price: p,
                    priceBasis: basis || undefined,
                    deliveryDays: days ? Number(days.replace(/[^\d]/g, '')) : undefined,
                    message: message.trim() || undefined,
                    contactPhone: phone.trim() || undefined,
                },
            });
            toast.success('پیشنهادت ثبت شد — خریدار می‌بینتش');
            onClose();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ثبت پیشنهاد ناموفق بود');
        } finally {
            setSending(false);
        }
    };

    if (!mounted) return null;
    return createPortal(
        <AnimatePresence>
            {item && (
                <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center sm:p-4">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/50" onClick={sending ? undefined : onClose} />
                    <motion.div
                        initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                        className="relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto scrollbar-slim
                            rounded-t-3xl sm:rounded-2xl bg-white dark:bg-gray-900 shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white/95 px-5 py-3.5 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
                            <h2 className="flex items-center gap-2 text-[15px] font-black">
                                <Store className="size-4 text-brand-amber" />
                                قیمتت رو بذار
                            </h2>
                            <button onClick={onClose} aria-label="بستن"
                                className="grid size-8 place-items-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 dark:hover:bg-gray-800">
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="px-5 py-4">
                            {/* زمینهٔ قلم */}
                            <div className="rounded-2xl border border-brand-amber-tint bg-brand-amber-soft/50 px-4 py-3 dark:bg-amber-500/10">
                                <p className="text-sm font-extrabold text-amber-800 dark:text-amber-300">
                                    {item.id ? item.name : 'کل لیست خرید'}
                                </p>
                                {(item.quantity || item.unit) && (
                                    <p className="mt-0.5 text-[11px] font-bold text-amber-700/80 dark:text-amber-400/80">
                                        {item.quantity ? faNum(item.quantity) : ''} {item.unit}
                                    </p>
                                )}
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="mb-1 block text-[11px] font-extrabold text-stone-400">مبلغ (تومان)</label>
                                        <input value={price} onChange={(e) => setPrice(e.target.value)} inputMode="numeric"
                                            placeholder="مثلاً ۲٬۵۰۰٬۰۰۰"
                                            className="h-11 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-sm font-bold outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-100" />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1">
                                        <label className="mb-1 block text-[11px] font-extrabold text-stone-400">مبنا</label>
                                        <select value={basis} onChange={(e) => setBasis(e.target.value)}
                                            className="h-11 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-sm font-bold outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-100 dark:[color-scheme:dark]">
                                            {BASIS_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-extrabold text-stone-400">زمان تحویل (روز — اختیاری)</label>
                                    <input value={days} onChange={(e) => setDays(e.target.value)} inputMode="numeric" placeholder="مثلاً ۳"
                                        className="h-11 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-sm outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-100" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-extrabold text-stone-400">پیام به خریدار (اختیاری)</label>
                                    <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2}
                                        placeholder="مثلاً: تحویل درب انبار، فاکتور رسمی داریم"
                                        className="w-full rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-100" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-[11px] font-extrabold text-stone-400">تلفن تماس (اختیاری)</label>
                                    <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" dir="ltr" placeholder="۰۹۱۲…"
                                        className="h-11 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-sm outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-100" />
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    disabled={sending}
                                    onClick={submit}
                                    className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-amber text-sm font-extrabold text-white shadow-lg shadow-brand-amber/30 transition-colors hover:bg-brand-amber-strong disabled:opacity-50">
                                    {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                                    ثبت پیشنهاد قیمت
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
}

export default function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);

    const { data: inquiry, isLoading, isError, refetch } = useInquiry(id);
    const updateOfferStatus = useUpdateOfferStatus();
    const updateInquiry = useUpdateInquiry();
    const deleteInquiry = useDeleteInquiry();

    const [copied, setCopied] = useState(false);
    const [offerTarget, setOfferTarget] = useState<{ id?: string; name: string; quantity?: number | null; unit?: string | null } | null>(null);

    useEffect(() => {
        if (inquiry?.title) document.title = `${inquiry.title} | کاتالوگ خرید دیمت`;
    }, [inquiry?.title]);

    const isOwner = !!inquiry?.isOwner;
    const items = inquiry?.items ?? [];
    const urgentItems = useMemo(() => items.filter((it: any) => it.urgent), [items]);
    const otherItems = useMemo(() => items.filter((it: any) => !it.urgent), [items]);
    const allowOther = inquiry?.allowNonUrgentOffers !== false;

    const dl = useMemo(() => faDeadlineLeft(inquiry?.deadline), [inquiry?.deadline]);
    const shareUrl = typeof window !== 'undefined' && inquiry
        ? `${window.location.origin}/inquiries/${inquiry.slug || inquiry.id}`
        : '';

    // تامین‌کنندهٔ واردشده — پیشنهاد فقط روی کاتالوگ باز
    const canOffer = isAuthenticated && !isOwner && inquiry?.status === 'open' && dl?.text !== 'مهلت تمام شده';
    const canOfferItem = (it: any) => canOffer && (it.urgent || allowOther);
    const canOfferWholeList = canOffer && items.length > 0 && (allowOther || urgentItems.length === items.length);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('لینک کپی شد — بفرستش برای تامین‌کننده‌ها');
            setTimeout(() => setCopied(false), 1800);
        } catch { /* noop */ }
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

    const toggleStatus = async () => {
        if (!inquiry) return;
        const next = inquiry.status === 'open' ? 'closed' : 'open';
        try {
            await updateInquiry.mutateAsync({ id: inquiry.id, data: { status: next } });
            toast.success(next === 'open' ? 'کاتالوگ خرید باز شد' : 'کاتالوگ خرید بسته شد');
            refetch();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'تغییر وضعیت ناموفق بود');
        }
    };

    const remove = async () => {
        if (!inquiry || !window.confirm('کاتالوگ خرید برای همیشه حذف شود؟')) return;
        try {
            await deleteInquiry.mutateAsync(inquiry.id);
            toast.success('حذف شد');
            window.location.href = '/my-inquiries';
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'حذف ناموفق بود');
        }
    };

    if (isLoading) {
        return (
            <div className="grid min-h-screen place-items-center bg-[#FFFDF7] dark:bg-gray-950">
                <Loader2 className="size-8 animate-spin text-brand-amber" />
            </div>
        );
    }

    if (isError || !inquiry) {
        return (
            <div className="grid min-h-screen place-items-center bg-[#FFFDF7] px-4 text-center dark:bg-gray-950">
                <div>
                    <Package className="mx-auto size-14 text-stone-300 dark:text-gray-700" />
                    <h1 className="mt-4 text-xl font-black">این کاتالوگ خرید پیدا نشد</h1>
                    <p className="mt-2 text-sm text-stone-500">ممکن است حذف شده باشد یا لینک اشتباه باشد.</p>
                    <Link href="/inquiries" className="mt-5 inline-flex h-11 items-center gap-2 rounded-full bg-brand-amber px-6 text-sm font-extrabold text-white">
                        دیدن کاتالوگ‌های خرید
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFFDF7] text-stone-900 dark:bg-gray-950 dark:text-gray-100">
            {/* هدر */}
            <header className="sticky top-0 z-40 border-b border-brand-amber-tint/70 bg-[#FFFDF7]/85 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/85">
                <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
                    <Link href="/inquiries" className="flex items-center gap-1.5 text-sm font-bold text-stone-500 transition-colors hover:text-stone-900 dark:text-gray-400 dark:hover:text-gray-100">
                        دیوار کاتالوگ‌های خرید
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
                <motion.section {...fadeUp()} className="rounded-3xl border-2 border-brand-amber-tint bg-white p-5 shadow-sm dark:bg-gray-900 sm:p-6">
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

                    {/* اکشن‌های مالک */}
                    {isOwner && (
                        <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed border-stone-100 pt-4 dark:border-gray-800">
                            <Link href={`/my-inquiries?catalog=${inquiry.id}`}
                                className="flex h-10 items-center gap-1.5 rounded-full bg-brand-amber px-4 text-xs font-extrabold text-white shadow-md shadow-brand-amber/25 transition-colors hover:bg-brand-amber-strong">
                                <Settings className="size-3.5" />
                                مدیریت در پنل
                            </Link>
                            <button onClick={toggleStatus}
                                className="flex h-10 items-center gap-1.5 rounded-full border border-stone-200 px-4 text-xs font-bold text-stone-600 transition-colors hover:border-stone-400 dark:border-gray-700 dark:text-gray-300">
                                {inquiry.status === 'open' ? <><Ban className="size-3.5" /> بستن لیست</> : <><RotateCcw className="size-3.5" /> بازکردن دوباره</>}
                            </button>
                            <button onClick={remove}
                                className="flex h-10 items-center gap-1.5 rounded-full border border-red-100 px-4 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10">
                                <Trash2 className="size-3.5" /> حذف
                            </button>
                        </div>
                    )}
                </motion.section>

                {/* ═══ اعلام خریدهای فعال — بالای کاتالوگ ═══ */}
                <section className="mt-6">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-amber-700 dark:text-amber-400">
                        <Megaphone className="size-4" />
                        اعلام خریدهای فعال
                        <span className="rounded-full bg-brand-amber px-2 py-0.5 text-[9px] font-black text-white">{faNum(urgentItems.length)}</span>
                    </h2>

                    {urgentItems.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-stone-200 bg-white px-4 py-5 text-center dark:border-gray-800 dark:bg-gray-900">
                            <p className="text-xs font-bold text-stone-400 dark:text-gray-500">
                                فعلاً اعلام خرید فعالی نیست — لیست معمول خرید پایین‌تره.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {urgentItems.map((it: any, i: number) => (
                                <motion.div
                                    key={it.id}
                                    {...fadeUp(Math.min(i, 8) * 0.05)}
                                    className="rounded-2xl border-2 border-brand-amber/40 bg-white p-4 dark:bg-gray-900">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="font-extrabold text-stone-800 dark:text-gray-200">{it.name}</h3>
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
                                        {canOfferItem(it) && (
                                            <motion.button
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => setOfferTarget({ id: it.id, name: it.name, quantity: it.quantity, unit: it.unit })}
                                                className="flex h-9 items-center gap-1.5 rounded-full bg-brand-amber px-4 text-xs font-extrabold text-white shadow-md shadow-brand-amber/25 transition-colors hover:bg-brand-amber-strong">
                                                <Send className="size-3.5" />
                                                ثبت قیمت
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
                                    className="rounded-2xl border border-stone-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
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
                                        {canOfferItem(it) && (
                                            <motion.button
                                                whileTap={{ scale: 0.96 }}
                                                onClick={() => setOfferTarget({ id: it.id, name: it.name, quantity: it.quantity, unit: it.unit })}
                                                className="flex h-9 items-center gap-1.5 rounded-full border border-brand-amber/60 px-4 text-xs font-extrabold text-amber-700 transition-colors hover:bg-brand-amber-soft dark:text-amber-400">
                                                <Send className="size-3.5" />
                                                ثبت قیمت
                                            </motion.button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>
                )}

                {/* پیشنهاد کل لیست — فقط وقتی مجاز */}
                {canOfferWholeList && items.length > 1 && (
                    <motion.div {...fadeUp()} className="mt-6 text-center">
                        <button onClick={() => setOfferTarget({ name: 'کل لیست' })}
                            className="text-xs font-bold text-stone-400 underline decoration-dotted underline-offset-4 transition-colors hover:text-amber-600 dark:text-gray-500">
                            پیشنهاد برای کل لیست
                        </button>
                    </motion.div>
                )}

                {/* بسته/مهلت — تامین‌کنندهٔ واردشده */}
                {isAuthenticated && !isOwner && inquiry.status === 'closed' && (
                    <p className="mt-6 rounded-2xl bg-stone-50 px-4 py-3 text-center text-sm text-stone-500 dark:bg-gray-950/60 dark:text-gray-400">
                        این کاتالوگ بسته شده و پیشنهاد جدید نمی‌گیرد.
                    </p>
                )}

                {/* مهمان */}
                {!isAuthenticated && (
                    <motion.section {...fadeUp()} className="mt-8 rounded-3xl bg-stone-900 px-6 py-8 text-center text-white dark:bg-gray-800">
                        <h3 className="text-lg font-black">می‌تونی این لیست رو تامین کنی؟</h3>
                        <p className="mx-auto mt-2 max-w-sm text-sm leading-7 text-gray-300">
                            وارد شو و همین حالا قیمتت رو بذار — خریدار مستقیم باهات در تماسه.
                        </p>
                        <Link href={`/login?redirect=${encodeURIComponent(`/inquiries/${inquiry.slug || inquiry.id}`)}`}
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
                            <div className="rounded-3xl border-2 border-dashed border-brand-amber-tint bg-white px-6 py-10 text-center dark:bg-gray-900">
                                <p className="text-sm font-bold text-stone-500 dark:text-gray-400">هنوز پیشنهادی نیومده.</p>
                                <p className="mt-1 text-xs text-stone-400 dark:text-gray-500">لینک کاتالوگ خریدت رو برای تامین‌کننده‌ها بفرست.</p>
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
                                            className={`rounded-2xl border-2 bg-white p-4 dark:bg-gray-900 ${o.status === 'accepted' ? 'border-emerald-300 dark:border-emerald-500/40' : 'border-stone-100 dark:border-gray-800'}`}>
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

            {/* شیت ثبت پیشنهاد */}
            <OfferSheet inquiry={inquiry} item={offerTarget} onClose={() => setOfferTarget(null)} />
        </div>
    );
}
