// lib/utils/unitLabel.ts
// ✅ برچسب نمایشی واحد — همیشه فارسی:
// عنوان فارسی («عدد»، «کیلوگرم»، «کارتن») مقدم است؛ shortCode انگلیسی («pc»، «kg») فقط
// برای دیتای قدیمی که هنوز title ندارد، به‌عنوان fallback می‌آید — هرگز مستقیم نمایش داده نشود
// مگر در صفحات پیکربندی ادمین (مدیریت واحدها) که کد را به‌عنوان اطلاعات تکمیلی نشان می‌دهند.

export function unitLabel(
    u?: { title?: string | null; shortCode?: string | null } | null,
    fallback = '',
): string {
    return u?.title || u?.shortCode || fallback;
}

// واحد نمایشیِ گرهٔ دسته در درخت بازار: نودها بسته به نسخهٔ پیکربندی، overrideUnitTitle /
// unitTitle / overrideUnitShortCode / unitShortCode دارند — با همین ترتیب فارسی‌اش را پیدا کن
export function nodeUnitLabel(node?: any | null, fallback = ''): string {
    return (
        node?.overrideUnitTitle ||
        node?.unitTitle ||
        node?.overrideUnitShortCode ||
        node?.unitShortCode ||
        fallback
    );
}
