// app/my-catalogs/components/ConnectionRequestModal.tsx
// 🤝 «درخواست ارتباط» — جستجو میان کسب‌وکارها، کاتالوگ‌ها و افراد
//   از پنل مدیریت کاتالوگ باز می‌شود؛ نوع درخواست بسته به تب و مقصد:
//     کسب‌وکارها → «درخواست خرید» (مشتری ثبت می‌شود؛ تایید با صاحب کسب‌وکار)
//     کاتالوگ‌ها → «درخواست تامین‌کنندگی» یا اگر کاتالوگ مقصد خدماتی باشد «درخواست تامین خدمات»
//     افراد     → «دعوت به همکاری در فروش» (پذیرش با خودِ دعوت‌شده)
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    X, Loader2, Search, Store, BookOpen, User, ExternalLink,
    ShoppingBasket, Truck, Wrench, Handshake,
} from 'lucide-react';

interface Props {
    open: boolean;
    onClose: () => void;
    catalogId: string;
    canAssign: boolean; // مالک/مدیر — می‌تواند مسئول فروش را هم انتخاب کند
    sellers: any[]; // اعضای فروش فعال (برای انتساب خریدار)
}

type Scope = 'businesses' | 'catalogs' | 'people';

const SCOPES: { key: Scope; label: string; icon: React.ElementType; hint: string }[] = [
    { key: 'businesses', label: 'کسب‌وکارها', icon: Store, hint: 'کسب‌وکارها را به‌عنوان خریدار ثبت کن تا تماس‌شان به شما برسد' },
    { key: 'catalogs', label: 'کاتالوگ‌ها', icon: BookOpen, hint: 'درخواست تامین‌کنندگی یا تامین خدمات بفرست' },
    { key: 'people', label: 'افراد', icon: User, hint: 'فروشندگان و بازاریابان دیمت را به فروش کاتالوگ دعوت کن' },
];

export default function ConnectionRequestModal({ open, onClose, catalogId, canAssign, sellers }: Props) {
    const [scope, setScope] = useState<Scope>('businesses');
    const [q, setQ] = useState('');
    const [debounced, setDebounced] = useState('');
    const [searching, setSearching] = useState(false);
    const [results, setResults] = useState<any[]>([]);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [assignTo, setAssignTo] = useState('');
    const [sentIds, setSentIds] = useState<Set<string>>(new Set());
    const [inviteRole, setInviteRole] = useState<'seller' | 'visitor'>('seller');

    // دیبانس جستجو
    useEffect(() => {
        const t = window.setTimeout(() => setDebounced(q.trim()), 400);
        return () => window.clearTimeout(t);
    }, [q]);

    useEffect(() => {
        if (!open) return;
        setQ(''); setDebounced(''); setResults([]); setSentIds(new Set()); setAssignTo(''); setScope('businesses');
    }, [open]);

    // جستجو بر اساس تب
    useEffect(() => {
        if (!open || debounced.length < 2) { setResults([]); return; }
        let alive = true;
        (async () => {
            setSearching(true);
            try {
                let items: any[] = [];
                if (scope === 'businesses') {
                    const res = await apiService.catalog.team.customerCandidates(catalogId, debounced);
                    items = res?.items || [];
                } else if (scope === 'catalogs') {
                    const res = await apiService.catalog.team.partnerCatalogs(catalogId, debounced);
                    items = res?.items || [];
                } else {
                    const res = await apiService.business.searchUsers(debounced);
                    items = (res?.items || []).filter((u: any) => u.id);
                }
                if (alive) setResults(items);
            } catch {
                if (alive) setResults([]);
            } finally {
                if (alive) setSearching(false);
            }
        })();
        return () => { alive = false; };
    }, [debounced, scope, open, catalogId]);

    if (!open) return null;

    const markSent = (id: string) => setSentIds((s) => new Set(s).add(id));

    const sendBuyerRequest = async (b: any) => {
        setBusyId(b.id);
        try {
            const res = await apiService.catalog.team.addCustomer(catalogId, {
                businessId: b.id,
                ...(assignTo ? { sellerUserId: assignTo } : {}),
            });
            toast.success(res?.message || 'درخواست خرید ارسال شد — در انتظار تایید صاحب کسب‌وکار');
            markSent(`biz-${b.id}`);
        } catch (e: any) {
            toast.error(e?.data?.message || e?.message || 'خطا در ارسال درخواست');
        } finally {
            setBusyId(null);
        }
    };

    const sendSupplierOrService = async (c: any) => {
        setBusyId(c.id);
        try {
            const isService = c.salesType === 'service';
            const res = isService
                ? await apiService.catalog.team.inviteService(catalogId, c.id)
                : await apiService.catalog.team.inviteSupplier(catalogId, c.id);
            toast.success(res?.message || (isService
                ? 'درخواست تامین خدمات ارسال شد — در انتظار تایید صاحب کاتالوگ'
                : 'درخواست تامین‌کنندگی ارسال شد — در انتظار تایید صاحب کاتالوگ'));
            markSent(`cat-${c.id}`);
        } catch (e: any) {
            toast.error(e?.data?.message || e?.message || 'خطا در ارسال درخواست');
        } finally {
            setBusyId(null);
        }
    };

    const sendSellerInvite = async (u: any) => {
        setBusyId(u.id);
        try {
            const res = await apiService.catalog.team.inviteSeller(catalogId, u.id, inviteRole);
            toast.success(res?.message || 'دعوت همکاری در فروش ارسال شد');
            markSent(`usr-${u.id}`);
        } catch (e: any) {
            toast.error(e?.data?.message || e?.message || 'خطا در ارسال دعوت');
        } finally {
            setBusyId(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl p-5 max-h-[88vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* سربرگ */}
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">درخواست ارتباط تجاری</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            جستجو میان کسب‌وکارها، کاتالوگ‌ها و افراد — و ارسال درخواستِ مناسب
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* فیلتر دیواری — سه مسیر */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {SCOPES.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => { setScope(key); setResults([]); }}
                            className={cn(
                                'flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-bold transition-all',
                                scope === key
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-outline-variant/40 dark:border-gray-700 text-gray-500 hover:border-primary/40',
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            {label}
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-gray-400 mb-3 leading-5">
                    {SCOPES.find((s) => s.key === scope)?.hint}
                </p>

                {/* انتساب مسئول فروش — فقط مالک/مدیر با بیش از یک فروشنده */}
                {scope === 'businesses' && canAssign && sellers.length > 1 && (
                    <div className="mb-3">
                        <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">مسئول فروش این خریدار</label>
                        <select
                            value={assignTo}
                            onChange={(e) => setAssignTo(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-outline-variant/40 text-sm"
                        >
                            <option value="">— خودم (پیش‌فرض) —</option>
                            {sellers.filter((s) => !s.isOwner).map((s) => (
                                <option key={s.id} value={s.userId}>{s.fullName || s.business?.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* نقش دعوت — تب افراد */}
                {scope === 'people' && (
                    <div className="flex gap-2 mb-3">
                        {([['seller', 'فروشنده'], ['visitor', 'بازاریاب (ویزیتور)']] as const).map(([val, label]) => (
                            <button
                                key={val}
                                onClick={() => setInviteRole(val)}
                                className={cn(
                                    'flex-1 py-2 rounded-xl border text-xs font-bold transition-all',
                                    inviteRole === val
                                        ? 'border-primary bg-primary/5 text-primary'
                                        : 'border-outline-variant/40 dark:border-gray-700 text-gray-500',
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                )}

                {/* جستجو */}
                <div className="relative mb-3">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder={
                            scope === 'businesses' ? 'نام کسب‌وکار یا شمارهٔ تماس…'
                            : scope === 'catalogs' ? 'نام کاتالوگ یا کسب‌وکار…'
                            : 'نام یا شمارهٔ موبایل…'
                        }
                        className="w-full pr-9 pl-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-outline-variant/40 text-sm"
                    />
                    {searching && <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
                </div>

                {/* نتایج */}
                <div className="space-y-2">
                    {results.map((item: any) => {
                        const isBiz = scope === 'businesses';
                        const isCat = scope === 'catalogs';
                        const isServiceCat = isCat && item.salesType === 'service';
                        const key = isBiz ? `biz-${item.id}` : isCat ? `cat-${item.id}` : `usr-${item.id}`;
                        const sent = sentIds.has(key);
                        return (
                            <div key={key} className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/30 dark:border-gray-800">
                                <span className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 grid place-items-center flex-shrink-0 text-gray-400">
                                    {isBiz ? <Store className="w-4 h-4" /> : isCat ? <BookOpen className="w-4 h-4" /> : <User className="w-4 h-4" />}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm text-gray-900 dark:text-gray-100 truncate flex items-center gap-1.5">
                                        {isBiz || isCat ? item.name : (item.fullName || 'کاربر دیمت')}
                                        {isCat && item.slug && (
                                            <Link href={`/${item.slug}`} target="_blank" title="مشاهدهٔ کاتالوگ"
                                                  className="text-primary/70 hover:text-primary flex-shrink-0">
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </Link>
                                        )}
                                    </p>
                                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                        {isBiz && (item.owner?.fullName ? `صاحب: ${item.owner.fullName}` : '')}
                                        {isBiz && (item.city || item.owner?.phone) ? ` · ${item.city || item.owner?.phone}` : ''}
                                        {isCat && (item.business?.name ? `${item.business.name}` : '')}
                                        {isCat && (item.salesType ? ` · ${item.salesType === 'service' ? 'خدماتی' : item.salesType === 'retail' ? 'خرده‌فروشی' : 'عمده‌فروشی'}` : '')}
                                        {!isBiz && !isCat && item.phone ? <span dir="ltr">{item.phone}</span> : null}
                                    </p>
                                </div>
                                {busyId === item.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin text-gray-400 flex-shrink-0" />
                                ) : sent ? (
                                    <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">ارسال شد ✓</span>
                                ) : (
                                    <button
                                        onClick={() => (isBiz ? sendBuyerRequest(item) : isCat ? sendSupplierOrService(item) : sendSellerInvite(item))}
                                        className="px-3 py-2 rounded-xl bg-primary text-white text-xs font-bold flex-shrink-0 flex items-center gap-1.5 hover:opacity-90 active:scale-95 transition"
                                    >
                                        {isBiz && <><ShoppingBasket className="w-3.5 h-3.5" /> درخواست خرید</>}
                                        {isCat && !isServiceCat && <><Truck className="w-3.5 h-3.5" /> درخواست تامین‌کنندگی</>}
                                        {isCat && isServiceCat && <><Wrench className="w-3.5 h-3.5" /> درخواست تامین خدمات</>}
                                        {!isBiz && !isCat && <><Handshake className="w-3.5 h-3.5" /> دعوت</>}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {debounced.length >= 2 && !searching && results.length === 0 && (
                        <p className="text-center text-sm text-gray-400 py-4">چیزی پیدا نشد</p>
                    )}
                    {debounced.length < 2 && (
                        <p className="text-center text-xs text-gray-400 py-4">برای جستجو حداقل ۲ حرف بنویسید</p>
                    )}
                </div>
            </div>
        </div>
    );
}
