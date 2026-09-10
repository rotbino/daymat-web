// app/my-catalogs/components/CatalogConsoleHeader.tsx
// هدر کنسول کاتالوگ — هویت + اکشن‌ها + تکمیل + آمار؛ همه در یک بلوک منظم
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    BadgeCheck, Bookmark, Camera, Check, ChevronDown, Copy, Eye,
    ExternalLink, Link2, Package, Pencil, Plus, Settings2, Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { fmt, SALES_ICON, SALES_LABEL } from '../constants';

interface CompletionItem { key: string; label: string; ok: boolean; }

/** هدر یکپارچهٔ کنسول — جایگزین کارت خلاصه + کارت تکمیل قبلی */
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

    const barColor = percent >= 70 ? 'bg-emerald-500' : percent >= 40 ? 'bg-amber-500' : 'bg-error';
    const textColor = percent >= 70 ? 'text-emerald-600' : percent >= 40 ? 'text-amber-600' : 'text-error';

    // ── دکمهٔ اشتراک‌گذاری: اگر slug نیست، تبدیل به CTA تنظیم آدرس می‌شود ──
    const shareBtnCls = 'flex-1 lg:flex-none h-10 px-4 rounded-xl font-extrabold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-all';
    const shareBtn = canShare
        ? (
            <button type="button" onClick={onShare} aria-label="اشتراک‌گذاری کاتالوگ"
                    className={cn(shareBtnCls, 'bg-primary text-on-primary shadow-sm shadow-primary/30 hover:bg-primary/90')}>
                <Share2 className="w-4 h-4" /> اشتراک‌گذاری
            </button>
        )
        : (
            <button type="button" onClick={onEdit} aria-label="تنظیم آدرس کاتالوگ"
                    className={cn(shareBtnCls, 'border border-amber-500/60 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10')}>
                <Link2 className="w-4 h-4" /> تنظیم آدرس
            </button>
        );

    const statItems = [
        { icon: Eye, value: stats?.views, label: 'بازدید', cls: 'text-blue-500/90' },
        { icon: Bookmark, value: stats?.saves, label: 'ذخیره', cls: 'text-amber-500/90' },
        { icon: Share2, value: stats?.shares, label: 'اشتراک', cls: 'text-emerald-500/90' },
        { icon: Package, value: productsCount, label: 'محصول', cls: 'text-purple-500/90' },
    ];

    return (
        <header className="relative p-4 lg:p-6 lg:pb-4 space-y-3.5">
            {/* هالهٔ ملایم شروع RTL */}
            <div className="absolute inset-0 bg-gradient-to-l from-primary/[0.05] via-transparent to-transparent pointer-events-none" />

            {/* ── ردیف هویت ── */}
            <div className="relative flex items-start gap-3.5">
                <button type="button" onClick={onEdit} aria-label="ویرایش لوگو و اطلاعات کاتالوگ"
                        className="relative w-14 h-14 lg:w-[72px] lg:h-[72px] rounded-2xl overflow-hidden flex-shrink-0
                            ring-2 ring-primary/10 hover:ring-amber-500/40 transition-all
                            bg-surface-container-high dark:bg-gray-800 grid place-items-center group">
                    {logoSrc
                        ? <Image src={logoSrc} alt={catalog.name} width={72} height={72} className="w-full h-full object-cover" unoptimized />
                        : (
                            <span className="flex flex-col items-center gap-0.5">
                                <Camera className="w-5 h-5 text-on-surface-variant/50 group-hover:text-primary transition-colors" />
                                <span className="text-[8px] text-on-surface-variant/50 group-hover:text-primary">لوگو</span>
                            </span>
                        )}
                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                        <Pencil className="w-4 h-4 text-white" />
                    </span>
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-[15px] lg:text-lg font-black text-on-surface truncate max-w-full">{catalog.name}</h2>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant flex-shrink-0">
                            <SalesIcon className="w-2.5 h-2.5" /> {SALES_LABEL[catalog.salesType] || ''}
                        </span>
                        {verified && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300 flex-shrink-0">
                                <BadgeCheck className="w-2.5 h-2.5" /> تایید شده
                            </span>
                        )}
                    </div>

                    {/* لینک عمومی کاتالوگ — chip قابل کلیک + کپی */}
                    {catalog.slug ? (
                        <div className="flex items-center gap-1 mt-1.5">
                            <Link href={`/${catalog.slug}`} target="_blank" title="مشاهده کاتالوگ"
                                  className="inline-flex items-center gap-1 h-6 px-2 rounded-lg border border-primary/20 bg-primary/5
                                      text-[10px] font-bold text-primary/80 hover:text-primary hover:border-primary/40
                                      transition-colors max-w-[240px]" dir="ltr">
                                <span className="truncate">{host}/{catalog.slug}</span>
                                <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                            </Link>
                            <button type="button" onClick={copyLink} aria-label="کپی لینک کاتالوگ" title="کپی لینک"
                                    className="w-6 h-6 rounded-lg grid place-items-center text-on-surface-variant/50
                                        hover:text-primary hover:bg-primary/5 transition-colors flex-shrink-0">
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    ) : (
                        <button type="button" onClick={onEdit}
                                className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:underline">
                            <Link2 className="w-3 h-3" /> آدرس کاتالوگ تنظیم نشده — همین حالا تنظیم کن
                        </button>
                    )}
                </div>

                {/* اکشن‌های دسکتاپ */}
                <div className="hidden lg:flex items-center gap-2 flex-shrink-0">
                    <button type="button" onClick={() => window.open(`/ad/create?catalog=${catalog.id}`, '_self')}
                            className="h-10 px-4 rounded-xl bg-amber-500 text-white text-xs font-extrabold
                                flex items-center gap-1.5 shadow-sm shadow-amber-500/30 hover:bg-amber-600 active:scale-[0.97] transition-all">
                        <Plus className="w-4 h-4" /> افزودن محصول
                    </button>
                    {shareBtn}
                    {catalog.slug && (
                        <Link href={`/${catalog.slug}`} target="_blank" title="مشاهده کاتالوگ"
                              className="w-10 h-10 rounded-xl border border-outline-variant/50 grid place-items-center
                                  text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors">
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    )}
                    <button type="button" onClick={onEdit} title="ویرایش اطلاعات کاتالوگ"
                            className="w-10 h-10 rounded-xl border border-outline-variant/50 grid place-items-center
                                text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors">
                        <Settings2 className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* ── اکشن‌های موبایل ── */}
            <div className="relative flex lg:hidden items-center gap-2">
                <button type="button" onClick={() => window.open(`/ad/create?catalog=${catalog.id}`, '_self')}
                        className="flex-1 h-10 px-3 rounded-xl bg-amber-500 text-white text-[11px] font-extrabold
                            flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/30 active:scale-[0.97] transition-all">
                    <Plus className="w-4 h-4" /> افزودن محصول
                </button>
                {shareBtn}
                {catalog.slug && (
                    <Link href={`/${catalog.slug}`} target="_blank" aria-label="مشاهده کاتالوگ"
                          className="w-10 h-10 rounded-xl border border-outline-variant/50 grid place-items-center
                              text-on-surface-variant hover:text-primary transition-colors flex-shrink-0">
                        <ExternalLink className="w-4 h-4" />
                    </Link>
                )}
            </div>

            {/* ── نوار تکمیل ── */}
            {percent === 100 ? (
                <div className="relative rounded-xl border border-emerald-300/50 bg-emerald-50/70 dark:from-emerald-900/15 dark:bg-emerald-900/10 dark:border-emerald-800/50
                        px-3.5 py-2.5 flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-emerald-500 grid place-items-center flex-shrink-0 shadow-sm shadow-emerald-500/30">
                        <BadgeCheck className="w-4 h-4 text-white" />
                    </span>
                    <p className="flex-1 text-[11px] lg:text-xs font-extrabold text-emerald-800 dark:text-emerald-300 leading-5">
                        کاتالوگت کامل است ✓ — آمادهٔ دیده‌شدن و اعتماد گرفتن
                    </p>
                    {canShare && (
                        <button type="button" onClick={onShare} aria-label="اشتراک‌گذاری کاتالوگ"
                                className="h-8 px-3.5 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold flex items-center gap-1.5
                                    shadow-sm shadow-emerald-600/30 hover:bg-emerald-700 active:scale-95 transition-all flex-shrink-0">
                            <Share2 className="w-3.5 h-3.5" /> شیر کن
                        </button>
                    )}
                </div>
            ) : (
                <div className="relative rounded-xl border border-outline-variant/30 bg-surface-container-low/50 dark:bg-gray-800/40 overflow-hidden">
                    <button type="button" onClick={() => setExpanded((o) => !o)}
                            className="w-full px-3.5 py-2.5 flex items-center gap-3 text-right hover:bg-surface-container-high/40 transition-colors">
                        <span className="relative flex-1 h-2 rounded-full bg-outline-variant/25 dark:bg-gray-700 overflow-hidden">
                            <span className={cn('absolute inset-y-0 right-0 rounded-full transition-all duration-700', barColor)}
                                  style={{ width: `${percent}%` }} />
                        </span>
                        <span className={cn('text-[11px] font-black flex-shrink-0', textColor)}>{percent}٪</span>
                        <span className="text-[11px] text-on-surface-variant font-bold flex-shrink-0 hidden sm:inline">
                            {fmt(missing)} مورد مانده
                        </span>
                        <ChevronDown className={cn('w-4 h-4 text-on-surface-variant/50 transition-transform flex-shrink-0', expanded && 'rotate-180')} />
                    </button>

                    {expanded && (
                        <div className="px-3 pb-3 pt-2 grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5 border-t border-outline-variant/20 dark:border-gray-700/60">
                            {(completion.items ?? []).map((item) => (
                                <button key={item.key} type="button"
                                        onClick={() => !item.ok && completion.openItem(item.key)}
                                        disabled={item.ok}
                                        className={cn('flex items-center gap-2 px-2.5 h-9 rounded-lg text-right transition-colors',
                                            item.ok
                                                ? 'bg-surface-container-low/60 dark:bg-gray-800/40 cursor-default'
                                                : 'bg-white dark:bg-gray-900 border border-outline-variant/40 hover:border-primary/40 active:scale-[0.98]')}>
                                    <span className={cn('w-4.5 h-4.5 rounded-full grid place-items-center flex-shrink-0',
                                        item.ok ? 'bg-emerald-500' : 'border-2 border-outline-variant/50')}>
                                        {item.ok && <BadgeCheck className="w-3 h-3 text-white" />}
                                    </span>
                                    <span className={cn('flex-1 text-[11px] font-bold truncate',
                                        item.ok ? 'text-on-surface-variant/50' : 'text-on-surface')}>
                                        {item.label}
                                    </span>
                                    {!item.ok && <span className="text-[9px] font-black text-primary flex-shrink-0">تکمیل ←</span>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── نوار آمار ── */}
            <div className="relative grid grid-cols-4 rounded-xl bg-surface-container-low/60 dark:bg-gray-800/40
                    border border-outline-variant/20 dark:border-gray-700/50 divide-x divide-x-reverse divide-outline-variant/20 dark:divide-gray-700/50">
                {statItems.map((s) => (
                    <div key={s.label} className="flex items-center justify-center gap-1.5 py-2.5 px-1">
                        <s.icon className={cn('w-3.5 h-3.5 flex-shrink-0', s.cls)} />
                        <span className="text-xs lg:text-[13px] font-extrabold text-on-surface">{fmt(s.value)}</span>
                        <span className="text-[9px] lg:text-[10px] text-on-surface-variant/70 hidden sm:inline">{s.label}</span>
                    </div>
                ))}
            </div>
        </header>
    );
}
