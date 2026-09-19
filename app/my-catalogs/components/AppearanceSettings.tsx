// app/my-catalogs/components/AppearanceSettings.tsx
// 🎨 تنظیمات ظاهر بازوی فروش — رنگ برند + واحد پول نمایشی (برندبوک هر بازو)
//    کسب‌وکارها عاشق رنگ خودشان‌اند — هر بازوی فروش می‌تواند رنگ برند خودش را داشته باشد.
//    ذخیره در config بازوی فروش (theme.color + currency) — همان لحظه صفحهٔ عمومی و پنل رنگ می‌گیرد.
'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Check, Coins, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api/apiService';
import {
    ARM_CURRENCIES, PRESET_BRAND_COLORS, DEFAULT_BRAND_COLOR,
    normalizeHex, isLightColor, currencyLabel,
} from '@/lib/utils/brand';

interface Props {
    catalog: any;
    /** بعد از ذخیره — والا کش‌ها را تازه می‌کند */
    onSaved?: () => void;
}

export default function AppearanceSettings({ catalog, onSaved }: Props) {
    const cfg = catalog?.config || {};
    const [color, setColor] = useState<string>(cfg.theme?.color || '');
    const [currency, setCurrency] = useState<string>(cfg.currency || 'toman');
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    // تعویض بازوی فروش — فرم از نو
    useEffect(() => {
        setColor(catalog?.config?.theme?.color || '');
        setCurrency(catalog?.config?.currency || 'toman');
        setDirty(false);
    }, [catalog?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const effectiveColor = normalizeHex(color) || DEFAULT_BRAND_COLOR;

    const markDirty = () => setDirty(true);

    const save = async () => {
        const hex = normalizeHex(color);
        setSaving(true);
        try {
            await apiService.catalog.updateConfig(catalog.id, {
                theme: { color: hex }, // null = برگشت به سبز پیش‌فرض دیمت
                currency,
            });
            setColor(hex || '');
            setDirty(false);
            toast.success('ظاهر بازوی فروش ذخیره شد — صفحهٔ عمومی هم عوض شد');
            onSaved?.();
        } catch (e: any) {
            toast.error(e?.response?.data?.message || e?.message || 'ذخیره ناموفق بود');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-xl border bg-white dark:bg-gray-900 border-outline-variant/50 dark:border-gray-700 overflow-hidden">
            <div className="p-4 space-y-5">
                {/* ── رنگ برند ── */}
                <div>
                    <p className="mb-1 flex items-center gap-2 text-sm font-extrabold text-on-surface">
                        <Palette className="w-4 h-4 text-primary" /> رنگ برند بازوی فروش
                    </p>
                    <p className="mb-3 text-[11px] font-bold leading-5 text-on-surface-variant/80">
                        یک رنگ انتخاب کن — هدر، قیمت‌ها و دکمه‌های صفحهٔ عمومی بازوی فروشت با همین رنگ نشان داده می‌شود.
                    </p>

                    {/* پالت رنگ‌های آماده — ساده، یک انتخاب */}
                    <div className="flex flex-wrap gap-2">
                        {PRESET_BRAND_COLORS.map((c) => {
                            const active = normalizeHex(color) === c.hex;
                            return (
                                <button key={c.hex} type="button"
                                        onClick={() => { setColor(c.hex); markDirty(); }}
                                        title={c.name}
                                        aria-label={`رنگ ${c.name}`}
                                        className={cn(
                                            'relative size-9 rounded-full transition-all active:scale-90 hover:scale-110',
                                            active ? 'ring-2 ring-offset-2 ring-on-surface/60 dark:ring-offset-gray-900' : 'ring-1 ring-black/10',
                                        )}
                                        style={{ backgroundColor: c.hex }}>
                                    {active && <Check className={cn('absolute inset-0 m-auto size-4', isLightColor(c.hex) ? 'text-black' : 'text-white')} />}
                                </button>
                            );
                        })}

                        {/* رنگ دلخواه — انتخابگر رنگ مرورگر */}
                        <label className={cn(
                            'relative size-9 rounded-full overflow-hidden cursor-pointer grid place-items-center transition-all active:scale-90 hover:scale-110',
                            'border-2 border-dashed border-outline-variant/60',
                        )}
                               title="رنگ دلخواه">
                            <span className="text-[8px] font-black text-on-surface-variant/70">دیگر</span>
                            <input type="color" value={effectiveColor} aria-label="انتخاب رنگ دلخواه"
                                   onChange={(e) => { setColor(e.target.value); markDirty(); }}
                                   className="absolute inset-0 opacity-0 cursor-pointer" />
                        </label>
                    </div>

                    {/* پیش‌نمایش زندهٔ رنگ انتخابی */}
                    {normalizeHex(color) && (
                        <div className="mt-3 flex items-center gap-2.5 rounded-xl p-2.5"
                             style={{ backgroundColor: effectiveColor + '18' }}>
                            <span className="size-7 rounded-lg grid place-items-center text-[10px] font-black"
                                  style={{ backgroundColor: effectiveColor, color: isLightColor(effectiveColor) ? '#111' : '#fff' }}>
                                آ
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-extrabold" style={{ color: effectiveColor }}>نمونهٔ قیمت: {currencyLabel(currency) === 'تومان' ? '۴۸۵٬۰۰۰ تومان' : `۴۸۵٬۰۰۰ ${currencyLabel(currency)}`}</p>
                                <p className="text-[10px] font-bold text-on-surface-variant/70 truncate">همین‌شکلی در صفحهٔ عمومی دیده می‌شود</p>
                            </div>
                            <span className="rounded-lg px-2.5 py-1 text-[9.5px] font-extrabold"
                                  style={{ backgroundColor: effectiveColor, color: isLightColor(effectiveColor) ? '#111' : '#fff' }}>
                                دکمهٔ نمونه
                            </span>
                        </div>
                    )}

                    {/* برگشت به پیش‌فرض */}
                    {normalizeHex(color) && (
                        <button type="button" onClick={() => { setColor(''); markDirty(); }}
                                className="mt-2 text-[10.5px] font-bold text-on-surface-variant/70 hover:text-primary underline underline-offset-2">
                            برگشت به رنگ پیش‌فرض دیمت
                        </button>
                    )}
                </div>

                {/* ── واحد پول ── */}
                <div>
                    <p className="mb-1 flex items-center gap-2 text-sm font-extrabold text-on-surface">
                        <Coins className="w-4 h-4 text-primary" /> واحد پول قیمت‌ها
                    </p>
                    <p className="mb-3 text-[11px] font-bold leading-5 text-on-surface-variant/80">
                        قیمت‌های بازوی فروش با این واحد نمایش داده می‌شوند — برای فروش به افغانستان، تاجیکستان یا تجارت ارزی.
                        پیش‌فرض تومان است.
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {ARM_CURRENCIES.map((c) => {
                            const active = currency === c.code;
                            return (
                                <button key={c.code} type="button"
                                        onClick={() => { setCurrency(c.code); markDirty(); }}
                                        className={cn(
                                            'rounded-xl border-2 px-2.5 py-2 text-right transition-all active:scale-[0.98]',
                                            active
                                                ? 'border-primary/60 bg-primary/5'
                                                : 'border-outline-variant/40 hover:border-outline-variant dark:border-gray-700',
                                        )}>
                                    <span className="flex items-center gap-1.5">
                                        <span className={cn('text-[11.5px] font-extrabold', active ? 'text-primary' : 'text-on-surface')}>
                                            {c.label}
                                        </span>
                                        {active && <Check className="size-3.5 text-primary" />}
                                    </span>
                                    <span className="mt-0.5 block text-[9px] font-bold text-on-surface-variant/70">{c.region}</span>
                                </button>
                            );
                        })}
                    </div>
                    <p className="mt-2 flex items-start gap-1.5 text-[10px] font-bold leading-5 text-on-surface-variant/70">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        ریال عمداً نداریم — فیلتر قیمت در بازارِ تخصصی به‌هم می‌ریزد. قیمت‌ها فقط با این واحد «نمایش» داده می‌شوند؛
                        عددی که وارد کرده‌ای همان می‌ماند.
                    </p>
                </div>
            </div>

            {/* ذخیره — فقط وقتی تغییری کرده */}
            {dirty && (
                <div className="border-t border-outline-variant/30 dark:border-gray-700/60 p-3">
                    <button type="button" onClick={save} disabled={saving}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[13px] font-extrabold text-on-primary shadow-sm hover:opacity-95 disabled:opacity-50">
                        {saving && <Loader2 className="size-4 animate-spin" />}
                        ذخیرهٔ ظاهر بازوی فروش
                    </button>
                </div>
            )}
        </div>
    );
}
