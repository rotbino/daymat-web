// lib/api/apiTypes.ts
// ==================== Roles ====================
// نقش‌های سیستمی (سطح کاربر) - ساده شده
export type SystemRole = 'system_admin' | 'system_user';

// نقش‌های سطح بازار (Arm) - ساده شده
export type ArmRole = 'arm_owner' | 'arm_seller' | 'arm_buyer' | 'arm_member';

// نقش‌های سطح کسب‌وکار (Business) - ساده شده
export type BusinessRole = 'business_owner' | 'business_admin' | 'business_seller';

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





// ==================== Business ====================
export interface Business {
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

export interface CreateBusinessDto {
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

export interface UpdateBusinessDto {
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

export interface ActiveBusinessResponse extends Business {
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
    business: { id: string; name: string; verificationTier: string };
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
    customFields?: AdCustomFields;
    priceHistory?: { price: number; updatedAt: string; note?: string }[];
}
//برای انواع پرداخت چکی و قسطی
export interface AdCustomFields {
    productType?: string;
    paymentMethods?: {
        cheque?: {
            enabled: boolean;
            price?: number;
            maxDays?: number;
        };
        installment?: {
            enabled: boolean;
            price?: number;
            months?: number;
            prepaymentPercent?: number;
        };
    };
    specs?: Record<string, string>;
}

export interface CreateAdDto {
    armSlug: string;
    categoryId?: string;
    customCategoryId?: string;
    unitId?: string;
    title: string;
    productType?: string;
    description?: string;
    unitPrice: number;
    minQuantity: number;
    availableQuantity?: number;
    availableQuantityBucket?: string;
    countryCode?: string;
    provinceCode?: string;
    cityCode?: string;
    province?: string;
    city: string;
    locationDetail?: string;
    validityHours?: number;
    isAnonymous?: boolean;
    isBumped?: boolean;
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


