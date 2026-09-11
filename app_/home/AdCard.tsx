// app/home/AdCard.tsx
'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import {
    MapPin, Star, Verified, Lock, Tag,
    Banknote, Layers, Store, TrendingUp, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { unitLabel } from '@/lib/utils/unitLabel';
import { useRouter } from 'next/navigation';

interface AdCardProps {
    ad: any;
    onContact: (adId: string) => void;
    onDetail: (ad: any) => void;
    /** ✅ فراخوانِ گیت قیمت — اگر بده، جای متن ساده دکمهٔ «عضو شو» می‌نشیند */
    onJoinMarket?: () => void;
}

function formatNum(n: number | undefined) {
    return n?.toLocaleString('fa-IR') ?? '—';
}

function getRelativeTime(date: string) {
    const diffDays = Math.floor(
        (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return 'امروز';
    if (diffDays === 1) return 'دیروز';
    return `${diffDays} روز`;
}

const BIZ_TYPE: Record<string, { label: string; cls: string }> = {
    producer:         { label: 'تولیدی',       cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
    wholesaler:       { label: 'عمده‌فروش',    cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    importer:         { label: 'واردکننده',    cls: 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
    exporter:         { label: 'صادرکننده',    cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    distributor:      { label: 'توزیع‌کننده',  cls: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400' },
    retailer:         { label: 'خرده‌فروش',    cls: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
    contractor:       { label: 'پیمانکار',     cls: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
    service_provider: { label: 'خدمات',        cls: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
    other:            { label: 'سایر',          cls: 'bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
};

const TIER: Record<string, { label: string; color: string }> = {
    gold:   { label: 'طلایی',  color: 'text-yellow-500 dark:text-yellow-400' },
    silver: { label: 'نقره‌ای', color: 'text-gray-400 dark:text-gray-300' },
    blue:   { label: 'آبی',    color: 'text-blue-500 dark:text-blue-400' },
};

/** ✅ سود خریدار عمده: (قیمت مصرف‌کننده − قیمت تکی عمده) در هر واحد مصرف‌کننده.
 *  فقط وقتی معنا دارد که consumerPrice موجود و بزرگ‌تر باشد؛ در غیر این صورت null */
function getProfitInfo(ad: any) {
    const unitBase = ad.unitBaseTitle || 'عدد';
    const single = Number(ad.singleUnitPrice || 0);
    const consumer = Number(ad.consumerPrice || 0);
    if (single <= 0 || consumer <= 0) return null;
    const profit = consumer - single;
    if (profit <= 0) return null;
    const percent = Math.round((profit / single) * 100);
    const qty = Number(ad.unitQty || 0);
    const perWholesale = qty > 1 ? profit * qty : 0; // سود کل هر واحد عمده (مثلاً هر کارتن)
    return { unitBase, profit, percent, perWholesale };
}

export default function AdCard({ ad, onContact, onDetail, onJoinMarket }: AdCardProps) {
    const router = useRouter();
    const [imgLoading, setImgLoading] = useState(true);
    const unit = unitLabel(ad.unit); // ✅ عنوان فارسی واحد، نه کد انگلیسی

    const unitBaseTitle = ad.unitBaseTitle || 'واحد';

    // ✅ پرداخت
    const pm  = ad.paymentMethods;
    const lpm = ad.customFields?.paymentMethods;
    const hasCheque      = (pm?.cheque?.length ?? 0) > 0 || (lpm?.cheque?.enabled ?? false);
    const hasInstallment = (pm?.installment?.length ?? 0) > 0 || (lpm?.installment?.enabled ?? false);
    const hasPaymentTags = hasCheque || hasInstallment;

    // ✅ تاییدیه
    const tier       = ad.catalog?.verificationTier;
    const tierActive = tier && tier !== 'none';
    const tierInfo   = tierActive ? TIER[tier] : null;

    const file = ad.files?.[0];
    const imgUrl = file?.path || file?.thumbnailPath || '/images/no_product_image.jpg';
    const thumbUrl = file?.thumbnailPath || imgUrl;
    const isExternal = imgUrl.startsWith('https://');

    // ✅ زمان
    const relTime = getRelativeTime(ad.updatedAt || ad.createdAt);

    // ✅ سود خریدار عمده
    const profitInfo = getProfitInfo(ad);

    // ✅ نوع کسب‌وکار
    const bizInfo = BIZ_TYPE[ad.catalog?.type || ''] || BIZ_TYPE.other;

    const handleClick = () => {
        if (ad.isAnonymous) {
            onContact(ad.id);
            return;
        }
        const title = ad.productType || ad.title || 'ad';
        const persianSlug = title
            .replace(/\s+/g, '-')
            .replace(/[^\u0600-\u06FF\u0750-\u077F\w\-]/g, '')
            .substring(0, 60);
        router.push(`/ad/${ad.id}/${persianSlug}`);
    };

    const PaymentTags = ({ className }: { className?: string }) => (
        <div className={cn('flex items-center gap-1 flex-wrap', className)}>
            {hasCheque && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300 text-[10px] font-medium shadow-sm">
                    <Banknote className="w-2.5 h-2.5" />چکی
                </span>
            )}
            {hasInstallment && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300 text-[10px] font-medium shadow-sm">
                    <Layers className="w-2.5 h-2.5" />اقساط
                </span>
            )}
        </div>
    );

    /** ✅ گیت قیمت — دکمهٔ عضویت (اگر handler باشد) یا متن ساده */
    const JoinGate = ({ className }: { className?: string }) => {
        if (!onJoinMarket) {
            return <span className={cn('text-[11px] font-bold text-amber-600', className)}>برای دیدن قیمت عضو شوید</span>;
        }
        return (
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onJoinMarket(); }}
                className={cn(
                    'inline-flex items-center gap-1 h-6 px-2 rounded-md bg-amber-50 dark:bg-amber-900/30',
                    'text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60',
                    'text-[10px] font-bold hover:bg-amber-100 dark:hover:bg-amber-900/50 active:scale-95 transition-all',
                    className,
                )}
            >
                <Lock className="w-2.5 h-2.5" />
                برای دیدن قیمت عضو شوید
            </button>
        );
    };

    /** ✅ بج سود — سبز برای اسکن چشم سریع خریدار عمده */
    const ProfitBadge = ({ showPerWholesale = false }: { showPerWholesale?: boolean }) => {
        if (!profitInfo) return null;
        return (
            <div className="flex items-center gap-1.5 flex-wrap rounded-lg bg-emerald-50 dark:bg-emerald-900/25
                border border-emerald-200/70 dark:border-emerald-800/50 px-2 py-1">
                <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200 leading-none">
                    سود: {formatNum(profitInfo.profit)} تومان هر {profitInfo.unitBase}
                </span>
                <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 leading-none">
                    ({profitInfo.percent.toLocaleString('fa-IR')}٪)
                </span>
                {showPerWholesale && profitInfo.perWholesale > 0 && (
                    <span className="text-[9px] font-medium text-emerald-700/80 dark:text-emerald-300/80 leading-none">
                        · {formatNum(profitInfo.perWholesale)} تومان هر {unit}
                    </span>
                )}
            </div>
        );
    };

    const SellerBox = () => {
        if (ad.isAnonymous) {
            return (
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200/60 dark:border-gray-700/40">
                    <Lock className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">ناشناس</span>
                </div>
            );
        }

        return (
            <div className={cn(
                'bg-gray-50 mt-2 dark:bg-gray-800/50 rounded-lg border border-gray-200/60 dark:border-gray-700/40 overflow-hidden',
                tierActive && tierInfo && 'border-r-[3px]',
                tierActive && tierInfo && tier === 'gold' && 'border-r-yellow-500',
                tierActive && tierInfo && tier === 'silver' && 'border-r-gray-400',
                tierActive && tierInfo && tier === 'blue' && 'border-r-blue-500',
            )}>
                <div className="flex items-center gap-1.5 px-2.5 pt-1.5 pb-1">
                    <Store className="w-3 h-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate flex-1">
                        {ad.catalog?.name || 'فروشنده'}
                    </span>
                </div>

                <div className="flex items-center justify-between gap-1.5 px-2.5 pb-1.5 mt-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                        {tierActive && tierInfo && (
                            <span className="flex items-center gap-0.5 flex-shrink-0">
                                <Verified className={cn('w-3.5 h-3.5', tierInfo.color)} strokeWidth={2.5} />
                                <span className={cn('text-[8px] font-bold', tierInfo.color)}>{tierInfo.label}</span>
                            </span>
                        )}
                        <span className={cn(
                            'inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-semibold flex-shrink-0',
                            bizInfo.cls,
                        )}>
                            {bizInfo.label}
                        </span>
                    </div>

                    <div className="flex items-center gap-2.5 flex-shrink-0">
                        {ad.catalog?.city && (
                            <span className="flex items-center gap-0.5 text-[9px] text-gray-400 dark:text-gray-500">
                                <MapPin className="w-2 h-2" />{ad.catalog.city}
                            </span>
                        )}
                        {ad.catalog?.owner?.phone && (
                            <span className="flex items-center gap-0.5 text-[9px] text-gray-400 dark:text-gray-500">
                                📞 {ad.catalog.owner.phone}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const MinStockRow = () => (
        <div className="flex items-center gap-2 text-[9px] text-gray-500 dark:text-gray-400">
            <span className="flex-1">
                حداقل: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatNum(ad.minQuantity)} {unit}</span>
            </span>
            <span>
                موجودی: <span className="font-semibold text-gray-700 dark:text-gray-300">
                    {ad.availableQuantity ? `${formatNum(ad.availableQuantity)} ${unit}` : 'موجود'}
                </span>
            </span>
        </div>
    );

    /* ─────────────── موبایل: کارت افقی ─────────────── */
    const MobileLayout = () => (
        <div className="flex flex-row-reverse bg-white dark:bg-gray-900 rounded-xl border border-gray-200/60 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 group">

            {/* تصویر */}
            <div className="w-28 flex-shrink-0 relative bg-gray-100 dark:bg-gray-800">
                {imgLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-[5]">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <Image
                    src={thumbUrl || imgUrl}
                    alt={ad.productType || ad.title}
                    width={112}
                    height={160}
                    className={cn(
                        // ✅ تصویر کامل داخل کادر — عرض ثابت کانتینر، اگر بلندتر بود جا می‌شود
                        'w-full h-full object-contain group-hover:scale-105 transition-transform duration-500',
                        imgLoading && 'opacity-0',
                    )}
                    unoptimized={isExternal}
                    loading="lazy"
                    onLoadingComplete={() => setImgLoading(false)}
                    onError={() => setImgLoading(false)}
                />
                {ad.isBumped && (
                    <div className="absolute top-1.5 right-1.5 bg-error rounded-full p-0.5 z-10">
                        <Star className="w-2.5 h-2.5 text-white fill-white" />
                    </div>
                )}
                {/* ✅ نشان تازگی — فقط آیکون، بدون کانتینر و متن */}
                {relTime === 'امروز' && (
                    <Sparkles className="absolute top-1.5 left-1.5 w-4 h-4 text-amber-400 fill-amber-300 drop-shadow-md z-10" />
                )}

                {/* ✅ روش پرداخت روی تصویر — جایگزین شهر/استان */}
                {hasPaymentTags && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/55 to-transparent px-1.5 pb-1.5 pt-5 z-10">
                        <PaymentTags />
                    </div>
                )}
            </div>

            {/* محتوا */}
            <div className="flex-1 flex flex-col justify-between p-2.5 min-w-0 gap-1">
                <h3 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug">
                    {ad.productType || ad.title}
                </h3>

                {/* ✅ برند — زیر عنوان */}
                {ad.brand?.title && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate -mt-0.5 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        {ad.brand.title}
                    </span>
                )}

                {/* قیمت عمده — لنگر بصری کارت */}
                <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">هر {unit}:</span>
                    <div className="flex items-baseline gap-1">
                        {ad.unitPrice === null || ad.unitPrice === undefined ? (
                            <JoinGate />
                        ) : (
                            <>
                                <span className="text-[16px] font-bold text-primary leading-none">{formatNum(ad.unitPrice)}</span>
                                <span className="text-[9px] text-gray-500 dark:text-gray-400">تومان</span>
                            </>
                        )}
                    </div>
                </div>

                {ad.singleUnitPrice > 0 && (
                    <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">فی {unitBaseTitle}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">{formatNum(ad.singleUnitPrice)}</span>
                            <span className="text-[9px] text-gray-400 dark:text-gray-500">تومان</span>
                        </div>
                    </div>
                )}

                <ProfitBadge />

                <MinStockRow />

                <SellerBox />
            </div>
        </div>
    );

    /* ─────────────── دسکتاپ: کارت گریدی با ارتفاع یکسان ─────────────── */
    const DesktopLayout = () => (
        <div className="bg-white dark:bg-gray-900 border border-gray-200/60 dark:border-gray-800 rounded-xl
            overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col h-full">

            {/* تصویر */}
            <div className="relative h-44 overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                {imgLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-[5]">
                        <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <Image
                    src={thumbUrl || imgUrl}
                    alt={ad.productType || ad.title}
                    fill
                    className={cn(
                        // ✅ تصویر کامل — width-first با سقف ارتفاع کانتینر (بدون بریدن)
                        'object-contain transition-transform duration-500 group-hover:scale-105',
                        imgLoading && 'opacity-0',
                    )}
                    unoptimized={isExternal}
                    loading="lazy"
                    onLoadingComplete={() => setImgLoading(false)}
                    onError={() => setImgLoading(false)}
                />
                {ad.isBumped && (
                    <div className="absolute top-2 right-2 bg-error rounded-full p-1 shadow-sm z-10">
                        <Star className="w-3 h-3 text-white fill-white" />
                    </div>
                )}
                {/* ✅ نشان تازگی — فقط آیکون، بدون کانتینر و متن */}
                {relTime === 'امروز' && (
                    <Sparkles className="absolute top-2 left-2 w-5 h-5 text-amber-400 fill-amber-300 drop-shadow-md z-10" />
                )}

                {hasPaymentTags && (
                    <div className="absolute bottom-2 right-2 z-10">
                        <PaymentTags />
                    </div>
                )}
            </div>

            {/* بدنه — flex-1 و mt-auto یعنی باکس فروشنده همیشه کف کارت، حتی بدون سود */}
            <div className="p-3 flex-1 flex flex-col gap-1.5 min-h-0">
                <h4 className="font-bold text-[13px] text-gray-900 dark:text-gray-100 line-clamp-2 leading-snug min-h-[2.5rem]">
                    {ad.productType || ad.title}
                </h4>

                {/* ✅ برند — زیر عنوان */}
                {ad.brand?.title && (
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate -mt-1 flex items-center gap-1">
                        <Tag className="w-2.5 h-2.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        {ad.brand.title}
                    </span>
                )}

                <div className="flex items-baseline justify-between">
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">هر {unit}</span>
                    <div className="flex items-baseline gap-1">
                        {ad.unitPrice === null || ad.unitPrice === undefined ? (
                            <JoinGate />
                        ) : (
                            <>
                                <span className="text-[16px] font-bold text-primary leading-none">{formatNum(ad.unitPrice)}</span>
                                <span className="text-[10px] text-gray-500 dark:text-gray-400">تومان</span>
                            </>
                        )}
                    </div>
                </div>

                {ad.singleUnitPrice > 0 && (
                    <div className="flex items-baseline justify-between">
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">فی {unitBaseTitle}</span>
                        <div className="flex items-baseline gap-1">
                            <span className="text-[12px] font-bold text-gray-700 dark:text-gray-300">{formatNum(ad.singleUnitPrice)}</span>
                            <span className="text-[9px] text-gray-400 dark:text-gray-500">تومان</span>
                        </div>
                    </div>
                )}

                <ProfitBadge showPerWholesale />

                <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 dark:text-gray-400">
                    <span className="flex flex-1">
                        حداقل: <span className="font-semibold text-gray-700 dark:text-gray-300">{formatNum(ad.minQuantity)} {unit}</span>
                    </span>
                    <span>
                        موجودی: <span className="font-semibold text-gray-700 dark:text-gray-300">
                            {ad.availableQuantity ? `${formatNum(ad.availableQuantity)} ${unit}` : 'موجود'}
                        </span>
                    </span>
                </div>

                <div className="mt-auto pt-1.5">
                    <SellerBox />
                </div>
            </div>
        </div>
    );

    return (
        <div onClick={handleClick} className="cursor-pointer h-full">
            <div className="block md:hidden"><MobileLayout /></div>
            <div className="hidden md:block h-full"><DesktopLayout /></div>
        </div>
    );
}