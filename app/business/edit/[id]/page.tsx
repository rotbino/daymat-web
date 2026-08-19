// app/business/edit/[id]/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import {
    Building2, MapPin, Phone, Globe, FileText, Save, Pencil, X, Check,
    Briefcase, User, AlertCircle, Loader2, Award, Tag, MapPinned,
    Shield, BadgeCheck, ArrowRight, Clock, XCircle,
} from 'lucide-react';
import { ArmLocationSelector } from '@/app/components/ArmLocationSelector';
import { FileUploader } from '@/components/common/FileUploader';
import { RootState } from '@/lib/store/store';
import { useBusiness, useUpdateBusiness, useUploadFile } from '@/lib/api/apiHooks';
import { USER_POSITIONS, BUSINESS_TYPES } from '@/lib/api/data-types';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';
import { ActivitySelectorModal } from '@/app/components/ActivitySelectorModal';
import { VerificationModal } from '@/app/business/VerificationModal';

type EditMode = 'none' | 'basic' | 'location' | 'activities' | 'contact' | 'description';

export default function EditBusinessPage() {
    const router = useRouter();
    const params = useParams();
    const businessId = params.id as string;

    const { user } = useSelector((state: RootState) => state.auth);
    const { currentArm } = useSelector((state: RootState) => state.arm);
    const { data: business, isLoading, refetch } = useBusiness(businessId);
    const updateBusiness = useUpdateBusiness();
    const uploadMutation = useUploadFile();

    const armConfig = currentArm?.config as any || {};
    const restrictMembershipByIndustry = armConfig.accessRules?.restrictMembershipByIndustry ?? false;
    const supplierIndustries: { id: string; title: string }[] = armConfig.supplierIndustries || [];
    const buyerIndustries: { id: string; title: string }[] = armConfig.buyerIndustries || [];
    const labels = armConfig.formLabels || {};

    const [formData, setFormData] = useState({
        name: '', shortDescription: '', type: '', province: '', city: '',
        provinceCode: '', provinceLabel: '', cityCode: '', cityLabel: '',
        phone: '', address: '', website: '', description: '', position: '',
        logoUrl: '', activityIds: [] as string[], industryId: '',
    });
    const [selectedActivities, setSelectedActivities] = useState<any[]>([]);
    const [editMode, setEditMode] = useState<EditMode>('none');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [currentLogoFileId, setCurrentLogoFileId] = useState<string>('');
    const [showActivityModal, setShowActivityModal] = useState(false);
    const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
    const [savingSection, setSavingSection] = useState<EditMode | null>(null);

    const availableIndustries = useMemo(() => {
        if (!formData.type) return [];
        return formData.type === 'wholesaler' ? supplierIndustries : buyerIndustries;
    }, [formData.type, supplierIndustries, buyerIndustries]);
    const industryLabel = useMemo(() => {
        if (!formData.industryId) return '';
        const found = [...supplierIndustries, ...buyerIndustries].find(i => i.id === formData.industryId);
        return found?.title || '';
    }, [formData.industryId, supplierIndustries, buyerIndustries]);

    useEffect(() => {
        if (business) {
            const activityIds = business.activities?.map((a: any) => a.id) || [];
            setFormData({
                name: business.name || '',
                shortDescription: business.shortDescription || '',
                type: business.type || '',
                province: business.province || '',
                city: business.city || '',
                provinceCode: business.provinceCode || '',
                provinceLabel: business.province || '',
                cityCode: business.cityCode || '',
                cityLabel: business.city || '',
                phone: business.phone || '',
                address: business.address || '',
                website: business.website || '',
                description: business.description || '',
                position: business.position || '',
                logoUrl: business.logoUrl || '',
                activityIds: activityIds,
                industryId: business.industryId || '',
            });
            setCurrentLogoFileId(business.logoUrl || '');
            setSelectedActivities(business.activities || []);
        }
    }, [business]);

    useEffect(() => {
        if (business && user && business.ownerUserId !== user.id) {
            toast.error('شما به این کسب‌وکار دسترسی ندارید');
            router.push('/profile');
        }
    }, [business, user, router]);

    const handleLogoUpload = async (file: File) => {
        setIsUploading(true);
        try {
            const result = await uploadMutation.mutateAsync({
                file, model: 'Business', modelId: businessId, fieldKey: 'logo',
            });
            setCurrentLogoFileId(result.id);
            setFormData(prev => ({ ...prev, logoUrl: result.id }));
            toast.success('لوگو با موفقیت آپلود شد');
            await updateBusiness.mutateAsync({ id: businessId, data: { logoFileId: result.id } });
            refetch();
        } catch (error: any) {
            toast.error(error?.message || 'خطا در آپلود لوگو');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSectionSave = async (section: EditMode) => {
        setSavingSection(section);
        setIsSaving(true);
        try {
            const updateData = {
                name: formData.name.trim(),
                shortDescription: formData.shortDescription.trim(),
                type: formData.type,
                province: formData.provinceLabel || formData.province,
                city: formData.cityLabel || formData.city,
                provinceCode: formData.provinceCode,
                cityCode: formData.cityCode,
                phone: formData.phone.trim(),
                address: formData.address.trim(),
                website: formData.website.trim(),
                description: formData.description.trim(),
                position: formData.position,
                logoUrl: currentLogoFileId || undefined,
                activityIds: formData.activityIds.length > 0 ? formData.activityIds : undefined,
                industryId: formData.industryId || undefined,
            };
            await updateBusiness.mutateAsync({ id: businessId, data: updateData });
            toast.success('اطلاعات با موفقیت ذخیره شد');
            refetch();
            setEditMode('none');
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ذخیره اطلاعات');
        } finally {
            setIsSaving(false);
            setSavingSection(null);
        }
    };

    const resetChanges = () => {
        if (business) {
            const activityIds = business.activities?.map((a: any) => a.id) || [];
            setFormData({
                name: business.name || '', shortDescription: business.shortDescription || '',
                type: business.type || '', province: business.province || '', city: business.city || '',
                provinceCode: business.provinceCode || '', provinceLabel: business.province || '',
                cityCode: business.cityCode || '', cityLabel: business.city || '',
                phone: business.phone || '', address: business.address || '',
                website: business.website || '', description: business.description || '',
                position: business.position || '', logoUrl: business.logoUrl || '',
                activityIds: activityIds, industryId: business.industryId || '',
            });
            setSelectedActivities(business.activities || []);
            setCurrentLogoFileId(business.logoUrl || '');
        }
        setEditMode('none');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-950">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-sm text-on-surface-variant dark:text-gray-400">در حال بارگذاری...</p>
                </div>
            </div>
        );
    }

    if (!business) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background dark:bg-gray-950">
                <div className="text-center">
                    <AlertCircle className="w-14 h-14 text-error mx-auto" />
                    <h2 className="mt-4 text-xl font-semibold text-on-surface dark:text-gray-100">کسب‌وکار یافت نشد</h2>
                    <p className="mt-2 text-sm text-on-surface-variant dark:text-gray-400">کسب‌وکار مورد نظر وجود ندارد یا حذف شده است</p>
                    <button onClick={() => router.push('/profile')} className="mt-6 px-6 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary/90 transition-colors">
                        بازگشت به پروفایل
                    </button>
                </div>
            </div>
        );
    }

    const completionPercentage = [
        formData.name ? 15 : 0,
        formData.shortDescription ? 10 : 0,
        formData.type ? 15 : 0,
        formData.provinceCode && formData.cityCode ? 15 : 0,
        formData.activityIds.length > 0 ? 15 : 0,
        formData.phone ? 10 : 0,
        formData.description ? 10 : 0,
        formData.position ? 10 : 0,
    ].reduce((a, b) => a + b, 0);

    const isComplete = completionPercentage === 100;
    const businessTypeLabel = BUSINESS_TYPES.find(t => t.value === formData.type)?.label || '';
    const positionLabel = USER_POSITIONS.find(p => p.value === formData.position)?.label || '';
    const locationLabel = formData.provinceLabel && formData.cityLabel ? `${formData.provinceLabel}، ${formData.cityLabel}` : '';


    // محاسبه وضعیت‌ها (همان قبلی، اما isRejected اضافه شود)
    const isPending = business.verificationStatus === 'pending';
    const isRejected = business.verificationStatus === 'rejected';
    const isApproved = business.verificationStatus === 'approved';
    const currentTier = business.verificationTier;
    const hasApprovedTier = isApproved && currentTier !== 'none';
    const isGold = currentTier === 'gold' && isApproved;


    // کاربر می‌تواند درخواست اولیه بدهد اگر:
    // - پروفایل کامل باشد
    // - درخواستی در حال بررسی نداشته باشد (pending)
    // - یا هرگز تایید نشده (none) یا رد شده (rejected) باشد
    const canRequestInitial = isComplete && !isPending && !hasApprovedTier && !isRejected;

    // کاربر می‌تواند ارتقا دهد اگر:
    // - یک تیک تایید شده (غیر طلایی) داشته باشد
    // - درخواست جدیدی pending نباشد
    const canUpgrade = hasApprovedTier && !isGold && !isPending;

    return (
        <div className="min-h-screen bg-gradient-to-br from-surface via-surface to-surface-container-low/30 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/30">
            {/* ========== هدر ========== */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-outline-variant/50 dark:border-gray-800">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <button onClick={() => router.push('/profile')} className="p-2 hover:bg-surface-container-low dark:hover:bg-gray-800 rounded-full transition-colors">
                                <ArrowRight className="w-5 h-5 text-on-surface-variant dark:text-gray-400" />
                            </button>
                            <div>
                                <h1 className="text-lg font-semibold text-on-surface dark:text-gray-100">صفحه کسب‌وکار</h1>
                                <p className="text-xs text-on-surface-variant/70 dark:text-gray-500">{business.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-surface-container-low dark:bg-gray-800 rounded-full">
                                <div className={cn("w-2 h-2 rounded-full", isComplete ? "bg-green-500" : "bg-warning")} />
                                <span className="text-xs font-medium text-on-surface-variant dark:text-gray-400">
                                    {completionPercentage}% تکمیل
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                {/* ========== کارت پیشرفت ========== */}
                <div className="hidden sm:block bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-800 p-6 mb-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6 flex-1">
                            <div className="flex items-center gap-3">
                                <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xl",
                                    isComplete ? "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400" : "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400")}>
                                    {isComplete ? <Award className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-on-surface dark:text-gray-100">
                                        {isComplete ? 'پروفایل کامل است! 🎉' : 'تکمیل پروفایل کسب‌وکار'}
                                    </h2>
                                    <p className="text-xs text-on-surface-variant/70 dark:text-gray-500">
                                        {isComplete ? 'در هر زمان می توانید اطلاعات کسب و کار را به روز کنید' : `${100 - completionPercentage}٪ باقی مانده تا تکمیل پروفایل`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="w-full h-2 bg-surface-container-high dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-bold text-primary">{completionPercentage}%</span>
                            <p className="text-[10px] text-on-surface-variant/50 dark:text-gray-500">تکمیل شده</p>
                        </div>
                    </div>
                </div>



                 {/*========== کارت‌های تیک اعتماد (کامل) ==========*/}
                {isPending && (
                    <div className="bg-yellow-50 border-2 border-yellow-300 rounded-2xl p-6 mb-4">
                        <div className="flex items-center gap-4">
                            <Clock className="w-8 h-8 text-yellow-500" />
                            <div>
                                <h3 className="font-semibold text-on-surface dark:text-gray-100">در انتظار تأیید مدارک</h3>
                                <p className="text-sm text-on-surface-variant dark:text-gray-400">
                                    مدارک شما با موفقیت دریافت شد. کارشناسان ما در حال بررسی هستند.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {isRejected && (
                    <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 mb-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <XCircle className="w-8 h-8 text-red-500" />
                                <div>
                                    <h3 className="font-semibold text-on-surface dark:text-gray-100">درخواست شما رد شد</h3>
                                    <p className="text-sm text-on-surface-variant dark:text-gray-400">
                                        {business.latestVerification?.notes
                                            ? `دلیل: ${business.latestVerification.notes}`
                                            : 'می‌توانید مدارک خود را اصلاح کرده و دوباره ارسال کنید.'}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsVerificationModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium whitespace-nowrap"
                            >
                                <BadgeCheck className="w-4 h-4" />
                                ارسال مجدد
                            </button>
                        </div>
                    </div>
                )}

                {hasApprovedTier && (
                    <div className="bg-primary/5 border-2 border-primary/30 rounded-2xl p-6 mb-4">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <BadgeCheck className="w-8 h-8 text-primary" />
                                <div>
                                    <h3 className="font-semibold text-on-surface dark:text-gray-100">
                                        شما دارای تیک {currentTier === 'blue' ? 'آبی' : currentTier === 'silver' ? 'نقره‌ای' : 'طلایی'} هستید
                                    </h3>
                                    <p className="text-sm text-on-surface-variant dark:text-gray-400">
                                        {isGold ? 'بالاترین سطح اعتماد را کسب کرده‌اید.' : 'می‌توانید برای ارتقاء به سطح بالاتر اقدام کنید.'}
                                    </p>
                                </div>
                            </div>
                            {!isGold && (
                                <button
                                    onClick={() => setIsVerificationModalOpen(true)}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium whitespace-nowrap"
                                >
                                    <BadgeCheck className="w-4 h-4" />
                                    ارتقاء تیک
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {canRequestInitial && (
                    <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/15 dark:to-primary/10 border-2 border-primary/30 dark:border-primary/40 rounded-2xl p-6 mb-4 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center flex-shrink-0">
                                    <Shield className="w-8 h-8 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-on-surface dark:text-gray-100 flex items-center gap-2">
                                        اطلاعات کسب‌وکار شما کامل است! ✅
                                    </h3>
                                    <p className="text-sm text-on-surface-variant dark:text-gray-400">
                                        اکنون می‌توانید برای دریافت تیک اعتماد اقدام کنید.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsVerificationModalOpen(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium whitespace-nowrap"
                            >
                                <BadgeCheck className="w-4 h-4" />
                                دریافت تیک اعتماد
                            </button>
                        </div>
                    </div>
                )}

                {/* ========== کارت اصلی پروفایل ========== */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-800 p-6 sm:p-8 shadow-sm mb-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="relative mx-auto sm:mx-0">
                            <FileUploader
                                value={currentLogoFileId}
                                onFileSelect={(file) => { if (file) handleLogoUpload(file); }}
                                onRemove={() => { setCurrentLogoFileId(''); setFormData(prev => ({ ...prev, logoUrl: '' })); }}
                                rounded={true} width={120} height={120} disabled={isSaving}
                            />
                            {isUploading && (
                                <div className="absolute -bottom-6 left-0 right-0 text-center">
                                    <span className="text-[8px] text-primary bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-full flex items-center gap-1 justify-center">
                                        <Loader2 className="w-3 h-3 animate-spin" /> در حال آپلود...
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl sm:text-2xl font-bold text-on-surface dark:text-gray-100 truncate">
                                    {formData.name || 'نام کسب‌وکار'}
                                </h1>
                                {formData.type && (
                                    <span className="hidden sm:inline-block px-2.5 py-0.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 text-xs rounded-full font-medium">
                                        {businessTypeLabel}
                                    </span>
                                )}
                            </div>
                            <div className="text-on-surface dark:text-gray-300 truncate mt-0.5">{formData.shortDescription || 'معرفی کوتاه'}</div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-on-surface-variant dark:text-gray-400">
                                {locationLabel && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{locationLabel}</span>}
                                {formData.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{formData.phone}</span>}
                                {positionLabel && <span className="flex items-center gap-1 text-xs bg-surface-container-low dark:bg-gray-800 px-2 py-0.5 rounded-full"><User className="w-3 h-3" />{positionLabel}</span>}
                                {industryLabel && <span className="flex items-center gap-1 text-xs bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary-400 px-2 py-0.5 rounded-full border border-primary/10 dark:border-primary/20"><Building2 className="w-3 h-3" />{industryLabel}</span>}
                            </div>
                            {selectedActivities.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-3">
                                    {selectedActivities.map((activity: any) => (
                                        <span key={activity.id} className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary-400 text-[10px] rounded-full border border-primary/10 dark:border-primary/20">
                                            <Tag className="w-2.5 h-2.5" />{activity.title}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            {editMode === 'none' ? (
                                <button onClick={() => setEditMode('basic')}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all text-sm font-medium">
                                    <Pencil className="w-4 h-4" /> ویرایش اطلاعات
                                </button>
                            ) : (
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <button onClick={resetChanges}
                                            className="flex-1 sm:flex-none px-4 py-2.5 border border-outline dark:border-gray-700 text-on-surface dark:text-gray-300 rounded-xl hover:bg-surface-container-low dark:hover:bg-gray-800 transition-colors text-sm font-medium">انصراف</button>
                                    <button onClick={() => handleSectionSave(editMode)} disabled={isSaving}
                                            className="flex-1 sm:flex-none px-4 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} ذخیره
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {formData.description && editMode === 'none' && (
                        <div className="mt-4 pt-4 border-t border-outline-variant/50 dark:border-gray-800">
                            <p className="text-sm text-on-surface-variant dark:text-gray-400 leading-relaxed">{formData.description}</p>
                        </div>
                    )}
                </div>

                {/* ========== گرید اطلاعات ========== */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    {/* اطلاعات اصلی */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-800 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center"><Building2 className="w-4 h-4 text-primary dark:text-primary-400" /></div>
                                <h3 className="text-sm font-semibold text-on-surface dark:text-gray-100">اطلاعات اصلی</h3>
                            </div>
                            {editMode !== 'basic' ? (
                                <button onClick={() => setEditMode('basic')} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"><Pencil className="w-3.5 h-3.5" />ویرایش</button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEditMode('none')} className="text-xs text-on-surface-variant dark:text-gray-400 hover:text-error transition-colors">انصراف</button>
                                    <button onClick={() => handleSectionSave('basic')} disabled={savingSection === 'basic'}
                                            className="flex items-center gap-1 text-xs bg-primary text-on-primary px-3 py-1 rounded hover:bg-primary/90 transition-colors disabled:opacity-50">
                                        {savingSection === 'basic' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                        {savingSection === 'basic' ? 'ذخیره...' : 'ذخیره'}
                                    </button>
                                </div>
                            )}
                        </div>

                        {editMode === 'basic' ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 block mb-1">نام کسب‌وکار <span className="text-primary">*</span></label>
                                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                           placeholder={labels['business.name.placeholder'] || 'نام کسب‌وکار را وارد کنید'}
                                           className="w-full bg-surface-container-lowest dark:bg-gray-800 border border-outline dark:border-gray-700 rounded-lg h-10 px-3 text-sm text-right focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 block mb-1">معرفی کوتاه</label>
                                    <input type="text" value={formData.shortDescription} onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                                           placeholder={labels['business.shortDescription.placeholder'] || 'مثال: تولید کننده انواع آجر فشاری'}
                                           className="w-full bg-surface-container-lowest dark:bg-gray-800 border border-outline dark:border-gray-700 rounded-lg h-10 px-3 text-sm text-right focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 block mb-1">نوع کسب‌وکار</label>
                                    <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value, industryId: '' })}
                                            className="w-full bg-surface-container-lowest dark:bg-gray-800 border border-outline dark:border-gray-700 rounded-lg h-10 px-3 text-sm text-right appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                                        <option value="">انتخاب نوع...</option>
                                        {BUSINESS_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 block mb-1">سمت شما</label>
                                    <select value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                            className="w-full bg-surface-container-lowest dark:bg-gray-800 border border-outline dark:border-gray-700 rounded-lg h-10 px-3 text-sm text-right appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                                        <option value="">انتخاب سمت...</option>
                                        {USER_POSITIONS.map((pos) => <option key={pos.value} value={pos.value}>{pos.label}</option>)}
                                    </select>
                                </div>
                                {/*{restrictMembershipByIndustry && (
                                    <div>
                                        <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 block mb-1">صنف</label>
                                        {availableIndustries.length === 0 ? (
                                            <p className="text-[11px] text-warning">هیچ صنفی برای این نقش تعریف نشده</p>
                                        ) : (
                                            <select value={formData.industryId} onChange={(e) => setFormData({ ...formData, industryId: e.target.value })}
                                                    className="w-full bg-surface-container-lowest dark:bg-gray-800 border border-outline dark:border-gray-700 rounded-lg h-10 px-3 text-sm text-right appearance-none focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all">
                                                <option value="">انتخاب صنف...</option>
                                                {availableIndustries.map(ind => <option key={ind.id} value={ind.id}>{ind.title}</option>)}
                                            </select>
                                        )}
                                    </div>
                                )}*/}
                            </div>
                        ) : (
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between py-1.5 border-b border-outline-variant/30 dark:border-gray-800"><span className="text-on-surface-variant dark:text-gray-400">نام</span><span className="text-on-surface dark:text-gray-200 font-medium">{formData.name || '—'}</span></div>
                                <div className="flex justify-between py-1.5 border-b border-outline-variant/30 dark:border-gray-800"><span className="text-on-surface-variant dark:text-gray-400">معرفی کوتاه</span><span className="text-on-surface dark:text-gray-200 font-medium">{formData.shortDescription || '—'}</span></div>
                                <div className="flex justify-between py-1.5 border-b border-outline-variant/30 dark:border-gray-800"><span className="text-on-surface-variant dark:text-gray-400">نوع</span><span className="text-on-surface dark:text-gray-200">{businessTypeLabel || '—'}</span></div>
                                <div className="flex justify-between py-1.5 border-b border-outline-variant/30 dark:border-gray-800"><span className="text-on-surface-variant dark:text-gray-400">سمت</span><span className="text-on-surface dark:text-gray-200">{positionLabel || '—'}</span></div>
                              {/*  {restrictMembershipByIndustry && <div className="flex justify-between py-1.5"><span className="text-on-surface-variant dark:text-gray-400">صنف</span><span className="text-on-surface dark:text-gray-200">{industryLabel || '—'}</span></div>}*/}
                            </div>
                        )}
                    </div>

                    {/* فعالیت‌ها */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-800 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center"><Briefcase className="w-4 h-4 text-primary dark:text-primary-400" /></div>
                                <h3 className="text-sm font-semibold text-on-surface dark:text-gray-100">فعالیتها و مجوزها</h3>
                                {selectedActivities.length > 0 && <span className="text-[10px] bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 px-2 py-0.5 rounded-full">{selectedActivities.length}</span>}
                            </div>
                            {editMode !== 'activities' ? (
                                <button onClick={() => setEditMode('activities')} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"><Pencil className="w-3.5 h-3.5" />ویرایش</button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEditMode('none')} className="text-xs text-on-surface-variant dark:text-gray-400 hover:text-error transition-colors">انصراف</button>
                                    <button onClick={() => handleSectionSave('activities')} disabled={savingSection === 'activities'}
                                            className="flex items-center gap-1 text-xs bg-primary text-on-primary px-3 py-1 rounded hover:bg-primary/90 transition-colors disabled:opacity-50">
                                        {savingSection === 'activities' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}ذخیره
                                    </button>
                                </div>
                            )}
                        </div>

                        {editMode === 'activities' ? (
                            <div className="space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {selectedActivities.map((activity: any) => (
                                        <div key={activity.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 text-xs rounded-full">
                                            <Tag className="w-3 h-3" /><span>{activity.title}</span>
                                            <button onClick={() => {
                                                setFormData({ ...formData, activityIds: formData.activityIds.filter(id => id !== activity.id) });
                                                setSelectedActivities(selectedActivities.filter((a: any) => a.id !== activity.id));
                                            }} className="hover:bg-primary/20 rounded-full p-0.5 transition-colors"><X className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                    {selectedActivities.length === 0 && <span className="text-xs text-on-surface-variant/50 dark:text-gray-500">هیچ فعالیتی انتخاب نشده</span>}
                                </div>
                                <button onClick={() => setShowActivityModal(true)} disabled={selectedActivities.length >= 5}
                                        className={cn("w-full py-2.5 border border-dashed rounded-lg text-sm transition-colors",
                                            selectedActivities.length >= 5 ? "border-outline-variant text-on-surface-variant/50 cursor-not-allowed" : "border-primary text-primary hover:bg-primary/5")}>
                                    {selectedActivities.length >= 5 ? 'حداکثر ۵ فعالیت' : '+ افزودن فعالیت'}
                                </button>
                            </div>
                        ) : (
                            <div>
                                {selectedActivities.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedActivities.map((activity: any) => (
                                            <span key={activity.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/5 dark:bg-primary/10 text-primary dark:text-primary-400 text-xs rounded-full border border-primary/10 dark:border-primary/20">
                                                <Tag className="w-3 h-3" />{activity.title}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <span className="text-sm text-on-surface-variant/50 dark:text-gray-500">انتخاب فعالیتها بسیار مهم است.  با انتخاب دقیق فعالیت، بازارها تخصصی و خریداران و تامین کنندگان کاملا مرتبط به شما نمایش داده می شود و متقابلا کسب و کار شما نیز به خریداران مرتبط نمایش داده خواهد شد.</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* موقعیت مکانی */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-800 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center"><MapPinned className="w-4 h-4 text-primary dark:text-primary-400" /></div>
                                <h3 className="text-sm font-semibold text-on-surface dark:text-gray-100">موقعیت مکانی</h3>
                            </div>
                            {editMode !== 'location' ? (
                                <button onClick={() => setEditMode('location')} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"><Pencil className="w-3.5 h-3.5" />ویرایش</button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEditMode('none')} className="text-xs text-on-surface-variant dark:text-gray-400 hover:text-error transition-colors">انصراف</button>
                                    <button onClick={() => handleSectionSave('location')} disabled={savingSection === 'location'}
                                            className="flex items-center gap-1 text-xs bg-primary text-on-primary px-3 py-1 rounded hover:bg-primary/90 transition-colors disabled:opacity-50">
                                        {savingSection === 'location' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}ذخیره
                                    </button>
                                </div>
                            )}
                        </div>
                        {editMode === 'location' ? (
                            <ArmLocationSelector
                                provinceCode={formData.provinceCode}
                                cityCode={formData.cityCode}
                                onProvinceChange={(code, label) => setFormData(prev => ({ ...prev, provinceCode: code, provinceLabel: label, province: label, cityCode: '', cityLabel: '', city: '' }))}
                                onCityChange={(code, label) => setFormData(prev => ({ ...prev, cityCode: code, cityLabel: label, city: label }))}
                            />
                        ) : (
                            <div className="text-sm">
                                {locationLabel ? (
                                    <div className="flex items-center gap-2 text-on-surface dark:text-gray-200"><MapPin className="w-4 h-4 text-primary" /><span className="font-medium">{locationLabel}</span></div>
                                ) : (
                                    <span className="text-on-surface-variant/50 dark:text-gray-500">موقعیت مکانی ثبت نشده است</span>
                                )}
                                {formData.address && <p className="mt-2 text-xs text-on-surface-variant/70 dark:text-gray-500">{formData.address}</p>}
                            </div>
                        )}
                    </div>

                    {/* اطلاعات تماس */}
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-800 p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center"><Phone className="w-4 h-4 text-primary dark:text-primary-400" /></div>
                                <h3 className="text-sm font-semibold text-on-surface dark:text-gray-100">اطلاعات تماس</h3>
                            </div>
                            {editMode !== 'contact' ? (
                                <button onClick={() => setEditMode('contact')} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"><Pencil className="w-3.5 h-3.5" />ویرایش</button>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setEditMode('none')} className="text-xs text-on-surface-variant dark:text-gray-400 hover:text-error transition-colors">انصراف</button>
                                    <button onClick={() => handleSectionSave('contact')} disabled={savingSection === 'contact'}
                                            className="flex items-center gap-1 text-xs bg-primary text-on-primary px-3 py-1 rounded hover:bg-primary/90 transition-colors disabled:opacity-50">
                                        {savingSection === 'contact' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}ذخیره
                                    </button>
                                </div>
                            )}
                        </div>
                        {editMode === 'contact' ? (
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 block mb-1">شماره تماس</label>
                                    <input type="text" dir="ltr" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                           className="w-full bg-surface-container-lowest dark:bg-gray-800 border border-outline dark:border-gray-700 rounded-lg h-10 px-3 text-sm text-right font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-on-surface-variant dark:text-gray-400 block mb-1">وب‌سایت</label>
                                    <div className="relative">
                                        <input type="text" dir="ltr" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                               className="w-full bg-surface-container-lowest dark:bg-gray-800 border border-outline dark:border-gray-700 rounded-lg h-10 px-3 pr-10 text-sm text-right font-mono focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                               placeholder="https://example.com" />
                                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50 dark:text-gray-500" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 py-1"><Phone className="w-4 h-4 text-on-surface-variant/50 dark:text-gray-500" /><span className="text-on-surface dark:text-gray-200">{formData.phone || '—'}</span></div>
                                <div className="flex items-center gap-2 py-1"><Globe className="w-4 h-4 text-on-surface-variant/50 dark:text-gray-500" /><span className="text-on-surface dark:text-gray-200">{formData.website || '—'}</span></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ========== کارت: توضیحات ========== */}
                <div className="mt-4 sm:mt-6 bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-800 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center"><FileText className="w-4 h-4 text-primary dark:text-primary-400" /></div>
                            <h3 className="text-sm font-semibold text-on-surface dark:text-gray-100">معرفی کسب و کار</h3>
                        </div>
                        {editMode !== 'description' ? (
                            <button onClick={() => setEditMode('description')} className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"><Pencil className="w-3.5 h-3.5" />ویرایش</button>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button onClick={() => setEditMode('none')} className="text-xs text-on-surface-variant dark:text-gray-400 hover:text-error transition-colors">انصراف</button>
                                <button onClick={() => handleSectionSave('description')} disabled={savingSection === 'description'}
                                        className="flex items-center gap-1 text-xs bg-primary text-on-primary px-3 py-1 rounded hover:bg-primary/90 transition-colors disabled:opacity-50">
                                    {savingSection === 'description' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}ذخیره
                                </button>
                            </div>
                        )}
                    </div>

                    {editMode === 'description' ? (
                        <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4}
                                  className="w-full bg-surface-container-lowest dark:bg-gray-800 border border-outline dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                  placeholder="توضیحات کامل درباره کسب‌وکار، محصولات و خدمات..." />
                    ) : (
                        <p className="text-sm text-on-surface-variant dark:text-gray-400 leading-relaxed">{formData.description || 'کسب و کار خود را به خریداران و تامین کنندگان معرفی کنید.'}</p>
                    )}
                </div>

                {/* ========== دکمه ذخیره - نسخه موبایل ========== */}
                {editMode !== 'none' && (
                    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-outline-variant/50 dark:border-gray-800 p-4 z-40">
                        <div className="flex gap-3">
                            <button onClick={resetChanges} className="flex-1 py-3 border border-outline dark:border-gray-700 text-on-surface dark:text-gray-300 rounded-xl hover:bg-surface-container-low dark:hover:bg-gray-800 transition-colors text-sm font-medium">انصراف</button>
                            <button onClick={() => handleSectionSave(editMode)} disabled={isSaving}
                                    className="flex-1 py-3 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}ذخیره
                            </button>
                        </div>
                    </div>
                )}
            </main>

            <ActivitySelectorModal
                isOpen={showActivityModal}
                onClose={() => setShowActivityModal(false)}
                selectedIds={formData.activityIds}
                onSelect={(ids) => {
                    setFormData({ ...formData, activityIds: ids });
                    const fetchSelected = async () => {
                        if (ids.length > 0) {
                            try {
                                const leaves = await apiService.activity.getLeaves();
                                setSelectedActivities(leaves.filter((a: any) => ids.includes(a.id)));
                            } catch (error) { console.error('Error:', error); }
                        } else { setSelectedActivities([]); }
                    };
                    fetchSelected();
                }}
                max={5}
                title="انتخاب فعالیت‌های کسب‌وکار"
            />

            <VerificationModal
                isOpen={isVerificationModalOpen}
                onClose={() => setIsVerificationModalOpen(false)}
                businessId={businessId}
                businessName={business.name}
                currentLevel={business.verificationTier as 'none' | 'blue' | 'silver' | 'gold' || 'none'}
                onSuccess={() => refetch()}
            />
        </div>
    );
}