// app/components/JoinArmModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useBusinesses, useCreateBusiness, useArms } from '@/lib/api/apiHooks';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import { X, Building2, Plus, Loader2, Store } from 'lucide-react';
import Image from 'next/image';
import { IranLocationSelector } from "@/app/components/IranLocationSelector";
import { ArmLocationSelector } from '@/app/components/ArmLocationSelector';
import {BUSINESS_TYPES} from "@/lib/api/data-types";

interface JoinArmModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function JoinArmModal({ isOpen, onClose }: JoinArmModalProps) {
    const { currentArm, currentSlug } = useSelector((state: RootState) => state.arm);
    const { data: businesses, isLoading: businessesLoading, refetch: refetchBusinesses } = useBusinesses();
    const { refetch: refetchArms } = useArms();
    const createBusinessMutation = useCreateBusiness();

    const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(false);
    const [showQuickRegister, setShowQuickRegister] = useState(false);

    // فرم ثبت سریع
    const [quickForm, setQuickForm] = useState({
        name: '',
        shortDescription: '',
        type: 'wholesaler',
        provinceCode: '',
        provinceLabel: '',
        cityCode: '',
        cityLabel: '',
        position: 'مالک و مسوول فروش',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const armConfig = currentArm?.config as any || {};
    const requireApproval = armConfig.accessRules?.requireAdminApprovalForMembership ?? false;
    const restrictByLocation = (armConfig.accessRules?.restrictMembershipByLocation ?? false) as boolean;
    const labels = armConfig?.formLabels || {};

    // ✅ وقتی مدال باز میشه، اولین کسبوکار رو انتخاب کن
    useEffect(() => {
        if (isOpen && businesses && businesses.length > 0) {
            setSelectedBusinessId(businesses[0].id);
            setShowQuickRegister(false);
        } else if (isOpen && businesses && businesses.length === 0) {
            setShowQuickRegister(true);
        }
    }, [isOpen, businesses]);

    if (!isOpen) return null;

    const validateQuickForm = () => {
        const newErrors: Record<string, string> = {};
        if (!quickForm.name.trim()) newErrors.name = 'نام کسب‌وکار الزامی است';
        if (!quickForm.provinceCode) newErrors.province = 'استان الزامی است';
        if (!quickForm.cityCode) newErrors.city = 'شهر الزامی است';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleJoinWithBusiness = async (businessId: string) => {
        if (!currentSlug) return;

        setIsJoining(true);
        try {
            const result = await apiService.arm.join(currentSlug, {
                businessId: businessId,
                roleType: 'seller',
            });

            if (result?.status === 'pending') {
                toast.success('درخواست پیوستن ثبت شد. در انتظار تأیید مدیر بازار...');
            } else {
                toast.success('با موفقیت به بازار پیوستید');
            }

            await refetchArms();
            await refetchBusinesses();
            onClose();
        } catch (error: any) {
            if (error?.data?.errorCode === 'ALREADY_MEMBER') {
                toast.info('شما قبلاً به این بازار پیوستید');
            } else {
                toast.error(error?.message || 'خطا در پیوستن به بازار');
            }
        } finally {
            setIsJoining(false);
        }
    };

    const handleQuickRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateQuickForm()) return;

        try {
            const newBusiness = await createBusinessMutation.mutateAsync({
                name: quickForm.name,
                shortDescription: quickForm.shortDescription || undefined,
                type: quickForm.type,
                province: quickForm.provinceLabel,
                city: quickForm.cityLabel,
                provinceCode: quickForm.provinceCode,
                cityCode: quickForm.cityCode,
                phone: '',
                description: '',
                position: quickForm.position,
                armSlug: currentSlug,
            });

            toast.success('کسب‌وکار ثبت شد');
            await refetchBusinesses();

            // ✅ بعد از ثبت، با همین کسب‌وکار join کن
            if (newBusiness?.id) {
                await handleJoinWithBusiness(newBusiness.id);
            }
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ثبت کسب‌وکار');
        }
    };

    const hasBusinesses = businesses && businesses.length > 0;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-h-[90vh] flex flex-col">
                {/* هدر */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {currentArm?.config?.general?.logoFile?.thumbnailPath ? (
                                <Image
                                    src={currentArm.config.general.logoFile.thumbnailPath}
                                    alt={currentArm.name}
                                    width={40}
                                    height={40}
                                    className="object-contain rounded-lg"
                                    unoptimized
                                />
                            ) : (
                                <Store className="w-5 h-5 text-primary" />
                            )}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                پیوستن به {currentArm?.name}
                            </h3>
                           {/* <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                {requireApproval ? 'پس از تأیید مدیر بازار، عضو خواهید شد' : 'بلافاصله عضو خواهید شد'}
                            </p>*/}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors flex-shrink-0"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* محتوا */}
                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    {businessesLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : showQuickRegister ? (
                        // فرم ثبت سریع
                        <form onSubmit={handleQuickRegister} className="space-y-4">
                            <div className="text-center mb-4">
                                <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                    ثبت کسب‌وکار
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    کسب‌وکار مرتبط با این بازار را ثبت و به بازار بپیوندید.
                                </p>
                            </div>

                            {/* نام کسب‌وکار */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block">
                                    نام کسب‌وکار <span className="text-primary">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={quickForm.name}
                                    onChange={(e) => {
                                        setQuickForm(prev => ({ ...prev, name: e.target.value }));
                                        setErrors(prev => ({ ...prev, name: '' }));
                                    }}
                                    placeholder={labels['business.name.placeholder'] || 'مثال: تولیدی بلوک آرمانی'}
                                    className={`w-full bg-white dark:bg-gray-800 border h-11 px-4 text-sm text-right rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.name ? 'border-error' : 'border-gray-200 dark:border-gray-700'}`}
                                />
                                {errors.name && <p className="text-error text-[11px] mt-1">{errors.name}</p>}
                            </div>

                            {/* توضیح کوتاه */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block">
                                    {labels['business.shortDescription.label'] || 'توضیح کوتاه'}
                                </label>
                                <input
                                    type="text"
                                    value={quickForm.shortDescription}
                                    onChange={(e) => setQuickForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                                    placeholder={labels['business.description.placeholder'] || 'مثال: تولید انواع بلوک'}
                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-11 px-4 text-sm text-right rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>

                            {/* نوع کسب‌وکار */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-gray-700 dark:text-gray-200 block">
                                    نوع کسب‌وکار
                                </label>
                                <select
                                    value={quickForm.type}
                                    onChange={(e) => setQuickForm(prev => ({ ...prev, type: e.target.value }))}
                                    className="w-full h-11 px-4 border border-gray-200 dark:border-gray-700 rounded-xl text-sm bg-white dark:bg-gray-800 text-right"
                                >
                                    {BUSINESS_TYPES.map(b=> <option value={b.value}>{b.label}</option>)}
                                </select>
                            </div>

                            {/* موقعیت مکانی */}
                            {!restrictByLocation ? (
                                <IranLocationSelector
                                    provinceCode={quickForm.provinceCode}
                                    cityCode={quickForm.cityCode}
                                    onProvinceChange={(code, label) => {
                                        setQuickForm(prev => ({ ...prev, provinceCode: code, provinceLabel: label }));
                                        setErrors(prev => ({ ...prev, province: '' }));
                                    }}
                                    onCityChange={(code, label) => {
                                        setQuickForm(prev => ({ ...prev, cityCode: code, cityLabel: label }));
                                        setErrors(prev => ({ ...prev, city: '' }));
                                    }}
                                    disabled={createBusinessMutation.isPending}
                                />
                            ) : (
                                <ArmLocationSelector
                                    provinceCode={quickForm.provinceCode}
                                    cityCode={quickForm.cityCode}
                                    onProvinceChange={(code, label) => {
                                        setQuickForm(prev => ({ ...prev, provinceCode: code, provinceLabel: label }));
                                        setErrors(prev => ({ ...prev, province: '' }));
                                    }}
                                    onCityChange={(code, label) => {
                                        setQuickForm(prev => ({ ...prev, cityCode: code, cityLabel: label }));
                                        setErrors(prev => ({ ...prev, city: '' }));
                                    }}
                                    error={errors.province || errors.city}
                                />
                            )}

                            {/* دکمه‌ها */}
                            <div className="flex gap-3 pt-2">
                                {hasBusinesses && (
                                    <button
                                        type="button"
                                        onClick={() => setShowQuickRegister(false)}
                                        className="flex-1 h-11 border border-gray-200 dark:border-gray-700 rounded-xl text-sm"
                                    >
                                        بازگشت
                                    </button>
                                )}
                                <button
                                    type="submit"
                                    disabled={createBusinessMutation.isPending}
                                    className="flex-1 h-11 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition-colors"
                                >
                                    {createBusinessMutation.isPending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        'ثبت و پیوستن'
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : hasBusinesses ? (
                        <>


                            <div className="mt-5 mb-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
                                <p className="text-[12px] font-semibold text-gray-800 dark:text-white">
                                  برای پیوستن به بازار کسب و کار  مرتبط را انتخاب یا ثبت کنید.
                                </p>
                            </div>

                            {/* لیست کسب‌وکارها */}
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                                {businesses.map((biz: any) => (
                                    <button
                                        key={biz.id}
                                        onClick={() => setSelectedBusinessId(biz.id)}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                            selectedBusinessId === biz.id
                                                ? 'border-primary bg-primary/5 dark:bg-primary/10'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                            {biz.logoUrl ? (
                                                <Image src={biz.logoUrl} alt={biz.name} width={40} height={40} className="object-cover" unoptimized />
                                            ) : (
                                                <Building2 className="w-5 h-5 text-gray-400" />
                                            )}
                                        </div>
                                        <div className="flex-1 text-right">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white">
                                                {biz.name}
                                            </p>
                                            <p className="text-[11px] text-gray-500">
                                                {biz.type === 'wholesaler' ? 'عمده‌فروش' :
                                                    biz.type === 'producer' ? 'تولیدکننده' :
                                                        biz.type === 'importer' ? 'واردکننده' :
                                                            biz.type === 'exporter' ? 'صادرکننده' :
                                                                biz.type === 'retailer' ? 'خرده‌فروش' : biz.type}
                                            </p>
                                        </div>
                                        {selectedBusinessId === biz.id && (
                                            <span className="text-primary text-lg">✓</span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* دکمه ثبت کسب‌وکار جدید */}
                            <button
                                onClick={() => setShowQuickRegister(true)}
                                className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-sm text-gray-500 hover:border-primary hover:text-primary transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                ثبت کسب‌وکار جدید
                            </button>

                            {/* دکمه پیوستن */}
                            <button
                                onClick={() => selectedBusinessId && handleJoinWithBusiness(selectedBusinessId)}
                                disabled={!selectedBusinessId || isJoining}
                                className="w-full h-11 bg-primary text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition-colors"
                            >
                                {isJoining ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    'پیوستن به بازار'
                                )}
                            </button>
                        </>
                    ) : null}
                </div>
            </div>
        </div>
    );
}