// app_/home/MembershipModal.tsx
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
    X, ShieldCheck, ShoppingBag, Store, Building2, BookOpen, Loader2,
    CheckCircle2, LogIn, Info, AlertCircle,
} from 'lucide-react';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';
import { useMyBusinesses } from '@/lib/api/apiHooks';
import { cn } from '@/lib/utils';

interface Props {
    open: boolean;
    onClose: () => void;
    slug: string;
    /** بازار فعلی — برای نام و شرایط عضویت (از redux یا getDetail) */
    arm?: any;
}

type Step = 'terms' | 'role' | 'buyer' | 'seller' | 'done' | 'member' | 'pending';

/**
 * مدال درخواست عضویت در بازار خصوصی — ویزارد سه‌مرحله‌ای:
 *   ۱) شرایط عضویت (از تنظیمات بازار) + تیک پذیرش
 *   ۲) نقش: خریدارم / فروشنده‌ام
 *   ۳) خریدار → انتخاب کسب‌وکار (یا لینک ثبت) | فروشنده → انتخاب کاتالوگ (یا لینک ثبت)
 *   ثبت درخواست → صفحهٔ «در انتظار تایید» — نتیجه در اعلان‌ها می‌آید
 */
export default function MembershipModal({ open, onClose, slug, arm }: Props) {
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [step, setStep] = useState<Step>('terms');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [roleType, setRoleType] = useState<'buyer' | 'seller'>('buyer');
    const [businessId, setBusinessId] = useState<string>('');
    const [catalogId, setCatalogId] = useState<string>('');
    const [rejectInfo, setRejectInfo] = useState<string | null>(null);

    // کسب‌وکارها و کاتالوگ‌های کاربر — فقط وقتی مودال باز است
    const { data: bizData, isLoading: bizLoading } = useMyBusinesses(open && isAuthenticated);
    const { data: catalogsRaw, isLoading: catLoading } = useQuery({
        queryKey: ['my-catalogs-for-membership'],
        queryFn: () => apiService.catalog.getAll(),
        enabled: open && isAuthenticated && step === 'seller',
    });
    const catalogs: any[] = Array.isArray(catalogsRaw) ? catalogsRaw : (catalogsRaw?.items ?? []);
    const businesses: any[] = bizData?.items ?? [];

    const armName = arm?.name || 'این بازار';
    const terms: string = arm?.membershipTerms || '';

    // هر بار باز شدن — وضعیت فعلی را از بک بگیر (عضو / درخواست در انتظار / ردشده / هیچ‌کدام)
    useEffect(() => {
        if (!open) return;
        if (!isAuthenticated) return; // مهمان: همان‌جا CTA ورود می‌بیند
        setLoading(true);
        apiService.arm.getMyMembershipRequest(slug)
            .then((res: any) => {
                const membership = res?.membership;
                const request = res?.request;
                if (membership?.status === 'active' && membership.businessStatus === 'active') {
                    setStep('member');
                } else if (request?.status === 'pending') {
                    setStep('pending');
                } else {
                    if (request?.status === 'rejected') {
                        setRejectInfo(request.rejectReason || null);
                    }
                    setStep('terms');
                }
            })
            .catch(() => setStep('terms'))
            .finally(() => setLoading(false));
    }, [open, slug, isAuthenticated]);

    if (!open) return null;

    const submit = async () => {
        setSubmitting(true);
        try {
            await apiService.arm.requestMembership(slug, {
                roleType,
                businessId: roleType === 'buyer' ? businessId : undefined,
                catalogId: roleType === 'seller' ? catalogId : undefined,
                termsAccepted: true,
            });
            setStep('done');
        } catch (e: any) {
            const code = e?.data?.errorCode;
            if (code === 'REQUEST_ALREADY_PENDING') setStep('pending');
            else if (code === 'ALREADY_MEMBER') setStep('member');
            else toast.error(e?.data?.message || e?.message || 'خطا در ثبت درخواست');
        } finally {
            setSubmitting(false);
        }
    };

    const optionCard = (active: boolean) => cn(
        'w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-right transition-all',
        active
            ? 'border-primary bg-primary/5 shadow-sm'
            : 'border-outline-variant/25 bg-surface-container-lowest hover:border-primary/40',
    );

    return (
        <div className="fixed inset-0 z-[70] flex items-end lg:items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />
            <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 z-10 max-h-[92vh] flex flex-col
                rounded-t-3xl lg:rounded-2xl shadow-2xl overflow-hidden">

                {/* ── هدر ── */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-extrabold text-[15px] text-on-surface truncate">عضویت در {armName}</h3>
                            <p className="text-[10px] text-on-surface-variant">بازار خصوصی — عضویت با تایید مدیر</p>
                        </div>
                    </div>
                    <button onClick={onClose} aria-label="بستن"
                            className="p-2 hover:bg-surface-container-high rounded-xl transition-colors">
                        <X className="w-5 h-5 text-on-surface-variant" />
                    </button>
                </div>

                {/* ── بدنه ── */}
                <div className="overflow-y-auto flex-1 px-5 py-4 scrollbar-slim">

                    {/* مهمان → ورود/ثبت‌نام */}
                    {!isAuthenticated ? (
                        <div className="text-center py-8">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                                <LogIn className="w-7 h-7 text-primary" />
                            </div>
                            <p className="text-sm font-bold text-on-surface mb-1.5">ابتدا وارد حساب کاربری شوید</p>
                            <p className="text-xs text-on-surface-variant leading-6 mb-5 px-4">
                                برای دیدن شرایط و ثبت درخواست عضویت در {armName} باید وارد شوید یا ثبت‌نام کنید.
                            </p>
                            <Link href={`/login?redirect=${encodeURIComponent(`/${slug}`)}`}
                                  className="inline-flex items-center justify-center gap-1.5 h-10 px-6 rounded-xl
                                      bg-primary text-on-primary text-sm font-bold hover:bg-primary/90 shadow-sm">
                                <LogIn className="w-4 h-4" />
                                ورود | عضویت
                            </Link>
                        </div>
                    ) : loading ? (
                        <div className="py-14 flex flex-col items-center gap-3">
                            <Loader2 className="w-7 h-7 animate-spin text-primary" />
                            <p className="text-xs text-on-surface-variant">در حال بررسی وضعیت عضویت…</p>
                        </div>
                    ) : step === 'member' ? (
                        <div className="text-center py-8">
                            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
                            <p className="text-sm font-bold text-on-surface mb-1">شما عضو {armName} هستید</p>
                            <p className="text-xs text-on-surface-variant">قیمت‌ها و امکانات این بازار برای شما باز است.</p>
                        </div>
                    ) : step === 'pending' ? (
                        <div className="text-center py-8">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                                <Loader2 className="w-7 h-7 text-amber-500" />
                            </div>
                            <p className="text-sm font-bold text-on-surface mb-1">درخواست شما در انتظار بررسی است</p>
                            <p className="text-xs text-on-surface-variant leading-6 px-4">
                                به‌محض بررسی توسط مدیر بازار، نتیجه در اعلان‌هایتان اعلام می‌شود.
                            </p>
                        </div>
                    ) : step === 'terms' ? (
                        <>
                            {rejectInfo && (
                                <div className="mb-3 flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20
                                    border border-rose-200/70 dark:border-rose-800/60">
                                    <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-[11px] text-rose-700 dark:text-rose-300 leading-5">
                                        درخواست قبلی شما رد شد{rejectInfo ? ` — دلیل: ${rejectInfo}` : ''}.
                                        می‌توانید پس از رفع مشکل دوباره درخواست بدهید.
                                    </p>
                                </div>
                            )}
                            <p className="text-xs font-bold text-on-surface mb-2">شرایط عضویت در بازار</p>
                            <div className="rounded-xl bg-surface-container-low border border-outline-variant/25 p-4 mb-3 max-h-56 overflow-y-auto scrollbar-slim">
                                {terms ? (
                                    <p className="text-[12.5px] text-on-surface leading-7 whitespace-pre-line">{terms}</p>
                                ) : (
                                    <p className="text-[12.5px] text-on-surface-variant leading-7">
                                        مدیر بازار شرایط خاصی ثبت نکرده است. با ثبت درخواست، مدارک و کسب‌وکار شما
                                        توسط مدیر بررسی می‌شود و پس از تایید، عضو بازار خواهید شد.
                                    </p>
                                )}
                            </div>
                            <label className="flex items-start gap-2 cursor-pointer mb-4">
                                <input type="checkbox" checked={termsAccepted}
                                       onChange={(e) => setTermsAccepted(e.target.checked)}
                                       className="mt-0.5 w-4 h-4 accent-[var(--md-sys-color-primary,#a11f2c)]" />
                                <span className="text-xs text-on-surface leading-5">شرایط عضویت را خواندم و می‌پذیرم</span>
                            </label>
                            <button type="button" disabled={!termsAccepted} onClick={() => setStep('role')}
                                    className="w-full h-11 rounded-xl bg-primary text-on-primary text-sm font-bold
                                        hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                                ادامه
                            </button>
                        </>
                    ) : step === 'role' ? (
                        <>
                            <p className="text-xs font-bold text-on-surface mb-3">با چه نقشی می‌خواهید عضو شوید؟</p>
                            <div className="space-y-2.5 mb-4">
                                <button type="button" onClick={() => setRoleType('buyer')} className={optionCard(roleType === 'buyer')}>
                                    <ShoppingBag className={cn('w-5 h-5 mt-0.5 flex-shrink-0', roleType === 'buyer' ? 'text-primary' : 'text-on-surface-variant/50')} />
                                    <span className="min-w-0">
                                        <span className="block text-[13px] font-bold text-on-surface">خریدارم</span>
                                        <span className="block text-[11px] text-on-surface-variant leading-5 mt-0.5">
                                            قیمت‌ها را می‌بینم، مقایسه می‌کنم و تماس می‌گیرم
                                        </span>
                                    </span>
                                </button>
                                <button type="button" onClick={() => setRoleType('seller')} className={optionCard(roleType === 'seller')}>
                                    <Store className={cn('w-5 h-5 mt-0.5 flex-shrink-0', roleType === 'seller' ? 'text-primary' : 'text-on-surface-variant/50')} />
                                    <span className="min-w-0">
                                        <span className="block text-[13px] font-bold text-on-surface">فروشنده‌ام</span>
                                        <span className="block text-[11px] text-on-surface-variant leading-5 mt-0.5">
                                            قیمت‌های کاتالوگم روی تابلوی این بازار منتشر می‌شود
                                        </span>
                                    </span>
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setStep('terms')}
                                        className="h-11 px-4 rounded-xl border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-container-high">
                                    برگشت
                                </button>
                                <button type="button" onClick={() => setStep(roleType === 'buyer' ? 'buyer' : 'seller')}
                                        className="flex-1 h-11 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary/90">
                                    ادامه
                                </button>
                            </div>
                        </>
                    ) : step === 'buyer' ? (
                        <>
                            <p className="text-xs font-bold text-on-surface mb-2">با کدام کسب‌وکار خریدار می‌شوید؟</p>
                            {bizLoading ? (
                                <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                            ) : businesses.length === 0 ? (
                                <div className="text-center py-6 mb-2">
                                    <Building2 className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
                                    <p className="text-[12.5px] text-on-surface leading-6 mb-4">
                                        هنوز کسب‌وکاری ثبت نکرده‌ای — برای عضویت به‌عنوان خریدار، اول کسب‌وکارت را ثبت کن.
                                    </p>
                                    <Link href="/business/register"
                                          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-primary text-on-primary text-[13px] font-bold">
                                        <Building2 className="w-4 h-4" /> ثبت کسب‌وکار
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2 mb-4 max-h-64 overflow-y-auto scrollbar-slim">
                                        {businesses.map((b: any) => (
                                            <button key={b.id} type="button" onClick={() => setBusinessId(b.id)}
                                                    className={optionCard(businessId === b.id)}>
                                                <BookOpen className={cn('w-5 h-5 mt-0.5 flex-shrink-0', businessId === b.id ? 'text-primary' : 'text-on-surface-variant/50')} />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-[13px] font-bold text-on-surface truncate">{b.name}</span>
                                                    {b.city && <span className="block text-[10.5px] text-on-surface-variant mt-0.5">{b.city}</span>}
                                                </span>
                                                {businessId === b.id && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setStep('role')}
                                                className="h-11 px-4 rounded-xl border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-container-high">
                                            برگشت
                                        </button>
                                        <button type="button" disabled={!businessId || submitting} onClick={submit}
                                                className="flex-1 h-11 rounded-xl bg-primary text-on-primary text-sm font-bold
                                                    hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-1.5">
                                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                            ثبت درخواست
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    ) : step === 'seller' ? (
                        <>
                            <p className="text-xs font-bold text-on-surface mb-2">قیمت‌های کدام کاتالوگ را وارد بازار می‌کنید؟</p>
                            {catLoading ? (
                                <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                            ) : catalogs.length === 0 ? (
                                <div className="text-center py-6 mb-2">
                                    <Store className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
                                    <p className="text-[12.5px] text-on-surface leading-6 mb-4">
                                        هنوز کاتالوگی نداری — برای فروشندگی در این بازار، اول کاتالوگت را بساز.
                                    </p>
                                    <Link href="/business/register?intent=catalog"
                                          className="inline-flex items-center gap-1.5 h-10 px-5 rounded-xl bg-primary text-on-primary text-[13px] font-bold">
                                        <Store className="w-4 h-4" /> ساخت کاتالوگ
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="space-y-2 mb-4 max-h-64 overflow-y-auto scrollbar-slim">
                                        {catalogs.map((c: any) => (
                                            <button key={c.id} type="button" onClick={() => setCatalogId(c.id)}
                                                    className={optionCard(catalogId === c.id)}>
                                                <Store className={cn('w-5 h-5 mt-0.5 flex-shrink-0', catalogId === c.id ? 'text-primary' : 'text-on-surface-variant/50')} />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block text-[13px] font-bold text-on-surface truncate">{c.name}</span>
                                                    {(c.business?.name || c.industryName) &&
                                                        <span className="block text-[10.5px] text-on-surface-variant mt-0.5 truncate">
                                                            {c.business?.name || c.industryName}
                                                        </span>}
                                                </span>
                                                {catalogId === c.id && <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setStep('role')}
                                                className="h-11 px-4 rounded-xl border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-container-high">
                                            برگشت
                                        </button>
                                        <button type="button" disabled={!catalogId || submitting} onClick={submit}
                                                className="flex-1 h-11 rounded-xl bg-primary text-on-primary text-sm font-bold
                                                    hover:bg-primary/90 disabled:opacity-40 flex items-center justify-center gap-1.5">
                                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                            ثبت درخواست
                                        </button>
                                    </div>
                                </>
                            )}
                        </>
                    ) : step === 'done' ? (
                        <div className="text-center py-8">
                            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-4" />
                            <p className="text-sm font-bold text-on-surface mb-1.5">درخواست عضویت شما ثبت شد</p>
                            <p className="text-xs text-on-surface-variant leading-6 px-4 mb-5">
                                مدیر بازار درخواستت را بررسی می‌کند — نتیجه (تایید یا رد با دلیل)
                                در اعلان‌هایتان به شما اعلام می‌شود.
                            </p>
                            <button type="button" onClick={onClose}
                                    className="h-10 px-6 rounded-xl bg-primary text-on-primary text-sm font-bold hover:bg-primary/90">
                                متوجه شدم
                            </button>
                        </div>
                    ) : null}
                </div>

                {/* پانویس راهنما */}
                {isAuthenticated && !loading && (step === 'terms' || step === 'role') && (
                    <div className="px-5 py-3 border-t border-outline-variant/20 flex items-start gap-2">
                        <Info className="w-3.5 h-3.5 text-on-surface-variant/60 mt-0.5 flex-shrink-0" />
                        <p className="text-[10.5px] text-on-surface-variant leading-5">
                            عضویت در بازار خصوصی رایگان است؛ فقط باید شرایط را داشته باشی و مدیر تایید کند.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
