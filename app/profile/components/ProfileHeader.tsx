// app/profile/components/ProfileHeader.tsx
'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { User, Store, Settings, LayoutDashboard, Pencil, Lightbulb } from 'lucide-react';
import { getApiUrl } from '@/lib/api/apiRequest';

interface ProfileHeaderProps {
    user: any;
    business: any;
    isArmOwner: boolean;
    isSystemAdmin: boolean;
    onEditClick: () => void;
}

export default function ProfileHeader({ user, business, isArmOwner, isSystemAdmin, onEditClick }: ProfileHeaderProps) {
    const router = useRouter();
    const avatarUrl = user?.avatarFile?.id
        ? getApiUrl(`/file/${user.avatarFile.id}/thumbnail`)
        : null;
    const hasBusiness = !!business;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                    <div className="w-24 h-24 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center border-4 border-primary/20 dark:border-primary/30 overflow-hidden">
                        {avatarUrl ? (
                            <img src={avatarUrl} alt={user?.fullName || 'کاربر'} className="w-full h-full object-cover" />
                        ) : (
                            <User className="w-12 h-12 text-primary" />
                        )}
                    </div>
                    <button onClick={onEditClick} className="absolute -bottom-1 -right-1 bg-primary text-white p-1.5 rounded-full shadow-lg hover:bg-primary/90 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                    </button>
                </div>
                <h1 className="text-lg font-bold text-on-surface dark:text-gray-100">
                    {user?.fullName && user.fullName !== '' && user.fullName !== 'کاربر مهمان' ? user.fullName : 'بی‌نام'}
                </h1>
                {user.bio && (
                    <span className="inline-flex items-center gap-1  px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 text-xs rounded-full font-medium">
                    <Store className="w-3 h-3" />  {user.bio || ''}  </span>
                )}
                <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-1">{user?.phone || ''}</p>


                {(isSystemAdmin || isArmOwner) && (
                    <div className="w-full mt-4 pt-4 border-t border-outline-variant/30 dark:border-gray-700 flex flex-row gap-2 flex-wrap justify-center">
                        {isSystemAdmin && (
                            <button onClick={() => router.push('/admin')} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 rounded-lg text-[13px] font-medium hover:bg-primary/20 dark:hover:bg-primary/30 transition-all whitespace-nowrap">
                                <Settings className="w-4 h-4" /> پنل ادمین
                            </button>
                        )}
                        {isArmOwner && (
                            <button onClick={() => router.push('/arm-admin')} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[13px] font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all whitespace-nowrap">
                                <LayoutDashboard className="w-4 h-4" /> پنل مالک بازار
                            </button>
                        )}
                    </div>
                )}
            </div>
            <button
                onClick={() => router.push('/feedback')}
                className="flex items-center justify-center gap-2 w-full py-3 border border-outline-variant dark:border-gray-700 rounded-xl text-sm text-on-surface-variant hover:bg-surface-container-low dark:hover:bg-gray-800 transition-colors mt-4"
            >
                <Lightbulb className="w-4 h-4" />
                پیشنهادات و انتقادات
            </button>
        </div>
    );
}