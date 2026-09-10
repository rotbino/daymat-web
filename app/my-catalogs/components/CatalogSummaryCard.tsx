// app/my-catalogs/components/CatalogSummaryCard.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Bookmark, Camera, Eye, Pencil, Plus, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmt, SALES_ICON, SALES_LABEL } from '../constants';

/** کارت اصلی کاتالوگ — لوگو، نام، لینک، آمار و اکشن‌های سریع */
export default function CatalogSummaryCard({ catalog, stats, onEdit }: {
    catalog: any;
    stats: any;
    onEdit: () => void;
}) {
    const router = useRouter();
    const SalesIcon = SALES_ICON[catalog.salesType] || SALES_ICON.wholesale;
    const logoSrc = catalog.logoFile?.path || catalog.logoUrl;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 overflow-hidden">
            {/* بخش هویت */}
            <div className="p-4 pb-3 flex items-start gap-3.5">
                <button type="button" onClick={onEdit} aria-label="ویرایش کاتالوگ"
                        className="relative w-18 h-18 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-primary/10
                            hover:ring-amber-500/40 transition-all flex items-center justify-center
                            bg-gray-100 dark:bg-gray-800 group">
                        {logoSrc
                            ? <Image src={logoSrc} alt={catalog.name} width={70} height={70} className="w-full h-full object-cover" unoptimized />
                            : (
                                <span className="flex flex-col items-center gap-0.5">
                                    <Camera className="w-6 h-6 text-gray-400 group-hover:text-primary transition-colors" />
                                    <span className="text-[8px] text-gray-400 group-hover:text-primary">لوگو</span>
                                </span>
                            )}
                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                        <Pencil className="w-4 h-4 text-white" />
                    </span>
                </button>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <p className="text-[15px] font-bold text-on-surface truncate">{catalog.name}</p>
                        <button type="button" onClick={onEdit} aria-label="ویرایش"
                                className="w-6 h-6 rounded-full grid place-items-center text-on-surface-variant/60
                                    hover:text-amber-600 hover:bg-amber-500/10 transition-colors flex-shrink-0">
                            <Pencil className="w-4 h-4" />
                        </button>
                        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded
                            bg-surface-container-high text-on-surface-variant flex-shrink-0">
                            <SalesIcon className="w-2.5 h-2.5" /> {SALES_LABEL[catalog.salesType] || ''}
                        </span>
                    </div>
                    {catalog.slug
                        ? <p className="text-[13px] text-on-surface-variant/60 mt-0.5 truncate" dir="ltr">
                            {typeof window !== 'undefined' ? window.location.host : ''}/{catalog.slug}
                        </p>
                        : <p className="text-[10px] text-amber-600 mt-0.5">آدرس کاتالوگ تنظیم نشده — لمس لوگو</p>}
                </div>
            </div>

            {/* نوار آمار */}
            <div className="grid grid-cols-3 border-t border-outline-variant/20 divide-x divide-x-reverse divide-outline-variant/20">
                {[
                    { icon: Eye, value: stats?.views, label: 'بازدید', cls: 'text-blue-500/80' },
                    { icon: Bookmark, value: stats?.saves, label: 'ذخیره', cls: 'text-amber-500/80' },
                    { icon: Share2, value: stats?.shares, label: 'اشتراک', cls: 'text-emerald-500/80' },
                ].map((s) => (
                    <div key={s.label} className="flex items-center justify-center gap-1.5 py-2.5">
                        <s.icon className={cn('w-3.5 h-3.5', s.cls)} />
                        <span className="text-xs font-extrabold text-on-surface">{fmt(s.value)}</span>
                        <span className="text-[10px] text-on-surface-variant/70">{s.label}</span>
                    </div>
                ))}
            </div>

            {/* اکشن‌ها */}
            <div className="flex items-center gap-2 px-4 pb-3.5 pt-1">
                <button onClick={() => router.push(`/ad/create?catalog=${catalog.id}`)}
                        className="h-9 px-3.5 rounded-xl bg-amber-500 text-white text-[10px] font-extrabold flex items-center gap-1.5
                            shadow-sm hover:bg-amber-600 active:scale-95 transition-all">
                    <Plus className="w-4 h-4" /> افزودن محصول
                </button>
                {catalog.slug && (
                    <button onClick={() => router.push(`/${catalog.slug}`)}
                            className="h-9 px-3.5 rounded-xl border border-outline-variant/60 text-[10px] font-bold text-on-surface
                                flex items-center gap-1.5 hover:border-primary/40 hover:text-primary transition-colors">
                        <Eye className="w-4 h-4" /> مشاهده
                    </button>
                )}
            </div>
        </div>
    );
}
