// app/my-catalogs/components/LeadsTab.tsx
// ✅ تب «درخواست قیمت» پنل کاتالوگ فروش — قلب شبکهٔ خرید↔فروش از سمت تامین‌کننده:
//    ۱) دعوت‌های در انتظار — صفحه‌های خریدی که تو را تامین‌کننده دعوت کرده‌اند (پذیرش/رد)
//    ۲) درخواست قیمتهای فوریِ صفحه‌های خریدی که تامین‌کنندهٔ تاییدشده‌شان هستی
//       روی هر قلم مستقیم قیمت می‌دهی (شیت مشترک پیشنهاد قیمت)
//    سرنخ فروش بدون جست‌وجو — خریدار خودش اعلام می‌کند، تو فقط قیمت می‌دهی.
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import {
    Megaphone, Check, X, Loader2, MapPin, Truck, Wallet,
    ChevronDown, Handshake, ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { apiService } from '@/lib/api/apiService';
import { useInquiryOpportunities, useDecideInquiryMember } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { faNum } from '@/app/inquiries/utils';
import OfferSheet from '@/app/components/OfferSheet';

const CARD_CLS = 'rounded-2xl border border-outline-variant/30 bg-white dark:border-gray-800 dark:bg-gray-900';

export default function LeadsTab() {
    const qc = useQueryClient();
    const { data, isLoading } = useInquiryOpportunities();
    const decide = useDecideInquiryMember();

    const [busyId, setBusyId] = useState<string | null>(null);
    const [openLead, setOpenLead] = useState<string | null>(null);
    const [offerTarget, setOfferTarget] = useState<{ inquiry: any; item: any } | null>(null);

    const invitations = (data?.invitations ?? []) as any[];
    const requests = (data?.requests ?? []) as any[];
    const leads = (data?.leads ?? []) as any[];

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

    if (isLoading) {
        return (
            <div className={cn(CARD_CLS, 'grid place-items-center py-12')}>
                <Loader2 className="size-6 animate-spin text-stone-300 dark:text-gray-700" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* دعوت‌های در انتظار پذیرش تو */}
            {invitations.length > 0 && (
                <div className={cn(CARD_CLS, 'border-brand-amber-tint p-4 dark:!border-amber-500/25')}>
                    <p className="mb-3 flex items-center gap-2 text-[13px] font-black text-amber-700 dark:text-amber-400">
                        <Handshake className="size-4" />
                        دعوت به تامین‌کنندگی — {invitations.length.toLocaleString('fa-IR')} مورد
                    </p>
                    <div className="space-y-2">
                        {invitations.map((inv) => (
                            <motion.div key={inv.memberId} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 rounded-xl bg-brand-amber-soft/60 p-3 dark:bg-amber-500/5">
                                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-brand-amber-tint dark:bg-gray-900">
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
                                        {inv.inquiry.urgentCount > 0 ? ` · ${faNum(inv.inquiry.urgentCount)} درخواست قیمت فوری` : ''}
                                    </p>
                                </div>
                                {busyId === inv.memberId ? (
                                    <Loader2 className="size-4 shrink-0 animate-spin text-stone-400" />
                                ) : (
                                    <div className="flex shrink-0 items-center gap-1.5">
                                        <button
                                            onClick={() => run(inv.memberId, () => apiService.inquiry.decideMember(inv.inquiry.id, inv.memberId, 'active'), 'عضو شدی — درخواست قیمتهاش الان توی همین تب می‌آید')}
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
            {requests.length > 0 && (
                <div className={cn(CARD_CLS, 'p-4')}>
                    <p className="mb-2 text-[12px] font-black text-stone-500 dark:text-gray-400">
                        در انتظار تایید خریدار
                    </p>
                    <div className="space-y-1.5">
                        {requests.map((r) => (
                            <div key={r.memberId} className="flex items-center gap-2 rounded-lg bg-stone-50 px-3 py-2 text-[12px] dark:bg-gray-800/60">
                                <HourglassIcon />
                                <span className="min-w-0 flex-1 truncate font-bold text-stone-600 dark:text-gray-300">«{r.inquiry.title}»</span>
                                <span className="shrink-0 text-[10px] font-bold text-stone-400">درخواستت ثبت شده</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* درخواست قیمتهای فوری — سرنخ‌های فروش */}
            <div>
                <div className="mb-2 flex items-center justify-between px-1">
                    <p className="flex items-center gap-1.5 text-[13px] font-black text-stone-900 dark:text-gray-100">
                        <Megaphone className="size-4 text-brand-amber" />
                        درخواست قیمتهای جاری
                    </p>
                    <span className="text-[10px] font-bold text-stone-400">
                        {leads.length > 0 ? `${faNum(leads.reduce((a, l) => a + (l.items?.length ?? 0), 0))} قلم از ${faNum(leads.length)} خریدار` : ''}
                    </span>
                </div>

                {leads.length === 0 ? (
                    <div className={cn(CARD_CLS, 'px-6 py-10 text-center')}>
                        <Megaphone className="mx-auto size-9 text-stone-200 dark:text-gray-700" />
                        <p className="mt-2 text-[13px] font-black text-stone-500 dark:text-gray-400">هنوز درخواست قیمتی از طرف خریدارن تو اعلام نشده. از برگه اعضا درخواست همکاریهای بیشتری بفرست</p>
                        <p className="mx-auto mt-1 max-w-xs text-[11px] font-bold leading-5 text-stone-400 dark:text-gray-500">
                            وقتی تامین‌کنندهٔ صفحه درخواست قیمت کسی باشی، درخواست قیمتهای فوریش اینجا می‌آید
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {leads.map((lead) => {
                            const open = openLead === lead.inquiry.id;
                            return (
                                <motion.div key={lead.inquiry.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={CARD_CLS}>
                                    {/* سربرگ خریدار */}
                                    <button type="button" onClick={() => setOpenLead(open ? null : lead.inquiry.id)}
                                        className="flex w-full items-center gap-3 p-3.5 text-right">
                                        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-brand-amber-soft dark:bg-amber-500/15">
                                            {lead.buyer?.logoUrl
                                                ? // eslint-disable-next-line @next/next/no-img-element
                                                  <img src={lead.buyer.logoUrl} alt="" className="size-full object-cover" />
                                                : <Megaphone className="size-4 text-amber-500" />}
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="flex items-center gap-1.5">
                                                <span className="truncate text-[13px] font-black text-stone-900 dark:text-gray-100">{lead.buyer?.name || 'خریدار'}</span>
                                                <span className="shrink-0 rounded-full bg-brand-amber px-1.5 py-0.5 text-[8.5px] font-black text-white">
                                                    {faNum(lead.items.length)} اعلام فوری
                                                </span>
                                            </span>
                                            <span className="mt-0.5 flex items-center gap-2 text-[10px] font-bold text-stone-400 dark:text-gray-500">
                                                <span className="truncate">«{lead.inquiry.title}»</span>
                                                {lead.inquiry.city && <span className="flex shrink-0 items-center gap-0.5"><MapPin className="size-3" />{lead.inquiry.city}</span>}
                                            </span>
                                        </span>
                                        <ChevronDown className={cn('size-4 shrink-0 text-stone-400 transition-transform', open && 'rotate-180')} />
                                    </button>

                                    {/* اقلام درخواست قیمت */}
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
                                                        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-amber text-[9px] font-black text-white">
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
                                                        <button
                                                            onClick={() => setOfferTarget({ inquiry: lead.inquiry, item: it })}
                                                            className="shrink-0 rounded-full bg-brand-amber px-3 py-1.5 text-[11px] font-extrabold text-white shadow-sm transition-colors hover:bg-brand-amber-strong"
                                                        >
                                                            قیمت بده
                                                        </button>
                                                    </div>
                                                ))}
                                                <Link href={`/${lead.inquiry.slug || lead.inquiry.id}`}
                                                    className="flex items-center justify-center gap-1 pt-1 text-[11px] font-extrabold text-amber-700 hover:underline dark:text-amber-400">
                                                    مشاهدهٔ کل صفحه درخواست قیمت
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

            {/* شیت پیشنهاد قیمت — مشترک با صفحه عمومی */}
            <OfferSheet
                inquiry={offerTarget ? { id: offerTarget.inquiry.id } : null}
                item={offerTarget?.item ?? null}
                onClose={() => setOfferTarget(null)}
            />
        </div>
    );
}

function HourglassIcon() {
    return <Loader2 className="size-3 shrink-0 animate-pulse text-amber-500" />;
}
