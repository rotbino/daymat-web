// app/arm-admin/layout.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { setArm } from '@/lib/store/slices/armSlice';
import { useArms } from '@/lib/api/apiHooks';
import Link from 'next/link';
import {
    LayoutDashboard,
    CreditCard,
    Settings,
    ChevronRight,
    ChevronLeft,
    Home,
    LogOut,
    Store,
    ShoppingCart,
    Package, BookOpen,
    Tag,
    UserPlus,
    UserMinus,
    ShieldCheck,
    Handshake,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { ThemeToggle } from '@/app_/components/ThemeToggle';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';

const menuItems: { href: string; label: string; icon: any; exact?: boolean; ownerOnly?: boolean }[] = [
    { href: '/arm-admin', label: 'داشبورد', icon: LayoutDashboard, exact: true },
    { href: '/arm-admin/catalogs', label: 'کاتالوگ‌ها', icon: BookOpen },
    { href: '/arm-admin/ads', label: 'آگهی‌ها', icon: Package },
    { href: '/arm-admin/sellers', label: 'فروشندگان', icon: Store },
    { href: '/arm-admin/buyers', label: 'خریداران', icon: ShoppingCart },
    { href: '/arm-admin/membership-requests', label: 'درخواست‌های عضویت', icon: UserPlus },
    { href: '/arm-admin/leave-requests', label: 'درخواست‌های لغو عضویت', icon: UserMinus },
    { href: '/arm-admin/delegated', label: 'کاتالوگ‌های واگذارشده', icon: Handshake },
    { href: '/arm-admin/admins', label: 'ادمین‌های بازار', icon: ShieldCheck, ownerOnly: true },
    { href: '/arm-admin/references', label: 'کالا و برندها', icon: Tag },
    { href: '/arm-admin/financial', label: 'مالی', icon: CreditCard },
    { href: '/arm-admin/settings', label: 'تنظیمات', icon: Settings },
    { href: '/', label: 'سایت', icon: Home },
];

export default function ArmAdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const dispatch = useDispatch();

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

    // ✅ بج درخواست‌های عضویت بازار خصوصی — تعداد pending
    const { data: mreqData } = useQuery({
        queryKey: ['arm-membership-requests', currentSlug, 'pending'],
        queryFn: () => apiService.armAdmin.getMembershipRequests(currentSlug, { status: 'pending', limit: 1 }),
        enabled: !!(currentSlug && isAuthorized === true),
        staleTime: 1000 * 30,
    });
    const membershipReqCount: number = mreqData?.pendingCount ?? 0;

    // ✅ بج درخواست‌های لغو عضویت — تعداد pending
    const { data: lreqData } = useQuery({
        queryKey: ['arm-leave-requests', currentSlug, 'pending'],
        queryFn: () => apiService.armAdmin.getLeaveRequests(currentSlug as string, { status: 'pending', limit: 1 }),
        enabled: !!(currentSlug && isAuthorized === true),
        staleTime: 1000 * 30,
    });
    const leaveReqCount: number = lreqData?.pendingCount ?? 0;

    // ✅ نقش کاربر در بازار فعلی — آیتم «ادمین‌های بازار» فقط برای مالک
    const currentRole = (userArms as any[] | undefined)?.find((a) => a.slug === currentSlug)?.role;
    const isOwnerOfCurrent = currentRole === 'arm_owner';
    const visibleMenuItems = menuItems.filter((item) => !item.ownerOnly || isOwnerOfCurrent);

    useEffect(() => {
        const checkAuthorization = async () => {
            // ✅ صبر کن تا redux-persist hydrate بشه
            // اگه توکن هست ولی isAuthenticated=false، redirect نکن
            const hasToken = typeof window !== 'undefined' && localStorage.getItem('accessToken');
            if (!isAuthenticated || !user) {
                if (!hasToken) {
                    // ✅ واقعاً لاگین نکرده → redirect
                    router.push(`/login?redirect=/arm-admin`);
                    setLoading(false);
                    return;
                }
                // ✅ توکن هست ولی هنوز hydrate نشده → صبر کن
                return;
            }

            // اگه userArms از React Query لود شده
            if (userArms) {
                // ✅ مالک یا ادمین بازارها — هر دو به پنل دسترسی دارند
                const managerArms = userArms.filter((a: any) => ['arm_owner', 'arm_admin'].includes(a.role));

                if (managerArms.length === 0) {
                    toast.error('شما مالک یا ادمین هیچ بازاری نیستید');
                    router.push('/');
                    setLoading(false);
                    return;
                }

                // اگه currentSlug روی یه بازاری نیست که مالک/ادمینش هستیم، سوئیچ کن
                const isManagerOfCurrent = managerArms.some((a: any) => a.slug === currentSlug);
                if (!isManagerOfCurrent) {
                    // اولین بازار مدیریتی رو انتخاب کن
                    const managerArm = managerArms[0];
                    localStorage.setItem('lastArmSlug', managerArm.slug);
                    // ✅ dispatch کن به‌جای reload (جلوگیری از لوپ)
                    dispatch(setArm({
                        arm: {
                            id: managerArm.id,
                            slug: managerArm.slug,
                            name: managerArm.name,
                            slogan: managerArm.slogan || '',
                            status: 'active',
                            visibility: 'public',
                            featuresEnabled: [],
                            colorPrimary: managerArm.colorPrimary,
                        },
                        slug: managerArm.slug,
                    }));
                    setIsAuthorized(true);
                    setLoading(false);
                    return;
                }

                setIsAuthorized(true);
                setLoading(false);
                return;
            }
            // اگه userArms هنوز لود نشده، صبر کن
        };
        checkAuthorization();
    }, [isAuthenticated, user, currentSlug, router, userArms, dispatch]);

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
            <nav className="flex-1  overflow-y-auto px-3 py-5 space-y-1">
                {visibleMenuItems.map((item, index) => {
                    const active = isActive(item.href, item.exact);
                    const Icon = item.icon;

                    let badgeCount = 0;
                    if (item.href === '/arm-admin/ads') badgeCount = stats?.pendingAds || 0;
                    if (item.href === '/arm-admin/financial') badgeCount = stats?.pendingPayments || 0;
                    if (item.href === '/arm-admin/sellers' || item.href === '/arm-admin/buyers') badgeCount = stats?.pendingMembers || 0;
                    // ✅ بج درخواست‌های عضویت — count از endpoint خودش
                    if (item.href === '/arm-admin/membership-requests') badgeCount = membershipReqCount;
                    // ✅ بج درخواست‌های لغو عضویت
                    if (item.href === '/arm-admin/leave-requests') badgeCount = leaveReqCount;

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
                            {!isCollapsed && index < visibleMenuItems.length - 1 && (
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
                            {visibleMenuItems.map((item) => {
                                const active = isActive(item.href, item.exact);
                                const Icon = item.icon;

                                let badgeCount = 0;
                                if (item.href === '/arm-admin/ads') badgeCount = stats?.pendingAds || 0;
                                if (item.href === '/arm-admin/financial') badgeCount = stats?.pendingPayments || 0;
                                if (item.href === '/arm-admin/sellers' || item.href === '/arm-admin/buyers') badgeCount = stats?.pendingMembers || 0;
                                if (item.href === '/arm-admin/membership-requests') badgeCount = membershipReqCount;
                                if (item.href === '/arm-admin/leave-requests') badgeCount = leaveReqCount;

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