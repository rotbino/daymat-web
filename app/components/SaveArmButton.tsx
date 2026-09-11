// app/components/SaveArmButton.tsx
'use client';
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bookmark, Loader2 } from 'lucide-react';
import { RootState } from '@/lib/store/store';
import { useArms } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * ✅ دکمهٔ ذخیره (فالو) کنار عنوان بازار در هدر — فقط برای «غیرعضو»ها
 *   ذخیره = ثبتِ کاربر در ArmSavedMark؛ فقط یعنی بازار در سوییچر بماند (مثل فالو).
 *   هیچ دسترسی قیمتی/انتشاری نمی‌دهد و هیچ شرطی ندارد — حتی بدون کسب‌وکار.
 *   ✅ اعضای بازار (businessId/catalogId/مالک/ادمین): آیکون اصلاً رندر نمی‌شود —
 *      عضو نمی‌تواند از اینجا آنفالو کند؛ خروج از پنل خودش (کسب‌وکار/کاتالوگ) است.
 *   مهمان → هدایت به لاگین.
 */
export default function SaveArmButton({ variant = 'mobile' }: { variant?: 'mobile' | 'desktop' }) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { currentSlug } = useSelector((s: RootState) => s.arm);
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);
    const { data: arms, isLoading } = useArms();

    const current = useMemo(
        () => (arms ?? []).find((a: any) => a.slug === currentSlug),
        [arms, currentSlug],
    );

    // ✅ عضو بازار → بدون دکمهٔ ذخیره (بازارِ عضو همیشه در سوییچر است)
    const isMember = !!current?.isMember;
    const isSaved = current?.status === 'saved';

    const saveMut = useMutation({
        mutationFn: async () => {
            if (!currentSlug) throw new Error('بازاری انتخاب نشده');
            if (isSaved) return apiService.arm.unsave(currentSlug);
            return apiService.arm.save(currentSlug);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['arms'] });
            toast.success(isSaved ? 'از ذخیره‌ها حذف شد' : 'بازار ذخیره شد — در سوییچرت هست');
        },
        onError: (e: any) => {
            toast.error(e?.message || 'خطا در ذخیرهٔ بازار');
        },
    });

    if (!isAuthenticated || !currentSlug || isLoading || isMember) return null;

    const handleClick = () => {
        saveMut.mutate();
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={saveMut.isPending}
            aria-label={isSaved ? 'حذف از ذخیره‌ها' : 'ذخیرهٔ این بازار'}
            title={isSaved ? 'ذخیره شد — برای حذف کلیک کن' : 'ذخیرهٔ این بازار در سوییچر من'}
            className={cn(
                'flex-shrink-0 grid place-items-center rounded-full transition-all active:scale-90',
                variant === 'mobile' ? 'w-8 h-8' : 'w-9 h-9',
                isSaved
                    ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                    : 'text-on-surface-variant/60 hover:text-primary hover:bg-primary/5',
            )}
        >
            {saveMut.isPending ? (
                <Loader2 className={cn('animate-spin', variant === 'mobile' ? 'w-4 h-4' : 'w-[18px] h-[18px]')} />
            ) : (
                <Bookmark
                    className={cn(variant === 'mobile' ? 'w-[17px] h-[17px]' : 'w-5 h-5')}
                    fill={isSaved ? 'currentColor' : 'none'}
                />
            )}
        </button>
    );
}
