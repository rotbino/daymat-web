// lib/api/apiHooks.ts
import {useQuery, useMutation, useQueryClient, useInfiniteQuery, keepPreviousData} from '@tanstack/react-query';
import { apiService } from './apiService';
import {
    ApiError,
    LoginCredentials,
    RegisterCredentials,
    CreateCatalogDto,
    UpdateCatalogDto,
    CreateArmDto,
    CreateAdDto,
    AdListQuery,
    PurchaseCreditDto,
    UploadFileResponse,
    DeleteFileResponse
} from './apiTypes';
import { toast } from 'sonner';
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store/store";
import { useCallback, useMemo } from 'react';
import {apiRequest} from "@/lib/api/apiRequest";
// ═══════════════════════════════════════════════════════════
// ✅ تابع کمکی برای تشخیص کاربر لاگین و توکن
// ═══════════════════════════════════════════════════════════
function useAuthState() {
    const user = useSelector((state: RootState) => state.auth.user);
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

    return {
        user,
        isAuthenticated,
        userId: user?.id,
        token,
        hasAccess: isAuthenticated && !!user?.id && !!token,
    };
}

// ============================================================
// AUTH HOOKS
// ============================================================
export const useLogin = () => {
    return useMutation({
        mutationFn: (data: LoginCredentials) => apiService.auth.login(data),
        onSuccess: () => toast.success('ورود با موفقیت انجام شد'),
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ورود'),
    });
};

export const useRegister = () => {
    return useMutation({
        mutationFn: (data: RegisterCredentials) => apiService.auth.register(data),
        onSuccess: () => toast.success('ثبت‌نام با موفقیت انجام شد'),
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ثبت‌نام'),
    });
};

// ============================================================
// CATALOG HOOKS
// ============================================================
export const useCataloges = () => {
    const { hasAccess } = useAuthState();

    return useQuery({
        queryKey: ['cataloges'],
        queryFn: () => apiService.catalog.getAll(),
        enabled: hasAccess, // ✅ فقط کاربر لاگین
        staleTime: 5 * 60 * 1000,
    });
};

export const useActiveCatalog = () => {
    const { hasAccess } = useAuthState();

    return useQuery({
        queryKey: ['catalog', 'active'],
        queryFn: () => apiService.catalog.getActive(),
        enabled: hasAccess, // ✅ فقط کاربر لاگین
        retry: false,
        staleTime: 1000 * 60 * 5,
    });
};

export const useCatalog = (id: string) => {
    const { hasAccess } = useAuthState();

    return useQuery({
        queryKey: ['catalog', id],
        queryFn: () => apiService.catalog.getOne(id),
        enabled: !!id && hasAccess, // ✅ فقط کاربر لاگین
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });
};
// ============================================================
// CATALOG ADS — لیست کالاهای یک کاتالوگ
// عمومی (مهمان هم می‌تواند) + با پشتیبانی search و status و limit
// ============================================================
export const useCatalogAds = (
    catalogId: string,
    page: number = 1,
    limit: number = 10,
    options?: {
        search?: string;
        status?: string;      // active | pending | archived
        requireAuth?: boolean; // نسخهٔ داشبورد که فقط برای مالک بود
    },
) => {
    const { hasAccess } = useAuthState();
    const search = options?.search;
    const status = options?.status;
    const requireAuth = options?.requireAuth ?? false;

    return useQuery({
        queryKey: ['catalog-ads', catalogId, page, limit, search ?? null, status ?? null],
        queryFn: () => {
            // هر دو مسیر به یک endpoint می‌رسند — با پارامترهای ارسالی متفاوت
            const qs = new URLSearchParams({ page: String(page), limit: String(limit) });
            if (search) qs.set('search', search);
            if (status) qs.set('status', status);
            return apiRequest(`/ad/catalog/${catalogId}?${qs.toString()}`);
        },
        enabled: !!catalogId && (!requireAuth || hasAccess),
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });
};
export const useCatalogBySlug = (slug: string) => {
    return useQuery({
        queryKey: ['catalog', 'by-slug', slug],
        queryFn: () => apiService.catalog.getBySlug(slug),
        enabled: !!slug, // ✅ عمومی
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });
};

export const useCatalogSaved = (catalogId: string) => {
    const { hasAccess } = useAuthState();

    return useQuery({
        queryKey: ['catalog-saved', catalogId],
        queryFn: () => apiService.catalog.isSaved(catalogId),
        enabled: !!catalogId && hasAccess, // ✅ فقط کاربر لاگین
        staleTime: 5 * 60 * 1000,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });
};

export const useCatalogStats = (catalogId: string) => {
    return useQuery({
        queryKey: ['catalog-stats', catalogId],
        queryFn: () => apiService.catalog.getStats(catalogId),
        enabled: !!catalogId, // ✅ عمومی
        staleTime: 2 * 60 * 1000,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });
};

export const useSavedCatalogs = () => {
    const { hasAccess } = useAuthState();

    return useQuery({
        queryKey: ['saved-catalogs'],
        queryFn: () => apiService.catalog.getSavedList(),
        enabled: hasAccess, // ✅ فقط کاربر لاگین
        staleTime: 5 * 60 * 1000,
        refetchOnMount: true,
        refetchOnWindowFocus: false,
    });
};

// ============================================================
// LOCATION HOOKS
// ============================================================
export const useLocationsTree = () => {
    return useQuery({
        queryKey: ['locations', 'tree'],
        queryFn: () => apiService.location.getFullTree(),
        staleTime: 1000 * 60 * 60 * 24,
        gcTime: 1000 * 60 * 60 * 24,
    });
};

// ============================================================
// CATALOG MUTATIONS
// ============================================================
export const useCreateCatalog = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateCatalogDto) => apiService.catalog.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cataloges'] });
            queryClient.invalidateQueries({ queryKey: ['catalog', 'active'] });
        },
        onError: (error: ApiError) => {
            if (error.data?.errorCode === 'DUPLICATE_CATALOG_NAME') {
                toast.error('شما قبلاً یک کسب‌وکار با این نام ثبت کرده‌اید');
            } else {
                toast.error(error.message || 'خطا در ثبت کسب‌وکار');
            }
        },
    });
};

export const useUpdateCatalog = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            apiService.catalog.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['catalogs'] });
            queryClient.invalidateQueries({ queryKey: ['catalog'] });
            toast.success('کاتالوگ به‌روزرسانی شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ویرایش کاتالوگ'),
    });
};

export const useDeleteCatalog = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiService.catalog.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cataloges'] });
            queryClient.invalidateQueries({ queryKey: ['catalog', 'active'] });
            toast.success('کسب‌وکار با موفقیت حذف شد');
        },
        onError: (error: ApiError) => {
            if (error.data?.errorCode === 'CATALOG_HAS_ACTIVE_ADS') {
                toast.error('این کسب‌وکار آگهی فعال دارد، ابتدا آنها را حذف کنید');
            } else {
                toast.error(error.message || 'خطا در حذف کسب‌وکار');
            }
        },
    });
};

// ============================================================
// ARM HOOKS
// ============================================================
export const useArms = (enabled: boolean = true) => {
    const { isAuthenticated,hasAccess, userId } = useAuthState();

    return useQuery({
        queryKey: ['arms', userId],
        queryFn: () => apiService.arm.getUserArms(),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
        enabled:isAuthenticated && enabled && hasAccess, // ✅
    });
};

export const useArm = (slug: string) => {
    return useQuery({
        queryKey: ['arm', slug],
        queryFn: () => apiService.arm.findBySlug(slug),
        enabled: !!slug,
        staleTime: 10 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });
};

export const useArmCategoryTree = (slug: string, nodeId?: string) => {
    return useQuery({
        queryKey: ['arm', slug, 'categories', nodeId],
        queryFn: () => apiService.arm.getCategoryTree(slug, nodeId),
        enabled: !!slug,
    });
};

export const useCreateArm = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateArmDto) => apiService.arm.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['arms'] });
            toast.success('بازار با موفقیت ساخته شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ساخت بازار'),
    });
};

export const useUpdateArm = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateArmDto> }) =>
            apiService.arm.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['arms'] });
        },
    });
};

export const useJoinArm = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (slug: string) => apiService.arm.join(slug),
        onSuccess: (_, slug) => {
            queryClient.invalidateQueries({ queryKey: ['arm', slug] });
            queryClient.invalidateQueries({ queryKey: ['arms'] });
            toast.success('پیوستن با موفقیت انجام شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در پیوستن به بازار'),
    });
};

export const useLeaveArm = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (slug: string) => apiService.arm.leave(slug),
        onSuccess: (_, slug) => {
            queryClient.invalidateQueries({ queryKey: ['arm', slug] });
            queryClient.invalidateQueries({ queryKey: ['arms'] });
            toast.success('خروج با موفقیت انجام شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در خروج'),
    });
};

// ============================================================
// AD HOOKS
// ============================================================
export const useCreateAd = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateAdDto) => apiService.ad.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            queryClient.invalidateQueries({ queryKey: ['vitrine'] });
            queryClient.invalidateQueries({ queryKey: ['catalog', 'active'] });
            queryClient.invalidateQueries({ queryKey: ['cataloges'] });
            toast.success('آگهی با موفقیت ثبت شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ثبت آگهی'),
    });
};


// ─── کلیدهای کش ویترین ───
export const vitrineKeys = {
    all: ['vitrine'] as const,
    list: (slug: string, params: Record<string, unknown>) =>
        ['vitrine', 'list', slug, params] as const,
};

// ─── نرمال‌سازی پارامترها: مقادیر خالی حذف می‌شوند تا کلید کش همیشه یکتا و پایدار باشد ───
export function normalizeVitrineParams(params: Record<string, any> = {}) {
    const clean: Record<string, any> = {};
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if ((key === 'minQuantity' || key === 'minAvailableQuantity') && Number(value) <= 0) return;
        if (key === 'page' && Number(value) <= 1) return; // صفحه ۱ = حالت پیش‌فرض
        clean[key] = value;
    });
    return clean;
}

// ─── ابزار invalidation: بعد از ثبت/ویرایش/حذف/نردبان آگهی صدا زده شود ───
export function useInvalidateVitrine() {
    const queryClient = useQueryClient();
    return useCallback(() => {
        queryClient.invalidateQueries({ queryKey: vitrineKeys.all });
    }, [queryClient]);
}

/**
 * ویترین با Infinite Query:
 * - کلید کش = کل پارامترهای فیلتر (React Query کلیدهای آبجکت را مرتب hash می‌کند)
 *   → همان ترکیب فیلتر = همان ورودی کش = نمایش آنی
 * - staleTime پنج دقیقه: در این بازه هیچ درخواستی زده نمی‌شود (سرعت چند برابر)
 * - بعد از staleTime: داده کش فوراً نمایش داده می‌شود و رفرش در پس‌زمینه انجام می‌شود (الگوی SWR)
 * - placeholderData: هنگام تغییر فیلتر، لیست قبلی محو نمی‌شود (بدون فلشِ لودینگ)
 * - هر صفحه حداکثر ۱۰ صفحه در حافظه (maxPages) تا کش باد نکند
 */
export const useVitrine = (slug: string, params: Record<string, any> = {}) => {
    const normalized = useMemo(() => normalizeVitrineParams(params), [params]);

    return useInfiniteQuery({
        queryKey: vitrineKeys.list(slug, normalized),
        queryFn: ({ pageParam }) =>
            apiService.ad.getVitrine(slug, { ...normalized, page: pageParam as number, limit: normalized.limit ?? 10 }),
        initialPageParam: Number(normalized.page) || 1,
        getNextPageParam: (lastPage, _pages, lastPageParam) => {
            const totalPages = lastPage?.pagination?.totalPages;
            if (!totalPages || totalPages <= 1) return undefined;
            return (lastPageParam as number) < totalPages ? (lastPageParam as number) + 1 : undefined;
        },
        enabled: !!slug,
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        placeholderData: keepPreviousData,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
        maxPages: 10,
    });
};

export const useAd = (id: string) => {
    return useQuery({
        queryKey: ['ad', id],
        queryFn: () => apiService.ad.getOne(id),
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });
};

export const useAdDetail = (id: string, initialData?: any) => {
    return useQuery({
        queryKey: ['ad', id, 'detail'],
        queryFn: () => apiService.ad.getDetail(id),
        enabled: !!id,
        initialData,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });
};

export const useSavedAds = () => {
    const { hasAccess } = useAuthState();

    return useQuery({
        queryKey: ['saved-ads'],
        queryFn: () => apiService.ad.getSavedAds(),
        enabled: hasAccess, // ✅ فقط کاربر لاگین
    });
};

export const useAdSaved = (adId: string) => {
    const { hasAccess } = useAuthState();

    return useQuery({
        queryKey: ['ad-saved', adId],
        queryFn: () => apiService.ad.isSaved(adId),
        enabled: !!adId && hasAccess, // ✅ فقط کاربر لاگین
    });
};

export const useExtendAd = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, validityHours }: { id: string; validityHours: number }) =>
            apiService.ad.extend(id, validityHours),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['ad', id] });
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            queryClient.invalidateQueries({ queryKey: ['vitrine'] });
            queryClient.invalidateQueries({ queryKey: ['catalog', 'active'] });
            toast.success('آگهی با موفقیت تمدید شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در تمدید آگهی'),
    });
};

export const useUpdateAd = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateAdDto> }) =>
            apiService.ad.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['ad', id] });
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            queryClient.invalidateQueries({ queryKey: ['vitrine'] });
            queryClient.invalidateQueries({ queryKey: ['catalog', 'active'] });
            toast.success('آگهی با موفقیت ویرایش شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ویرایش آگهی'),
    });
};

export const useDeleteAd = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiService.ad.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            queryClient.invalidateQueries({ queryKey: ['vitrine'] });
            queryClient.invalidateQueries({ queryKey: ['catalog', 'active'] });
            toast.success('آگهی با موفقیت حذف شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در حذف آگهی'),
    });
};

export const useBumpAd = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiService.ad.bump(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: ['ad', id] });
            queryClient.invalidateQueries({ queryKey: ['ads'] });
            queryClient.invalidateQueries({ queryKey: ['vitrine'] });
            queryClient.invalidateQueries({ queryKey: ['catalog', 'active'] });
            toast.success('نردبان با موفقیت انجام شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در نردبان'),
    });
};

export const useBulkUpdateAd = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { updates: { id: string; unitPrice: number }[] }) =>
            apiService.ad.bulkUpdate(data),
        onSuccess: (_, variables) => {
            variables.updates.forEach(u => {
                queryClient.invalidateQueries({ queryKey: ['ad', u.id] });
            });
            queryClient.invalidateQueries({ queryKey: ['catalog', 'active'] });
            queryClient.invalidateQueries({ queryKey: ['cataloges'] });
            toast.success('قیمت‌ها با موفقیت به‌روز شدند');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در به‌روزرسانی'),
    });
};

export const useAdStats = (id: string) => {
    return useQuery({
        queryKey: ['ad', id, 'stats'],
        queryFn: () => apiService.ad.getStats(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5,
    });
};

// ============================================================
// CREDIT HOOKS
// ============================================================
export const useCreditBalance = () => {
    const { hasAccess } = useAuthState();

    return useQuery({
        queryKey: ['credit', 'balance'],
        queryFn: () => apiService.credit.getBalance(),
        enabled: hasAccess, // ✅ فقط کاربر لاگین
        staleTime: 1000 * 30,
    });
};

export const usePurchaseCredit = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: PurchaseCreditDto) => apiService.credit.purchase(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['credit', 'balance'] });
            toast.success('خرید اعتبار با موفقیت انجام شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در خرید اعتبار'),
    });
};

export const useManualPurchase = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: PurchaseCreditDto) => apiService.credit.manualPurchase(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['credit', 'balance'] });
            toast.success('درخواست خرید با موفقیت ثبت شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ثبت درخواست'),
    });
};

// ============================================================
// FILE HOOKS
// ============================================================
export const useUploadFile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
                         file,
                         model,
                         modelId,
                         fieldKey,
                     }: {
            file: File;
            model: 'User' | 'Catalog' | 'Ad';
            modelId: string;
            fieldKey: string;
        }): Promise<UploadFileResponse> => {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('model', model);
            formData.append('modelId', modelId);
            formData.append('fieldKey', fieldKey);
            return apiService.file.upload(formData);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            toast.success('فایل با موفقیت آپلود شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در آپلود فایل'),
    });
};

export const useDeleteFile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (fileId: string): Promise<DeleteFileResponse> =>
            apiService.file.delete(fileId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['files'] });
            toast.success('فایل با موفقیت حذف شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در حذف فایل'),
    });
};

// ============================================================
// UNITS HOOKS
// ============================================================
export const useUnits = () => {
    return useQuery({
        queryKey: ['units'],
        queryFn: () => apiService.units.getAll(),
        staleTime: 1000 * 60 * 5,
    });
};

// ============================================================
// ACTIVITY HOOKS
// ============================================================
export const useActivities = () => {
    return useQuery({
        queryKey: ['activities'],
        queryFn: () => apiService.activity.getAll(),
        staleTime: 1000 * 60 * 5,
    });
};

export const useActivityLeaves = () => {
    return useQuery({
        queryKey: ['activities', 'leaves'],
        queryFn: () => apiService.activity.getLeaves(),
        staleTime: 1000 * 60 * 5,
    });
};

export const useActivityTree = () => {
    return useQuery({
        queryKey: ['activities', 'tree'],
        queryFn: () => apiService.activity.getTree(),
        staleTime: 1000 * 60 * 5,
    });
};

// ============================================================
// SETTINGS HOOKS
// ============================================================
export const useCreditSettings = () => {
    return useQuery({
        queryKey: ['admin', 'settings', 'credit'],
        queryFn: () => apiService.settings.getCredit(),
        staleTime: 1000 * 60 * 5,
    });
};

export const useUpdateCreditSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiService.settings.updateCredit(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'credit'] });
            toast.success('تنظیمات اعتبار با موفقیت ذخیره شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ذخیره تنظیمات اعتبار'),
    });
};

export const useGeneralSettings = () => {
    return useQuery({
        queryKey: ['admin', 'settings', 'general'],
        queryFn: () => apiService.settings.getGeneral(),
        staleTime: 1000 * 60 * 5,
    });
};

export const useUpdateGeneralSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiService.settings.updateGeneral(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'general'] });
            toast.success('تنظیمات عمومی با موفقیت ذخیره شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ذخیره تنظیمات عمومی'),
    });
};

export const useSecuritySettings = () => {
    return useQuery({
        queryKey: ['admin', 'settings', 'security'],
        queryFn: () => apiService.settings.getSecurity(),
        staleTime: 1000 * 60 * 5,
    });
};

export const useUpdateSecuritySettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiService.settings.updateSecurity(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'security'] });
            toast.success('تنظیمات امنیتی با موفقیت ذخیره شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ذخیره تنظیمات امنیتی'),
    });
};

export const useAppearanceSettings = () => {
    return useQuery({
        queryKey: ['admin', 'settings', 'appearance'],
        queryFn: () => apiService.settings.getAppearance(),
        staleTime: 1000 * 60 * 5,
    });
};

export const useUpdateAppearanceSettings = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiService.settings.updateAppearance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings', 'appearance'] });
            toast.success('تنظیمات ظاهری با موفقیت ذخیره شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ذخیره تنظیمات ظاهری'),
    });
};

export const useSetting = (key: string) => {
    return useQuery({
        queryKey: ['admin', 'settings', key],
        queryFn: () => apiService.settings.getOne(key),
        enabled: !!key,
        staleTime: 1000 * 60 * 5,
    });
};

export const useUpdateSetting = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ key, value }: { key: string; value: any }) =>
            apiService.settings.setOne(key, value),
        onSuccess: (_, { key }) => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'settings', key] });
            toast.success('تنظیمات با موفقیت ذخیره شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ذخیره تنظیمات'),
    });
};

// ============================================================
// INDUSTRY HOOKS
// ============================================================
export const useIndustriesTree = () => {
    return useQuery({
        queryKey: ['industries', 'tree'],
        queryFn: () => apiService.admin.industries.getTree(),
        staleTime: Infinity,
        gcTime: Infinity,
        retry: 1,
    });
};

export const useIndustriesLeaves = () => {
    return useQuery({
        queryKey: ['industries', 'leaves'],
        queryFn: () => apiService.admin.industries.getLeaves(),
        staleTime: Infinity,
        gcTime: Infinity,
    });
};

// ============================================================
// CATEGORY HOOKS
// ============================================================
export const useCategoriesFlat = () => {
    return useQuery({
        queryKey: ['admin', 'categories', 'flat'],
        queryFn: () => apiService.admin.categories.getAllFlat(),
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

export const useCategoriesTree = () => {
    return useQuery({
        queryKey: ['admin', 'categories', 'tree'],
        queryFn: () => apiService.admin.categories.getTree(),
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60,
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

// ============================================================
// LOCATION TREE HOOK
// ============================================================
export const useLocationTree = () => {
    return useQuery({
        queryKey: ['locations', 'tree'],
        queryFn: () => apiService.location.getFullTree(),
        staleTime: Infinity,
        gcTime: Infinity,
    });
};

// ============================================================
// ARM-ADMIN: CATALOGS — مدیریت کاتالوگ‌های بازار (پنل مالک)
// ============================================================

/** کلیدهای کش — صرفاً از اینجا مصرف شوند تا invalidation متقاطع همیشه درست کار کند */
export const armCatalogKeys = {
    prefix: (slug: string) => ['arm-admin', 'catalogs', slug] as const,
    list: (slug: string, params: Record<string, unknown> = {}) =>
        ['arm-admin', 'catalogs', slug, 'list', params] as const,
    candidates: (slug: string, q = '', mine = false) =>
        ['arm-admin', 'catalogs', slug, 'candidates', q, mine] as const,
    needs: (slug: string) => ['arm-admin', 'catalogs', slug, 'needs'] as const,
    referrals: (slug: string) => ['arm-admin', 'catalogs', slug, 'referrals'] as const,
};

/**
 * invalidation مرکزی — بعد از هر تغییرِ عضویت/انتشار/دسته صدا زده می‌شود.
 * چون کالاهای ویترین آمده‌اند/رفته‌اند، کش ویترین و آمار پنل هم تازه می‌شود.
 */
export function useInvalidateArmCatalogs() {
    const queryClient = useQueryClient();
    return useCallback((slug: string) => {
        queryClient.invalidateQueries({ queryKey: armCatalogKeys.prefix(slug) }); // لیست + کاندید + needs
        queryClient.invalidateQueries({ queryKey: ['vitrine'] });                 // تابلوی بازار تغییر کرده
        queryClient.invalidateQueries({ queryKey: ['arm-stats'] });               // شمارنده‌های داشبورد مالک
    }, [queryClient]);
}


/** جستجوی کاتالوگ برای افزودن — placeholderData برای نبودِ فلش هنگام تایپ */
export const useArmCatalogCandidates = (slug?: string, q = '', onlyMine = false, enabled = true) => {
    return useQuery({
        queryKey: armCatalogKeys.candidates(slug ?? '', q, onlyMine),
        queryFn: () => apiService.armAdmin.catalogs.getCandidates(slug!, q || undefined, onlyMine),
        enabled: !!slug && enabled,
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

/** کالاهای منتشرشدهٔ بدون دستهٔ بازاری */
export const useArmCatalogNeeds = (slug?: string, enabled = true) => {
    return useQuery({
        queryKey: armCatalogKeys.needs(slug ?? ''),
        queryFn: () => apiService.armAdmin.catalogs.getNeedsCategory(slug!),
        enabled: !!slug && enabled,
        staleTime: 30_000,
    });
};

/** آمار جذب مالک بازار — به‌ندرت تغییر می‌کند؛ کش بلند */
export const useArmCatalogReferrals = (slug?: string, enabled = true) => {
    return useQuery({
        queryKey: armCatalogKeys.referrals(slug ?? ''),
        queryFn: () => apiService.armAdmin.catalogs.getReferralStats(slug!),
        enabled: !!slug && enabled,
        staleTime: 5 * 60_000,
    });
};

// ─── Mutations ───
// نکته: وضعیت per-row با mutation.isPending + mutation.variables تشخیص داده می‌شود
// — بدون هیچ state دستیِ busyId

export const useAddCatalogToArm = (slug?: string) => {
    const invalidate = useInvalidateArmCatalogs();
    return useMutation({
        mutationFn: (catalogId: string) =>
            apiService.armAdmin.catalogs.addCatalog(slug!, catalogId),
        onSuccess: () => invalidate(slug!),
        onError: (error: ApiError) => toast.error(error.message || 'خطا در افزودن کاتالوگ'),
    });
};

export const useToggleCatalogPaused = (slug?: string) => {
    const invalidate = useInvalidateArmCatalogs();
    return useMutation({
        mutationFn: ({ catalogId, paused }: { catalogId: string; paused: boolean }) =>
            apiService.armAdmin.catalogs.setPaused(slug!, catalogId, paused),
        onSuccess: (_, { paused }) =>
            toast.success(paused ? 'عضویت متوقف شد — کالاها از تابلو برداشته شد' : 'عضویت ادامه یافت'),
        onError: (error: ApiError) => toast.error(error.message || 'خطا'),
    });
};

export const useRemoveCatalogFromArm = (slug?: string) => {
    const invalidate = useInvalidateArmCatalogs();
    return useMutation({
        mutationFn: (catalogId: string) =>
            apiService.armAdmin.catalogs.remove(slug!, catalogId),
        onSuccess: () => toast.success('کاتالوگ از بازار حذف شد'),
        onError: (error: ApiError) => toast.error(error.message || 'خطا'),
    });
};

export const useSetAdMarketCategory = (slug?: string) => {
    const invalidate = useInvalidateArmCatalogs();
    return useMutation({
        mutationFn: ({ adId, categoryId }: { adId: string; categoryId: string }) =>
            apiService.armAdmin.catalogs.setAdCategory(slug!, adId, categoryId),
        onSuccess: () => invalidate(slug!),
        onError: (error: ApiError) => toast.error(error.message || 'خطا'),
    });
};

// ============================================================
// MARKET SETUP — کالاهای بی‌دستهٔ کاربر در بازار (داشبورد)
// ============================================================
export const useMyUncategorized = (enabled = true) => {
    const { hasAccess } = useAuthState();
    return useQuery({
        queryKey: ['my-uncategorized'],
        queryFn: () => apiService.userMarket.getMyNeedsCategory(),
        enabled: !!enabled && hasAccess,
        staleTime: 30_000,
    });
};

export const useSetOwnAdCategory = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ adId, categoryId }: { adId: string; categoryId: string }) =>
            apiService.userMarket.setAdCategory(adId, categoryId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-uncategorized'] });
            queryClient.invalidateQueries({ queryKey: ['catalog-products'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-derived'] });
            queryClient.invalidateQueries({ queryKey: ['vitrine'] });
            toast.success('دستهٔ بازاری ثبت شد — کالای تو حالا در فیلترهای بازار پیدا می‌شود');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا'),
    });
};

// ============================================================
// ARM-ADMIN: گسترش useArmCatalogs با پارامترهای سرور-side (جایگزین قبلی)
// ============================================================
export const useArmCatalogs = (
    slug?: string,
    params?: { search?: string; ownerStatus?: string; sortBy?: string; sortOrder?: string },
) => {
    return useQuery({
        queryKey: armCatalogKeys.list(slug ?? '', params ?? {}),
        queryFn: () => apiService.armAdmin.catalogs.getList(slug!, params),
        enabled: !!slug,
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
};

// ============================================================
// BUSINESS — نهاد تجاری
// ============================================================
export const useMyBusinesses = (enabled = true) => {
    const { hasAccess } = useAuthState();
    return useQuery({
        queryKey: ['businesses-entity'],
        queryFn: () => apiService.business.getMy(),
        enabled: !!enabled && hasAccess,
        staleTime: 5 * 60_000,
    });
};

export const useCreateBusinessEntity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => apiService.business.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['businesses-entity'] });
            toast.success('کسب‌وکار ثبت شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ثبت کسب‌وکار'),
    });
};

export const useUpdateBusinessEntity = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => apiService.business.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['businesses-entity'] });
            toast.success('کسب‌وکار به‌روزرسانی شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا'),
    });
};

// ============================================================
// ARM-ADMIN: MEMBERSHIPS — فروشندگان و خریداران بازار (دو-مرحله‌ای)
// ============================================================
export const armMemberKeys = {
    prefix: (slug: string) => ['arm-admin', 'memberships', slug] as const,
    sellers: (slug: string, params: Record<string, unknown> = {}) =>
        ['arm-admin', 'memberships', slug, 'sellers', params] as const,
    sellerCandidates: (slug: string, q = '', mine = false) =>
        ['arm-admin', 'memberships', slug, 'seller-candidates', q, mine] as const,
    buyers: (slug: string, params: Record<string, unknown> = {}) =>
        ['arm-admin', 'memberships', slug, 'buyers', params] as const,
    buyerCandidates: (slug: string, q = '', mine = false) =>
        ['arm-admin', 'memberships', slug, 'buyer-candidates', q, mine] as const,
    needs: (slug: string) => ['arm-admin', 'memberships', slug, 'needs'] as const,
};

/** invalidation مرکزی — فقط لیست‌های اصلی sellers و buyers invalidate می‌شن */
export function useInvalidateArmMembers() {
    const queryClient = useQueryClient();
    return useCallback((slug: string) => {
        // فقط لیست sellers و buyers رو invalidate کن (نه candidates)
        queryClient.invalidateQueries({ queryKey: ['arm-admin', 'memberships', slug, 'sellers'] });
        queryClient.invalidateQueries({ queryKey: ['arm-admin', 'memberships', slug, 'buyers'] });
        queryClient.invalidateQueries({ queryKey: ['vitrine'] });
        queryClient.invalidateQueries({ queryKey: ['arm-stats'] });
        queryClient.invalidateQueries({ queryKey: ['notifications-derived'] });
    }, [queryClient]);
}

// ─── فروشندگان ───
export const useArmSellers = (slug?: string, params?: Record<string, any>) => {
    return useQuery({
        queryKey: armMemberKeys.sellers(slug ?? '', params ?? {}),
        queryFn: () => apiRequest(`/arm-admin/${slug}/memberships/sellers`, { params }),
        enabled: !!slug,
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
};

export const useArmSellerCandidates = (
    slug?: string,
    q = '',
    onlyMine = false,
    enabled = true,
    filters?: { industry?: string; cityCode?: string; provinceCode?: string },
) => {
    return useQuery({
        queryKey: armMemberKeys.sellerCandidates(slug ?? '', q, onlyMine, filters),
        queryFn: () => apiRequest(`/arm-admin/${slug}/memberships/sellers/candidates`, {
            params: {
                ...(q ? { q } : {}),
                ...(onlyMine ? { myReferrals: '1' } : {}),
                ...(filters?.industry ? { industry: filters.industry } : {}),
                ...(filters?.cityCode ? { cityCode: filters.cityCode } : {}),
                ...(filters?.provinceCode ? { provinceCode: filters.provinceCode } : {}),
            },
        }),
        enabled: !!slug && enabled,
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export const useAddSeller = (slug?: string) => {
    const invalidate = useInvalidateArmMembers();
    return useMutation({
        mutationFn: (catalogId: string) =>
            apiRequest(`/arm-admin/${slug}/memberships/sellers`, { method: 'POST', data: { catalogId } }),
        onSuccess: () => invalidate(slug!),
        onError: (error: ApiError) => toast.error(error.message || 'خطا در افزودن فروشنده'),
    });
};

export const useToggleSellerPaused = (slug?: string) => {
    const invalidate = useInvalidateArmMembers();
    return useMutation({
        mutationFn: ({ catalogId, paused }: { catalogId: string; paused: boolean }) =>
            apiRequest(`/arm-admin/${slug}/memberships/sellers/${catalogId}`, { method: 'PATCH', data: { paused } }),
        onSuccess: (_, { paused }) => {
            toast.success(
                paused
                    ? 'عضویت فروشنده موقتاً متوقف شد — آگهی‌هایش فعلاً در این بازار نمایش داده نمی‌شود'
                    : 'فروشنده دوباره فعال شد — آگهی‌هایش روی تابلوی بازار نمایش داده می‌شود'
            );
            invalidate(slug!);
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا'),
    });
};

export const useRemoveSeller = (slug?: string) => {
    const invalidate = useInvalidateArmMembers();
    return useMutation({
        mutationFn: (catalogId: string) =>
            apiRequest(`/arm-admin/${slug}/memberships/sellers/${catalogId}`, { method: 'DELETE' }),
        onSuccess: () => {
            toast.success('نقش فروشندگی این کاتالوگ در بازار حذف شد');
            invalidate(slug!);
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا'),
    });
};

export const useSetAdMarketCategoryAdmin = (slug?: string) => {
    const invalidate = useInvalidateArmMembers();
    return useMutation({
        mutationFn: ({ adId, categoryId }: { adId: string; categoryId: string }) =>
            apiRequest(`/arm-admin/${slug}/memberships/sellers/ads/${adId}/category`, { method: 'PATCH', data: { categoryId } }),
        onSuccess: () => invalidate(slug!),
        onError: (error: ApiError) => toast.error(error.message || 'خطا'),
    });
};

export const useArmNeedsCategory = (slug?: string, enabled = true) => {
    return useQuery({
        queryKey: armMemberKeys.needs(slug ?? ''),
        queryFn: () => apiRequest(`/arm-admin/${slug}/memberships/needs-category`),
        enabled: !!slug && enabled,
        staleTime: 30_000,
    });
};

// ─── خریداران ───
export const useArmBuyers = (slug?: string, params?: Record<string, any>) => {
    return useQuery({
        queryKey: armMemberKeys.buyers(slug ?? '', params ?? {}),
        queryFn: () => apiRequest(`/arm-admin/${slug}/memberships/buyers`, { params }),
        enabled: !!slug,
        staleTime: 30_000,
        placeholderData: keepPreviousData,
    });
};

export const useArmBuyerCandidates = (
    slug?: string,
    q = '',
    onlyMine = false,
    enabled = true,
    filters?: { industry?: string; cityCode?: string; provinceCode?: string },
) => {
    return useQuery({
        queryKey: armMemberKeys.buyerCandidates(slug ?? '', q, onlyMine, filters),
        queryFn: () => apiRequest(`/arm-admin/${slug}/memberships/buyers/candidates`, {
            params: {
                ...(q ? { q } : {}),
                ...(onlyMine ? { myReferrals: '1' } : {}),
                ...(filters?.industry ? { industry: filters.industry } : {}),
                ...(filters?.cityCode ? { cityCode: filters.cityCode } : {}),
                ...(filters?.provinceCode ? { provinceCode: filters.provinceCode } : {}),
            },
        }),
        enabled: !!slug && enabled,
        staleTime: 60_000,
        placeholderData: keepPreviousData,
    });
};

export const useAddBuyer = (slug?: string) => {
    const invalidate = useInvalidateArmMembers();
    return useMutation({
        mutationFn: (businessId: string) =>
            apiRequest(`/arm-admin/${slug}/memberships/buyers`, { method: 'POST', data: { businessId } }),
        onSuccess: () => invalidate(slug!),
        onError: (error: ApiError) => toast.error(error.message || 'خطا در افزودن خریدار'),
    });
};

export const useRemoveBuyer = (slug?: string) => {
    const invalidate = useInvalidateArmMembers();
    return useMutation({
        mutationFn: (membershipId: string) =>
            apiRequest(`/arm-admin/${slug}/memberships/buyers/${membershipId}`, { method: 'DELETE' }),
        onSuccess: () => {
            toast.success('این کسب‌وکار از نقش خریداری بازار خارج شد');
            invalidate(slug!);
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا'),
    });
};

export const useToggleBuyerPaused = (slug?: string) => {
    const invalidate = useInvalidateArmMembers();
    return useMutation({
        mutationFn: ({ membershipId, paused }: { membershipId: string; paused: boolean }) =>
            apiRequest(`/arm-admin/${slug}/memberships/buyers/${membershipId}/pause`, { method: 'PATCH', data: { paused } }),
        onSuccess: (_, { paused }) => {
            toast.success(
                paused
                    ? 'این خریدار موقتاً از بازار خارج شد — حق دیدن قیمت‌ها را ندارد'
                    : 'این کسب‌وکار دوباره به‌عنوان خریدار بازار فعال شد'
            );
            invalidate(slug!);
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا'),
    });
};