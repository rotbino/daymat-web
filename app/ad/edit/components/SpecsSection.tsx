// app/ad/edit/components/SpecsSection.tsx
'use client';

import React, { useState } from 'react';
import { Tag, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

interface SpecsSectionProps {
    specs: Record<string, string>;
    setSpecs: (specs: Record<string, string>) => void;
}

export function SpecsSection({ specs, setSpecs }: SpecsSectionProps) {
    const [enabled, setEnabled] = useState(Object.keys(specs).length > 0);
    const [key, setKey] = useState('');
    const [value, setValue] = useState('');
    const [hasUnit, setHasUnit] = useState(false);
    const [unit, setUnit] = useState('');

    const addSpec = () => {
        if (!key.trim() || !value.trim()) {
            toast.error('لطفاً نام و مقدار ویژگی را وارد کنید');
            return;
        }
        const finalValue = hasUnit && unit.trim() ? `${value.trim()} ${unit.trim()}` : value.trim();
        setSpecs({ ...specs, [key.trim()]: finalValue });
        setKey('');
        setValue('');
        setHasUnit(false);
        setUnit('');
    };

    const removeSpec = (k: string) => {
        const newSpecs = { ...specs };
        delete newSpecs[k];
        setSpecs(newSpecs);
        if (Object.keys(newSpecs).length === 0) setEnabled(false);
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm space-y-4">
            {/* هدر */}
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-primary" />
                    مشخصات فنی (اختیاری)
                </h3>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={enabled}
                        onChange={(e) => setEnabled(e.target.checked)}
                    />
                    <div className="w-12 h-7 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-primary/20 after:content-[''] after:absolute after:top-[3px] after:right-[3px] after:bg-white after:rounded-full after:h-[22px] after:w-[22px] after:transition-all after:shadow-sm peer-checked:bg-primary peer-checked:after:-translate-x-full" />
                </label>
            </div>

            {enabled && (
                <div className="space-y-4">
                    {/* جدول ویژگی‌ها (فقط اگر ویژگی وجود داشته باشد) */}
                    {Object.keys(specs).length > 0 && (
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400 w-1/3">نام ویژگی</th>
                                    <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400">مقدار</th>
                                    <th className="px-3 py-2 font-medium text-gray-600 dark:text-gray-400 w-12">حذف</th>
                                </tr>
                                </thead>
                                <tbody>
                                {Object.entries(specs).map(([k, v]) => (
                                    <tr key={k} className="border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                                        <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">{k}</td>
                                        <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{v}</td>
                                        <td className="px-3 py-2">
                                            <button
                                                onClick={() => removeSpec(k)}
                                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* فرم افزودن ویژگی جدید */}
                    <div className="flex flex-col gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex flex-wrap items-end gap-2">
                            <div className="flex-1 min-w-[80px]">
                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">نام ویژگی</label>
                                <input
                                    type="text"
                                    value={key}
                                    onChange={(e) => setKey(e.target.value)}
                                    className="w-full h-9 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    placeholder="مثلاً رنگ"
                                />
                            </div>
                            <div className="flex-1 min-w-[80px]">
                                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">مقدار</label>
                                <input
                                    type="text"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="w-full h-9 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                    placeholder="مثلاً سفید"
                                />
                            </div>
                            <div className="min-w-[50px]">
                                {!hasUnit ? (
                                    <label className="flex max-w-7 items-center gap-1 cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                                        <input
                                            type="checkbox"
                                            checked={hasUnit}
                                            onChange={(e) => setHasUnit(e.target.checked)}
                                            className="w-4 h-4 text-primary rounded border-gray-300 dark:border-gray-600 focus:ring-primary"
                                        />
                                        <span className="whitespace-nowrap">واحد</span>
                                    </label>
                                ) : (
                                    <div className="relative w-24">
                                        <input
                                            type="text"
                                            value={unit}
                                            onChange={(e) => setUnit(e.target.value)}
                                            className="w-full h-8 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-2 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all pr-8"
                                            placeholder="کیلوگرم"
                                        />
                                        <button
                                            onClick={() => {
                                                setHasUnit(false);
                                                setUnit('');
                                            }}
                                            className="absolute left-1 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={addSpec}
                            className="w-full sm:w-auto sm:self-end px-6 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            افزودن ویژگی
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}