// app/admin/arm/components/MarketModulesSection.tsx
'use client';

import React, { useState } from 'react';
import { UseFormWatch, UseFormSetValue } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BookOpen, ClipboardList, Tags, ShoppingCart, ChevronDown,
    Eye, Phone, Shield, Star, Clock, Package, TrendingUp, Check,
    AlertCircle, Edit2, CreditCard, Layers, LayoutGrid, Handshake, Users,
    ExternalLink, Lock, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * ✅ «ماژول‌های بازار» — نسخهٔ تمیز و مرتب تب ماژول‌ها (درخواست مالک):
 *    از بالا به پایین، همیشه با همین ترتیب:
 *      ۱. ماژول بازوی فروش قیمت      (همیشه فعال — فقط تنظیم دارد)
 *      ۲. ماژول بازوی خرید      (همیشه فعال — همان «تابلوی خریدِ» هر خریدار)
 *      ۳. ماژول دیوار فروشندگان   (قابل خاموش‌کردن — تابلوی قیمت)
 *      ۴. ماژول دیوار خریداران    (قابل خاموش‌کردن — بازوی خرید بازار)
 *    • همهٔ کارت‌ها به‌صورت پیش‌فرض بسته‌اند؛ با کلیک روی آیکون دراپ (یا عنوان) با اسلاید باز می‌شوند.
 *    • کلیدهای کانفیگ عوض نشده‌اند: catalog / buyLead (دو کارت خریدار) / priceTable
 */

// ─────────────────────────────── تایپ‌ها ───────────────────────────────
type RuleNode = {
    key: string;
    label: string;
    hint?: string;
    icon?: string;
    isNumber?: boolean;
    min?: number;
    max?: number;
    suffix?: string;
    defaultValue?: boolean | number; // مقدار پیش‌فرض (بولی یا عددی) وقتی هنوز ست نشده
    children?: RuleNode[];
    hasToggle?: boolean;
};

type RuleGroup = {
    groupTitle: string;
    groupIcon: string;
    rules: RuleNode[];
};

type Accent = 'primary' | 'amber';

type ModuleDef = {
    key: string;           // کلید کارت
    title: string;         // نام ماژول
    sub: string;           // توضیح یک‌خطی
    icon: React.ComponentType<{ className?: string }>;
    accent: Accent;
    configKey: string;     // کلید واقعی در config.modules
    alwaysOn?: boolean;    // بازوهای فروش همیشه فعال‌اند و سوییچ ندارند
    groups: RuleGroup[];
};

// ─────────────────────────────── آیکون‌ها و رنگ‌ها ───────────────────────────────
const ICON_MAP: Record<string, any> = {
    Eye, Shield, Phone, Check, Edit2, Star, Clock, Package, TrendingUp,
    CreditCard, Layers, LayoutGrid, BookOpen, Handshake, Users,
};

const ACCENTS: Record<Accent, {
    tile: string;
    tileOff: string;
    switchOn: string;
    groupIcon: string;
    activeBox: string;
}> = {
    primary: {
        tile: 'bg-primary/10 text-primary',
        tileOff: 'bg-surface-container-high/70 text-on-surface-variant/40',
        switchOn: 'bg-primary after:translate-x-4',
        groupIcon: 'text-primary',
        activeBox: 'bg-primary/5 border-primary/25',
    },
    amber: {
        tile: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        tileOff: 'bg-surface-container-high/70 text-on-surface-variant/40',
        switchOn: 'bg-amber-500 after:translate-x-4',
        groupIcon: 'text-amber-600 dark:text-amber-400',
        activeBox: 'bg-amber-500/5 border-amber-500/25',
    },
};

// ─────────────────────────────── تعریف ۴ ماژول (ترتیب ثابت) ───────────────────────────────
const MODULES: ModuleDef[] = [
    // ۱ ── ماژول بازوی فروش قیمت (همیشه فعال)
    {
        key: 'catalog',
        title: 'بازوی فروش قیمت',
        sub: 'بازوی فروش هر فروشنده — سقف‌ها، عضوگیری و چندفروشندگی',
        icon: BookOpen,
        accent: 'primary',
        configKey: 'catalog',
        alwaysOn: true,
        groups: [
            {
                groupTitle: 'سقف‌های بازوی فروش',
                groupIcon: 'Layers',
                rules: [
                    {
                        key: 'freeAdLimit',
                        label: 'حداکثر تعداد آگهی رایگان',
                        hint: 'سهمیه آگهی رایگان هر بازوی فروش در این بازار',
                        icon: 'Star',
                        isNumber: true,
                        min: 0,
                        max: 1000,
                        suffix: 'عدد',
                    },
                    {
                        key: 'maxAdsPerCatalog',
                        label: 'حداکثر آگهی روی هر بازوی فروش',
                        hint: 'سقف آگهی همزمان برای هر بازوی فروش',
                        icon: 'Package',
                        isNumber: true,
                        min: 0,
                        max: 10000,
                        suffix: 'عدد',
                    },
                    {
                        key: 'maxFreeCatalogs',
                        label: 'حداکثر بازوی فروش رایگان هر کاربر',
                        hint: 'بیش از این تعداد، ایجاد بازوی فروش اعتباری می‌شود',
                        icon: 'BookOpen',
                        isNumber: true,
                        min: 0,
                        max: 1000,
                        suffix: 'عدد',
                    },
                ],
            },
            {
                groupTitle: 'درخواست ارتباط (عضوگیری)',
                groupIcon: 'Handshake',
                rules: [
                    {
                        key: 'connectionRequest',
                        label: 'سهمیه و هزینهٔ درخواست ارتباط',
                        hint: 'سهمیهٔ رایگان به ازای هر شخص است و روی همهٔ بازوهای فروش و کسب‌وکارهایش شمرده می‌شود — پس از پایان سهمیه، هر درخواست اعتبار مصرف می‌کند',
                        icon: 'CreditCard',
                        children: [
                            {
                                key: 'freeRequestQuota',
                                label: 'درخواست رایگان هر شخص',
                                hint: 'روی همهٔ بازوهای فروشی او',
                                icon: 'Handshake',
                                isNumber: true,
                                min: 0,
                                max: 100000,
                                suffix: 'عدد',
                            },
                            {
                                key: 'creditCost',
                                label: 'اعتبار هر درخواست پس از سهمیه',
                                icon: 'CreditCard',
                                isNumber: true,
                                min: 0,
                                max: 10000,
                                suffix: 'اعتبار',
                            },
                            {
                                key: 'referrerSharePercent',
                                label: 'سهم دعوت‌کننده',
                                hint: 'درصدی از درآمد درخواست‌های ارتباطی، به کیف پول کسی که آن کاربر را به دیمت آورده',
                                icon: 'Users',
                                isNumber: true,
                                min: 0,
                                max: 100,
                                suffix: 'درصد',
                            },
                        ],
                    },
                ],
            },
            {
                groupTitle: 'تنظیمات بازوی فروش',
                groupIcon: 'Shield',
                rules: [
                    {
                        key: 'multiSeller',
                        label: 'چندفروشندگی',
                        hint: 'امکان تعریف چند فروشنده برای یک بازوی فروش — همه بازوهای فروش از بازار به ارث می‌برند (مالک بازار می‌تواند برای بازوی فروش خاص اورایت کند)',
                        icon: 'Shield',
                        defaultValue: true,
                    },
                ],
            },
        ],
    },

    // ۲ ── ماژول بازوی خرید (همیشه فعال) — همان «تابلوی خریدِ» هر خریدار
    {
        key: 'buyLeadBoard',
        title: 'بازوی خرید',
        sub: 'تابلوی خریدِ هر خریدار — درخواست‌های همکاری',
        icon: ClipboardList,
        accent: 'amber',
        configKey: 'buyLead',
        alwaysOn: true,
        groups: [
            {
                groupTitle: 'سقف‌ها',
                groupIcon: 'Layers',
                rules: [
                    {
                        key: 'maxFreeRequests',
                        label: 'حداکثر درخواست همکاری رایگان',
                        hint: 'سهمیهٔ رایگان درخواست‌های همکاری هر خریدار در این بازار',
                        icon: 'Star',
                        isNumber: true,
                        min: 0,
                        max: 1000,
                        suffix: 'عدد',
                        defaultValue: 50,
                    },
                    {
                        key: 'maxActiveRequestsPerUser',
                        label: 'حداکثر درخواست فعال',
                        hint: 'سقف درخواست‌های هم‌زمانِ فعال هر خریدار',
                        icon: 'Package',
                        isNumber: true,
                        min: 1,
                        max: 50,
                        suffix: 'عدد',
                    },
                ],
            },
            {
                groupTitle: 'دسترسی',
                groupIcon: 'Shield',
                rules: [
                    {
                        key: 'requireMembershipToSubmit',
                        label: 'پیوستن به بازار برای ثبت درخواست',
                        hint: 'فقط اعضای بازار بتوانند درخواست همکاری ثبت کنند',
                        icon: 'Shield',
                    },
                ],
            },
        ],
    },

    // ۳ ── ماژول دیوار فروشندگان (قابل خاموش‌کردن) — تابلوی قیمت
    {
        key: 'priceTable',
        title: 'دیوار فروشندگان',
        sub: 'تابلوی قیمت — صفحهٔ اول بازار',
        icon: Tags,
        accent: 'primary',
        configKey: 'priceTable',
        groups: [
            {
                groupTitle: 'دسترسی و نمایش',
                groupIcon: 'Eye',
                rules: [
                    {
                        key: 'requireLoginToViewPrices',
                        label: 'مشاهده قیمت فقط برای اعضای سایت',
                        hint: 'کاربر مهمان قیمت‌ها را نمی‌بیند',
                        icon: 'Eye',
                    },
                    {
                        key: 'requireMembershipToCall',
                        label: 'تماس فقط برای اعضای بازار',
                        hint: 'دکمه تماس فقط برای اعضا فعال است',
                        icon: 'Phone',
                    },
                    {
                        key: 'allowAnonymousPublishing',
                        label: 'انتشار ناشناس آگهی',
                        hint: 'فروشنده بدون نمایش نام کسب‌وکار آگهی دهد',
                        icon: 'Shield',
                    },
                    {
                        key: 'approval',
                        label: 'نیاز به تایید',
                        icon: 'Check',
                        children: [
                            {
                                key: 'requiresApprovalOnCreate',
                                label: 'در زمان ثبت',
                                hint: 'آگهی پس از ثبت نیاز به تایید مدیر دارد',
                            },
                            {
                                key: 'editApproval',
                                label: 'بعد از ویرایش',
                                hint: 'آگهی پس از ویرایش نیاز به تایید مدیر دارد',
                                icon: 'Edit2',
                                hasToggle: true,
                                children: [
                                    { key: 'title', label: 'عنوان آگهی' },
                                    { key: 'description', label: 'توضیحات' },
                                    { key: 'images', label: 'تصاویر' },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                groupTitle: 'سهمیه آگهی رایگان',
                groupIcon: 'Layers',
                rules: [
                    {
                        key: 'maxTotalFreeAdPerUser',
                        label: 'سهمیه کل آگهی رایگان',
                        hint: 'مجموع آگهی‌هایی که کاربر می‌تواند رایگان ثبت کند',
                        icon: 'Star',
                        isNumber: true,
                        min: 0,
                        max: 1000,
                        suffix: 'عدد',
                    },
                    {
                        key: 'maxActiveAdsPerUser',
                        label: 'سهمیه رایگان تابلو',
                        hint: 'آگهی‌های همزمان روی تابلو',
                        icon: 'Package',
                        isNumber: true,
                        min: 0,
                        max: 100,
                        suffix: 'عدد',
                    },
                ],
            },
            {
                groupTitle: 'هزینه‌ها',
                groupIcon: 'CreditCard',
                rules: [
                    {
                        key: 'adCreationCost',
                        label: 'هزینه ماهیانه آگهی اضافه',
                        hint: 'برای ثبت بیش از سهمیه کل آگهی رایگان',
                        icon: 'Package',
                        isNumber: true,
                        min: 0,
                        max: 10000,
                        suffix: 'اعتبار/ماه',
                    },
                    {
                        key: 'extraActiveAdCost',
                        label: 'هزینه روزانه آگهی اضافه روی تابلو',
                        hint: 'برای داشتن بیش از سهمیه رایگان تابلو، به ازای هر روز',
                        icon: 'LayoutGrid',
                        isNumber: true,
                        min: 0,
                        max: 10000,
                        suffix: 'اعتبار/روز',
                    },
                    {
                        key: 'bumpCost',
                        label: 'هزینه نردبان',
                        hint: 'نمایش بالاتر در تابلو',
                        icon: 'TrendingUp',
                        isNumber: true,
                        min: 0,
                        max: 10000,
                        suffix: 'اعتبار/۲۴ساعت',
                    },
                ],
            },
            {
                groupTitle: 'سایر تنظیمات',
                groupIcon: 'Clock',
                rules: [
                    {
                        key: 'adValidityDefaultHours',
                        label: 'اعتبار پیش‌فرض آگهی',
                        icon: 'Clock',
                        isNumber: true,
                        min: 1,
                        max: 240,
                        suffix: 'ساعت',
                    },
                ],
            },
        ],
    },

    // ۴ ── ماژول دیوار خریداران (قابل خاموش‌کردن) — بازوی خرید بازار
    {
        key: 'buyLeadWall',
        title: 'دیوار خریداران',
        sub: 'تابلوهای خرید اعضا — صفحهٔ خریداران',
        icon: ShoppingCart,
        accent: 'amber',
        configKey: 'buyLead',
        groups: [
            {
                groupTitle: 'دسترسی به دیوار',
                groupIcon: 'Shield',
                rules: [
                    {
                        key: 'requireMembershipToView',
                        label: 'پیوستن به بازار برای مشاهده درخواست‌ها',
                        hint: 'فقط اعضای بازار درخواست‌های روی دیوار را ببینند',
                        icon: 'Shield',
                    },
                ],
            },
        ],
    },
];

// ─────────────────────────────── کمک‌ها ───────────────────────────────
const countLeaves = (rules: RuleNode[]): number =>
    rules.reduce(
        (sum, r) => sum + (r.children && r.children.length > 0 ? countLeaves(r.children) : 1),
        0,
    );

// سوییچ کوچک مشترک — رنگ روشن بر اساس اکسنت ماژول
function MiniSwitch({ checked, onChange, disabled, accent }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    disabled?: boolean;
    accent: Accent;
}) {
    return (
        <label className={cn(
            'relative inline-flex items-center flex-shrink-0',
            disabled ? 'cursor-default' : 'cursor-pointer',
        )}>
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
            />
            <div className={cn(
                'w-9 h-5 rounded-full relative transition-all duration-200',
                checked ? ACCENTS[accent].switchOn : 'bg-outline-variant after:translate-x-0',
                "after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all after:duration-200 after:shadow-sm",
                disabled && 'opacity-50',
            )} />
        </label>
    );
}

// ─────────────────────────────── کارت هر ماژول ───────────────────────────────
function ModuleCard({ def, index, open, onToggle, watch, setValue, canEdit }: {
    def: ModuleDef;
    index: number;
    open: boolean;
    onToggle: (key: string) => void;
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    canEdit: boolean;
}) {
    const settings = watch(`config.modules.${def.configKey}`) || {};
    const isEnabled = def.alwaysOn ? true : (settings as any).enabled !== false;
    const accent = ACCENTS[def.accent];
    const ModuleIcon = def.icon;
    const settingCount = countLeaves(def.groups.flatMap((g) => g.rules));

    const getValueByPath = (path: string[]) => {
        let cur: any = settings;
        for (const k of path) {
            if (cur === undefined || cur === null) return undefined;
            cur = cur[k];
        }
        return cur;
    };

    const setValueByPath = (path: string[], value: any) => {
        if (!canEdit) return;
        const next: any = { ...(settings as Record<string, any>) };
        let cur: any = next;
        for (let i = 0; i < path.length - 1; i++) {
            const k = path[i];
            if (!cur[k] || typeof cur[k] !== 'object') cur[k] = {};
            cur = cur[k];
        }
        cur[path[path.length - 1]] = value;
        setValue(`config.modules.${def.configKey}`, next, { shouldDirty: true });
    };

    // رندر بازگشتی یک گره تنظیمات
    const renderNode = (node: RuleNode, parentPath: string[] = []): React.ReactNode => {
        const fullPath = [...parentPath, node.key];
        const value = getValueByPath(fullPath);
        const IconComponent = node.icon ? ICON_MAP[node.icon] : null;

        // گره دارای فرزند + سوییچ (مثل «بعد از ویرایش»)
        if (node.children && node.children.length > 0 && node.hasToggle) {
            const isActive = value?.enabled === true;
            return (
                <div key={node.key} className="col-span-full">
                    <div className={cn(
                        'flex flex-col gap-2.5 p-3 rounded-xl border transition-colors',
                        isActive ? accent.activeBox : 'bg-surface-container-lowest/60 border-outline-variant/20',
                        !canEdit && 'opacity-70',
                    )}>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                                {IconComponent && (
                                    <IconComponent className={cn(
                                        'w-3.5 h-3.5 flex-shrink-0',
                                        isActive ? accent.groupIcon : 'text-on-surface-variant/40',
                                    )} />
                                )}
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-on-surface">{node.label}</p>
                                    {node.hint && <p className="text-[10px] text-on-surface-variant/60 mt-0.5">{node.hint}</p>}
                                </div>
                            </div>
                            <MiniSwitch
                                checked={isActive}
                                onChange={(v) => setValueByPath([...fullPath, 'enabled'], v)}
                                disabled={!canEdit}
                                accent={def.accent}
                            />
                        </div>

                        {isActive && (
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2.5 border-t border-outline-variant/15">
                                {node.children.map((child) => {
                                    const childPath = [...fullPath, child.key];
                                    const childValue = getValueByPath(childPath);
                                    const ChildIcon = child.icon ? ICON_MAP[child.icon] : null;
                                    return (
                                        <label key={child.key} className="flex items-center gap-1.5 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={childValue === true}
                                                onChange={(e) => setValueByPath(childPath, e.target.checked)}
                                                disabled={!canEdit}
                                                className="w-3.5 h-3.5 rounded accent-primary"
                                            />
                                            {ChildIcon && <ChildIcon className="w-3.5 h-3.5 text-on-surface-variant/40" />}
                                            <span className="text-[11px] text-on-surface-variant whitespace-nowrap">{child.label}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            );
        }

        // گروه با فرزند بدون سوییچ (مثل «نیاز به تایید» و «درخواست ارتباط»)
        if (node.children && node.children.length > 0) {
            return (
                <div key={node.key} className="col-span-full">
                    <div className="p-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest/60">
                        <div className="flex items-center gap-2">
                            {IconComponent && <IconComponent className="w-3.5 h-3.5 text-on-surface-variant/60" />}
                            <span className="text-xs font-bold text-on-surface">{node.label}</span>
                        </div>
                        {node.hint && <p className="text-[10px] text-on-surface-variant/60 mt-1 leading-4">{node.hint}</p>}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2.5">
                            {node.children.map((child) => renderNode(child, fullPath))}
                        </div>
                    </div>
                </div>
            );
        }

        // برگ
        const displayValue = node.isNumber
            ? (value ?? (typeof node.defaultValue === 'number' ? node.defaultValue : node.min ?? 0))
            : undefined;
        const boolValue = value ?? (typeof node.defaultValue === 'boolean' ? node.defaultValue : false);

        return (
            <div key={node.key} className={cn(
                'flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border bg-surface-container-lowest/80 border-outline-variant/20 hover:border-outline-variant/45 transition-colors',
                !canEdit && 'opacity-70',
            )}>
                <div className="flex items-center gap-2 min-w-0 flex-1">
                    {IconComponent && <IconComponent className="w-3.5 h-3.5 flex-shrink-0 text-on-surface-variant/50" />}
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-on-surface leading-5">{node.label}</p>
                        {node.hint && <p className="text-[10px] text-on-surface-variant/55 leading-4 hidden sm:block">{node.hint}</p>}
                    </div>
                </div>

                {node.isNumber ? (
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <input
                            type="number"
                            value={displayValue}
                            onChange={(e) => setValueByPath(fullPath, parseFloat(e.target.value) || 0)}
                            min={node.min}
                            max={node.max}
                            disabled={!canEdit}
                            className="w-16 bg-surface border border-outline rounded-lg h-7 px-1.5 text-xs text-center focus:ring-1 focus:ring-primary/30 outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {node.suffix && <span className="text-[10px] text-on-surface-variant/60 whitespace-nowrap">{node.suffix}</span>}
                    </div>
                ) : (
                    <MiniSwitch
                        checked={boolValue}
                        onChange={(v) => setValueByPath(fullPath, v)}
                        disabled={!canEdit}
                        accent={def.accent}
                    />
                )}
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.06, 0.3), ease: 'easeOut' }}
            className={cn(
                'rounded-2xl border bg-surface-container-low dark:bg-gray-800/30 overflow-hidden shadow-sm',
                isEnabled ? 'border-outline-variant/30' : 'border-outline-variant/20',
            )}
        >
            {/* سربرگ کارت — کلیک روی عنوان یا آیکون دراپ = باز/بسته با اسلاید */}
            <div className="flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3.5">
                <button
                    type="button"
                    onClick={() => onToggle(def.key)}
                    aria-expanded={open}
                    className="flex items-center gap-3 flex-1 min-w-0 text-start"
                >
                    <div className={cn(
                        'w-10 h-10 rounded-xl grid place-items-center flex-shrink-0 transition-colors',
                        isEnabled ? accent.tile : accent.tileOff,
                    )}>
                        <ModuleIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                        <h3 className={cn(
                            'text-[13px] font-extrabold truncate',
                            isEnabled ? 'text-on-surface' : 'text-on-surface-variant/60',
                        )}>
                            {def.title}
                        </h3>
                        <p className="text-[10px] text-on-surface-variant/65 truncate mt-0.5">{def.sub}</p>
                    </div>
                </button>

                <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className="hidden sm:inline text-[10px] text-on-surface-variant/50 bg-surface-container-high/60 rounded-full px-2 py-0.5 whitespace-nowrap">
                        {settingCount} تنظیم
                    </span>

                    {def.alwaysOn ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/50 px-2.5 py-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">همیشه فعال</span>
                        </span>
                    ) : (
                        <MiniSwitch
                            checked={isEnabled}
                            onChange={(v) => setValueByPath(['enabled'], v)}
                            disabled={!canEdit}
                            accent={def.accent}
                        />
                    )}

                    <button
                        type="button"
                        onClick={() => onToggle(def.key)}
                        aria-expanded={open}
                        aria-label={open ? `بستن تنظیمات ${def.title}` : `باز کردن تنظیمات ${def.title}`}
                        className={cn(
                            'w-7 h-7 rounded-lg grid place-items-center transition-colors flex-shrink-0',
                            open
                                ? 'bg-primary/10 text-primary'
                                : 'text-on-surface-variant/60 hover:bg-surface-container-high/70',
                        )}
                    >
                        <motion.span
                            animate={{ rotate: open ? 180 : 0 }}
                            transition={{ duration: 0.25, ease: 'easeOut' }}
                            className="grid place-items-center"
                        >
                            <ChevronDown className="w-4 h-4" />
                        </motion.span>
                    </button>
                </div>
            </div>

            {/* بدنهٔ بازشو — اسلاید با framer-motion */}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        key="body"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className="overflow-hidden"
                    >
                        <div className="border-t border-outline-variant/20 p-4 sm:p-5 space-y-5">
                            {!def.alwaysOn && !isEnabled && (
                                <p className="text-[10px] text-on-surface-variant/60 flex items-center gap-1.5">
                                    <Lock className="w-3 h-3 flex-shrink-0" />
                                    این دیوار خاموش است — این تنظیمات پس از روشن‌کردن دیوار اعمال می‌شوند.
                                </p>
                            )}
                            {def.groups.map((group, gi) => {
                                const GroupIcon = group.groupIcon ? ICON_MAP[group.groupIcon] : null;
                                return (
                                    <section key={gi}>
                                        <div className="flex items-center gap-2 mb-2.5">
                                            {GroupIcon && <GroupIcon className={cn('w-3.5 h-3.5', accent.groupIcon)} />}
                                            <span className="text-[11px] font-extrabold text-on-surface-variant whitespace-nowrap">{group.groupTitle}</span>
                                            <span className="flex-1 h-px bg-outline-variant/20" />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {group.rules.map((rule) => renderNode(rule, []))}
                                        </div>
                                    </section>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

// ─────────────────────────────── سکشن اصلی ───────────────────────────────
export function MarketModulesSection({
    watch,
    setValue,
    isAdmin = false,
    onSave,
    isSaving,
    only,
    intro = true,
    defaultOpen = false,
}: {
    watch: UseFormWatch<any>;
    setValue: UseFormSetValue<any>;
    isAdmin?: boolean;
    onSave?: () => void;
    isSaving?: boolean;
    /** فقط این ماژول‌ها رندر شوند (فرم ویزارد) — پیش‌فرض: هر ۴ ماژول */
    only?: string[];
    /** سربرگ معرفی تب — در ویزارد خاموش می‌شود */
    intro?: boolean;
    /** کارت‌ها موقع لود باز باشند (ویزارد) یا بسته (تب تنظیمات) */
    defaultOpen?: boolean;
}) {
    const visible = MODULES.filter((m) => !only || only.includes(m.key));

    const [openMap, setOpenMap] = useState<Record<string, boolean>>(() =>
        Object.fromEntries(visible.map((m) => [m.key, defaultOpen])),
    );
    const toggle = (key: string) => setOpenMap((prev) => ({ ...prev, [key]: !prev[key] }));

    // دسترسی ویرایش ماژول‌ها — سطح کل بخش (armAdminPermission.modules)
    const armAdminPermission = watch('config.armAdminPermission') || {};
    const canEdit = isAdmin || (armAdminPermission as any).modules?.canEdit === true;

    // هشدار «هر دو دیوار خاموش» — فقط وقتی هر دو دیوار در همین بخش نمایش داده می‌شوند
    const wallDefs = visible.filter((m) => !m.alwaysOn);
    const wallsOff =
        wallDefs.length === 2 &&
        wallDefs.every((m) => {
            const s = watch(`config.modules.${m.configKey}`) || {};
            return (s as any).enabled === false;
        });

    return (
        <div className="space-y-4">
            {intro && (
                <div>
                    <h3 className="text-base font-extrabold text-on-surface">ماژول‌های بازار</h3>
                    <p className="text-xs text-on-surface-variant/75 mt-1 leading-5">
                        چهار ماژولِ همیشگیِ هر بازار — بازوهای فروش همیشه فعال‌اند و فقط تنظیم می‌خواهند؛
                        دیوارها را می‌توانی روشن یا خاموش کنی. برای باز کردن تنظیمات هر ماژول روی کارتش بزن.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high/60 px-2.5 py-1 text-[10px] font-bold text-on-surface-variant">
                            <Tags className="w-3 h-3 text-primary" />
                            ۲ دیوار قابل خاموش‌کردن
                        </span>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container-high/60 px-2.5 py-1 text-[10px] font-bold text-on-surface-variant">
                            <BookOpen className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            ۲ بازوی فروش همیشه فعال
                        </span>
                    </div>
                </div>
            )}

            {!canEdit && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/50 px-3.5 py-2.5 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] font-medium text-amber-800 dark:text-amber-300 leading-5">
                        تغییر تنظیمات ماژول‌ها فعلاً برای شما فعال نیست — فقط می‌توانی آن‌ها را ببینی.
                        در صورت نیاز با پشتیبانی دیمت تماس بگیر.
                    </p>
                </div>
            )}

            {/* کارت‌های ماژول — ترتیب ثابت از بالا به پایین */}
            <div className="space-y-3">
                {visible.map((def, idx) => (
                    <ModuleCard
                        key={def.key}
                        def={def}
                        index={idx}
                        open={!!openMap[def.key]}
                        onToggle={toggle}
                        watch={watch}
                        setValue={setValue}
                        canEdit={canEdit}
                    />
                ))}
            </div>

            {wallsOff && (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/50 px-3.5 py-2.5">
                    <p className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                        هر دو دیوار خاموش است — بازاری بدون دیوار برای بازدیدکننده قابل استفاده نیست. حداقل یکی را روشن نگه دار.
                    </p>
                </div>
            )}

            <p className="text-[10px] text-on-surface-variant/50 flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                پس از ذخیره، ناوبری سایت و دسترسی تابلوها بلافاصله به‌روز می‌شود.
            </p>

            {onSave && (
                <div>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={isSaving}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                        ذخیره ماژول‌ها
                    </button>
                </div>
            )}
        </div>
    );
}

export default MarketModulesSection;
