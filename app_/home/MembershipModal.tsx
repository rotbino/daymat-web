// app_/home/MembershipModal.tsx
'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import {
    X, ShieldCheck, ShoppingBag, Store, Building2, BookOpen, Loader2,
    CheckCircle2, LogIn, Info, AlertCircle, Calendar, LogOut, Undo2,
} from 'lucide-react';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';
import { useMyBusinesses } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
    open: boolean;
    onClose: () => void;
    slug: string;
    /** بازار فعلی — برای نام و شرایط عضویت (از redux یا getDetail) */
    arm?: any;
    /** ✅ نقشِ اولیه — برای «فرصت فروشندگی»ِ بازای عمومی؛ مودال مستقیم روی انتخاب کاتالوگ باز می‌شود */
    initialRole?: 'buyer' | 'seller';
}

type Step = 'terms' | 'role' | 'buyer' | 'seller' | 'done' | 'member' | 'pending';

const fmtDate = (v?: string | null) =>
    v ? new Date(v).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

/**
 * مدال عضویت بازار — مدل سه‌لِینی:
 *   بازار خصوصی: ویزارد شرایط → نقش → کسب‌وکار/کاتالوگ → درخواست pending → تایید مدیر
 *   بازار عمومی: فقط «فرصت فروشندگی» (خریدار نیازی به عضویت ندارد — قیمت‌ها آزاد است)
 *   عضو: تاریخ عضویت + خروج (خریدار از همین‌جا؛ فروشنده از پنل کاتالوگ با تایید دومرحله‌ای)
 *   فروشنده شدن همیشه نیاز به تایید و افزودن کاتالوگ توسط مدیر دارد (عمومی و خصوصی)
 */
export default function MembershipModal({ open, onClose, slug, arm, initialRole }: Props) {
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);
    const queryClient = useQueryClient();

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [confirmLeave, setConfirmLeave] = useState(false);
    const [step, setStep] = useState<Step>('terms');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [roleType, setRoleType] = useState<'buyer' | 'seller'>(initialRole || 'buyer');
    const [businessId, setBusinessId] = useState<string>('');
    const [catalogId, setCatalogId] = useState<string>('');
    const [rejectInfo, setRejectInfo] = useState<string | null>(null);
    // ✅ بازار خصوصی است؟ — از پاسخ بک می‌آید (undefined = عمومی، هم‌راستا با گیت قیمت)
    const [marketPrivate, setMarketPrivate] = useState(true);
    // ✅ خلاصهٔ عضویت برای حالت «عضو» — تاریخ‌ها و لِین‌ها
    const [memberInfo, setMemberInfo] = useState<any>(null);
    // ✅ درخواست لغویِ در انتظارِ تاییدِ مالک — بج + پس‌گرفتنِ درخواست
    const [pendingLeave, setPendingLeave] = useState<any>(null);
    const [pendingSince, setPendingSince] = useState<string | null>(null);

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
        setConfirmLeave(false);
        if (!isAuthenticated) return; // مهمان: همان‌جا CTA ورود می‌بیند
        setLoading(true);
        apiService.arm.getMyMembershipRequest(slug)
            .then((res: any) => {
                const membership = res?.membership;
                const request = res?.request;
                setMarketPrivate(res?.arm?.isPrivate === true);
                // ✅ درخواست لغویِ در انتظارِ تاییدِ مالک (پنل مالک بررسی می‌کند)
                setPendingLeave(res?.leaveRequest?.status === 'pending' ? res.leaveRequest : null);
                if (initialRole) setRoleType(initialRole);
                // ✅ آینهٔ گیت قیمت بک (canViewVitrinePrices): عضو واقعی یعنی
                //    عضویتِ لِین‌دار فعال (businessId/catalogId) — یا مالک/ادمین بازار
                const isRealMember =
                    membership?.status === 'active' &&
                    membership.businessStatus === 'active' &&
                    (!!membership.businessId || !!membership.catalogId ||
                     ['arm_owner', 'arm_admin'].includes(membership.role));
                if (isRealMember) {
                    setMemberInfo(membership);
                    setStep('member');
                } else if (request?.status === 'pending') {
                    setPendingSince(request?.createdAt || null);
                    setStep('pending');
                } else {
                    if (request?.status === 'rejected') {
                        setRejectInfo(request.rejectReason || null);
                    }
                    // ✅ بازار خصوصی → ویزارد کامل با شرایط؛ عمومی → مستقیم فرصت فروشندگی
                    setStep(marketPrivatePreview(res) ? 'terms' : 'role');
                }
            })
            .catch(() => setStep('terms'))
            .finally(() => setLoading(false));
    }, [open, slug, isAuthenticated, initialRole]);

    // بازار خصوصی؟ — قبل از ست‌شدن state در همان پاسخ چک می‌شود
    const marketPrivatePreview = (res: any) => res?.arm?.isPrivate === true;

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

    // ✅ لغوِ عضویتِ خریدار — درخواست به پنل مالک بازار می‌رود؛ خروج فقط با تاییدِ او (تاریخ و عاملِ لغو ثبت می‌شود)
    const requestLeaveAsBuyer = async () => {
        setLeaving(true);
        try {
            await apiService.arm.requestLeave(slug, { roleType: 'buyer', businessId: memberInfo?.businessId || undefined });
            toast.success('درخواست لغو عضویت ثبت شد — تا تایید مالک، عضویتتان برقرار است');
            setPendingLeave({ status: 'pending', roleType: 'buyer', createdAt: new Date().toISOString() });
            setConfirmLeave(false);
            queryClient.invalidateQueries({ queryKey: ['arms'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-derived'] });
        } catch (e: any) {
            const code = e?.data?.errorCode;
            if (code === 'LEAVE_REQUEST_ALREADY_PENDING') {
                setPendingLeave({ status: 'pending', roleType: 'buyer', createdAt: new Date().toISOString() });
                setConfirmLeave(false);
            } else if (code === 'NOT_BUYER') {
                toast.info('شما به‌عنوان خریدار در این بازار عضو نیستید');
            } else {
                toast.error(e?.data?.message || e?.message || 'خطا در ثبت درخواست لغو');
            }
        } finally {
            setLeaving(false);
        }
    };

    // ✅ پس‌گرفتنِ درخواست لغویِ در انتظار
    const withdrawLeaveRequest = async () => {
        setLeaving(true);
        try {
            await apiService.arm.withdrawLeave(slug);
            toast.success('درخواست لغو برداشته شد — عضویتتان مثل قبل برقرار است');
            setPendingLeave(null);
            queryClient.invalidateQueries({ queryKey: ['arms'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-derived'] });
        } catch (e: any) {
            toast.error(e?.data?.message || e?.message || 'خطا در پس‌گرفتن درخواست');
        } finally {
            setLeaving(false);
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
                            <p className="text-[10px] text-on-surface-variant">
                                {marketPrivate ? 'بازار خصوصی — عضویت با تایید مدیر' : 'فرصت فروشندگی — افزودن کاتالوگ با تایید مدیر'}
                            </p>
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
                        <div className="text-center py-6">
                            <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
                            <p className="text-sm font-bold text-on-surface mb-1">شما عضو {armName} هستید</p>
                            <p className="text-xs text-on-surface-variant">قیمت‌ها و امکانات این بازار برای شما باز است.</p>

                            {/* ✅ تاریخ دقیق عضویت — برای پروندهٔ عضویت/لغو عضویت */}
                            {memberInfo?.joinedAt && (
                                <div className="mt-4 mx-auto max-w-xs flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
                                    bg-surface-container-low border border-outline-variant/20 text-[11px] text-on-surface-variant">
                                    <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                                    عضو شده‌اید از: {fmtDate(memberInfo.joinedAt)}
                                </div>
                            )}

                            {/* ✅ لغو عضویت — خریدار از همین‌جا درخواست می‌دهد؛ فروشنده از پنل کاتالوگ.
                                خروج فقط با تایید مالک بازار انجام می‌شود (تاریخ و عاملِ لغو ثبت می‌شود) */}
                            {memberInfo?.catalogId ? (
                                <div className="mt-4 mx-2 flex items-start gap-2 p-3 rounded-xl bg-surface-container-low
                                    border border-outline-variant/20 text-right">
                                    <Info className="w-4 h-4 text-on-surface-variant/70 mt-0.5 flex-shrink-0" />
                                    <p className="text-[11px] text-on-surface-variant leading-5">
                                        فروشندهٔ این بازار هستی؛ برای لغو عضویت، از بخش «انتشار در بازارها» در{' '}
                                        <Link href="/my-catalogs" className="font-bold text-primary hover:underline">پنل کاتالوگ</Link>{' '}
                                        درخواست بده — لغو با تایید مالک بازار انجام می‌شود.
                                    </p>
                                </div>
                            ) : !['arm_owner', 'arm_admin'].includes(memberInfo?.role) ? (
                                <div className="mt-5">
                                    {pendingLeave ? (
                                        // ✅ درخواست لغویِ در انتظار — بج + پس‌گرفتن
                                        <div className="mx-2 flex items-center justify-between gap-2 p-3 rounded-xl
                                            bg-amber-50 dark:bg-amber-900/20 border border-amber-200/70 dark:border-amber-800/50">
                                            <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-5 text-right">
                                                درخواست لغو عضویتت ثبت شده و در انتظار بررسی مالک بازار است —
                                                تا تاییدِ او عضویتتان برقرار است.
                                            </p>
                                            <button type="button" disabled={leaving} onClick={withdrawLeaveRequest}
                                                    className="flex-shrink-0 h-8 px-3 rounded-lg border border-amber-300 dark:border-amber-700
                                                        text-amber-700 dark:text-amber-300 text-[11px] font-bold
                                                        hover:bg-amber-100 dark:hover:bg-amber-900/40 disabled:opacity-50
                                                        flex items-center gap-1 transition-colors">
                                                {leaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Undo2 className="w-3 h-3" />}
                                                پس گرفتن
                                            </button>
                                        </div>
                                    ) : !confirmLeave ? (
                                        <button type="button" onClick={() => setConfirmLeave(true)}
                                                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl border border-rose-200 dark:border-rose-800/60
                                                    text-rose-600 dark:text-rose-400 text-[12px] font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                                            <LogOut className="w-3.5 h-3.5" />
                                            درخواست لغو عضویت
                                        </button>
                                    ) : (
                                        <div className="inline-flex items-center gap-2">
                                            <span className="text-[11px] text-on-surface-variant">درخواست به مالک بازار می‌رود — مطمئنی؟</span>
                                            <button type="button" disabled={leaving} onClick={requestLeaveAsBuyer}
                                                    className="h-9 px-4 rounded-xl bg-rose-600 text-white text-[12px] font-bold
                                                        hover:bg-rose-700 disabled:opacity-50 flex items-center gap-1.5">
                                                {leaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                                بله، ثبت کن
                                            </button>
                                            <button type="button" onClick={() => setConfirmLeave(false)}
                                                    className="h-9 px-3 rounded-xl text-[12px] font-bold text-on-surface-variant hover:bg-surface-container-high">
                                                انصراف
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : null}
                        </div>
                    ) : step === 'pending' ? (
                        <div className="text-center py-8">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                                <Loader2 className="w-7 h-7 text-amber-500" />
                            </div>
                            <p className="text-sm font-bold text-on-surface mb-1">درخواست شما در انتظار بررسی است</p>
                            {pendingSince && (
                                <p className="text-[11px] text-on-surface-variant mb-1.5 flex items-center justify-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    ثبت‌شده در: {fmtDate(pendingSince)}
                                </p>
                            )}
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
                            <p className="text-xs font-bold text-on-surface mb-3">
                                {marketPrivate ? 'با چه نقشی می‌خواهید عضو شوید؟' : 'کالاهایت را در این بازار عرضه کن'}
                            </p>
                            <div className="space-y-2.5 mb-4">
                                {/* ✅ خریدار فقط در بازار خصوصی — در عمومی قیمت‌ها آزاد است و عضویتِ خریدار موضوعیت ندارد */}
                                {marketPrivate && (
                                    <button type="button" onClick={() => setRoleType('buyer')} className={optionCard(roleType === 'buyer')}>
                                        <ShoppingBag className={cn('w-5 h-5 mt-0.5 flex-shrink-0', roleType === 'buyer' ? 'text-primary' : 'text-on-surface-variant/50')} />
                                        <span className="min-w-0">
                                            <span className="block text-[13px] font-bold text-on-surface">خریدارم</span>
                                            <span className="block text-[11px] text-on-surface-variant leading-5 mt-0.5">
                                                قیمت‌ها را می‌بینم، مقایسه می‌کنم و تماس می‌گیرم
                                            </span>
                                        </span>
                                    </button>
                                )}
                                <button type="button" onClick={() => setRoleType('seller')} className={optionCard(roleType === 'seller')}>
                                    <Store className={cn('w-5 h-5 mt-0.5 flex-shrink-0', roleType === 'seller' ? 'text-primary' : 'text-on-surface-variant/50')} />
                                    <span className="min-w-0">
                                        <span className="block text-[13px] font-bold text-on-surface">فروشنده‌ام</span>
                                        <span className="block text-[11px] text-on-surface-variant leading-5 mt-0.5">
                                            قیمت‌های کاتالوگم روی تابلوی این بازار منتشر می‌شود
                                            — با تایید و افزودنِ کاتالوگ توسط مدیر بازار
                                        </span>
                                    </span>
                                </button>
                            </div>
                            <div className="flex gap-2">
                                {marketPrivate && (
                                    <button type="button" onClick={() => setStep('terms')}
                                            className="h-11 px-4 rounded-xl border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-container-high">
                                        برگشت
                                    </button>
                                )}
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
                            {marketPrivate
                                ? 'عضویت در بازار خصوصی رایگان است؛ فقط باید شرایط را داشته باشی و مدیر تایید کند.'
                                : 'فروشنده شدن نیاز به تایید مدیر دارد؛ کاتالوگت توسط مدیر به بازار افزوده می‌شود.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
