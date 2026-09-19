//app/home/Landing.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { useQuery } from '@tanstack/react-query';

import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';

import {
  Apple,
  ArrowLeft,
  ArrowLeftRight,
  CheckCircle2,
  ClipboardList,
  Factory,
  Handshake,
  Link2,
  Milk,
  Package,
  Scissors,
  ShoppingBasket,
  Store,
  Truck,
  UtensilsCrossed,
  Users,
  Building2,
  BadgeCheck,
  CircleDollarSign,
  GitCompare,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*                                  Helpers                                   */
/* -------------------------------------------------------------------------- */

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' as const },
  transition: {
    duration: 0.6,
    delay,
    ease: 'easeOut' as const,
  },
});

/* -------------------------------------------------------------------------- */
/*                              Mini catalog                                  */
/* -------------------------------------------------------------------------- */

function MiniCatalog() {
  const rows = [
    {
      icon: Package,
      name: 'مواد شوینده',
      price: '۴۸۵٬۰۰۰',
    },
    {
      icon: Milk,
      name: 'محصول شماره ۲',
      price: '۳۲۰٬۰۰۰',
    },
    {
      icon: Apple,
      name: 'محصول شماره ۳',
      price: '۱۸۵٬۰۰۰',
    },
  ];

  return (
      <motion.div
          whileHover={{ y: -6 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="w-44 rotate-2 rounded-2xl border-2 border-brand-primary-tint bg-white p-3 shadow-lg shadow-stone-200/70
        dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/50 sm:w-48"
      >
        <div className="flex items-center gap-2 border-b border-dashed border-stone-200 pb-2 dark:border-gray-700">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-primary-soft dark:bg-brand-primary/15">
          <Store className="size-3.5 text-brand-primary-strong dark:text-brand-primary" />
        </span>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black text-stone-700 dark:text-gray-200">
              بازوی فروش
            </div>

            <div className="mt-0.5 text-[8px] text-stone-400 dark:text-gray-500">
              عمده‌فروشی مواد غذایی
            </div>
          </div>

          <span className="shrink-0 rounded-full bg-brand-primary px-2 py-0.5 text-[8px] font-bold text-white">
          قیمت روز
        </span>
        </div>

        <div className="mt-2.5 space-y-2">
          {rows.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-brand-primary-soft text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary">
              <row.icon className="size-3.5" />
            </span>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[9px] font-bold text-stone-700 dark:text-gray-200">
                    {row.name}
                  </div>

                  <div className="mt-0.5 text-[8px] text-stone-400 dark:text-gray-500">
                    موجود
                  </div>
                </div>

                <span className="shrink-0 rounded-md border border-brand-primary-tint bg-brand-primary-soft px-1.5 py-0.5 text-[9px] font-bold text-brand-primary-strong dark:border-brand-primary/30 dark:bg-brand-primary/10 dark:text-brand-primary">
              {row.price}
            </span>
              </div>
          ))}
        </div>

        <div className="mt-2.5 flex items-center justify-center gap-1 rounded-lg border border-stone-100 bg-stone-50 px-2 py-1 text-[8px] font-medium text-stone-400 dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-500">
          <Link2 className="size-2.5" />
          لینک اختصاصی بازوی فروش
        </div>
      </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               Mini purchase                                */
/* -------------------------------------------------------------------------- */

function MiniPurchase() {
  const offers = [
    {
      name: 'تأمین‌کننده اول',
      price: '۴۸۰٬۰۰۰',
    },
    {
      name: 'تأمین‌کننده دوم',
      price: '۴۶۵٬۰۰۰',
    },

  ];

  return (
      <motion.div
          whileHover={{ y: -6 }}
          transition={{ type: 'spring', stiffness: 300 }}
          className="w-44 -rotate-2 rounded-2xl border-2 border-brand-contrast-tint bg-white p-3 shadow-lg shadow-stone-200/70
        dark:border-gray-700 dark:bg-gray-900 dark:shadow-black/50 sm:w-48"
      >
        <div className="flex items-center gap-2 border-b border-dashed border-stone-200 pb-2 dark:border-gray-700">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-contrast-soft dark:bg-brand-contrast/15">
          <ClipboardList className="size-3.5 text-brand-contrast-strong dark:text-brand-contrast" />
        </span>

          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black text-stone-700 dark:text-gray-200">
              بازوی خرید
            </div>

            <div className="mt-0.5 text-[8px] text-stone-400 dark:text-gray-500">
              خرید ۱۰۰ کارتن
            </div>
          </div>

          <span className="shrink-0 rounded-full bg-brand-contrast px-2 py-0.5 text-[8px] font-bold text-white">
          پیشنهادها
        </span>
        </div>

        <div className="mt-2.5 space-y-1.5">
          {offers.map((offer, i) => (
              <div
                  key={i}
                  className={`rounded-lg border p-2 ${
                      i === 1
                          ? 'border-brand-contrast bg-brand-contrast-soft dark:border-brand-contrast/50 dark:bg-brand-contrast/10'
                          : 'border-stone-100 bg-stone-50 dark:border-gray-800 dark:bg-gray-950/60'
                  }`}
              >
                <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[8px] font-bold text-stone-600 dark:text-gray-300">
                {offer.name}
              </span>

                  <span className="shrink-0 text-[9px] font-black text-stone-800 dark:text-gray-100">
                {offer.price}
              </span>
                </div>

                <div className="mt-1 flex items-center gap-1 text-[7px] text-stone-400 dark:text-gray-500">
                  <CheckCircle2 className="size-2.5" />
                  قیمت + شرایط تأمین
                </div>
              </div>
          ))}
        </div>

        <div className="mt-2.5 flex items-center justify-center gap-1 rounded-lg bg-brand-contrast px-2 py-1 text-[8px] font-bold text-white">
          <GitCompare className="size-2.5" />
          مقایسه پیشنهادها
        </div>
      </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                 Hero Box                                   */
/* -------------------------------------------------------------------------- */

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
          className={`flex-1 rounded-3xl border bg-white p-5 text-center shadow-sm sm:p-6 dark:bg-gray-900 ${
              isPrimary
                  ? 'border-brand-primary-tint dark:border-brand-primary/25'
                  : 'border-brand-contrast-tint dark:border-brand-contrast/25'
          }`}
      >
      <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
              isPrimary
                  ? 'bg-brand-primary-soft text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary'
                  : 'bg-brand-contrast-soft text-brand-contrast-strong dark:bg-brand-contrast/15 dark:text-brand-contrast'
          }`}
      >
        <Icon className="size-3.5" />
        {chip}
      </span>

        <h2 className="mt-3  font-black text-stone-900 dark:text-gray-100">
          {question}
        </h2>

        <p className="mx-auto text-justify mt-2.5 max-w-md text-sm leading-7 text-stone-600 dark:text-gray-400">
          {body}
        </p>
      </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Feature Card                                  */
/* -------------------------------------------------------------------------- */

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
          className="flex flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex items-center gap-3 px-6 pb-4 pt-6 sm:px-7">
        <span
            className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
                isPrimary
                    ? 'bg-brand-primary text-white'
                    : 'bg-brand-contrast text-white'
            }`}
        >
          <Icon className="size-5" />
        </span>

          <div>
            <p
                className={`text-[11px] font-bold ${
                    isPrimary
                        ? 'text-brand-primary-strong dark:text-brand-primary'
                        : 'text-brand-contrast-strong dark:text-brand-contrast'
                }`}
            >
              {chip}
            </p>

            <h3 className="text-xl font-black text-stone-900 dark:text-gray-100">
              {title}
            </h3>
          </div>
        </div>

        <p className="px-6 text-sm leading-7 text-stone-600 dark:text-gray-400 sm:px-7">
          {desc}
        </p>

        <ul className="space-y-2.5 px-6 py-5 sm:px-7">
          {bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2
                    className={`mt-1 size-4 shrink-0 ${
                        isPrimary
                            ? 'text-brand-primary'
                            : 'text-brand-contrast'
                    }`}
                />

                <p className="text-sm leading-6 text-stone-600 dark:text-gray-300">
                  {b}
                </p>
              </li>
          ))}
        </ul>
      </motion.article>
  );
}

/* -------------------------------------------------------------------------- */
/*                           Network Match Card                               */
/* -------------------------------------------------------------------------- */

function NetworkMatchCard({
                            icon: Icon,
                            title,
                            subtitle,
                            examples,
                            tone,
                            delay,
                          }: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  examples: string[];
  tone: 'primary' | 'contrast';
  delay: number;
}) {
  const isPrimary = tone === 'primary';

  return (
      <motion.div
          {...fadeUp(delay)}
          className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-7"
      >
        <div className="flex items-start gap-4">
        <span
            className={`grid size-12 shrink-0 place-items-center rounded-2xl ${
                isPrimary
                    ? 'bg-brand-primary-soft text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary'
                    : 'bg-brand-contrast-soft text-brand-contrast-strong dark:bg-brand-contrast/15 dark:text-brand-contrast'
            }`}
        >
          <Icon className="size-6" />
        </span>

          <div>
            <h3 className="text-lg font-black text-stone-900 dark:text-gray-100">
              {title}
            </h3>

            <p className="mt-1.5 text-sm leading-6 text-stone-600 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {examples.map((example, index) => (
              <div
                  key={index}
                  className="flex items-center gap-2 rounded-xl bg-stone-50 px-3 py-2.5 dark:bg-gray-950/60"
              >
            <span
                className={`size-1.5 shrink-0 rounded-full ${
                    isPrimary
                        ? 'bg-brand-primary'
                        : 'bg-brand-contrast'
                }`}
            />

                <span className="text-xs font-bold text-stone-600 dark:text-gray-300">
              {example}
            </span>
              </div>
          ))}
        </div>
      </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Start Pick                                    */
/* -------------------------------------------------------------------------- */

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
          className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3.5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
      <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${
              isPrimary
                  ? 'bg-brand-primary-soft text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary'
                  : 'bg-brand-contrast-soft text-brand-contrast-strong dark:bg-brand-contrast/15 dark:text-brand-contrast'
          }`}
      >
        <Icon className="size-5" />
      </span>

        <div className="min-w-0">
          <p className="truncate text-[15px] font-black text-stone-800 dark:text-gray-100">
            {title}
          </p>

          <p
              className={`mt-0.5 flex items-center gap-1 text-xs font-bold ${
                  isPrimary
                      ? 'text-brand-primary-strong dark:text-brand-primary'
                      : 'text-brand-contrast-strong dark:text-brand-contrast'
              }`}
          >
            <ArrowLeft className="size-3" />
            {tool}
          </p>
        </div>
      </motion.div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              Live Catalogs                                 */
/* -------------------------------------------------------------------------- */

function LiveFromDaymat() {
  const { data: featured } = useQuery({
    queryKey: ['landing', 'featured-catalogs'],
    queryFn: () => apiService.catalog.getFeatured(4),
    staleTime: 60 * 1000,
  });

  const catalogs = (featured?.items ?? []).slice(0, 4);

  if (!catalogs.length) return null;

  return (
      <section
          aria-label="بازوهای فروشی آی مچ"
          className="mx-auto max-w-6xl px-4 py-14 sm:px-6"
      >
        <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary-soft px-3 py-1 text-xs font-bold text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary">
          <Store className="size-3.5" />
          بازار واقعی
        </span>

          <h2 className="mt-3 text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">
            همین حالا در آی مچ
          </h2>

          <p className="mt-3 leading-7 text-stone-600 dark:text-gray-400">
            بازوهای فروشی واقعی فروشنده‌ها را ببین؛ مشتری‌ها هم دقیقاً از همین
            مسیر به فروشنده‌های موردنیازشان وصل می‌شوند.
          </p>
        </motion.div>

        <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2">
          {catalogs.map((c: any, i: number) => (
              <motion.div key={c.id ?? i} {...fadeUp(i * 0.06)}>
                <Link
                    href={`/${c.slug || c.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm transition-colors
                hover:border-brand-primary-tint hover:bg-brand-primary-soft/50
                dark:border-gray-800 dark:bg-gray-900 dark:hover:bg-gray-800/60"
                >
                  {c.logoUrl ? (
                      <Image
                          src={c.logoUrl}
                          alt=""
                          width={40}
                          height={40}
                          className="size-10 rounded-xl object-cover"
                          unoptimized
                      />
                  ) : (
                      <span className="grid size-10 place-items-center rounded-xl bg-brand-primary-soft text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary">
                  <Store className="size-4.5" />
                </span>
                  )}

                  <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-extrabold text-stone-800 dark:text-gray-200">
                  {c.name}
                </span>

                    {c.city ? (
                        <span className="block text-[11px] text-stone-400 dark:text-gray-500">
                    {c.city}
                  </span>
                    ) : null}
              </span>

                  <ArrowLeft className="size-4 shrink-0 text-stone-300 dark:text-gray-600" />
                </Link>
              </motion.div>
          ))}
        </div>
      </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                          Specialized Markets Board                          */
/* -------------------------------------------------------------------------- */

/**
 * تابلوی بازار — دو بازوی خرید و فروش داخل تابلوی بازار می‌افتند و کنار هم می‌نشینند.
 * فقط گرافیک؛ متن ندارد.
 */
function MarketBoardIllustration() {
  return (
      <div className="relative mx-auto mt-10 max-w-md">
        {/* قاب تابلو */}
        <div className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">

          {/* سرِ تابلو */}
          <div className="flex items-center justify-between rounded-2xl bg-stone-900 px-4 py-2.5 dark:bg-gray-800">
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-white">
            <Store className="size-3.5" />
            تابلوی بازار
          </span>

            <span className="text-[10px] text-stone-400">صنف × شهر</span>
          </div>

          {/* دو بازو که داخل تابلو می‌افتند */}
          <div className="mt-5 flex items-center justify-center gap-3">
            <motion.div
                initial={{ opacity: 0, y: -44 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: 0.15, ease: 'easeOut' }}
            >
              <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="flex items-center gap-1.5 rounded-full bg-brand-primary-soft px-3.5 py-2 text-xs font-extrabold
              text-brand-primary-strong ring-1 ring-brand-primary-tint
              dark:bg-brand-primary/15 dark:text-brand-primary dark:ring-brand-primary/25"
              >
                <Store className="size-3.5" />
                بازوی فروش
              </motion.div>
            </motion.div>

            {/* گرهٔ اتصال */}
            <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ delay: 0.65, type: 'spring', stiffness: 260, damping: 14 }}
                className="grid size-8 place-items-center rounded-full border border-stone-200 bg-white shadow-sm
            dark:border-gray-700 dark:bg-gray-950"
            >
              <ArrowLeftRight className="size-3.5 text-stone-500 dark:text-gray-300" />
            </motion.span>

            <motion.div
                initial={{ opacity: 0, y: -44 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: 0.35, ease: 'easeOut' }}
            >
              <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
                  className="flex items-center gap-1.5 rounded-full bg-brand-contrast-soft px-3.5 py-2 text-xs font-extrabold
              text-brand-contrast-strong ring-1 ring-brand-contrast-tint
              dark:bg-brand-contrast/15 dark:text-brand-contrast dark:ring-brand-contrast/25"
              >
                <ClipboardList className="size-3.5" />
                بازوی خرید
              </motion.div>
            </motion.div>
          </div>

          {/* نتیجه: تشکیل بازار */}
          <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="mt-4 text-center text-[11px] font-bold text-stone-500 dark:text-gray-400"
          >
            بازار تخصصی همون صنف، توی همون شهر تشکیل می‌شه
          </motion.p>
          <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: 0.9, duration: 0.5 }}
              className="mt-4 text-center text-[11px] font-bold text-stone-500 dark:text-gray-400"
          >
            بازارهای صنفی می تونن در سطح استان و کشور هم توسعه پیدا کنن.
          </motion.p>
        </div>
      </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                                  Landing                                   */
/* -------------------------------------------------------------------------- */

export default function Landing() {
  const { isAuthenticated } = useSelector((s: RootState) => s.auth);

  const startHref = isAuthenticated
      ? '/business/register'
      : `/login?redirect=${encodeURIComponent('/business/register')}`;

  return (
      <div className="min-h-screen bg-white text-stone-900 dark:bg-gray-950 dark:text-gray-100">
        <div className="flex min-h-screen flex-col pt-16">

          {/* ------------------------------------------------------------------ */}
          {/* Header                                                             */}
          {/* ------------------------------------------------------------------ */}

          <header
              className="fixed inset-x-0 top-0 z-50 border-b border-stone-200/80 bg-white/85 backdrop-blur-md
          dark:border-gray-800 dark:bg-gray-950/85"
          >
            <div className="mx-auto flex h-18 max-w-6xl items-center justify-between px-4 sm:px-6">
              <Link
                  href="/"
                  className="flex items-center gap-2.5"
                  aria-label="آی مچ"
              >
                <div className="transition-colors 0">
                  <Image
                      src="/images/logo3.png"
                      alt="آی مچ"
                      width={500}
                      height={300}
                      className="h-12 w-auto object-contain"
                      unoptimized
                      priority
                  />
                </div>
              </Link>

              {isAuthenticated ? (
                  <Link
                      href="/my-catalogs"
                      className="rounded-full bg-stone-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-stone-700
                  dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-white"
                  >
                    پنل من
                  </Link>
              ) : (
                  <Link
                      href="/login"
                      className="rounded-full border border-stone-300 px-4 py-2 text-xs font-bold text-stone-700 transition-colors
                  hover:border-brand-primary hover:text-brand-primary-strong
                  dark:border-gray-600 dark:text-gray-200 dark:hover:border-brand-primary"
                  >
                    ورود | عضویت
                  </Link>
              )}
            </div>
          </header>

          <main className="flex-1">

            {/* ================================================================ */}
            {/* HERO                                                              */}
            {/* ================================================================ */}

            <section className="relative overflow-hidden">
              <div className="mx-auto max-w-8xl px-4 pb-14 pt-12 sm:px-6 sm:pt-16">

                <motion.div {...fadeUp()} className="mx-auto max-w-[500px] text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary-tint bg-brand-primary-soft px-3.5 py-1.5 text-xs font-bold text-brand-primary-strong dark:border-brand-primary/25 dark:bg-brand-primary/10 dark:text-brand-primary">
                  <ArrowLeftRight className="size-3.5" />
                  آی مچ، پلتفرم ساخت و انطباق بازوهای خرید و فروش
                </span>

                  <h1 className="mt-5 pb-4 pt-3 md:pt-6 text-xl  font-black leading-[1.5] tracking-tight text-stone-950 dark:text-white sm:text-xl md:text-[1.5rem] md:leading-[1.35]">
                    آی مچ با اتصال هوشمند بازوهای خرید و فروش به یکدیگر، شبکه خرید و فروش شما رو گسترش میده.
                  </h1>

                  {/*  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-primary-tint bg-brand-primary-soft px-3.5 py-1.5 text-xs font-bold text-brand-primary-strong dark:border-brand-primary/25 dark:bg-brand-primary/10 dark:text-brand-primary">
                  <ArrowLeftRight className="size-3.5" />
                  آی مچ، پلتفرم اتصال خریداران عمده به تامین کنندگان
                </span>

                  <h1 className="mt-5 pb-4 pt-3 md:pt-6   font-black leading-[1.5] tracking-tight text-stone-950 dark:text-white ">
                    آی‌مچ، نیاز لحظه ای خریداران عمده رو از بازوی خریدشون می‌گیره و در بازوی فروش تأمین‌کنندگانی که همون کالا رو با حجم کافی دارند نشون میده؛ تا قیمت و شرایط رقابتی خودشون رو پیشنهاد بدن.

                  </h1>*/}
                </motion.div>

                {/* دو مسیر اصلی */}

                <div className="relative mx-auto mt-10  flex max-w-4xl flex-col gap-4 md:flex-row md:gap-6">

                  <HeroBox
                      tone="primary"
                      icon={Store}
                      chip="با بازوی فروش، بگو چی برای فروش عمده داری"
                      question="چه محصول یا خدماتی رو عمده می‌فروشی؟"
                      body=" بازوی فروش محصولات یا خدماتت رو بساز. لینکش رو به مشتریان خودت بفرست؛ هر مشتری که به این بازو وصل بشه ، بخشی از شبکه فروشت میشه و همیشه کاتالوگ آنلاین قیمتهای شما رو داره. آی مچ هم، خریداران  کالا یا خدمتی که تو داری رو در لحظه ثبت نیاز، بهت معرفی می کنه."
                      delay={0.1}
                  />

                  <motion.div
                      {...fadeUp(0.2)}
                      className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 md:block"
                  >
                  <span className="grid size-14 place-items-center rounded-full border border-stone-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <ArrowLeftRight className="size-6 text-stone-500 dark:text-gray-300" />
                  </span>
                  </motion.div>

                  <HeroBox
                      tone="contrast"
                      icon={ClipboardList}
                      chip="با بازوی خرید نیاز خرید عمده ات رو اعلام کن"
                      question="چه محصولات یا خدماتی رو عمده می‌خری؟"
                      body="بازوی خرید کسب و کارت رو بساز، لیست خریدت رو وارد کن. لینک رو برای تأمین‌کنندگان خودت بفرست. هر وقت نیاز داشتی، قیمت‌گیری بعضی اقلام رو فعال کن تا از تامین کنندگانت، قیمت و شرایط رقابتی بگیری. آی مچ هم، در لحظه ای که نیاز داری، تامین کنندگان مناسب همون کالا یا خدمت رو در همون حجم مورد نیاز، بهت پیشنهاد میده."
                      delay={0.15}
                  />
                </div>


                {/* ================================================================ */}
                {/* START                                                             */}
                {/* ================================================================ */}

                <section
                    aria-label="از کجا شروع کنی"
                    className="border-t border-stone-100 bg-white dark:border-gray-800/60 dark:bg-gray-950"
                >
                  <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">

                    <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
                      <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">
                        کدام بازو رو بسازم؟
                      </h2>

                      <p className="mt-3 leading-7 text-stone-600 dark:text-gray-400">
                        اگر به هر نحوی فروشنده عمده کالا یا خدماتی. این بازوی فروشه که بیشتر به دردت می خوره. و اگر خرده فروشی یا به هر نحوی خرید عمده داری، بازوی خرید بیشتر به کارت میاد. اما در کل محدودیتی برای ساخت بازوی خرید یا فروش نداری. به هر کدام به هر نحوی نیاز داشتی می تونی نامحدد بسازی. چند مثال فقط برای آشنایی...
                      </p>
                    </motion.div>

                    <div className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">

                      <StartPick
                          icon={Truck}
                          title="ویزیتور"
                          tone="primary"
                          tool="بازوی فروش محصولات"
                      />

                      <StartPick
                          icon={Factory}
                          title="عمده فروش"
                          tone="primary"
                          tool="بازوی خرید و فروش"
                      />

                      <StartPick
                          icon={ShoppingBasket}
                          title="خرده فروش"
                          tone="contrast"
                          tool="بازوی خرید"
                      />

                      <StartPick
                          icon={Factory}
                          title="کارخانه"
                          tone="primary"
                          tool="بازوی خرید مواد اولیه"
                      />

                      <StartPick
                          icon={Factory}
                          title="تولید کننده"
                          tone="primary"
                          tool="بازوی فروش محصولات"
                      />

                      <StartPick
                          icon={UtensilsCrossed}
                          title="رستوران، تالار، هنل"
                          tone="contrast"
                          tool="بازوی خرید مواد اولیه"
                      />

                      <StartPick
                          icon={UtensilsCrossed}
                          title="آرایشگاه"
                          tone="contrast"
                          tool="بازوی خرید لوازم آرایشی"
                      />

                    </div>
                  </div>
                </section>


                <motion.div
                    {...fadeUp(0.25)}
                    className="mx-auto mt-8 max-w-2xl text-center"
                >
                  <p className="text-sm font-bold leading-7 text-stone-700 dark:text-gray-300">
                    فروشنده و خریدار، دقیقاً جایی به هم می‌رسند که محصول یا خدمت موردنیاز
                    وجود دارد.
                  </p>
                </motion.div>

                <motion.div
                    {...fadeUp(0.3)}
                    className="mt-7 flex flex-col items-center gap-3"
                >
                  <Link
                      href={startHref}
                      className="inline-flex h-13 items-center gap-2.5 rounded-full bg-brand-primary px-10 py-3.5 text-lg font-extrabold text-white
                    shadow-lg shadow-brand-primary/25 transition-colors hover:bg-brand-primary-strong"
                  >
                    شروع کن و رایگان بساز
                    <ArrowLeft className="size-5" />
                  </Link>

                  <p className="text-xs font-medium text-stone-400 dark:text-gray-500">
                    ساخت اولین بازو، فقط چند دقیقه زمان می‌برد.
                  </p>
                </motion.div>

                {/* تصویر مفهومی */}

                <motion.div
                    {...fadeUp(0.35)}
                    className="relative mx-auto mt-12 flex max-w-lg items-center justify-center gap-4 sm:gap-10"
                >
                  <MiniCatalog />

                  <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      className="z-10 -mx-5 grid size-10 shrink-0 place-items-center rounded-full border border-stone-200 bg-white shadow-md dark:border-gray-700 dark:bg-gray-900"
                  >
                    <ArrowLeftRight className="size-4 text-stone-500 dark:text-gray-300" />
                  </motion.div>

                  <MiniPurchase />
                </motion.div>
              </div>
            </section>

            {/* ================================================================ */}
            {/* SPECIALIZED MARKETS — اشاره به بازارهای صنفی                      */}
            {/* ================================================================ */}

            <section
                aria-label="بازارهای صنفی"
                className="mx-auto max-w-6xl px-4 py-14 sm:px-6"
            >
              <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary-soft px-3 py-1 text-xs font-bold text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary">
                  <Store className="size-3.5" />
                  معرفی بازارهای صنفی آی مچ.
                </span>

                <h2 className="mt-4 text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">
                  اما این همه چیز نیست، بازوهای مرتبط در بازارهای تخصصی جمع می شن و بازارهای صنفی رو تشکیل میدن
                </h2>

                <p className="mt-3 text-justify leading-8 text-stone-600 dark:text-gray-400">
                  غیر از بازوهای خرید و فروش که صفحات شخصی با مالکیت کاربر هستند آی مچ بازارهای خریدو فروش تخصصی هر صنف رو هم کم کم تشکیل می ده.
                  با به حد نصاب رسیدن بازوهای خرید و فروش در هر صنف و شهر، بازار صنفی همون
                  صنف کم‌کم تشکیل می‌شه؛ کسب‌وکارها درخواست عضویت می‌دن و بعد از تایید مدیر
                  بازار عضو می‌شن. اینطوری تامین‌کننده‌ها و خریدارها بیشتر دیده می‌شن و بازارها
                  هم به جذب بازوهای جدید کمک می‌کنن.
                </p>
              </motion.div>

              <motion.div {...fadeUp(0.15)}>
                <MarketBoardIllustration />
              </motion.div>
            </section>

            {/* ================================================================ */}
            {/* MATCHING                                                         */}
            {/* ================================================================ */}

            <section
                className="border-y border-stone-100 bg-stone-50/60 dark:border-gray-800/60 dark:bg-gray-900/40"
                aria-label="مچ شدن خریدار و فروشنده"
            >
              <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">

                <motion.div
                    {...fadeUp()}
                    className="mx-auto max-w-3xl text-center"
                >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-3 py-1 text-xs font-bold text-white dark:bg-gray-100 dark:text-gray-900">
                  <Handshake className="size-3.5" />
                  اصل ماجرا
                </span>

                  <h2 className="mt-4 text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">
                    هر فروشنده، خریدارهای خودش رو داره
                  </h2>

                  <p className="mt-4 text-justify text-sm leading-8 text-stone-600 dark:text-gray-400 sm:text-base">
                    آی مچ قرار نیست همه را به همه وصل کند؛ هدفش اینه که هر فروشنده در بازوی فروش خودش با خریدارانی روبه‌رو بشه که واقعاً مشتری محصولاتش هستند، و هر خریدار هم با کمک بازوی خریدش به تأمین‌کننده‌هایی وصل بشه که واقعاً می تونن نیازش را به بهترین نحو تأمین کنند.

                  </p>
                </motion.div>

                <div className="mx-auto mt-9 grid max-w-5xl gap-5 md:grid-cols-2">

                  <NetworkMatchCard
                      icon={Store}
                      title="شبکه فروشنده"
                      subtitle="بازوی فروش فقط یک صفحه نمایش محصول نیست؛ نقطه شروع توسعه شبکه مشتری های شماست."
                      tone="primary"
                      delay={0.1}
                      examples={[
                        'عمده‌فروش مواد غذایی ← سوپرمارکت‌های شهر',
                        'تولیدکننده مواد شیمیایی ← کارخانه‌های مصرف‌کننده',
                        'تأمین‌کننده مصالح ← پیمانکاران و سازندگان',
                      ]}
                  />

                  <NetworkMatchCard
                      icon={ClipboardList}
                      title="شبکه خریدار"
                      subtitle="بازوی خرید فقط یک لیست خرید نیست؛ نقطه شروع توسعه تامین کننده های شماست."
                      tone="contrast"
                      delay={0.2}
                      examples={[
                        'سوپرمارکت ← چند شرکت پخش و عمده‌فروش',
                        'کارخانه ← چند تأمین‌کننده مواد اولیه',
                        'رستوران ← چند تأمین‌کننده مواد و اقلام مصرفی',
                      ]}
                  />

                </div>

                <motion.div
                    {...fadeUp(0.25)}
                    className="mx-auto mt-7 flex max-w-3xl items-center justify-center gap-3 text-center"
                >
                  <span className="hidden h-px flex-1 bg-stone-200 dark:bg-gray-700 sm:block" />

                  <div className="rounded-full border border-brand-primary-tint bg-white px-5 py-2.5 text-xs font-bold leading-6 text-stone-600 shadow-sm dark:border-brand-primary/25 dark:bg-gray-900 dark:text-gray-300">
                    محصول تو ←→ خریدار واقعی
                    <span className="mx-2 text-stone-300 dark:text-gray-600">|</span>
                    نیاز تو ←→ تأمین‌کننده واقعی
                  </div>

                  <span className="hidden h-px flex-1 bg-stone-200 dark:bg-gray-700 sm:block" />
                </motion.div>
              </div>
            </section>

            {/* ================================================================ */}
            {/* TWO TOOLS                                                        */}
            {/* ================================================================ */}

            <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
              <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
                <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">
                  برای هر طرف معامله، ابزار خودش
                </h2>

                <p className="mt-3 leading-7 text-stone-600 dark:text-gray-400">
                  فروشنده با بازوی فروش مشتری می‌سازد؛ خریدار با بازوی خرید
                  تأمین‌کننده پیدا می‌کند.
                </p>
              </motion.div>

              <div className="mt-9 grid gap-5 md:grid-cols-2 md:gap-7">

                <FeatureCard
                    tone="primary"
                    icon={Store}
                    chip="برای فروش"
                    title="بازوی فروش"
                    desc="محصولاتت را با قیمت و مشخصات در بازوی فروش با قیمت های به روز قرار بده و اون رو با خریدارهای واقعی بازار به اشتراک بگذار."
                    bullets={[
                      'حالا خریداران شبکه ای که خودت اعضاشو انتخاب کردی و اونا هم تایید کردن، قیمتهاتو می بینن',
                      'قیمت‌ها رو به‌روز کن؛ خریدارهای متصل به بازوی فروشت همیشه آخرین قیمت را می بینن و سفارش میدن.',
                      'برای اینکه خریدارای جدید پیدا کنی آی مچ بازوهای خرید مرتبط رو در اختیارت قرار میده تا براشون، پیشنهاد تامین بفرستی.اگر قبول کنن، جز شبکه ات میشن.',
                    ]}
                    delay={0.05}
                />

                <FeatureCard
                    tone="contrast"
                    icon={ClipboardList}
                    chip="برای خرید"
                    title="بازوی خرید"
                    desc="لیست خرید رو یکبار تشکیل بده. برای قیمت گیری فقط کالاهاتو از این لیست به لیست قیمت گیری بفرست و تمام. ."
                    bullets={[
                      'به‌جای تماس و پرس‌وجو از چند فروشنده، فقط از لیست خریدت،بگو کدوما بره برای قیمت گیری.',
                      'حالا این کالاها یا خدمات میرن به لیست درخواست قیمت تامین کنندگانت و تو پیشنهادات رو دریافت می کنی.',
                      'هر قدر شبکه تامین کنندگانت بزرگتر بشه ، پیشنهادهای بهتری از قیمت و شرایط داری.',
                    ]}
                    delay={0.15}
                />

              </div>
            </section>

            {/* ================================================================ */}
            {/* COMPETITIVE BUYING                                              */}
            {/* ================================================================ */}

            <section
                className="border-y border-stone-100 bg-white dark:border-gray-800/60 dark:bg-gray-950"
                aria-label="خرید رقابتی"
            >
              <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">

                <div className="grid items-center gap-10 md:grid-cols-2">

                  <motion.div {...fadeUp()}>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-contrast-soft px-3 py-1 text-xs font-bold text-brand-contrast-strong dark:bg-brand-contrast/15 dark:text-brand-contrast">
                    <CircleDollarSign className="size-3.5" />
                    خرید رقابتی
                  </span>

                    <h2 className="mt-4 text-2xl font-black leading-[1.6] text-stone-900 dark:text-gray-100 sm:text-3xl">
                      یک نیاز، چند پیشنهاد
                    </h2>

                    <p className="mt-4 text-sm leading-8 text-stone-600 dark:text-gray-400 sm:text-base">
                      وقتی یه خریدار نیازش را اعلام می کنه، چند تأمین‌کننده
                      می تونن برای تأمین اون پیشنهاد بدن. خریدار پیشنهادها را
                      کنار هم می بینه و بر اساس قیمت، شرایط، اعتبار و معیارهای خودش
                      تصمیم می گیره.
                    </p>

                    <div className="mt-6 space-y-3">
                      {[
                        'نیاز خرید را ثبت کن',
                        'پیشنهاد تأمین‌کننده‌ها را دریافت کن',
                        'قیمت و شرایط را مقایسه کن',
                        'بهترین تأمین‌کننده را انتخاب کن',
                      ].map((item, index) => (
                          <div
                              key={index}
                              className="flex items-center gap-3"
                          >
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-contrast text-xs font-black text-white">
                          {index + 1}
                        </span>

                            <span className="text-sm font-bold text-stone-700 dark:text-gray-300">
                          {item}
                        </span>
                          </div>
                      ))}
                    </div>
                  </motion.div>

                  <motion.div
                      {...fadeUp(0.15)}
                      className="rounded-3xl border border-brand-contrast-tint bg-brand-contrast-soft/50 p-5 dark:border-brand-contrast/25 dark:bg-brand-contrast/5 sm:p-7"
                  >
                    <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                      <div className="flex items-center justify-between gap-3 border-b border-stone-100 pb-4 dark:border-gray-800">
                        <div>
                          <p className="text-[11px] font-bold text-brand-contrast-strong dark:text-brand-contrast">
                            بازوی خرید
                          </p>

                          <h3 className="mt-1 text-sm font-black text-stone-900 dark:text-gray-100">
                            خرید ۵۰۰ کیلو مواد اولیه
                          </h3>
                        </div>

                        <span className="rounded-full bg-brand-contrast-soft px-2.5 py-1 text-[9px] font-bold text-brand-contrast-strong dark:bg-brand-contrast/15 dark:text-brand-contrast">
                        ۳ پیشنهاد
                      </span>
                      </div>

                      <div className="mt-4 space-y-2.5">
                        {[
                          ['تأمین‌کننده الف', '۱۲۰٬۰۰۰', 'تحویل ۲ روزه'],
                          ['تأمین‌کننده ب', '۱۱۷٬۵۰۰', 'تحویل ۳ روزه'],
                          ['تأمین‌کننده ج', '۱۱۸٬۰۰۰', 'تحویل ۱ روزه'],
                        ].map(([name, price, delivery], index) => (
                            <div
                                key={index}
                                className={`rounded-xl border p-3 ${
                                    index === 2
                                        ? 'border-brand-contrast bg-brand-contrast-soft dark:border-brand-contrast/40 dark:bg-brand-contrast/10'
                                        : 'border-stone-100 bg-stone-50 dark:border-gray-800 dark:bg-gray-950/50'
                                }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                            <span className="text-xs font-bold text-stone-700 dark:text-gray-300">
                              {name}
                            </span>

                                <span className="text-sm font-black text-stone-900 dark:text-gray-100">
                              {price}
                            </span>
                              </div>

                              <div className="mt-1.5 flex items-center gap-1 text-[10px] text-stone-400 dark:text-gray-500">
                                <CheckCircle2 className="size-3" />
                                {delivery}
                              </div>
                            </div>
                        ))}
                      </div>

                      <button
                          type="button"
                          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-contrast py-3 text-xs font-black text-white"
                      >
                        <GitCompare className="size-4" />
                        مقایسه پیشنهادها
                      </button>
                    </div>
                  </motion.div>

                </div>
              </div>
            </section>

            {/* ================================================================ */}
            {/* SELLER NETWORK                                                   */}
            {/* ================================================================ */}

            <section
                className="border-t border-stone-100 bg-stone-50/60 dark:border-gray-800/60 dark:bg-gray-900/40"
                aria-label="شبکه تجاری"
            >
              <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">

                <motion.div
                    {...fadeUp()}
                    className="mx-auto max-w-3xl text-center"
                >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-primary-soft px-3 py-1 text-xs font-bold text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary">
                  <Users className="size-3.5" />
                  شبکه تجاری
                </span>

                  <h2 className="mt-4 text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">
                    بازوی فروشت، به مرور شبکه شبکه بزرگ مشتری هات میشه
                  </h2>

                  <p className="mt-3 leading-8 text-stone-600 dark:text-gray-400">
                    بازوی فروش رو برای مشتری‌ها بفرست. هر خریدار مناسب که به اون وصل
                    بشه، برای همیشه در شبکه تجاری تو باقی می مونه و می تونی
                    محصولات و قیمت‌های جدیدت را مستقیم در اختیارش بگذاری.
                  </p>
                </motion.div>

                <div className="mx-auto mt-9 grid max-w-4xl gap-4 sm:grid-cols-3">

                  {[
                    {
                      icon: Store,
                      title: 'بازوی فروش بساز',
                      text: 'محصولات و قیمت‌هایت را یکجا قرار بده.',
                    },
                    {
                      icon: Link2,
                      title: 'لینک را منتشر کن',
                      text: 'برای مشتری‌ها و شبکه اجتماعی‌ات بفرست.',
                    },
                    {
                      icon: Users,
                      title: 'شبکه بساز',
                      text: 'خریدارهای واقعی‌ات جز شبکه ات می شن.',
                    },
                  ].map((item, index) => (
                      <motion.div
                          key={item.title}
                          {...fadeUp(index * 0.1)}
                          className="rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900"
                      >
                    <span className="mx-auto grid size-11 place-items-center rounded-2xl bg-brand-primary-soft text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary">
                      <item.icon className="size-5" />
                    </span>

                        <h3 className="mt-3 text-sm font-black text-stone-900 dark:text-gray-100">
                          {item.title}
                        </h3>

                        <p className="mt-1.5 text-xs leading-6 text-stone-500 dark:text-gray-400">
                          {item.text}
                        </p>
                      </motion.div>
                  ))}

                </div>
              </div>
            </section>

            {/* ================================================================ */}
            {/* EXAMPLES                                                         */}
            {/* ================================================================ */}

            <section
                aria-label="نمونه کسب‌وکارها"
                className="mx-auto max-w-6xl px-4 py-14 sm:px-6"
            >
              <motion.div {...fadeUp()} className="mx-auto max-w-2xl text-center">
                <h2 className="text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">
                  هر کسب‌وکار، شبکه مخصوص خودش را دارد
                </h2>

                <p className="mt-3 leading-7 text-stone-600 dark:text-gray-400">
                  آی مچ خریدار و فروشنده رو بر اساس چیزی که واقعاً می‌خرند و
                  می‌فروشند به هم متصل می‌کند.
                </p>
              </motion.div>

              <div className="mx-auto mt-9 grid max-w-5xl gap-4 md:grid-cols-2">

                {[
                  {
                    sellerIcon: Truck,
                    seller: 'عمده‌فروش مواد غذایی',
                    buyerIcon: ShoppingBasket,
                    buyer: 'سوپرمارکت‌های شهر',
                    text: 'بازوی فروش عمده‌فروش محل نمایش محصولات و قیمت‌های او برای سوپرمارکت‌هایی می‌شود که از او خرید می‌کنند.',
                    tone: 'primary',
                  },
                  {
                    sellerIcon: Factory,
                    seller: 'تولیدکننده مواد شیمیایی',
                    buyerIcon: Building2,
                    buyer: 'کارخانه‌های مصرف‌کننده',
                    text: 'خریداران واقعی مواد شیمیایی در بازوی فروش همان تولیدکننده قرار می‌گیرند؛ نه مخاطبان عمومی و نامرتبط.',
                    tone: 'primary',
                  },
                  {
                    sellerIcon: Truck,
                    seller: 'شرکت پخش',
                    buyerIcon: Store,
                    buyer: 'فروشگاه‌ها و خرده‌فروش‌ها',
                    text: 'خرده‌فروش‌ها می‌توانند قیمت‌های روز شرکت‌های پخش مختلف را ببینند و برای خرید پیشنهاد بگیرند.',
                    tone: 'contrast',
                  },
                  {
                    sellerIcon: Factory,
                    seller: 'تأمین‌کننده مواد اولیه',
                    buyerIcon: Factory,
                    buyer: 'کارخانه خریدار',
                    text: 'کارخانه می‌تواند یک نیاز خرید را برای چند تأمین‌کننده مناسب ارسال کند و پیشنهادها را با هم مقایسه کند.',
                    tone: 'contrast',
                  },
                ].map((item, index) => {
                  const isPrimary = item.tone === 'primary';

                  return (
                      <motion.div
                          key={index}
                          {...fadeUp(index * 0.07)}
                          className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:p-6"
                      >
                        <div className="flex items-center gap-3">

                          <div
                              className={`grid size-11 place-items-center rounded-2xl ${
                                  isPrimary
                                      ? 'bg-brand-primary-soft text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary'
                                      : 'bg-brand-contrast-soft text-brand-contrast-strong dark:bg-brand-contrast/15 dark:text-brand-contrast'
                              }`}
                          >
                            <item.sellerIcon className="size-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-stone-400 dark:text-gray-500">
                              فروشنده
                            </div>

                            <div className="mt-0.5 text-sm font-black text-stone-800 dark:text-gray-100">
                              {item.seller}
                            </div>
                          </div>

                          <ArrowLeftRight className="size-4 shrink-0 text-stone-300 dark:text-gray-600" />

                          <div
                              className={`grid size-11 place-items-center rounded-2xl ${
                                  isPrimary
                                      ? 'bg-brand-primary-soft text-brand-primary-strong dark:bg-brand-primary/15 dark:text-brand-primary'
                                      : 'bg-brand-contrast-soft text-brand-contrast-strong dark:bg-brand-contrast/15 dark:text-brand-contrast'
                              }`}
                          >
                            <item.buyerIcon className="size-5" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-stone-400 dark:text-gray-500">
                              خریدار
                            </div>

                            <div className="mt-0.5 text-sm font-black text-stone-800 dark:text-gray-100">
                              {item.buyer}
                            </div>
                          </div>

                        </div>

                        <p className="mt-4 text-xs leading-7 text-stone-500 dark:text-gray-400">
                          {item.text}
                        </p>
                      </motion.div>
                  );
                })}

              </div>
            </section>





            {/* ================================================================ */}
            {/* LIVE                                                               */}
            {/* ================================================================ */}

            <LiveFromDaymat />

            {/* ================================================================ */}
            {/* FINAL CTA                                                          */}
            {/* ================================================================ */}

            <section
                id="start"
                aria-label="شروع"
                className="mx-auto max-w-5xl px-4 pb-20 sm:px-6"
            >
              <motion.div
                  {...fadeUp()}
                  className="relative overflow-hidden rounded-[2rem] border border-brand-primary-tint bg-brand-primary-soft px-6 py-12 text-center
                dark:border-brand-primary/25 dark:bg-brand-primary/10 sm:px-12"
              >
                <div className="relative z-10">

                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-brand-primary-strong shadow-sm dark:bg-gray-900 dark:text-brand-primary">
                  <BadgeCheck className="size-3.5" />
                  شروع شبکه تجاری
                </span>

                  <h2 className="mt-4 text-2xl font-black text-stone-900 dark:text-gray-100 sm:text-3xl">
                    مشتری‌ها یا تأمین‌کننده‌هایت را از همین‌جا پیدا کن
                  </h2>

                  <p className="mx-auto mt-3.5 max-w-2xl leading-8 text-stone-600 dark:text-gray-400">
                    کسب‌وکارت را ثبت کن، اولین بازوی فروش یا بازوی خریدت را بساز و با ارسال لینک بازوی فروش یا بازوی خرید
                    شبکه سازی و ارتباط با خریداران و فروشنده‌های واقعی بازار را شروع کن.
                  </p>

                  <div className="mt-7">
                    <Link
                        href={startHref}
                        className="inline-flex items-center gap-2.5 rounded-full bg-brand-primary px-10 py-3.5 text-lg font-extrabold text-white
                      shadow-lg shadow-brand-primary/25 transition-colors hover:bg-brand-primary-strong"
                    >
                      شروع کن
                      <ArrowLeft className="size-5" />
                    </Link>
                  </div>

                </div>
              </motion.div>
            </section>

          </main>

          {/* ------------------------------------------------------------------ */}
          {/* Footer                                                             */}
          {/* ------------------------------------------------------------------ */}

          <footer className="mt-auto border-t border-stone-200 bg-white dark:border-gray-800 dark:bg-gray-950">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">

              <div className="flex items-center gap-2.5">
                <Image
                    src="/images/logo3.png"
                    alt="آی مچ"
                    width={200}
                    height={165}
                    className="h-7 w-auto object-contain"
                    unoptimized
                />

                <span className="hidden text-sm text-stone-400 dark:text-gray-500 sm:inline">
                — بازوی فروش برای فروش، بازوی خرید برای تأمین
              </span>
              </div>

              <nav className="flex items-center gap-4 text-xs font-bold text-stone-500 dark:text-gray-400">
                <Link
                    href="/docs/about"
                    className="transition-colors hover:text-brand-primary"
                >
                  درباره ما
                </Link>

                <Link
                    href="/docs/terms"
                    className="transition-colors hover:text-brand-primary"
                >
                  قوانین
                </Link>

                <Link
                    href="/feedback"
                    className="transition-colors hover:text-brand-primary"
                >
                  پیشنهادات
                </Link>
              </nav>

              <p className="text-xs text-stone-400 dark:text-gray-500">
                هر کسب‌وکاری هم می‌فروشد، هم می‌خرد © ۱۴۰۵
              </p>

            </div>
          </footer>

        </div>
      </div>
  );
}