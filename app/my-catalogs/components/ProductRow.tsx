// app/my-catalogs/components/ProductRow.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Clock, EyeOff, Layers, Package, Pencil, RefreshCw, Store, Unlink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmt, inMarket, isAdExpired, isUncategorized } from '../constants';

/**
 * ردیف کالا — پرکاربردترین المان پنل مدیریت.
 * ✅ React.memo: با تغییر statusFilter رندر مجدد لیست ارزان می‌ماند.
 * چیدمان: بالای ردیف (عکس + هویت + قیمت) و ردیف اکشن افقی پایین — خوانا در موبایل.
 */
function ProductRowBase({ ad, onEdit, onCategory, onRefresh, onPublish }: {
    ad: any;
    onEdit: (ad: any) => void;
    onCategory: (ad: any) => void;
    onRefresh: (ad: any) => void;
    onPublish: (ad: any) => void;
}) {
    const expired = isAdExpired(ad);
    const market = inMarket(ad) && !!ad.armId;
    const onTable = ad.status === 'active' && !expired && market;
    const uncat = isUncategorized(ad);
    const unit = ad.unit?.title || ad.unit?.shortCode || '';
    const logoSrc = ad.files?.[0]?.thumbnailPath || ad.files?.[0]?.path;

    return (
        <div className={cn('rounded-lg border p-3 transition-colors',
            uncat
                ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-300/50 dark:border-amber-800/40'
                : onTable
                    ? 'bg-white dark:bg-gray-900 border-outline-variant/40'
                    : expired
                        ? 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-200/50 dark:border-amber-800/40'
                        : 'bg-surface-container-low/60 border-outline-variant/30 opacity-80')}>

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
                                <EyeOff className="w-2.5 h-2.5" /> فقط کاتالوگ
                            </span>
                        ) : expired ? (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                                <Clock className="w-2.5 h-2.5" /> نیازمند قیمت تازه
                            </span>
                        ) : (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 dark:bg-gray-800">غیرفعال</span>
                        )}
                        {uncat && (
                            <span title="این کالا در فیلترهای دسته‌بندی بازار پیدا نمی‌شود — لینک شکسته"
                                  className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full
                                      bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                                <Unlink className="w-2.5 h-2.5" /> لینک دسته شکسته
                            </span>
                        )}
                    </div>
                    <p className="text-xs font-extrabold text-primary mt-1">
                        {fmt(ad.unitPrice)} <span className="text-[9px] font-normal text-on-surface-variant">تومان/{unit}</span>
                    </p>
                </div>
            </div>

            {/* اکشن‌ها — ردیف افقی پایین */}
            <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-outline-variant/15 flex-wrap">
                {uncat && (
                    <button onClick={() => onCategory(ad)}
                            className="h-8 px-3 rounded-md bg-secondary text-on-secondary text-[10px] font-bold flex items-center gap-1
                                active:scale-95 transition-transform">
                        <Layers className="w-3 h-3" /> دسته بازار
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
                <button onClick={() => onPublish(ad)}
                        title="مدیریت انتشار این آگهی در بازارها"
                        className="h-8 px-3 rounded-lg border border-primary/40 bg-primary/5 text-[10px] font-bold text-primary
                            hover:bg-primary/10 flex items-center gap-1 transition-colors">
                    <Store className="w-3 h-3" /> بازارها
                </button>
                <button onClick={() => onEdit(ad)}
                        className="h-8 px-3 rounded-lg border border-outline-variant/50 text-[10px] font-bold text-on-surface-variant
                            hover:text-primary hover:border-primary/40 flex items-center gap-1 transition-colors">
                    <Pencil className="w-3 h-3" /> ویرایش
                </button>
            </div>
        </div>
    );
}

export const ProductRow = React.memo(ProductRowBase);
