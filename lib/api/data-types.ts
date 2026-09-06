// lib/api/data-types.ts

// ============================================================
// سمت‌های کاربر در کسب‌وکار
// ============================================================
export const USER_POSITIONS = [
    { label: 'مالک کسب و کار', value: '1' },
    { label: 'مالک و مسوول فروش', value: '2' },
    { label: 'مدیرعامل', value: '3' },
    { label: 'مدیر بازرگانی', value: '4' },
    { label: 'مدیر فروش', value: '5' },
    { label: 'مدیر خرید', value: '6' },
    { label: 'کارشناس فروش', value: '7' },
    { label: 'کارشناس خرید', value: '8' },
    { label: 'حسابدار یا امور مالی', value: '9' },
    { label: 'سایر', value: '10' },
];

// ============================================================
// نقش‌های کاربر در بازار (فروشنده/خریدار)
// ============================================================
export const CATALOG_ROLES = [
    { label: 'فروشنده عمده', value: 'seller' },
    { label: 'خریدار عمده', value: 'buyer' },
];
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
// ============================================================
// نوع کسب‌وکار
// ============================================================
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

