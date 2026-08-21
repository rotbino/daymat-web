// app/ad/[id]/components/AdGallery.tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Package } from 'lucide-react';

interface AdGalleryProps {
    images: any[];
    title: string;
}

export default function AdGallery({ images, title }: AdGalleryProps) {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const hasImages = images && images.length > 0;

    if (!hasImages) {
        return (
            <div className="aspect-[16/10] bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-300 dark:text-gray-600" />
            </div>
        );
    }

    // ✅ فقط تصاویر با path معتبر
    const validImages = images.filter((f: any) =>
        f.path?.startsWith('https://') || f.fullUrl?.startsWith('https://')
    );

    if (validImages.length === 0) {
        return (
            <div className="aspect-[16/10] bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                <Package className="w-16 h-16 text-gray-300 dark:text-gray-600" />
            </div>
        );
    }

    // ✅ تابع برای گرفتن URL تصویر
    const getImageUrl = (file: any, preferThumbnail = false) => {
        if (preferThumbnail && file.thumbnailPath) return file.thumbnailPath;
        if (preferThumbnail && file.thumbnailUrl) return file.thumbnailUrl;
        if (file.path) return file.path;
        if (file.fullUrl) return file.fullUrl;
        return null;
    };

    const mainImage = validImages[selectedIndex] || validImages[0];

    return (
        <div className="space-y-2.5">
            {/* تصویر اصلی */}
            <div className="relative aspect-[16/10] bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden group">
                <Image
                    src={getImageUrl(mainImage) || ''}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    unoptimized
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                />
            </div>

            {/* تصاویر کوچک */}
            {validImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2.5">
                    {validImages.slice(0, 4).map((file: any, idx: number) => (
                        <button
                            key={file.id}
                            onClick={() => setSelectedIndex(idx)}
                            className={cn(
                                'relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 transition-all',
                                selectedIndex === idx
                                    ? 'ring-2 ring-primary ring-offset-2'
                                    : 'opacity-70 hover:opacity-100'
                            )}
                        >
                            <Image
                                src={getImageUrl(file, true) || getImageUrl(file) || ''}
                                alt={`${title} - ${idx + 1}`}
                                fill
                                className="object-cover"
                                unoptimized
                                loading="lazy"
                                sizes="20vw"
                            />
                            {idx === 3 && validImages.length > 4 && (
                                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">+{validImages.length - 4}</span>
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}