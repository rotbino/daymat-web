// app/register/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { setUser, setAccessToken } from '@/lib/store/slices/authSlice';
import { useRegister } from '@/lib/api/apiHooks';
import { AppFooter } from '@/app/components';
import { apiService } from '@/lib/api/apiService';

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useDispatch();

    const [phone, setPhone] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isRegistering, setIsRegistering] = useState(false);

    const registerMutation = useRegister();

    const armSlug = searchParams.get('arm') || 'barton';
    // ✅ تغییر: redirectTo به جای '/' به '/dashboard' ریدایرکت می‌کنه
    const redirectTo = searchParams.get('redirect') || '/profile';

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!phone) {
            newErrors.phone = 'شماره موبایل الزامی است';
        } else if (!/^09[0-9]{9}$/.test(phone)) {
            newErrors.phone = 'شماره موبایل معتبر نیست';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsRegistering(true);

        try {
            const response = await registerMutation.mutateAsync({
                phone,
                password: '123456',
            });

            dispatch(setUser(response.user));
            dispatch(setAccessToken(response.access_token));

            if (armSlug) {
                try {
                    await apiService.arm.join(armSlug);
                    toast.success(`با موفقیت به بازار پیوستید`);
                } catch (error: any) {
                    if (error?.data?.errorCode !== 'ALREADY_MEMBER') {
                        console.error('Join error:', error);
                    }
                }
            }

            toast.success('ثبت‌نام با موفقیت انجام شد');

            // ✅ هدایت به داشبورد
            router.push(redirectTo);
        } catch (error: any) {
            if (error?.data?.errorCode === 'DUPLICATE_PHONE') {
                toast.error('این شماره موبایل قبلاً ثبت شده است');
                router.push(`/login?arm=${armSlug}&redirect=${redirectTo}`);
            } else {
                toast.error(error?.message || 'خطا در ثبت‌نام');
            }
        } finally {
            setIsRegistering(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            <header className="bg-surface w-full fixed top-0 left-0 right-0 z-50 border-b border-outline-variant flex justify-between items-center px-4 h-16">
                <div className="flex items-center gap-3">
                    <div className="flex flex-col text-right">
                        <span className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                            ثبت نام سریع
                        </span>
                        <span className="text-[10px] text-on-surface-variant leading-tight">
                            با شماره موبایل ثبت‌نام کنید
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="font-mono-data font-bold text-[10px] text-on-surface-variant tracking-widest uppercase">
                        DAYMAT
                    </span>
                </div>
            </header>

            <main className="flex-1 w-full flex items-center justify-center px-4 pt-24 pb-20">
                <div className="w-full max-w-[480px]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="text-right mb-8">
                            <h2 className="font-headline-md text-headline-md text-on-surface">
                                ثبت نام سریع
                            </h2>
                            <p className="text-body-md text-on-surface-variant mt-1">
                                برای پیوستن به پلتفرم، شماره موبایل خود را وارد کنید
                            </p>
                            <p className="text-xs text-on-surface-variant mt-2 text-primary">
                                رمز عبور موقت ۱۲۳۴۵۶ برای شما تنظیم شده است
                            </p>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
                                شماره موبایل
                                <span className="text-primary">*</span>
                            </label>
                            <input
                                type="text"
                                dir="ltr"
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value);
                                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                                }}
                                placeholder="09123456789"
                                className={`w-full bg-surface-container-lowest border h-14 px-4 font-mono-data text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all ${
                                    errors.phone ? 'border-error' : 'border-outline'
                                }`}
                            />
                            {errors.phone && <p className="text-error text-sm mt-1">{errors.phone}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isRegistering}
                            className="w-full bg-primary text-on-primary h-14 font-headline-sm text-headline-sm flex items-center justify-center gap-2 active:scale-95 transition-transform duration-150"
                        >
                            {isRegistering ? (
                                'در حال ثبت...'
                            ) : (
                                <>
                                    ثبت نام سریع
                                    <UserPlus className="w-5 h-5" />
                                </>
                            )}
                        </button>

                        <div className="text-center">
                            <Link href={`/login${armSlug ? `?arm=${armSlug}&redirect=${redirectTo}` : ''}`}
                                  className="text-sm text-primary hover:underline transition-colors">
                                قبلاً ثبت‌نام کرده‌اید؟ وارد شوید
                            </Link>
                        </div>
                    </form>
                </div>
            </main>

            <AppFooter />
        </div>
    );
}