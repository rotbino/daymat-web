// app/business/manage/BusinessManageContent.tsx
// 🏢 صفحهٔ مدیریت کسب‌وکار — مشاهدهٔ کامل مشخصات + ویرایش جداگانهٔ هر بخش با مداد
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import {
    ArrowRight, Pencil, BadgeCheck, MapPin, Loader2, Building2, Plus, User,
    Briefcase, Phone, FileText, Info, LayoutDashboard,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { RootState } from '@/lib/store/store';
import {
    useMyBusinesses, useBusinessDetail, useUpdateBusinessDetail, useSetBusinessActivities,
} from '@/lib/api/apiHooks';
import { ActivitySelectorModal } from '@/components/ActivitySelectorModal';
import { IdentitySwitcher, ManageBusinessItem } from './components/IdentitySwitcher';
import { BusinessLogo, resolveFileSrc } from './components/BusinessLogo';
import { EditableRow } from './components/EditableRow';
import { CompletenessCard } from './components/CompletenessCard';
import { TrustSealCard } from './components/TrustSealCard';
import { LogoEditModal } from './components/LogoEditModal';
import { LocationEditModal } from './components/LocationEditModal';
import { CatalogLinksCard } from './components/CatalogLinksCard';
import { BusinessPreviewCard } from './components/BusinessPreviewCard';

const TIER_COLOR: Record<string, string> = {
    blue: 'text-blue-500',
    silver: 'text-gray-400',
    gold: 'text-green-500',
};

// ── قاب مشترک کارت‌های بخش ──
function SectionCard({
    icon: Icon,
    title,
    subtitle,
    refKey,
    sectionRefs,
    children,
}: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    subtitle?: string;
    refKey?: string;
    sectionRefs?: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
    children: React.ReactNode;
}) {
    return (
        <div
            ref={(el) => {
                if (refKey && sectionRefs) sectionRefs.current[refKey] = el;
            }}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4 sm:p-5"
        >
            <div className="flex items-center gap-2.5 mb-1">
                <span className="w-8 h-8 rounded-lg bg-primary/10 grid place-items-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-extrabold text-on-surface">{title}</p>
                    {subtitle && <p className="text-[10px] text-on-surface-variant/70">{subtitle}</p>}
                </div>
            </div>
            {children}
        </div>
    );
}

export default function BusinessManageContent() {
    const router = useRouter();
    const isAuthenticated = useSelector((s: RootState) => s.auth.isAuthenticated);

    // ── کسب‌وکارهای من + انتخاب فعلی ──
    const { data: myData, isLoading: myLoading } = useMyBusinesses();
    // فقط کسب‌وکارهای قابل‌ویرایش — صفحه، صفحهٔ مدیریت است (ثبت‌کننده/مالک)
    const businesses: ManageBusinessItem[] = useMemo(
        () => (myData?.items ?? []).filter((b: any) => b.canEdit),
        [myData],
    );

    const [currentId, setCurrentId] = useState<string | null>(() =>
        typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('id') : null,
    );

    // ── جزئیات کسب‌وکار انتخابی ──
    const { data: detail, isLoading: detailLoading, isError: detailError } = useBusinessDetail(currentId);

    // ── جهش‌ها ──
    const setActivitiesMutation = useSetBusinessActivities();

    // ── مودال‌ها و پرش ──
    const [logoOpen, setLogoOpen] = useState(false);
    const [activitiesOpen, setActivitiesOpen] = useState(false);
    const [locationOpen, setLocationOpen] = useState(false);
    const [autoOpenKey, setAutoOpenKey] = useState<string | null>(null);
    const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const updateMutation = useUpdateBusinessDetail();
    const saveFields = async (data: Record<string, any>) => {
        if (!detail) return;
        await updateMutation.mutateAsync({ id: detail.id, data });
        toast.success('ذخیره شد');
    };

    // گارد لاگین (AuthProvider هم محافظت می‌کند — این لایهٔ دوم است)
    useEffect(() => {
        if (!isAuthenticated) {
            const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
            if (!hasToken) router.replace('/login?redirect=/business/manage');
        }
    }, [isAuthenticated, router]);

    // همگام‌سازی انتخاب با لیست (دِپ‌لینک ?id یا اولین کسب‌وکار قابل‌ویرایش)
    useEffect(() => {
        if (myLoading || businesses.length === 0) return;
        if (currentId && businesses.some((b) => b.id === currentId)) return;
        const first = businesses.find((b) => b.canEdit) || businesses[0];
        setCurrentId(first.id);
        router.replace(`/business/manage?id=${first.id}`, { scroll: false });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [businesses, myLoading]);

    const selectBusiness = (id: string) => {
        if (id === currentId) return;
        setCurrentId(id);
        setAutoOpenKey(null);
        router.replace(`/business/manage?id=${id}`, { scroll: false });
    };

    // ── درصد کامل‌بودن پروفایل ──
    const completeness = useMemo(() => {
        const checks: { key: string; label: string; ok: boolean; weight: number }[] = [
            { key: 'logo', label: 'لوگوی کسب‌وکار', ok: !!detail?.logoUrl, weight: 15 },
            { key: 'shortDescription', label: 'توضیح یک‌خطی', ok: !!detail?.shortDescription, weight: 10 },
            { key: 'activities', label: 'زمینه‌های فعالیت', ok: (detail?.activities?.length ?? 0) > 0, weight: 15 },
            { key: 'industry', label: 'صنف کسب‌وکار', ok: !!(detail?.industryName || detail?.industryId), weight: 10 },
            { key: 'phone', label: 'شماره تماس', ok: !!detail?.phone, weight: 10 },
            { key: 'location', label: 'استان و شهر', ok: !!(detail?.cityCode || detail?.city), weight: 10 },
            { key: 'address', label: 'آدرس دقیق', ok: !!detail?.address, weight: 5 },
            { key: 'description', label: 'درباره کسب‌وکار', ok: !!detail?.description, weight: 10 },
            { key: 'website', label: 'وبسایت', ok: !!detail?.website, weight: 5 },
            { key: 'startYear', label: 'سال شروع فعالیت', ok: !!detail?.businessStartYear, weight: 10 },
        ];
        const percent = checks.reduce((s, c) => s + (c.ok ? c.weight : 0), 0);
        return { percent, items: checks.map(({ key, label, ok }) => ({ key, label, ok })) };
    }, [detail]);

    // پرش از چک‌لیست به بخش مربوطه
    const jump = (key: string) => {
        const map: Record<string, { ref: string; edit?: string; modal?: 'logo' | 'activities' | 'location' }> = {
            logo: { ref: 'hero', modal: 'logo' },
            shortDescription: { ref: 'identity', edit: 'shortDescription' },
            industry: { ref: 'identity', edit: 'industryName' },
            startYear: { ref: 'identity', edit: 'businessStartYear' },
            activities: { ref: 'activities', modal: 'activities' },
            phone: { ref: 'contact', edit: 'phone' },
            website: { ref: 'contact', edit: 'website' },
            location: { ref: 'contact', modal: 'location' },
            address: { ref: 'contact', edit: 'address' },
            description: { ref: 'about', edit: 'description' },
        };
        const target = map[key];
        if (!target) return;
        sectionRefs.current[target.ref]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (target.modal === 'logo') setLogoOpen(true);
        if (target.modal === 'activities') setActivitiesOpen(true);
        if (target.modal === 'location') setLocationOpen(true);
        if (target.edit) setAutoOpenKey(target.edit);
    };

    const handleActivitiesSelect = async (ids: string[]) => {
        if (!detail) return;
        try {
            await setActivitiesMutation.mutateAsync({ id: detail.id, activityIds: ids });
        } catch {
            /* توست خطا در هوک */
        }
    };

    // ═══════════ حالت‌های خاص ═══════════
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen grid place-items-center bg-surface dark:bg-gray-950">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (myLoading) {
        return (
            <div className="min-h-screen bg-surface dark:bg-gray-950">
                <HeaderShell>
                    <span className="text-[13px] font-black text-on-surface/60">مدیریت کسب‌وکار</span>
                </HeaderShell>
                <div className="max-w-6xl mx-auto px-4 pt-8 grid place-items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    if (businesses.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40">
                <HeaderShell>
                    <span className="text-[13px] font-black text-on-surface">مدیریت کسب‌وکار</span>
                </HeaderShell>
                <div className="max-w-md mx-auto px-4 pt-14">
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-8 flex flex-col items-center gap-3 text-center">
                        <span className="w-14 h-14 rounded-2xl bg-primary/10 grid place-items-center">
                            <Building2 className="w-7 h-7 text-primary" />
                        </span>
                        <p className="text-sm font-extrabold text-on-surface">هنوز کسب‌وکاری ثبت نکرده‌ای</p>
                        <p className="text-[11px] text-on-surface-variant/70 leading-5">
                            اول کسب‌وکارت را ثبت کن؛ بعد می‌توانی مشخصات، کاتالوگ‌ها و تیک اعتمادش را از همین‌جا
                            مدیریت کنی.
                        </p>
                        <button
                            type="button"
                            onClick={() => router.push('/business/register')}
                            className="mt-2 h-11 px-6 rounded-xl bg-primary text-on-primary text-xs font-extrabold flex items-center gap-2 hover:bg-primary/90 active:scale-95 transition-all shadow-sm shadow-primary/25"
                        >
                            <Plus className="w-4 h-4" /> ثبت کسب‌وکار
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const activities = (detail?.activities || []).map((a: any) => a?.activity).filter(Boolean);
    const members = detail?.members || [];
    const tierColor = TIER_COLOR[detail?.verificationTier || ''] || 'text-emerald-500';

    // کارت‌های ستون کنار (دسکتاپ) — در موبایل هم در جایشان تکرار می‌شوند
    const completenessCard = (
        <CompletenessCard percent={completeness.percent} items={completeness.items} onJump={jump} />
    );
    const trustCard = detail ? (
        <TrustSealCard
            businessId={detail.id}
            businessName={detail.name}
            verificationStatus={detail.verificationStatus}
            verificationTier={detail.verificationTier}
            businessLicense={detail.businessLicense}
            autoOpenKey={autoOpenKey}
            onOpened={() => setAutoOpenKey(null)}
            onSaveLicense={(v) => saveFields({ businessLicense: v })}
        />
    ) : null;
    const catalogsCard = (
        <CatalogLinksCard catalogs={(detail?.catalogs || []) as any} />
    );
    const previewCard = detail ? <BusinessPreviewCard business={detail} /> : null;
    const teaserCard = (
        <div className="rounded-2xl border border-dashed border-outline-variant/60 dark:border-gray-700 p-4 flex items-center gap-3 opacity-80">
            <span className="w-8 h-8 rounded-lg bg-surface-container-high dark:bg-gray-800 grid place-items-center flex-shrink-0">
                <LayoutDashboard className="w-4 h-4 text-on-surface-variant/70" />
            </span>
            <div className="flex-1 min-w-0">
                <p className="text-[12px] font-extrabold text-on-surface-variant">داشبورد کسب‌وکار</p>
                <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
                    به‌زودی — آمار بازدید، تماس و فروش اینجا نمایش داده می‌شود.
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40">
            <HeaderShell>
                <button
                    type="button"
                    onClick={() => router.push('/profile')}
                    aria-label="بازگشت"
                    className="w-9 h-9 rounded-xl grid place-items-center text-on-surface-variant hover:text-primary hover:bg-primary/10 active:scale-90 transition-all flex-shrink-0"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>
                <h1 className="text-[13px] sm:text-sm font-black text-on-surface whitespace-nowrap">
                    مدیریت کسب‌وکار
                </h1>
                <div className="flex-1" />
                <IdentitySwitcher businesses={businesses} currentId={currentId} onSelect={selectBusiness} />
            </HeaderShell>

            <main className="max-w-6xl mx-auto px-4 pt-4 lg:pt-6 pb-16">
                {detailLoading || !detail ? (
                    detailError ? (
                        <div className="max-w-md mx-auto pt-14">
                            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-8 flex flex-col items-center gap-3 text-center">
                                <Building2 className="w-8 h-8 text-on-surface-variant/40" />
                                <p className="text-sm font-extrabold text-on-surface">این کسب‌وکار در دسترس نیست</p>
                                <p className="text-[11px] text-on-surface-variant/70">
                                    ممکن است دسترسی ویرایش نداشته باشید یا حذف شده باشد.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid place-items-center pt-16">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    )
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_330px] gap-4 lg:gap-5 lg:items-start">
                        {/* ═══ ستون اصلی ═══ */}
                        <div className="space-y-4 min-w-0">
                            {/* ── هویت — لوگو، نام، نشان‌ها ── */}
                            <div
                                ref={(el) => {
                                    sectionRefs.current['hero'] = el;
                                }}
                                className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4 sm:p-5"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="relative flex-shrink-0">
                                        <BusinessLogo
                                            logoUrl={detail.logoUrl}
                                            name={detail.name}
                                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setLogoOpen(true)}
                                            aria-label="تغییر لوگو"
                                            className="absolute -bottom-1.5 -left-1.5 w-7 h-7 rounded-full bg-primary text-on-primary grid place-items-center shadow-md shadow-primary/30 hover:bg-primary/90 active:scale-90 transition-all"
                                        >
                                            <Pencil className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <h2 className="text-base sm:text-lg font-black text-on-surface truncate">
                                                {detail.name}
                                            </h2>
                                            {detail.verificationStatus === 'approved' && (
                                                <BadgeCheck
                                                    className={cn('w-4.5 h-4.5 flex-shrink-0', tierColor)}
                                                    aria-label="تیک اعتماد تأییدشده"
                                                />
                                            )}
                                        </div>
                                        <p className="text-[11px] text-on-surface-variant/70 mt-1 leading-4 line-clamp-2">
                                            {detail.shortDescription || 'یک توضیح یک‌خطی دربارهٔ کسب‌وکارت بنویس…'}
                                        </p>
                                        <div className="flex flex-wrap gap-1.5 mt-2">
                                            {(detail.city || detail.province) && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-on-surface-variant bg-surface-container-high dark:bg-gray-800 rounded-full px-2 py-0.5">
                                                    <MapPin className="w-3 h-3" />
                                                    {detail.city || detail.province}
                                                </span>
                                            )}
                                            {detail.industryName && (
                                                <span className="text-[10px] font-bold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                                                    {detail.industryName}
                                                </span>
                                            )}
                                            {activities.length > 0 && (
                                                <span className="text-[10px] font-bold text-on-surface-variant bg-surface-container-high dark:bg-gray-800 rounded-full px-2 py-0.5">
                                                    {activities.length.toLocaleString('fa-IR')} زمینه فعالیت
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* تیم کسب‌وکار */}
                                {members.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-outline-variant/20 dark:border-gray-700/60 flex items-center gap-2">
                                        <div className="flex -space-x-2 space-x-reverse">
                                            {members.slice(0, 5).map((m: any) => (
                                                <span
                                                    key={m.id}
                                                    className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-gray-900 overflow-hidden bg-surface-container-high grid place-items-center flex-shrink-0"
                                                >
                                                    {m.user?.avatarUrl ? (
                                                        <Image
                                                            src={resolveFileSrc(m.user.avatarUrl)!}
                                                            alt={m.user?.fullName || ''}
                                                            width={24}
                                                            height={24}
                                                            className="w-full h-full object-cover"
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <User className="w-3 h-3 text-on-surface-variant/50" />
                                                    )}
                                                </span>
                                            ))}
                                        </div>
                                        <span className="text-[10px] text-on-surface-variant/70">
                                            {members.length.toLocaleString('fa-IR')} نفر در تیم کسب‌وکار
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* ── کامل‌بودن — فقط موبایل (دسکتاپ در ستون کنار) ── */}
                            <div className="lg:hidden">{completenessCard}</div>

                            {/* ── مشخصات کسب‌وکار ── */}
                            <SectionCard
                                icon={FileText}
                                title="مشخصات کسب‌وکار"
                                subtitle="نام، توضیح کوتاه، صنف و سال شروع"
                                refKey="identity"
                                sectionRefs={sectionRefs}
                            >
                                <div className="divide-y divide-outline-variant/20 dark:divide-gray-700/60">
                                    <EditableRow
                                        fieldKey="name"
                                        label="نام"
                                        value={detail.name}
                                        autoOpenKey={autoOpenKey}
                                        onOpened={() => setAutoOpenKey(null)}
                                        onSave={(v) => saveFields({ name: v })}
                                        maxLength={120}
                                    />
                                    <EditableRow
                                        fieldKey="shortDescription"
                                        label="توضیح یک‌خطی"
                                        value={detail.shortDescription}
                                        placeholder="مثلاً: عمده‌فروشی پفک و اسنک"
                                        autoOpenKey={autoOpenKey}
                                        onOpened={() => setAutoOpenKey(null)}
                                        onSave={(v) => saveFields({ shortDescription: v })}
                                        maxLength={120}
                                    />
                                    <EditableRow
                                        fieldKey="industryName"
                                        label="صنف"
                                        value={detail.industryName}
                                        placeholder="مثلاً: خواروبار"
                                        autoOpenKey={autoOpenKey}
                                        onOpened={() => setAutoOpenKey(null)}
                                        onSave={(v) => saveFields({ industryName: v })}
                                        maxLength={60}
                                    />
                                    <EditableRow
                                        fieldKey="businessStartYear"
                                        label="سال شروع"
                                        value={detail.businessStartYear}
                                        placeholder="مثلاً: ۱۳۹۵"
                                        type="number"
                                        dir="ltr"
                                        autoOpenKey={autoOpenKey}
                                        onOpened={() => setAutoOpenKey(null)}
                                        onSave={(v) => saveFields({ businessStartYear: v ? Number(v) : null })}
                                    />
                                </div>
                            </SectionCard>

                            {/* ── زمینه‌های فعالیت ── */}
                            <SectionCard
                                icon={Briefcase}
                                title="زمینه‌های فعالیت"
                                subtitle="چه چیزهایی می‌فروشید یا تولید می‌کنید"
                                refKey="activities"
                                sectionRefs={sectionRefs}
                            >
                                <div className="flex items-start gap-3 py-2">
                                    <div className="flex-1 min-w-0">
                                        {activities.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {activities.map((a: any) => (
                                                    <span
                                                        key={a.id}
                                                        className="text-[11px] font-bold text-primary bg-primary/10 rounded-full px-2.5 py-1"
                                                    >
                                                        {a.title}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-[12px] text-on-surface-variant/40 leading-5">
                                                هنوز زمینه‌ای انتخاب نشده — با مداد اضافه کن تا خریدارها راحت‌تر
                                                پیدایت کنند.
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setActivitiesOpen(true)}
                                        aria-label="ویرایش زمینه‌های فعالیت"
                                        className="w-8 h-8 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-primary hover:bg-primary/10 active:scale-90 transition-all flex-shrink-0"
                                    >
                                        <Pencil className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </SectionCard>

                            {/* ── تماس و آدرس ── */}
                            <SectionCard
                                icon={Phone}
                                title="تماس و آدرس"
                                subtitle="راه‌های ارتباطی و موقعیت کسب‌وکار"
                                refKey="contact"
                                sectionRefs={sectionRefs}
                            >
                                <div className="divide-y divide-outline-variant/20 dark:divide-gray-700/60">
                                    <EditableRow
                                        fieldKey="phone"
                                        label="تلفن"
                                        value={detail.phone}
                                        type="tel"
                                        dir="ltr"
                                        placeholder="مثلاً: 09123456789"
                                        autoOpenKey={autoOpenKey}
                                        onOpened={() => setAutoOpenKey(null)}
                                        onSave={(v) => saveFields({ phone: v })}
                                    />
                                    <EditableRow
                                        fieldKey="website"
                                        label="وبسایت"
                                        value={detail.website}
                                        type="url"
                                        dir="ltr"
                                        placeholder="مثلاً: https://example.ir"
                                        autoOpenKey={autoOpenKey}
                                        onOpened={() => setAutoOpenKey(null)}
                                        onSave={(v) => saveFields({ website: v })}
                                    />
                                    {/* استان و شهر — ویرایش با مودال */}
                                    <div className="flex items-start gap-3 py-2.5">
                                        <div className="w-24 sm:w-28 flex-shrink-0 flex items-center gap-1.5 pt-0.5">
                                            <MapPin className="w-3.5 h-3.5 text-on-surface-variant/60 flex-shrink-0" />
                                            <span className="text-[11px] text-on-surface-variant">استان و شهر</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            {detail.city || detail.province ? (
                                                <p className="text-[13px] font-bold text-on-surface leading-5">
                                                    {[detail.province, detail.city].filter(Boolean).join(' / ')}
                                                </p>
                                            ) : (
                                                <p className="text-[12px] text-on-surface-variant/40">وارد نشده</p>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setLocationOpen(true)}
                                            aria-label="ویرایش استان و شهر"
                                            className="w-8 h-8 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-primary hover:bg-primary/10 active:scale-90 transition-all flex-shrink-0"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <EditableRow
                                        fieldKey="address"
                                        label="آدرس"
                                        value={detail.address}
                                        type="textarea"
                                        placeholder="آدرس کامل محل کسب‌وکار"
                                        autoOpenKey={autoOpenKey}
                                        onOpened={() => setAutoOpenKey(null)}
                                        onSave={(v) => saveFields({ address: v })}
                                    />
                                </div>
                            </SectionCard>

                            {/* ── درباره کسب‌وکار ── */}
                            <SectionCard
                                icon={Info}
                                title="درباره کسب‌وکار"
                                subtitle="معرفی کامل برای خریداران"
                                refKey="about"
                                sectionRefs={sectionRefs}
                            >
                                <EditableRow
                                    fieldKey="description"
                                    label="توضیحات"
                                    value={detail.description}
                                    type="textarea"
                                    placeholder="از تاریخچه، تخصص و مزیت‌های کسب‌وکارت بنویس…"
                                    autoOpenKey={autoOpenKey}
                                    onOpened={() => setAutoOpenKey(null)}
                                    onSave={(v) => saveFields({ description: v })}
                                />
                            </SectionCard>

                            {/* ── تیک اعتماد + کاتالوگ‌ها + نمای مشتری — فقط موبایل ── */}
                            <div className="lg:hidden space-y-4">
                                {trustCard}
                                {catalogsCard}
                                {previewCard}
                                {teaserCard}
                            </div>
                        </div>

                        {/* ═══ ستون کنار — فقط دسکتاپ ═══ */}
                        <aside className="hidden lg:block space-y-4 lg:sticky lg:top-20">
                            {completenessCard}
                            {trustCard}
                            {catalogsCard}
                            {previewCard}
                            {teaserCard}
                        </aside>
                    </div>
                )}
            </main>

            {/* ── مودال‌ها ── */}
            {detail && (
                <>
                    <LogoEditModal
                        isOpen={logoOpen}
                        onClose={() => setLogoOpen(false)}
                        businessId={detail.id}
                        logoUrl={detail.logoUrl}
                        name={detail.name}
                    />
                    <ActivitySelectorModal
                        isOpen={activitiesOpen}
                        onClose={() => setActivitiesOpen(false)}
                        selectedIds={activities.map((a: any) => a.id)}
                        onSelect={handleActivitiesSelect}
                        max={8}
                        title="زمینه‌های فعالیت کسب‌وکار"
                    />
                    <LocationEditModal
                        isOpen={locationOpen}
                        onClose={() => setLocationOpen(false)}
                        initial={{
                            province: detail.province,
                            provinceCode: detail.provinceCode,
                            city: detail.city,
                            cityCode: detail.cityCode,
                        }}
                        onSave={async (val) => {
                            await saveFields(val);
                            setLocationOpen(false);
                        }}
                    />
                </>
            )}
        </div>
    );
}

// ── هدر چسبان مشترک حالت‌های مختلف ──
function HeaderShell({ children }: { children: React.ReactNode }) {
    return (
        <header className="sticky top-0 z-40 bg-surface/90 dark:bg-gray-950/90 backdrop-blur border-b border-outline-variant/40 dark:border-gray-800">
            <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-2">{children}</div>
        </header>
    );
}
