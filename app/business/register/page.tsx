// app/business/register/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import {
    LibraryBig, Building2, Plus, Loader2, Check, ArrowRight, MapPin,
    AtSign, ChevronDown, ChevronUp, BadgeCheck, AlertTriangle,
} from 'lucide-react';
import { useCreateCatalog, useMyBusinesses, useCataloges } from '@/lib/api/apiHooks';
import { RootState } from '@/lib/store/store';
import { setCurrentCatalog } from '@/lib/store/slices/catalogSlice';
import { clearStoredRef, readStoredRef } from '@/app/components/RefCapture';
import BusinessSetupModal from '@/app/components/BusinessSetupModal';
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
        .map((ch) => {
            if (/[a-zA-Z0-9]/.test(ch)) return ch.toLowerCase();
            if (ch === ' ' || ch === '-' || ch === '_') return '-';
            const m = FA_LATIN[ch];
            return m !== undefined ? m : '';
        })
        .join('')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

const faDigit = (n: number | string) => String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d]);
const shortName = (s: string, max = 18) => (s && s.length > max ? `${s.slice(0, max).trimEnd()}…` : s);

/** عنوان شماره‌دار بخش‌ها — ساختار ۱/۲/۳ برای شفافیت جریان */
function SectionTitle({ n, title }: { n: number; title: string }) {
    return (
        <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold grid place-items-center flex-shrink-0">
                {faDigit(n)}
            </span>
            <h2 className="text-xs font-extrabold text-on-surface">{title}</h2>
        </div>
    );
}

export default function RegisterCatalogPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { currentSlug: armSlug } = useSelector((state: RootState) => state.arm);

    const bizQ = useMyBusinesses(true);
    const myBizList: any[] = bizQ.data?.items ?? [];
    const hasBizList = !!bizQ.data;

    const catQ = useCataloges();
    const myCatalogs: any[] = Array.isArray(catQ.data) ? catQ.data : (catQ.data as any)?.items ?? [];

    const [bizId, setBizId] = useState<string | undefined>(() =>
        new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        ).get('bizId') || undefined,
    );
    const [bizModalOpen, setBizModalOpen] = useState(false);
    const [bizModalMode, setBizModalMode] = useState<'create' | 'edit'>('create');
    const [bizModalAuto, setBizModalAuto] = useState(false);

    const [refCode] = useState<string | undefined>(() =>
        new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        ).get('ref') || readStoredRef() || undefined,
    );

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

    const selectedBiz = useMemo(
        () => myBizList.find((b) => b.id === bizId) ?? null,
        [myBizList, bizId],
    );

    // ─── منطق نهاد: خودکار برای اکثریت ───
    useEffect(() => {
        if (bizId || !hasBizList) return;
        if (myBizList.length === 1) {
            setBizId(myBizList[0].id);
        } else if (myBizList.length === 0) {
            setBizModalMode('create');
            setBizModalAuto(true);
        }
    }, [bizId, hasBizList, myBizList]);

    useEffect(() => {
        if (bizModalAuto) {
            setBizModalOpen(true);
            setBizModalAuto(false);
        }
    }, [bizModalAuto]);

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

    // ─── هشدار نام تکراری برای همان کسب‌وکار (خطای دیرهنگام بک را پیش‌بینی می‌کند) ───
    const nameDup = useMemo(() => {
        const nm = (catalogName || '').trim();
        if (!bizId || !nm) return false;
        return myCatalogs.some((c: any) => {
            const rawBiz = c.businessId ?? c.business?._id ?? c.business?.id;
            const cBizId = typeof rawBiz === 'string' ? rawBiz : rawBiz?.id ?? rawBiz?.$oid;
            return cBizId === bizId && (c.name || '').trim() === nm && c.status === 'active';
        });
    }, [myCatalogs, bizId, catalogName]);

    const validate = () => {
        const e: Record<string, string> = {};
        if (!bizId) e.biz = 'ابتدا کسب‌وکار را انتخاب یا ثبت کن';
        if (!catalogName.trim()) e.name = 'نام کاتالوگ را وارد کن';
        if (!slug || slug.length < 3) e.slug = 'آدرس کاتالوگ معتبر نیست';
        else if (errors.slug === 'taken' || errors.slug === 'reserved') e.slug = errors.slug;
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (submittingRef.current) return; // ✅ ضد دابل‌کال — وسطِ یک submitِ درجریان هستیم
        if (nameDup) return;
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
                position: 'مالک و مسوول فروش',
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
    const submitDisabled = busy || bizLocked || !slug || !!errors.slug || nameDup || !catalogName.trim();

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
                    کاتالوگت رو در کمتر از ۳۰ ثانیه بساز .
                </p>

                {/* ═══ ۱) انتخاب کسب‌وکار ═══ */}
                <section className="mb-5">
                    <div className="mb-2">
                        <SectionTitle n={1} title="ساخت کاتالوگ برای کدوم کسب‌وکار؟" />
                    </div>

                    {hasBizList && myBizList.length > 0 && (
                        <BizCombo
                            items={myBizList}
                            selectedId={bizId}
                            onPick={(id: string) => { setBizId(id); setErrors((p) => ({ ...p, biz: '' })); }}
                            onNew={() => { setBizModalMode('create'); setBizModalOpen(true); }}
                        />
                    )}
                    {hasBizList && myBizList.length === 0 && (
                        <button type="button" onClick={() => { setBizModalMode('create'); setBizModalOpen(true); }}
                                className="mb-3 w-full rounded-xl border border-dashed border-primary/40 bg-primary/5
                                    p-4 flex items-center gap-2.5 text-right hover:bg-primary/10 transition-colors">
                            <Building2 className="w-5 h-5 text-primary flex-shrink-0" />
                            <span className="flex-1 text-sm font-bold text-on-surface">اول کسب‌وکارت را ثبت کن</span>
                            <Plus className="w-4 h-4 text-primary" />
                        </button>
                    )}
                    {errors.biz && (
                        <p className="mb-3 text-[11px] text-error flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" /> {errors.biz}
                        </p>
                    )}

                </section>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ═══ ۲) نام کاتالوگ — پیش‌فرض نام کسب‌وکار، قابل ویرایش ═══ */}
                    <section className="space-y-1.5">
                        <SectionTitle n={2} title="نام کاتالوگ" />
                        <input type="text" value={catalogName} maxLength={60}
                               onChange={(e) => { setCatalogName(e.target.value); setNameDirty(true); setErrors((p) => ({ ...p, name: '' })); }}
                               placeholder="مثلا: پخش مصالح نارین — شعبه تهران"
                               className={cn(
                                   'w-full h-11 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest border',
                                   'focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
                                   (errors.name || nameDup) ? 'border-error' : 'border-outline-variant/40 dark:border-gray-700',
                               )} />
                        {nameDup ? (
                            <p className="text-[10px] text-error flex items-center gap-1.5 px-1">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                                برای این کسب‌وکار یه کاتالوگ با همین نام داری — برای تشخیص راحت‌تر کمی عوضش کن
                            </p>
                        ) : (
                            !nameDirty && catalogName && (
                                <p className="text-[10px] text-on-surface-variant/60 px-1">
                                    پیشنهاد ما همون نام کسب‌وکاره؛ اگه می‌خوای توی لیست کاتالوگ‌هات متمایز باشه، تغییرش بده.
                                </p>
                            )
                        )}
                        {errors.name && !nameDup && (
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

                    {/* ═══ ۳) نوع فروش ═══ */}
                    <section className="space-y-2">
                        <SectionTitle n={3} title="نوع فروش در این کاتالوگ" />
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
                            : bizLocked ? <><Building2 className="w-4 h-4" /> اول کسب‌وکار را ثبت کن</>
                            : nameDup ? <><AlertTriangle className="w-4 h-4" /> نام کاتالوگ تکراری است</>
                            : <><LibraryBig className="w-4.5 h-4.5" /> ساخت کاتالوگ برای «{shortName(selectedBiz?.name || '')}»</>}
                    </button>
                </form>
            </main>

            {/* ═══ مودال ساخت/ویرایش کسب‌وکار ═══ */}
            <BusinessSetupModal
                isOpen={bizModalOpen}
                business={bizModalMode === 'edit' ? selectedBiz : null}
                onClose={() => setBizModalOpen(false)}
                onSaved={(biz: any) => {
                    // ✅ کسب‌وکار تازه‌ثبت‌شده بلافاصله انتخاب می‌شود
                    if (bizModalMode === 'create' && biz?.id) setBizId(biz.id);
                    bizQ.refetch();
                }}
            />
        </div>
    );
}

/* ─── کمبوی ظریف نهاد — با لوگو و آواتار ─── */
function BizCombo({ items, selectedId, onPick, onNew }: {
    items: any[]; selectedId?: string; onPick: (id: string) => void; onNew: () => void;
}) {
    const [open, setOpen] = useState(false);
    const selected = items.find((b) => b.id === selectedId);
    return (
        <div className="relative">
            <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setOpen((o) => !o)}
                        className={cn(
                            'flex-1 h-11 px-3.5 rounded-xl bg-surface-container-lowest border flex items-center gap-2.5',
                            'border-outline-variant/40 dark:border-gray-700 focus:ring-2 focus:ring-primary/20',
                            'focus:border-primary outline-none transition-all text-right',
                            open && 'ring-2 ring-primary/20 border-primary',
                        )}>
                    <span className="w-7 h-7 rounded-md overflow-hidden bg-primary/10 dark:bg-primary/15 grid place-items-center flex-shrink-0">
                        {selected?.logoUrl
                            ? <Image src={selected.logoUrl} alt="" width={28} height={28} className="w-full h-full object-cover" unoptimized />
                            : <Building2 className="w-3.5 h-3.5 text-primary/70" />}
                    </span>
                    <span className={cn('flex-1 text-sm truncate', selected ? 'text-on-surface font-medium' : 'text-on-surface-variant/50')}>
                        {selected ? selected.name : 'انتخاب کسب‌وکار…'}
                    </span>
                    {open ? <ChevronUp className="w-4 h-4 text-on-surface-variant/50 flex-shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-on-surface-variant/50 flex-shrink-0" />}
                </button>
                <button type="button" onClick={onNew} title="ثبت کسب‌وکار جدید"
                        className="w-11 h-11 rounded-xl border border-outline-variant/40 dark:border-gray-700 grid place-items-center
                            text-on-surface-variant/60 hover:text-primary hover:border-primary/40
                            hover:bg-primary/5 transition-colors flex-shrink-0">
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full mt-1 inset-x-0 z-50 p-1.5 rounded-2xl bg-white dark:bg-gray-900
                        border border-outline-variant/30 dark:border-gray-700 shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto">
                        {items.map((b) => (
                            <button key={b.id} type="button"
                                    onClick={() => { onPick(b.id); setOpen(false); }}
                                    className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-colors text-right',
                                        b.id === selectedId ? 'bg-primary/5 dark:bg-primary/10' : 'hover:bg-surface-container-high dark:hover:bg-gray-800')}>
                                <span className="w-7 h-7 rounded-md overflow-hidden bg-primary/10 dark:bg-primary/15 grid place-items-center flex-shrink-0">
                                    {b.logoUrl
                                        ? <Image src={b.logoUrl} alt="" width={28} height={28} className="w-full h-full object-cover" unoptimized />
                                        : <Building2 className="w-3.5 h-3.5 text-primary/70" />}
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className={cn('block text-xs font-bold truncate', b.id === selectedId ? 'text-primary' : 'text-on-surface')}>{b.name}</span>
                                    <span className="block text-[9px] text-on-surface-variant/50 truncate">
                                        {[b.industryName, b.city].filter(Boolean).join(' · ')}
                                    </span>
                                </span>
                                {b.id === selectedId && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
