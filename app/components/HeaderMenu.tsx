// app/components/HeaderMenu.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import {
    EllipsisVertical, Moon, Sun, Info, FileText, User, Store,
    ShieldCheck, Bookmark, Lightbulb, LogIn,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * منوی سه‌نقطه هدر: حساب کاربری + تم + صفحات ثابت + برندینگ.
 * اگر از next-themes استفاده می‌کنی، toggleTheme را با useTheme جایگزین کن.
 */
export default function HeaderMenu({ className }: { className?: string }) {
    const [open, setOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);
    const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);

    const armName = currentArm?.name || 'بازار';
    const loginHref = `/login?arm=${currentSlug ?? ''}`;

    // ⚠️ اگر isArmOwner را از جای دیگری (هوک/ArmMembership) می‌گیری، فقط این خط را عوض کن
    const isArmOwner =
        !!user?.id &&
        ((currentArm as any)?.ownerUserId === user.id ||
            (currentArm as any)?.arm?.ownerUserId === user.id);

    useEffect(() => { setIsDark(document.documentElement.classList.contains('dark')); }, []);

    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', h);
        document.addEventListener('keydown', k);
        return () => {
            document.removeEventListener('mousedown', h);
            document.removeEventListener('keydown', k);
        };
    }, [open]);

    const toggleTheme = () => {
        const next = !isDark;
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
        setIsDark(next);
    };

    const item = 'w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] text-on-surface hover:bg-surface-container-high transition-colors text-right';
    const close = () => setOpen(false);

    return (
        <div ref={ref} className={cn('relative flex-shrink-0', className)}>
            <button
                type="button"
                aria-label="منو"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant
                    hover:text-on-surface hover:bg-surface-container-high active:scale-95 transition-all"
            >
                <EllipsisVertical className="w-5 h-5" />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute top-full end-0 mt-1 w-60 p-1.5 rounded-2xl bg-white dark:bg-gray-900
                        border border-outline-variant/30 shadow-xl z-[60] animate-in fade-in zoom-in-95 duration-150
                        max-h-[calc(100vh-4.5rem)] overflow-y-auto scrollbar-slim"
                >
                    {/* ─── حساب کاربری ─── */}
                    {isAuthenticated ? (
                        <>
                            <Link href="/profile" role="menuitem" onClick={close} className={item}>
                                <User className="w-4 h-4 text-on-surface-variant" />
                                پروفایل من
                            </Link>
                            <Link href="/saved-ads" role="menuitem" onClick={close} className={item}>
                                <Bookmark className="w-4 h-4 text-on-surface-variant" />
                                آگهی‌های ذخیره‌شده
                            </Link>
                            {isArmOwner && (
                                <Link
                                    href="/arm-admin"
                                    role="menuitem"
                                    onClick={close}
                                    className="w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px]
                                        text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                                        transition-colors text-right"
                                >
                                    <Store className="w-4 h-4" />
                                    پنل مالک بازار
                                </Link>
                            )}
                            {user?.role === 'system_admin' && (
                                <Link
                                    href="/admin"
                                    role="menuitem"
                                    onClick={close}
                                    className="w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px]
                                        text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-right"
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    پنل ادمین
                                </Link>
                            )}
                        </>
                    ) : (
                        <Link href={loginHref} role="menuitem" onClick={close} className={item}>
                            <LogIn className="w-4 h-4 text-primary" />
                            ورود | عضویت
                        </Link>
                    )}

                    {/* ─── تم ─── */}
                    <button type="button" onClick={toggleTheme} role="menuitem" className={item}>
                        {isDark
                            ? <Sun className="w-4 h-4 text-amber-400" />
                            : <Moon className="w-4 h-4 text-indigo-500" />}
                        {isDark ? 'تم روشن' : 'تم تاریک'}
                    </button>

                    <div className="h-px bg-outline-variant/20 my-1" />

                    {/* ─── صفحات بازار ─── */}
                    <Link href="/docs/about" role="menuitem" onClick={close} className={item}>
                        <Info className="w-4 h-4 text-on-surface-variant" />
                        درباره {armName}
                    </Link>
                    <Link href="/docs/terms" role="menuitem" onClick={close} className={item}>
                        <FileText className="w-4 h-4 text-on-surface-variant" />
                        قوانین
                    </Link>
                    <Link href="/feedback" role="menuitem" onClick={close} className={item}>
                        <Lightbulb className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                        پیشنهادات و انتقادات
                    </Link>

                    {/* ─── برندینگ دیمت ─── */}
                    <div className="border-t border-outline-variant/20 mt-1 pt-2.5 pb-1 px-4 flex flex-col items-center gap-1">
                        <Image
                            src="/images/logo2.png"
                            alt="دیمت"
                            width={130}
                            height={30}
                            className="object-contain"
                        />
                        <span className="text-[12px] text-on-surface-variant">دیمت، نمایش روزانه قیمت</span>
                    </div>
                </div>
            )}
        </div>
    );
}