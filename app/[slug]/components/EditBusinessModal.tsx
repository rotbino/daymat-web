// app/[slug]/components/EditCatalogModal.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
    Check, Camera, Globe2, Loader2, Store, X, IdCard,
    Tag, Phone, MapPin, FileText, Pencil, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api/apiService';
import { useUploadFile } from '@/lib/api/apiHooks';
import { USER_POSITIONS } from '@/lib/api/data-types';
import { IranLocationSelector } from '@/app/components/IranLocationSelector';
import SlugEditor from '../../my-catalogs/SlugEditor';
import { normalizeSlug } from '@/lib/utils/slug';
import Image from 'next/image';

const BIZ_TYPES: { value: string; label: string }[] = [
    { value: 'producer', label: 'تولیدی' },
    { value: 'wholesaler', label: 'عمده‌فروش' },
    { value: 'importer', label: 'واردکننده' },
    { value: 'exporter', label: 'صادرکننده' },
    { value: 'distributor', label: 'توزیع‌کننده' },
    { value: 'retailer', label: 'خرده‌فروش' },
    { value: 'contractor', label: 'پیمانکار' },
    { value: 'service_provider', label: 'خدمات' },
    { value: 'other', label: 'سایر' },
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
    catalog: any;
    onSaved?: () => void;
}

export default function EditBusinessModal({ isOpen, onClose, catalog, onSaved }: Props) {
    const queryClient = useQueryClient();
    const uploadMutation = useUploadFile();
    const logoInputRef = useRef<HTMLInputElement>(null);

    // ─── فرم ───
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [industryName, setIndustryName] = useState('');
    const [type, setType] = useState('wholesaler');
    const [salesType, setSalesType] = useState('wholesale');
    const [position, setPosition] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [address, setAddress] = useState('');
    const [provinceCode, setProvinceCode] = useState('');
    const [provinceLabel, setProvinceLabel] = useState('');
    const [cityCode, setCityCode] = useState('');
    const [cityLabel, setCityLabel] = useState('');

    // ─── لوگو ───
    const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const uploadedLogoRef = useRef<{ id: string } | null>(null);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [savedTick, setSavedTick] = useState(false);

    // ─── پر کردن اولیه ───
    useEffect(() => {
        if (!isOpen || !catalog) return;
        setName(catalog.name || '');
        setSlug(catalog.slug || '');
        setIndustryName(catalog.industryName || '');
        setType(catalog.type || 'wholesaler');
        setSalesType(catalog.salesType || 'wholesale');
        setPosition(catalog.owner?.position || '');
        setShortDescription(catalog.shortDescription || '');
        setDescription(catalog.description || '');
        setPhone(catalog.phone || '');
        setWebsite(catalog.website || '');
        setAddress(catalog.address || '');
        setProvinceCode(catalog.provinceCode || '');
        setProvinceLabel(catalog.province || '');
        setCityCode(catalog.cityCode || '');
        setCityLabel(catalog.city || '');
        setPendingLogoFile(null);
        setLogoPreview(null);
        uploadedLogoRef.current = null;
        setErrors({});
        setSavedTick(false);
    }, [isOpen, catalog]);

    // پیش‌نمایش لوگو
    useEffect(() => {
        if (!pendingLogoFile) { setLogoPreview(null); return; }
        const url = URL.createObjectURL(pendingLogoFile);
        setLogoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [pendingLogoFile]);

    // قفل اسکرول + Esc
    useEffect(() => {
        if (!isOpen) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) handleClose(); };
        document.addEventListener('keydown', onKey);
        return () => {
            document.body.style.overflow = prev;
            document.removeEventListener('keydown', onKey);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, saving]);

    const dirty = useMemo(() => {
        if (!catalog) return false;
        return (
            name !== (catalog.name || '') ||
            normalizeSlug(slug) !== normalizeSlug(catalog.slug || '') ||
            industryName !== (catalog.industryName || '') ||
            type !== (catalog.type || '') ||
            salesType !== (catalog.salesType || 'wholesale') ||
            position !== (catalog.owner?.position || '') ||
            shortDescription !== (catalog.shortDescription || '') ||
            description !== (catalog.description || '') ||
            phone !== (catalog.phone || '') ||
            website !== (catalog.website || '') ||
            address !== (catalog.address || '') ||
            provinceCode !== (catalog.provinceCode || '') ||
            cityCode !== (catalog.cityCode || '') ||
            !!pendingLogoFile
        );
    }, [catalog, name, slug, industryName, type, salesType, position, shortDescription, description, phone, website, address, provinceCode, cityCode, pendingLogoFile]);

    const validate = (): boolean => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'نام کاتالوگ الزامی است';
        if (phone && !/^[0-9+\-\s()]{8,15}$/.test(phone.trim())) e.phone = 'شماره تلفن معتبر وارد کنید';
        if (website && !/^(https?:\/\/)?[\w-]+(\.[\w-]+)+/.test(website.trim())) e.website = 'آدرس وب‌سایت معتبر نیست';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleClose = () => {
        if (saving || isUploadingLogo) return;
        onClose();
    };

    // ✅ آپلود لوگو — الگوی آواتار پروفایل
    const uploadLogo = async (): Promise<string | undefined> => {
        if (!pendingLogoFile) return undefined;
        if (uploadedLogoRef.current) return uploadedLogoRef.current.id;

        setIsUploadingLogo(true);
        try {
            const result = await uploadMutation.mutateAsync({
                file: pendingLogoFile,
                model: 'Catalog',
                modelId: catalog.id,
                fieldKey: 'logo',
            });
            uploadedLogoRef.current = { id: result.id };
            setPendingLogoFile(null);
            return result.id;
        } catch (err: any) {
            toast.error(err?.message || 'خطا در آپلود لوگو');
            throw err;
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleSave = async () => {
        if (!validate()) return;
        setSaving(true);
        try {
            // ۱) لوگو (اگر جدید است)
            const logoFileId = await uploadLogo();

            // ۲) آپدیت — ✅ salesType این بار واقعاً ارسال می‌شود
            await apiService.catalog.update(catalog.id, {
                name: name.trim(),
                slug: normalizeSlug(slug) || undefined,
                industryName: industryName.trim() || undefined,
                type,
                salesType,
                position: position.trim() || undefined,
                shortDescription: shortDescription.trim() || undefined,
                description: description.trim() || undefined,
                phone: phone.trim() || undefined,
                website: website.trim() || undefined,
                address: address.trim() || undefined,
                province: provinceLabel || undefined,
                city: cityLabel || undefined,
                provinceCode: provinceCode || undefined,
                cityCode: cityCode || undefined,
                ...(logoFileId ? { logoFileId } : {}),
            });

            // ۳) کاتالوگ تازه شود
            queryClient.invalidateQueries({ queryKey: ['catalog', 'by-slug'] });
            queryClient.invalidateQueries({ queryKey: ['catalog'] });
            queryClient.invalidateQueries({ queryKey: ['cataloges'] });
            onSaved?.();

            setSavedTick(true);
            // ✅ بازخورد کوتاه، بعد بستن — کاربر تغییرات را روی کاتالوگ تازه می‌بیند
            setTimeout(() => onClose(), 450);
        } catch (e: any) {
            if (e?.data?.errorCode === 'SLUG_TAKEN') toast.error('این آدرس قبلاً گرفته شده — یک کمی عوضش کن');
            else if (e?.data?.errorCode === 'SLUG_RESERVED') toast.error('این آدرس قابل انتخاب نیست');
            else if (e?.data?.errorCode === 'INVALID_SLUG') toast.error(e?.data?.message || 'آدرس کاتالوگ معتبر نیست');
            else toast.error(e?.message || 'خطا در ذخیره اطلاعات');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !catalog) return null;

    const inputCls = (hasErr?: string) => cn(
        'w-full h-11 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest border',
        'focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all',
        hasErr ? 'border-error' : 'border-outline-variant/40 dark:border-gray-700',
    );

    const SectionTitle = ({ icon: Icon, text }: any) => (
        <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5 mb-2">
            <Icon className="w-3.5 h-3.5 text-amber-500" /> {text}
        </p>
    );

    const buttonState = isUploadingLogo ? 'uploading' : saving ? 'saving' : savedTick ? 'saved' : 'idle';

    return (
        <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200"
             onClick={handleClose}>
            <div onClick={(e) => e.stopPropagation()}
                 className="bg-surface w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl
                     max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden
                     animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

                {/* ─── هدر مودال ─── */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Store className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                        </span>
                        <div>
                            <h3 className="text-sm font-extrabold text-on-surface">ویرایش کاتالوگ</h3>
                            <p className="text-[10px] text-on-surface-variant/70">مشخصات کاتالوگ و اطلاعات تماس</p>
                        </div>
                    </div>
                    <button onClick={handleClose} aria-label="بستن"
                            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant
                                hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* ─── بدنه ─── */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-4 space-y-4">

                    {/* ═══ باکس ۱: لوگو + نام + نوع فروش (مهم‌ترین‌ها بالا) ═══ */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                        <div className="flex items-center gap-4">
                            {/* لوگو — بج دایره‌ای */}
                            <button
                                type="button"
                                onClick={() => logoInputRef.current?.click()}
                                disabled={isUploadingLogo}
                                className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0
                                    ring-2 ring-amber-500/20 hover:ring-amber-500/50 transition-all group"
                            >
                                {logoPreview ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                                ) : catalog.logoUrl ? (
                                    <Image src={catalog.logoUrl} alt={catalog.name} fill sizes="80px" className="object-cover" unoptimized />
                                ) : (
                                    <div className="w-full h-full grid place-items-center bg-surface-container-high text-on-surface-variant/30">
                                        <Store className="w-7 h-7" />
                                    </div>
                                )}
                                <span className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100
                                    group-active:opacity-100 transition-opacity grid place-items-center">
                                    <Camera className="w-5 h-5 text-white" />
                                </span>
                                {isUploadingLogo && (
                                    <span className="absolute inset-0 bg-black/50 grid place-items-center">
                                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                                    </span>
                                )}
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-on-surface">لوگوی کاتالوگ</p>
                                <p className="text-[10px] text-on-surface-variant/60 mt-1 leading-5">
                                    {isUploadingLogo
                                        ? 'در حال آپلود تصویر...'
                                        : pendingLogoFile ? 'لوگوی جدید انتخاب شد — با ذخیره اعمال می‌شود'
                                            : 'لمس کن تا لوگو را انتخاب کنی — مربعی، حداقل ۵۰۰×۵۰۰'}
                                </p>
                                <input
                                    ref={logoInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) setPendingLogoFile(f);
                                        e.target.value = '';
                                    }}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">
                                نام کاتالوگ <span className="text-primary">*</span>
                            </label>
                            <input type="text" value={name}
                                   onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
                                   placeholder="مثال: پخش مواد غذایی آرمانی" className={inputCls(errors.name)} />
                            {errors.name && <p className="text-error text-[11px]">{errors.name}</p>}
                        </div>

                        {/* ✅ نوع فروش — دکمهٔ دوگانه برجسته (فیلد کلیدی) */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500/70" /> نوع فروش کاتالوگ
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { v: 'wholesale', t: 'عمده‌فروشی', d: 'قیمت عمده، حداقل خرید' },
                                    { v: 'retail', t: 'تک‌فروشی', d: 'قیمت مستقیم برای مشتری' },
                                ].map((o) => (
                                    <button key={o.v} type="button" onClick={() => setSalesType(o.v)}
                                            className={cn('rounded-xl border p-3 text-right transition-all',
                                                salesType === o.v
                                                    ? 'border-amber-500/60 bg-amber-50/60 dark:bg-amber-900/10 ring-1 ring-amber-500/30'
                                                    : 'border-outline-variant/40 hover:border-amber-500/30')}>
                                        <span className={cn('block text-xs font-bold',
                                            salesType === o.v ? 'text-amber-700 dark:text-amber-400' : 'text-on-surface')}>{o.t}</span>
                                        <span className="block text-[10px] text-on-surface-variant/70 mt-0.5">{o.d}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* ═══ باکس ۲: صنف و نقش ═══ */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                        <SectionTitle icon={IdCard} text="صنف و نقش" />
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">صنف / زمینه فعالیت</label>
                            <input type="text" value={industryName} onChange={(e) => setIndustryName(e.target.value)}
                                   placeholder="مثلاً پخش مواد غذایی" className={inputCls()} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">نوع کسب‌وکار</label>
                            <div className="flex flex-wrap gap-1.5">
                                {BIZ_TYPES.map((t) => (
                                    <button key={t.value} type="button" onClick={() => setType(t.value)}
                                            className={cn('h-8 px-3 rounded-full text-[11px] font-bold border transition-colors',
                                                type === t.value
                                                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-700 dark:text-amber-400'
                                                    : 'border-outline-variant/50 text-on-surface-variant hover:border-amber-500/30')}>
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block flex items-center gap-1.5">
                                <IdCard className="w-3.5 h-3.5 text-primary/60" /> نقش من در این کاتالوگ
                                <span className="text-on-surface-variant/50 text-[10px]">(در کاتالوگ نمایش داده می‌شود)</span>
                            </label>
                            <select
                                value={position}
                                onChange={(e) => setPosition(e.target.value)}
                                className={cn(inputCls(), 'appearance-none cursor-pointer')}
                            >
                                <option value="">انتخاب کنید</option>
                                {USER_POSITIONS.map((p) => (
                                    <option key={p.value} value={p.label}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </section>

                    {/* ═══ باکس ۳: آدرس اختصاصی (لِیبل + مداد) ═══ */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4">
                        <SectionTitle icon={Globe2} text="آدرس اختصاصی کاتالوگ" />
                        <SlugEditor
                            value={slug}
                            onChange={setSlug}
                            excludeId={catalog.id}
                            isEditMode={!!catalog.slug}
                        />
                    </section>

                    {/* ═══ باکس ۴: معرفی ═══ */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                        <SectionTitle icon={FileText} text="معرفی" />
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">توضیح کوتاه (بالای کاتالوگ نمایش داده می‌شود)</label>
                            <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)}
                                   placeholder="مثال: تولید و پخش انواع بلوک سیمانی" className={inputCls()} maxLength={120} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">توضیحات کامل</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                                      placeholder="هرچه مشتری باید درباره‌ی کارت بداند..."
                                      rows={3}
                                      className="w-full min-h-[72px] py-2.5 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest border border-outline-variant/40 dark:border-gray-700 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all resize-none" />
                        </div>
                    </section>

                    {/* ═══ باکس ۵: تماس و موقعیت ═══ */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                        <SectionTitle icon={Phone} text="تماس و موقعیت" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-on-surface block">تلفن</label>
                                <input type="tel" dir="ltr" value={phone}
                                       onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: '' })); }}
                                       placeholder="0912..."
                                       className={cn(inputCls(errors.phone), 'text-left')} />
                                {errors.phone && <p className="text-error text-[11px]">{errors.phone}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-on-surface block">وب‌سایت</label>
                                <input type="url" dir="ltr" value={website}
                                       onChange={(e) => { setWebsite(e.target.value); setErrors((p) => ({ ...p, website: '' })); }}
                                       placeholder="example.com"
                                       className={cn(inputCls(errors.website), 'text-left')} />
                                {errors.website && <p className="text-error text-[11px]">{errors.website}</p>}
                            </div>
                        </div>
                        <IranLocationSelector
                            provinceCode={provinceCode}
                            cityCode={cityCode}
                            onProvinceChange={(code, label) => { setProvinceCode(code); setProvinceLabel(label); }}
                            onCityChange={(code, label) => { setCityCode(code); setCityLabel(label); }}
                        />
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">آدرس دقیق</label>
                            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                                   placeholder="مثلاً شهرک صنعتی، خیابان..." className={inputCls()} />
                        </div>
                    </section>
                </div>

                {/* ─── فوتر: ذخیره ─── */}
                <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant/20 flex items-center gap-2.5">
                    <button onClick={handleClose} disabled={saving || isUploadingLogo}
                            className="h-10 px-4 rounded-xl border border-outline-variant text-xs font-bold text-on-surface-variant
                            hover:bg-surface-container-high transition-colors disabled:opacity-50 flex-shrink-0">
                        بستن
                    </button>
                    <button onClick={handleSave} disabled={saving || isUploadingLogo || !dirty}
                            className={cn(
                                'flex-1 h-10 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all',
                                savedTick ? 'bg-emerald-500 text-white' : 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm',
                                'disabled:opacity-50',
                            )}>
                        {buttonState === 'uploading' && <><Loader2 className="w-4 h-4 animate-spin" /> در حال آپلود تصویر...</>}
                        {buttonState === 'saving' && <><Loader2 className="w-4 h-4 animate-spin" /> در حال ذخیره...</>}
                        {buttonState === 'saved' && <><Check className="w-4 h-4" /> ذخیره شد</>}
                        {buttonState === 'idle' && 'ذخیره تغییرات'}
                    </button>
                </div>
            </div>
        </div>
    );
}