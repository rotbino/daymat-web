'use client';

// app/server-unavailable/page.tsx
// صفحهٔ «سرور در دسترس نیست» — وقتی اینترنت وصل است ولی بک‌اند یا دیتابیس پاسخ نمی‌دهد.
// رفتار:
//   • هر ۵ ثانیه GET /health را پینگ می‌کند (مهلت ۵ ثانیه)
//   • 200 → هدایت خودکار به صفحهٔ مقصد (ذخیره‌شده در sessionStorage)
//   • 503 → «پایگاه داده پاسخ نمی‌دهد» | خطای شبکه → «ارتباط با سرور برقرار نیست»
//   • navigator.onLine = false → حالت «اینترنت قطع است» (همان پیام offline)
//   • دکمهٔ «تلاش مجدد» → بررسی فوری
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getApiUrl } from '@/lib/api/apiRequest';
import { consumeReturnUrl } from '@/lib/api/networkGuard';

type Status = 'checking' | 'offline' | 'backend' | 'db';

const STATUS_TEXT: Record<Status, { title: string; sub: string }> = {
    checking: { title: 'در حال بررسی اتصال…', sub: 'یه لحظه، وضعیت سرور دیمت را چک می‌کنیم.' },
    offline: {
        title: 'اتصال اینترنت قطع است',
        sub: 'وای‌فای یا دیتای موبایل خود را بررسی کنید. به‌محض وصل شدن، خودکار به صفحهٔ موردنظر برمی‌گردید.',
    },
    backend: {
        title: 'سرور در دسترس نیست',
        sub: 'ارتباط با سرور دیمت برقرار نیست. به‌محض برقراری ارتباط، به صفحهٔ موردنظر هدایت می‌شوید.',
    },
    db: {
        title: 'سرور در دسترس نیست',
        sub: 'سرور بالا است اما پایگاه داده پاسخ نمی‌دهد. به‌محض برقراری ارتباط، به صفحهٔ موردنظر هدایت می‌شوید.',
    },
};

export default function ServerUnavailablePage() {
    const router = useRouter();
    const [status, setStatus] = useState<Status>('checking');
    const [probing, setProbing] = useState(false);
    const returnUrlRef = useRef<string | null>(null);
    const busyRef = useRef(false);

    /** یک بار پینگ health — true یعنی همه‌چیز برقرار است */
    const check = useCallback(async (): Promise<boolean> => {
        if (busyRef.current) return false;
        busyRef.current = true;
        setProbing(true);
        try {
            if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                setStatus('offline');
                return false;
            }
            const ctrl = new AbortController();
            const timer = setTimeout(() => ctrl.abort(), 5000);
            try {
                const res = await fetch(getApiUrl('health'), {
                    cache: 'no-store',
                    signal: ctrl.signal,
                });
                if (res.ok) return true;
                setStatus('db'); // بک بالا است ولی دیتابیس نه
                return false;
            } finally {
                clearTimeout(timer);
            }
        } catch {
            setStatus('backend'); // بک اصلاً پاسخ نداد
            return false;
        } finally {
            busyRef.current = false;
            setProbing(false);
        }
    }, []);

    useEffect(() => {
        returnUrlRef.current = consumeReturnUrl();

        let stopped = false;
        let timerId: ReturnType<typeof setTimeout> | null = null;

        const run = async () => {
            if (stopped) return;
            const ok = await check();
            if (stopped) return;
            if (ok) {
                router.replace(returnUrlRef.current || '/');
                return;
            }
            timerId = setTimeout(run, 5000); // چک خودکار هر ۵ ثانیه
        };

        const onOnline = () => {
            // اینترنت برگشت → فوری بررسی کن
            if (!stopped && !busyRef.current) run();
        };
        window.addEventListener('online', onOnline);

        run();

        return () => {
            stopped = true;
            if (timerId) clearTimeout(timerId);
            window.removeEventListener('online', onOnline);
        };
    }, [check, router]);

    const text = STATUS_TEXT[status];

    return (
        <main
            dir="rtl"
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0b1c30',
                color: '#fff',
                textAlign: 'center',
                padding: 24,
                fontFamily: 'inherit',
            }}
        >
            <div style={{ maxWidth: 420 }}>
                <div
                    style={{
                        width: 88,
                        height: 88,
                        margin: '0 auto 24px',
                        borderRadius: 24,
                        background: 'linear-gradient(135deg, #082038 0%, #123456 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,.08)',
                    }}
                >
                    <svg
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="2" y="3" width="20" height="7" rx="2" />
                        <rect x="2" y="14" width="20" height="7" rx="2" />
                        <line x1="6" y1="6.5" x2="6.01" y2="6.5" />
                        <line x1="6" y1="17.5" x2="6.01" y2="17.5" />
                        <line x1="4" y1="21" x2="20" y2="3" opacity="0.9" strokeWidth="1.2" />
                    </svg>
                </div>

                <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12 }}>{text.title}</h1>
                <p style={{ fontSize: 14, lineHeight: 2, color: 'rgba(255,255,255,.65)', marginBottom: 8 }}>
                    {text.sub}
                </p>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,.35)', marginBottom: 28 }}>
                    بررسی خودکار هر ۵ ثانیه انجام می‌شود
                </p>

                <button
                    onClick={() => {
                        if (!busyRef.current) {
                            setStatus('checking');
                            check().then((ok) => {
                                if (ok) router.replace(returnUrlRef.current || '/');
                            });
                        }
                    }}
                    disabled={probing}
                    style={{
                        fontFamily: 'inherit',
                        fontSize: 15,
                        fontWeight: 700,
                        background: probing
                            ? 'linear-gradient(135deg, #b45309, #92400e)'
                            : 'linear-gradient(135deg, #f97316, #ea580c)',
                        color: '#fff',
                        border: 0,
                        borderRadius: 14,
                        padding: '14px 44px',
                        cursor: probing ? 'wait' : 'pointer',
                        boxShadow: '0 10px 24px -8px rgba(249,115,22,.55)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 10,
                    }}
                >
                    {probing && (
                        <span
                            style={{
                                width: 14,
                                height: 14,
                                border: '2px solid rgba(255,255,255,.4)',
                                borderTopColor: '#fff',
                                borderRadius: '50%',
                                display: 'inline-block',
                                animation: 'daymat-spin 0.8s linear infinite',
                            }}
                        />
                    )}
                    تلاش مجدد
                </button>

                <style>{`@keyframes daymat-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </main>
    );
}
