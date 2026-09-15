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
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Eye,
  Handshake,
  Link2,
  Milk,
  Package,
  Plus,
  Rocket,
  Scissors,
  ShoppingBasket,
  Store,
  Truck,
  UtensilsCrossed,
  Users,
} from 'lucide-react';

/**
 * لندینگ دیمت — نسخهٔ لطیف و انیمیشنال، حالا با سیستم رنگ سه‌نقشی برند:
 *   سبز (primary) → کاتالوگ قیمت / بازوی فروش — آبی (contrast) → بازوی خرید — زرد فقط تاکید.
 *
 * ساختار:
 *   هدر ثابت (fixed) → هیرو دو-قطبی با نقاشی مینی → تک‌دکمهٔ «شروع کن» →
 *   دو کارت مزایا → شبکهٔ همکار فروش/خرید → «از کجا شروع کنی؟» → نمونهٔ زنده → شعار پایانی.
 *
 * تک‌دروازه و تک‌دکمه: تنها یک دکمه در کل صفحه — «شروع کن».
 * باکس‌ها و کارت‌ها فقط توضیح می‌دهند؛ هیچ‌کدام دکمهٔ جدا ندارند.
 *
 * مهمان → /login?redirect=/business/register | لاگین → /business/register
 * بعد از ثبت کسب‌وکار، بر اساس نوع فعالیت (firstCatalog در data-types) پیشنهاد می‌دهیم
 * اول کدام بازو را بسازد — «پیشنهاد» است نه اجبار؛ هر دو بازو همیشه باز.
 */

/* ------------------------------ motion helper ----------------------------- */

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' as const },
  transition: { duration: 0.6, delay, ease: 'easeOut' as const },
});

/* ------------------------------ mini painting ---------------------------- */

function MiniCatalog() {
  const rows = [
    { icon: Package, price: '۲۵٬۰۰۰' },
    { icon: Milk, price: '۱۸٬۵۰۰' },
    { icon: Apple, price: '۹۸٬۰۰۰' },
  ];
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="w-40 rotate-2 rounded-2xl border-2 border-brand-primary-tint bg-white p-3 shadow-lg shadow-stone-200/70
        dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/50 sm:w-44"
    >
      <div className="flex items-center gap-2 border-b border-dashed border-stone-200 pb-2 dark:border-gray-700">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-primary-soft dark:bg-brand-primary/15">
          <Store className="size-3.5 text-brand-primary-strong dark:text-brand-primary" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="h-1.5 w-14 rounded-full bg-stone-300 dark:bg-gray-600" />
          <div className="h-1.5 w-9 rounded-full bg-stone-200 dark:bg-gray-700" />
        </div>
        <span className="shrink-0 rounded-full bg-brand-primary px-2 py-0.5 text-[9px] font-bold text-white">
          کاتالوگ قیمت
        </span>
      </div>
      <div className="mt-2 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-primary-soft text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary">
              <row.icon className="size-4" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="h-1.5 w-full max-w-16 rounded-full bg-stone-300 dark:bg-gray-600" />
              <div className="h-1.5 w-10 rounded-full bg-stone-200 dark:bg-gray-700" />
            </div>
            <span className="shrink-0 rounded-md border border-brand-primary-tint bg-brand-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-brand-primary-strong dark:border-brand-primary/30 dark:bg-brand-primary/10 dark:text-brand-primary">
              {row.price}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 flex items-center justify-center gap-1 rounded-lg border border-stone-100 bg-stone-50 px-2 py-1
        text-[9px] font-medium text-stone-400 dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-500">
        <Link2 className="size-3" />
        <span>daymat.ir/ali-store</span>
      </div>
    </motion.div>
  );
}

function MiniWall() {
  const notes = [
    { title: 'روغن ۱۶ لیتری', price: '۱٬۲۵۰٬۰۰۰', done: true, rot: 'rotate-1' },
    { title: 'شیر ۲۴ تایی', price: '۸۵۰٬۰۰۰', done: true, rot: '-rotate-1' },
    { title: 'پنیر ۴۰۰ گرمی', price: null, done: false, rot: '-rotate-1' },
  ];
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="w-40 -rotate-2 rounded-2xl border-2 border-brand-contrast-tint bg-white p-3 shadow-lg shadow-stone-200/70
        dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/50 sm:w-44"
    >
      <div className="flex items-center gap-2 border-b border-dashed border-stone-200 pb-2 dark:border-gray-700">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-contrast-soft dark:bg-brand-contrast/15">
          <ClipboardList className="size-3.5 text-brand-contrast-strong dark:text-brand-contrast" />
        </span>
        <span className="text-[11px] font-bold text-stone-700 dark:text-gray-200">بازوی خرید من</span>
        <span className="ms-auto size-2.5 rounded-full bg-brand-contrast ring-2 ring-brand-contrast-tint dark:ring-brand-contrast/30" />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {notes.map((n, i) => (
          <div key={i}
            className={`rounded-lg border border-brand-contrast-tint bg-brand-contrast-soft p-1.5 dark:border-brand-contrast/30 dark:bg-brand-contrast/10 ${n.rot}`}>
            <p className="text-[9px] font-bold leading-4 text-stone-700 dark:text-gray-200">{n.title}</p>
            {n.done ? (
              <>
                <span className="mt-1 inline-block rounded bg-white/80 px-1 py-0.5 text-[9px] font-bold text-stone-800 dark:bg-gray-900/80 dark:text-gray-100">
                  {n.price}
                </span>
                <p className="mt-0.5 flex items-center gap-0.5 text-[8px] font-medium text-brand-contrast-strong dark:text-brand-contrast">
                  <CheckCircle2 className="size-2.5" /> قیمت داد
                </p>
              </>
            ) : (
              <p className="mt-1 text-[8px] font-medium text-stone-400 dark:text-gray-500">در انتظار قیمت…</p>
            )}
          </div>
        ))}
        <div className="grid place-items-center rounded-lg border-2 border-dashed border-stone-300 bg-white/60 p-1.5 text-center
          dark:border-gray-600 dark:bg-gray-900/60">
          <span className="flex items-center gap-0.5 text-[8px] font-bold text-stone-500 dark:text-gray-400">
            <Plus className="size-2.5" /> پیشنهادت رو بذار
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* --------------------------------- tones ---------------------------------- */

/** دو نقطهٔ رنگی برند: سبز برای کاتالوگ قیمت (فروش)، آبی برای بازوی خرید */
const TONES = {
  primary: {
    chip: 'border-brand-primary-tint bg-brand-primary-soft text-brand-primary-strong dark:border-brand-primary/25 dark:bg-brand-primary/15 dark:text-brand-primary',
    bullet: 'text-brand-primary-strong dark:text-brand-primary',
    audience: 'border-brand-primary-tint bg-brand-primary-soft text-brand-primary-strong dark:border-brand-primary/25 dark:bg-brand-primary/15 dark:text-brand-primary',
    headerBg: 'bg-brand-primary-soft/50 dark:bg-brand-primary/5',
    heroCard: 'border-brand-primary-tint bg-brand-primary-soft/40 dark:border-brand-primary/25 dark:bg-brand-primary/5',
    pickCard: 'border-brand-primary-tint bg-brand-primary-soft/40 dark:border-brand-primary/25 dark:bg-brand-primary/5',
    pickIcon: 'bg-brand-primary text-white',
    accentText: 'text-brand-primary-strong dark:text-brand-primary',
  },
  contrast: {
    chip: 'border-brand-contrast-tint bg-brand-contrast-soft text-brand-contrast-strong dark:border-brand-contrast/25 dark:bg-brand-contrast/15 dark:text-brand-contrast',
    bullet: 'text-brand-contrast-strong dark:text-brand-contrast',
    audience: 'border-brand-contrast-tint bg-brand-contrast-soft text-brand-contrast-strong dark:border-brand-contrast/25 dark:bg-brand-contrast/15 dark:text-brand-contrast',
    headerBg: 'bg-brand-contrast-soft/60 dark:bg-brand-contrast/5',
    heroCard: 'border-brand-contrast-tint bg-brand-contrast-soft/50 dark:border-brand-contrast/25 dark:bg-brand-contrast/5',
    pickCard: 'border-brand-contrast-tint bg-brand-contrast-soft/50 dark:border-brand-contrast/25 dark:bg-brand-contrast/5',
    pickIcon: 'bg-brand-contrast text-white',
    accentText: 'text-brand-contrast-strong dark:text-brand-contrast',
  },
} as const;

type Tone = keyof typeof TONES;

/* -------------------------------- hero box -------------------------------- */

/** باکس قطبی هیرو — یک سمتِ بازار: فروش (کاتالوگ قیمت) یا خرید (بازوی خرید)؛ فقط توضیح، بدون دکمه */
function HeroBox({
  tone,
  icon: Icon,
  chip,
  title,
  question,
  body,
  illustration,
  delay = 0,
}: {
  tone: Tone;
  icon: React.ElementType;
  chip: string;
  title: string;
  question: string;
  body: string;
  illustration: React.ReactNode;
  delay?: number;
}) {
  const t = TONES[tone];
  return (
    <motion.div
      {...fadeUp(delay)}
      className={`flex flex-1 flex-col items-center rounded-[2rem] border-2 px-5 pb-7 pt-8 text-center shadow-lg shadow-stone-200/60
      dark:shadow-black/30 sm:px-7 ${t.heroCard}`}
    >
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${t.chip}`}>
        <Icon className="size-3.5" />
        {chip}
      </span>
      <h2 className="mt-3 text-3xl font-black text-stone-900 dark:text-gray-100 sm:text-4xl">{title}</h2>
      <p className={`mt-3 text-lg font-black sm:text-xl ${t.accentText}`}>{question}</p>
      <p className="mt-2 max-w-xs text-sm font-bold leading-7 text-stone-600 dark:text-gray-400">{body}</p>
      <div className="mt-6">{illustration}</div>
    </motion.div>
  );
}

/* ------------------------------ product card ------------------------------ */

/** کارت مزایا — چیپ + توضیح + ۳ بولت + مخاطب؛ بدون دکمه — تنها دکمهٔ صفحه بالای صفحه است */
function ProductCard({
  id,
  tone,
  icon: Icon,
  chip,
  title,
  desc,
  bullets,
  audience,
}: {
  id: string;
  tone: Tone;
  icon: React.ElementType;
  chip: string;
  title: string;
  desc: string;
  bullets: string[];
  audience: string[];
}) {
  const t = TONES[tone];
  return (
    <motion.article
      {...fadeUp()}
      id={id}
      className="flex scroll-mt-24 flex-col overflow-hidden rounded-[2rem] border-2 border-stone-200 bg-white shadow-lg shadow-stone-200/60
        dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/30"
    >
      {/* header */}
      <div className={`px-6 pb-5 pt-7 text-center sm:px-8 ${t.headerBg}`}>
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${t.chip}`}>
          <Icon className="size-3.5" />
          {chip}
        </span>
        <h3 className="mt-3 text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">{title}</h3>
        <p className="mt-2 mx-auto max-w-sm leading-7 text-stone-600 dark:text-gray-400">{desc}</p>
      </div>

      {/* bullets */}
      <div className="flex-1 px-6 py-6 sm:px-8">
        <ul className="space-y-3">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <CheckCircle2 className={`mt-0.5 size-5 shrink-0 ${t.bullet}`} />
              <p className="text-sm font-bold leading-7 text-stone-600 dark:text-gray-300">{b}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* مناسب برای */}
      <div className="border-t border-dashed border-stone-200 px-6 py-5 dark:border-gray-800 sm:px-8">
        <p className="text-xs font-bold text-stone-500 dark:text-gray-500">مناسب برای:</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {audience.map((a) => (
            <span key={a} className={`rounded-full border px-3 py-1 text-xs font-bold ${t.audience}`}>
              {a}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

/* ------------------------------- start pick ------------------------------- */

/** چیپ فشردهٔ «از کجا شروع کنی؟» — یک کسب‌وکار + بازوی پیشنهادی‌اش */
function StartPick({
  icon: Icon,
  title,
  tone,
  tool,
}: {
  icon: React.ElementType;
  title: string;
  tone: Tone;
  tool: string;
}) {
  const t = TONES[tone];
  return (
    <motion.div
      {...fadeUp(0.05)}
      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 ${t.pickCard}`}
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${t.pickIcon}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-black text-stone-800 dark:text-gray-100">{title}</p>
        <p className={`mt-0.5 flex items-center gap-1 text-xs font-bold ${t.accentText}`}>
          <ArrowLeft className="size-3" />
          {tool}
        </p>
      </div>
    </motion.div>
  );
}

/* ------------------------------ live از روت ------------------------------- */

/** سکشن زندهٔ دیمت: کاتالوگ‌های قیمت نمونه + توضیح بازوی خرید — فقط نمایش، بدون دکمه */
function LiveFromDaymat() {
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
        <h2 className="mt-2 text-3xl font-black sm:text-4xl">کاتالوگ‌های قیمت، زنده</h2>
        <p className="mt-4 leading-8 text-stone-600 dark:text-gray-400">
          قیمت‌های واقعی فروشنده‌ها همین حالا روی تابلوی دیمت است — ببین، بعد بازوی خودت را بساز.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* کاتالوگ‌های قیمت نمونه */}
        <motion.div {...fadeUp(0.1)}
          className="rounded-3xl border-2 border-brand-primary-tint bg-white p-6 shadow-sm dark:bg-gray-900">
          <h3 className="flex items-center gap-2 text-lg font-black text-brand-primary-strong dark:text-brand-primary">
            <Store className="size-5" /> کاتالوگ‌های قیمت
          </h3>
          <ul className="mt-4 space-y-2">
            {catalogs.map((c: any, i: number) => (
              <motion.li key={c.id ?? i} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Link href={`/${c.slug || c.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-stone-100 px-3 py-2.5 transition-colors hover:border-brand-primary-tint hover:bg-brand-primary-soft/50
                  dark:border-gray-800 dark:hover:bg-gray-800/60">
                  {c.logoUrl ? (
                    <Image src={c.logoUrl} alt="" width={36} height={36} className="size-9 rounded-xl object-cover" unoptimized />
                  ) : (
                    <span className="grid size-9 place-items-center rounded-xl bg-brand-primary-soft text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary">
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

        {/* بازوی خرید — توضیح سه‌مرحله‌ای، بدون دکمه */}
        <motion.div {...fadeUp(0.2)}
          className="flex flex-col justify-center rounded-3xl border-2 border-brand-contrast-tint bg-white p-6 shadow-sm dark:bg-gray-900">
          <h3 className="flex items-center gap-2 text-lg font-black text-brand-contrast-strong dark:text-brand-contrast">
            <ClipboardList className="size-5" /> بازوی خرید
          </h3>
          <ul className="mt-4 space-y-3">
            {[
              'لیست خریدت را ساده می‌نویسی — مثل یادداشت مغازه.',
              'فروشنده‌ها از هر جای کشور روی همان صفحه قیمت و شرایط می‌دهند.',
              'تو آروم بهترین پیشنهاد را انتخاب می‌کنی؛ بی‌ده‌ها تماس.',
            ].map((s, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-contrast text-[11px] font-black text-white">
                  {i + 1}
                </span>
                <p className="text-sm font-bold leading-7 text-stone-600 dark:text-gray-300">{s}</p>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}

/* --------------------------------- landing -------------------------------- */

export default function Landing() {
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);

  // ✅ یک درِ ورودی: مهمان → login با redirect (انتخاب حفظ می‌شود) | لاگین → مستقیم
  const startHref = isAuthenticated
    ? '/business/register'
    : `/login?redirect=${encodeURIComponent('/business/register')}`;

  return (
    <div className="min-h-screen bg-[#FFFDF7] text-stone-900 dark:bg-gray-950 dark:text-gray-100">
      <style>{`
        .bg-dots { background-image: radial-gradient(circle, rgba(28,25,23,0.05) 1px, transparent 1px); background-size: 22px 22px; }
        .dark .bg-dots { background-image: radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px); }
      `}</style>

      <div className="bg-dots flex min-h-screen flex-col pt-16">
        {/* --------------------------- هدر ثابت ---------------------------- */}
        <header
          className="fixed inset-x-0 top-0 z-50 border-b border-stone-200/80 bg-[#FFFDF7]/85 backdrop-blur-md
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
                بازوهای من
              </Link>
            ) : (
              <Link href="/login"
                    className="rounded-full border border-stone-300 px-4 py-2 text-xs font-bold text-stone-700 transition-colors
                    hover:border-brand-primary hover:text-brand-primary-strong
                    dark:border-gray-600 dark:text-gray-200 dark:hover:border-brand-primary">
                ورود | عضویت
              </Link>
            )}
          </div>
        </header>

        <main id="top" className="flex-1">
          {/* ------------------- hero — قطبی‌سازی دو محصول ---------------------- */}
          <section aria-label="معرفی" className="relative overflow-hidden">
            <div className="mx-auto max-w-6xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16">
              <motion.div {...fadeUp()} className="flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 py-1.5 text-xs font-bold text-stone-600 shadow-sm
                dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                  برای همه‌ی بازار — کالا و خدمات
                </span>
              </motion.div>

              <motion.h1
                {...fadeUp(0.05)}
                className="mx-auto mt-5 max-w-3xl text-center text-4xl font-black leading-[1.35] sm:text-5xl md:text-6xl md:leading-[1.3]">
                هر کسی توی بازار،{' '}
                <span className="text-brand-primary-strong dark:text-brand-primary">هم می‌فروشه</span>،{' '}
                <span className="text-brand-contrast-strong dark:text-brand-contrast">هم می‌خره</span>
              </motion.h1>

              {/* دو باکس روبروی هم — قطبی‌سازی فروش / خرید */}
              <div className="relative mx-auto mt-10 flex max-w-4xl flex-col gap-4 md:flex-row md:gap-6">
                {/* نشان «همکاری» وسطِ دو باکس — دسکتاپ */}
                <motion.div
                  {...fadeUp(0.25)}
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block">
                  <span className="grid size-16 place-items-center rounded-full border-2 border-stone-200 bg-white shadow-xl
                  dark:border-gray-700 dark:bg-gray-900">
                    <Handshake className="size-7 text-stone-700 dark:text-gray-200" />
                  </span>
                </motion.div>

                <HeroBox
                  tone="primary"
                  icon={Store}
                  chip="برای فروش"
                  title="کاتالوگ قیمت"
                  question="چه محصول یا خدماتی می‌فروشی؟"
                  body="براش کاتالوگ قیمت بساز تا خریداران از شهر، استان و کل کشور بهت درخواست همکاری بدن."
                  illustration={<MiniCatalog />}
                  delay={0.1}
                />

                {/* نشان «همکاری» بین دو باکس — موبایل */}
                <motion.div {...fadeUp(0.25)} aria-hidden className="flex items-center justify-center gap-2 md:hidden">
                  <span className="h-px w-12 bg-stone-200 dark:bg-gray-700" />
                  <Handshake className="size-5 text-stone-400 dark:text-gray-500" />
                  <span className="h-px w-12 bg-stone-200 dark:bg-gray-700" />
                </motion.div>

                <HeroBox
                  tone="contrast"
                  icon={ClipboardList}
                  chip="برای خرید"
                  title="بازوی خرید"
                  question="چی می‌خری؟"
                  body="براش بازوی خریدت رو بساز تا فروشنده‌ها از هر جای کشور بهت پیشنهاد تأمین بدن."
                  illustration={<MiniWall />}
                  delay={0.15}
                />
              </div>

              {/* شعار + تک‌دکمهٔ شروع */}
              <motion.p
                {...fadeUp(0.25)}
                className="mx-auto mt-10 max-w-2xl text-center text-base font-bold leading-8 text-stone-700 dark:text-gray-300 sm:text-lg">
                فقط با ساخت همین دو صفحهٔ ساده — در کمتر از یک دقیقه — شبکه‌سازی تجاری خودت رو شروع کن و هر روز گسترشش بده.
              </motion.p>

              <motion.div {...fadeUp(0.3)} className="mt-6 flex flex-col items-center gap-3">
                <a
                  href={startHref}
                  className="inline-flex h-14 items-center gap-2.5 rounded-full bg-brand-primary px-10 text-lg font-extrabold text-white shadow-xl shadow-brand-primary/30 transition-colors hover:bg-brand-primary-strong">
                  <Rocket className="size-5" />
                  شروع کن
                  <ArrowLeft className="size-4" />
                </a>
                <p className="max-w-md text-center text-xs font-bold leading-6 text-stone-500 dark:text-gray-400">
                  اولین بازوت رو بساز — بعد از ثبت کسب‌وکارت می‌گیم کدوم ابزار به‌دردت می‌خوره؛
                  هر وقت خواستی اون یکی رو هم می‌سازی.
                </p>
              </motion.div>
            </div>
          </section>

          {/* --------------------- مزایا — کوتاه و تکتونه ---------------------- */}
          <section aria-label="دو ابزار" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-black text-stone-400 dark:text-gray-500">دو ابزار مستقل</span>
              <h2 className="mt-2 text-3xl font-black leading-snug sm:text-4xl">
                برای فروشت <span className="text-brand-primary-strong dark:text-brand-primary">کاتالوگ قیمت</span>، برای خریدت{' '}
                <span className="text-brand-contrast-strong dark:text-brand-contrast">بازوی خرید</span>
              </h2>
              <p className="mt-4 leading-8 text-stone-600 dark:text-gray-400">
                هر کدوم چند دقیقه‌ای ساخته می‌شه و یه لینک ساده می‌ده؛ هر لینک هم فقط به مسیر خودش می‌ره —
                کاتالوگ قیمت پیش خریدارها، بازوی خرید پیش فروشنده‌ها.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
              <ProductCard
                id="catalog"
                tone="primary"
                icon={Store}
                chip="نمایش و تبلیغ کالا و خدمات"
                title="ساخت کاتالوگ قیمت"
                desc="جنست رو قشنگ نشون بده، قیمت بذار کنارش و لینکش رو بده دست خریدارها — سفارش‌ها خودشون میان."
                bullets={[
                  'یه بار می‌سازی، همیشه آنلاینه — دیگه برای هر مشتری عکس و قیمت جدا نمی‌فرستی.',
                  'قیمت‌ها همیشه روزه — یه تغییر، همون لحظه دست همهٔ خریدارها.',
                  'خریدارها بهت وصل می‌شن و همکار فروشت می‌شن؛ هر جنس جدید، دست همون‌ها.',
                ]}
                audience={['تولیدی‌ها', 'شرکت‌های پخش', 'عمده‌فروش‌ها', 'خدمات']}
              />

              <ProductCard
                id="inquiry"
                tone="contrast"
                icon={ClipboardList}
                chip="گرفتن قیمت از فروشنده‌ها"
                title="ساخت بازوی خرید"
                desc="لیست چیزهایی که می‌خری رو بنویس و لینکش رو بده فروشنده‌ها؛ اون‌ها قیمت بدن، تو بهترین رو انتخاب کن."
                bullets={[
                  'دیگه ده‌جا زنگ نمی‌زنی — همه با هم قیمت می‌دن، سر یه صفحه.',
                  'پیشنهادها کنار هم‌ان؛ از هر کی به‌صرفه‌تر بود معامله می‌کنی.',
                  'تامین‌کننده‌های خوب همکار خریدت می‌شن؛ بار بعد مستقیم به همون‌ها اعلام می‌کنی.',
                ]}
                audience={['سوپرمارکت‌ها', 'رستوران‌ها', 'آرایشگاه‌ها', 'فروشگاه‌ها']}
              />
            </div>
          </section>

          {/* --------------- مکانیزه کردن تجارت: همکار خرید/همکار فروش ---------- */}
          <section aria-label="شبکهٔ خرید و فروش" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-black text-stone-400 dark:text-gray-500">فقط یه صفحهٔ ساده نیست</span>
              <h2 className="mt-2 text-3xl font-black leading-snug sm:text-4xl">
                تجارتت رو <span className="text-brand-primary-strong dark:text-brand-primary">مکانیزه</span> کن
              </h2>
              <p className="mt-4 leading-8 text-stone-600 dark:text-gray-400">
                هر کس با کاتالوگ‌هات کار کنه، توی دفتر دیمت ثبت می‌شه — شبکهٔ همکاریت کم‌کم خودش می‌سازه؛
                بی‌کاغذ، بی‌دفترچه، بی‌ده‌ها تماس تکراری.
              </p>
            </motion.div>

            {/* دو همکار — فروش و خرید */}
            <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
              <motion.div
                {...fadeUp(0.1)}
                className="rounded-3xl border-2 border-brand-primary-tint bg-brand-primary-soft/40 p-6 dark:border-brand-primary/25 dark:bg-brand-primary/5">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-primary text-white">
                    <Users className="size-5" />
                  </span>
                  <h3 className="text-lg font-black text-brand-primary-strong dark:text-brand-primary">همکار فروش پیدا کن</h3>
                </div>
                <p className="mt-4 text-sm font-bold leading-7 text-stone-600 dark:text-gray-300">
                  مغازه‌دارها و خریدارها از روی کاتالوگ قیمتت بهت وصل می‌شن؛ هر کدوم رو تایید کنی،
                  همکار فروشت می‌شن — هر وقت کالای جدید یا قیمتی داشتی، مستقیم دستشون می‌رسی.
                </p>
              </motion.div>

              <motion.div
                {...fadeUp(0.2)}
                className="rounded-3xl border-2 border-brand-contrast-tint bg-brand-contrast-soft/50 p-6 dark:border-brand-contrast/25 dark:bg-brand-contrast/5">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-contrast text-white">
                    <Handshake className="size-5" />
                  </span>
                  <h3 className="text-lg font-black text-brand-contrast-strong dark:text-brand-contrast">همکار خرید پیدا کن</h3>
                </div>
                <p className="mt-4 text-sm font-bold leading-7 text-stone-600 dark:text-gray-300">
                  تامین‌کننده‌هایی که به بازوی خریدت قیمت دادن و تاییدشون کردی، همکار خریدت می‌شن؛
                  بار بعد به‌جای گشتن و پرس‌وجو، مستقیم به همون‌ها اعلام می‌کنی.
                </p>
              </motion.div>
            </div>
          </section>

          {/* ------------------- از کجا شروع کنی؟ — نوار فشرده ------------------ */}
          <section aria-label="مثال‌ها" className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-black sm:text-4xl">از کجا شروع کنی؟</h2>
              <p className="mt-4 leading-8 text-stone-600 dark:text-gray-400">
                از همون‌جا که به دردت می‌خوره؛ اون یکی هم هر وقت لازم شد سر جاشه —
                بعد از ثبت کسب‌وکارت هم دیمت بر اساس نوع کارت پیشنهادش رو می‌گه.
              </p>
            </motion.div>

            <div className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StartPick icon={Truck} title="شرکت پخش" tone="primary" tool="کاتالوگ قیمت" />
              <StartPick icon={ShoppingBasket} title="سوپرمارکت" tone="contrast" tool="بازوی خرید" />
              <StartPick icon={Scissors} title="آرایشگاه" tone="contrast" tool="بازوی خرید" />
              <StartPick icon={UtensilsCrossed} title="رستوران" tone="contrast" tool="بازوی خرید" />
            </div>

            {/* punchline */}
            <motion.div
              {...fadeUp(0.25)}
              className="mt-8 flex flex-col items-center gap-2 rounded-3xl bg-stone-900 px-6 py-7 text-center text-white shadow-xl dark:bg-gray-800 sm:flex-row sm:justify-center sm:gap-4">
              <Handshake className="size-7 shrink-0 text-brand-accent" />
              <p className="text-base font-bold leading-8 sm:text-lg">
                از کدوم شروع کنی فرقی نمی‌کنه؛ هر وقت دومی رو خواستی با چند کلیک می‌سازی‌ش.
              </p>
            </motion.div>
          </section>

          {/* -------------------------- live از روت دیمت ------------------------- */}
          <LiveFromDaymat />

          {/* ------------------------------ شعار پایانی --------------------------- */}
          <section aria-label="دیمت" className="mx-auto max-w-4xl px-4 pb-20 pt-12 sm:px-6">
            <motion.div
              {...fadeUp()}
              className="relative overflow-hidden rounded-[2.5rem] border-2 border-stone-200 bg-white px-6 py-12 text-center shadow-xl shadow-stone-200/70
              dark:border-gray-800 dark:bg-gray-900 dark:shadow-black/40 sm:px-12">
              <div aria-hidden className="absolute -right-16 -top-16 size-48 rounded-full bg-brand-primary-soft blur-2xl" />
              <div aria-hidden className="absolute -bottom-16 -left-16 size-48 rounded-full bg-brand-accent-soft blur-2xl" />
              <div className="relative">
                <h2 className="text-2xl font-black leading-relaxed sm:text-3xl">
                  دیمت، پلتفرم ساخت و انتشار{' '}
                  <span className="text-brand-primary-strong dark:text-brand-primary">بازوهای فروش</span>
                  {' '}و{' '}
                  <span className="text-brand-contrast-strong dark:text-brand-contrast">بازوهای خرید</span>
                </h2>
                <p className="mx-auto mt-4 max-w-xl leading-8 text-stone-600 dark:text-gray-400">
                  از همون «شروع کن» بالای صفحه شروع کن — ساده، مثل ساختن یک پست.
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
              <span className="hidden text-sm text-stone-400 dark:text-gray-500 sm:inline">— فروش با کاتالوگ قیمت، خرید با بازوی خرید</span>
            </div>
            <nav className="flex items-center gap-4 text-xs font-bold text-stone-500 dark:text-gray-400">
              <Link href="/docs/about" className="hover:text-brand-primary">درباره ما</Link>
              <Link href="/docs/terms" className="hover:text-brand-primary">قوانین</Link>
              <Link href="/feedback" className="hover:text-brand-primary">پیشنهادات</Link>
            </nav>
            <p className="text-xs text-stone-400 dark:text-gray-500">هر کسی توی بازار هم فروشنده‌ست، هم خریدار © ۱۴۰۵</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
