// lib/api/apiTypes.ts
// ==================== Roles ====================
// نقش‌های سیستمی (سطح کاربر) - ساده شده
export type SystemRole = 'system_admin' | 'system_user';

// نقش‌های سطح بازار (Arm) - ساده شده
export type ArmRole = 'arm_owner' | 'arm_seller' | 'arm_buyer' | 'arm_member';

// نقش‌های سطح کسب‌وکار (Catalog) - ساده شده
export type CatalogRole = 'catalog_owner' | 'catalog_admin' | 'catalog_seller';

// ==================== Base ====================
export class ApiError extends Error {
    code: number;
    data: any;
    constructor(code: number, message: string, data?: any) {
        super(message);
        this.code = code;
        this.data = data;
        Object.setPrototypeOf(this, ApiError.prototype);
    }
}

// ==================== Auth ====================
export interface LoginCredentials {
    phone: string;
    password: string;
}

export interface RegisterCredentials {
    phone: string;
    fullName: string;
    password: string;
}

export interface User {
    id: string;
    phone: string;
    fullName: string;
    role: SystemRole;
    avatarUrl?: string;
    locale?: string;
    isPhoneVerified?: boolean;
    temporaryPassword?: boolean;
    nationalId?: string;
    email?: string;
    gender?: string;
    birthDate?: string;          // ISO string
    province?: string;
    city?: string;
    countryCode?: string;        // ✅
    provinceCode?: string;       // ✅
    cityCode?: string;           // ✅
    bio?: string;
    avatarFile?: { id: string } | null;
}

export interface LoginResponse {
    user: User;
    access_token: string;
}

export interface RegisterResponse {
    message: string;
    access_token: string;
}




//  برای خطاهای خاص
export interface ApiErrorResponse {
    errorCode: string;
    message: string;
}





// ==================== Catalog ====================
export interface Catalog {
    id: string;
    name: string;
    type: string;
    city: string;
    province: string;
    phone: string;
    description?: string;
    logoUrl?: string;
    address?: string;
    website?: string;
    verificationTier: string;
    verificationStatus: string;
    trustScore: number;
    status: string;
    createdAt: string;
    updatedAt: string;
    ownerUserId: string;
    activeAdsCount?: number;
    activeMembershipsCount?: number;
    armMemberships?: ArmMembership[];
    ads?: Ad[];
    credits?: Credit[];
    _count?: {
        ads: number;
        armMemberships: number;
    };
}

// ==================== Credit ====================
// ✅ هماهنگ با بک‌اند (credit) — اعتبار کاتالوگ/کاربر
export interface Credit {
    id: string;
    catalogId?: string;
    userId?: string;
    balance: number;
    totalPurchased?: number;
    totalSpent?: number;
    currency: string;
    createdAt: string;
    updatedAt: string;
}

export interface ArmMembership {
    id: string;
    armId: string;
    arm: {
        id: string;
        slug: string;
        name: string;
        icon: string | null;
        colorPrimary: string | null;
    };
    role: ArmRole;
    status: string;
    joinedAt: string;
}

export interface CreateCatalogDto {
    name: string;
    type: string;
    city?: string;
    province?: string;
    phone?: string;
    description?: string;
    logoUrl?: string;
    address?: string;
    website?: string;
}

export interface UpdateCatalogDto {
    name?: string;
    type?: string;
    city?: string;
    province?: string;
    phone?: string;
    description?: string;
    logoUrl?: string;
    address?: string;
    website?: string;
}

export interface ActiveCatalogResponse extends Catalog {
    activeAdsCount: number;
    activeMembershipsCount: number;
}
// ==================== Arm ====================
// lib/api/apiTypes.ts
export interface Arm {
    id: string;
    slug: string;
    name: string;
    shortName?: string;
    slogan: string;
    description?: string;
    icon?: string;
    colorPrimary?: string;
    colorSecondary?: string;
    logoUrl?: string;
    status: string;
    visibility: string;
    ownerUserId: string;
    membersCount?: number;
    activeAdsCount?: number;
    categoryTree?: CategoryNode[];
    isArmOwner?: boolean;      // ← اضافه شد
    isSystemAdmin?: boolean;   // ← اضافه شد
}

export interface CategoryNode {
    id: string;
    title: string;
    path: string;
    level: number;
    isSelected: boolean;
    children: CategoryNode[];
}

export interface CreateArmDto {
    slug: string;
    name: string;
    slogan: string;
    description?: string;
    icon?: string;
    colorPrimary?: string;
    logoUrl?: string;
    mission?: string;
    categoryIds: string[];
    customCategories?: CustomCategoryDto[];
    geoScopes: GeoScopeDto[];
    config: ArmConfigDto;
}

export interface CustomCategoryDto {
    parentGlobalId: string;
    localTitle: string;
    unitOverrides?: string[];
    customFieldsSchema?: any;
}

export interface GeoScopeDto {
    countryCode?: string;
    provinceCode?: string;
    cityCode?: string;
}

export interface ArmConfigDto {
    freeAdQuota: number;
    allowAnonymousPublishing: boolean;
    enableBuyLead: boolean;
    paymentMethods: ('online' | 'manual')[];
    creditPrice?: number;  // ✅ اضافه شد
    bankAccountNumber?: string;
    bankShebaNumber?: string;
    bankAccountOwner?: string;
}



// ==================== Ad ====================
// lib/api/apiTypes.ts

export interface Ad {
    id: string;
    title: string;
    productType?: string | null;
    description?: string;
    unitPrice: number;
    minQuantity: number;
    availableQuantity?: number;
    unit: { id: string; title: string; shortCode: string };
    category: { id: string; title: string; path: string };
    catalog: { id: string; name: string; verificationTier: string };
    city: string;
    province?: string;
    cityCode?: string;
    provinceCode?: string;
    locationDetail?: string;
    isBumped: boolean;
    isAnonymous: boolean;
    bumpExpiresAt?: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
    viewCount: number;
    callCount: number;
    paymentMethods?: AdPaymentMethods | null;
    customFields?: AdCustomFields;
    priceHistory?: { price: number; updatedAt: string; note?: string }[];
    // ✅ هماهنگ با CreateAdDto بک‌اند
    armSlug?: string;
    catalogId?: string;
    productReferenceId?: string | null;
    brandId?: string | null;
    brand?: { id: string; title: string } | null;
    publishToMarket?: boolean;
    singleUnitPrice?: number | null;
    consumerPrice?: number | null;
    giftPrice?: number | null;
    volumeTiers?: { minQty: number; price: number }[] | null;
    unitQty?: number;
    unitIsVariableQty?: boolean;
    validityHours?: number;
    bumpDurationHours?: number;
    status?: string;
    specs?: Record<string, string> | null;
}

// ✅ شرایط پرداخت — سازگار با PaymentMethodsDto بک‌اند (ad.dto.ts)
export interface AdChequeOption {
    price: number;   // قیمت هر واحد فروش با این چک
    days: number;    // مدت چک (روز)
}
export interface AdInstallmentOption {
    price: number;
    months: number;
    prepaymentPercent?: number;
}
export interface AdPaymentMethods {
    description?: string;
    cheque?: AdChequeOption[];
    chequeDescription?: string;
    installment?: AdInstallmentOption[];
    installmentDescription?: string;
}
//برای انواع پرداخت چکی و قسطی
export interface AdCustomFields {
    productType?: string;
    paymentMethods?: AdPaymentMethods;
    specs?: Record<string, string>;
}

export interface CreateAdDto {
    armSlug?: string;
    // ✅ هماهنگ با بک‌اند — کاتالوگ مالک آگهی (الزامی در جریان جدید)
    catalogId: string;
    categoryId?: string;
    customCategoryId?: string;
    unitId?: string;
    title: string;
    productType?: string;
    // ✅ null در ویرایش = جداکردن کالا/برند از آگهی
    productReferenceId?: string | null;
    brandId?: string | null;
    description?: string;
    unitPrice: number;
    minQuantity: number;
    availableQuantity?: number;
    availableQuantityBucket?: string;
    countryCode?: string;
    provinceCode?: string;
    cityCode?: string;
    province?: string;
    city?: string;
    locationDetail?: string;
    validityHours?: number;
    isAnonymous?: boolean;
    isBumped?: boolean;
    bumpDurationHours?: number;
    publishToMarket?: boolean;
    consumerPrice?: number | null;
    singleUnitPrice?: number | null;
    giftPrice?: number | null;
    volumeTiers?: { minQty: number; price: number }[] | null;
    paymentMethods?: AdPaymentMethods | null;
    customFields?: AdCustomFields;
    unitQty?: number;
    unitIsVariableQty?: boolean;
}


// lib/api/apiTypes.ts

export interface AdListQuery {
    categoryId?: string;
    categoryType?: 'global' | 'custom';
    city?: string;
    provinceCode?: string;
    countryCode?: string;
    minPrice?: number;
    maxPrice?: number;
    minQuantity?: number;
    bumpFilter?: 'all' | 'bumped' | 'normal';
    sort?: SortItem[];
    page?: number;
    limit?: number;
    requireSufficientStock?: boolean;
    // ✅ فیلترهای بازار (فیلتربار توسعه‌پذیر)
    brandIds?: string;          // شناسهٔ برندها جداشده با ویرگول (چندانتخابی)
    hasCheque?: boolean;        // فقط آگهی‌های چکی
    chequeMinDays?: number;     // حداقل مهلت چک (روز)
    chequeMaxDays?: number;     // حداکثر مهلت چک (روز)
}

// ✅ فاست‌های ویترین — از بازهٔ فیلتری (بدون پیجینگ)
export interface VitrineBrandFacet {
    id: string;
    title: string;
    count: number;
}
export interface VitrineFacets {
    priceMin: number | null;
    priceMax: number | null;
    brands: VitrineBrandFacet[];
}

export interface SortItem {
    field: 'unitPrice' | 'createdAt' | 'updatedAt' | 'minQuantity';
    order: 'asc' | 'desc';
}

// ==================== Credit ====================
export interface CreditBalance {
    balance: number;
    currency: string;
}

export interface PurchaseCreditDto {
    amount: number;
    paymentMethod: 'online' | 'manual';
    armId?: string;
    callbackUrl?: string;
    description?: string;
    receiptImage?: string;
    creditCount?: number;  // ✅ جدید
}

export interface PurchaseCreditResponse {
    transaction_id: string;
    payment_url?: string;
    gateway_reference?: string;
    amount: number;
    creditCount?: number;  // ✅ جدید
    status?: string;
    message?: string;
}

// lib/api/apiTypes.ts

// ==================== File ====================
export interface File {
    id: string;
    userId: string;
    name: string;
    mimeType: string;
    size: number;
    path: string;
    thumbnailPath?: string;
    relatedModel: string;
    relatedId: string;
    fieldKey?: string;
    createdAt: string;
    updatedAt: string;
}

export interface UploadFileResponse {
    id: string;
    name: string;
    mimeType: string;
    size: number;
    path: string;
    thumbnailPath?: string;
    fieldKey?: string;
    createdAt: string;
    updatedAt: string;
}

export interface DeleteFileResponse {
    message: string;
}
// تراکنشهای کاربر معمولی

export interface Transaction {
    id: string;
    amount: number;
    creditCount: number;
    status: 'pending' | 'success' | 'failed' | 'approved' | 'rejected';
    transactionType: 'purchase' | 'credit_request' | 'spend';
    description: string;
    createdAt: string;
    metadata: any;
    armId: string;
    paymentMethod: 'online' | 'manual';
    isRequest: boolean;
    balanceAfter: number; // ✅ جدید
}

export type Payment = {
        id: string;
        amount: number;
        creditCount: number;
        status: 'pending' | 'success' | 'failed' | 'approved' | 'rejected';
        description: string;
        createdAt: string;
        paymentMethod: 'online' | 'manual';
        isRequest: boolean;
        rejectReason?: string | null; // ✅ اضافه شد
    };
//#################Setting

export type PermissionLevel = 1 | 2 | 3;


// lib/api/types/search.ts

export interface SearchLogPayload {
    /** عبارت جستجوی اجراشده (سرور خودش نرمال می‌کند) */
    term: string;
    /** تعداد نتایج واقعی از pagination */
    resultCount?: number;
    /** slug بازار */
    armSlug?: string;
}

export interface SearchSuggestion {
    term: string;
    /** تعداد کل جستجوهای این ترم (۳۰ روز اخیر) */
    searches: number;
    /** تعداد کاربران یکتا (مهمان‌ها حساب نمی‌شوند) */
    userCount: number;
}

export interface SearchSuggestResponse {
    suggestions: SearchSuggestion[];
}

export interface SearchHistoryItem {
    term: string;
    at: string; // ISO date
}

export interface SearchHistoryResponse {
    items: SearchHistoryItem[];
}

export interface ClearHistoryResponse {
    success: boolean;
    deleted: number;
}

// ==================== Business (نهاد تجاری) ====================
export interface BusinessEntity {
    id: string;
    name: string;
    type: string;
    industryName?: string | null;
    shortDescription?: string | null;
    province?: string | null;
    provinceCode?: string | null;
    city?: string | null;
    cityCode?: string | null;
    address?: string | null;
    phone?: string | null;
    website?: string | null;
    logoUrl?: string | null;
    nationalId?: string | null;
    businessLicense?: string | null;
    status: string;
    createdAt: string;
    updatedAt: string;
    catalogsCount?: number;
    _count?: { catalogs: number };
}

export interface CreateBusinessEntityDto {
    name: string;
    type?: string;
    industryName?: string;
    shortDescription?: string;
    description?: string;
    province?: string;
    provinceCode?: string;
    city?: string;
    cityCode?: string;
    address?: string;
    phone?: string;
    website?: string;
    logoUrl?: string;
    nationalId?: string;
    businessLicense?: string;
}









// ==================== Brand (برند) ====================
// ✅ هماهنگ با مدل Brand بک‌اند — دادهٔ پایهٔ مشترک
export interface Brand {
    id: string;
    title: string;
    slug?: string;
    category?: string | null;
    categoryPath?: string[];
    logoUrl?: string | null;
    description?: string | null;
    keywords?: string[];
    isActive: boolean;
    usageCount: number;
    confirmed: boolean;
    isByUser: boolean;
    armId?: string | null;
    createdByUserId?: string | null;
    // ✅ فقط در خروجی‌های مدیریتی وصل می‌شود (relation اسکیمایی ندارند)
    creator?: { id: string; fullName?: string | null; phone: string } | null;
    arm?: { id: string; name: string; slug: string } | null;
    _count?: { ads: number; products: number };
    createdAt: string;
    updatedAt: string;
}

// ==================== ProductReference (کالای مرجع) ====================
// ✅ هماهنگ با مدل ProductReference بک‌اند — کاتالوگ مرکزی کالاها
export interface ProductReference {
    id: string;
    title: string;
    slug?: string;
    brandId?: string | null;
    brand?: { id: string; title: string; logoUrl?: string | null } | null;
    category?: string | null;
    categoryPath?: string[];
    imageUrl?: string | null;
    thumbnailUrl?: string | null;
    description?: string | null;
    specs?: Record<string, string> | null;
    keywords?: string[];
    unitHints?: string[];
    isActive: boolean;
    usageCount: number;
    confirmed: boolean;
    isByUser: boolean;
    isNew: boolean;
    armId?: string | null;
    createdByUserId?: string | null;
    creator?: { id: string; fullName?: string | null; phone: string } | null;
    arm?: { id: string; name: string; slug: string } | null;
    _count?: { ads: number };
    createdAt: string;
    updatedAt: string;
}

// ✅ آگهی خلاصه‌شده در خروجی‌های مدیریتی (چه آگهی‌هایی به این کالا/برند وصل است)
export interface AdRefItem {
    id: string;
    title: string;
    unitPrice: number;
    minQuantity?: number;
    status?: string;
    city?: string | null;
    createdAt: string;
    catalog?: { id: string; name: string } | null;
    brand?: { id: string; title: string } | null;
}

// ✅ پاسخ استاندارد لیست‌های مدیریتی
export interface AdminReferenceListResponse<T> {
    items: T[];
    total: number;
    page: number;
    hasMore: boolean;
}

// ✅ فیلترهای لیست کالاهای مرجع (ادمین سیستم / مالک بازار)
export interface AdminProductQuery {
    q?: string;
    brandId?: string;
    category?: string;
    armId?: string;
    isActive?: boolean;
    confirmed?: boolean;
    isByUser?: boolean;
    hasAds?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'usageCount' | 'title';
    sortOrder?: 'asc' | 'desc';
}

// ✅ فیلترهای لیست برندها (ادمین سیستم / مالک بازار)
export interface AdminBrandQuery {
    q?: string;
    category?: string;
    armId?: string;
    isActive?: boolean;
    confirmed?: boolean;
    isByUser?: boolean;
    hasProducts?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'usageCount' | 'title';
    sortOrder?: 'asc' | 'desc';
}

// ✅ ویرایش مدیریتی کالای مرجع — همهٔ فیلدها + کنترل وضعیت
export interface UpdateProductAdminDto {
    title?: string;
    brandId?: string;
    category?: string;
    keywords?: string[];
    imageUrl?: string;
    thumbnailUrl?: string;
    description?: string;
    unitHints?: string[];
    specs?: Record<string, string>;
    isActive?: boolean;
    confirmed?: boolean;
}

// ✅ ویرایش مدیریتی برند
export interface UpdateBrandAdminDto {
    title?: string;
    category?: string;
    keywords?: string[];
    logoUrl?: string;
    description?: string;
    isActive?: boolean;
    confirmed?: boolean;
}

export const PERMISSION_LEVELS = {
    1: {  // سطح پایه - مالک بازار معمولی
        label: 'پایه',
        canEditSlug: false,
        canEditStatus: false,
        canEditColors: true,
        canUploadLogo: true,
        canEditCategories: false,
        canEditLocations: false,
        canEditIndustries: false,
        canEditModules: false,
        canEditAccessRules: false,
        canEditPayment: false,
        canEditEconomy: false,
    },
    2: {  // سطح پیشرفته - مالک بازار سطح ۲
        label: 'پیشرفته',
        canEditSlug: false,
        canEditStatus: true,
        canEditColors: true,
        canUploadLogo: true,
        canEditCategories: false,
        canEditLocations: false,
        canEditIndustries: false,
        canEditModules: true,
        canEditAccessRules: true,
        canEditPayment: true,
        canEditEconomy: true,
    },
    3: {  // سطح کامل - مدیر سیستم
        label: 'کامل',
        canEditSlug: true,
        canEditStatus: true,
        canEditColors: true,
        canUploadLogo: true,
        canEditCategories: true,
        canEditLocations: true,
        canEditIndustries: true,
        canEditModules: true,
        canEditAccessRules: true,
        canEditPayment: true,
        canEditEconomy: true,
    },

};


