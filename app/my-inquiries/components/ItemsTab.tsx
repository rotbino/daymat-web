// app/my-inquiries/components/ItemsTab.tsx
// تب اقلام پنل بازوی خرید — دو بخش:
//   ۱) اقلام در حال قیمت‌گیری (بالای بازوی فروش عمومی، قیمت‌پذیر) + مهلت گروهی ارسال قیمت
//   ۲) لیست خرید من (سایر کالاها — قیمت‌گیری بسته به تنظیمات)
// ✅ نام‌گذاری درست: «توقف قیمت‌گیری / شروع قیمت‌گیری» (جای «پایان اعلام» و ریپلیسِ بی‌معنیِ «بازوی خرید»)
// ✅ جزئیات سفارش (ویژگی‌ها/یادداشت/لینک) — دراپ‌داون زیر هر ردیف (خواستهٔ مالک)
// ✅ مهلت گروهی: ورودی عددی به ساعت (حداکثر ۲۴۰) — انقضا خودکار از سمت بک (خواستهٔ مالک)
// ردیف‌ها با layout انیمیت می‌شوند؛ جابه‌جایی بین بخش‌ها نرم است.
'use client';

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Megaphone, Pencil, Trash2, Plus, MessageSquareText,
    PackageSearch, Loader2, ChevronDown, Clock, Handshake, Square,
    Sparkles, Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { faNum, faDigits, faPrice } from '../../inquiries/utils';
import { cn } from '@/lib/utils';
import { useAddInquiryMember, useSupplierSuggestions } from '@/lib/api/apiHooks';
import type { InquiryDetail, InquiryItem, InquiryOffer } from '@/lib/api/apiTypes';

interface Props {
    detail: InquiryDetail;
    offers: InquiryOffer[];
    loading: boolean;
    onAdd: () => void;
    onEdit: (item: InquiryItem) => void;
    onToggleUrgent: (item: InquiryItem) => void;
    onDelete: (item: InquiryItem) => void;
    onGoOffers: () => void;
    busyItemId: string | null;
    /** ✅ مهلت گروهی ارسال قیمت (ISO) — نمایش باقی‌مانده + ویرایش به ساعت */
    deadline?: string | null;
    onSetDeadline: (hours: number) => void;
    deadlineBusy?: boolean;
    /** ✅ تعداد تامین‌کننده‌های فعال — برای راهنمای شروع (خواستهٔ مالک) */
    supplierCount?: number;
    onGoMembers: () => void;
}

const MAX_DEADLINE_HOURS = 240;

/** «۱۲:۳۰ ساعت» / «۴۵ دقیقه» — برای چیپ «مهلت ارسال قیمت: …» (خواستهٔ مالک) */
function remainingLabel(iso?: string | null): { text: string; hours: number | null; expired: boolean } | null {
    if (!iso) return null;
    const ms = new Date(iso).getTime() - Date.now();
    if (!isFinite(ms)) return null;
    if (ms <= 0) return { text: '', hours: null, expired: true };
    const totalMin = Math.max(1, Math.ceil(ms / 60e3));
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return {
        text: h > 0 ? `${faDigits(h)}:${faDigits(String(m).padStart(2, '0'))} ساعت` : `${faDigits(m)} دقیقه`,
        hours: Math.max(1, Math.ceil(ms / 3600e3)),
        expired: false,
    };
}

/** ✅ پیشنهاد تامین‌کنندهٔ دیمت برای این قلم — وعدهٔ «شبکه‌ت را گسترش می‌دهیم» بی‌جست‌وجو:
 *    بازوهای فروشی که همین کالا را با قیمت فعال دارند (همان‌شهری‌ها اول). دعوت = درخواست تامین. */
function SuggestedSuppliers({ suggestions, invitedIds, busy, onInvite }: {
    suggestions: any[];
    invitedIds: Set<string>;
    busy: boolean;
    onInvite: (s: any) => void;
}) {
    if (!suggestions?.length) return null;
    const top = suggestions.slice(0, 3);
    return (
        <div className="mt-2.5 rounded-xl border border-brand-primary-tint bg-brand-primary-soft/30 p-2.5 dark:border-emerald-500/20 dark:bg-emerald-500/5">
            <p className="flex items-center gap-1.5 text-[10.5px] font-black text-emerald-700 dark:text-emerald-400">
                <Sparkles className="size-3.5 shrink-0" />
                تامین‌کننده‌های این کالا در دیمت
            </p>
            <div className="mt-1.5 space-y-1">
                {top.map((s) => {
                    const already = invitedIds.has(s.catalogId);
                    return (
                        <div key={s.catalogId} className="flex items-center gap-2 rounded-lg bg-white/80 px-2 py-1.5 dark:bg-gray-900/60">
                            <span className="min-w-0 flex-1 truncate text-[11px] font-extrabold text-stone-700 dark:text-gray-200">
                                {s.name}
                                {s.city ? <span className="font-bold text-stone-400"> · {s.city}</span> : null}
                            </span>
                            {!isNaN(Number(s.minPrice)) && Number(s.minPrice) > 0 && (
                                <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                    از {faPrice(s.minPrice)}{s.unitTitle && s.unitTitle !== 'عدد' ? ` / ${s.unitTitle}` : ''}
                                </span>
                            )}
                            {already ? (
                                <span className="flex shrink-0 items-center gap-0.5 text-[9.5px] font-extrabold text-emerald-600">
                                    <Check className="size-3" /> دعوت شدی
                                </span>
                            ) : (
                                <button onClick={() => onInvite(s)} disabled={busy}
                                    className="shrink-0 rounded-lg bg-brand-contrast px-2 py-1 text-[9.5px] font-extrabold text-white transition-colors hover:bg-brand-contrast-strong disabled:opacity-50">
                                    درخواست تامین
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function ItemRow({ item, offerCount, variant, busy, onEdit, onToggleUrgent, onDelete, onGoOffers, suggestions, invitedIds, inviteBusy, onInvite, inquiryId }: {
    item: InquiryItem;
    offerCount: number;
    variant: 'urgent' | 'regular';
    busy: boolean;
    onEdit: () => void;
    onToggleUrgent: () => void;
    onDelete: () => void;
    onGoOffers: () => void;
    /** ✅ پیشنهاد تامین‌کننده‌های دیمت برای این قلم فعال — دعوت با یک لمس */
    suggestions?: any[];
    invitedIds?: Set<string>;
    inviteBusy?: boolean;
    onInvite?: (s: any) => void;
    inquiryId: string;
}) {
    const urgent = variant === 'urgent';
    const [detailsOpen, setDetailsOpen] = useState(false);
    const hasDetails = !!(item.note || item.referenceUrl || (item.specs?.length ?? 0) > 0);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className={`rounded-2xl border-2 bg-white p-3.5 dark:bg-gray-900 ${
                urgent
                    ? 'border-brand-contrast/40 bg-brand-contrast-soft/30 dark:bg-amber-500/5'
                    : 'border-stone-100 dark:border-gray-800'
            } ${busy ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
                <span className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ${
                    urgent ? 'bg-brand-contrast text-white' : 'bg-stone-100 text-stone-400 dark:bg-gray-800'
                }`}>
                    {urgent ? <Megaphone className="size-4" /> : <PackageSearch className="size-4" />}
                </span>
                <div className="min-w-0 flex-1">
                    <h3 className="truncate text-[14px] font-extrabold text-stone-900 dark:text-gray-100">{item.name}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                        {item.brand && (
                            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-500 dark:bg-gray-800 dark:text-gray-400">
                                {item.brand}
                            </span>
                        )}
                        {(item.quantity || item.unit) && (
                            <span className="rounded-full bg-brand-contrast-soft px-2 py-0.5 text-amber-700 dark:text-amber-400">
                                {item.quantity ? faNum(item.quantity) : ''} {item.unit}
                            </span>
                        )}
                        {hasDetails && (
                            <button onClick={() => setDetailsOpen((o) => !o)}
                                className="flex items-center gap-0.5 rounded-full bg-stone-100 px-2 py-0.5 text-stone-500 transition-colors hover:bg-stone-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
                                جزئیات سفارش
                                <ChevronDown className={cn('size-3 transition-transform', detailsOpen && 'rotate-180')} />
                            </button>
                        )}
                        {item.note && !hasDetails && <span className="text-stone-300 dark:text-gray-600">یادداشت دارد</span>}
                    </div>
                </div>
                {offerCount > 0 && (
                    <button onClick={onGoOffers} title="دیدن پیشنهادها"
                        className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-extrabold text-emerald-600 transition-colors hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <MessageSquareText className="size-3" />
                        {faNum(offerCount)} پیشنهاد
                    </button>
                )}
            </div>

            {/* ✅ جزئیات سفارش — دراپ‌داون زیر ردیف (ویژگی‌ها، یادداشت، لینک نمونه) */}
            <AnimatePresence initial={false}>
                {detailsOpen && hasDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        className="overflow-hidden">
                        <div className="mt-2.5 space-y-1.5 rounded-xl border border-stone-100 bg-stone-50/70 p-2.5 dark:border-gray-800 dark:bg-gray-950/50">
                            {!!item.specs?.length && item.specs.map((s, i) => (
                                <p key={i} className="text-[11px] font-bold text-stone-600 dark:text-gray-300">
                                    <span className="text-stone-400 dark:text-gray-500">{s.key}:</span> {s.value}
                                </p>
                            ))}
                            {item.note && (
                                <p className="text-[11px] font-bold leading-5 text-stone-600 dark:text-gray-300">
                                    <span className="text-stone-400 dark:text-gray-500">یادداشت: </span>{item.note}
                                </p>
                            )}
                            {item.referenceUrl && (
                                <a href={item.referenceUrl} target="_blank" rel="noreferrer"
                                    dir="ltr"
                                    className="block truncate text-[10.5px] font-bold text-amber-600 underline-offset-2 hover:underline dark:text-amber-400">
                                    {item.referenceUrl}
                                </a>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-3 flex items-center gap-1.5 border-t border-dashed border-stone-100 pt-2.5 dark:border-gray-800">
                {urgent ? (
                    <button onClick={onToggleUrgent} disabled={busy}
                        className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-bold text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 disabled:opacity-50 dark:hover:bg-gray-800">
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Square className="size-3.5" />}
                        توقف قیمت‌گیری
                    </button>
                ) : (
                    <button onClick={onToggleUrgent} disabled={busy}
                        className="flex h-8 items-center gap-1.5 rounded-lg bg-brand-contrast-soft px-2.5 text-[11px] font-extrabold text-amber-700 transition-colors hover:bg-brand-contrast-tint disabled:opacity-50 dark:bg-amber-500/10 dark:text-amber-400">
                        {busy ? <Loader2 className="size-3.5 animate-spin" /> : <Megaphone className="size-3.5" />}
                        شروع قیمت‌گیری
                    </button>
                )}
                <button onClick={onEdit} aria-label="ویرایش قلم" title="ویرایش"
                    className="grid size-8 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-gray-800">
                    <Pencil className="size-3.5" />
                </button>
                <span className="flex-1" />
                <button onClick={onDelete} aria-label="حذف قلم" title="حذف"
                    className="grid size-8 place-items-center rounded-lg text-stone-300 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10">
                    <Trash2 className="size-3.5" />
                </button>
            </div>

            {/* ✅ پیشنهاد تامین‌کننده — فقط برای قلم فعال؛ هرجا کالای مرجع پیدا شد */}
            {urgent && suggestions && suggestions.length > 0 && (
                <SuggestedSuppliers suggestions={suggestions} invitedIds={invitedIds ?? new Set()} busy={!!inviteBusy} onInvite={(s) => onInvite?.(s)} />
            )}
        </motion.div>
    );
}

export default function ItemsTab({ detail, offers, loading, onAdd, onEdit, onToggleUrgent, onDelete, onGoOffers, busyItemId, deadline, onSetDeadline, deadlineBusy, supplierCount = 0, onGoMembers }: Props) {
    const items = detail.items ?? [];
    const urgentItems = items.filter((i) => i.urgent);
    const otherItems = items.filter((i) => !i.urgent);
    const countByItem = offers.reduce<Record<string, number>>((acc, o) => {
        if (o.itemId) acc[o.itemId] = (acc[o.itemId] || 0) + 1;
        return acc;
    }, {});

    // ✅ مچینگ خودکار — برای هر قلم فعال، تامین‌کننده‌های مرتبطِ دیمت (همان‌شهری اول)
    const { data: suggestionsData } = useSupplierSuggestions(detail.id);
    const suggestionsByItem = useMemo(() => {
        const map = new Map<string, any[]>();
        for (const s of (suggestionsData?.items ?? []) as any[]) {
            if (s.suppliers?.length) map.set(s.itemId, s.suppliers);
        }
        return map;
    }, [suggestionsData]);
    const [invitedCatalogIds, setInvitedCatalogIds] = useState<Set<string>>(new Set());
    const addMember = useAddInquiryMember();
    const handleInvite = async (catalogId: string, name: string) => {
        try {
            await addMember.mutateAsync({ inquiryId: detail.id, catalogId });
            setInvitedCatalogIds((prev) => new Set(prev).add(catalogId));
            toast.success(`درخواست تامین برای «${name}» ثبت شد — بعد از پذیرششان، اقلامت را می‌بینند`);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ارسال درخواست ناموفق بود');
        }
    };
    // ✅ مهلت گروهی — چیپ جمع‌وجور روبروی عنوان «اقلام در حال قیمت‌گیری» (خواستهٔ مالک) + ویرایش عددی به ساعت
    const remaining = remainingLabel(deadline);
    const deadlineActive = !!deadline && new Date(deadline).getTime() > Date.now();
    const [deadlineOpen, setDeadlineOpen] = useState(false);
    const [deadlineHours, setDeadlineHours] = useState('');
    const openDeadlineEditor = () => {
        setDeadlineHours(remaining?.hours ? String(remaining.hours) : '');
        setDeadlineOpen(true);
    };
    const submitDeadline = () => {
        const h = parseInt((deadlineHours || '').replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^\d]/g, ''), 10);
        if (!h || h < 1 || h > MAX_DEADLINE_HOURS) return;
        onSetDeadline(h);
        setDeadlineOpen(false);
    };

    return (
        <div className="space-y-4">
            {/* دکمه افزودن */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onAdd}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-contrast/60 bg-brand-contrast-soft/40 text-sm font-extrabold text-amber-700 transition-colors hover:bg-brand-contrast-soft dark:bg-amber-500/10 dark:text-amber-400">
                <Plus className="size-4" />
                افزودن قلم خرید
            </motion.button>

            {loading ? (
                <div className="space-y-3">
                    {[0, 1].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-white/70 dark:bg-gray-900/70" />)}
                </div>
            ) : items.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-brand-contrast-tint bg-white px-6 py-14 text-center dark:bg-gray-900">
                    <span className="grid size-16 place-items-center rounded-full bg-brand-contrast-soft text-amber-500">
                        <PackageSearch className="size-8" />
                    </span>
                    <div>
                        <h3 className="text-lg font-black">اولین قلمت رو اضافه کن</h3>
                        <p className="mt-1.5 text-xs font-bold leading-6 text-stone-400 dark:text-gray-500">
                            قلم به قلم لیست خریدت ساخته می‌شه —
                            <br />
                            هر قلم رو می‌تونی همین حالا در حال قیمت‌گیری کنی.
                        </p>
                    </div>
                    {/* ✅ راهنمای تامین‌کننده‌یابی — وقتی هنوز تامین‌کننده‌ای ندارد (خواستهٔ مالک) */}
                    {supplierCount < 5 && (
                        <div className="w-full max-w-md rounded-2xl border border-brand-contrast/30 bg-brand-contrast-soft/40 p-3.5 text-right dark:bg-amber-500/5">
                            <p className="flex items-center gap-1.5 text-[11.5px] font-black text-amber-700 dark:text-amber-400">
                                <Handshake className="size-4 shrink-0" />
                                برای دیدن اقلامت توسط تامین‌کننده‌ها
                            </p>
                            <p className="mt-1.5 text-[10.5px] font-bold leading-5 text-stone-500 dark:text-gray-400">
                                از تب «تامین‌کنندگان» به تامین‌کننده‌های مناسب کالایت در شهر خودت درخواست تامین بده؛
                                یا لینک بازوی خریدت را برای تامین‌کننده‌ها و بازاریاب‌هایی که می‌شناسی بفرست —
                                عضو دیمت باشند یا نه.
                            </p>
                            <button onClick={onGoMembers}
                                className="mt-2.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-brand-contrast text-[12px] font-extrabold text-white transition-colors hover:bg-brand-contrast-strong">
                                <Handshake className="size-3.5" />
                                رفتن به تامین‌کنندگان
                            </button>
                        </div>
                    )}
                </motion.div>
            ) : (
                <>
                    {/* ✅ اقلام در حال قیمت‌گیری — مهلت گروهی روبروی عنوان (خواستهٔ مالک):
                        چیپ «مهلت ارسال قیمت: ۱۲ ساعت» جمع‌وجور؛ لمسش ویرایش باز می‌کند */}
                    {urgentItems.length > 0 && (
                        <section>
                            <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 px-1">
                                <h2 className="flex items-center gap-1.5 text-[12px] font-black text-amber-700 dark:text-amber-400">
                                    <Megaphone className="size-4" />
                                    اقلام در حال قیمت‌گیری
                                    <span className="rounded-full bg-brand-contrast px-1.5 py-0.5 text-[8.5px] font-black text-white">
                                        {faNum(urgentItems.length)}
                                    </span>
                                </h2>
                                {!deadlineOpen && (
                                    <button onClick={openDeadlineEditor}
                                        title={deadlineActive ? 'تغییر مهلت' : 'ثبت مهلت'}
                                        className={cn(
                                            'ms-auto inline-flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-[10px] font-extrabold transition-colors',
                                            remaining?.expired
                                                ? 'bg-red-50 text-red-500 dark:bg-red-500/10'
                                                : deadlineActive
                                                    ? 'bg-brand-contrast-soft text-amber-700 hover:bg-brand-contrast-tint dark:bg-amber-500/10 dark:text-amber-400'
                                                    : 'bg-stone-100 text-stone-400 hover:bg-stone-200/70 dark:bg-gray-800 dark:text-gray-500',
                                        )}>
                                        <Clock className="size-3 shrink-0" />
                                        {remaining?.expired
                                            ? 'مهلت تمام شده — ثبت مهلت جدید'
                                            : deadlineActive
                                                ? `مهلت ارسال قیمت: ${remaining!.text}`
                                                : 'مهلت ثبت نشده'}
                                        <Pencil className="size-2.5 opacity-60" />
                                    </button>
                                )}
                            </div>
                            {deadlineOpen && (
                                <div className="mb-2.5 flex flex-wrap items-center gap-2 rounded-xl border border-brand-contrast/30 bg-brand-contrast-soft/30 px-3 py-2 dark:bg-amber-500/5">
                                    <Clock className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                                    <span className="text-[10.5px] font-extrabold text-stone-600 dark:text-gray-300">مهلت ارسال قیمت:</span>
                                    <input
                                        value={deadlineHours}
                                        onChange={(e) => setDeadlineHours(e.target.value.replace(/[^\d۰-۹]/g, ''))}
                                        onKeyDown={(e) => e.key === 'Enter' && submitDeadline()}
                                        inputMode="numeric"
                                        autoFocus
                                        placeholder={`مثلا ${faNum(24)}`}
                                        className="h-9 w-20 rounded-lg border border-stone-200 bg-white px-2 text-center text-xs font-black outline-none focus:border-brand-contrast dark:border-gray-700 dark:bg-gray-950"
                                    />
                                    <span className="text-[9.5px] font-bold text-stone-400">ساعت (حداکثر {faNum(MAX_DEADLINE_HOURS)})</span>
                                    <button onClick={submitDeadline} disabled={deadlineBusy}
                                        className="h-8 rounded-lg bg-brand-contrast px-3 text-[10.5px] font-extrabold text-white disabled:opacity-50">
                                        {deadlineBusy ? '...' : 'ثبت'}
                                    </button>
                                    <button onClick={() => setDeadlineOpen(false)}
                                        className="h-8 rounded-lg border border-stone-200 px-3 text-[10.5px] font-bold text-stone-500 dark:border-gray-700">
                                        بی‌خیال
                                    </button>
                                </div>
                            )}
                            <div className="space-y-2.5">
                                <AnimatePresence mode="popLayout">
                                    {urgentItems.map((it) => (
                                        <ItemRow key={it.id} item={it} variant="urgent" busy={busyItemId === it.id}
                                            offerCount={countByItem[it.id] || 0}
                                            suggestions={suggestionsByItem.get(it.id)}
                                            invitedIds={invitedCatalogIds}
                                            inviteBusy={addMember.isPending}
                                            onInvite={(s: any) => handleInvite(s.catalogId, s.name)}
                                            inquiryId={detail.id}
                                            onEdit={() => onEdit(it)}
                                            onToggleUrgent={() => onToggleUrgent(it)}
                                            onDelete={() => onDelete(it)}
                                            onGoOffers={onGoOffers}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>
                    )}

                    {/* لیست خرید من */}
                    {otherItems.length > 0 && (
                        <section>
                            <h2 className="mb-2 flex items-center gap-2 px-1 text-[13px] font-black text-stone-500 dark:text-gray-400">
                                <PackageSearch className="size-4" />
                                لیست خرید من
                                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[9px] font-bold text-stone-400 dark:bg-gray-800">
                                    {faNum(otherItems.length)}
                                </span>
                                {!detail.allowNonUrgentOffers && (
                                    <span className="ms-auto text-[10px] font-bold text-stone-300 dark:text-gray-600">قیمت‌گیری بسته</span>
                                )}
                            </h2>
                            <div className="space-y-2.5">
                                <AnimatePresence mode="popLayout">
                                    {otherItems.map((it) => (
                                        <ItemRow key={it.id} item={it} variant="regular" busy={busyItemId === it.id}
                                            offerCount={countByItem[it.id] || 0}
                                            inquiryId={detail.id}
                                            onEdit={() => onEdit(it)}
                                            onToggleUrgent={() => onToggleUrgent(it)}
                                            onDelete={() => onDelete(it)}
                                            onGoOffers={onGoOffers}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        </section>
                    )}
                </>
            )}
        </div>
    );
}
