// app/admin/arm/components/EconomySection.tsx
'use client';

import React, { useState } from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { Save, Loader2, Check, Coins, Gift, UserPlus, CalendarCheck, MessageSquare, Eye, AlertCircle, Percent, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EconomySectionProps {
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    onSave?: () => void;
    isSaving?: boolean;
    isAdmin?: boolean; // ← اضافه شد
}

export function EconomySection({ watch, setValue, onSave, isSaving, isAdmin = false }: EconomySectionProps) {
    const [saved, setSaved] = useState(false);
    const economy = watch('config.economy') || {};
    const setEconomy = (key: string, value: any) => setValue('config.economy', { ...economy, [key]: value });
    const creditRules = economy.creditRules || {};
    const setCreditRule = (key: string, value: any) => setValue('config.economy.creditRules', { ...creditRules, [key]: value });

    // ✅ گرفتن دسترسی از armAdminPermission
    const armAdminPermission = watch('config.armAdminPermission') || {};
    const economyAccess = armAdminPermission.economy || {};

    const canEdit = isAdmin || economyAccess.canEdit === true;
    const canViewDaymatShare = isAdmin || economyAccess.canViewDaymatShare !== false;

    const handleSave = () => { onSave?.(); setSaved(true); setTimeout(() => setSaved(false), 2000); };

    const currencyOptions = [
        { value: 'IRR', label: 'تومان (IRR)', symbol: 'تومان' },
        { value: 'IRR1', label: 'ریال (IRR1)', symbol: 'ریال' },
        { value: 'USD', label: 'دلار (USD)', symbol: '$' },
        { value: 'EUR', label: 'یورو (EUR)', symbol: '€' },
        { value: 'AED', label: 'درهم (AED)', symbol: 'د.إ' },
        { value: 'TRY', label: 'لیر (TRY)', symbol: '₺' },
    ];

    const bonusRules = [
        { key: 'signupBonus', label: 'هدیه ثبت‌نام', hint: 'اعتبار هدیه به کاربر جدید', icon: Gift },
        { key: 'referralBonus', label: 'پاداش دعوت', hint: 'اعتبار برای دعوت هر کاربر جدید', icon: UserPlus },
        { key: 'dailyLoginBonus', label: 'پاداش ورود روزانه', hint: 'اعتبار برای ورود روزانه به سایت', icon: CalendarCheck },
        { key: 'commentBonus', label: 'پاداش ثبت نظر', hint: 'اعتبار برای هر نظر در آگهی‌ها', icon: MessageSquare },
        { key: 'adViewBonus', label: 'پاداش بازدید آگهی', hint: 'اعتبار برای هر بازدید از آگهی', icon: Eye },
    ];

    const daymatShare = economy.daymatShare ?? 30;

    return (
        <div className="space-y-6">
            {/* هدر */}
            <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-xl border border-outline-variant">
                <div>
                    <h3 className="text-lg font-semibold text-on-surface flex items-center gap-2">
                        <Coins className="w-5 h-5 text-primary" />
                        تنظیمات اقتصادی
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                        {isAdmin ? 'واحد پول، قوانین اعتبارات و سهم درآمدی بازار' : 'واحد پول و سهم درآمدی بازار'}
                    </p>
                </div>
                {canEdit && (
                    <button type="button" onClick={handleSave} disabled={isSaving}
                            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                        {isSaving ? 'ذخیره' : saved ? 'ذخیره شد' : 'ذخیره'}
                    </button>
                )}
            </div>

            {/* ═══════════ سهم Daymat از درآمد بازار ═══════════ */}
            <div className={cn(
                "bg-amber-50/50 dark:bg-amber-900/20 border rounded-xl p-5",
                isAdmin ? 'border-amber-200 dark:border-amber-800' : 'border-amber-200/50 dark:border-amber-800/50'
            )}>
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Percent className={cn(
                            "w-5 h-5",
                            isAdmin ? 'text-amber-600 dark:text-amber-400' : 'text-amber-500/70 dark:text-amber-400/70'
                        )} />
                        <div>
                            <h4 className="font-semibold text-sm text-on-surface">سهم Daymat از درآمد بازار</h4>
                            <p className="text-[10px] text-on-surface-variant/60">
                                درصدی که از درآمد بازار به Daymat تعلق می‌گیرد
                            </p>
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">
                        {daymatShare}%
                    </div>
                </div>

                {/* ویرایش برای مدیر سیستم */}
                {isAdmin && (
                    <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-800/50">
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-medium text-on-surface-variant/70 dark:text-gray-400">
                                تغییر درصد:
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={daymatShare}
                                onChange={(e) => setEconomy('daymatShare', parseInt(e.target.value) || 0)}
                                className="w-24 bg-white dark:bg-gray-800 border border-amber-300 dark:border-amber-700 rounded-lg h-9 px-3 text-sm text-center focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 outline-none transition-all"
                            />
                            <span className="text-sm text-on-surface-variant/60 dark:text-gray-500">درصد</span>
                            <span className="text-[10px] text-on-surface-variant/40 dark:text-gray-600">پیش‌فرض: ۳۰%</span>
                        </div>
                        <p className="text-[10px] text-amber-600/70 dark:text-amber-400/70 mt-1">
                            این درصد از هر تراکنش مالی در بازار به عنوان کارمزد به Daymat تعلق می‌گیرد.
                        </p>
                    </div>
                )}

                {/* نمایش برای مالک بازار */}
                {!isAdmin && (
                    <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-800/50">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] text-on-surface-variant/60">سهم شما (پس از کسر سهم Daymat)</span>
                            <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                {100 - daymatShare}%
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-600/70 dark:text-amber-400/70">
                            <Lock className="w-3 h-3" />
                            <span>این درصد توسط مدیر سیستم تعیین شده است و قابل تغییر نمی‌باشد.</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══════════ واحد پول ═══════════════ */}
            <div className={cn(
                "bg-surface-container-low p-5 rounded-xl border border-outline-variant",
                !isAdmin && 'opacity-80'
            )}>
                <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-primary" />
                    واحد پول بازار شما
                    {!isAdmin && <span className="text-[9px] text-on-surface-variant/40">(فقط مشاهده)</span>}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {currencyOptions.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => isAdmin && setEconomy('currency', opt.value)}
                            disabled={!isAdmin}
                            className={cn(
                                "p-3 rounded-xl border-2 text-center transition-all",
                                (economy.currency || 'IRR') === opt.value
                                    ? 'border-primary bg-primary/5 shadow-sm'
                                    : 'border-outline-variant/30 hover:border-primary/30',
                                !isAdmin && 'cursor-default opacity-70'
                            )}
                        >
                            <p className="text-lg font-bold text-on-surface">{opt.symbol}</p>
                            <p className="text-xs text-on-surface-variant mt-1">{opt.label}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══════════ قوانین اعتبار - فقط مدیر سیستم ═══════════ */}
            {isAdmin && (
                <div className="bg-surface-container-low p-5 rounded-xl border border-outline-variant">
                    <h4 className="text-sm font-semibold mb-1 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-primary" />
                        قوانین اعتبارات
                    </h4>
                    <p className="text-xs text-on-surface-variant mb-4">اعتباراتی که کاربران از طریق فعالیت‌های مختلف دریافت می‌کنند</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {bonusRules.map(rule => {
                            const Icon = rule.icon;
                            const value = creditRules[rule.key] ?? 0;
                            return (
                                <div key={rule.key} className="bg-surface-container-lowest rounded-xl border border-outline-variant/20 p-3 flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                        <Icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-on-surface">{rule.label}</p>
                                        <p className="text-[10px] text-on-surface-variant/60 truncate">{rule.hint}</p>
                                    </div>
                                    <input type="number" value={value} min={0}
                                           onChange={e => setCreditRule(rule.key, parseInt(e.target.value) || 0)}
                                           className="max-w-20 bg-surface border border-outline rounded-lg h-8 px-2 text-sm text-center focus:ring-1 focus:ring-primary/30 outline-none flex-shrink-0" />
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══════════ نکته - فقط مدیر سیستم ═══════════ */}
            {isAdmin && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="text-xs text-on-surface-variant">
                        <p className="font-medium text-primary mb-1">نحوه دریافت اعتبار توسط کاربران:</p>
                        <ul className="space-y-1 list-disc list-inside">
                            <li><span className="font-medium">هدیه:</span> اعتبار رایگان در مناسبت‌های خاص (ثبت‌نام، هدیه)</li>
                            <li><span className="font-medium">خرید:</span> کاربر با پرداخت آنلاین یا کارت به کارت اعتبار می‌خرد</li>
                            <li><span className="font-medium">فعالیت:</span> پاداش فعالیت‌های مفید مانند ثبت نظر یا بازدید آگهی</li>
                        </ul>
                        <p className="mt-2">هزینه نردبان و سایر مصرف‌ها در تنظیمات هر ماژول (مثلاً تابلوی قیمت) تعیین می‌شود.</p>
                    </div>
                </div>
            )}
        </div>
    );
}