// app/profile/components/BusinessAdsList.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    PlusCircle, Package, ClipboardList, AlertCircle, X, Archive, Trash2,
    ChevronRight, ChevronLeft, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useBulkUpdateAd, useBusinessAds } from '@/lib/api/apiHooks';
import { useQueryClient } from '@tanstack/react-query';
import { NumberInput } from "@/components/common";
import { toast } from 'sonner';
import { AdListItem } from './AdListItem';

interface BusinessAdsListProps {
    businessId: string;
    maxActiveAds?: number;
    creditBalance?: number;
    bumpCost?: number;
    onRefreshClick: (ad: any) => void;
    onEditClick: (ad: any) => void;
    onRepublishClick: (ad: any) => void;
    onToggleActive?: (ad: any) => void;
    onDeleteClick?: (ad: any) => void;
}

const CURRENCY_MAP: Record<string, string> = {
    IRR: 'تومان', IRR1: 'ریال', USD: 'دلار', EUR: 'یورو',
};

type TabType = 'active' | 'pending' | 'archived';
const PAGE_SIZE = 10;

export default function BusinessAdsList({
                                            businessId,
                                            maxActiveAds = 5,
                                            creditBalance = 0,
                                            bumpCost = 10,
                                            onRefreshClick,
                                            onEditClick,
                                            onRepublishClick,
                                            onToggleActive,
                                            onDeleteClick,
                                        }: BusinessAdsListProps) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const bulkUpdateMutation = useBulkUpdateAd();

    const armConfig = useSelector((state: RootState) => state.arm.currentArm?.config) as any || {};
    const currency = armConfig?.economy?.currency || 'IRR';
    const currencyUnit = CURRENCY_MAP[currency] || currency || 'تومان';

    const [activeTab, setActiveTab] = useState<TabType>('active');
    const [currentPage, setCurrentPage] = useState(1);

    // ✅ map تب به status فیلتر
    const statusFilter = activeTab === 'active' ? 'active' :
        activeTab === 'pending' ? 'pending' :
            'archived';

    // ✅ هوک با status فیلتر
    const { data: adsData, isLoading: adsLoading, refetch: refetchAds } = useBusinessAds(
        businessId,
        currentPage,
        PAGE_SIZE,
        statusFilter,
    );

    const ads = adsData?.ads || [];
    const pagination = adsData?.pagination || { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 1 };

    const refreshAds = () => {
        refetchAds();
        queryClient.invalidateQueries({ queryKey: ['business', businessId] });
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        setCurrentPage(1);
    };

    const totalAds = pagination.total || 0;
    const totalPages = pagination.totalPages || 1;

    const [groupEditOpen, setGroupEditOpen] = useState(false);
    const [priceChanges, setPriceChanges] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ ad: any; open: boolean }>({ ad: null, open: false });
    const [deactivateConfirm, setDeactivateConfirm] = useState<{ ad: any; open: boolean }>({ ad: null, open: false });

    const openGroupEdit = () => {
        if (activeTab !== 'active') {
            toast.info('ویرایش گروهی فقط برای آگهی‌های فعال امکان‌پذیر است.');
            return;
        }
        const initial: Record<string, string> = {};
        ads.forEach(ad => { initial[ad.id] = ad.unitPrice?.toString() || ''; });
        setPriceChanges(initial);
        setGroupEditOpen(true);
    };

    const handleGroupSave = async () => {
        setSaving(true);
        try {
            const updates = ads
                .filter(ad => {
                    const newPrice = priceChanges[ad.id]?.trim();
                    return newPrice && parseFloat(newPrice) !== ad.unitPrice;
                })
                .map(ad => ({
                    id: ad.id,
                    unitPrice: parseFloat(priceChanges[ad.id]),
                }));

            if (updates.length === 0) {
                toast.info('قیمتی تغییر نکرده است.');
                setGroupEditOpen(false);
                return;
            }

            await bulkUpdateMutation.mutateAsync({ updates });
            refreshAds();
            setGroupEditOpen(false);
        } catch (error: any) {
            toast.error(error?.message || 'خطا در به‌روزرسانی قیمت‌ها');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteConfirm = (ad: any) => {
        setDeleteConfirm({ ad, open: true });
    };

    const handleDelete = async () => {
        if (!deleteConfirm.ad) return;
        try {
            onDeleteClick?.(deleteConfirm.ad);
            refreshAds();
            setDeleteConfirm({ ad: null, open: false });
        } catch (error: any) {
            toast.error(error?.message || 'خطا در حذف آگهی');
        }
    };

    const handleDeactivateConfirm = (ad: any) => {
        setDeactivateConfirm({ ad, open: true });
    };

    const handleDeactivate = () => {
        if (!deactivateConfirm.ad) return;
        onToggleActive?.(deactivateConfirm.ad);
        refreshAds();
        setDeactivateConfirm({ ad: null, open: false });
    };

    return (
        <>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/30 dark:border-gray-800 shadow-sm overflow-hidden">
                {/* هدر ابزار */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0 px-4 py-3 border-b border-outline-variant/20 dark:border-gray-700 bg-surface-container-lowest/50 dark:bg-gray-800/50">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[12px] font-semibold text-on-surface dark:text-gray-200 flex items-center gap-1.5">
                            آگهی‌های این کسب‌وکار
                            <span className="text-[10px] font-normal text-on-surface-variant/60">
                                ({totalAds.toLocaleString('fa-IR')} آگهی)
                            </span>
                        </h3>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
                        {activeTab === 'active' && ads.length > 0 && (
                            <button onClick={openGroupEdit} className="h-7 sm:h-8 px-2 sm:px-3 bg-primary text-on-primary text-[10px] sm:text-xs rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1 font-medium shadow-sm whitespace-nowrap">
                                <ClipboardList className="w-3.5 h-3.5" />
                                <span>آپدیت گروهی</span>
                            </button>
                        )}
                        <button onClick={() => router.push('/ad/create')} className="h-7 sm:h-8 px-2 sm:px-3 bg-gray-900 dark:bg-gray-200 text-white dark:text-gray-900 text-[10px] sm:text-xs rounded-md hover:bg-gray-800 dark:hover:bg-gray-300 transition-colors flex items-center gap-1 font-medium shadow-sm whitespace-nowrap">
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>آگهی جدید</span>
                        </button>
                    </div>
                </div>

                {/* تب‌ها - همیشه نمایش داده می‌شوند */}
                <div className="flex border-b border-outline-variant/30 dark:border-gray-700 overflow-x-auto px-4">
                    <button
                        onClick={() => handleTabChange('active')}
                        className={cn(
                            "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                            activeTab === 'active'
                                ? "border-primary text-primary"
                                : "border-transparent text-on-surface-variant hover:text-on-surface dark:hover:text-gray-300"
                        )}
                    >
                        فعال
                    </button>

                    <button
                        onClick={() => handleTabChange('archived')}
                        className={cn(
                            "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                            activeTab === 'archived'
                                ? "border-red-500 text-red-600 dark:text-red-400"
                                : "border-transparent text-red-500/80 dark:text-red-400/70 hover:text-red-600 dark:hover:text-red-300"
                        )}
                    >
                        <Archive className="w-3.5 h-3.5 inline-block ml-1" />
                        آرشیو
                    </button>

                    <button
                        onClick={() => handleTabChange('pending')}
                        className={cn(
                            "px-4 py-2.5 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                            activeTab === 'pending'
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-on-surface-variant hover:text-on-surface dark:hover:text-gray-300"
                        )}
                    >
                        در انتظار
                    </button>
                </div>

                {/* محتوای تب */}
                <div className="p-4 space-y-2">
                    {adsLoading && currentPage === 1 ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : ads.length === 0 ? (
                        /* ✅ پیام خالی داخل تب */
                        <div className="text-center py-8 text-on-surface-variant/60 dark:text-gray-500 text-sm">
                            {activeTab === 'active' && (
                                <div>
                                    <p>هیچ آگهی فعالی وجود ندارد.</p>
                                    <button
                                        onClick={() => router.push('/ad/create')}
                                        className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                    >
                                        <PlusCircle className="w-4 h-4" />
                                        ثبت آگهی جدید
                                    </button>
                                </div>
                            )}
                            {activeTab === 'pending' && 'هیچ آگهی در انتظاری وجود ندارد.'}
                            {activeTab === 'archived' && 'هیچ آگهی در آرشیو وجود ندارد.'}
                        </div>
                    ) : (
                        ads.map((ad: any) => (
                            <AdListItem
                                key={ad.id}
                                ad={ad}
                                armConfig={armConfig}
                                currentTab={activeTab}
                                onRefreshClick={onRefreshClick}
                                onEditClick={onEditClick}
                                onRepublishClick={onRepublishClick}
                                onToggleActive={onToggleActive}
                                onDeleteClick={onDeleteClick}
                                maxActiveAds={maxActiveAds}
                                creditBalance={creditBalance}
                                bumpCost={bumpCost}
                                reallyActiveCount={totalAds}
                                onRefresh={refreshAds}
                                onDeleteRequest={handleDeleteConfirm}
                            />
                        ))
                    )}
                </div>

                {/* ✅ صفحه‌بندی قبلی/بعدی */}
                {totalPages > 1 && ads.length > 0 && (
                    <div className="flex items-center justify-center gap-3 px-4 py-3 border-t border-outline-variant/20 dark:border-gray-700 bg-surface-container-lowest/30 dark:bg-gray-800/30">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 h-9 px-4 rounded-lg border border-outline-variant dark:border-gray-600 text-on-surface-variant dark:text-gray-400 hover:bg-surface-container-high dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                        >
                            <ChevronRight className="w-4 h-4" />
                            قبلی
                        </button>

                        <span className="text-xs text-on-surface-variant dark:text-gray-400">
                            {currentPage.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
                        </span>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 h-9 px-4 rounded-lg border border-outline-variant dark:border-gray-600 text-on-surface-variant dark:text-gray-400 hover:bg-surface-container-high dark:hover:bg-gray-700 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-sm"
                        >
                            بعدی
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {/* مودال حذف */}
            {deleteConfirm.open && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-md border border-outline-variant/20 dark:border-gray-800 shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                                <Trash2 className="w-5 h-5 text-red-500" />
                            </div>
                            <h3 className="text-base font-bold text-on-surface dark:text-gray-100">حذف آگهی</h3>
                        </div>
                        <p className="text-sm text-on-surface-variant dark:text-gray-400 mb-6">
                            آیا از حذف آگهی «{deleteConfirm.ad?.productType || deleteConfirm.ad?.title}» اطمینان دارید؟
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirm({ ad: null, open: false })}
                                    className="flex-1 h-10 border border-outline-variant dark:border-gray-700 rounded-md text-sm">
                                انصراف
                            </button>
                            <button onClick={handleDelete}
                                    className="flex-1 h-10 bg-red-500 text-white rounded-md text-sm">
                                حذف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* مودال غیرفعال‌سازی */}
            {deactivateConfirm.open && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-md border border-outline-variant/20 dark:border-gray-800 shadow-lg p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                                <AlertCircle className="w-5 h-5 text-amber-500" />
                            </div>
                            <h3 className="text-base font-bold text-on-surface dark:text-gray-100">حذف از تابلو</h3>
                        </div>
                        <p className="text-sm text-on-surface-variant dark:text-gray-400 mb-2">
                            آیا از حذف آگهی «{deactivateConfirm.ad?.productType || deactivateConfirm.ad?.title}» از تابلو اطمینان دارید؟
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mb-6">
                            اعتبار مصرف‌شده بازگردانده نمی‌شود.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeactivateConfirm({ ad: null, open: false })}
                                    className="flex-1 h-10 border border-outline-variant dark:border-gray-700 rounded-md text-sm">
                                انصراف
                            </button>
                            <button onClick={handleDeactivate}
                                    className="flex-1 h-10 bg-amber-500 text-white rounded-md text-sm">
                                حذف از تابلو
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* مودال ویرایش گروهی */}
            {groupEditOpen && (
                <div className="fixed inset-0 z-[70] flex flex-col justify-end sm:items-center sm:justify-center bg-black/50">
                    <div className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-md border border-outline-variant/20 dark:border-gray-800 shadow-lg max-h-[90vh] flex flex-col">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/20 dark:border-gray-800">
                            <h3 className="text-base font-bold text-on-surface dark:text-gray-100">تغییر قیمت گروهی</h3>
                            <button onClick={() => setGroupEditOpen(false)} className="p-1 hover:bg-surface-container-high rounded-md">
                                <X className="w-5 h-5 text-on-surface-variant" />
                            </button>
                        </div>
                        <div className="overflow-y-auto p-4 space-y-3">
                            {ads.map(ad => {
                                const unit = ad.unit?.shortCode || 'تن';
                                return (
                                    <div key={ad.id} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                                        <span className="flex-1 min-w-[120px] truncate text-on-surface dark:text-gray-200 text-xs sm:text-sm">
                                            {ad.productType || ad.title}
                                            <span className="text-primary dark:text-gray-500 mr-1 text-[11px]">({unit})</span>
                                        </span>
                                        <div className="w-36 sm:w-32">
                                            <NumberInput
                                                value={priceChanges[ad.id] ? parseFloat(priceChanges[ad.id]) : undefined}
                                                onChange={(val) => setPriceChanges(prev => ({ ...prev, [ad.id]: val ? val.toString() : '' }))}
                                                unit={currencyUnit}
                                                unitClassName="text-[9px]"
                                                className="h-9 bg-surface-container-lowest dark:bg-gray-800 border border-outline-variant dark:border-gray-700 rounded-md px-2 text-xs text-center"
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="border-t border-outline-variant/20 dark:border-gray-800 p-4 flex gap-3">
                            <button onClick={() => setGroupEditOpen(false)} className="flex-1 h-10 border border-outline-variant dark:border-gray-700 rounded-md text-sm">انصراف</button>
                            <button onClick={handleGroupSave} disabled={saving} className="flex-1 h-10 bg-primary text-on-primary rounded-md text-sm font-medium disabled:opacity-50">
                                {saving ? 'در حال ذخیره...' : 'اعمال تغییرات'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}