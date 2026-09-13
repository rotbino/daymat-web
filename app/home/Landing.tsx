// app/home/Landing.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';
import { BookOpen, Package, Store, LogIn, Megaphone, ArrowDown } from 'lucide-react';

/**
 * لندینگ دیمت — مثل یک نقاشی ساده:
 * «هر کسب‌وکاری دو قیمت دارد: یکی برای چیزی که می‌فروشد، یکی برای چیزی که می‌خرد.»
 * دو محصول هم‌وزن؛ کاربر خودش تشخیص می‌دهد کدام به دردش می‌خورد و با آن شروع می‌کند
 * (سوپرمارکت → تابلوی اعلام نیاز، شرکت پخش → کاتالوگ قیمت) —
 * و هر کدام را که بسازد، دومی هم بعداً در پنل همین حساب در دسترس است.
 */

const CATALOG_STEPS = [
    'کالاهایت را با عکس و قیمت وارد کن',
    'لینک و QR اختصاصی را بین مشتری‌ها پخش کن',
    'همیشه با قیمت به‌روز بفروش',
];

const WALL_STEPS = [
    'نیاز خریدت را ثبت کن — کالا، تعداد، مهلت',
    'تابلویت را برای تامین‌کننده‌ها بفرست',
    'قیمت‌ها را بگیر و بهترین را انتخاب کن',
];

const STEP_NUMS = ['۱', '۲', '۳'];

export default function Landing() {
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);
    const [wallNoticeCard, setWallNoticeCard] = useState(false);
    const [wallNoticeBand, setWallNoticeBand] = useState(false);

    // ✅ کاتالوگ‌های نمونه — عمومی، از هر صنف
    const { data } = useQuery({
        queryKey: ['featured-catalogs'],
        queryFn: () => apiService.catalog.getFeatured(),
        staleTime: 1000 * 60 * 5,
    });
    const featured = data?.items ?? [];

    const createHref = isAuthenticated
        ? '/my-catalogs'
        : `/login?redirect=${encodeURIComponent('/my-catalogs')}`;

    const resumeHref = isAuthenticated
        ? '/my-catalogs'
        : `/login?redirect=${encodeURIComponent('/my-catalogs')}`;

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40
            dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40">
            {/* ─── هدر مینیمال ─── */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur border-b border-outline-variant/20">
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                    <div className="relative h-8 w-24">
                        <Image src="/images/logo3.png" alt="دیمت" fill className="object-contain" unoptimized priority />
                    </div>
                    {isAuthenticated ? (
                        <Link href="/my-catalogs"
                              className="h-9 px-4 flex items-center rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary/90 shadow-sm">
                            کاتالوگ من
                        </Link>
                    ) : (
                        <Link href="/login"
                              className="h-9 px-4 flex items-center gap-1.5 rounded-xl border border-outline-variant
                                  text-xs font-bold text-on-surface hover:border-primary hover:text-primary transition-colors">
                            <LogIn className="w-3.5 h-3.5" /> ورود | عضویت
                        </Link>
                    )}
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4">
                {/* ─── Hero — یک جمله، مثل نقاشی ─── */}
                <section className="pt-12 pb-8 text-center">
                    <p className="text-[11px] font-bold tracking-[0.3em] text-primary/60 mb-3">DAYMAT — TWO PRICE TOOLS</p>
                    <h1 className="text-2xl sm:text-4xl font-black text-on-surface leading-snug">
                        هر کسب‌وکاری دو قیمت دارد
                    </h1>
                    <p className="mt-3 text-base sm:text-xl font-extrabold text-primary leading-8">
                        یکی برای چیزی که می‌فروشد، یکی برای چیزی که می‌خرد.
                    </p>
                    <p className="mt-3 text-xs sm:text-sm text-on-surface-variant leading-7 max-w-xl mx-auto">
                        دیمت برای هر کدام یک ابزار ساده ساخته است — تو انتخاب کن کدام به دردت می‌خورد.
                    </p>
                </section>

                {/* ─── دو محصول هم‌وزن — کاربر خودش انتخاب می‌کند ─── */}
                <section className="grid sm:grid-cols-2 gap-4 pb-4">
                    {/* ۱) کاتالوگ قیمت — ابزار فروش */}
                    <div className="rounded-3xl border border-outline-variant/40 bg-white dark:bg-gray-900 p-6 flex flex-col">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                            <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1">برای فروش</span>
                        </div>
                        <h3 className="mt-4 text-lg font-black text-on-surface">کاتالوگ قیمت</h3>
                        <p className="mt-1.5 text-xs text-on-surface-variant leading-6">
                            کالاهایت را با عکس و قیمتِ به‌روز نشان بده؛ مشتری همیشه لیست تازه داشته باشد.
                        </p>

                        <div className="mt-5 flex flex-col">
                            {CATALOG_STEPS.map((t, i) => (
                                <React.Fragment key={t}>
                                    {i > 0 && (
                                        <div className="flex justify-center py-1">
                                            <ArrowDown className="w-3.5 h-3.5 text-on-surface-variant/40" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2.5 rounded-xl bg-surface-container-low/50
                                        dark:bg-gray-950/40 px-3.5 py-2.5">
                                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[11px] font-black
                                            flex items-center justify-center flex-shrink-0">{STEP_NUMS[i]}</span>
                                        <p className="text-[11px] font-bold text-on-surface leading-5">{t}</p>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {['عمده‌فروش و پخش', 'تولیدکننده', 'فروشگاه'].map((a) => (
                                <span key={a} className="rounded-full border border-outline-variant/40 px-2.5 py-1 text-[10px] text-on-surface-variant">
                                    {a}
                                </span>
                            ))}
                        </div>

                        <Link href={createHref}
                              className="mt-5 h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-on-primary
                              text-sm font-extrabold hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all">
                            <BookOpen className="w-4.5 h-4.5" /> ساخت کاتالوگ رایگان
                        </Link>
                    </div>

                    {/* ۲) تابلوی اعلام نیاز — ابزار خرید */}
                    <div className="rounded-3xl border border-outline-variant/40 bg-white dark:bg-gray-900 p-6 flex flex-col">
                        <div className="flex items-start justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <Megaphone className="w-6 h-6 text-primary" />
                            </div>
                            <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1">برای خرید</span>
                        </div>
                        <h3 className="mt-4 text-lg font-black text-on-surface">تابلوی اعلام نیاز</h3>
                        <p className="mt-1.5 text-xs text-on-surface-variant leading-6">
                            آنچه می‌خری را اعلام کن؛ تامین‌کننده‌ها قیمت بدهند، تو بهترین را انتخاب کن.
                        </p>

                        <div className="mt-5 flex flex-col">
                            {WALL_STEPS.map((t, i) => (
                                <React.Fragment key={t}>
                                    {i > 0 && (
                                        <div className="flex justify-center py-1">
                                            <ArrowDown className="w-3.5 h-3.5 text-on-surface-variant/40" />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2.5 rounded-xl bg-surface-container-low/50
                                        dark:bg-gray-950/40 px-3.5 py-2.5">
                                        <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-[11px] font-black
                                            flex items-center justify-center flex-shrink-0">{STEP_NUMS[i]}</span>
                                        <p className="text-[11px] font-bold text-on-surface leading-5">{t}</p>
                                    </div>
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-1.5">
                            {['سوپرمارکت و فروشگاه', 'رستوران و کافه', 'کارگاه و سازمان'].map((a) => (
                                <span key={a} className="rounded-full border border-outline-variant/40 px-2.5 py-1 text-[10px] text-on-surface-variant">
                                    {a}
                                </span>
                            ))}
                        </div>

                        <button type="button" onClick={() => setWallNoticeCard(true)}
                                className="mt-5 h-11 flex items-center justify-center gap-2 rounded-xl bg-primary text-on-primary
                                text-sm font-extrabold hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.98]
                                transition-all cursor-pointer">
                            <Megaphone className="w-4.5 h-4.5" />
                            ساخت تابلوی اعلام نیاز
                            <span className="rounded-full bg-white/20 text-[9px] px-1.5 py-0.5 leading-none font-bold">به‌زودی</span>
                        </button>
                        {wallNoticeCard && (
                            <p className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-[11px] text-on-surface leading-5">
                                در حال آماده‌سازی است — به‌زودی در پنل دیمت فعال می‌شود. فعلاً حساب‌ات را بساز تا اولین استفاده‌کننده‌اش باشی.
                            </p>
                        )}
                    </div>
                </section>

                <p className="text-center text-[11px] text-on-surface-variant pb-10 leading-6">
                    هر دو با یک حساب دیمت ساخته می‌شوند — با هر کدام شروع کنی، دومی هم همیشه در پنل خودت در دسترس است.
                </p>

                {/* ─── ✅ کاتالوگ‌های نمونه ─── */}
                <section className="pb-12">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-extrabold text-on-surface flex items-center gap-1.5">
                            <Store className="w-4 h-4 text-primary" /> کاتالوگ‌های نمونه
                        </h2>
                        <Link href="/catalogs" className="text-[11px] font-bold text-primary">همه ←</Link>
                    </div>

                    {featured.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-outline-variant/50 p-6 text-center">
                            <p className="text-xs text-on-surface-variant leading-6">
                                هنوز کاتالوگ نمونه‌ای ثبت نشده — اولین نفر باش!
                            </p>
                        </div>
                    ) : (
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {featured.map((b: any) => (
                                <Link key={b.id} href={`/${b.slug}`}
                                      className="group flex items-center gap-3 rounded-2xl border border-outline-variant/40
                                      bg-white dark:bg-gray-900 p-4 hover:border-primary/40 hover:shadow-md transition-all">
                                    <div className="w-11 h-11 rounded-xl bg-surface-container-high dark:bg-gray-800
                                        flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {b.logoUrl
                                            ? <Image src={b.logoUrl} alt={b.name} width={44} height={44} className="object-cover" unoptimized />
                                            : <BookOpen className="w-5 h-5 text-on-surface-variant/50" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-extrabold text-on-surface truncate group-hover:text-primary transition-colors">{b.name}</p>
                                        {b.industryName && <p className="text-[10px] text-on-surface-variant/70 truncate mt-0.5">{b.industryName}</p>}
                                        <div className="flex items-center gap-0.5 text-[10px] text-on-surface-variant/60 mt-1">
                                            <Package className="w-3 h-3" /> {(b._count?.ads ?? 0).toLocaleString('fa-IR')} کالا
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* ✅ پیام ویروسی */}
                    <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 flex items-center gap-3.5">
                        <span className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-4.5 h-4.5 text-primary" />
                        </span>
                        <p className="flex-1 text-[11px] text-on-surface leading-6">
                            کاتالوگت را بساز و با کمی اعتبار، آن را در همین بخش «نمونه» نمایش بده —
                            هزاران بازدیدکننده‌ی دیمت کاتالوگت را می‌بینند.
                        </p>
                    </div>
                </section>

                {/* ─── باند CTA پایانی ─── */}
                <section className="pb-16">
                    <div className="rounded-3xl bg-gradient-to-l from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 text-center">
                        <h2 className="text-lg font-extrabold text-on-surface">از کدام شروع می‌کنی؟</h2>
                        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3">
                            <Link href={createHref}
                                  className="h-12 px-8 inline-flex items-center gap-2 rounded-xl bg-primary text-on-primary
                                  text-sm font-extrabold hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all">
                                <BookOpen className="w-5 h-5" /> کاتالوگ قیمت
                            </Link>
                            <button type="button" onClick={() => setWallNoticeBand(true)}
                                    className="h-12 px-8 inline-flex items-center gap-2 rounded-xl border-2 border-primary/40 text-primary
                                    text-sm font-extrabold hover:bg-primary/5 transition-colors cursor-pointer">
                                <Megaphone className="w-5 h-5" /> تابلوی اعلام نیاز
                                <span className="rounded-full bg-primary/10 text-[9px] px-1.5 py-0.5 leading-none font-bold">به‌زودی</span>
                            </button>
                        </div>
                        {wallNoticeBand && (
                            <p className="mt-4 text-[11px] text-on-surface leading-5 max-w-md mx-auto
                                rounded-xl border border-primary/20 bg-white/60 dark:bg-gray-900/60 px-3.5 py-2.5">
                                در حال آماده‌سازی است — به‌زودی در پنل دیمت فعال می‌شود. فعلاً حساب‌ات را بساز تا اولین استفاده‌کننده‌اش باشی.
                            </p>
                        )}

                        {!isAuthenticated && (
                            <p className="mt-4 text-xs text-on-surface-variant">
                                قبلاً عضو دیمت هستم؟{' '}
                                <Link href={resumeHref} className="font-bold text-primary hover:underline">ورود به حسابم</Link>
                            </p>
                        )}
                    </div>
                </section>
            </main>

            {/* ─── فوتر ─── */}
            <footer className="border-t border-outline-variant/20 py-6">
                <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-on-surface-variant/70">
                    <span className="font-bold">دیمت، نمایش روزانه قیمت</span>
                    <nav className="flex items-center gap-4">
                        <Link href="/docs/about" className="hover:text-primary">درباره ما</Link>
                        <Link href="/docs/terms" className="hover:text-primary">قوانین</Link>
                        <Link href="/feedback" className="hover:text-primary">پیشنهادات</Link>
                    </nav>
                </div>
            </footer>
        </div>
    );
}
