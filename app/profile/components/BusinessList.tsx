// app/profile/components/BusinessList.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, BadgeCheck, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getApiUrl } from '@/lib/api/apiRequest';
import { apiService } from '@/lib/api/apiService';

interface BusinessItem {
    id: string;
    name: string;
    logoUrl?: string;
    verificationTier?: string;
    verificationStatus?: string;
}

interface BusinessListProps {
    selectedId: string | null;
    onSelect: (id: string) => void;
    refreshTrigger?: number;
}

export default function BusinessList({ selectedId, onSelect, refreshTrigger = 0 }: BusinessListProps) {
    const router = useRouter();
    const [businesses, setBusinesses] = useState<BusinessItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBusinesses = async () => {
        setLoading(true);
        try {
            const data = await apiService.business.getAll();
            setBusinesses(data);
        } catch (e) {
            console.error('Error fetching businesses:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBusinesses();
    }, [refreshTrigger]);

    // انتخاب خودکار اولین کسب‌وکار در صورت وجود فقط یک مورد
    useEffect(() => {
        if (businesses.length === 1 && selectedId !== businesses[0].id) {
            onSelect(businesses[0].id);
        }
    }, [businesses, selectedId, onSelect]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-xs text-on-surface-variant py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                در حال بارگذاری...
            </div>
        );
    }

 /*   // اگر ۰ یا ۱ کسب‌وکار وجود داشته باشد، نوار را نمایش نده
    if (businesses.length <= 1) {
        return null;
    }*/

    // بیش از یک کسب‌وکار → نمایش نوار
    return (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide bg-white dark:bg-gray-900 rounded-xl border border-outline-variant/20 dark:border-gray-800 p-2 shadow-sm">
            {businesses.map((biz) => {
                const isSelected = biz.id === selectedId;
                const tierColor =
                    biz.verificationTier === 'gold' ? 'text-yellow-500' :
                        biz.verificationTier === 'silver' ? 'text-blue-500' : 'text-gray-400';
                const logoUrl = biz.logoUrl ? getApiUrl(`/file/${biz.logoUrl}`) : null;

                return (
                    <button
                        key={biz.id}
                        onClick={() => onSelect(biz.id)}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap border",
                            isSelected
                                ? "bg-primary text-white border-primary shadow-md"   // ✅ پس‌زمینه کامل پررنگ
                                : "bg-transparent text-on-surface-variant border-outline-variant hover:border-primary/40 hover:bg-surface-container-low" // ✅ بدون رنگ ثابت، فقط hover
                        )}
                    >
                        <div className="w-6 h-6 rounded-md bg-surface-container-high dark:bg-gray-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {logoUrl ? (
                                <img src={logoUrl} alt={biz.name} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="w-3.5 h-3.5 text-on-surface-variant" />
                            )}
                        </div>
                        <span className="truncate max-w-[120px]">{biz.name}</span>
                        {biz.verificationTier && biz.verificationTier !== 'none' && (
                            <BadgeCheck className={cn("w-3.5 h-3.5 flex-shrink-0", tierColor)} />
                        )}
                    </button>
                );
            })}

            <button
                onClick={() => router.push('/business/register')}
                className="flex items-center justify-center w-9 h-9 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors flex-shrink-0"
                title="ثبت کسب‌وکار جدید"
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>
    );
}