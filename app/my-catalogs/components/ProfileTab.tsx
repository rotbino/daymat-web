// app/my-catalogs/components/ProfileTab.tsx
// تب مشخصات کاتالوگ — هویت + حلقهٔ تکمیل (سبک قدیمی افقی و تشویق‌کننده) + ویرایش با مداد
// ⚠️ قانون: حالت تاریک همیشه چک شده
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    BadgeCheck, Camera, Check, ChevronDown, ChevronLeft, Copy, Pencil, Phone, Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SALES_ICON, SALES_LABEL } from '../constants';
import { ProfileBanner } from './AlertBanners';

interface CompletionItem { key: string; label: string; ok: boolean; }

export default function ProfileTab({ catalog, completion, canShare, onShare, onEdit, userAvatar, userHasName, onProfile }: {
    catalog: any;
    completion: { percent: number; items: CompletionItem[]; openItem: (key: string) => void };
    canShare: boolean;
    onShare: () => void;
    onEdit: () => void;
    userAvatar?: string | null;
    userHasName: boolean;
    onProfile: () => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [copied, setCopied] = useState(false);

    const SalesIcon = SALES_ICON[catalog.salesType] || SALES_ICON.wholesale;
    const logoSrc = catalog.logoFile?.path || catalog.logoUrl;
    const verified = catalog.verificationStatus === 'approved';
    const host = typeof window !== 'undefined' ? window.location.host : '';
    const items = completion.items ?? [];
    const missing = items.filter((i) => !i.ok).length;
    const percent = completion.percent;
    const ringColor = percent >= 70 ? 'text-emerald-500' : percent >= 40 ? 'text-amber-500' : 'text-error';

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/${catalog.slug}`);
            setCopied(true);
            toast.success('لینک کاتالوگ کپی شد');
            setTimeout(() => setCopied(false), 1600);
        } catch { /* لینک خودش قابل کلیک است */ }
    };

    return (
        <div className="space-y-3">
            {/* ── هویت کاتالوگ — فلت، بدون قاب کارتی ── */}
            <div className="flex items-start gap-3.5">
                <button type="button" onClick={onEdit} aria-label="ویرایش لوگو و اطلاعات کاتالوگ"
                        className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0
                            ring-1 ring-outline-variant/50 dark:ring-gray-700 hover:ring-amber-500/40
                            transition-all bg-surface-container-high dark:bg-gray-800 grid place-items-center group">
                    {logoSrc
                        ? <Image src={logoSrc} alt={catalog.name} width={64} height={64} className="w-full h-full object-cover" unoptimized />
                        : (
                            <span className="flex flex-col items-center gap-0.5">
                                <Camera className="w-5 h-5 text-on-surface-variant/50 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors" />
                                <span className="text-[8px] text-on-surface-variant/50 group-hover:text-amber-600 dark:group-hover:text-amber-400">لوگو</span>
                            </span>
                        )}
                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity grid place-items-center">
                        <Pencil className="w-4 h-4 text-white" />
                    </span>
                </button>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base lg:text-lg font-black text-on-surface truncate max-w-full">{catalog.name}</h2>
                        <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-surface-container-high dark:bg-gray-800 text-on-surface-variant flex-shrink-0">
                            <SalesIcon className="w-2.5 h-2.5" /> {SALES_LABEL[catalog.salesType] || ''}
                        </span>
                        {verified && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300 flex-shrink-0">
                                <BadgeCheck className="w-2.5 h-2.5" /> تایید شده
                            </span>
                        )}
                    </div>

                    {catalog.slug ? (
                        <div className="flex items-center gap-1 mt-1.5">
                            <Link href={`/${catalog.slug}`} target="_blank" title="مشاهده کاتالوگ"
                                  className="inline-flex items-center gap-1 h-6 px-2 rounded border border-amber-500/25 bg-amber-500/5 dark:border-amber-500/25 dark:bg-amber-500/10
                                      text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:border-amber-500/50
                                      transition-colors max-w-[240px]" dir="ltr">
                                <span className="truncate">{host}/{catalog.slug}</span>
                            </Link>
                            <button type="button" onClick={copyLink} aria-label="کپی لینک کاتالوگ" title="کپی لینک"
                                    className="w-6 h-6 rounded grid place-items-center text-on-surface-variant/50
                                        hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-500/5 transition-colors flex-shrink-0">
                                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                    ) : (
                        <button type="button" onClick={onEdit}
                                className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 hover:underline">
                            آدرس کاتالوگ تنظیم نشده — همین حالا تنظیم کن
                        </button>
                    )}
                </div>
            </div>

            {/* توضیح و تلفن — فقط اگر هست (اطلاعات تماسِ مشتری) */}
            {(catalog.shortDescription || catalog.phone) && (
                <div className="rounded-lg bg-surface-container-low/60 dark:bg-gray-800/40 px-3.5 py-3 space-y-1.5">
                    {catalog.shortDescription && (
                        <p className="text-xs text-on-surface-variant leading-6">{catalog.shortDescription}</p>
                    )}
                    {catalog.phone && (
                        <p className="text-xs text-on-surface-variant flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-on-surface-variant/50" />
                            <span dir="ltr" className="font-bold text-on-surface">{catalog.phone}</span>
                        </p>
                    )}
                </div>
            )}

            {/* ── تکمیل کاتالوگ — حلقهٔ درصد همیشه جلوی چشم (حتی ۱۰۰٪) + جملهٔ مشوق ── */}
            <div className={cn('rounded-xl border bg-white dark:bg-gray-900 overflow-hidden',
                percent === 100
                    ? 'border-emerald-300/50 dark:border-emerald-800/50'
                    : 'border-outline-variant/50 dark:border-gray-700')}>
                {percent === 100 ? (
                    /* کامل — حلقهٔ سبز پر + پیام جشن + شیر کن */
                    <div className="p-4 flex items-center gap-3.5">
                        <span className="relative w-12 h-12 flex-shrink-0 grid place-items-center">
                            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                                <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-emerald-500/20" strokeWidth="3.5" />
                                <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-current text-emerald-500"
                                        strokeWidth="3.5" strokeDasharray="100 100" strokeLinecap="round" />
                            </svg>
                            <span className="absolute text-[11px] font-black text-emerald-600 dark:text-emerald-400">{percent.toLocaleString('fa-IR')}٪</span>
                        </span>
                        <p className="flex-1 min-w-0">
                            <span className="block text-sm font-extrabold text-emerald-800 dark:text-emerald-300">
                                کاتالوگت کامل است ✓
                            </span>
                            <span className="block text-[11px] text-on-surface-variant/70 mt-0.5 leading-4">
                                آمادهٔ دیده‌شدن و اعتماد گرفتن — کاتالوگ کامل = اعتماد بیشتر مشتری
                            </span>
                        </p>
                        {canShare && (
                            <button type="button" onClick={onShare} aria-label="اشتراک‌گذاری کاتالوگ"
                                    className="h-9 px-3.5 rounded-lg bg-emerald-600 text-white text-[11px] font-extrabold
                                        flex items-center gap-1.5 flex-shrink-0 shadow-sm shadow-emerald-600/30
                                        hover:bg-emerald-700 active:scale-95 transition-all">
                                <Share2 className="w-3.5 h-3.5" /> شیر کن
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <button type="button" onClick={() => setExpanded((o) => !o)}
                                className="w-full p-4 flex items-center gap-3.5 text-right hover:bg-surface-container-low/50 dark:hover:bg-gray-800/40 transition-colors">
                            <span className="relative w-12 h-12 flex-shrink-0 grid place-items-center">
                                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="15.5" fill="none" className="stroke-outline-variant/30 dark:stroke-gray-700" strokeWidth="3.5" />
                                    <circle cx="18" cy="18" r="15.5" fill="none"
                                            className={cn('stroke-current transition-all duration-700', ringColor)}
                                            strokeWidth="3.5" strokeDasharray={`${percent} 100`} strokeLinecap="round" />
                                </svg>
                                <span className={cn('absolute text-[11px] font-black', ringColor)}>{percent.toLocaleString('fa-IR')}٪</span>
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-sm font-extrabold text-on-surface">کاتالوگت را کامل کن</span>
                                <span className="block text-[11px] text-on-surface-variant/70 mt-0.5">
                                    {missing.toLocaleString('fa-IR')} مورد مانده — کاتالوگ کامل = اعتماد بیشتر مشتری
                                    <span className="text-primary font-bold"> · {expanded ? 'بستن' : 'ببین چی کم است'}</span>
                                </span>
                            </span>
                            <ChevronDown className={cn('w-4 h-4 text-on-surface-variant/40 transition-transform flex-shrink-0', expanded && 'rotate-180')} />
                        </button>

                        {expanded && (
                            <div className="px-4 pb-4 space-y-1.5 border-t border-outline-variant/20 dark:border-gray-700/60 pt-3">
                                {items.map((item) => (
                                    <button key={item.key} type="button"
                                            onClick={() => !item.ok && completion.openItem(item.key)}
                                            disabled={item.ok}
                                            className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-right transition-colors',
                                                item.ok ? 'opacity-60 cursor-default' : 'hover:bg-surface-container-high dark:hover:bg-gray-800 active:scale-[0.99]')}>
                                        <span className={cn('w-5 h-5 rounded-full grid place-items-center flex-shrink-0',
                                            item.ok ? 'bg-emerald-500' : 'border-2 border-outline-variant/50 dark:border-gray-600')}>
                                            {item.ok && <BadgeCheck className="w-3.5 h-3.5 text-white" />}
                                        </span>
                                        <span className={cn('flex-1 text-xs font-bold',
                                            item.ok ? 'text-on-surface-variant/60 line-through' : 'text-on-surface')}>
                                            {item.label}
                                        </span>
                                        {!item.ok && (
                                            <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                                                تکمیل <ChevronLeft className="w-3 h-3" />
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ویرایش کاتالوگ — مداد، طبق خواستهٔ کاربر */}
            <button onClick={onEdit}
                    className="w-full bg-white dark:bg-gray-900 rounded-xl border border-outline-variant/50 dark:border-gray-700
                        p-4 flex items-center gap-3.5 text-right hover:border-amber-500/40 transition-colors">
                <span className="w-11 h-11 rounded-xl bg-surface-container-high dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <Pencil className="w-5 h-5 text-on-surface-variant" />
                </span>
                <span className="flex-1">
                    <span className="block text-sm font-bold text-on-surface">ویرایش اطلاعات کاتالوگ</span>
                    <span className="block text-[11px] text-on-surface-variant mt-0.5">نام، لوگو، آدرس، صنف و تماس</span>
                </span>
            </button>

            {/* 👤 نکتهٔ پروفایل کاربر — کم‌اهمیت‌تر از کار کاتالوگ */}
            {(!userHasName || !userAvatar) && (
                <ProfileBanner avatarUrl={userAvatar} hasName={userHasName} onClick={onProfile} />
            )}
        </div>
    );
}
