// app/my-catalogs/components/EmptyCatalogState.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setUser } from '@/lib/store/slices/authSlice';
import { BookOpen, Key } from 'lucide-react';
import { ChangePasswordModal } from '@/components/register/ChangePasswordModal';

/** گارد «هنوز کاتالوگ نداری» — با هشدار رمز موقت و CTA ساخت کاتالوگ */
export default function EmptyCatalogState({ hasTemporaryPassword, user }: {
    hasTemporaryPassword: boolean;
    user: any;
}) {
    const router = useRouter();
    const dispatch = useDispatch();
    const [passwordOpen, setPasswordOpen] = useState(false);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-2.5">
                <h1 className="text-lg font-black text-on-surface flex items-center gap-1.5">
                    <BookOpen className="w-4.5 h-4.5 text-primary" /> کاتالوگ‌های من
                </h1>
            </div>

            {hasTemporaryPassword && (
                <button onClick={() => setPasswordOpen(true)}
                        className="w-full bg-error/5 border border-error/40 rounded-xl p-3 flex items-center gap-3 text-right hover:bg-error/10 transition-colors animate-pulse">
                    <Key className="w-4.5 h-4.5 text-error flex-shrink-0" />
                    <span className="text-xs text-on-surface flex-1">رمز عبور شما موقت است — <b className="text-error">همین حالا عوضش کن</b></span>
                </button>
            )}

            <div className="rounded-lg border-2 border-primary/25 bg-gradient-to-br from-primary/8 via-primary/5 to-transparent p-6 text-center">
                <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <BookOpen className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-base font-extrabold text-on-surface mb-1.5">کاتالوگ محصولاتت را بساز</h3>
                <p className="text-xs text-on-surface-variant leading-6 max-w-sm mx-auto">
                    با عکس و قیمت، با لینک اختصاصی — چند دقیقه بیشتر وقت نمی‌گیرد.
                </p>
                <button onClick={() => router.push('/business/register')}
                        className="mt-4 h-11 px-7 rounded-lg bg-primary text-on-primary text-sm font-extrabold
                        hover:bg-primary/90 active:scale-[0.98] transition-all">
                    شروع کن — رایگان
                </button>
            </div>

            <ChangePasswordModal isOpen={passwordOpen} onClose={() => setPasswordOpen(false)}
                                 onSuccess={() => dispatch(setUser({ ...user, temporaryPassword: false }))} />
        </div>
    );
}
