// app/my-catalogs/components/LeadsTab.tsx
// ✅ تب «درخواستهای قیمت» پنل بازوی فروش — قلب شبکهٔ خرید↔فروش از سمت تامین‌کننده:
//    ۱) دعوت‌های در انتظار — بازوهای خریدی که تو را تامین‌کننده دعوت کرده‌اند (پذیرش/رد)
//    ۲) درخواست‌های قیمتِ بازوهای خریدی که تامین‌کنندهٔ تاییدشده‌شان هستی
//       روی هر قلم مستقیم قیمت می‌دهی (شیت مشترک پیشنهاد قیمت)
//    سرنخ فروش بدون جست‌وجو — خریدار خودش درخواست می‌دهد، تو فقط قیمت می‌دهی.
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import {
    Megaphone, Check, X, Loader2, MapPin, Truck, Wallet, Clock,
    ChevronDown, Handshake, ArrowLeft, BadgeCheck, ShoppingBag, FileText,
} from 'lucide-react';
import Link from 'next/link';
import { apiService } from '@/lib/api/apiService';
import {
    useInquiryOpportunities, useDecideInquiryMember, useSetOfferSaleStatus,
    useSentProformas, useCreateProforma,
} from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { faNum, faDigits, faPrice, faTimeAgo } from '@/app/inquiries/utils';
import OfferSheet from '@/app/components/OfferSheet';
import OfferCallButton from '@/app/components/OfferCallButton';
import ProformaSheet, { ProformaTarget } from '@/app/components/ProformaSheet';

const CARD_CLS = 'rounded-2xl border border-outline-variant/30 bg-white dark:border-gray-800 dark:bg-gray-900';

export default function LeadsTab() {
    const qc = useQueryClient();
    const { data, isLoading } = useInquiryOpportunities();
    const decide = useDecideInquiryMember();
    const setSale = useSetOfferSaleStatus();
    const { data: sentProformas } = useSentProformas();

    const [busyId, setBusyId] = useState<string | null>(null);
    const [openLead, setOpenLead] = useState<string | null>(null);
    const [proformaTarget, setProformaTarget] = useState<ProformaTarget | null>(null);
    const [offerTarget, setOfferTarget] = useState<{
        inquiry: { id: string; units?: { unitId: string; title?: string }[] };
        item: any;
        existing?: any;
    } | null>(null);

    const invitations = (data?.invitations ?? []) as any[];
    const requests = (data?.requests ?? []) as any[];
    // ✅ فاز ۳ سناریو — درخواست ردشدهٔ خودت هم باید ببینی تا با یک دکمهٔ حذف تکلیفش را روشن کنی
    const pendingRequests = requests.filter((r) => r.status === 'pending');
    const declinedRequests = requests.filter((r) => r.status === 'declined');
    const leads = (data?.leads ?? []) as any[];
    const accepted = (data?.accepted ?? []) as any[];

    // ✅ پیش‌فاکتورها — آخرین پیش‌فاکتور هر پیشنهاد، برای چیپ وضعیت جلوی چشم
    const proformaByOffer = new Map<string, any>();
    for (const p of ((sentProformas ?? []) as any[])) {
        if (p.offerId && !proformaByOffer.has(p.offerId)) proformaByOffer.set(p.offerId, p);
    }
    const PROFORMA_CHIP: Record<string, { label: string; cls: string }> = {
        sent: { label: 'در انتظار تایید خریدار', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' },
        confirmed: { label: 'تایید شد ✅ معامله موفق', cls: 'bg-emerald-600 text-white' },
        rejected: { label: 'خریدار نپذیرفت', cls: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' },
        canceled: { label: 'لغو شد', cls: 'bg-stone-100 text-stone-500 dark:bg-gray-800 dark:text-gray-400' },
    };

    const refresh = () => {
        qc.invalidateQueries({ queryKey: ['inquiry-opportunities'] });
        qc.invalidateQueries({ queryKey: ['notifications'] });
    };

    const run = async (key: string, fn: () => Promise<any>, msg: string) => {
        setBusyId(key);
        try {
            await fn();
            toast.success(msg);
            refresh();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'عملیات ناموفق بود');
        } finally {
            setBusyId(null);
        }
    };

    /** ✅ ثبت نتیجهٔ معامله — فروش نهایی شد / نشد (خواستهٔ مالک، مبنای گزارش فروش آینده) */
    const markSale = async (offerId: string, saleStatus: 'sold' | 'not_sold') => {
        setBusyId(offerId);
        try {
            await setSale.mutateAsync({ offerId, saleStatus });
            toast.success(saleStatus === 'sold' ? 'ثبت شد — فروش نهایی شد 🎉' : 'ثبت شد — این معامله به فروش نرسید');
            refresh();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ثبت نتیجه ناموفق بود');
        } finally {
            setBusyId(null);
        }
    };

    if (isLoading) {
        return (
            <div className={cn(CARD_CLS, 'grid place-items-center py-12')}>
                <Loader2 className="size-6 animate-spin text-stone-300 dark:text-gray-700" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* ✅ پیشنهادهای پذیرفته‌شده — خیلی جلو چشم، شروع روند معامله (خواستهٔ مالک):
                تماس با خریدار + ثبت نتیجهٔ فروش (فروش نهایی شد / نشد) */}
            {accepted.length > 0 && (
                <div className={cn(CARD_CLS, 'border-emerald-200 p-4 dark:border-emerald-500/30')}>
                    <p className="mb-3 flex items-center gap-2 text-[13px] font-black text-emerald-700 dark:text-emerald-400">
                        <BadgeCheck className="size-4" />
                        پیشنهادهای پذیرفته‌شده — روند معامله
                        <span className="rounded-full bg-emerald-600 px-1.5 py-0.5 text-[8.5px] font-black text-white">
                            {faNum(accepted.length)}
                        </span>
                    </p>
                    <div className="space-y-2">
                        {accepted.map((a) => {
                            const busy = busyId === a.id;
                            return (
                                <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                    className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
                                    <div className="flex items-center gap-2.5">
                                        <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-emerald-100 dark:bg-gray-900 dark:ring-emerald-500/20">
                                            {a.buyer?.logoUrl
                                                ? // eslint-disable-next-line @next/next/no-img-element
                                                  <img src={a.buyer.logoUrl} alt="" className="size-full object-cover" />
                                                : <ShoppingBag className="size-4 text-emerald-500" />}
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[12.5px] font-black text-stone-900 dark:text-gray-100">
                                                {a.buyer?.name || a.buyerName || 'خریدار'}
                                                {a.city ? <span className="font-bold text-stone-400 dark:text-gray-500"> · {a.city}</span> : null}
                                            </p>
                                            <p className="truncate text-[10px] font-bold text-stone-400 dark:text-gray-500">
                                                {a.itemName ? `${a.itemName} — ` : ''}«{a.inquiryTitle}»
                                            </p>
                                        </div>
                                        {!!a.buyerPhone && <OfferCallButton phone={a.buyerPhone} title="تماس با خریدار — معامله را نهایی کن" />}
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10.5px] font-bold text-stone-500 dark:text-gray-400">
                                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-black text-emerald-700 ring-1 ring-emerald-100 dark:bg-gray-900 dark:text-emerald-400 dark:ring-emerald-500/20">
                                            {faPrice(a.price)}{a.unit && a.unit !== 'کل لیست' ? ` / هر ${a.unit}` : a.unit ? ` / ${a.unit}` : ''}
                                        </span>
                                        {a.deliveryDays != null && (
                                            <span className="flex items-center gap-0.5"><Truck className="size-3" /> {faNum(a.deliveryDays)} روزه</span>
                                        )}
                                        <span className="text-stone-300 dark:text-gray-600">|</span>
                                        <span>{faTimeAgo(a.createdAt)}</span>
                                    </div>
                                    {a.advantages && (
                                        <p className="mt-1.5 rounded-lg bg-white/80 px-2 py-1 text-[10px] font-bold leading-4 text-emerald-800 dark:bg-gray-900/70 dark:text-emerald-300">
                                            مزیت خرید از شما: {a.advantages}
                                        </p>
                                    )}

                                    {/* ✅ پیش‌فاکتور — مُهر سبک معامله داخل آی مچ:
                                        اگر پیش‌فاکتور داری وضعیتش را ببین؛ وگرنه با یک دکمه بفرست */}
                                    {(() => {
                                        const proforma = proformaByOffer.get(a.id);
                                        if (proforma) {
                                            const chip = PROFORMA_CHIP[proforma.status] ?? PROFORMA_CHIP.sent;
                                            return (
                                                <div className="mt-2 flex items-center gap-1.5">
                                                    <span className={cn('flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black', chip.cls)}>
                                                        <FileText className="size-3" />
                                                        پیش‌فاکتور {proforma.number} — {chip.label}
                                                    </span>
                                                    {proforma.status === 'confirmed' && (
                                                        <span className="text-[9.5px] font-bold text-stone-400">
                                                            {faPrice(proforma.totalAmount)} تومان
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        }
                                        return (
                                            <button onClick={() => setProformaTarget({
                                                offerId: a.id,
                                                itemName: a.itemName,
                                                unit: a.unit,
                                                unitPrice: a.price,
                                            })}
                                                className="mt-2 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-white text-[11px] font-extrabold text-emerald-700 transition-colors hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-transparent dark:text-emerald-400">
                                                <FileText className="size-3.5" />
                                                ارسال پیش‌فاکتور — معامله را داخل آی مچ ثبت کن
                                            </button>
                                        );
                                    })()}

                                    {/* ثبت نتیجهٔ معامله — وضعیت فعلی با پررنگی مشخص است */}
                                    <div className="mt-2 flex items-center gap-1.5">
                                        <button
                                            disabled={busy}
                                            onClick={() => markSale(a.id, 'sold')}
                                            className={cn('flex h-8 flex-1 items-center justify-center gap-1 rounded-lg text-[11px] font-extrabold transition-colors disabled:opacity-50',
                                                a.saleStatus === 'sold'
                                                    ? 'bg-emerald-600 text-white'
                                                    : 'border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 dark:border-emerald-500/30 dark:bg-transparent dark:text-emerald-400')}>
                                            <Check className="size-3.5" /> فروش نهایی شد
                                        </button>
                                        <button
                                            disabled={busy}
                                            onClick={() => markSale(a.id, 'not_sold')}
                                            className={cn('flex h-8 flex-1 items-center justify-center gap-1 rounded-lg text-[11px] font-extrabold transition-colors disabled:opacity-50',
                                                a.saleStatus === 'not_sold'
                                                    ? 'bg-stone-500 text-white dark:bg-gray-700'
                                                    : 'border border-stone-200 bg-white text-stone-500 hover:bg-stone-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-400')}>
                                            <X className="size-3.5" /> فروش نهایی نشد
                                        </button>
                                    </div>
                                    {a.saleStatus && (
                                        <p className="mt-1 text-[9.5px] font-bold text-stone-400 dark:text-gray-500">
                                            {a.saleStatus === 'sold' ? 'ثبت کردی: فروش نهایی شد' : 'ثبت کردی: فروش نهایی نشد'}
                                            {a.saleStatusAt ? ` — ${faTimeAgo(a.saleStatusAt)}` : ''}
                                            {' (برای تغییر، دکمهٔ دیگر را بزن)'}
                                        </p>
                                    )}
                                    {/* ✅ نتیجهٔ نهایی بازو از نگاه خریدار — پرونده بسته شد (فاز ۶ سناریو) */}
                                    {a.inquiryStatus === 'archived' && (
                                        <p className={cn('mt-2 rounded-lg px-2 py-1 text-[10px] font-black',
                                            a.outcome === 'succeeded'
                                                ? 'bg-emerald-600 text-white'
                                                : 'bg-stone-200 text-stone-600 dark:bg-gray-700 dark:text-gray-300')}>
                                            {a.outcome === 'succeeded' ? 'پرونده بسته شد — معامله انجام شد ✅' : 'پرونده بسته شد — خریدار به نتیجه نرسید'}
                                        </p>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* دعوت‌های در انتظار پذیرش تو */}
            {invitations.length > 0 && (
                <div className={cn(CARD_CLS, 'border-brand-contrast-tint p-4 dark:!border-amber-500/25')}>
                    <p className="mb-3 flex items-center gap-2 text-[13px] font-black text-amber-700 dark:text-amber-400">
                        <Handshake className="size-4" />
                        دعوت به تامین‌کنندگی — {invitations.length.toLocaleString('fa-IR')} مورد
                    </p>
                    <div className="space-y-2">
                        {invitations.map((inv) => (
                            <motion.div key={inv.memberId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 rounded-xl bg-brand-contrast-soft/60 p-3 dark:bg-amber-500/5">
                                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-brand-contrast-tint dark:bg-gray-900">
                                    {inv.buyer?.logoUrl
                                        ? // eslint-disable-next-line @next/next/no-img-element
                                          <img src={inv.buyer.logoUrl} alt="" className="size-full object-cover" />
                                        : <Handshake className="size-4 text-amber-500" />}
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[13px] font-black text-stone-900 dark:text-gray-100">
                                        {inv.buyer?.name || inv.ownerName || 'خریدار'}
                                    </p>
                                    <p className="truncate text-[10px] font-bold text-stone-400 dark:text-gray-500">
                                        «{inv.inquiry.title}»{inv.inquiry.city ? ` · ${inv.inquiry.city}` : ''}
                                        {inv.inquiry.urgentCount > 0 ? ` · ${faNum(inv.inquiry.urgentCount)} قلم فوری` : ''}
                                    </p>
                                </div>
                                {busyId === inv.memberId ? (
                                    <Loader2 className="size-4 shrink-0 animate-spin text-stone-400" />
                                ) : (
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <button
                                            onClick={() => run(inv.memberId, () => apiService.inquiry.decideMember(inv.inquiry.id, inv.memberId, 'active'), 'عضو شدی — درخواست‌های قیمتش الان توی همین تب می‌آید')}
                                            className="flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-bold text-white"
                                        >
                                            <Check className="size-3.5" /> پذیرش
                                        </button>
                                        <button
                                            onClick={() => run(inv.memberId, () => apiService.inquiry.decideMember(inv.inquiry.id, inv.memberId, 'declined'), 'رد شد')}
                                            className="grid size-8 place-items-center rounded-lg bg-stone-200 text-stone-600 dark:bg-gray-800 dark:text-gray-300"
                                            aria-label="رد"
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* درخواست‌های عضویت من در انتظار تایید خریدار */}
            {pendingRequests.length > 0 && (
                <div className={cn(CARD_CLS, 'p-4')}>
                    <p className="mb-2 text-[12px] font-black text-stone-500 dark:text-gray-400">
                        در انتظار تایید خریدار
                    </p>
                    <div className="space-y-1.5">
                        {pendingRequests.map((r) => (
                            <div key={r.memberId} className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-[12px] dark:bg-gray-800/60">
                                <HourglassIcon />
                                <span className="min-w-0 flex-1 truncate font-bold text-stone-600 dark:text-gray-300">«{r.inquiry.title}»</span>
                                <span className="shrink-0 text-[10px] font-bold text-stone-400">درخواستت ثبت شده</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ✅ درخواست رد شده — همون‌جا می‌ماند + دکمهٔ حذف (فاز ۳ سناریو، خواستهٔ مالک) */}
            {declinedRequests.length > 0 && (
                <div className={cn(CARD_CLS, 'p-4')}>
                    <p className="mb-2 text-[12px] font-black text-stone-500 dark:text-gray-400">
                        درخواست رد شده
                    </p>
                    <div className="space-y-1.5">
                        {declinedRequests.map((r) => (
                            <div key={r.memberId} className="flex items-center gap-2 rounded-lg bg-red-50/60 px-3 py-2 text-[12px] dark:bg-red-500/5">
                                <X className="size-3.5 shrink-0 text-red-400" />
                                <span className="min-w-0 flex-1 truncate font-bold text-stone-600 dark:text-gray-300">«{r.inquiry.title}»</span>
                                {busyId === r.memberId ? (
                                    <Loader2 className="size-3.5 shrink-0 animate-spin text-stone-400" />
                                ) : (
                                    <button
                                        onClick={() => run(r.memberId, () => apiService.inquiry.decideMember(r.inquiry.id, r.memberId, 'removed'), 'حذف شد')}
                                        className="shrink-0 rounded-lg border border-stone-200 px-2 py-1 text-[10px] font-bold text-stone-500 transition-colors hover:border-red-300 hover:text-red-500 dark:border-gray-700 dark:text-gray-400"
                                        aria-label="حذف درخواست ردشده">
                                        حذف
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* اقلام فوری — درخواستهای قیمت */}
            <div>
                <div className="mb-2 flex items-center justify-between px-1">
                    <p className="flex items-center gap-1.5 text-[13px] font-black text-stone-900 dark:text-gray-100">
                        <Megaphone className="size-4 text-brand-contrast" />
                        درخواست‌های قیمت جاری
                    </p>
                    <span className="text-[10px] font-bold text-stone-400">
                        {leads.length > 0 ? `${faNum(leads.reduce((a, l) => a + (l.items?.length ?? 0), 0))} قلم از ${faNum(leads.length)} خریدار` : ''}
                    </span>
                </div>

                {leads.length === 0 ? (
                    <div className={cn(CARD_CLS, 'px-6 py-10 text-center')}>
                        <Megaphone className="mx-auto size-9 text-stone-200 dark:text-gray-700" />
                        <p className="mt-2 text-[13px] font-black text-stone-500 dark:text-gray-400">هنوز بازوی خریدی به بازوی فروشت وصل نشده. از برگه خریداران درخواست همکاری بفرست .</p>
                        <p className="mx-auto mt-1 max-w-xs text-[11px] font-bold leading-5 text-stone-400 dark:text-gray-500">
                            وقتی تامین‌کنندهٔ بازوی خرید کسی باشی، اقلام فوریش اینجا می‌آید
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {leads.map((lead) => {
                            const open = openLead === lead.inquiry.id;
                            // ✅ گیت پیشنهاد (فاز ۴ سناریو): بازوی متوقف یا مهلت گذشته = پیشنهاد جدید ممنوع؛
                            //    ویرایشِ پیشنهادهای قبلی همچنان آزاد است
                            const paused = !!lead.inquiry.paused || lead.inquiry.status === 'closed';
                            const dlMs = lead.inquiry.deadline ? new Date(lead.inquiry.deadline).getTime() : 0;
                            const deadlineOver = !!dlMs && dlMs <= Date.now();
                            const offerBlocked = paused || deadlineOver;
                            return (
                                <motion.div key={lead.inquiry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={CARD_CLS}>
                                    {/* سربرگ خریدار */}
                                    <button type="button" onClick={() => setOpenLead(open ? null : lead.inquiry.id)}
                                        className="flex w-full items-center gap-3 p-3.5 text-right">
                                        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-contrast-soft dark:bg-amber-500/15">
                                            {lead.buyer?.logoUrl
                                                ? // eslint-disable-next-line @next/next/no-img-element
                                                  <img src={lead.buyer.logoUrl} alt="" className="size-full object-cover" />
                                                : <Megaphone className="size-4 text-amber-500" />}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center gap-1.5">
                                                <span className="truncate text-[13px] font-black text-stone-900 dark:text-gray-100">{lead.buyer?.name || 'خریدار'}</span>
                                                {lead.inquiry.paused ? (
                                                    <span className="shrink-0 rounded-full bg-stone-200 px-1.5 py-0.5 text-[8.5px] font-black text-stone-600 dark:bg-gray-700 dark:text-gray-300">
                                                        توقف موقت
                                                    </span>
                                                ) : (
                                                    <span className="shrink-0 rounded-full bg-brand-contrast px-1.5 py-0.5 text-[8.5px] font-black text-white">
                                                        {faNum(lead.items.length)} قلم فوری
                                                    </span>
                                                )}
                                            </span>
                                            <span className="mt-0.5 flex items-center gap-2 text-[10px] font-bold text-stone-400 dark:text-gray-500">
                                                <span className="truncate">«{lead.inquiry.title}»</span>
                                                {lead.inquiry.city && <span className="flex shrink-0 items-center gap-0.5"><MapPin className="size-3" />{lead.inquiry.city}</span>}
                                            </span>
                                        </span>
                                        <ChevronDown className={cn('size-4 shrink-0 text-stone-400 transition-transform', open && 'rotate-180')} />
                                    </button>

                                    {/* ✅ مهلت ارسال قیمت — قالب یکدست با پنل خریدار: «مهلت ارسال قیمت: ۱۲:۳۰ ساعت» (خواستهٔ مالک) */}
                                    {(() => {
                                        const dl = lead.inquiry.deadline ? new Date(lead.inquiry.deadline).getTime() : 0;
                                        if (!dl) return null;
                                        const ms = dl - Date.now();
                                        if (ms <= 0) {
                                            return (
                                                <div className="border-t border-outline-variant/20 px-3.5 py-2 dark:border-gray-800">
                                                    <span className="text-[10px] font-extrabold text-stone-400 dark:text-gray-500">مهلت ارسال قیمت این بازو تمام شده</span>
                                                </div>
                                            );
                                        }
                                        const totalMin = Math.max(1, Math.ceil(ms / 60e3));
                                        const h = Math.floor(totalMin / 60);
                                        const m = totalMin % 60;
                                        const label = h > 0
                                            ? `مهلت ارسال قیمت: ${faDigits(h)}:${faDigits(String(m).padStart(2, '0'))} ساعت`
                                            : `مهلت ارسال قیمت: ${faDigits(m)} دقیقه`;
                                        return (
                                            <div className="border-t border-outline-variant/20 px-3.5 py-2 dark:border-gray-800">
                                                <span className="flex items-center gap-1.5 text-[10.5px] font-extrabold text-amber-700 dark:text-amber-400">
                                                    <Clock className="size-3.5" />
                                                    {label}
                                                </span>
                                            </div>
                                        );
                                    })()}

                                    {/* اقلام بازوی خرید */}
                                    {open && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="overflow-hidden">
                                            <div className="space-y-2 border-t border-outline-variant/20 p-3 dark:border-gray-800">
                                                {(lead.inquiry.deliveryNote || lead.inquiry.paymentTerms) && (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {lead.inquiry.deliveryNote && (
                                                            <span className="flex items-center gap-1 rounded-full bg-stone-50 px-2.5 py-1 text-[10px] font-bold text-stone-500 dark:bg-gray-800/70 dark:text-gray-400">
                                                                <Truck className="size-3" /> {lead.inquiry.deliveryNote}
                                                            </span>
                                                        )}
                                                        {lead.inquiry.paymentTerms && (
                                                            <span className="flex items-center gap-1 rounded-full bg-stone-50 px-2.5 py-1 text-[10px] font-bold text-stone-500 dark:bg-gray-800/70 dark:text-gray-400">
                                                                <Wallet className="size-3" /> {lead.inquiry.paymentTerms}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {lead.items.map((it: any) => (
                                                    <div key={it.id} className="flex items-center gap-2.5 rounded-xl bg-stone-50/80 p-2.5 dark:bg-gray-800/50">
                                                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-contrast text-[9px] font-black text-white">
                                                            فوری
                                                        </span>
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-[12px] font-black text-stone-800 dark:text-gray-200">{it.name}</p>
                                                            <p className="truncate text-[10px] font-bold text-stone-400 dark:text-gray-500">
                                                                {it.quantity ? faNum(it.quantity) : ''}{it.unit ? ` ${it.unit}` : ''}
                                                                {it.brand ? ` · ${it.brand}` : ''}
                                                                {it.note ? ` · ${it.note}` : ''}
                                                            </p>
                                                        </div>
                                                        {/* ✅ چرخهٔ وضعیت پیشنهاد (خواستهٔ مالک):
                                                            دکمهٔ «پیشنهاد قیمت» ← لیبل ارسال شده (قابل ویرایش تا تصمیم خریدار) / تایید شده / رد شده */}
                                                        {it.myOffer ? (
                                                            it.myOffer.status === 'accepted' ? (
                                                                <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1.5 text-[10.5px] font-extrabold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/30">
                                                                    <BadgeCheck className="size-3.5" /> تایید شده
                                                                </span>
                                                            ) : it.myOffer.status === 'rejected' ? (
                                                                <span className="shrink-0 rounded-full bg-red-50 px-2.5 py-1.5 text-[10.5px] font-extrabold text-red-600 ring-1 ring-red-100 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/30">
                                                                    رد شده
                                                                </span>
                                                            ) : (
                                                                <span className="flex shrink-0 items-center gap-1">
                                                                    <button
                                                                        onClick={() => setOfferTarget({ inquiry: lead.inquiry, item: it, existing: it.myOffer })}
                                                                        className="flex shrink-0 items-center gap-1 rounded-full bg-brand-contrast-soft px-2.5 py-1.5 text-[10.5px] font-extrabold text-amber-700 ring-1 ring-brand-contrast-tint transition-colors hover:bg-brand-contrast-soft/80 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/30">
                                                                        <Check className="size-3.5" />
                                                                        ارسال شده · ویرایش
                                                                    </button>
                                                                    {/* ✅ انصراف از پیشنهاد (فاز ۴ سناریو) — تا وقتی خریدار تصمیم نگرفته */}
                                                                    <button
                                                                        disabled={busyId === it.myOffer.id}
                                                                        onClick={() => {
                                                                            if (!window.confirm('از این پیشنهاد منصرف می‌شوی؟ پیشنهادت از دید خریدار خارج می‌شود.')) return;
                                                                            run(`wd-${it.myOffer.id}`,
                                                                                () => apiService.inquiry.updateOffer(it.myOffer.id, { status: 'withdrawn' }),
                                                                                'پیشنهادت حذف شد — منصرف شدی');
                                                                        }}
                                                                        className="grid size-7 shrink-0 place-items-center rounded-full border border-stone-200 text-stone-400 transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-50 dark:border-gray-700 dark:text-gray-500"
                                                                        aria-label="انصراف از پیشنهاد"
                                                                        title="انصراف از پیشنهاد">
                                                                        {busyId === `wd-${it.myOffer.id}` ? <Loader2 className="size-3 animate-spin" /> : <X className="size-3.5" />}
                                                                    </button>
                                                                </span>
                                                            )
                                                        ) : offerBlocked ? (
                                                            <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1.5 text-[10px] font-bold text-stone-400 dark:bg-gray-800 dark:text-gray-500">
                                                                {paused ? 'توقف موقت قیمت‌گیری' : 'مهلت تمام شده'}
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => setOfferTarget({ inquiry: lead.inquiry, item: it })}
                                                                className="shrink-0 rounded-full bg-brand-contrast px-3 py-1.5 text-[11px] font-extrabold text-white shadow-sm transition-colors hover:bg-brand-contrast-strong"
                                                            >
                                                                پیشنهاد قیمت
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <Link href={`/i/${lead.inquiry.slug || lead.inquiry.id}`}
                                                    className="flex items-center justify-center gap-1 pt-1 text-[11px] font-extrabold text-amber-700 hover:underline dark:text-amber-400">
                                                    مشاهدهٔ کل بازوی خرید
                                                    <ArrowLeft className="size-3" />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* شیت پیشنهاد قیمت — مشترک با صفحه عمومی؛ حالت ویرایش برای پیشنهاد ارسال‌شده */}
            <OfferSheet
                inquiry={offerTarget ? { id: offerTarget.inquiry.id, units: offerTarget.inquiry.units } : null}
                item={offerTarget?.item ?? null}
                existingOffer={offerTarget?.existing ?? null}
                onClose={() => setOfferTarget(null)}
            />

            {/* ✅ شیت ارسال پیش‌فاکتور — برای پیشنهاد پذیرفته‌شده */}
            {proformaTarget && (
                <ProformaSheet target={proformaTarget} onClose={() => setProformaTarget(null)} />
            )}
        </div>
    );
}

function HourglassIcon() {
    return <Loader2 className="size-3 shrink-0 animate-pulse text-amber-500" />;
}
