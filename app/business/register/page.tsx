'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { Send, Info, AlertCircle } from 'lucide-react';
import { FormHeader } from '@/app/components/FormHeader';
import { useCreateBusiness } from '@/lib/api/apiHooks';
import { ArmLocationSelector } from '@/app/components/ArmLocationSelector';
import { RootState } from '@/lib/store/store';
import {IranLocationSelector} from "@/app/components/IranLocationSelector";

export default function RegisterBusinessPage() {
    const router = useRouter();
    const { currentArm, currentSlug } = useSelector((state: RootState) => state.arm);
    const armConfig = currentArm?.config as any || {};
    const labels = currentArm?.config?.formLabels || {};

    const [formData, setFormData] = useState({
        name: '',
        shortDescription: '',
        type: 'wholesaler',
        provinceCode: '',
        provinceLabel: '',
        cityCode: '',
        cityLabel: '',
        position: 'مالک و مسوول فروش',
        industryName: '',  // ✅ فیلد متن آزاد
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const createBusinessMutation = useCreateBusiness();
    const restrictByLocation = (armConfig.accessRules?.restrictMembershipByLocation ?? false) as boolean;

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = 'نام کسب‌وکار الزامی است';
        if (!formData.provinceCode) newErrors.province = 'استان الزامی است';
        if (!formData.cityCode) newErrors.city = 'شهر الزامی است';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            await createBusinessMutation.mutateAsync({
                name: formData.name,
                shortDescription: formData.shortDescription || undefined,
                type: formData.type,
                province: formData.provinceLabel,
                city: formData.cityLabel,
                provinceCode: formData.provinceCode,
                cityCode: formData.cityCode,
                phone: '',
                description: '',
                position: formData.position,
                industryName: formData.industryName.trim() || undefined, // ✅
                armSlug: currentSlug,
            });
            router.push('/profile');
        } catch (error: any) {
            toast.error(error?.message || 'خطا در ثبت کسب‌وکار');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-surface dark:bg-gray-950">
            <FormHeader title="ثبت کسب و کار جدید" subtitle="اطلاعات خود را وارد کنید" backUrl="/profile" />
            <main className="flex-1 w-full max-w-lg mx-auto px-4 pt-20 pb-28">
                <div className="lg:bg-white lg:dark:bg-gray-900 lg:rounded-2xl lg:border lg:border-outline-variant/20 lg:dark:border-gray-800 lg:shadow-sm lg:p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* نام کسب‌وکار */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-on-surface dark:text-gray-200 block">
                                نام کسب‌وکار <span className="text-primary">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder={labels['business.name.placeholder'] || 'مثال: تولیدی بلوک آرمانی'}
                                className={`w-full bg-white dark:bg-gray-800 border h-11 px-4 text-sm text-right rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all ${errors.name ? 'border-error' : 'border-outline-variant/30 dark:border-gray-700'}`}
                            />
                            {errors.name && <p className="text-error text-[11px] mt-1">{errors.name}</p>}
                        </div>

                        {/* توضیح کوتاه */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-on-surface dark:text-gray-200 block">
                                {labels['business.shortDescription.label'] || 'توضیح کوتاه'}
                            </label>
                            <input
                                type="text"
                                value={formData.shortDescription}
                                onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                                placeholder="تولید کننده انواع آجر فشاری"
                                className="w-full bg-white dark:bg-gray-800 border border-outline-variant/30 dark:border-gray-700 h-11 px-4 text-sm text-right rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>

                        {/* ✅ صنف / زمینه فعالیت (متن آزاد) */}
                       {/* <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-on-surface dark:text-gray-200 block">
                                صنف / زمینه فعالیت
                            </label>
                            <input
                                type="text"
                                value={formData.industryName}
                                onChange={(e) => setFormData(prev => ({ ...prev, industryName: e.target.value }))}
                                placeholder="مثلاً سوپرمارکت، تولیدکننده مصالح، پیمانکار ساختمانی"
                                className="w-full bg-white dark:bg-gray-800 border border-outline-variant/30 dark:border-gray-700 h-11 px-4 text-sm text-right rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>*/}

                        {/* موقعیت مکانی */}
                        {!restrictByLocation ? (
                            <IranLocationSelector
                                provinceCode={formData.provinceCode}
                                cityCode={formData.cityCode}
                                onProvinceChange={(code, label) => {
                                    setFormData(prev => ({ ...prev, provinceCode: code, provinceLabel: label }));
                                    setErrors(prev => ({ ...prev, province: '' }));
                                }}
                                onCityChange={(code, label) => {
                                    setFormData(prev => ({ ...prev, cityCode: code, cityLabel: label }));
                                    setErrors(prev => ({ ...prev, city: '' }));
                                }}
                                disabled={createBusinessMutation.isPending}
                            />
                        ) : (
                            <ArmLocationSelector
                                provinceCode={formData.provinceCode}
                                cityCode={formData.cityCode}
                                onProvinceChange={(code, label) => { setFormData(prev => ({ ...prev, provinceCode: code, provinceLabel: label })); setErrors(prev => ({ ...prev, province: '' })); }}
                                onCityChange={(code, label) => { setFormData(prev => ({ ...prev, cityCode: code, cityLabel: label })); setErrors(prev => ({ ...prev, city: '' })); }}
                                error={errors.province || errors.city}
                            />
                        )}

                        {/* دکمه ثبت */}
                        <button type="submit" disabled={createBusinessMutation.isPending} className="w-full bg-primary text-on-primary h-11 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
                            {createBusinessMutation.isPending ? (
                                <div className="w-5 h-5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
                            ) : (
                                <>ثبت کسب‌وکار<Send className="w-4 h-4" /></>
                            )}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}