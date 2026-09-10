// app/my-catalogs/CatalogEditModal.tsx
'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';
import { useUploadFile, useUpdateCatalog, useUpdateBusinessEntity } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import {
    AlertTriangle, BookOpen, Building2, Camera, Check, Globe, Layers,
    Loader2, MapPin, Pencil, Phone, Settings2, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import IndustryAutocomplete from '@/app/components/IndustryAutocomplete';
import BusinessTypeSelector from '@/app/components/BusinessTypeSelector';
import { IranLocationSelector } from '@/app/components/IranLocationSelector';
import SlugEditor from './SlugEditor';
import { SALES_ICON, SALES_LABEL } from './constants';

// ═══════════════════════════════════════════════════════════
// CatalogEditModal — ویرایش کاتالوگ (salesType-aware)
// ✅ با key در والد remount می‌شود → همیشه با دادهٔ تازه initialize
// ✅ فیکس باگ لوگو: مقدار آپلود از خروجیِ تابع خوانده می‌شود نه state
//    (قبلاً closure مقدار قدیمی '' را ذخیره می‌کرد و لوگو پاک می‌شد)
// ═══════════════════════════════════════════════════════════
export default function CatalogEditModal({ isOpen, onClose, catalog, salesTypeLocked, onSaved }: {
    isOpen: boolean;
    onClose: () => void;
    catalog: any;
    salesTypeLocked: boolean;
    onSaved?: () => void;
}) {
    const queryClient = useQueryClient();
    const uploadMutation = useUploadFile();
    const updateCatalogMutation = useUpdateCatalog();
    const updateBusinessMutation = useUpdateBusinessEntity();
    const { user } = useSelector((s: RootState) => s.auth);

    const isService = catalog?.salesType === 'service';
    const typeLabel = SALES_LABEL[catalog?.salesType] || 'فروش';
    const SalesIcon = SALES_ICON[catalog?.salesType] || SALES_ICON.wholesale;

    // ✅ business data
    const biz = catalog?.business || {};
    const bizPhone = biz?.phone || user?.phone || '';
    const bizId = biz?.id;

    const [name, setName] = useState(catalog?.name || '');
    const [slug, setSlug] = useState(catalog?.slug || '');
    const [industry, setIndustry] = useState<{ id: string | null; title: string; isByUser?: boolean } | null>(
        biz?.industryId ? { id: biz.industryId, title: biz?.industryName || '' } : null,
    );
    const [shortDescription, setShortDescription] = useState(catalog?.shortDescription || '');
    const [phone, setPhone] = useState(catalog?.phone || bizPhone);
    const [website, setWebsite] = useState(catalog?.website || '');
    // ✅ لوگوی اولیه: فایل کاتالوگ → business.logoUrl → catalog.logoUrl
    const [logoUrl, setLogoUrl] = useState(catalog?.logoFile?.path || biz?.logoUrl || catalog?.logoUrl || '');

    const [bizType, setBizType] = useState<string>(biz?.type || 'wholesaler');
    const [businessSector, setBusinessSector] = useState<string>(biz?.businessSector || '');
    const [businessRole, setBusinessRole] = useState<string>(biz?.businessRole || '');
    const [provinceCode, setProvinceCode] = useState<string>(biz?.provinceCode || '');
    const [provinceLabel, setProvinceLabel] = useState<string>(biz?.province || '');
    const [cityCode, setCityCode] = useState<string>(biz?.cityCode || '');
    const [cityLabel, setCityLabel] = useState<string>(biz?.city || '');
    const [address, setAddress] = useState<string>(biz?.address || '');
    const [description, setDescription] = useState<string>(biz?.description || catalog?.description || '');

    const [slugEditing, setSlugEditing] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [savedTick, setSavedTick] = useState(false);
    const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);
    const uploadedLogoRef = useRef<{ id: string; url: string } | null>(null);

    useEffect(() => {
        if (!pendingLogoFile) { setLogoPreview(null); return; }
        const url = URL.createObjectURL(pendingLogoFile);
        setLogoPreview(url);
        return () => URL.revokeObjectURL(url);
    }, [pendingLogoFile]);

    const dirty = useMemo(() => {
        if (!catalog) return false;
        return (
            name !== (catalog.name || '') ||
            slug !== (catalog.slug || '') ||
            industry?.title !== (biz?.industryName || '') ||
            shortDescription !== (catalog.shortDescription || '') ||
            phone !== (catalog.phone || bizPhone) ||
            website !== (catalog.website || '') ||
            !!pendingLogoFile ||
            bizType !== (biz?.type || 'wholesaler') ||
            businessSector !== (biz?.businessSector || '') ||
            businessRole !== (biz?.businessRole || '') ||
            provinceCode !== (biz?.provinceCode || '') ||
            cityCode !== (biz?.cityCode || '') ||
            address !== (biz?.address || '') ||
            description !== (biz?.description || catalog?.description || '')
        );
    }, [catalog, name, slug, industry, shortDescription, phone, website, pendingLogoFile, bizPhone, biz,
        bizType, businessSector, businessRole, provinceCode, cityCode, address, description]);

    /** آپلود لوگو — مقدار نهایی (id+url) برمی‌گردد؛ فراخواننده از همین مقدار استفاده کند */
    const uploadLogo = async (): Promise<{ id: string; url: string } | undefined> => {
        if (!pendingLogoFile) return undefined;
        if (uploadedLogoRef.current) return uploadedLogoRef.current;
        try {
            const result = await uploadMutation.mutateAsync({
                file: pendingLogoFile,
                model: 'Business',
                modelId: bizId || catalog.id,
                fieldKey: 'logo',
            });
            const uploaded = { id: result.id, url: result.path || result.thumbnailPath || '' };
            uploadedLogoRef.current = uploaded;
            setLogoUrl(uploaded.url);          // برای پیش‌نمایش زنده
            setPendingLogoFile(null);
            return uploaded;
        } catch (err: any) {
            toast.error(err?.message || 'خطا در آپلود لوگو');
            throw err;
        }
    };

    const handleSave = async () => {
        const e: Record<string, string> = {};
        if (!name.trim()) e.name = 'نام کاتالوگ الزامی است';
        if (slug && slug.length < 3) e.slug = 'لینک حداقل ۳ حرف است';
        if (slug && slug !== catalog.slug) {
            const check = await apiService.catalog.checkSlug(slug, catalog.id);
            if (!check.available) e.slug = check.reason === 'reserved' ? 'reserved' : 'taken';
        }
        setErrors(e);
        if (Object.keys(e).length > 0) return;

        setSaving(true);
        try {
            // ✅ مقدار تازه از خروجی — نه state کهنه (ریشهٔ باگ قبلی)
            const logo = await uploadLogo();
            const logoFileId = logo?.id;
            const logoUrlValue = logo?.url;

            // ۱) آپدیت Business (صنف + لوگو + موقعیت + آدرس + سایر)
            if (bizId) {
                const bizUpdate: any = {
                    industryName: industry?.title?.trim() || undefined,
                    industryId: industry?.id,
                    type: bizType,
                    businessRole: businessRole || undefined,
                    businessSector: businessSector || undefined,
                    phone: phone.trim() || undefined,
                    province: provinceLabel || undefined,
                    provinceCode: provinceCode || undefined,
                    city: cityLabel || undefined,
                    cityCode: cityCode || undefined,
                    address: address.trim() || undefined,
                    description: description.trim() || undefined,
                };
                if (logoFileId) bizUpdate.logoUrl = logoUrlValue;
                await updateBusinessMutation.mutateAsync({ id: bizId, data: bizUpdate });
            }

            // ۲) آپدیت Catalog (نام + slug + معرفی + تماس + وب + لوگو)
            await updateCatalogMutation.mutateAsync({
                id: catalog.id,
                data: {
                    name: name.trim(),
                    slug: slug || undefined,
                    shortDescription: shortDescription.trim() || undefined,
                    phone: phone.trim() || undefined,
                    website: website.trim() || undefined,
                    ...(logoFileId ? { logoUrl: logoUrlValue } : {}),
                },
            });

            queryClient.invalidateQueries({ queryKey: ['catalogs'] });
            queryClient.invalidateQueries({ queryKey: ['catalog', 'by-slug'] });
            queryClient.invalidateQueries({ queryKey: ['businesses-entity'] });
            onSaved?.();

            setSavedTick(true);
            setTimeout(() => onClose(), 450);
        } catch (err: any) {
            if (err?.data?.errorCode === 'SLUG_TAKEN') { setErrors((p) => ({ ...p, slug: 'taken' })); toast.error('این لینک قبلاً گرفته شده'); }
            else if (err?.data?.errorCode === 'SLUG_RESERVED') { setErrors((p) => ({ ...p, slug: 'reserved' })); toast.error('این لینک قابل انتخاب نیست'); }
            else toast.error(err?.message || 'خطا در ذخیره');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen || !catalog) return null;

    const inputCls = (err?: string) => cn(
        'w-full h-11 px-3.5 text-sm text-right rounded bg-surface-container-lowest border',
        'focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all',
        err ? 'border-error' : 'border-outline-variant/40 dark:border-gray-700',
    );
    const SectionTitle = ({ icon: Icon, text }: any) => (
        <p className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5 mb-2">
            <Icon className="w-3.5 h-3.5 text-amber-500" /> {text}
        </p>
    );
    const buttonState = uploadMutation.isPending ? 'uploading' : saving ? 'saving' : savedTick ? 'saved' : 'idle';
    const previewSrc = logoPreview || logoUrl;

    return (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center sm:justify-center bg-black/50 animate-in fade-in duration-200 sm:p-4"
             onClick={() => !saving && onClose()}>
            <div onClick={(e) => e.stopPropagation()}
                 className="bg-surface w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl
                     min-h-[60dvh] max-h-[92dvh] flex flex-col overflow-hidden
                     animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300">

                {/* هدر مودال */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5">
                        <span className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <BookOpen className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                        </span>
                        <div>
                            <h3 className="text-sm font-extrabold text-on-surface">ویرایش کاتالوگ</h3>
                            <p className="text-[10px] text-on-surface-variant/70 flex items-center gap-1">
                                <SalesIcon className="w-3 h-3" /> {typeLabel}
                            </p>
                        </div>
                    </div>
                    <button onClick={() => !saving && onClose()} aria-label="بستن"
                            className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-4 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))] space-y-4">

                    {/* لوگو + نام */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                        <div className="flex items-center gap-4">
                            <label className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0
                                border-2 border-dashed border-primary/30
                                hover:border-primary/60 hover:bg-primary/5 transition-all group cursor-pointer
                                flex flex-col items-center justify-center gap-1">
                                {previewSrc ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={previewSrc} alt="لوگو" className="w-full h-full object-cover absolute inset-0" />
                                ) : (
                                    <>
                                        <Camera className="w-7 h-7 text-primary/60 group-hover:text-primary transition-colors" />
                                        <span className="text-[9px] font-bold text-primary/60 group-hover:text-primary transition-colors text-center px-1">
                                            آپلود لوگو
                                        </span>
                                    </>
                                )}
                                <input type="file" accept="image/*" className="hidden"
                                       onChange={(e) => {
                                           uploadedLogoRef.current = null; // فایل جدید → آپلود تازه
                                           setPendingLogoFile(e.target.files?.[0] ?? null);
                                           e.target.value = '';
                                       }} />
                                {previewSrc && (
                                    <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                        <Camera className="w-5 h-5 text-white" />
                                        <span className="text-[8px] font-bold text-white">تغییر لوگو</span>
                                    </span>
                                )}
                            </label>
                            <div className="flex-1 space-y-1.5">
                                <label className="text-xs font-medium text-on-surface block">
                                    نام کاتالوگ <span className="text-primary">*</span>
                                </label>
                                <input type="text" value={name}
                                       onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: '' })); }}
                                       className={inputCls(errors.name)} />
                                {errors.name && <p className="text-error text-[11px]">{errors.name}</p>}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 rounded bg-surface-container-high/50 px-3 py-2">
                            <SalesIcon className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                            <span className="text-[11px] font-bold text-on-surface flex-1">{typeLabel}</span>
                            {salesTypeLocked && <span className="text-[9px] text-on-surface-variant/60">قابل تغییر نیست</span>}
                        </div>
                    </section>

                    {/* صنف */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-1.5">
                        <SectionTitle icon={Building2} text="صنف / زمینه فعالیت" />
                        <IndustryAutocomplete
                            value={industry}
                            onChange={setIndustry}
                            placeholder="مثلا: پخش مواد غذایی، سوپرمارکت..."
                        />
                    </section>

                    {/* نوع کسب‌وکار */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2">
                        <SectionTitle icon={Layers} text="نوع کسب‌وکار" />
                        <BusinessTypeSelector
                            sector={businessSector}
                            role={businessRole}
                            onSectorChange={setBusinessSector}
                            onRoleChange={setBusinessRole}
                            required
                        />
                    </section>

                    {/* موقعیت */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                        <SectionTitle icon={MapPin} text="موقعیت و آدرس" />
                        <IranLocationSelector
                            provinceCode={provinceCode}
                            cityCode={cityCode}
                            onProvinceChange={(code: string, label: string) => {
                                setProvinceCode(code);
                                setProvinceLabel(label);
                                setCityCode('');
                                setCityLabel('');
                            }}
                            onCityChange={(code: string, label: string) => {
                                setCityCode(code);
                                setCityLabel(label);
                            }}
                        />
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">آدرس کسب و کار (اختیاری)</label>
                            <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2}
                                      placeholder="خیابان، کوچه، پلاک..."
                                      className={cn(inputCls(), 'h-auto py-2 resize-none')} />
                        </div>
                    </section>

                    {/* معرفی */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                        <SectionTitle icon={Settings2} text="معرفی و توضیحات" />
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">معرفی کوتاه</label>
                            <input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)}
                                   maxLength={120}
                                   placeholder={isService ? 'مثلاً: خدمات حسابداری و مشاوره مالیاتی' : 'مثلاً: تولید و پخش انواع بلوک سیمانی'}
                                   className={inputCls()} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">توضیحات کامل</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                                      placeholder="تاریخچه، خدمات، محصولات، توانمندی‌ها..."
                                      className={cn(inputCls(), 'h-auto py-2 resize-none')} />
                        </div>
                    </section>

                    {/* تماس */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                        <SectionTitle icon={Phone} text="اطلاعات تماس" />
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">شماره تماس (های) پشتیبانی مشتری</label>
                            <input type="tel" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)}
                                   placeholder="0912..." className={cn(inputCls(), 'text-left')} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface block">وب‌سایت (اختیاری)</label>
                            <input type="url" dir="ltr" value={website} onChange={(e) => setWebsite(e.target.value)}
                                   placeholder="example.com" className={cn(inputCls(), 'text-left')} />
                        </div>
                    </section>

                    {/* لینک کاتالوگ */}
                    <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4">
                        <SectionTitle icon={Globe} text="لینک کاتالوگ" />
                        {!slugEditing ? (
                            <div className="flex items-center justify-between gap-2">
                                {catalog.slug ? (
                                    <span dir="ltr" className="text-[13px] font-bold text-on-surface truncate">
                                        daymat.ir/<span className="text-primary">{catalog.slug}</span>
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-amber-600">لینک تنظیم نشده</span>
                                )}
                                <button type="button" onClick={() => setSlugEditing(true)} aria-label="ویرایش لینک کاتالوگ"
                                        className="w-8 h-8 rounded-full bg-surface-container-high/50 grid place-items-center
                                            text-on-surface-variant hover:text-amber-600 hover:bg-amber-500/10 transition-colors flex-shrink-0">
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <SlugEditor value={slug} onChange={setSlug} excludeId={catalog.id} />
                                {catalog.slug && (
                                    <div className="rounded bg-amber-50 dark:bg-amber-900/15 border border-amber-200/70 dark:border-amber-800/50 p-2.5 flex items-start gap-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                                        <p className="text-[10px] text-amber-800 dark:text-amber-200 leading-5">
                                            اگر لینک کاتالوگ را عوض کنی، کسانی که آدرس قبلی را دارند و ذخیره‌اش نکرده‌اند دیگر پیدایت نمی‌کنند.
                                        </p>
                                    </div>
                                )}
                                <button type="button" onClick={() => { setSlug(catalog.slug || ''); setSlugEditing(false); }}
                                        className="w-full h-9 rounded-lg border border-outline-variant/60 text-xs font-bold
                                            text-on-surface-variant hover:bg-surface-container-high transition-colors">
                                    انصراف
                                </button>
                            </div>
                        )}
                        {errors.slug && !slugEditing && (
                            <p className="text-[10px] text-error mt-1.5 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> مشکل در لینک — دوباره ویرایشش کن
                            </p>
                        )}
                    </section>
                </div>

                <div className="flex-shrink-0 px-4 py-3 border-t border-outline-variant/20">
                    <button onClick={handleSave} disabled={saving || uploadMutation.isPending || !dirty}
                            className={cn('w-full h-11 rounded-lg text-sm font-extrabold flex items-center justify-center gap-2 transition-all',
                                savedTick ? 'bg-emerald-500 text-white' : 'bg-primary text-on-primary hover:bg-primary/90 shadow-sm',
                                'disabled:opacity-50')}>
                        {buttonState === 'uploading' && <><Loader2 className="w-4 h-4 animate-spin" /> در حال آپلود…</>}
                        {buttonState === 'saving' && <><Loader2 className="w-4 h-4 animate-spin" /> در حال ذخیره…</>}
                        {buttonState === 'saved' && <><Check className="w-4 h-4" /> ذخیره شد</>}
                        {buttonState === 'idle' && 'ذخیره تغییرات'}
                    </button>
                </div>
            </div>
        </div>
    );
}
