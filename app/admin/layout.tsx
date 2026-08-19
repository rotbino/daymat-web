// app/admin/layout.tsx
'use client';

import React, { useEffect, useState, createContext, useContext } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import Link from 'next/link';
import {
    LayoutDashboard,
    Store,
    Ruler,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Building2,
    Tags,
    CreditCard,
    BarChart3,
    Menu,
    X,
    Activity,
    Users,
    Database,
    Globe,
    MapPin,
    Package,
    DollarSign,
    Receipt,
    TrendingUp,
    Sparkles,
    Layers,
    Home,
    ChevronDown,
    ArrowRight, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import Image from "next/image";

// ============================================================
// 📋 ساختار منو
// ============================================================

interface MenuItem {
    href: string;
    label: string;
    icon: any;
    exact?: boolean;
}

interface MenuGroup {
    id: string;
    label: string;
    icon: any;
    items: MenuItem[];
}

const menuGroups: MenuGroup[] = [
    {
        id: 'management',
        label: 'مدیریت',
        icon: LayoutDashboard,
        items: [
            { href: '/admin', label: 'داشبورد', icon: BarChart3, },
            { href: '/admin/arm', label: 'بازارها', icon: Globe,  },
            { href: '/admin/users', label: 'کاربران', icon: Users },
            { href: '/admin/businesses', label: 'کسب‌وکارها', icon: Building2 },
            { href: '/admin/ads', label: 'آگهی‌ها', icon: Package },
            { href: '/admin/credits', label: 'اعتبارات', icon: CreditCard },
            { href: '/admin/payments', label: 'پرداخت‌ها', icon: Receipt },
            { href: '/admin/analytics', label: 'گزارشات', icon: TrendingUp },
            { href: '/admin/feedbacks', label: 'بازخوردها', icon: MessageSquare },
        ],
    },
    {
        id: 'data',
        label: 'داده‌های پایه',
        icon: Database,
        items: [
            { href: '/admin/categories', label: 'گروه‌های کالا', icon: Layers },
            { href: '/admin/units', label: 'واحدهای اندازه‌گیری', icon: Ruler },
            { href: '/admin/industries', label: 'صنوف', icon: Building2 },
            { href: '/admin/activities', label: 'فعالیت‌ها', icon: Activity },
            { href: '/admin/locations', label: 'مناطق جغرافیایی', icon: MapPin },
        ],
    },
];

// ============================================================
// 🎯 Page Context - برای override عنوان هدر
// ============================================================

interface PageMeta {
    title?: string;
    subtitle?: string;
    backUrl?: string;
    onBack?: () => void;
}

const PageMetaContext = createContext<{
    pageMeta: PageMeta;
    setPageMeta: (meta: PageMeta) => void;
}>({
    pageMeta: {},
    setPageMeta: () => {},
});

export const usePageMeta = () => useContext(PageMetaContext);

// ============================================================
// 🎨 کامپوننت اصلی
// ============================================================

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [pageMeta, setPageMeta] = useState<PageMeta>({});
    const { currentArm, currentSlug } = useSelector((state: RootState) => state.arm);
    // ------------------------ auth ------------------------
    useEffect(() => {
        if (pathname.startsWith('/admin/login')) { setLoading(false); return; }
        if (!isAuthenticated || !user) { router.replace('/admin/login'); return; }
        if (user.role !== 'system_admin' && user.role !== 'arm_manager') { router.replace('/admin/login'); return; }
        setLoading(false);
    }, [isAuthenticated, user, router, pathname]);

    useEffect(() => { setMobileOpen(false); }, [pathname]);

    // ⭐ ریست pageMeta وقتی مسیر عوض میشه
    useEffect(() => {
        setPageMeta({});
    }, [pathname]);

    // پیدا کردن گروه فعال
    useEffect(() => {
        const activeGroup = menuGroups.find(g =>
            g.items.some(item => {
                if (item.exact) return pathname === item.href;
                return pathname?.startsWith(item.href);
            })
        );
        if (activeGroup) setExpandedGroup(activeGroup.id);
    }, [pathname]);

    const isActive = (href: string, exact?: boolean) => {

        if (!pathname) return false;
        if (exact) return pathname === href;
        if (href === '/admin') return pathname === '/admin'; // داشبورد فقط exact
        return pathname.startsWith(href);
    };

    // ⭐ آیا این مسیر یه صفحه سطح اول منو هست؟
    const isTopLevelPage = menuGroups.some(g =>
        g.items.some(item => {
            if (item.exact) return pathname === item.href;
            return pathname === item.href;
        })
    );

    const toggleGroup = (groupId: string) => {
        setExpandedGroup(prev => prev === groupId ? null : groupId);
    };

    // ⭐ عنوان پیش‌فرض از منو
    const defaultTitle = (() => {
        for (const group of menuGroups) {
            const item = group.items.find(i => isActive(i.href, i.exact));
            if (item) return item.label;
        }
        return 'پنل مدیریت';
    })();

    // ⭐ عنوان نهایی: یا از pageMeta یا از منو
    const headerTitle = pageMeta.title || defaultTitle;
    const headerSubtitle = pageMeta.subtitle || (isTopLevelPage ? undefined : undefined);
    const showBackButton = !!pageMeta.backUrl || !!pageMeta.onBack;

    if (pathname.startsWith('/admin/login')) return <>{children}</>;
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-gray-950">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent" />
            </div>
        );
    }
    if (!isAuthenticated || !user) return null;

    // ============================================================
    // 🧩 محتوای سایدبار
    // ============================================================
    const SidebarContent = ({ onNavigate }: { onNavigate?: () => void }) => (
        <div className="flex flex-col h-full">
            <div className={cn(
                "flex items-center h-16 px-4 border-b border-outline-variant/20 dark:border-gray-800 flex-shrink-0",
                isCollapsed ? 'justify-center' : 'justify-between'
            )}>
                {!isCollapsed && (
                    <Link href="/" className="flex items-center gap-3 group pt-2">
                        <div className="w-16 h-16  rounded">
                            <Image src="/images/logo.png" alt="بدون تصویر" width={32} height={32} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col">
                            <h3 className="text-[13px] text-on-surface-variant/60 dark:text-gray-500">پنل مدیریت</h3>
                        </div>
                    </Link>
                )}
                {isCollapsed && (
                    <Link href="/" className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                        <span className="text-white font-bold text-sm">س</span>
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

            <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-3">
                {menuGroups.map((group) => {
                    const isExpanded = expandedGroup === group.id;



                    const isGroupActive = group.items.some(item => isActive(item.href, item.exact));


                    return (
                        <div key={group.id} className="space-y-0.5">
                            <button
                                onClick={() => {
                                    if (isCollapsed) {
                                        setIsCollapsed(false);
                                        setExpandedGroup(group.id);
                                    } else {
                                        toggleGroup(group.id);
                                    }
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group",
                                    isGroupActive && !isCollapsed
                                        ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400'
                                        : 'text-on-surface-variant dark:text-gray-400 hover:bg-surface-container-high dark:hover:bg-gray-800 hover:text-on-surface dark:hover:text-gray-200',
                                    isCollapsed && 'justify-center'
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors",
                                    isGroupActive
                                        ? 'bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary-400'
                                        : 'bg-surface-container-high dark:bg-gray-800 text-on-surface-variant dark:text-gray-400 group-hover:bg-surface-container-highest dark:group-hover:bg-gray-700'
                                )}>
                                    <group.icon className="w-4 h-4" />
                                </div>
                                {!isCollapsed && (
                                    <>
                                        <span className="text-[13px] font-bold flex-1 text-right leading-none">
                                            {group.label}
                                        </span>
                                        <ChevronDown className={cn(
                                            "w-4 h-4 transition-transform duration-200",
                                            isExpanded && "rotate-180"
                                        )} />
                                    </>
                                )}
                            </button>

                            <div
                                className={cn(
                                    "grid transition-all duration-200 overflow-hidden",
                                    !isCollapsed && isExpanded
                                        ? "grid-rows-[1fr] opacity-100"
                                        : "grid-rows-[0fr] opacity-0"
                                )}
                            >
                                <div className="overflow-hidden">
                                    <div className="space-y-0.5 pr-2 border-r-2 border-outline-variant/20 dark:border-gray-800 mr-3 py-1">
                                        {group.items.map((item) => {
                                            const active = isActive(item.href, item.exact);
                                            const Icon = item.icon;
                                            return (
                                                <Link
                                                    key={item.href}
                                                    href={item.href}
                                                    onClick={onNavigate}
                                                    className={cn(
                                                        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
                                                        active
                                                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 font-medium shadow-sm'
                                                            : 'text-on-surface-variant/70 dark:text-gray-500 hover:bg-surface-container-high dark:hover:bg-gray-800 hover:text-on-surface dark:hover:text-gray-300',
                                                    )}
                                                >
                                                    <Icon className={cn(
                                                        "w-3.5 h-3.5 flex-shrink-0 transition-colors",
                                                        active
                                                            ? 'text-primary dark:text-primary-400'
                                                            : 'text-on-surface-variant/40 dark:text-gray-600 group-hover:text-on-surface-variant dark:group-hover:text-gray-400'
                                                    )} />
                                                    <span className="text-[12px] leading-none">{item.label}</span>
                                                    {active && (
                                                        <span className="mr-auto w-1.5 h-1.5 rounded-full bg-primary dark:bg-primary-400 flex-shrink-0" />
                                                    )}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </nav>

            <div className="px-3 py-4 border-t border-outline-variant/20 dark:border-gray-800 space-y-1 flex-shrink-0">
                <Link
                    href={"/" + currentSlug}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                        "text-on-surface-variant dark:text-gray-400 hover:bg-surface-container-high dark:hover:bg-gray-800",
                        isCollapsed && 'justify-center'
                    )}
                    title="مشاهده سایت"
                >
                    <Home className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="text-[13px]">مشاهده سایت</span>}
                </Link>

                <Link
                    href="/admin/settings"
                    onClick={onNavigate}
                    className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200",
                        isActive('/admin/settings')
                            ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400'
                            : 'text-on-surface-variant dark:text-gray-400 hover:bg-surface-container-high dark:hover:bg-gray-800',
                        isCollapsed && 'justify-center'
                    )}
                    title="تنظیمات سیستم"
                >
                    <Settings className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="text-[13px]">تنظیمات سیستم</span>}
                </Link>

                <button
                    onClick={() => {
                        localStorage.removeItem('accessToken');
                        window.location.href = '/admin/login';
                    }}
                    className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-error/60 dark:text-red-400/60 hover:bg-error/5 dark:hover:bg-red-900/20 hover:text-error dark:hover:text-red-400",
                        isCollapsed && 'justify-center'
                    )}
                    title="خروج"
                >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="text-[13px]">خروج</span>}
                </button>
            </div>
        </div>
    );

    // ============================================================
    // 🖥️ رندر اصلی
    // ============================================================
    return (
        <PageMetaContext.Provider value={{ pageMeta, setPageMeta }}>
            <div className="min-h-screen flex bg-surface dark:bg-gray-950" dir="rtl">
                {/* سایدبار دسکتاپ */}
                <aside
                    className={cn(
                        "hidden lg:flex flex-col fixed top-0 right-0 h-full bg-white dark:bg-gray-900 border-l border-outline-variant/20 dark:border-gray-800 transition-all duration-300 z-40 shadow-sm",
                        isCollapsed ? 'w-[72px]' : 'w-64'
                    )}
                >
                    <SidebarContent />
                </aside>

                <div
                    className={cn(
                        "flex-1 flex flex-col min-h-screen transition-all duration-300",
                        isCollapsed ? 'lg:mr-[72px]' : 'lg:mr-64'
                    )}
                >
                    {/* ⭐ هدر دسکتاپ - fixed */}
                    <header className="hidden lg:flex items-center justify-between h-16 px-6 bg-white dark:bg-gray-900 border-b border-outline-variant/20 dark:border-gray-800 fixed top-0 left-0 right-0 z-30">
                        <div className="flex items-center gap-3 min-w-0">
                            {showBackButton && (
                                <button
                                    onClick={() => {
                                        if (pageMeta.onBack) pageMeta.onBack();
                                        else if (pageMeta.backUrl) router.push(pageMeta.backUrl);
                                        else router.back();
                                    }}
                                    className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-surface-container-high dark:hover:bg-gray-800 transition-colors flex-shrink-0"
                                >
                                    <ArrowRight className="w-4 h-4 text-on-surface-variant dark:text-gray-400" />
                                </button>
                            )}
                            <div className="min-w-0">
                                <h1 className="text-base font-bold text-on-surface dark:text-gray-100 truncate">
                                    {headerTitle}
                                </h1>
                                {headerSubtitle && (
                                    <p className="text-[11px] text-on-surface-variant/60 dark:text-gray-500 mt-0.5 truncate">
                                        {headerSubtitle}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {isTopLevelPage && !pageMeta.title && (
                                <Link
                                    href="/admin/arm/create"
                                    className="flex items-center gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    ساخت بازار جدید
                                </Link>
                            )}
                            <ThemeToggle />
                        </div>
                    </header>

                    {/* ⭐ هدر موبایل - fixed */}
                    <div className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 border-b border-outline-variant/20 dark:border-gray-800 px-4 h-14 flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            {showBackButton ? (
                                <button
                                    onClick={() => {
                                        if (pageMeta.onBack) pageMeta.onBack();
                                        else if (pageMeta.backUrl) router.push(pageMeta.backUrl);
                                        else router.back();
                                    }}
                                    className="p-1.5 hover:bg-surface-container-high dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                                >
                                    <ArrowRight className="w-5 h-5 text-on-surface-variant dark:text-gray-400" />
                                </button>
                            ) : (
                                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-bold text-xs">س</span>
                                </div>
                            )}
                            <span className="font-bold text-sm text-on-surface dark:text-gray-100 truncate">
                            {headerTitle}
                        </span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <ThemeToggle />
                            <button
                                onClick={() => setMobileOpen(true)}
                                className="p-2 hover:bg-surface-container-high dark:hover:bg-gray-800 rounded-xl transition-colors"
                            >
                                <Menu className="w-5 h-5 text-on-surface-variant dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* ⭐ اسپیسر برای جبران ارتفاع هدر */}
                    <div className="h-16 lg:h-16 flex-shrink-0 hidden lg:block" />
                    <div className="h-14 lg:hidden flex-shrink-0" />

                    <main className="flex-1 overflow-y-auto">
                        <div className="p-4 lg:p-6">
                            {children}
                        </div>
                    </main>
                </div>

                {mobileOpen && (
                    <>
                        <div
                            className="lg:hidden fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40"
                            onClick={() => setMobileOpen(false)}
                        />
                        <div className="lg:hidden fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 z-50 shadow-2xl animate-slide-in-right">
                            <div className="flex items-center justify-between h-14 px-4 border-b border-outline-variant/20 dark:border-gray-800">
                                <span className="font-bold text-sm text-on-surface dark:text-gray-100">منوی مدیریت</span>
                                <button
                                    onClick={() => setMobileOpen(false)}
                                    className="p-2 hover:bg-surface-container-high dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    <X className="w-5 h-5 text-on-surface-variant dark:text-gray-400" />
                                </button>
                            </div>
                            <SidebarContent onNavigate={() => setMobileOpen(false)} />
                        </div>
                    </>
                )}
            </div>
        </PageMetaContext.Provider>
    );
}