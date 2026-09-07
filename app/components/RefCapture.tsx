// app_/components/RefCapture.tsx
'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

const REF_KEY = 'daymat_ref';
const REF_TTL = 7 * 24 * 60 * 60 * 1000; // ۷ روز

export function readStoredRef(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        const raw = JSON.parse(localStorage.getItem(REF_KEY) || 'null');
        if (!raw?.code || Date.now() - raw.at > REF_TTL) {
            localStorage.removeItem(REF_KEY);
            return null;
        }
        return raw.code;
    } catch {
        return null;
    }
}

export function clearStoredRef(): void {
    try { localStorage.removeItem(REF_KEY); } catch {}
}

/**
 * کد دعوت را از هر مسیری می‌گیرد و ذخیره می‌کند:
 *   ۱) بالای URL: /catalog/register?ref=XXX
 *   ۲) داخل redirect: /login?redirect=%2Fcatalog%2Fregister%3Fref%3DXXX
 */
export default function RefCapture() {
    const pathname = usePathname();

    useEffect(() => {
        const sp = new URLSearchParams(window.location.search);
        let ref = sp.get('ref');

        if (!ref) {
            // URLSearchParams خودش مقدار redirect را decode می‌کند
            const redirect = sp.get('redirect');
            if (redirect && redirect.includes('ref=')) {
                const qs = redirect.split('?')[1] || '';
                ref = new URLSearchParams(qs).get('ref');
            }
        }

        const code = (ref ?? '').trim().slice(0, 16);
        if (code) {
            localStorage.setItem(REF_KEY, JSON.stringify({ code, at: Date.now() }));
        }
    }, [pathname]);

    return null;
}