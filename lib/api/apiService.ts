// lib/api/apiService.ts
import {apiRequest, apiFileRequest, API_BASE} from './apiRequest';
import {
    LoginCredentials,
    LoginResponse,
    RegisterCredentials,
    RegisterResponse,
    CreateBusinessDto,
    Business,
    CreateArmDto,
    Arm,
    CreateAdDto,
    Ad,
    AdListQuery,
    PurchaseCreditDto,
    PurchaseCreditResponse,
    CreditBalance, User,
} from './apiTypes';

export const apiService = {
    // ============================================================
    // AUTH
    // ============================================================
// lib/api/apiService.ts – داخل بخش auth

    auth: {
        login: (data: LoginCredentials): Promise<LoginResponse> =>
            apiRequest('/auth/login', { method: 'POST', data }),

        register: (data: RegisterCredentials): Promise<RegisterResponse> =>
            apiRequest('/auth/register', { method: 'POST', data }),

        logout: (): Promise<any> =>
            apiRequest('/auth/logout', { method: 'POST' }),

        updateProfile: (data: any): Promise<User> =>
            apiRequest('/auth/profile', { method: 'PUT', data }),

        getProfile: (): Promise<User> => apiRequest('/auth/me'),

        // ✅ تغییر رمز عبور (برای کاربران با رمز موقت یا عادی)
        changePassword: (data: { currentPassword?: string; newPassword: string }): Promise<any> =>
            apiRequest('/auth/change-password', { method: 'PUT', data }),
    },




    // ============================================================
    // BUSINESS
    // ============================================================
    business: {
        create: (data: CreateBusinessDto): Promise<Business> =>
            apiRequest('/business', { method: 'POST', data }),

        getAll: (): Promise<Business[]> =>
            apiRequest('/business'),

        getActive: (): Promise<Business | null> =>
            apiRequest('/business/active'),

        getOne: (id: string): Promise<Business> =>
            apiRequest(`/business/${id}`),

        update: (id: string, data: Partial<CreateBusinessDto>): Promise<Business> =>
            apiRequest(`/business/${id}`, { method: 'PUT', data }),

        delete: (id: string): Promise<{ message: string }> =>
            apiRequest(`/business/${id}`, { method: 'DELETE' }),

        requestVerification: (businessId: string, data: any): Promise<Business> =>
            apiRequest(`/business/${businessId}/verify`, { method: 'POST', data }),

        getBySlug: (slug: string) => apiRequest(`/business/slug/${slug}`),
    },

    // ============================================================
    // ARM
    // ============================================================
    arm: {
        getAllCategoryFlat: (slug?: string): Promise<any[]> =>
            apiRequest('/arm/categories/flat'),

        create: (data: CreateArmDto): Promise<Arm> =>
            apiRequest('/arm', { method: 'POST', data }),

        findBySlug: (slug: string): Promise<Arm> =>
            apiRequest(`/arm/${slug}`),

        getStats: (slug: string): Promise<{ members: number; activeAds: number }> =>
            apiRequest(`/arm/${slug}/stats`),

        join: (slug: string, body?: { roleType?: 'seller' | 'buyer'; businessId?: string }): Promise<any> =>
            apiRequest(`/arm/${slug}/join`, { method: 'POST', data: body }),

        leave: (slug: string): Promise<any> =>
            apiRequest(`/arm/${slug}/leave`, { method: 'DELETE' }),

        getUserArms: (): Promise<any[]> =>
            apiRequest('/arm/user/my-arms'),

        getCategoryTree: (slug: string, nodeId?: string): Promise<any> =>
            apiRequest(`/arm/${slug}/categories${nodeId ? `?nodeId=${nodeId}` : ''}`),


        getConfig: (slug: string): Promise<any> =>
            apiRequest(`/arm/${slug}/config`),

        delete: (id: string): Promise<any> =>
            apiRequest(`/arm/${id}`, { method: 'DELETE' }),

        fetchArmData: async (slug: string): Promise<Arm> => {
            try {
                const arm = await apiRequest(`/arm/${slug}`);
                console.log('📍 fetchArmData: received arm with locationTree:', arm.locationTree);
                return arm;
            } catch (error: any) {
                console.error('❌ fetchArmData error:', error);
                if (error?.code === 'ECONNREFUSED' || error?.code === 'ERR_NETWORK') {
                    const networkError = new Error('سرور در دسترس نیست. لطفاً بعداً تلاش کنید.');
                    (networkError as any).code = 'SERVER_UNAVAILABLE';
                    throw networkError;
                }
                if (error?.data?.errorCode === 'ARM_NOT_FOUND') {
                    throw new Error(``);
                }
                throw new Error(error?.message || 'خطا در دریافت اطلاعات بازار');
            }
        },
        update: (id: string, data: Partial<CreateArmDto>): Promise<Arm> =>
            apiRequest(`/arm/${id}`, { method: 'PUT', data }),

        // جدید: دریافت بازار با id
        findById: (id: string): Promise<Arm> =>
            apiRequest(`/arm/${id}`),   // بک‌اند باید این route را پشتیبانی کند
    },

    // ============================================================
    // AD
    // ============================================================
    ad: {
        create: (data: CreateAdDto): Promise<Ad> =>
            apiRequest('/ad', { method: 'POST', data }),

        getVitrine: (slug: string, query: AdListQuery): Promise<{ arm: any; ads: Ad[]; pagination: any }> =>
            apiRequest(`/ad/arm/${slug}`, { method: 'GET', params: query }),
        getBusinessAds: (businessId: string, page: number = 1, limit: number = 10, search?: string) =>
            apiRequest(`/ad/business/${businessId}?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`),

        getOne: (id: string): Promise<Ad> =>
            apiRequest(`/ad/${id}`),

        update: (id: string, data: Partial<CreateAdDto>): Promise<Ad> =>
            apiRequest(`/ad/${id}`, { method: 'PUT', data }),

        delete: (id: string): Promise<any> =>
            apiRequest(`/ad/${id}`, { method: 'DELETE' }),

        bump: (id: string): Promise<any> =>
            apiRequest(`/ad/${id}/bump`, { method: 'POST' }),

        extend: (id: string, validityHours: number): Promise<Ad> =>
            apiRequest(`/ad/${id}/extend`, { method: 'POST', data: { validityHours } }),

        getPriceHistory: (id: string): Promise<{ currentPrice: number; history: any[] }> =>
            apiRequest(`/ad/${id}/price-history`),


        getContact: (id: string): Promise<{
            businessName: string;
            phone: string;
            remainingCalls: number;
            dailyLimit: number;
        }> =>
            apiRequest(`/ad/${id}/contact`),

        bulkUpdate: (data: { updates: { id: string; unitPrice: number }[] }) =>
            apiRequest('/ad/bulk-update', { method: 'PUT', data }),
        // ✅ دریافت جزئیات کامل آگهی (برای صفحه جزئیات)
        getDetail: (id: string): Promise<any> =>
            apiRequest(`/ad/${id}/detail`),



        // ✅ ثبت تعامل (بازدید، ذخیره، تماس، کامنت، اشتراک)
        interact: (id: string, type: 'view' | 'save' | 'call' | 'comment' | 'share', metadata?: any): Promise<any> =>
            apiRequest(`/ad/${id}/interact`, {
                method: 'POST',
                data: { type, metadata },
            }),

        // ✅ ذخیره آگهی (bookmark)
        save: (id: string): Promise<any> =>
            apiRequest(`/ad/${id}/save`, { method: 'POST' }),

        // ✅ حذف از لیست ذخیره‌ها
        unsave: (id: string): Promise<any> =>
            apiRequest(`/ad/${id}/save`, { method: 'DELETE' }),

        // ✅ دریافت لیست آگهی‌های ذخیره‌شده کاربر (در صورت نیاز)
        getSavedAds: (): Promise<any[]> =>
            apiRequest('/ad/saved'), // مسیر فرضی - در صورت وجود در بک‌اند

        isSaved: (adId: string) =>
            apiRequest(`/ad/${adId}/saved-status`),

        // lib/api/apiService.ts – بخش ad

        getStats: (id: string): Promise<{
            summary: {
                totalViews: number;
                uniqueViews: number;
                totalSaves: number;
                totalCalls: number;
                totalComments: number;
                totalShares: number;
            };
            details: {
                views: any[];
                saves: any[];
                calls: any[];
                comments: any[];
                shares: any[];
            };
        }> => apiRequest(`/ad/${id}/stats`),

        getInteractionDetails: (id: string): Promise<{
            views: any[];
            saves: any[];
            calls: any[];
            comments: any[];
            shares: any[];
        }> => apiRequest(`/ad/${id}/interactions/details`),

    },

    // ============================================================
    // CREDIT
    // ============================================================
    credit: {
        getBalance: (): Promise<CreditBalance> =>
            apiRequest('/credit/balance'),

        purchase: (data: PurchaseCreditDto): Promise<PurchaseCreditResponse> =>
            apiRequest('/credit/purchase', { method: 'POST', data }),

        manualPurchase: (data: PurchaseCreditDto): Promise<PurchaseCreditResponse> =>
            apiRequest('/credit/manual', { method: 'POST', data }),

        getBankInfo: (armId: string): Promise<{ paymentMethods: string[]; bankAccountNumber?: string; bankShebaNumber?: string; bankAccountOwner?: string }> =>
            apiRequest(`/credit/bank-info/${armId}`),
        // 🆕 متدهای جدید برای مدیر بازار
        getArmPayments: (slug: string, status?: string): Promise<any> =>
            apiRequest(`/credit/arm/${slug}/payments`, { params: { status } }),

        getArmFinancialStats: (slug: string): Promise<any> =>
            apiRequest(`/credit/arm/${slug}/financial/stats`),

        approvePayment: (slug: string, paymentId: string): Promise<any> =>
            apiRequest(`/credit/arm/${slug}/payments/${paymentId}/approve`, {
                method: 'POST',
            }),

        rejectPayment: (slug: string, paymentId: string, reason: string): Promise<any> =>
            apiRequest(`/credit/arm/${slug}/payments/${paymentId}/reject`, {
                method: 'POST',
                data: { reason },
            }),
        getPaymentTransactions: (params?: {
            limit?: number;
            offset?: number;
            paymentMethod?: 'online' | 'manual';
            status?: 'pending' | 'success' | 'failed' | 'approved' | 'rejected';
        }): Promise<any> =>
            apiRequest('/credit/payments', { params }),

        getCreditReport: (params?: {
            limit?: number;
            offset?: number;
            type?: 'purchase' | 'spend' | 'bonus' | 'refund';
        }): Promise<any> =>
            apiRequest('/credit/report', { params }),
    },

    // ============================================================
    // FILE
    // ============================================================
    file: {
        upload: (formData: FormData): Promise<{ id: string; path: string; thumbnailPath?: string }> =>
            apiFileRequest('/file/upload', formData),

        delete: (fileId: string): Promise<{ message: string }> =>
            apiRequest('/file/delete', { method: 'DELETE', data: { fileId } }),

        getUrl: (fileId: string): string =>
            `${API_BASE}/file/${fileId}`,

        getThumbnailUrl: (fileId: string): string =>
            `${API_BASE}/file/${fileId}/thumbnail`,

        updateRelatedId: (fileId: string, modelId: string): Promise<any> =>
            apiRequest('/file/update-related', {
                method: 'PUT',
                data: { fileId, modelId },
            }),
    },
    // ============================================================
    // Units
    // ============================================================
    units: {
        getAll: (): Promise<any[]> =>
            apiRequest('/admin/units'),
    },
    activity: {
        getAll: (): Promise<any[]> =>
            apiRequest('/activity'),

        getLeaves: (): Promise<any[]> =>
            apiRequest('/activity/leaves'),

        getTree: (): Promise<any[]> =>
            apiRequest('/activity/tree'),

        getOne: (id: string): Promise<any> =>
            apiRequest(`/activity/${id}`),
    },

    settings: {
        // تنظیمات اعتبار
        getCredit: (): Promise<any> =>
            apiRequest('/admin/settings/credit'),

        updateCredit: (data: any): Promise<any> =>
            apiRequest('/admin/settings/credit', { method: 'PUT', data }),

        // تنظیمات عمومی
        getGeneral: (): Promise<any> =>
            apiRequest('/admin/settings/general'),

        updateGeneral: (data: any): Promise<any> =>
            apiRequest('/admin/settings/general', { method: 'PUT', data }),

        // تنظیمات امنیتی
        getSecurity: (): Promise<any> =>
            apiRequest('/admin/settings/security'),

        updateSecurity: (data: any): Promise<any> =>
            apiRequest('/admin/settings/security', { method: 'PUT', data }),

        // تنظیمات ظاهری
        getAppearance: (): Promise<any> =>
            apiRequest('/admin/settings/appearance'),

        updateAppearance: (data: any): Promise<any> =>
            apiRequest('/admin/settings/appearance', { method: 'PUT', data }),

        // دریافت یک تنظیمات خاص
        getOne: (key: string): Promise<any> =>
            apiRequest(`/admin/settings/${key}`),

        // تنظیم یک مقدار خاص
        setOne: (key: string, value: any): Promise<any> =>
            apiRequest(`/admin/settings/${key}`, { method: 'PUT', data: { value } }),
    },

    feedback: {
        getList: (armSlug: string, page = 1) => apiRequest(`/feedback/arm/${armSlug}?page=${page}`),
        getReplies: (parentId: string) => apiRequest(`/feedback/replies/${parentId}`),
        create: (data: { armSlug?: string; content: string; type?: string; parentId?: string }) =>
            apiRequest('/feedback', { method: 'POST', data }),
    },

    location: {
        getFullTree: (): Promise<any[]> =>
            apiRequest('/location/tree'),
    },


    // ============================================================
    // ADMIN
    // ============================================================
    admin: {
        activities: {
            getAll: (): Promise<any[]> => apiRequest('/admin/activities'),
            getTree: (): Promise<any[]> => apiRequest('/admin/activities/tree'),
            getLeaves: (): Promise<any[]> => apiRequest('/admin/activities/leaves'),
            getOne: (id: string): Promise<any> => apiRequest(`/admin/activities/${id}`),
            create: (data: any): Promise<any> => apiRequest('/admin/activities', { method: 'POST', data }),
            update: (id: string, data: any): Promise<any> => apiRequest(`/admin/activities/${id}`, { method: 'PUT', data }),
            delete: (id: string): Promise<any> => apiRequest(`/admin/activities/${id}`, { method: 'DELETE' }),
        },
        categories: {
            getAll: (): Promise<any[]> =>
                apiRequest('/admin/categories'),
            getAllFlat: (slug?: string): Promise<any[]> => {
                const url = slug ? `/admin/categories/flat?slug=${slug}` : '/admin/categories/flat';
                return apiRequest(url);},

            getOne: (id: string): Promise<any> =>
                apiRequest(`/admin/categories/${id}`),
            create: (data: any): Promise<any> =>
                apiRequest('/admin/categories', { method: 'POST', data }),
            update: (id: string, data: any): Promise<any> =>
                apiRequest(`/admin/categories/${id}`, { method: 'PUT', data }),
            delete: (id: string): Promise<any> =>
                apiRequest(`/admin/categories/${id}`, { method: 'DELETE' }),
            getChildren: (id: string): Promise<any[]> =>
                apiRequest(`/admin/categories/${id}/children`),
            getPath: (id: string): Promise<any[]> =>
                apiRequest(`/admin/categories/${id}/path`),
            getUnits: (id: string): Promise<any[]> =>
                apiRequest(`/admin/categories/${id}/units`),
            // واحدهای دسته‌بندی
            addUnit: (id: string, unitId: string): Promise<any> =>
                apiRequest(`/admin/categories/${id}/units`, {
                    method: 'POST',
                    data: { unitId },
                }),

            removeUnit: (id: string, unitId: string): Promise<any> =>
                apiRequest(`/admin/categories/${id}/units/${unitId}`, {
                    method: 'DELETE',
                }),

            setDefaultUnit: (id: string, unitId: string): Promise<any> =>
                apiRequest(`/admin/categories/${id}/units/${unitId}/default`, {
                    method: 'PUT',
                }),
        },
        units: {
            getAll: (): Promise<any[]> =>
                apiRequest('/admin/units'),
            getOne: (id: string): Promise<any> =>
                apiRequest(`/admin/units/${id}`),
            create: (data: any): Promise<any> =>
                apiRequest('/admin/units', { method: 'POST', data }),
            update: (id: string, data: any): Promise<any> =>
                apiRequest(`/admin/units/${id}`, { method: 'PUT', data }),
            delete: (id: string): Promise<any> =>
                apiRequest(`/admin/units/${id}`, { method: 'DELETE' }),
        },
        industries: {
            getAll: (): Promise<any[]> => apiRequest('/admin/industries'),
            search: (q: string, limit: number, offset: number, leavesOnly?: boolean) =>
                apiRequest('/admin/industries/search', { params: { q, limit, offset, leavesOnly } }),
            getTree: (): Promise<any[]> => apiRequest('/admin/industries/tree'),
            getLeaves: (): Promise<any[]> => apiRequest('/admin/industries/leaves'),
            getOne: (id: string): Promise<any> => apiRequest(`/admin/industries/${id}`),
            create: (data: any): Promise<any> => apiRequest('/admin/industries', { method: 'POST', data }),
            update: (id: string, data: any): Promise<any> => apiRequest(`/admin/industries/${id}`, { method: 'PUT', data }),
            delete: (id: string): Promise<any> => apiRequest(`/admin/industries/${id}`, { method: 'DELETE' }),
            getChildren: (id: string): Promise<any[]> => apiRequest(`/admin/industries/${id}/children`),
            getPath: (id: string): Promise<any[]> => apiRequest(`/admin/industries/${id}/path`),
        },
        arms: {
            getAll: (query?: any): Promise<any> =>
                apiRequest('/admin/arms', { params: query }),
            getOne: (id: string): Promise<any> =>
                apiRequest(`/admin/arms/${id}`),
            update: (id: string, data: any): Promise<any> =>
                apiRequest(`/admin/arms/${id}`, { method: 'PUT', data }),
            delete: (id: string): Promise<any> =>
                apiRequest(`/admin/arms/${id}`, { method: 'DELETE' }),
            getStats: (): Promise<any> =>
                apiRequest('/admin/arms/stats'),
            getDashboardStats: (): Promise<any> =>
                apiRequest('/admin/arms/dashboard/stats'),
        },
        // lib/api/apiService.ts - به admin اضافه کن
        locations: {
            getCountries: (): Promise<any[]> => apiRequest('/admin/locations/countries'),
            getTree: (): Promise<any[]> => apiRequest('/admin/locations/tree'),
            getFlat: (): Promise<any[]> => apiRequest('/admin/locations/flat'),
            getOne: (id: string): Promise<any> => apiRequest(`/admin/locations/${id}`),
            getChildren: (id: string): Promise<any[]> => apiRequest(`/admin/locations/${id}/children`),
            create: (data: any): Promise<any> => apiRequest('/admin/locations', { method: 'POST', data }),
            update: (id: string, data: any): Promise<any> => apiRequest(`/admin/locations/${id}`, { method: 'PUT', data }),
            delete: (id: string): Promise<any> => apiRequest(`/admin/locations/${id}`, { method: 'DELETE' }),
            getFullTree: (): Promise<any[]> =>
                apiRequest('/location/tree'),
        },
        users: {
            getArms: (): Promise<any[]> => apiRequest('/admin/users/arms'),
            getList: (params?: any): Promise<any> => apiRequest('/admin/users', { params }),
            getDetail: (id: string): Promise<any> => apiRequest(`/admin/users/${id}`),
            updateStatus: (id: string, status: string): Promise<any> =>
                apiRequest(`/admin/users/${id}/status`, { method: 'PUT', data: { status } }),
            updateArmRole: (userId: string, armSlug: string, role: string): Promise<any> =>
                apiRequest(`/admin/users/${userId}/arm-memberships/${armSlug}/role`, {
                    method: 'PUT',
                    data: { role },
                }),
        },
        ads: {
            getList: (params?: any): Promise<any> => apiRequest('/admin/ads', { params }),
            getDetail: (id: string): Promise<any> => apiRequest(`/admin/ads/${id}`),
            updateStatus: (id: string, status: string): Promise<any> => apiRequest(`/admin/ads/${id}/status`, { method: 'PUT', data: { status } }),
            delete: (id: string): Promise<any> => apiRequest(`/admin/ads/${id}`, { method: 'DELETE' }),
            getCategories: (armSlug?: string): Promise<any[]> => apiRequest('/admin/ads/categories', { params: { armSlug } }),
            getLocations: (armSlug?: string): Promise<any[]> => apiRequest('/admin/ads/locations', { params: { armSlug } }),
            getArms: (): Promise<any[]> => apiRequest('/admin/ads/arms'),
            getStats: (params?: any): Promise<any> => apiRequest('/admin/ads/stats', { params }),
        },
        credits: {
            getList: (params?: any): Promise<any> => apiRequest('/admin/credits', { params }),
            getDetail: (id: string): Promise<any> => apiRequest(`/admin/credits/${id}`),
            getStats: (params?: any): Promise<any> => apiRequest('/admin/credits/stats', { params }),
            getArms: (): Promise<any[]> => apiRequest('/admin/credits/arms'),
        },
        payments: {
            getList: (params?: any): Promise<any> => apiRequest('/admin/payments', { params }),
            getStats: (params?: any): Promise<any> => apiRequest('/admin/payments/stats', { params }),
        },
        businesses: {
            getList: (params: any): Promise<any> => apiRequest('/admin/businesses', { params }),
            getDetail: (id: string): Promise<any> => apiRequest(`/admin/businesses/${id}`),
            verify: (id: string, data: any): Promise<any> => apiRequest(`/admin/businesses/${id}/verify`, { method: 'POST', data }),
        },

        feedbacks: {
            getList: (params?: { armSlug?: string; page?: number; type?: string; status?: string }) =>
                apiRequest('/admin/feedbacks', { params }),
            getReplies: (id: string) =>
                apiRequest(`/admin/feedbacks/${id}/replies`),
            reply: (id: string, content: string) =>
                apiRequest(`/admin/feedbacks/${id}/reply`, { method: 'POST', data: { content } }),
            updateStatus: (id: string, status: string) =>
                apiRequest(`/admin/feedbacks/${id}/status`, { method: 'PATCH', data: { status } }),
        },

    },

    // ============================================================
    // ✅ سرویس‌های مالک بازار (arm-admin)
    // ============================================================
    armAdmin: {
        // دریافت اطلاعات کامل بازار
        getArm: (slug: string): Promise<any> =>
            apiRequest(`/arm-admin/${slug}`),

        // دریافت آمار بازار
        getStats: (slug: string): Promise<{
            totalMembers: number;
            activeMembers: number;
            pendingMembers: number;
            totalAds: number;
            activeAds: number;
            pendingAds: number;
            rejectedAds: number;
            expiredAds: number;
            pendingPayments: number;
            totalCreditsIncome: number;
        }> => apiRequest(`/arm-admin/${slug}/stats`),

        // دریافت لیست فیش‌های در انتظار
        getPayments: (slug: string): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/payments`),

        // ✅ تأیید فیش
        approvePayment: (slug: string, paymentId: string): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/payments/${paymentId}/approve`, {
                method: 'POST',
            }),

        // ✅ رد فیش
        rejectPayment: (slug: string, paymentId: string, reason: string): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/payments/${paymentId}/reject`, {
                method: 'POST',
                data: { reason },
            }),

        // دریافت تنظیمات بازار
        getSettings: (slug: string): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/settings`),

        // به‌روزرسانی تنظیمات بازار
        updateSettings: (slug: string, data: any): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/settings`, {
                method: 'PUT',
                data,
            }),

        // ✅ به‌روزرسانی تنظیمات پرداخت بازار
        updatePaymentSettings: (slug: string, data: any): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/settings/payments`, {
                method: 'PUT',
                data,
            }),

        // ✅ دریافت تنظیمات پرداخت بازار
        getPaymentSettings: (slug: string): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/settings/payments`),

        // ✅ دریافت گزارش مالی بازار
        getFinancialReport: (slug: string, params?: { startDate?: string; endDate?: string }): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/financial/report`, { params }),
        getCategories: (slug: string): Promise<any[]> =>
            apiRequest(`/arm-admin/${slug}/categories`),

        // ✅ دریافت واحدهای یک دسته‌بندی برای مالک بازار
        getCategoryUnits: (slug: string, categoryId: string): Promise<any[]> =>
            apiRequest(`/arm-admin/${slug}/categories/${categoryId}/units`),

        ad:{
            getAds: (params: any): Promise<any> =>
                apiRequest('/arm-admin/ads', { params }),
            updateAdStatus: (adId: string, status: string): Promise<any> =>
                apiRequest(`/arm-admin/ads/${adId}/status`, { method: 'PUT', data: { status } }),
            deleteAd: (adId: string): Promise<any> =>
                apiRequest(`/arm-admin/ads/${adId}`, { method: 'DELETE' }),
            getAdDetail: (adId: string): Promise<any> =>
                apiRequest(`/arm-admin/ads/${adId}`),
            approveAd: (adId: string): Promise<any> =>  // ✅ اضافه شد
                apiRequest(`/arm-admin/ads/${adId}/approve`, { method: 'POST' }),
            rejectAd: (adId: string, reason: string): Promise<any> =>  // ✅ اضافه شد
                apiRequest(`/arm-admin/ads/${adId}/reject`, { method: 'POST', data: { reason } }),
        },

        // ============================================================
        // مدیریت اعضا
        // ============================================================
        members: {
            getList: (
                slug: string,
                params?: {
                    page?: number;
                    limit?: number;
                    search?: string;
                    role?: string;
                    status?: string;
                    sortBy?: string;
                    sortOrder?: 'asc' | 'desc';
                }
            ): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/members`, { params }),

            getOne: (slug: string, userId: string): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/members/${userId}`),

            approveMember: (slug: string, userId: string): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/members/${userId}/approve`, { method: 'POST' }),

            rejectMember: (slug: string, userId: string, reason: string): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/members/${userId}/reject`, {
                    method: 'POST',
                    data: { reason },
                }),
            removeMember: (slug: string, userId: string): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/members/${userId}/remove`, { method: 'POST' }),
        },


    },


};