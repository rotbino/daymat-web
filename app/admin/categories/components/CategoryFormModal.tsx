// app/admin/categories/components/CategoryFormModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {X, Loader2, Plus, Trash2, Star, Search} from 'lucide-react';
import { CategoryNode } from '../page';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface CategoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    category: CategoryNode | null;
    loading: boolean;
}

/*interface UnitItem {
    id: string;
    unitId: string;
    title: string;
    shortCode: string;
    isDefault: boolean;
}*/

interface UnitItem {
    unitId: string;          // شناسه واحد (مهم)
    title: string;
    shortCode: string;
    isDefault: boolean;
}

interface AvailableUnit {
    id: string;
    title: string;
    shortCode: string;
    isDefault: boolean;
}

export function CategoryFormModal({ isOpen, onClose, onSubmit, category, loading }: CategoryFormModalProps) {
    // فیلدهای اصلی
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [icon, setIcon] = useState('📦');
    const [description, setDescription] = useState('');
    const [example, setExample] = useState('');
    const [defaultMinQuantity, setDefaultMinQuantity] = useState<number | undefined>(undefined);

    // واحدها
    const [assignedUnits, setAssignedUnits] = useState<UnitItem[]>([]);
    const [availableUnits, setAvailableUnits] = useState<AvailableUnit[]>([]);
    const [unitsLoading, setUnitsLoading] = useState(false);
    const [addingUnitId, setAddingUnitId] = useState<string | null>(null);
    const [removingUnitId, setRemovingUnitId] = useState<string | null>(null);
    const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'units'>('info');

    const isEdit = !!category;
    const [unitSearchTerm, setUnitSearchTerm] = useState('');

    // ============================================================
    // لود داده‌ها
    // ============================================================
    useEffect(() => {
        if (isOpen) {
            if (category) {
                setTitle(category.title || '');
                setSlug(category.slug || '');
                setIcon(category.icon || '📦');
                setDescription(category.description || '');
                setExample(category.example || '');
                setDefaultMinQuantity(category.defaultMinQuantity || undefined);
                loadAssignedUnits();
            } else {
                setTitle('');
                setSlug('');
                setIcon('📦');
                setDescription('');
                setExample('');
                setDefaultMinQuantity(undefined);
                setAssignedUnits([]);
            }
            setActiveTab('info');
            loadAvailableUnits();
        }
    }, [isOpen, category]);

    // ============================================================
    // واحدهای تخصیص‌یافته
    // ============================================================
    const loadAssignedUnits = async () => {
        if (!category) return;
        setUnitsLoading(true);
        try {
            const data = await apiService.admin.categories.getUnits(category.id);

            // تبدیل داده‌های دریافتی به ساختار مورد انتظار
            const mappedUnits: UnitItem[] = data.map((item: any) => ({
                unitId: item.unit?.id || item.id,   // واحد id داخل unit.id است (یا به عنوان fallback خود id)
                title: item.unit?.title || item.title,
                shortCode: item.unit?.shortCode || '',
                isDefault: item.isDefault,
            }));
            setAssignedUnits(mappedUnits);
        } catch (error: any) {
            // بی‌صدا
        } finally {
            setUnitsLoading(false);
        }
    };

    // همه واحدهای موجود در سیستم
    const loadAvailableUnits = async () => {
        try {
            const data = await apiService.admin.units.getAll();
            setAvailableUnits(data || []);
        } catch (error: any) {
            // بی‌صدا
        }
    };

    // ============================================================
    // عملیات واحدها
    // ============================================================
    const handleAddUnit = async (unitId: string) => {
        if (!category) return;
        setAddingUnitId(unitId);
        try {
            const result = await apiService.admin.categories.addUnit(category.id, unitId);

            // نگاشت نتیجه به UnitItem
            const newUnit: UnitItem = {
                unitId: result.unit?.id || unitId,       // اگر result.unit.id بود از آن استفاده کن، در غیر این صورت خود unitId
                title: result.unit?.title || '',
                shortCode: result.unit?.shortCode || '',
                isDefault: result.isDefault || false,
            };

            setAssignedUnits(prev => [...prev, newUnit]);
            toast.success('واحد اضافه شد');
        } catch (error: any) {
            toast.error(error?.message || 'خطا در افزودن واحد');
        } finally {
            setAddingUnitId(null);
        }
    };

    const handleRemoveUnit = async (unitId: string) => {
        if (!category) return;
        setRemovingUnitId(unitId);
        try {
            await apiService.admin.categories.removeUnit(category.id, unitId);
            setAssignedUnits(prev => prev.filter(u => u.unitId !== unitId));
            toast.success('واحد حذف شد');
        } catch (error: any) {
            toast.error(error?.message || 'خطا در حذف واحد');
        } finally {
            setRemovingUnitId(null);
        }
    };

    const handleSetDefault = async (unitId: string) => {
        if (!category) return;
        setSettingDefaultId(unitId);
        try {
            await apiService.admin.categories.setDefaultUnit(category.id, unitId);
            setAssignedUnits(prev => prev.map(u => ({
                ...u,
                isDefault: u.unitId === unitId,
            })));
            toast.success('واحد پیش‌فرض تنظیم شد');
        } catch (error: any) {
            toast.error(error?.message || 'خطا در تنظیم واحد پیش‌فرض');
        } finally {
            setSettingDefaultId(null);
        }
    };

    // ============================================================
    // واحدهایی که می‌تونن اضافه بشن (در assignedUnits نیستن)
    // ============================================================
    const unitsCanAdd = availableUnits.filter(
        u => !assignedUnits.some(a => a.unitId === u.id)
    );
    const filteredAvailableUnits = unitsCanAdd.filter(
        u => u.title.toLowerCase().includes(unitSearchTerm.toLowerCase())
    );
    // ============================================================
    // submit
    // ============================================================
    const handleSlugFromTitle = (value: string) => {
        setTitle(value);
        if (!isEdit) {
            setSlug(value.replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '').toLowerCase());
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ title, slug, icon, description, example, defaultMinQuantity });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface w-full max-w-lg rounded-2xl shadow-2xl border border-outline-variant max-h-[90vh] overflow-y-auto">
                {/* هدر */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant sticky top-0 bg-surface rounded-t-2xl z-10">
                    <h3 className="text-lg font-semibold text-on-surface">
                        {isEdit ? 'ویرایش دسته‌بندی' : 'افزودن دسته‌بندی جدید'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors">
                        <X className="w-5 h-5 text-on-surface-variant" />
                    </button>
                </div>

                {/* تب‌ها (فقط در حالت ویرایش) */}
                {isEdit && (
                    <div className="flex border-b border-outline-variant/30 bg-surface-container-lowest">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={cn(
                                "flex-1 py-2.5 text-sm font-medium transition-colors",
                                activeTab === 'info'
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-on-surface-variant hover:text-on-surface"
                            )}
                        >
                            اطلاعات پایه
                        </button>
                        <button
                            onClick={() => setActiveTab('units')}
                            className={cn(
                                "flex-1 py-2.5 text-sm font-medium transition-colors",
                                activeTab === 'units'
                                    ? "text-primary border-b-2 border-primary"
                                    : "text-on-surface-variant hover:text-on-surface"
                            )}
                        >
                            واحدهای اندازه‌گیری
                            {assignedUnits.length > 0 && (
                                <span className="mr-1.5 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                                    {assignedUnits.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {/* ══════════════════════════════════════ */}
                {/* تب اطلاعات پایه */}
                {/* ══════════════════════════════════════ */}
                {(activeTab === 'info' || !isEdit) && (
                    <form onSubmit={handleSubmit} className="p-5 space-y-4">
                        <div>
                            <label className="text-sm font-medium text-on-surface block mb-1.5">
                                عنوان <span className="text-error">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={e => handleSlugFromTitle(e.target.value)}
                                placeholder="مثال: مصالح ساختمانی"
                                required
                                className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-on-surface block mb-1.5">
                                شناسه یکتا (slug) <span className="text-error">*</span>
                            </label>
                            <input
                                type="text"
                                value={slug}
                                onChange={e => setSlug(e.target.value)}
                                placeholder="masaleh-sakhtemani"
                                required
                                dir="ltr"
                                className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm font-mono text-left focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                            <p className="text-[10px] text-on-surface-variant/60 mt-1">فقط حروف، اعداد و خط تیره</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-on-surface block mb-1.5">آیکون</label>
                            <div className="flex items-center gap-2">
                                <span className="text-2xl">{icon}</span>
                                <input
                                    type="text"
                                    value={icon}
                                    onChange={e => setIcon(e.target.value)}
                                    placeholder="اموجی یا نام آیکون"
                                    className="flex-1 bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-on-surface block mb-1.5">توضیحات</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                rows={2}
                                className="w-full bg-surface-container-lowest border border-outline rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-on-surface block mb-1.5">مثال</label>
                            <input
                                type="text"
                                value={example}
                                onChange={e => setExample(e.target.value)}
                                placeholder="مثال: سیمان تیپ ۲"
                                className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-on-surface block mb-1.5">حداقل سفارش پیش‌فرض</label>
                            <input
                                type="number"
                                value={defaultMinQuantity ?? ''}
                                onChange={e => setDefaultMinQuantity(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="مثال: 10"
                                className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={onClose}
                                    className="flex-1 h-11 border border-outline text-on-surface rounded-xl hover:bg-surface-container-low transition-colors text-sm font-medium">
                                انصراف
                            </button>
                            <button type="submit" disabled={loading}
                                    className="flex-1 h-11 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isEdit ? 'ذخیره تغییرات' : 'ایجاد دسته‌بندی'}
                            </button>
                        </div>
                    </form>
                )}

                {/* ══════════════════════════════════════ */}
                {/* تب واحدها */}
                {/* ══════════════════════════════════════ */}
                {activeTab === 'units' && isEdit && (
                    <div className="p-5 space-y-5">
                        {/* واحدهای تخصیص‌یافته */}
                        <div>
                            <h4 className="text-sm font-semibold text-on-surface mb-3 flex items-center gap-2">
                                واحدهای تخصیص‌یافته
                                {unitsLoading && <Loader2 className="w-4 h-4 animate-spin text-on-surface-variant" />}
                            </h4>

                            {assignedUnits.length === 0 && !unitsLoading ? (
                                <div className="text-center py-8 bg-surface-container-lowest rounded-xl border border-dashed border-outline-variant/50">
                                    <p className="text-sm text-on-surface-variant">هیچ واحدی به این دسته‌بنDayMatصل نیست</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {assignedUnits.map(unit => (
                                        <div key={unit.unitId}
                                             className={cn(
                                                 "flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all",
                                                 unit.isDefault
                                                     ? "bg-primary/5 border-primary/30"
                                                     : "bg-surface-container-lowest border-outline-variant/50"
                                             )}>
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold",
                                                    unit.isDefault ? "bg-primary/10 text-primary" : "bg-surface-container-high text-on-surface-variant"
                                                )}>
                                                    {unit.shortCode}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-on-surface">{unit.title}</p>
                                                    <p className="text-[10px] text-on-surface-variant/60">{unit.shortCode}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                {/* دکمه پیش‌فرض */}
                                                {!unit.isDefault && (
                                                    <button
                                                        onClick={() => handleSetDefault(unit.unitId)}
                                                        disabled={settingDefaultId === unit.unitId}
                                                        className="p-1.5 hover:bg-yellow-50 hover:text-yellow-600 rounded-lg transition-colors"
                                                        title="تنظیم به عنوان پیش‌فرض"
                                                    >
                                                        {settingDefaultId === unit.unitId ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <Star className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                )}

                                                {/* نشان پیش‌فرض */}
                                                {unit.isDefault && (
                                                    <span className="text-[10px] bg-yellow-50 text-yellow-700 px-2 py-1 rounded-full flex items-center gap-1">
                                                        <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                                        پیش‌فرض
                                                    </span>
                                                )}

                                                {/* حذف */}
                                                <button
                                                    onClick={() => handleRemoveUnit(unit.unitId)}
                                                    disabled={removingUnitId === unit.unitId}
                                                    className="p-1.5 hover:bg-error/10 hover:text-error rounded-lg transition-colors"
                                                    title="حذف واحد"
                                                >
                                                    {removingUnitId === unit.unitId ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* افزودن واحد جدید */}
                        {unitsCanAdd.length > 0 && (
                            <div>
                                <h4 className="text-sm font-semibold text-on-surface mb-3">افزودن واحد</h4>
                                {/* فیلد جستجوی جدید */}
                                <div className="relative mb-3">
                                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/40" />
                                    <input
                                        type="text"
                                        value={unitSearchTerm}
                                        onChange={e => setUnitSearchTerm(e.target.value)}
                                        placeholder="جستجوی واحد..."
                                        className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl h-10 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {filteredAvailableUnits.map(unit => (
                                        <button
                                            key={unit.id}
                                            onClick={() => handleAddUnit(unit.id)}
                                            disabled={addingUnitId === unit.id}
                                            className="flex items-center gap-2 px-3 py-2 bg-surface-container-lowest border border-outline-variant/50 rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all text-sm disabled:opacity-50"
                                        >
                                            <span className="text-on-surface">{unit.title}</span>
                                            {addingUnitId === unit.id && (
                                                <Loader2 className="w-3.5 h-3.5 animate-spin text-on-surface-variant" />
                                            )}
                                            {addingUnitId !== unit.id && (
                                                <Plus className="w-3.5 h-3.5 text-on-surface-variant" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                                {filteredAvailableUnits.length === 0 && unitSearchTerm && (
                                    <p className="text-xs text-on-surface-variant/60 mt-2">هیچ واحدی با این مشخصات یافت نشد.</p>
                                )}
                            </div>
                        )}

                        <div className="flex gap-3 pt-2 border-t border-outline-variant/30">
                            <button type="button" onClick={onClose}
                                    className="flex-1 h-11 border border-outline text-on-surface rounded-xl hover:bg-surface-container-low transition-colors text-sm font-medium">
                                بستن
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}