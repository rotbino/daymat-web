// public/sw.js
// ✅ سرویس‌ورکر مینیمال آی مچ
// فلسفه: هیچ‌وقت دادهٔ API را کش نمی‌کنیم (تازگی داده مقدس است)؛
// فقط ناوبری‌ها network-first با صفحهٔ آفلاین، و استاتیک‌ها stale-while-revalidate.

const VERSION = "v1.0";
const STATIC_CACHE = `imach-static-${VERSION}`;
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

// ─── 🔔 پوش فوری — اعلام خرید فعال شد، پیشنهاد رسید، پیش‌فاکتور تایید شد ───
self.addEventListener("push", (event) => {
    let data = { title: "آی مچ", body: "", href: null };
    try {
        if (event.data) {
            const parsed = event.data.json();
            data = { ...data, ...parsed };
        }
    } catch {
        if (event.data) data.body = event.data.text();
    }

    event.waitUntil(
        self.registration.showNotification(data.title || "آی مچ", {
            body: data.body || "",
            icon: "/icons/icon-192.png",
            badge: "/icons/icon-192.png",
            dir: "rtl",
            lang: "fa",
            data: { href: data.href },
        })
    );
});

// ─── کلیک روی نوتیف → باز کردن مقصد ───
self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const href = event.notification.data?.href;
    event.waitUntil(
        (async () => {
            const clientList = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
            for (const client of clientList) {
                if (href && "focus" in client) {
                    client.navigate(href);
                    return client.focus();
                }
                if ("focus" in client) return client.focus();
            }
            if (href) return self.clients.openWindow(href);
            return self.clients.openWindow("/");
        })()
    );
});
