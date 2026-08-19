// components/business/VerificationModal.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Shield, BadgeCheck, Phone, Loader2, Plus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FileUploader } from '@/components/common/FileUploader';
import { useUploadFile } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';
import { RootState } from '@/lib/store/store';
import { useSelector } from 'react-redux';

interface VerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessId: string;
    businessName: string;
    currentLevel?: 'none' | 'blue' | 'silver' | 'gold';
    isProfileComplete?: boolean;
    onSuccess?: () => void;
}

const LEVEL_DEFS = [
    { value: 'blue', label: 'آبی', icon: <BadgeCheck className="w-5 h-5" />, color: 'text-blue-500', bg: 'bg-blue-50' },
    { value: 'silver', label: 'نقره‌ای', icon: <BadgeCheck className="w-5 h-5" />, color: 'text-gray-400', bg: 'bg-gray-50' },
    { value: 'gold', label: 'طلایی', icon: <BadgeCheck className="w-5 h-5" />, color: 'text-green-500', bg: 'bg-green-50' },
] as const;

export function VerificationModal({
                                      isOpen,
                                      onClose,
                                      businessId,
                                      businessName,
                                      currentLevel = 'none',
                                      isProfileComplete = true,
                                      onSuccess,
                                  }: VerificationModalProps) {
    const user = useSelector((state: RootState) => state.auth.user);
    const userNationalId = user?.nationalId || null;

    // سطوح مجاز بر اساس تیک فعلی
    const allowedLevels = useMemo(() => {
        if (currentLevel === 'none') return ['blue', 'silver', 'gold'];
        if (currentLevel === 'blue') return ['silver', 'gold'];
        if (currentLevel === 'silver') return ['gold'];
        return []; // gold
    }, [currentLevel]);

    const [activeLevel, setActiveLevel] = useState<'blue' | 'silver' | 'gold'>(
        (allowedLevels[0] as 'blue' | 'silver' | 'gold') || 'blue'
    );

    // ریست activeLevel در صورت تغییر allowedLevels
    useEffect(() => {
        if (allowedLevels.length > 0 && !allowedLevels.includes(activeLevel)) {
            setActiveLevel(allowedLevels[0] as 'blue' | 'silver' | 'gold');
        }
    }, [allowedLevels, activeLevel]);

    // آیا کارت ملی قبلاً تأیید شده؟ (کد ملی در user وجود دارد)
    const isNationalCardVerified = !!userNationalId;

    // آیا مجوزها باید اجباری باشند؟
    // اجباری در صورتی که کاربر از سطحی که مجوز ندارد (none, blue) برای سطحی که مجوز می‌خواهد (silver, gold) اقدام کند.
    // اگر کاربر قبلاً silver باشد و حالا gold می‌خواهد، مجوزها اختیاری.
    const isLicenseMandatory = useMemo(() => {
        if (activeLevel === 'silver' && currentLevel !== 'silver') return true;
        if (activeLevel === 'gold' && currentLevel !== 'silver') return true;
        return false;
    }, [activeLevel, currentLevel]);

    // جوایز برای gold همیشه اجباری
    const isAwardMandatory = activeLevel === 'gold';

    // state ها
    const [nationalId, setNationalId] = useState(userNationalId || '');
    const [nationalCardFile, setNationalCardFile] = useState<File | null>(null);
    const [licenseFiles, setLicenseFiles] = useState<(File | null)[]>([null]);
    const [awardFiles, setAwardFiles] = useState<(File | null)[]>([null]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const uploadMutation = useUploadFile();

    if (!isOpen) return null;

    const levelInfo = {
        none: { label: 'در انتظار', icon: <Shield className="w-5 h-5 text-gray-300" />, color: 'text-gray-300' },
        blue: { label: 'آبی', icon: <BadgeCheck className="w-5 h-5 text-blue-500 fill-blue-500" />, color: 'text-blue-500' },
        silver: { label: 'نقره‌ای', icon: <BadgeCheck className="w-5 h-5 text-gray-400 fill-gray-400" />, color: 'text-gray-400' },
        gold: { label: 'طلایی', icon: <BadgeCheck className="w-5 h-5 text-green-500 fill-green-500" />, color: 'text-green-500' },
    }[currentLevel] || levelInfo.none;

    // helper functions
    const handleAddLicenseSlot = () => setLicenseFiles(prev => [...prev, null]);
    const handleRemoveLicenseSlot = (index: number) => {
        setLicenseFiles(prev => {
            const newFiles = [...prev];
            newFiles.splice(index, 1);
            return newFiles.length === 0 ? [null] : newFiles;
        });
    };
    const handleSetLicenseFile = (index: number, file: File | null) => {
        setLicenseFiles(prev => {
            const newFiles = [...prev];
            newFiles[index] = file;
            return newFiles;
        });
    };
    const handleAddAwardSlot = () => setAwardFiles(prev => [...prev, null]);
    const handleRemoveAwardSlot = (index: number) => {
        setAwardFiles(prev => {
            const newFiles = [...prev];
            newFiles.splice(index, 1);
            return newFiles.length === 0 ? [null] : newFiles;
        });
    };
    const handleSetAwardFile = (index: number, file: File | null) => {
        setAwardFiles(prev => {
            const newFiles = [...prev];
            newFiles[index] = file;
            return newFiles;
        });
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        // کد ملی فقط در صورت عدم تأیید قبلی
        if (!userNationalId && (!nationalId || !/^\d{10}$/.test(nationalId))) {
            newErrors.nationalId = 'کد ملی معتبر (۱۰ رقم) الزامی است';
        }
        // کارت ملی فقط اگر تأیید نشده باشد
        if (!isNationalCardVerified && !nationalCardFile) {
            newErrors.nationalCard = 'تصویر کارت ملی الزامی است';
        }
        // مجوزها
        if (isLicenseMandatory && licenseFiles.every(f => f === null)) {
            newErrors.license = 'حداقل یک مجوز کسب‌وکار الزامی است';
        }
        // جوایز
        if (isAwardMandatory && awardFiles.every(f => f === null)) {
            newErrors.awards = 'حداقل یک مدرک افتخار الزامی است';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const uploadFileAsync = async (file: File, fieldKey: string): Promise<string> => {
        const result = await uploadMutation.mutateAsync({
            file,
            model: 'Business',
            modelId: businessId,
            fieldKey,
        });
        return result.id;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsSubmitting(true);
        try {
            // اگر کارت ملی تأیید شده، نیازی به آپلود مجدد نیست
            const nationalCardId = isNationalCardVerified
                ? null
                : await uploadFileAsync(nationalCardFile!, 'nationalCard');

            const licenseIds = [];
            for (let i = 0; i < licenseFiles.length; i++) {
                const file = licenseFiles[i];
                if (file) licenseIds.push(await uploadFileAsync(file, `license-${i}`));
            }
            const awardIds = [];
            for (let i = 0; i < awardFiles.length; i++) {
                const file = awardFiles[i];
                if (file) awardIds.push(await uploadFileAsync(file, `award-${i}`));
            }

            const payload = {
                level: activeLevel,
                nationalId: userNationalId || nationalId,
                nationalCardFileId: nationalCardId || undefined, // اگر null بود ارسال نشود بهتر است undefined
                licenseFileIds: licenseIds,
                awardFileIds: awardIds,
            };

            await apiService.business.requestVerification(businessId, payload);
            const levelNames = { blue: 'آبی', silver: 'نقره‌ای', gold: 'طلایی' };
            toast.success(`درخواست تیک ${levelNames[activeLevel]} با موفقیت ارسال شد`);
            onSuccess?.();
            onClose();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ارسال درخواست');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-0 md:p-4">
            <div className="bg-white dark:bg-gray-900 w-full h-full md:h-auto md:max-h-[95vh] md:max-w-lg md:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 bg-primary/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-on-surface">تیک اعتماد</h3>
                            <p className="text-xs text-on-surface-variant">{businessName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
                        <X className="w-5 h-5 text-on-surface-variant" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">

                    {/* انتخاب سطح */}
                    <div>
                        <label className="text-xs font-medium text-on-surface-variant mb-2 block">سطح تیک اعتماد</label>
                        <div className="grid grid-cols-3 gap-3">
                            {LEVEL_DEFS.filter(({ value }) => allowedLevels.includes(value)).map(({ value, label, icon, color, bg }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => setActiveLevel(value)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200",
                                        activeLevel === value
                                            ? `border-2 ${color} ${bg} shadow-sm`
                                            : 'border-outline-variant hover:bg-surface-container-low'
                                    )}
                                >
                                    <div className={cn('w-8 h-8 flex items-center justify-center rounded-full', activeLevel === value ? 'bg-white shadow' : '')}>
                                        {icon}
                                    </div>
                                    <span className={cn("text-[11px] font-medium", activeLevel === value ? color : 'text-on-surface-variant')}>
                                        تیک {label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* راهنمای مدارک */}
                    <div className="bg-surface-container-low p-3 rounded-xl text-xs text-on-surface-variant space-y-1">
                        <p className="font-medium text-on-surface">مدارک مورد نیاز:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            {!userNationalId && <li>کد ملی + تصویر کارت ملی</li>}
                            {activeLevel !== 'blue' && !isLicenseMandatory && <li>مجوزهای کسب‌وکار (اختیاری - قبلاً تأیید شده)</li>}
                            {activeLevel !== 'blue' && isLicenseMandatory && <li>مجوزهای کسب‌وکار (حداقل ۱ مجوز)</li>}
                            {activeLevel === 'gold' && <li>جوایز و افتخارات (حداقل ۱ مدرک)</li>}
                        </ul>
                    </div>

                    {/* کد ملی (فقط در صورت عدم تأیید) */}
                    {!userNationalId && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface-variant">کد ملی <span className="text-red-500">*</span></label>
                            <input
                                type="text"
                                dir="ltr"
                                value={nationalId}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setNationalId(val);
                                    if (errors.nationalId) setErrors({ ...errors, nationalId: undefined });
                                }}
                                placeholder="۱۲۳۴۵۶۷۸۹۰"
                                className={cn(
                                    'w-full bg-surface-container-lowest border h-10 px-3 text-sm text-right font-mono rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none',
                                    errors.nationalId ? 'border-red-500' : 'border-outline-variant'
                                )}
                            />
                            {errors.nationalId && <p className="text-red-500 text-xs">{errors.nationalId}</p>}
                        </div>
                    )}

                    {/* کارت ملی (فقط در صورت عدم تأیید) */}
                    {!isNationalCardVerified && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface-variant">تصویر کارت ملی <span className="text-red-500">*</span></label>
                            <FileUploader
                                model="Business"
                                modelId={businessId}
                                fieldKey="nationalCard"
                                value={null}
                                onFileSelect={(file) => {
                                    setNationalCardFile(file);
                                    if (errors.nationalCard) setErrors({ ...errors, nationalCard: undefined });
                                }}
                                showDeleteBtn={!!nationalCardFile}
                                onRemove={() => setNationalCardFile(null)}
                                rounded={false}
                                width={100}
                                height={100}
                                disabled={isSubmitting}
                                label="آپلود کارت ملی"
                            />
                            {errors.nationalCard && <p className="text-red-500 text-xs">{errors.nationalCard}</p>}
                        </div>
                    )}

                    {/* مجوزها */}
                    {(activeLevel === 'silver' || activeLevel === 'gold') && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                                مجوزهای کسب‌وکار
                                {isLicenseMandatory ? <span className="text-red-500">*</span> : <span className="text-green-600 text-[10px]">(اختیاری)</span>}
                                {isLicenseMandatory && <span className="text-[10px] text-on-surface-variant/70 mr-auto">حداقل ۱ مجوز</span>}
                            </label>
                            <div className="flex flex-wrap gap-3 items-start">
                                {licenseFiles.map((file, idx) => (
                                    <div key={idx} className="relative">
                                        <FileUploader
                                            model="Business"
                                            modelId={businessId}
                                            fieldKey={`license-${idx}`}
                                            value={null}
                                            onFileSelect={(f) => {
                                                handleSetLicenseFile(idx, f);
                                                if (errors.license) setErrors({ ...errors, license: undefined });
                                            }}
                                            showDeleteBtn={!!file}
                                            onRemove={() => handleRemoveLicenseSlot(idx)}
                                            rounded={false}
                                            width={100}
                                            height={100}
                                            disabled={isSubmitting}
                                            label="آپلود مجوز"
                                        />
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddLicenseSlot}
                                    className="w-[100px] h-[100px] border-2 border-dashed border-outline-variant rounded-lg flex items-center justify-center text-on-surface-variant/60 hover:border-primary hover:text-primary transition-colors"
                                    disabled={isSubmitting}
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                            {errors.license && <p className="text-red-500 text-xs">{errors.license}</p>}
                        </div>
                    )}

                    {/* جوایز (فقط طلایی) */}
                    {activeLevel === 'gold' && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                                جوایز و افتخارات <span className="text-red-500">*</span>
                                <span className="text-[10px] text-on-surface-variant/70 mr-auto">حداقل ۱ مدرک</span>
                            </label>
                            <div className="flex flex-wrap gap-3 items-start">
                                {awardFiles.map((file, idx) => (
                                    <div key={idx} className="relative">
                                        <FileUploader
                                            model="Business"
                                            modelId={businessId}
                                            fieldKey={`award-${idx}`}
                                            value={null}
                                            onFileSelect={(f) => {
                                                handleSetAwardFile(idx, f);
                                                if (errors.awards) setErrors({ ...errors, awards: undefined });
                                            }}
                                            showDeleteBtn={!!file}
                                            onRemove={() => handleRemoveAwardSlot(idx)}
                                            rounded={false}
                                            width={100}
                                            height={100}
                                            disabled={isSubmitting}
                                            label="آپلود مدرک"
                                        />
                                    </div>
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddAwardSlot}
                                    className="w-[100px] h-[100px] border-2 border-dashed border-outline-variant rounded-lg flex items-center justify-center text-on-surface-variant/60 hover:border-primary hover:text-primary transition-colors"
                                    disabled={isSubmitting}
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                            {errors.awards && <p className="text-red-500 text-xs">{errors.awards}</p>}
                        </div>
                    )}

                    {/* هشدار پروفایل ناقص */}
                    {!isProfileComplete && (
                        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded-xl text-sm">
                            برای دریافت تیک اعتماد، ابتدا باید پروفایل کسب‌وکار خود را تکمیل کنید.
                        </div>
                    )}

                    {/* دکمه‌ها */}
                    <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
                        <button
                            type="submit"
                            disabled={isSubmitting || !isProfileComplete}
                            className="flex-1 h-11 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            {isSubmitting ? 'در حال ارسال...' : 'ارسال مدارک'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                if (window.innerWidth < 768) window.location.href = 'tel:09196421264';
                                else toast.info('شماره پشتیبانی: ۰۹۱۹۶۴۲۱۲۶۴');
                            }}
                            className="h-11 px-5 border border-outline-variant text-on-surface rounded-xl text-sm hover:bg-surface-container-low transition-colors flex items-center gap-2"
                        >
                            <Phone className="w-4 h-4" /> پشتیبانی
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}