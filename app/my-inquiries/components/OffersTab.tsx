// app/my-inquiries/components/OffersTab.tsx
// تب پیشنهادهای دریافتی پنل بازوی خرید — چرخهٔ کامل سناریو:
//   پذیرفته‌شده‌ها «مذاکرهٔ نهایی» جلو چشم + بج نتیجهٔ فروش تامین‌کننده (فروش نهایی شد/نشده)
//   در انتظار تصمیم (پذیرش/رد) · ردشده‌ها · و «بستن پروندهٔ بازوی خرید» با ثبت نتیجهٔ معامله (فاز ۶)
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MessageSquareText, Truck, Megaphone, Share2, Sparkles,
    BadgeCheck, FolderClosed, Check, X, Loader2, PhoneCall, FileText,
} from 'lucide-react';
import OfferCallButton from '@/app/components/OfferCallButton';
import { faNum, faPrice, faTimeAgo, STATUS_FA, offerBasisLabel } from '../../inquiries/utils';
import { useReceivedProformas, useConfirmProforma, useRejectProforma } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import type { InquiryDetail, InquiryItem, InquiryOffer } from '@/lib/api/apiTypes';

interface Props {
    detail: InquiryDetail;
    offers: InquiryOffer[];
    loading: boolean;
    onDecide: (offerId: string, status: 'accepted' | 'rejected') => void;
    onFinalize: (outcome: 'succeeded' | 'failed') => void;
    finalizing: boolean;
    onGoPublish: () => void;
    busyOfferId: string | null;
}

/** بج نتیجهٔ معامله که تامین‌کننده ثبت کرده — خریدار هم باید ببیند معامله کجا رسید (فاز ۶ سناریو) */
function SaleOutcomeBadge({ offer }: { offer: InquiryOffer }) {
    if (offer.saleStatus === 'sold') {
        return (
            <span className="flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-black text-white">
                <BadgeCheck className="size-3" /> فروش نهایی شد
            </span>
        );
    }
    if (offer.saleStatus === 'not_sold') {
        return (
            <span className="flex items-center gap-1 rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-black text-stone-600 dark:bg-gray-700 dark:text-gray-300">
                <X className="size-3" /> فروش نهایی نشد
            </span>
        );
    }
    return (
        <span className="rounded-full border border-dashed border-stone-300 px-2 py-0.5 text-[10px] font-bold text-stone-400 dark:border-gray-600 dark:text-gray-500">
            فروشنده هنوز نتیجه را ثبت نکرده
        </span>
    );
}

export default function OffersTab({ detail, offers, loading, onDecide, onFinalize, finalizing, onGoPublish, busyOfferId }: Props) {
    const [finalizeOpen, setFinalizeOpen] = useState(false);
    const [pendingOutcome, setPendingOutcome] = useState<'succeeded' | 'failed' | null>(null);
    const items = detail.items ?? [];
    const itemNameById = items.reduce<Record<string, string>>((acc, it: InquiryItem) => {
        acc[it.id] = it.name;
        return acc;
    }, {});

    // ✅ پیش‌فاکتورهای دریافتی — هر پیش‌فاکتور به پیشنهاد خودش می‌چسبد؛ تایید خریدار = ثبت معامله
    const { data: receivedProformas } = useReceivedProformas();
    const confirmProforma = useConfirmProforma();
    const rejectProforma = useRejectProforma();
    const proformaByOffer = new Map<string, any>();
    for (const p of ((receivedProformas ?? []) as any[])) {
        if (p.offerId && !proformaByOffer.has(p.offerId)) proformaByOffer.set(p.offerId, p);
    }
    const decideProforma = async (id: string, decision: 'confirm' | 'reject') => {
        try {
            if (decision === 'confirm') {
                await confirmProforma.mutateAsync(id);
                toast.success('پیش‌فاکتور تایید شد — معامله داخل آی مچ ثبت شد');
            } else {
                await rejectProforma.mutateAsync(id);
                toast.success('پیش‌فاکتور رد شد — فروشنده خبردار می‌شود');
            }
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'عملیات ناموفق بود');
        }
    };

    const acceptedOffers = offers.filter((o) => o.status === 'accepted');
    const pendingOffers = offers.filter((o) => o.status === 'pending');
    const rejectedOffers = offers.filter((o) => o.status === 'rejected' || o.status === 'withdrawn');
    const isFinalized = detail.status === 'archived';

    const offerCard = (o: InquiryOffer, i: number, opts: { actions: boolean; compact?: boolean }) => {
        const busy = busyOfferId === o.id;
        const ctx = o.itemName || (o.itemId ? itemNameById[o.itemId] : null);
        return (
            <motion.div
                key={o.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: Math.min(i, 6) * 0.04 }}
                className={`rounded-2xl border-2 bg-white p-4 dark:bg-gray-900 ${
                    o.status === 'accepted' ? 'border-emerald-300 dark:border-emerald-500/40' : 'border-stone-100 dark:border-gray-800'
                } ${busy ? 'opacity-60' : ''}`}>
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
                            <p className="text-sm font-extrabold text-stone-900 dark:text-gray-100">{o.business?.name || o.offerer?.fullName || 'تامین‌کننده'}</p>
                            <p className="text-[11px] text-stone-400 dark:text-gray-500">{faTimeAgo(o.createdAt)}</p>
                        </div>
                    </div>
                    <div className="text-end">
                        <p className="text-base font-black text-brand-contrast">{faPrice(o.price, (detail as any)?.metadata?.currency)}</p>
                        {!!offerBasisLabel(o) && <p className="text-[10px] font-bold text-stone-400">{offerBasisLabel(o)}</p>}
                    </div>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-bold text-stone-400">
                    {ctx && (
                        <span className="flex items-center gap-1 rounded-full bg-brand-contrast-soft px-2 py-0.5 text-amber-700 dark:text-amber-400">
                            <Megaphone className="size-3" /> {ctx}
                        </span>
                    )}
                    {o.deliveryDays != null && <span className="flex items-center gap-1"><Truck className="size-3" /> {faNum(o.deliveryDays)} روزه</span>}
                    {!!o.contactPhone && <OfferCallButton phone={o.contactPhone} />}
                    <span className={`rounded-full px-2 py-0.5 ${STATUS_FA[o.status] ? 'bg-stone-100 dark:bg-gray-800' : ''}`}>{STATUS_FA[o.status]}</span>
                </div>

                {o.message && (
                    <p className="mt-2 rounded-xl bg-stone-50 px-3 py-2 text-xs leading-6 text-stone-600 dark:bg-gray-950/60 dark:text-gray-300">{o.message}</p>
                )}

                {/* ✅ مزیت خرید از این فروشنده — فروشنده در فرم پیشنهاد وارد کرده */}
                {o.advantages && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold leading-6 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
                        <Sparkles className="mt-1 size-3.5 shrink-0" />
                        <span>مزیت خرید از این فروشنده: {o.advantages}</span>
                    </p>
                )}

                {/* ✅ پذیرفته‌شده: نتیجهٔ معامله که تامین‌کننده ثبت می‌کند + پیش‌فاکتور (فاز ۶ سناریو) */}
                {o.status === 'accepted' && (
                    <div className="mt-2 space-y-2">
                        <div className="flex items-center gap-2">
                            <SaleOutcomeBadge offer={o} />
                        </div>
                        {(() => {
                            const proforma = proformaByOffer.get(o.id);
                            if (!proforma) return null;
                            if (proforma.status === 'sent') {
                                return (
                                    <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-500/25 dark:bg-amber-500/5">
                                        <p className="flex items-center gap-1.5 text-[11.5px] font-black text-amber-700 dark:text-amber-400">
                                            <FileText className="size-3.5" />
                                            پیش‌فاکتور {proforma.number} رسید — {faPrice(proforma.totalAmount, (detail as any)?.metadata?.currency)}
                                        </p>
                                        <p className="mt-1 text-[10px] font-bold leading-4 text-stone-500 dark:text-gray-400">
                                            اگر قیمت و اقلامش موافقی، داخل آی مچ تاییدش کن تا معامله هر دو طرف ثبت شود.
                                        </p>
                                        <div className="mt-2 flex gap-1.5">
                                            <button onClick={() => decideProforma(proforma.id, 'confirm')}
                                                disabled={confirmProforma.isPending || rejectProforma.isPending}
                                                className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 text-[11px] font-extrabold text-white disabled:opacity-50">
                                                <Check className="size-3.5" /> تایید پیش‌فاکتور
                                            </button>
                                            <button onClick={() => decideProforma(proforma.id, 'reject')}
                                                disabled={confirmProforma.isPending || rejectProforma.isPending}
                                                className="flex h-8 items-center justify-center gap-1 rounded-lg border border-red-100 px-3 text-[11px] font-extrabold text-red-500 disabled:opacity-50 dark:border-red-500/20">
                                                <X className="size-3.5" /> رد
                                            </button>
                                        </div>
                                    </div>
                                );
                            }
                            const chip = proforma.status === 'confirmed'
                                ? { label: 'پیش‌فاکتور تایید شد — معامله موفق ✅', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' }
                                : proforma.status === 'rejected'
                                    ? { label: 'پیش‌فاکتور را رد کردی', cls: 'bg-stone-100 text-stone-500 dark:bg-gray-800 dark:text-gray-400' }
                                    : { label: `پیش‌فاکتور ${proforma.number} — لغو شد`, cls: 'bg-stone-100 text-stone-500 dark:bg-gray-800 dark:text-gray-400' };
                            return (
                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-black ${chip.cls}`}>
                                    <FileText className="size-3" /> {chip.label}
                                </span>
                            );
                        })()}
                    </div>
                )}

                {opts.actions && o.status === 'pending' && (
                    <div className="mt-3 flex gap-2">
                        <button onClick={() => onDecide(o.id, 'accepted')} disabled={busy}
                            className="h-10 flex-1 rounded-full bg-emerald-500 text-xs font-extrabold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50">
                            پذیرش
                        </button>
                        <button onClick={() => onDecide(o.id, 'rejected')} disabled={busy}
                            className="h-10 flex-1 rounded-full border border-red-100 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-red-500/20 dark:hover:bg-red-500/10">
                            رد
                        </button>
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="space-y-3">
            {loading ? (
                <div className="space-y-3">
                    {[0, 1].map((i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-white/70 dark:bg-gray-900/70" />)}
                </div>
            ) : offers.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-brand-contrast-tint bg-white px-6 py-14 text-center dark:bg-gray-900">
                    <span className="grid size-16 place-items-center rounded-full bg-brand-contrast-soft text-amber-500">
                        <MessageSquareText className="size-8" />
                    </span>
                    <div>
                        <h3 className="text-base font-black">هنوز پیشنهادی نیومده</h3>
                        <p className="mt-1 text-xs font-bold text-stone-400 dark:text-gray-500">
                            لینک بازوی خریدت رو برای تامین‌کننده‌ها بفرست.
                        </p>
                    </div>
                    <button onClick={onGoPublish}
                        className="flex h-10 items-center gap-2 rounded-full bg-brand-contrast px-5 text-xs font-extrabold text-white shadow-md shadow-brand-contrast/25 transition-colors hover:bg-brand-contrast-strong">
                        <Share2 className="size-3.5" />
                        اشتراک‌گذاری
                    </button>
                </div>
            ) : (
                <>
                    {/* ✅ پذیرفته‌شده‌ها — مذاکرهٔ نهایی، خیلی جلو چشم (فاز ۵ سناریو) */}
                    {acceptedOffers.length > 0 && (
                        <div className="rounded-3xl border-2 border-emerald-300 bg-emerald-50/50 p-4 dark:border-emerald-500/40 dark:bg-emerald-500/5">
                            <p className="mb-1 flex items-center gap-2 text-[13px] font-black text-emerald-700 dark:text-emerald-400">
                                <BadgeCheck className="size-4" />
                                پیشنهادهای پذیرفته‌شده — مذاکرهٔ نهایی
                                <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[8.5px] font-black text-white">{faNum(acceptedOffers.length)}</span>
                            </p>
                            <p className="mb-3 text-[11px] font-bold leading-5 text-emerald-700/80 dark:text-emerald-400/80">
                                با تماس نهایی‌اش کن — نتیجه‌ای که تامین‌کننده ثبت می‌کند همین‌جا دیده می‌شود.
                            </p>
                            <AnimatePresence mode="popLayout">
                                {acceptedOffers.map((o, i) => offerCard(o, i, { actions: false }))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* در انتظار تصمیم — پذیرش/رد */}
                    {pendingOffers.length > 0 && (
                        <div className="space-y-2">
                            <p className="flex items-center gap-1.5 px-1 text-[12px] font-black text-stone-500 dark:text-gray-400">
                                <PhoneCall className="size-3.5" /> در انتظار تصمیم تو — می‌توانی به یکی دو نفر دیگر هم امتیاز بدهی
                            </p>
                            <AnimatePresence mode="popLayout">
                                {pendingOffers.map((o, i) => offerCard(o, i, { actions: true }))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* ردشده‌ها — جمع‌وجور، بدون دکمه */}
                    {rejectedOffers.length > 0 && (
                        <div className="space-y-2">
                            <p className="px-1 text-[12px] font-black text-stone-400 dark:text-gray-500">ردشده‌ها و منصرف‌شده‌ها</p>
                            <AnimatePresence mode="popLayout">
                                {rejectedOffers.map((o, i) => offerCard(o, i, { actions: false, compact: true }))}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* ✅ بستن پروندهٔ بازوی خرید — پایان چرخه (فاز ۶ سناریو) */}
                    {!isFinalized && (
                        <div className="rounded-2xl border border-stone-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
                            <p className="flex items-center gap-2 text-[12.5px] font-black text-stone-700 dark:text-gray-200">
                                <FolderClosed className="size-4 text-brand-contrast" />
                                معامله را با تامین‌کننده بستی؟
                            </p>
                            <p className="mt-1 text-[11px] font-bold leading-5 text-stone-400 dark:text-gray-500">
                                پرونده را ببند: پیشنهادهای بدون تصمیم «رد می‌شوند» و بازو از درخواستهای قیمت تامین‌کننده‌ها خارج می‌شود.
                            </p>
                            <button onClick={() => setFinalizeOpen(true)} disabled={finalizing}
                                className="mt-3 h-10 w-full rounded-full border-2 border-brand-contrast text-xs font-extrabold text-amber-700 transition-colors hover:bg-brand-contrast-soft disabled:opacity-50 dark:text-amber-400">
                                بستن پروندهٔ بازوی خرید
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* ✅ مودال بستن پرونده — دو گزینهٔ بزرگ و صریح (قاعدهٔ آی مچ: متنِ واضح برای کاربر بازار) */}
            {finalizeOpen && (
                <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
                    onClick={finalizing ? undefined : () => setFinalizeOpen(false)}>
                    <div onClick={(e) => e.stopPropagation()}
                        className="w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl bg-white p-5 shadow-2xl dark:bg-gray-900">
                        <h3 className="flex items-center gap-2 text-[15px] font-black text-stone-900 dark:text-gray-100">
                            <FolderClosed className="size-4 text-brand-contrast" />
                            نتیجهٔ این خرید چه بود؟
                        </h3>
                        <p className="mt-1.5 text-[11px] font-bold leading-5 text-stone-400 dark:text-gray-500">
                            «{detail.title}» بسته می‌شود — پیشنهادهای بدون تصمیم رد می‌شوند و به همه اطلاع داده می‌شود.
                        </p>
                        <div className="mt-4 space-y-2">
                            <button onClick={() => setPendingOutcome('succeeded')} disabled={finalizing}
                                className={`flex h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 text-right transition-colors disabled:opacity-50 ${
                                    pendingOutcome === 'succeeded'
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10'
                                        : 'border-stone-100 hover:border-emerald-200 dark:border-gray-800'}`}>
                                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${pendingOutcome === 'succeeded' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400'}`}>
                                    <Check className="size-5" />
                                </span>
                                <span>
                                    <span className="block text-sm font-black text-stone-900 dark:text-gray-100">معامله انجام شد</span>
                                    <span className="block text-[10.5px] font-bold text-stone-400">خرید موفق بود — پرونده با نتیجهٔ «موفق» بسته شود</span>
                                </span>
                            </button>
                            <button onClick={() => setPendingOutcome('failed')} disabled={finalizing}
                                className={`flex h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 text-right transition-colors disabled:opacity-50 ${
                                    pendingOutcome === 'failed'
                                        ? 'border-stone-500 bg-stone-100 dark:bg-gray-800'
                                        : 'border-stone-100 hover:border-stone-300 dark:border-gray-800'}`}>
                                <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${pendingOutcome === 'failed' ? 'bg-stone-500 text-white dark:bg-gray-600' : 'bg-stone-100 text-stone-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                                    <X className="size-5" />
                                </span>
                                <span>
                                    <span className="block text-sm font-black text-stone-900 dark:text-gray-100">به نتیجه نرسید</span>
                                    <span className="block text-[10.5px] font-bold text-stone-400">قیمت‌ها مناسب نبود یا خرید لغو شد — پرونده با نتیجهٔ «ناموفق» بسته شود</span>
                                </span>
                            </button>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <button
                                onClick={() => pendingOutcome && onFinalize(pendingOutcome)}
                                disabled={!pendingOutcome || finalizing}
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-contrast text-sm font-extrabold text-white shadow-lg shadow-brand-contrast/25 transition-colors hover:bg-brand-contrast-strong disabled:opacity-40">
                                {finalizing ? <Loader2 className="size-4 animate-spin" /> : null}
                                بستن پرونده
                            </button>
                            <button onClick={() => setFinalizeOpen(false)} disabled={finalizing}
                                className="h-11 rounded-xl border border-stone-200 px-4 text-xs font-bold text-stone-500 transition-colors hover:border-stone-400 disabled:opacity-50 dark:border-gray-700">
                                بی‌خیال
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
