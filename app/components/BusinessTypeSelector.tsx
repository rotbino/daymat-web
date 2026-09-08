// app/components/BusinessTypeSelector.tsx
'use client';

import React, { useMemo } from 'react';
import { DropSelector } from '@/components/common/DropSelector';
import { BUSINESS_TYPE } from '@/lib/api/data-types';
import { Building2, Layers, ChevronDown } from 'lucide-react';

interface Props {
    /** sector (سطح اول) */
    sector: string;
    /** role (سطح دوم) */
    role: string;
    onSectorChange: (sector: string) => void;
    onRoleChange: (role: string) => void;
    label?: string;
    required?: boolean;
}

/**
 * BusinessTypeSelector — انتخاب نوع کسب‌وکار دو سطحی
 *
 * ┌─────────────────┬─────────────────┐
 * │ دسته‌بندی ▼     │ نوع فعالیت ▼   │
 * │ تولید و صنعت    │ تولیدکننده...   │
 * └─────────────────┴─────────────────┘
 *
 * - sector: سطح اول (manufacturing, trade, distribution, retail, service)
 * - role: سطح دوم (raw_material, wholesaler, store, ...)
 *
 * وقتی sector عوض شه، role پاک می‌شه.
 */
export default function BusinessTypeSelector({
    sector,
    role,
    onSectorChange,
    onRoleChange,
    label = 'نوع کسب‌وکار',
    required = false,
}: Props) {
    const sectorOptions = useMemo(() =>
        BUSINESS_TYPE.map((s: any) => ({
            value: s.id,
            label: s.label,
        })),
    []);

    const roleOptions = useMemo(() => {
        const sectorData = BUSINESS_TYPE.find((s: any) => s.id === sector) as any;
        if (!sectorData?.children) return [];
        return sectorData.children.map((c: any) => ({
            value: c.id,
            label: c.label,
        }));
    }, [sector]);

    const handleSectorChange = (value: string) => {
        onSectorChange(value);
        onRoleChange('');  // ✅ role پاک می‌شه
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-xs font-bold text-on-surface block flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-on-surface-variant" />
                    {label}
                    {required && <span className="text-primary">*</span>}
                </label>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                    <label className="text-[10px] font-bold text-on-surface-variant block mb-1">
                        دسته‌بندی
                    </label>
                    <DropSelector
                        value={sector}
                        options={sectorOptions}
                        placeholder="انتخاب دسته..."
                        onChange={(val) => handleSectorChange(val)}
                    />
                </div>
                <div>
                    <label className="text-[10px] font-bold text-on-surface-variant block mb-1">
                        نوع فعالیت
                    </label>
                    <DropSelector
                        value={role}
                        options={roleOptions}
                        placeholder={sector ? 'انتخاب نوع فعالیت...' : 'ابتدا دسته را انتخاب کنید'}
                        disabled={!sector}
                        onChange={(val) => onRoleChange(val)}
                    />
                </div>
            </div>
        </div>
    );
}
