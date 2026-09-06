// app/business/register/page.tsx
'use client';

import React, {useEffect, useMemo, useState} from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
    Send, LibraryBig, Building2, Plus, Loader2, Check,
} from 'lucide-react';
import { FormHeader } from '@/app_/components/FormHeader';
import { useCreateCatalog, useMyBusinesses,  } from '@/lib/api/apiHooks';
import { IranLocationSelector } from '@/app/components/IranLocationSelector';
import { RootState } from '@/lib/store/store';
import { suggestSlug } from '@/lib/utils/slug';
import { cn } from '@/lib/utils/utils';
import { clearStoredRef, readStoredRef } from '@/app/components/RefCapture';
import BusinessSetupModal from '@/app/components/BusinessSetupModal';
import SlugPicker from "@/app/business/register/SlugPicker";


export default function RegisterCatalogPage() {
    const router = useRouter();
    const { currentSlug: armSlug } = useSelector((state: RootState) => state.arm);

    // ─── نهاد تجاری ───
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

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        industryName: '',
        shortDescription: '',
        provinceCode: '',
        provinceLabel: '',
        cityCode: '',
        cityLabel: '',
    });
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

    const handleNameChange = (name: string) => {
        setFormData((p) => ({ ...p, name }));
        setErrors((p) => ({ ...p, name: '' }));
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!formData.name.trim()) e.name = 'نام کاتالوگ الزامی است';
        if (!formData.slug || formData.slug.length < 3) e.slug = 'لینک کاتالوگ را وارد کن (حداقل ۳ حرف انگلیسی)';
        else if (errors.slug === 'taken' || errors.slug === 'reserved') e.slug = errors.slug;
        if (!bizId) e.biz = 'ابتدا کسب‌وکار را انتخاب یا ثبت کن';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (!validate()) return;

        const autoSlug = false; // ✅ اسلاگ اجباری شد — کاربر باید ببیند چه آدرسی می‌گیرد
        let slug = formData.slug;

        const doCreate = (s: string) => createCatalogMutation.mutateAsync({
            name: formData.name.trim(),
            slug: s,
            businessId: bizId,
            shortDescription: formData.shortDescription?.trim() || undefined,
            type: 'wholesaler',
            salesType,
            refCode,
            province: formData.provinceLabel || undefined,
            city: formData.cityLabel || undefined,
            provinceCode: formData.provinceCode || undefined,
            cityCode: formData.cityCode || undefined,
            phone: '',
            description: '',
            position: 'مالک و مسوول فروش',
            industryName: formData.industryName.trim() || undefined,
            armSlug,
        });

        try {
            const created = await doCreate(slug);
            const finalSlug = created?.slug || slug;

            toast.success(`کاتالوگت ساخته شد! 🎉 آدرسش: daymat.ir/${finalSlug}`);

            clearStoredRef();
            router.replace(`/my-catalogs?catalog=${created?.id ?? ''}`);
        } catch (error: any) {
            if (error?.data?.errorCode === 'SLUG_TAKEN') {
                setErrors((p) => ({ ...p, slug: 'taken' }));
                toast.error('این آدرس همین الان گرفته شد — یک کمی عوضش کن');
            } else if (error?.data?.errorCode === 'SLUG_RESERVED') {
                setErrors((p) => ({ ...p, slug: 'reserved' }));
                toast.error('این آدرس قابل انتخاب نیست');
            } else if (error?.data?.errorCode === 'INVALID_SLUG') {
                toast.error(error?.data?.message || 'لینک کاتالوگ معتبر نیست');
            } else if (error?.data?.errorCode === 'BUSINESS_REQUIRED') {
                toast.error('ابتدا کسب‌وکار را انتخاب کن');
            } else {
                toast.error(error?.message || 'خطا در ساخت کاتالوگ');
            }
        }
    };

    const busy = createCatalogMutation.isPending;
    const bizLocked = !bizId;
    // ✅ در ساختِ کاتالوگِ جدید هنوز کالا و عضویتی وجود ندارد → همیشه آزاد
    //    (قفل فقط در صفحهٔ ویرایش معنا دارد: کاتالوگِ دارای کالا یا عضوِ بازاری)
    const salesTypeLocked = false;
    const inputCls = (err?: string) => cn(
        'w-full h-11 px-3.5 text-sm text-right rounded bg-surface-container-lowest border',
        'focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
        err ? 'border-error' : 'border-outline-variant/40 dark:border-gray-700',
    );

    return (
        <div className="min-h-screen flex flex-col bg-surface dark:bg-gray-950">
            <FormHeader title="ساخت کاتالوگ رایگان" subtitle="چند دقیقه بیشتر وقت نمی‌گیرد" backUrl="/" />
            <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-20 pb-[100px]">
                <div className="lg:bg-white lg:dark:bg-gray-900 lg:rounded-2xl lg:border lg:border-outline-variant/20 lg:dark:border-gray-800 lg:shadow-sm lg:p-6">

                    {/* ═══ انتخابگر نهاد — ظریف ═══ */}
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
                                className="mb-4 w-full rounded border border-dashed border-primary/40 bg-primary/5
                                    p-3 flex items-center gap-2.5 text-right hover:bg-primary/10 transition-colors">
                            <Building2 className="w-4.5 h-4.5 text-primary flex-shrink-0" />
                            <span className="flex-1 text-xs font-bold text-on-surface">اول کسب‌وکارت را ثبت کن</span>
                            <Plus className="w-4 h-4 text-primary" />
                        </button>
                    )}
                    {errors.biz && (
                        <p className="mb-3 text-[11px] text-error flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5" /> {errors.biz}
                        </p>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* ۱) نام کاتالوگ */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-on-surface dark:text-gray-200 block">
                                نام کاتالوگ <span className="text-primary">*</span>
                            </label>
                            <input type="text" value={formData.name}
                                   onChange={(e) => handleNameChange(e.target.value)}
                                   placeholder="مثلا کاتالوگ فروش عمده یا کاتالوگ همکاران…"
                                   className={inputCls(errors.name)} />
                            {errors.name && <p className="text-error text-[11px] mt-1">{errors.name}</p>}
                        </div>

                        {/* ۲) آدرس — تک‌خطی یکپارچه با چک زنده */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-on-surface dark:text-gray-200 block">
                                لینک کاتالوگ <span className="text-primary">*</span>
                            </label>
                            <SlugPicker
                                value={formData.slug}
                                onChange={(slug: string) => { setFormData((p) => ({ ...p, slug })); }}
                                onStatus={(status: string | null) => {
                                    setErrors((p) => ({ ...p, slug: status ?? undefined }));
                                }}
                                disabled={busy}
                            />
                        </div>


                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-on-surface dark:text-gray-200 block">
                                نوع فروش <span className="text-primary">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { v: 'wholesale', t: 'فروش عمده', d: 'کاتالوگ مناسب قیمت‌گذاری عمده' },
                                    { v: 'retail', t: 'فروش خرده', d: 'کاتالوگ مناسب قیمت مصرف‌کننده' },
                                    { v: 'service', t: 'فروش خدمات', d: 'کاتالوگ خدمات و تعرفه‌های کاری' },
                                ].map((o) => (
                                    <button key={o.v} type="button"
                                            onClick={() => { if (!salesTypeLocked) setSalesType(o.v as any); }}
                                            disabled={salesTypeLocked}
                                            className={cn(
                                                'rounded border p-3 text-right transition-colors relative',
                                                salesType === o.v
                                                    ? 'border-amber-500/60 bg-amber-50/60 dark:bg-amber-900/10'
                                                    : 'border-outline-variant/40 hover:border-amber-500/30',
                                                salesTypeLocked && 'opacity-60 cursor-not-allowed',
                                            )}>
                                        <span className={cn('block text-xs font-extrabold',
                                            salesType === o.v ? 'text-amber-700 dark:text-amber-400' : 'text-on-surface')}>
                                            {o.t}
                                        </span>
                                        <span className="block text-[10px] text-on-surface-variant/70 mt-1 leading-4">{o.d}</span>
                                    </button>
                                ))}
                            </div>
                            {/* ✅ قفل تغییر نوع — اگر کالا دارد یا در بازاری پذیرفته شده */}
                            {salesTypeLocked && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 leading-4 flex items-start gap-1">
                                    <Building2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    این کاتالوگ کالا دارد یا در بازاری پذیرفته شده — نوع فروش قابل تغییر نیست
                                </p>
                            )}
                        </div>

                        {/* ۴) صنف (اختیاری) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">صنف</label>
                            <input type="text" value={formData.industryName}
                                   onChange={(e) => setFormData((p) => ({ ...p, industryName: e.target.value }))}
                                   placeholder="مثلاً: سوپرمارکت" className={inputCls()} />
                        </div>

                        {/* ۵) موقعیت */}
                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-on-surface block">
                                موقعیت <span className="text-primary">*</span>
                            </label>
                            <IranLocationSelector
                                provinceCode={formData.provinceCode}
                                cityCode={formData.cityCode}
                                onProvinceChange={(code, label) => setFormData((p) => ({ ...p, provinceCode: code, provinceLabel: label }))}
                                onCityChange={(code, label) => setFormData((p) => ({ ...p, cityCode: code, cityLabel: label }))}
                            />
                        </div>

                        {/* دکمهٔ نهایی */}
                        <button type="submit"
                                disabled={busy || bizLocked || !formData.name.trim() || !formData.slug || !!errors.slug}
                                className={cn(
                                    'w-full h-12 rounded text-sm font-extrabold flex items-center justify-center gap-2 transition-all',
                                    busy || bizLocked || !formData.name.trim() || !formData.slug || !!errors.slug
                                        ? 'bg-outline-variant text-on-surface-variant cursor-not-allowed'
                                        : 'bg-primary text-on-primary shadow-lg shadow-primary/25 active:scale-[0.99]',
                                )}>
                            {busy
                                ? <Loader2 className="w-5 h-5 animate-spin" />
                                : bizLocked
                                    ? <><Building2 className="w-4 h-4" /> اول کسب‌وکار را انتخاب/ثبت کن</>
                                    : <><LibraryBig className="w-4.5 h-4.5" /> ساخت کاتالوگ</>}
                        </button>
                    </form>
                </div>
            </main>

            {/* ═══ مودال ساخت نهاد ═══ */}
            <BusinessSetupModal
                isOpen={bizModalOpen}
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
        <div className="relative mb-4">
            <div className="flex items-center gap-1.5">
                <button type="button" onClick={() => setOpen((o) => !o)}
                        className={cn(
                            'flex-1 h-11 px-3.5 rounded bg-surface-container-lowest border flex items-center gap-2.5',
                            'border-outline-variant/40 dark:border-gray-700 focus:ring-2 focus:ring-primary/20',
                            'focus:border-primary outline-none transition-all text-right',
                            open && 'ring-2 ring-primary/20 border-primary',
                        )}>
                    <Building2 className="w-4 h-4 text-primary/70 flex-shrink-0" />
                    <span className={cn('flex-1 text-sm truncate', selected ? 'text-on-surface font-medium' : 'text-on-surface-variant/50')}>
                        {selected ? selected.name : 'کسب‌وکار…'}
                    </span>
                    <span className="text-[9px] text-on-surface-variant/50 flex-shrink-0">کسب‌وکار</span>
                </button>
                {/* ✅ فقط آیکون ＋ ظریف */}
                <button type="button" onClick={onNew} title="کسب‌وکار جدید"
                        className="w-11 h-11 rounded border border-outline-variant/40 grid place-items-center
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