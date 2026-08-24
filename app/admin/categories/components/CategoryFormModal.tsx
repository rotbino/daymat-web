// app/admin/categories/components/CategoryFormModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, FolderPlus } from 'lucide-react';
import { CategoryNode } from '../page';
import { cn } from '@/lib/utils';

interface CategoryFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    category: CategoryNode | null;
    parentCategory: CategoryNode | null;
    loading: boolean;
}

export function CategoryFormModal({
                                      isOpen,
                                      onClose,
                                      onSubmit,
                                      category,
                                      parentCategory,
                                      loading
                                  }: CategoryFormModalProps) {
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [icon, setIcon] = useState('📦');
    const [description, setDescription] = useState('');
    const [example, setExample] = useState('');
    const [defaultMinQuantity, setDefaultMinQuantity] = useState<number | undefined>(undefined);
    const [titleEn, setTitleEn] = useState('');

    const isEdit = !!category;
    const isChild = !!parentCategory;

    useEffect(() => {
        if (isOpen) {
            if (category) {
                setTitle(category.title || '');
                setSlug(category.slug || '');
                setIcon(category.icon || '📦');
                setDescription(category.description || '');
                setExample(category.example || '');
                setDefaultMinQuantity(category.defaultMinQuantity || undefined);
                setTitleEn(category.titleEn || '');
            } else {
                setTitle('');
                setSlug('');
                setIcon('📦');
                setDescription('');
                setExample('');
                setDefaultMinQuantity(undefined);
                setTitleEn('');
            }
        }
    }, [isOpen, category]);

    const handleTitleChange = (value: string) => {
        setTitle(value);
        if (!isEdit) {
            setSlug(value
                .replace(/\s+/g, '-')
                .replace(/[^\w\u0600-\u06FF-]/g, '')
                .toLowerCase()
            );
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            title,
            slug,
            icon,
            description,
            example,
            defaultMinQuantity,
            titleEn,
        });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-gray-900 z-10 rounded-t-3xl sm:rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            isChild
                                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                                : isEdit
                                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                                    : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
                        )}>
                            {isChild ? <FolderPlus className="w-5 h-5" /> : <X className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                {isChild ? `زیرگروه ${parentCategory?.title}` : isEdit ? 'ویرایش گروه' : 'گروه جدید'}
                            </h3>
                            {isChild && (
                                <p className="text-xs text-gray-500">این گروه زیرمجموعه گروه بالا خواهد بود</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-5">
                    {/* Title */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                            عنوان فارسی <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => handleTitleChange(e.target.value)}
                            placeholder="مثال: مصالح ساختمانی"
                            required
                            autoFocus
                            className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all"
                        />
                    </div>

                    {/* Title English */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                            عنوان انگلیسی
                        </label>
                        <input
                            type="text"
                            value={titleEn}
                            onChange={e => setTitleEn(e.target.value)}
                            placeholder="e.g., Construction Materials"
                            dir="ltr"
                            className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all text-left"
                        />
                    </div>

                    {/* Slug */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
                            شناسه یکتا (slug) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={slug}
                            onChange={e => setSlug(e.target.value)}
                            placeholder="masaleh-sakhtemani"
                            required
                            dir="ltr"
                            className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm font-mono focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all text-left"
                        />
                        <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                            فقط حروف، اعداد و خط تیره. از عنوان فارسی خودکار تولید می‌شود
                        </p>
                    </div>

                    {/* Icon */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">آیکون</label>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center justify-center text-2xl border-2 border-dashed border-gray-200 dark:border-gray-600">
                                {icon}
                            </div>
                            <input
                                type="text"
                                value={icon}
                                onChange={e => setIcon(e.target.value)}
                                placeholder="اموجی یا نام آیکون"
                                className="flex-1 h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all"
                            />
                        </div>
                        {/* Quick Icons */}
                        <div className="flex flex-wrap gap-2 mt-3">
                            {['📦', '🏗️', '🧱', '🔧', '⚡', '🚗', '📱', '👔', '🌾', '💊', '🏠', '🛋️', '🍽️', '🧴', '⚙️', '📊'].map(emoji => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => setIcon(emoji)}
                                    className={cn(
                                        "w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all border-2",
                                        icon === emoji
                                            ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 scale-110"
                                            : "border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    )}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">توضیحات</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            rows={3}
                            placeholder="توضیحات مختصر درباره این دسته‌بندی..."
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all resize-none"
                        />
                    </div>

                    {/* Example & Min Quantity in one row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">مثال</label>
                            <input
                                type="text"
                                value={example}
                                onChange={e => setExample(e.target.value)}
                                placeholder="مثال: سیمان تیپ ۲"
                                className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">حداقل سفارش</label>
                            <input
                                type="number"
                                value={defaultMinQuantity ?? ''}
                                onChange={e => setDefaultMinQuantity(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="مثال: 10"
                                className="w-full h-12 px-4 bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm font-medium"
                        >
                            انصراف
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isChild ? 'ایجاد زیرگروه' : isEdit ? 'ذخیره تغییرات' : 'ایجاد گروه'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}