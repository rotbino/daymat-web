// app/home/Landing.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';
import { BookOpen, Package, Plus, Store, LogIn, ClipboardList } from 'lucide-react';

export default function Landing() {
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);

    // اسکرول نرم به بخش معرفی دیوار استعلام (نوار جهت خرید در Hero)
    const scrollToEstelamWall = () =>
        document.getElementById('estelam-wall')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // ✅ کاتالوگ‌های نمونه — عمومی، از هر صنف
    const { data } = useQuery({
        queryKey: ['featured-catalogs'],
        queryFn: () => apiService.catalog.getFeatured(),
        staleTime: 1000 * 60 * 5,
    });
    const featured = data?.items ?? [];

    // ✅ دو در — هر دو بعد از ورود به /my-catalogs می‌روند
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
                {/* ─── Hero ─── */}
                <section className="pt-12 pb-8 text-center">
                    <p className="text-[11px] font-bold tracking-[0.3em] text-primary/60 mb-3">DAYMAT — PRODUCT CATALOG</p>
                    <h1 className="text-2xl sm:text-4xl font-black text-on-surface leading-snug">
                        کاتالوگ قیمت آنلاین برای کسب و کارت بساز
                    </h1>
                    <p className="mt-4 text-sm sm:text-base text-justify text-on-surface-variant leading-8 max-w-2xl mx-auto">
                        وقتی کاتالوگ دیمت داری، یعنی یه کاتالوگ با قیمت به روز داری که مشتری‌هات عاشقش می‌شن.
                        کاتالوگت رو در چند دقیقه بساز و لینک اختصاصی اون رو در پیامرسان ها برای مشتری‌ها بفرست یا در بیو اینستاگرامت بزار یا کیو آر کدش رو روی کارت ویزیتت چاپ کن.

                    </p>

                    {/* ✅ دکمهٔ اصلی */}
                    <Link href={createHref}
                          className="mt-6 inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-primary text-on-primary
                          text-sm font-extrabold hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all">
                        <BookOpen className="w-5 h-5" />
                        { 'ساخت کاتالوگ رایگان'}
                    </Link>

                    {/* ✅ نوار دو جهتِ قیمت — یک هویت، یک حساب، دو جهت:
                        درِ اصلی تنها همان دکمهٔ بالاست؛ این نوار فقط «جهت‌ها» را نشان می‌دهد
                        تا خریدار (سوپرمارکتی، رستوران و…) خودش را در صفحه ببیند،
                        بدون اینکه صفحه به دو محصول دو شقه بشود. */}
                    <div className="mt-7 max-w-md mx-auto rounded-2xl border border-outline-variant/40
                        bg-white dark:bg-gray-900 p-1.5 flex flex-col sm:flex-row items-stretch gap-1.5 text-xs">
                        <div className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl
                            bg-primary/5 text-primary font-bold whitespace-nowrap">
                            <BookOpen className="w-3.5 h-3.5" />
                            فروش می‌کنی؟ کاتالوگ قیمت
                        </div>
                        <button type="button" onClick={scrollToEstelamWall}
                                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl
                                text-on-surface-variant font-bold hover:text-primary hover:bg-primary/5
                                transition-colors whitespace-nowrap cursor-pointer">
                            <ClipboardList className="w-3.5 h-3.5" />
                            خرید می‌کنی؟ دیوار استعلام
                            <span className="rounded-full bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 leading-none font-bold">به‌زودی</span>
                        </button>
                    </div>

                    {/* ✅ لینک ورود کاربران قدیمی */}
                    {!isAuthenticated && (
                        <p className="mt-5 text-xs text-on-surface-variant">
                            قبلاً کاتالوگ ساخته‌ام؟{' '}
                            <Link href={resumeHref} className="font-bold text-primary hover:underline">
                                ورود به کاتالوگم
                            </Link>
                        </p>
                    )}
                </section>

                {/* ─── سه فایدهٔ کوتاه ─── */}
                <section className="grid sm:grid-cols-3 gap-3 pb-10">
                    {[
                        { icon: BookOpen, title: 'ساخت در چند دقیقه', desc: 'نام کاتالوگ، آدرس اختصاصی، و اولین کالاها — همین.' },
                        { icon: Package, title: 'کالاها با عکس و قیمت', desc: 'هر کالا اعتبار قیمت دارد؛ کاتالوگت همیشه تازه می‌ماند.' },
                        { icon: Plus, title: 'لینک و QR اختصاصی', desc: 'برای بیوی اینستاگرام، واتساپ مشتری‌ها، و ویترین مغازه.' },
                    ].map((s) => (
                        <div key={s.title} className="rounded-2xl border border-outline-variant/40 bg-white dark:bg-gray-900 p-5">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                                <s.icon className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-sm font-extrabold text-on-surface">{s.title}</h3>
                            <p className="mt-1.5 text-xs text-on-surface-variant leading-6">{s.desc}</p>
                        </div>
                    ))}
                </section>

                {/* ─── ✅ به‌زودی: دیوار استعلام — سمت خرید، روی همان حساب ─── */}
                <section id="estelam-wall" className="pb-12 scroll-mt-16">
                    <div className="rounded-3xl border border-outline-variant/40 bg-white dark:bg-gray-900 p-6 sm:p-8">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h2 className="text-sm sm:text-base font-extrabold text-on-surface flex items-center gap-2.5">
                                <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <ClipboardList className="w-4.5 h-4.5 text-primary" />
                                </span>
                                دیوار استعلام قیمت
                            </h2>
                            <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2.5 py-1">به‌زودی در دیمت</span>
                        </div>

                        <p className="mt-4 text-xs sm:text-sm text-on-surface-variant leading-7 text-justify max-w-2xl">
                            کاتالوگ، چیزی را که <b className="text-on-surface">می‌فروشی</b> نشان می‌دهد؛ دیوار استعلام، چیزی را که <b className="text-on-surface">می‌خری</b>.
                            لیست خرید روزانه یا هفتگی‌ات را می‌سازی، لینکش را یک بار به تامین‌کننده‌ها می‌دهی و
                            قیمت‌های پیشنهادی‌شان را داخل پنل همین حساب می‌گیری — بدون سایت و اپ جدا، همان دیمت.
                        </p>

                        <div className="mt-5 grid sm:grid-cols-3 gap-3">
                            {[
                                { n: '۱', title: 'لیست خریدت را بساز', desc: 'هر کالا با تعداد و مشخصات — از لیست روزانه تا هفتگی.' },
                                { n: '۲', title: 'لینکش را به تامین‌کننده‌ها بده', desc: 'یک بار می‌فرستی؛ آنها هر روز نگاه می‌کنند و قیمت می‌دهند.' },
                                { n: '۳', title: 'قیمت‌ها را در پنل خودت ببین', desc: 'پیشنهادها فقط برای تو قابل دیدن است؛ بهترین را انتخاب کن.' },
                            ].map((s) => (
                                <div key={s.n} className="rounded-2xl border border-outline-variant/30
                                    bg-surface-container-low/40 dark:bg-gray-950/40 p-4">
                                    <span className="w-7 h-7 rounded-lg bg-primary/10 text-primary text-xs font-black
                                        flex items-center justify-center">{s.n}</span>
                                    <h3 className="mt-2.5 text-xs font-extrabold text-on-surface">{s.title}</h3>
                                    <p className="mt-1 text-[11px] text-on-surface-variant leading-6">{s.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

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
                        <h2 className="text-lg font-extrabold text-on-surface">کاتالوگت را همین حالا بساز</h2>
                        <p className="mt-2 text-xs text-on-surface-variant leading-6">رایگان، بدون کارمزد، با لینک اختصاصی برای اشتراک‌گذاری</p>
                        <Link href={createHref}
                              className="mt-5 inline-flex items-center gap-2 h-12 px-8 rounded-xl bg-primary text-on-primary
                              text-sm font-extrabold hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all">
                            <BookOpen className="w-5 h-5" /> ساخت کاتالوگ رایگان
                        </Link>

                        {!isAuthenticated && (
                            <p className="mt-4 text-xs text-on-surface-variant">
                                قبلاً کاتالوگ ساخته‌ام؟{' '}
                                <Link href={resumeHref} className="font-bold text-primary hover:underline">ورود به کاتالوگم</Link>
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