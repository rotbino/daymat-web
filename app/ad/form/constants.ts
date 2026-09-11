// app/ad/form/constants.ts
// ✅ ثابت‌های ویزارد آگهی

export const MAX_IMAGES = 6;
export const CURRENCY = 'تومان';
export const TOTAL_STEPS = 4;

export const STEP_TITLES = ['کالا', 'قیمت', 'شرایط فروش', 'بررسی'];

// ✅ مدت اعتبار قیمت — برای یادآوری آپدیت قیمت به خود فروشنده (نه فیلتر بازار)
// ۰ = بدون مهلت (هیچ یادآوری‌ای نمی‌آید)
export const VALIDITY_OPTIONS = [
    { hours: 24, label: '۲۴س' },
    { hours: 48, label: '۴۸س' },
    { hours: 72, label: '۳روز' },
    { hours: 168, label: '۷روز' },
    { hours: 0, label: 'بی‌مهلت' },
];

// ✅ سررسیدهای استاندارد چک — روز = ماه × ۳۰ (سازگار با مدل قدیمی paymentMethods)
export const CHEQUE_TERMS = [
    { days: 30, label: '۱ ماهه' },
    { days: 60, label: '۲ ماهه' },
    { days: 90, label: '۳ ماهه' },
    { days: 180, label: '۶ ماهه' },
];
