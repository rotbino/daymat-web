// app/nav/useNavMode.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';

export type NavMode = 'catalog-owner' | 'member';

export function useNavMode(): { mode: NavMode; loading: boolean } {
    const { isAuthenticated, _hydrated } = useSelector((s: RootState) => s.auth) as any;
    const hydrated = _hydrated !== false;

    const { data: cataloges, isLoading: bizLoading } = useQuery({
        queryKey: ['cataloges'],
        queryFn: () => apiService.catalog.getAll(),
        enabled: hydrated && isAuthenticated,
        staleTime: 60_000,
    });
    const { data: arms, isLoading: armsLoading } = useQuery({
        queryKey: ['arms'],
        queryFn: () => apiService.arm.getUserArms(),
        enabled: hydrated && isAuthenticated,
        staleTime: 60_000,
    });

    if (!hydrated) return { mode: 'catalog-owner', loading: true };
    if (!isAuthenticated) {
        // ✅ مهمان دیگر mode گست ندارد — ناو اصلاً برای مهمان رندر نمی‌شود
        // (بازگشت به default امن؛ صداکننده با loading فرق می‌کند)
        return { mode: 'catalog-owner', loading: false };
    }

    const hasCatalog = (cataloges ?? []).length > 0;
    const hasMembership = (arms ?? []).some((m: any) => m.status === 'active');

    // ✅ عضو بازار (فروشنده یا خریدار) — حتی بدون کاتالوگ (خریدارِ کسب‌وکارمحور) تب بازار دارد
    if (hasMembership) return { mode: 'member', loading: false };

    // ✅ قبل از تصمیم، صبر برای داده — خریدارِ بی‌کاتالوگ نباید فلیکر کند
    if (bizLoading || armsLoading) return { mode: 'catalog-owner', loading: true };

    if (!hasCatalog) return { mode: 'catalog-owner', loading: false };
    return { mode: 'catalog-owner', loading: false };
}