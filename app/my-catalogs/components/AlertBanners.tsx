// app/my-catalogs/components/AlertBanners.tsx
// بنرهای وضعیت صفحه — هرکدام مستقل و کوچک
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
    AlertTriangle, BadgeCheck, Key, Layers, Sparkles, Store, UserPlus, X,
} from 'lucide-react';
import { fmt } from '../constants';

/** هشدار بحرانی رمز موقت */
export function TemporaryPasswordBanner({ phone, onClick }: { phone?: string; onClick: () => void }) {
    return (
        <div className="rounded-2xl border border-error/40 bg-error/5 overflow-hidden animate-pulse">
            <button onClick={onClick}
                    className="w-full p-3 flex items-center gap-3 text-right hover:bg-error/10 transition-colors">
                <Key className="w-4.5 h-4.5 text-error flex-shrink-0" />
                <span className="text-xs text-on-surface flex-1">رمز عبور شما موقت است — <b className="text-error">همین حالا عوضش کن</b></span>
                <span className="h-8 px-3 rounded-lg bg-error text-white text-[10px] font-bold flex items-center flex-shrink-0">تغییر رمز</span>
            </button>
            <div className="px-3 py-2 bg-error/[0.03] dark:bg-error/[0.06] border-t border-error/20 flex items-center gap-2">
                <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="text-[10px] text-on-surface-variant leading-4">
                    حساب شما: <b className="text-on-surface" dir="ltr">{phone}</b> — لطفاً چک کنید این شمارهٔ خودتان است
                </span>
            </div>
        </div>
    );
}

/** نکتهٔ تکمیل نام/آواتار پروفایل */
export function ProfileBanner({ avatarUrl, hasName, onClick }: {
    avatarUrl?: string | null;
    hasName: boolean;
    onClick: () => void;
}) {
    return (
        <button onClick={onClick}
                className="w-full bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700
                p-3.5 flex items-center gap-3 text-right hover:border-primary/40 transition-colors">
            <span className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                {avatarUrl
                    ? <Image src={avatarUrl} alt="" width={40} height={40} className="w-full h-full object-cover" unoptimized />
                    : <UserPlus className="w-5 h-5 text-primary" />}
            </span>
            <span className="flex-1 min-w-0">
                <span className="block text-xs font-extrabold text-on-surface">
                    {hasName ? 'عکس پروفایلت را بگذار' : 'نام و عکس پروفایلت را تکمیل کن'}
                </span>
                <span className="block text-[10px] text-on-surface-variant/70 mt-0.5">
                    مشتری‌ها در کاتالوگت به اسم و چهره اعتماد بیشتری می‌کنند
                </span>
            </span>
            <span className="text-[10px] font-bold text-primary flex-shrink-0">تکمیل ←</span>
        </button>
    );
}

/** بنر جشن عضویت تازه در بازار (۴۸ ساعت اول) */
export function CelebrationBanner({ membership, uncatCount, onDismiss, onSetCategories }: {
    membership: any;
    uncatCount: number;
    onDismiss: () => void;
    onSetCategories: () => void;
}) {
    const router = useRouter();
    const armName = membership.armName || membership.arm?.name || 'بازار';
    return (
        <div className="rounded-2xl overflow-hidden border border-primary/30 bg-gradient-to-l
            from-primary/15 via-primary/8 to-transparent relative">
            <button onClick={onDismiss} aria-label="بستن"
                    className="absolute top-2 left-2 w-6 h-6 rounded-full grid place-items-center
                        text-on-surface-variant/60 hover:bg-black/10 dark:hover:bg-white/10 transition-colors z-10">
                <X className="w-3.5 h-3.5" />
            </button>
            <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-extrabold tracking-wider text-primary/80 uppercase">تبریک</span>
                </div>
                <h3 className="text-base font-black text-on-surface">
                    محصولات کاتالوگ شما در بازار {armName} قرار گرفت! 🎉
                </h3>
                <p className="text-xs text-on-surface-variant leading-6 mt-1.5 max-w-md">
                    حالا محصولات شما در کنار محصولات سایر فروشندگان در معرض دید هزاران خریدار قرار دارد و در صورت رعایت
                    قوانین رشد در بازار، بازدید محصولات و در نتیجه فروش شما افزایش می‌یابد.
                    {uncatCount > 0
                        ? ' فقط یک قدم مانده: دسته‌بندی بازار را برای کالاهایت انتخاب کن تا در فیلترهای خریدارها پیدا شوی.'
                        : ' همه‌چیز آماده است — کالاهایت در فیلترهای بازار هم دیده می‌شوند.'}
                </p>
                <div className="flex items-center gap-2 mt-3.5">
                    {uncatCount > 0 && (
                        <button onClick={onSetCategories}
                                className="h-10 px-5 rounded-xl bg-amber-500 text-white text-xs font-extrabold
                                    inline-flex items-center gap-1.5 hover:bg-amber-600 active:scale-95 transition-all shadow-sm">
                            <Layers className="w-4 h-4" /> تنظیم دسته‌ها ({fmt(uncatCount)})
                        </button>
                    )}
                    <button onClick={() => router.push(`/${membership.arm?.slug || membership.slug}`)}
                            className="h-10 px-5 rounded-xl border border-primary/40 text-primary text-xs font-extrabold
                                inline-flex items-center gap-1.5 hover:bg-primary/5 active:scale-95 transition-all">
                        <Store className="w-4 h-4" /> دیدن تابلوی بازار
                    </button>
                </div>
            </div>
        </div>
    );
}

/** بنر کالاهای بی‌دسته در بازار */
export function UncategorizedBanner({ count, armName, onClick }: {
    count: number;
    armName?: string;
    onClick: () => void;
}) {
    return (
        <button onClick={onClick}
                className="w-full bg-gradient-to-l from-amber-50 to-amber-50/40 dark:from-amber-900/15 dark:to-amber-900/5
                border border-amber-300/60 dark:border-amber-800/50 rounded-2xl p-4
                flex items-center gap-3.5 text-right hover:border-amber-400 transition-colors group">
            <span className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </span>
            <span className="flex-1 min-w-0">
                <span className="block text-sm font-extrabold text-amber-800 dark:text-amber-300">
                    {fmt(count)} کالای تو در {armName || 'بازار'} دسته‌بندی نشده است
                </span>
                <span className="block text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 leading-5">
                    در جستجو دیده می‌شوند ولی از فیلتر دسته‌بندی‌ها پیدا نمی‌شوند — دسته‌شان را مشخص کن
                </span>
            </span>
            <span className="h-9 px-4 rounded-xl bg-amber-500 text-white text-[11px] font-bold inline-flex items-center flex-shrink-0 group-hover:bg-amber-600 transition-colors">
                تنظیم دسته‌ها
            </span>
        </button>
    );
}
