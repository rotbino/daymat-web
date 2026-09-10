// app/my-catalogs/constants.ts
// ثابت‌ها و هلپرهای مشترک صفحهٔ «کاتالوگ‌های من»

import { BadgeCheck, Hourglass, PauseCircle, Store, Package, Wrench, XCircle } from 'lucide-react';

// ─── انواع ───
export type Tab = 'products' | 'publish' | 'stats';
export type StatusFilter = 'all' | 'table' | 'catalog' | 'stale' | 'uncat';

// ─── هلپرهای وضعیت آگهی ───
export const isAdExpired = (ad: any) =>
    ad.status === 'expired' || new Date(ad.expiresAt).getTime() < Date.now();

export const inMarket = (ad: any) => ad.publishToMarket !== false;

export const isUncategorized = (ad: any) =>
    inMarket(ad) && !!ad.armId && !ad.categoryId && !!ad.catalogCategoryId;

export const fmt = (n: number | undefined) => n?.toLocaleString('fa-IR') ?? '۰';

// ─── چیپ وضعیت انتشار در بازار ───
export const PUB_CHIP: Record<string, { label: string; cls: string; icon: any }> = {
    active: { label: 'منتشر شده', cls: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/25', icon: BadgeCheck },
    pending: { label: 'در انتظار تایید مدیر', cls: 'text-amber-600 bg-amber-50 dark:bg-amber-900/25', icon: Hourglass },
    paused: { label: 'خاموش', cls: 'text-gray-500 bg-gray-100 dark:bg-gray-800', icon: PauseCircle },
    rejected: { label: 'رد شده', cls: 'text-red-600 bg-red-50 dark:bg-red-900/25', icon: XCircle },
};

// ─── نوع فروش کاتالوگ ───
export const SALES_LABEL: Record<string, string> = {
    wholesale: 'فروش عمده',
    retail: 'فروش خرده',
    service: 'فروش خدمات',
};

export const SALES_ICON: Record<string, any> = {
    wholesale: Store,
    retail: Package,
    service: Wrench,
};

// ─── کلاس استاندارد کارت سفید (فلت) ───
export const CARD_CLS =
    'bg-white dark:bg-gray-900 rounded-xl border border-outline-variant/40 dark:border-gray-700';
