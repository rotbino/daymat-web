// app/ad/[id]/components/AdSidebar.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useAdSaved } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import Image from 'next/image';
import {
    Clock, MapPin, Phone, Bookmark, Share2, ShoppingCart, Layers, Tag, User,
    ArrowUpCircle, Banknote, Eye, Timer, Loader2
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
    const { currentArm } = useSelector((state: RootState) => state.arm);
    const [isCalling, setIsCalling] = useState(false);

    const unit = ad.unit?.shortCode || 'تن';
    const expiry = timeLeft(ad.expiresAt);

    // پرداخت‌ها
    const hasCheque = ad.paymentMethods?.cheque?.length > 0;
    const hasInstallment = ad.paymentMethods?.installment?.length > 0;

    // اطلاعات فروشنده
    const seller = ad.business;
    const owner = seller?.owner;
    const ownerAvatar = owner?.avatarFile?.thumbnailPath || owner?.avatarUrl;

    const handleContact = async () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/ad/${ad.id}`);
            return;
        }
        if (isCalling) return;
        setIsCalling(true);

        try {
            const info = await apiService.ad.getContact(ad.id);
            if (window.innerWidth < 768) {
                window.location.href = `tel:${info.phone}`;
            } else {
                toast.info(`${info.businessName}\n${info.phone}`, { duration: 8000 });
                navigator.clipboard.writeText(info.phone).catch(() => {});
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
        try {
            if (isSaved) {
                await apiService.ad.unsave(ad.id);
                toast.success('حذف از ذخیره‌ها');
            } else {
                await apiService.ad.save(ad.id);
                toast.success('ذخیره شد');
            }
            onSaveToggle();
        } catch (e: any) {
            toast.error(e?.message || 'خطا');
        }
    };

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
            </div>

            {/* اطلاعات سریع ۲×۲ */}
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
                {ad.isBumped && (
                    <Pill variant="amber">
                        <ArrowUpCircle className="w-3 h-3" />نردبان
                    </Pill>
                )}
                {hasCheque && (
                    <Pill variant="amber">
                        <Banknote className="w-3 h-3" />چکی
                    </Pill>
                )}
                {hasInstallment && (
                    <Pill variant="indigo">
                        <Layers className="w-3 h-3" />اقساطی
                    </Pill>
                )}
                <Pill variant="default">
                    <Timer className="w-3 h-3" />{timeAgo(ad.updatedAt)}
                </Pill>
                <Pill variant="default">
                    <Eye className="w-3 h-3" />{formatNum(ad.viewCount)} بازدید
                </Pill>
            </div>

            {/* مینی‌کارت فروشنده */}
            {owner && (
                <div className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/60 dark:border-gray-800/60 px-4 py-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0">
                        {ownerAvatar ? (
                            <Image src={ownerAvatar} alt={owner.fullName || ''} width={40} height={40} className="object-cover w-full h-full" unoptimized />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center"><User className="w-5 h-5 text-gray-400" /></div>
                        )}
                    </div>
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
                    className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 flex-shrink-0"
                >
                    <Bookmark className={cn('w-5 h-5', isSaved ? 'fill-primary text-primary' : 'text-gray-500')} />
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
        </div>
    );
}

// Helper functions
function getTierLabel(tier: string | undefined) {
    return { gold: 'طلایی', silver: 'نقره‌ای', blue: 'برنزی' }[tier || ''] || null;
}