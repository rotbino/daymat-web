// app/[slug]/components/CatalogMembersTab.tsx
'use client';

/**
 * برگه «اعضا»ی کاتالوگ — مثل اعضای کانال تلگرام:
 *   همه در یک فهرست ساده: [آواتار] [نام + کسب‌وکار] [نقش بیزینسی] [نقش سیستمی]
 *   برچسب‌ها: فروشنده / ویزیتور / مشتری / مشتری من — مالک کاتالوگ / مدیر کاتالوگ / خودم
 *   • مدیرها: بخش «در انتظار تایید مدیر (مالک کاتالوگ)» + منوی مدیریت روی هر ردیف
 *   • عضوِ فروش: مشتری‌هایش با برچسب «مشتری من» بالای بقیهٔ مشتری‌ها
 *   • تخصیصِ بقیه دیده نمی‌شود (ضد دزدی مشتری)
 *   • کلیک روی هر عضو → صفحهٔ شخصی (تابلوی کسب‌وکارش)
 *
 *   لایهٔ داده: موتور تیم کاتالوگ (GET /catalog/:id/team — مدل CatalogMember)
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Users, UserPlus, MoreVertical, ShieldCheck, ShieldOff,
    Trash2, X, Check, Loader2, Search, ArrowLeftRight, MapPin,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';

// ─── تایپ‌ها — قرارداد getTeam ───
interface TeamMemberCard {
    id: string;
    userId: string;
    fullName: string | null;
    phone: string | null;
    avatarUrl: string | null;
    business: { id: string; name: string; phone?: string; slug?: string | null } | null;
    role: 'catalog_owner' | 'catalog_admin' | 'catalog_member';
    position: string | null;
    sellerStatus: string | null;
    sellerRole?: 'seller' | 'visitor' | null;
    sellerRegion: string | null;
    sellerBusiness: { id: string; name: string; slug?: string | null } | null;
    customerStatus: string | null;
    customerBusiness: { id: string; name: string; city?: string | null; slug?: string | null } | null;
    assignedSellerUserId: string | null;
    // فروشندگان:
    isOwner?: boolean;
    isAdmin?: boolean;
    customersCount?: number;
    // تزریقی سمت UI:
    __isMyCustomer?: boolean;
    __isMe?: boolean;
}

interface TeamResponse {
    catalog: { id: string; name: string; slug: string | null; businessName: string; ownerUserId: string };
    myRole: {
        isOwner: boolean;
        isAdmin: boolean;
        isSeller: boolean;
        isPendingSeller: boolean;
        canManage: boolean;
        userId: string;
        memberId: string | null;
        sellerRegion: string | null;
    };
    staff?: TeamMemberCard[];
    sellers: TeamMemberCard[];
    pendingSellers: TeamMemberCard[];
    customers: TeamMemberCard[];
    stats: { sellers: number; activeCustomers?: number; pendingCustomers?: number };
    settings?: { enabled: boolean; freeAdLimit: number; multiSeller: boolean };
}

interface CandidateItem {
    id: string;
    name: string;
    city: string | null;
    logoUrl: string | null;
    owner?: { fullName: string | null } | null;
}

// ─── برچسب نقش‌ها ───
const badgeBase = 'text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap text-center';

function Avatar({ url, name, size = 40 }: { url?: string | null; name?: string | null; size?: number }) {
    const [broken, setBroken] = useState(false);
    if (url && !broken) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" style={{ width: size, height: size }} onError={() => setBroken(true)}
                 className="rounded-full object-cover flex-shrink-0 border border-outline-variant/30" />
        );
    }
    const initial = (name || '؟').trim().charAt(0);
    return (
        <div style={{ width: size, height: size }}
             className="rounded-full bg-surface-container-high dark:bg-gray-800 flex items-center justify-center flex-shrink-0 text-on-surface-variant font-bold">
            {initial}
        </div>
    );
}

// ═══════════════════════════════════════════
// مودال شیشه‌ای پایه
// ═══════════════════════════════════════════
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative bg-white dark:bg-gray-900 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 sticky top-0 bg-white dark:bg-gray-900 z-10">
                    <h3 className="font-bold text-sm">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-container-high dark:hover:bg-gray-800">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// مودال افزودن مشتری — جست‌وجوی کسب‌وکار (از موتور تیم)
// ═══════════════════════════════════════════
function AddCustomerModal({ catalogId, onClose, onDone }: { catalogId: string; onClose: () => void; onDone: () => void }) {
    const [term, setTerm] = useState('');
    const [search, setSearch] = useState('');
    const [busyId, setBusyId] = useState<string | null>(null);

    React.useEffect(() => {
        const t = setTimeout(() => setSearch(term), 400);
        return () => clearTimeout(t);
    }, [term]);

    const { data, isLoading, isFetching } = useQuery({
        queryKey: ['catalog-member-customer-search', catalogId, search],
        queryFn: () => apiService.catalog.team.customerCandidates(catalogId, search || ''),
        enabled: search.trim().length >= 2,
        staleTime: 15_000,
    });

    const items: CandidateItem[] = data?.items || [];

    const pick = async (item: CandidateItem) => {
        setBusyId(item.id);
        try {
            await apiService.catalog.team.addCustomer(catalogId, { businessId: item.id });
            toast.success('مشتری ثبت شد — پس از تایید صاحب کسب‌وکار فعال می‌شود');
            onDone();
            onClose();
        } catch (e: any) {
            toast.error(e?.message || 'خطا در ثبت مشتری');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <Modal title="افزودن مشتری" onClose={onClose}>
            <div className="space-y-4">
                <p className="text-xs text-on-surface-variant leading-6">
                    کسب‌وکار را جست‌وجو و انتخاب کنید؛ پس از تایید صاحب کسب‌وکار، مشتری به شما متصل می‌شود و تماس‌هایش به شما می‌رسد.
                </p>
                <div className="relative">
                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
                    <input
                        value={term} onChange={(e) => setTerm(e.target.value)}
                        placeholder="نام کسب‌وکار یا شماره تماس..."
                        className="w-full h-11 pr-9 pl-3 rounded-xl bg-surface-container-lowest dark:bg-gray-800 border border-outline-variant/40 outline-none focus:ring-1 focus:ring-primary/40 text-sm"
                    />
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1.5">
                    {(isLoading || (isFetching && items.length === 0)) && (
                        <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
                    )}
                    {!isLoading && search.trim().length < 2 && (
                        <p className="text-center text-xs text-on-surface-variant py-6">برای جستجو حداقل ۲ حرف تایپ کنید</p>
                    )}
                    {!isLoading && search.trim().length >= 2 && items.length === 0 && (
                        <p className="text-center text-xs text-on-surface-variant py-6">کسب‌وکاری پیدا نشد</p>
                    )}
                    {items.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => pick(item)}
                            disabled={busyId === item.id}
                            className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-outline-variant/30 hover:border-primary/40 hover:bg-primary/5 bg-surface-container-lowest text-right transition-all"
                        >
                            <Avatar url={item.logoUrl} name={item.name} size={38} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{item.name}</p>
                                <p className="text-[11px] text-on-surface-variant truncate">
                                    {item.owner?.fullName || ''}{item.city ? ` · ${item.city}` : ''}
                                </p>
                            </div>
                            {busyId === item.id
                                ? <Loader2 className="w-4 h-4 animate-spin text-primary" />
                                : <span className="text-[10px] font-bold text-primary whitespace-nowrap">افزودن</span>}
                        </button>
                    ))}
                </div>
            </div>
        </Modal>
    );
}

// ═══════════════════════════════════════════
// مودال تغییر مسئولِ مشتری
// ═══════════════════════════════════════════
function ReassignModal({
    catalogId, member, sellers, currentSellerUserId, onClose, onDone,
}: {
    catalogId: string;
    member: TeamMemberCard;
    sellers: TeamMemberCard[];
    currentSellerUserId: string | null;
    onClose: () => void;
    onDone: () => void;
}) {
    const [busy, setBusy] = useState<string | null>(null);

    const pick = async (seller: TeamMemberCard) => {
        setBusy(seller.userId);
        try {
            await apiService.catalog.team.assignCustomer(catalogId, member.id, seller.userId);
            toast.success('مسئولِ مشتری تغییر کرد (در تاریخچه ثبت شد)');
            onDone();
            onClose();
        } catch (e: any) {
            toast.error(e?.message || 'خطا در تغییر مسئول');
        } finally {
            setBusy(null);
        }
    };

    return (
        <Modal title={`تغییر مسئولِ مشتری: ${member.fullName || ''}`} onClose={onClose}>
            <div className="space-y-2">
                {sellers.length === 0 && (
                    <p className="text-xs text-on-surface-variant text-center py-4">هنوز عضوِ فروشنده‌ای در کاتالوگ نیست</p>
                )}
                {sellers.map((s) => {
                    const isCurrent = s.userId === currentSellerUserId;
                    return (
                        <button
                            key={s.userId}
                            onClick={() => !isCurrent && pick(s)}
                            disabled={isCurrent || busy === s.userId}
                            className={cn(
                                'w-full flex items-center gap-3 p-3 rounded-xl border text-right transition-all',
                                isCurrent
                                    ? 'border-primary/40 bg-primary/5 opacity-70 cursor-default'
                                    : 'border-outline-variant/30 hover:border-primary/40 hover:bg-primary/5 bg-surface-container-lowest',
                            )}
                        >
                            <Avatar url={s.avatarUrl} name={s.fullName} size={38} />
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold truncate">{s.fullName || '—'}</p>
                                <p className="text-[11px] text-on-surface-variant truncate">
                                    {s.sellerRole === 'visitor' ? 'ویزیتور' : 'فروشنده'}
                                    {s.sellerBusiness?.name || s.business?.name ? ` · ${s.sellerBusiness?.name || s.business?.name}` : ''}
                                </p>
                            </div>
                            {isCurrent ? (
                                <span className="text-[10px] font-bold text-primary">مسئول فعلی</span>
                            ) : busy === s.userId ? (
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : (
                                <ArrowLeftRight className="w-4 h-4 text-on-surface-variant" />
                            )}
                        </button>
                    );
                })}
            </div>
        </Modal>
    );
}

// ═══════════════════════════════════════════
// ردیف سادهٔ عضو — [آواتار] [نام + کسب‌وکار] [نقش بیزینسی] [نقش سیستمی]
// ═══════════════════════════════════════════
function MemberRow({
    m, catalogId, canManage, sellers, onChanged, pending, onApproveRole, onReject,
}: {
    m: TeamMemberCard;
    catalogId: string;
    canManage: boolean;
    sellers: TeamMemberCard[];
    onChanged: () => void;
    /** ردیف‌های در انتظار تایید — دکمه‌های تایید/رد جای منو */
    pending?: boolean;
    onApproveRole?: (role: 'seller' | 'visitor') => void;
    onReject?: () => void;
}) {
    const router = useRouter();
    const [menuOpen, setMenuOpen] = useState(false);
    const [approveOpen, setApproveOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [showReassign, setShowReassign] = useState(false);
    const [busy, setBusy] = useState(false);

    const act = async (fn: () => Promise<any>, okMsg: string) => {
        setBusy(true);
        try {
            await fn();
            toast.success(okMsg);
            setMenuOpen(false);
            setConfirmDelete(false);
            setApproveOpen(false);
            onChanged();
        } catch (e: any) {
            toast.error(e?.message || 'خطا در انجام عملیات');
        } finally {
            setBusy(false);
        }
    };

    const isOwnerMember = m.isOwner === true;
    const isAdminMember = m.isAdmin === true || (m.role === 'catalog_admin' && (m.sellerStatus === 'active' || m.customerStatus === 'active'));
    const isSellerMember = m.sellerStatus === 'active';
    const isCustomerMember = m.customerStatus === 'active';

    // نقش بیزینسی (ستون میانی)
    const bizBadge = m.__isMyCustomer
        ? { text: 'مشتری من', cls: 'bg-primary text-on-primary' }
        : isCustomerMember
            ? { text: 'مشتری', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300' }
            : isSellerMember
                ? (m.sellerRole === 'visitor'
                    ? { text: 'ویزیتور', cls: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' }
                    : { text: 'فروشنده', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' })
                : null;

    // نقش سیستمی (ستون آخر): مالک کاتالوگ ← مدیر کاتالوگ ← خودم
    const sysBadge = isOwnerMember
        ? { text: 'مالک کاتالوگ', cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' }
        : isAdminMember
            ? { text: 'مدیر کاتالوگ', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' }
            : m.__isMe
                ? { text: 'خودم', cls: 'border border-outline-variant/60 text-on-surface-variant bg-transparent' }
                : null;

    // صفحهٔ شخصی — تابلوی کسب‌وکار عضو
    const personalSlug = m.customerBusiness?.slug || m.sellerBusiness?.slug || m.business?.slug || null;

    const openPersonal = () => {
        if (personalSlug) router.push(`/${personalSlug}`);
    };

    const nameLine = (
        <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate">{m.fullName || '—'}</p>
            <p className="text-[11px] text-on-surface-variant truncate mt-0.5 flex items-center gap-2">
                {(m.customerBusiness?.name || m.sellerBusiness?.name || m.business?.name) && (
                    <span className="truncate">{m.customerBusiness?.name || m.sellerBusiness?.name || m.business?.name}</span>
                )}
                {m.sellerRegion && (
                    <span className="inline-flex items-center gap-0.5 text-on-surface-variant/70 flex-shrink-0">
                        <MapPin className="w-3 h-3" />{m.sellerRegion}
                    </span>
                )}
                {pending && <span className="text-amber-600 dark:text-amber-400 flex-shrink-0">در انتظار تایید مدیر (مالک کاتالوگ)</span>}
            </p>
        </div>
    );

    return (
        <div
            onClick={pending ? undefined : openPersonal}
            className={cn(
                'relative flex items-center gap-2.5 p-2.5 rounded-2xl border transition-all',
                m.__isMyCustomer
                    ? 'border-primary/30 bg-primary/5'
                    : 'border-outline-variant/25 bg-surface-container-lowest dark:bg-gray-900/40',
                pending && 'border-amber-300/50 bg-amber-50/50 dark:bg-amber-900/10',
                personalSlug && !pending && 'cursor-pointer hover:border-primary/40 hover:shadow-sm',
            )}
        >
            <Avatar url={m.avatarUrl} name={m.fullName} />
            {nameLine}

            {/* نقش بیزینسی — ستون میانی */}
            <span className={cn(badgeBase, 'w-16 flex-shrink-0', bizBadge?.cls || 'invisible')}>
                {bizBadge?.text || '—'}
            </span>
            {/* تایید/رد — فقط ردیف‌های در انتظار تایید */}
            {pending ? (
                <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    {onApproveRole ? (
                        <div className="relative">
                            <button
                                onClick={() => setApproveOpen((v) => !v)}
                                disabled={busy}
                                className="h-8 px-2.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-50"
                            >
                                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                تایید
                            </button>
                            {approveOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => setApproveOpen(false)} />
                                    <div className="absolute left-0 top-full mt-1 z-40 w-44 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-outline-variant/30 py-1.5 text-xs">
                                        <button
                                            onClick={() => onApproveRole?.('seller')}
                                            className="w-full px-3 py-2.5 hover:bg-surface-container-high dark:hover:bg-gray-800 text-right"
                                        >
                                            به‌عنوان <b>فروشنده</b>
                                        </button>
                                        <button
                                            onClick={() => onApproveRole?.('visitor')}
                                            className="w-full px-3 py-2.5 hover:bg-surface-container-high dark:hover:bg-gray-800 text-right"
                                        >
                                            به‌عنوان <b>ویزیتور</b>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => act(() => apiService.catalog.team.confirmCustomer(catalogId, m.id), 'مشتری تایید شد')}
                            disabled={busy}
                            className="h-8 px-2.5 rounded-xl bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 disabled:opacity-50"
                        >
                            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            تایید
                        </button>
                    )}
                    <button
                        onClick={() => (onReject ? onReject() : act(() => apiService.catalog.team.declineCustomer(catalogId, m.id), 'درخواست رد شد'))}
                        disabled={busy}
                        className="h-8 px-2.5 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-[11px] font-bold disabled:opacity-50"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>
            ) : (
                <>
                    {/* منوی مدیریت — قبل از ستون نقش سیستمی */}
                    {canManage && !isOwnerMember && (
                        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                                onClick={() => setMenuOpen((v) => !v)}
                                className="p-2 rounded-full hover:bg-surface-container-high dark:hover:bg-gray-800"
                            >
                                <MoreVertical className="w-4 h-4" />
                            </button>
                            {menuOpen && (
                                <>
                                    <div className="fixed inset-0 z-30" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }} />
                                    <div className="absolute left-0 top-full mt-1 z-40 w-52 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-outline-variant/30 py-1.5 text-xs">
                                        <span className={cn(badgeBase, 'mx-3 mb-1.5 inline-block', sysBadge?.cls || 'bg-gray-100 text-gray-500')}>
                                            {sysBadge?.text || 'عضو کاتالوگ'}
                                        </span>
                                        {isSellerMember && (
                                            <button
                                                onClick={() => act(
                                                    () => apiService.catalog.team.setSellerRole(catalogId, m.id, m.sellerRole === 'visitor' ? 'seller' : 'visitor'),
                                                    m.sellerRole === 'visitor' ? 'نقش بیزینسی به «فروشنده» تغییر کرد' : 'نقش بیزینسی به «ویزیتور» تغییر کرد',
                                                )}
                                                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-surface-container-high dark:hover:bg-gray-800 text-right"
                                            >
                                                <ArrowLeftRight className="w-3.5 h-3.5" />
                                                تبدیل به {m.sellerRole === 'visitor' ? 'فروشنده' : 'ویزیتور'}
                                            </button>
                                        )}
                                        {isCustomerMember && (
                                            <button
                                                onClick={() => { setMenuOpen(false); setShowReassign(true); }}
                                                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-surface-container-high dark:hover:bg-gray-800 text-right"
                                            >
                                                <ArrowLeftRight className="w-3.5 h-3.5" />تغییر مسئولِ مشتری
                                            </button>
                                        )}
                                        {!isAdminMember && (
                                            <button
                                                onClick={() => act(() => apiService.catalog.team.promoteToAdmin(catalogId, m.id), 'به مدیر ارتقا یافت')}
                                                disabled={busy}
                                                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-surface-container-high dark:hover:bg-gray-800 text-right"
                                            >
                                                <ShieldCheck className="w-3.5 h-3.5" />ارتقا به مدیر
                                            </button>
                                        )}
                                        {isAdminMember && (
                                            <button
                                                onClick={() => act(() => apiService.catalog.team.demoteToMember(catalogId, m.id), 'مدیریتی سلب شد')}
                                                disabled={busy}
                                                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-surface-container-high dark:hover:bg-gray-800 text-right"
                                            >
                                                <ShieldOff className="w-3.5 h-3.5" />سلب مدیریت
                                            </button>
                                        )}
                                        {!confirmDelete ? (
                                            <button
                                                onClick={() => setConfirmDelete(true)}
                                                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-right"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />حذف عضو
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => act(
                                                    () => isSellerMember
                                                        ? apiService.catalog.team.removeSeller(catalogId, m.id)
                                                        : apiService.catalog.team.removeCustomer(catalogId, m.id),
                                                    'عضو حذف شد',
                                                )}
                                                disabled={busy}
                                                className="w-full flex items-center gap-2 px-3 py-2.5 bg-red-600 text-white font-bold text-right disabled:opacity-50"
                                            >
                                                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                                مطمئنم، حذف کن
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* نقش سیستمی — ستون آخر */}
                    <span className={cn(badgeBase, 'w-24 flex-shrink-0', sysBadge?.cls || 'invisible')}>
                        {sysBadge?.text || '—'}
                    </span>
                </>
            )}

            {showReassign && (
                <ReassignModal
                    catalogId={catalogId}
                    member={m}
                    sellers={sellers.filter((s) => s.userId !== m.assignedSellerUserId && s.sellerStatus === 'active')}
                    currentSellerUserId={m.assignedSellerUserId}
                    onClose={() => setShowReassign(false)}
                    onDone={onChanged}
                />
            )}
        </div>
    );
}

// ═══════════════════════════════════════════
// برگه اعضا
// ═══════════════════════════════════════════
export default function CatalogMembersTab({ catalogId, onLoginNeeded }: { catalogId: string; onLoginNeeded: () => void }) {
    const queryClient = useQueryClient();
    const [showAddCustomer, setShowAddCustomer] = useState(false);

    const { data, isLoading, error, refetch } = useQuery<TeamResponse>({
        queryKey: ['catalog-team', catalogId],
        queryFn: () => apiService.catalog.team.getTeam(catalogId),
        enabled: !!catalogId,
        retry: false,
        staleTime: 30_000,
    });

    const refresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['catalog-team', catalogId] });
    }, [queryClient, catalogId]);

    const myRole = data?.myRole;
    const canManage = !!myRole?.canManage;

    const sellers = useMemo(() => data?.sellers || [], [data]);
    const staff = useMemo(() => data?.staff || [], [data]);
    const customers = useMemo(
        () => (data?.customers || []).map((c) => ({
            ...c,
            __isMyCustomer: !!myRole?.isSeller && c.assignedSellerUserId === myRole?.userId,
        })),
        [data, myRole],
    );
    const pendingSellers = useMemo(() => (canManage ? data?.pendingSellers || [] : []), [data, canManage]);
    const pendingCustomers = useMemo(
        () => customers.filter((c) => c.customerStatus === 'pending'),
        [customers],
    );
    const pendingCount = pendingSellers.length + (canManage ? pendingCustomers.length : 0);

    // فهرست ساده: کادر (مالک، مدیرها) → اعضای فروش (خودم اول) → مشتری‌ها (مشتری من اول)
    const ordered = useMemo(() => {
        const rank = (m: TeamMemberCard) => {
            if (m.isOwner) return 0;
            if (m.isAdmin) return 1;
            if (m.userId === myRole?.userId) return 2;
            if (m.sellerStatus === 'active') return 3;
            if (m.__isMyCustomer) return 4;
            return 5;
        };
        const activeCustomers = customers.filter((c) => c.customerStatus === 'active');
        return [...staff, ...sellers, ...activeCustomers]
            .map((m) => ({ ...m, __isMe: m.userId === myRole?.userId && !m.isOwner && !m.isAdmin }))
            .sort((a, b) => rank(a) - rank(b));
    }, [staff, sellers, customers, myRole]);

    // ─── حالت‌های خاص ───
    if (error) {
        const err = error as any;
        const status = err?.status || err?.response?.status;
        const code = err?.data?.errorCode || err?.response?.data?.errorCode || err?.errorCode;
        if (status === 401 || code === 'UNAUTHORIZED' || code === 'SESSION_EXPIRED') {
            return (
                <div className="text-center py-12">
                    <Users className="w-10 h-10 text-on-surface-variant/40 mx-auto mb-3" />
                    <p className="text-sm text-on-surface-variant mb-4">برای دیدن اعضا اول وارد شوید</p>
                    <button onClick={onLoginNeeded} className="h-10 px-6 rounded-xl bg-primary text-on-primary text-sm font-bold">
                        ورود
                    </button>
                </div>
            );
        }
        return (
            <div className="text-center py-12">
                <p className="text-sm text-on-surface-variant mb-3">خطا در دریافت اعضا</p>
                <button onClick={() => refetch()} className="text-sm font-bold text-primary">تلاش مجدد</button>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center py-16">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* سربرگ: شمارنده‌ها + دکمه افزودن مشتری */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                    <Users className="w-4 h-4" />
                    <span>
                        {ordered.length.toLocaleString('fa-IR')} عضو · {(data?.stats?.activeCustomers || 0).toLocaleString('fa-IR')} مشتری
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {(canManage || myRole?.isSeller) && (
                        <button
                            onClick={() => setShowAddCustomer(true)}
                            className="h-9 px-3 rounded-xl bg-primary text-on-primary text-xs font-bold flex items-center gap-1.5"
                        >
                            <UserPlus className="w-3.5 h-3.5" />افزودن مشتری
                        </button>
                    )}
                </div>
            </div>

            {myRole?.isOwner && data?.settings && !data.settings.multiSeller && (
                <p className="text-[11px] text-on-surface-variant bg-surface-container-low dark:bg-gray-900/40 rounded-xl px-3 py-2 leading-5">
                    چندفروشندگی برای این کاتالوگ غیرفعال است (تنظیم بازار یا اورایت اختصاصی) — فقط خودتان فروشنده هستید.
                </p>
            )}

            {/* بخش در انتظار تایید مدیر (مالک کاتالوگ) */}
            {canManage && pendingCount > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 px-1">
                        در انتظار تایید مدیر (مالک کاتالوگ) — {pendingCount.toLocaleString('fa-IR')} درخواست
                    </p>
                    {pendingSellers.map((m) => (
                        <MemberRow
                            key={m.id} m={m} catalogId={catalogId} pending
                            canManage={canManage} sellers={sellers} onChanged={refresh}
                            onApproveRole={(role) => apiService.catalog.team
                                .approveSeller(catalogId, m.id, role)
                                .then(refresh)
                                .catch((e: any) => toast.error(e?.message || 'خطا در تایید'))}
                            onReject={() => apiService.catalog.team
                                .rejectSeller(catalogId, m.id)
                                .then(refresh)
                                .catch((e: any) => toast.error(e?.message || 'خطا در رد'))}
                        />
                    ))}
                    {pendingCustomers.map((m) => (
                        <MemberRow
                            key={m.id} m={m} catalogId={catalogId} pending
                            canManage={canManage} sellers={sellers} onChanged={refresh}
                        />
                    ))}
                </div>
            )}

            {!canManage && !myRole?.isSeller && !myRole?.isPendingSeller && ordered.length === 0 && (
                <p className="text-center text-xs text-on-surface-variant py-8">هنوز عضوی در کاتالوگ نیست</p>
            )}

            {/* فهرست سادهٔ اعضا */}
            <div className="space-y-1.5">
                {ordered.map((m) => (
                    <MemberRow
                        key={m.id} m={m} catalogId={catalogId}
                        canManage={canManage} sellers={sellers} onChanged={refresh}
                    />
                ))}
            </div>

            {showAddCustomer && (
                <AddCustomerModal catalogId={catalogId} onClose={() => setShowAddCustomer(false)} onDone={refresh} />
            )}
        </div>
    );
}
