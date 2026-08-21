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

    // ✅ استفاده مستقیم از thumbnailPath آروان
    const avatarUrl = user?.avatarFile?.thumbnailPath || user?.avatarFile?.path || null;

    const hasBusiness = !!business;

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4 shadow-sm">
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
                        <Pencil className="w-4 h-4" />

                    </button>
                </div>
                <h1 className="text-lg font-bold text-on-surface dark:text-gray-100">
                    {user?.fullName && user.fullName !== '' && user.fullName !== 'کاربر مهمان' ? user.fullName : 'بی‌نام'}
                </h1>
                {user.bio && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 text-xs rounded-full font-medium">
                        <Store className="w-3 h-3" /> {user.bio}
                    </span>
                )}
                <p className="text-sm text-on-surface-variant dark:text-gray-400 mt-1">{user?.phone || ''}</p>


            </div>

        </div>
    );
}