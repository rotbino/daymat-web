// lib/deviceMeta.ts
// ─────────────────────────────────────────────────────────────
// کلکتور ساکت مشخصات سیستم — پشت‌صحنه، بدون هیچ پرامپت/اجازه‌ای از کاربر
//   در لحظهٔ ثبت‌نام/ورود به همراه فرم ارسال می‌شود؛ سرور علاوه بر این‌ها
//   User-Agent واقعی، IP و جستجوی جغرافیاییِ IP را خودش اضافه می‌کند.
//   هدف: گزارشِ دیوایس/مرورگرهای پرخطا و پراکندگی جغرافیایی کاربران.
//   هر خطایی = آبجکت خالی — هرگز نباید ثبت‌نام/ورود را خراب کند.
// ─────────────────────────────────────────────────────────────

export function collectDeviceMeta(): Record<string, unknown> {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return {};
    try {
        const nav = navigator as any;
        const conn = nav.connection || nav.mozConnection || nav.webkitConnection;

        const meta: Record<string, unknown> = {
            // ابعاد صفحه و پنجره — «کدام دیوایس‌ها» را دقیق‌تر می‌کند
            screen: {
                w: window.screen?.width ?? null,
                h: window.screen?.height ?? null,
                colorDepth: window.screen?.colorDepth ?? null,
            },
            viewportWidth: window.innerWidth ?? null,
            viewportHeight: window.innerHeight ?? null,
            dpr: window.devicePixelRatio ?? null,

            // زبان و تایم‌زون — پراکندگی جغرافیایی/فرهنگی
            language: nav.language ?? null,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? null,
            timezoneOffset: -new Date().getTimezoneOffset(), // دقیقه — مثلا تهران = ۲۷۰

            // سخت‌افزار و شبکه — «کدام دیوایس‌ها بیشتر به مشکل می‌خورن»
            deviceMemory: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : null, // GB (روند شده)
            hardwareConcurrency: typeof nav.hardwareConcurrency === 'number' ? nav.hardwareConcurrency : null,
            connection: conn
                ? {
                      effectiveType: conn.effectiveType ?? null, // 4g / 3g / ...
                      downlink: typeof conn.downlink === 'number' ? conn.downlink : null, // Mbps
                      saveData: !!conn.saveData,
                  }
                : null,

            // مشخصات کلی
            platform: nav.userAgentData?.platform ?? nav.platform ?? null,
            touchPoints: nav.maxTouchPoints ?? 0,
            cookiesEnabled: !!nav.cookieEnabled,
        };

        // کلیدهای null را حذف کن — پیلوت تمیز بماند
        for (const k of Object.keys(meta)) {
            if (meta[k] === null || meta[k] === undefined) delete meta[k];
        }
        return meta;
    } catch {
        return {};
    }
}
