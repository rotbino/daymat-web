// app/[slug]/components/CatalogFooter.tsx
'use client';
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { Clock, MapPin, Store, User, Sparkles, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';

const WRAP = 'max-w-xl sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4';
const bizTypeMap: Record<string, string> = {
    producer: 'تولیدی', wholesaler: 'عمده‌فروش', importer: 'واردکننده', exporter: 'صادرکننده',
    distributor: 'توزیع‌کننده', retailer: 'خرده‌فروش', contractor: 'پیمانکار', service_provider: 'خدمات', other: 'سایر',
};

export default function CatalogFooter({ catalog }: { catalog: any; onGoHome?: () => void }) {
    const router = useRouter();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);

    // ✅ قیف ویروسی با انتساب رفرال صاحب کاتالوگ:
    //    لینک ساخت کاتالوگ همیشه کد دعوتِ مالکِ همین کاتالوگ را حمل می‌کند
    //    → هر کس از این کاتالوگ وارد شود، «دعوت‌شدهٔ» او ثبت می‌شود
    const refCode: string | undefined = catalog?.owner?.referralCode;
    const registerPath = refCode
        ? `/catalog/register?ref=${refCode}`
        : '/catalog/register';
    const createHref = isAuthenticated
        ? registerPath
        : `/login?redirect=${encodeURIComponent(registerPath)}&intent=catalog`;

    return (
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className={cn(WRAP, 'py-8 space-y-6')}>
                {/* اطلاعات کسب‌وکار */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[11px] mb-1.5">تماس</h3>
                        {catalog.phone && <a href={`tel:${catalog.phone}`} className="block text-gray-500" dir="ltr">{catalog.phone}</a>}
                        {catalog.owner?.fullName && <p className="flex items-center gap-1.5 text-gray-500 mt-1"><User className="w-3 h-3" />{catalog.owner.fullName}</p>}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[11px] mb-1.5">موقعیت</h3>
                        {catalog.city && <p className="flex items-center gap-1.5 text-gray-500"><MapPin className="w-3 h-3" />{catalog.city}</p>}
                        {catalog.address && <p className="text-gray-500 mt-1">{catalog.address}</p>}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[11px] mb-1.5">اطلاعات</h3>
                        {catalog.type && <p className="flex items-center gap-1.5 text-gray-500"><Store className="w-3 h-3" />{bizTypeMap[catalog.type]}</p>}
                        {catalog.createdAt && <p className="flex items-center gap-1.5 text-gray-500 mt-1"><Clock className="w-3 h-3" />عضویت از {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(new Date(catalog.createdAt))}</p>}
                    </div>
                </div>

                {/* برندینگ دیمت */}
                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2">
                    <button onClick={() => router.push(createHref)}>
                        <div className="relative h-14 w-56"><Image src="/images/logo2.png" alt="دیمت" fill className="object-contain" unoptimized /></div>
                        <p className="text-[13px] font-bold text-gray-500 dark:text-gray-400">دیمت، ساخت کاتالوگ قیمت</p>
                    </button>
                </div>

                {/* ✅ دکمهٔ ویروسی شناور — با کد دعوت صاحب کاتالوگ */}
                <div className="bottom-0 left-0 right-0 z-50 py-2">
                    <div className={cn(WRAP, 'flex justify-center')}>
                        <button
                            onClick={() => router.push(createHref)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full
                            bg-white/90 dark:bg-gray-900/90 backdrop-blur
                            border border-gray-200/70 dark:border-white/10
                            hover:bg-primary/5 hover:border-primary/20
                            transition-all active:scale-95 group shadow-sm
                            text-xs font-medium text-gray-600 dark:text-gray-300"
                        >
                            <Sparkles className="w-3.5 h-3.5 text-primary/60 group-hover:text-primary transition-colors" />
                            <span className="hidden sm:inline text-gray-500 dark:text-gray-400">ساخته شده با</span>
                            <span className="font-extrabold text-primary/80 group-hover:text-primary transition-colors">دیمت</span>
                            <span className="hidden sm:inline text-gray-400">·</span>
                            <span className="hidden sm:inline text-gray-500 group-hover:text-primary/80 transition-colors">تو هم کاتالوگ خودت را بساز</span>
                        </button>
                    </div>
                </div>
            </div>
        </footer>
    );
}