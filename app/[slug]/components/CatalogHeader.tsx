// app/[slug]/components/CatalogHeader.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    BadgeCheck, Building2, Package, Phone, User,
    ArrowRight, Share2, Bookmark, Eye, ChevronDown,
    Settings, PenLine, Pencil, X, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSavedCatalogs } from '@/lib/api/apiHooks';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';

const WRAP = 'max-w-xl sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4';

function fmt(n: number | undefined) {
    return n?.toLocaleString('fa-IR') ?? '—';
}

const bizTypeMap: Record<string, string> = {
    producer: 'تولیدی', wholesaler: 'عمده‌فروش', importer: 'واردکننده',
    exporter: 'صادرکننده', distributor: 'توزیع‌کننده', retailer: 'خرده‌فروش',
    contractor: 'پیمانکار', service_provider: 'خدمات', other: 'سایر',
};

interface CatalogHeaderProps {
    catalog: any;
    total: number;
    activeCount: number;
    views: number;
    saves: number;
    isSaved: boolean;
    isOwner: boolean;
    shares: number;
    onContact: () => void;
    onBack: () => void;
    onShare: () => void;
    onSaveToggle: () => void;
    onOpenDashboard: () => void;
    /** ✅ ویرایش درجا */
    onEditCatalog: () => void;
    onEditProfile: () => void;
    /** ✅ مد ویرایش — نوار راهنما بالای صفحه */
    isEditMode?: boolean;
    onExitEditMode?: () => void;
}

export default function CatalogHeader({
                                          catalog, total, activeCount, views, saves, isSaved, isOwner,
                                          onContact, onBack, onShare, onSaveToggle, onOpenDashboard,
                                          onEditCatalog, onEditProfile, shares,
                                          isEditMode, onExitEditMode,
                                      }: CatalogHeaderProps) {
    const router = useRouter();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const tier = catalog.verificationTier;
    const ownerAvatar = catalog.owner?.avatarUrl || catalog.owner?.avatarFile?.thumbnailPath;

    const [showSavedDropdown, setShowSavedDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { data: savedCatalogs = [] } = useSavedCatalogs();

    useEffect(() => {
        if (!showSavedDropdown) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowSavedDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSavedDropdown]);

    // ✅ مداد ویرایش — هویت رنگی مستقل: amber (جدا از برند)
    const EditPencil = ({ onClick, label, className }: { onClick: () => void; label: string; className?: string }) => (
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            aria-label={label}
            title={label}
            className={cn(
                'w-12 h-12 rounded-full grid place-items-center transition-all active:scale-90',
                'bg-amber-50/90 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50',
                'border border-amber-200/70 dark:border-amber-800/50',
                isEditMode
                    ? 'text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-200/50'
                    : 'text-amber-500/70 dark:text-amber-500/60',
                className,
            )}
        >
            <Pencil className="w-5 h-5" />
        </button>
    );

    return (
        <header className={cn('relative pb-3', isEditMode ? 'pt-1' : 'pt-14')}>
            {/* ═══ ✅ نوار حالت ویرایش — رنگ هویتی amber ═══ */}
            {isEditMode && (
                <div className={cn(WRAP, 'pt-3')}>
                    <div className="flex items-center gap-2 rounded-xl border border-amber-300/40 bg-amber-50
                        dark:border-amber-800/50 dark:bg-amber-900/10 px-3 py-2 shadow-sm">
                        <PenLine className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <span className="flex-1 text-[11px] font-bold text-amber-800 dark:text-amber-300 truncate">
                            حالت ویرایش — هر تغییری فوراً روی کاتالوگت اعمال می‌شود
                        </span>

                        {onExitEditMode && (
                            <button onClick={onExitEditMode} aria-label="خروج از حالت ویرایش / پیش‌نمایش"
                                    className="h-8 px-3 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/30
                                        text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1 flex-shrink-0">
                                <Eye className="w-4 h-4" />
                                <span className="text-[9px]">پیش‌نمایش</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ═══ دکمه‌های شناور — در مد ویرایش، زیر نوار می‌آیند ═══ */}
            <div className={cn('absolute inset-x-0 z-30', isEditMode ? 'top-20' : 'top-4')}>
                <div className={cn(WRAP, 'flex justify-between')}>
                    {/* بازگشت */}
                    <button onClick={onBack} aria-label="بازگشت"
                            className="p-2.5 rounded-full bg-white/80 dark:bg-gray-900/70 backdrop-blur border border-gray-200/70 dark:border-white/10 shadow-md hover:scale-105 active:scale-95 transition-transform">
                        <ArrowRight className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                    </button>


                    {/* ═══ سوئیچر کاتالوگ‌های ذخیره شده - وسط ═══ */}
                    {isAuthenticated && savedCatalogs.length > 0 && (
                        <div className="flex justify-center items-center mb-1" ref={dropdownRef}>
                            <button
                                onClick={() => setShowSavedDropdown(!showSavedDropdown)}
                                className="inline-flex items-center gap-1.5 px-4 py-2  pt-2  rounded-full text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors"
                            >
                                {/* ✅ فقط روی دسکتاپ آیکون نشون داده بشه */}
                                <Bookmark className="w-3.5 h-3.5 hidden sm:inline-block" />

                                {/* ✅ تغییر متن در موبایل و دسکتاپ */}
                                <span className="hidden sm:inline ">کاتالوگ‌های ذخیره شده</span>
                                <span className="sm:hidden">ذخیره‌ها</span>

                                <span className="text-[12px] bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded-full">
                                   ({savedCatalogs.length})
                                </span>
                                <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', showSavedDropdown && 'rotate-180')} />
                            </button>

                            {showSavedDropdown && (
                                <div className="absolute top-full mt-1 w-72 bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/70 dark:border-gray-700 shadow-xl overflow-hidden z-50">
                                    <div className="max-h-72 overflow-y-auto py-1">
                                        {savedCatalogs.map((cat: any) => (
                                            <button
                                                key={cat.id}
                                                onClick={() => {
                                                    setShowSavedDropdown(false);
                                                    if (cat.slug !== catalog.slug) {
                                                        router.push(`/${cat.slug}`);
                                                    }
                                                }}
                                                className={cn(
                                                    'w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors text-right',
                                                    cat.slug === catalog.slug
                                                        ? 'bg-primary/5 dark:bg-primary/10'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                )}
                                            >
                                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                                                    {cat.logoUrl ? (
                                                        <Image src={cat.logoUrl} alt={cat.name} width={32} height={32} className="object-cover w-full h-full rounded-lg" unoptimized />
                                                    ) : (
                                                        <div className="w-full h-full grid place-items-center"><Building2 className="w-4 h-4 text-gray-400" /></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold truncate">{cat.name}</p>
                                                    {cat.city && <p className="text-[9px] text-gray-400 truncate">{cat.city}</p>}
                                                </div>
                                                {cat.slug === catalog.slug && (
                                                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* سمت چپ */}
                    <div className="flex items-center gap-2">
                        {/* چرخ‌دنده - فقط مالک */}
                        {isOwner && (
                            <button onClick={onOpenDashboard} aria-label="مدیریت کاتالوگ"
                                    className="p-2.5 rounded-full bg-white/80 dark:bg-gray-900/70 backdrop-blur border border-gray-200/70 dark:border-white/10 shadow-md hover:scale-105 active:scale-95 transition-transform">
                                <Settings className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                            </button>
                        )}

                        {/* ✅ ذخیره */}
                        <button onClick={onSaveToggle}
                                className={cn(
                                    'p-2.5 rounded-full backdrop-blur border shadow-md hover:scale-105 active:scale-95 transition-transform',
                                    isSaved
                                        ? 'bg-primary/10 dark:bg-primary/20 border-primary/30 text-primary'
                                        : 'bg-white/80 dark:bg-gray-900/70 border-gray-200/70 dark:border-white/10 text-gray-700 dark:text-gray-200'
                                )}>
                            <Bookmark className={cn('w-5 h-5', isSaved ? 'fill-primary' : '')} />
                        </button>

                        {/* اشتراک */}
                        <button onClick={onShare} aria-label="اشتراک‌گذاری"
                                className="p-2.5 rounded-full bg-white/80 dark:bg-gray-900/70 backdrop-blur border border-gray-200/70 dark:border-white/10 shadow-md hover:scale-105 active:scale-95 transition-transform">
                            <Share2 className="w-5 h-5 text-gray-700 dark:text-gray-200" />
                        </button>
                    </div>
                </div>
            </div>

            <div className={cn(WRAP, 'pt-4')}>


                <div className={cn('text-center mb-3', isEditMode ? 'pt-16' : 'pt-4')}>
                    <p className="text-[10px] font-bold tracking-[0.35em] text-primary/60">PRODUCT CATALOG</p>
                </div>

                {/* ═══ دسکتاپ ═══ */}
                <div className="hidden sm:block">
                    <div className="relative overflow-hidden rounded-3xl bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl border border-white/60 dark:border-white/10 shadow-xl">
                        <div className="h-1 bg-gradient-to-l from-primary via-fuchsia-500 to-amber-400" />
                        <div className="px-6 py-5">
                            <div className="flex items-center gap-6">
                                {/* ✅ لوگو — گوشه‌های گرد، بدون مداد */}
                                <div className="relative w-20 h-20 shrink-0">
                                    <div className="w-full h-full p-[2px]">
                                        <div className="w-full h-full overflow-hidden">
                                            {catalog.logoUrl ? (
                                                <Image src={catalog.logoUrl} alt={catalog.name} fill sizes="80px" className="object-cover rounded-lg" unoptimized />
                                            ) : (
                                                <div className="w-full h-full grid place-items-center bg-gray-50 dark:bg-gray-800 rounded-lg"><Building2 className="w-8 h-8 text-gray-300" /></div>
                                            )}
                                        </div>
                                    </div>
                                    {tier && tier !== 'none' && (
                                        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white grid place-items-center border-2 border-white dark:border-gray-950 shadow-md">
                                            <BadgeCheck className="w-3.5 h-3.5" />
                                        </div>
                                    )}
                                </div>

                                {/* اطلاعات — ✅ مداد amber جلوی نام کسب‌وکار */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h1 className="text-xl font-extrabold truncate">{catalog.name}</h1>
                                        {isOwner && (
                                            <EditPencil onClick={onEditCatalog} label="ویرایش مشخصات کاتالوگ" className="flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {[bizTypeMap[catalog.type], catalog.city].filter(Boolean).join(' · ')}
                                    </p>
                                    <div className="flex items-center gap-5 mt-2">
                                        <span className="text-xs text-gray-400">
                                            <b className="text-sm font-bold text-gray-900 dark:text-white">{fmt(total)}</b> محصول
                                        </span>
                                        <span className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Share2 className="w-3.5 h-3.5" />
                                            <b className="text-sm font-bold text-gray-900 dark:text-white">{fmt(shares)}</b> اشتراک
                                        </span>
                                        <span className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Eye className="w-3.5 h-3.5" />
                                            <b className="text-sm font-bold text-gray-900 dark:text-white">{fmt(views)}</b> بازدید
                                        </span>
                                        <span className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                                        <span className="text-xs text-gray-400 flex items-center gap-1">
                                            <Bookmark className="w-3.5 h-3.5" />
                                            <b className="text-sm font-bold text-gray-900 dark:text-white">{fmt(saves)}</b> ذخیره
                                        </span>
                                    </div>
                                </div>

                                {/* جداکننده */}
                                <div className="w-px h-16 bg-gray-200 dark:bg-gray-700" />

                                {/* ✅ باکس پروفایل شخصی — همیشه رندر؛ مداد amber جلوی نام کاربر */}
                                <div className="flex items-center gap-3 shrink-0">
                                    {ownerAvatar ? (
                                        <Image src={ownerAvatar} alt={catalog.owner?.fullName || ''} width={70} height={70}
                                               className="rounded-full object-cover w-[52px] h-[52px] ring-2 ring-white dark:ring-gray-800 shadow-md" unoptimized />
                                    ) : (
                                        <div className="w-[52px] h-[52px] rounded-full bg-gray-100 dark:bg-gray-800 grid place-items-center"><User className="w-6 h-6 text-gray-400" /></div>
                                    )}
                                    <div>
                                        <div className="flex items-center gap-1.5">
                                            <div>
                                                <p className="text-sm font-bold truncate max-w-[120px]">{catalog.owner?.fullName || 'پروفایل من'}</p>
                                                <p className="text-[10px] text-gray-400 mt-1 ">{catalog.owner?.bio || 'فروشنده'}</p>
                                            </div>
                                            {isOwner && (
                                                <EditPencil onClick={onEditProfile} label="ویرایش پروفایل من" className="flex-shrink-0" />
                                            )}
                                        </div>

                                        <div className="flex gap-1.5 mt-.5">
                                            <button onClick={onContact}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold active:scale-95 transition">
                                                <Phone className="w-3 h-3" />تماس
                                            </button>
                                            <button onClick={onSaveToggle}
                                                    className={cn(
                                                        'w-8 h-8 rounded-lg border flex items-center justify-center transition-all active:scale-95',
                                                        isSaved
                                                            ? 'bg-primary/10 border-primary text-primary'
                                                            : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-primary'
                                                    )}>
                                                <Bookmark className={cn('w-4 h-4', isSaved ? 'fill-primary' : '')} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {catalog.shortDescription && (
                                <p className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 text-xs leading-6 text-gray-600 dark:text-gray-300 line-clamp-2">
                                    {catalog.shortDescription}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ═══ موبایل ═══ */}
                <div className="sm:hidden">
                    <div className="rounded-2xl bg-white/70 dark:bg-gray-900/40 backdrop-blur-xl border shadow-lg overflow-hidden">
                        <div className="h-0.5 bg-gradient-to-l from-primary via-fuchsia-500 to-amber-400" />
                        <div className="p-4">
                            {/* ✅ موبایل: مداد amber جلوی نام کسب‌وکار */}
                            <div className="flex items-center gap-3">
                                <div className="relative w-14 h-14 shrink-0">
                                    <div className="w-full h-full">
                                        <div className="w-full h-full overflow-hidden">
                                            {catalog.logoUrl ? (
                                                <Image src={catalog.logoUrl} alt={catalog.name} fill sizes="56px" className="object-cover rounded-lg" unoptimized />
                                            ) : (
                                                <div className="w-full h-full grid place-items-center bg-gray-50 dark:bg-gray-800 rounded-lg"><Building2 className="w-6 h-6 text-gray-300" /></div>
                                            )}
                                        </div>
                                    </div>
                                    {tier && tier !== 'none' && (
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 text-white grid place-items-center border-2 border-white dark:border-gray-950">
                                            <BadgeCheck className="w-2.5 h-2.5" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <h1 className="text-base font-extrabold truncate">{catalog.name}</h1>
                                        {isOwner && (
                                            <EditPencil onClick={onEditCatalog} label="ویرایش مشخصات کاتالوگ" className="flex-shrink-0" />
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {[bizTypeMap[catalog.type], catalog.city].filter(Boolean).join(' · ')}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-around mt-3 py-2 border-y border-gray-100 dark:border-gray-800">
                                <div className="text-center">
                                    <p className="text-sm font-bold">{fmt(total)}</p>
                                    <p className="text-[9px] text-gray-400">محصول</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold">{fmt(shares)}</p>
                                    <p className="text-[9px] text-gray-400">اشتراک</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold">{fmt(views)}</p>
                                    <p className="text-[9px] text-gray-400">بازدید</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-bold">{fmt(saves)}</p>
                                    <p className="text-[9px] text-gray-400">ذخیره</p>
                                </div>
                            </div>

                            {/* ✅ موبایل: باکس فروشنده — همیشه رندر؛ مداد amber جلوی نام کاربر */}
                            <div className="flex items-center gap-2.5 mt-3">
                                {ownerAvatar ? (
                                    <Image src={ownerAvatar} alt={catalog.owner?.fullName || ''} width={80} height={80}
                                           className="rounded-full object-cover w-16 h-16" unoptimized />
                                ) : (
                                    <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-800 grid place-items-center"><User className="w-4 h-4 text-gray-400" /></div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <div>
                                            <p className="text-xs font-bold truncate">{catalog.owner?.fullName || 'پروفایل من'}</p>
                                            <p className="text-[11px] text-gray-400 pt-2">{catalog.owner?.bio || 'فروشنده'}</p>
                                        </div>

                                        {isOwner && (
                                            <EditPencil onClick={onEditProfile} label="ویرایش پروفایل من" className="flex-shrink-0" />
                                        )}
                                    </div>

                                </div>
                                <button onClick={onSaveToggle}
                                        className={cn(
                                            'w-8 h-8 rounded-lg border flex items-center justify-center shrink-0',
                                            isSaved ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-400'
                                        )}>
                                    <Bookmark className={cn('w-4 h-4', isSaved ? 'fill-primary' : '')} />
                                </button>
                                <button onClick={onContact}
                                        className="shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-primary text-white text-[10px] font-bold">
                                    <Phone className="w-3 h-3" />تماس
                                </button>
                            </div>

                            {catalog.shortDescription && (
                                <p className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-[11px] leading-5 text-gray-600 dark:text-gray-300 line-clamp-2">
                                    {catalog.shortDescription}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}