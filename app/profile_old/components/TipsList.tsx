// app/profile/components/TipsList.tsx
'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { useSelector } from 'react-redux';
import {
    Sparkles, AlertTriangle, Package, TrendingUp,
    ArrowLeft, Home, Layers, CreditCard, LayoutGrid,
} from 'lucide-react';
import { RootState } from '@/lib/store/store';

export default function TipsList() {
    const { currentArm, currentSlug } = useSelector((state: RootState) => state.arm);

    const armConfig = currentArm?.config as any || {};
    const priceTable = armConfig.modules?.priceTable || {};

    // ✅ خواندن از تنظیمات با مقدار پیش‌فرض
    const maxActiveAdsPerUser = priceTable.maxActiveAdsPerUser ?? 5;
    const maxTotalFreeAdPerUser = priceTable.maxTotalFreeAdPerUser ?? 20;
    const bumpCost = priceTable.bumpCost ?? 10;
    const adValidityDefaultHours = priceTable.adValidityDefaultHours ?? 24;
    const adCreationCost = priceTable.adCreationCost ?? 10;
    const extraActiveAdCost = priceTable.extraActiveAdCost ?? 2;
    const extraActiveAdCostPerDay = priceTable.extraActiveAdCost ?? 2; // ✅ این خط را اضافه کن

    const tips = useMemo(() => [
        {
            icon: Sparkles,
            text: 'قیمت روز مهم است؛ در شرایط مشابه، آگهی‌هایی که جدیدتر به‌روزرسانی شده‌اند بالاتر نمایش داده می شوند. یعنی کاربری بیشتر دیده میشود که حداقل هر روز یک بار یا بیشتر قیمت ها یا آگهی خود را به روز کند.'
        },
        {
            icon: AlertTriangle,
            text: `با پایان اعتبار قیمت (${adValidityDefaultHours.toLocaleString('fa-IR')} ساعت)، آگهی منقضی و از تابلو حذف می‌شود. با به‌روزرسانی قیمت، دوباره در تابلو نمایش داده خواهد شد.`
        },
        {
            icon: Package,
            text: 'برای هر کالا می‌توانید چند قیمت با حداقل خرید متفاوت ثبت کنید. با گزینه «کپی» می‌توانید سریع‌تر آگهی‌های مشابه بسازید.'
        },
        // ✅ باکس سهمیه‌ها
        {
            icon: Layers,
            text: `سهمیه آگهی رایگان هر کاربر:\n• در مجموع می‌توانید تا ${maxTotalFreeAdPerUser.toLocaleString('fa-IR')} آگهی رایگان ثبت کنید (شامل آگهی‌های روی تابلو یا آرشیو).\n• از این تعداد، تا ${maxActiveAdsPerUser.toLocaleString('fa-IR')} آگهی می‌توانند همزمان روی تابلو باشند.`
        },
// ✅ باکس هزینه‌ها
        {
            icon: CreditCard,
            text: `هزینه‌های خارج از سهمیه:\n• ثبت بیش از ${maxTotalFreeAdPerUser.toLocaleString('fa-IR')} آگهی: هر آگهی اضافه ${adCreationCost.toLocaleString('fa-IR')} اعتبار در ماه\n• داشتن بیش از ${maxActiveAdsPerUser.toLocaleString('fa-IR')} آگهی همزمان روی تابلو: هر آگهی اضافه ${extraActiveAdCostPerDay.toLocaleString('fa-IR')} اعتبار در روز\n• نردبان (نمایش بالاتر): هر ۲۴ ساعت ${bumpCost.toLocaleString('fa-IR')} اعتبار`
        },
    ], [maxActiveAdsPerUser, maxTotalFreeAdPerUser, bumpCost, adValidityDefaultHours, adCreationCost, extraActiveAdCost]);

    return (
        <div className="space-y-3">
            {/* ✅ باکس بازگشت به صفحه اصلی */}
            <Link
                href={currentSlug ? `/arm/${currentSlug}` : '/'}
                className="bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between gap-3 shadow-sm hover:bg-primary/15 transition-all group"
            >
                <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <Home className="w-4 h-4 text-primary" />
                    </span>
                    <div>
                        <span className="text-xs font-bold text-primary block">
                            بازگشت به صفحه اصلی
                        </span>
                        <span className="text-[10px] text-on-surface-variant/70">
                            مشاهده تابلوی قیمت {currentArm?.name || 'بازار'}
                        </span>
                    </div>
                </div>
                <ArrowLeft className="w-4 h-4 text-primary group-hover:-translate-x-1 transition-transform" />
            </Link>

            {/* تیپ‌ها */}
            {tips.map((tip, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-outline-variant/30 dark:border-gray-700 p-3 flex items-start gap-2.5 shadow-sm">
                    <tip.icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-on-surface dark:text-gray-300 leading-relaxed whitespace-pre-line">{tip.text}</p>
                </div>
            ))}
        </div>
    );
}