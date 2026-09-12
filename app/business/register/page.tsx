// app/business/register/page.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'sonner';
import {
    LibraryBig, Building2, Loader2, ArrowRight, AlertTriangle, Globe, Lock,
} from 'lucide-react';
import { useCreateCatalog, useBusinessSearch, useCataloges } from '@/lib/api/apiHooks';
import { USER_POSITIONS } from '@/lib/api/data-types';
import { RootState } from '@/lib/store/store';
import { setCurrentCatalog } from '@/lib/store/slices/catalogSlice';
import { clearStoredRef, readStoredRef } from '@/app/components/RefCapture';
import BusinessSelector from '@/app/components/BusinessSelector';
import SlugPicker from '@/app/business/register/SlugPicker';
import { cn } from '@/lib/utils';

/* ─── فارسی ← لاتین (حذف شد) — لینک کاتالوگ را کاربر خودش پر می‌کند ─── */

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

export default function RegisterCatalogPage() {
    const router = useRouter();
    const dispatch = useDispatch();
    const { currentSlug: armSlug } = useSelector((state: RootState) => state.arm);

    // ─── کسب‌وکار انتخاب‌شده (کسب‌وکار مرجع مشترک است) ───
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

    const [refCode] = useState<string | undefined>(() =>
        new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        ).get('ref') || readStoredRef() || undefined,
    );

    // ─── نقش کاربر در کسب‌وکار — تک‌منبع: USER_POSITIONS در data-types ───
    const [positionRole, setPositionRole] = useState('');      // value از USER_POSITIONS
    const [positionOther, setPositionOther] = useState('');    // فقط وقتی «سایر»
    const POSITION_OTHER_VALUE = '10';
    const effectivePosition = positionRole
        ? (positionRole === POSITION_OTHER_VALUE ? positionOther.trim() : (USER_POSITIONS.find((p) => p.value === positionRole)?.label || ''))
        : '';

    const [catalogName, setCatalogName] = useState('');
    const [nameDirty, setNameDirty] = useState(false);
    const [slug, setSlug] = useState('');          // ✅ کاربر خودش پر می‌کند — پیش‌فرض خالی
    const [salesType, setSalesType] = useState<'wholesale' | 'retail' | 'service'>('wholesale');
    // ✅ دسترسی کاتالوگ — خصوصی: قیمت‌ها فقط برای اعضای پذیرفته‌شده
    const [isPrivate, setIsPrivate] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const createCatalogMutation = useCreateCatalog();
    // ✅ گارد سینکرون دابل‌سابمیت — دو کلیک/Enter در یک تیک، قبل از رندرِ مجددِ دکمه، دو درخواست نمی‌زند
    const submittingRef = React.useRef(false);

    // ─── تغییر کسب‌وکار: نام پیشنهادی تازه می‌شود ───
    useEffect(() => {
        if (!selectedBiz) return;
        setCatalogName(selectedBiz.name || '');
        setNameDirty(false);
        setErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBiz?.id]);

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
        if (!positionRole) e.position = 'نقشت را در این کسب‌وکار انتخاب کن';
        else if (positionRole === POSITION_OTHER_VALUE && !positionOther.trim()) e.position = 'نقشت در شرکت را بنویس';
        if (!catalogName.trim()) e.name = 'نام کاتالوگ را وارد کن';
        if (!slug || slug.length < 3) e.slug = 'لینک کاتالوگ را وارد کن (حداقل ۳ حرف انگلیسی)';
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
                isPrivate,
                refCode,
                armSlug,
                phone: '',
                description: '',
                position: effectivePosition,
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

    // ─── انتخاب/پاک کردن کسب‌وکار از سلکتور مستقل ───
    const handleBizChange = (biz: any | null) => {
        if (biz?.id) {
            setBizId(biz.id);
            setSelectedBizOverride(biz);
            setErrors((p) => ({ ...p, biz: '' }));
        } else {
            setBizId(undefined);
            setSelectedBizOverride(null);
            setCatalogName('');
            setSlug('');
        }
    };

    const busy = createCatalogMutation.isPending;
    const submitDisabled = busy || !slug || !!errors.slug || catalogNameDup || !catalogName.trim() || !effectivePosition;

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
                {/* ═══ سلکتور کسب‌وکار — تنها آیتم صفحه تا وقتی انتخاب نشده ═══ */}
                <section className="mb-5">
                    <BusinessSelector value={selectedBiz} onChange={handleBizChange} error={errors.biz} />
                    {!selectedBiz && (
                        <p className="mt-2.5 text-[11px] leading-5 text-on-surface-variant/70">
                            شاید کسب‌وکارت قبلاً توسط خودت یا همکارانت ثبت شده باشه — اول جستجو کن؛ اگه پیدا نشد، خودت ثبتش کن.
                        </p>
                    )}
                </section>

                {/* ═══ سایر آیتم‌های کاتالوگ — فقط بعد از انتخاب/ثبت کسب‌وکار ═══ */}
                {selectedBiz && (
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ═══ ۲) نقش شما در کسب‌وکار — تک‌منبع: USER_POSITIONS ═══ */}
                    <section className="space-y-1.5">
                        <SectionTitle n={2} title={`نقش شما در «${shortName(selectedBiz.name, 18)}»`} />
                        <div className="flex flex-wrap gap-1.5">
                            {USER_POSITIONS.map((p) => (
                                <button key={p.value} type="button"
                                        onClick={() => { setPositionRole(p.value); setErrors((prev) => ({ ...prev, position: '' })); }}
                                        className={cn(
                                            'px-3 py-1.5 rounded-full text-[11px] font-medium border transition-colors',
                                            positionRole === p.value
                                                ? 'border-primary bg-primary/10 text-primary'
                                                : 'border-outline-variant/40 dark:border-gray-700 text-on-surface-variant hover:border-primary/40',
                                        )}>
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        {positionRole === POSITION_OTHER_VALUE && (
                            <input type="text" value={positionOther} maxLength={60} autoFocus
                                   onChange={(e) => { setPositionOther(e.target.value); setErrors((p) => ({ ...p, position: '' })); }}
                                   placeholder="نقشت در شرکت چیه؟ مثلا: مدیر فروش شعبه مرکزی"
                                   className={cn(
                                       'w-full h-11 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest border',
                                       'focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
                                       errors.position ? 'border-error' : 'border-outline-variant/40 dark:border-gray-700',
                                   )} />
                        )}
                        {errors.position && (
                            <p className="text-[10px] text-error flex items-center gap-1.5 px-1"><AlertTriangle className="w-3 h-3 flex-shrink-0" /> {errors.position}</p>
                        )}
                    </section>

                    {/* ═══ ۳) نام کاتالوگ — پیش‌فرض نام کسب‌وکار، قابل ویرایش ═══ */}
                    <section className="space-y-1.5">
                        <SectionTitle n={3} title="نام کاتالوگ" />
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

                    {/* ═══ ۴) لینک کاتالوگ — کاربر خودش انتخاب می‌کند ═══ */}
                    <section className="space-y-1.5">
                        <SectionTitle n={4} title="لینک اختصاصی کاتالوگ" />
                        <SlugPicker
                            value={slug}
                            onChange={(s: string) => { setSlug(s); setErrors((p) => ({ ...p, slug: '' })); }}
                            onStatus={(status: string | null) => {
                                setErrors((p) => ({ ...p, slug: status ?? undefined }));
                            }}
                            disabled={busy}
                        />
                        {errors.slug === 'taken' && (
                            <p className="text-[10px] text-error flex items-center gap-1.5 px-1">
                                <AlertTriangle className="w-3 h-3" /> این لینک آزاد نیست — کمی عوضش کن
                            </p>
                        )}
                    </section>

                    {/* ═══ ۵) نوع فروش ═══ */}
                    <section className="space-y-2">
                        <SectionTitle n={5} title="نوع فروش در این کاتالوگ" />
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

                    {/* ═══ ۶) دسترسی کاتالوگ — عمومی / خصوصی ═══ */}
                    <section className="space-y-2">
                        <SectionTitle n={6} title="دسترسی کاتالوگ" />
                        <div className="grid grid-cols-2 gap-2">
                            <button type="button" onClick={() => setIsPrivate(false)}
                                    className={cn(
                                        'rounded-xl border p-3 text-right transition-all',
                                        !isPrivate
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                            : 'border-outline-variant/40 dark:border-gray-700 hover:border-primary/30',
                                    )}>
                                <span className="flex items-center gap-1.5 mb-1">
                                    <Globe className={cn('w-4 h-4', !isPrivate ? 'text-primary' : 'text-on-surface-variant/50')} />
                                    <span className={cn('text-xs font-bold', !isPrivate ? 'text-primary' : 'text-on-surface')}>عمومی</span>
                                </span>
                                <span className="block text-[10px] leading-4 text-on-surface-variant/70">قیمت‌ها برای همه نمایش داده می‌شود</span>
                            </button>
                            <button type="button" onClick={() => setIsPrivate(true)}
                                    className={cn(
                                        'rounded-xl border p-3 text-right transition-all',
                                        isPrivate
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                                            : 'border-outline-variant/40 dark:border-gray-700 hover:border-primary/30',
                                    )}>
                                <span className="flex items-center gap-1.5 mb-1">
                                    <Lock className={cn('w-4 h-4', isPrivate ? 'text-primary' : 'text-on-surface-variant/50')} />
                                    <span className={cn('text-xs font-bold', isPrivate ? 'text-primary' : 'text-on-surface')}>خصوصی</span>
                                </span>
                                <span className="block text-[10px] leading-4 text-on-surface-variant/70">قیمت‌ها فقط برای اعضای پذیرفته‌شده</span>
                            </button>
                        </div>
                    </section>
                    <button type="submit"
                            disabled={submitDisabled}
                            className={cn(
                                'w-full h-12 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all',
                                submitDisabled
                                    ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed'
                                    : 'bg-primary text-on-primary shadow-lg shadow-primary/25 active:scale-[0.99]',
                            )}>
                        {busy ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال ساخت کاتالوگ…</>
                            : catalogNameDup ? <><AlertTriangle className="w-4 h-4" /> نام کاتالوگ تکراری است</>
                            : <><LibraryBig className="w-4.5 h-4.5" /> ساخت کاتالوگ برای «{shortName(selectedBiz?.name || '')}»</>}
                    </button>
                </form>
                )}
            </main>
        </div>
    );
}

