// app/business/manage/components/EditableRow.tsx
// 🔧 ردیف «لیبل + مقدار + مداد» — با زدن مداد همان ردیف قابل ویرایش می‌شود
'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Check, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** ارقام فارسی/عربی → انگلیسی، برای ذخیرهٔ تمیز عدد و تلفن */
const toEnDigits = (s: string) =>
    s
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

export interface EditableRowProps {
    fieldKey: string;
    label: string;
    value?: string | number | null;
    placeholder?: string;
    type?: 'text' | 'tel' | 'url' | 'number' | 'textarea';
    dir?: 'rtl' | 'ltr';
    icon?: React.ComponentType<{ className?: string }>;
    maxLength?: number;
    /** اگر برابر fieldKey باشد، ردیف خودکار در حالت ویرایش باز می‌شود (پرش از چک‌لیست) */
    autoOpenKey?: string | null;
    onOpened?: () => void;
    onSave: (value: string | null) => Promise<void>;
}

const FIELD_INPUT =
    'flex-1 min-w-0 h-10 px-3 text-sm text-right rounded-xl bg-surface-container-lowest border border-outline-variant/40 dark:border-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all';

export function EditableRow({
    fieldKey,
    label,
    value,
    placeholder,
    type = 'text',
    dir = 'rtl',
    icon: Icon,
    maxLength,
    autoOpenKey,
    onOpened,
    onSave,
}: EditableRowProps) {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);

    const isTextarea = type === 'textarea';
    const current = value != null && String(value).trim() !== '' ? String(value) : null;

    const openEditor = () => {
        setDraft(current ?? '');
        setEditing(true);
    };

    // پرش خودکار از چک‌لیست کامل‌بودن
    useEffect(() => {
        if (autoOpenKey && autoOpenKey === fieldKey) {
            setDraft(current ?? '');
            setEditing(true);
            onOpened?.();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoOpenKey, fieldKey]);

    const cancel = () => setEditing(false);

    const save = async () => {
        if (saving) return;
        const cleaned =
            type === 'number' || type === 'tel' ? toEnDigits(draft).replace(/[^\d]/g, '') : draft.trim();
        const payload = cleaned === '' ? null : cleaned;
        if (payload === current) {
            setEditing(false);
            return;
        }
        setSaving(true);
        try {
            await onSave(payload);
            setEditing(false);
        } catch {
            /* خطا با توست نمایش داده شده — ردیف در حالت ویرایش می‌ماند */
        } finally {
            setSaving(false);
        }
    };

    if (!editing) {
        return (
            <div className="flex items-start gap-3 py-2.5">
                <div className="w-24 sm:w-28 flex-shrink-0 flex items-center gap-1.5 pt-0.5">
                    {Icon && <Icon className="w-3.5 h-3.5 text-on-surface-variant/60 flex-shrink-0" />}
                    <span className="text-[11px] text-on-surface-variant leading-4">{label}</span>
                </div>
                <div className="flex-1 min-w-0">
                    {current ? (
                        <p
                            className="text-[13px] font-bold text-on-surface leading-5 break-words"
                            dir={dir}
                            style={dir === 'ltr' ? { textAlign: 'right' } : undefined}
                        >
                            {current}
                        </p>
                    ) : (
                        <p className="text-[12px] text-on-surface-variant/40">{placeholder || 'وارد نشده'}</p>
                    )}
                </div>
                <button
                    type="button"
                    onClick={openEditor}
                    aria-label={`ویرایش ${label}`}
                    className="w-8 h-8 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-primary hover:bg-primary/10 active:scale-90 transition-all flex-shrink-0"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
            </div>
        );
    }

    return (
        <div className="py-2.5 space-y-2">
            <div className="flex items-start gap-3">
                <div className="w-24 sm:w-28 flex-shrink-0 pt-2.5">
                    <span className="text-[11px] text-primary font-extrabold">{label}</span>
                </div>
                {isTextarea ? (
                    <textarea
                        autoFocus
                        rows={3}
                        dir={dir}
                        maxLength={maxLength}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        className={cn(FIELD_INPUT, 'h-auto py-2 resize-none leading-5')}
                    />
                ) : (
                    <input
                        autoFocus
                        type={type === 'number' ? 'text' : type}
                        inputMode={type === 'number' ? 'numeric' : undefined}
                        dir={dir}
                        maxLength={maxLength}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                save();
                            }
                            if (e.key === 'Escape') cancel();
                        }}
                        className={FIELD_INPUT}
                    />
                )}
            </div>
            <div className="flex items-center gap-2 sm:pr-[calc(7rem+0.75rem)]">
                <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="h-9 px-4 rounded-xl bg-primary text-on-primary text-[11px] font-extrabold flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 active:scale-95 transition-all shadow-sm shadow-primary/25"
                >
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    ذخیره
                </button>
                <button
                    type="button"
                    onClick={cancel}
                    disabled={saving}
                    className="h-9 px-3 rounded-xl border border-outline-variant/50 text-on-surface-variant text-[11px] font-bold flex items-center gap-1 hover:bg-surface-container-low active:scale-95 transition-all"
                >
                    <X className="w-3.5 h-3.5" /> انصراف
                </button>
            </div>
        </div>
    );
}
