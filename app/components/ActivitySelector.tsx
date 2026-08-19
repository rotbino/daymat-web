// components/common/ActivitySelector.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, Plus, XCircle, Briefcase, ChevronDown, Search, Loader2 } from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';

interface ActivitySelectorProps {
    value: string[]; // لیست شناسه فعالیت‌های انتخاب شده
    onChange: (activityIds: string[]) => void;
    max?: number;
    placeholder?: string;
    disabled?: boolean;
    error?: string;
    label?: string;
    required?: boolean;
    className?: string;
}

export function ActivitySelector({
                                     value = [],
                                     onChange,
                                     max = 5,
                                     placeholder = 'انتخاب فعالیت...',
                                     disabled = false,
                                     error,
                                     label = 'فعالیت‌های کسب‌وکار',
                                     required = false,
                                     className = '',
                                 }: ActivitySelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // ============================================================
    // ✅ دریافت لیست فعالیت‌ها از API
    // ============================================================
    const { data: allActivities, isLoading, refetch } = useQuery({
        queryKey: ['activities', 'leaves'],
        queryFn: () => apiService.activity.getLeaves(),
        staleTime: 1000 * 60 * 5, // 5 دقیقه کش
    });

    // ============================================================
    // ✅ فیلتر کردن بر اساس جستجو
    // ============================================================
    const filteredActivities = useMemo(() => {
        if (!allActivities) return [];
        if (!searchTerm.trim()) return allActivities;
        return allActivities.filter((a: any) =>
            a.title.includes(searchTerm.trim())
        );
    }, [allActivities, searchTerm]);

    // ============================================================
    // ✅ فعالیت‌های انتخاب شده (با اطلاعات کامل)
    // ============================================================
    const selectedActivities = useMemo(() => {
        if (!allActivities) return [];
        return allActivities.filter((a: any) => value.includes(a.id));
    }, [allActivities, value]);

    // ============================================================
    // ✅ فعالیت‌های قابل انتخاب (که انتخاب نشده‌اند)
    // ============================================================
    const availableActivities = useMemo(() => {
        if (!allActivities) return [];
        return allActivities.filter((a: any) => !value.includes(a.id));
    }, [allActivities, value]);

    // ============================================================
    // ✅ محدودیت
    // ============================================================
    const canAddMore = value.length < max;
    const isMaxReached = value.length >= max;

    // ============================================================
    // ✅ افزودن فعالیت
    // ============================================================
    const handleAdd = (activityId: string) => {
        if (isMaxReached) {
            toast.warning(`حداکثر ${max} فعالیت قابل انتخاب است`);
            return;
        }
        if (!value.includes(activityId)) {
            onChange([...value, activityId]);
            setSearchTerm('');
            setIsOpen(false);
        }
    };

    // ============================================================
    // ✅ حذف فعالیت
    // ============================================================
    const handleRemove = (activityId: string) => {
        onChange(value.filter(id => id !== activityId));
    };

    // ============================================================
    // ✅ ریست
    // ============================================================
    const handleClear = () => {
        onChange([]);
        setSearchTerm('');
    };

    // ============================================================
    // ✅ بستن مودال با کلیک خارج
    // ============================================================
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!target.closest('.activity-selector-container')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className={`activity-selector-container ${className}`}>
            {/* ============================================================
                لیبل
                ============================================================ */}
            {label && (
                <label className="font-label-md text-label-md text-on-surface-variant block mb-2">
                    {label}
                    {required && <span className="text-primary mr-1">*</span>}
                    <span className="text-[10px] text-on-surface-variant mr-2">
                        ({value.length} / {max})
                    </span>
                </label>
            )}

            {/* ============================================================
                نمایش فعالیت‌های انتخاب شده
                ============================================================ */}
            <div className="flex flex-wrap gap-2 mb-2 min-h-[40px] items-center">
                {selectedActivities.map((activity: any) => (
                    <div
                        key={activity.id}
                        className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1.5 text-xs rounded-full"
                    >
                        {activity.icon && <span className="text-base">{activity.icon}</span>}
                        <span>{activity.title}</span>
                        {!disabled && (
                            <button
                                type="button"
                                onClick={() => handleRemove(activity.id)}
                                className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"
                            >
                                <XCircle className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                ))}
                {value.length === 0 && (
                    <span className="text-xs text-on-surface-variant/50">
                        هیچ فعالیتی انتخاب نشده است
                    </span>
                )}
            </div>

            {/* ============================================================
                دکمه افزودن و سلکت
                ============================================================ */}
            <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                    <button
                        type="button"
                        onClick={() => {
                            if (!disabled) {
                                setIsOpen(!isOpen);
                                if (!isOpen) refetch();
                            }
                        }}
                        disabled={disabled || isMaxReached}
                        className={`w-full bg-surface-container-lowest border h-10 px-3 pr-10 text-sm text-right flex items-center justify-between transition-all ${
                            disabled || isMaxReached
                                ? 'opacity-50 cursor-not-allowed border-outline'
                                : isOpen
                                    ? 'border-primary ring-1 ring-primary'
                                    : 'border-outline hover:border-primary/50'
                        } ${error ? 'border-error' : ''}`}
                    >
                        <span className="text-on-surface-variant/60 text-sm">
                            {isMaxReached
                                ? `حداکثر ${max} فعالیت انتخاب شده`
                                : isLoading
                                    ? 'در حال بارگذاری...'
                                    : placeholder}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-on-surface-variant transition-transform duration-200 ${
                            isOpen ? 'rotate-180' : ''
                        }`} />
                    </button>

                    {/* ============================================================
                        مودال انتخاب (Drop Down)
                        ============================================================ */}
                    {isOpen && !disabled && !isMaxReached && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline-variant shadow-lg z-50 max-h-[250px] flex flex-col">
                            {/* جستجو */}
                            <div className="p-2 border-b border-outline-variant">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="جستجوی فعالیت..."
                                        className="w-full bg-surface-container-lowest border border-outline h-8 px-3 pr-8 text-sm text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                                        autoFocus
                                    />
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                                </div>
                            </div>

                            {/* لیست فعالیت‌ها */}
                            <div className="overflow-y-auto flex-1 p-1">
                                {isLoading ? (
                                    <div className="flex items-center justify-center py-4">
                                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                                    </div>
                                ) : availableActivities.length === 0 ? (
                                    <div className="text-center py-4 text-sm text-on-surface-variant">
                                        {searchTerm
                                            ? 'هیچ فعالیتی با این جستجو یافت نشد'
                                            : 'همه فعالیت‌ها انتخاب شده‌اند'}
                                    </div>
                                ) : (
                                    availableActivities.map((activity: any) => (
                                        <button
                                            key={activity.id}
                                            type="button"
                                            onClick={() => handleAdd(activity.id)}
                                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-right hover:bg-primary/5 rounded-lg transition-colors"
                                        >
                                            {activity.icon && <span className="text-base">{activity.icon}</span>}
                                            <span className="flex-1">{activity.title}</span>
                                            {activity.path && (
                                                <span className="text-[10px] text-on-surface-variant/40">
                                                    {activity.path}
                                                </span>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>

                            {/* فوتر */}
                            <div className="p-2 border-t border-outline-variant flex justify-between text-xs text-on-surface-variant/50">
                                <span>{availableActivities.length} فعالیت موجود</span>
                                <span>{value.length} / {max} انتخاب شده</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* دکمه پاک کردن */}
                {value.length > 0 && !disabled && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="flex items-center justify-center w-10 h-10 border border-error/30 text-error hover:bg-error/5 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* خطا */}
            {error && <p className="text-error text-xs mt-1">{error}</p>}

            {/* راهنما */}
            <p className="text-[11px] text-on-surface-variant/60 mt-1">
               انتخاب دقیق فعالیت مساوی اتصال به خریداران و تامین کنندگان دقیق
            </p>
        </div>
    );
}