// app/inquiries/[id]/page.tsx
// جزئیات کاتالوگ خرید — تامین‌کننده: پیشنهاد قیمت | مالک: مدیریت پیشنهادها و اشتراک‌گذاری لینک
'use client';

import React, { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useInquiry, useAddOffer, useUpdateOfferStatus, useUpdateInquiry, useDeleteInquiry } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import {
    ClipboardList, MapPin, Clock, User, Share2, Check, Loader2,
    Send, Package, Store, Eye, Trash2, Ban, RotateCcw, MessageSquareText,
    Truck, Wallet, ExternalLink, Phone,
} from 'lucide-react';
import { faNum, faPrice, faTimeAgo, faDeadlineLeft, STATUS_FA, STATUS_CHIP } from '../utils';

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 18 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-40px' as const },
    transition: { duration: 0.45, delay, ease: 'easeOut' as const },
});

const BASIS_OPTIONS = ['جمع کل', 'هر کیلو', 'هر عدد', 'هر کارتن', 'هر متر'];

export default function InquiryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);

    const { data: inquiry, isLoading, isError, refetch } = useInquiry(id);
    const addOffer = useAddOffer();
    const updateOfferStatus = useUpdateOfferStatus();
    const updateInquiry = useUpdateInquiry();
    const deleteInquiry = useDeleteInquiry();

    const [copied, setCopied] = useState(false);
    const [offerPrice, setOfferPrice] = useState('');
    const [offerBasis, setOfferBasis] = useState('جمع کل');
    const [offerDays, setOfferDays] = useState('');
    const [offerMessage, setOfferMessage] = useState('');
    const [offerPhone, setOfferPhone] = useState('');
    const [sendingOffer, setSendingOffer] = useState(false);

    useEffect(() => {
        if (inquiry?.title) document.title = `${inquiry.title} | کاتالوگ خرید دیمت`;
    }, [inquiry?.title]);

    const isOwner = !!inquiry?.isOwner;
    const canOffer = isAuthenticated && !isOwner && inquiry?.status === 'open';
    const dl = useMemo(() => faDeadlineLeft(inquiry?.deadline), [inquiry?.deadline]);
    const shareUrl = typeof window !== 'undefined' && inquiry
        ? `${window.location.origin}/inquiries/${inquiry.slug || inquiry.id}`
        : '';

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            toast.success('لینک کپی شد — بفرستش برای تامین‌کننده‌ها');
            setTimeout(() => setCopied(false), 1800);
        } catch { /* noop */ }
    };

    const submitOffer = async () => {
        const price = Number((offerPrice || '').replace(/[^\d.]/g, ''));
        if (!price || price <= 0) {
            toast.error('مبلغ پیشنهاد را بنویس');
            return;
        }
        setSendingOffer(true);
        try {
            await addOffer.mutateAsync({
                inquiryId: inquiry!.id,
                data: {
                    price,
                    priceBasis: offerBasis || undefined,
                    deliveryDays: offerDays ? Number(offerDays.replace(/[^\d]/g, '')) : undefined,
                    message: offerMessage.trim() || undefined,
                    contactPhone: offerPhone.trim() || undefined,
                },
            });
            toast.success('پیشنهادت ثبت شد — خریدار می‌بینتش');
            setOfferPrice(''); setOfferDays(''); setOfferMessage('');
            refetch();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ثبت پیشنهاد ناموفق بود');
        } finally {
            setSendingOffer(false);
        }
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
                            <button onClick={copyLink}
                                className="flex h-10 items-center gap-1.5 rounded-full bg-brand-amber px-4 text-xs font-extrabold text-white shadow-md shadow-brand-amber/25 transition-colors hover:bg-brand-amber-strong">
                                <Share2 className="size-3.5" />
                                کپی لینک برای تامین‌کننده‌ها
                            </button>
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

                {/* اقلام */}
                <section className="mt-6">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-black text-stone-500 dark:text-gray-400">
                        <Package className="size-4 text-brand-amber" />
                        لیست خرید — {faNum(inquiry.items.length)} قلم
                    </h2>
                    <div className="space-y-2.5">
                        {inquiry.items.map((it, i) => (
                            <motion.div
                                key={it.id}
                                {...fadeUp(Math.min(i, 8) * 0.05)}
                                className="rounded-2xl border border-stone-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="font-extrabold text-stone-800 dark:text-gray-200">{it.name}</h3>
                                        {it.brand && <p className="mt-0.5 text-xs font-bold text-stone-400 dark:text-gray-500">برند: {it.brand}</p>}
                                    </div>
                                    {(it.quantity || it.unit) && (
                                        <span className="shrink-0 rounded-full bg-brand-amber-soft px-3 py-1 text-xs font-extrabold text-amber-700 dark:text-amber-400">
                                            {faNum(it.quantity)} {it.unit}
                                        </span>
                                    )}
                                </div>

                                {it.specs && it.specs.length > 0 && (
                                    <div className="mt-3 grid grid-cols-2 gap-1.5">
                                        {it.specs.map((sp, si) => (
                                            <div key={si} className="rounded-xl bg-stone-50 px-3 py-1.5 text-[11px] dark:bg-gray-950/60">
                                                <span className="font-bold text-stone-400">{sp.key}: </span>
                                                <span className="font-extrabold text-stone-700 dark:text-gray-300">{sp.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {it.note && <p className="mt-2 text-xs leading-6 text-stone-500 dark:text-gray-400">{it.note}</p>}

                                {it.referenceUrl && (
                                    <a href={it.referenceUrl} target="_blank" rel="noreferrer"
                                        className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:underline dark:text-amber-400">
                                        <ExternalLink className="size-3" /> نمونه / کاتالوگ سازنده
                                    </a>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* ─── فرم پیشنهاد (تامین‌کننده) ─── */}
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

                <AnimatePresence>
                    {canOffer && (
                        <motion.section
                            initial={{ opacity: 0, y: 24 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="mt-8 rounded-3xl border-2 border-brand-amber-tint bg-white p-5 dark:bg-gray-900 sm:p-6">
                            <h2 className="flex items-center gap-2 text-base font-black">
                                <Store className="size-5 text-brand-amber" />
                                قیمتت رو بذار
                            </h2>
                            {inquiry.status === 'closed' ? (
                                <p className="mt-3 rounded-2xl bg-stone-50 px-4 py-3 text-sm text-stone-500 dark:bg-gray-950/60 dark:text-gray-400">
                                    این لیست بسته شده و پیشنهاد جدید نمی‌گیره.
                                </p>
                            ) : dl?.text === 'مهلت تمام شده' ? (
                                <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold text-red-500 dark:bg-red-500/10">
                                    مهلت ارسال پیشنهاد گذشته است.
                                </p>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="mb-1 block text-[11px] font-extrabold text-stone-400">مبلغ (تومان)</label>
                                            <input
                                                value={offerPrice}
                                                onChange={(e) => setOfferPrice(e.target.value)}
                                                inputMode="numeric"
                                                placeholder="مثلاً ۲٬۵۰۰٬۰۰۰"
                                                className="h-11 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-sm font-bold outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <label className="mb-1 block text-[11px] font-extrabold text-stone-400">مبنا</label>
                                            <select
                                                value={offerBasis}
                                                onChange={(e) => setOfferBasis(e.target.value)}
                                                className="h-11 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-sm font-bold outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60">
                                                {BASIS_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-extrabold text-stone-400">زمان تحویل (روز — اختیاری)</label>
                                        <input
                                            value={offerDays}
                                            onChange={(e) => setOfferDays(e.target.value)}
                                            inputMode="numeric"
                                            placeholder="مثلاً ۳"
                                            className="h-11 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-sm outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-extrabold text-stone-400">پیام به خریدار (اختیاری)</label>
                                        <textarea
                                            value={offerMessage}
                                            onChange={(e) => setOfferMessage(e.target.value)}
                                            rows={2}
                                            placeholder="مثلاً: تحویل درب انبار، فاکتور رسمی داریم"
                                            className="w-full rounded-xl border border-stone-100 bg-stone-50 px-3 py-2 text-sm outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-[11px] font-extrabold text-stone-400">تلفن تماس (اختیاری)</label>
                                        <input
                                            value={offerPhone}
                                            onChange={(e) => setOfferPhone(e.target.value)}
                                            inputMode="tel"
                                            dir="ltr"
                                            placeholder="۰۹۱۲…"
                                            className="h-11 w-full rounded-xl border border-stone-100 bg-stone-50 px-3 text-sm outline-none focus:border-brand-amber dark:border-gray-800 dark:bg-gray-950/60"
                                        />
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.97 }}
                                        disabled={sendingOffer}
                                        onClick={submitOffer}
                                        className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-amber text-sm font-extrabold text-white shadow-lg shadow-brand-amber/30 transition-colors hover:bg-brand-amber-strong disabled:opacity-50">
                                        {sendingOffer ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                                        ثبت پیشنهاد قیمت
                                    </motion.button>
                                </div>
                            )}
                        </motion.section>
                    )}
                </AnimatePresence>

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
        </div>
    );
}
