// app/my-catalogs/components/CatalogConsoleHeader.tsx
// هدر کنسول کاتالوگ — فلت: هویت + اکشن‌ها + حلقهٔ تکمیل + نوار آمار
// ⚠️ قانون: حالت تاریک همیشه چک شده — همهٔ المان‌ها dark: دارند
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    BadgeCheck, Bookmark, Camera, Check, ChevronDown, Copy, Eye,
    ExternalLink, Link2, Package, Pencil, Plus, Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmt, SALES_ICON, SALES_LABEL } from '../constants';

interface CompletionItem { key: string; label: string; ok: boolean; }

/** هدر یکپارچهٔ کنسول */
export default function CatalogConsoleHeader({ catalog, stats, productsCount, completion, canShare, onShare, onEdit }: {
    catalog: any;
    stats: any;
    productsCount: number;
    completion: { percent: number; items: CompletionItem[]; openItem: (key: string) => void };
    canShare: boolean;
    onShare: () => void;
    onEdit: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const SalesIcon = SALES_ICON[catalog.salesType] || SALES_ICON.wholesale;
    const logoSrc = catalog.logoFile?.path || catalog.logoUrl;
    const verified = catalog.verificationStatus === 'approved';
    const host = typeof window !== 'undefined' ? window.location.host : '';
    const missing = (completion.items ?? []).filter((i) => !i.ok).length;
    const percent = completion.percent;

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/${catalog.slug}`);
            setCopied(true);
            toast.success('لینک کاتالوگ کپی شد');
            setTimeout(() => setCopied(false), 1600);
        } catch { /* بی‌خیال — لینک خودش قابل کلیک است */ }
    };

    const ringColor = percent >= 70 ? 'text-emerald-500' : percent >= 40 ? 'text-amber-500' : 'text-error';

    // ── دکمهٔ اشتراک‌گذاری: بدون slug تبدیل به CTA تنظیم آدرس می‌شود ──
    const shareBtnCls = 'flex-1 lg:flex-none h-10 px-4 rounded-lg font-extrabold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all';
    const shareBtn = canShare
        ? (
            <button type="button" onClick={onShare} aria-label="اشتراک‌گذاری کاتالوگ"
                    className={cn(shareBtnCls, 'bg-primary text-on-primary hover:bg-primary/90')}>
                <Share2 className="w-4 h-4" /> اشتراک‌گذاری
            </button>
        )
        : (
            <button type="button" onClick={onEdit} aria-label="تنظیم آدرس کاتالوگ"
                    className={cn(shareBtnCls, 'border border-secondary/50 text-secondary dark:text-[#9db9e3] hover:bg-secondary/5')}>
                <Link2 className="w-4 h-4" /> تنظیم آدرس
            </button>
        );

    const statItems = [
        { icon: Eye, value: stats?.views, label: 'بازدید', cls: 'text-blue-500/90 dark:text-blue-400/90' },
        { icon: Bookmark, value: stats?.saves, label: 'ذخیره', cls: 'text-amber-500/90 dark:text-amber-400/90' },
        { icon: Share2, value: stats?.shares, label: 'اشتراک', cls: 'text-emerald-500/90 dark:text-emerald-400/90' },
        { icon: Package, value: productsCount, label: 'محصول', cls: 'text-secondary dark:text-[#9db9e3]' },
    ];

    return (
        <div>
            {/* ── ردیف هویت + اکشن‌ها ── */}
            <div className="p-4 lg:px-6 lg:py-5 space-y-3.5">
                <div className="flex items-start gap-3.5">
                    <button type="button" onClick={onEdit} aria-label="ویرایش لوگو و اطلاعات کاتالوگ"
                            className="relative w-14 h-14 lg:w-16 lg:h-16 rounded-lg overflow-hidden flex-shrink-0
                                ring-1 ring-outline-variant/60 dark:ring-gray-700 hover:ring-secondary/60
                                transition-all bg-surface-container-high dark:bg-gray-800 grid place-items-center group">
                        {logoSrc
                            ? <Image src={logoSrc} alt={catalog.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                            : (
                                <span className="flex flex-col items-center gap-0.5">
                                    <Camera className="w-5 h-5 text-on-surface-variant/50 group-hover:text-secondary transition-colors" />
                                    <span className="text-[8px] text-on-surface-variant/50 group-hover:text-secondary">لوگو</span>
                                </span>
                            )}
                        <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                            <Pencil className="w-4 h-4 text-white" />
                        </span>
                    </button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-[15px] lg:text-lg font-black text-on-surface truncate max-w-full">{catalog.name}</h2>
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-surface-container-high dark:bg-gray-800 text-on-surface-variant flex-shrink-0">
                                <SalesIcon className="w-2.5 h-2.5" /> {SALES_LABEL[catalog.salesType] || ''}
                            </span>
                            {verified && (
                                <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300 flex-shrink-0">
                                    <BadgeCheck className="w-2.5 h-2.5" /> تایید شده
                                </span>
                            )}
                        </div>

                        {/* لینک عمومی کاتالوگ — قابل کلیک + کپی */}
                        {catalog.slug ? (
                            <div className="flex items-center gap-1 mt-1.5">
                                <Link href={`/${catalog.slug}`} target="_blank" title="مشاهده کاتالوگ"
                                      className="inline-flex items-center gap-1 h-6 px-2 rounded border border-secondary/20 bg-secondary/5 dark:border-[#9db9e3]/25 dark:bg-secondary/15
                                          text-[10px] font-bold text-secondary dark:text-[#9db9e3] hover:border-secondary/50
                                          transition-colors max-w-[240px]" dir="ltr">
                                    <span className="truncate">{host}/{catalog.slug}</span>
                                    <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                                </Link>
                                <button type="button" onClick={copyLink} aria-label="کپی لینک کاتالوگ" title="کپی لینک"
                                        className="w-6 h-6 rounded grid place-items-center text-on-surface-variant/50
                                            hover:text-secondary hover:bg-secondary/5 transition-colors flex-shrink-0">
                                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                            </div>
                        ) : (
                            <button type="button" onClick={onEdit}
                                    className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-secondary dark:text-[#9db9e3] hover:underline">
                                <Link2 className="w-3 h-3" /> آدرس کاتالوگ تنظیم نشده — همین حالا تنظیم کن
                            </button>
                        )}
                    </div>

                    {/* اکشن‌های دسکتاپ */}
                    <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                        <button type="button" onClick={() => window.open(`/ad/create?catalog=${catalog.id}`, '_self')}
                                className="h-10 px-4 rounded-lg bg-secondary text-on-secondary text-xs font-extrabold
                                    flex items-center gap-1.5 hover:bg-secondary/90 active:scale-[0.97] transition-all">
                            <Plus className="w-4 h-4" /> افزودن محصول
                        </button>
                        {shareBtn}
                        {catalog.slug && (
                            <Link href={`/${catalog.slug}`} target="_blank" title="مشاهده کاتالوگ"
                                  className="w-10 h-10 rounded-lg border border-outline-variant/50 dark:border-gray-700 grid place-items-center
                                      text-on-surface-variant hover:text-secondary hover:border-secondary/40 transition-colors">
                                <ExternalLink className="w-4 h-4" />
                            </Link>
                        )}
                        {/* ✏️ ویرایش کاتالوگ — آیکون مداد */}
                        <button type="button" onClick={onEdit} title="ویرایش اطلاعات کاتالوگ"
                                className="w-10 h-10 rounded-lg border border-outline-variant/50 dark:border-gray-700 grid place-items-center
                                    text-on-surface-variant hover:text-secondary hover:border-secondary/40 transition-colors">
                            <Pencil className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* اکشن‌های موبایل */}
                <div className="flex lg:hidden items-center gap-2">
                    <button type="button" onClick={() => window.open(`/ad/create?catalog=${catalog.id}`, '_self')}
                            className="flex-1 h-10 px-3 rounded-lg bg-secondary text-on-secondary text-[11px] font-extrabold
                                flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all">
                        <Plus className="w-4 h-4" /> افزودن محصول
                    </button>
                    {shareBtn}
                    {catalog.slug && (
                        <Link href={`/${catalog.slug}`} target="_blank" aria-label="مشاهده کاتالوگ"
                              className="w-10 h-10 rounded-lg border border-outline-variant/50 dark:border-gray-700 grid place-items-center
                                  text-on-surface-variant hover:text-secondary transition-colors flex-shrink-0">
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    )}
                </div>
            </div>

            {/* ── بخش تکمیل کاتالوگ — حلقهٔ تشویق‌کننده ── */}
            <div className="border-t border-outline-variant/30 dark:border-gray-700/60 px-4 lg:px-6 py-3.5">
                {percent === 100 ? (
                    <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-lg bg-emerald-500 grid place-items-center flex-shrink-0 shadow-sm shadow-emerald-500/30">
                            <BadgeCheck className="w-4.5 h-4.5 text-white" />
                        </span>
                        <p className="flex-1 text-xs lg:text-[13px] font-extrabold text-emerald-700 dark:text-emerald-300 leading-5">
                            کاتالوگت کامل است ✓ — آمادهٔ دیده‌شدن و اعتماد گرفتن
                        </p>
                        {canShare && (
                            <button type="button" onClick={onShare} aria-label="اشتراک‌گذاری کاتالوگ"
                                    className="h-9 px-4 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold flex items-center gap-1.5
                                        hover:bg-emerald-700 active:scale-95 transition-all flex-shrink-0">
                                <Share2 className="w-3.5 h-3.5" /> شیر کن
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <button type="button" onClick={() => setExpanded((o) => !o)}
                                className="w-full flex items-center gap-3.5 text-right">
                            <span className="relative w-12 h-12 flex-shrink-0 grid place-items-center">
                                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="15.5" fill="none"
                                            className="stroke-outline-variant/30 dark:stroke-gray-700" strokeWidth="3.5" />
                                    <circle cx="18" cy="18" r="15.5" fill="none"
                                            className={cn('stroke-current transition-all duration-700', ringColor)}
                                            strokeWidth="3.5" strokeDasharray={`${percent} 100`} strokeLinecap="round" />
                                </svg>
                                <span className={cn('absolute text-[11px] font-black', ringColor)}>{percent}٪</span>
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-sm font-extrabold text-on-surface">کاتالوگت را کامل کن</span>
                                <span className="block text-[11px] text-on-surface-variant/70 mt-0.5">
                                    {fmt(missing)} مورد مانده — کاتالوگ کامل = اعتماد بیشتر مشتری
                                    <span className="text-primary font-bold"> · {expanded ? 'بستن' : 'ببین چی کم است'}</span>
                                </span>
                            </span>
                            <ChevronDown className={cn('w-4 h-4 text-on-surface-variant/40 transition-transform flex-shrink-0', expanded && 'rotate-180')} />
                        </button>

                        {expanded && (
                            <div className="mt-3 space-y-1 border-t border-outline-variant/20 dark:border-gray-700/60 pt-2.5">
                                {(completion.items ?? []).map((item) => (
                                    <button key={item.key} type="button"
                                            onClick={() => !item.ok && completion.openItem(item.key)}
                                            disabled={item.ok}
                                            className={cn('w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-right transition-colors',
                                                item.ok ? 'opacity-60 cursor-default' : 'hover:bg-surface-container-high/50 dark:hover:bg-gray-800/60 active:scale-[0.99]')}>
                                        <span className={cn('w-5 h-5 rounded-full grid place-items-center flex-shrink-0',
                                            item.ok ? 'bg-emerald-500' : 'border-2 border-outline-variant/50 dark:border-gray-600')}>
                                            {item.ok && <BadgeCheck className="w-3.5 h-3.5 text-white" />}
                                        </span>
                                        <span className={cn('flex-1 text-xs font-bold',
                                            item.ok ? 'text-on-surface-variant/60 line-through' : 'text-on-surface')}>
                                            {item.label}
                                        </span>
                                        {!item.ok && (
                                            <span className="text-[10px] font-bold text-secondary dark:text-[#9db9e3] flex items-center flex-shrink-0">
                                                تکمیل ←
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ── نوار آمار — فلت با جداکننده ── */}
            <div className="border-t border-outline-variant/30 dark:border-gray-700/60 grid grid-cols-4
                    divide-x divide-x-reverse divide-outline-variant/25 dark:divide-gray-700/50">
                {statItems.map((s) => (
                    <div key={s.label} className="flex items-center justify-center gap-1.5 py-2.5 px-1">
                        <s.icon className={cn('w-3.5 h-3.5 flex-shrink-0', s.cls)} />
                        <span className="text-xs lg:text-[13px] font-extrabold text-on-surface">{fmt(s.value)}</span>
                        <span className="text-[9px] lg:text-[10px] text-on-surface-variant/70 hidden sm:inline">{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
