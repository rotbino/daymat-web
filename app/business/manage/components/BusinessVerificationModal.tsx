// app/business/manage/components/BusinessVerificationModal.tsx
// 🛡️ درخواست تیک اعتماد کسب‌وکار — ارسال مدارک به ادمین (سطح کسب‌وکار، نه کاتالوگ)
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { X, Shield, BadgeCheck, Phone, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FileUploader } from '@/components/common/FileUploader';
import { useUploadFile, useRequestBusinessVerification } from '@/lib/api/apiHooks';
import { RootState } from '@/lib/store/store';
import { useSelector } from 'react-redux';

interface BusinessVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessId: string;
    businessName: string;
    currentTier?: string;
}

const LEVEL_DEFS = [
    { value: 'blue', label: 'آبی', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-500/10' },
    { value: 'silver', label: 'نقره‌ای', color: 'text-gray-400', bg: 'bg-gray-50 dark:bg-gray-500/10' },
    { value: 'gold', label: 'طلایی', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-500/10' },
] as const;

type Level = 'blue' | 'silver' | 'gold';

export function BusinessVerificationModal({
    isOpen,
    onClose,
    businessId,
    businessName,
    currentTier = 'none',
}: BusinessVerificationModalProps) {
    const user = useSelector((state: RootState) => state.auth.user);
    const userNationalId = user?.nationalId || null;

    // سطوح مجاز بر اساس تیک فعلی
    const allowedLevels = useMemo<Level[]>(() => {
        if (currentTier === 'none') return ['blue', 'silver', 'gold'];
        if (currentTier === 'blue') return ['silver', 'gold'];
        if (currentTier === 'silver') return ['gold'];
        return [];
    }, [currentTier]);

    const [activeLevel, setActiveLevel] = useState<Level>(allowedLevels[0] || 'blue');

    useEffect(() => {
        if (allowedLevels.length > 0 && !allowedLevels.includes(activeLevel)) {
            setActiveLevel(allowedLevels[0]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allowedLevels]);

    const isNationalCardVerified = !!userNationalId;

    // مجوزها: برای نقره‌ای/طلایی اجباری؛ طلایی → جوایز همیشه اجباری
    const isLicenseMandatory = useMemo(() => {
        if (activeLevel === 'silver' && currentTier !== 'silver') return true;
        if (activeLevel === 'gold' && currentTier !== 'silver') return true;
        return false;
    }, [activeLevel, currentTier]);
    const isAwardMandatory = activeLevel === 'gold';

    const [nationalId, setNationalId] = useState(userNationalId || '');
    const [nationalCardFile, setNationalCardFile] = useState<File | null>(null);
    const [licenseFiles, setLicenseFiles] = useState<(File | null)[]>([null]);
    const [awardFiles, setAwardFiles] = useState<(File | null)[]>([null]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const uploadMutation = useUploadFile();
    const requestMutation = useRequestBusinessVerification();

    if (!isOpen) return null;

    const handleAddLicenseSlot = () => setLicenseFiles((prev) => [...prev, null]);
    const handleRemoveLicenseSlot = (index: number) => {
        setLicenseFiles((prev) => {
            const next = [...prev];
            next.splice(index, 1);
            return next.length === 0 ? [null] : next;
        });
    };
    const handleSetLicenseFile = (index: number, file: File | null) => {
        setLicenseFiles((prev) => {
            const next = [...prev];
            next[index] = file;
            return next;
        });
    };
    const handleAddAwardSlot = () => setAwardFiles((prev) => [...prev, null]);
    const handleRemoveAwardSlot = (index: number) => {
        setAwardFiles((prev) => {
            const next = [...prev];
            next.splice(index, 1);
            return next.length === 0 ? [null] : next;
        });
    };
    const handleSetAwardFile = (index: number, file: File | null) => {
        setAwardFiles((prev) => {
            const next = [...prev];
            next[index] = file;
            return next;
        });
    };

    const validate = () => {
        const e: Record<string, string> = {};
        if (!nationalId || !/^\d{10}$/.test(nationalId)) {
            e.nationalId = 'کد ملی معتبر (۱۰ رقم) الزامی است';
        }
        if (!isNationalCardVerified && !nationalCardFile) {
            e.nationalCard = 'تصویر کارت ملی الزامی است';
        }
        if (isLicenseMandatory && licenseFiles.every((f) => f === null)) {
            e.license = 'حداقل یک مجوز کسب‌وکار الزامی است';
        }
        if (isAwardMandatory && awardFiles.every((f) => f === null)) {
            e.awards = 'حداقل یک مدرک افتخار الزامی است';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
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
            const nationalCardId = isNationalCardVerified ? undefined : await uploadFileAsync(nationalCardFile!, 'nationalCard');

            const licenseIds: string[] = [];
            for (let i = 0; i < licenseFiles.length; i++) {
                const file = licenseFiles[i];
                if (file) licenseIds.push(await uploadFileAsync(file, `license-${i}`));
            }
            const awardIds: string[] = [];
            for (let i = 0; i < awardFiles.length; i++) {
                const file = awardFiles[i];
                if (file) awardIds.push(await uploadFileAsync(file, `award-${i}`));
            }

            await requestMutation.mutateAsync({
                id: businessId,
                data: {
                    level: activeLevel,
                    nationalId,
                    nationalCardFileId: nationalCardId,
                    licenseFileIds: licenseIds,
                    awardFileIds: awardIds,
                },
            });

            const levelNames = { blue: 'آبی', silver: 'نقره‌ای', gold: 'طلایی' };
            toast.success(`درخواست تیک ${levelNames[activeLevel]} با موفقیت ارسال شد`);
            onClose();
        } catch {
            /* توست خطا در هوک */
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-0 md:p-4">
            <div className="bg-white dark:bg-gray-900 w-full h-full md:h-auto md:max-h-[95vh] md:max-w-lg md:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
                {/* هدر */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 bg-primary/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Shield className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-on-surface">تیک اعتماد کسب‌وکار</h3>
                            <p className="text-xs text-on-surface-variant">{businessName}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
                        aria-label="بستن"
                    >
                        <X className="w-5 h-5 text-on-surface-variant" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* انتخاب سطح */}
                    <div>
                        <label className="text-xs font-medium text-on-surface-variant mb-2 block">سطح تیک اعتماد</label>
                        <div className="grid grid-cols-3 gap-3">
                            {LEVEL_DEFS.filter(({ value }) => allowedLevels.includes(value)).map(
                                ({ value, label, color, bg }) => (
                                    <button
                                        key={value}
                                        type="button"
                                        onClick={() => setActiveLevel(value)}
                                        className={cn(
                                            'flex flex-col items-center gap-2 p-3 rounded-xl border transition-all duration-200',
                                            activeLevel === value
                                                ? `border-2 ${color} ${bg} shadow-sm`
                                                : 'border-outline-variant hover:bg-surface-container-low',
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                'w-8 h-8 flex items-center justify-center rounded-full',
                                                activeLevel === value ? 'bg-white dark:bg-gray-800 shadow' : '',
                                            )}
                                        >
                                            <BadgeCheck className={cn('w-5 h-5', color)} />
                                        </div>
                                        <span
                                            className={cn(
                                                'text-[11px] font-medium',
                                                activeLevel === value ? color : 'text-on-surface-variant',
                                            )}
                                        >
                                            تیک {label}
                                        </span>
                                    </button>
                                ),
                            )}
                        </div>
                    </div>

                    {/* راهنمای مدارک */}
                    <div className="bg-surface-container-low p-3 rounded-xl text-xs text-on-surface-variant space-y-1">
                        <p className="font-medium text-on-surface">مدارک مورد نیاز:</p>
                        <ul className="list-disc list-inside space-y-0.5">
                            <li>کد ملی {!isNationalCardVerified && '+ تصویر کارت ملی'}</li>
                            {activeLevel !== 'blue' && (
                                <li>مجوزهای کسب‌وکار {isLicenseMandatory ? '(حداقل ۱ مجوز)' : '(اختیاری — قبلاً تأیید شده)'}</li>
                            )}
                            {activeLevel === 'gold' && <li>جوایز و افتخارات (حداقل ۱ مدرک)</li>}
                        </ul>
                    </div>

                    {/* کد ملی */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-on-surface-variant">
                            کد ملی <span className="text-red-500">*</span>
                        </label>
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
                                errors.nationalId ? 'border-red-500' : 'border-outline-variant',
                            )}
                        />
                        {errors.nationalId && <p className="text-red-500 text-xs">{errors.nationalId}</p>}
                    </div>

                    {/* کارت ملی — فقط در صورت عدم تأیید قبلی */}
                    {!isNationalCardVerified && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface-variant">
                                تصویر کارت ملی <span className="text-red-500">*</span>
                            </label>
                            <FileUploader
                                value={null}
                                onFileSelect={(file) => {
                                    setNationalCardFile(file);
                                    if (errors.nationalCard) setErrors({ ...errors, nationalCard: undefined });
                                }}
                                onRemove={() => setNationalCardFile(null)}
                                showDeleteBtn={!!nationalCardFile}
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
                                {isLicenseMandatory ? (
                                    <span className="text-red-500">*</span>
                                ) : (
                                    <span className="text-green-600 text-[10px]">(اختیاری)</span>
                                )}
                            </label>
                            <div className="flex flex-wrap gap-3 items-start">
                                {licenseFiles.map((file, idx) => (
                                    <FileUploader
                                        key={idx}
                                        value={null}
                                        onFileSelect={(f) => {
                                            handleSetLicenseFile(idx, f);
                                            if (errors.license) setErrors({ ...errors, license: undefined });
                                        }}
                                        onRemove={() => handleRemoveLicenseSlot(idx)}
                                        showDeleteBtn={!!file}
                                        rounded={false}
                                        width={100}
                                        height={100}
                                        disabled={isSubmitting}
                                        label="آپلود مجوز"
                                    />
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddLicenseSlot}
                                    className="w-[100px] h-[100px] border-2 border-dashed border-outline-variant rounded-lg flex items-center justify-center text-on-surface-variant/60 hover:border-primary hover:text-primary transition-colors"
                                    disabled={isSubmitting}
                                    aria-label="افزودن مجوز"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                            {errors.license && <p className="text-red-500 text-xs">{errors.license}</p>}
                        </div>
                    )}

                    {/* جوایز — فقط طلایی */}
                    {activeLevel === 'gold' && (
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                                جوایز و افتخارات <span className="text-red-500">*</span>
                            </label>
                            <div className="flex flex-wrap gap-3 items-start">
                                {awardFiles.map((file, idx) => (
                                    <FileUploader
                                        key={idx}
                                        value={null}
                                        onFileSelect={(f) => {
                                            handleSetAwardFile(idx, f);
                                            if (errors.awards) setErrors({ ...errors, awards: undefined });
                                        }}
                                        onRemove={() => handleRemoveAwardSlot(idx)}
                                        showDeleteBtn={!!file}
                                        rounded={false}
                                        width={100}
                                        height={100}
                                        disabled={isSubmitting}
                                        label="آپلود مدرک"
                                    />
                                ))}
                                <button
                                    type="button"
                                    onClick={handleAddAwardSlot}
                                    className="w-[100px] h-[100px] border-2 border-dashed border-outline-variant rounded-lg flex items-center justify-center text-on-surface-variant/60 hover:border-primary hover:text-primary transition-colors"
                                    disabled={isSubmitting}
                                    aria-label="افزودن مدرک"
                                >
                                    <Plus className="w-6 h-6" />
                                </button>
                            </div>
                            {errors.awards && <p className="text-red-500 text-xs">{errors.awards}</p>}
                        </div>
                    )}

                    {/* دکمه‌ها */}
                    <div className="flex gap-3 pt-3 border-t border-outline-variant/20">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 h-11 bg-primary text-on-primary rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
