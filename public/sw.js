// public/sw.js
// ✅ سرویس‌ورکر مینیمال دیمت
// فلسفه: هیچ‌وقت دادهٔ API را کش نمی‌کنیم (تازگی داده مقدس است)؛
// فقط ناوبری‌ها network-first با صفحهٔ آفلاین، و استاتیک‌ها stale-while-revalidate.

const VERSION = "v1";
const STATIC_CACHE = `daymat-static-${VERSION}`;
const OFFLINE_URL = "/offline.html";

// ─── نصب: پیش‌بارگذاری صفحهٔ آفلاین و آیکون‌ها ───
self.addEventListener("install", (event) => {
    event.waitUntil(
        (async () => {
            const cache = await caches.open(STATIC_CACHE);
            await cache.addAll([OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"]);
            self.skipWaiting();
        })()
    );
});

// ─── فعال‌سازی: پاک‌سازی کش نسخه‌های قبلی ───
self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            const keys = await caches.keys();
            await Promise.all(
                keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k))
            );
            await self.clients.claim();
        })()
    );
});

// ─── دریافت ───
self.addEventListener("fetch", (event) => {
    const { request } = event;

    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // درخواست‌های cross-origin (فونت گوگل، CDN و…) → دست خود مرورگر
    if (url.origin !== self.location.origin) return;

    // ⛔ API هرگز کش نمی‌شود — حتی اگر مسیرش استاتیک به نظر برسد
    if (url.pathname.startsWith("/api/") || url.pathname.includes("/api/")) return;

    // ۱) ناوبری‌ها (صفحات) → network-first؛ آفلاین → صفحهٔ آفلاین
    if (request.mode === "navigate") {
        event.respondWith(
            (async () => {
                try {
                    return await fetch(request);
                } catch {
                    const cache = await caches.open(STATIC_CACHE);
                    return (await cache.match(OFFLINE_URL)) || Response.error();
                }
            })()
        );
        return;
    }

    // ۲) استاتیک‌ها → stale-while-revalidate (پاسخ فوری از کش + به‌روزرسانی پس‌زمینه)
    const isStatic =
        url.pathname.startsWith("/_next/static/") ||
        url.pathname.startsWith("/icons/") ||
        url.pathname.startsWith("/images/") ||
        /\.(png|jpe?g|svg|webp|ico|woff2?|css|js)$/i.test(url.pathname);

    if (isStatic) {
        event.respondWith(
            (async () => {
                const cache = await caches.open(STATIC_CACHE);
                const cached = await cache.match(request);
                const network = fetch(request)
                    .then((res) => {
                        if (res && res.ok) cache.put(request, res.clone());
                        return res;
                    })
                    .catch(() => cached || Response.error());
                return cached || network;
            })()
        );
    }
});
