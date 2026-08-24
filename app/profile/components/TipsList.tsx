// app/profile/components/TipsList.tsx
'use client';
import React from 'react';
import { Sparkles, AlertTriangle, Package, TrendingUp } from 'lucide-react';

export default function TipsList() {
    const tips = [
        {
            icon: Sparkles,
            text: 'قیمت روز مهم است؛ در شرایط مشابه، آگهی‌هایی که جدیدتر به‌روزرسانی شده‌اند بالاتر نمایش داده می‌شوند.'
        },
        {
            icon: AlertTriangle,
            text: 'با پایان اعتبار قیمت، آگهی منقضی و از تابلو حذف می‌شود. با به‌روزرسانی قیمت، دوباره در تابلو نمایش داده خواهد شد.'
        },
        {
            icon: Package,
            text: 'برای هر کالا می‌توانید چند قیمت با حداقل خرید متفاوت ثبت کنید. با گزینه «کپی» می‌توانید سریع‌تر آگهی‌های مشابه بسازید.'
        },
        {
            icon: TrendingUp,
            text: 'تا ۵ آگهی فعال را همیشه رایگان روی تابلو داشته باشید. آگهی‌های منقضی یا غیرفعال، سهمیه رایگان شما را اشغال نمی‌کنند.'
        },
    ];

    return (
        <div className="space-y-3">
            {tips.map((tip, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-outline-variant/30 dark:border-gray-700 p-3 flex items-start gap-2.5 shadow-sm">
                    <tip.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-on-surface dark:text-gray-300 leading-relaxed">{tip.text}</p>
                </div>
            ))}
        </div>
    );
}