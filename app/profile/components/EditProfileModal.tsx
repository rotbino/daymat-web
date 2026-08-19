// app/profile/components/EditProfileModal.tsx
'use client';

import React, {useState, useEffect, useMemo} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import { X, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { FileUploader } from '@/components/common/FileUploader';
import { useUploadFile } from '@/lib/api/apiHooks';
import { setUser } from '@/lib/store/slices/authSlice';
import { IranLocationSelector } from '@/app/components/IranLocationSelector';
import PersianDate from '@/components/common/PersianDate';
import {RootState} from "@/lib/store/store"; // مسیر صحیح

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: string;
        fullName: string;
        phone: string;
        avatarFile?: { id: string } | null;
        temporaryPassword?: boolean;
        email?: string;
        gender?: string;
        birthDate?: string;
        provinceCode?: string;
        cityCode?: string;
        countryCode?: string;
        bio?: string;
    };
    onUpdate: (data: {
        fullName: string;
        avatarFileId?: string;
        email?: string;
        gender?: string;
        birthDate?: string;
        provinceCode?: string;
        cityCode?: string;
        countryCode?: string;
        bio?: string;
    }) => void;
}

export function EditProfileModal({ isOpen, onClose,  onUpdate }: EditProfileModalProps) {
    const { user } = useSelector((state: RootState) => state.auth);

    // ─── هوک‌ها (همه بدون شرط) ───
    const dispatch = useDispatch();
    const uploadMutation = useUploadFile();

    const [step, setStep] = useState(1);
    const [fullName, setFullName] = useState(user.fullName || '');
    const [gender, setGender] = useState(user.gender || '');
    const [selectedProvinceCode, setSelectedProvinceCode] = useState(user.provinceCode || '');
    const [selectedCityCode, setSelectedCityCode] = useState(user.cityCode || '');
    const [birthDate, setBirthDate] = useState<string | undefined>(user.birthDate);
    const [email, setEmail] = useState(user.email || '');
    const [bio, setBio] = useState(user.bio || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [currentAvatarFileId, setCurrentAvatarFileId] = useState<string | undefined>(user.avatarFile?.id);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const maxBirthDate = useMemo(() => {
        const today = new Date();
        const tenYearsAgo = new Date(today);
        tenYearsAgo.setFullYear(today.getFullYear() - 10);
        // فرمت YYYY-MM-DD
        const y = tenYearsAgo.getFullYear();
        const m = String(tenYearsAgo.getMonth() + 1).padStart(2, '0');
        const d = String(tenYearsAgo.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, []);
    // ─── useEffect‌ها (همه بدون شرط) ───
    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) setStep(1);
    }, [isOpen]);

    useEffect(() => {
        if (user.birthDate) {
            setBirthDate(user.birthDate);
        }
    }, [user.birthDate]);

    // ⛔ هرگونه return باید بعد از این نقطه باشد
    if (!isOpen) return null;

    // اعتبارسنجی مرحله اول
    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};
        if (!fullName.trim()) newErrors.fullName = 'نام و نام خانوادگی الزامی است';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // اعتبارسنجی مرحله دوم (همه اختیاری)
    const validateStep2 = () => {
        const newErrors: Record<string, string> = {};
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'ایمیل نامعتبر است';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ذخیره مرحله اول و سپس رفتن به مرحله دوم
    const handleSaveAndNext = async () => {
        if (!validateStep1()) return;

        setIsLoading(true);
        setUploadError(null);
        let newAvatarFileId = currentAvatarFileId;

        try {
            if (selectedFile) {
                setIsUploading(true);
                try {
                    const result = await uploadMutation.mutateAsync({
                        file: selectedFile,
                        model: 'User',
                        modelId: user.id,
                        fieldKey: 'avatar',
                    });
                    newAvatarFileId = result.id;
                    setCurrentAvatarFileId(result.id);
                    toast.success('تصویر پروفایل آپلود شد');
                } catch (uploadErr: any) {
                    setUploadError(uploadErr.message || 'خطا در آپلود تصویر');
                    toast.error(uploadErr.message || 'خطا در آپلود تصویر');
                    setIsLoading(false);
                    return;
                } finally {
                    setIsUploading(false);
                }
            }

            const step1Data: any = { fullName: fullName.trim() };
            if (newAvatarFileId) step1Data.avatarFileId = newAvatarFileId;
            if (gender) step1Data.gender = gender;
            if (bio) step1Data.bio = bio.trim();

            await onUpdate(step1Data);

            dispatch(setUser({
                ...user,
                fullName: fullName.trim(),
                avatarFile: newAvatarFileId ? { id: newAvatarFileId } : user.avatarFile,
                gender,
                bio: bio.trim(),
            }));

            setStep(2);
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ذخیره‌سازی');
        } finally {
            setIsLoading(false);
        }
    };

    // ذخیره نهایی (مرحله دوم)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep2()) return;

        setIsLoading(true);
        setUploadError(null);
        let newAvatarFileId = currentAvatarFileId;

        try {
            if (selectedFile) {
                setIsUploading(true);
                try {
                    const result = await uploadMutation.mutateAsync({
                        file: selectedFile,
                        model: 'User',
                        modelId: user.id,
                        fieldKey: 'avatar',
                    });
                    newAvatarFileId = result.id;
                    setCurrentAvatarFileId(result.id);
                    toast.success('تصویر پروفایل آپلود شد');
                } catch (uploadErr: any) {
                    setUploadError(uploadErr.message || 'خطا در آپلود تصویر');
                    toast.error(uploadErr.message || 'خطا در آپلود تصویر');
                    setIsLoading(false);
                    return;
                } finally {
                    setIsUploading(false);
                }
            }

            const updateData: any = { fullName: fullName.trim() };
            if (newAvatarFileId) updateData.avatarFileId = newAvatarFileId;
            if (gender) updateData.gender = gender;
            if (bio) updateData.bio = bio.trim();
            if (selectedProvinceCode) updateData.provinceCode = selectedProvinceCode;
            if (selectedCityCode) updateData.cityCode = selectedCityCode;
            updateData.countryCode = 'IR';
            if (birthDate) updateData.birthDate = birthDate; // مستقیماً ISO string
            if (email) updateData.email = email.trim();

            await onUpdate(updateData);

            dispatch(setUser({
                ...user,
                fullName: fullName.trim(),
                avatarFile: newAvatarFileId ? { id: newAvatarFileId } : user.avatarFile,
                gender,
                provinceCode: selectedProvinceCode,
                cityCode: selectedCityCode,
                countryCode: 'IR',
                birthDate: birthDate,
                email: email.trim(),
                bio: bio.trim(),
            }));

            toast.success('پروفایل با موفقیت به‌روزرسانی شد');
            onClose();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در به‌روزرسانی پروفایل');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface w-full max-w-md border border-outline-variant shadow-lg max-h-[90vh] overflow-y-auto overscroll-contain rounded-2xl">
                {/* هدر */}
                <div className="flex items-center justify-between p-4 border-b border-outline-variant sticky top-0 bg-surface z-10">
                    <div className="flex items-center gap-2">
                        {step === 2 && (
                            <button onClick={() => setStep(1)} className="p-1 hover:bg-surface-container rounded-md transition-colors">
                                <ArrowRight className="w-5 h-5 text-on-surface-variant" />
                            </button>
                        )}
                        <h3 className="font-headline-sm text-headline-sm text-on-surface">ویرایش پروفایل</h3>
                    </div>
                    <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* مرحله ۱ */}
                {step === 1 && (
                    <div className="p-4 space-y-4">
                        {/* آواتار */}
                        <div className="flex flex-col items-center gap-3">
                            <FileUploader
                                value={currentAvatarFileId}
                                onFileSelect={(file) => setSelectedFile(file)}
                                onRemove={() => {
                                    setSelectedFile(null);
                                    setCurrentAvatarFileId(undefined);
                                }}
                                rounded={true}
                                width={120}
                                height={120}
                                error={uploadError || undefined}
                                disabled={isLoading}
                            />
                            <p className="text-[10px] text-on-surface-variant">
                                {selectedFile ? 'تصویر جدید انتخاب شد' :
                                    currentAvatarFileId ? 'تصویر با موفقیت آپلود شد' :
                                        'برای تغییر تصویر کلیک کنید'}
                            </p>
                        </div>

                        {/* نام */}
                        <div className="flex flex-col gap-1">
                            <label className="font-label-md text-label-md text-on-surface-variant">
                                نام و نام خانوادگی <span className="text-primary">*</span>
                            </label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="نام خود را وارد کنید"
                                className={`w-full bg-surface-container-lowest border h-12 px-4 font-body-md text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all ${errors.fullName ? 'border-error' : 'border-outline'}`}
                            />
                            {errors.fullName && <p className="text-error text-xs mt-1">{errors.fullName}</p>}
                        </div>

                        {/* جنسیت */}
                        <div className="flex flex-col gap-1">
                            <label className="font-label-md text-label-md text-on-surface-variant">جنسیت</label>
                            <select
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                className="w-full bg-surface-container-lowest border h-12 px-4 font-body-md text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                            >
                                <option value="">انتخاب کنید</option>
                                <option value="male">مرد</option>
                                <option value="female">زن</option>
                                <option value="other">سایر</option>
                            </select>
                        </div>

                        {/* درباره من */}
                        <div className="flex flex-col gap-1">
                            <label className="font-label-md text-label-md text-on-surface-variant">درباره من</label>
                            <input
                                type="text"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="فروشنده عمده مصالح ساختمانی"
                                className="w-full bg-surface-container-lowest border h-12 px-4 font-body-md text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                            />
                        </div>

                        <div className="pt-4 border-t border-outline-variant">
                            <button
                                type="button"
                                onClick={handleSaveAndNext}
                                disabled={isLoading}
                                className="w-full h-12 bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-md rounded-lg"
                            >
                                {isLoading ? 'در حال ذخیره...' : 'تایید'}
                            </button>
                        </div>
                    </div>
                )}

                {/* مرحله ۲ */}
                {step === 2 && (
                    <form onSubmit={handleSubmit} className="p-4 space-y-4">
                        <div className="bg-surface-container-low rounded-xl p-3 text-xs text-on-surface-variant leading-relaxed">
                            اطلاعات تکمیلی (اختیاری)
                        </div>

                        {/* استان و شهر با شناسه */}
                        <div className="flex flex-col gap-1">
                            <IranLocationSelector
                                provinceCode={selectedProvinceCode}
                                cityCode={selectedCityCode}
                                onProvinceChange={setSelectedProvinceCode}
                                onCityChange={setSelectedCityCode}
                                disabled={isLoading}
                            />
                        </div>

                        {/* تاریخ تولد با PersianDate */}
                        <div className="flex flex-col gap-1">
                            <label className="font-label-md text-label-md text-on-surface-variant">تاریخ تولد</label>
                            <PersianDate
                                value={birthDate}
                                onChange={(date) => setBirthDate(date)}
                                placeholder="تاریخ تولد را انتخاب کنید"
                                maxDate={maxBirthDate}   // ✅ محدودیت: هیچ تاریخی بعد از ۱۰ سال پیش مجاز نیست
                                disabled={isLoading}
                            />
                        </div>

                        {/* ایمیل */}
                        <div className="flex flex-col gap-1">
                            <label className="font-label-md text-label-md text-on-surface-variant">ایمیل</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="example@domain.com"
                                className={`w-full bg-surface-container-lowest border h-12 px-4 font-body-md text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all ${errors.email ? 'border-error' : 'border-outline'}`}
                            />
                            {errors.email && <p className="text-error text-xs mt-1">{errors.email}</p>}
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-outline-variant">
                            <button type="button" onClick={onClose} className="flex py-3 px-3 border border-outline text-on-surface hover:bg-surface-container-low transition-colors font-label-md rounded-lg">
                                بستن
                            </button>
                            <button type="submit" disabled={isLoading} className="flex-1 py-3 bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-md disabled:opacity-50 rounded-lg">
                                {isLoading ? ' ذخیره...' : 'ذخیره'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}