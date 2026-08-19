// app/admin/arm/components/FormLabelsSection.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Save, Loader2, Check, Search, X, Tag, Trash2, Pencil, AlertCircle, Info, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface FormLabelsSectionProps {
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    onSave?: () => void;
    isSaving?: boolean;
    isAdmin?: boolean;
}

export function FormLabelsSection({ watch, setValue, onSave, isSaving, isAdmin = false }: FormLabelsSectionProps) {
    const [saved, setSaved] = useState(false);
    const [search, setSearch] = useState('');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newKey, setNewKey] = useState('');
    const [newValue, setNewValue] = useState('');

    // گرفتن برچسب‌ها از config
    const labels = watch('config.formLabels') || {};

    // گرفتن دسترسی از armAdminPermission
    const armAdminPermission = watch('config.armAdminPermission') || {};
    const formLabelsAccess = armAdminPermission.formLabels || {};
    const canEdit = isAdmin || formLabelsAccess.canEdit === true;

    const handleSave = () => {
        if (!canEdit) return;
        onSave?.();
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const setLabel = (key: string, value: string) => {
        if (!canEdit) return;
        setValue('config.formLabels', { ...labels, [key]: value });
    };

    const removeLabel = (key: string) => {
        if (!isAdmin) return; // فقط ادمین
        const updated = { ...labels };
        delete updated[key];
        setValue('config.formLabels', updated);
    };

    const startEdit = (key: string, currentValue: string) => {
        if (!canEdit) return;
        setEditingKey(key);
        setEditValue(currentValue);
    };

    const saveEdit = () => {
        if (editingKey) {
            if (editValue.trim()) {
                setLabel(editingKey, editValue.trim());
            } else {
                removeLabel(editingKey);
            }
            setEditingKey(null);
        }
    };

    const handleDelete = (key: string) => {
        removeLabel(key);
        setDeleteConfirm(null);
        toast.success('برچسب حذف شد');
    };

    const handleAddKey = () => {
        if (!isAdmin) return;
        if (!newKey.trim()) {
            toast.error('کلید را وارد کنید');
            return;
        }
        if (labels[newKey.trim()]) {
            toast.error('این کلید قبلاً وجود دارد');
            return;
        }
        setLabel(newKey.trim(), newValue.trim() || '');
        setNewKey('');
        setNewValue('');
        setShowAddModal(false);
        toast.success('برچسب جدید اضافه شد');
    };

    // فیلتر بر اساس جستجو
    const filteredEntries = useMemo(() => {
        const entries = Object.entries(labels);
        if (!search.trim()) return entries;
        const q = search.toLowerCase();
        return entries.filter(([k, v]) =>
            k.toLowerCase().includes(q) || v.toLowerCase().includes(q)
        );
    }, [labels, search]);

    return (
        <div className="space-y-6">
            {/* ⭐ توضیحات */}
            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="text-xs text-blue-700/80 dark:text-blue-400/80 mt-0.5">
                        با برچسب‌ها می‌توانید، روی فرمها از کلمات و جملات مناسبتری، برای بازار تخصصی خود استفاده کنید
                        {!canEdit && ' (فقط قابل مشاهده)'}
                    </p>
                </div>
            </div>

            {/* هدر */}
            <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                <div>
                    <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                        <Tag className="w-5 h-5 text-primary" />
                        برچسب‌های فرم‌ها
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                        {canEdit ? 'ویرایش برچسب‌های فرم‌ها' : 'فقط قابل مشاهده'}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-1.5 px-3 py-2 bg-surface border border-outline rounded-lg text-xs font-medium hover:bg-surface-container-low transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            افزودن برچسب
                        </button>
                    )}
                    {canEdit && (
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-medium hover:bg-primary/90 disabled:opacity-50"
                        >
                            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                            {isSaving ? 'در حال ذخیره...' : saved ? 'ذخیره شد' : 'ذخیره'}
                        </button>
                    )}
                </div>
            </div>

            {/* پیام هشدار برای مالک بدون دسترسی */}
            {!canEdit && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                        ویرایش برچسب‌ها فقط توسط مدیر سیستم قابل انجام است.
                        در صورت نیاز به تغییر، با پشتیبانی Daymat تماس بگیرید.
                    </p>
                </div>
            )}

            {/* جستجو - آیکون در سمت چپ */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="جستجوی کلید یا مقدار..."
                    className="w-full bg-surface-container-lowest border border-outline rounded-xl h-10 pr-4 pl-10 text-sm focus:ring-1 focus:ring-primary/30 outline-none"
                />
            </div>

            {/* لیست برچسب‌ها */}
            <div className="bg-surface-container-low rounded-xl border border-outline-variant/30 overflow-hidden">
                <div className="px-4 py-2.5 bg-surface-container-low border-b border-outline-variant/20 flex items-center justify-between">
                    <span className="text-sm font-semibold">تمام برچسب‌ها</span>
                    <span className="text-xs text-on-surface-variant">{filteredEntries.length} مورد</span>
                </div>
                <div className="divide-y divide-outline-variant/10 max-h-[500px] overflow-y-auto">
                    {filteredEntries.length === 0 ? (
                        <div className="text-center py-12 text-sm text-on-surface-variant">
                            {search ? 'موردی یافت نشد' : 'هیچ برچسبی تعریف نشده است'}
                        </div>
                    ) : (
                        filteredEntries.map(([key, value]) => (
                            <div key={key} className="px-4 py-2.5 flex items-center gap-3 hover:bg-surface-container-low transition-colors group">
                                <div className="w-2/5 min-w-0">
                                    <p className="text-xs font-mono text-on-surface-variant/60 truncate">{key}</p>
                                </div>
                                <div className="flex-1 min-w-0">
                                    {editingKey === key && canEdit ? (
                                        <input
                                            type="text"
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            onBlur={saveEdit}
                                            onKeyDown={e => e.key === 'Enter' && saveEdit()}
                                            autoFocus
                                            className="w-full bg-surface border border-primary rounded-lg h-8 px-2 text-xs focus:ring-1 focus:ring-primary/30 outline-none"
                                        />
                                    ) : (
                                        <p
                                            className={cn(
                                                "text-sm truncate",
                                                canEdit ? "cursor-pointer hover:text-primary" : ""
                                            )}
                                            onClick={() => startEdit(key, value)}
                                        >
                                            {value}
                                        </p>
                                    )}
                                </div>
                                {canEdit && (
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        {/* دکمه ویرایش - برای همه کاربران با دسترسی */}
                                        <button
                                            onClick={() => startEdit(key, value)}
                                            className="p-1 hover:bg-primary/10 rounded"
                                            title="ویرایش"
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        {/* دکمه حذف - فقط برای ادمین */}
                                        {isAdmin && (
                                            <button
                                                onClick={() => setDeleteConfirm(key)}
                                                className="p-1 hover:bg-error/10 rounded"
                                                title="حذف"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* مودال افزودن برچسب جدید - فقط برای ادمین */}
            {showAddModal && isAdmin && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface w-full max-w-md rounded-2xl shadow-2xl border border-outline-variant">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <h3 className="text-lg font-semibold">افزودن برچسب جدید</h3>
                            <button onClick={() => setShowAddModal(false)} className="p-1.5 hover:bg-surface-container-high rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-xs text-on-surface-variant block mb-1">کلید (انگلیسی)</label>
                                <input
                                    type="text"
                                    value={newKey}
                                    onChange={e => setNewKey(e.target.value)}
                                    placeholder="مثال: custom.field.label"
                                    dir="ltr"
                                    className="w-full bg-surface-container-lowest border border-outline rounded-xl h-10 px-3 text-sm font-mono focus:ring-1 focus:ring-primary/30 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-on-surface-variant block mb-1">مقدار</label>
                                <input
                                    type="text"
                                    value={newValue}
                                    onChange={e => setNewValue(e.target.value)}
                                    placeholder="متن برچسب"
                                    className="w-full bg-surface-container-lowest border border-outline rounded-xl h-10 px-3 text-sm focus:ring-1 focus:ring-primary/30 outline-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => setShowAddModal(false)} className="flex-1 h-10 border border-outline rounded-xl text-sm">انصراف</button>
                                <button onClick={handleAddKey} className="flex-1 h-10 bg-primary text-on-primary rounded-xl text-sm font-medium">افزودن</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* مودال تأیید حذف - فقط برای ادمین */}
            {deleteConfirm && isAdmin && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-surface w-full max-w-sm rounded-2xl shadow-2xl border border-outline-variant">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <h3 className="text-lg font-semibold">تأیید حذف</h3>
                            <button onClick={() => setDeleteConfirm(null)} className="p-1.5 hover:bg-surface-container-high rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-sm">
                                آیا از حذف برچسب <span className="font-mono text-xs bg-surface-container-high px-1.5 py-0.5 rounded">{deleteConfirm}</span> اطمینان دارید؟
                            </p>
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => setDeleteConfirm(null)} className="flex-1 h-10 border border-outline rounded-xl text-sm">انصراف</button>
                                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 h-10 bg-error text-on-error rounded-xl text-sm">حذف</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}