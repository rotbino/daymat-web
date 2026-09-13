// app/business/manage/components/BusinessLogo.tsx
'use client';

import Image from 'next/image';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/** مسیر نسبی فایل (/file/...) را به آدرس کامل API تبدیل می‌کند */
export const resolveFileSrc = (url?: string | null): string | null => {
    if (!url) return null;
    if (/^(https?:|blob:|data:)/.test(url)) return url;
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || '';
    return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

export function BusinessLogo({
    logoUrl,
    name,
    className,
    iconClass,
}: {
    logoUrl?: string | null;
    name?: string;
    /** اندازه و شعاع — مثلا 'w-16 h-16 rounded-2xl' */
    className?: string;
    iconClass?: string;
}) {
    const src = resolveFileSrc(logoUrl);
    return (
        <span
            className={cn(
                'bg-surface-container-high dark:bg-gray-800 overflow-hidden grid place-items-center flex-shrink-0 select-none',
                className,
            )}
        >
            {src ? (
                <Image
                    src={src}
                    alt={name || 'لوگو'}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    unoptimized
                />
            ) : (
                <Building2 className={cn('text-on-surface-variant/50', iconClass || 'w-[45%] h-[45%]')} />
            )}
        </span>
    );
}
