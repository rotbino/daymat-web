// app/profile/components/CatalogCompletionCard.tsx
'use client';
import React from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CompletionChecklist {
    hasName: boolean;
    hasIndustry: boolean;
    hasSlug: boolean;
    hasLogo: boolean;
    hasDescription: boolean;
    hasPhone: boolean;
    hasProducts: boolean;
}

const ITEMS: { key: keyof CompletionChecklist; label: string }[] = [
    { key: 'hasName', label: 'نام کاتالوگ' },
    { key: 'hasIndustry', label: 'صنف / زمینه فعالیت' },
    { key: 'hasSlug', label: 'آدرس اختصاصی کاتالوگ' },
    { key: 'hasLogo', label: 'لوگو' },
    { key: 'hasDescription', label: 'توضیح کوتاه' },
    { key: 'hasPhone', label: 'شماره تماس' },
    { key: 'hasProducts', label: 'حداقل یک کالا با قیمت' },
];

export default function CatalogCompletionCard({ catalog, checklist }: {
    catalog: any;
    checklist: CompletionChecklist;
    productId?: string;
}) {
    const done = ITEMS.filter((i) => checklist[i.key]).length;
    const percent = Math.round((done / ITEMS.length) * 100);
    if (percent === 100) return null;

    return (
        <div className="rounded-2xl border border-primary/25 bg-gradient-to-l from-primary/8 to-primary/3 p-4">
            <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-extrabold text-on-surface">کاتالوگت را کامل کن</p>
                <span className="text-[11px] font-bold text-primary">{percent.toLocaleString('fa-IR')}٪</span>
            </div>
            <div className="h-1.5 rounded-full bg-outline-variant/30 overflow-hidden mb-3">
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${percent}%` }} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {ITEMS.map((item) => {
                    const ok = checklist[item.key];
                    const href = item.key === 'hasProducts' ? '#products' : `/catalog/edit/${catalog.id}`;
                    return ok ? (
                        <span key={item.key} className="flex items-center gap-1.5 text-[11px] text-on-surface-variant/60">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" /> {item.label}
                        </span>
                    ) : (
                        <Link key={item.key} href={href}
                              className="flex items-center gap-1.5 text-[11px] font-medium text-on-surface group hover:text-primary transition-colors">
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-primary/50 flex-shrink-0" />
                            {item.label}
                            <ChevronLeft className="w-3 h-3 text-on-surface-variant/40 group-hover:text-primary" />
                        </Link>
                    );
                })}
            </div>
            <p className="mt-3 pt-2.5 border-t border-primary/10 text-[10px] text-on-surface-variant/70 leading-5">
                کاتالوگ کامل = اعتماد بیشتر مشتری و تماس بیشتر.
            </p>
        </div>
    );
}