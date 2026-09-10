// app/api/img-proxy/route.ts
// پروکسی تصویر سمت سرور — وقتی هاستِ منبع (مثل آروان) هدر CORS نمی‌دهد،
// کانواسِ کارت ویزیت/پوستر نمی‌تواند تصویر را بکشد (crossOrigin شکست می‌خورد).
// این روت تصویر را سمت سرور می‌گیرد و از دامنهٔ خودمان سرو می‌کند → هم‌مبدأ = رسم آزاد.
// گاردهای امنیتی: فقط http/https، بلاک‌کردن هاست‌های خصوصی/لوکال (SSRF)، سقف ۸MB، فقط image/*.
import { NextRequest } from 'next/server';

const MAX_BYTES = 8 * 1024 * 1024;

const isBlockedHost = (host: string) => {
    const h = host.toLowerCase().replace(/^\[|\]$/g, '');
    return (
        h === 'localhost' || h === '0.0.0.0' || h === '::1' || h === '' ||
        h.endsWith('.local') || h.endsWith('.internal') ||
        /^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) ||
        /^169\.254\./.test(h) || /^0\./.test(h) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(h)
    );
};

export async function GET(req: NextRequest) {
    const src = req.nextUrl.searchParams.get('url');
    if (!src) return new Response('missing url', { status: 400 });

    let u: URL;
    try { u = new URL(src); } catch { return new Response('bad url', { status: 400 }); }
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return new Response('bad protocol', { status: 400 });
    if (isBlockedHost(u.hostname)) return new Response('blocked host', { status: 400 });

    try {
        const upstream = await fetch(u.toString(), {
            signal: AbortSignal.timeout(8000),
            headers: { 'User-Agent': 'DaymatImgProxy/1.0' },
            redirect: 'follow',
        });
        if (!upstream.ok) return new Response('upstream error', { status: 502 });
        const type = upstream.headers.get('content-type') ?? '';
        if (!type.startsWith('image/')) return new Response('not an image', { status: 415 });
        const len = Number(upstream.headers.get('content-length') ?? '0');
        if (len > MAX_BYTES) return new Response('too large', { status: 413 });
        const buf = await upstream.arrayBuffer();
        if (buf.byteLength > MAX_BYTES) return new Response('too large', { status: 413 });
        return new Response(buf, {
            headers: {
                'Content-Type': type,
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
            },
        });
    } catch {
        return new Response('fetch failed', { status: 502 });
    }
}
