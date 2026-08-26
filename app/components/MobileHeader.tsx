// app/components/MobileHeader.tsx
'use client';

import React, {useEffect, useState, useRef, useMemo} from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
    ArrowRight,
    User,
    LogOut,
    Store,
    ShieldCheck,
    Info,
    FileText,
    ChevronDown,
    Lightbulb,
    X,
    UserPlus,
    Loader2,
} from 'lucide-react';
import { RootState } from '@/lib/store/store';
import { useArms } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import Image from 'next/image';
import { performLogout } from '@/lib/store/slices/authSlice';
import { ThemeToggle } from '@/app/components/ThemeToggle';
import JoinArmModal from '@/app/components/JoinArmModal';

interface MobileHeaderProps {
    showLocation?: boolean;
    fixed?: boolean;
    showBack?: boolean;
}

export default function MobileHeader({
                                         showLocation = false,
                                         showBack = false,
                                         fixed = true,
                                     }: MobileHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const dispatch = useDispatch();

    const { isAuthenticated, user } = useSelector(
        (state: RootState) => state.auth
    );

    const { currentArm, currentSlug } = useSelector(
        (state: RootState) => state.arm
    );

    const [isMember, setIsMember] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [armSwitcherOpen, setArmSwitcherOpen] = useState(false);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const switcherRef = useRef<HTMLDivElement>(null);
    const switcherButtonRef = useRef<HTMLButtonElement>(null);

    const isHomePage = pathname === `/${params.slug}` || pathname === '/';
    const { data: arms, isLoading: armsLoading, refetch: refetchArms } = useArms();

    const isArmOwner = useMemo(() => {
        if (!user || !currentSlug || !arms) return false;
        return arms.some((a: any) => a.role === 'arm_owner' && a.slug === currentSlug);
    }, [arms, currentSlug, user]);

    useEffect(() => {
        if (!isAuthenticated || !currentSlug || !arms) {
            setIsMember(false);
            return;
        }
        const member = arms.some(
            (a: any) => a.slug === currentSlug && a.status === 'active'
        );
        setIsMember(member);
    }, [isAuthenticated, currentSlug, arms]);

    useEffect(() => {
        if (!menuOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(e.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(e.target as Node)
            ) {
                setMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    useEffect(() => {
        if (!armSwitcherOpen) return;

        const handleClickOutside = (e: MouseEvent) => {
            if (
                switcherRef.current &&
                !switcherRef.current.contains(e.target as Node) &&
                switcherButtonRef.current &&
                !switcherButtonRef.current.contains(e.target as Node)
            ) {
                setArmSwitcherOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, [armSwitcherOpen]);

    // ------------------------------------------------------------
    // پیوستن به بازار - مثل DesktopHeader
    // ------------------------------------------------------------
    const handleJoinClick = async () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/${currentSlug}`);
            return;
        }

        const armConfig = currentArm?.config as any || {};
        const requireBusiness = armConfig.accessRules?.requireBusinessForMembership ?? false;

        if (requireBusiness) {
            setIsJoinModalOpen(true);
        } else {
            setIsJoining(true);
            try {
                const result = await apiService.arm.join(currentSlug || 'barton');

                if (result?.status === 'pending') {
                    toast.success('درخواست پیوستن ثبت شد. در انتظار تأیید مدیر بازار...');
                } else {
                    toast.success('با موفقیت به بازار پیوستید');
                }

                await refetchArms();
                setIsMember(true);
            } catch (error: any) {
                if (error?.data?.errorCode === 'ALREADY_MEMBER') {
                    setIsMember(true);
                    toast.info('شما قبلاً به این بازار پیوستهاید');
                } else {
                    toast.error(error?.message || 'خطا در پیوستن به بازار');
                }
            } finally {
                setIsJoining(false);
            }
        }
    };

    const handleLogout = () => {
        setMenuOpen(false);
        dispatch(performLogout());
        router.push('/');
    };

    const switchArm = (slug: string) => {
        setArmSwitcherOpen(false);
        router.push(`/${slug}`);
    };

    const armName = currentArm?.name || 'Daymat';
    const armSlogan = currentArm?.slogan || 'قیمت امروز فروشندگان عمده مصالح';
    const armPrimaryColor = currentArm?.colorPrimary || '#a11f2c';

    const logoFile = (currentArm as any)?.config?.general?.logoFile;
    const logoSrc =
        logoFile?.path ||
        (currentArm as any)?.config?.general?.logoUrl ||
        '/images/logo.png';

    const fullName = user?.fullName || 'کاربر';
    const avatarSrc =
        user?.avatarFile?.thumbnailPath ||
        user?.avatarFile?.path ||
        null;

    const showJoin = isAuthenticated && !isMember && !armsLoading;

    const showTestBadge =
        currentArm?.config?.general?.showTestBadge ?? true;

    const testBadgeText = currentArm?.config?.general?.testBadgeText;

    const userArmsList = arms || [];

    return (
        <header
            className={`
                lg:hidden
                bg-white
                dark:bg-gray-900
                border-b
                border-outline-variant/20
                dark:border-gray-800
                ${fixed ? 'sticky top-0' : ''}
                z-40
            `}
        >
            <div className="flex items-center justify-between px-4 h-16">
                {/* سمت راست: لوگو + نام بازار */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {showBack && (
                        <button
                            onClick={() => router.back()}
                            className="p-1.5 -ml-1 flex-shrink-0"
                        >
                            <ArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    )}

                    <div
                        className="
                            cursor-pointer
                            rounded-lg
                            overflow-hidden
                            flex-shrink-0
                            bg-gray-50 dark:bg-gray-800
                        "

                        onClick={() => router.push('/')}
                    >
                        <Image
                            src={logoSrc}
                            alt="Logo"
                            width={80}
                            height={40}
                            className="object-contain w-full h-full"
                            unoptimized={logoSrc.startsWith('http')}
                            style={{ height: '40px', width: 'auto', maxWidth: '80px' }}
                        />
                    </div>

                    <div className="flex flex-col text-right min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                                onClick={() => router.push('/')}
                                className="font-bold pb-1.5 text-gray-900 dark:text-gray-100 text-[14px] leading-tight truncate"
                                style={{ color: armPrimaryColor }}
                            >
                                {armName}
                            </button>

                            {/* ✅ دکمه پیوستن */}
                            {showJoin && (
                                <button
                                    onClick={handleJoinClick}
                                    disabled={isJoining}
                                    className="
                                        inline-flex
                                        items-center
                                        gap-0.5
                                        text-[9px]
                                        px-2
                                        py-1
                                        rounded-full
                                        bg-primary
                                        text-white
                                        hover:bg-primary/90
                                        transition-colors
                                        disabled:opacity-50
                                        whitespace-nowrap
                                    "
                                >
                                    {isJoining ? (
                                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                                    ) : (
                                        <>
                                            پیوستن به بازار
                                        </>
                                    )}
                                </button>
                            )}

                            {showTestBadge && testBadgeText && (
                                <span className="inline-flex items-center text-[8px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-1.5 py-0.5 whitespace-nowrap">
                                    {testBadgeText}
                                </span>
                            )}

                            {isAuthenticated && userArmsList.length > 1 && (
                                <div className="relative">
                                    <button
                                        ref={switcherButtonRef}
                                        onClick={() =>
                                            setArmSwitcherOpen(!armSwitcherOpen)
                                        }
                                        className="
                                            flex
                                            items-center
                                            gap-0.5
                                            text-gray-400
                                            hover:text-gray-600
                                            dark:hover:text-gray-300
                                            transition-colors
                                            p-0.5
                                            rounded
                                            hover:bg-gray-100
                                            dark:hover:bg-gray-800
                                        "
                                    >
                                        <ChevronDown className="w-3.5 h-3.5" />
                                    </button>

                                    {armSwitcherOpen && (
                                        <div
                                            ref={switcherRef}
                                            className="
                                                absolute
                                                right-0
                                                top-full
                                                mt-2
                                                w-48
                                                bg-white
                                                dark:bg-gray-800
                                                border
                                                border-gray-200
                                                dark:border-gray-700
                                                rounded-xl
                                                shadow-xl
                                                py-1.5
                                                z-[100]
                                            "
                                        >
                                            <div className="px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
                                                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                                    بازارهای من
                                                </span>
                                            </div>
                                            {userArmsList.map((arm: any) => (
                                                <button
                                                    key={arm.slug}
                                                    onClick={() =>
                                                        switchArm(arm.slug)
                                                    }
                                                    className={`
                                                        w-full
                                                        flex
                                                        items-center
                                                        gap-3
                                                        px-3
                                                        py-2
                                                        text-sm
                                                        text-right
                                                        hover:bg-gray-100
                                                        dark:hover:bg-gray-700
                                                        transition-colors
                                                        ${arm.slug === currentSlug
                                                        ? 'bg-primary/5 dark:bg-primary/10 text-primary'
                                                        : 'text-gray-700 dark:text-gray-200'
                                                    }
                                                    `}
                                                >
                                                    <div className="w-6 h-6 relative rounded overflow-hidden flex-shrink-0">
                                                        <Image
                                                            src={
                                                                arm?.logoUrl || '/images/logo.png'
                                                            }
                                                            alt={arm.name}
                                                            fill
                                                            className="object-contain"
                                                            unoptimized
                                                            sizes="24px"
                                                        />
                                                    </div>
                                                    <span className="truncate flex-1">
                                                        {arm.name}
                                                    </span>
                                                    {arm.slug ===
                                                        currentSlug && (
                                                            <span className="text-[10px] text-primary">
                                                            ✓
                                                        </span>
                                                        )}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <span className="dark:text-gray-500 pt-1 text-[10px] leading-tight truncate">
                            {armSlogan}
                        </span>
                    </div>
                </div>

                {/* سمت چپ: پروفایل */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {isAuthenticated ? (
                        <div className="relative">
                            <button
                                ref={buttonRef}
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="
                                    flex
                                    items-center
                                    gap-1
                                    text-xs
                                    text-gray-500
                                    hover:text-gray-900
                                    px-1.5
                                    py-1
                                    rounded-lg
                                    hover:bg-gray-100
                                    dark:hover:bg-gray-800
                                    transition-colors
                                "
                            >
                                {avatarSrc ? (
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                                        <Image
                                            src={avatarSrc}
                                            alt={fullName}
                                            width={32}
                                            height={32}
                                            className="w-full h-full object-cover"
                                            unoptimized={avatarSrc.startsWith(
                                                'http'
                                            )}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        <User className="w-4 h-4 text-gray-400" />
                                    </div>
                                )}
                                <ChevronDown className="w-3.5 h-3.5" />
                            </button>

                            {menuOpen && (
                                <div
                                    ref={menuRef}
                                    className="
                                        absolute
                                        left-0
                                        top-full
                                        mt-2
                                        w-64
                                        bg-white
                                        dark:bg-gray-900
                                        border
                                        border-gray-200
                                        dark:border-gray-700
                                        rounded-xl
                                        shadow-xl
                                        py-1.5
                                        z-[100]
                                    "
                                >
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                {fullName}
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                                {user?.phone}
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => setMenuOpen(false)}
                                            className="
                                                p-1.5
                                                rounded-lg
                                                hover:bg-gray-100
                                                dark:hover:bg-gray-700
                                                transition-colors
                                                flex-shrink-0
                                                mr-1
                                            "
                                            aria-label="بستن منو"
                                        >
                                            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        </button>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setMenuOpen(false);
                                            router.push('/profile');
                                        }}
                                        className="
                                            w-full
                                            flex
                                            items-center
                                            gap-2
                                            px-4
                                            py-2.5
                                            text-sm
                                            text-gray-700
                                            dark:text-gray-200
                                            hover:bg-gray-100
                                            dark:hover:bg-gray-800
                                            transition-colors
                                            text-right
                                        "
                                    >
                                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        پروفایل من
                                    </button>

                                    {isArmOwner && (
                                        <button
                                            onClick={() => {
                                                setMenuOpen(false);
                                                router.push('/arm-admin');
                                            }}
                                            className="
                                                w-full
                                                flex
                                                items-center
                                                gap-2
                                                px-4
                                                py-2.5
                                                text-sm
                                                text-emerald-600
                                                dark:text-emerald-400
                                                hover:bg-emerald-50
                                                dark:hover:bg-emerald-900/20
                                                transition-colors
                                                text-right
                                            "
                                        >
                                            <Store className="w-4 h-4" />
                                            پنل مالک بازار
                                        </button>
                                    )}

                                    {user?.role === 'system_admin' && (
                                        <button
                                            onClick={() => {
                                                setMenuOpen(false);
                                                router.push('/admin');
                                            }}
                                            className="
                                                w-full
                                                flex
                                                items-center
                                                gap-2
                                                px-4
                                                py-2.5
                                                text-sm
                                                text-primary
                                                hover:bg-primary/10
                                                dark:hover:bg-primary/20
                                                transition-colors
                                                text-right
                                            "
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                            پنل ادمین
                                        </button>
                                    )}

                                    <ThemeToggle />

                                    <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                                    {/* آگهی‌های ذخیره‌شده */}
                                    <button
                                        onClick={() => {
                                            setMenuOpen(false);
                                            router.push('/saved-ads');
                                        }}
                                        className="
                                            w-full
                                            flex
                                            items-center
                                            gap-2
                                            px-4
                                            py-2.5
                                            text-sm
                                            text-gray-700
                                            dark:text-gray-200
                                            hover:bg-gray-100
                                            dark:hover:bg-gray-800
                                            transition-colors
                                            text-right
                                        "
                                    >
                                        <Bookmark className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        آگهی‌های ذخیره‌شده
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMenuOpen(false);
                                            router.push('/docs/about');
                                        }}
                                        className="
                                            w-full
                                            flex
                                            items-center
                                            gap-2
                                            px-4
                                            py-2.5
                                            text-sm
                                            text-gray-700
                                            dark:text-gray-200
                                            hover:bg-gray-100
                                            dark:hover:bg-gray-800
                                            transition-colors
                                            text-right
                                        "
                                    >
                                        <Info className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        درباره {armName}
                                    </button>

                                    <button
                                        onClick={() => {
                                            setMenuOpen(false);
                                            router.push('/docs/terms');
                                        }}
                                        className="
                                            w-full
                                            flex
                                            items-center
                                            gap-2
                                            px-4
                                            py-2.5
                                            text-sm
                                            text-gray-700
                                            dark:text-gray-200
                                            hover:bg-gray-100
                                            dark:hover:bg-gray-800
                                            transition-colors
                                            text-right
                                        "
                                    >
                                        <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        قوانین
                                    </button>

                                    <button
                                        onClick={() => {
                                            setMenuOpen(false);
                                            router.push('/feedback');
                                        }}
                                        className="
                                            w-full
                                            flex
                                            items-center
                                            gap-2
                                            px-4
                                            py-2.5
                                            text-sm
                                            text-gray-700
                                            dark:text-gray-200
                                            hover:bg-gray-100
                                            dark:hover:bg-gray-800
                                            transition-colors
                                            text-right
                                        "
                                    >
                                        <Lightbulb className="w-4 h-4 text-yellow-500 dark:text-yellow-400" />
                                        پیشنهادات و انتقادات
                                    </button>

                                    <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                                    <div
                                        className="
                                            px-4
                                            py-3
                                            border-t
                                            border-gray-100
                                            dark:border-gray-700
                                            mt-1
                                        "
                                    >
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-40 h-15 relative">
                                                <Image
                                                    src="/images/logo2.png"
                                                    alt="دیمت"
                                                    width={40}
                                                    height={10}
                                                    className="w-full h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={() => router.push(`/login?redirect=/${currentSlug}`)}
                            className="
                                text-xs
                                text-gray-500
                                hover:text-gray-900
                                dark:hover:text-gray-300
                                px-2
                                py-1.5
                                rounded-lg
                                hover:bg-gray-100
                                dark:hover:bg-gray-800
                                transition-colors
                            "
                        >
                            ورود
                        </button>
                    )}
                </div>
            </div>

            {/* ✅ مدال پیوستن */}
            <JoinArmModal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
            />
        </header>
    );
}