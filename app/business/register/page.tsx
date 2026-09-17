// app/business/register/page.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import {
    LibraryBig, Building2, Loader2, ArrowRight, AlertTriangle, Globe, Lock, BadgeCheck, ClipboardList,
} from 'lucide-react';
import { useCreateCatalog, useBusinessSearch, useCataloges, useMyBusinesses, useMyBusinessMembership } from '@/lib/api/apiHooks';
import { USER_POSITIONS, getFirstCatalog, getBusinessRoleLabel } from '@/lib/api/data-types';
import { setCurrentCatalog } from '@/lib/store/slices/catalogSlice';
import { clearStoredRef, readStoredRef } from '@/app/components/RefCapture';
import BusinessSelector from '@/app/components/BusinessSelector';
import SlugPicker from '@/app/business/register/SlugPicker';
import { toastFormErrors } from '@/lib/formAlerts';
import { cn } from '@/lib/utils';

/* ─── فارسی ← لاتین (حذف شد) — لینک بازوی فروش را کاربر خودش پر می‌کند ─── */

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
    // ✅ فیکس بنر جشنِ کاذب: armSlug (آخرین بازاری که کاربر دیده بود) دیگر به بک فرستاده نمی‌شود —
    //    ساختِ بازوی فروش نباید بی‌اجازهٔ مدیرِ بازار عضویتِ published بسازد. ورود به بازار فقط
    //    از «انتشار در بازارها» یا اددِ مدیرِ بازار.

    // ─── کسب‌وکار انتخاب‌شده (کسب‌وکار مرجع مشترک است) ───
    const [bizId, setBizId] = useState<string | undefined>(() =>
        new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        ).get('bizId') || undefined,
    );
    const [selectedBizOverride, setSelectedBizOverride] = useState<any>(null);
    // ✅ همگام‌سازی دیرهنگام bizId — اگر در ناوبری نرم، initializer قبل از به‌روز شدن URL اجرا شود
    const bizIdRef = useRef(bizId);
    bizIdRef.current = bizId;
    useEffect(() => {
        const sync = () => {
            const q = new URLSearchParams(window.location.search).get('bizId') || undefined;
            if (q && q !== bizIdRef.current) setBizId(q);
        };
        sync();
        const t = setTimeout(sync, 400);
        window.addEventListener('popstate', sync);
        return () => { clearTimeout(t); window.removeEventListener('popstate', sync); };
    }, []);
    const deepBizQ = useBusinessSearch(
        useMemo(() => ({ ids: bizId || undefined, limit: 1 }), [bizId]),
        !!bizId && !selectedBizOverride,
    );
    // ✅ پشتیبانِ دیپ‌لینک: اگر جستجوی عمومی جواب نداد (خطای موقت/بک‌اند قدیمی/فیلتر وضعیت)،
    //    همان کسب‌وکار از «کسب‌وکارهای من» پیدا و خودکار انتخاب می‌شود
    const myBizQ = useMyBusinesses(!!bizId && !selectedBizOverride);
    const deepLinkResolved = !!bizId && !selectedBizOverride && !deepBizQ.isFetching && !myBizQ.isFetching;
    const selectedBiz = selectedBizOverride
        ?? deepBizQ.data?.items?.find((b: any) => b.id === bizId)
        ?? (myBizQ.data?.items ?? []).find((b: any) => b.id === bizId)
        ?? null;
    const deepLinkMiss = deepLinkResolved && !selectedBiz;

    const [refCode] = useState<string | undefined>(() =>
        new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        ).get('ref') || readStoredRef() || undefined,
    );

    // ─── نقش کاربر در کسب‌وکار — تک‌منبع: USER_POSITIONS در data-types ───
    const [positionRole, setPositionRole] = useState('');      // value از USER_POSITIONS
    const [positionOther, setPositionOther] = useState('');    // فقط وقتی «سایر»
    // ✅ مقدار «سایر» از خودِ لیست خوانده می‌شود — هم‌راستا با data-types
    const POSITION_OTHER_VALUE = USER_POSITIONS.find((p) => p.label === 'سایر')?.value ?? '8';
    const effectivePosition = positionRole
        ? (positionRole === POSITION_OTHER_VALUE ? positionOther.trim() : (USER_POSITIONS.find((p) => p.value === positionRole)?.label || ''))
        : '';

    // ✅ نقشِ از قبل مشخص‌شده در تیم کسب‌وکار — دیگر پرسیده نمی‌شود (تک‌منبع: تیم کسب‌وکار)
    const membershipQ = useMyBusinessMembership(selectedBiz?.id, !!selectedBiz);
    const [positionFromTeam, setPositionFromTeam] = useState(false);
    useEffect(() => {
        const pos = (membershipQ.data?.position || '').trim();
        if (!pos) { setPositionFromTeam(false); return; }
        const matched = USER_POSITIONS.find((p) => p.label === pos);
        setPositionRole(matched?.value || POSITION_OTHER_VALUE);
        setPositionOther(matched ? '' : pos);
        setPositionFromTeam(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [membershipQ.data]);

    const [catalogName, setCatalogName] = useState('');
    const [nameDirty, setNameDirty] = useState(false);
    const [slug, setSlug] = useState('');          // ✅ کاربر خودش پر می‌کند — پیش‌فرض خالی
    const [salesType, setSalesType] = useState<'wholesale' | 'retail' | 'service'>('wholesale');
    // ✅ دسترسی بازوی فروش — خصوصی: قیمت‌ها فقط برای اعضای پذیرفته‌شده
    const [isPrivate, setIsPrivate] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const createCatalogMutation = useCreateCatalog();
    // ✅ گارد سینکرون دابل‌سابمیت — دو کلیک/Enter در یک تیک، قبل از رندرِ مجددِ دکمه، دو درخواست نمی‌زند
    const submittingRef = React.useRef(false);

    // ─── ✅ پیشنهاد گام بعدی — بعد از ثبتِ «جدید»ِ کسب‌وکار، بر اساس نوع فعالیت (firstCatalog) ───
    // فقط برای خریدبذَرها (firstCatalog=false: خرده‌فروش، رستوران، آرایشگر…) کارت پیشنهاد بازوی خرید نشان داده می‌شود؛
    // برای جنس‌بذَرها همین فرم بازوی فروش خودش مسیر پیشنهادی است — هیچ کاردی لازم نیست. پیشنهاد است، نه اجبار.
    const [stepHint, setStepHint] = useState<{ bizId: string; bizName: string; roleLabel: string } | null>(null);
    const handleBusinessCreated = (biz: any) => {
        if (biz?.id && getFirstCatalog(biz.businessRole) === false) {
            setStepHint({
                bizId: biz.id,
                bizName: biz.name || 'کسب‌وکار شما',
                roleLabel: getBusinessRoleLabel(biz.businessRole) || 'کسب‌وکار',
            });
        }
    };

    // ─── تغییر کسب‌وکار: نام پیشنهادی تازه می‌شود ───
    useEffect(() => {
        if (!selectedBiz) return;
        // ✅ نام پیشنهادی = «بازوی فروش + نام کسب‌وکار» (خواستهٔ مالک) — قابل ویرایش
        setCatalogName(selectedBiz.name ? `بازوی فروش ${String(selectedBiz.name).trim()}`.slice(0, 60) : '');
        setNameDirty(false);
        setErrors({});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedBiz?.id]);

    // ─── هشدار نام تکراری برای بازوهای فروشی خود کاربر (خطای دیرهنگام بک را پیش‌بینی می‌کند) ───
    const catQ = useCataloges();
    const myCatalogs: any[] = Array.isArray(catQ.data) ? catQ.data : (catQ.data as any)?.items ?? [];
    const catalogNameDup = useMemo(() => {
        const nm = (catalogName || '').trim();
        return !!nm && myCatalogs.some((c: any) => (c.name || '').trim() === nm && c.status === 'active');
    }, [myCatalogs, catalogName]);

    // ⚖️ قانون دیمت: خطای CSSِ روی فیلد کافی نیست — الرتِ واضحِ toast هم با ذکرِ خودِ فیلد بده
    const validate = (): Record<string, string> | null => {
        const e: Record<string, string> = {};
        if (!bizId) e.biz = 'کسب‌وکار انتخاب نشده';
        if (!positionRole) e.position = 'نقش شما در کسب‌وکار انتخاب نشده';
        else if (positionRole === POSITION_OTHER_VALUE && !positionOther.trim()) e.position = 'نقشت در شرکت را بنویس';
        if (!catalogName.trim()) e.name = 'نام بازوی فروش وارد نشده';
        if (!slug || slug.length < 3) e.slug = 'لینک اختصاصی بازوی فروش وارد نشده (حداقل ۳ حرف انگلیسی)';
        else if (errors.slug === 'taken' || errors.slug === 'reserved') e.slug = errors.slug === 'reserved' ? 'این لینک قابل انتخاب نیست' : 'این لینک آزاد نیست — کمی عوضش کن';
        setErrors(e);
        return Object.keys(e).length ? e : null;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (submittingRef.current) return; // ✅ ضد دابل‌کال — وسطِ یک submitِ درجریان هستیم
        if (catalogNameDup) {
            toast.error('یه بازوی فروش با همین نام داری — برای تشخیص راحت‌تر کمی عوضش کن');
            return;
        }
        const validationErrors = validate();
        if (validationErrors) {
            toastFormErrors(validationErrors); // ⚖️ الرت واضح کنار خطای CSS فیلدها
            return;
        }
        if (!selectedBiz) {
            toast.error('کسب‌وکار انتخاب نشده — اول کسب‌وکار را انتخاب کن');
            return;
        }

        submittingRef.current = true;
        try {
            // ✅ صنف، لوگو و مشخصات اصلی هدر از کسب‌وکار ارث می‌رسد
            // ✅ نام بازوی فروش قابل ویرایش است تا بازوهای فروشی هم‌نام اشتباه نشوند
            const created = await createCatalogMutation.mutateAsync({
                name: catalogName.trim(),
                slug,
                businessId: bizId,
                type: selectedBiz.type || 'wholesaler',
                salesType,
                isPrivate,
                refCode,
                phone: '',
                description: '',
                position: effectivePosition,
            });

            toast.success(`«${shortName(catalogName.trim(), 24)}» برای «${shortName(selectedBiz.name, 24)}» ساخته شد 🎉`, {
                description: `آدرس: daymat.ir/${created?.slug || slug}`,
                duration: 6000,
            });
            clearStoredRef();
            // ✅ بازوی فروش کارنت پرسیست — برگشت به «مدیریت بازوی فروش» همین بازوی فروش تازه را باز می‌کند
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
                toast.error(error?.data?.message || 'شما در این بازار با بازوی فروش دیگری فعال هستید');
            } else {
                toast.error(error?.data?.message || error?.message || 'خطا در ساخت بازوی فروش');
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
        // نقشِ کسب‌وکار تازه — از تیمِ همان کسب‌وکار خوانده می‌شود
        setPositionRole('');
        setPositionOther('');
        setPositionFromTeam(false);
    };

    const busy = createCatalogMutation.isPending;
    // ⚖️ دکمهٔ ثبت با فیلدهای خالی غیرفعال نمی‌شود — کلیک رویش الرتِ واضحِ فیلدهای گم‌شده می‌دهد
    // (دکمهٔ disabled یعنی سکوتِ مطلق — کاربر نمی‌فهمد چرا پیش نمی‌رود)
    const submitDisabled = busy;

    return (
        <div className="min-h-screen flex flex-col bg-surface dark:bg-gray-950">
            {/* هدر ساده — بازگشت هوشمند: با دیپ‌لینک bizId برمی‌گردیم به مدیریت کسب‌وکار */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-outline-variant/20">
                <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
                    <button onClick={() => router.push(bizId ? `/business/manage?id=${bizId}` : '/')} className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-primary">
                        <ArrowRight className="w-4 h-4" /> بازگشت
                    </button>
                    <h1 className="text-sm font-bold text-on-surface">ساخت بازوی فروش</h1>
                    <div className="w-16" />
                </div>
            </header>

            <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-5 pb-[100px]">
                {/* ═══ سلکتور کسب‌وکار — تنها آیتم صفحه تا وقتی انتخاب نشده ═══ */}
                <section className="mb-5">
                    {bizId && !selectedBiz && (deepBizQ.isFetching || myBizQ.isFetching) ? (
                        /* دیپ‌لینک از مدیریت کسب‌وکار — تا واکشی تمام شود، کاربر نباید چیزی انتخاب کند */
                        <div className="rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-3 flex items-center gap-2.5">
                            <Loader2 className="w-4 h-4 animate-spin text-primary flex-shrink-0" />
                            <span className="text-[12px] font-medium text-on-surface-variant">در حال آماده‌سازی کسب‌وکار انتخابی…</span>
                        </div>
                    ) : (
                        <>
                            <BusinessSelector value={selectedBiz} onChange={handleBizChange} error={errors.biz} onBusinessCreated={handleBusinessCreated}
                                              selectedLabel={selectedBiz ? `ساخت بازوی فروش برای «${shortName(selectedBiz.name || '', 24)}»` : undefined} />
                            {deepLinkMiss && (
                                <p className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1.5 px-1">
                                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                                    کسب‌وکار با شناسهٔ لینک پیدا نشد — لطفاً دستی انتخابش کن.
                                </p>
                            )}
                            {!selectedBiz && (
                                <p className="mt-2.5 text-[12px] text-justify leading-5 text-on-surface-variant/70">
                                    در دیمت، هر کسب‌وکار می‌تونه چند بازوی فروش داشته باشه؛ مثلاً بازوی شخصی شما یا بازوی تیم بازاریابی و فروش. یا هر بازاریاب یه بازوی شخصی.

                                    بنابراین ممکنه کسب‌وکاری که در اون کار می‌کنی یا حتی صاحبش هستی، قبلاً توسط یکی از همکاران فرش ثبت شده باشه. پس قبل از ثبت تکراری، اسم کسب‌وکارت رو جست‌وجو کن.

                                    اگر پیدا نشد، ثبتش کن.
                                    اگر قبلاً ثبت شده، فقط همون کسب‌وکار رو انتخاب کن و **بازوی مخصوص خودت رو بساز.**

                                    لازم نیست صاحب کسب‌وکار باشی؛ هر همکار فروش می‌تونه برای کسب‌وکاری که در اون فعالیت می‌کنه بازوی خودش رو بسازه و از طریق اون به فروش بیشتر کمک کنه.

                                    اگر صاحب کسب و کاری و می خوای خودت اطلاعات کسب و کارت رو ویرایش کنی، می‌تونی مجوز ویرایش رو از ثبت‌کننده دریافت کنی.

                                </p>
                            )}
                        </>
                    )}
                </section>

                {/* ═══ سایر آیتم‌های بازوی فروش — فقط بعد از انتخاب/ثبت کسب‌وکار ═══ */}
                {selectedBiz && (
                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ═══ ۲) نقش شما در کسب‌وکار — اگر در تیم کسب‌وکار قبلاً مشخص شده، فقط نمایش داده می‌شود ═══ */}
                    <section className="space-y-1.5">
                        <SectionTitle n={2} title={`نقش شما در «${shortName(selectedBiz.name, 18)}»`} />
                        {positionFromTeam ? (
                            <div className="rounded-xl border border-primary/25 bg-primary/5 px-3.5 py-3 flex items-center gap-2.5">
                                <BadgeCheck className="w-4.5 h-4.5 text-primary flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[12px] font-bold text-on-surface">{effectivePosition}</p>
                                    <p className="text-[10px] text-on-surface-variant/70 mt-0.5">
                                        از تیم کسب‌وکار — برای تغییر، از مدیریت کسب‌وکار بخش «تیم کاری»
                                    </p>
                                </div>
                                {membershipQ.data?.role === 'admin' && (
                                    <span className="text-[9px] font-extrabold text-primary bg-primary/15 rounded-full px-2 py-1 flex-shrink-0">مدیر کسب‌وکار</span>
                                )}
                            </div>
                        ) : (
                            <>
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
                            </>
                        )}
                        {errors.position && (
                            <p className="text-[10px] text-error flex items-center gap-1.5 px-1"><AlertTriangle className="w-3 h-3 flex-shrink-0" /> {errors.position}</p>
                        )}
                    </section>

                    {/* ═══ ۳) نام بازوی فروش — پیش‌فرض نام کسب‌وکار، قابل ویرایش ═══ */}
                    <section className="space-y-1.5">
                        <SectionTitle n={3} title="نام بازوی فروش" />
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
                                یه بازوی فروش با همین نام داری — برای تشخیص راحت‌تر کمی عوضش کن
                            </p>
                        ) : (
                            !nameDirty && catalogName && (
                                <p className="text-[10px] text-on-surface-variant/60 px-1">
                                    پیشنهاد ما «بازوی فروش» به‌همراه نام کسب‌وکاره؛ اگه می‌خوای توی لیست بازوهای فروشت متمایز باشه، تغییرش بده.
                                </p>
                            )
                        )}
                        {errors.name && !catalogNameDup && (
                            <p className="text-[10px] text-error flex items-center gap-1.5 px-1">
                                <AlertTriangle className="w-3 h-3 flex-shrink-0" /> {errors.name}
                            </p>
                        )}
                    </section>

                    {/* ═══ ۴) لینک بازوی فروش — کاربر خودش انتخاب می‌کند ═══ */}
                    <section className="space-y-1.5">
                        <SectionTitle n={4} title="لینک اختصاصی بازوی فروش" />
                        <SlugPicker
                            value={slug}
                            onChange={(s: string) => { setSlug(s); setErrors((p) => ({ ...p, slug: '' })); }}
                            onStatus={(status: string | null) => {
                                setErrors((p) => ({ ...p, slug: status ?? undefined }));
                            }}
                            disabled={busy}
                        />
                        {errors.slug && (
                            <p className="text-[10px] text-error flex items-center gap-1.5 px-1">
                                <AlertTriangle className="w-3 h-3" />
                                {errors.slug === 'taken' ? 'این لینک آزاد نیست — کمی عوضش کن'
                                    : errors.slug === 'reserved' ? 'این لینک قابل انتخاب نیست'
                                    : errors.slug}
                            </p>
                        )}
                    </section>

                    {/* ═══ ۵) نوع فروش ═══ */}
                    <section className="space-y-2">
                        <SectionTitle n={5} title="هدف این بازوی فروش " />
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { v: 'wholesale', t: 'فروش عمده', icon: '📦' },
                                { v: 'retail', t: 'فروش خرده', icon: '🛒' },
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

                    {/* ═══ ۶) دسترسی بازوی فروش — عمومی / خصوصی ═══ */}
                    <section className="space-y-2">
                        <SectionTitle n={6} title="دسترسی بازوی فروش" />
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
                                <span className="block text-[10px] leading-4 text-on-surface-variant/70">نمایش قیمتها برای عموم</span>
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
                                <span className="block text-[10px] leading-4 text-on-surface-variant/70">نمایش قیمت فقط برای همکاران تجاری</span>
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
                        {busy ? <><Loader2 className="w-5 h-5 animate-spin" /> در حال ساخت بازوی فروش…</>
                            : catalogNameDup ? <><AlertTriangle className="w-4 h-4" /> نام بازوی فروش تکراری است</>
                            : <><LibraryBig className="w-4.5 h-4.5" /> ساخت بازوی فروش برای «{shortName(selectedBiz?.name || '')}»</>}
                    </button>
                </form>
                )}
            </main>

            {/* ═══ کارت گام بعدی — فقط بعد از ثبتِ جدیدِ کسب‌وکارِ خریدبذَر (firstCatalog=false) ═══
                پیشنهاد دلیل‌دار با درِ باز: دکمهٔ بزرگ بازوی خرید + لینک کمرنگِ ادامهٔ بازوی فروش */}
            {stepHint && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center sm:justify-center bg-black/50 animate-in fade-in duration-200 sm:p-4"
                     onClick={() => setStepHint(null)}>
                    <div onClick={(e) => e.stopPropagation()}
                         className="w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-900 px-6 py-7 text-center shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
                        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-contrast-soft">
                            <ClipboardList className="size-7 text-amber-600 dark:text-amber-400" />
                        </span>
                        <h2 className="mt-4 text-lg font-black text-on-surface dark:text-gray-100">
                            «{shortName(stepHint.bizName, 22)}» ثبت شد 🎉
                        </h2>
                        <p className="mt-3 text-[13px] leading-7 text-on-surface-variant">
                            چون گفتی <span className="font-black">{stepHint.roleLabel}</span>، و بیشتر خرید عمده داری تا فروش عمده می‌کنیم اول{' '}
                            <span className="font-black text-amber-600 dark:text-amber-400">بازوی خرید</span> بسازی —
                            لیست خریدت رو می‌نویسی، تامین‌کننده‌ها قیمت می‌دن و تو بهترین رو انتخاب می‌کنی.
                            (بازوی فروش هم هر وقت خواستی می تونی از پنل خودت بسازی)
                        </p>
                        <Link href={`/inquiries/new?bizId=${stepHint.bizId}`}
                              className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-contrast text-sm font-extrabold text-white shadow-lg shadow-brand-contrast/30 transition-colors hover:bg-brand-contrast-strong">
                            <ClipboardList className="size-4" />
                            بازوی خرید بساز
                        </Link>
                        <button type="button" onClick={() => setStepHint(null)}
                                className="mt-3 text-[12px] font-bold text-on-surface-variant/70 transition-colors hover:text-on-surface">
                            نه، همین‌جا بازوی فروش می‌سازم
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

