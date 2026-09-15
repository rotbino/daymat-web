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
  Scissors,
  ShoppingBasket,
  Store,
  Truck,
  UtensilsCrossed,
  Users,
} from 'lucide-react';

/**
 * لندینگ دیمت — بازنویسی حرفه‌ای با سیستم رنگ سه‌نقشی برند:
 *   سبز (primary) بازوی فروش/کاتالوگ قیمت — آبی (contrast) بازوی خرید — زرد فقط تاکید.
 *
 * ساختار:
 *   هدر ثابت (fixed) → شعار سایت → دو باکس کوتاه قطبی (بدون دکمهٔ جدا) →
 *   یک دکمهٔ واحد «شروع کن و اولین بازوت رو بساز» → نقاشی فشردهٔ دو ابزار →
 *   دو کارت مزایا → شبکهٔ همکار فروش/خرید → «از کجا شروع کنی؟» → نمونهٔ زنده → CTA پایانی.
 *
 * تک‌دروازه: مهمان → /login?redirect=/business/register | لاگین → /business/register
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

/* --------------------------------- hero box ------------------------------- */

/** باکس کوتاه قطبی هیرو — یک سمتِ بازار: فروش (کاتالوگ قیمت) یا خرید (بازوی خرید)؛ بدون دکمه */
function HeroBox({
  tone,
  icon: Icon,
  chip,
  question,
  body,
  delay = 0,
}: {
  tone: 'primary' | 'contrast';
  icon: React.ElementType;
  chip: string;
  question: string;
  body: string;
  delay?: number;
}) {
  const isPrimary = tone === 'primary';
  return (
    <motion.div
      {...fadeUp(delay)}
      className={`flex-1 rounded-3xl border bg-white p-5 text-center shadow-sm sm:p-6
      dark:bg-gray-900 ${isPrimary
        ? 'border-brand-primary-tint dark:border-brand-primary/25'
        : 'border-brand-contrast-tint dark:border-brand-contrast/25'}`}
    >
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${isPrimary
          ? 'bg-brand-primary-soft text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary'
          : 'bg-brand-contrast-soft text-brand-contrast-strong dark:bg-brand-contrast/15 dark:text-brand-contrast'}`}
      >
        <Icon className="size-3.5" />
        {chip}
      </span>
      <h2 className="mt-3 text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">{question}</h2>
      <p className="mt-2.5 text-sm leading-7 text-stone-600 dark:text-gray-400">{body}</p>
    </motion.div>
  );
}

/* ------------------------------ feature card ------------------------------ */

/** کارت مزایا — چیپ + توضیح یک‌خطی + ۳ بولت؛ بدون دکمه (دکمهٔ واحد بالای صفحه است) */
function FeatureCard({
  tone,
  icon: Icon,
  chip,
  title,
  desc,
  bullets,
  delay = 0,
}: {
  tone: 'primary' | 'contrast';
  icon: React.ElementType;
  chip: string;
  title: string;
  desc: string;
  bullets: string[];
  delay?: number;
}) {
  const isPrimary = tone === 'primary';
  return (
    <motion.article
      {...fadeUp(delay)}
      className="flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm
        dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex items-center gap-3 px-6 pb-4 pt-6 sm:px-7">
        <span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${isPrimary
          ? 'bg-brand-primary text-white'
          : 'bg-brand-contrast text-white'}`}>
          <Icon className="size-5" />
        </span>
        <div>
          <p className={`text-[11px] font-bold ${isPrimary
            ? 'text-brand-primary-strong dark:text-brand-primary'
            : 'text-brand-contrast-strong dark:text-brand-contrast'}`}>{chip}</p>
          <h3 className="text-xl font-black text-stone-900 dark:text-gray-100">{title}</h3>
        </div>
      </div>
      <p className="px-6 text-sm leading-7 text-stone-600 dark:text-gray-400 sm:px-7">{desc}</p>
      <ul className="space-y-2.5 px-6 py-5 sm:px-7">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <CheckCircle2 className={`mt-1 size-4 shrink-0 ${isPrimary
              ? 'text-brand-primary dark:text-brand-primary'
              : 'text-brand-contrast dark:text-brand-contrast'}`} />
            <p className="text-sm leading-6 text-stone-600 dark:text-gray-300">{b}</p>
          </li>
        ))}
      </ul>
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
  tone: 'primary' | 'contrast';
  tool: string;
}) {
  const isPrimary = tone === 'primary';
  return (
    <motion.div
      {...fadeUp(0.05)}
      className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 shadow-sm
        dark:border-gray-800 dark:bg-gray-900"
    >
      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${isPrimary
        ? 'bg-brand-primary-soft text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary'
        : 'bg-brand-contrast-soft text-brand-contrast-strong dark:bg-brand-contrast/15 dark:text-brand-contrast'}`}>
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[15px] font-black text-stone-800 dark:text-gray-100">{title}</p>
        <p className={`mt-0.5 flex items-center gap-1 text-xs font-bold ${isPrimary
          ? 'text-brand-primary-strong dark:text-brand-primary'
          : 'text-brand-contrast-strong dark:text-brand-contrast'}`}>
          <ArrowLeft className="size-3" />
          {tool}
        </p>
      </div>
    </motion.div>
  );
}

/* ------------------------------ live از دیمت ------------------------------ */

/** نمونهٔ زنده: کاتالوگ‌های قیمت واقعیِ منتشرشده در دیمت — فقط نمایش، بدون دکمهٔ اضافه */
function LiveFromDaymat() {
  const { data: featured } = useQuery({
    queryKey: ['landing', 'featured-catalogs'],
    queryFn: () => apiService.catalog.getFeatured(4),
    staleTime: 60 * 1000,
  });

  const catalogs = (featured?.items ?? []).slice(0, 4);
  if (!catalogs.length) return null;

  return (
    <section aria-label="همین حالا توی دیمت" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
        <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">همین حالا توی دیمت</h2>
        <p className="mt-3 leading-7 text-stone-600 dark:text-gray-400">
          قیمت‌های واقعی فروشنده‌ها روی این کاتالوگ‌هاست — باز کن، ببین، بعد بازوی خودت را بساز.
        </p>
      </motion.div>

      <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2">
        {catalogs.map((c: any, i: number) => (
          <motion.div key={c.id ?? i} {...fadeUp(i * 0.06)}>
            <Link href={`/${c.slug || c.id}`}
              className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition-colors
              hover:border-brand-primary-tint hover:bg-brand-primary-soft/50
              dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/60">
              {c.logoUrl ? (
                <Image src={c.logoUrl} alt="" width={40} height={40} className="size-10 rounded-xl object-cover" unoptimized />
              ) : (
                <span className="grid size-10 place-items-center rounded-xl bg-brand-primary-soft text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary">
                  <Store className="size-4.5" />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold text-stone-800 dark:text-gray-200">{c.name}</span>
                {c.city ? <span className="block text-[11px] text-stone-400 dark:text-gray-500">{c.city}</span> : null}
              </span>
              <Eye className="size-4 shrink-0 text-stone-300 dark:text-gray-600" />
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* --------------------------------- landing -------------------------------- */

export default function Landing() {
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);

  // ✅ یک درِ ورودی: مهمان → login با redirect | لاگین → مستقیم ثبت کسب‌وکار
  const startHref = isAuthenticated
    ? '/business/register'
    : `/login?redirect=${encodeURIComponent('/business/register')}`;

  return (
    <div className="min-h-screen bg-white text-stone-900 dark:bg-gray-950 dark:text-gray-100">
      <div className="flex min-h-screen flex-col pt-16">

        {/* --------------------------- هدر ثابت ---------------------------- */}
        <header
          className="fixed inset-x-0 top-0 z-50 border-b border-stone-200/80 bg-white/85 backdrop-blur-md
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
                    hover:border-brand-primary hover:text-brand-primary-strong
                    dark:border-gray-600 dark:text-gray-200 dark:hover:border-brand-primary">
                ورود | عضویت
              </Link>
            )}
          </div>
        </header>

        <main id="top" className="flex-1">
          {/* ------------------------- هیرو: شعار + دو باکس ------------------------ */}
          <section aria-label="معرفی" className="relative overflow-hidden">
            <div className="mx-auto max-w-6xl px-4 pb-12 pt-12 sm:px-6 sm:pt-16">

              {/* شعار سایت */}
              <motion.h1
                {...fadeUp()}
                className="mx-auto max-w-3xl text-center text-3xl font-black leading-[1.5] sm:text-4xl md:text-[2.6rem] md:leading-[1.45]">
                دیمت، پلتفرم ساخت و انتشار{' '}
                <span className="text-brand-primary-strong dark:text-brand-primary">بازوهای فروش</span>
                {' '}و{' '}
                <span className="text-brand-contrast-strong dark:text-brand-contrast">خرید</span>
              </motion.h1>

              {/* دو باکس کوتاه قطبی — بدون دکمهٔ جدا */}
              <div className="relative mx-auto mt-9 flex max-w-4xl flex-col gap-4 md:flex-row md:gap-6">
                <HeroBox
                  tone="primary"
                  icon={Store}
                  chip="بازوی فروش"
                  question="چی می‌فروشی؟"
                  body="بازوی کاتالوگ قیمت بساز تا خریداران از شهر، استان و کل کشور بهت درخواست همکاری بدن و شبکه خریدارانت شکل بگیره."
                  delay={0.1}
                />

                {/* نشان همکاری بین دو باکس — دسکتاپ */}
                <motion.div
                  {...fadeUp(0.25)}
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block">
                  <span className="grid size-14 place-items-center rounded-full border border-stone-200 bg-white shadow-lg
                  dark:border-gray-700 dark:bg-gray-900">
                    <Handshake className="size-6 text-stone-600 dark:text-gray-300" />
                  </span>
                </motion.div>

                <HeroBox
                  tone="contrast"
                  icon={ClipboardList}
                  chip="بازوی خرید"
                  question="چی می‌خری؟"
                  body="بازوی خرید بساز تا فروشنده‌ها از هر جای کشور بهت پیشنهاد تأمین بدن و شبکه تامین‌کنندگانت برای هر درخواستت قیمت و شرایط رقابتی بدن."
                  delay={0.15}
                />
              </div>

              {/* موبایل: نشان همکاری زیر باکس‌ها */}
              <motion.div {...fadeUp(0.25)} aria-hidden className="mt-4 flex items-center justify-center gap-2 md:hidden">
                <span className="h-px w-12 bg-stone-200 dark:bg-gray-700" />
                <Handshake className="size-5 text-stone-400 dark:text-gray-500" />
                <span className="h-px w-12 bg-stone-200 dark:bg-gray-700" />
              </motion.div>

              {/* تک‌دروازه: یک دکمه برای شروع */}
              <motion.p
                {...fadeUp(0.2)}
                className="mx-auto mt-9 max-w-2xl text-center text-base font-bold leading-8 text-stone-700 dark:text-gray-300">
                فقط با ساخت همین دو صفحهٔ ساده، در کمتر از یک دقیقه، شبکه‌سازی تجاری خودت رو شروع کن و هر روز گسترش بده.
              </motion.p>

              <motion.div {...fadeUp(0.25)} className="mt-6 flex flex-col items-center gap-3">
                <a
                  href={startHref}
                  className="inline-flex h-13 items-center gap-2.5 rounded-full bg-brand-primary px-9 py-3.5 text-lg font-extrabold text-white
                  shadow-lg shadow-brand-primary/25 transition-colors hover:bg-brand-primary-strong">
                  شروع کن و اولین بازوت رو بساز
                  <ArrowLeft className="size-5" />
                </a>
                <p className="max-w-md text-center text-xs font-medium leading-6 text-stone-500 dark:text-gray-400">
                  اول کدام بازو؟ از نوع کارت می‌فهمیم و پیشنهاد می‌دهیم — هر دو همیشه در دسترس‌اند.
                </p>
              </motion.div>

              {/* نقاشی فشردهٔ دو ابزار */}
              <motion.div {...fadeUp(0.3)}
                className="relative mx-auto mt-12 flex max-w-md items-center justify-center gap-4 sm:gap-8">
                <MiniCatalog />
                <MiniWall />
              </motion.div>
            </div>
          </section>

          {/* --------------------- دو بازو، دو کار — مزایا ---------------------- */}
          <section aria-label="دو بازو" className="mx-auto max-w-6xl border-t border-stone-100 px-4 py-12 dark:border-gray-800/60 sm:px-6">
            <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">دو بازو، دو کار</h2>
              <p className="mt-3 leading-7 text-stone-600 dark:text-gray-400">
                هر بازو یک لینک ساده می‌دهد؛ هر لینک فقط به مسیر خودش می‌رود — کاتالوگ قیمت پیش خریدارها، بازوی خرید پیش فروشنده‌ها.
              </p>
            </motion.div>

            <div className="mt-9 grid gap-5 md:grid-cols-2 md:gap-7">
              <FeatureCard
                tone="primary"
                icon={Store}
                chip="نمایش و تبلیغ کالا و خدمات"
                title="کاتالوگ قیمت"
                desc="جنست را قشنگ نشان بده، قیمت بگذار کنارش و لینکش را بده دست خریدارها."
                bullets={[
                  'یک بار می‌سازی، همیشه آنلاینه — برای هر مشتری عکس و قیمت جدا نمی‌فرستی.',
                  'قیمت‌ها همیشه روزه؛ یک تغییر، همان لحظه دست همهٔ خریدارها.',
                  'خریدارها بهت وصل می‌شن و همکار فروشت می‌شن؛ هر کالای جدید، دست همان‌ها.',
                ]}
                delay={0.05}
              />
              <FeatureCard
                tone="contrast"
                icon={ClipboardList}
                chip="گرفتن قیمت از فروشنده‌ها"
                title="بازوی خرید"
                desc="لیست چیزهایی که می‌خری را بنویس و لینکش را بده فروشنده‌ها؛ قیمت‌ها می‌آد، تو بهترین را انتخاب می‌کنی."
                bullets={[
                  'ده‌جا زنگ نمی‌زنی — همه سر یک صفحه با هم قیمت می‌دن.',
                  'پیشنهادها کنار هم‌ان؛ از هر کی به‌صرفه‌تر بود معامله می‌کنی.',
                  'تامین‌کننده‌های خوب همکار خریدت می‌شن؛ دفعهٔ بعد مستقیم به همان‌ها.',
                ]}
                delay={0.15}
              />
            </div>
          </section>

          {/* ------------------- شبکه‌سازی: همکار فروش/همکار خرید ------------------ */}
          <section aria-label="شبکهٔ خرید و فروش" className="border-t border-stone-100 bg-stone-50/60 dark:border-gray-800/60 dark:bg-gray-900/40">
            <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
              <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
                <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">شبکه‌ات خودش ساخته می‌شه</h2>
                <p className="mt-3 leading-7 text-stone-600 dark:text-gray-400">
                  هر کس با بازوهایت کار کنه، توی دفتر دیمت ثبت می‌شه — بی‌کاغذ، بی‌دفترچه، بی‌تماس‌های تکراری.
                </p>
              </motion.div>

              <div className="mx-auto mt-9 grid max-w-4xl gap-4 sm:grid-cols-2">
                <motion.div {...fadeUp(0.1)}
                  className="rounded-3xl border border-brand-primary-tint bg-white p-6 dark:border-brand-primary/25 dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-primary text-white">
                      <Users className="size-5" />
                    </span>
                    <h3 className="text-base font-black text-stone-900 dark:text-gray-100">همکار فروش پیدا کن</h3>
                  </div>
                  <p className="mt-3.5 text-sm leading-7 text-stone-600 dark:text-gray-400">
                    خریدارها از روی کاتالوگ قیمت بهت وصل می‌شن؛ تاییدشون کنی، همکار فروشت می‌شن — هر قیمتی داشتی، مستقیم دستشون می‌رسی.
                  </p>
                </motion.div>

                <motion.div {...fadeUp(0.2)}
                  className="rounded-3xl border border-brand-contrast-tint bg-white p-6 dark:border-brand-contrast/25 dark:bg-gray-900">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-contrast text-white">
                      <Handshake className="size-5" />
                    </span>
                    <h3 className="text-base font-black text-stone-900 dark:text-gray-100">همکار خرید پیدا کن</h3>
                  </div>
                  <p className="mt-3.5 text-sm leading-7 text-stone-600 dark:text-gray-400">
                    تامین‌کننده‌هایی که به بازوی خریدت قیمت دادن و تاییدشون کردی، همکار خریدت می‌شن — دیگه گشتن و پرس‌وجو لازم نیست.
                  </p>
                </motion.div>
              </div>
            </div>
          </section>

          {/* ---------------------- از کجا شروع کنی؟ ------------------------- */}
          <section aria-label="مثال‌ها" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
            <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
              <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">از کجا شروع کنی؟</h2>
              <p className="mt-3 leading-7 text-stone-600 dark:text-gray-400">
                از همان‌جا که به کارت می‌آید؛ آن یکی هم هر وقت لازم شد سر جایش است.
              </p>
            </motion.div>

            <div className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <StartPick icon={Truck} title="شرکت پخش" tone="primary" tool="کاتالوگ قیمت" />
              <StartPick icon={ShoppingBasket} title="سوپرمارکت" tone="contrast" tool="بازوی خرید" />
              <StartPick icon={Scissors} title="آرایشگاه" tone="contrast" tool="بازوی خرید" />
              <StartPick icon={UtensilsCrossed} title="رستوران" tone="contrast" tool="بازوی خرید" />
            </div>

            {/* نکتهٔ پایانی — تنها جای زرد در صفحه */}
            <motion.div
              {...fadeUp(0.25)}
              className="mx-auto mt-8 flex max-w-3xl flex-col items-center gap-2 rounded-2xl border border-brand-accent-tint bg-brand-accent-soft px-6 py-5 text-center
              dark:border-brand-accent/25 dark:bg-brand-accent/10 sm:flex-row sm:justify-center sm:gap-3">
              <Handshake className="size-6 shrink-0 text-brand-accent-strong dark:text-brand-accent" />
              <p className="text-sm font-bold leading-7 text-stone-700 dark:text-gray-200">
                از کدام شروع کنی فرقی نمی‌کند؛ هر وقت دومی را خواستی با چند کلیک می‌سازی‌ش.
              </p>
            </motion.div>
          </section>

          {/* --------------------------- نمونهٔ زنده ---------------------------- */}
          <LiveFromDaymat />

          {/* ------------------------------ CTA نهایی ---------------------------- */}
          <section id="start" aria-label="شروع" className="mx-auto max-w-4xl px-4 pb-20 sm:px-6">
            <motion.div
              {...fadeUp()}
              className="rounded-3xl border border-stone-200 bg-white px-6 py-12 text-center shadow-sm
              dark:border-gray-800 dark:bg-gray-900 sm:px-12">
              <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">همین حالا شروع کن</h2>
              <p className="mx-auto mt-3.5 max-w-xl leading-7 text-stone-600 dark:text-gray-400">
                با شماره موبایلت وارد شو، کسب‌وکارت را ثبت کن و اولین بازویت را بساز — ساده مثل ساختن یک پست.
              </p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href={startHref}
                  className="inline-flex items-center gap-2.5 rounded-full bg-brand-primary px-9 py-3.5 text-lg font-extrabold text-white
                  shadow-lg shadow-brand-primary/25 transition-colors hover:bg-brand-primary-strong">
                  شروع کن و اولین بازوت رو بساز
                  <ArrowLeft className="size-5" />
                </Link>
              </div>
            </motion.div>
          </section>
        </main>

        {/* ------------------------------- فوتر -------------------------------- */}
        <footer className="mt-auto border-t border-stone-200 bg-white dark:border-gray-800 dark:bg-gray-950">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">
            <div className="flex items-center gap-2.5">
              <Image src="/images/logo3.png" alt="دیمت" width={80} height={28} className="h-7 w-auto object-contain" unoptimized />
              <span className="hidden text-sm text-stone-400 dark:text-gray-500 sm:inline">— فروش با کاتالوگ قیمت، خرید با بازوی خرید</span>
            </div>
            <nav className="flex items-center gap-4 text-xs font-bold text-stone-500 dark:text-gray-400">
              <Link href="/docs/about" className="transition-colors hover:text-brand-primary">درباره ما</Link>
              <Link href="/docs/terms" className="transition-colors hover:text-brand-primary">قوانین</Link>
              <Link href="/feedback" className="transition-colors hover:text-brand-primary">پیشنهادات</Link>
            </nav>
            <p className="text-xs text-stone-400 dark:text-gray-500">هر کسی توی بازار هم فروشنده‌ست، هم خریدار © ۱۴۰۵</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
