// app/my-catalogs/PublishToMarketModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import {
    X, Store, Loader2, Check, Plus, AlertTriangle,
    Layers, EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    ad: any;
    onPublished?: () => void;
}

const PUB_STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    published:      { label: 'منتشر شده',     cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    needs_category: { label: 'بدون دسته',      cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
    paused:         { label: 'متوقف شده',      cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    rejected:       { label: 'رد شده',         cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

export default function PublishToMarketModal({ isOpen, onClose, ad, onPublished }: Props) {
    const queryClient = useQueryClient();
    const [publishing, setPublishing] = useState<string | null>(null);
    const [unpublishing, setUnpublishing] = useState<string | null>(null);

    const { data: publications = [], isLoading: pubLoading } = useQuery({
        queryKey: ['ad-publications', ad?.id],
        queryFn: () => apiService.ad.getPublications(ad.id),
        enabled: !!ad?.id && isOpen,
        staleTime: 10_000,
    });

    const { data: userArms = [] } = useQuery({
        queryKey: ['arms'],
        queryFn: () => apiService.arm.getUserArms(),
        enabled: isOpen,
        staleTime: 60_000,
    });

    const publishedArmIds = new Set(publications.map((p: any) => p.armId));
    const availableArms = userArms.filter((arm: any) =>
        arm.status === 'active' &&
        arm.catalogId &&
        !publishedArmIds.has(arm.id)
    );

    useEffect(() => {
        if (!isOpen) {
            setPublishing(null);
            setUnpublishing(null);
        }
    }, [isOpen]);

    if (!isOpen || !ad) return null;

    const handlePublish = async (armSlug: string, armName: string) => {
        setPublishing(armSlug);
        try {
            const result = await apiService.ad.publishToMarket(ad.id, armSlug);
            toast.success(`آگهی در بازار «${armName}» منتشر شد${result.needsCategory.length > 0 ? ' — ولی نیاز به انتخاب دسته‌بندی داری' : ''}`);

            await queryClient.invalidateQueries({ queryKey: ['ad-publications', ad.id] });
            await queryClient.invalidateQueries({ queryKey: ['catalog-products'] });

            onPublished?.();
        } catch (err: any) {
            const code = err?.data?.errorCode;
            if (code === 'NOT_MEMBER') {
                toast.error('کاتالوگ شما در این بازار منتشر نیست — اول عضو بازار شوید');
            } else if (code === 'AD_NOT_ACTIVE') {
                toast.error('آگهی فعال نیست');
            } else if (code === 'ARM_NOT_ACTIVE') {
                toast.error('بازار فعال نیست');
            } else {
                toast.error(err?.data?.message || err?.message || 'خطا در انتشار');
            }
        } finally {
            setPublishing(null);
        }
    };

    const handleUnpublish = async (armSlug: string, armName: string) => {
        if (!confirm(`آگهی از بازار «${armName}» حذف شود؟ (آگهی از کاتالوگ شما حذف نمی‌شود)`)) return;
        setUnpublishing(armSlug);
        try {
            await apiService.ad.unpublishFromMarket(ad.id, armSlug);
            toast.success(`آگهی از بازار «${armName}» حذف شد`);

            await queryClient.invalidateQueries({ queryKey: ['ad-publications', ad.id] });
            await queryClient.invalidateQueries({ queryKey: ['catalog-products'] });

            onPublished?.();
        } catch (err: any) {
            toast.error(err?.data?.message || err?.message || 'خطا در حذف');
        } finally {
            setUnpublishing(null);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200"
            onClick={() => !publishing && !unpublishing && onClose()}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl
                    max-h-[90dvh] flex flex-col overflow-hidden
                    animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            >
                {/* هدر */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Store className="w-4.5 h-4.5 text-primary" />
                        </span>
                        <div>
                            <h3 className="text-sm font-extrabold text-on-surface">انتشار در بازارها</h3>
                            <p className="text-[10px] text-on-surface-variant/70 truncate max-w-[200px]">
                                {ad.productType || ad.title}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={!!publishing || !!unpublishing}
                        aria-label="بستن"
                        className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* بدنه */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-4 space-y-5">

                    {/* بخش ۱: بازارهای فعلی */}
                    <section>
                        <p className="text-[11px] font-bold text-on-surface-variant mb-2 flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            بازارهای فعلی این آگهی
                            <span className="text-on-surface-variant/50">({publications.length})</span>
                        </p>

                        {pubLoading ? (
                            <div className="space-y-2">
                                {[0, 1].map(i => (
                                    <div key={i} className="h-14 rounded-xl bg-surface-container-high/50 animate-pulse" />
                                ))}
                            </div>
                        ) : publications.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-outline-variant/40 p-4 text-center">
                                <EyeOff className="w-6 h-6 text-on-surface-variant/30 mx-auto mb-2" />
                                <p className="text-xs text-on-surface-variant">این آگهی هنوز در هیچ بازاری منتشر نشده</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {publications.map((pub: any) => {
                                    const statusInfo = PUB_STATUS_LABEL[pub.status] || PUB_STATUS_LABEL.published;
                                    const isUnpublishing = unpublishing === pub.arm.slug;
                                    return (
                                        <div
                                            key={pub.id}
                                            className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/40 bg-surface-container-low/40"
                                        >
                                            <span
                                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: (pub.arm.colorPrimary || '#a11f2c') + '20' }}
                                            >
                                                <Store
                                                    className="w-4 h-4"
                                                    style={{ color: pub.arm.colorPrimary || '#a11f2c' }}
                                                />
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-on-surface truncate">
                                                    {pub.arm.name}
                                                </p>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded', statusInfo.cls)}>
                                                        {statusInfo.label}
                                                    </span>
                                                    {pub.categoryId && (
                                                        <span className="text-[9px] text-on-surface-variant/60 flex items-center gap-0.5">
                                                            <Layers className="w-2.5 h-2.5" />
                                                            دسته‌بندی شده
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleUnpublish(pub.arm.slug, pub.arm.name)}
                                                disabled={!!unpublishing || !!publishing}
                                                className="h-8 w-8 rounded-lg flex items-center justify-center text-on-surface-variant/60 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                                                title="حذف از این بازار"
                                            >
                                                {isUnpublishing ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <X className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* بخش ۲: افزودن به بازار جدید */}
                    <section>
                        <p className="text-[11px] font-bold text-on-surface-variant mb-2 flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5 text-primary" />
                            افزودن به بازار دیگر
                        </p>

                        {availableArms.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-outline-variant/40 p-4 text-center">
                                <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                                <p className="text-xs text-on-surface-variant leading-5">
                                    کاتالوگ شما در بازارهای دیگری عضو نیست یا در همه بازارهای موجود این آگهی منتشر شده.
                                </p>
                                <p className="text-[10px] text-on-surface-variant/60 mt-1.5">
                                    برای انتشار در بازار جدید، اول باید به آن بازار بپیوندید.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {availableArms.map((arm: any) => {
                                    const isPublishing = publishing === arm.slug;
                                    return (
                                        <button
                                            key={arm.id}
                                            onClick={() => handlePublish(arm.slug, arm.name)}
                                            disabled={!!publishing || !!unpublishing}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl border border-outline-variant/40
                                                bg-white dark:bg-gray-900 hover:border-primary/40 hover:bg-primary/5
                                                transition-colors text-right disabled:opacity-50"
                                        >
                                            <span
                                                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: (arm.colorPrimary || '#a11f2c') + '20' }}
                                            >
                                                <Store
                                                    className="w-4 h-4"
                                                    style={{ color: arm.colorPrimary || '#a11f2c' }}
                                                />
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-on-surface truncate">{arm.name}</p>
                                                {arm.slogan && (
                                                    <p className="text-[10px] text-on-surface-variant/70 truncate mt-0.5">
                                                        {arm.slogan}
                                                    </p>
                                                )}
                                            </div>
                                            {isPublishing ? (
                                                <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                                            ) : (
                                                <Plus className="w-4 h-4 text-primary flex-shrink-0" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* اطلاعات تکمیلی */}
                    <div className="rounded-xl bg-blue-50 dark:bg-blue-900/15 border border-blue-200/50 dark:border-blue-800/40 p-3 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-blue-800 dark:text-blue-300 leading-5">
                            انتشار در چند بازار به این معناست که آگهی شما روی تابلوی هر بازار به‌صورت مستقل نمایش داده می‌شود.
                            هر بازار دسته‌بندی مخصوص خودش را دارد — ممکن است در بازار جدید نیاز باشد دسته‌بندی را دوباره انتخاب کنید.
                        </p>
                    </div>
                </div>

                {/* فوتر */}
                <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant/20">
                    <button
                        onClick={onClose}
                        disabled={!!publishing || !!unpublishing}
                        className="w-full h-11 rounded-lg border border-outline-variant/60 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
                    >
                        بستن
                    </button>
                </div>
            </div>
        </div>
    );
}
