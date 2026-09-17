// app/my-catalogs/components/CustomersTab.tsx
// 🤝 تب «خریداران» بازوی فروش — مدیریت خریدارها (مقایسِ تب «تامین‌کنندگان» در بازوی خرید)
//    فقط مسایل خریدار: ثبت خریدار، تایید درخواست، تغییر مسئول، حذف
//    ✅ ارتقا به مدیر / تغییر نقش / منطقهٔ فروش اینجا وجود ندارد — آن‌ها مالِ تب «تیم فروش» است
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Handshake, UserPlus, Trash2, Check, X, Loader2, Hourglass,
    MoreVertical, ArrowLeftRight,
} from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CARD_CLS } from '../constants';
import { useCatalogTeam } from '@/lib/api/apiHooks';
import ConnectionRequestModal from './ConnectionRequestModal';
import OfferCallButton from '@/app/components/OfferCallButton';
import { Avatar, BuyerMainInfo, personalSlugOf, REQUEST_LABEL, InviteStateChip } from './MemberBits';

interface Props {
    catalogId: string;
    /** اسلاگ بازوی فروش — لینک دعوت در ماژول مخاطبین مودال درخواست ارتباط */
    slug?: string | null;
}

export default function CustomersTab({ catalogId, slug }: Props) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data, isLoading, refetch } = useCatalogTeam(catalogId);

    const [busy, setBusy] = useState<string | null>(null);
    const [addOpen, setAddOpen] = useState(false);
    const [reassignTarget, setReassignTarget] = useState<any>(null);
    const [menuFor, setMenuFor] = useState<string | null>(null);

    const team = data || null;
    const canManage = !!team?.myRole?.canManage;

    const refresh = () => {
        queryClient.invalidateQueries({ queryKey: ['catalog-team', catalogId] });
        queryClient.invalidateQueries({ queryKey: ['catalogs'] });
        queryClient.invalidateQueries({ queryKey: ['catalog-pending-summary'] });
        queryClient.invalidateQueries({ queryKey: ['my-pending-approvals'] });
        refetch();
    };

    // ✅ به‌روزرسانی خوش‌بینانه — ردیف همان لحظه از کشِ برگه می‌رود؛ رفرش سرور در پس‌زمینه هم‌گام می‌کند
    //    (رفع گزارش مالک: «حذف میشه ولی باید رفرش کنی تا از لیست بره»)
    const patchTeam = (patch: (old: any) => any) => {
        queryClient.setQueryData(['catalog-team', catalogId], (old: any) => (old ? patch(old) : old));
    };
    /** حذف کامل عضو از ردیف‌ها و درخواست‌های در انتظار — لغو/حذف/رد */
    const stripMemberFrom = (memberId: string) => (old: any) => ({
        ...old,
        customers: (old.customers || []).filter((c: any) => c.id !== memberId),
        pendingRequests: (old.pendingRequests || []).filter((r: any) => r.id !== memberId),
    });
    /** فعال‌شدن عضو بعد از پذیرش — چیپ «در حال انتظار» همان لحظه می‌رود */
    const activateMemberIn = (memberId: string) => (old: any) => ({
        ...old,
        customers: (old.customers || []).map((c: any) => (c.id === memberId ? { ...c, customerStatus: 'active' } : c)),
        pendingRequests: (old.pendingRequests || []).filter((r: any) => r.id !== memberId),
    });

    const run = async (
        key: string,
        fn: () => Promise<any>,
        successMsg?: string,
        optimistic?: (old: any) => any,
    ) => {
        setBusy(key);
        // ✅ به‌روزرسانی خوش‌بینانه «قبل از ارسال» — ردیف همان لحظهٔ کلیک غیب می‌شود؛
        //    حذف/رد در پس‌زمینه تمام می‌شود (زنجیرهٔ بک چند رفت‌وبرگشت به دیتابیس دارد و کند است)؛
        //    اگر عملیات خطا بخورد، refresh() حقیقت سرور را برمی‌گرداند (ردیف خودش برمی‌گردد)
        if (optimistic) patchTeam(optimistic);
        try {
            const res = await fn();
            if (successMsg) toast.success(successMsg || res?.message);
            refresh();
            return res;
        } catch (e: any) {
            toast.error(e?.data?.message || e?.message || 'خطا در انجام عملیات');
            refresh(); // ✅ بازگردانی خودکار در خطا — چیزی که نبود حذف نمی‌ماند
        } finally {
            setBusy(null);
        }
    };

    if (isLoading || !team) {
        return (
            <div className="py-10 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            </div>
        );
    }

    // عضوِ منتظرِ تایید — هنوز نمی‌تواند خریدار ثبت کند
    const isPendingSeller = !!team?.myRole?.isPendingSeller && !canManage;
    if (isPendingSeller) {
        return (
            <div className={cn(CARD_CLS, 'p-6 text-center')}>
                <Hourglass className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                <p className="font-bold text-gray-900 dark:text-gray-100">درخواست همکاری در فروش شما در انتظار تایید است</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    بعد از تایید مدیر بازوی فروش، می‌توانید از همین برگه برای خریدارهای خودتان خریدار ثبت کنید
                </p>
            </div>
        );
    }

    // عضوِ منتظرِ تایید — بالاتر چک شد
    const sellers: any[] = team.sellers || [];
    const pendingBuyers: any[] = (team.pendingRequests || []).filter((s: any) => s.requestType === 'buyer');
    const customers: any[] = team.customers || [];
    const activeCustomers = customers.filter((c) => c.customerStatus === 'active');

    // ✅ وضعیت ردیف خریدار — درخواستِ خودِ متقاضی (self_request و ردیف‌های قدیمیِ بی‌via) در انتظار تاییدِ مدیر است
    const rowStateOf = (c: any): 'active' | 'self_pending' | 'owner_pending' | 'declined' => {
        if (c.customerStatus === 'active') return 'active';
        if (c.customerStatus === 'pending') return c.customerVia === 'owner_add' ? 'owner_pending' : 'self_pending';
        return 'declined';
    };
    // ✅ ترتیب (Task 26): خریدارهایِ مسئولِ من → بقیهٔ فعال‌ها → «در حال انتظار تایید شما» → «در انتظار پذیرش خریدار» → «درخواست رد شده»
    //    ✅ درخواست همکاریِ خریدار (خواستهٔ مالک): در خودِ لیست خریداران می‌آید با وضعیت «در حال انتظار» — نه فقط در کارت بالا
    const myId = team.myRole?.userId || null;
    const rankOf = (c: any) => {
        const st = rowStateOf(c);
        if (st === 'active') return c.assignedSellerUserId && c.assignedSellerUserId === myId ? 0 : 1;
        if (st === 'self_pending') return 2;
        if (st === 'owner_pending') return 3;
        return 4;
    };
    const buyerRows = [...customers].sort((a: any, b: any) => rankOf(a) - rankOf(b));

    // ✅ منوی خریدار — بسته به وضعیت: فعال → تغییر مسئول/حذف؛ درخواستِ متقاضی → رد؛ ثبتِ ما → لغو
    const menuActionsFor = (m: any) => {
        const acts: { key: string; icon: any; label: string; onClick: () => void; danger?: boolean }[] = [];
        const st = rowStateOf(m);
        const displayName = m.customerBusiness?.name || m.fullName || 'این خریدار';
        if (st === 'active') {
            acts.push({
                key: 'reassign',
                icon: ArrowLeftRight,
                label: 'تغییر مسئولِ خریدار',
                onClick: () => setReassignTarget(m),
            });
        }
        if (st === 'self_pending') {
            acts.push({
                key: 'reject',
                icon: X,
                label: 'رد درخواست',
                danger: true,
                onClick: () => {
                    if (window.confirm(`درخواست خریداری «${displayName}» رد شود؟`)) {
                        run(`rej-${m.id}`, () => apiService.catalog.team.rejectBuyer(catalogId, m.id), 'درخواست رد شد', stripMemberFrom(m.id));
                    }
                },
            });
        } else {
            acts.push({
                key: 'remove',
                icon: Trash2,
                // ✅ برچسب کوتاه و روشن (خواستهٔ مالک): «لغو درخواست» — نه جملهٔ بلند
                label: st === 'owner_pending' ? 'لغو درخواست' : 'حذف خریدار',
                danger: true,
                onClick: () => {
                    const isCancel = st === 'owner_pending';
                    const confirmText = isCancel
                        ? `درخواست ثبت خریداری «${displayName}» لغو شود؟`
                        : `«${displayName}» از فهرست خریداران حذف شود؟`;
                    if (window.confirm(confirmText)) {
                        run(
                            `rm-${m.id}`,
                            () => apiService.catalog.team.removeCustomer(catalogId, m.id),
                            isCancel ? 'درخواست لغو شد' : 'از لیست حذف شد',
                            stripMemberFrom(m.id),
                        );
                    }
                },
            });
        }
        return acts;
    };

    const rowFor = (m: any) => {
        const st = rowStateOf(m);
        const menuOpen = menuFor === m.id;
        const actions = canManage ? menuActionsFor(m) : [];
        const pSlug = personalSlugOf(m);
        const displayName = m.customerBusiness?.name || m.fullName || 'خریدار';
        return (
            <div key={m.id} className={cn(
                'flex items-center gap-2.5 p-2.5 rounded-xl transition-colors',
                st === 'declined' ? 'bg-rose-50/50 dark:bg-rose-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50',
            )}>
                <Avatar url={m.avatarUrl} name={m.customerBusiness?.name || m.fullName} />
                <BuyerMainInfo m={m} onOpen={pSlug ? () => router.push(`/${pSlug}`) : undefined} />

                {/* ✅ وضعیت درخواست — درخواستِ متقاضی در خودِ لیست با «در حال انتظار تایید شما» دیده می‌شود */}
                {st === 'self_pending' && <InviteStateChip state="pending" pendingLabel="در حال انتظار تایید شما" />}
                {st === 'owner_pending' && <InviteStateChip state="pending" pendingLabel="در انتظار پذیرش خریدار" />}
                {st === 'declined' && <InviteStateChip state="declined" />}

                {/* ✅ تماس با خریدار — همیشه (شمارهٔ ثبت‌نام شخص؛ قاعدهٔ تماس‌ها) */}
                <OfferCallButton
                    phone={m.phone}
                    title={st === 'self_pending'
                        ? 'تماس با متقاضی خریداربودن'
                        : st === 'owner_pending'
                            ? 'تماس — یادآوری پذیرش ثبت خریدار'
                            : `تماس با ${displayName}`}
                />

                {/* منو یا دکمهٔ حذفِ ردشده */}
                {st === 'declined' ? (
                    <button
                        onClick={() => {
                            if (window.confirm(`«${displayName}» از لیست حذف شود؟`)) {
                                run(`rm-${m.id}`, () => apiService.catalog.team.removeCustomer(catalogId, m.id), 'از لیست حذف شد', stripMemberFrom(m.id));
                            }
                        }}
                        className="p-2 rounded-full text-stone-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors flex-shrink-0"
                        title="حذف از لیست"
                        aria-label="حذف از لیست"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                ) : actions.length > 0 && (
                    <div className="relative flex-shrink-0">
                        <button
                            onClick={() => setMenuFor(menuOpen ? null : m.id)}
                            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                            title="اقدامات"
                        >
                            <MoreVertical className="w-4 h-4" />
                        </button>
                        {menuOpen && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setMenuFor(null)} />
                                <div className="absolute left-0 top-full mt-1 z-40 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-outline-variant/30 py-1.5 text-xs">
                                    {actions.map((a) => (
                                        <button
                                            key={a.key}
                                            onClick={() => { setMenuFor(null); a.onClick(); }}
                                            className={cn(
                                                'w-full flex items-center gap-2 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-right',
                                                a.danger && 'hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400',
                                            )}
                                        >
                                            <a.icon className="w-3.5 h-3.5" />{a.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* سربرگ: شمارندهٔ خریدارها + ثبت خریدار جدید */}
            <div className={cn(CARD_CLS, 'p-4 flex items-center gap-3')}>
                <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Handshake className="w-5 h-5 text-primary" />
                </span>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 dark:text-gray-100">خریدارهای بازوی فروش</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        {activeCustomers.length.toLocaleString('fa-IR')} خریدار فعال
                        {canManage && pendingBuyers.length > 0 && ` · ${pendingBuyers.length.toLocaleString('fa-IR')} درخواست جدید`}
                    </p>
                </div>
                {(canManage || team.myRole?.isSeller) && (
                    <button
                        onClick={() => { setAddOpen(true); }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 transition"
                    >
                        <UserPlus className="w-4 h-4" />
                        <span className="hidden sm:inline">درخواست ارتباط با خریدار</span>
                        <span className="sm:hidden">درخواست ارتباط</span>
                    </button>
                )}
            </div>

            {/* درخواست‌های خریداری در انتظار تایید شما */}
            {canManage && pendingBuyers.length > 0 && (
                <div className={cn(CARD_CLS, 'p-4 border-amber-400/40')}>
                    <p className="font-bold text-sm text-amber-700 dark:text-amber-300 mb-3 flex items-center gap-2">
                        <Hourglass className="w-4 h-4" />
                        درخواست‌های خریداری در انتظار تایید شما — {pendingBuyers.length.toLocaleString('fa-IR')} مورد
                    </p>
                    <div className="space-y-2">
                        {pendingBuyers.map((s) => (
                            <div key={s.id} className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50/60 dark:bg-amber-900/10">
                                <Avatar url={s.avatarUrl} name={s.customerBusiness?.name || s.fullName} size={36} />
                                <div className="flex-1 min-w-0">
                                    {/* ✅ هویتِ تجاری جلو است: کسب‌وکار (بازوی خرید) / صاحب (نقش) */}
                                    <BuyerMainInfo m={s} />
                                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                                        {REQUEST_LABEL.buyer} — در حال انتظار تایید شما
                                    </p>
                                </div>
                                {busy === `apr-${s.id}` ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" /> : (
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                        {/* ✅ تماس با متقاضی — همیشه (شمارهٔ ثبت‌نام) */}
                                        <OfferCallButton phone={s.phone} title="تماس با متقاضی خریداربودن" />
                                        <button
                                            onClick={() => run(`apr-${s.id}`, () => apiService.catalog.team.approveBuyer(catalogId, s.id), 'به‌عنوان خریدار تایید شد', activateMemberIn(s.id))}
                                            className="h-8 px-2.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1"
                                            title="تایید درخواست"
                                        >
                                            <Check className="w-3.5 h-3.5" />تایید
                                        </button>
                                        <button
                                            onClick={() => run(`rej-${s.id}`, () => apiService.catalog.team.rejectBuyer(catalogId, s.id), 'درخواست رد شد', stripMemberFrom(s.id))}
                                            className="h-8 px-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-bold"
                                            title="رد درخواست"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* فهرست خریدارها — با بازوی خریدشان + ثبت‌های منتظرِ پذیرش/ردشده */}
            <div className={cn(CARD_CLS, 'p-2')}>
                <p className="flex items-center gap-1.5 px-2 pt-2 pb-1 text-[11px] font-black text-primary">
                    <Handshake className="h-3.5 w-3.5" />
                    خریدارها — با بازوی خریدشان
                </p>
                {buyerRows.map((m: any) => <React.Fragment key={m.id}>{rowFor(m)}</React.Fragment>)}
                {buyerRows.length === 0 && (
                    <p className="py-6 text-center text-sm text-gray-400">هنوز خریداری ثبت نشده — از «درخواست ارتباط با خریدار» شروع کن</p>
                )}
            </div>

            {/* ─── مودال ثبت خریدار — کسب‌وکارها / مخاطبین (بیزینس + بازوی خریدش؛ خواستهٔ مالک) ─── */}
            <ConnectionRequestModal
                open={addOpen}
                onClose={() => setAddOpen(false)}
                catalogId={catalogId}
                mode="buyers"
                canAssign={canManage}
                sellers={sellers.filter((s: any) => s.sellerStatus === 'active')}
                slug={slug}
            />

            {/* ─── مودال تغییر مسئولِ مشتری ─── */}
            {reassignTarget && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setReassignTarget(null)}>
                    <div
                        className="bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl p-5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <p className="font-bold text-gray-900 dark:text-gray-100 mb-1">تغییر مسئولِ مشتری</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                            مشتری «{reassignTarget.customerBusiness?.name}» به کدام عضوِ فروش سپرده شود؟
                        </p>
                        <div className="space-y-2">
                            {sellers.map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => {
                                        const target = reassignTarget;
                                        setReassignTarget(null);
                                        run(`as-${target.id}`, () => apiService.catalog.team.assignCustomer(catalogId, target.id, s.userId), 'مسئولِ مشتری تغییر کرد');
                                    }}
                                    className={cn(
                                        'w-full flex items-center gap-3 p-3 rounded-xl border text-right transition',
                                        reassignTarget.assignedSellerUserId === s.userId
                                            ? 'border-primary bg-primary/5'
                                            : 'border-outline-variant/30 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50',
                                    )}
                                >
                                    <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                                        {(s.fullName || '؟').slice(0, 1)}
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate">
                                            {s.fullName || '—'} {s.isOwner && '(مالک)'}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {s.sellerRole === 'visitor' ? 'ویزیتور' : 'فروشنده'}
                                            {s.business?.name ? ` · ${s.business.name}` : ''}{s.sellerRegion && ` · ${s.sellerRegion}`}
                                        </p>
                                    </div>
                                    {reassignTarget.assignedSellerUserId === s.userId && (
                                        <span className="text-[10px] text-primary font-bold flex-shrink-0">مسئول فعلی</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
