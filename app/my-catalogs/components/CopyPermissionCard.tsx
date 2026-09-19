// app/my-catalogs/components/CopyPermissionCard.tsx
// 📋 اجازهٔ کپی محصولات این بازوی فروش — برای همکاران تیم فروش و هر کسب‌وکار دیگری
//    روشن = هر کاربری با جست‌وجوی کسب‌وکارت می‌تواند کالاهای کامل این بازو را (قیمت/واحد/برند/عکس)
//    به بازوی فروش خودش کپی کند. خاموش = کپی بسته است.
//    سناریوی اصلی: یک نفر لیست را یک‌بار وارد می‌کند؛ بقیهٔ تیم در چند ثانیه کپی می‌کنند —
//    تیک را برای همکار روشن کن، بعد از کپی خاموشش کن. هر وقت خواستی برمی‌داری.
'use client';

import React, { useState, useEffect } from 'react';
import { CopyPlus, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api/apiService';

interface Props {
    catalog: any;
    /** بعد از ذخیره — والا کش‌ها را تازه می‌کند */
    onSaved?: () => void;
}

export default function CopyPermissionCard({ catalog, onSaved }: Props) {
    const [allowed, setAllowed] = useState<boolean>(catalog?.config?.allowCopy === true);
    const [saving, setSaving] = useState(false);

    // تعویض بازوی فروش — فرم از نو
    useEffect(() => {
        setAllowed(catalog?.config?.allowCopy === true);
    }, [catalog?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggle = async () => {
        const next = !allowed;
        setAllowed(next);
        setSaving(true);
        try {
            await apiService.catalog.updateConfig(catalog.id, { allowCopy: next });
            toast.success(next
                ? 'اجازهٔ کپی روشن شد — هر کسی می‌تواند کالاهای این بازو را کپی کند'
                : 'اجازهٔ کپی خاموش شد — دیگر کسی نمی‌تواند از این بازو کپی کند');
            onSaved?.();
        } catch (e: any) {
            setAllowed(!next); // برگشت به حالت قبل
            toast.error(e?.response?.data?.message || e?.message || 'ذخیره ناموفق بود');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="rounded-xl border bg-white dark:bg-gray-900 border-outline-variant/50 dark:border-gray-700 overflow-hidden">
            <div className="p-4">
                <div className="flex items-start gap-3">
                    <span className={cn('grid size-10 shrink-0 place-items-center rounded-xl transition-colors',
                        allowed ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-surface-container-high text-on-surface-variant dark:bg-gray-800')}>
                        <CopyPlus className="w-5 h-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-on-surface">اجازهٔ کپی محصولات</p>
                        <p className="mt-1 text-[11px] font-bold leading-5 text-on-surface-variant/80">
                            روشنش کن تا هر کسی بتواند با جست‌وجوی کسب‌وکارت، کالاهای کاملِ این بازو را —
                            با قیمت و واحد و برند و عکس — به بازوی فروش خودش کپی کند.
                        </p>
                    </div>

                    {/* سوییچ */}
                    <button type="button" role="switch" aria-checked={allowed} onClick={toggle} disabled={saving}
                            className={cn('relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-60',
                                allowed ? 'bg-emerald-500' : 'bg-outline-variant/60 dark:bg-gray-700')}>
                        <span className={cn('absolute top-1 size-5 rounded-full bg-white shadow transition-all',
                            allowed ? 'start-6' : 'start-1')} />
                        {saving && <Loader2 className="absolute inset-0 m-auto size-3.5 animate-spin text-white/70" />}
                    </button>
                </div>

                <div className={cn('mt-3 rounded-xl px-3.5 py-3 transition-colors',
                    allowed ? 'bg-emerald-50/70 dark:bg-emerald-500/10' : 'bg-surface-container-low/60 dark:bg-gray-800/40')}>
                    <p className="text-[10.5px] font-bold leading-5 text-on-surface-variant">
                        {allowed
                            ? '✅ کپی باز است — مخصوصاً برای تیم فروش عالی است: یک نفر لیست را وارد می‌کند، بقیه در چند ثانیه کپی می‌کنند. کارتان تمام شد؟ همین‌جا خاموشش کن.'
                            : '💡 برای همکارانت در تیم فروش هم همین‌طور است — اگر کاتالوگ را یکی از شما ساخته، بقیه لازم نیست از صفر وارد کنند؛ تیک را روشن کنید، آن‌ها کپی کنند، بعد خاموش کنید. هر وقت هم خواستید برمی‌دارید.'}
                    </p>
                    <p className="mt-1.5 flex items-start gap-1.5 text-[10px] font-bold leading-5 text-on-surface-variant/70">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        کالاهای ناقصِ «نیاز به تکمیل» به هیچ‌عنوان کپی نمی‌شوند — فقط کالاهای کاملِ همین بازو.
                    </p>
                </div>
            </div>
        </div>
    );
}
