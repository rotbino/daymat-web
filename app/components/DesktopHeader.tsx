// app/components/DesktopHeader.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import { Plus, User, ChevronDown, LogOut, Sun, Moon, Settings, ShieldCheck, Store, Info, FileText } from 'lucide-react';
import { RootState } from '@/lib/store/store';
import { useArms } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import Image from 'next/image';
import { performLogout } from '@/lib/store/slices/authSlice';
import { ThemeToggle } from "@/app/components/ThemeToggle";

interface DesktopHeaderProps {
    showLocation?: boolean;
    fixed?: boolean;
    showBack?: boolean;
}

export default function DesktopHeader({ showLocation = false, showBack = true, fixed = true }: DesktopHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const { currentArm, currentSlug } = useSelector((state: RootState) => state.arm);
    const [isMember, setIsMember] = useState(false);
    const [isJoining, setIsJoining] = useState(false);
    const [isArmOwner, setIsArmOwner] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { data: arms, isLoading: armsLoading, refetch: refetchArms } = useArms();

    const menuRef = useRef<HTMLDivElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const isHomePage = pathname === `/${params.slug}` || pathname === '/';

    useEffect(() => {
        if (!isAuthenticated || !currentSlug || !arms) {
            setIsMember(false);
            return;
        }
        const member = arms.some((a: any) => a.slug === currentSlug);
        setIsMember(member);
    }, [isAuthenticated, currentSlug, arms]);

    useEffect(() => {
        const checkOwner = async () => {
            if (!user || !currentSlug) return;
            try {
                const userArms = await apiService.arm.getUserArms();
                const owner = userArms.some((a: any) => a.role === 'arm_owner' && a.slug === currentSlug);
                setIsArmOwner(owner);
            } catch (e) { setIsArmOwner(false); }
        };
        checkOwner();
    }, [user, currentSlug]);

    // بستن منو با کلیک بیرون
    useEffect(() => {
        if (!menuOpen) return;
        const handleClickOutside = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                buttonRef.current && !buttonRef.current.contains(e.target as Node)
            ) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const handleJoinClick = async () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/`);
            return;
        }
        setIsJoining(true);
        try {
            await apiService.arm.join(currentSlug || 'barton');
            toast.success('با موفقیت در بازار عضو شدید');
            await refetchArms();
            setIsMember(true);
        } catch (error: any) {
            if (error?.data?.errorCode === 'ALREADY_MEMBER') {
                setIsMember(true);
            } else {
                toast.error(error?.message || 'خطا در عضویت');
            }
        } finally {
            setIsJoining(false);
        }
    };

    const handleLogout = () => {
        setMenuOpen(false);
        dispatch(performLogout());
        router.push('/');
    };

    const armName = currentArm?.name || 'Daymat';
    const armSlogan = currentArm?.slogan || 'قیمت امروز فروشندگان عمده مصالح';
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:3011';
    const logoFileId = (currentArm as any)?.config?.general?.logoFileId || currentArm?.logoUrl;
    const logoFile = (currentArm as any)?.config?.general?.logoFile;
    const logoSrc = logoFile?.path || (currentArm as any)?.config?.general?.logoUrl || '/images/logo.png';

    const fullName = user?.fullName || 'کاربر';

    // ✅ تغییر اینجا: استفاده مستقیم از thumbnailPath آروان
    const avatarSrc = user?.avatarFile?.thumbnailPath || user?.avatarFile?.path || null;

    const showJoin = isHomePage && (!isAuthenticated || !isMember) && !armsLoading;
    const showTestBadge = currentArm?.config?.general?.showTestBadge ?? true;
    const testBadgeText = currentArm?.config?.general?.testBadgeText;

    return (
        <header className={`hidden lg:block bg-white dark:bg-gray-900 border-b border-outline-variant/20 ${fixed ? 'sticky top-0 left-0 right-0 z-50 w-full' : ''}`}>
            <div className="flex items-center justify-between px-6 lg:px-8 h-[80px]">
                {/* لوگو */}
                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 cursor-pointer relative rounded-xl overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity" onClick={() => router.push('/')}>
                        <Image src={logoSrc} alt="Logo" fill className="object-contain" unoptimized={logoSrc.startsWith('http')} sizes="44px" />
                    </div>
                    <div className="flex flex-col text-right">
                        <div className="flex items-center gap-1">
                            <button onClick={() => router.push('/')} className="font-extrabold text-gray-900 dark:text-gray-100 text-[14px] leading-tight hover:opacity-80 transition-opacity">
                                {armName}
                            </button>

                            {(showTestBadge && testBadgeText) && (
                                <span className="inline-flex items-center text-[10px] font-medium text-primary bg-primary/10 border border-primary/20 rounded-full px-1.5 py-0.5 whitespace-nowrap">
                                    {testBadgeText}
                                </span>
                            )}
                        </div>
                        <span className="text-gray-400 dark:text-gray-500 text-[11px] pt-2">{armSlogan}</span>
                    </div>
                </div>

                {/* بخش کاربر و ثبت قیمت */}
                <div className="flex items-center gap-3">
                    <button onClick={() => router.push(`/ad/create?arm=${currentSlug}`)} className="flex items-center gap-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-sm">
                        <Plus className="w-4 h-4" /> ثبت قیمت
                    </button>

                    {/* پروفایل / منوی کاربری */}
                    {isAuthenticated ? (
                        <div className="relative">
                            <button
                                ref={buttonRef}
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            >
                                {avatarSrc ? (
                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                                        <Image src={avatarSrc} alt={fullName} width={32} height={32} className="w-full h-full object-cover" unoptimized={avatarSrc.startsWith('http')} />
                                    </div>
                                ) : (
                                    <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-100 dark:bg-gray-800">
                                        <Image src="/images/no_profile_image.jpg" alt="بدون تصویر" width={32} height={32} className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <ChevronDown className="w-4 h-4" />
                            </button>

                            {menuOpen && (
                                <div
                                    ref={menuRef}
                                    className="absolute left-0 top-full mt-2 w-60 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl py-1.5 z-[100]"
                                >
                                    {/* سربرگ کاربر */}
                                    <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{fullName}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{user?.phone}</p>
                                    </div>

                                    {/* پنل */}
                                    <button
                                        onClick={() => { setMenuOpen(false); router.push('/profile'); }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-right"
                                    >
                                        <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        پنل کاربری
                                    </button>
                                    {/* مدیریت بازار (اگر مالک باشد) */}
                                    {isArmOwner && (
                                        <button
                                            onClick={() => { setMenuOpen(false); router.push('/arm-admin'); }}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors text-right"
                                        >
                                            <Store className="w-4 h-4" />
                                            پنل مالک بازار
                                        </button>
                                    )}
                                    {/* پنل ادمین (اگر ادمین باشد) */}
                                    {user?.role === 'system_admin' && (
                                        <button
                                            onClick={() => { setMenuOpen(false); router.push('/admin'); }}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primary hover:bg-primary/10 dark:hover:bg-primary/20 transition-colors text-right"
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                            پنل ادمین
                                        </button>
                                    )}

                                    {/* حالت تاریک */}
                                    <ThemeToggle />

                                    {/* جداکننده قبل از لینک‌های عمومی */}
                                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                                    {/* درباره ما */}
                                    <button
                                        onClick={() => { setMenuOpen(false); router.push('/docs/about'); }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-right"
                                    >
                                        <Info className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        درباره {armName}
                                    </button>

                                    {/* قوانین */}
                                    <button
                                        onClick={() => { setMenuOpen(false); router.push('/docs/terms'); }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-right"
                                    >
                                        <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        قوانین
                                    </button>

                                    {/* جداکننده قبل از خروج */}
                                    <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>

                                    {/* خروج */}
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-right"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        خروج
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button onClick={() => router.push('/login')} className="text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 px-3 py-2">
                            ورود
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}