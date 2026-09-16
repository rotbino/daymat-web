// app/inquiries/[id]/ArmFooter.tsx
// فوتر صفحهٔ عمومی بازوی خرید — قرینهٔ CatalogFooter (کد مرجع از مالک):
//   ۱) اطلاعات خریدار (تماس/موقعیت/اطلاعات)
//   ۲) برندینگ دیمت با پرش به ساخت بازوی خرید
//   ۳) 🦠 قیف ویروسی: لینک‌ها کد دعوتِ مالکِ همین بازو را حمل می‌کنند
//      «تو هم بازوی خریدت را بساز» + «تامین‌کننده هستی؟ کاتالوگ بساز»
//   ⚠️ بلوک‌های ویروسی فقط برای کسانی که بازو ندارند رندر می‌شود (showViral از پدر) —
//      مالک/ادمین بازو و کسی که قبلاً بازو ساخته هرگز نبینند (خواستهٔ مالک)
'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { Clock, MapPin, Store, User, Sparkles, Gift, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

const WRAP = 'max-w-2xl mx-auto px-4';

export default function ArmFooter({ inquiry, showViral, bottomBar }: { inquiry: any; showViral: boolean; /** نوار ثابت CTA موبایل روی فوتر نیفتد */ bottomBar?: boolean }) {
    const router = useRouter();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    // ✅ قیف ویروسی با انتساب رفرال صاحب بازو — مثل فوتر کاتالوگ:
    //    هر کس از این بازو وارد دیمت شود، «دعوت‌شدهٔ» صاحب بازو ثبت می‌شود
    //    (RefCapture سراسری ref داخلِ redirect را هم می‌گیرد → انتساب در ثبت‌نام)
    const refCode: string | undefined = inquiry?.owner?.referralCode;
    const q = refCode ? `?ref=${refCode}` : '';

    const armPath = `/inquiries/new${q}`;               // ساخت بازوی خرید
    const catalogPath = `/business/register${q}`;       // ساخت کاتالوگ تامین (مسیر تامین‌کننده)
    const armHref = isAuthenticated
        ? armPath
        : `/login?redirect=${encodeURIComponent(armPath)}`;
    const catalogHref = isAuthenticated
        ? catalogPath
        : `/login?redirect=${encodeURIComponent(catalogPath)}&intent=catalog`;

    const createdAt = inquiry?.createdAt
        ? new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(new Date(inquiry.createdAt))
        : null;

    return (
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className={cn(WRAP, 'py-8 space-y-6', bottomBar && 'pb-28 lg:pb-8')}>
                {/* اطلاعات خریدار */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[11px] mb-1.5">تماس</h3>
                        {inquiry?.business?.phone && <a href={`tel:${inquiry.business.phone}`} className="block text-gray-500" dir="ltr">{inquiry.business.phone}</a>}
                        {inquiry?.owner?.fullName && <p className="flex items-center gap-1.5 text-gray-500 mt-1"><User className="w-3 h-3" />{inquiry.owner.fullName}</p>}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[11px] mb-1.5">موقعیت</h3>
                        {inquiry?.city && <p className="flex items-center gap-1.5 text-gray-500"><MapPin className="w-3 h-3" />{inquiry.city}</p>}
                        {inquiry?.deliveryNote && <p className="text-gray-500 mt-1">{inquiry.deliveryNote}</p>}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[11px] mb-1.5">اطلاعات</h3>
                        <p className="flex items-center gap-1.5 text-gray-500"><ClipboardList className="w-3 h-3" />{inquiry?.items?.length ?? 0} قلم خرید</p>
                        {createdAt && <p className="flex items-center gap-1.5 text-gray-500 mt-1"><Clock className="w-3 h-3" />عضویت از {createdAt}</p>}
                    </div>
                </div>

                {/* 🦠 بلوک ویروسی — فقط برای کسانی که بازو ندارند */}
                {showViral && (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-2.5">
                        <button onClick={() => router.push(armHref)}
                            className="w-full rounded-2xl border border-primary/25 bg-brand-primary-soft/60 dark:bg-primary/10 px-4 py-3.5
                            flex items-center gap-3 text-right hover:border-primary/40 active:scale-[0.99] transition-all group">
                            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white shadow-sm dark:bg-gray-900">
                                <Gift className="w-4.5 h-4.5 text-primary" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[12.5px] font-black text-brand-primary dark:text-emerald-300">تو هم بازوی خریدت را بساز</span>
                                <span className="block mt-0.5 text-[10.5px] font-bold leading-4 text-brand-primary/70 dark:text-emerald-300/70">
                                    لیست خریدت را برای تامین‌کننده‌ها بفرست و پیشنهادهای قیمت را یک‌جا بگیر
                                </span>
                            </span>
                            <span className="shrink-0 rounded-full bg-primary px-3.5 py-2 text-[11px] font-extrabold text-on-primary shadow-sm group-hover:opacity-90 transition-opacity">ساخت بازو</span>
                        </button>

                        {/* مسیر تامین‌کننده — بازو برای تامین‌کننده‌ها فرستاده می‌شود؛ آن‌ها به کاتالوگ نیاز دارند */}
                        <button onClick={() => router.push(catalogHref)}
                            className="w-full rounded-2xl border border-brand-accent/30 bg-brand-accent-soft/50 dark:bg-amber-500/5 px-4 py-3
                            flex items-center gap-3 text-right hover:border-brand-accent/50 active:scale-[0.99] transition-all group">
                            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white shadow-sm dark:bg-gray-900">
                                <Store className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[12px] font-black text-amber-800 dark:text-amber-300">تامین‌کننده هستی؟</span>
                                <span className="block mt-0.5 text-[10.5px] font-bold leading-4 text-amber-700/80 dark:text-amber-400/80">
                                    در یک دقیقه کاتالوگ محصولاتت را بساز و تامین‌کنندهٔ صدها بازوی خرید شو
                                </span>
                            </span>
                        </button>
                    </div>
                )}

                {/* برندینگ دیمت */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2">
                    <button onClick={() => router.push(armHref)}>
                        <div className="relative h-14 w-56"><Image src="/images/logo2.png" alt="دیمت" fill className="object-contain" unoptimized /></div>
                        <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400">دیمت، ساخت بازوی خرید</p>
                    </button>
                </div>

                {/* ✅ دکمهٔ ویروسی شناور — با کد دعوت صاحب بازو (قرینهٔ کاتالوگ) */}
                {showViral && (
                    <div className="bottom-0 left-0 right-0 z-50 py-2">
                        <div className={cn(WRAP, 'flex justify-center')}>
                            <button
                                onClick={() => router.push(armHref)}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-full
                                bg-white/90 dark:bg-gray-900/90 backdrop-blur
                                border border-gray-200/70 dark:border-white/10
                                hover:bg-primary/5 hover:border-primary/20
                                transition-all active:scale-95 group shadow-sm
                                text-xs font-medium text-gray-600 dark:text-gray-300"
                            >
                                <Sparkles className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-colors" />
                                <span className="hidden sm:inline text-gray-500 dark:text-gray-400">ساخته شده با</span>
                                <span className="font-extrabold text-primary/80 group-hover:text-primary transition-colors">دیمت</span>
                                <span className="hidden sm:inline text-gray-400">·</span>
                                <span className="hidden sm:inline text-gray-500 group-hover:text-primary/80 transition-colors">تو هم بازوی خریدت را بساز</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </footer>
    );
}
