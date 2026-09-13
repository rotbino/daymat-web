// app/business/manage/components/TrustSealCard.tsx
// 🛡️ وضعیت تیک اعتماد کسب‌وکار + درخواست جدید + شماره مجوز
'use client';

import React, { useState } from 'react';
import { ShieldCheck, BadgeCheck, Clock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { apiService } from '@/lib/api/apiService';
import { EditableRow } from './EditableRow';
import { BusinessVerificationModal } from './BusinessVerificationModal';

const TIER_LABEL: Record<string, string> = { blue: 'آبی', silver: 'نقره‌ای', gold: 'طلایی' };

export function TrustSealCard({
    businessId,
    businessName,
    verificationStatus,
    verificationTier,
    businessLicense,
    autoOpenKey,
    onOpened,
    onSaveLicense,
}: {
    businessId: string;
    businessName: string;
    verificationStatus: string;
    verificationTier: string;
    businessLicense?: string | null;
    autoOpenKey?: string | null;
    onOpened?: () => void;
    onSaveLicense: (value: string | null) => Promise<void>;
}) {
    const [modalOpen, setModalOpen] = useState(false);
    const tierLabel = TIER_LABEL[verificationTier] || '';

    // آخرین درخواست — برای نمایش تاریخ هنگام «در حال بررسی»
    const { data: verifyStatus } = useQuery({
        queryKey: ['business-verify-status', businessId],
        queryFn: () => apiService.business.getVerificationStatus(businessId),
        enabled: verificationStatus === 'pending',
        staleTime: 30_000,
    });

    const submittedAt = verifyStatus?.latest?.submittedAt
        ? new Date(verifyStatus.latest.submittedAt).toLocaleDateString('fa-IR')
        : null;

    return (
        <div
            className={cn(
                'bg-white dark:bg-gray-900 rounded-2xl border p-4 sm:p-5 space-y-3',
                verificationStatus === 'approved'
                    ? 'border-emerald-300/60 dark:border-emerald-800/50'
                    : verificationStatus === 'pending'
                      ? 'border-amber-300/60 dark:border-amber-800/50'
                      : 'border-outline-variant/50 dark:border-gray-700',
            )}
        >
            {/* هدر کارت */}
            <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary/10 grid place-items-center flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-primary" />
                </span>
                <div className="flex-1">
                    <p className="text-[13px] font-extrabold text-on-surface">تیک اعتماد</p>
                    <p className="text-[10px] text-on-surface-variant/70">مُهر تأیید دیمت برای کسب‌وکار شما</p>
                </div>
            </div>

            {/* وضعیت */}
            {verificationStatus === 'approved' ? (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/50 p-3 flex items-start gap-2.5">
                    <BadgeCheck className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                            تیک {tierLabel} فعال است
                        </p>
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5 leading-4">
                            مدارک کسب‌وکار شما تأیید شده و کنار نامتان به مشتری‌ها نمایش داده می‌شود.
                        </p>
                    </div>
                </div>
            ) : verificationStatus === 'pending' ? (
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/60 dark:border-amber-800/50 p-3 flex items-start gap-2.5">
                    <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
                            درخواست شما در حال بررسی است
                        </p>
                        <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5 leading-4">
                            {submittedAt
                                ? `مدارک در تاریخ ${submittedAt} ارسال شده — به‌محض بررسی، تیک فعال می‌شود.`
                                : 'مدارک شما ارسال شده — به‌محض بررسی، تیک فعال می‌شود.'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-2.5">
                    <p className="text-[11px] text-on-surface-variant leading-5">
                        تیک اعتماد یعنی دیمت هویت و مجوزهای کسب‌وکار شما را تأیید کرده — خریدار با خیال راحت از شما
                        خرید می‌کند و اعتماد بیشتری می‌گیرد.
                    </p>
                    <button
                        type="button"
                        onClick={() => setModalOpen(true)}
                        className="w-full h-10 rounded-xl bg-primary text-on-primary text-xs font-extrabold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm shadow-primary/25"
                    >
                        <ShieldCheck className="w-4 h-4" />
                        درخواست تیک اعتماد
                    </button>
                </div>
            )}

            {/* شماره مجوز کسب‌وکار */}
            <div className="border-t border-outline-variant/20 dark:border-gray-700/60">
                <EditableRow
                    fieldKey="businessLicense"
                    label="شماره مجوز"
                    value={businessLicense}
                    placeholder="مثلاً شناسهٔ صنفی یا مجوز کسب"
                    autoOpenKey={autoOpenKey}
                    onOpened={onOpened}
                    onSave={onSaveLicense}
                />
            </div>

            <BusinessVerificationModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                businessId={businessId}
                businessName={businessName}
                currentTier={verificationTier}
            />
        </div>
    );
}

export function TrustSealSkeleton() {
    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4 space-y-3">
            <Loader2 className="w-5 h-5 animate-spin text-primary/40" />
        </div>
    );
}
