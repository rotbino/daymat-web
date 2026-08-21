// app/arm-admin/layout.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useArms } from '@/lib/api/apiHooks';
import Link from 'next/link';
import {
    LayoutDashboard,
    CreditCard,
    Users,
    Settings,
    ChevronRight,
    ChevronLeft,
    Home,
    LogOut,
    Store,
    Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

const menuItems = [
    { href: '/arm-admin', label: 'داشبورد', icon: LayoutDashboard, exact: true },
    { href: '/arm-admin/ads', label: 'آگهی‌ها', icon: Package },
    { href: '/arm-admin/members', label: 'اعضا', icon: Users },
    { href: '/arm-admin/settings', label: 'تنظیمات', icon: Settings },
    { href: '/arm-admin/financial', label: 'مالی', icon: CreditCard },
    { href: '/', label: 'سایت', icon: Home },
];

export default function ArmAdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    const { data: userArms } = useArms();

    const { data: stats } = useQuery({
        queryKey: ['arm-stats', currentSlug],
        queryFn: () => apiService.armAdmin.getStats(currentSlug),
        enabled: !!(currentSlug && isAuthorized === true),
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        const checkAuthorization = async () => {
            if (!isAuthenticated || !user) {
                router.push(`/login?redirect=/arm-admin`);
                setLoading(false);
                return;
            }
            if (!currentSlug) {
                router.push('/');
                setLoading(false);
                return;
            }

            if (userArms) {
                const isAdmin = userArms.some(
                    (a: any) => a.slug === currentSlug && a.role === 'arm_owner'
                );

                if (!isAdmin) {
                    toast.error('شما دسترسی به پنل مدیریت این بازار را ندارید');
                    router.push(`/${currentSlug}`);
                    setIsAuthorized(false);
                    setLoading(false);
                    return;
                }
                setIsAuthorized(true);
                setLoading(false);
                return;
            }

            try {
                const arms = await apiService.arm.getUserArms();
                const isAdmin = arms.some((a: any) => a.slug === currentSlug && a.role === 'arm_owner');
                if (!isAdmin) {
                    toast.error('شما دسترسی به پنل مدیریت این بازار را ندارید');
                    router.push(`/${currentSlug}`);
                    return;
                }
                setIsAuthorized(true);
            } catch {
                router.push(`/${currentSlug}`);
            } finally {
                setLoading(false);
            }
        };
        checkAuthorization();
    }, [isAuthenticated, user, currentSlug, router, userArms]);


// ✅ اصلاح تابع تشخیص active
    const isActive = (href: string, exact?: boolean) => {
        // حذف اسلش انتهایی برای مقایسه دقیق
        const cleanPathname = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
        const cleanHref = href.endsWith('/') ? href.slice(0, -1) : href;

        if (exact) {
            return cleanPathname === cleanHref;
        }
        return cleanPathname?.startsWith(cleanHref);
    };

    if (loading || isAuthorized === null) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-gray-950">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
            </div>
        );
    }

    if (!isAuthorized) return null;

    const armName = currentArm?.name || currentSlug || 'بازار';

    const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
        <div className="flex flex-col h-full">
            <div
                className={cn(
                    'flex items-center h-16 px-4 border-b border-outline-variant/20 dark:border-gray-800 flex-shrink-0',
                    isCollapsed ? 'justify-center' : 'justify-between'
                )}
            >
                {!isCollapsed && (
                    <Link href={`/${currentSlug}`} className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm flex-shrink-0">
                            <Store className="w-5 h-5 text-white" />
                        </div>
                        <div className="min-w-0">
                            <span className="font-bold text-sm text-on-surface dark:text-gray-100 truncate block">
                                {armName}
                            </span>
                            <span className="text-[10px] text-on-surface-variant/60 dark:text-gray-500">
                                پنل مدیریت
                            </span>
                        </div>
                    </Link>
                )}
                {isCollapsed && (
                    <Link href={`/${currentSlug}`} className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                        <Store className="w-5 h-5 text-white" />
                    </Link>
                )}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="hidden lg:flex p-2 hover:bg-surface-container-high dark:hover:bg-gray-800 rounded-xl transition-all active:scale-95"
                >
                    {isCollapsed ? (
                        <ChevronLeft className="w-4 h-4 text-on-surface-variant dark:text-gray-400" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-on-surface-variant dark:text-gray-400" />
                    )}
                </button>
            </div>

            {/* ⭐ منوی سایدبار با رنگ فونت به جای پس‌زمینه */}
            <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
                {menuItems.map((item, index) => {
                    const active = isActive(item.href, item.exact);
                    const Icon = item.icon;

                    let badgeCount = 0;
                    if (item.href === '/arm-admin/ads') badgeCount = stats?.pendingAds || 0;
                    if (item.href === '/arm-admin/financial') badgeCount = stats?.pendingPayments || 0;
                    if (item.href === '/arm-admin/members') badgeCount = stats?.pendingMembers || 0;

                    return (
                        <React.Fragment key={item.href}>
                            <Link
                                href={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                                    active
                                        ? 'text-primary font-bold' // ✅ فقط فونت رنگی، بدون پس‌زمینه
                                        : 'text-on-surface-variant dark:text-gray-400 hover:text-on-surface dark:hover:text-gray-200 hover:bg-surface-container-high dark:hover:bg-gray-800',
                                    isCollapsed && 'justify-center px-2'
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <Icon
                                    className={cn(
                                        'w-4 h-4 flex-shrink-0',
                                        active
                                            ? 'text-primary'
                                            : 'text-on-surface-variant/40 dark:text-gray-500 group-hover:text-on-surface-variant dark:group-hover:text-gray-400'
                                    )}
                                />
                                {!isCollapsed && (
                                    <>
                                        <span className="text-[13px] leading-none">{item.label}</span>
                                        {active && (
                                            <span className="mr-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                        )}
                                    </>
                                )}
                                {badgeCount > 0 && (
                                    <span
                                        className={cn(
                                            'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white bg-red-500',
                                            isCollapsed ? 'absolute -top-1 -right-1' : 'mr-auto'
                                        )}
                                    >
                                        {badgeCount > 99 ? '99+' : badgeCount}
                                    </span>
                                )}
                            </Link>
                            {/* خط عمودی بین آیتم‌ها */}
                            {!isCollapsed && index < menuItems.length - 1 && (
                                <div className="mx-3 h-px bg-outline-variant/20 dark:bg-gray-800" />
                            )}
                        </React.Fragment>
                    );
                })}
            </nav>

            <div className="px-3 py-4 border-t border-outline-variant/20 dark:border-gray-800 space-y-1 flex-shrink-0">
                <Link
                    href={`/${currentSlug}`}
                    className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-on-surface-variant dark:text-gray-400 hover:bg-surface-container-high dark:hover:bg-gray-800',
                        isCollapsed && 'justify-center'
                    )}
                >
                    <Home className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="text-[13px]">مشاهده سایت</span>}
                </Link>
                <button
                    onClick={() => {
                        localStorage.removeItem('accessToken');
                        window.location.href = '/';
                    }}
                    className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-error/60 dark:text-red-400/60 hover:bg-error/5 dark:hover:bg-red-900/20 hover:text-error dark:hover:text-red-400',
                        isCollapsed && 'justify-center'
                    )}
                >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="text-[13px]">خروج</span>}
                </button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen flex bg-surface dark:bg-gray-950 h-screen overflow-hidden">
            {/* سایدبار دسکتاپ */}
            <aside
                className={cn(
                    'hidden lg:flex flex-col fixed top-0 right-0 h-full bg-white dark:bg-gray-900 border-l border-outline-variant/20 dark:border-gray-800 transition-all duration-300 z-40 shadow-sm',
                    isCollapsed ? 'w-[72px]' : 'w-64'
                )}
            >
                <SidebarContent />
            </aside>

            {/* محتوای اصلی */}
            <div
                className={cn(
                    'flex-1 flex flex-col min-h-screen min-w-0 transition-all duration-300',
                    isCollapsed ? 'lg:mr-[72px]' : 'lg:mr-64'
                )}
            >
                {/* هدر دسکتاپ */}
                <header className="hidden lg:flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-900 border-b border-outline-variant/20 dark:border-gray-800 sticky top-0 z-30 flex-shrink-0">
                    <div>
                        <h1 className="text-base font-bold text-on-surface dark:text-gray-100">
                            {(() => {
                                const item = menuItems.find((m) => isActive(m.href, m.exact));
                                return item?.label || 'پنل مدیریت';
                            })()}
                        </h1>
                        <p className="text-[11px] text-on-surface-variant/60 dark:text-gray-500">{armName}</p>
                    </div>
                    <ThemeToggle />
                </header>

                {/* هدر موبایل: منوی افقی */}
                <div className="lg:hidden sticky top-0 z-30 flex-shrink-0">
                    <div className="bg-white dark:bg-gray-900 border-b border-outline-variant/20 dark:border-gray-800 shadow-sm">
                        <div className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-hide">
                            {menuItems.map((item) => {
                                const active = isActive(item.href, item.exact);
                                const Icon = item.icon;

                                let badgeCount = 0;
                                if (item.href === '/arm-admin/ads') badgeCount = stats?.pendingAds || 0;
                                if (item.href === '/arm-admin/financial') badgeCount = stats?.pendingPayments || 0;
                                if (item.href === '/arm-admin/members') badgeCount = stats?.pendingMembers || 0;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            'flex flex-col flex-1 items-center gap-1.5 px-2 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
                                            active
                                                ? 'text-primary font-bold' // ✅ فقط فونت رنگی
                                                : 'text-on-surface-variant dark:text-gray-400 hover:text-on-surface dark:hover:text-gray-300'
                                        )}
                                    >


                                        <Icon className="w-3.5 h-3.5" />
                                        <span className={"text-[8px]"}>
                                            {item.label}
                                        </span>
                                        {badgeCount > 0 && (
                                            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold text-white bg-red-500">
                                                {badgeCount > 99 ? '99+' : badgeCount}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                           {/* <div className="flex-shrink-0 pr-2">
                                <ThemeToggle />
                            </div>*/}
                        </div>
                    </div>
                </div>

                {/* محتوای اصلی */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <div className="p-4 lg:p-6">{children}</div>
                </main>
            </div>
        </div>
    );
}