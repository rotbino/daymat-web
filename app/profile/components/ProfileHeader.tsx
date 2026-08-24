// app/profile/components/ProfileHeader.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { User, Store, Settings, LayoutDashboard, Pencil, Lightbulb } from 'lucide-react';

interface ProfileHeaderProps {
    user: any;
    business: any;
    isArmOwner: boolean;
    isSystemAdmin: boolean;
    onEditClick: () => void;
}

export default function ProfileHeader({ user, business, isArmOwner, isSystemAdmin, onEditClick }: ProfileHeaderProps) {
    const router = useRouter();

    // ✅ استفاده مستقیم از thumbnailPath آروان
    const avatarUrl = user?.avatarFile?.thumbnailPath || user?.avatarFile?.path || null;

    const hasBusiness = !!business;
    const hasName = user?.fullName && user.fullName !== '' && user.fullName !== 'کاربر مهمان';

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4 shadow-sm">
            {/* ✅ موبایل: افقی (عکس کنار اطلاعات) */}
            <div className="flex lg:hidden items-center gap-4">
                {/* آواتار */}
                <div className="relative flex-shrink-0">
                    <button
                        onClick={onEditClick}
                        className="relative"
                        title="ویرایش پروفایل"
                    >
                        <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center border-3 border-primary/20 dark:border-primary/30 overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={user?.fullName || 'کاربر'} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-8 h-8 text-primary" />
                            )}
                        </div>
                        <div className="absolute bottom-0 -right-1 bg-primary text-white p-1 rounded-full shadow-lg">
                            <Pencil className="w-3 h-3" />
                        </div>
                    </button>
                </div>

                {/* اطلاعات */}
                <div className="flex-1 min-w-0">
                    {hasName ? (
                        <>
                            <h1 className="text-base font-bold text-on-surface dark:text-gray-100 truncate">
                                {user.fullName}
                            </h1>
                            <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-0.5" dir="ltr">
                                {user?.phone || ''}
                            </p>
                            {user?.bio && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 text-[10px] rounded-full font-medium mt-1">
                                    <Store className="w-3 h-3" /> {user.bio}
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            <h1 className="text-base font-bold text-on-surface dark:text-gray-100">
                                پروفایل را تکمیل کنید.
                            </h1>
                            <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-0.5" dir="ltr">
                                {user?.phone || ''}
                            </p>
                            <button
                                onClick={onEditClick}
                                className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                <Pencil className="w-3 h-3" />
                                ویرایش پروفایل
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* ✅ دسکتاپ: عمودی (عکس بالا و اطلاعات پایین) */}
            <div className="hidden lg:flex flex-col items-center text-center">
                {/* آواتار */}
                <div className="relative mb-4">
                    <button
                        onClick={onEditClick}
                        className="relative"
                        title="ویرایش پروفایل"
                    >
                        <div className="w-24 h-24 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center border-4 border-primary/20 dark:border-primary/30 overflow-hidden">
                            {avatarUrl ? (
                                <img src={avatarUrl} alt={user?.fullName || 'کاربر'} className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-12 h-12 text-primary" />
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-lg">
                            <Pencil className="w-4 h-4" />
                        </div>
                    </button>
                </div>

                {/* اطلاعات */}
                <div className="w-full">
                    {hasName ? (
                        <>
                            <h1 className="text-lg font-bold text-on-surface dark:text-gray-100 truncate">
                                {user.fullName}
                            </h1>
                            <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-1" dir="ltr">
                                {user?.phone || ''}
                            </p>
                            {user?.bio && (
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 text-xs rounded-full font-medium mt-2">
                                    <Store className="w-3 h-3" /> {user.bio}
                                </span>
                            )}
                        </>
                    ) : (
                        <>
                            <h1 className="text-lg font-bold text-on-surface dark:text-gray-100">
                                پروفایل را تکمیل کنید.
                            </h1>
                            <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-1" dir="ltr">
                                {user?.phone || ''}
                            </p>
                            <button
                                onClick={onEditClick}
                                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                <Pencil className="w-3.5 h-3.5" />
                                ویرایش پروفایل
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}