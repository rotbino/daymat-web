// lib/hooks/useMarketInit.ts
'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { setArm } from '@/lib/store/slices/armSlice';
import { apiService } from '@/lib/api/apiService';

interface UseMarketInitResult {
    loading: boolean;
    armNotFound: boolean;
}

/**
 * آماده‌سازی بازاری که resolver سرور پیدا کرده:
 *  - اگر currentArm از قبل با همان slug در redux هست → هیچ کاری نکن (بدون fetch)
 *  - وگرنه یک بار fetch بزن، در redux ست کن و تمام
 * خطای fetch = armNotFound → MarketShell پیام ۴۰۴ نشان می‌دهد
 */
export function useMarketInit(slug: string): UseMarketInitResult {
    const dispatch = useDispatch();
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);

    // ✅ پیش‌فرض true — در بارِ سرد (SSR/hydration) redux خالی است و تا fetch تمام نشده
    //    نباید MarketContent رندر شود (فلشِ «بازار خالی» یا اسپینر دوبل نمی‌گیریم)
    const [loading, setLoading] = useState(true);
    const [armNotFound, setArmNotFound] = useState(false);

    useEffect(() => {
        // اگر از قبل با همان slug در redux هست → نیازی به fetch نیست
        if (currentSlug === slug && currentArm) {
            setArmNotFound(false);
            setLoading(false);
            return;
        }
        if (!slug) {
            setArmNotFound(true);
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setArmNotFound(false);

        apiService.arm
            .fetchArmData(slug)
            .then((arm: any) => {
                if (cancelled) return;
                if (!arm) {
                    setArmNotFound(true);
                } else {
                    dispatch(setArm({ arm: { ...arm, slug }, slug }));
                    localStorage.setItem('lastArmSlug', slug);
                    setArmNotFound(false);
                }
                setLoading(false);
            })
            .catch(() => {
                if (cancelled) return;
                setArmNotFound(true);
                setLoading(false);
            });

        return () => { cancelled = true; };
    }, [slug, dispatch]);

    return { loading, armNotFound };
}