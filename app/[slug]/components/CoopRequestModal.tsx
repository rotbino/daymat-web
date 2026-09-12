// app/[slug]/components/CoopRequestModal.tsx
// مودال «درخواست همکاری» با کاتالوگ — یک در برای هر سه نقش بیزینسی:
//   خریدار (انتخاب کسب‌وکار) | تامین‌کننده (انتخاب کاتالوگِ خود) | همکار فروش (فروشنده/ویزیتور)
// الگوی تعاملی: همان «پیوستن به بازار» — انتخاب نوع → گام شرطی → ارسال → در انتظار تایید مدیر
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    X, Loader2, Handshake, ShoppingBasket, Truck, ChevronLeft,
    Store, BookOpen, Check, Plus,
} from 'lucide-react';

type CoopType = 'buyer' | 'supplier' | 'seller';

interface CoopRequestModalProps {
    open: boolean;
    onClose: () => void;
    catalogId: string;
    catalogName: string;
    onSuccess?: () => void;
}

const TYPE_CARDS: { type: CoopType; icon: React.ElementType; title: string; desc: string }[] = [
    { type: 'buyer', icon: ShoppingBasket, title: 'خریدار', desc: 'از این کاتالوگ خرید می‌کنم — با تایید، تماسم به مسئول فروشم می‌رسد' },
    { type: 'supplier', icon: Truck, title: 'تامین‌کننده', desc: 'کالاهایم را به این کاتالوگ می‌دهم — با کاتالوگِ خودم عضو می‌شوم' },
    { type: 'seller', icon: Handshake, title: 'همکاری در فروش', desc: 'در فروش این کاتالوگ شریک می‌شوم — فروشنده یا ویزیتور' },
];

export default function CoopRequestModal({ open, onClose, catalogId, catalogName, onSuccess }: CoopRequestModalProps) {
    const [step, setStep] = useState<'type' | 'detail'>('type');
    const [type, setType] = useState<CoopType | null>(null);
    const [businessId, setBusinessId] = useState('');
    const [supplierCatalogId, setSupplierCatalogId] = useState('');
    const [sellerRole, setSellerRole] = useState<'seller' | 'visitor'>('seller');
    const [submitting, setSubmitting] = useState(false);

    const { data: myBusinesses = [] } = useQuery({
        queryKey: ['businesses-entity'],
        queryFn: () => apiService.business.getMy(),
        enabled: open,
        staleTime: 60_000,
    });
    const { data: myCatalogsRaw } = useQuery({
        queryKey: ['my-catalogs-list'],
        queryFn: () => apiService.catalog.getAll(),
        enabled: open,
        staleTime: 60_000,
    });
    const myCatalogs = useMemo(() => {
        const raw = myCatalogsRaw as any;
        const list = Array.isArray(raw) ? raw : raw?.catalogs || raw?.items || [];
        return (list as any[]).filter((c) => c?.id && c.id !== catalogId);
    }, [myCatalogsRaw, catalogId]);

    if (!open) return null;

    const reset = () => {
        setStep('type');
        setType(null);
        setBusinessId('');
        setSupplierCatalogId('');
        setSellerRole('seller');
    };

    const close = () => {
        onClose();
        setTimeout(reset, 200);
    };

    const submit = async () => {
        if (!type) return;
        if (type === 'buyer' && !businessId) { toast.error('ابتدا کسب‌وکارت را انتخاب کن'); return; }
        if (type === 'supplier' && !supplierCatalogId) { toast.error('ابتدا کاتالوگت را انتخاب کن'); return; }
        setSubmitting(true);
        try {
            const res = await apiService.catalog.team.joinCoop(catalogId, {
                type,
                sellerRole: type === 'seller' ? sellerRole : undefined,
                businessId: type !== 'supplier' ? businessId || undefined : undefined,
                supplierCatalogId: type === 'supplier' ? supplierCatalogId : undefined,
            });
            toast.success(res?.message || 'درخواست همکاری ثبت شد — در انتظار تایید مدیر (مالک کاتالوگ)');
            onSuccess?.();
            close();
        } catch (error: any) {
            toast.error(error?.data?.message || error?.message || 'خطا در ثبت درخواست');
        } finally {
            setSubmitting(false);
        }
    };

    const businesses = Array.isArray(myBusinesses) ? myBusinesses : (myBusinesses as any)?.items || [];
    const canSubmit = type === 'buyer' ? !!businessId : type === 'supplier' ? !!supplierCatalogId : true;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={close}>
            <div
                className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl p-5 max-h-[88vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* سربرگ */}
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">درخواست همکاری</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                            همکاری تجاری با کاتالوگ «{catalogName}» — پس از تایید مدیر (مالک کاتالوگ) فعال می‌شود
                        </p>
                    </div>
                    <button onClick={close} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* گام ۱ — انتخاب نوع همکاری */}
                {step === 'type' && (
                    <div className="space-y-2.5">
                        {TYPE_CARDS.map(({ type: t, icon: Icon, title, desc }) => (
                            <button
                                key={t}
                                onClick={() => { setType(t); setStep('detail'); }}
                                className={cn(
                                    'w-full text-right flex items-start gap-3 p-4 rounded-xl border transition-all active:scale-[0.99]',
                                    'border-outline-variant/30 dark:border-gray-800 hover:border-primary/50 hover:bg-primary/5',
                                )}
                            >
                                <span className="w-10 h-10 rounded-xl bg-primary/10 text-primary grid place-items-center flex-shrink-0">
                                    <Icon className="w-5 h-5" />
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="block text-sm font-bold text-gray-900 dark:text-gray-100">{title}</span>
                                    <span className="block text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-5">{desc}</span>
                                </span>
                                <ChevronLeft className="w-4 h-4 text-gray-300 mt-3 flex-shrink-0" />
                            </button>
                        ))}
                    </div>
                )}

                {/* گام ۲ — جزئیات هر نوع */}
                {step === 'detail' && type && (
                    <div className="space-y-3">
                        {/* خریدار — انتخاب کسب‌وکار */}
                        {type === 'buyer' && (
                            <>
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                                    <Store className="w-4 h-4 text-primary" />
                                    کدام کسب‌وکار از این کاتالوگ خرید می‌کند؟
                                </div>
                                {businesses.length === 0 && (
                                    <p className="text-[11px] text-gray-400">هنوز کسب‌وکاری نداری.</p>
                                )}
                                <div className="space-y-2">
                                    {businesses.map((b: any) => (
                                        <button
                                            key={b.id}
                                            onClick={() => setBusinessId(b.id)}
                                            className={cn(
                                                'w-full text-right flex items-center gap-3 p-3 rounded-xl border transition-all',
                                                businessId === b.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-outline-variant/30 dark:border-gray-800 hover:border-primary/40',
                                            )}
                                        >
                                            <span className={cn(
                                                'w-5 h-5 rounded-full border-2 grid place-items-center flex-shrink-0',
                                                businessId === b.id ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600',
                                            )}>
                                                {businessId === b.id && <Check className="w-3 h-3 text-white" />}
                                            </span>
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-sm font-bold truncate">{b.name}</span>
                                                {b.city && <span className="block text-[10px] text-gray-400">{b.city}</span>}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <Link
                                    href="/business/register"
                                    className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-dashed border-outline-variant/40 text-xs font-bold text-primary hover:bg-primary/5"
                                >
                                    <Plus className="w-4 h-4" />
                                    کسب‌وکار نداری؟ بسازش
                                </Link>
                            </>
                        )}

                        {/* تامین‌کننده — انتخاب کاتالوگ خود */}
                        {type === 'supplier' && (
                            <>
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                                    <BookOpen className="w-4 h-4 text-primary" />
                                    با کدام کاتالوگ خودت تامین می‌کنی؟
                                </div>
                                {myCatalogs.length === 0 && (
                                    <p className="text-[11px] text-gray-400">هنوز کاتالوگی نداری.</p>
                                )}
                                <div className="space-y-2">
                                    {myCatalogs.map((c: any) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setSupplierCatalogId(c.id)}
                                            className={cn(
                                                'w-full text-right flex items-center gap-3 p-3 rounded-xl border transition-all',
                                                supplierCatalogId === c.id
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-outline-variant/30 dark:border-gray-800 hover:border-primary/40',
                                            )}
                                        >
                                            <span className={cn(
                                                'w-5 h-5 rounded-full border-2 grid place-items-center flex-shrink-0',
                                                supplierCatalogId === c.id ? 'border-primary bg-primary' : 'border-gray-300 dark:border-gray-600',
                                            )}>
                                                {supplierCatalogId === c.id && <Check className="w-3 h-3 text-white" />}
                                            </span>
                                            <span className="flex-1 min-w-0">
                                                <span className="block text-sm font-bold truncate">{c.name}</span>
                                                {c.city && <span className="block text-[10px] text-gray-400">{c.city}</span>}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                                <Link
                                    href="/business/register"
                                    className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-dashed border-outline-variant/40 text-xs font-bold text-primary hover:bg-primary/5"
                                >
                                    <Plus className="w-4 h-4" />
                                    کاتالوگ نداری؟ بسازش
                                </Link>
                            </>
                        )}

                        {/* همکار فروش — انتخاب برچسب */}
                        {type === 'seller' && (
                            <>
                                <div className="flex items-center gap-2 text-xs font-bold text-gray-700 dark:text-gray-300">
                                    <Handshake className="w-4 h-4 text-primary" />
                                    عنوان همکاری‌ات در فروش چیست؟
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {([['seller', 'فروشنده'], ['visitor', 'ویزیتور']] as const).map(([val, label]) => (
                                        <button
                                            key={val}
                                            onClick={() => setSellerRole(val)}
                                            className={cn(
                                                'py-3 rounded-xl border text-sm font-bold transition-all',
                                                sellerRole === val
                                                    ? 'border-primary bg-primary/5 text-primary'
                                                    : 'border-outline-variant/30 dark:border-gray-800 hover:border-primary/40',
                                            )}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[11px] text-gray-400 leading-5">
                                    هر دو یک نقش‌اند — فقط عنوان ترجیحی توست. تصمیم نهایی با مدیرِ تاییدکننده است.
                                </p>
                            </>
                        )}

                        {/* دکمه‌ها */}
                        <div className="flex items-center gap-2 pt-1">
                            <button
                                onClick={() => setStep('type')}
                                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                            >
                                بازگشت
                            </button>
                            <button
                                onClick={submit}
                                disabled={!canSubmit || submitting}
                                className="flex-1 h-11 rounded-xl bg-primary text-on-primary font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                ارسال درخواست همکاری
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
