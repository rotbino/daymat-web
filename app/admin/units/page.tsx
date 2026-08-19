// app/admin/units/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Ruler, Search, Plus, Pencil, Trash2, Loader2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';

interface Unit {
    id: string;
    title: string;
    shortCode: string;
    isDefault: boolean;
}

export default function AdminUnitsPage() {
    const [units, setUnits] = useState<Unit[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // مودال فرم
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formTitle, setFormTitle] = useState('');
    const [formShortCode, setFormShortCode] = useState('');
    const [formIsDefault, setFormIsDefault] = useState(false);

    // مودال حذف
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const fetchUnits = async () => {
        setLoading(true);
        try {
            const data = await apiService.admin.units.getAll();
            setUnits(data || []);
        } catch (error: any) {
            toast.error(error?.message || 'خطا در دریافت واحدها');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUnits(); }, []);

    const filteredUnits = search.trim()
        ? units.filter(u =>
            u.title.toLowerCase().includes(search.toLowerCase()) ||
            u.shortCode.toLowerCase().includes(search.toLowerCase())
        )
        : units;

    const openCreate = () => {
        setEditingUnit(null);
        setFormTitle('');
        setFormShortCode('');
        setFormIsDefault(false);
        setIsFormOpen(true);
    };

    const openEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setFormTitle(unit.title);
        setFormShortCode(unit.shortCode);
        setFormIsDefault(unit.isDefault);
        setIsFormOpen(true);
    };

    const openDelete = (unit: Unit) => {
        setDeletingUnit(unit);
        setIsDeleteOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formTitle.trim() || !formShortCode.trim()) {
            toast.error('عنوان و کد کوتاه الزامی است');
            return;
        }
        setFormLoading(true);
        try {
            if (editingUnit) {
                await apiService.admin.units.update(editingUnit.id, {
                    title: formTitle.trim(),
                    shortCode: formShortCode.trim(),
                    isDefault: formIsDefault,
                });
                toast.success('واحد با موفقیت ویرایش شد');
            } else {
                await apiService.admin.units.create({
                    title: formTitle.trim(),
                    shortCode: formShortCode.trim(),
                    isDefault: formIsDefault,
                });
                toast.success('واحد جدید با موفقیت ایجاد شد');
            }
            setIsFormOpen(false);
            await fetchUnits();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ذخیره واحد');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingUnit) return;
        setDeleteLoading(true);
        try {
            await apiService.admin.units.delete(deletingUnit.id);
            toast.success('واحد با موفقیت حذف شد');
            setIsDeleteOpen(false);
            setDeletingUnit(null);
            await fetchUnits();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در حذف واحد');
        } finally {
            setDeleteLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
            {/* هدر */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-on-surface">مدیریت واحدها</h1>
                    <p className="text-sm text-on-surface-variant mt-1">واحدهای خرید و فروش کالا</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative flex-1 sm:flex-none">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="جستجو..."
                            className="w-full sm:w-56 bg-surface-container-lowest border border-outline rounded-xl h-10 pr-9 pl-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        />
                    </div>
                    <button onClick={openCreate}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium flex-shrink-0">
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">افزودن واحد</span>
                    </button>
                </div>
            </div>

            {/* گرید واحدها */}
            {filteredUnits.length === 0 ? (
                <div className="text-center py-20 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/50">
                    <Ruler className="w-16 h-16 text-on-surface-variant/20 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-on-surface mb-2">
                        {search ? 'نتیجه‌ای یافت نشد' : 'هیچ واحدی تعریف نشده'}
                    </h3>
                    <p className="text-sm text-on-surface-variant mb-6">
                        {search ? 'با عبارت جستجو شده، واحدی پیدا نشد' : 'اولین واحد اندازه‌گیری را ایجاد کنید'}
                    </p>
                    {!search && (
                        <button onClick={openCreate}
                                className="px-6 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium">
                            ایجاد واحد جدید
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-6 gap-3">
                    {filteredUnits.map(unit => (
                        <div key={unit.id}
                             className="relative bg-surface-container-lowest border border-outline-variant/50 rounded-xl p-4 hover:shadow-md hover:border-primary/30 transition-all group flex flex-col items-center text-center gap-2">

                            {/* نشان پیش‌فرض */}

                            {/* کد کوتاه */}
                            <div className={cn(
                                "w-8 h-3 rounded-xl flex items-center justify-center text-lg font-bold transition-all",

                            )}>

                            </div>

                            {/* عنوان */}
                            <p className="text-sm font-medium text-on-surface leading-tight">{unit.title}</p>
                            <p className="text-[11px] text-on-surface-variant/50 font-mono">{unit.shortCode}</p>

                            {/* دکمه‌ها - دسکتاپ hover / موبایل همیشه */}
                            <div className="flex items-center gap-1 mt-1 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEdit(unit)}
                                        className="p-1.5 hover:bg-primary/10 hover:text-primary rounded-lg transition-colors">
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => openDelete(unit)}
                                        className="p-1.5 hover:bg-error/10 hover:text-error rounded-lg transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* مودال فرم */}
            {isFormOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
                            <h3 className="text-lg font-semibold text-on-surface">
                                {editingUnit ? 'ویرایش واحد' : 'افزودن واحد جدید'}
                            </h3>
                            <button onClick={() => setIsFormOpen(false)}
                                    className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors">
                                <X className="w-5 h-5 text-on-surface-variant" />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-on-surface block mb-1.5">عنوان <span className="text-error">*</span></label>
                                <input type="text" value={formTitle} onChange={e => setFormTitle(e.target.value)}
                                       placeholder="مثال: مترمربع" required
                                       className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-on-surface block mb-1.5">کد کوتاه <span className="text-error">*</span></label>
                                <input type="text" value={formShortCode} onChange={e => setFormShortCode(e.target.value)}
                                       placeholder="m²" required dir="ltr"
                                       className="w-full bg-surface-container-lowest border border-outline rounded-xl h-11 px-3 text-sm font-mono text-left focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none" />
                                <p className="text-[10px] text-on-surface-variant/60 mt-1">حداکثر ۵ کاراکتر</p>
                            </div>
                            <label className="flex items-center gap-3 py-1 cursor-pointer">
                                <input type="checkbox" checked={formIsDefault} onChange={e => setFormIsDefault(e.target.checked)}
                                       className="w-4 h-4 rounded border-outline text-primary focus:ring-0" />
                                <span className="text-sm text-on-surface">واحد پیش‌فرض</span>
                            </label>
                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={() => setIsFormOpen(false)}
                                        className="flex-1 h-11 border border-outline text-on-surface rounded-xl hover:bg-surface-container-low transition-colors text-sm font-medium">انصراف</button>
                                <button type="submit" disabled={formLoading}
                                        className="flex-1 h-11 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                                    {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingUnit ? 'ذخیره' : 'ایجاد'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* مودال حذف */}
            {isDeleteOpen && deletingUnit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant">
                        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
                            <h3 className="text-lg font-semibold text-on-surface">تأیید حذف</h3>
                            <button onClick={() => setIsDeleteOpen(false)}
                                    className="p-1.5 hover:bg-surface-container-high rounded-lg transition-colors">
                                <X className="w-5 h-5 text-on-surface-variant" />
                            </button>
                        </div>
                        <div className="p-5 space-y-4">
                            <p className="text-sm text-on-surface-variant">
                                آیا از حذف واحد <span className="font-semibold text-on-surface">«{deletingUnit.title}»</span> اطمینان دارید؟
                            </p>
                            <div className="flex gap-3">
                                <button onClick={() => setIsDeleteOpen(false)}
                                        className="flex-1 h-11 border border-outline text-on-surface rounded-xl hover:bg-surface-container-low transition-colors text-sm font-medium">انصراف</button>
                                <button onClick={handleDelete} disabled={deleteLoading}
                                        className="flex-1 h-11 bg-error text-on-error rounded-xl hover:bg-error/90 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                                    {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}حذف
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}