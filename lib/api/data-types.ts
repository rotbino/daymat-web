// lib/api/data-types.ts

// ============================================================
// سمت‌های کاربر در کسب‌وکار
// ============================================================
export const USER_POSITIONS = [
    { label: 'مالک کسب و کار', value: '1' },
    { label: 'مدیرعامل', value: '2' },
    { label: 'مدیر فروش', value: '3' },
    { label: 'مدیر خرید', value: '4' },
    { label: 'کارشناس فروش', value: '5' },
    { label: 'بازاریاب / ویزیتور', value: '6' },
    { label: 'امور مالی', value: '7' },
    { label: 'سایر', value: '8' },
];

// ============================================================
// نقش‌های کاربر در بازار (فروشنده/خریدار)
// ============================================================
export const CATALOG_ROLES = [
    { label: 'فروشنده عمده', value: 'seller' },
    { label: 'خریدار عمده', value: 'buyer' },
];

// ============================================================
// نوع کسب‌وکار — درخت دو سطحی (sector + role)
// ============================================================
// sector: دسته‌بندی کلی (سطح اول)
// role: نوع دقیق فعالیت (سطح دوم) — این فیلد اصلیه که نمایش داده می‌شه
//
// ✅ فیلد role فیلد اصلی است — توی کارت‌ها و نمایش‌ها این رو نشون می‌دیم
// ✅ sector بیشتر برای فیلتر و دسته‌بندی استفاده می‌شه
//
// ✅ firstCatalog — بعد از ثبت کسب‌وکار، پیشنهادِ «اولین ابزار»:
//     true  → اول کاتالوگ قیمت بساز (جنسبَذَرها: تولیدی، پخش، عمده‌فروش، خدمات‌دهنده)
//     false → اول بازوی خرید بساز (خریدبذَرها: خرده‌فروش، رستوران، آرایشگر و مشابه‌ها)
//   ⚠️ فقط «پیشنهاد» است نه اجبار — هر دو ابزار همیشه در دسترس‌اند (کارت گام بعدی در /business/register)
export const BUSINESS_TYPE = [

    {
        id: "distribution",
        label: "توزیع، پخش و واسطه‌گری",
        children: [
            { id: "wholesaler", label: "عمده‌فروش", firstCatalog: true },
            { id: "distributor", label: "نماینده رسمی پخش", firstCatalog: true },
            { id: "distributor2", label: "پخش محلی (غیر نمایندگی)", firstCatalog: true },
            { id: "broker", label: "واسطه و دلال", firstCatalog: true },
            { id: "logistics", label: "لجستیک و حمل‌ونقل بار", firstCatalog: true },
            { id: "warehouse", label: "انبارداری", firstCatalog: true },
        ],
    },
    {
        id: "retail",
        label: "خرده‌فروشی و فروش مستقیم",
        children: [
            { id: "store", label: "فروشگاه فیزیکی", firstCatalog: false },
            { id: "ecommerce", label: "فروشگاه اینترنتی", firstCatalog: false },
            { id: "chain_store", label: "فروشگاه زنجیره‌ای", firstCatalog: false },
            { id: "direct_sales", label: "فروش مستقیم", firstCatalog: false },
        ],
    },
    {
        id: "service",
        label: "خدمات",
        children: [
            { id: "consulting", label: "مشاوره", firstCatalog: true },
            { id: "contracting", label: "پیمانکاری", firstCatalog: true },
            { id: "maintenance", label: "تعمیرات و نگهداری", firstCatalog: true },
            { id: "digital", label: "خدمات دیجیتال", firstCatalog: true },
            { id: "training", label: "آموزش", firstCatalog: true },
            { id: "other_services", label: "سایر خدمات", firstCatalog: false },
        ],
    },
    {
        id: "manufacturing",
        label: "تولید و صنعت",
        children: [
            { id: "raw_material", label: "تولیدکننده مواد اولیه", firstCatalog: true },
            { id: "parts", label: "تولیدکننده قطعات/اجزا", firstCatalog: true },
            { id: "final_product", label: "تولیدکننده محصول نهایی", firstCatalog: true },
            { id: "packaging", label: "بسته‌بندی و تکمیل محصول", firstCatalog: true },
        ],
    },
    {
        id: "trade",
        label: "بازرگانی و تجارت",
        children: [
            { id: "importer", label: "واردکننده", firstCatalog: true },
            { id: "exporter", label: "صادرکننده", firstCatalog: true },
            { id: "importer_exporter", label: "واردات و صادرات", firstCatalog: true },
            { id: "trading_house", label: "خانه بازرگانی", firstCatalog: true },
            { id: "agent", label: "نمایندگی فروش", firstCatalog: true },
        ],
    },
] as const;

export type BusinessType = typeof BUSINESS_TYPE;
export type BusinessSector = BusinessType[number]["id"];
export type BusinessRole = BusinessType[number]["children"][number]["id"];

// ✅ helper: پیدا کردن label یک role
export function getBusinessRoleLabel(roleId: string | undefined | null): string {
    if (!roleId) return '';
    for (const sector of BUSINESS_TYPE) {
        const found = sector.children.find((c: any) => c.id === roleId);
        if (found) return found.label;
    }
    return '';
}

// ✅ helper: پیدا کردن sector یک role
export function getBusinessSector(roleId: string | undefined | null): string {
    if (!roleId) return '';
    for (const sector of BUSINESS_TYPE) {
        if (sector.children.some((c: any) => c.id === roleId)) {
            return sector.id;
        }
    }
    return '';
}

// ✅ helper: پیشنهادِ اولین ابزار برای یک role —
// true → اول کاتالوگ قیمت | false → اول بازوی خرید | undefined → role نامشخص/قدیمی (بدون پیشنهاد)
export function getFirstCatalog(roleId: string | undefined | null): boolean | undefined {
    if (!roleId) return undefined;
    for (const sector of BUSINESS_TYPE) {
        const found = sector.children.find((c: any) => c.id === roleId);
        if (found) return (found as any).firstCatalog as boolean | undefined;
    }
    return undefined;
}

// ✅ helper: پیدا کردن sector label
export function getBusinessSectorLabel(sectorId: string | undefined | null): string {
    if (!sectorId) return '';
    const sector = BUSINESS_TYPE.find((s: any) => s.id === sectorId);
    return sector?.label || '';
}

// ✅ helper: پیدا کردن همه‌ی role‌ها (مسطح) — برای DropSelector
export function getAllBusinessRoles(): { value: string; label: string; sector: string }[] {
    const all: { value: string; label: string; sector: string }[] = [];
    for (const sector of BUSINESS_TYPE) {
        for (const role of sector.children) {
            all.push({ value: role.id, label: role.label, sector: sector.id });
        }
    }
    return all;
}

// ============================================================
// ⚠️ DEPRECATED — فقط backward-compat — به‌زودی حذف می‌شه
// ============================================================
// اینا برای رکوردهای قدیمی استفاده می‌شن. به‌جای اینا از BUSINESS_TYPE استفاده کنید.
export const CATALOG_TYPE_LABELS: Record<string, string> = {
    producer: 'تولیدی',
    wholesaler: 'عمده‌فروش',
    importer: 'واردکننده',
    exporter: 'صادرکننده',
    distributor: 'توزیع‌کننده',
    retailer: 'خرده‌فروش',
    contractor: 'پیمانکار',
    service_provider: 'خدمات',
    other: 'سایر',
};

export const CATALOG_TYPES = [
    { label: 'تولیدی', value: 'producer' },
    { label: 'عمده‌فروش', value: 'wholesaler' },
    { label: 'واردکننده', value: 'importer' },
    { label: 'صادرکننده', value: 'exporter' },
    { label: 'توزیع‌کننده', value: 'distributor' },
    { label: 'خرده‌فروش', value: 'retailer' },
    { label: 'پیمانکار', value: 'contractor' },
    { label: 'خدمات', value: 'service_provider' },
    { label: 'سایر', value: 'other' },
];

/**
 * ⚠️ پل سازگاری (deprecated) — role جدید (سطح ۲ درخت) → type قدیمی
 * نمایش‌هایی که هنوز business.type / catalog.type را می‌خوانند تا مهاجرت کامل
 * به businessRole/businessSector کار کنند. بعد از مهاجرت نمایش‌ها حذف می‌شود.
 */
export function getLegacyTypeFromRole(roleId: string | undefined | null): string | undefined {
    if (!roleId) return undefined;
    const map: Record<string, string> = {
        // تولید و صنعت
        raw_material: 'producer', parts: 'producer', final_product: 'producer', packaging: 'producer',
        // بازرگانی و تجارت
        importer: 'importer', exporter: 'exporter', importer_exporter: 'importer',
        trading_house: 'distributor', agent: 'distributor',
        // توزیع، پخش و واسطه‌گری
        wholesaler: 'wholesaler', distributor: 'distributor', distributor2: 'distributor',
        broker: 'distributor', logistics: 'distributor', warehouse: 'distributor',
        // خرده‌فروشی و فروش مستقیم
        store: 'retailer', ecommerce: 'retailer', chain_store: 'retailer', direct_sales: 'retailer',
        // خدمات
        consulting: 'service_provider', contracting: 'contractor', maintenance: 'service_provider',
        digital: 'service_provider', training: 'service_provider', other_services: 'service_provider',
    };
    return map[roleId];
}
