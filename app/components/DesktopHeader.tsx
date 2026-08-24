// app/components/DesktopHeader.tsx
'use client';

import React, {useEffect, useState, useRef, useMemo} from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
    Plus,
    User,
    ChevronDown,
    LogOut,
    ShieldCheck,
    Store,
    Info,
    FileText,
    Lightbulb, X,
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

interface DesktopHeaderProps {
    showLocation?: boolean;
    fixed?: boolean;
    showBack?: boolean;
}

export default function DesktopHeader({
                                          showLocation = false,
                                          showBack = true,
                                          fixed = true,
                                      }: DesktopHeaderProps) {
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

    // ✅ بررسی مالک بودن کاربر در بازاری فعلی با استفاده از arms
    const isArmOwner = useMemo(() => {
        if (!user || !currentSlug || !arms) return false;
        return arms.some((a: any) => a.role === 'arm_owner' && a.slug === currentSlug);
    }, [arms, currentSlug, user]);

    // ------------------------------------------------------------
    // بررسی پیوستن کاربر به بازار فعلی
    // ------------------------------------------------------------
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

    // ------------------------------------------------------------
    // بستن منوی کاربر با کلیک بیرون
    // ------------------------------------------------------------
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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    // ------------------------------------------------------------
    // بستن منوی سوئیچر بازار با کلیک بیرون
    // ------------------------------------------------------------
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
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [armSwitcherOpen]);

    // ------------------------------------------------------------
    // پیوستن به بازار
    // ------------------------------------------------------------
    const handleJoinClick = async () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/${currentSlug}`);
            return;
        }

        // ✅ بررسی تنظیمات: آیا نیاز به کسبوکار داره؟
        const armConfig = currentArm?.config as any || {};
        const requireBusiness = armConfig.accessRules?.requireBusinessForMembership ?? false;

        if (requireBusiness) {
            // ✅ باز کردن مدال انتخاب کسبوکار
            setIsJoinModalOpen(true);
        } else {
            // ✅ مستقیم join کن
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

    // ------------------------------------------------------------
    // خروج
    // ------------------------------------------------------------
    const handleLogout = () => {
        setMenuOpen(false);
        dispatch(performLogout());
        router.push('/');
    };

    // ------------------------------------------------------------
    // تغییر بازار
    // ------------------------------------------------------------
    const switchArm = (slug: string) => {
        setArmSwitcherOpen(false);
        router.push(`/${slug}`);
    };

    // ------------------------------------------------------------
    // اطلاعات بازاری فعلی
    // ------------------------------------------------------------
    const armName = currentArm?.name || 'Daymat';
    const armSlogan = currentArm?.slogan || 'قیمت امروز فروشندگان عمده مصالح';
    const armPrimaryColor = currentArm?.colorPrimary || '#a11f2c';

    const logoFile = (currentArm as any)?.config?.general?.logoFile;
    const logoSrc =
        logoFile?.path ||
        (currentArm as any)?.config?.general?.logoUrl ||
        '/images/logo.png';

    // ------------------------------------------------------------
    // اطلاعات کاربر
    // ------------------------------------------------------------
    const fullName = user?.fullName || 'کاربر';
    const avatarSrc = user?.avatarFile?.thumbnailPath || user?.avatarFile?.path || null;

    const showJoin = isAuthenticated && !isMember && !armsLoading;

    const showTestBadge = currentArm?.config?.general?.showTestBadge ?? true;
    const testBadgeText = currentArm?.config?.general?.testBadgeText;

    const userArmsList = arms || [];

    // ============================================================
    // RENDER
    // ============================================================

    return (
        <header
            className={`
                hidden lg:block
                bg-white
                dark:bg-gray-900
                border-b
                border-outline-variant/20
                ${fixed ? 'sticky top-0 left-0 right-0 z-50 w-full' : ''}
            `}
        >
            <div
                className="
                    flex
                    items-center
                    justify-between
                    px-6
                    lg:px-8
                    h-[72px]
                "
            >
                <div className="flex items-center gap-3">

                    <div className="flex items-center gap-3">
                        {/* لوگوی بازار */}
                        <div
                            className="
        cursor-pointer
        relative
        rounded-lg
        overflow-hidden
        hover:opacity-80
        transition-opacity
        p-0.5
        flex-shrink-0
    "
                            style={{ width: 'auto', height: '60px' }}
                            onClick={() => router.push('/')}
                        >
                            <Image
                                src={logoSrc}
                                alt={armName}
                                width={0}
                                height={60}
                                className="w-auto h-full object-contain"
                                unoptimized={logoSrc.startsWith('http')}
                                sizes="auto"
                            />
                        </div>

                        {/* نام و شعار بازار */}
                        <div className="flex flex-col text-right">
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => router.push('/')}
                                    className="
                                        font-bold
                                        text-gray-900
                                        dark:text-gray-100
                                        text-[16px]
                                        leading-tight
                                        hover:opacity-80
                                        transition-opacity
                                    "
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
                                            gap-1
                                            text-[10px]
                                            px-2.5
                                            py-1.5
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
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                        ) : (
                                            <>
                                                <UserPlus className="w-3 h-3" />
                                                پیوستن به بازار
                                            </>
                                        )}
                                    </button>
                                )}

                                {showTestBadge && testBadgeText && (
                                    <span
                                        className="
                                            inline-flex
                                            items-center
                                            text-[9px]
                                            font-medium
                                            text-primary
                                            bg-primary/10
                                            border
                                            border-primary/20
                                            rounded-full
                                            px-1.5
                                            py-0.5
                                            whitespace-nowrap
                                        "
                                    >
                                        {testBadgeText}
                                    </span>
                                )}

                                {/* سوئیچر بازار (اگر بیش از یک بازار عضو باشه) */}
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
                                            <ChevronDown className="w-4 h-4" />
                                        </button>

                                        {armSwitcherOpen && (
                                            <div
                                                ref={switcherRef}
                                                className="
                                                    absolute
                                                    right-0
                                                    top-full
                                                    mt-2
                                                    w-56
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

                            {/* شعار بازار */}
                            {armSlogan && (
                                <span
                                    className="
                                    text-gray-400
                                    dark:text-gray-500
                                    text-[11px]
                                    mt-2
                                "
                                >
                                {armSlogan}
                            </span>
                            )}

                        </div>
                    </div>
                </div>

                {/* ==================================================
                    سمت راست: ثبت قیمت + پروفایل
                ================================================== */}
                <div className="flex items-center gap-3">
                    {/* ثبت قیمت */}
                    <button
                        onClick={() =>
                            router.push(`/ad/create?arm=${currentSlug}`)
                        }
                        className="
                            flex
                            items-center
                            gap-1.5
                            bg-gray-900
                            hover:bg-gray-800
                            text-white
                            text-xs
                            font-medium
                            px-4
                            py-2
                            rounded-lg
                            transition-colors
                            shadow-sm
                        "
                    >
                        <Plus className="w-4 h-4" />
                        ثبت قیمت
                    </button>

                    {/* ==================================================
                        پروفایل / منوی کاربری
                    ================================================== */}
                    {isAuthenticated ? (
                        <div className="relative">
                            {/* دکمه پروفایل */}
                            <button
                                ref={buttonRef}
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="
                                    flex
                                    items-center
                                    gap-1.5
                                    text-xs
                                    text-gray-500
                                    hover:text-gray-900
                                    px-2
                                    py-1
                                    rounded-lg
                                    hover:bg-gray-100
                                    dark:hover:bg-gray-800
                                    transition-colors
                                "
                            >
                                {avatarSrc ? (
                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                                        <Image
                                            src={avatarSrc}
                                            alt={fullName}
                                            width={32}
                                            height={32}
                                            className="
                                                w-full
                                                h-full
                                                object-cover
                                            "
                                            unoptimized={avatarSrc.startsWith(
                                                'http'
                                            )}
                                        />
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                                        <Image
                                            src="/images/no_profile_image.jpg"
                                            alt="بدون تصویر"
                                            width={32}
                                            height={32}
                                            className="
                                                w-full
                                                h-full
                                                object-cover
                                            "
                                        />
                                    </div>
                                )}
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {/* ==================================================
                                منوی کاربر
                            ================================================== */}
                            {menuOpen && (
                                <div
                                    ref={menuRef}
                                    className="
                                        absolute
                                        left-0
                                        top-full
                                        mt-2
                                        w-60
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
                                    {/* سربرگ کاربر + دکمه بستن */}
                                    <div
                                        className="
        px-4
        py-2
        border-b
        border-gray-100
        dark:border-gray-700
        flex
        items-center
        justify-between
    "
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p
                                                className="
                text-sm
                font-semibold
                text-gray-900
                dark:text-gray-100
                truncate
            "
                                            >
                                                {fullName}
                                            </p>

                                            <p
                                                className="
                                                        text-[10px]
                                                        text-gray-500
                                                        dark:text-gray-400
                                                    "
                                            >
                                                {user?.phone}
                                            </p>
                                        </div>

                                        {/* دکمه بستن منو */}
                                        <button
                                            onClick={() => setMenuOpen(false)}
                                            className="
                                                p-1
                                                rounded-lg
                                                hover:bg-gray-100
                                                dark:hover:bg-gray-700
                                                transition-colors
                                                flex-shrink-0
                                                ml-2
                                            "
                                            aria-label="بستن منو"
                                        >
                                            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        </button>
                                    </div>

                                    {/* پروفایل من */}
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
                                            dark:hover:bg-gray-700
                                            transition-colors
                                            text-right
                                        "
                                    >
                                        <User
                                            className="
                                                w-4
                                                h-4
                                                text-gray-500
                                                dark:text-gray-400
                                            "
                                        />

                                        پروفایل من
                                    </button>

                                    {/* مدیریت بازار */}
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
                                            <Store
                                                className="
                                                    w-4
                                                    h-4
                                                "
                                            />

                                            پنل مالک بازار
                                        </button>
                                    )}

                                    {/* پنل ادمین */}
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
                                            <ShieldCheck
                                                className="
                                                    w-4
                                                    h-4
                                                "
                                            />

                                            پنل ادمین
                                        </button>
                                    )}

                                    {/* حالت تاریک */}
                                    <ThemeToggle />

                                    {/* جداکننده */}
                                    <div
                                        className="
                                            border-t
                                            border-gray-100
                                            dark:border-gray-700
                                            my-1
                                        "
                                    />

                                    {/* درباره ما */}
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
                                            dark:hover:bg-gray-700
                                            transition-colors
                                            text-right
                                        "
                                    >
                                        <Info
                                            className="
                                                w-4
                                                h-4
                                                text-gray-500
                                                dark:text-gray-400
                                            "
                                        />

                                        درباره {armName}
                                    </button>

                                    {/* قوانین */}
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
                                            dark:hover:bg-gray-700
                                            transition-colors
                                            text-right
                                        "
                                    >
                                        <FileText
                                            className="
                                                w-4
                                                h-4
                                                text-gray-500
                                                dark:text-gray-400
                                            "
                                        />

                                        قوانین
                                    </button>

                                    {/* پیشنهادات و انتقادات */}
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
                                            dark:hover:bg-gray-700
                                            transition-colors
                                            text-right
                                        "
                                    >
                                        <Lightbulb
                                            className="
                                                w-4
                                                h-4
                                                text-yellow-500
                                                dark:text-yellow-400
                                            "
                                        />

                                        پیشنهادات و انتقادات
                                    </button>

                                    {/* جداکننده */}
                                    <div
                                        className="
                                            border-t
                                            border-gray-100
                                            dark:border-gray-700
                                            my-1
                                        "
                                    />

                                    {/* قدرت گرفته از دی مت */}
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
                                            <div className="w-40 h-10 relative">
                                                <Image
                                                    src="/images/logo2.png"
                                                    alt="دیمت"
                                                    width={20}
                                                    height={20}
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
                                px-3
                                py-2
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