// lib/api/errorHandler.ts
import { ApiError } from './apiTypes';

// ============================================================
// ✅ تشخیص خطاهای سیستمی (سرور، شبکه، دیتابیس)
// ============================================================
export function isSystemError(error: any): boolean {
    // خطاهای شبکه و اتصال
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        return true;
    }

    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        return true;
    }

    if (error.message?.includes('timeout') || error.message?.includes('Server selection timeout')) {
        return true;
    }

    // خطاهای Prisma (P2010 و غیره)
    if (error.code === 'P2010') {
        return true;
    }

    // خطاهای مربوط به دیتابیس (در meta.message)
    if (error.meta?.message) {
        const msg = error.meta.message;
        if (msg.includes('Mongo') || msg.includes('mongo') ||
            msg.includes('Server selection') || msg.includes('ReplicaSet') ||
            msg.includes('No available servers') || msg.includes('connection')) {
            return true;
        }
    }

    if (error.message?.includes('Mongo') || error.message?.includes('Prisma')) {
        return true;
    }

    // خطاهای سرور (بدون پاسخ معنی‌دار)
    if (error.response?.status === 500 || error.response?.status === 502 || error.response?.status === 503 || error.response?.status === 504) {
        return true;
    }

    return false;
}

// ============================================================
// ✅ پیام‌های خطاهای سیستمی
// ============================================================
export function getSystemErrorMessage(error: any): string {
    // بررسی meta.message برای خطاهای Prisma
    if (error.meta?.message) {
        const msg = error.meta.message;
        if (msg.includes('Server selection timeout') || msg.includes('No available servers')) {
            return 'خطا در اتصال به پایگاه داده. لطفاً با پشتیبانی تماس بگیرید.';
        }
        if (msg.includes('connection refused') || msg.includes('actively refused')) {
            return 'اتصال به پایگاه داده برقرار نیست. لطفاً با پشتیبانی تماس بگیرید.';
        }
        if (msg.includes('ReplicaSet')) {
            return 'خطا در اتصال به خوشه دیتابیس. لطفاً با پشتیبانی تماس بگیرید.';
        }
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        return 'ارتباط با سرور برقرار نیست. لطفاً اتصال اینترنت خود را بررسی کنید.';
    }

    if (error.code === 'ECONNRESET') {
        return 'ارتباط با سرور قطع شد. لطفاً مجدداً تلاش کنید.';
    }

    if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        return 'مدت زمان پاسخ‌دهی سرور به پایان رسید. لطفاً مجدداً تلاش کنید.';
    }

    if (error.message?.includes('Server selection timeout') || error.message?.includes('Mongo')) {
        return 'خطا در اتصال به پایگاه داده. لطفاً با پشتیبانی تماس بگیرید.';
    }

    if (error.response?.status === 500) {
        return 'خطای داخلی سرور. لطفاً بعداً تلاش کنید.';
    }

    if (error.response?.status === 502 || error.response?.status === 503 || error.response?.status === 504) {
        return 'سرور در دسترس نیست. لطفاً بعداً تلاش کنید.';
    }

    return 'خطا در ارتباط با سرور. لطفاً بعداً تلاش کنید.';
}

// ============================================================
// ✅ تبدیل خطا به پیام کاربرپسند (برای همه خطاها)
// ============================================================
export function getFriendlyErrorMessage(error: any): string {
    // اول خطاهای سیستمی رو چک کن
    if (isSystemError(error)) {
        return getSystemErrorMessage(error);
    }

    // خطاهای business logic با errorCode
    if (error?.response?.data?.errorCode) {
        const errorMessages: Record<string, string> = {
            'DUPLICATE_PHONE': 'این شماره موبایل قبلاً ثبت شده است',
            'WRONG_CREDENTIALS': 'شماره موبایل یا رمز عبور اشتباه است',
            'ARM_NOT_FOUND': '',
            'NOT_MEMBER': 'شما عضو این بازار نیستید. لطفا ابتدا عضو بازار شوید.',
            'ALREADY_MEMBER': 'شما قبلاً عضو این بازار هستید',
            'INSUFFICIENT_CREDIT': 'اعتبار شما کافی نیست',
            'DUPLICATE_BUSINESS_NAME': 'شما قبلاً یک کسب‌وکار با این نام ثبت کرده‌اید',
            'BUSINESS_NOT_FOUND': 'کسب‌وکار یافت نشد',
            'CATEGORY_NOT_AVAILABLE_IN_ARM': 'این دسته‌بندی برای بازارفعلی فعال نیست',
            'CATEGORY_REQUIRED': 'انتخاب دسته کالا الزامی است',
            'UNIT_NOT_FOUND': 'واحد برای این دسته‌بندی یافت نشد',
            'NO_ACTIVE_BUSINESS': 'ابتدا یک کسب‌وکار ثبت کنید',
            'FILE_TOO_LARGE': 'حجم فایل بیشتر از حد مجاز است',
            'INVALID_FILE_TYPE': 'نوع فایل مجاز نیست',
        };
        return errorMessages[error.response.data.errorCode] || error.response.data.message || 'خطایی رخ داده است';
    }

    // خطاهای اعتبارسنجی
    if (error?.response?.status === 400 && error?.response?.data?.field) {
        const fieldMessages: Record<string, string> = {
            phone: 'شماره موبایل نامعتبر است',
            password: 'رمز عبور نامعتبر است',
            fullName: 'نام و نام خانوادگی نامعتبر است',
            categoryId: 'دسته‌بندی نامعتبر است',
            unitId: 'واحد نامعتبر است',
            unitPrice: 'قیمت واحد نامعتبر است',
            minQuantity: 'حداقل سفارش نامعتبر است',
            city: 'شهر نامعتبر است',
            cityCode: 'کد شهر نامعتبر است',
            provinceCode: 'کد استان نامعتبر است',
        };
        return fieldMessages[error.response.data.field] || `فیلد "${error.response.data.field}" نامعتبر است`;
    }

    // خطاهای ۴۰۴
    if (error?.response?.status === 404) {
        return 'منبع مورد نظر یافت نشد';
    }

    // خطاهای ۴۰۳
    if (error?.response?.status === 403) {
        return 'شما دسترسی لازم برای این عملیات را ندارید';
    }

    // خطاهای ۴۰۱
    if (error?.response?.status === 401) {
        return 'شما وارد نشده‌اید. لطفاً مجدداً وارد شوید.';
    }

    // اگر پیام از سرور اومده
    if (error?.response?.data?.message && typeof error.response.data.message === 'string') {
        return error.response.data.message;
    }

    return error?.message || 'خطایی رخ داده است. لطفاً مجدداً تلاش کنید.';
}