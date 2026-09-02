// app/c/[slug]/components/CatalogFooter.tsx
'use client';

import React from 'react';
import Image from 'next/image';
import { Clock, MapPin, Phone, Store, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const WRAP = 'max-w-xl sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4';

const bizTypeMap: Record<string, string> = {
    producer: 'تولیدی', wholesaler: 'عمده‌فروش', importer: 'واردکننده',
    exporter: 'صادرکننده', distributor: 'توزیع‌کننده', retailer: 'خرده‌فروش',
    contractor: 'پیمانکار', service_provider: 'خدمات', other: 'سایر',
};

interface CatalogFooterProps {
    business: any;
    onGoHome: () => void;
}

export default function CatalogFooter({ business, onGoHome }: CatalogFooterProps) {
    return (
        <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className={cn(WRAP, 'py-8')}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[11px] mb-1.5">تماس</h3>
                        {business.phone && <a href={`tel:${business.phone}`} className="block text-gray-500" dir="ltr">{business.phone}</a>}
                        {business.owner?.phone && business.owner?.phone !== business.phone && <a href={`tel:${business.owner.phone}`} className="block text-gray-500 mt-1" dir="ltr">{business.owner.phone}</a>}
                        {business.owner?.fullName && <p className="flex items-center gap-1.5 text-gray-500 mt-1"><User className="w-3 h-3" />{business.owner.fullName}</p>}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[11px] mb-1.5">موقعیت</h3>
                        {business.city && <p className="flex items-center gap-1.5 text-gray-500"><MapPin className="w-3 h-3" />{business.city}</p>}
                        {business.address && <p className="text-gray-500 mt-1">{business.address}</p>}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-200 text-[11px] mb-1.5">اطلاعات</h3>
                        {business.type && <p className="flex items-center gap-1.5 text-gray-500"><Store className="w-3 h-3" />{bizTypeMap[business.type]}</p>}
                        {business.createdAt && <p className="flex items-center gap-1.5 text-gray-500 mt-1"><Clock className="w-3 h-3" />عضویت از {new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long' }).format(new Date(business.createdAt))}</p>}
                    </div>
                </div>

                <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                    <button onClick={onGoHome}
                            className="inline-flex items-center gap-2 px-6 h-11 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-sm shadow-lg active:scale-[0.97] transition-all">
                        <Store className="w-4 h-4" />
                        ساخت کاتالوگ رایگان با دیمت
                    </button>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2">
                    <div className="relative h-16 w-64 sm:h-20 sm:w-80">
                        <Image src="/images/logo2.png" alt="دیمت" fill className="object-contain" unoptimized />
                    </div>
                    <p className="text-[20px] font-bold text-gray-500 dark:text-gray-400">دیمت، کاتالوگ روزانه قیمت</p>
                    <p className="text-[10px] text-gray-400">© {new Date().toLocaleDateString('fa-IR', { year: 'numeric' })}</p>
                </div>
            </div>
        </footer>
    );
}