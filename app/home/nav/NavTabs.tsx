// app/home/nav/NavTabs.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { BookOpen, User, Tags, ShoppingCart, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavMode } from './useNavMode';
import { useUnreadNotifications } from './useUnreadNotifications';
import { GENERAL_NAV, MARKET_NAV, NavItemDef, boardHref, boardEnabled } from './config';
import ArmSwitcher from '@/components/ArmSwitcher';
import { LocationFilter } from '@/app/components/LocationFilter';
import HeaderMenu from '@/app/components/HeaderMenu';
import SearchBox from '@/components/home/SearchBox';

/**
 * ناوبری دیمت (نسخهٔ ۷ — ناو عمومی + ناو اختصاصی بازار):
 *
 *   ناو عمومی (بیرون از بازار): بازارها | بازوهای من | اعلان | پروفایل — هدر «بدون جستجو»
 *     کاربر اول از صفحهٔ «بازارها» (‎/markets) وارد بازار می‌شود؛ دیگر خریداران/فروشندگانِ گنگ در ناو نیست.
 *
 *   ناو اختصاصی بازار (داخل بازار): تامین کنندگان | خریداران | اعلان | بازوهای من — «با جستجو»
 *     تامین کنندگان: تابلوی قیمت ‎/{slug} | خریداران: دیوار خریداران ‎/{slug}/buyers
 *
 *   دسکتاپ:  [برند بازار ▾] [(فقط بازار: 🔍 وسط)] [آیتم‌ها — عنوانِ ریز زیر آیکون] [⋯]
 *   موبایل:  نوار پایین | بازار: تامین کنندگان، خریداران، بازوهای من (زنگوله بالا) | عمومی: بازارها، بازوهای من، اعلان، پروفایل
 *   مهمان (روی بازار): همان ساختار با ۳ آیتم — تامین کنندگان | خریداران | بازوی فروش من
 */

const NON_MARKET_SEGMENTS = new Set([
    'my-catalogs', 'market', 'markets', 'notifications', 'profile', 'business', 'ad', 'ads',
    'login', 'register', 'docs', 'feedback', 'credit', 'admin', 'arm-admin',
    'catalogs', 'api', 'c', '_a', 'no-arm', 'new-home', 'saved-ads', 'my-inquiries', 'inquiries',
]);

function NotifBadge({ count }: { count: number }) {
    if (count <= 0) return null;
    return (
        <span className="absolute -top-1.5 -end-1.5 z-10">
            <span className="relative inline-flex items-center justify-center
                min-w-[17px] h-[17px] px-1 rounded-full bg-error text-white text-[9.5px] font-extrabold
                shadow-sm ring-2 ring-white dark:ring-gray-900">
                {count > 99 ? '۹۹+' : count.toLocaleString('fa-IR')}
            </span>
            <span className="absolute inset-0 rounded-full bg-error/40 animate-ping opacity-50" />
        </span>
    );
}

// ═══ کاربر داخل بازار است؟ ‎/{slug} یا ‎/{slug}/... ═══
//    currentSlug فقط برای بازار در redux است (useMarketInit) — بازوی فروش/اعلان خرید این را ست نمی‌کنند.
function decodePath(pathname: string): string {
    try { return decodeURIComponent(pathname); } catch { return pathname; }
}
function isInsideMarket(currentSlug: string | null | undefined, pathname: string): boolean {
    if (!currentSlug) return false;
    const p = decodePath(pathname.replace(/\/+$/, '') || '/');
    return p === `/${currentSlug}` || p.startsWith(`/${currentSlug}/`);
}

// ═══ تشخیص آیتم فعال — مشترک بین دسکتاپ و موبایل ═══
function navActive(key: string, pathname: string, currentSlug: string | null | undefined): boolean {
    const segs = pathname.split('/').filter(Boolean);
    const seg = segs.length === 1 ? segs[0] : null;
    const onArmMarket = !!seg && !NON_MARKET_SEGMENTS.has(seg) && seg === currentSlug;

    switch (key) {
        case 'markets':
            // صفحهٔ اکسپلور بازارها
            return pathname.startsWith('/markets');
        case 'sellers':
            // تابلوی تامین کنندگان = ریشهٔ بازار (‎/{slug})
            return onArmMarket;
        case 'buyers':
            // دیوار خریداران: ‎/{slug}/buyers
            return !!currentSlug && (pathname === `/${currentSlug}/buyers` || pathname.startsWith(`/${currentSlug}/buyers/`));
        case 'catalogs':
            return pathname.startsWith('/my-catalogs') ||
                pathname.startsWith('/business') ||
                pathname.endsWith('/dashboard');
        case 'notifications':
            return pathname.startsWith('/notifications');
        case 'profile':
            return pathname.startsWith('/profile');
        default:
            return false;
    }
}

// ═══ آیتم ناو با عنوانِ زیر آیکون (دسکتاپ + موبایل یک زبان بصری) ═══
function NavItemLink({ item, href, active, compact, badge }: {
    item: NavItemDef; href: string; active: boolean; compact?: boolean; badge?: React.ReactNode;
}) {
    const amber = item.key === 'buyers'; // هویت کهربایی دیوار خریداران
    return (
        <Link href={href} scroll={false} aria-label={item.label} title={item.label}
              className={cn(
                  'relative flex-shrink-0 flex flex-col items-center justify-center gap-1 rounded-lg transition-colors',
                  compact ? 'h-14 w-14' : 'h-14 w-16 xl:w-[72px] px-1',
                  active
                      ? amber
                          ? 'text-amber-700 dark:text-amber-400 bg-amber-500/10'
                          : 'text-primary bg-primary/5'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high',
              )}>
            <span className="relative">
                <item.icon className={cn(compact ? 'w-[21px] h-[21px]' : 'w-[21px] h-[21px]', active && 'stroke-[2.2]')} />
                {badge}
            </span>
            <span className={cn('leading-none whitespace-nowrap', compact ? 'text-[9px]' : 'text-[10px]',
                active ? 'font-extrabold' : 'font-bold')}>
                {item.label}
            </span>
        </Link>
    );
}

// ═══════════════════════════════════════════
// ناو مهمان — فقط روی صفحات بازار (‎/{slug} و ‎/{slug}/buyers)
// ═══════════════════════════════════════════
function GuestMarketNav({ slug, pathname }: { slug: string; pathname: string }) {
    const cleanPath = pathname.replace(/\/+$/, '') || '/';
    const onSellers = cleanPath === `/${slug}`;
    const onBuyers = cleanPath === `/${slug}/buyers`;
    // ✅ ماژول‌های بازار — تابلوی خاموش از ناو مهمان هم حذف می‌شود
    const currentArm = useSelector((s: RootState) => s.arm.currentArm);
    const sellersOn = boardEnabled(currentArm, 'price');
    const buyersOn = boardEnabled(currentArm, 'inquiry');

    return (
        <>
        <nav className="hidden lg:block bg-white dark:bg-gray-900 border-b border-outline-variant/15 dark:border-gray-800/60
            shadow-[0_2px_10px_rgba(0,0,0,0.06)] sticky top-0 z-40">
            <div className="px-4 xl:px-6 h-16 flex items-center gap-2.5">

                {/* برند فرزند — بازارِ مهمان (لوگو + نام + شعار) */}
                <ArmSwitcher variant="desktop" />

                {/* سرچ وسط — دو فنر دو طرف تا لوگو و شعار جا باز کنند */}
                <div className="flex-1" />
                <React.Suspense fallback={<div className="w-full max-w-xl h-10 rounded-xl bg-surface-container-high/70 animate-pulse" />}>
                    <div className="w-full max-w-xl min-w-0 flex gap-1">
                        <SearchBox compact className="w-full" />
                        <div className="flex-shrink-0"><LocationFilter /></div>
                    </div>
                </React.Suspense>
                <div className="flex-1" />

                {/* سه آیتم مهمان — عنوان زیر آیکون (تابلوی خاموش حذف می‌شود) */}
                {sellersOn && (
                    <NavItemLink item={{ key: 'sellers', label: 'تامین کنندگان', icon: Tags, href: `/${slug}` }}
                                 href={`/${slug}`} active={onSellers} />
                )}
                {buyersOn && (
                    <NavItemLink item={{ key: 'buyers', label: 'خریداران', icon: ShoppingCart, href: `/${slug}/buyers` }}
                                 href={`/${slug}/buyers`} active={onBuyers} />
                )}
                <Link href={`/login?redirect=${encodeURIComponent('/business/register?intent=catalog')}`}
                      className="h-14 w-[72px] flex flex-col items-center justify-center gap-1 rounded-lg text-on-surface-variant
                          hover:text-on-surface hover:bg-surface-container-high transition-colors flex-shrink-0">
                    <BookOpen className="w-[21px] h-[21px]" />
                    <span className="text-[10px] font-bold leading-none whitespace-nowrap">بازوی فروش من</span>
                </Link>
            </div>
        </nav>

        {/* فوتر موبایل مهمان — سه آیتم */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
            border-t border-outline-variant/20 dark:border-gray-800 pb-[env(safe-area-inset-bottom)]
            shadow-[0_-2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_12px_rgba(0,0,0,0.4)]">
            <div className={cn('grid max-w-lg mx-auto', sellersOn && buyersOn ? 'grid-cols-3' : 'grid-cols-2')}>
                {sellersOn && <FooterItem href={`/${slug}`} label="تامین کنندگان" icon={Tags} active={onSellers} />}
                {buyersOn && <FooterItem href={`/${slug}/buyers`} label="خریداران" icon={ShoppingCart} active={onBuyers} amber />}
                <FooterItem href={`/login?redirect=${encodeURIComponent('/business/register?intent=catalog')}`}
                            label="بازوی فروش من" icon={BookOpen} />
            </div>
        </nav>
        </>
    );
}

function FooterItem({ href, label, icon: Icon, active, amber }: {
    href: string; label: string; icon: any; active?: boolean; amber?: boolean;
}) {
    return active ? (
        <span className={cn('relative flex flex-col items-center justify-center py-2.5 gap-0.5 cursor-default',
            amber ? 'text-amber-700 dark:text-amber-400' : 'text-primary')}>
            <Icon className="w-[23px] h-[23px] stroke-[2.4]" />
            <span className="text-[10px] font-extrabold">{label}</span>
            <span className={cn('absolute top-0 inset-x-7 h-[3px] rounded-b-full', amber ? 'bg-amber-500' : 'bg-primary')} />
        </span>
    ) : (
        <Link href={href} scroll={false}
              className="relative flex flex-col items-center justify-center py-2.5 gap-0.5
                  text-on-surface-variant/70 hover:text-primary active:scale-95 transition-all">
            <Icon className="w-[23px] h-[23px]" />
            <span className="text-[10px] font-bold">{label}</span>
        </Link>
    );
}

// ═══════════════════════════════════════════
export default function NavTabs({ guestMarketSlug }: { guestMarketSlug?: string } = {}) {
    const pathname = usePathname();
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);
    const { loading } = useNavMode();
    const unread = useUnreadNotifications();

    // ─── مهمان: فقط روی صفحات بازار ناو مهمان ───
    if (!isAuthenticated) {
        if (guestMarketSlug) {
            return <GuestMarketNav slug={guestMarketSlug} pathname={pathname ?? ''} />;
        }
        return null;
    }
    if (loading) return null;

    const p = pathname ?? '';
    // ✅ دو ناو — داخل بازار و بیرون از بازار
    const inside = isInsideMarket(currentSlug, p);
    // ماژول‌های بازار — تابلوی خاموش از ناو حذف می‌شود (تنظیمات بازار ← ماژول‌ها)
    const sellersOn = boardEnabled(currentArm, 'price');
    const buyersOn = boardEnabled(currentArm, 'inquiry');
    const items = (inside ? MARKET_NAV : GENERAL_NAV).filter((i) =>
        (i.key !== 'sellers' || sellersOn) && (i.key !== 'buyers' || buyersOn),
    );

    // آدرس پویا: تامین کنندگان → ‎/{slug} | خریداران → ‎/{slug}/buyers | بقیه → href ثابت
    const itemHref = (item: NavItemDef) =>
        item.key === 'sellers' ? boardHref(currentSlug, 'price')
        : item.key === 'buyers' ? boardHref(currentSlug, 'inquiry')
        : item.href;

    return (
        <>
            {/* ═══ دسکتاپ — یک نوار ═══ */}
            <nav className="hidden lg:block bg-white dark:bg-gray-900 border-b border-outline-variant/15 dark:border-gray-800/60
                shadow-[0_2px_10px_rgba(0,0,0,0.06)] sticky top-0 z-40">
                <div className="px-4 xl:px-6 h-16 flex items-center gap-2.5">

                    {/* برند فرزند — لوگو + نام + شعار بازار فعلی */}
                    <ArmSwitcher variant="desktop" />

                    {/* ✅ ناو عمومی (بدون جستجو): فاصله‌گذار خالی به‌جای سرچ باکس —
                        آیتم‌های ناو همیشه سمت مقابل لوگو می‌نشینند، نه چسبیده به آن */}
                    {!inside && <div className="flex-1" />}

                    {/* جستجو فقط داخل بازار — ناو عمومی بی‌جستجو است */}
                    {inside && (
                        <>
                            <div className="flex-1" />
                            <React.Suspense fallback={<div className="w-full max-w-xl h-10 rounded-xl bg-surface-container-high/70 animate-pulse" />}>
                                <div className="w-full max-w-xl min-w-0 flex gap-1">
                                    <SearchBox compact className="w-full" />
                                    <div className="flex-shrink-0"><LocationFilter /></div>
                                </div>
                            </React.Suspense>
                            <div className="flex-1" />
                        </>
                    )}

                    {/* ✅ آیتم‌های ناو — عنوانِ ریز زیر هر آیکون (خوانا برای کاربر) */}
                    {items.map((item) => (
                        <NavItemLink
                            key={item.key}
                            item={item}
                            href={itemHref(item)}
                            active={navActive(item.key, p, currentSlug)}
                            badge={item.key === 'notifications' ? <NotifBadge count={unread} /> : undefined}
                        />
                    ))}

                    <HeaderMenu />
                </div>
            </nav>

            {/* ═══ موبایل — نوار پایین ═══ */}
            <MobileBottomNav currentSlug={currentSlug} pathname={p} inside={inside}
                             sellersOn={sellersOn} buyersOn={buyersOn} />
        </>
    );
}

// ─── نوار پایین موبایل ───
//    داخل بازار: تامین کنندگان، خریداران، بازوهای من — اعلان بالا است (MobileHeader با زنگوله)
//    بیرون از بازار: بازارها، بازوهای من، اعلان، پروفایل — صفحات عمومی هدرِ زنگوله ندارند
function MobileBottomNav({ currentSlug, pathname, inside, sellersOn, buyersOn }: {
    currentSlug: string | null; pathname: string; inside: boolean; sellersOn: boolean; buyersOn: boolean;
}) {
    const { loading } = useNavMode();
    if (loading) return null;
    const items = (inside ? MARKET_NAV : GENERAL_NAV).filter((i) =>
        (i.key !== 'sellers' || sellersOn) && (i.key !== 'buyers' || buyersOn)
        && (i.key !== 'notifications' || !inside),
    );
    const gridCls = items.length <= 3 ? 'grid-cols-3' : 'grid-cols-4';

    return (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md
            border-t border-outline-variant/20 dark:border-gray-800 pb-[env(safe-area-inset-bottom)]
            shadow-[0_-2px_12px_rgba(0,0,0,0.06)] dark:shadow-[0_-2px_12px_rgba(0,0,0,0.4)]">
            <div className={cn('grid max-w-lg mx-auto', gridCls)}>
                {items.map((item) => {
                    const active = navActive(item.key, pathname, currentSlug);
                    const href = item.key === 'sellers' ? boardHref(currentSlug, 'price')
                        : item.key === 'buyers' ? boardHref(currentSlug, 'inquiry')
                        : item.href;
                    return active ? (
                        <span key={item.key}
                              className={cn('relative flex flex-col items-center justify-center py-2.5 gap-0.5 cursor-default',
                                  item.key === 'buyers'
                                      ? 'text-amber-700 dark:text-amber-400'
                                      : 'text-primary')}>
                            <item.icon className="w-[23px] h-[23px] stroke-[2.4]" />
                            <span className="text-[10px] font-extrabold">{item.label}</span>
                            <span className={cn('absolute top-0 inset-x-5 h-[3px] rounded-b-full',
                                item.key === 'buyers' ? 'bg-amber-500' : 'bg-primary')} />
                        </span>
                    ) : (
                        <Link key={item.key} href={href} scroll={false}
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
