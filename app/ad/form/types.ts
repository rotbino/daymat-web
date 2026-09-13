// app/ad/form/types.ts
// ✅ تایپ‌های مشترک ویزارد آگهی — منبع واحد حقیقت برای همهٔ کامپوننت‌های مرحله

/** یک اسلات عکس — یا فایل موجود روی سرور یا فایل جدید */
export interface ImageSlot {
    id?: string;        // فایل موجود روی سرور
    url?: string;       // آدرس نمایش فایل موجود
    file?: File;        // فایل جدید
    previewUrl?: string;
    _fromProduct?: boolean; // عکس ارث‌رسیده از کالای مرجع
}

/** تمام مقادیر فرم آگهی */
export interface AdFormValues {
    categoryId: string;
    productType: string;
    singleUnitPrice: number;
    unitPrice: number;
    consumerPrice: number;
    minQuantity: number;
    availableQuantity: number;
    cityCode: string;
    cityLabel: string;
    provinceCode: string;
    provinceLabel: string;
    description: string;
    unitId: string;
    unitTitle: string;
    unitQty: number | null;
    unitIsVariableQty: boolean;
    isEditingQty: boolean;
    giftPrice: number;
    volumeTiers: { minQty: number; price: number }[];
    productReferenceId: string;
    /** مدت اعتبار قیمت (ساعت) — ۰ = بدون مهلت؛ فقط برای یادآوری آپدیت قیمت */
    validityHours: number;
}

/** سررسید چک — روز/مبلغ هر ردیف جدا قابل ویرایش */
export interface ChequeTerm {
    days: number;
    price: number;
}

/** شرایط پرداخت — همان shape مدل قدیمی paymentMethods */
export interface PaymentState {
    chequeOn: boolean;
    terms: ChequeTerm[];
    note: string;
    installment: any[];
    installmentDescription: string;
}

/** تنظیمات واحد کاتالوگ */
export interface UnitSettingEntry {
    unitId: string;
    containsQty?: number;
    qtyIsFixed?: boolean;
}

/** گزینهٔ واحد */
export interface UnitOption {
    unitId: string;
    unitTitle: string;
    unitShortCode: string;
    isVariableQty: boolean;
    qty: number | null;
    isDefault: boolean;
}
