// components/register/ChangePasswordModal.tsx
'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, X, Shield } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { RootState } from '@/lib/store/store';
import { setUser } from '@/lib/store/slices/authSlice';
import { toastFormErrors } from '@/lib/formAlerts';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function ChangePasswordModal({ isOpen, onClose, onSuccess }: ChangePasswordModalProps) {
    const dispatch = useDispatch();
    const user = useSelector((s: RootState) => s.auth.user);

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<{ currentPassword?: string; newPassword?: string; confirmPassword?: string }>({});
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    // ⚖️ قانون دیمت: علاوه بر خطای CSSِ فیلد، الرتِ toast واضح هم با ذکرِ خودِ فیلد بده
    const validate = () => {
        const e: { currentPassword?: string; newPassword?: string; confirmPassword?: string } = {};
        if (!currentPassword) e.currentPassword = 'رمز عبور فعلی وارد نشده';
        if (!newPassword) e.newPassword = 'رمز عبور جدید وارد نشده';
        else if (newPassword.length < 6) e.newPassword = 'رمز عبور جدید باید حداقل ۶ کاراکتر باشد';
        else if (newPassword === currentPassword) e.newPassword = 'رمز جدید نباید با رمز فعلی یکسان باشد';
        if (!confirmPassword) e.confirmPassword = 'تکرار رمز عبور وارد نشده';
        else if (newPassword !== confirmPassword) e.confirmPassword = 'رمز عبور با تکرار آن مطابقت ندارد';
        setErrors(e);
        if (Object.keys(e).length > 0) {
            toastFormErrors(e as Record<string, string>);
            return false;
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            // ✅ رمزِ فعلیِ واقعیِ کاربر فرستاده می‌شود — قبلاً '123456' هاردکد شده بود و
            //    برای هر کاربری که رمزش 123456 نبود، 401 می‌گرفت و کل سشنش پاک می‌شد!
            await apiService.auth.changePassword({
                currentPassword: currentPassword,
                newPassword: newPassword,
            });
            // ✅ بروزرسانی فوری redux — بنر «رمز موقت» بدون رفرش از همهٔ صفحات محو می‌شود
            if (user) dispatch(setUser({ ...user, temporaryPassword: false } as any));
            toast.success('رمز عبور با موفقیت تغییر یافت');
            onSuccess?.();
            onClose();
        } catch (error: any) {
            // ✅ خطای «رمز فعلی اشتباه است» فقط پیام می‌دهد — دیگر سشن را پاک نمی‌کند (SKIP در apiRequest)
            toast.error(error?.message || 'خطا در تغییر رمز عبور');
        } finally {
            setIsLoading(false);
        }
    };

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
                            برای تغییر رمز، رمز فعلی و رمز جدید را وارد کنید
                        </p>
                    </div>

                    {/* رمز عبور فعلی — ✅ قبلاً هاردکد بود؛ حالا از خود کاربر پرسیده می‌شود */}
                    <div className="flex flex-col gap-1">
                        <label className="font-label-md text-label-md text-on-surface-variant">
                            رمز عبور فعلی <span className="text-primary">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                dir="ltr"
                                value={currentPassword}
                                onChange={(e) => {
                                    setCurrentPassword(e.target.value);
                                    if (errors.currentPassword) setErrors({ ...errors, currentPassword: undefined });
                                }}
                                placeholder="رمز فعلی خود را وارد کنید"
                                className={`w-full bg-surface-container-lowest border h-12 px-4 font-mono-data text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all ${
                                    errors.currentPassword ? 'border-error' : 'border-outline'
                                }`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrent(!showCurrent)}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                            >
                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.currentPassword && <p className="text-error text-xs mt-1">{errors.currentPassword}</p>}
                        {user?.temporaryPassword && (
                            <p className="text-[10px] text-on-surface-variant mt-0.5">
                                رمز موقت شما <b dir="ltr">123456</b> است
                            </p>
                        )}
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
                                placeholder="رمز جدید را وارد کنید"
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
                                placeholder="همان رمز بالا را دوباره وارد کنید"
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
