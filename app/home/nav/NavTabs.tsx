// app/home/nav/NavTabs.tsx
'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { Bell, BookOpen, Store, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavMode } from './useNavMode';
import { useUnreadNotifications } from './useUnreadNotifications';
import { NAV, NavItemDef } from './config';
import ArmSwitcher from '@/app_/components/ArmSwitcher';
import PostPriceButton from '@/app_/components/PostPriceButton';
import { LocationFilter } from '@/app/components/LocationFilter';
import HeaderMenu from '@/app/components/HeaderMenu';
import SearchBox from '@/app_/home/SearchBox';

/**
 * ناوبری دیمت (نسخهٔ ۵ — مهمان‌پذیر روی بازار):
 *
 *   کاربرِ لاگین (دسکتاپ):
 *   [لوگو+نام+شعار بازار ▾]    [🔍 سرچ وسط]    [🏪 بازار] [📚 کاتالوگ] [🔔n] [👤] [⋯]
 *
 *   مهمان:
 *   - روی صفحات بازار (وقتی MarketContent پراپ guestMarketSlug بدهد):
 *     [لوگو+نام+شعار بازار]    [🔍 سرچ وسط]    [🏪 بازار] [📚 کاتالوگ‌ها] [ورود | عضویت]
 *     → سطحِ جذب: گوگل و لینک ویروسی کاربر را اینجا می‌آورد؛ ناو راه کشف را باز می‌کند
 *   - روی کاتالوگ عمومی: هیچ ناو (فوترِ ویروسی کافی است)
 *   - موبایل: MarketContent خودش MobileHeader را برای همه (حتی مهمان) می‌گذارد
 */

const NON_MARKET_SEGMENTS = new Set([
    'my-catalogs', 'market', 'markets', 'notifications', 'profile', 'business', 'ad', 'ads',
    'login', 'register', 'docs', 'feedback', 'credit', 'admin', 'arm-admin',
    'catalogs', 'api', 'c', '_a', 'no-arm', 'new-home', 'saved-ads',
]);

function NotifBadge({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
        <span className="absolute -top-1 -end-0.5 z-10">
            <span className="relative inline-flex items-center justify-center
                min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[9.5px] font-extrabold
                shadow-sm ring-2 ring-white dark:ring-gray-900">
                {count > 99 ? '۹۹+' : count.toLocaleString('fa-IR')}
            </span>
            <span className="absolute inset-0 rounded-full bg-error/40 animate-ping opacity-50" />
        </span>
    );
}

// ═══════════════════════════════════════════
// ناو مهمان — فقط روی صفحات بازار
// ═══════════════════════════════════════════
function GuestMarketNav({ slug, pathname }: { slug: string; pathname: string }) {
    const cleanPath = pathname.replace(/\/+$/, '') || '/';
    const onMarket = cleanPath === `/${slug}`;

    return (
        <nav className="hidden lg:block bg-white dark:bg-gray-900 border-b border-outline-variant/15 dark:border-gray-800/60
            shadow-[0_2px_10px_rgba(0,0,0,0.06)] sticky top-0 z-40">
            <div className="px-4 xl:px-6 h-16 flex items-center gap-2.5">

                {/* برند فرزند — بازارِ مهمان (لوگو + نام + شعار) — نسخهٔ دسکتاپ تا لوگو واقعاً دیده شود */}
                <ArmSwitcher variant="desktop" />

                {/* سرچ وسط — دو فنر دو طرف تا لوگو و شعار جا باز کنند */}
                <div className="flex-1" />
                <Suspense fallback={<div className="w-full max-w-xl h-10 rounded-xl bg-surface-container-high/70 animate-pulse" />}>
                    <div className="w-full max-w-xl min-w-0 flex gap-1">
                        <SearchBox compact className="w-full" />
                        <div className="flex-shrink-0"><LocationFilter /></div>
                    </div>
                </Suspense>
                <div className="flex-1" />

                {/* تب‌های عمومی مهمان */}
                <Link href={`/${slug}`}
                      className={cn(
                          'h-9 px-4 flex items-center gap-1.5 rounded text-[13px] font-extrabold transition-colors flex-shrink-0',
                          onMarket
                              ? 'text-primary bg-primary/5'
                              : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
                      )}>
                    <Store className="w-4 h-4" /> بازار
                </Link>
                <Link href={`/login?redirect=${encodeURIComponent('/business/register?intent=catalog')}`}
                      className="h-9 px-4 flex items-center gap-1.5 rounded text-[13px] font-bold
                          text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high
                          transition-colors flex-shrink-0">
                    <BookOpen className="w-4 h-4" /> کاتالوگ من
                </Link>

                {/* CTA ثبت قیمت — لیبل بر اساس نوع بازار؛ مهمان → ثبت‌نام/ورود بعدش /my-catalogs */}
                <PostPriceButton size="desktop" />
            </div>
        </nav>
    );
}

// ═══════════════════════════════════════════
export default function NavTabs({ guestMarketSlug }: { guestMarketSlug?: string } = {}) {
    const pathname = usePathname();
    const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);
    const { mode, loading } = useNavMode();
    const unread = useUnreadNotifications();

    // ─── مهمان: فقط روی صفحات بازار ناو مهمان ───
    if (!isAuthenticated) {
        if (guestMarketSlug) {
            return <GuestMarketNav slug={guestMarketSlug} pathname={pathname ?? ''} />;
        }
        return null;
    }
    if (loading) return null;

    const segs = (pathname ?? '').split('/').filter(Boolean);

    const isMarketActive =
        (pathname ?? '').startsWith('/market') || // /market و /markets — صفحهٔ لیست بازارها
        (segs.length === 1 &&
            !NON_MARKET_SEGMENTS.has(segs[0]) &&
            segs[0] === currentSlug);

    const isCatalogActive = !!pathname && (
        pathname.startsWith('/my-catalogs') ||
        pathname.startsWith('/business') ||
        pathname.endsWith('/dashboard')
    );
    const isNotifActive = !!pathname && pathname.startsWith('/notifications');
    const isProfileActive = !!pathname && pathname.startsWith('/profile');

    const avatar = (user as any)?.avatarFile?.thumbnailPath || (user as any)?.avatarUrl;

    const IconLink = ({
                          href, title, active, children, badge, ariaLabel,
                      }: {
        href: string; title: string; active: boolean; children: React.ReactNode; badge?: React.ReactNode; ariaLabel: string;
    }) => (
        <Link href={href} aria-label={ariaLabel} title={title}
              className={cn(
                  'relative flex-shrink-0 w-10 h-10 rounded-full grid place-items-center transition-all',
                  active
                      ? 'text-primary bg-primary/10 ring-2 ring-primary/40'
                      : 'text-on-surface-variant hover:text-primary hover:bg-primary/10',
              )}>
            {children}
            {badge}
        </Link>
    );

    return (
        <>
            {/* ═══ دسکتاپ — یک نوار ═══ */}
            <nav className="hidden lg:block bg-white dark:bg-gray-900 border-b border-outline-variant/15 dark:border-gray-800/60
                shadow-[0_2px_10px_rgba(0,0,0,0.06)] sticky top-0 z-40">
                <div className="px-4 xl:px-6 h-16 flex items-center gap-2.5">

                    {/* برند فرزند — لوگو + نام + شعار بازار فعلی — نسخهٔ دسکتاپ تا لوگو واقعاً دیده شود */}
                    <ArmSwitcher variant="desktop" />

                    {/* سرچ وسط — دو فنر دو طرف تا لوگو و شعار جا باز کنند */}
                    <div className="flex-1" />
                    <Suspense fallback={<div className="w-full max-w-xl h-10 rounded-xl bg-surface-container-high/70 animate-pulse" />}>
                        <div className="w-full max-w-xl min-w-0 flex gap-1">
                            <SearchBox compact className="w-full" />
                            <div className="flex-shrink-0"><LocationFilter /></div>
                        </div>
                    </Suspense>
                    <div className="flex-1" />

                    {/* ✅ دکمهٔ ثبت قیمت — لیبل بر اساس نوع بازار (عمده/خرده/خدمات) */}
                    <PostPriceButton size="desktop" />

                    {/* بازار */}
                    <IconLink href={currentSlug ? `/${currentSlug}` : '/markets'}
                              title={currentArm?.name ? `تابلوی ${currentArm.name}` : 'بازارها'}
                              ariaLabel="بازار"
                              active={isMarketActive}>
                        <Store className="w-[21px] h-[21px]" />
                    </IconLink>

                    {/* کاتالوگ */}
                    <IconLink href="/my-catalogs" title="کاتالوگ‌های من — افزودن کالا از همین‌جا" ariaLabel="کاتالوگ‌های من"
                              active={isCatalogActive}>
                        <BookOpen className="w-[21px] h-[21px]" />
                    </IconLink>

                    {/* اعلان */}
                    <IconLink href="/notifications" title="اعلان‌ها" ariaLabel="اعلان‌ها"
                              active={isNotifActive}
                              badge={<NotifBadge count={unread} />}>
                        <Bell className="w-[21px] h-[21px]" />
                    </IconLink>

                    {/* پروفایل */}
                    <Link href="/profile" aria-label="پروفایل من" title="پروفایل من"
                          className={cn(
                              'relative flex-shrink-0 w-10 h-10 rounded-full transition-all',
                              isProfileActive
                                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
                                  : 'ring-1 ring-outline-variant/40 hover:ring-primary/50',
                          )}>
                        <span className="w-full h-full rounded-full overflow-hidden bg-primary/10 grid place-items-center">
                            {avatar ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[13px] font-extrabold text-primary">
                                    {(user?.fullName || 'ک').trim().charAt(0)}
                                </span>
                            )}
                        </span>
                    </Link>

                    <HeaderMenu />
                </div>
            </nav>

            {/* ═══ موبایل — نوار پایین ═══ */}
            <MobileBottomNav
                currentSlug={currentSlug}
                pathname={pathname ?? ''}
            />
        </>
    );
}

// ─── نوار پایین موبایل ───
function MobileBottomNav({ currentSlug, pathname }: { currentSlug: string | null; pathname: string }) {
    const { mode, loading } = useNavMode();
    if (loading) return null;
    const items = NAV[mode];
    if (!items || items.length === 0) return null;

    const segs = pathname.split('/').filter(Boolean);
    const seg = segs.length === 1 ? segs[0] : null;

    const isActive = (item: NavItemDef) => {
        switch (item.key) {
            case 'market':
                return pathname.startsWith('/market') || // /market و /markets
                    (!!seg && !NON_MARKET_SEGMENTS.has(seg) && seg === currentSlug);
            case 'catalogs':
                return pathname.startsWith('/my-catalogs') ||
                    pathname.startsWith('/business') ||
                    pathname.endsWith('/dashboard');
            case 'profile':
                return pathname.startsWith('/profile');
            default:
                return pathname === item.href || pathname.startsWith(`${item.href}/`);
        }
    };

    const gridCls = items.length === 2 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-4';

    return (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
            border-t border-outline-variant/20 dark:border-gray-800 pb-[env(safe-area-inset-bottom)]
            shadow-[0_-2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_12px_rgba(0,0,0,0.4)]">
            <div className={cn('grid max-w-lg mx-auto', gridCls)}>
                {items.map((item) => {
                    const active = isActive(item);
                    return active ? (
                        <span key={item.key}
                              className="relative flex flex-col items-center justify-center py-2.5 gap-0.5 text-primary cursor-default">
                            <item.icon className="w-[23px] h-[23px] stroke-[2.4]" />
                            <span className="text-[10px] font-extrabold">{item.label}</span>
                            <span className="absolute top-0 inset-x-7 h-[3px] rounded-b-full bg-primary" />
                        </span>
                    ) : (
                        <Link key={item.key} href={item.href} scroll={false}
                              className="relative flex flex-col items-center justify-center py-2.5 gap-0.5
                                  text-on-surface-variant/70 hover:text-primary active:scale-95 transition-all">
                            <item.icon className="w-[23px] h-[23px]" />
                            <span className="text-[10px] font-bold">{item.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}