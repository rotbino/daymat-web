// app/[slug]/buyers/BuyersBoard.tsx
'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useMarketInit } from '@/lib/hooks/useMarketInit';
import { useInquiryArmBoard } from '@/lib/api/apiHooks';
import { Megaphone, Loader2, ShoppingCart, ArrowLeft, Building2 } from 'lucide-react';
import NavTabs from '@/app/home/nav/NavTabs';
import { boardEnabled } from '@/app/home/nav/config';
import AppHeader from '@/app/components/AppHeader';
import SearchBox from '@/components/home/SearchBox';

/**
 * ✅ تابلوی خریداران — صفحهٔ مستقل با هویت کهربایی (متمایز از تابلوی قیمتِ فروشندگان)
 *    منبع: GET /inquiry/arm/:slug → InquiryPublication (فقط اعلام‌های منتشرشده)
 *    فیلتر خودِ تابلو: ‎?search= (عنوان، خریدار، شهر، اقلام) — همان سرچِ هدر روی همین مسیر می‌ماند
 */
export default function BuyersBoard({ slug }: { slug: string }) {
    const { loading: initLoading, armNotFound } = useMarketInit(slug);
    const currentArm = useSelector((s: RootState) => s.arm.currentArm);
    const searchParams = useSearchParams();
    const q = (searchParams.get('search') || '').trim();

    // ✅ ماژول‌های بازار — بازوی خرید خاموش → حالت غیرفعال (بدون درخواست API)
    const buyersOn = boardEnabled(currentArm, 'inquiry');
    const sellersOn = boardEnabled(currentArm, 'price');

    const { data: board, isPending } = useInquiryArmBoard(slug);
    const items = board?.items ?? [];

    const filtered = useMemo(() => {
        if (!q) return items;
        const needle = q.toLowerCase();
        return items.filter((it: any) =>
            (it.title || '').toLowerCase().includes(needle) ||
            (it.business?.name || it.owner?.fullName || '').toLowerCase().includes(needle) ||
            (it.city || '').toLowerCase().includes(needle) ||
            (it.items ?? []).some((x: any) => (x.name || '').toLowerCase().includes(needle)),
        );
    }, [items, q]);

    if (initLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 animate-spin text-amber-500" />
            </div>
        );
    }

    if (armNotFound) {
        return (
            <div className="min-h-screen grid place-items-center bg-surface dark:bg-gray-950 text-center px-4">
                <div>
                    <ShoppingCart className="w-12 h-12 text-on-surface-variant/30 mx-auto mb-4" />
                    <p className="text-lg font-bold text-on-surface">بازار یافت نشد</p>
                    <a href="/" className="mt-4 inline-block text-primary text-sm font-bold">رفتن به صفحهٔ فروشندگان</a>
                </div>
            </div>
        );
    }

    const armName = currentArm?.name || '';

    return (
        <div className="min-h-screen bg-gradient-to-b from-amber-50/60 via-surface to-surface
            dark:from-amber-950/20 dark:via-gray-950 dark:to-gray-950 pb-24">

            <NavTabs guestMarketSlug={slug} />

            {/* موبایل: هویت بازار + زنگولهٔ اعلان (همیشه بالا) + سرچ تابلو */}
            <div className="lg:hidden flex-shrink-0 z-40">
                <AppHeader showLocation={false} showBack={false} showSearch={false} fixed />
                <div className="bg-white dark:bg-gray-900 border-b border-amber-200/50 dark:border-gray-800">
                    <div className="px-3 py-1.5">
                        <SearchBox compact />
                    </div>
                </div>
            </div>

            {/* ═══ هدر کهربایی تابلو — هویت مستقل صفحهٔ خریداران ═══ */}
            <header className="bg-gradient-to-l from-amber-100/80 to-amber-50/40 dark:from-amber-900/25 dark:to-gray-900/40
                border-b border-amber-200/60 dark:border-amber-900/40">
                <div className="max-w-5xl mx-auto px-4 py-6">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-brand-contrast flex items-center justify-center flex-shrink-0
                            shadow-[0_4px_14px_-4px_rgba(245,158,11,0.5)]">
                            <ShoppingCart className="w-5.5 h-5.5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg font-black text-stone-900 dark:text-amber-100 truncate">
                                دیوار خریداران {armName && `بازار ${armName}`}
                            </h1>
                            <p className="text-[11px] font-bold text-amber-800/80 dark:text-amber-300/70 mt-0.5">
                                درخواست‌های خریدِ خریدارانِ عضو اینجاست — فروشنده هستی؟ قیمت پیشنهادی بده.
                            </p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-5">
                {/* ✅ بازوی خرید خاموش — مدیر از ماژول‌ها روشن کند */}
                {!buyersOn ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-surface-container-high dark:bg-gray-800 grid place-items-center mx-auto mb-4">
                            <ShoppingCart className="w-8 h-8 text-on-surface-variant/25" />
                        </div>
                        <p className="text-sm font-bold text-on-surface dark:text-gray-200">دیوار خریداران این بازار غیرفعال است</p>
                        <p className="mt-1 text-[11px] text-on-surface-variant/70">مدیر بازار این دیوار را در ماژول‌ها خاموش کرده است.</p>
                        {sellersOn && (
                            <Link href={`/${slug}`}
                                  className="mt-5 inline-flex h-10 px-5 items-center rounded-xl bg-primary text-on-primary text-[12px] font-bold shadow-sm hover:bg-primary/90 transition-colors">
                                رفتن به تابلوی قیمت (فروشندگان)
                            </Link>
                        )}
                    </div>
                ) : (
                <>
                {/* نوار وضعیت — تعداد + فیلتر جاری */}
                <div className="flex items-center justify-between gap-3 mb-3.5 px-1">
                    <p className="text-[11px] font-bold text-stone-500 dark:text-gray-400">
                        {isPending ? 'در حال بارگذاری…' : `${filtered.length.toLocaleString('fa-IR')} بازوی خرید`}
                        {q && !isPending && ` برای «${q}»`}
                    </p>
                </div>

                {isPending ? (
                    <div className="text-center py-16">
                        <Loader2 className="w-6 h-6 animate-spin text-amber-500 mx-auto" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 rounded-2xl bg-amber-100/70 dark:bg-amber-900/25 grid place-items-center mx-auto mb-4">
                            <Megaphone className="w-8 h-8 text-amber-400/80 dark:text-amber-600" />
                        </div>
                        {q ? (
                            <>
                                <p className="text-sm font-bold text-on-surface dark:text-gray-200">بازوی خریدی با «{q}» پیدا نشد</p>
                                <p className="mt-1 text-[11px] text-on-surface-variant/70">عبارت دیگری را امتحان کن.</p>
                            </>
                        ) : (
                            <>
                                <p className="text-sm font-bold text-on-surface-variant dark:text-gray-400">هنوز بازوی خریدی روی این تابلو نیست</p>
                                <p className="mt-1 text-[11px] font-bold text-stone-400 dark:text-gray-500">سوپرمارکت‌ها و خریدارانِ عضو، لیست خریدشان را اینجا منتشر می‌کنند</p>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                        {filtered.map((inq: any) => (
                            <InquiryCard key={inq.id} inq={inq} />
                        ))}
                    </div>
                )}
                </>
                )}
            </main>
        </div>
    );
}

/** کارت بازوی خرید — سفیدِ سایه‌دار با تاکید کهربایی (متمایز از کارت قیمت) */
function InquiryCard({ inq }: { inq: any }) {
    return (
        <Link href={`/i/${inq.slug || inq.id}`}
              className="group block rounded-2xl border border-amber-200/50 dark:border-gray-800 bg-white dark:bg-gray-900 p-4
                  shadow-[0_2px_12px_-6px_rgba(15,23,42,0.14)] hover:shadow-[0_8px_24px_-10px_rgba(245,158,11,0.35)]
                  hover:border-amber-300/60 transition-all">
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <p className="truncate text-[13px] font-black text-stone-900 dark:text-gray-100">{inq.title}</p>
                    <p className="mt-0.5 truncate text-[11px] font-bold text-stone-400 dark:text-gray-500 flex items-center gap-1">
                        <Building2 className="w-3 h-3 flex-shrink-0" />
                        {inq.business?.name || inq.owner?.fullName || 'خریدار'}{inq.city ? ` · ${inq.city}` : ''}
                    </p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-contrast px-2 py-0.5 text-[9px] font-black text-white">
                    {/* ✅ شمارش فقط اقلام فوریِ در حال قیمت‌گیری (رفع اغراق در بج) */}
                    {(inq.items ?? []).filter((it: any) => it.urgent).length.toLocaleString('fa-IR')} قلم فوری
                </span>
            </div>
            {inq.items?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                    {inq.items.slice(0, 3).map((it: any) => (
                        <span key={it.id}
                              className="rounded-full bg-brand-contrast-soft px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                            {it.name}{it.quantity ? ` — ${Number(it.quantity).toLocaleString('fa-IR')} ${it.unit || ''}` : ''}
                        </span>
                    ))}
                </div>
            )}
            <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-400 dark:text-gray-500">
                    {inq.visibility === 'private' ? 'خصوصی — درخواست همکاری' : 'پیشنهاد قیمت برای همه'}
                </span>
                <span className="text-[11px] font-extrabold text-amber-700 dark:text-amber-400 flex items-center gap-1
                    group-hover:gap-1.5 transition-all">
                    مشاهده و پیشنهاد قیمت <ArrowLeft className="w-3.5 h-3.5" />
                </span>
            </div>
        </Link>
    );
}
