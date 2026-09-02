// app/profile/components/CatalogCard.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Building2, Eye, Settings2, Share2, Store, Clock, Package, BadgeCheck, PauseCircle, Hourglass, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CatalogMembershipInfo {
    armSlug: string;
    armName: string;
    status: string;          // active | pending | paused | rejected
    rejectionReason?: string | null;
}

interface Props {
    catalog: any;                          // Business
    memberships: CatalogMembershipInfo[];  // وضعیت انتشار در بازارها
    onShare: () => void;
}

const PUBLISH_META: Record<string, { label: string; cls: string; icon: any }> = {
    active:   { label: 'منتشر در بازار', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: BadgeCheck },
    pending:  { label: 'در انتظار تایید', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300', icon: Hourglass },
    paused:   { label: 'انتشار خاموش',   cls: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', icon: PauseCircle },
    rejected: { label: 'نیاز به اصلاح',  cls: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
};

export default function CatalogCard({ catalog, memberships, onShare }: Props) {
    const products = catalog.totalAdsCount ?? 0;
    const active = catalog.activeAdsCount ?? 0;
    const onTable = active; // آگهی‌های معتبر = روی تابلو
    const needsPrice = Math.max(0, products - active);

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="p-4 flex items-start gap-3.5">
                {/* لوگو */}
                <div className="w-14 h-14 rounded-xl bg-surface-container-high dark:bg-gray-800 border border-outline-variant/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {(catalog.logoFile?.path || catalog.logoUrl) ? (
                        <Image src={catalog.logoFile?.path || catalog.logoUrl} alt={catalog.name} width={56} height={56}
                               className="w-full h-full object-cover"
                               unoptimized={(catalog.logoFile?.path || catalog.logoUrl || '').startsWith('https://')} />
                    ) : (
                        <Building2 className="w-6 h-6 text-primary" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-[15px] font-bold text-on-surface truncate">{catalog.name}</h3>
                        {catalog.verificationTier && catalog.verificationTier !== 'none' && (
                            <BadgeCheck className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                        )}
                    </div>
                    {catalog.slug ? (
                        <p className="text-[10px] text-on-surface-variant/60 mt-0.5 truncate" dir="ltr">/c/{catalog.slug}</p>
                    ) : (
                        <p className="text-[10px] text-amber-600 mt-0.5">آدرس کاتالوگ تنظیم نشده — در ویرایش اطلاعات ثبت کنید</p>
                    )}

                    {/* وضعیت انتشار در بازارها */}
                    <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {memberships.length === 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                                فقط کاتالوگ عمومی — در بازار منتشر نشده
                            </span>
                        )}
                        {memberships.map((m) => {
                            const meta = PUBLISH_META[m.status] ?? PUBLISH_META.paused;
                            return (
                                <span key={m.armSlug} className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium', meta.cls)}>
                                    <meta.icon className="w-3 h-3" />
                                    {meta.label} · {m.armName}
                                </span>
                            );
                        })}
                    </div>

                    {/* شمارنده‌ها */}
                    <div className="flex items-center gap-4 mt-2.5 text-[11px] text-on-surface-variant">
                        <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5 text-primary/70" />{products.toLocaleString('fa-IR')} محصول</span>
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400"><Store className="w-3.5 h-3.5" />{onTable.toLocaleString('fa-IR')} روی تابلو</span>
                        {needsPrice > 0 && (
                            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><Clock className="w-3.5 h-3.5" />{needsPrice.toLocaleString('fa-IR')} نیازمند قیمت تازه</span>
                        )}
                    </div>
                </div>
            </div>

            {/* اکشن‌ها */}
            {/* اکشن‌ها */}
            <div className="flex items-center gap-2 px-4 pb-3.5">
                <Link href={catalog.slug ? `/c/${catalog.slug}` : `/business/edit/${catalog.id}`}
                      className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold
            bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <Eye className="w-4 h-4" /> {catalog.slug ? 'مشاهده کاتالوگ' : 'تکمیل کاتالوگ'}
                </Link>

                {/* ✅ بدون slug، کاربر به ویرایش اطلاعات هدایت می‌شود تا آدرس را بسازد — نه به مسیر خراب */}
                {catalog.slug ? (
                    <Link href={`/c/${catalog.slug}/dashboard`}
                          className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold
                bg-primary text-on-primary hover:bg-primary/90 shadow-sm shadow-primary/20">
                        <Settings2 className="w-4 h-4" /> مدیریت
                    </Link>
                ) : (
                    <Link href={`/business/edit/${catalog.id}`} title="برای فعال‌سازی مدیریت، ابتدا آدرس کاتالوگ را تنظیم کنید"
                          className="flex-1 h-9 flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold
                bg-primary text-on-primary hover:bg-primary/90 shadow-sm shadow-primary/20">
                        <Settings2 className="w-4 h-4" /> مدیریت
                    </Link>
                )}

                <button onClick={onShare} aria-label="کیت اشتراک‌گذاری"
                        className="h-9 w-10 flex items-center justify-center rounded-xl border border-outline-variant/50 text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors">
                    <Share2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}