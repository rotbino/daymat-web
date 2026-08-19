// app/arm-admin/members/[userId]/components/BusinessCard.tsx
'use client';

import React, { useState } from 'react';
import {
    Building2, MapPin, TrendingUp, BadgeCheck, ChevronDown, Store,
    Phone, Globe, FileText, CheckCircle, XCircle, Clock, Shield,
    Award, Loader2, X, Tag, MapPinned, User, Briefcase, Info,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api/apiRequest';


interface Business {
    id: string;
    name: string;
    type: string;
    verificationTier: string;
    verificationStatus: string;
    city: string;
    province: string;
    trustScore: number;
    description?: string;
    phone?: string;
    website?: string;
    address?: string;
    nationalId?: string;
    businessLicense?: string;
    industryName?: string;
    logoUrl?: string;
    logoFileId?: string;
    shortDescription?: string;
    activities?: { id: string; title: string }[];
    position?: string;
}

interface BusinessCardProps {
    businesses: Business[];
}

export function BusinessCard({ businesses }: BusinessCardProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const business = businesses[selectedIndex];

    const getVerificationBadge = (tier: string) => {
        if (tier === 'none' || !tier) return null;
        const colors = {
            blue: 'text-blue-600 bg-blue-50',
            silver: 'text-gray-600 bg-gray-50',
            gold: 'text-yellow-600 bg-yellow-50',
        };
        return (
            <span className={cn(
                "inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full",
                colors[tier as keyof typeof colors] || colors.blue
            )}>
                <BadgeCheck className="w-3 h-3" />
                {tier === 'gold' ? 'طلایی' : tier === 'silver' ? 'نقره‌ای' : 'آبی'}
            </span>
        );
    };

    const getVerificationStatusBadge = (status: string) => {
        if (status === 'none') return null;
        const config = {
            pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
            approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            rejected: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
        };
        const item = config[status as keyof typeof config];
        if (!item) return null;
        const Icon = item.icon;
        return (
            <span className={cn("inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full", item.color, item.bg)}>
                <Icon className="w-3 h-3" />
                {status === 'pending' ? 'در انتظار' : status === 'approved' ? 'تأیید شده' : 'رد شده'}
            </span>
        );
    };

    const handleSelect = (index: number) => {
        setSelectedIndex(index);
    };

    // ─── فیلد با متن پیش‌فرض ───
    const FieldItem = ({ label, value, icon: Icon, dir }: {
        label: string;
        value?: string | null;
        icon: any;
        dir?: string;
    }) => (
        <div className="bg-surface rounded-xl p-3 flex items-start gap-2">
            <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <div className="min-w-0">
                <p className="text-xs text-on-surface-variant">{label}</p>
                <p className="text-sm font-medium text-on-surface" dir={dir}>
                    {value || 'وارد نشده'}
                </p>
            </div>
        </div>
    );

    return (
        <div className="bg-surface-container-low border border-outline-variant rounded-xl p-4 sm:p-6 space-y-6">
            {/* انتخاب کسب‌وکار در صورت وجود چند مورد */}
            {businesses.length > 1 && (
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-outline-variant/30">
                    <Store className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-on-surface">کسب‌وکار:</span>
                    <div className="relative flex-1">
                        <select
                            value={selectedIndex}
                            onChange={(e) => handleSelect(Number(e.target.value))}
                            className="w-full appearance-none bg-surface-container-lowest border border-outline rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                        >
                            {businesses.map((b, idx) => (
                                <option key={b.id} value={idx}>{b.name}</option>
                            ))}
                        </select>
                        <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                    </div>
                </div>
            )}

            {/* اطلاعات هدر کسب‌وکار */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {business.logoUrl? (
                    <img
                        src={getApiUrl(`/file/${business.logoUrl}`)}
                        alt={business.name}
                        className="w-20 h-20 rounded-xl object-cover border border-outline-variant"
                    />
                ) : (
                    <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Building2 className="w-10 h-10 text-primary/60" />
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold text-on-surface">{business.name}</h3>
                        {getVerificationBadge(business.verificationTier)}
                        {getVerificationStatusBadge(business.verificationStatus)}
                    </div>
                    <p className="text-sm text-on-surface-variant mt-1">{business.type || 'نوع وارد نشده'}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-on-surface-variant">
                        {business.city && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {business.city}، {business.province}
                            </span>
                        )}
                        {business.phone && (
                            <span className="flex items-center gap-1" dir="ltr">
                                <Phone className="w-4 h-4" />
                                {business.phone}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            امتیاز: {business.trustScore}
                        </span>
                    </div>
                </div>
            </div>

            {/* اطلاعات تکمیلی */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FieldItem
                    label="صنف / زمینه فعالیت"
                    value={business.industryName}
                    icon={Briefcase}
                />
                <FieldItem
                    label="سمت کاربر"
                    value={business.position}
                    icon={User}
                />
                <div className="bg-surface rounded-xl p-3 flex items-start gap-2 sm:col-span-2">
                    <MapPinned className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                        <p className="text-xs text-on-surface-variant">آدرس</p>
                        <p className="text-sm font-medium text-on-surface">
                            {business.address || 'وارد نشده'}
                        </p>
                    </div>
                </div>
                <FieldItem
                    label="وب‌سایت"
                    value={business.website}
                    icon={Globe}
                    dir="ltr"
                />
                <div className="bg-surface rounded-xl p-3 flex items-start gap-2 sm:col-span-2">
                    <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                        <p className="text-xs text-on-surface-variant">معرفی کوتاه</p>
                        <p className="text-sm font-medium text-on-surface">
                            {business.shortDescription || 'وارد نشده'}
                        </p>
                    </div>
                </div>

                {/* فعالیت‌ها */}
                <div className="bg-surface rounded-xl p-3 flex items-start gap-2 sm:col-span-2">
                    <Tag className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                        <p className="text-xs text-on-surface-variant">فعالیت‌ها</p>
                        {business.activities && business.activities.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {business.activities.map((activity) => (
                                    <span key={activity.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/5 text-primary text-[10px] rounded-full border border-primary/10">
                                        {activity.title}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm font-medium text-on-surface mt-1 text-on-surface-variant/70">
                                تعیین نشده
                            </p>
                        )}
                    </div>
                </div>

                {/* توضیحات کامل */}
                <div className="bg-surface rounded-xl p-3 flex items-start gap-2 sm:col-span-2">
                    <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div>
                        <p className="text-xs text-on-surface-variant">توضیحات کامل</p>
                        <p className="text-sm text-on-surface leading-relaxed mt-1">
                            {business.description || 'وارد نشده'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}