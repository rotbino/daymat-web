// app/components/IndustryAutocomplete.tsx
'use client';

import React from 'react';
import EntityPicker, { EntityValue } from './EntityPicker';
import { apiService } from '@/lib/api/apiService';
import { Building2 } from 'lucide-react';

interface Props {
    value: EntityValue | null;
    onChange: (value: EntityValue | null) => void;
    placeholder?: string;
    className?: string;
    label?: string;
    required?: boolean;
    error?: string;
    allowCreate?: boolean;
}

export default function IndustryAutocomplete({
    value,
    onChange,
    placeholder = 'صنف خود را انتخاب کنید...',
    className,
    label,
    required,
    error,
    allowCreate = true,
}: Props) {
    return (
        <EntityPicker
            value={value}
            onChange={onChange}
            label={label}
            placeholder={placeholder}
            required={required}
            error={error}
            icon={<Building2 className="w-3.5 h-3.5 text-on-surface-variant" />}
            fetchFn={async (params) => {
                const res: any = await apiService.industry.search(params.q, params.limit, (params.page - 1) * params.limit);
                return {
                    items: res?.items || res?.data || [],
                    hasMore: (res?.items?.length || 0) >= params.limit,
                };
            }}
            createFn={allowCreate
                ? (title) => apiService.industry.createByUser(title)
                : async () => { throw new Error('ایجاد مجاز نیست'); }
            }
            queryKey="industries-picker"
            createLabel="ایجاد صنف جدید"
            minSearchChars={2}
            pageSize={10}
        />
    );
}
