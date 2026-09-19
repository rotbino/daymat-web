// app/my-catalogs/components/ProductRow.tsx
'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, EyeOff, Layers, Package, Pencil, RefreshCw, Store, TrendingUp, Unlink, History, Trash2, Users, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmt, inMarket, isAdExpired, isNeedsCompletion, isPriceExpired, isUncategorized, priceAgeDays } from '../constants';
import { currencyLabel } from '@/lib/utils/brand';

/**
 * ردیف کالا — پرکاربردترین المان پنل مدیریت.
 * ✅ React.memo: با تغییر statusFilter رندر مجدد لیست ارزان می‌ماند.
 * چیدمان: بالای ردیف (عکس + هویت + قیمت) و ردیف اکشن افقی پایین — خوانا در موبایل.
 * حذف: دو-مرحله‌ای (اول کلیک → «تایید حذف؟»، کلیک دوم واقعاً حذف می‌کند) — بدون مدال اضافه.
 */
function ProductRowBase({ ad, canPublishMarket = true, onEdit, onCategory, onRefresh, onPublish, onPriceUpdate, onDelete, onBuyers, buyerCount = 0, currency }: {
    ad: any;
    /** ✅ کاتالوگ عضو حداقل یک بازاره؟ — والا دکمه بازارها مخفی می‌شود (کاربر درگیر بازاری که نیست نمی‌شود) */
    canPublishMarket?: boolean;
    onEdit: (ad: any) => void;
    onCategory: (ad: any) => void;
    onRefresh: (ad: any) => void;
    onPublish: (ad: any) => void;
    onPriceUpdate: (ad: any) => void;
    onDelete: (ad: any) => void;
    /** ✅ مچینگ دوطرفه — مدال «خریداران این کالا»؛ فقط وقتی خریدارِ فعالِ واقعی باشد دیده می‌شود */
    onBuyers?: (ad: any) => void;
    buyerCount?: number;
    /** 💱 واحد پول نمایشی بازوی فروش — پیش‌فرض تومان */
    currency?: string | null;
}) {
    const expired = isAdExpired(ad);
    const priceExpired = isPriceExpired(ad);
    const market = inMarket(ad) && !!ad.armId;
    // 🏷️ کالای ایمپورت‌شدهٔ نیازمند تکمیل — تا ویرایش در کاتالوگ عمومی پنهان است
    const needsCompletion = isNeedsCompletion(ad);
    // ✅ اعتبار قیمت دیگر آگهی را از تابلوی بازار برنمی‌دارد — فقط یادآوری است
    const onTable = ad.status === 'active' && market;
    const uncat = isUncategorized(ad);
    const unit = ad.unit?.title || ad.unit?.shortCode || '';
    const logoSrc = ad.files?.[0]?.thumbnailPath || ad.files?.[0]?.path;
    // ✅ تازگی قیمت — قیمتِ ۱۴+ روز قدیمی برای خریدار قابل‌اعتماد نیست؛ فروشنده باید ببیند و تازه کند
    const ageDays = priceAgeDays(ad.priceUpdatedAt);
    const isStalePrice = onTable && ageDays >= 14;

    // ✅ حذف دو-مرحله‌ای — ۳ ثانیه فرصت، بعد خودش برمی‌گردد
    const [confirming, setConfirming] = useState(false);
    const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const armDelete = () => {
        if (confirming) {
            if (confirmTimer.current) clearTimeout(confirmTimer.current);
            setConfirming(false);
            onDelete(ad);
            return;
        }
        setConfirming(true);
        confirmTimer.current = setTimeout(() => setConfirming(false), 3000);
    };

    return (
        <div className={cn('rounded-lg border p-3 transition-colors',
            uncat
                ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-300/50 dark:border-amber-800/40'
                : onTable
                    ? 'bg-white dark:bg-gray-900 border-outline-variant/40'
                    : expired
                        ? 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/40'
                        : 'bg-surface-container-low/60 dark:bg-gray-800/60 border-outline-variant/30 dark:border-gray-700/60 opacity-80')}>

            {/* بخش اصلی */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0 relative">
                    {logoSrc
                        ? <Image src={logoSrc} alt="" fill sizes="48px" className="object-cover" unoptimized />
                        : <Package className="w-5 h-5 text-on-surface-variant/40 m-auto absolute inset-0" />}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold text-on-surface truncate">{ad.productType || ad.title}</p>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        {/* چیپس بازارهای فعال — لینک‌دار */}
                        {ad.publications && ad.publications.length > 0 ? (
                            ad.publications.map((pub: any) => (
                                <Link key={pub.armId} href={`/${pub.arm?.slug}`} target="_blank"
                                      title={`مشاهده در ${pub.arm?.name}`}
                                      className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full transition-all hover:scale-105"
                                      style={{
                                          backgroundColor: (pub.arm?.colorPrimary || '#a11f2c') + '15',
                                          color: pub.arm?.colorPrimary || '#a11f2c',
                                      }}>
                                    <Store className="w-2.5 h-2.5" /> {pub.arm?.name}
                                </Link>
                            ))
                        ) : !market ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                                <EyeOff className="w-2.5 h-2.5" /> فقط بازوی فروش
                            </span>
                        ) : expired ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                <Clock className="w-2.5 h-2.5" /> نیازمند قیمت تازه
                            </span>
                        ) : (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">غیرفعال</span>
                        )}
                        {uncat && (
                            <span title="این کالا در فیلترهای دسته‌بندی بازار پیدا نمی‌شود — لینک شکسته"
                                  className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full
                                      bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                <Unlink className="w-2.5 h-2.5" /> لینک دسته شکسته
                            </span>
                        )}
                        {priceExpired && (
                            <span title="مدت اعتباری که خودت تعیین کرده بودی تمام شده — قیمت رو تازه کن"
                                  className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full
                                      bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                <Clock className="w-2.5 h-2.5" /> اعتبار قیمت تمام شد
                            </span>
                        )}
                        {isStalePrice && !priceExpired && (
                            <span title="قیمت قدیمی اعتماد خریدار را کم می‌کند — همین حالا آپدیتش کن"
                                  className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full
                                      bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                                <History className="w-2.5 h-2.5" /> قیمت {priceAgeDays(ad.priceUpdatedAt).toLocaleString('fa-IR')} روز پیش
                            </span>
                        )}
                        {needsCompletion && (
                            <span title="تا ویرایش و تکمیل، این کالا در کاتالوگ عمومی و تابلوی بازار دیده نمی‌شود"
                                  className="inline-flex items-center gap-1 text-[9px] font-extrabold px-2 py-0.5 rounded-full
                                      bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300">
                                <ListChecks className="w-2.5 h-2.5" /> نیاز به تکمیل — پنهان از کاتالوگ
                            </span>
                        )}
                    </div>
                    <p className="text-xs font-extrabold text-primary mt-1">
                        {fmt(ad.unitPrice)} <span className="text-[9px] font-normal text-on-surface-variant">{currencyLabel(currency)}/{unit}</span>
                    </p>
                </div>
            </div>

            {/* اکشن‌ها — ردیف افقی پایین */}
            <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-outline-variant/15 dark:border-gray-700/40 flex-wrap">
                {needsCompletion && (
                    <button onClick={() => onEdit(ad)}
                            title="با ذخیرهٔ ویرایش، برچسب برداشته می‌شود و کالا در کاتالوگ دیده می‌شود"
                            className="h-8 px-3 rounded-lg bg-orange-500 text-white text-[10px] font-extrabold flex items-center gap-1
                                hover:bg-orange-600 active:scale-95 transition-transform shadow-sm">
                        <ListChecks className="w-3 h-3" /> تکمیل و نمایش
                    </button>
                )}
                {uncat && (
                    <button onClick={() => onCategory(ad)}
                            className="h-8 px-3 rounded-md bg-amber-500 text-white text-[10px] font-bold flex items-center gap-1
                                hover:bg-amber-600 active:scale-95 transition-transform">
                        <Layers className="w-3 h-3" /> دسته بازار
                    </button>
                )}
                {priceExpired && (
                    <button onClick={() => onPriceUpdate(ad)}
                            title="قیمت جدید را ثبت کن — اعتبار قیمت از نو شروع می‌شود"
                            className="h-8 px-3 rounded-lg bg-red-600 text-white text-[10px] font-bold flex items-center gap-1
                                hover:bg-red-700 active:scale-95 transition-transform shadow-sm">
                        <TrendingUp className="w-3 h-3" /> آپدیت قیمت
                    </button>
                )}
                {expired && market && (
                    <button onClick={() => onRefresh(ad)}
                            className="h-8 px-3 rounded-lg bg-primary text-on-primary text-[10px] font-bold flex items-center gap-1
                                active:scale-95 transition-transform shadow-sm">
                        <RefreshCw className="w-3 h-3" /> تازه‌سازی
                    </button>
                )}
                <span className="flex-1" />
                {/* ✅ مچینگ دوطرفه — «خریداران این کالا»؛ خریدارِ واقعی پشتش باشد نشان داده می‌شود */}
                {onBuyers && buyerCount > 0 && (
                    <button onClick={() => onBuyers(ad)}
                            title="بازوهای خریدی که همین کالا را فعالانه قیمت‌گیری می‌کنند"
                            className="h-8 px-3 rounded-lg bg-brand-contrast text-white text-[10px] font-extrabold flex items-center gap-1
                                hover:bg-brand-contrast-strong active:scale-95 transition-transform shadow-sm">
                        <Users className="w-3 h-3" /> خریداران این کالا
                        <span className="rounded-full bg-white/20 px-1.5 text-[9px] font-black">{buyerCount.toLocaleString('fa-IR')}</span>
                    </button>
                )}
                {/* ✅ دکمه بازارها — فقط وقتی کاتالوگ عضو حداقل یک بازاره */}
                {canPublishMarket && (
                    <button onClick={() => onPublish(ad)}
                            title="مدیریت انتشار این آگهی در بازارها"
                            className="h-8 px-3 rounded-lg border border-primary/40 bg-primary/5 text-[10px] font-bold text-primary
                                hover:bg-primary/10 flex items-center gap-1 transition-colors">
                        <Store className="w-3 h-3" /> بازارها
                    </button>
                )}
                <button onClick={() => onEdit(ad)}
                        className="h-8 px-3 rounded-lg border border-outline-variant/50 text-[10px] font-bold text-on-surface-variant
                            hover:text-primary hover:border-primary/40 flex items-center gap-1 transition-colors">
                    <Pencil className="w-3 h-3" /> ویرایش
                </button>
                {/* ✅ حذف — دو-مرحله‌ای تا اشتباهی نباشد */}
                <button onClick={armDelete}
                        title={confirming ? 'دوباره بزن تا حذف شود' : 'حذف این کالا'}
                        aria-label={confirming ? 'تایید حذف' : 'حذف کالا'}
                        className={cn('h-8 px-3 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all',
                            confirming
                                ? 'bg-red-600 border-red-600 text-white animate-pulse'
                                : 'border-outline-variant/50 text-on-surface-variant hover:text-red-600 hover:border-red-400')}>
                    <Trash2 className="w-3 h-3" /> {confirming ? 'تایید حذف؟' : 'حذف'}
                </button>
            </div>
        </div>
    );
}

export const ProductRow = React.memo(ProductRowBase);
