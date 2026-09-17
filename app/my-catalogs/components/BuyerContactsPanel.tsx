// app/my-catalogs/components/BuyerContactsPanel.tsx
// 🤝 لیست مخاطبینِ تخصصیِ «درخواست ارتباط با خریدار» — لیست مخاطبینِ ساده همه‌جا به درد نمی‌خورد (خواستهٔ مالک)
//    خریدار = کسب‌وکار (یا بازوی خریدش)، نه مدیرش؛ پس این پنل به‌ازای هر مخاطب نشان می‌دهد:
//      • آیا مخاطب اصلاً عضو دیمت است؟
//      • اگر هست: لیست کسب‌وکارهایش — هر کسب‌وکار با بازوهای خریدش
//      • دکمهٔ افزودن به‌ازای «هر کسب‌وکار» (نه هر مخاطب) — چون هر کسب‌وکار یک خریدار جداگانه است
//      • مخاطبِ عضوِ بدون کسب‌وکار قابل افزودن نیست — با پیام روشن، نه دکمهٔ کور
//      • غیرعضوها فقط دعوت می‌شوند (ثبت‌نام + ثبت کسب‌وکار → بعداً خریدار می‌شوند)
'use client';

import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Search, Loader2, Info, Smartphone, Store,
    ClipboardList, Send, Check, ChevronDown, ShoppingBasket, CircleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { resolveFileSrc } from '@/app/business/manage/components/BusinessLogo';
import { useMyContacts, useSyncContacts } from '@/lib/api/apiHooks';
import {
    contactPickerSupported, ChannelStrip, smsHref, toIntl98,
    type PhoneContactItem, type ContactInviteAction,
} from '@/components/share/PhoneContactsPanel';

interface BuyerContactsPanelProps {
    title?: string;
    /** سربرگ گروه اعضای دیمت */
    membersTitle?: string;
    /** سربرگ گروه دعوت غیرعضوها */
    inviteTitle?: string;
    /** دعوت غیرعضوها — متن/لینک زمینه‌ای */
    invite?: ContactInviteAction;
    /** ✅ افزودن یک کسب‌وکار مشخص به‌عنوان خریدار — خطا را پرتاب کن (پنل خودش توست می‌دهد) */
    onAddBusiness: (businessId: string, contact: PhoneContactItem) => Promise<void>;
    /** برچسب پس از ارسال موفق — پیش‌فرض «درخواست رفت» */
    doneLabel?: string;
    className?: string;
}

export default function BuyerContactsPanel({
    title = 'دفترچهٔ مخاطبین تلفن تو',
    membersTitle = 'اعضای دیمت — کسب‌وکارشان را خریدار ثبت کن',
    inviteTitle = 'دعوت به دیمت — لینک بازوی فروش را می‌گیرند',
    invite,
    onAddBusiness,
    doneLabel = 'درخواست رفت',
    className,
}: BuyerContactsPanelProps) {
    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [showManual, setShowManual] = useState(false);
    const [manualName, setManualName] = useState('');
    const [manualPhone, setManualPhone] = useState('');
    const [busyKey, setBusyKey] = useState<string | null>(null);
    const [sentKeys, setSentKeys] = useState<Set<string>>(new Set());
    const [openChannels, setOpenChannels] = useState<string | null>(null);

    const pickerOK = contactPickerSupported();
    const syncMut = useSyncContacts();

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
        return () => clearTimeout(t);
    }, [q]);

    const contactsQuery = useMyContacts(debouncedQ, true);
    const items: PhoneContactItem[] = contactsQuery.data?.items || [];
    const total = contactsQuery.data?.total ?? 0;
    const matchedCount = contactsQuery.data?.matchedCount ?? 0;

    const narrateSync = (res: { saved: number; invalid: number; matched: number }) => {
        if (res.saved > 0) {
            toast.success(`${res.saved.toLocaleString('fa-IR')} مخاطب ذخیره شد`, {
                description: res.matched > 0
                    ? `${res.matched.toLocaleString('fa-IR')} نفرشان عضو دیمت‌اند — کسب‌وکارشان همین‌جا می‌بینی`
                    : 'از این به بعد هر کدام ثبت‌نام کنند، همین‌جا می‌بینی‌شان',
            });
        } else if (res.invalid > 0) {
            toast.info('شمارهٔ معتبری پیدا نشد', { description: 'شمارهٔ موبایل باید مثل 09123456789 باشد' });
        }
    };

    /** Contact Picker — باید مستقیم در کلیک صدا زده شود (بدون await قبلش) */
    const pickContacts = async () => {
        try {
            const picked = await (navigator as any).contacts.select(['name', 'tel'], { multiple: true });
            if (!picked?.length) return; // کاربر لغو کرد — سکوت
            const list = picked
                .map((c: any) => ({ name: c?.name?.[0]?.trim() || null, phone: c?.tel?.[0] || '' }))
                .filter((c: any) => c.phone && c.phone.trim().length >= 7);
            if (!list.length) {
                toast.info('در مخاطبین انتخابی شماره‌ای نبود');
                return;
            }
            const res = await syncMut.mutateAsync(list);
            narrateSync(res);
        } catch (e: any) {
            if (e?.name !== 'AbortError') {
                toast.error('خواندن مخاطبین ممکن نشد', { description: 'اجازهٔ دسترسی به مخاطبین را در مرورگر بده' });
            }
        }
    };

    const addManual = async () => {
        if (!manualPhone.trim()) return;
        const res = await syncMut.mutateAsync([{ name: manualName.trim() || null, phone: manualPhone.trim() }]);
        if (res.invalid > 0 && res.saved === 0) {
            toast.error('این شماره معتبر نیست', { description: 'مثل 09123456789 بنویس — با +98 یا اعداد فارسی هم اوکی است' });
            return;
        }
        narrateSync(res);
        setManualName('');
        setManualPhone('');
        setShowManual(false);
    };

    /** ✅ افزودن یک کسب‌وکار مشخص به خریداران — per-business، چون خریدار خودِ کسب‌وکار است */
    const addBiz = async (c: PhoneContactItem, bizId: string) => {
        const key = `${c.id}:${bizId}`;
        if (busyKey) return;
        setBusyKey(key);
        try {
            await onAddBusiness(bizId, c);
            setSentKeys((s) => new Set(s).add(key));
        } catch (e: any) {
            toast.error(e?.data?.message || e?.response?.data?.message || e?.message || 'ارسال ناموفق بود');
        } finally {
            setBusyKey(null);
        }
    };

    const inviteBody = () => {
        if (!invite) return '';
        const text = invite.getText();
        const u = invite.getUrl?.();
        return u ? `${text}\n${u}` : text;
    };

    const openChannel = (c: PhoneContactItem, channel: 'whatsapp' | 'telegram' | 'sms' | 'more') => {
        const body = inviteBody();
        if (!body) return;
        if (channel === 'whatsapp') {
            window.open(`https://wa.me/${toIntl98(c.phone)}?text=${encodeURIComponent(body)}`, '_blank');
        } else if (channel === 'telegram') {
            const u = invite?.getUrl?.() || '';
            window.open(`https://t.me/share/url?url=${encodeURIComponent(u)}&text=${encodeURIComponent(invite?.getText() || '')}`, '_blank');
        } else if (channel === 'sms') {
            window.location.href = smsHref(c.phone, body);
        } else {
            if (typeof navigator !== 'undefined' && (navigator as any).share) {
                (navigator as any).share({ text: body }).catch(() => { /* لغو کاربر — سکوت */ });
            } else {
                navigator.clipboard?.writeText(body);
                toast.success('متن کپی شد — در پیام‌رسان بچسبان');
            }
        }
    };

    // ─── ردیف عضو دیمت — با لیست کسب‌وکارها و بازوهای خریدش ───
    const memberRow = (c: PhoneContactItem) => {
        const mu = c.matchedUser || null;
        const businesses = mu?.businesses || (mu?.business ? [mu.business as any] : []);
        const displayName = mu?.fullName || c.name || 'عضو دیمت';
        return (
            <div key={c.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:border-emerald-500/15 dark:bg-emerald-500/5 p-2">
                <div className="flex items-center gap-2.5">
                    {mu?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={resolveFileSrc(mu.avatarUrl)!} alt=""
                             className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-emerald-500/40" />
                    ) : (
                        <div className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0 text-xs font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            {displayName.trim().charAt(0)}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="text-[11px] font-bold text-on-surface truncate">{displayName}</p>
                            <span className="flex-shrink-0 px-1.5 py-px rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold">
                                عضو دیمت
                            </span>
                        </div>
                        <p dir="ltr" className="text-[10px] text-on-surface-variant/70 text-right">{c.phone}</p>
                    </div>
                </div>

                {/* ✅ لیست کسب‌وکارهای مخاطب — هر کسب‌وکار با بازوهای خریدش، دکمهٔ جداگانه */}
                {businesses.length > 0 ? (
                    <div className="mt-1.5 space-y-1.5">
                        {businesses.map((biz) => {
                            const key = `${c.id}:${biz.id}`;
                            const done = sentKeys.has(key);
                            const busy = busyKey === key;
                            const rolePart = biz.isOwner ? 'مالک' : (biz.position || 'عضو');
                            return (
                                <div key={biz.id} className="rounded-lg bg-white/70 dark:bg-gray-900/60 border border-outline-variant/25 dark:border-gray-700/60 p-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-7 h-7 rounded-lg bg-primary/10 grid place-items-center flex-shrink-0">
                                            <Store className="w-3.5 h-3.5 text-primary" />
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold text-on-surface truncate">
                                                {biz.name}
                                                <span className="font-normal text-on-surface-variant/70"> · {rolePart}</span>
                                                {biz.city ? <span className="text-on-surface-variant/60"> · {biz.city}</span> : null}
                                            </p>
                                            {/* ✅ بازوهای خریدِ این کسب‌وکار — نشان می‌دهد این کسب‌وکار واقعاً خرید می‌کند */}
                                            <p className="text-[10px] text-on-surface-variant/70 truncate flex items-center gap-1">
                                                <ClipboardList className="w-3 h-3 flex-shrink-0" />
                                                {biz.arms?.length
                                                    ? `بازوی خرید: ${biz.arms.map((a: { title: string }) => a.title).join('، ')}`
                                                    : 'بدون بازوی خرید'}
                                            </p>
                                        </div>
                                        {busy ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-stone-400 flex-shrink-0" />
                                        ) : done ? (
                                            <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                                <Check className="w-3.5 h-3.5" /> {doneLabel}
                                            </span>
                                        ) : (
                                            <button type="button" onClick={() => addBiz(c, biz.id)}
                                                    className="flex-shrink-0 h-8 px-3 rounded-full bg-primary text-on-primary text-[10px] font-extrabold flex items-center gap-1 hover:bg-primary/90 active:scale-95 transition-all">
                                                <ShoppingBasket className="w-3 h-3" /> افزودن به خریداران
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* ✅ عضوِ بدون کسب‌وکار — قابل افزودن نیست؛ پیام روشن به‌جای دکمهٔ کور */
                    <div className="mt-1.5 flex items-start gap-1.5 p-2 rounded-lg bg-amber-50/80 dark:bg-amber-900/15 border border-amber-200/60 dark:border-amber-800/50">
                        <CircleAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] leading-4 text-amber-800 dark:text-amber-300">
                            در دیمت کسب‌وکاری ثبت نکرده — برای خریدارشدن باید اول کسب‌وکارش را در دیمت بسازد
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // ─── ردیف غیرعضو — دعوت با لینک بازوی فروش ───
    const inviteeRow = (c: PhoneContactItem) => {
        const open = openChannels === c.id;
        return (
            <div key={c.id} className="rounded-xl p-2">
                <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0 text-xs font-extrabold bg-stone-100 text-stone-400 dark:bg-gray-800 dark:text-gray-500">
                        {(c.name || '؟').trim().charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-bold text-on-surface truncate">{c.name || 'بدون نام'}</p>
                        <p dir="ltr" className="text-[10px] text-on-surface-variant/70 text-right">{c.phone}</p>
                    </div>
                    <button type="button" onClick={() => setOpenChannels(open ? null : c.id)}
                            className="flex-shrink-0 h-8 px-3.5 rounded-full border-2 border-primary/70 text-primary text-[11px] font-extrabold flex items-center gap-1 hover:bg-primary/5 active:scale-95 transition-all">
                        <UserPlus className="w-3 h-3" /> {invite?.label || 'دعوت به دیمت'}
                        <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
                    </button>
                </div>
                {open && <ChannelStrip onPick={(ch) => openChannel(c, ch)} />}
            </div>
        );
    };

    const members = items.filter((c) => c.matchedUserId);
    const invitees = items.filter((c) => !c.matchedUserId);

    return (
        <div className={cn(
            'rounded-xl border border-outline-variant/40 dark:border-gray-700 bg-surface-container-low/50 dark:bg-gray-800/50 p-3 space-y-2.5',
            className,
        )}>
            {/* هدر */}
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/10 grid place-items-center flex-shrink-0">
                    <Users className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold text-on-surface">{title}</p>
                    <p className="text-[10px] text-on-surface-variant/70 leading-4">
                        {total > 0
                            ? `${total.toLocaleString('fa-IR')} مخاطب ذخیره‌شده${matchedCount > 0 ? ` — ${matchedCount.toLocaleString('fa-IR')} نفر عضو دیمت` : ''}`
                            : 'مخاطبینت را یک‌بار اضافه کن، همیشه همین‌جا داشته باش'}
                    </p>
                </div>
            </div>

            {/* دکمهٔ مخاطبین گوشی — فقط اگر مرورگر بدهد */}
            {pickerOK ? (
                <button type="button" onClick={pickContacts} disabled={syncMut.isPending}
                        className="w-full h-10 rounded-xl bg-primary text-on-primary text-[11px] font-extrabold
                            flex items-center justify-center gap-1.5 hover:bg-primary/90 active:scale-[0.98]
                            disabled:opacity-60 transition-all">
                    {syncMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                    افزودن از مخاطبین گوشی
                </button>
            ) : (
                <div className="flex items-start gap-2 rounded-lg bg-blue-500/5 border border-blue-500/20 dark:border-gray-700 p-2">
                    <Info className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] leading-5 text-on-surface-variant">
                            این مرورگر اجازهٔ دسترسی مستقیم به مخاطبین نمی‌دهد. شماره را دستی اضافه کن، یا در گوشی از دکمهٔ
                            <b> «سایر» </b> شیت اشتراک‌گذاری سیستم را باز کن.
                        </p>
                        <button type="button" onClick={() => setShowManual((v) => !v)}
                                className="mt-1 text-[10px] font-extrabold text-primary hover:underline">
                            {showManual ? 'بستن' : '+ افزودن شمارهٔ دستی'}
                        </button>
                    </div>
                </div>
            )}

            {/* فرم افزودن دستی */}
            {showManual && (
                <div className="flex gap-1.5">
                    <input value={manualName} onChange={(e) => setManualName(e.target.value)}
                           placeholder="نام (اختیاری)"
                           className="flex-1 min-w-0 h-9 rounded-lg border border-outline-variant/40 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 text-[11px] text-on-surface outline-none focus:border-primary/50" />
                    <input value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} dir="ltr"
                           inputMode="tel" placeholder="09... "
                           className="w-32 h-9 rounded-lg border border-outline-variant/40 dark:border-gray-700 bg-white dark:bg-gray-900 px-2.5 text-[11px] text-on-surface outline-none focus:border-primary/50 text-left" />
                    <button type="button" onClick={addManual} disabled={syncMut.isPending || !manualPhone.trim()}
                            className="h-9 px-3 rounded-lg bg-primary text-on-primary text-[10px] font-extrabold disabled:opacity-50 flex-shrink-0">
                        ذخیره
                    </button>
                </div>
            )}

            {/* جستجو */}
            <div className="relative">
                <input value={q} onChange={(e) => setQ(e.target.value)}
                       placeholder="جستجو در مخاطبین… اسم یا شماره"
                       className="w-full h-9 rounded-xl border border-outline-variant/40 dark:border-gray-700
                           bg-white dark:bg-gray-900 pr-3 pl-9 text-[11px] text-on-surface outline-none focus:border-primary/50" />
                <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
            </div>

            {/* لیست مخاطبین */}
            <div className="max-h-72 overflow-y-auto scrollbar-slim space-y-1.5">
                {contactsQuery.isFetching && items.length === 0 ? (
                    <div className="py-6 grid place-items-center text-on-surface-variant/60">
                        <Loader2 className="w-5 h-5 animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="py-5 text-center">
                        <UserPlus className="w-6 h-6 mx-auto text-on-surface-variant/40 mb-1.5" />
                        <p className="text-[11px] font-bold text-on-surface-variant">
                            {debouncedQ ? 'مخاطبی با این اسم یا شماره نداری' : 'هنوز مخاطبی نیفزوده‌ای'}
                        </p>
                        {!debouncedQ && (
                            <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
                                {pickerOK ? 'از دکمهٔ بالا مخاطبینت را انتخاب کن' : 'شماره را دستی اضافه کن'}
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        {members.length > 0 && (
                            <p className="flex items-center gap-1.5 pt-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">
                                <Check className="w-3 h-3" />
                                {membersTitle}
                                <span className="opacity-60">({members.length.toLocaleString('fa-IR')})</span>
                            </p>
                        )}
                        {members.map(memberRow)}
                        {invitees.length > 0 && (
                            <p className="flex items-center gap-1.5 pt-2 text-[10px] font-extrabold text-on-surface-variant/70">
                                <UserPlus className="w-3 h-3" />
                                {inviteTitle}
                                <span className="opacity-60">({invitees.length.toLocaleString('fa-IR')})</span>
                            </p>
                        )}
                        {invitees.map(inviteeRow)}
                    </>
                )}
            </div>

            {/* حریم خصوصی */}
            <p className="text-[9px] leading-4 text-on-surface-variant/50 flex items-center gap-1">
                <Send className="w-3 h-3 flex-shrink-0" />
                مخاطبین فقط برای خودت ذخیره می‌شوند — اگر عضو دیمت باشند، کسب‌وکار و بازوهای خریدش همین‌جا می‌بینی.
            </p>
        </div>
    );
}
