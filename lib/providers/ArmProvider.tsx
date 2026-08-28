// lib/providers/ArmProvider.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { useQueryClient } from '@tanstack/react-query';
import { RootState } from '@/lib/store/store';
import { setArm, setArmLoading, setArmError } from '@/lib/store/slices/armSlice';
import { useArm, useArms } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';

const PUBLIC_PATHS = [
    '/login',
    '/register',
    '/admin',
    '/arm-admin',
    '/no-arm',
    '/business',
    '/profile',
    '/dashboard',
    '/docs',
    '/docs/terms',
    '/docs/about',
    '/purchase',
    '/credit/purchase',
    '/credit/verify',
    '/credit/payments',
    '/credit/report',
    '/feedback',
    '/saved-ads',
];

interface ArmProviderProps {
    children: React.ReactNode;
}

export function ArmProvider({ children }: ArmProviderProps) {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useDispatch();
    const queryClient = useQueryClient();
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [isInitialized, setIsInitialized] = useState(false);
    const [autoJoinAttempted, setAutoJoinAttempted] = useState(false);

    // ═══════════════════════════════════════════
    // 🧠 تشخیص مسیر - فقط یک بار
    // ═══════════════════════════════════════════
    const pathInfo = useMemo(() => {
        const isCatalogPath = pathname?.startsWith('/c/');
        const isAdDetailPath = pathname?.startsWith('/ad/') &&
            !pathname?.startsWith('/ad/create') &&
            !pathname?.startsWith('/ad/edit');
        const isPublicPath = PUBLIC_PATHS.some(
            p => pathname === p || pathname?.startsWith(`${p}/`)
        );

        return {
            isCatalogPath,
            isAdDetailPath,
            isPublicPath,
            // ✅ فقط برای مسیرهای بازار نیاز به arm داریم
            needsArm: !isCatalogPath && !isAdDetailPath && !isPublicPath,
        };
    }, [pathname]);

    // ═══════════════════════════════════════════
    // ✅ هوک‌ها با شرط‌های دقیق
    // ═══════════════════════════════════════════

    // useArm فقط وقتی:
    // ۱. نیاز به بازار داریم
    // ۲. currentSlug وجود دارد
    const shouldFetchArm = pathInfo.needsArm && !!currentSlug;
    const { data: armData, isLoading: armLoading } = useArm(
        shouldFetchArm ? currentSlug! : ''
    );

    // useArms فقط وقتی:
    // ۱. نیاز به بازار داریم
    // ۲. کاربر لاگین است
    const shouldFetchArms = pathInfo.needsArm && isAuthenticated;
    const { data: userArms, refetch: refetchArms } = useArms(shouldFetchArms);

    // ═══════════════════════════════════════════
    // ✅ اگر نیاز به بازار نیست - زود برگرد
    // ═══════════════════════════════════════════
    if (!pathInfo.needsArm) {
        return <>{children}</>;
    }

    // ═══════════════════════════════════════════
    // از اینجا به بعد فقط برای مسیرهای بازار
    // ═══════════════════════════════════════════

    useEffect(() => {
        if (armData && currentSlug && armData.slug === currentSlug) {
            dispatch(setArm({ arm: armData, slug: currentSlug }));
            localStorage.setItem('lastArmSlug', currentSlug);
        }
    }, [armData, currentSlug, dispatch]);

    useEffect(() => {
        if (!currentSlug) return;
        queryClient.invalidateQueries({ queryKey: ['arms'] });
        queryClient.invalidateQueries({ queryKey: ['business', 'active'] });
        setAutoJoinAttempted(false);
    }, [currentSlug, queryClient]);

    // Auto-join فقط برای کاربر لاگین
    useEffect(() => {
        if (!isAuthenticated || !armData || autoJoinAttempted) return;

        const config = armData.config || {};
        const accessRules = config.accessRules || {};
        const autoJoinOnEntry = accessRules.autoJoinOnEntry === true;
        const requireApproval = accessRules.requireAdminApprovalForMembership === true;

        if (!autoJoinOnEntry || requireApproval) return;

        const checkAndJoin = async () => {
            try {
                const hasAnyMembership = userArms?.some((a: any) => a.slug === currentSlug);
                if (hasAnyMembership) return;

                await apiService.arm.join(currentSlug!);
                await refetchArms();
            } catch (error: any) {
                if (error?.data?.errorCode !== 'ALREADY_MEMBER') {
                    console.error('Auto-join failed:', error);
                }
            } finally {
                setAutoJoinAttempted(true);
            }
        };

        checkAndJoin();
    }, [isAuthenticated, armData, currentSlug, autoJoinAttempted, userArms, refetchArms]);

    useEffect(() => {
        setAutoJoinAttempted(false);
    }, [currentSlug]);

    // لود اولیه بازار
    useEffect(() => {
        const initArm = async () => {
            const firstSegment = pathname?.split('/').filter(Boolean)[0];

            if (firstSegment && firstSegment !== currentSlug) {
                dispatch(setArmLoading(true));
                try {
                    const arm = await apiService.arm.fetchArmData(firstSegment);
                    if (arm) {
                        dispatch(setArm({ arm, slug: firstSegment }));
                        localStorage.setItem('lastArmSlug', firstSegment);
                    } else {
                        router.replace('/no-arm');
                        return;
                    }
                } catch (error) {
                    console.error('Error loading arm:', error);
                    dispatch(setArmError('خطا در دریافت اطلاعات بازار'));
                    router.replace('/no-arm');
                    return;
                }
            }

            if (!currentSlug && pathname === '/') {
                const lastSlug = localStorage.getItem('lastArmSlug');
                if (lastSlug) {
                    router.replace(`/${lastSlug}`);
                    return;
                }
                router.replace('/no-arm');
                return;
            }

            setIsInitialized(true);
        };

        initArm();
    }, [pathname, currentSlug, router, dispatch]);

    // Prefetch ویترین
    useEffect(() => {
        if (!currentSlug) return;
        if (!pathname?.startsWith(`/${currentSlug}`)) return;

        const defaultParams = { page: 1, limit: 20, bumpFilter: 'all' };
        const queryKey = ['vitrine', currentSlug, JSON.stringify(defaultParams)];

        if (!queryClient.getQueryData(queryKey)) {
            queryClient.prefetchQuery({
                queryKey,
                queryFn: () => apiService.ad.getVitrine(currentSlug, defaultParams),
                staleTime: 1000 * 30,
            });
        }
    }, [currentSlug, pathname, queryClient]);

    if (!isInitialized && !currentArm) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            </div>
        );
    }

    return <>{children}</>;
}