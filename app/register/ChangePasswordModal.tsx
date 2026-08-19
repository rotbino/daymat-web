// components/common/ChangePasswordModal.tsx
'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, X, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{ newPassword?: string; confirmPassword?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors: { newPassword?: string; confirmPassword?: string } = {};
        if (!newPassword) {
            newErrors.newPassword = 'رمز عبور جدید الزامی است';
        } else if (newPassword.length < 6) {
            newErrors.newPassword = 'رمز عبور باید حداقل ۶ کاراکتر باشد';
        }
        if (!confirmPassword) {
            newErrors.confirmPassword = 'تکرار رمز عبور الزامی است';
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = 'رمز عبور با تکرار آن مطابقت ندارد';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

// components/common/ChangePasswordModal.tsx

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            await apiService.auth.changePassword({
                currentPassword: '123456',   // ← رمز عبور پیش‌فرض موقت
                newPassword: newPassword,
            });
            toast.success('رمز عبور با موفقیت تغییر یافت');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در تغییر رمز عبور');
        } finally {
            setIsLoading(false);
        }
    };;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface w-full max-w-md border border-outline-variant shadow-lg">
                <div className="flex items-center justify-between p-4 border-b border-outline-variant">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-primary" />
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">
                            تغییر رمز عبور
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-on-surface-variant hover:text-primary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
                    <div className="text-right">
                        <p className="text-sm text-on-surface-variant">
                            برای امنیت بیشتر، رمز عبور موقت خود را تغییر دهید
                        </p>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="font-label-md text-label-md text-on-surface-variant">
                            رمز عبور جدید <span className="text-primary">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                dir="ltr"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    if (errors.newPassword) setErrors({ ...errors, newPassword: undefined });
                                }}
                                placeholder="••••••"
                                className={`w-full bg-surface-container-lowest border h-12 px-4 font-mono-data text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all ${
                                    errors.newPassword ? 'border-error' : 'border-outline'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.newPassword && <p className="text-error text-xs mt-1">{errors.newPassword}</p>}
                        <p className="text-[10px] text-on-surface-variant">حداقل ۶ کاراکتر</p>
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="font-label-md text-label-md text-on-surface-variant">
                            تکرار رمز عبور جدید <span className="text-primary">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                dir="ltr"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                                }}
                                placeholder="••••••"
                                className={`w-full bg-surface-container-lowest border h-12 px-4 font-mono-data text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all ${
                                    errors.confirmPassword ? 'border-error' : 'border-outline'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.confirmPassword && <p className="text-error text-xs mt-1">{errors.confirmPassword}</p>}
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 border border-outline text-on-surface hover:bg-surface-container-low transition-colors font-label-md"
                        >
                            انصراف
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 h-12 bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-md disabled:opacity-50"
                        >
                            {isLoading ? 'در حال تغییر...' : 'تغییر رمز'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}