// app/profile/components/EditProfileModal.tsx
'use client';

import React, {useState, useEffect, useMemo, useRef} from 'react';
import {useDispatch, useSelector} from 'react-redux';
import { X, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { FileUploader } from '@/components/common/FileUploader';
import { useUploadFile } from '@/lib/api/apiHooks';
import { setUser } from '@/lib/store/slices/authSlice';
import { IranLocationSelector } from '@/app/components/IranLocationSelector';
import PersianDate from '@/components/common/PersianDate';
import {RootState} from "@/lib/store/store";

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: {
        id: string;
        fullName: string;
        phone: string;
        avatarFile?: {
            id: string;
            thumbnailPath?: string;
            path?: string;
        } | null;
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

export function EditProfileModal({ isOpen, onClose, onUpdate }: EditProfileModalProps) {
    const { user } = useSelector((state: RootState) => state.auth);

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

    // ✅ رفرنس برای نگهداری اطلاعات کامل فایل آپلود شده
    const uploadedFileRef = useRef<{ id: string; thumbnailPath?: string; path?: string } | null>(null);

    const maxBirthDate = useMemo(() => {
        const today = new Date();
        const tenYearsAgo = new Date(today);
        tenYearsAgo.setFullYear(today.getFullYear() - 10);
        const y = tenYearsAgo.getFullYear();
        const m = String(tenYearsAgo.getMonth() + 1).padStart(2, '0');
        const d = String(tenYearsAgo.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }, []);

    useEffect(() => {
        if (!isOpen) return;
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setSelectedFile(null);
            uploadedFileRef.current = null;
            setCurrentAvatarFileId(user.avatarFile?.id);
            setFullName(user.fullName || '');
            setGender(user.gender || '');
            setBio(user.bio || '');
        }
    }, [isOpen]);

    useEffect(() => {
        if (user.birthDate) {
            setBirthDate(user.birthDate);
        }
    }, [user.birthDate]);

    if (!isOpen) return null;

    const validateStep1 = () => {
        const newErrors: Record<string, string> = {};
        if (!fullName.trim()) newErrors.fullName = 'نام و نام خانوادگی الزامی است';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const validateStep2 = () => {
        const newErrors: Record<string, string> = {};
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'ایمیل نامعتبر است';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // ✅ تابع آپلود تصویر - برگردوندن آبجکت کامل
    const uploadAvatar = async (): Promise<{ id: string; thumbnailPath?: string; path?: string } | null> => {
        if (!selectedFile) {
            if (currentAvatarFileId) {
                return { id: currentAvatarFileId };
            }
            return null;
        }

        if (uploadedFileRef.current) {
            return uploadedFileRef.current;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            const result = await uploadMutation.mutateAsync({
                file: selectedFile,
                model: 'User',
                modelId: user.id,
                fieldKey: 'avatar',
            });

            console.log('📤 Upload result:', result); // ✅ برای دیباگ

            // ✅ ساخت آبجکت کامل - مطمئن شو path و thumbnailPath وجود دارن
            const avatarFileData = {
                id: result.id,
                thumbnailPath: result.thumbnailPath || result.path,
                path: result.path,
            };

            uploadedFileRef.current = avatarFileData;
            setCurrentAvatarFileId(result.id);
            setSelectedFile(null);

            return avatarFileData;
        } catch (uploadErr: any) {
            setUploadError(uploadErr.message || 'خطا در آپلود تصویر');
            toast.error(uploadErr.message || 'خطا در آپلود تصویر');
            throw uploadErr;
        } finally {
            setIsUploading(false);
        }
    };

    const handleSaveAndNext = async () => {
        if (!validateStep1()) return;

        setIsLoading(true);

        try {
            const avatarFileData = await uploadAvatar();

            const step1Data: any = { fullName: fullName.trim() };
            if (avatarFileData?.id) step1Data.avatarFileId = avatarFileData.id;
            if (gender) step1Data.gender = gender;
            if (bio) step1Data.bio = bio.trim();

            await onUpdate(step1Data);

            // ✅ ساخت avatarFile کامل
            const updatedAvatarFile = avatarFileData ? {
                id: avatarFileData.id,
                thumbnailPath: avatarFileData.thumbnailPath,
                path: avatarFileData.path,
            } : user.avatarFile;

            console.log('🔄 Dispatching setUser with avatarFile:', updatedAvatarFile); // ✅ برای دیباگ

            dispatch(setUser({
                ...user,
                fullName: fullName.trim(),
                avatarFile: updatedAvatarFile,
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep2()) return;

        setIsLoading(true);

        try {
            const avatarFileData = uploadedFileRef.current || (currentAvatarFileId ? { id: currentAvatarFileId } : null);

            const updateData: any = { fullName: fullName.trim() };
            if (avatarFileData?.id) updateData.avatarFileId = avatarFileData.id;
            if (gender) updateData.gender = gender;
            if (bio) updateData.bio = bio.trim();
            if (selectedProvinceCode) updateData.provinceCode = selectedProvinceCode;
            if (selectedCityCode) updateData.cityCode = selectedCityCode;
            updateData.countryCode = 'IR';
            if (birthDate) updateData.birthDate = birthDate;
            if (email) updateData.email = email.trim();

            await onUpdate(updateData);

            // ✅ استفاده از avatarFile از ref یا user فعلی
            const finalAvatarFile = avatarFileData ? {
                id: avatarFileData.id,
                thumbnailPath: avatarFileData.thumbnailPath,
                path: avatarFileData.path,
            } : user.avatarFile;

            dispatch(setUser({
                ...user,
                fullName: fullName.trim(),
                avatarFile: finalAvatarFile,
                gender,
                provinceCode: selectedProvinceCode,
                cityCode: selectedCityCode,
                countryCode: 'IR',
                birthDate: birthDate,
                email: email.trim(),
                bio: bio.trim(),
            }));

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
                                onFileSelect={(file) => {
                                    setSelectedFile(file);
                                    uploadedFileRef.current = null;
                                }}
                                onRemove={() => {
                                    setSelectedFile(null);
                                    setCurrentAvatarFileId(undefined);
                                    uploadedFileRef.current = null;
                                }}
                                rounded={true}
                                width={120}
                                height={120}
                                error={uploadError || undefined}
                                disabled={isLoading}
                            />
                            <p className="text-[10px] text-on-surface-variant">
                                {isUploading ? (
                                    <span className="flex items-center gap-1">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        در حال آپلود...
                                    </span>
                                ) : selectedFile ? (
                                    'تصویر جدید انتخاب شد'
                                ) : currentAvatarFileId ? (
                                    'برای تغییر تصویر کلیک کنید'
                                ) : (
                                    'برای افزودن تصویر کلیک کنید'
                                )}
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
                                placeholder="مثلا فروشنده عمده آهن آلات"
                                className="w-full bg-surface-container-lowest border h-12 px-4 font-body-md text-right focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
                            />
                        </div>

                        <div className="pt-4 border-t border-outline-variant">
                            <button
                                type="button"
                                onClick={handleSaveAndNext}
                                disabled={isLoading || isUploading}
                                className="w-full h-12 bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-md rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading || isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        در حال ذخیره...
                                    </>
                                ) : (
                                    'تایید و ادامه'
                                )}
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

                        {/* استان و شهر */}
                        <div className="flex flex-col gap-1">
                            <IranLocationSelector
                                provinceCode={selectedProvinceCode}
                                cityCode={selectedCityCode}
                                onProvinceChange={setSelectedProvinceCode}
                                onCityChange={setSelectedCityCode}
                                disabled={isLoading}
                            />
                        </div>

                        {/* تاریخ تولد */}
                        <div className="flex flex-col gap-1">
                            <label className="font-label-md text-label-md text-on-surface-variant">تاریخ تولد</label>
                            <PersianDate
                                value={birthDate}
                                onChange={(date) => setBirthDate(date)}
                                placeholder="تاریخ تولد را انتخاب کنید"
                                maxDate={maxBirthDate}
                                disabled={isLoading}
                            />
                        </div>

                        {/* ایمیل */}
                        <div className="flex flex-col gap-1">
                            <label className="font-label-md text-label-md text-on-surface-variant">
                                ایمیل <span className="text-on-surface-variant/50 text-[10px]">(اختیاری)</span>
                            </label>
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
                            <button type="submit" disabled={isLoading} className="flex-1 py-3 bg-primary text-on-primary hover:bg-primary/90 transition-colors font-label-md disabled:opacity-50 rounded-lg flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        ذخیره...
                                    </>
                                ) : (
                                    'ذخیره'
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}