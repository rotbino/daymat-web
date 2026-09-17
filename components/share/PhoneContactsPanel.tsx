// components/share/PhoneContactsPanel.tsx
// 📱 اشتراک‌گذاری مستقیم با مخاطبین تلفن (PWA) — بخش قابل استفاده در همهٔ فرم‌های اشتراک
//   • اندروید/کروم (و PWA نصب‌شده): Contact Picker API — با اجازهٔ کاربر، مخاطبینِ انتخابی
//     با همان نامی که در دفترچهٔ گوشی است در دیمت ذخیره می‌شوند (کشف ارتباطات)
//   • دفترچهٔ ذخیره‌شده جستجوپذیر است و با یک تپ، پیامکِ آماده (متن + لینک) برایش باز می‌شود
//   • شماره‌های ثبت‌نام‌شدهٔ دیمت با بج «عضو دیمت» مشخص می‌شوند
//   • جایی که Contact Picker نیست (آیفون/دسکتاپ): افزودن دستی شماره + راهنمای شیت سیستم
// ── حالت زمینه‌ای (موتور رشد) ──
//   با memberSend و/یا invite لیست دوگروه می‌شود:
//     • اعضای دیمت → دکمهٔ «ارسال» زمینه‌ای (مثلاً درخواست تامین به بازوی فروشش، یا درخواست خریدار به کسب‌وکارش)
//     • غیراعضا   → دکمهٔ «دعوت به دیمت» — نوار کانال‌ها: واتساپ/تلگرام/پیامک/سایر با متن و لینکِ زمینه‌ای
//   کپشن‌ها و اکشن‌ها را جایِ استفاده تعیین می‌کند — در بازو لینک بازو می‌رود، در اعضای بازوی فروش لینک بازوی فروش.
'use client';
import React, { useState, useEffect } from 'react';
import {
    Users, UserPlus, Search, Loader2, MessageCircle, Sparkles, Info, Smartphone,
    Send, MessageSquare, Share2, Check, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils/utils';
import { resolveFileSrc } from '@/app/business/manage/components/BusinessLogo';
import { useMyContacts, useSyncContacts } from '@/lib/api/apiHooks';

/** ✅ یک کسب‌وکارِ عضو دیمت — با بازوهای خریدش (Inquiry) و نقشِ مخاطب در آن */
export interface ContactBusinessItem {
    id: string;
    name: string;
    logoUrl: string | null;
    city: string | null;
    /** مخاطب، مالک/سازندهٔ این کسب‌وکار است */
    isOwner: boolean;
    /** پستِ نمایشی مخاطب در کسب‌وکار (مثل «مدیر فروش») */
    position: string | null;
    /** بازوهای خریدِ این کسب‌وکار — غیرآرشیوشده */
    arms: { id: string; title: string; status: string }[];
}

export interface PhoneContactItem {
    id: string;
    name: string | null;
    phone: string;
    matchedUserId: string | null;
    matchedUser?: {
        id: string;
        fullName: string | null;
        avatarUrl: string | null;
        /** ✅ همهٔ کسب‌وکارهای فعالِ عضو — مخاطب می‌تواند عضو چند کسب‌وکار باشد؛ هر کدام خریدار جداگانه‌اند */
        businesses?: ContactBusinessItem[];
        /** اولین کسب‌وکار (سازگاری با کدهای قبلی) */
        business?: (Pick<ContactBusinessItem, 'id' | 'name' | 'logoUrl' | 'city'> & Partial<ContactBusinessItem>) | null;
        /** بازوی فروش فعالِ عضو — مقصد «درخواست تامین» در بازوی خرید */
        catalog?: { id: string; name: string; slug: string | null; logoUrl: string | null; city: string | null; salesType: string | null } | null;
    } | null;
}

/** اکشن زمینه‌ای روی اعضای دیمت — دکمهٔ کنار هر عضو */
export interface ContactMemberAction {
    /** برچسب دکمه — پیش‌فرض «ارسال» */
    label?: string;
    /** برچسب پس از ارسال موفق — پیش‌فرض «ارسال شد» */
    doneLabel?: string;
    /** اگر رشته برگرداند دکمه غیرفعال است و همین دلیل زیر نام می‌نشیند */
    reason?: (c: PhoneContactItem) => string | null;
    /** خطا را پرتاب کن — پنل خودش توستِ خطا می‌دهد؛ توستِ موفقیت با فرستنده */
    onSend: (c: PhoneContactItem) => Promise<void> | void;
}

/** دعوت غیراعضا (و عضوهای بدون مقصد) — نوار کانال‌های اشتراک با متن زمینه‌ای */
export interface ContactInviteAction {
    /** برچسب دکمه — پیش‌فرض «دعوت به دیمت» */
    label?: string;
    /** متن پیام — در همهٔ کانال‌ها می‌نشیند */
    getText: () => string;
    /** لینک زمینه‌ای — در تلگرام/اشتراک سیستم جدا می‌رود، در بقیه ته متن اضافه می‌شود */
    getUrl?: () => string | undefined;
}

interface PhoneContactsPanelProps {
    /** لینک اشتراک‌گذاری — در متن پیامک می‌نشیند (در حالت onPick لازم نیست) */
    url?: string;
    /** متن پیام کنار لینک — مثلاً «بازوی فروش ما را ببین:» */
    message?: string;
    /** اگر بدهی، تپ روی مخاطب به‌جای پیامک به این‌جا می‌رود (مثلاً افزودن به تیم) */
    onPick?: (contact: PhoneContactItem) => void;
    /** عنوان بخش — پیش‌فرض: «ارسال به مخاطبین تلفن» */
    title?: string;
    className?: string;
    // ── حالت زمینه‌ای (دوگروه) ──
    memberSend?: ContactMemberAction;
    invite?: ContactInviteAction;
    /** سربرگ گروه اعضای دیمت — کپشنِ زمینه‌ای هر جای استفاده */
    membersTitle?: string;
    /** سربرگ گروه دعوت — کپشنِ زمینه‌ای هر جای استفاده */
    inviteTitle?: string;
}

/** آیا مرورگر Contact Picker دارد؟ (فعلاً کروم اندروید + PWA اندروید) */
export function contactPickerSupported(): boolean {
    if (typeof navigator === 'undefined') return false;
    const c = (navigator as any).contacts;
    return !!c && typeof c.select === 'function';
}

/** لینک پیامک — اندروید ?body= ، آیفون &body= */
export function smsHref(phone: string, body: string): string {
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    return `sms:${phone}${isIOS ? '&' : '?'}body=${encodeURIComponent(body)}`;
}

/** 09xxxxxxxxx → 989xxxxxxxxx — برای wa.me */
export function toIntl98(phone: string): string {
    const d = phone.replace(/\D/g, '');
    if (d.startsWith('98')) return d;
    if (d.startsWith('0')) return `98${d.slice(1)}`;
    return d;
}

export default function PhoneContactsPanel({
    url, message, onPick, title = 'ارسال به مخاطبین تلفن', className,
    memberSend, invite, membersTitle, inviteTitle,
}: PhoneContactsPanelProps) {
    const [q, setQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [showManual, setShowManual] = useState(false);
    const [manualName, setManualName] = useState('');
    const [manualPhone, setManualPhone] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());
    const [openChannels, setOpenChannels] = useState<string | null>(null); // id ردیفی که نوار کانال‌هایش باز است

    const pickerOK = contactPickerSupported();
    const syncMut = useSyncContacts();
    const grouped = !!memberSend || !!invite; // حالت دوگروه؟

    // دیبانس جستجو
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q.trim()), 350);
        return () => clearTimeout(t);
    }, [q]);

    const contactsQuery = useMyContacts(debouncedQ, true);
    const items: PhoneContactItem[] = contactsQuery.data?.items || [];
    const total = contactsQuery.data?.total ?? 0;
    const matchedCount = contactsQuery.data?.matchedCount ?? 0;

    /** خلاصهٔ نتیجهٔ همگام‌سازی را روایت می‌کند */
    const narrateSync = (res: { saved: number; invalid: number; matched: number }) => {
        if (res.saved > 0) {
            toast.success(`${res.saved} مخاطب ذخیره شد`, {
                description: res.matched > 0
                    ? `${res.matched} نفرشان عضو دیمت‌اند — با بج سبز می‌بینی‌شان`
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

    /** افزودن دستی — برای مرورگرهایی که مخاطبین را نمی‌دهند */
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

    /** تپ روی مخاطب — پیامک یا pick بیرونی (رفتار قدیمی) */
    const handleTap = (c: PhoneContactItem) => {
        if (onPick) { onPick(c); return; }
        if (!url) return;
        const body = `${message ? message + '\n' : ''}${url}`;
        window.location.href = smsHref(c.phone, body);
    };

    // ─── اکشن زمینه‌ای: ارسال درخواست به عضو دیمت ───
    const runMemberSend = async (c: PhoneContactItem) => {
        if (!memberSend || busyId) return;
        setBusyId(c.id);
        try {
            await memberSend.onSend(c);
            setSentIds((s) => new Set(s).add(c.id));
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'ارسال ناموفق بود');
        } finally {
            setBusyId(null);
        }
    };

    // ─── متنِ مشترک دعوت — لینک ته متن می‌نشیند ───
    const inviteBody = () => {
        if (!invite) return '';
        const text = invite.getText();
        const u = invite.getUrl?.() ?? url;
        return u ? `${text}\n${u}` : text;
    };

    /** باز کردن کانال اشتراک برای یک مخاطب مشخص */
    const openChannel = (c: PhoneContactItem, channel: 'whatsapp' | 'telegram' | 'sms' | 'more') => {
        const body = inviteBody();
        if (!body && !url) return;
        if (channel === 'whatsapp') {
            window.open(`https://wa.me/${toIntl98(c.phone)}?text=${encodeURIComponent(body)}`, '_blank');
        } else if (channel === 'telegram') {
            const u = invite?.getUrl?.() ?? url;
            window.open(`https://t.me/share/url?url=${encodeURIComponent(u || '')}&text=${encodeURIComponent(invite?.getText() || '')}`, '_blank');
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

    // ─── ردیف عضو دیمت (حالت زمینه‌ای) ───
    const memberRow = (c: PhoneContactItem) => {
        const mu = c.matchedUser || null;
        const reason = memberSend?.reason?.(c) ?? null;
        const done = sentIds.has(c.id);
        const busy = busyId === c.id;
        const catName = mu?.catalog?.name || '';
        const bizName = mu?.business?.name || '';
        const parts: string[] = [];
        if (catName) parts.push(`بازوی فروش: ${catName}`);
        else if (bizName) parts.push(bizName);
        if (catName && bizName && bizName !== catName) parts.push(bizName);
        const city = mu?.catalog?.city || mu?.business?.city || '';
        if (city) parts.push(city);
        const subLine = parts.join(' · ');
        return (
            <div key={c.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:border-emerald-500/15 dark:bg-emerald-500/5 p-2">
                <div className="flex items-center gap-2.5">
                    {mu?.avatarUrl ? (
                        <img src={resolveFileSrc(mu.avatarUrl)!} alt=""
                             className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-emerald-500/40" />
                    ) : (
                        <div className="w-9 h-9 rounded-full grid place-items-center flex-shrink-0 text-xs font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            {(mu?.fullName || c.name || '؟').trim().charAt(0)}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <p className="text-[11px] font-bold text-on-surface truncate">
                                {mu?.fullName || c.name || 'عضو دیمت'}
                            </p>
                            <span className="flex-shrink-0 px-1.5 py-px rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold">
                                عضو دیمت
                            </span>
                        </div>
                        <p className="text-[10px] text-on-surface-variant/70 truncate">{subLine || <span dir="ltr">{c.phone}</span>}</p>
                        {reason && <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 mt-0.5">{reason}</p>}
                    </div>
                    {busy ? (
                        <Loader2 className="w-4 h-4 animate-spin text-stone-400 flex-shrink-0" />
                    ) : done ? (
                        <span className="flex-shrink-0 flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3.5 h-3.5" /> {memberSend?.doneLabel || 'ارسال شد'}
                        </span>
                    ) : memberSend && !reason ? (
                        <button type="button" onClick={() => runMemberSend(c)}
                                className="flex-shrink-0 h-8 px-3.5 rounded-full bg-primary text-on-primary text-[11px] font-extrabold flex items-center gap-1 hover:bg-primary/90 active:scale-95 transition-all">
                            <Send className="w-3 h-3" /> {memberSend.label || 'ارسال'}
                        </button>
                    ) : null}
                    {/* عضوی که مقصد ندارد — همین‌جا هم می‌شود دعوتش کرد */}
                    {invite && (reason || !memberSend) && (
                        <button type="button" onClick={() => setOpenChannels(openChannels === c.id ? null : c.id)}
                                title={invite.label || 'دعوت به دیمت'}
                                className="flex-shrink-0 h-8 px-2.5 rounded-full border border-outline-variant/50 dark:border-gray-700 text-[10px] font-extrabold text-primary flex items-center gap-1 hover:bg-primary/5 transition">
                            <UserPlus className="w-3 h-3" /> دعوت
                        </button>
                    )}
                </div>
                {invite && openChannels === c.id && (
                    <ChannelStrip onPick={(ch) => openChannel(c, ch)} />
                )}
            </div>
        );
    };

    // ─── ردیف غیرعضو — ساده و متفاوت ───
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

    // تفکیک دو گروه — اعضا اول، دعوت‌شدنی‌ها بعد
    const members = grouped ? items.filter((c) => c.matchedUserId) : [];
    const invitees = grouped ? items.filter((c) => !c.matchedUserId) : [];

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
                            ? `${total} مخاطب ذخیره‌شده${matchedCount > 0 ? ` — ${matchedCount} نفر عضو دیمت` : ''}`
                            : 'مخاطبینت را یک‌بار اضافه کن، همیشه همین‌جا داشته باش'}
                    </p>
                </div>
            </div>

            {/* دکمهٔ مخاطبین گوشی — فقط اگر مرورگر بدهد (کروم اندروید/PWA) */}
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
            <div className="max-h-64 overflow-y-auto scrollbar-slim space-y-1.5">
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
                ) : grouped ? (
                    <>
                        {members.length > 0 && (
                            <p className="flex items-center gap-1.5 pt-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400">
                                <Check className="w-3 h-3" />
                                {membersTitle || 'اعضای دیمت'}
                                <span className="opacity-60">({members.length.toLocaleString('fa-IR')})</span>
                            </p>
                        )}
                        {members.map(memberRow)}
                        {invitees.length > 0 && (
                            <p className="flex items-center gap-1.5 pt-2 text-[10px] font-extrabold text-on-surface-variant/70">
                                <UserPlus className="w-3 h-3" />
                                {inviteTitle || 'دعوت به دیمت'}
                                <span className="opacity-60">({invitees.length.toLocaleString('fa-IR')})</span>
                            </p>
                        )}
                        {invitees.map(inviteeRow)}
                    </>
                ) : (
                    items.map((c) => (
                        <button key={c.id} type="button" onClick={() => handleTap(c)}
                                className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-container-high dark:hover:bg-gray-700/60 active:scale-[0.99] transition-all text-right">
                            {c.matchedUser?.avatarUrl ? (
                                <img src={resolveFileSrc(c.matchedUser.avatarUrl)!} alt=""
                                     className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-emerald-500/40" />
                            ) : (
                                <div className={cn(
                                    'w-9 h-9 rounded-full grid place-items-center flex-shrink-0 text-xs font-extrabold',
                                    c.matchedUserId ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-primary/10 text-primary',
                                )}>
                                    {(c.name || '؟').trim().charAt(0)}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                    <p className="text-[11px] font-bold text-on-surface truncate">
                                        {c.name || c.matchedUser?.fullName || 'بدون نام'}
                                    </p>
                                    {c.matchedUserId && (
                                        <span className="flex-shrink-0 px-1.5 py-px rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold">
                                            عضو دیمت
                                        </span>
                                    )}
                                </div>
                                <p dir="ltr" className="text-[10px] text-on-surface-variant/70 text-left font-medium">{c.phone}</p>
                            </div>
                            {onPick ? (
                                <UserPlus className="w-4 h-4 text-primary flex-shrink-0" />
                            ) : (
                                <MessageCircle className="w-4 h-4 text-primary flex-shrink-0" />
                            )}
                        </button>
                    ))
                )}
            </div>

            {/* حریم خصوصی */}
            <p className="text-[9px] leading-4 text-on-surface-variant/50 flex items-center gap-1">
                <Sparkles className="w-3 h-3 flex-shrink-0" />
                مخاطبین فقط برای خودت ذخیره می‌شوند — اگر عضو دیمت باشند، پیدایشان می‌کنی.
            </p>
        </div>
    );
}

/** نوار کانال‌های دعوت — واتساپ / تلگرام / پیامک / سایر */
export function ChannelStrip({ onPick }: { onPick: (ch: 'whatsapp' | 'telegram' | 'sms' | 'more') => void }) {
    const items: { key: 'whatsapp' | 'telegram' | 'sms' | 'more'; label: string; icon: React.ElementType }[] = [
        { key: 'whatsapp', label: 'واتساپ', icon: MessageCircle },
        { key: 'telegram', label: 'تلگرام', icon: Send },
        { key: 'sms', label: 'پیامک', icon: MessageSquare },
        { key: 'more', label: 'سایر', icon: Share2 },
    ];
    return (
        <div className="grid grid-cols-4 gap-1.5 mt-2 pt-2 border-t border-outline-variant/30 dark:border-gray-700">
            {items.map(({ key, label, icon: Icon }) => (
                <button key={key} type="button" onClick={() => onPick(key)}
                        className="flex flex-col items-center gap-1 py-2 rounded-lg bg-white dark:bg-gray-900 border border-outline-variant/30 dark:border-gray-700 text-[9px] font-extrabold text-on-surface-variant hover:border-primary/50 hover:text-primary active:scale-95 transition-all">
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                </button>
            ))}
        </div>
    );
}

