// app/ad/form/StepProduct.tsx
// ✅ مرحله ۱: کالا — کاتالوگ، دسته، مرجع کالا، عنوان، عکس، واحد فروش
// بدون برچسب زائد — خود سلکتورها گویا هستند

'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { Camera, Images, Package, Pencil, Plus, Store, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RootState } from '@/lib/store/store';
import { NumberInput } from '@/components/common/NumberInput';
import { DropSelector } from '@/components/common/DropSelector';
import ProductReferencePicker from '@/app/components/ProductReferencePicker';
import CategoryPicker from '@/app/ad/components/CategoryPicker';
import { useAdForm } from './AdFormStore';
import BrandPicker, { BrandValue } from '@/app/components/BrandPicker';
import { SectionTitle, inputCls } from './ui-bits';
import { MAX_IMAGES } from './constants';

export function StepProduct() {
    const {
        selectedCatalog, isWholesale,
        categoryTree, hasCategoryTree, formData, patchForm,
        selectedProduct, selectProduct, unitName, baseUnitTitle,
        selectedBrand, brandMode, setSelectedBrand, setBrandMode,
        localUnitSettings, suggestedUnitIds, allUnits, unitOptions,
        selectUnit, handleUnitQtyChange,
        images, openImagePicker, removeImage,
        setUnitModalOpen,
    } = useAdForm();

    // ✅ اسلاگ بازار مبدأ — ثبت کالا/برند جدید به همین بازار منتسب می‌شود
    const { currentSlug } = useSelector((s: RootState) => s.arm);

    return (
        <div className="space-y-4 animate-in fade-in duration-200">
            {/* ✅ کاتالوگ اول لیست — بدون برچسب زائد، خود کارت گویاست */}
            <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                <div className="flex items-center gap-3 rounded-xl bg-primary/[0.04] border border-primary/15 px-3 py-2.5">
                    <span className="w-9 h-9 rounded-xl bg-primary/10 grid place-items-center flex-shrink-0">
                        <Store className="w-4 h-4 text-primary" />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-on-surface truncate">{selectedCatalog.name}</p>
                        <p className="text-[10px] text-on-surface-variant/80">{isWholesale ? 'عمده‌فروشی' : 'تک‌فروشی'}</p>
                    </div>
                </div>
            </section>

            {/* ✅ انتخاب کالا از مرجع کالا — بدون برچسب زائد؛ سلکتور خودش می‌گوید «انتخاب از مرجع کالا...» */}
            <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                {hasCategoryTree && (
                    <CategoryPicker
                        value={formData.categoryId}
                        onChange={(id) => patchForm({ categoryId: id, unitId: '', unitTitle: '', unitQty: null })}
                        tree={categoryTree}
                    />
                )}
                <div className="space-y-1.5">
                    <ProductReferencePicker
                        value={selectedProduct}
                        onChange={selectProduct}
                        required
                        placeholder="انتخاب از مرجع کالا..."
                        error={!selectedProduct && !formData.productType.trim() ? 'کالا را انتخاب کن' : undefined}
                        armSlug={currentSlug || undefined}
                    />
                    {/* ✅ عنوان آگهی قابل ویرایش + برند زیرش — با فاصله از سلکتور */}
                    {selectedProduct && (
                        <div className="space-y-1.5 mt-3.5">
                            <label className="text-[10px] text-on-surface-variant block flex items-center gap-1">
                                عنوان آگهی
                                <span className="text-[9px] text-primary/60">(قابل ویرایش)</span>
                            </label>
                            <div className="relative">
                                <input type="text" maxLength={60} value={formData.productType}
                                       onChange={(e) => patchForm({ productType: e.target.value })}
                                       placeholder="عنوان آگهی..."
                                       className={cn(inputCls(), 'pl-14')} />
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold tabular-nums text-on-surface-variant/40">
                                    {(formData.productType || '').length}/۶۰
                                </span>
                            </div>
                            {/* ✅ برند — قابل انتخاب/تغییر (پیش‌فرض از کالای مرجع) */}
                            {selectedProduct && (
                                <div className="pt-1">
                                    <BrandPicker
                                        value={selectedBrand}
                                        onChange={(b: BrandValue | null) => {
                                            setSelectedBrand(b);
                                            if (b) setBrandMode(true);
                                        }}
                                        mode={brandMode}
                                        onModeChange={setBrandMode}
                                        armSlug={currentSlug || undefined}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* ✅ تصویر آگهی — زیر انتخاب کالا، فقط اگه کالا انتخاب شده */}
            {selectedProduct && (
            <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3 animate-in fade-in duration-300">
                <SectionTitle icon={Images} text="تصویر آگهی" />
                <div className="flex flex-wrap gap-2.5 items-start">
                    {images.map((slot, idx) => (
                        <div key={idx} className="relative w-20 h-20 rounded-xl overflow-hidden border border-outline-variant/40 flex-shrink-0">
                            {slot.previewUrl ? (
                                <img src={slot.previewUrl} alt="" className="w-full h-full object-cover" />
                            ) : slot.url ? (
                                <img src={slot.url} alt="" className="w-full h-full object-cover" />
                            ) : null}
                            <button type="button" onClick={() => removeImage(idx)}
                                    className="absolute top-1 left-1 w-5 h-5 rounded-full bg-black/60 text-white grid place-items-center">
                                <X className="w-3 h-3" />
                            </button>
                            {idx === 0 && !slot._fromProduct && (
                                <span className="absolute bottom-0 inset-x-0 bg-black/55 text-white text-[8px] text-center py-0.5 font-bold">
                                    اصلی
                                </span>
                            )}
                            {slot._fromProduct && (
                                <span className="absolute bottom-0 inset-x-0 bg-primary/85 text-white text-[8px] text-center py-0.5 font-bold">
                                    از مرجع کالا
                                </span>
                            )}
                        </div>
                    ))}
                    {images.length < MAX_IMAGES && (
                        <button type="button" onClick={openImagePicker}
                                className="w-20 h-20 rounded-xl border-2 border-dashed border-outline-variant/50
                                    flex flex-col items-center justify-center gap-1 text-on-surface-variant/60
                                    hover:border-primary/50 hover:text-primary hover:bg-primary/[0.03] transition-colors">
                            <Camera className="w-5 h-5" />
                            <span className="text-[9px] font-bold tabular-nums">{images.length.toLocaleString('fa-IR')}/{MAX_IMAGES.toLocaleString('fa-IR')}</span>
                        </button>
                    )}
                </div>
                <p className="text-[10px] text-on-surface-variant/60">
                    {images.length > 0 ? 'عکس‌های موجود نمایش داده شده‌اند — می‌تونی عوض کنی یا بیشتر اضافه کنی.' : 'عکس از مرجع کالا یا خودت آپلود کن. اولین عکس، عکس اصلی کارت می‌شود.'}
                </p>
            </section>
            )}

            {/* ✅ واحد فروش — فقط اگه کالا انتخاب شده */}
            {selectedProduct && (
            <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <SectionTitle icon={Package} text="واحد فروش" />
                    <button type="button" onClick={() => setUnitModalOpen(true)}
                            className="text-[10px] font-bold text-primary
                                flex items-center gap-1 hover:gap-1.5 transition-all">
                        <Plus className="w-3 h-3" /> واحدهای اختصاصی کاتالوگ
                    </button>
                </div>

                {(localUnitSettings.length > 0 || suggestedUnitIds.length > 0) && (
                    <div className="flex flex-wrap gap-1.5">
                        {localUnitSettings.map((s) => {
                            const u = (allUnits as any[]).find((x: any) => x.id === s.unitId);
                            if (!u) return null;
                            const isSelected = formData.unitId === u.id;
                            return (
                                <button key={s.unitId} type="button" onClick={() => selectUnit(u.id, u.title)}
                                        className={cn('h-8 px-3 rounded-full text-[11px] font-bold border transition-colors flex items-center gap-1',
                                            isSelected ? 'bg-primary border-primary text-on-primary shadow-sm shadow-primary/25' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/45 hover:text-primary')}>
                                    {u.title}{s.containsQty ? ` (${s.containsQty} عددی)` : ''}
                                </button>
                            );
                        })}
                        {suggestedUnitIds.filter((uid) => !localUnitSettings.some((s) => s.unitId === uid)).map((uid) => {
                            const u = (allUnits as any[]).find((x: any) => x.id === uid);
                            if (!u) return null;
                            const isSelected = formData.unitId === u.id;
                            return (
                                <button key={uid} type="button" onClick={() => selectUnit(u.id, u.title)}
                                        className={cn('h-8 px-3 rounded-full text-[11px] font-bold border transition-colors flex items-center gap-1',
                                            isSelected ? 'bg-primary border-primary text-on-primary shadow-sm shadow-primary/25' : 'border-outline-variant/50 text-on-surface-variant hover:border-primary/45 hover:text-primary')}>
                                    {u.title}
                                    <span className="text-[8px] opacity-70">این دسته</span>
                                </button>
                            );
                        })}
                    </div>
                )}

                <DropSelector
                    label="واحد فروش"
                    value={formData.unitId}
                    options={unitOptions}
                    placeholder="انتخاب واحد…"
                    onChange={(val, opt) => selectUnit(val, opt.label || '')}
                    renderOption={(o) => (
                        <span className="flex items-center gap-1.5 text-xs text-on-surface">
                            {o.label}
                            {o.extra?.catQty != null && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                                    {o.extra.catQty} عددی
                                </span>
                            )}
                            {o.extra?.suggested && o.extra?.catQty == null && (
                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">این دسته</span>
                            )}
                        </span>
                    )}
                />

                {formData.unitQty != null && (
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-on-surface-variant flex items-center gap-1.5">
                            <Pencil className="w-3 h-3 text-primary" />
                            تعداد {baseUnitTitle} در هر {unitName}
                            {!formData.unitIsVariableQty && <span className="text-[9px] text-on-surface-variant/50">(ثابت)</span>}
                        </label>
                        {formData.unitIsVariableQty ? (
                            <NumberInput value={formData.unitQty || undefined}
                                         onChange={(val) => handleUnitQtyChange(val || null)}
                                         unit={baseUnitTitle} className="h-10" />
                        ) : (
                            <p className="text-xs font-bold text-primary bg-primary/[0.05] border border-primary/15 px-3 py-2 rounded-lg w-fit">
                                {formData.unitQty.toLocaleString('fa-IR')} {baseUnitTitle}
                            </p>
                        )}
                    </div>
                )}
            </section>
            )}
        </div>
    );
}
