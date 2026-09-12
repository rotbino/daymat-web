// lib/api/apiService.ts
import {apiRequest, apiFileRequest, API_BASE} from './apiRequest';
import {
    LoginCredentials,
    LoginResponse,
    RegisterCredentials,
    RegisterResponse,
    CreateCatalogDto,
    Catalog,
    CreateArmDto,
    Arm,
    CreateAdDto,
    Ad,
    AdListQuery,
    VitrineFacets,
    PurchaseCreditDto,
    PurchaseCreditResponse,
    CreditBalance, User, BusinessEntity,
} from './apiTypes';

export const apiService = {
    // ============================================================
    // AUTH
    // ============================================================
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

    notification:{
        // ✅ اعلان‌های مشتق از دیتا (بدون مدل Notification)
        getDerived: (): Promise<{ items: any[]; unread: number }> =>
            apiRequest('/ad/notifications'),
    },

    // ============================================================
    // BUSINESS — کسب‌وکارِ مرجع/مشترک (ثبت‌کنندهٔ اول ≠ مالک)
    // ============================================================
    business: {
        create: (data: any): Promise<any> =>
            apiRequest('/business', { method: 'POST', data }),

        // ✅ جستجوی عمومی کسب‌وکارها — «اول جستجو کن، تکراری ثبت نکن»
        //    q + فیلتر استان/شهر + ids برای پیش‌انتخاب با شناسه
        search: (params: { q?: string; provinceCode?: string; cityCode?: string; limit?: number; offset?: number; ids?: string }): Promise<{ items: any[]; total: number }> => {
            const sp = new URLSearchParams();
            if (params.q?.trim()) sp.set('q', params.q.trim());
            if (params.provinceCode) sp.set('provinceCode', params.provinceCode);
            if (params.cityCode) sp.set('cityCode', params.cityCode);
            if (params.limit) sp.set('limit', String(params.limit));
            if (params.offset) sp.set('offset', String(params.offset));
            if (params.ids) sp.set('ids', params.ids);
            return apiRequest(`/business/search?${sp.toString()}`);
        },

        // کسب‌وکارهای من — ثبت‌کننده/مالک قدیمی/عضو تیم (با پرچم canEdit)
        getMyBusinesses: (): Promise<{ items: BusinessEntity[] }> =>
            apiRequest('/business/my'),

        getMy: (): Promise<{ items: BusinessEntity[] }> =>
            apiRequest('/business/my'),

        getOne: (id: string): Promise<any> =>
            apiRequest(`/business/${id}`),

        update: (id: string, data: any): Promise<any> =>
            apiRequest(`/business/${id}`, { method: 'PUT', data }),

        delete: (id: string): Promise<any> =>
            apiRequest(`/business/${id}`, { method: 'DELETE' }),
    },

    // ============================================================
    // CATALOG (ادغام‌شده: ex-Business + تعاملات قدیمی catalog)
    // ============================================================
    catalog: {
        // ─── مدیریت ───
        create: (data: CreateCatalogDto): Promise<Catalog> =>
            apiRequest('/catalog', { method: 'POST', data }),

        getAll: (): Promise<Catalog[]> =>
            apiRequest('/catalog'),

        getActive: (): Promise<Catalog | null> =>
            apiRequest('/catalog/active'),

        getOne: (id: string): Promise<Catalog> =>
            apiRequest(`/catalog/${id}`),

        update: (id: string, data: Partial<CreateCatalogDto>): Promise<Catalog> =>
            apiRequest(`/catalog/${id}`, { method: 'PUT', data }),

        delete: (id: string): Promise<{ message: string }> =>
            apiRequest(`/catalog/${id}`, { method: 'DELETE' }),

        requestVerification: (catalogId: string, data: any): Promise<Catalog> =>
            apiRequest(`/catalog/${catalogId}/verify`, { method: 'POST', data }),

        updateConfig: (id: string, dto: { units?: any[]; categoryTree?: any[] }): Promise<any> =>
            apiRequest(`/catalog/${id}/config`, { method: 'PATCH', data: dto }),

        // 💾 کارت ویزیت — ذخیرهٔ مشخصات (JSON) روی کاتالوگ تا زحمت کاربر از بین نرود
        updateVisitCard: (id: string, spec: any): Promise<any> =>
            apiRequest(`/catalog/${id}/visit-card`, { method: 'PATCH', data: { spec } }),

        // ─── عمومی ───
        getBySlug: (slug: string) => apiRequest(`/catalog/slug/${slug}`),

        checkSlug: (slug: string, excludeId?: string): Promise<{ available: boolean; reason?: string; slug?: string }> =>
            apiRequest(`/catalog/check-slug?slug=${encodeURIComponent(slug)}${excludeId ? `&excludeId=${encodeURIComponent(excludeId)}` : ''}`),

        getFeatured: (limit: number = 12): Promise<{ items: any[] }> =>
            apiRequest(`/catalog/featured?limit=${limit}`),

        // ─── تعاملات (از شیء قدیمی catalog — آدرس‌ها همان است) ───
        trackView: (catalogId: string) =>
            apiRequest(`/catalog/${catalogId}/view`, { method: 'POST' }),

        save: (catalogId: string) =>
            apiRequest(`/catalog/${catalogId}/save`, { method: 'POST' }),

        unsave: (catalogId: string) =>
            apiRequest(`/catalog/${catalogId}/save`, { method: 'DELETE' }),

        isSaved: (catalogId: string) =>
            apiRequest(`/catalog/${catalogId}/saved-status`),

        getStats: (catalogId: string) =>
            apiRequest(`/catalog/${catalogId}/stats`),

        getSavedList: () =>
            apiRequest(`/catalog/saved/list`),

        getCatalogAds: (catalogId: string, page: number = 1, limit: number = 24, search?: string) =>
            apiRequest(`/ad/catalog/${catalogId}?page=${page}&limit=${limit}${search ? `&search=${encodeURIComponent(search)}` : ''}`),

        // ─── تیم کاتالوگ (اونر/مدیر/عضوِ فروش/مشتری) ───
        team: {
            getTeam: (catalogId: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team`),

            getMyMembership: (catalogId: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/my`),

            getMyMemberships: (): Promise<any[]> =>
                apiRequest('/catalog/team/memberships'),

            joinCoop: (catalogId: string, data: { type: 'seller' | 'buyer' | 'supplier'; sellerRole?: 'seller' | 'visitor'; businessId?: string; supplierCatalogId?: string; note?: string }): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/join`, { method: 'POST', data }),

            approveSeller: (catalogId: string, memberId: string, sellerRole?: 'seller' | 'visitor'): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/sellers/${memberId}/approve`, { method: 'POST', data: sellerRole ? { sellerRole } : {} }),

            approveBuyer: (catalogId: string, memberId: string, sellerUserId?: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/buyers/${memberId}/approve`, { method: 'POST', data: sellerUserId ? { sellerUserId } : {} }),

            rejectBuyer: (catalogId: string, memberId: string, reason?: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/buyers/${memberId}/reject`, { method: 'POST', data: { reason } }),

            approveSupplier: (catalogId: string, memberId: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/suppliers/${memberId}/approve`, { method: 'POST' }),

            rejectSupplier: (catalogId: string, memberId: string, reason?: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/suppliers/${memberId}/reject`, { method: 'POST', data: { reason } }),

            removeSupplier: (catalogId: string, memberId: string, note?: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/suppliers/${memberId}${note ? `?note=${encodeURIComponent(note)}` : ''}`, { method: 'DELETE' }),

            setSellerRole: (catalogId: string, memberId: string, sellerRole: 'seller' | 'visitor'): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/sellers/${memberId}/role`, { method: 'PATCH', data: { sellerRole } }),

            rejectSeller: (catalogId: string, memberId: string, reason?: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/sellers/${memberId}/reject`, { method: 'POST', data: { reason } }),

            removeSeller: (catalogId: string, memberId: string, note?: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/sellers/${memberId}${note ? `?note=${encodeURIComponent(note)}` : ''}`, { method: 'DELETE' }),

            leaveAsSeller: (catalogId: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/leave-seller`, { method: 'POST' }),

            setSellerRegion: (catalogId: string, memberId: string, region?: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/sellers/${memberId}/region`, { method: 'PATCH', data: { region } }),

            promoteToAdmin: (catalogId: string, memberId: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/members/${memberId}/promote-admin`, { method: 'POST' }),

            demoteToMember: (catalogId: string, memberId: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/members/${memberId}/demote-admin`, { method: 'POST' }),

            customerCandidates: (catalogId: string, q: string): Promise<{ items: any[] }> =>
                apiRequest(`/catalog/${catalogId}/team/customer-candidates?q=${encodeURIComponent(q)}`),

            addCustomer: (catalogId: string, data: { businessId: string; sellerUserId?: string; note?: string }): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/customers`, { method: 'POST', data }),

            confirmCustomer: (catalogId: string, memberId: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/customers/${memberId}/confirm`, { method: 'POST' }),

            declineCustomer: (catalogId: string, memberId: string, reason?: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/customers/${memberId}/decline`, { method: 'POST', data: { reason } }),

            assignCustomer: (catalogId: string, memberId: string, sellerUserId: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/customers/${memberId}/assign`, { method: 'PATCH', data: { sellerUserId } }),

            removeCustomer: (catalogId: string, memberId: string, note?: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/customers/${memberId}${note ? `?note=${encodeURIComponent(note)}` : ''}`, { method: 'DELETE' }),

            leaveAsCustomer: (catalogId: string): Promise<any> =>
                apiRequest(`/catalog/${catalogId}/team/leave-customer`, { method: 'POST' }),
        },
    },
   

    // ============================================================
    // INDUSTRY (صنف)
    // ============================================================
    industry: {
        autocomplete: async (q: string): Promise<{ items: Array<{ id: string; title: string }> }> => {
            if (!q || q.trim().length < 2) return { items: [] };
            const res: any = await apiRequest(`/industries/autocomplete?q=${encodeURIComponent(q.trim())}`);
            return { items: res?.items || res?.data || [] };
        },
        // ✅ endpoint عمومی — قبلاً /admin/industries/search بود که گارد ادمین داشت و
        //    برای کاربر عادی 403 می‌داد → کمبوی صنف در فرم ثبت کسب‌وکار خالی می‌ماند
        search: async (q?: string, limit?: number, offset?: number): Promise<{ items: any[]; total?: number }> => {
            const params = new URLSearchParams();
            if (q && q.trim().length >= 2) params.set('q', q.trim());
            if (limit) params.set('limit', String(limit));
            if (offset) params.set('offset', String(offset));
            const qs = params.toString();
            const res: any = await apiRequest(`/industries/search${qs ? `?${qs}` : ''}`);
            return { items: res?.data || res?.items || [], total: res?.total };
        },
        list: async (confirmedOnly = false): Promise<{ items: Array<{ id: string; title: string; isByUser?: boolean }> }> => {
            const res: any = await apiRequest(`/industries/list${confirmedOnly ? '?confirmed=true' : ''}`);
            return { items: res?.items || res?.data || [] };
        },
        createByUser: async (title: string): Promise<{ id: string; title: string; isByUser: boolean; _existed?: boolean }> => {
            return apiRequest('/industries/create-by-user', { method: 'POST', data: { title } });
        },
    },

    // ============================================================
    // LOCATION (موقعیت)
    // ============================================================
    location: {
        searchCities: async (q: string): Promise<{ items: Array<{
            id: string;
            title: string;
            cityCode: string;
            provinceCode: string;
            provinceTitle: string;
            provinceId: string;
        }> }> => {
            if (!q || q.trim().length < 2) return { items: [] };
            return apiRequest(`/location/cities/search?q=${encodeURIComponent(q.trim())}`);
        },
        // ✅ لیست همه‌ی استان‌ها — برای DropSelector
        getProvinces: async (): Promise<{ items: Array<{ id: string; title: string; provinceCode: string; slug?: string }> }> => {
            const res: any = await apiRequest('/location/provinces');
            return { items: res?.items || [] };
        },
        // ✅ لیست همه‌ی شهرها (یا شهرهای یک استان) — برای DropSelector
        getCities: async (provinceCode?: string): Promise<{ items: Array<{ id: string; title: string; cityCode: string; provinceCode: string }> }> => {
            const url = provinceCode
                ? `/location/cities?provinceCode=${encodeURIComponent(provinceCode)}`
                : '/location/cities';
            const res: any = await apiRequest(url);
            return { items: res?.items || [] };
        },
        // ✅ درخت کامل جغرافیا — برای فیلترها
        getFullTree: (): Promise<any[]> =>
            apiRequest('/location/tree'),
    },

    // ============================================================
    // BRAND (برند)
    // ============================================================
    brand: {
        search: async (q?: string, category?: string, page = 1, limit = 10): Promise<{ items: any[]; total?: number; hasMore?: boolean }> => {
            const params = new URLSearchParams();
            if (q && q.trim().length >= 2) params.set('q', q.trim());
            if (category) params.set('category', category);
            params.set('page', String(page));
            params.set('limit', String(limit));
            const res: any = await apiRequest(`/brands/search?${params.toString()}`);
            return { items: res?.items || [], total: res?.total, hasMore: res?.hasMore };
        },
        create: async (data: {
            title: string;
            category?: string;
            keywords?: string[];
            logoUrl?: string;
            description?: string;
            // ✅ اسلاگ بازار مبدأ — وقتی از داخل یک بازار ثبت می‌شود
            armSlug?: string;
        }): Promise<any> => {
            return apiRequest('/brands', { method: 'POST', data });
        },
        delete: async (id: string): Promise<any> => {
            return apiRequest(`/brands/${id}`, { method: 'DELETE' });
        },
    },

    // ============================================================
    // PRODUCT REFERENCE (کالای مرجع)
    // ============================================================
    product: {
        search: async (q?: string, category?: string, page = 1, limit = 10, mine = false): Promise<{ items: any[]; total?: number; hasMore?: boolean }> => {
            const params = new URLSearchParams();
            if (q && q.trim().length >= 2) params.set('q', q.trim());
            if (category) params.set('category', category);
            params.set('page', String(page));
            params.set('limit', String(limit));
            if (mine) params.set('mine', 'true');
            const res: any = await apiRequest(`/products/search?${params.toString()}`);
            return { items: res?.items || [], total: res?.total, hasMore: res?.hasMore };
        },
        create: async (data: {
            title: string;
            brandId?: string;
            category?: string;
            keywords?: string[];
            imageUrl?: string;
            thumbnailUrl?: string;
            description?: string;
            unitHints?: string[];
            specs?: Record<string, string>;
            // ✅ اسلاگ بازار مبدأ — وقتی از داخل یک بازار ثبت می‌شود
            armSlug?: string;
        }): Promise<any> => {
            return apiRequest('/products', { method: 'POST', data });
        },
        update: async (id: string, data: {
            title?: string;
            brandId?: string;
            imageUrl?: string;
            thumbnailUrl?: string;
        }): Promise<any> => {
            return apiRequest(`/products/${id}`, { method: 'PUT', data });
        },
        delete: async (id: string): Promise<any> => {
            return apiRequest(`/products/${id}`, { method: 'DELETE' });
        },
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

        join: (slug: string, body?: { roleType?: 'seller' | 'buyer'; catalogId?: string }): Promise<any> =>
            apiRequest(`/arm/${slug}/join`, { method: 'POST', data: body }),

        // ✅ درخواست عضویت در بازار خصوصی — ویزارد شرایط → نقش → کسب‌وکار/کاتالوگ
        requestMembership: (
            slug: string,
            body: { roleType: 'buyer' | 'seller'; businessId?: string; catalogId?: string; termsAccepted?: boolean },
        ): Promise<any> =>
            apiRequest(`/arm/${slug}/membership-request`, { method: 'POST', data: body }),

        // ✅ وضعیت آخرین درخواست عضویت من در این بازار + خلاصهٔ عضویت
        getMyMembershipRequest: (slug: string): Promise<any> =>
            apiRequest(`/arm/${slug}/membership-request/my`),

        // ✅ درخواست لغو عضویت — خروجِ عضو فقط با تایید مالک بازار؛ درخواست به پنل مالک می‌رود
        requestLeave: (
            slug: string,
            body: { roleType: 'buyer' | 'seller'; catalogId?: string; businessId?: string; reason?: string },
        ): Promise<any> =>
            apiRequest(`/arm/${slug}/leave-request`, { method: 'POST', data: body }),

        // ✅ وضعیت آخرین درخواست لغوی من در این بازار
        getMyLeaveRequest: (slug: string): Promise<any> =>
            apiRequest(`/arm/${slug}/leave-request/my`),

        // ✅ پس‌گرفتن درخواست لغوِ در انتظار
        withdrawLeave: (slug: string): Promise<any> =>
            apiRequest(`/arm/${slug}/leave-request`, { method: 'DELETE' }),

        // ✅ ذخیره/فالو بازار — برای غیرعضوها؛ بازار در سوییچر می‌ماند (عضوها ذخیره ندارند)
        save: (slug: string): Promise<any> =>
            apiRequest(`/arm/${slug}/save`, { method: 'POST' }),

        unsave: (slug: string): Promise<any> =>
            apiRequest(`/arm/${slug}/save`, { method: 'DELETE' }),

        // ✅ وضعیت کامل من در بازار — عضویت + تاریخ‌ها + ذخیره + تاریخچهٔ رویدادها
        getMyMembership: (slug: string): Promise<any> =>
            apiRequest(`/arm/${slug}/my-membership`),

        // ✅ درخواست لغو عضویت فروشنده — از پنل کاتالوگ؛ به پنل مالک می‌رود (خروجِ آنی حذف شد)
        // (مستقیم از requestLeave با roleType:'seller' استفاده کنید)

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
        findById: (id: string): Promise<Arm> => apiRequest(`/arm/${id}`),   // بک‌اند باید این route را پشتیبانی کند
        // ✅ روشن/خاموش کردن انتشار کاتالوگ در بازار
        toggleCatalogPublish: (slug: string, data: { catalogId: string; published: boolean }): Promise<any> =>
            apiRequest(`/arm/${slug}/catalog-publish`, { method: 'PATCH', data }),
        // ✅ بازارهای فعال پیشنهادی — بدون catalogId: همهٔ بازارهای فعال عمومی
        //    با catalogId: همان، منهای بازاری که این کاتالوگ عضو/درخواستِ آن است (دوسویه: کشف + پیشنهاد)
        getSuggestedArms: (catalogId?: string, limit: number = 6): Promise<{ items: any[] }> =>
            apiRequest('/arm/suggested', {
                method: 'GET',
                params: { ...(catalogId ? { catalogId } : {}), limit },
            }),


    },

    // ============================================================
    // AD
    // ============================================================
    ad: {
        create: (data: CreateAdDto): Promise<Ad> =>
            apiRequest('/ad', { method: 'POST', data }),

        // ✅ همهٔ واحدها (عمومی — برای فرم کاتالوگ)
        getAllUnits: (ids?: string[]): Promise<any[]> =>
            apiRequest(`/unit/all${ids?.length ? `?ids=${ids.join(',')}` : ''}`),



        getVitrine: (slug: string, query: AdListQuery): Promise<{ ads: Ad[]; canViewPrices: boolean; pagination: any; facets?: VitrineFacets }> =>
            apiRequest(`/ad/arm/${slug}`, { method: 'GET', params: query }),

        getCatalogAds: (catalogId: string, page: number = 1, limit: number = 10, status?: string) =>
            apiRequest(`/ad/catalog/${catalogId}?page=${page}&limit=${limit}${status ? `&status=${status}` : ''}`),

        // app/lib/api/apiService.ts

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
            catalogName: string;
            phone: string;
            ownerPhone?: string | null;
            seller?: { userId: string; name: string | null; businessName: string | null; region: string | null; phone: string } | null;
            routedToSeller?: boolean;
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

        // ═══ 🆕 Publication endpoints (چند‌بازاری) ═══

        /**
         * لیست بازارهایی که آگهی در آن‌ها منتشر شده
         */
        getPublications: (adId: string): Promise<Array<{
            id: string;
            adId: string;
            armId: string;
            arm: { id: string; slug: string; name: string; icon: string; colorPrimary: string };
            catalogId: string;
            categoryId: string | null;
            categoryPath: string[];
            status: 'published' | 'paused' | 'needs_category' | 'rejected';
            publishedAt: string;
        }>> => apiRequest(`/ad/${adId}/publications`),

        /**
         * انتشار آگهی در یک بازار جدید
         */
        publishToMarket: (adId: string, armSlug: string): Promise<{
            success: boolean;
            arm: { id: string; name: string; slug: string };
            stamped: number;
            needsCategory: Array<{ id: string; title: string; catalogCategoryTitle: string | null }>;
        }> => apiRequest(`/ad/${adId}/publish-to-market`, { method: 'POST', data: { armSlug } }),

        /**
         * حذف انتشار آگهی از یک بازار
         */
        unpublishFromMarket: (adId: string, armSlug: string): Promise<{ success: boolean; message: string }> =>
            apiRequest(`/ad/${adId}/publish-to-market/${armSlug}`, { method: 'DELETE' }),

        getInteractionDetails: (id: string): Promise<{
            views: any[];
            saves: any[];
            calls: any[];
            comments: any[];
            shares: any[];
        }> => apiRequest(`/ad/${id}/interactions/details`),
        // ────────────────────────────────────────
        // ✅ جستجو: لاگ / پیشنهاد / تاریخچه
        // ────────────────────────────────────────

        // ✅ ثبت لاگ جستجوی اجراشده — سبک و fire-and-forget (سرور 204 برمی‌گرداند)
        logSearch: (payload: { term: string; resultCount?: number; armSlug?: string }): Promise<void> =>
            apiRequest('/ad/search-log', { method: 'POST', data: payload }),

        // ✅ پیشنهاد جستجو: ترم‌های پرجستجو با تطابق پیشوند (تعداد جستجو + کاربران یکتا)
        getSearchSuggestions: (armSlug: string, q: string, limit: number = 8): Promise<{ suggestions: { term: string; searches: number; userCount: number }[] }> =>
            apiRequest('/ad/search-suggest', { method: 'GET', params: { armSlug, q, limit } }),

        // ✅ جستجوهای اخیر کاربر لاگین‌شده
        getSearchHistory: (armSlug?: string): Promise<{ items: { term: string; at: string }[] }> =>
            apiRequest('/ad/search-history', { method: 'GET', params: armSlug ? { armSlug } : undefined }),

        // ✅ پاک کردن تاریخچه جستجوی کاربر
        clearSearchHistory: (armSlug?: string): Promise<{ success: boolean; deleted: number }> =>
            apiRequest(`/ad/search-history${armSlug ? `?armSlug=${encodeURIComponent(armSlug)}` : ''}`, { method: 'DELETE' }),
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
        // ✅ مدیریت کالاهای مرجع — فقط ادمین سیستم
        products: {
            getAll: (params?: {
                q?: string; brandId?: string; category?: string; armId?: string;
                isActive?: boolean | string; confirmed?: boolean | string; isByUser?: boolean | string;
                hasAds?: boolean | string; page?: number; limit?: number;
                sortBy?: string; sortOrder?: 'asc' | 'desc';
            }): Promise<any> =>
                apiRequest('/admin/products', { params }),
            getOne: (id: string): Promise<any> =>
                apiRequest(`/admin/products/${id}`),
            getAds: (id: string, params?: { page?: number; limit?: number }): Promise<any> =>
                apiRequest(`/admin/products/${id}/ads`, { params }),
            update: (id: string, data: any): Promise<any> =>
                apiRequest(`/admin/products/${id}`, { method: 'PUT', data }),
            delete: (id: string): Promise<any> =>
                apiRequest(`/admin/products/${id}`, { method: 'DELETE' }),
        },
        // ✅ مدیریت برندها — فقط ادمین سیستم
        brands: {
            getAll: (params?: {
                q?: string; category?: string; armId?: string;
                isActive?: boolean | string; confirmed?: boolean | string; isByUser?: boolean | string;
                hasProducts?: boolean | string; page?: number; limit?: number;
                sortBy?: string; sortOrder?: 'asc' | 'desc';
            }): Promise<any> =>
                apiRequest('/admin/brands', { params }),
            getOne: (id: string): Promise<any> =>
                apiRequest(`/admin/brands/${id}`),
            getAds: (id: string, params?: { page?: number; limit?: number }): Promise<any> =>
                apiRequest(`/admin/brands/${id}/ads`, { params }),
            getProducts: (id: string, params?: { page?: number; limit?: number }): Promise<any> =>
                apiRequest(`/admin/brands/${id}/products`, { params }),
            update: (id: string, data: any): Promise<any> =>
                apiRequest(`/admin/brands/${id}`, { method: 'PUT', data }),
            delete: (id: string): Promise<any> =>
                apiRequest(`/admin/brands/${id}`, { method: 'DELETE' }),
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
        cataloges: {
            getList: (params: any): Promise<any> => apiRequest('/admin/cataloges', { params }),
            getDetail: (id: string): Promise<any> => apiRequest(`/admin/cataloges/${id}`),
            verify: (id: string, data: any): Promise<any> => apiRequest(`/admin/cataloges/${id}/verify`, { method: 'POST', data }),
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

        // ✅ درخواست‌های عضویت بازار خصوصی — پنل مالک
        getMembershipRequests: (slug: string, params?: { status?: string; page?: number; limit?: number }): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/members/membership-requests`, { params }),

        approveMembershipRequest: (slug: string, requestId: string): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/members/membership-requests/${requestId}/approve`, { method: 'POST' }),

        rejectMembershipRequest: (slug: string, requestId: string, reason: string): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/members/membership-requests/${requestId}/reject`, { method: 'POST', data: { reason } }),

        // ✅ درخواست‌های لغو عضویت — پنل مالک: تایید = لغوِ عضویت، رد = عضو می‌ماند
        getLeaveRequests: (slug: string, params?: { status?: string; page?: number; limit?: number }): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/members/leave-requests`, { params }),

        approveLeaveRequest: (slug: string, requestId: string): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/members/leave-requests/${requestId}/approve`, { method: 'POST' }),

        rejectLeaveRequest: (slug: string, requestId: string, reason: string): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/members/leave-requests/${requestId}/reject`, { method: 'POST', data: { reason } }),

        // ✅ ادمین‌های بازار — منصوبِ مالک؛ انتصاب/عزل فقط مالک
        getAdmins: (slug: string): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/members/admins`),

        addAdmin: (slug: string, phone: string): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/members/admins`, { method: 'POST', data: { phone } }),

        removeAdmin: (slug: string, userId: string): Promise<any> =>
            apiRequest(`/arm-admin/${slug}/members/admins/${userId}/remove`, { method: 'POST' }),

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
        // ============================================================
        // مدیریت کاتالوگ‌های بازار (اتصال کاتالوگ به تابلو)
        // ============================================================
        catalogs: {
            // کاتالوگ‌های عضو بازار + آمار تابلو
            getList: (slug: string, params?: {
                search?: string;
                ownerStatus?: string;
                sortBy?: string;
                sortOrder?: string;
            }): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/memberships/sellers`, { params }),

            // جستجوی کاتالوگ برای افزودن (myReferrals: فقط جذب‌شده‌های من)
            getCandidates: (slug: string, q?: string, onlyMyReferrals?: boolean): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/memberships/sellers/candidates`, {
                    params: {
                        ...(q ? { q } : {}),
                        ...(onlyMyReferrals ? { myReferrals: '1' } : {}),
                    },
                }),

            // کالاهای منتشرشدهٔ بدون دستهٔ بازاری
            getNeedsCategory: (slug: string): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/memberships/needs-category`),

            // آمار جذب مالک بازار (دعوت‌شدگان + کاتالوگ‌ها)
            getReferralStats: (slug: string): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/memberships/referral-stats`),

            // افزودن کاتالوگ به بازار + مهر انتشار
            addCatalog: (slug: string, catalogId: string): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/memberships/sellers`, { method: 'POST', data: { catalogId } }),

            // توقف / ادامهٔ عضو (توسط مالک بازار)
            setPaused: (slug: string, catalogId: string, paused: boolean): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/memberships/sellers/${catalogId}`, { method: 'PATCH', data: { paused } }),

            // حذف کاتالوگ از بازار
            remove: (slug: string, catalogId: string): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/memberships/sellers/${catalogId}`, { method: 'DELETE' }),

            // تعیین دستهٔ بازاری یک کالا
            setAdCategory: (slug: string, adId: string, categoryId: string): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/memberships/sellers/ads/${adId}/category`, { method: 'PATCH', data: { categoryId } }),

            // تنظیمات اختصاصی کاتالوگ (ارث‌بری از بازار + اورایت مالک بازار)
            getCatalogSettings: (slug: string, catalogId: string): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/memberships/sellers/${catalogId}/settings`),

            setCatalogSettings: (slug: string, catalogId: string, multiSeller: boolean | 'inherit'): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/memberships/sellers/${catalogId}/settings`, { method: 'PATCH', data: { multiSeller } }),
        },

        // ============================================================
        // ✅ مدیریت برندها و کالاهای مرجع بازار
        // فقط داده‌های ثبت‌شده از طریق همین بازار/فروشندگانش
        // ============================================================
        references: {
            getProducts: (slug: string, params?: {
                q?: string; isActive?: boolean | string; confirmed?: boolean | string;
                page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc';
            }): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/references/products`, { params }),
            getProduct: (slug: string, id: string): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/references/products/${id}`),
            getProductAds: (slug: string, id: string, params?: { page?: number; limit?: number }): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/references/products/${id}/ads`, { params }),
            updateProduct: (slug: string, id: string, data: any): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/references/products/${id}`, { method: 'PUT', data }),
            deleteProduct: (slug: string, id: string): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/references/products/${id}`, { method: 'DELETE' }),

            getBrands: (slug: string, params?: {
                q?: string; isActive?: boolean | string; confirmed?: boolean | string;
                page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc';
            }): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/references/brands`, { params }),
            getBrand: (slug: string, id: string): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/references/brands/${id}`),
            getBrandAds: (slug: string, id: string, params?: { page?: number; limit?: number }): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/references/brands/${id}/ads`, { params }),
            getBrandProducts: (slug: string, id: string, params?: { page?: number; limit?: number }): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/references/brands/${id}/products`, { params }),
            updateBrand: (slug: string, id: string, data: any): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/references/brands/${id}`, { method: 'PUT', data }),
            deleteBrand: (slug: string, id: string): Promise<any> =>
                apiRequest(`/arm-admin/${slug}/references/brands/${id}`, { method: 'DELETE' }),
        },


    },

    // ============================================================
    // بازارِ من — برای صاحب کاتالوگ (داشبورد)
    // ============================================================
    userMarket: {
        getMyNeedsCategory: (): Promise<any> =>
            apiRequest('/user-market/my-uncategorized'),

        setAdCategory: (adId: string, categoryId: string): Promise<any> =>
            apiRequest(`/user-market/ads/${adId}/category`, { method: 'PATCH', data: { categoryId } }),
    },


};