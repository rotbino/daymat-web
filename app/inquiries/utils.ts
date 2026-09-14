// app/inquiries/utils.ts — کمک‌متیرهای مشترک صفحه درخواست قیمت
export const faNum = (n: number | null | undefined): string =>
    (n ?? 0).toLocaleString('fa-IR');

export const faPrice = (n: number | null | undefined, currency?: string | null): string =>
    `${faNum(n)} ${currency === 'IRR' ? 'ریال' : 'تومان'}`;

/** زمان نسبی فارسی — «۳ ساعت پیش» */
export function faTimeAgo(iso?: string | null): string {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'همین حالا';
    if (m < 60) return `${faNum(m)} دقیقه پیش`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${faNum(h)} ساعت پیش`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${faNum(d)} روز پیش`;
    const mo = Math.floor(d / 30);
    if (mo < 12) return `${faNum(mo)} ماه پیش`;
    return `${faNum(Math.floor(mo / 12))} سال پیش`;
}

/** مهلت مانده — «۳ روز مانده» / «منقضی» */
export function faDeadlineLeft(iso?: string | null): { text: string; urgent: boolean } | null {
    if (!iso) return null;
    const diff = new Date(iso).getTime() - Date.now();
    if (diff <= 0) return { text: 'مهلت تمام شده', urgent: true };
    const h = Math.floor(diff / 3600000);
    if (h < 24) return { text: `${faNum(Math.max(1, h))} ساعت مانده`, urgent: true };
    const d = Math.floor(h / 24);
    return { text: `${faNum(d)} روز مانده`, urgent: d <= 3 };
}

export const STATUS_FA: Record<string, string> = {
    open: 'باز',
    closed: 'بسته',
    archived: 'بایگانی',
    pending: 'در انتظار',
    accepted: 'پذیرفته شد',
    rejected: 'رد شد',
    withdrawn: 'منصرف شد',
};

export const STATUS_CHIP: Record<string, string> = {
    open: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    closed: 'bg-stone-100 text-stone-500 dark:bg-gray-800 dark:text-gray-400',
    archived: 'bg-stone-100 text-stone-400 dark:bg-gray-800/60 dark:text-gray-500',
    pending: 'bg-brand-amber-soft text-amber-700 dark:text-amber-400',
    accepted: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400',
    rejected: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    withdrawn: 'bg-stone-100 text-stone-400 dark:bg-gray-800 dark:text-gray-500',
};

// ✅ کلاس واحد ورودی فرم‌های صفحه درخواست قیمت — متن در هر دو تم خوانا
export const inp = 'h-10 rounded-xl border border-stone-200 bg-white px-3 text-sm font-bold text-stone-900 outline-none transition-colors placeholder:font-medium placeholder:text-stone-400 focus:border-brand-amber dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-brand-amber dark:focus:bg-gray-950';
export const inpSm = 'h-9 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-900 outline-none transition-colors placeholder:font-medium placeholder:text-stone-400 focus:border-brand-amber dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-brand-amber dark:focus:bg-gray-950';

// پیشنهادهای پرکاربرد واحد — اگر در مرجع واحد باشند اول لیست می‌آیند
export const UNIT_SUGGESTIONS = ['کیلوگرم', 'کارتن', 'عدد', 'بسته', 'لیتر', 'متر', 'تان'];
