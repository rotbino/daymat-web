// app/ad/form/StepTerms.tsx
// ✅ مرحله ۳: شرایط فروش — محل کالا + نکات فروش

'use client';

import React from 'react';
import { MapPin, Package } from 'lucide-react';
import { IranLocationSelector } from '@/app/components/IranLocationSelector';
import { useAdForm } from './AdFormStore';
import { SectionTitle } from './ui-bits';

export function StepTerms() {
    const { formData, patchForm } = useAdForm();

    return (
        <div className="space-y-4 animate-in fade-in duration-200">
            <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4 space-y-2.5">
                <SectionTitle icon={MapPin} text="محل کالا" />
                <IranLocationSelector
                    provinceCode={formData.provinceCode}
                    cityCode={formData.cityCode}
                    onProvinceChange={(code, label) => patchForm({ provinceCode: code, provinceLabel: label, cityCode: '', cityLabel: '' })}
                    onCityChange={(code, label) => patchForm({ cityCode: code, cityLabel: label })}
                />
            </section>
            <section className="rounded-2xl bg-surface-container-low/60 border border-outline-variant/30 p-4">
                <SectionTitle icon={Package} text="نکات فروش (اختیاری)" />
                <textarea value={formData.description}
                          onChange={(e) => patchForm({ description: e.target.value })}
                          rows={3} placeholder="مثلا: اصل هست، چک میدیم، حمل رایگان، تخفیف نقدی..."
                          className="w-full min-h-[72px] py-2.5 px-3.5 text-sm text-right rounded-xl bg-surface-container-lowest
                              border border-outline-variant/40 dark:border-gray-700 focus:ring-2 focus:ring-primary/25
                              focus:border-primary outline-none transition-all resize-none" />
            </section>
        </div>
    );
}
