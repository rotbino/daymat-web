// app/my-catalogs/components/MemberBits.tsx
// ✂️ مشترکات ردیف اعضا — بعد از تفکیک تب «اعضا» به «تیم فروش» + «خریداران»
//    Avatar | بج نقش بیزینسی | بج نقش سیستمی | بلوک اطلاعات (نام/کسب‌وکار/شهر/بازوی خرید)
//    ✅ چرخهٔ «ما اضافه کردیم» (Task 26): منتظر پذیرش (کهربایی) → پذیرش/رد → ردشده (قرمز + حذف)
'use client';

import React, { useState } from 'react';
import { MapPin, ClipboardList, Hourglass, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const badgeBase =
    'text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap text-center';

export const EVENT_LABEL: Record<string, string> = {
    coop_requested: 'درخواست ارتباط تجاری داد',
    seller_requested: 'درخواست همکاری در فروش داد',
    seller_approved: 'به‌عنوان همکار فروش تایید شد',
    seller_rejected: 'درخواستش رد شد',
    seller_removed: 'از اعضا حذف شد',
    seller_left: 'خودش از اعضا خارج شد',
    seller_role_changed: 'نقش بیزینسی‌اش عوض شد',
    buyer_approved: 'به‌عنوان خریدار تایید شد',
    buyer_rejected: 'بازوی خریدش رد شد',
    supplier_approved: 'به‌عنوان تامین‌کننده تایید شد',
    supplier_rejected: 'پیشنهاد تامینش رد شد',
    supplier_removed: 'تامین‌کننده‌اش حذف شد',
    service_removed: 'سرویس‌دهنده‌اش حذف شد',
    service_approved: 'به‌عنوان سرویس‌دهندهٔ خدمات تایید شد',
    service_rejected: 'درخواست تامین خدماتش رد شد',
    supplier_invite_sent: 'برای تامین‌کنندگی دعوت شد',
    supplier_invite_declined: 'دعوت تامین‌کنندگی را رد کرد',
    service_invite_sent: 'برای تامین خدمات دعوت شد',
    service_invite_declined: 'دعوت تامین خدمات را رد کرد',
    seller_invite_sent: 'به همکاری در فروش دعوت شد',
    seller_invite_declined: 'دعوت همکاری در فروش را رد کرد',
    admin_promoted: 'مدیر کاتالوگ شد',
    admin_demoted: 'نقش مدیرش گرفته شد',
    customer_added: 'به‌عنوان خریدار ثبت شد',
    customer_confirmed: 'خریداربودنش را تایید کرد',
    customer_declined: 'ثبت خریداربودنش را رد کرد',
    customer_removed: 'به‌عنوان خریدار حذف شد',
    customer_left: 'خریداربودنش را لغو کرد',
    customer_reassigned: 'مسئولش عوض شد',
    customer_unassigned: 'بی‌مسئول شد',
    region_set: 'منطقه‌اش تغییر کرد',
    joined: 'به اعضای کاتالوگ اضافه شد',
    migrated: 'به مدل اعضای کاتالوگ منتقل شد',
};

// ✅ برچسب گویا برای هر نوع درخواست — UX writing به‌جای واژه‌های خام
export const REQUEST_LABEL: Record<string, string> = {
    seller: 'درخواست همکاری در فروش',
    buyer: 'درخواست ثبت به‌عنوان خریدار',
    supplier: 'پیشنهاد تامین',
    service: 'درخواست تامین خدمات',
};

export function Avatar({ url, name, size = 40 }: { url?: string | null; name?: string | null; size?: number }) {
    const [broken, setBroken] = useState(false);
    if (url && !broken) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" style={{ width: size, height: size }} onError={() => setBroken(true)}
                 className="rounded-full object-cover flex-shrink-0 border border-outline-variant/30" />
        );
    }
    const initial = (name || '؟').trim().charAt(0);
    return (
        <div style={{ width: size, height: size }}
             className="rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-gray-500 font-bold">
            {initial}
        </div>
    );
}

/** بج نقش بیزینسی — هر تب فقط برچسب‌های مرتبط با خودش را نشان می‌دهد */
export const bizBadge = (m: any) => {
    if (m.__isMyCustomer) return { text: 'خریدار من', cls: 'bg-primary text-on-primary' };
    if (m.supplierStatus === 'active') return { text: 'تامین‌کننده', cls: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' };
    if (m.serviceStatus === 'active') return { text: 'سرویس‌دهنده', cls: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' };
    if (m.customerStatus === 'active') return { text: 'خریدار', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' };
    if (m.sellerStatus === 'active') return m.sellerRole === 'visitor'
        ? { text: 'بازاریاب', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' }
        : { text: 'همکار فروش', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' };
    return null;
};

/** بج نقش سیستمی — فقط مالک/مدیر/خودم (تب تیم فروش) */
export const sysBadge = (m: any) => {
    if (m.isOwner) return { text: 'مالک کاتالوگ', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' };
    if (m.isAdmin) return { text: 'مدیر کاتالوگ', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' };
    if (m.__isMe) return { text: 'خودم', cls: 'border border-outline-variant/60 text-gray-500 dark:text-gray-400' };
    return null;
};

// ─── ✅ چرخهٔ «ما اضافه کردیم» (خواستهٔ مالک — Task 26) ───
//   وقتی مدیر کسی را به تیم/خریداران اضافه می‌کند، ردیف همان‌جا می‌آید با برچسب «در انتظار پذیرش»؛
//   اگر طرف رد کند برچسب «درخواست رد شده» می‌گیرد و آیکون حذف کنارش می‌آید.
export type MemberLane = 'seller' | 'customer' | 'supplier' | 'service';

/** مسیری که درخواست را «مدیرِ کاتالوگ» شروع کرده — تنها اینها در لیستِ دعوت‌کننده pending/declined نشان داده می‌شوند */
const MANAGER_INITIATED_VIA: Record<MemberLane, string> = {
    seller: 'manager_invite',
    customer: 'owner_add',
    supplier: 'manager_add',
    service: 'manager_add',
};

/** وضعیت دعوتِ در جریان یک لِین — pending | declined | null (null = عضو عادی/درخواستِ خودِ متقاضی) */
export const inviteStateOf = (m: any, lane: MemberLane): 'pending' | 'declined' | null => {
    if (!m) return null;
    if (m[`${lane}Via`] !== MANAGER_INITIATED_VIA[lane]) return null;
    const status = m[`${lane}Status`];
    if (status === 'pending') return 'pending';
    if (status === 'declined') return 'declined';
    return null;
};

/** چیپ وضعیت دعوت — کهربایی «در انتظار پذیرش …» یا قرمز «درخواست رد شده» */
export function InviteStateChip({ state, pendingLabel }: { state: 'pending' | 'declined'; pendingLabel?: string }) {
    if (state === 'declined') {
        return (
            <span className="inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-black text-rose-700 dark:bg-rose-900/25 dark:text-rose-300">
                <XCircle className="size-3" />
                درخواست رد شده
            </span>
        );
    }
    return (
        <span className="inline-flex flex-shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-brand-contrast-soft px-2 py-0.5 text-[9px] font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
            <Hourglass className="size-3" />
            {pendingLabel || 'در انتظار پذیرش'}
        </span>
    );
}

/** اسلاگ صفحهٔ شخصی عضو — برای ناوبری با router والد */
export const personalSlugOf = (m: any) =>
    m.supplierCatalog?.slug || m.customerBusiness?.slug || m.sellerBusiness?.slug || m.business?.slug || null;

/** بلوک اصلی ردیف عضو — آواتار + نام + کسب‌وکار + شهر + بازوی خرید */
export function MemberMainInfo({ m, onOpen }: { m: any; onOpen?: () => void }) {
    const personalSlug = personalSlugOf(m);
    const cityChip = m.sellerRegion || m.memberCity || (m.customerStatus ? m.customerBusiness?.city : null) || null;
    const bizName = m.customerBusiness?.name || m.sellerBusiness?.name || m.supplierCatalog?.name || m.business?.name;
    return (
        <div
            className={cn('flex-1 min-w-0', personalSlug && onOpen && 'cursor-pointer')}
            onClick={() => { if (personalSlug && onOpen) onOpen(); }}
            title={personalSlug && onOpen ? 'مشاهده صفحه شخصی' : undefined}
        >
            <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{m.fullName || 'بدون نام'}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5 flex items-center gap-2">
                {bizName && (
                    <span className="truncate">
                        {m.supplierCatalog?.name && m.supplierCatalog?.slug ? 'کاتالوگ: ' : ''}
                        {bizName}
                    </span>
                )}
                {cityChip && (
                    <span className="inline-flex items-center gap-0.5 flex-shrink-0 text-gray-400">
                        <MapPin className="w-3 h-3" />{cityChip}
                    </span>
                )}
                {/* ✅ بازوی خریدِ خریدار — شبکهٔ خرید↔فروش */}
                {(m.purchaseCatalogs?.length ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1 flex-shrink-0 rounded-full bg-brand-contrast-soft px-2 py-0.5 text-[9px] font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        <ClipboardList className="h-2.5 w-2.5" />
                        {m.purchaseCatalogs[0].title}{m.purchaseCatalogs.length > 1 ? ` +${m.purchaseCatalogs.length - 1}` : ''}
                    </span>
                )}
            </p>
        </div>
    );
}

/**
 * ✅ بلوک اصلی ردیف خریدار — خریدار خودِ کسب‌وکار/بازوی خرید است، نه مدیرش (خواستهٔ مالک):
 *    خط ۱ (پررنگ): نام کسب‌وکار (نام بازوی خرید) — اگر بازو ندارد فقط نام کسب‌وکار
 *    خط ۲: نام صاحب کسب‌وکار (نقشِ کاربر در آن کسب‌وکار) + شهر
 *    مدیریتِ یک نفر ممکن است ده کسب‌وکار بی‌ربط داشته باشد — اینجا هویتِ تجاری جلو است.
 */
export function BuyerMainInfo({ m, onOpen }: { m: any; onOpen?: () => void }) {
    const biz = m.customerBusiness || null;
    const arm = m.customerArm || null;
    const personalSlug = personalSlugOf(m);
    const title = biz ? (arm ? `${biz.name} (${arm.title})` : biz.name) : (m.fullName || 'بدون نام');
    // نقشِ کاربر در کسب‌وکار: مالک / پستِ نمایشی (مثل «مدیر فروش») / عضو
    const rolePart = m.customerMemberIsOwner ? 'مالک' : (m.customerMemberPosition || 'عضو');
    const ownerLine = biz ? `${m.customerBusinessOwner || ''} (${rolePart})`.trim() : null;
    const cityChip = biz?.city || m.memberCity || null;
    const extraArms = Math.max((m.customerArmCount ?? 0) - (arm ? 1 : 0), 0);
    return (
        <div
            className={cn('flex-1 min-w-0', personalSlug && onOpen && 'cursor-pointer')}
            onClick={() => { if (personalSlug && onOpen) onOpen(); }}
            title={personalSlug && onOpen ? 'مشاهده صفحهٔ شخصی' : undefined}
        >
            <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">{title}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5 flex items-center gap-2">
                {ownerLine && <span className="truncate">{ownerLine}</span>}
                {cityChip && (
                    <span className="inline-flex items-center gap-0.5 flex-shrink-0 text-gray-400">
                        <MapPin className="w-3 h-3" />{cityChip}
                    </span>
                )}
                {extraArms > 0 && (
                    <span className="inline-flex items-center gap-1 flex-shrink-0 rounded-full bg-brand-contrast-soft px-2 py-0.5 text-[9px] font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                        <ClipboardList className="h-2.5 w-2.5" />
                        +{extraArms.toLocaleString('fa-IR')} بازوی خرید دیگر
                    </span>
                )}
            </p>
        </div>
    );
}
