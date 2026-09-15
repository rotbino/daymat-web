// app/business/manage/components/CatalogLinksCard.tsx
// 🔗 کاتالوگ‌های این کسب‌وکار — فروش و خرید کنار هم (محصول دوم دیمت)
// ✅ بازوهای خرید (استعلام) با برچسب کهربایی کنار کاتالوگ‌های قیمت
// ✅ دو دکمهٔ ساخت جدا برای هر نوع — بازوی خرید با bizId دیپ‌لینک می‌شود
// ✅ جای کارت در صفحه بالاتر آمده (درخواست کاربر: دسترسی راحت از کسب‌وکار)
'use client';

import React, {useState} from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { BookOpen, ClipboardList, Copy, ExternalLink, Plus, Check, Store } from 'lucide-react';
import { toast } from 'sonner';

export interface ManageCatalogItem {
    id: string;
    name: string;
    slug?: string | null;
    salesType?: string;
    status?: string;
}

const SALES_LABEL: Record<string, string> = { wholesale: 'عمده', retail: 'خرده', both: 'عمده و خرده' };

const rowIn = (i: number) => ({
    initial: { opacity: 0, y: 10 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-20px' as const },
    transition: { duration: 0.35, delay: Math.min(i, 6) * 0.05, ease: 'easeOut' as const },
});

export function CatalogLinksCard({ catalogs, inquiries = [], businessId }: {
    catalogs: ManageCatalogItem[];
    /** بازوهای خرید متصل به این کسب‌وکار (Inquiry با businessId) */
    inquiries?: any[];
    businessId?: string | null;
}) {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const buyCount = inquiries.length;
    const salesCount = catalogs.length;

    const copyLink = async (path: string, id: string) => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}${path}`);
            setCopiedId(id);
            toast.success('لینک کپی شد');
            setTimeout(() => setCopiedId(null), 1600);
        } catch {
            toast.error('کپی نشد — دستی انتخاب و کپی کن');
        }
    };

    const subtitle = salesCount + buyCount === 0
        ? 'هنوز کاتالوگی نساخته‌اید'
        : [
              salesCount > 0 ? `${salesCount.toLocaleString('fa-IR')} کاتالوگ قیمت` : null,
              buyCount > 0 ? `${buyCount.toLocaleString('fa-IR')} بازوی خرید` : null,
          ].filter(Boolean).join(' · ');

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4 sm:p-5 space-y-3">
            {/* هدر */}
            <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary/10 grid place-items-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-extrabold text-on-surface">کاتالوگ‌های این کسب‌وکار</p>
                    <p className="text-[10px] text-on-surface-variant/70">{subtitle}</p>
                </div>
            </div>

            {/* لیست فروش */}
            {salesCount === 0 && buyCount === 0 ? (
                <div className="rounded-xl border border-dashed border-outline-variant/50 p-4 flex flex-col items-center gap-2 text-center">
                    <Store className="w-6 h-6 text-on-surface-variant/40" />
                    <p className="text-[11px] text-on-surface-variant leading-4">
                        کاتالوگ قیمت برای نمایش محصولات، بازوی خرید برای استعلام قیمت از تامین‌کننده‌ها.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {catalogs.map((c, i) => (
                        <motion.div
                            key={c.id}
                            {...rowIn(i)}
                            className="rounded-xl border border-outline-variant/40 dark:border-gray-700/70 p-3 flex items-center gap-2.5"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <p className="text-xs font-bold text-on-surface truncate">{c.name}</p>
                                    <span className="text-[9px] font-bold text-primary/80 whitespace-nowrap flex-shrink-0">(کاتالوگ قیمت)</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {c.slug && (
                                        <span className="text-[10px] text-on-surface-variant/70 truncate" dir="ltr">
                                            /{c.slug}
                                        </span>
                                    )}
                                    {c.salesType && SALES_LABEL[c.salesType] && (
                                        <span className="text-[9px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-px flex-shrink-0">
                                            {SALES_LABEL[c.salesType]}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {c.slug && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => copyLink(`/${c.slug}`, c.id)}
                                        aria-label="کپی لینک"
                                        className="w-8 h-8 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-primary hover:bg-primary/10 active:scale-90 transition-all flex-shrink-0"
                                    >
                                        {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                    <a
                                        href={`/${c.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="مشاهده کاتالوگ"
                                        className="w-8 h-8 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-primary hover:bg-primary/10 active:scale-90 transition-all flex-shrink-0"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </>
                            )}
                        </motion.div>
                    ))}

                    {/* بازوهای خرید — کنار فروش، با رنگ کهربایی محصول دوم */}
                    {inquiries.map((w: any, i: number) => (
                        <motion.div
                            key={w.id}
                            {...rowIn(salesCount + i)}
                            className="rounded-xl border border-brand-contrast-tint bg-brand-contrast-soft/40 dark:bg-amber-500/5 p-3 flex items-center gap-2.5"
                        >
                            <span className="w-8 h-8 rounded-lg bg-brand-contrast-soft dark:bg-amber-500/15 grid place-items-center flex-shrink-0">
                                <ClipboardList className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <p className="text-xs font-bold text-on-surface truncate">{w.title}</p>
                                    <span className="text-[9px] font-bold text-amber-600/90 dark:text-amber-400/90 whitespace-nowrap flex-shrink-0">(بازوی خرید)</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {w.status && (
                                        <span className={`text-[9px] font-bold rounded-full px-1.5 py-px flex-shrink-0 ${
                                            w.status === 'open'
                                                ? 'text-emerald-700 bg-emerald-500/10'
                                                : 'text-stone-400 bg-stone-100 dark:bg-gray-800'
                                        }`}>
                                            {w.status === 'open' ? 'باز' : 'بسته'}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-on-surface-variant/70">
                                        {(w._count?.items ?? 0).toLocaleString('fa-IR')} قلم
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => copyLink(`/${w.slug || w.id}`, w.id)}
                                aria-label="کپی لینک بازوی خرید"
                                className="w-8 h-8 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-amber-600 hover:bg-amber-500/10 active:scale-90 transition-all flex-shrink-0"
                            >
                                {copiedId === w.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                            <Link
                                href={`/${w.slug || w.id}`}
                                target="_blank"
                                aria-label="مشاهده بازوی خرید"
                                className="w-8 h-8 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-amber-600 hover:bg-amber-500/10 active:scale-90 transition-all flex-shrink-0"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}

            {/* دو دکمهٔ ساخت — هر محصول یک دکمه */}
            <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                    href={businessId ? `/business/register?bizId=${businessId}` : '/business/register'}
                    className="h-9 rounded-lg border border-primary/30 text-primary text-[11px] font-extrabold flex items-center justify-center gap-1 hover:bg-primary/5 active:scale-95 transition-all"
                >
                    <Plus className="w-3.5 h-3.5" /> کاتالوگ قیمت
                </Link>
                <Link
                    href={businessId ? `/inquiries/new?bizId=${businessId}` : '/inquiries/new'}
                    className="h-9 rounded-lg border border-brand-contrast/40 text-amber-700 dark:text-amber-400 text-[11px] font-extrabold flex items-center justify-center gap-1 hover:bg-brand-contrast-soft active:scale-95 transition-all"
                >
                    <Plus className="w-3.5 h-3.5" /> بازوی خرید
                </Link>
            </div>
        </div>
    );
}
