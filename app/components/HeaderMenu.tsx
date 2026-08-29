// app/components/HeaderMenu.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { EllipsisVertical, Moon, Sun, Info, FileText, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from "next/image";

/**
 * منوی سه‌نقطه هدر: تم + صفحات ثابت.
 * اگر از next-themes استفاده می‌کنی، toggleTheme را با useTheme جایگزین کن.
 */
export default function HeaderMenu({ className }: { className?: string }) {
    const [open, setOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => { setIsDark(document.documentElement.classList.contains('dark')); }, []);

    useEffect(() => {
        if (!open) return;
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, [open]);

    const toggleTheme = () => {
        const next = !isDark;
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
        setIsDark(next);
    };

    const item = 'w-full flex items-center gap-2.5 h-10 px-3 rounded-xl text-[13px] text-on-surface hover:bg-surface-container-high transition-colors';

    return (
        <div ref={ref} className={cn('relative flex-shrink-0', className)}>
            <button
                type="button"
                aria-label="منو"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className="w-7 h-10 flex items-center justify-center rounded-full text-on-surface-variant
                    hover:text-on-surface hover:bg-surface-container-high active:scale-95 transition-all"
            >
                <EllipsisVertical className="w-5 h-5" />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute top-full end-0 mt-1 w-48 p-1.5 rounded-2xl bg-white dark:bg-gray-900
                        border border-outline-variant/30 shadow-xl z-[60] animate-in fade-in zoom-in-95 duration-150"
                >
                    <button type="button" onClick={toggleTheme} role="menuitem" className={item}>
                        {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
                        {isDark ? 'تم روشن' : 'تم تاریک'}
                    </button>
                    <div className="h-px bg-outline-variant/20 my-1" />
                    <Link href="/about" role="menuitem" className={item} onClick={() => setOpen(false)}>
                        <Info className="w-4 h-4 text-on-surface-variant" /> درباره ما
                    </Link>
                    <Link href="/terms" role="menuitem" className={item} onClick={() => setOpen(false)}>
                        <FileText className="w-4 h-4 text-on-surface-variant" /> قوانین و مقررات
                    </Link>
                    <Link href="/contact" role="menuitem" className={item} onClick={() => setOpen(false)}>
                        <Phone className="w-4 h-4 text-on-surface-variant" /> تماس با ما
                    </Link>
                    <div className="flex flex-col  items-center justify-center pt-10 ">
                        <div className="flex  items-center justify-center gap-2">
                            <div className="h-12 relative">
                                <Image
                                    src="/images/logo2.png"
                                    alt="دیمت"
                                    width={30}
                                    height={12}
                                    className="w-full h-full object-contain"
                                />
                            </div>
                        </div>
                        <span className={"text-[12px]"}>دیمت، نمایش روزانه قیمت</span>
                    </div>
                </div>
            )}
        </div>
    );
}