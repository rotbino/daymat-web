// app/components/AuthForm.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { Eye, EyeOff, ArrowLeft, Phone, Shield, Check } from 'lucide-react';
import { toast } from 'sonner';
import { setUser, setAccessToken, clearUserSession } from '@/lib/store/slices/authSlice';
import { useLogin, useRegister } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';
import { getApiUrl } from '@/lib/api/apiRequest';

interface AuthFormProps {
    onSuccess?: () => void;
    armSlug?: string;
    redirectTo?: string;
    compact?: boolean;
}

export function AuthForm({ onSuccess, armSlug, redirectTo, compact = false }: AuthFormProps) {
    const router = useRouter();
    const dispatch = useDispatch();

    const [step, setStep] = useState<'phone' | 'password'>('phone');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const loginMutation = useLogin();
    const registerMutation = useRegister();

    const handleSuccess = (user: any, token: string) => {
        dispatch(setUser(user));
        dispatch(setAccessToken(token));
        toast.success('خوش آمدید');
        onSuccess?.();
        if (redirectTo) {
            router.replace(redirectTo);
        }
    };

    const validatePhone = () => {
        const newErrors: Record<string, string> = {};
        if (!phone) newErrors.phone = 'شماره موبایل الزامی است';
        else if (!/^09[0-9]{9}$/.test(phone)) newErrors.phone = 'شماره موبایل معتبر نیست';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePhoneSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validatePhone()) return;
        setIsLoading(true);

        try {
            const checkResponse = await fetch(getApiUrl('/auth/check-phone'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
            const checkResult = await checkResponse.json();

            if (checkResult.exists) {
                setStep('password');
                setIsLoading(false);
                return;
            }

            await dispatch(clearUserSession());
            const registerResponse = await registerMutation.mutateAsync({
                phone,
                password: '123456',
            });

            if (armSlug) {
                try {
                    await apiService.arm.join(armSlug);
                } catch (error: any) {
                    if (error?.data?.errorCode !== 'ALREADY_MEMBER') {
                        console.error('Join error:', error);
                    }
                }
            }

            handleSuccess(registerResponse.user, registerResponse.access_token);
        } catch (error: any) {
            if (error?.data?.errorCode === 'DUPLICATE_PHONE') {
                toast.error('این شماره موبایل قبلاً ثبت شده است');
            } else {
                toast.error(error?.message || 'خطا در ثبت‌نام');
            }
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
            await dispatch(clearUserSession());
            const loginResponse = await loginMutation.mutateAsync({ phone, password });

            if (armSlug) {
                try {
                    await apiService.arm.join(armSlug);
                } catch (error: any) {
                    if (error?.data?.errorCode !== 'ALREADY_MEMBER') {
                        console.error('Join error:', error);
                    }
                }
            }

            handleSuccess(loginResponse.user, loginResponse.access_token);
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

    const inputClass = "w-full bg-surface-container-lowest border h-12 px-4 pr-11 text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all";

    return (
        <div className="space-y-5">
            {step === 'phone' ? (
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                    <div className="text-right">
                        <h2 className="text-lg font-extrabold">خوش آمدید</h2>
                        <p className="text-sm text-gray-400 mt-1">شماره موبایل خود را وارد کنید</p>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                            شماره موبایل <span className="text-primary">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="tel"
                                dir="ltr"
                                inputMode="numeric"
                                value={phone}
                                onChange={(e) => {
                                    setPhone(e.target.value.replace(/\D/g, '').slice(0, 11));
                                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                                }}
                                placeholder="09123456789"
                                maxLength={11}
                                className={`${inputClass} ${errors.phone ? 'border-error' : 'border-outline'}`}
                            />
                            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                        {errors.phone && <p className="text-error text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50"
                    >
                        {isLoading ? 'در حال بررسی...' : 'تایید'}
                    </button>

                    <p className="text-center text-[11px] text-gray-400">
                        با ادامه، با <Link href="/docs/terms" className="text-primary hover:underline">قوانین</Link> موافقت می‌کنید
                    </p>
                </form>
            ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div className="text-right">
                        <h2 className="text-lg font-extrabold">ورود</h2>
                        <p className="text-sm text-gray-400 mt-1">برای {phone}، رمز عبور را وارد کنید</p>
                    </div>

                    <div>
                        <label className="text-xs font-medium text-gray-500 mb-1.5 block">
                            رمز عبور <span className="text-primary">*</span>
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
                                className={`${inputClass} ${errors.password ? 'border-error' : 'border-outline'}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-error text-xs mt-1">{errors.password}</p>}
                    </div>

                    <div className="flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => setStep('phone')}
                            className="text-xs text-gray-400 hover:text-primary transition"
                        >
                            شماره دیگری
                        </button>
                        <Shield className="w-4 h-4 text-gray-400" />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-12 bg-primary text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition disabled:opacity-50"
                    >
                        {isLoading ? 'در حال ورود...' : (
                            <>ورود <ArrowLeft className="w-4 h-4" /></>
                        )}
                    </button>
                </form>
            )}
        </div>
    );
}