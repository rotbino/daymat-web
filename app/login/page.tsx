// app/login/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, Phone, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { setUser, setAccessToken, clearUserSession } from '@/lib/store/slices/authSlice';
import { useLogin, useRegister } from '@/lib/api/apiHooks';
import { AppFooter } from '@/app/components';
import { apiService } from '@/lib/api/apiService';
import { getApiUrl } from '@/lib/api/apiRequest';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const dispatch = useDispatch();

    const [step, setStep] = useState<'phone' | 'password'>('phone');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const loginMutation = useLogin();
    const registerMutation = useRegister();

    const armSlug = searchParams.get('arm') || 'barton';
    const redirectTo = searchParams.get('redirect') || '/profile';

    const validatePhone = () => {
        const newErrors: Record<string, string> = {};
        if (!phone) {
            newErrors.phone = 'شماره موبایل الزامی است';
        } else if (!/^09[0-9]{9}$/.test(phone)) {
            newErrors.phone = 'شماره موبایل معتبر نیست';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validatePhone()) return;

        setIsLoading(true);

        try {
            // بررسی شماره موبایل
            const checkResponse = await fetch(getApiUrl('/auth/check-phone'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone }),
            });

            if (!checkResponse.ok) {
                throw new Error('خطا در بررسی شماره موبایل');
            }

            const checkResult = await checkResponse.json();

            if (checkResult.exists) {
                // شماره وجود دارد → مرحله رمز
                setStep('password');
                setIsLoading(false);
                return;
            }

            // شماره وجود ندارد → ثبت‌نام جدید
            try {
                // ✅ پاک‌سازی کامل داده‌های کاربر قبلی (فقط یک خط)
                await dispatch(clearUserSession());

                const registerResponse = await registerMutation.mutateAsync({
                    phone,
                    password: '123456',
                });

                dispatch(setUser(registerResponse.user));
                dispatch(setAccessToken(registerResponse.access_token));

                // پیوستن به بازار
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
                router.replace("/profile");
                return;
            } catch (registerError: any) {
                if (registerError?.data?.errorCode === 'DUPLICATE_PHONE') {
                    toast.error('این شماره موبایل قبلاً ثبت شده است');
                } else {
                    toast.error(registerError?.message || 'خطا در ثبت‌نام');
                }
                setIsLoading(false);
                return;
            }
        } catch (error: any) {
            console.error('Check phone error:', error);
            toast.error(error?.message || 'خطا در بررسی شماره موبایل');
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!password) {
            setErrors({ password: 'رمز عبور الزامی است' });
            return;
        }
        if (password.length < 4) {
            setErrors({ password: 'رمز عبور حداقل ۴ کاراکتر است' });
            return;
        }

        setIsLoading(true);

        try {
            // ✅ پاک‌سازی کامل داده‌های کاربر قبلی (فقط یک خط)
            await dispatch(clearUserSession());

            const loginResponse = await loginMutation.mutateAsync({
                phone,
                password,
            });

            dispatch(setUser(loginResponse.user));
            dispatch(setAccessToken(loginResponse.access_token));

            if (armSlug) {
                try {
                    await apiService.arm.join(armSlug);
                } catch (error: any) {
                    if (error?.data?.errorCode !== 'ALREADY_MEMBER') {
                        console.error('Join error:', error);
                    }
                }
            }

            toast.success('خوش آمدید');
            router.replace("/profile");
        } catch (error: any) {
            if (error?.data?.errorCode === 'WRONG_CREDENTIALS') {
                setErrors({ password: 'رمز عبور اشتباه است' });
            } else {
                toast.error(error?.message || 'خطا در ورود');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-background">
            {/* هدر */}
            <header className="bg-surface w-full fixed top-0 left-0 right-0 z-50 border-b border-outline-variant flex justify-between items-center px-4 h-16">
                <div className="flex items-center gap-3">
                    {step === 'password' && (
                        <button
                            onClick={() => setStep('phone')}
                            className="flex items-center justify-center w-10 h-10 text-on-surface-variant hover:text-primary transition-colors active:scale-95"
                        >
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    )}
                    <div className="flex flex-col text-right">
                        <span className="font-headline-sm text-headline-sm text-on-surface leading-tight">
                            {step === 'phone' ? 'ورود / ثبت نام' : 'ورود'}
                        </span>
                        <span className="text-[10px] text-on-surface-variant leading-tight">
                            {step === 'phone' ? 'شماره موبایل خود را وارد کنید' : 'رمز عبور خود را وارد کنید'}
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
                    {/* مرحله اول: شماره موبایل */}
                    {step === 'phone' ? (
                        <form onSubmit={handlePhoneSubmit} className="space-y-6">
                            <div className="text-right mb-8">
                                <h2 className="font-headline-md text-headline-md text-on-surface">
                                    خوش آمدید
                                </h2>
                                <p className="text-body-md text-on-surface-variant mt-1">
                                    شماره موبایل خود را وارد کنید
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
                                    شماره موبایل
                                    <span className="text-primary">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        dir="ltr"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={phone}
                                        onChange={(e) => {
                                            const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                                            setPhone(value);
                                            if (errors.phone) setErrors({ ...errors, phone: undefined });
                                        }}
                                        placeholder="09123456789"
                                        maxLength={11}
                                        className={`w-full bg-surface-container-lowest border h-14 px-4 pr-12 font-mono-data text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all ${
                                            errors.phone ? 'border-error' : 'border-outline'
                                        }`}
                                    />
                                    <div className="absolute inset-y-0 left-4 flex items-center text-on-surface-variant opacity-60">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                </div>
                                {errors.phone && <p className="text-error text-sm mt-1">{errors.phone}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary text-on-primary h-14 font-headline-sm text-headline-sm flex items-center justify-center gap-2 active:scale-95 transition-transform duration-150"
                            >
                                {isLoading ? (
                                    'در حال بررسی...'
                                ) : (
                                    <>
                                        تایید
                                    </>
                                )}
                            </button>

                            <div className="text-center text-xs text-on-surface-variant">
                                با ادامه، با <Link href="/docs/terms" className="text-primary hover:underline">قوانین</Link> موافقت می‌کنید
                            </div>
                        </form>
                    ) : (
                        /* مرحله دوم: پسورد */
                        <form onSubmit={handlePasswordSubmit} className="space-y-6">
                            <div className="text-right mb-8">
                                <h2 className="font-headline-md text-headline-md text-on-surface">
                                    خوش آمدید
                                </h2>
                                <p className="text-body-md text-on-surface-variant mt-1">
                                    برای {phone}، رمز عبور خود را وارد کنید
                                </p>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="font-label-md text-label-md text-on-surface-variant flex items-center gap-1">
                                    رمز عبور
                                    <span className="text-primary">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        dir="ltr"
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password) setErrors({ ...errors, password: undefined });
                                        }}
                                        placeholder="••••••"
                                        className={`w-full bg-surface-container-lowest border h-14 px-4 pr-12 font-mono-data text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all ${
                                            errors.password ? 'border-error' : 'border-outline'
                                        }`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.password && <p className="text-error text-sm mt-1">{errors.password}</p>}
                            </div>

                            <div className="flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const supportPhone = '09123456789';
                                        if (window.innerWidth < 768) {
                                            window.location.href = `tel:${supportPhone}`;
                                        } else {
                                            toast.info(`شماره پشتیبانی: ${supportPhone}`);
                                        }
                                    }}
                                    className="text-sm text-primary hover:underline transition-colors flex items-center gap-1"
                                >
                                    <Shield className="w-4 h-4" />
                                    رمز را فراموش کرده‌اید؟
                                </button>
                                <Link
                                    href="/login"
                                    className="text-sm text-on-surface-variant hover:text-primary transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        setStep('phone');
                                        setPassword('');
                                        setErrors({});
                                    }}
                                >
                                    شماره دیگری
                                </Link>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary text-on-primary h-14 font-headline-sm text-headline-sm flex items-center justify-center gap-2 active:scale-95 transition-transform duration-150"
                            >
                                {isLoading ? (
                                    'در حال ورود...'
                                ) : (
                                    <>
                                        ورود
                                        <ArrowLeft className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </main>

            <AppFooter />
        </div>
    );
}