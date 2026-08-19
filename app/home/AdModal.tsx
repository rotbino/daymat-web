// app/home/AdModal.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import {
    Clock, MapPin, Phone, TrendingUp, X, Package, Award,
    Zap, Layers, FileText, BarChart3, Truck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdModalProps {
    ad: any;
    onClose: () => void;
    onContact: (adId: string) => void;
}

function formatNum(n: number | undefined) {
    return n?.toLocaleString('fa-IR') ?? '—';
}

function timeLeft(expiresAt: string) {
    const hours = Math.ceil(
        (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60),
    );
    if (hours <= 0) return 'منقضی شده';
    if (hours < 24) return `${hours} ساعت `;
    const days = Math.floor(hours / 24);
    return `${days} روز `;
}

/* ─── سلول اطلاعات سریع ─── */
function InfoCell({
                      icon,
                      label,
                      value,
                  }: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="rounded-xl bg-gray-50/80 dark:bg-gray-800/40 p-3">
            <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500 mb-1.5">
                {icon}
                <span className="text-[10px] font-medium">{label}</span>
            </div>
            <span className="text-sm font-bold text-gray-900 dark:text-white leading-tight block truncate">
                {value}
            </span>
        </div>
    );
}

/* ─── کارت قیمت ─── */
function PriceCard({
                       price,
                       unit,
                       expiresAt,
                   }: {
    price: number;
    unit: string;
    expiresAt: string;
}) {
    const hoursLeft = Math.ceil(
        (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60),
    );
    const isUrgent = hoursLeft > 0 && hoursLeft <= 12;
    const isExpired = hoursLeft <= 0;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent dark:from-primary/10 dark:via-primary/5 border border-primary/15 dark:border-primary/20 p-4">
            <div className="flex items-center justify-between">
                <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        قیمت نقدی
                    </span>
                    <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-2xl lg:text-3xl font-extrabold text-primary tracking-tight">
                            {formatNum(price)}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                            تومان / {unit}
                        </span>
                    </div>
                </div>
                <div
                    className={cn(
                        'flex items-center gap-1 text-[10px] font-medium px-2 py-1.5 rounded-full',
                        isExpired
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-500'
                            : isUrgent
                                ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                                : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400',
                    )}
                >
                    <Clock
                        className={cn('w-3.5 h-3.5', isUrgent && 'animate-pulse')}
                    />
                    اعتبار قیمت:
                    {timeLeft(expiresAt)}
                </div>
            </div>
        </div>
    );
}

/* ─── کارت روش پرداخت ─── */
function PaymentCard({
                         type,
                         detail,
                         price,
                         unit,
                     }: {
    type: 'cheque' | 'installment';
    detail: string;
    price: number;
    unit: string;
}) {
    const isCheque = type === 'cheque';
    const colorClasses = isCheque
        ? {
            bg: 'bg-blue-50/70 dark:bg-blue-900/15',
            border: 'border-blue-100 dark:border-blue-800/50',
            iconBg: 'bg-blue-100 dark:bg-blue-900/40',
            iconColor: 'text-blue-600 dark:text-blue-400',
            title: 'text-blue-700 dark:text-blue-300',
            sub: 'text-blue-500/80 dark:text-blue-400/70',
            priceColor: 'text-blue-700 dark:text-blue-300',
            unitColor: 'text-blue-400/70 dark:text-blue-500/70',
        }
        : {
            bg: 'bg-emerald-50/70 dark:bg-emerald-900/15',
            border: 'border-emerald-100 dark:border-emerald-800/50',
            iconBg: 'bg-emerald-100 dark:bg-emerald-900/40',
            iconColor: 'text-emerald-600 dark:text-emerald-400',
            title: 'text-emerald-700 dark:text-emerald-300',
            sub: 'text-emerald-500/80 dark:text-emerald-400/70',
            priceColor: 'text-emerald-700 dark:text-emerald-300',
            unitColor: 'text-emerald-400/70 dark:text-emerald-500/70',
        };

    const Icon = isCheque ? Zap : Layers;
    const label = isCheque ? 'پرداخت چکی' : 'پرداخت اقساطی';

    return (
        <div
            className={cn(
                'flex items-center gap-3 rounded-xl p-3 border',
                colorClasses.bg,
                colorClasses.border,
            )}
        >
            <div
                className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                    colorClasses.iconBg,
                )}
            >
                <Icon className={cn('w-4 h-4', colorClasses.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
                <span className={cn('text-xs font-semibold', colorClasses.title)}>
                    {label}
                </span>
                <p className={cn('text-[11px] mt-0.5', colorClasses.sub)}>
                    {detail}
                </p>
            </div>
            <div className="text-left shrink-0">
                <span className={cn('text-sm font-bold block', colorClasses.priceColor)}>
                    {formatNum(price)}
                </span>
                <span className={cn('text-[10px] block', colorClasses.unitColor)}>
                    تومان/{unit}
                </span>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   مودال اصلی
   ═══════════════════════════════════════════════════ */
export default function AdModal({ ad, onClose, onContact }: AdModalProps) {
    const unit = ad.unit?.shortCode || 'تن';
    const tier = ad.business?.verificationTier;
    const adImages =
        ad.files?.filter((f: any) => f.fieldKey?.startsWith('ad-image')) || [];
    const payment = ad.customFields?.paymentMethods;
    const hasImages = adImages.length > 0;

    /* سطح اعتماد */
    const tierLabel =
        tier === 'gold'
            ? 'طلایی'
            : tier === 'silver'
                ? 'نقره‌ای'
                : tier === 'blue'
                    ? 'آبی'
                    : null;
    const tierBg =
        tier === 'gold'
            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
            : tier === 'silver'
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                : tier === 'blue'
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                    : '';

    /* جزئیات پرداخت */
    const chequeDetail = payment?.cheque?.enabled
        ? `تا ${payment.cheque.maxDays} روز`
        : null;
    const installmentDetail = payment?.installment?.enabled
        ? `${payment.installment.months} ماهه${
            payment.installment.prepaymentPercent > 0
                ? ` · ${payment.installment.prepaymentPercent}٪ پیش‌پرداخت`
                : ''
        }`
        : null;

    return (
        <div className="fixed inset-0 z-50 flex items-end lg:items-center justify-center">
            {/* بک‌دراپ */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* مودال */}
            <div className="relative w-full max-w-5xl bg-white dark:bg-gray-900 z-10 max-h-[94vh] lg:max-h-[88vh] flex flex-col rounded-t-3xl lg:rounded-2xl shadow-2xl overflow-hidden">
                {/* ── هندل بار — موبایل ── */}
                <div className="flex justify-center pt-2.5 pb-0 lg:hidden">
                    <div className="w-9 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                </div>

                {/* ── هدر ── */}
                <div className="flex items-start justify-between p-4 pb-3 lg:p-5 lg:pb-4">
                    <div className="flex-1 min-w-0">
                        {/* نام محصول */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="font-extrabold text-lg lg:text-xl text-gray-900 dark:text-white">
                                {ad.productType || ad.title}
                            </h2>
                            {ad.isBumped && (
                                <span className="flex items-center gap-1 text-[10px] font-bold bg-gradient-to-l from-orange-500 to-rose-500 text-white px-2 py-0.5 rounded-md">
                                    <TrendingUp className="w-3 h-3" />
                                    آگهی ویژه
                                </span>
                            )}
                        </div>

                        {/* فروشنده */}
                        <div className="flex items-center gap-2 mt-1.5">
                            <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-primary">
                                    {(ad.business?.name || '—').charAt(0)}
                                </span>
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                {ad.business?.name || 'نامشخص'}
                            </span>
                            {tier && tier !== 'none' && tierLabel && (
                                <span
                                    className={cn(
                                        'text-[10px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-0.5 shrink-0',
                                        tierBg,
                                    )}
                                >
                                    <Award className="w-3 h-3 -mt-px" />
                                    {tierLabel}
                                </span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors -mt-0.5 -mr-0.5 shrink-0"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* ── محتوای اسکرول‌شونده ── */}
                <div className="overflow-y-auto flex-1 px-4 lg:px-5 pb-4 space-y-4">
                    {/* ──── بخش اصلی: تصویر + قیمت/اطلاعات ──── */}
                    <div
                        className={cn(
                            hasImages && 'lg:grid lg:grid-cols-5 lg:gap-5',
                        )}
                    >
                        {/* گالری تصاویر */}
                        {hasImages && (
                            <div className="lg:col-span-2 flex gap-2.5 overflow-x-auto scrollbar-hide lg:overflow-visible lg:grid lg:grid-cols-1 lg:gap-2.5 pb-1 lg:pb-0">
                                {adImages.map((file: any, idx: number) => (
                                    <div
                                        key={file.id}
                                        className="relative flex-shrink-0 w-56 sm:w-64 lg:w-full h-48 sm:h-56 lg:h-64 rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800"
                                    >
                                        <Image
                                            src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${file.id}`}
                                            alt={ad.productType || ad.title}
                                            fill
                                            className="object-contain p-3"
                                            sizes="(max-width:640px) 224px, (max-width:1024px) 256px, 384px"
                                            unoptimized
                                        />
                                        {adImages.length > 1 && (
                                            <div className="absolute bottom-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded-md backdrop-blur-sm">
                                                {idx + 1}/{adImages.length}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* ستون اطلاعات */}
                        <div
                            className={cn(
                                'space-y-3',
                                hasImages && 'lg:col-span-3 mt-4 lg:mt-0',
                            )}
                        >
                            {/* قیمت */}
                            <PriceCard
                                price={ad.unitPrice}
                                unit={unit}
                                expiresAt={ad.expiresAt}
                            />

                            {/* روش‌های پرداخت */}
                            {chequeDetail && (
                                <PaymentCard
                                    type="cheque"
                                    detail={chequeDetail}
                                    price={payment.cheque.price}
                                    unit={unit}
                                />
                            )}
                            {installmentDetail && (
                                <PaymentCard
                                    type="installment"
                                    detail={installmentDetail}
                                    price={payment.installment.price}
                                    unit={unit}
                                />
                            )}

                            {/* اطلاعات سریع */}
                            <div className="grid grid-cols-2 gap-2">
                                <InfoCell
                                    icon={<Package className="w-4 h-4" />}
                                    label="حداقل سفارش"
                                    value={`${formatNum(ad.minQuantity)} ${unit}`}
                                />
                                <InfoCell
                                    icon={<Layers className="w-4 h-4" />}
                                    label="موجودی فعلی"
                                    value={
                                        ad.availableQuantity
                                            ? `${formatNum(ad.availableQuantity)} ${unit}`
                                            : 'نامشخص'
                                    }
                                />
                                <InfoCell
                                    icon={<MapPin className="w-4 h-4" />}
                                    label="مکان کالا"
                                    value={ad.city || 'نامشخص'}
                                />
                                <InfoCell
                                    icon={<Truck className="w-4 h-4" />}
                                    label="عنوان"
                                    value={ad.productType || ad.title}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ──── جداکننده ──── */}
                    <div className="h-px bg-gray-100 dark:bg-gray-800" />

                    {/* ──── مشخصات فنی ──── */}
                    {ad.customFields?.specs &&
                        Object.keys(ad.customFields.specs).length > 0 && (
                            <div>
                                <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-2.5">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    مشخصات فنی
                                </h4>
                                <div className="rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 overflow-hidden">
                                    {Object.entries(ad.customFields.specs).map(
                                        ([key, value], idx, arr) => (
                                            <div
                                                key={key}
                                                className={cn(
                                                    'flex items-center justify-between px-4 py-2.5 text-sm',
                                                    idx !== arr.length - 1 &&
                                                    'border-b border-gray-100 dark:border-gray-800',
                                                )}
                                            >
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    {key}
                                                </span>
                                                <span className="font-semibold text-gray-900 dark:text-white">
                                                    {value as string}
                                                </span>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </div>
                        )}

                    {/* ──── توضیحات فروشنده ──── */}
                    {ad.description && (
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-2.5">
                                <FileText className="w-4 h-4 text-gray-400" />
                                توضیحات فروشنده
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50/80 dark:bg-gray-800/40 rounded-2xl p-4 leading-7">
                                {ad.description}
                            </p>
                        </div>
                    )}

                    {/* ──── تاریخچه قیمت ──── */}
                    {ad.priceHistory && ad.priceHistory.length > 0 && (
                        <div>
                            <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-2.5">
                                <BarChart3 className="w-4 h-4 text-gray-400" />
                                تاریخچه قیمت
                            </h4>
                            <div className="rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 overflow-hidden">
                                {ad.priceHistory.map(
                                    (item: any, idx: number, arr: any[]) => (
                                        <div
                                            key={idx}
                                            className={cn(
                                                'flex items-center justify-between px-4 py-2.5 text-sm',
                                                idx !== arr.length - 1 &&
                                                'border-b border-gray-100 dark:border-gray-800',
                                            )}
                                        >
                                            <span className="text-gray-500 dark:text-gray-400">
                                                {new Date(
                                                    item.updatedAt,
                                                ).toLocaleDateString('fa-IR')}
                                            </span>
                                            <span className="font-semibold text-gray-900 dark:text-white">
                                                {formatNum(item.price)} تومان
                                            </span>
                                        </div>
                                    ),
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── فوتر — دکمه تماس ── */}
                <div className="p-4 lg:p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
                    <button
                        onClick={() => {
                            onClose();
                            onContact(ad.id);
                        }}
                        className="w-full flex items-center justify-center gap-2.5 bg-primary hover:bg-primary/90 text-on-primary py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] shadow-lg shadow-primary/25"
                    >
                        <Phone className="w-5 h-5" />
                        تماس با فروشنده
                    </button>
                </div>
            </div>
        </div>
    );
}