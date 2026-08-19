// app/components/MobileHeader.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import {
    ArrowRight,
    Headphones,
    Menu,
    X,
    User,
    Sun,
    Moon,
    LogOut,
    Store,
    ShieldCheck,
    Info,
    FileText,
    ChevronLeft
} from 'lucide-react';
import { RootState } from '@/lib/store/store';
import { useArms } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import Image from 'next/image';
import { LocationFilter } from '@/app/components/LocationFilter';
import { useFilters } from '@/lib/hooks/useFilters';
import { performLogout } from '@/lib/store/slices/authSlice';
import {ThemeToggle} from "@/app/components/ThemeToggle";

interface MobileHeaderProps {
    showLocation?: boolean;
    fixed?: boolean;
    showBack?: boolean;
}

export default function MobileHeader({ showLocation = false, showBack = false, fixed = true }: MobileHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const params = useParams();
    const dispatch = useDispatch();
    const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
    const { currentArm, currentSlug } = useSelector((state: RootState) => state.arm);
    const { location } = useFilters();
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
        if (!isAuthenticated) { router.push(`/login?redirect=/`); return; }
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
    const logoUrl = (currentArm as any)?.config?.general?.logoUrl || currentArm?.logoUrl;
    const logoSrc = logoFileId ? `${API_BASE}/file/${logoFileId}` : logoUrl || '/images/logo.png';
    const showJoin = isHomePage && (!isAuthenticated || !isMember) && !armsLoading;
    const showTestBadge = currentArm?.config?.general?.showTestBadge ?? true;
    const testBadgeText = currentArm?.config?.general?.testBadgeText
    return (
        <header className={`lg:hidden z-40 bg-white dark:bg-gray-900 border-b border-outline-variant/20 dark:border-gray-800 ${fixed ? 'sticky top-0' : ''}`}>
            <div className="flex items-center justify-between px-4 h-16">
                <div className="flex items-center gap-1 flex-1 min-w-0">
                    {showBack && (
                        <button onClick={() => router.back()} className="p-1.5 -ml-1">
                            <ArrowRight className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                        </button>
                    )}
                    <div className="w-16 h-16 cursor-pointer relative rounded-lg overflow-hidden flex-shrink-0" onClick={() => router.push('/')}>
                        <Image src={logoSrc} alt="Logo" fill className="object-contain" unoptimized={logoSrc.startsWith('http')}  />
                    </div>
                    <div className="flex flex-col text-right min-w-0">
                        <div className="flex items-center gap-1.5">
                            <button onClick={() => router.push('/')} className="pb-2 font-bold text-gray-900 dark:text-gray-100 text-[13px] leading-tight truncate">
                                {armName}
                            </button>

                        {/*    {showJoin && (
                                <button onClick={handleJoinClick} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white px-2 py-0.5 rounded text-[9px] font-bold disabled:opacity-50 transition-colors">
                                    {isJoining ? '...' : 'عضویت'}
                                </button>
                            )}*/}
                        </div>
                        <span className=" text-gray-400 dark:text-gray-500 text-[10px] leading-tight truncate">
                            {armSlogan}
                        </span>
                    </div>
                </div>

                {/* دکمه منو همبرگری */}
                <div className="flex items-center gap-1">
                    <button
                        ref={buttonRef}
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </div>

                {/* پنل منوی کشویی */}
                {menuOpen && (
                    <div
                        ref={menuRef}
                        className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 shadow-2xl z-[100] overflow-y-auto"
                    >
                        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="font-bold text-sm text-on-surface dark:text-gray-100">منو</h3>
                            <button onClick={() => setMenuOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="py-2">
                            {isAuthenticated && (
                                <>
                                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.fullName || 'کاربر'}</p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{user?.phone}</p>
                                    </div>
                                    <button onClick={() => { setMenuOpen(false); router.push('/profile'); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-right">
                                        <User className="w-4 h-4" /> پنل کاربری
                                    </button>
                                </>
                            )}



                            {isArmOwner && (
                                <button onClick={() => { setMenuOpen(false); router.push('/arm-admin'); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-right">
                                    <Store className="w-4 h-4" /> پنل مالک بازار
                                </button>
                            )}
                            {/* حالت تاریک */}
                            <ThemeToggle />
                            {user?.role === 'system_admin' && (
                                <button onClick={() => { setMenuOpen(false); router.push('/admin'); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-primary hover:bg-primary/10 text-right">
                                    <ShieldCheck className="w-4 h-4" /> پنل ادمین
                                </button>
                            )}

                            <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>

                            <button onClick={() => { setMenuOpen(false); router.push('/docs/about'); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-right">
                                <Info className="w-4 h-4" /> درباره {armName}
                            </button>
                            <button onClick={() => { setMenuOpen(false); router.push('/docs/terms'); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 text-right">
                                <FileText className="w-4 h-4" /> قوانین
                            </button>

                            {isAuthenticated && (
                                <>
                                    <div className="border-t border-gray-100 dark:border-gray-700 my-2"></div>
                                    <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 text-right">
                                        <LogOut className="w-4 h-4" /> خروج
                                    </button>
                                </>
                            )}

                            {!isAuthenticated && (
                                <button onClick={() => { setMenuOpen(false); router.push('/login'); }} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-primary font-medium">
                                    ورود / ثبت‌نام
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}