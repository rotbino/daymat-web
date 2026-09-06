// app/home/MemberHome.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import {
    User, Store, BookOpen, Package, Clock, Pencil, Eye, Share2,
    TrendingUp, Bell, Plus, PauseCircle, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NavTabs from '@/app/home/nav/NavTabs';
import { PUB_META } from '@/app/home/nav/config';
import ShareKitModal from '@/app_/profile/components/ShareKitModal';

const isAdExpired = (ad: any) =>
    ad.status === 'expired' || new Date(ad.expiresAt).getTime() < Date.now();
const fmt = (n: number | undefined) => n?.toLocaleString('fa-IR') ?? '۰';

interface Props {
    /** اختیاری — اگر صفحه روت پاس دهد؛ در صورت ندهدن، خودش از سرور می‌گیرد */
    user?: any;
}

export default function MemberHome({ user: userProp }: Props) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { mode } = useNavModeSafe();
    const authUser = useSelector((s: RootState) => s.auth.user);
    const user = userProp ?? authUser;
    const isMember = mode === 'member';
    const firstName = (user?.fullName || '').split(' ')[0] || 'کاربر';

    const [shareSlug, setShareSlug] = useState<string | null>(null);
    const [shareName, setShareName] = useState('');

    // ─── کاتالوگ‌ها ───
    const { data: cataloges, isLoading: bizLoading } = useQuery({
        queryKey: ['cataloges'],
        queryFn: () => apiService.catalog.getAll(),
        staleTime: 60_000,
    });
    const catalogs = cataloges ?? [];

    // ─── عضویت‌ها ───
    const { data: userArms } = useQuery({
        queryKey: ['arms'],
        queryFn: () => apiService.arm.getUserArms(),
        staleTime: 60_000,
    });
    const arms: any[] = userArms ?? [];

    const membershipsByCatalog = useMemo(() => {
        const map = new Map<string, any[]>();
        for (const m of arms) {
            if (!m?.catalogId) continue;
            const list = map.get(m.catalogId) ?? [];
            list.push(m);
            map.set(m.catalogId, list);
        }
        return map;
    }, [arms]);

    const memberArms = useMemo(() => arms.filter((m) => m.status === 'active'), [arms]);

    // ─── آمار سبک هر کاتالوگ ───
    const { data: adsSummary } = useQuery({
        queryKey: ['home-ads-summary', catalogs.map((c) => c.id).join(',')],
        queryFn: async () => Promise.all(
            catalogs.map((c) => apiService.ad.getCatalogAds(c.id, 1, 50).catch(() => null)),
        ).then((rs: any[]) => rs.map((r, i) => {
            const ads = r?.ads ?? r?.items ?? [];
            return { catalogId: catalogs[i].id, total: ads.length, stale: ads.filter(isAdExpired).length };
        })),
        enabled: catalogs.length > 0,
        staleTime: 60_000,
    });
    const summaryById = useMemo(
        () => new Map((adsSummary ?? []).map((s: any) => [s.catalogId, s])),
        [adsSummary],
    );

    const openShare = (c: any) => { setShareSlug(c.slug); setShareName(c.name); };
    const goEdit = (c: any) => router.push(c.slug ? `/${c.slug}?edit=1` : `/catalog/edit/${c.id}`);

    // اعلان‌های مشتق — فقط شمارنده برای هدر خلاصه
    const { data: notif } = useQuery({
        queryKey: ['notifications-derived'],
        queryFn: () => apiService.notification.getDerived(),
        staleTime: 60_000,
    });
    const urgent = notif?.items?.filter((n: any) => n.severity !== 'info') ?? [];

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40 pb-24">
            <NavTabs />

            {/* ─── خوش‌آمد ─── */}
            <header className="max-w-5xl mx-auto px-4 pt-6 pb-2 flex items-center justify-between">
                <div>
                    <h1 className=" font-black text-on-surface"> کاتالوگ‌های من</h1>
                </div>
                <Link href="/profile" aria-label="پروفایل"
                      className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {user?.avatarFile?.thumbnailPath
                        ? <Image src={user.avatarFile.thumbnailPath} alt="" width={40} height={40} className="object-cover" unoptimized />
                        : <User className="w-5 h-5 text-primary" />}
                </Link>
            </header>

            <main className="max-w-5xl mx-auto px-4 space-y-6">
                {/* ─── کاتالوگ‌های من ─── */}
                <section>
                    <div className="flex items-center justify-between mb-2.5 px-1">
                        <h2 className="text-sm font-extrabold text-on-surface flex items-center gap-1.5">

                        </h2>
                        {catalogs.length > 0 && (
                            <button onClick={() => router.push('/catalog/register')}
                                    className="text-[11px] font-bold text-primary flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5" /> کاتالوگ جدید
                            </button>
                        )}
                    </div>

                    {bizLoading ? (
                        <div className="space-y-3">
                            {[0, 1].map((i) => <div key={i} className="h-28 rounded-2xl bg-surface-container-high/50 animate-pulse" />)}
                        </div>
                    ) : catalogs.length === 0 ? (
                        <div className="rounded-2xl border-2 border-primary/25 bg-gradient-to-br from-primary/8 via-primary/5 to-transparent p-6 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                                <BookOpen className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-base font-extrabold text-on-surface mb-1.5">کاتالوگ محصولاتت را بساز</h3>
                            <p className="text-xs text-on-surface-variant leading-6 max-w-sm mx-auto">
                                با عکس و قیمت، با لینک اختصاصی — چند دقیقه بیشتر وقت نمی‌گیرد.
                            </p>
                            <button onClick={() => router.push('/catalog/register')}
                                    className="mt-4 h-11 px-7 rounded-xl bg-primary text-on-primary text-sm font-extrabold
                                    hover:bg-primary/90 shadow-lg shadow-primary/25 active:scale-[0.98] transition-all">
                                شروع کن — رایگان
                            </button>
                        </div>
                    ) : (
                        <div className={cn('grid gap-3', catalogs.length > 1 ? 'sm:grid-cols-2' : '')}>
                            {catalogs.map((c: any) => {
                                const s = summaryById.get(c.id);
                                const memberships = membershipsByCatalog.get(c.id) ?? [];
                                return (
                                    <div key={c.id}
                                         className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                                        <button type="button" onClick={() => c.slug && router.push(`/${c.slug}?edit=1`)}
                                                className="w-full text-right p-4 flex items-start gap-3.5">
                                            <div className="w-12 h-12 rounded-xl bg-surface-container-high dark:bg-gray-800 border border-outline-variant/40
                                                flex items-center justify-center overflow-hidden flex-shrink-0 ring-2 ring-primary/10">
                                                {(c.logoFile?.path || c.logoUrl)
                                                    ? <Image src={c.logoFile?.path || c.logoUrl} alt={c.name} width={48} height={48} className="w-full h-full object-cover" unoptimized />
                                                    : <BookOpen className="w-5 h-5 text-primary" />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[15px] font-bold text-on-surface truncate">{c.name}</p>
                                                {c.slug
                                                    ? <p className="text-[10px] text-on-surface-variant/60 mt-0.5 truncate" dir="ltr">/{c.slug}</p>
                                                    : <p className="text-[10px] text-amber-600 mt-0.5">آدرس کاتالوگ تنظیم نشده</p>}
                                                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                                                    {memberships.length === 0 && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">منتشر نشده</span>
                                                    )}
                                                    {memberships.map((m: any) => {
                                                        const meta = PUB_META[m.status] ?? PUB_META.paused;
                                                        return (
                                                            <span key={m.slug} className={cn('inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium', meta.cls)}>
                                                                <meta.icon className="w-3 h-3" /> {meta.label} · {m.armName || m.arm?.name || m.slug}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </button>

                                        {/* نوار آمار سه‌خانه */}
                                        <div className="mx-4 mb-3 rounded-xl bg-surface-container-high/50 dark:bg-gray-800/50
                                            grid grid-cols-3 divide-x divide-x-reverse divide-outline-variant/30">
                                            <div className="py-2 text-center">
                                                <p className="text-[13px] font-extrabold text-on-surface">{fmt(s?.total)}</p>
                                                <p className="text-[9px] text-on-surface-variant/70 mt-0.5">کالا</p>
                                            </div>
                                            <div className="py-2 text-center">
                                                <p className="text-[13px] font-extrabold text-emerald-600 dark:text-emerald-400">
                                                    {fmt((s?.total ?? 0) - (s?.stale ?? 0))}
                                                </p>
                                                <p className="text-[9px] text-on-surface-variant/70 mt-0.5">قیمت معتبر</p>
                                            </div>
                                            <div className="py-2 text-center">
                                                {s?.stale ? (
                                                    <>
                                                        <p className="text-[13px] font-extrabold text-amber-600 dark:text-amber-400">{fmt(s.stale)}</p>
                                                        <p className="text-[9px] text-amber-600/80 mt-0.5">نیازمند تازه‌سازی</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-[13px] font-extrabold text-emerald-600/70">✓</p>
                                                        <p className="text-[9px] text-emerald-600/60 mt-0.5">قیمت‌ها تازه</p>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* اکشن‌ها */}
                                        <div className="flex items-center gap-2 px-4 pb-3.5">
                                            <button type="button" onClick={() => goEdit(c)}
                                                    className="h-8 px-3 rounded-lg border border-outline-variant/60 text-[11px] font-bold
                                                    text-on-surface-variant hover:text-primary hover:border-primary/40
                                                    flex items-center gap-1.5 transition-colors">
                                                <Pencil className="w-3.5 h-3.5" /> مدیریت
                                            </button>
                                            <span className="flex-1" />
                                            {c.slug && (
                                                <button type="button" onClick={() => router.push(`/${c.slug}`)}
                                                        aria-label="مشاهده کاتالوگ"
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-outline-variant/50
                                                        text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors">
                                                    <Eye className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            {c.slug && (
                                                <button type="button" onClick={() => openShare(c)} aria-label="کیت اشتراک‌گذاری"
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg border border-outline-variant/50
                                                        text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors">
                                                    <Share2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ─── خلاصه اعلان‌ها (لینک به تب اعلان) ─── */}
                <Link href="/notifications"
                      className="flex items-center gap-3 rounded-2xl border border-outline-variant/40 bg-white dark:bg-gray-900 p-4 hover:border-primary/40 transition-colors">
                    <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        urgent.length > 0 ? 'bg-amber-50 dark:bg-amber-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20')}>
                        <Bell className={cn('w-4.5 h-4.5', urgent.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400')} />
                    </span>
                    <span className="flex-1 min-w-0">
                        <span className="block text-xs font-extrabold text-on-surface">اعلان‌ها</span>
                        <span className={cn('block text-[11px] mt-0.5',
                            urgent.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-on-surface-variant/70')}>
                            {urgent.length > 0
                                ? `${urgent.length.toLocaleString('fa-IR')} کار باقی‌مانده — از جمله قیمت‌های در حال انقضا`
                                : 'همه‌چیز مرتب است ✓'}
                        </span>
                    </span>
                    <ChevronLeftIcon />
                </Link>

                {/* ─── بازارهای من — فقط در مد member ─── */}
                {isMember && (
                    <section>
                        <h2 className="text-sm font-extrabold text-on-surface mb-2.5 px-1 flex items-center gap-1.5">
                            <Store className="w-4 h-4 text-primary" /> بازارهای من
                        </h2>
                        <div className="grid sm:grid-cols-2 gap-2.5">
                            {memberArms.map((m) => (
                                <Link key={m.slug} href={`/${m.slug}`}
                                      className="group flex items-center gap-3 rounded-2xl border border-outline-variant/40
                                        bg-white dark:bg-gray-900 p-3.5 hover:border-primary/40 transition-colors">
                                    <span className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                                        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-xs font-extrabold text-on-surface truncate">{m.armName || m.arm?.name || m.slug}</span>
                                        <span className="block text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">مشاهده تابلو</span>
                                    </span>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </main>



            <ShareKitModal open={!!shareSlug} onClose={() => setShareSlug(null)} catalogName={shareName} slug={shareSlug ?? undefined} />




        </div>
    );
}

/* ─── هوک سبک حالت (از فایل ناو) — بدون دوباره‌نویسی ─── */
import { useNavMode } from '@/app/home/nav/useNavMode';
function useNavModeSafe() { return useNavMode(); }

/* ─── آیکون کوچک چپ‌رو ─── */
function ChevronLeftIcon() {
    // lucide ChevronLeft
    const { ChevronLeft } = require('lucide-react');
    return <ChevronLeft className="w-4 h-4 text-on-surface-variant/25 flex-shrink-0" />;
}