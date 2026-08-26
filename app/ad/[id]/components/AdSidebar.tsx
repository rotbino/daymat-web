// app/ad/[id]/components/AdSidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import Image from 'next/image';
import {
    Clock, MapPin, Phone, Bookmark, Share2, ShoppingCart, Layers, Tag, User,
    ArrowUpCircle, Banknote, Eye, Timer, Loader2, X, Maximize2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNum, timeLeft, timeAgo, Pill } from './shared';

interface AdSidebarProps {
    ad: any;
    isOwner: boolean;
    isSaved: boolean;
    onSaveToggle: () => void;
}

export default function AdSidebar({ ad, isOwner, isSaved, onSaveToggle }: AdSidebarProps) {
    const router = useRouter();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [isCalling, setIsCalling] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showFullImage, setShowFullImage] = useState(false);

    // ✅ عکس‌ها
    const ownerAvatarThumb = ad?.business?.owner?.avatarFile?.thumbnailPath || ad?.business?.owner?.avatarUrl;
    const ownerAvatarFull = ad?.business?.owner?.avatarFile?.path || ownerAvatarThumb; // ✅ عکس اصلی

    const unit = ad?.unit?.shortCode || 'تن';
    const expiry = timeLeft(ad?.expiresAt);

    const hasCheque = ad?.paymentMethods?.cheque?.length > 0;
    const hasInstallment = ad?.paymentMethods?.installment?.length > 0;

    const seller = ad?.business;
    const owner = seller?.owner;

    const handleContact = async () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/ad/${ad.id}`);
            return;
        }
        if (isCalling) return;
        setIsCalling(true);

        try {
            const info = await apiService.ad.getContact(ad.id);
            const phoneToUse = info.ownerPhone || info.phone;
            if (!phoneToUse) {
                toast.error('شماره تماس برای این آگهی ثبت نشده است.');
                return;
            }
            if (window.innerWidth < 768) {
                window.location.href = `tel:${phoneToUse}`;
            } else {
                toast.info(`${info.businessName}\n${phoneToUse}`, { duration: 8000 });
                navigator.clipboard.writeText(phoneToUse).catch(() => {});
            }
        } catch (e: any) {
            toast.error(e?.message || 'خطا');
        } finally {
            setIsCalling(false);
        }
    };

    const handleShare = async () => {
        try {
            const url = window.location.href;
            if (navigator.share) {
                await navigator.share({ title: ad.productType || ad.title, url });
            } else {
                await navigator.clipboard.writeText(url);
                toast.success('لینک کپی شد');
            }
        } catch (e: any) {
            if (e?.name !== 'AbortError') console.error(e);
        }
    };

    const handleSave = async () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/ad/${ad.id}`);
            return;
        }
        if (isSaving) return;
        setIsSaving(true);

        try {
            if (!ad?.id) {
                toast.error('شناسه آگهی نامعتبر است');
                return;
            }

            if (isSaved) {
                await apiService.ad.unsave(ad.id);
                toast.success('حذف از ذخیره‌ها');
            } else {
                await apiService.ad.save(ad.id);
                toast.success('ذخیره شد');
            }
            onSaveToggle();
        } catch (e: any) {
            const errorMessage = e?.data?.message || e?.message || 'خطا در ذخیره آگهی';
            toast.error(errorMessage);
        } finally {
            setIsSaving(false);
        }
    };

    if (!ad) {
        return null;
    }

    return (
        <div className="space-y-3.5">
            {/* کارت قیمت */}
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 border-t-[3px] border-t-primary p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">قیمت هر {unit}</p>
                    <span className={cn(
                        'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full',
                        expiry.urgent
                            ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                            : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                    )}>
                        <Clock className="w-3 h-3" />
                        {expiry.text} مانده
                    </span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-1">
                    <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
                        {formatNum(ad.unitPrice)}
                    </span>
                    <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">تومان</span>
                </div>
                {(ad.singleUnitPrice > 0 || ad.consumerPrice > 0) && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 space-y-1.5">
                        {ad.singleUnitPrice > 0 && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                    <ShoppingCart className="w-3 h-3 text-primary/60" />
                                    قیمت تکی عمده:
                                </span>
                                <span className="font-bold text-gray-700 dark:text-gray-300">
                                    {formatNum(ad.singleUnitPrice)}/{ad.unitBaseTitle || 'واحد'}
                                </span>
                            </div>
                        )}
                        {ad.consumerPrice > 0 && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-400 dark:text-gray-500">🛒 مصرف‌کننده:</span>
                                <span className="font-bold text-gray-700 dark:text-gray-300">
                                    {formatNum(ad.consumerPrice)}/{ad.unitBaseTitle || 'واحد'}
                                </span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* اطلاعات سریع */}
            <div className="grid grid-cols-2 gap-2">
                {[
                    { icon: <ShoppingCart className="w-4 h-4 text-primary/60" />, label: 'حداقل سفارش', value: `${formatNum(ad.minQuantity)} ${unit}` },
                    { icon: <Layers className="w-4 h-4 text-primary/60" />, label: 'موجودی', value: ad.availableQuantity ? `${formatNum(ad.availableQuantity)} ${unit}` : 'نامشخص' },
                    { icon: <MapPin className="w-4 h-4 text-primary/60" />, label: 'محل تحویل', value: ad.city || 'نامشخص' },
                    { icon: <Tag className="w-4 h-4 text-primary/60" />, label: 'دسته‌بندی', value: ad.category?.title || '—' },
                ].map((item) => (
                    <div key={item.label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/60 dark:border-gray-800/60 px-3.5 py-3">
                        <div className="flex items-center gap-1.5 mb-1">
                            {item.icon}
                            <span className="text-[11px] text-gray-400 dark:text-gray-500">{item.label}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{item.value}</p>
                    </div>
                ))}
            </div>

            {/* برچسب‌ها */}
            <div className="flex flex-wrap gap-2 px-0.5">
                {ad.isBumped && <Pill variant="amber"><ArrowUpCircle className="w-3 h-3" />نردبان</Pill>}
                {hasCheque && <Pill variant="amber"><Banknote className="w-3 h-3" />چکی</Pill>}
                {hasInstallment && <Pill variant="indigo"><Layers className="w-3 h-3" />اقساطی</Pill>}
                <Pill variant="default"><Timer className="w-3 h-3" />{timeAgo(ad.updatedAt)}</Pill>
                <Pill variant="default"><Eye className="w-3 h-3" />{formatNum(ad.viewCount)} بازدید</Pill>
            </div>

            {/* فروشنده */}
            {owner && (
                <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/60 dark:border-gray-800/60 px-4 py-3">
                    <button
                        onClick={() => setShowFullImage(true)}
                        className="relative w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 group"
                        title="مشاهده عکس در اندازه بزرگ"
                    >
                        {ownerAvatarThumb ? (
                            <>
                                <Image
                                    src={ownerAvatarThumb}
                                    alt={owner.fullName || ''}
                                    width={64}
                                    height={64}
                                    className="object-cover w-full h-full group-hover:opacity-80 transition-opacity"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <Maximize2 className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <User className="w-6 h-6 text-gray-400" />
                            </div>
                        )}
                    </button>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{owner.fullName}</p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{seller?.name}</p>
                    </div>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40">
                        {getTierLabel(seller?.verificationTier)}
                    </span>
                </div>
            )}

            {/* دکمه‌ها */}
            <div className="flex gap-2">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 flex-shrink-0 disabled:opacity-50"
                >
                    {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    ) : (
                        <Bookmark className={cn('w-5 h-5', isSaved ? 'fill-primary text-primary' : 'text-gray-500')} />
                    )}
                </button>
                <button
                    onClick={handleShare}
                    className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 flex-shrink-0"
                >
                    <Share2 className="w-5 h-5 text-gray-500" />
                </button>
                <button
                    onClick={handleContact}
                    disabled={isCalling}
                    className="flex-1 h-12 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all duration-200"
                >
                    {isCalling ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <><Phone className="w-5 h-5" />تماس با فروشنده</>
                    )}
                </button>
            </div>

            {/* ✅ مودال عکس بزرگ - استفاده از عکس اصلی */}
            {showFullImage && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 cursor-zoom-out"
                    onClick={() => setShowFullImage(false)}
                >
                    <div className="relative max-w-3xl w-full max-h-[90vh] flex items-center justify-center">
                        {ownerAvatarFull ? (
                            <Image
                                src={ownerAvatarFull}
                                alt={owner.fullName || ''}
                                width={800}
                                height={800}
                                className="object-contain max-h-[85vh] w-auto rounded-xl shadow-2xl"
                                unoptimized
                            />
                        ) : (
                            <div className="w-64 h-64 bg-gray-800 rounded-xl flex items-center justify-center">
                                <User className="w-24 h-24 text-gray-600" />
                            </div>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowFullImage(false);
                            }}
                            className="absolute -top-12 left-0 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function getTierLabel(tier: string | undefined) {
    return { gold: 'طلایی', silver: 'نقره‌ای', blue: 'برنزی' }[tier || ''] || null;
}