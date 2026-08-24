// lib/api/apiHooks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from './apiService';
import {
    ApiError,
    LoginCredentials,
    RegisterCredentials,
    CreateBusinessDto,
    UpdateBusinessDto,
    CreateArmDto,
    CreateAdDto,
    AdListQuery,
    PurchaseCreditDto,
    UploadFileResponse,
    DeleteFileResponse
} from './apiTypes';
import { toast } from 'sonner';
import {useSelector} from "react-redux";
import {RootState} from "@/lib/store/store";

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
// BUSINESS HOOKS
// ============================================================
export const useBusinesses = () => {
    return useQuery({
        queryKey: ['businesses'],
        queryFn: () => apiService.business.getAll(),
    });
};

export const useActiveBusiness = () => {
    return useQuery({
        queryKey: ['business', 'active'],
        queryFn: () => apiService.business.getActive(),
        retry: false,
        staleTime: 1000 * 60 * 5,
    });
};


export const useBusiness = (id: string) => {
    return useQuery({
        queryKey: ['business', id],
        queryFn: () => apiService.business.getOne(id),
        enabled: !!id,
        // ✅ تنظیمات جدید برای رفرش خودکار در هر بار ورود به صفحه
        staleTime: 0,              // داده‌ها را فوراً "کهنه" فرض کن
        refetchOnMount: true,     // با هر بار مونت شدن کامپوننت، درخواست جدید بفرست
        refetchOnWindowFocus: true, // حتی اگر کاربر از تب دیگر برگردد، رفرش شود
    });
};

export const useLocationsTree = () => {
    return useQuery({
        queryKey: ['locations', 'tree'],
        queryFn: () => apiService.location.getFullTree(),
        staleTime: 1000 * 60 * 60 * 24, // ۲۴ ساعت کش
        gcTime: 1000 * 60 * 60 * 24,
    });
};

export const useCreateBusiness = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateBusinessDto) => apiService.business.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['businesses'] });
            queryClient.invalidateQueries({ queryKey: ['business', 'active'] });
           // toast.success('کسب‌وکار با موفقیت ثبت شد');
        },
        onError: (error: ApiError) => {
            if (error.data?.errorCode === 'DUPLICATE_BUSINESS_NAME') {
                toast.error('شما قبلاً یک کسب‌وکار با این نام ثبت کرده‌اید');
            } else {
                toast.error(error.message || 'خطا در ثبت کسب‌وکار');
            }
        },
    });
};

export const useUpdateBusiness = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateBusinessDto }) =>
            apiService.business.update(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: ['business', id] });
            queryClient.invalidateQueries({ queryKey: ['business', 'active'] });
            queryClient.invalidateQueries({ queryKey: ['businesses'] });
            toast.success('کسب‌وکار با موفقیت ویرایش شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ویرایش کسب‌وکار'),
    });
};

export const useDeleteBusiness = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => apiService.business.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['businesses'] });
            queryClient.invalidateQueries({ queryKey: ['business', 'active'] });
            toast.success('کسب‌وکار با موفقیت حذف شد');
        },
        onError: (error: ApiError) => {
            if (error.data?.errorCode === 'BUSINESS_HAS_ACTIVE_ADS') {
                toast.error('این کسب‌وکار آگهی فعال دارد، ابتدا آنها را حذف کنید');
            } else {
                toast.error(error.message || 'خطا در حذف کسب‌وکار');
            }
        },
    });
};

// ============================================================
// ARM HOOKS بازارهای که کاربر در آنها عضو است
// ============================================================

export const useArms = () => {
    const user = useSelector((state: RootState) => state.auth.user);
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const userId = user?.id;

    return useQuery({
        queryKey: ['arms', userId],
        queryFn: () => apiService.arm.getUserArms(),
        staleTime: 5 * 60 * 1000, // ✅ ۵ دقیقه کش
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: false,      // ✅ با mount رفرش نشود
        enabled: isAuthenticated && !!userId,
    });
};

export const useArm = (slug: string) => {
    return useQuery({
        queryKey: ['arm', slug],
        queryFn: () => apiService.arm.findBySlug(slug),
        enabled: !!slug,
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
            queryClient.invalidateQueries({ queryKey: ['business', 'active'] });
            queryClient.invalidateQueries({ queryKey: ['businesses'] });
            toast.success('آگهی با موفقیت ثبت شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در ثبت آگهی'),
    });
};


export const useVitrine = (slug: string, query: AdListQuery) => {
    const queryKey = ['vitrine', slug, JSON.stringify(query)];

    return useQuery({
        queryKey,
        queryFn: () => apiService.ad.getVitrine(slug, query),
        enabled: !!slug,
        staleTime: 1000 * 30,
    });
};

export const useBusinessAds = (businessId: string) => {
    return useQuery({
        queryKey: ['ads', 'business', businessId],
        queryFn: () => apiService.ad.getBusinessAds(businessId),
        enabled: !!businessId,
    });
};

export const useAd = (id: string) => {
    return useQuery({
        queryKey: ['ad', id],
        queryFn: () => apiService.ad.getOne(id),
        enabled: !!id,
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
            queryClient.invalidateQueries({ queryKey: ['business', 'active'] });
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
            queryClient.invalidateQueries({ queryKey: ['business', 'active'] });
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
            queryClient.invalidateQueries({ queryKey: ['business', 'active'] });
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
            queryClient.invalidateQueries({ queryKey: ['business', 'active'] });
            toast.success('نردبان با موفقیت انجام شد');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در نردبان'),
    });
};

// lib/api/apiHooks.ts
export const useBulkUpdateAd = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: { updates: { id: string; unitPrice: number }[] }) =>
            apiService.ad.bulkUpdate(data),
        onSuccess: (_, variables) => {
            // حذف کش آگهی‌های تغییر کرده
            variables.updates.forEach(u => {
                queryClient.invalidateQueries({ queryKey: ['ad', u.id] });
            });
            // حذف کش کسب‌وکار فعال (که شامل لیست آگهی‌هاست)
            queryClient.invalidateQueries({ queryKey: ['business', 'active'] });
            // حذف کش هر کسب‌وکاری که ممکن است این آگهی‌ها را داشته باشد
            queryClient.invalidateQueries({ queryKey: ['businesses'] });
            // اگر businessId خاصی مشخص باشد، می‌توانیم آن را هم invalidate کنیم
            toast.success('قیمت‌ها با موفقیت به‌روز شدند');
        },
        onError: (error: ApiError) => toast.error(error.message || 'خطا در به‌روزرسانی'),
    });
};
// ============================================================
// CREDIT HOOKS
// ============================================================
export const useCreditBalance = () => {
    return useQuery({
        queryKey: ['credit', 'balance'],
        queryFn: () => apiService.credit.getBalance(),
        staleTime: 1000 * 30, // 30 ثانیه کش
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
            model: 'User' | 'Business' | 'Ad';
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
// lib/api/apiHooks.ts - اضافه کردن بخش settings

// ============================================================
// SETTINGS HOOKS (ادمین)
// ============================================================

// ============================================================
// تنظیمات اعتبار
// ============================================================
export const useCreditSettings = () => {
    return useQuery({
        queryKey: ['admin', 'settings', 'credit'],
        queryFn: () => apiService.settings.getCredit(),
        staleTime: 1000 * 60 * 5, // 5 دقیقه
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
        onError: (error: ApiError) => {
            toast.error(error.message || 'خطا در ذخیره تنظیمات اعتبار');
        },
    });
};

// ============================================================
// تنظیمات عمومی
// ============================================================
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
        onError: (error: ApiError) => {
            toast.error(error.message || 'خطا در ذخیره تنظیمات عمومی');
        },
    });
};

// ============================================================
// تنظیمات امنیتی
// ============================================================
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
        onError: (error: ApiError) => {
            toast.error(error.message || 'خطا در ذخیره تنظیمات امنیتی');
        },
    });
};

// ============================================================
// تنظیمات ظاهری
// ============================================================
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
        onError: (error: ApiError) => {
            toast.error(error.message || 'خطا در ذخیره تنظیمات ظاهری');
        },
    });
};

// ============================================================
// تنظیمات تکی
// ============================================================
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
        onError: (error: ApiError) => {
            toast.error(error.message || 'خطا در ذخیره تنظیمات');
        },
    });
};

// ✅ هوک برای دریافت آمار کامل

export const useAdStats = (id: string) => {
    return useQuery({
        queryKey: ['ad', id, 'stats'],
        queryFn: () => apiService.ad.getStats(id),
        enabled: !!id,
        staleTime: 1000 * 60 * 5, // ۵ دقیقه
    });
};


// ──────────────────────────────────────────────
// 🔹 هوک‌های مربوط به اصناف (Industry)
// ──────────────────────────────────────────────
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


// ──────────────────────────────────────────────
// 🔹 هوک‌های مربوط به دسته‌بندی کالا (Categories)
// ──────────────────────────────────────────────

/**
 * ✅ دریافت لیست مسطح تمام دسته‌بندی‌ها
 * برای استفاده در مودال انتخاب دسته‌بندی مرجع
 * داده‌ها کش می‌شوند چون تغییرات کم دارند
 */
export const useCategoriesFlat = () => {
    return useQuery({
        queryKey: ['admin', 'categories', 'flat'],
        queryFn: () => apiService.admin.categories.getAllFlat(),  // ✅ اصلاح شد
        staleTime: 1000 * 60 * 30,  // 30 دقیقه کش
        gcTime: 1000 * 60 * 60,   // 1 ساعت در حافظه
        retry: 2,
        refetchOnWindowFocus: false,
    });
};

/**
 * ✅ دریافت درخت کامل دسته‌بندی‌ها
 * برای صفحه مدیریت دسته‌بندی‌ها
 */
export const useCategoriesTree = () => {
    return useQuery({
        queryKey: ['admin', 'categories', 'tree'],
        queryFn: () => apiService.admin.categories.getTree(),
        staleTime: 1000 * 60 * 30,  // 30 دقیقه کش
        gcTime: 1000 * 60 * 60,   // 1 ساعت در حافظه
        retry: 2,
        refetchOnWindowFocus: false,
    });
};



// ──────────────────────────────────────────────
// 🔹 هوک لوکیشن
// ──────────────────────────────────────────────
export const useLocationTree = () => {
    return useQuery({
        queryKey: ['locations', 'tree'],
        queryFn: () => apiService.location.getFullTree(),
        staleTime: Infinity,
        gcTime: Infinity,
    });
};



// lib/api/apiHooks.ts

export const useAdDetail = (id: string, initialData?: any) => {
    return useQuery({
        queryKey: ['ad', id, 'detail'],
        queryFn: () => apiService.ad.getDetail(id),
        enabled: !!id,
        initialData, // ✅ استفاده از initialData
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 1,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
    });
};

export const useAdSaved = (id: string) => {
    return useQuery({
        queryKey: ['ad', id, 'saved'],
        queryFn: () => apiService.ad.getSavedAds().then(s => s.some((a: any) => a.id === id)),
        enabled: false, // ✅ فقط دستی fetch شود
        staleTime: 60 * 1000,
    });
};



