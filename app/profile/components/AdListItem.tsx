// app/profile/components/AdListItem.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    Package, Pencil, Clock, TrendingUp, Power,
    AlertCircle, RefreshCw, Trash2, AlertTriangle,
    MoreVertical, Copy, X, EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api/apiService';
import { NumberInput } from "@/components/common";

import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuPortal,
} from '@radix-ui/react-dropdown-menu';

interface AdListItemProps {
    ad: any;
    currentTab: 'active' | 'pending' | 'archived';
    armConfig?: any;
    onRefreshClick: (ad: any) => void;
    onEditClick: (ad: any) => void;
    onRepublishClick: (ad: any) => void;
    onToggleActive?: (ad: any) => void;
    onDeleteClick?: (ad: any) => void;
    maxActiveAds?: number;
    creditBalance?: number;
    bumpCost?: number;
    reallyActiveCount?: number;
    onCopySuccess?: () => void;
    onRefresh: () => void;
    onDeleteRequest?: (ad: any) => void;
}

function timeLeft(expiresAt: string) {
    const hours = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60));
    if (hours <= 0) return 'منقضی';
    if (hours < 24) return `${hours} ساعت`;
    const days = Math.floor(hours / 24);
    return `${days} روز`;
}

function isAdExpired(ad: any): boolean {
    if (ad.status === 'expired') return true;
    return new Date(ad.expiresAt).getTime() < Date.now();
}

export function AdListItem({
                               ad, currentTab, armConfig,
                               onRefreshClick, onEditClick, onRepublishClick,
                               onToggleActive, onDeleteClick,
                               maxActiveAds = 5, creditBalance = 0, bumpCost = 10,
                               reallyActiveCount = 0, onCopySuccess, onRefresh, onDeleteRequest,
                           }: AdListItemProps) {
    const router = useRouter();
    const [copyModalOpen, setCopyModalOpen] = useState(false);
    const [copyPrice, setCopyPrice] = useState(ad.unitPrice || 0);
    const [copyMinQty, setCopyMinQty] = useState(ad.minQuantity || 0);
    const [copying, setCopying] = useState(false);

    const categorySelections = armConfig?.categorySelections || [];
    const selection = categorySelections.find((s: any) => s.categoryId === ad.categoryId);
    const overrideUnitTitle = selection?.overrideUnitTitle;
    const unit = overrideUnitTitle || ad.unit?.title || ad.unit?.shortCode || 'تن';

    // ✅ تغییر اصلی: استفاده از thumbnailPath یا path از فایل
    const firstFile = ad.files?.[0];
    const imageUrl = firstFile?.thumbnailPath || firstFile?.path || '/images/no_product_image.jpg';

    const category = ad.category?.title;
    const productType = ad.productType || ad.title;
    const remaining = timeLeft(ad.expiresAt);
    const expired = isAdExpired(ad);
    const isActive = ad.status === 'active' && !expired;
    const isInactive = ad.status === 'inactive' && !expired;
    const isPending = ad.status === 'pending';
    const isRejected = ad.status === 'rejected';

    const hasFreeSlot = reallyActiveCount < maxActiveAds;
    const hasEnoughCredit = creditBalance >= bumpCost;
    const canActivate = hasFreeSlot || hasEnoughCredit;

    // ═══════════════════ منوی سه‌نقطه با Radix DropdownMenu ═══════════════════
    const moreMenu = (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="p-1.5 border border-outline dark:border-gray-600 text-on-surface dark:text-gray-300 rounded-md hover:bg-surface-container-low transition-colors">
                    <MoreVertical className="w-4 h-4" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent
                    align="end"
                    sideOffset={4}
                    className=" min-w-[110px] text-xs py-2.5  bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg p-0.5"
                >
                    <DropdownMenuItem
                        onClick={() => setCopyModalOpen(true)}
                        className="rounded-[4px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 px-3 py-1.5"
                    >
                        <div dir={"rtl"} className={"flex flex-1 "}>
                            <Copy className="w-3.5 h-3.5 mx-2" />
                            <span>کپی</span>
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                        onClick={() => onDeleteRequest?.(ad)}
                        className="text-red-600 rounded-[4px] cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5"
                    >
                        <div dir={"rtl"} className={"flex flex-1 mt-2"}>
                            <Trash2 className="w-3.5 h-3.5 mx-2" />
                            <span>حذف</span>
                        </div>
                    </DropdownMenuItem>

                    {isActive && currentTab === 'active' && (
                        <DropdownMenuItem
                            onClick={() => onToggleActive?.(ad)}
                            className="text-amber-600 rounded-[4px] cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-900/20 px-3"
                        >
                            <div dir={"rtl"} className={"flex flex-1  mt-2"}>
                                <EyeOff className="w-3.5 h-3.5 mx-2" />
                                <span>آرشیو</span>
                            </div>
                        </DropdownMenuItem>
                    )}
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    );

    // ═══════════════════ UI برای حالت‌های مختلف ═══════════════════
    if (isPending) {
        return (
            <div className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-200/60 dark:border-blue-800/30 rounded-lg p-4">
                <Link href={`/ad/${ad.id}`}>
                    <div className="flex items-start gap-3 cursor-pointer">
                        <div className="relative w-14 h-14 rounded-md overflow-hidden bg-surface-container-high dark:bg-gray-800 flex-shrink-0">
                            <Image
                                src={imageUrl}
                                alt={productType}
                                fill
                                className="object-contain p-1"
                                sizes="56px"
                                unoptimized={imageUrl.startsWith('https://daymatfilles.s3')}
                            />
                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-blue-700 bg-blue-100/80 px-1.5 py-0.5 rounded">در انتظار تایید</span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm sm:text-base text-on-surface dark:text-gray-100 truncate">{productType}</h4>
                                {category && <span className="text-[10px] bg-surface-container-high dark:bg-gray-800 text-on-surface-variant dark:text-gray-400 px-1.5 py-0.5 rounded-full">{category}</span>}
                            </div>
                            <div className="flex items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-on-surface-variant dark:text-gray-400 flex-wrap">
                                <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5 text-primary/70" />حداقل {ad.minQuantity} {unit}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{remaining}</span>
                                <span className="font-bold text-sm ml-auto text-primary">{ad.unitPrice.toLocaleString()}<span className="text-[10px] font-normal text-on-surface-variant mr-1">ت/{unit}</span></span>
                            </div>
                        </div>
                    </div>
                </Link>
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-outline-variant/10 dark:border-gray-800">
                    <button onClick={() => router.push(`/ad/reedit/${ad.id}`)} className="p-1.5 border border-outline dark:border-gray-600 text-on-surface dark:text-gray-300 rounded-md hover:bg-surface-container-low transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => onDeleteRequest?.(ad)} className="p-1.5 border border-outline dark:border-gray-600 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="حذف آگهی">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    }

    if (isRejected) {
        return (
            <div className="bg-red-50/50 dark:bg-red-900/10 border-red-200/60 dark:border-red-800/30 rounded-lg p-4">
                <Link href={`/ad/${ad.id}`}>
                    <div className="flex items-start gap-3 cursor-pointer">
                        <div className="relative w-14 h-14 rounded-md overflow-hidden bg-surface-container-high dark:bg-gray-800 flex-shrink-0">
                            <Image
                                src={imageUrl}
                                alt={productType}
                                fill
                                className="object-contain p-1"
                                sizes="56px"
                                unoptimized={imageUrl.startsWith('https://daymatfilles.s3')}
                            />
                            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                                <span className="text-[8px] font-bold text-red-700 bg-red-100/80 px-1.5 py-0.5 rounded">در انتظار اصلاح</span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm sm:text-base text-on-surface dark:text-gray-100 truncate">{productType}</h4>
                                {category && <span className="text-[10px] bg-surface-container-high dark:bg-gray-800 text-on-surface-variant dark:text-gray-400 px-1.5 py-0.5 rounded-full">{category}</span>}
                                <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" />رد شده</span>
                            </div>
                            <div className="flex items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-on-surface-variant dark:text-gray-400 flex-wrap">
                                <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5 text-primary/70" />حداقل {ad.minQuantity} {unit}</span>
                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{remaining}</span>
                                <span className="font-bold text-sm ml-auto text-primary">{ad.unitPrice.toLocaleString()}<span className="text-[10px] font-normal text-on-surface-variant mr-1">ت/{unit}</span></span>
                            </div>
                            {ad.rejectionReason && (
                                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-md text-xs text-red-700 dark:text-red-300 flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                                    <div><span className="font-medium">دلیل رد:</span><span className="mr-1">{ad.rejectionReason}</span></div>
                                </div>
                            )}
                        </div>
                    </div>
                </Link>
                <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-outline-variant/10 dark:border-gray-800">
                    <button onClick={() => router.push(`/ad/reedit/${ad.id}`)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] rounded-md font-medium transition-colors flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />رفع مشکل
                    </button>
                    <button onClick={() => onDeleteRequest?.(ad)} className="p-1.5 border border-outline dark:border-gray-600 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors" title="حذف آگهی">
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        );
    }

    // کارت اصلی
    const statusBadge = (
        <div className="absolute top-2 left-2 flex gap-1">
            {currentTab === 'archived' && (expired || ad.status === 'expired') && (
                <span className="text-[9px] bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full border border-red-200 dark:border-red-800/30">منقضی</span>
            )}
            {currentTab === 'archived' && ad.status === 'inactive' && !expired && (
                <span className="text-[9px] bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">غیرفعال</span>
            )}
        </div>
    );

    return (
        <div className={cn(
            "relative border rounded-lg p-4 transition-all",
            isActive ? "bg-white dark:bg-gray-900 border-outline-variant/30 dark:border-gray-800 hover:shadow-sm" :
                isInactive ? "bg-amber-50/50 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/30" :
                    "bg-gray-50/80 dark:bg-gray-800/40 border-gray-200/60 dark:border-gray-700/60 opacity-70"
        )}>
            {statusBadge}
            <Link href={`/ad/${ad.id}`}>
                <div className="flex items-start gap-3 cursor-pointer">
                    <div className="relative w-14 h-14 rounded-md overflow-hidden bg-surface-container-high dark:bg-gray-800 flex-shrink-0">
                        <Image
                            src={imageUrl}
                            alt={productType}
                            fill
                            className="object-contain p-1"
                            sizes="56px"
                            unoptimized={imageUrl.startsWith('https://daymatfilles.s3')}
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className={cn("font-semibold text-sm sm:text-base truncate", expired ? "text-gray-500 dark:text-gray-400" : "text-on-surface dark:text-gray-100")}>{productType}</h4>
                            {category && <span className="text-[10px] bg-surface-container-high dark:bg-gray-800 text-on-surface-variant dark:text-gray-400 px-1.5 py-0.5 rounded-full">{category}</span>}
                            {ad.isBumped && !expired && <TrendingUp className="w-3.5 h-3.5 text-red-500 dark:text-red-400 flex-shrink-0" />}
                        </div>
                        <div className="flex items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-on-surface-variant dark:text-gray-400 flex-wrap">
                            <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5 text-primary/70" />حداقل {ad.minQuantity} {unit}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{expired ? 'منقضی شده' : remaining}</span>
                            <span className={cn("font-bold text-sm ml-auto", expired ? "text-gray-400 dark:text-gray-500" : "text-primary")}>{ad.unitPrice.toLocaleString()}<span className="text-[10px] font-normal text-on-surface-variant mr-1">ت/{unit}</span></span>
                        </div>
                    </div>
                </div>
            </Link>

            {/* اکشن‌ها */}
            <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-outline-variant/10 dark:border-gray-800">
                {isActive && (
                    <>
                        <button onClick={() => { onRefreshClick(ad); onRefresh(); }} className="px-3 py-1.5 bg-[#1e293b] dark:bg-[#e2e8f0] text-white dark:text-[#0f172a] text-[11px] rounded-md font-medium hover:opacity-80 transition-opacity flex items-center gap-1">
                            <RefreshCw className="w-3 h-3" />تازه‌سازی
                        </button>
                        <button onClick={() => onEditClick(ad)} className="p-1.5 border border-outline dark:border-gray-600 text-on-surface dark:text-gray-300 rounded-md hover:bg-surface-container-low transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {moreMenu}
                    </>
                )}
                {(isInactive || expired) && (
                    <>
                        <button onClick={() => { expired ? onRepublishClick(ad) : onToggleActive?.(ad); onRefresh(); }} disabled={!canActivate}
                                className={cn("px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1", canActivate ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed")}>
                            <Power className="w-3 h-3" />فعال کردن
                        </button>
                        <button onClick={() => onEditClick(ad)} className="p-1.5 border border-outline dark:border-gray-600 text-on-surface dark:text-gray-300 rounded-md hover:bg-surface-container-low transition-colors">
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                        {moreMenu}
                    </>
                )}
            </div>

            {(isInactive || expired) && !canActivate && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 rounded-md text-[10px] text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>اعتبار کافی ندارید. لطفاً <button onClick={() => router.push('/credit/purchase')} className="text-primary underline font-medium hover:no-underline">اعتبار خریداری کنید</button>.</span>
                </div>
            )}
            {(isInactive || expired) && hasEnoughCredit && !hasFreeSlot && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 rounded-md text-[10px] text-blue-700 dark:text-blue-300 flex items-center gap-2 flex-wrap">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>سهمیه فعال پر است. <span className="font-bold">{bumpCost}</span> اعتبار کسر خواهد شد.</span>
                </div>
            )}

            {/* مودال کپی (بدون تغییر) */}
            {copyModalOpen && (
                <div className="fixed inset-0 z-[50] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">کپی آگهی</h3>
                            <button onClick={() => setCopyModalOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">قیمت (تومان)</label>
                                <NumberInput value={copyPrice} onChange={(val) => setCopyPrice(val || 0)} unit="تومان" className="h-10 bg-surface-container-lowest border border-gray-300 dark:border-gray-700 rounded-lg px-3 text-sm" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">حداقل خرید ({unit})</label>
                                <NumberInput value={copyMinQty} onChange={(val) => setCopyMinQty(val || 0)} unit={unit} className="h-10 bg-surface-container-lowest border border-gray-300 dark:border-gray-700 rounded-lg px-3 text-sm" />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setCopyModalOpen(false)} className="flex-1 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl text-sm">انصراف</button>
                            <button onClick={async () => {
                                setCopying(true);
                                try {
                                    const result = await apiService.ad.create({
                                        armSlug: ad.arm?.slug || 'barton', categoryId: ad.categoryId, unitId: ad.unitId, title: ad.title,
                                        productType: ad.productType, unitPrice: copyPrice, minQuantity: copyMinQty,
                                        availableQuantity: ad.availableQuantity, city: ad.city, cityCode: ad.cityCode,
                                        provinceCode: ad.provinceCode, validityHours: ad.validityHours, isAnonymous: ad.isAnonymous,
                                        description: ad.description,
                                    });
                                    setCopyModalOpen(false);
                                    toast.success(result?.requiresApproval ? 'آگهی ثبت شد. به زودی تایید می‌شود.' : 'آگهی جدید با موفقیت ثبت شد.');
                                    onCopySuccess?.(); onRefresh();
                                } catch (error: any) {
                                    toast.error(error?.data?.errorCode === 'DUPLICATE_MIN_QUANTITY' ? error?.data?.message : error?.message || 'خطا در کپی آگهی');
                                } finally { setCopying(false); }
                            }} disabled={copying || copyPrice <= 0 || copyMinQty <= 0}
                                    className="flex-1 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                                {copying ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" /> : 'کپی و ثبت'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}