// app/components/pwa/PwaInstaller.tsx
// ✅ مدیر نصب PWA دیمت — مینیمال، حرفه‌ای، چندسکویی (اندروید / iOS / بقیه)
//
// قوانین نمایش مدال:
//  ۱) اگر اپ نصب‌شده است (standalone) → هرگز نمایش داده نمی‌شود
//  ۲) اگر کاربر قبلاً نصب کرده (appinstalled) → هرگز (پرچم دائمی در localStorage)
//  ۳) رد کردن → اندروید ۷ روز، iOS ۳ روز خاموشی (چون در iOS نصب واقعی قابل تشخیص نیست)
//  ۴) فقط موبایل؛ ۴ ثانیه بعد از ورود؛ اندروید فقط وقتی beforeinstallprompt آماده باشد CTA بومی دارد
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Share, Plus, Download, Zap, WifiOff, X, MoreVertical } from 'lucide-react';

// ─────────────────────────── ثابت‌ها ───────────────────────────
const STORAGE_KEY = 'dm.pwa';
const SHOW_DELAY_MS = 4000;      // چند ثانیه بعد از ورود
const PROMPT_WAIT_MS = 6000;     // حداکثر انتظار برای beforeinstallprompt
const DISMISS_COOLDOWN_DAYS = { android: 7, ios: 3 } as const;
const EXIT_ANIM_MS = 240;

type PwaFlag = { s: 'i' | 'd'; t: number };
type Platform = 'ios' | 'android' | 'other';

// ─────────────────────────── ابزارها ───────────────────────────
function readFlag(): PwaFlag | null {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? (JSON.parse(raw) as PwaFlag) : null;
    } catch {
        return null;
    }
}

function writeFlag(flag: PwaFlag) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(flag));
    } catch {
        /* حالت خصوصی مرورگر — مهم نیست */
    }
}

function isStandalone(): boolean {
    const mm = (q: string) => window.matchMedia?.(q)?.matches;
    return (
        mm('(display-mode: standalone)') ||
        mm('(display-mode: minimal-ui)') ||
        mm('(display-mode: fullscreen)') ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
}

function detectPlatform(): Platform {
    const ua = navigator.userAgent;
    const isIPadOs =
        /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1; // iPadOS 13+ خودش را Mac جا می‌زند
    if (/iPhone|iPad|iPod/i.test(ua) || isIPadOs) return 'ios';
    if (/Android/i.test(ua)) return 'android';
    return 'other';
}

function isMobile(): boolean {
    const coarse = window.matchMedia?.('(pointer: coarse)')?.matches ?? false;
    return coarse || detectPlatform() !== 'other' || /Mobi/i.test(navigator.userAgent);
}

type InstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

// ─────────────────────────── کامپوننت ───────────────────────────
export function PwaInstaller() {
    const [visible, setVisible] = useState(false);
    const [entered, setEntered] = useState(false);
    const [platform, setPlatform] = useState<Platform>('other');
    const [canPrompt, setCanPrompt] = useState(false);
    const closingRef = useRef(false);
    const openedRef = useRef(false);

    // ─── ثبت سرویس‌ورکر (فقط پروداکشن) ───
    useEffect(() => {
        if (process.env.NODE_ENV !== 'production') return;
        if (!('serviceWorker' in navigator)) return;
        const register = () => {
            navigator.serviceWorker.register('/sw.js').catch(() => { /* بی‌صدا */ });
        };
        if (document.readyState === 'complete') register();
        else {
            window.addEventListener('load', register, { once: true });
            return () => window.removeEventListener('load', register);
        }
    }, []);

    const openModal = useCallback(() => {
        if (openedRef.current) return;
        openedRef.current = true;
        setEntered(false);
        setVisible(true);
    }, []);

    const closeModal = useCallback((cooldownDays?: number) => {
        if (closingRef.current) return;
        closingRef.current = true;
        setEntered(false);
        if (cooldownDays) {
            writeFlag({ s: 'd', t: Date.now() });
        }
        setTimeout(() => {
            setVisible(false);
            closingRef.current = false;
        }, EXIT_ANIM_MS);
    }, []);

    // ─── موتور قوانین نمایش ───
    useEffect(() => {
        if (isStandalone()) return;                    // قانون ۱ — نصب‌شده
        const flag = readFlag();
        if (flag?.s === 'i') return;                   // قانون ۲ — نصب قبلی
        if (flag?.s === 'd') {                         // قانون ۳ — خاموشی بعد از رد کردن
            const isIos = detectPlatform() === 'ios';
            const days = isIos
                ? DISMISS_COOLDOWN_DAYS.ios
                : DISMISS_COOLDOWN_DAYS.android;
            if (Date.now() - flag.t < days * 24 * 60 * 60 * 1000) return;
        }
        if (!isMobile()) return;                       // فقط موبایل

        let promptWaitTimer: ReturnType<typeof setTimeout> | undefined;
        const showTimer = setTimeout(() => {
            const pf = detectPlatform();
            setPlatform(pf);

            if (pf === 'ios') {
                openModal();
                return;
            }
            // اندروید/سایر — اگر رخداد نصب بومی آمده باشد CTA بومی، وگرنه راهنمای دستی
            if ((window as any).__dmInstallEvt) {
                setCanPrompt(true);
                openModal();
            } else {
                const onPrompt = () => {
                    setCanPrompt(true);
                    openModal();
                };
                window.addEventListener('beforeinstallprompt', onPrompt, { once: true });
                promptWaitTimer = setTimeout(() => {
                    window.removeEventListener('beforeinstallprompt', onPrompt);
                    if (!openedRef.current) openModal(); // راهنمای دستی
                }, PROMPT_WAIT_MS);
            }
        }, SHOW_DELAY_MS);

        return () => {
            clearTimeout(showTimer);
            if (promptWaitTimer) clearTimeout(promptWaitTimer);
        };
    }, [openModal]);

    // ─── نصب کامل شد → پرچم دائمی + بستن ───
    useEffect(() => {
        const onInstalled = () => {
            writeFlag({ s: 'i', t: Date.now() });
            closeModal();
        };
        window.addEventListener('appinstalled', onInstalled);
        return () => window.removeEventListener('appinstalled', onInstalled);
    }, [closeModal]);

    // ─── انیمیشن ورود ───
    useEffect(() => {
        if (!visible) return;
        const raf = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(raf);
    }, [visible]);

    // ─── نصب بومی (اندروید/کروم) ───
    const handleNativeInstall = async () => {
        const evt = (window as any).__dmInstallEvt as InstallPromptEvent | undefined;
        if (!evt) return;
        try {
            await evt.prompt();
            const { outcome } = await evt.userChoice;
            if (outcome === 'accepted') writeFlag({ s: 'i', t: Date.now() });
            else writeFlag({ s: 'd', t: Date.now() });
        } catch {
            /* کاربر وسط راه بست */
        }
        (window as any).__dmInstallEvt = null;
        closeModal();
    };

    if (!visible) return null;

    const cooldown =
        platform === 'ios' ? DISMISS_COOLDOWN_DAYS.ios : DISMISS_COOLDOWN_DAYS.android;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-end justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="نصب اپلیکیشن دیمت"
        >
            {/* پس‌زمینه */}
            <button
                aria-label="بستن"
                onClick={() => closeModal(cooldown)}
                className={`absolute inset-0 bg-black/45 backdrop-blur-[2px] transition-opacity duration-300 ${
                    entered ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* شیت پایین */}
            <div
                dir="rtl"
                className={`relative w-full max-w-md mx-auto bg-white rounded-t-[28px] shadow-2xl
                            px-6 pt-2.5 pb-[calc(env(safe-area-inset-bottom)+22px)]
                            transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)] ${
                                entered ? 'translate-y-0' : 'translate-y-full'
                            }`}
            >
                <div className="w-10 h-1.5 rounded-full bg-slate-200 mx-auto" />

                <button
                    aria-label="بستن"
                    onClick={() => closeModal(cooldown)}
                    className="absolute top-4 left-4 p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                >
                    <X size={18} />
                </button>

                {/* سربرگ */}
                <div className="flex items-center gap-3.5 mt-4">
                    <img
                        src="/icons/icon-192.png"
                        alt="دیمت"
                        className="w-[62px] h-[62px] rounded-[18px] shadow-md shadow-slate-900/10 ring-1 ring-black/5"
                    />
                    <div>
                        <div className="text-[17px] font-black text-slate-900 leading-6">دیمت</div>
                        <div className="text-xs text-slate-400 mt-0.5">کاتالوگ روزانه قیمت</div>
                    </div>
                </div>

                {/* پیام */}
                <p className="mt-4 text-[13.5px] leading-6 text-slate-500">
                    دیمت را روی گوشی خودت نصب کن؛ مثل یک اپ واقعی با یک لمس از دسکتاپ گوشی باز می‌شود —
                    سریع‌تر، تمام‌صفحه و بدون نوار مرورگر.
                </p>

                {/* مزایا */}
                <div className="grid grid-cols-3 gap-2 mt-4">
                    {[
                        { icon: <Zap size={17} />, label: 'اجرای سریع' },
                        { icon: <WifiOff size={17} />, label: 'صفحهٔ آفلاین' },
                        { icon: <Download size={17} />, label: 'آیکون روی گوشی' },
                    ].map((b) => (
                        <div
                            key={b.label}
                            className="flex flex-col items-center gap-1.5 rounded-2xl bg-slate-50 py-3"
                        >
                            <span className="w-8 h-8 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center">
                                {b.icon}
                            </span>
                            <span className="text-[11px] font-medium text-slate-600">{b.label}</span>
                        </div>
                    ))}
                </div>

                {/* ── بدنه بر اساس پلتفرم ── */}
                {platform === 'ios' ? (
                    <>
                        <div className="mt-4 space-y-2.5">
                            {[
                                {
                                    n: '۱',
                                    text: 'روی آیکون',
                                    icon: <Share size={15} className="inline text-slate-700 align-[-2px]" />,
                                    after: '(اشتراک‌گذاری) در پایین سافاری بزن',
                                },
                                {
                                    n: '۲',
                                    text: 'گزینهٔ «Add to Home Screen» را انتخاب کن',
                                    icon: null,
                                    after: '',
                                },
                                {
                                    n: '۳',
                                    text: 'بعد «Add» را بزن — تمام!',
                                    icon: null,
                                    after: '',
                                },
                            ].map((s) => (
                                <div
                                    key={s.n}
                                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-3.5 py-2.5"
                                >
                                    <span className="w-6 h-6 shrink-0 rounded-full bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center">
                                        {s.n}
                                    </span>
                                    <span className="text-[12.5px] text-slate-600 leading-5">
                                        {s.text} {s.icon}
                                        {s.after ? <span> {s.after}</span> : null}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => closeModal(cooldown)}
                            className="mt-4 w-full h-12 rounded-2xl bg-slate-100 text-slate-700 text-[15px] font-bold active:scale-[.98] transition-transform"
                        >
                            متوجه شدم
                        </button>
                    </>
                ) : canPrompt ? (
                    <>
                        <button
                            onClick={handleNativeInstall}
                            className="mt-5 w-full h-12 rounded-2xl bg-gradient-to-l from-orange-500 to-orange-600 text-white
                                       text-[15px] font-bold shadow-lg shadow-orange-500/30 active:scale-[.98] transition-transform"
                        >
                            نصب اپلیکیشن
                        </button>
                        <button
                            onClick={() => closeModal(cooldown)}
                            className="mt-1.5 w-full py-2.5 text-[13px] font-medium text-slate-400 hover:text-slate-500 transition-colors"
                        >
                            الان نه
                        </button>
                    </>
                ) : (
                    <>
                        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-3.5 py-3">
                            <span className="w-9 h-9 shrink-0 rounded-xl bg-white shadow-sm flex items-center justify-center">
                                <MoreVertical size={16} className="text-slate-700" />
                            </span>
                            <span className="text-[12.5px] text-slate-600 leading-5">
                                از منوی مرورگر (⋮) گزینهٔ <b className="text-slate-800">«افزودن به صفحهٔ اصلی»</b> را انتخاب کن
                            </span>
                        </div>
                        <button
                            onClick={() => closeModal(cooldown)}
                            className="mt-4 w-full h-12 rounded-2xl bg-gradient-to-l from-orange-500 to-orange-600 text-white
                                       text-[15px] font-bold shadow-lg shadow-orange-500/30 active:scale-[.98] transition-transform"
                        >
                            فهمیدم
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
