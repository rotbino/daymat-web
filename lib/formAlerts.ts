// lib/formAlerts.ts
// ⚖️ قانون همیشگی فرم‌های دیمت — کاربر پیام‌های ولیدیشنِ ریزِ روی کامپوننت را نمی‌بیند؛
// هر جا فیلد الزامی پر نشده، علاوه بر خطای CSSِ همان فیلد، «الرتِ toast واضح» با ذکرِ
// خودِ فیلد نشان بده. مثال: «صنف انتخاب نشده».
// هر فرم جدید/بازنویسی‌شده موظف است از این هیلپر (یا همین الگو) استفاده کند.

import { toast } from 'sonner';

/**
 * الرتِ واضحِ خطاهای فرم — پیامِ مهم‌ترین فیلدِ گم‌شده در عنوان، بقیه در توضیح.
 * @param errors  نقشهٔ فیلد→پیام (ترتیبِ درج = ترتیبِ نمایش؛ به‌ترتیبِ خودِ فرم بساز)
 * @returns true اگر خطایی بود و الرت نشان داده شد
 */
export function toastFormErrors(errors: Record<string, string | undefined>) {
    const msgs = Object.values(errors).filter((m): m is string => !!m && m.trim().length > 0);
    if (msgs.length === 0) return false;
    toast.error(msgs[0], {
        description: msgs.length > 1 ? msgs.slice(1).join('، ') : undefined,
        duration: 6000,
    });
    return true;
}
