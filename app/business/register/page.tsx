// app/business/register/page.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import {
    LibraryBig, Building2, Plus, Loader2, Check, ArrowRight, MapPin,
    AtSign, ChevronDown, ChevronUp, BadgeCheck, AlertTriangle, Search, X, Users,
} from 'lucide-react';
import { useCreateCatalog, useBusinessSearch, useCataloges, useMyBusinesses } from '@/lib/api/apiHooks';
import { RootState } from '@/lib/store/store';
import { setCurrentCatalog } from '@/lib/store/slices/catalogSlice';
import { clearStoredRef, readStoredRef } from '@/app/components/RefCapture';
import BusinessSetupModal from '@/app/components/BusinessSetupModal';
import { IranLocationSelector } from '@/app/components/IranLocationSelector';
import SlugPicker from '@/app/business/register/SlugPicker';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';

/* ─── فارسی ← لاتین برای پیشنهاد خودکار آدرس کاتالوگ ─── */
const FA_LATIN: Record<string, string> = {
    'آ': 'a', 'ا': 'a', 'أ': 'a', 'إ': 'a', 'ب': 'b', 'پ': 'p', 'ت': 't', 'ث': 's',
    'ج': 'j', 'چ': 'ch', 'ح': 'h', 'خ': 'kh', 'د': 'd', 'ذ': 'z', 'ر': 'r', 'ز': 'z',
    'ژ': 'zh', 'س': 's', 'ش': 'sh', 'ص': 's', 'ض': 'z', 'ط': 't', 'ظ': 'z', 'ع': 'a',
    'غ': 'gh', 'ف': 'f', 'ق': 'gh', 'ک': 'k', 'گ': 'g', 'ل': 'l', 'م': 'm', 'ن': 'n',
    'و': 'v', 'ه': 'h', 'ی': 'i', 'ي': 'i', 'ئ': 'i', 'ء': '', 'ة': 'h',
    'َ': '', 'ِ': '', 'ُ': '', 'ّ': '', 'ً': '', 'ٌ': '', 'ٍ': '', 'ْ': '', 'ۀ': 'h',
};

/** نام کسب‌وکار را به یک اسلاگ لاتین معقول تبدیل می‌کند (pakhsh-masaleh-narin) */
function transliterate(raw: string): string {
    return (raw ?? '')
        .split('')
        .map((ch) => FA_LATIN[ch] ?? ch)
        .join('')
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function shortName(n: string, max = 20) {
    return (n || '').length > max ? n.slice(0, max) + '…' : n;
}

function SectionTitle({ n, title }: { n: number; title: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold grid place-items-center flex-shrink-0">{n}</span>
            <h2 className="text-[13px] font-bold text-on-surface">{title}</h2>
        </div>
    );
}

/** چیپ‌های پیشنهادی پست در کسب‌وکار */
const POSITION_CHIPS = ['مدیر', 'مدیر فروش', 'کارمند فروش', 'حسابدار', 'انباردار'];

export default function RegisterCatalogPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { currentSlug: armSlug } = useSelector((state: RootState) => state.arm);

    // ─── جستجوی کسب‌وکار (عمومی — کسب‌وکار مرجع مشترک است) ───
    const [searchQ, setSearchQ] = useState('');
    const [debouncedQ, setDebouncedQ] = useState('');
    const [provinceCode, setProvinceCode] = useState('');
    const [provinceLabel, setProvinceLabel] = useState('');
    const [cityCode, setCityCode] = useState('');
    const [cityLabel, setCityLabel] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(searchQ), 300);
        return () => clearTimeout(t);
    }, [searchQ]);

    const searchParams = useMemo(() => ({
        q: debouncedQ,
        provinceCode: provinceCode || undefined,
        cityCode: cityCode || undefined,
        limit: 12,
    }), [debouncedQ, provinceCode, cityCode]);
    const searchQ2 = useBusinessSearch(searchParams, true);
    const searchItems: any[] = searchQ2.data?.items ?? [];

    // ─── دسترسی سریع به کسب‌وکارهای من (ثبت‌کننده/مالک/عضو تیم) ───
    const myBizQ = useMyBusinesses(true);
    const myBizList: any[] = myBizQ.data?.items ?? [];

    // ─── کسب‌وکار انتخاب‌شده ───
    const [bizId, setBizId] = useState<string | undefined>(() =>
        new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        ).get('bizId') || undefined,
    );
    const [selectedBizOverride, setSelectedBizOverride] = useState<any>(null);
    const deepBizQ = useBusinessSearch(
        useMemo(() => ({ ids: bizId || undefined, limit: 1 }), [bizId]),
        !!bizId && !selectedBizOverride,
    );
    const selectedBiz = selectedBizOverride
        ?? deepBizQ.data?.items?.find((b: any) => b.id === bizId)
        ?? null;

    const [bizModalOpen, setBizModalOpen] = useState(false);

    const [refCode] = useState<string | undefined>(() =>
        new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        ).get('ref') || readStoredRef() || undefined,
    );

    // ─── پست کاربر در کسب‌وکار (عضویت تیم کسب‌وکار) ───
    const [position, setPosition] = useState('');

    const [catalogName, setCatalogName] = useState('');
    const [nameDirty, setNameDirty] = useState(false);
    const [slug, setSlug] = useState('');
    const [slugDirty, setSlugDirty] = useState(false);
    const [slugOpen, setSlugOpen] = useState(false);
    const [slugSuggesting, setSlugSuggesting] = useState(false);
    const [salesType, setSalesType] = useState<'wholesale' | 'retail' | 'service'>('wholesale');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const createCatalogMutation = useCreateCatalog();
    // ✅ گارد سینکرون دابل‌سابمیت — دو کلیک/Enter در یک تیک، قبل از رندرِ مجددِ دکمه، دو درخواست نمی‌زند
    const submittingRef = React.useRef(false);

    // ─── تغییر کسب‌وکار: پیشنهادها تازه می‌شوند (نام + آدرس) ───
    useEffect(() => {
        if (!selectedBiz) return;
        setCatalogName(selectedBiz.name || '');
        setNameDirty(false);
        setSlugDirty(false);
        setSlugOpen(false);
        setErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBiz?.id]);

    // ─── پیشنهاد خودکار آدرس از نام کسب‌وکار + چک آزاد بودن ───
    useEffect(() => {
        if (!selectedBiz || slugDirty) return;
        let alive = true;
        setSlugSuggesting(true);
        (async () => {
            const full = transliterate(selectedBiz.name || '');
            let base = full.slice(0, 30);
            // فقط وقتی برش خورده، نیم‌کلمهٔ آخر را حذف کن
            if (full.length > 30 && base.length > 3) base = base.replace(/-[^-]*$/, '');
            base = base.replace(/^-+|-+$/g, '');
            if (base.length < 3) base = base ? `${base}-shop` : 'catalog';
            const candidates = [base, `${base}-2`, `${base}-3`, `${base}-4`];
            for (let i = 0; i < candidates.length; i++) {
                try {
                    const res = await apiService.catalog.checkSlug(candidates[i]);
                    if (!alive) return;
                    if (res?.available) {
                        setSlug(candidates[i]);
                        setSlugSuggesting(false);
                        return;
                    }
                } catch {
                    // چک در دسترس نبود — همان کاندید اول می‌رود، بک‌اند در صورت نیاز خطا می‌دهد
                    if (alive) { setSlug(candidates[0]); setSlugSuggesting(false); }
                    return;
                }
            }
            if (alive) { setSlug(candidates[0]); setSlugSuggesting(false); }
        })();
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBiz?.id, slugDirty]);

    // ─── هشدار نام تکراری برای کاتالوگ‌های خود کاربر (خطای دیرهنگام بک را پیش‌بینی می‌کند) ───
    const catQ = useCataloges();
    const myCatalogs: any[] = Array.isArray(catQ.data) ? catQ.data : (catQ.data as any)?.items ?? [];
    const catalogNameDup = useMemo(() => {
        const nm = (catalogName || '').trim();
        return !!nm && myCatalogs.some((c: any) => (c.name || '').trim() === nm && c.status === 'active');
    }, [myCatalogs, catalogName]);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!bizId) e.biz = 'ابتدا کسب‌وکار را جستجو و انتخاب کن (یا جدید ثبت کن)';
        if (!position.trim()) e.position = 'پستتان در این کسب‌وکار را بنویسید';
        if (!catalogName.trim()) e.name = 'نام کاتالوگ را وارد کن';
        if (!slug || slug.length < 3) e.slug = 'آدرس کاتالوگ معتبر نیست';
        else if (errors.slug === 'taken' || errors.slug === 'reserved') e.slug = errors.slug;
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (submittingRef.current) return; // ✅ ضد دابل‌کال — وسطِ یک submitِ درجریان هستیم
        if (catalogNameDup) return;
        if (!validate()) return;
        if (!selectedBiz) return;

        submittingRef.current = true;
        try {
            // ✅ صنف، لوگو و مشخصات اصلی هدر از کسب‌وکار ارث می‌رسد
            // ✅ نام کاتالوگ قابل ویرایش است تا کاتالوگ‌های هم‌نام اشتباه نشوند
            const created = await createCatalogMutation.mutateAsync({
                name: catalogName.trim(),
                slug,
                businessId: bizId,
                type: selectedBiz.type || 'wholesaler',
                salesType,
                refCode,
                armSlug,
                phone: '',
                description: '',
                position: position.trim(),
            });

            toast.success(`کاتالوگ «${shortName(catalogName.trim(), 24)}» برای «${shortName(selectedBiz.name, 24)}» ساخته شد 🎉`, {
                description: `آدرس: daymat.ir/${created?.slug || slug}`,
                duration: 6000,
            });
            clearStoredRef();
            // ✅ کاتالوگ کارنت پرسیست — برگشت به «مدیریت کاتالوگ» همین کاتالوگ تازه را باز می‌کند
            // تا کاربر مستقیم بتواند کالاهایش را اضافه کند (الگوی بازار کارنت)
            if (created?.id) {
                dispatch(setCurrentCatalog({
                    id: created.id,
                    name: catalogName.trim(),
                    slug: (created as any)?.slug || slug,
                    businessId: bizId,
                    salesType,
                }));
            }
            router.replace(`/my-catalogs?catalog=${created?.id ?? ''}`);
        } catch (error: any) {
            if (error?.data?.errorCode === 'SLUG_TAKEN') {
                setErrors((p) => ({ ...p, slug: 'taken' }));
                toast.error('این آدرس همین الان گرفته شد — یک کمی عوضش کن');
            } else if (error?.data?.errorCode === 'SLUG_RESERVED') {
                setErrors((p) => ({ ...p, slug: 'reserved' }));
            } else if (error?.data?.errorCode === 'DUPLICATE_CATALOG_NAME') {
                setErrors((p) => ({ ...p, name: 'dup' }));
            } else if (error?.data?.errorCode === 'BUSINESS_HAS_OTHER_CATALOG') {
                // ✅ تعارض عضویت بازار — پیامِ روشنِ خودِ سرور (با رفعِ ارجاعِ یتیم دیگر رخ نمی‌دهد مگر تعارض واقعی)
                toast.error(error?.data?.message || 'شما در این بازار با کاتالوگ دیگری فعال هستید');
            } else {
                toast.error(error?.data?.message || error?.message || 'خطا در ساخت کاتالوگ');
            }
        } finally {
            submittingRef.current = false;
        }
    };

    const busy = createCatalogMutation.isPending;
    const bizLocked = !bizId;
    const submitDisabled = busy || bizLocked || !slug || !!errors.slug || catalogNameDup || !catalogName.trim() || !position.trim();

    return (
        <div className="min-h-screen flex flex-col bg-surface dark:bg-gray-950">
            {/* هدر ساده */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-outline-variant/20">
                <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={() => router.push('/')} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
                        <ArrowRight className="w-4 h-4" /> بازگشت
                    </button>
                    <h1 className="text-sm font-bold text-on-surface">ساخت کاتالوگ</h1>
                    <div className="w-16" />
                </div>
            </header>

            <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-5 pb-[100px]">
                <p className="text-[11px] leading-5 text-on-surface-variant/70 mb-5">
                    کاتالوگت رو در کمتر از ۳۰ ثانیه بساز — مشخصات کسب‌وکار از قبل ثبت‌شده برداشته می‌شود.
                </p>

                {/* ═══ ۱) انتخاب کسب‌وکار — اول جستجو، بعد انتخاب/ثبت ═══ */}
                <section className="mb-5">
                    <div className="mb-2">
                        <SectionTitle n={1} title="کاتالوگت برای کدوم کسب‌وکاره؟" />
                    </div>

                    {selectedBiz ? (
                        /* ── کارتِ کسب‌وکارِ انتخاب‌شده ── */
                        <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3.5 flex items-center gap-3">
                            <span className="w-11 h-11 rounded-xl overflow-hidden bg-primary/10 grid place-items-center flex-shrink-0">
                                {selectedBiz.logoUrl
                                    ? <Image src={selectedBiz.logoUrl} alt="" width={44} height={44} className="w-full h-full object-cover" unoptimized />
                                    : <Building2 className="w-5 h-5 text-primary/70" />}
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-on-surface truncate">{selectedBiz.name}</p>
                                <p className="text-[10px] text-on-surface-variant/70 truncate">
                                    {[selectedBiz.industryName, selectedBiz.city, selectedBiz.province].filter(Boolean).join(' · ')}
                                </p>
                            </div>
                            {selectedBiz._count?.catalogs != null && (
                                <span className="text-[9px] text-on-surface-variant/60 flex items-center gap-1 flex-shrink-0">
                                    <LibraryBig className="w-3 h-3" /> {selectedBiz._count.catalogs}
                                </span>
                            )}
                            <button type="button"
                                    onClick={() => { setBizId(undefined); setSelectedBizOverride(null); setCatalogName(''); setSlug(''); }}
                                    className="w-8 h-8 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-error hover:bg-error/5 transition-colors flex-shrink-0"
                                    title="تغییر کسب‌وکار">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        /* ── پنل جستجو ── */
                        <BizSearchPanel
                            q={searchQ}
                            onQ={setSearchQ}
                            provinceCode={provinceCode}
                            provinceLabel={provinceLabel}
                            cityCode={cityCode}
                            cityLabel={cityLabel}
                            onProvince={(code, label) => { setProvinceCode(code); setProvinceLabel(label); setCityCode(''); setCityLabel(''); }}
                            onCity={(code, label) => { setCityCode(code); setCityLabel(label); }}
                            loading={searchQ2.isFetching}
                            items={searchItems}
                            myItems={myBizList}
                            onPick={(b) => { setBizId(b.id); setSelectedBizOverride(b); setErrors((p) => ({ ...p, biz: '' })); }}
                            onNew={() => setBizModalOpen(true)}
                        />
                    )}
                    {errors.biz && (
                        <p className="mt-2 text-[11px] text-error flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" /> {errors.biz}
                        </p>
                    )}

                </section>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ═══ پست شما در کسب‌وکار — عضویت تیم کسب‌وکار ═══ */}
                    {selectedBiz && (
                        <section className="space-y-1.5">
                            <SectionTitle n={2} title={`پست شما در «${shortName(selectedBiz.name, 18)}»`} />
                            <div className="flex flex-wrap gap-1.5 mb-1">
                                {POSITION_CHIPS.map((p) => (
                                    <button key={p} type="button"
                                            onClick={() => { setPosition(p); setErrors((prev) => ({ ...prev, position: '' })); }}
                                            className={cn(
                                                'px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors',
                                                position === p
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-outline-variant/40 dark:border-gray-700 text-on-surface-variant hover:border-primary/40',
                                            )}>
                                        {p}
                                    </button>
                                ))}
                            </div>
                            <input type="text" value={position} maxLength={60}
                                   onChange={(e) => { setPosition(e.target.value); setErrors((p) => ({ ...p, position: '' })); }}
                                   placeholder="مثلا: مدیر فروش شعبه مرکزی"
                                   className={cn(
                                       'w-full h-11 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest border',
                                       'focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
                                       errors.position ? 'border-error' : 'border-outline-variant/40 dark:border-gray-700',
                                   )} />
                            {errors.position
                                ? <p className="text-[10px] text-error flex items-center gap-1.5 px-1"><AlertTriangle className="w-3 h-3 flex-shrink-0" /> {errors.position}</p>
                                : (
                                    <p className="text-[10px] text-on-surface-variant/60 px-1">
                                        لازم نیست مالک کسب‌وکار باشید — با پستتان به تیمِ این کسب‌وکار اضافه می‌شوید.
                                    </p>
                                )}
                        </section>
                    )}

                    {/* ═══ ۳) نام کاتالوگ — پیش‌فرض نام کسب‌وکار، قابل ویرایش ═══ */}
                    <section className="space-y-1.5">
                        <SectionTitle n={selectedBiz ? 3 : 2} title="نام کاتالوگ" />
                        <input type="text" value={catalogName} maxLength={60}
                               onChange={(e) => { setCatalogName(e.target.value); setNameDirty(true); setErrors((p) => ({ ...p, name: '' })); }}
                               placeholder="مثلا: پخش مصالح نارین — شعبه تهران"
                               className={cn(
                                   'w-full h-11 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest border',
                                   'focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
                                   (errors.name || catalogNameDup) ? 'border-error' : 'border-outline-variant/40 dark:border-gray-700',
                               )} />
                        {catalogNameDup ? (
                            <p className="text-[10px] text-error flex items-center gap-1.5 px-1">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                یه کاتالوگ با همین نام داری — برای تشخیص راحت‌تر کمی عوضش کن
                            </p>
                        ) : (
                            !nameDirty && catalogName && (
                                <p className="text-[10px] text-on-surface-variant/60 px-1">
                                    پیشنهاد ما همون نام کسب‌وکاره؛ اگه می‌خوای توی لیست کاتالوگ‌هات متمایز باشه، تغییرش بده.
                                </p>
                            )
                        )}
                        {errors.name && !catalogNameDup && (
                            <p className="text-[10px] text-error flex items-center gap-1.5 px-1">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {errors.name}
                            </p>
                        )}
                    </section>

                    {/* ═══ آدرس کاتالوگ — خودکار پیشنهاد شده، جمع‌شونده ═══ */}
                    <section className="space-y-1.5">
                        <button type="button" onClick={() => setSlugOpen((o) => !o)}
                                className={cn(
                                    'w-full flex items-center gap-2 h-10 px-3 rounded-xl border border-dashed bg-surface-container-lowest/60',
                                    'border-outline-variant/40 dark:border-gray-700 hover:border-primary/40 transition-colors',
                                )}>
                            <AtSign className="w-3.5 h-3.5 text-on-surface-variant/60 flex-shrink-0" />
                            <span dir="ltr" className="flex-1 text-left text-[12px] font-bold text-on-surface-variant truncate">
                                {slug ? `daymat.ir/${slug}` : 'daymat.ir/…'}
                            </span>
                            {slugSuggesting && !slug
                                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-on-surface-variant/60" />
                                : slugOpen
                                    ? <ChevronUp className="w-3.5 h-3.5 text-on-surface-variant/60" />
                                    : <span className="text-[10px] font-bold text-primary">تغییر</span>}
                        </button>
                        {slugOpen && (
                            <SlugPicker
                                value={slug}
                                onChange={(s: string) => { setSlug(s); setSlugDirty(true); setSlugSuggesting(false); setErrors((p) => ({ ...p, slug: '' })); }}
                                onStatus={(status: string | null) => {
                                    setErrors((p) => ({ ...p, slug: status ?? undefined }));
                                }}
                                disabled={busy}
                            />
                        )}
                        {!slugOpen && (
                            <p className="text-[10px] text-on-surface-variant/60 px-1">
                                آدرس اختصاصی کاتالوگت خودکار پیشنهاد شده؛ اگه دوست داشتی عوضش کن یا بعداً از تب «مشخصات».
                            </p>
                        )}
                        {errors.slug === 'taken' && !slugOpen && (
                            <p className="text-[10px] text-error flex items-center gap-1.5 px-1">
                                <AlertTriangle className="w-3 h-3" /> این آدرس آزاد نیست — برای تغییر کلیک کن
                            </p>
                        )}
                    </section>

                    {/* ═══ ۴) نوع فروش ═══ */}
                    <section className="space-y-2">
                        <SectionTitle n={selectedBiz ? 4 : 3} title="نوع فروش در این کاتالوگ" />
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { v: 'wholesale', t: 'عمده', icon: '📦' },
                                { v: 'retail', t: 'خرده', icon: '🛒' },
                                { v: 'service', t: 'خدمات', icon: '🔧' },
                            ].map((o) => (
                                <button key={o.v} type="button"
                                        onClick={() => setSalesType(o.v as any)}
                                        className={cn(
                                            'rounded-xl border p-3 text-center transition-all',
                                            salesType === o.v
                                                ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                                : 'border-outline-variant/40 dark:border-gray-700 hover:border-primary/30',
                                        )}>
                                    <span className="block text-xl mb-1">{o.icon}</span>
                                    <span className={cn('block text-xs font-bold',
                                        salesType === o.v ? 'text-primary' : 'text-on-surface')}>
                                        {o.t}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* دکمه نهایی — صریح: برای کدام کسب‌وکار */}
                    <button type="submit"
                            disabled={submitDisabled}
                            className={cn(
                                'w-full h-12 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all',
                                submitDisabled
                                    ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed'
                                    : 'bg-primary text-on-primary shadow-lg shadow-primary/25 active:scale-[0.99]',
                            )}>
                        {busy ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال ساخت کاتالوگ…</>
                            : bizLocked ? <><Building2 className="w-4 h-4" /> اول کسب‌وکار را انتخاب کن</>
                            : catalogNameDup ? <><AlertTriangle className="w-4 h-4" /> نام کاتالوگ تکراری است</>
                            : <><LibraryBig className="w-4.5 h-4.5" /> ساخت کاتالوگ برای «{shortName(selectedBiz?.name || '')}»</>}
                    </button>
                </form>
            </main>

            {/* ═══ مودال ثبت کسب‌وکار جدید (با هشدار تکراری‌ثبتی) ═══ */}
            <BusinessSetupModal
                isOpen={bizModalOpen}
                business={null}
                onClose={() => setBizModalOpen(false)}
                onSaved={(biz: any) => {
                    // ✅ کسب‌وکار تازه‌ثبت‌شده (یا انتخاب‌شده از لیست مشابه‌ها) بلافاصله انتخاب می‌شود
                    if (biz?.id) {
                        setBizId(biz.id);
                        setSelectedBizOverride(biz);
                    }
                    searchQ2.refetch();
                }}
            />
        </div>
    );
}

/* ─── پنل جستجوی کسب‌وکار — «اول جستجو کن، تکراری ثبت نکن» ─── */
function BizSearchPanel({ q, onQ, provinceCode, provinceLabel, cityCode, cityLabel, onProvince, onCity, loading, items, myItems, onPick, onNew }: {
    q: string; onQ: (v: string) => void;
    provinceCode: string; provinceLabel: string; cityCode: string; cityLabel: string;
    onProvince: (code: string, label: string) => void;
    onCity: (code: string, label: string) => void;
    loading: boolean; items: any[]; myItems: any[];
    onPick: (b: any) => void; onNew: () => void;
}) {
    const [touched, setTouched] = useState(false);
    return (
        <div className="space-y-2.5">
            {/* دسترسی سریع — کسب‌وکارهایی که عضو یا ثبت‌کننده‌شان هستی */}
            {myItems.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[10px] font-bold text-on-surface-variant/70">کسب‌وکارهای من</p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-slim">
                        {myItems.map((b) => (
                            <button key={b.id} type="button"
                                    onClick={() => onPick(b)}
                                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-outline-variant/40 dark:border-gray-700
                                        bg-surface-container-lowest/60 hover:border-primary/40 hover:bg-primary/5 transition-colors flex-shrink-0">
                                <span className="w-6 h-6 rounded-md overflow-hidden bg-primary/10 grid place-items-center flex-shrink-0">
                                    {b.logoUrl
                                        ? <Image src={b.logoUrl} alt="" width={24} height={24} className="w-full h-full object-cover" unoptimized />
                                        : <Building2 className="w-3 h-3 text-primary/70" />}
                                </span>
                                <span className="text-[11px] font-bold text-on-surface whitespace-nowrap">{shortName(b.name, 18)}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* هشدار — قبل از ثبتِ جدید جستجو کنید */}
            <div className="rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 px-3 py-2.5 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-[10.5px] leading-5 text-amber-800 dark:text-amber-300">
                    شاید همکارانتان این کسب‌وکار را قبلاً ثبت کرده باشند — <b>اول جستجو کنید</b> و از روی نام و لوگو انتخابش کنید تا دیتای تکراری نسازید.
                </p>
            </div>

            {/* جستجو */}
            <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                <input type="text" value={q}
                       onChange={(e) => { onQ(e.target.value); setTouched(true); }}
                       placeholder="جستجو با نام کسب‌وکار…"
                       className="w-full h-11 pr-9 pl-9 text-sm text-right rounded-xl bg-surface-container-lowest border
                           border-outline-variant/40 dark:border-gray-700 focus:ring-2 focus:ring-primary/20
                           focus:border-primary outline-none transition-all" />
                {loading
                    ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                    : q && (
                        <button type="button" onClick={() => onQ('')}
                                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full grid place-items-center text-on-surface-variant/50 hover:text-error hover:bg-error/5">
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
            </div>

            {/* فیلتر موقعیت */}
            <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-on-surface-variant/50 flex-shrink-0" />
                <div className="flex-1">
                    <IranLocationSelector
                        provinceCode={provinceCode}
                        cityCode={cityCode}
                        onProvinceChange={onProvince}
                        onCityChange={onCity}
                    />
                </div>
            </div>

            {/* نتایج */}
            <div className="space-y-1.5">
                {items.map((b) => (
                    <button key={b.id} type="button"
                            onClick={() => onPick(b)}
                            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl border border-outline-variant/30 dark:border-gray-700
                                bg-surface-container-lowest/60 hover:border-primary/40 hover:bg-primary/5 transition-colors text-right">
                        <span className="w-9 h-9 rounded-lg overflow-hidden bg-primary/10 dark:bg-primary/15 grid place-items-center flex-shrink-0">
                            {b.logoUrl
                                ? <Image src={b.logoUrl} alt="" width={36} height={36} className="w-full h-full object-cover" unoptimized />
                                : <Building2 className="w-4 h-4 text-primary/70" />}
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className="flex items-center gap-1">
                                <span className="text-xs font-bold text-on-surface truncate">{b.name}</span>
                                {!!b.verificationTier && b.verificationTier !== 'none' && (
                                    <BadgeCheck className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                )}
                            </span>
                            <span className="block text-[9.5px] text-on-surface-variant/60 truncate">
                                {[b.industryName, b.city].filter(Boolean).join(' · ')}
                                {b._count?.catalogs ? ` · ${b._count.catalogs} کاتالوگ` : ''}
                            </span>
                        </span>
                        <span className="text-[10px] font-bold text-primary flex-shrink-0">انتخاب</span>
                    </button>
                ))}
            </div>

            {touched && !loading && items.length === 0 && (
                <p className="text-[11px] text-on-surface-variant/60 text-center py-2">
                    کسب‌وکاری با این مشخصات پیدا نشد — اگر مطمئنی تکراری نیست، خودت ثبتش کن.
                </p>
            )}

            {/* ثبت کسب‌وکار جدید */}
            <button type="button" onClick={onNew}
                    className="w-full rounded-xl border border-dashed border-primary/40 bg-primary/5
                        p-3.5 flex items-center gap-2.5 text-right hover:bg-primary/10 transition-colors">
                <span className="w-9 h-9 rounded-lg bg-primary/10 grid place-items-center flex-shrink-0">
                    <Plus className="w-4.5 h-4.5 text-primary" />
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-xs font-bold text-on-surface">ثبت کسب‌وکار جدید</span>
                    <span className="block text-[9.5px] text-on-surface-variant/60 mt-0.5">
                        فقط وقتی که در جستجو پیدا نشد — دیتای کسب‌وکار باید یکتا بماند
                    </span>
                </span>
                <Users className="w-4 h-4 text-primary/50 flex-shrink-0" />
            </button>
        </div>
    );
}
