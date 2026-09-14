// app/home/Landing.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/lib/api/apiService';
import {
  Apple,
  ArrowDown,
  Eye,
  ArrowLeft,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Handshake,
  Link2,
  Megaphone,
  Milk,
  Package,
  Plus,
  ShoppingBasket,
  Store,
  Truck,
} from 'lucide-react';

/**
 * لندینگ دیمت — دو محصول جدا با دو لینک جدا:
 *   قرمز لاکی برند = کاتالوگ فروش (نمایش و تبلیغ)  |  کهربایی برند = صفحه درخواست خرید (استعلام و خرید)
 * لینک هر محصول زنجیرهٔ خودش را دارد:
 *   مهمان → /login?redirect=X (انتخاب کاربر حفظ می‌شود)  |  لاگین → مستقیم X
 *   X برای کاتالوگ فروش = فرم ساخت (/business/register)
 *   X برای صفحه درخواست خرید = فرم ساخت (/inquiries/new)
 * نکتهٔ مهم: لینک کاتالوگ فروش فقط به دست خریدارها می‌رسد و
 * لینک صفحه درخواست خرید فقط به دست تامین‌کننده‌ها — هرگز قاطی نمی‌شوند.
 */

/* ------------------------------ motion helper ----------------------------- */

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' as const },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
});

/* ------------------------------- mini painting ---------------------------- */

function MiniCatalog() {
  const rows = [
    { icon: Package, tint: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300', price: '۲۵٬۰۰۰' },
    { icon: Milk, tint: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300', price: '۱۸٬۵۰۰' },
    { icon: Apple, tint: 'bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300', price: '۹۸٬۰۰۰' },
  ];
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="w-40 rotate-2 rounded-2xl border-2 border-stone-200 bg-white p-3 shadow-xl shadow-stone-300/50
        dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/50 sm:w-48"
    >
      <div className="flex items-center gap-2 border-b border-dashed border-stone-200 pb-2 dark:border-gray-700">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-red-100 dark:bg-red-500/20">
          <Store className="size-3.5 text-red-700 dark:text-red-300" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="h-1.5 w-14 rounded-full bg-stone-300 dark:bg-gray-600" />
          <div className="h-1.5 w-9 rounded-full bg-stone-200 dark:bg-gray-700" />
        </div>
        <span className="shrink-0 rounded-full bg-brand-red px-2 py-0.5 text-[9px] font-bold text-white">
          کاتالوگ فروش
        </span>
      </div>
      <div className="mt-2 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${row.tint}`}>
              <row.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-1.5 w-full max-w-16 rounded-full bg-stone-300 dark:bg-gray-600" />
              <div className="h-1.5 w-10 rounded-full bg-stone-200 dark:bg-gray-700" />
            </div>
            <span
              className="shrink-0 rounded-md border border-red-200 bg-red-50 px-1.5 py-0.5 text-[10px] font-bold text-red-700
              dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
              {row.price}
            </span>
          </div>
        ))}
      </div>
      <div
        className="mt-2.5 flex items-center justify-center gap-1 rounded-lg border border-stone-100 bg-stone-50 px-2 py-1
        text-[9px] font-medium text-stone-400 dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-500">
        <Link2 className="size-3" />
        <span>daymat.ir/ali-store</span>
      </div>
    </motion.div>
  );
}

function MiniWall() {
  const notes = [
    { title: 'روغن ۱۶ لیتری', price: '۱٬۲۵۰٬۰۰۰', tint: 'bg-amber-100 border-amber-300 dark:bg-amber-500/15 dark:border-amber-500/40', done: true, rot: 'rotate-1' },
    { title: 'شیر ۲۴ تایی', price: '۸۵۰٬۰۰۰', tint: 'bg-orange-50 border-orange-300 dark:bg-orange-500/10 dark:border-orange-500/40', done: true, rot: '-rotate-1' },
    { title: 'پنیر ۴۰۰ گرمی', price: null, tint: 'bg-yellow-50 border-yellow-300 dark:bg-yellow-500/10 dark:border-yellow-500/40', done: false, rot: '-rotate-1' },
  ];
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="w-40 -rotate-2 rounded-2xl border-2 border-amber-200 bg-amber-50/80 p-3 shadow-xl shadow-amber-200/60
        dark:border-amber-500/40 dark:bg-amber-500/10 dark:shadow-black/50 sm:w-48"
    >
      <div className="flex items-center gap-2 border-b border-dashed border-amber-300 pb-2 dark:border-amber-500/40">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-amber-200 dark:bg-amber-500/25">
          <ClipboardList className="size-3.5 text-amber-800 dark:text-amber-300" />
        </span>
        <span className="text-[11px] font-bold text-stone-700 dark:text-gray-200">صفحه درخواست خرید من</span>
        <span className="ms-auto size-2.5 rounded-full bg-amber-400 ring-2 ring-amber-300 dark:ring-amber-500/30" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {notes.map((n, i) => (
          <div key={i} className={`rounded-lg border p-1.5 ${n.tint} ${n.rot}`}>
            <p className="text-[9px] font-bold leading-4 text-stone-700 dark:text-gray-200">{n.title}</p>
            {n.done ? (
              <>
                <span
                  className="mt-1 inline-block rounded bg-white/80 px-1 py-0.5 text-[9px] font-bold text-stone-800
                  dark:bg-gray-900/80 dark:text-gray-100">
                  {n.price}
                </span>
                <p className="mt-0.5 flex items-center gap-0.5 text-[8px] text-amber-600 dark:text-amber-400">
                  <CheckCircle2 className="size-2.5" /> قیمت داد
                </p>
              </>
            ) : (
              <p className="mt-1 text-[8px] font-medium text-stone-400 dark:text-gray-500">در انتظار قیمت…</p>
            )}
          </div>
        ))}
        <div
          className="grid place-items-center rounded-lg border-2 border-dashed border-stone-300 bg-white/60 p-1.5 text-center
          dark:border-gray-600 dark:bg-gray-900/60">
          <span className="flex items-center gap-0.5 text-[8px] font-bold text-stone-500 dark:text-gray-400">
            <Plus className="size-2.5" /> پیشنهادت رو بذار
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* --------------------------------- pieces --------------------------------- */

const TONES = {
  red: {
    chip: 'border-brand-red-tint bg-brand-red-soft text-brand-red',
    stepNum: 'bg-brand-red text-white',
    stepLine: 'border-brand-red-tint',
    audience: 'border-brand-red-tint bg-brand-red-soft text-brand-red',
    headerBg: 'bg-brand-red-soft/50',
    button: 'bg-brand-red text-white hover:bg-brand-red-strong shadow-lg shadow-brand-red/25',
  },
  amber: {
    chip: 'border-brand-amber-tint bg-brand-amber-soft text-amber-800 dark:text-amber-300',
    stepNum: 'bg-brand-amber text-white',
    stepLine: 'border-brand-amber-tint',
    audience: 'border-brand-amber-tint bg-brand-amber-soft text-amber-800 dark:text-amber-300',
    headerBg: 'bg-brand-amber-soft/60',
    button: 'bg-brand-amber text-white hover:bg-brand-amber-strong shadow-lg shadow-brand-amber/30',
  },
} as const;

type Tone = keyof typeof TONES;

const FA_DIGITS = ['۱', '۲', '۳'];

interface Step {
  title: string;
  desc: string;
}

function ProductCard({
  id,
  tone,
  icon: Icon,
  chip,
  title,
  desc,
  illustration,
  steps,
  audience,
  cta,
  href,
}: {
  id: string;
  tone: Tone;
  icon: React.ElementType;
  chip: string;
  title: string;
  desc: string;
  illustration: React.ReactNode;
  steps: Step[];
  audience: string[];
  cta: string;
  href: string;
}) {
  const t = TONES[tone];
  return (
    <motion.article
      {...fadeUp()}
      id={id}
      className="flex scroll-mt-24 flex-col overflow-hidden rounded-[2rem] border-2 border-stone-200 bg-white shadow-lg shadow-stone-200/60
        dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30"
    >
      {/* header + illustration */}
      <div className={`flex flex-col items-center px-6 pb-2 pt-8 text-center ${t.headerBg}`}>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${t.chip}`}>
          <Icon className="size-3.5" />
          {chip}
        </span>
        <h3 className="mt-3 text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">{title}</h3>
        <p className="mt-2 max-w-sm leading-7 text-stone-600 dark:text-gray-400">{desc}</p>
        <div className="mt-5">{illustration}</div>
      </div>

      {/* steps */}
      <div className="flex-1 px-6 py-6 sm:px-8">
        <ol className="space-y-5">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-black ${t.stepNum}`}>
                  {FA_DIGITS[i]}
                </span>
                {i < steps.length - 1 && (
                  <span aria-hidden className={`mt-1 w-0 flex-1 border-r-2 border-dashed ${t.stepLine}`} />
                )}
              </div>
              <div className="pb-1 text-start">
                <h4 className="font-extrabold text-stone-800 dark:text-gray-200">{s.title}</h4>
                <p className="mt-1 text-sm leading-6 text-stone-600 dark:text-gray-400">{s.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* footer */}
      <div className="border-t border-dashed border-stone-200 px-6 py-5 dark:border-gray-800 sm:px-8">
        <p className="text-xs font-bold text-stone-500 dark:text-gray-500">مناسب برای:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {audience.map((a) => (
            <span key={a} className={`rounded-full border px-3 py-1 text-xs font-bold ${t.audience}`}>
              {a}
            </span>
          ))}
        </div>
        <Link
          href={href}
          className={`mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full text-base font-extrabold transition-colors ${t.button}`}>
          <Icon className="size-4" />
          {cta}
        </Link>
      </div>
    </motion.article>
  );
}

/* ------------------------------ live از روت ------------------------------- */

/** سکشن زندهٔ روت: کاتالوگ‌های فروش نمونه + صفحه‌های خرید باز — دو جدول جدا، دو محصول جدا */
function LiveFromDaymat({ purchaseHref }: { purchaseHref: string }) {
  const { data: featured } = useQuery({
    queryKey: ['landing', 'featured-catalogs'],
    queryFn: () => apiService.catalog.getFeatured(4),
    staleTime: 60 * 1000,
  });

  const catalogs = (featured?.items ?? []).slice(0, 4);

  if (!catalogs.length) return null;

  return (
    <section aria-label="همین حالا توی دیمت" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
        <span className="text-sm font-black text-stone-400 dark:text-gray-500">همین حالا توی دیمت</span>
        <h2 className="mt-2 text-3xl font-black sm:text-4xl">کاتالوگ‌های فروش، زنده</h2>
        <p className="mt-4 leading-8 text-stone-600 dark:text-gray-400">
          قیمت‌های واقعی فروشنده‌ها همین حالا روی تابلوی دیمت است — و صفحه درخواست خرید هم چند دقیقه بیشتر نمی‌برد.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* کاتالوگ‌های فروش نمونه */}
        {catalogs.length > 0 && (
          <motion.div {...fadeUp(0.1)}
            className="rounded-3xl border-2 border-brand-red-tint bg-white p-6 shadow-sm dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black text-brand-red">
                <Store className="size-5" /> کاتالوگ‌های فروش
              </h3>
            </div>
            <ul className="mt-4 space-y-2">
              {catalogs.map((c: any, i: number) => (
                <motion.li key={c.id ?? i} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                  <Link href={`/${c.slug || c.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-stone-100 px-3 py-2.5 transition-colors hover:border-brand-red-tint hover:bg-brand-red-soft/50
                    dark:border-gray-800 dark:hover:bg-gray-800/60">
                    {c.logoUrl ? (
                      <Image src={c.logoUrl} alt="" width={36} height={36} className="size-9 rounded-xl object-cover" unoptimized />
                    ) : (
                      <span className="grid size-9 place-items-center rounded-xl bg-brand-red-soft text-brand-red">
                        <Store className="size-4" />
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-extrabold text-stone-800 dark:text-gray-200">{c.name}</span>
                      {c.city ? <span className="block text-[11px] text-stone-400 dark:text-gray-500">{c.city}</span> : null}
                    </span>
                    <Eye className="size-4 shrink-0 text-stone-300 dark:text-gray-600" />
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* صفحه درخواست خرید — CTA ساخت */}
        <motion.div {...fadeUp(0.2)}
          className="flex flex-col justify-center rounded-3xl border-2 border-brand-amber-tint bg-white p-6 shadow-sm dark:bg-gray-900">
          <h3 className="flex items-center gap-2 text-lg font-black text-amber-600 dark:text-amber-400">
            <ClipboardList className="size-5" /> صفحه درخواست خرید
          </h3>
          <p className="mt-3 text-sm font-bold leading-7 text-stone-500 dark:text-gray-400">
            لیست خریدت را بنویس — تامین‌کننده‌ها اعلام خریدهایت را می‌بینند و قیمت می‌دهند؛
            تو بهترینش را انتخاب می‌کنی.
          </p>
          <Link href={purchaseHref}
            className="mt-4 flex h-10 items-center justify-center gap-1.5 rounded-full bg-brand-amber text-xs font-extrabold text-white shadow-md shadow-brand-amber/25 transition-colors hover:bg-brand-amber-strong">
            بساز +
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

/* --------------------------------- landing -------------------------------- */

export default function Landing() {
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);

  // ✅ زنجیرهٔ انتخاب ابزار: مهمان → login با redirect (انتخاب حفظ می‌شود) | لاگین → مستقیم
  const toolHref = (path: string) =>
    isAuthenticated ? path : `/login?redirect=${encodeURIComponent(path)}`;
  const catalogHref = toolHref('/business/register'); // کاتالوگ فروش — فرم ساخت
  const purchaseHref = toolHref('/inquiries/new');    // صفحه درخواست خرید — فرم ساخت (محصول مستقل)

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-stone-900 dark:bg-gray-950 dark:text-gray-100">
      <style>{`
        .bg-dots { background-image: radial-gradient(circle, rgba(28,25,23,0.05) 1px, transparent 1px); background-size: 22px 22px; }
        .dark .bg-dots { background-image: radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px); }
      `}</style>

      <div className="bg-dots flex min-h-screen flex-col">
        {/* ------------------------------ header ------------------------------ */}
        <header
          className="sticky top-0 z-50 border-b border-stone-200/80 bg-[#FFFDF7]/85 backdrop-blur-md
          dark:border-gray-800 dark:bg-gray-950/85">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2.5" aria-label="دیمت — صفحه‌ی اصلی">
              <Image src="/images/logo3.png" alt="دیمت" width={104} height={36}
                     className="h-9 w-auto object-contain" unoptimized priority />
            </Link>
            {isAuthenticated ? (
              <Link href="/my-catalogs"
                    className="rounded-full bg-stone-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-stone-700
                    dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white">
                پنل من
              </Link>
            ) : (
              <Link href="/login"
                    className="rounded-full border border-stone-300 px-4 py-2 text-xs font-bold text-stone-700 transition-colors
                    hover:border-stone-900 dark:border-gray-600 dark:text-gray-200 dark:hover:border-gray-300">
                ورود | عضویت
              </Link>
            )}
          </div>
        </header>

        <main id="top" className="flex-1">
          {/* ------------------------------- hero ------------------------------ */}
          <section aria-label="معرفی" className="relative overflow-hidden">
            <div className="mx-auto max-w-6xl px-4 pb-12 pt-14 text-center sm:px-6 sm:pt-20">
              <motion.span
                {...fadeUp()}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs font-bold text-stone-600 shadow-sm
                dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                برای همه‌ی بازار — کالا و خدمات
              </motion.span>

              <motion.h1
                {...fadeUp(0.1)}
                className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-[1.35] sm:text-5xl md:text-6xl md:leading-[1.3]">
                هر کسی توی بازار،{' '}
                <span className="text-brand-red">هم می‌فروشه</span>،{' '}
                <span className="text-brand-amber">هم می‌خره</span>
              </motion.h1>

              <motion.p
                {...fadeUp(0.2)}
                className="mx-auto mt-5 max-w-2xl text-base leading-8 text-stone-600 dark:text-gray-400 sm:text-lg">
                پس دو تا محصول ساده ساخته‌ایم: «کاتالوگ فروش» برای نمایش و تبلیغ چیزی که می‌فروشی،
                و «صفحه درخواست خرید» برای استعلام قیمت چیزی که می‌خری. هر کدام یک لینک جداست؛
                با چند کلیک بساز و فقط لینکِ همان را بین همان آدم‌ها پخش کن.
              </motion.p>

              <motion.div {...fadeUp(0.3)} className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#catalog"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-brand-red px-7 text-base font-extrabold text-white shadow-lg shadow-brand-red/25 transition-colors hover:bg-brand-red-strong">
                  می‌خوام بفروشم
                  <ArrowDown className="size-4" />
                </a>
                <a
                  href="#inquiry"
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-brand-amber px-7 text-base font-extrabold text-white shadow-lg shadow-brand-amber/30 transition-colors hover:bg-brand-amber-strong">
                  می‌خوام بخرم
                  <ArrowDown className="size-4" />
                </a>
              </motion.div>

              {/* دو محصول مستقل — بدون خط اتصال؛ هر کدام یک لینک جدا دارند */}
              <motion.div
                {...fadeUp(0.4)}
                className="mx-auto mt-16 flex max-w-3xl flex-col items-center gap-7 sm:flex-row sm:justify-center sm:gap-12">
                <div className="flex flex-col items-center gap-3">
                  <MiniCatalog />
                  <span
                    className="rounded-full border border-brand-red-tint bg-white px-3 py-1 text-[10px] font-bold text-brand-red shadow-sm
                    dark:bg-gray-900 sm:text-xs">
                    کاتالوگ فروش — لینکش مالِ خریدارها
                  </span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <MiniWall />
                  <span
                    className="rounded-full border border-brand-amber-tint bg-white px-3 py-1 text-[10px] font-bold text-amber-700 shadow-sm
                    dark:bg-gray-900 dark:text-amber-300 sm:text-xs">
                    صفحه درخواست خرید — لینکش مالِ تامین‌کننده‌ها
                  </span>
                </div>
              </motion.div>
            </div>
          </section>

          {/* ----------------------------- products ---------------------------- */}
          <section aria-label="دو ابزار" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-black text-stone-400 dark:text-gray-500">دو محصول جدا</span>
              <h2 className="mt-2 text-3xl font-black leading-snug sm:text-4xl">
                برای فروشت <span className="text-brand-red">کاتالوگ فروش</span>، برای خریدت{' '}
                <span className="text-brand-amber">صفحه درخواست خرید</span>
              </h2>
              <p className="mt-4 leading-8 text-stone-600 dark:text-gray-400">
                هر کدام چند دقیقه‌ای ساخته می‌شود و یک لینک ساده تحویل می‌دهد؛
                هر لینک هم فقط به مسیر خودش می‌رود — کاتالوگ فروش پیش خریدارها، صفحه درخواست خرید پیش تامین‌کننده‌ها.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
              <ProductCard
                id="catalog"
                tone="red"
                icon={Store}
                chip="نمایش و تبلیغ کالا و خدمات"
                title="ساخت کاتالوگ فروش"
                desc="چیزهایی که می‌فروشی رو قشنگ نشون بده، قیمت رو کنارشون بذار و لینک کاتالوگ فروشت رو بده دست خریدارها."
                illustration={<MiniCatalog />}
                steps={[
                  {
                    title: 'کاتالوگت رو بساز',
                    desc: 'عکس، اسم و قیمت کالاها یا خدماتت رو اضافه کن؛ به سادگی ساختن یک پست اینستاگرامی.',
                  },
                  {
                    title: 'لینکش رو پخش کن',
                    desc: 'کاتالوگ می‌شه یک لینک ساده؛ بذارش تو استوری، بفرستش تو واتساپ و تلگرام، هر جا که خریدار هست.',
                  },
                  {
                    title: 'سفارش بگیر',
                    desc: 'خریدارها هر وقت لازم داشتن، قیمت‌ها رو می‌بینن و مستقیم با خودت در تماسن.',
                  },
                ]}
                audience={['فروشگاه‌ها', 'شرکت‌های پخش', 'تولیدی‌ها', 'خدمات']}
                cta="کاتالوگ فروش بساز"
                href={catalogHref}
              />

              <ProductCard
                id="inquiry"
                tone="amber"
                icon={ClipboardList}
                chip="استعلام قیمت خرید"
                title="ساخت صفحه درخواست خرید"
                desc="لیست چیزهایی که می‌خری رو بنویس، لینک صفحه درخواست خریدت رو بده تامین‌کننده‌ها؛ اون‌ها قیمت بدن، تو بهترین رو انتخاب کن."
                illustration={<MiniWall />}
                steps={[
                  {
                    title: 'لیست خریدت رو بنویس',
                    desc: 'بنویس چی می‌خوای، چندتا و با چه شرایطی؛ از لیست هفتگی سوپرمارکت تا قطعهٔ صنعتی با مشخصات فنی.',
                  },
                  {
                    title: 'لینکش رو بده تامین‌کننده‌ها',
                    desc: 'فقط همین لینک صفحه درخواست خرید پخش می‌شه؛ کاتالوگ فروشت اصلاً درگیر این ماجرا نیست.',
                  },
                  {
                    title: 'بهترین قیمت رو انتخاب کن',
                    desc: 'پیشنهاد قیمت‌ها و شرایط رو کنار هم ببین و با هر کی به‌صرفه‌تر بود معامله کن.',
                  },
                ]}
                audience={['سوپرمارکت‌ها', 'کارخانه‌ها', 'پروژه‌ها', 'خدمات']}
                cta="صفحه درخواست خرید بساز"
                href={purchaseHref}
              />
            </div>
          </section>

          {/* ----------------------- network: خرید ↔ فروش ----------------------- */}
          <section aria-label="شبکهٔ خرید و فروش" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-black text-stone-400 dark:text-gray-500">فقط یه کاتالوگ ساده نیست</span>
              <h2 className="mt-2 text-3xl font-black leading-snug sm:text-4xl">
                کاتالوگ‌ها به هم{' '}
                <span className="text-brand-red">وصل</span> می‌شن
              </h2>
              <p className="mt-4 leading-8 text-stone-600 dark:text-gray-400">
                خریدار تامین‌کننده‌هاش را از روی کاتالوگ فروششان به صفحه درخواست خریدش اضافه می‌کند؛
                هر وقت چیزی فوری لازم داشت، اعلام خریدش مستقیم دست همان‌ها می‌رسد.
              </p>
            </motion.div>

            <div className="mx-auto mt-10 max-w-4xl space-y-3">
              {[
                {
                  icon: Megaphone,
                  tone: 'amber' as const,
                  title: 'خریدار اعلام می‌کند',
                  desc: 'قلم را می‌نویسی، تیک «اعلام خرید» را می‌زنی — بالای کاتالوگت می‌نشیند.',
                },
                {
                  icon: BellRing,
                  tone: 'red' as const,
                  title: 'تامین‌کنندهٔ تاییدشده فوری می‌فهمد',
                  desc: 'اعلام خرید در تب «درخواست خریدها»ی پنل فروشش می‌آید و اعلان می‌گیرد.',
                },
                {
                  icon: Handshake,
                  tone: 'amber' as const,
                  title: 'قیمت‌ها همان‌جا رد و بدل می‌شود',
                  desc: 'روی هر قلم قیمت می‌دهی؛ خریدار پیشنهادها را کنار هم می‌بیند و انتخاب می‌کند.',
                },
              ].map((s, i) => (
                <motion.div
                  key={s.title}
                  {...fadeUp(0.05 * (i + 1))}
                  className={`flex items-center gap-4 rounded-2xl border-2 p-4 sm:p-5 ${
                    s.tone === 'amber'
                      ? 'border-brand-amber-tint bg-brand-amber-soft/40 dark:bg-amber-500/5'
                      : 'border-brand-red-tint bg-brand-red-soft/40 dark:bg-red-500/5'
                  }`}
                >
                  <span
                    className={`grid size-11 shrink-0 place-items-center rounded-xl ${
                      s.tone === 'amber'
                        ? 'bg-brand-amber text-white'
                        : 'bg-brand-red text-white'
                    }`}
                  >
                    <s.icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[15px] font-black text-stone-900 dark:text-gray-100">{s.title}</p>
                    <p className="mt-0.5 text-[12px] font-bold leading-6 text-stone-500 dark:text-gray-400">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* ----------------------------- examples ---------------------------- */}
          <section aria-label="مثال‌ها" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-black sm:text-4xl">از کجا شروع کنی؟</h2>
              <p className="mt-4 leading-8 text-stone-600 dark:text-gray-400">
                از همون‌جا شروع کن که به دردت می‌خوره؛ اون یکی هم هر وقت لازم شد، سر جاشه.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {/* شرکت پخش */}
              <motion.div
                {...fadeUp(0.1)}
                className="rounded-3xl border-2 border-stone-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-11 place-items-center rounded-2xl bg-stone-900 text-white dark:bg-gray-100 dark:text-gray-900">
                    <Truck className="size-5" />
                  </span>
                  <h3 className="text-xl font-black">شرکت پخش</h3>
                </div>
                <div className="mt-6 space-y-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full bg-brand-red-soft px-3 py-1 text-xs font-black text-brand-red">
                        شروع با کاتالوگ فروش
                      </span>
                      <ArrowLeft aria-hidden className="size-4 text-stone-400 dark:text-gray-600" />
                      <span
                        className="rounded-full border-2 border-dashed border-brand-amber-tint px-3 py-1 text-xs font-bold text-amber-700
                        dark:text-amber-300">
                        بعداً: صفحه درخواست خرید
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-stone-600 dark:text-gray-400">
                      کالاهاش رو قشنگ نشون می‌ده و لینک کاتالوگ فروشش رو می‌فرسته برای مغازه‌دارها — فقط همین لینک.
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full bg-brand-amber-soft px-3 py-1 text-xs font-black text-amber-800 dark:text-amber-300">
                        برای خرید عمده
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-stone-600 dark:text-gray-400">
                      هر وقت خواست جنس عمده بخره، یه صفحه درخواست خرید جدا می‌سازه و فقط لینک همون رو می‌ده دست کارخونه‌ها.
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* سوپرمارکت */}
              <motion.div
                {...fadeUp(0.2)}
                className="rounded-3xl border-2 border-stone-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
                <div className="flex items-center gap-3">
                  <span
                    className="grid size-11 place-items-center rounded-2xl bg-stone-900 text-white dark:bg-gray-100 dark:text-gray-900">
                    <ShoppingBasket className="size-5" />
                  </span>
                  <h3 className="text-xl font-black">سوپرمارکت</h3>
                </div>
                <div className="mt-6 space-y-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full bg-brand-amber-soft px-3 py-1 text-xs font-black text-amber-800 dark:text-amber-300">
                        شروع با صفحه درخواست خرید
                      </span>
                      <ArrowLeft aria-hidden className="size-4 text-stone-400 dark:text-gray-600" />
                      <span
                        className="rounded-full border-2 border-dashed border-brand-red-tint px-3 py-1 text-xs font-bold text-brand-red">
                        بعداً: کاتالوگ فروش
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-stone-600 dark:text-gray-400">
                      برای جنس‌های عمده‌ش لیست خرید می‌سازه، لینکش رو به کارخونه‌ها می‌ده و از همه قیمت می‌گیره.
                    </p>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="rounded-full bg-brand-red-soft px-3 py-1 text-xs font-black text-brand-red">
                        برای نمایش کالا
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-7 text-stone-600 dark:text-gray-400">
                      هر وقت خواست، کاتالوگ فروش جدا می‌سازه و کالاهاش رو برای مشتری‌های محله نشون می‌ده.
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* punchline */}
            <motion.div
              {...fadeUp(0.25)}
              className="mt-8 flex flex-col items-center gap-2 rounded-3xl bg-stone-900 px-6 py-7 text-center text-white shadow-xl dark:bg-gray-800 sm:flex-row sm:justify-center sm:gap-4">
              <Handshake className="size-7 shrink-0 text-amber-400" />
              <p className="text-base font-bold leading-8 sm:text-lg">
                از کدوم شروع کنی فرقی نمی‌کنه؛ هر وقت دومی رو خواستی با چند کلیک می‌سازی‌ش.
                موقع فرستادن لینک هم هیچ‌وقت قاطی نمی‌شن — هر لینک فقط به مسیر خودش می‌ره.
              </p>
            </motion.div>
          </section>

          {/* -------------------------- live از روت دیمت ------------------------- */}
          <LiveFromDaymat purchaseHref={purchaseHref} />

          {/* ------------------------------ final CTA --------------------------- */}
          <section id="start" aria-label="شروع" className="mx-auto max-w-4xl scroll-mt-24 px-4 pb-20 pt-12 sm:px-6">
            <motion.div
              {...fadeUp()}
              className="relative overflow-hidden rounded-[2.5rem] border-2 border-stone-200 bg-white px-6 py-12 text-center shadow-xl shadow-stone-200/70
              dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/40 sm:px-12">
              <div aria-hidden className="absolute -right-16 -top-16 size-48 rounded-full bg-brand-red-soft blur-2xl" />
              <div aria-hidden className="absolute -bottom-16 -left-16 size-48 rounded-full bg-brand-amber-soft blur-2xl" />
              <div className="relative">
                <h2 className="text-3xl font-black sm:text-4xl">همین حالا اولین کاتالوگت رو بساز</h2>
                <p className="mx-auto mt-4 max-w-xl leading-8 text-stone-600 dark:text-gray-400">
                  چند دقیقه وقت بذار، محصولت رو بساز و فقط لینکش رو پخش کن؛
                  ساده مثل ساختن یک پست.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={catalogHref}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-brand-red px-7 text-base font-extrabold text-white shadow-lg shadow-brand-red/25 transition-colors hover:bg-brand-red-strong">
                    <Store className="size-4" />
                    ساخت کاتالوگ فروش
                  </Link>
                  <Link
                    href={purchaseHref}
                    className="inline-flex h-12 items-center gap-2 rounded-full bg-brand-amber px-7 text-base font-extrabold text-white shadow-lg shadow-brand-amber/30 transition-colors hover:bg-brand-amber-strong">
                    <ClipboardList className="size-4" />
                    ساخت صفحه درخواست خرید
                  </Link>
                </div>
                <p className="mt-5 text-xs font-medium text-stone-400 dark:text-gray-500">
                  بدون آموزش — هر وقت دومی رو خواستی، اونم می‌سازی.
                </p>
              </div>
            </motion.div>
          </section>
        </main>

        {/* ------------------------------- footer ------------------------------ */}
        <footer className="mt-auto border-t border-stone-200 bg-[#FFFDF7] dark:border-gray-800 dark:bg-gray-950">
          <div
            className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">
            <div className="flex items-center gap-2.5">
              <Image src="/images/logo3.png" alt="دیمت" width={80} height={28} className="h-7 w-auto object-contain" unoptimized />
              <span className="hidden text-sm text-stone-400 dark:text-gray-500 sm:inline">— فروش با کاتالوگ فروش، خرید با صفحه درخواست خرید</span>
            </div>
            <nav className="flex items-center gap-4 text-xs font-bold text-stone-500 dark:text-gray-400">
              <Link href="/docs/about" className="hover:text-brand-red">درباره ما</Link>
              <Link href="/docs/terms" className="hover:text-brand-red">قوانین</Link>
              <Link href="/feedback" className="hover:text-brand-red">پیشنهادات</Link>
            </nav>
            <p className="text-xs text-stone-400 dark:text-gray-500">هر کسی توی بازار هم فروشنده‌ست، هم خریدار © ۱۴۰۵</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
