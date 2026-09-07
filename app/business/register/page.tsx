// app/business/register/page.tsx
'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
    LibraryBig, Building2, Plus, Loader2, Check, ArrowRight, MapPin,
} from 'lucide-react';
import { useCreateCatalog, useMyBusinesses } from '@/lib/api/apiHooks';
import { RootState } from '@/lib/store/store';
import { clearStoredRef, readStoredRef } from '@/app/components/RefCapture';
import BusinessSetupModal from '@/app/components/BusinessSetupModal';
import SlugPicker from '@/app/business/register/SlugPicker';
import { cn } from '@/lib/utils';

export default function RegisterCatalogPage() {
    const router = useRouter();
    const { currentSlug: armSlug } = useSelector((state: RootState) => state.arm);

    const bizQ = useMyBusinesses(true);
    const myBizList: any[] = bizQ.data?.items ?? [];
    const hasBizList = !!bizQ.data;

    const [bizId, setBizId] = useState<string | undefined>(() =>
        new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        ).get('bizId') || undefined,
    );
    const [bizModalOpen, setBizModalOpen] = useState(false);
    const [bizModalAuto, setBizModalAuto] = useState(false);

    const [refCode] = useState<string | undefined>(() =>
        new URLSearchParams(
            typeof window !== 'undefined' ? window.location.search : '',
        ).get('ref') || readStoredRef() || undefined,
    );

    const [slug, setSlug] = useState('');
    const [salesType, setSalesType] = useState<'wholesale' | 'retail' | 'service'>('wholesale');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const createCatalogMutation = useCreateCatalog();

    // ─── منطق نهاد: خودکار برای اکثریت ───
    useEffect(() => {
        if (bizId || !hasBizList) return;
        if (myBizList.length === 1) {
            setBizId(myBizList[0].id);
        } else if (myBizList.length === 0) {
            setBizModalAuto(true);
        }
    }, [bizId, hasBizList, myBizList]);

    useEffect(() => {
        if (bizModalAuto) {
            setBizModalOpen(true);
            setBizModalAuto(false);
        }
    }, [bizModalAuto]);

    const selectedBiz = useMemo(
        () => myBizList.find((b) => b.id === bizId) ?? null,
        [myBizList, bizId],
    );

    const validate = () => {
        const e: Record<string, string> = {};
        if (!slug || slug.length < 3) e.slug = 'لینک کاتالوگ را وارد کن (حداقل ۳ حرف انگلیسی)';
        else if (errors.slug === 'taken' || errors.slug === 'reserved') e.slug = errors.slug;
        if (!bizId) e.biz = 'ابتدا کسب‌وکار را انتخاب یا ثبت کن';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;
        if (!selectedBiz) return;

        try {
            // ✅ نام کاتالوگ = نام کسب‌وکار
            // ✅ صنف و موقعیت از کسب‌وکار ارث می‌رسه
            const created = await createCatalogMutation.mutateAsync({
                name: selectedBiz.name,
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

            toast.success(`کاتالوگت ساخته شد! 🎉 آدرسش: daymat.ir/${created?.slug || slug}`);
            clearStoredRef();
            router.replace(`/my-catalogs?catalog=${created?.id ?? ''}`);
        } catch (error: any) {
            if (error?.data?.errorCode === 'SLUG_TAKEN') {
                setErrors((p) => ({ ...p, slug: 'taken' }));
                toast.error('این آدرس همین الان گرفته شد — یک کمی عوضش کن');
            } else if (error?.data?.errorCode === 'SLUG_RESERVED') {
                setErrors((p) => ({ ...p, slug: 'reserved' }));
            } else {
                toast.error(error?.message || 'خطا در ساخت کاتالوگ');
            }
        }
    };

    const busy = createCatalogMutation.isPending;
    const bizLocked = !bizId;

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

            <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-6 pb-[100px]">
                {/* ═══ انتخابگر نهاد ═══ */}
                {hasBizList && myBizList.length > 0 && (
                    <BizCombo
                        items={myBizList}
                        selectedId={bizId}
                        onPick={(id: string) => { setBizId(id); setErrors((p) => ({ ...p, biz: '' })); }}
                        onNew={() => setBizModalOpen(true)}
                    />
                )}
                {hasBizList && myBizList.length === 0 && (
                    <button type="button" onClick={() => setBizModalOpen(true)}
                            className="mb-4 w-full rounded-xl border border-dashed border-primary/40 bg-primary/5
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

                {/* ═══ پیش‌نمایش کسب‌وکار ═══ */}
                {selectedBiz && (
                    <div className="mb-5 rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-on-surface truncate">{selectedBiz.name}</p>
                            <div className="flex items-center gap-2 text-[10px] text-on-surface-variant/70 mt-0.5">
                                {selectedBiz.industryName && <span>{selectedBiz.industryName}</span>}
                                {selectedBiz.city && (
                                    <span className="flex items-center gap-0.5">
                                        <MapPin className="w-3 h-3" />{selectedBiz.city}
                                    </span>
                                )}
                            </div>
                        </div>
                        <button onClick={() => setBizModalOpen(true)} className="text-[10px] text-primary font-bold">
                            ویرایش
                        </button>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* ۱) لینک کاتالوگ */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-on-surface block">
                            لینک کاتالوگ <span className="text-primary">*</span>
                        </label>
                        <SlugPicker
                            value={slug}
                            onChange={(s: string) => { setSlug(s); setErrors((p) => ({ ...p, slug: '' })); }}
                            onStatus={(status: string | null) => {
                                setErrors((p) => ({ ...p, slug: status ?? undefined }));
                            }}
                            disabled={busy}
                        />
                    </div>

                    {/* ۲) نوع فروش */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-on-surface block">
                            نوع فروش <span className="text-primary">*</span>
                        </label>
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
                                                : 'border-outline-variant/40 hover:border-primary/30',
                                        )}>
                                    <span className="block text-xl mb-1">{o.icon}</span>
                                    <span className={cn('block text-xs font-bold',
                                        salesType === o.v ? 'text-primary' : 'text-on-surface')}>
                                        {o.t}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* دکمه نهایی */}
                    <button type="submit"
                            disabled={busy || bizLocked || !slug || !!errors.slug}
                            className={cn(
                                'w-full h-12 rounded-xl text-sm font-extrabold flex items-center justify-center gap-2 transition-all',
                                busy || bizLocked || !slug || !!errors.slug
                                    ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed'
                                    : 'bg-primary text-on-primary shadow-lg shadow-primary/25 active:scale-[0.99]',
                            )}>
                        {busy ? <Loader2 className="w-5 h-5 animate-spin" />
                            : bizLocked ? <><Building2 className="w-4 h-4" /> اول کسب‌وکار را ثبت کن</>
                            : <><LibraryBig className="w-4.5 h-4.5" /> ساخت کاتالوگ رایگان</>}
                    </button>
                </form>
            </main>

            {/* ═══ مودال ساخت نهاد ═══ */}
            <BusinessSetupModal
                isOpen={bizModalOpen}
                business={selectedBiz}
                onClose={() => setBizModalOpen(false)}
                onSaved={(biz: any) => {
                    if (!bizId && biz?.id) setBizId(biz.id);
                    bizQ.refetch();
                }}
            />
        </div>
    );
}

/* ─── کمبوی ظریف نهاد ─── */
function BizCombo({ items, selectedId, onPick, onNew }: {
    items: any[]; selectedId?: string; onPick: (id: string) => void; onNew: () => void;
}) {
    const [open, setOpen] = useState(false);
    const selected = items.find((b) => b.id === selectedId);
    return (
        <div className="relative mb-5">
            <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setOpen((o) => !o)}
                        className={cn(
                            'flex-1 h-11 px-3.5 rounded-xl bg-surface-container-lowest border flex items-center gap-2.5',
                            'border-outline-variant/40 dark:border-gray-700 focus:ring-2 focus:ring-primary/20',
                            'focus:border-primary outline-none transition-all text-right',
                            open && 'ring-2 ring-primary/20 border-primary',
                        )}>
                    <Building2 className="w-4 h-4 text-primary/70 flex-shrink-0" />
                    <span className={cn('flex-1 text-sm truncate', selected ? 'text-on-surface font-medium' : 'text-on-surface-variant/50')}>
                        {selected ? selected.name : 'کسب‌وکار…'}
                    </span>
                </button>
                <button type="button" onClick={onNew} title="کسب‌وکار جدید"
                        className="w-11 h-11 rounded-xl border border-outline-variant/40 grid place-items-center
                            text-on-surface-variant/60 hover:text-primary hover:border-primary/40
                            hover:bg-primary/5 transition-colors flex-shrink-0">
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute top-full mt-1 inset-x-0 z-50 p-1.5 rounded-2xl bg-white dark:bg-gray-900
                        border border-outline-variant/30 shadow-xl animate-in fade-in zoom-in-95 duration-150 max-h-56 overflow-y-auto">
                        {items.map((b) => (
                            <button key={b.id} type="button"
                                    onClick={() => { onPick(b.id); setOpen(false); }}
                                    className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded transition-colors text-right',
                                        b.id === selectedId ? 'bg-primary/5' : 'hover:bg-surface-container-high')}>
                                <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
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
