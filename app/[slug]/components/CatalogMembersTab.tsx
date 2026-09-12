// app/[slug]/components/CatalogMembersTab.tsx
'use client';

/**
 * برگه «اعضا»ی کاتالوگ — مثل اعضای کانال تلگرام:
 *   همه (مالک/مدیر/فروشنده/مشتری) در یک لیست، با برچسب نقش.
 *   • مالک/مدیر: بخش «در انتظار تایید» + منوی مدیریت روی هر کارت
 *   • فروشنده: مشتری‌هایش بالای لیست با برچسب «مشتری من»
 *   • تخصیصِ بقیه دیده نمی‌شود (ضد دزدی مشتری)
 *
 *   لایهٔ داده: موتور تیم کاتالوگ (GET /catalog/:id/team — مدل CatalogMember)
 */

import React, { useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Users, UserPlus, Store, MapPin, MoreVertical, ShieldCheck, ShieldOff,
    Trash2, UserCheck, X, Check, Loader2, Search, ArrowLeftRight, AlertCircle,
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
    business: { id: string; name: string; phone?: string } | null;
    role: 'catalog_owner' | 'catalog_admin' | 'catalog_member';
    position: string | null;
    sellerStatus: string | null;
    sellerRegion: string | null;
    sellerBusiness: { id: string; name: string } | null;
    customerStatus: string | null;
    customerBusiness: { id: string; name: string; city?: string | null } | null;
    assignedSellerUserId: string | null;
    // فروشندگان:
    isOwner?: boolean;
    isAdmin?: boolean;
    customersCount?: number;
    // مشتری‌ها:
    sellerName?: string | null;
    // تزریقی سمت UI:
    __isMyCustomer?: boolean;
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
const badgeBase = 'text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap';

function Avatar({ url, name, size = 44 }: { url?: string | null; name?: string | null; size?: number }) {
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
// مودال جابجایی مشتری به بازاریاب دیگر
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
            toast.success('مشتری جابجا شد (در تاریخچه ثبت شد)');
            onDone();
            onClose();
        } catch (e: any) {
            toast.error(e?.message || 'خطا در جابجایی');
        } finally {
            setBusy(null);
        }
    };

    return (
        <Modal title={`جابجایی مشتری: ${member.fullName || ''}`} onClose={onClose}>
            <div className="space-y-2">
                {sellers.length === 0 && (
                    <p className="text-xs text-on-surface-variant text-center py-4">هنوز بازاریابی در کاتالوگ نیست</p>
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
                                <p className="text-[11px] text-on-surface-variant truncate">{s.sellerBusiness?.name || s.business?.name || ''}</p>
                            </div>
                            {isCurrent ? (
                                <span className="text-[10px] font-bold text-primary">بازاریاب فعلی</span>
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
// کارت عضو
// ═══════════════════════════════════════════
function MemberCard({
    m, catalogId, canManage, sellers, onChanged,
}: {
    m: TeamMemberCard;
    catalogId: string;
    canManage: boolean;
    sellers: TeamMemberCard[];
    onChanged: () => void;
}) {
    const [menuOpen, setMenuOpen] = useState(false);
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
            onChanged();
        } catch (e: any) {
            toast.error(e?.message || 'خطا در انجام عملیات');
        } finally {
            setBusy(false);
        }
    };

    const isPending = m.sellerStatus === 'pending' || m.customerStatus === 'pending';
    const isOwnerMember = m.isOwner === true;
    const isAdminMember = m.isAdmin === true || (m.role === 'catalog_admin' && m.sellerStatus === 'active');
    const isSellerMember = m.sellerStatus === 'active';
    const isCustomerMember = m.customerStatus === 'active' || m.customerStatus === 'pending';

    return (
        <div className={cn(
            'relative flex items-center gap-3 p-3 rounded-2xl border transition-all',
            m.__isMyCustomer
                ? 'border-primary/30 bg-primary/5'
                : 'border-outline-variant/25 bg-surface-container-lowest dark:bg-gray-900/40',
            isPending && 'border-amber-300/50 bg-amber-50/50 dark:bg-amber-900/10',
        )}>
            <Avatar url={m.avatarUrl} name={m.fullName} />

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold truncate">{m.fullName || '—'}</p>
                    <div className="flex items-center gap-1 flex-wrap">
                        {isOwnerMember && <span className={cn(badgeBase, 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300')}>مالک</span>}
                        {isAdminMember && !isOwnerMember && <span className={cn(badgeBase, 'bg-primary/10 text-primary')}>مدیر</span>}
                        {isSellerMember && !m.__isMyCustomer && (
                            <span className={cn(badgeBase, 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300')}>فروشنده</span>
                        )}
                        {isCustomerMember && !m.__isMyCustomer && (
                            <span className={cn(badgeBase, 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300')}>مشتری</span>
                        )}
                        {m.__isMyCustomer && (
                            <span className={cn(badgeBase, 'bg-primary text-on-primary')}>مشتری من</span>
                        )}
                        {isPending && (
                            <span className={cn(badgeBase, 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300')}>در انتظار تایید</span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {(m.customerBusiness?.name || m.sellerBusiness?.name || m.business?.name) && (
                        <span className="text-[11px] text-on-surface-variant inline-flex items-center gap-1">
                            <Store className="w-3 h-3" />{m.customerBusiness?.name || m.sellerBusiness?.name || m.business?.name}
                        </span>
                    )}
                    {m.sellerRegion && (
                        <span className="text-[11px] text-on-surface-variant inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{m.sellerRegion}
                        </span>
                    )}
                </div>
            </div>

            {/* تایید/رد درخواست — فقط مدیرها */}
            {canManage && isPending && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    {m.sellerStatus === 'pending' ? (
                        <>
                            <button
                                onClick={() => act(() => apiService.catalog.team.approveSeller(catalogId, m.id), 'فروشنده تایید شد')}
                                disabled={busy}
                                className="h-9 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                            >
                                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                تایید
                            </button>
                            <button
                                onClick={() => act(() => apiService.catalog.team.rejectSeller(catalogId, m.id), 'درخواست رد شد')}
                                disabled={busy}
                                className="h-9 px-3 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                            >
                                <X className="w-3.5 h-3.5" />
                                رد
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={() => act(() => apiService.catalog.team.confirmCustomer(catalogId, m.id), 'مشتری تایید شد')}
                                disabled={busy}
                                className="h-9 px-3 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                            >
                                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                تایید
                            </button>
                            <button
                                onClick={() => act(() => apiService.catalog.team.declineCustomer(catalogId, m.id), 'درخواست رد شد')}
                                disabled={busy}
                                className="h-9 px-3 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                            >
                                <X className="w-3.5 h-3.5" />
                                رد
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* منوی مدیریت */}
            {canManage && !isPending && !isOwnerMember && (
                <div className="relative flex-shrink-0">
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        className="p-2 rounded-full hover:bg-surface-container-high dark:hover:bg-gray-800"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-30" onClick={() => { setMenuOpen(false); setConfirmDelete(false); }} />
                            <div className="absolute left-0 top-full mt-1 z-40 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-outline-variant/30 py-1.5 text-xs">
                                {isCustomerMember && (
                                    <button
                                        onClick={() => { setMenuOpen(false); setShowReassign(true); }}
                                        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-surface-container-high dark:hover:bg-gray-800 text-right"
                                    >
                                        <ArrowLeftRight className="w-3.5 h-3.5" />جابجایی به بازاریاب دیگر
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

    // ترتیب لیست اصلی: مشتری‌های من → مالک → مدیرها → بازاریاب‌ها → بقیه مشتری‌ها
    const ordered = useMemo(() => {
        const rank = (m: TeamMemberCard) => {
            if (m.__isMyCustomer) return 0;
            if (m.isOwner) return 1;
            if (m.isAdmin) return 2;
            if (m.sellerStatus === 'active') return 3;
            return 4;
        };
        const list: TeamMemberCard[] = [...sellers, ...customers];
        return list.filter((m) => m.sellerStatus === 'active' || m.customerStatus === 'active').sort((a, b) => rank(a) - rank(b));
    }, [sellers, customers, canManage]);

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
                        {data?.stats?.sellers || 0} فروشنده · {data?.stats?.activeCustomers || 0} مشتری
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

            {!canManage && !myRole?.isSeller && !myRole?.isPendingSeller && ordered.length === 0 && (
                <p className="text-center text-xs text-on-surface-variant py-8">هنوز عضوی در کاتالوگ نیست</p>
            )}

            {/* بخش در انتظار تایید — فقط مدیرها */}
            {canManage && pendingCount > 0 && (
                <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400 px-1">
                        در انتظار تایید ({pendingCount})
                    </p>
                    {[...pendingSellers, ...pendingCustomers].map((m) => (
                        <MemberCard
                            key={m.id} m={m} catalogId={catalogId}
                            canManage={canManage} sellers={sellers} onChanged={refresh}
                        />
                    ))}
                </div>
            )}

            {/* لیست اصلی اعضا */}
            <div className="space-y-1.5">
                {ordered.map((m) => (
                    <MemberCard
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
