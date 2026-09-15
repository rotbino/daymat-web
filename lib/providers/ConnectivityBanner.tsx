// lib/providers/ConnectivityBanner.tsx
'use client';
// ============================================================
// نوار پیام غیرمزاحم وضعیت اتصال — فقط برای «میان‌جلسه».
//
// چرا این کامپوننت هست؟ ریدایرکت به صفحهٔ قطعی در طول جلسه ممنوع است
// (networkGuard → handleNetworkFailure در فاز میان‌جلسه فقط رویداد می‌دهد).
//
// رفتار:
//   • خطای شبکه می‌آید → ۴ ثانیه صبر؛ اگر تا آن‌ موقع اتصال برگشت
//     (قطعیِ یک‌ثانیه‌ای) کاربر اصلاً چیزی نمی‌بیند.
//   • بعد از ۴ ثانیه هنوز قطع بود → نوار کوچک پایین صفحه ظاهر می‌شود؛
//     هیچ پوششی روی صفحه نیست، کار با فرم ادامه دارد.
//   • اولین پاسخ موفق API → noteSessionOnline → رویداد null →
//     نوار سبزِ «اتصال برقرار شد» برای ۲.۵ ثانیه، بعد محو می‌شود.
// ============================================================

import { useEffect, useRef, useState } from 'react';
import { CloudOff, Cloud, Loader2, X } from 'lucide-react';
import { onNetworkIssue, NetworkIssueKind } from '@/lib/api/networkGuard';

const SHOW_DELAY_MS = 4_000; // قطعی‌های کوتاه‌تر از این اصلاً دیده نمی‌شوند
const RECOVERED_HOLD_MS = 2_500;

export function ConnectivityBanner() {
    const [issue, setIssue] = useState<NetworkIssueKind | null>(null);
    const [visible, setVisible] = useState(false);       // نوار قطعی
    const [recovered, setRecovered] = useState(false);   // فلش سبز رفع قطعی
    const [dismissed, setDismissed] = useState(false);   // کاربر بست تا قطعی بعدی

    const showTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const clearTimers = () => {
            if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
            if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
        };

        const unsub = onNetworkIssue((kind) => {
            if (kind) {
                // قطع جدید: اگر نوار سبز قبلی باز است اول پاک شود
                clearTimers();
                setRecovered(false);
                setDismissed(false);
                setIssue(kind);
                setVisible(false);
                // تأخیر نمایش — فقط قطعی‌های واقعی و طولانی دیده می‌شوند
                showTimer.current = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
            } else {
                // اتصال برقرار شد
                clearTimers();
                setIssue(null);
                setVisible((wasVisible) => {
                    if (wasVisible) {
                        setRecovered(true);
                        hideTimer.current = setTimeout(() => setRecovered(false), RECOVERED_HOLD_MS);
                    }
                    return false;
                });
            }
        });

        return () => { unsub(); clearTimers(); };
    }, []);

    const close = () => {
        if (showTimer.current) { clearTimeout(showTimer.current); showTimer.current = null; }
        setVisible(false);
        setIssue(null);
        setDismissed(true);
    };

    if (recovered) {
        return (
            <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex justify-center px-4">
                <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-brand-primary-tint bg-white px-4 py-2.5
                    text-sm font-bold text-brand-primary-strong shadow-lg shadow-stone-900/10
                    dark:border-brand-primary/30 dark:bg-gray-900 dark:text-brand-primary">
                    <Cloud className="size-4" />
                    اتصال برقرار شد
                </div>
            </div>
        );
    }

    if (!visible || !issue || dismissed) return null;

    const text = issue === 'offline'
        ? 'اتصال اینترنت قطع شده؛ به‌محض وصل شدن ادامه می‌دهیم.'
        : 'ارتباط با سرور برقرار نیست؛ به‌محض برقراری ادامه می‌دهیم.';

    return (
        <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex justify-center px-4">
            <div className="pointer-events-auto flex max-w-md items-center gap-2.5 rounded-full border border-stone-200 bg-white/95
                py-2.5 ps-4 pe-2.5 shadow-xl shadow-stone-900/10 backdrop-blur
                dark:border-gray-700 dark:bg-gray-900/95">
                <Loader2 className="size-4 shrink-0 animate-spin text-brand-contrast" />
                <p className="text-xs font-bold leading-5 text-stone-700 dark:text-gray-200">{text}</p>
                <button
                    type="button"
                    onClick={close}
                    aria-label="بستن"
                    className="grid size-6 shrink-0 place-items-center rounded-full text-stone-400 transition-colors
                    hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-gray-800 dark:hover:text-gray-300">
                    <X className="size-3.5" />
                </button>
            </div>
        </div>
    );
}
