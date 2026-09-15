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
 * لندینگ دیمت — قطبی‌سازی گرافیکی دو محصول، همان بالای صفحه:
 *
 *   ┌─ کاتالوگ قیمت (فروش) ─┐        ┌─ بازوی خرید (خرید) ─┐
 *   │ «چه می‌فروشی؟»        │  ⚑ همکاری  │ «چی می‌خری؟»         │
 *   └───────────────────────┘        └─────────────────────┘
 *              ↓ شعار + یک دکمهٔ «شروع کن» (تک‌دروازه)
 *
 *   مهمان → /login?redirect=/business/register  |  لاگین → مستقیم /business/register
 *   بعد از ثبت کسب‌وکار، بر اساس نوع فعالیت (firstCatalog در data-types) پیشنهاد می‌دهیم
 *   اول کدام ابزار را بسازد — «پیشنهاد» است نه اجبار؛ هر دو ابزار همیشه باز.
 * بقیهٔ صفحه کوتاه و تصویری است: مزایا (۳ بولت برای هر ابزار)، شبکهٔ همکار خرید/فروش،
 * نوار «از کجا شروع کنی»، نمونهٔ زندهٔ روت و CTA نهایی.
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
        dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/50 sm:w-44"
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
          کاتالوگ قیمت
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
        dark:border-amber-500/40 dark:bg-amber-500/10 dark:shadow-black/50 sm:w-44"
    >
      <div className="flex items-center gap-2 border-b border-dashed border-amber-300 pb-2 dark:border-amber-500/40">
        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-amber-200 dark:bg-amber-500/25">
          <ClipboardList className="size-3.5 text-amber-800 dark:text-amber-300" />
        </span>
        <span className="text-[11px] font-bold text-stone-700 dark:text-gray-200">بازوی خرید من</span>
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
    bullet: 'text-brand-red',
    stepNum: 'bg-brand-red text-white',
    audience: 'border-brand-red-tint bg-brand-red-soft text-brand-red',
    headerBg: 'bg-brand-red-soft/50',
    button: 'bg-brand-red text-white hover:bg-brand-red-strong shadow-lg shadow-brand-red/25',
    heroCard: 'border-brand-red-tint bg-brand-red-soft/30 shadow-brand-red/10 dark:border-red-500/30 dark:bg-red-500/5',
    pickCard: 'border-brand-red-tint bg-brand-red-soft/30 dark:border-red-500/30 dark:bg-red-500/5',
    pickIcon: 'bg-brand-red text-white',
    accentText: 'text-brand-red',
  },
  amber: {
    chip: 'border-brand-amber-tint bg-brand-amber-soft text-amber-800 dark:text-amber-300',
    bullet: 'text-amber-600 dark:text-amber-400',
    stepNum: 'bg-brand-amber text-white',
    audience: 'border-brand-amber-tint bg-brand-amber-soft text-amber-800 dark:text-amber-300',
    headerBg: 'bg-brand-amber-soft/60',
    button: 'bg-brand-amber text-white hover:bg-brand-amber-strong shadow-lg shadow-brand-amber/30',
    heroCard: 'border-brand-amber-tint bg-brand-amber-soft/40 shadow-brand-amber/10 dark:border-amber-500/30 dark:bg-amber-500/5',
    pickCard: 'border-brand-amber-tint bg-brand-amber-soft/40 dark:border-amber-500/30 dark:bg-amber-500/5',
    pickIcon: 'bg-brand-amber text-white',
    accentText: 'text-amber-700 dark:text-amber-300',
  },
} as const;

type Tone = keyof typeof TONES;

/* --------------------------------- hero box ------------------------------- */

/** باکس قطبی هیرو — یک سمتِ بازار: فروش (کاتالوگ قیمت) یا خرید (بازوی خرید) */
function HeroBox({
  tone,
  icon: Icon,
  chip,
  title,
  question,
  body,
  cta,
  href,
  illustration,
  delay = 0,
}: {
  tone: Tone;
  icon: React.ElementType;
  chip: string;
  title: string;
  question: string;
  body: string;
  cta: string;
  href: string;
  illustration: React.ReactNode;
  delay?: number;
}) {
  const t = TONES[tone];
  return (
    <motion.div
      {...fadeUp(delay)}
      className={`flex flex-1 flex-col items-center rounded-[2rem] border-2 px-5 pb-7 pt-8 text-center shadow-lg shadow-stone-200/60
      dark:shadow-black/30 sm:px-7 ${t.heroCard}`}>
      <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${t.chip}`}>
        <Icon className="size-3.5" />
        {chip}
      </span>
      <h2 className="mt-3 text-3xl font-black text-stone-900 dark:text-gray-100 sm:text-4xl">{title}</h2>
      <p className={`mt-3 text-lg font-black sm:text-xl ${t.accentText}`}>{question}</p>
      <p className="mt-2 max-w-xs text-sm font-bold leading-7 text-stone-600 dark:text-gray-400">{body}</p>
      <div className="mt-6">{illustration}</div>
      <Link
        href={href}
        className={`mt-6 inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-extrabold transition-colors ${t.button}`}>
        {cta}
        <ArrowLeft className="size-4" />
      </Link>
    </motion.div>
  );
}

/* ------------------------------ product card ------------------------------ */

/** کارت مزایا — فشرده: توضیح یک‌خطی + ۳ بولت + مخاطب + CTA (بدون نقاشی؛ نقاشی بالای صفحه است) */
function ProductCard({
  id,
  tone,
  icon: Icon,
  chip,
  title,
  desc,
  bullets,
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
  bullets: string[];
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

/* ------------------------------- start pick ------------------------------- */

/** چیپ فشردهٔ «از کجا شروع کنی؟» — یک کسب‌وکار + ابزار پیشنهادی‌اش */
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
      className={`flex items-center gap-3 rounded-2xl border-2 px-4 py-3.5 ${t.pickCard}`}>
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

/** سکشن زندهٔ روت: کاتالوگ‌های قیمت نمونه + CTA ساخت بازوی خرید — دو ستون جدا، دو محصول جدا */
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
        <h2 className="mt-2 text-3xl font-black sm:text-4xl">کاتالوگ‌های قیمت، زنده</h2>
        <p className="mt-4 leading-8 text-stone-600 dark:text-gray-400">
          قیمت‌های واقعی فروشنده‌ها همین حالا روی تابلوی دیمت است — و بازوی خرید هم چند دقیقه بیشتر نمی‌برد.
        </p>
      </motion.div>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {/* کاتالوگ‌های قیمت نمونه */}
        {catalogs.length > 0 && (
          <motion.div {...fadeUp(0.1)}
            className="rounded-3xl border-2 border-brand-red-tint bg-white p-6 shadow-sm dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-lg font-black text-brand-red">
                <Store className="size-5" /> کاتالوگ‌های قیمت
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

        {/* بازوی خرید — CTA ساخت */}
        <motion.div {...fadeUp(0.2)}
          className="flex flex-col justify-center rounded-3xl border-2 border-brand-amber-tint bg-white p-6 shadow-sm dark:bg-gray-900">
          <h3 className="flex items-center gap-2 text-lg font-black text-amber-600 dark:text-amber-400">
            <ClipboardList className="size-5" /> بازوی خرید
          </h3>
          <p className="mt-3 text-sm font-bold leading-7 text-stone-500 dark:text-gray-400">
            لیست خریدت را بنویس — تامین‌کننده‌ها اقلامت را می‌بینند و قیمت می‌دهند؛
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

  // ✅ یک درِ ورودی: مهمان → login با redirect (انتخاب حفظ می‌شود) | لاگین → مستقیم
  const toolHref = (path: string) =>
    isAuthenticated ? path : `/login?redirect=${encodeURIComponent(path)}`;
  const startHref = toolHref('/business/register');  // ثبت کسب‌وکار → پیشنهاد اولین ابزار (firstCatalog)
  const catalogHref = toolHref('/business/register'); // کاتالوگ قیمت — از مسیر ثبت کسب‌وکار
  const purchaseHref = toolHref('/inquiries/new');    // بازوی خرید — فرم ساخت

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
                <span className="text-brand-red">هم می‌فروشه</span>،{' '}
                <span className="text-brand-amber">هم می‌خره</span>
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
                  tone="red"
                  icon={Store}
                  chip="برای فروش"
                  title="کاتالوگ قیمت"
                  question="چه محصول یا خدماتی می‌فروشی؟"
                  body="براش کاتالوگ قیمت بساز تا خریداران از شهر، استان و کل کشور بهت درخواست همکاری بدن."
                  cta="کاتالوگ قیمت بساز"
                  href={catalogHref}
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
                  tone="amber"
                  icon={ClipboardList}
                  chip="برای خرید"
                  title="بازوی خرید"
                  question="چی می‌خری؟"
                  body="براش بازوی خریدت رو بساز تا فروشنده‌ها از هر جای کشور بهت پیشنهاد تأمین بدن."
                  cta="بازوی خرید بساز"
                  href={purchaseHref}
                  illustration={<MiniWall />}
                  delay={0.15}
                />
              </div>

              {/* شعار + تک‌دروازهٔ شروع */}
              <motion.p
                {...fadeUp(0.25)}
                className="mx-auto mt-10 max-w-2xl text-center text-base font-bold leading-8 text-stone-700 dark:text-gray-300 sm:text-lg">
                فقط با ساخت همین دو صفحهٔ ساده — در کمتر از یک دقیقه — شبکه‌سازی تجاری خودت رو شروع کن و هر روز گسترشش بده.
              </motion.p>

              <motion.div {...fadeUp(0.3)} className="mt-6 flex flex-col items-center gap-3">
                <a
                  href={startHref}
                  className="inline-flex h-14 items-center gap-2.5 rounded-full bg-stone-900 px-10 text-lg font-extrabold text-white shadow-xl shadow-stone-900/20 transition-colors hover:bg-stone-700
                  dark:bg-gray-100 dark:text-gray-900 dark:shadow-black/40 dark:hover:bg-white">
                  <Rocket className="size-5" />
                  شروع کن
                  <ArrowLeft className="size-4" />
                </a>
                <p className="max-w-md text-center text-xs font-bold leading-6 text-stone-500 dark:text-gray-400">
                  نگران انتخاب نباش — هر دو ابزار مال توئه؛ بعد از ثبت کسب‌وکارت می‌گیم کدوم به‌دردت می‌خوره،
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
                برای فروشت <span className="text-brand-red">کاتالوگ قیمت</span>، برای خریدت{' '}
                <span className="text-brand-amber">بازوی خرید</span>
              </h2>
              <p className="mt-4 leading-8 text-stone-600 dark:text-gray-400">
                هر کدوم چند دقیقه‌ای ساخته می‌شه و یه لینک ساده می‌ده؛ هر لینک هم فقط به مسیر خودش می‌ره —
                کاتالوگ قیمت پیش خریدارها، بازوی خرید پیش فروشنده‌ها.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-6 md:grid-cols-2 md:gap-8">
              <ProductCard
                id="catalog"
                tone="red"
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
                cta="کاتالوگ قیمت بساز"
                href={catalogHref}
              />

              <ProductCard
                id="inquiry"
                tone="amber"
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
                cta="بازوی خرید بساز"
                href={purchaseHref}
              />
            </div>
          </section>

          {/* --------------- مکانیزه کردن تجارت: همکار خرید/همکار فروش ---------- */}
          <section aria-label="شبکهٔ خرید و فروش" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
              <span className="text-sm font-black text-stone-400 dark:text-gray-500">فقط یه صفحهٔ ساده نیست</span>
              <h2 className="mt-2 text-3xl font-black leading-snug sm:text-4xl">
                تجارتت رو <span className="text-brand-red">مکانیزه</span> کن
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
                className="rounded-3xl border-2 border-brand-red-tint bg-brand-red-soft/40 p-6 dark:bg-red-500/5">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-red text-white">
                    <Users className="size-5" />
                  </span>
                  <h3 className="text-lg font-black text-brand-red">همکار فروش پیدا کن</h3>
                </div>
                <p className="mt-4 text-sm font-bold leading-7 text-stone-600 dark:text-gray-300">
                  مغازه‌دارها و خریدارها از روی کاتالوگ قیمتت بهت وصل می‌شن؛ هر کدوم رو تایید کنی،
                  همکار فروشت می‌شن — هر وقت کالای جدید یا قیمتی داشتی، مستقیم دستشون می‌رسی.
                </p>
              </motion.div>

              <motion.div
                {...fadeUp(0.2)}
                className="rounded-3xl border-2 border-brand-amber-tint bg-brand-amber-soft/50 p-6 dark:bg-amber-500/5">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-amber text-white">
                    <Handshake className="size-5" />
                  </span>
                  <h3 className="text-lg font-black text-amber-700 dark:text-amber-300">همکار خرید پیدا کن</h3>
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
              <StartPick icon={Truck} title="شرکت پخش" tone="red" tool="کاتالوگ قیمت" />
              <StartPick icon={ShoppingBasket} title="سوپرمارکت" tone="amber" tool="بازوی خرید" />
              <StartPick icon={Scissors} title="آرایشگاه" tone="amber" tool="بازوی خرید" />
              <StartPick icon={UtensilsCrossed} title="رستوران" tone="amber" tool="بازوی خرید" />
            </div>

            {/* punchline */}
            <motion.div
              {...fadeUp(0.25)}
              className="mt-8 flex flex-col items-center gap-2 rounded-3xl bg-stone-900 px-6 py-7 text-center text-white shadow-xl dark:bg-gray-800 sm:flex-row sm:justify-center sm:gap-4">
              <Handshake className="size-7 shrink-0 text-amber-400" />
              <p className="text-base font-bold leading-8 sm:text-lg">
                از کدوم شروع کنی فرقی نمی‌کنه؛ هر وقت دومی رو خواستی با چند کلیک می‌سازی‌ش.
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
                <h2 className="text-3xl font-black sm:text-4xl">همین حالا شروع کن</h2>
                <p className="mx-auto mt-4 max-w-xl leading-8 text-stone-600 dark:text-gray-400">
                  با شماره موبایلت وارد شو، کسب‌وکارت رو ثبت کن و اولین صفحه‌ات رو کمتر از یک دقیقه بساز؛
                  ساده مثل ساختن یک پست.
                </p>
                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href={startHref}
                    className="inline-flex h-14 items-center gap-2.5 rounded-full bg-stone-900 px-10 text-lg font-extrabold text-white shadow-xl shadow-stone-900/20 transition-colors hover:bg-stone-700
                    dark:bg-gray-100 dark:text-gray-900 dark:shadow-black/40 dark:hover:bg-white">
                    <Rocket className="size-5" />
                    شروع کن
                    <ArrowLeft className="size-4" />
                  </Link>
                </div>
                <p className="mt-5 text-xs font-medium text-stone-400 dark:text-gray-500">
                  هر دو ابزار مال توئه — اول یکی، هر وقت خواستی اون یکی.
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
