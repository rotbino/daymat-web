// app/ad/[id]/[slug]/components/AdGallery.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { X, ChevronRight, ChevronLeft, ZoomIn, ZoomOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    images: any[];
    title: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.API_BASE_URL || 'http://localhost:3011';

function getUrl(file: any, thumb = false): string {
    if (!file) return '';
    if (thumb && file.thumbnailPath) return file.thumbnailPath;
    if (file.path?.startsWith('https://') || file.fullUrl?.startsWith('https://')) {
        return file.path || file.fullUrl || '';
    }
    return `${API_BASE}/file/${file.id}`;
}

export default function AdGallery({ images, title }: Props) {
    const validImages = (images || []).filter(
        (f: any) =>
            f.path?.startsWith('https://') ||
            f.fullUrl?.startsWith('https://') ||
            f.thumbnailPath?.startsWith('https://') ||
            f.id
    );

    const [selIdx, setSelIdx] = useState(0);
    const [lightbox, setLightbox] = useState(false);
    const [imgLoaded, setImgLoaded] = useState(false);

    useEffect(() => {
        setImgLoaded(false);
    }, [selIdx]);

    if (validImages.length === 0) {
        return (
            <div className="aspect-[4/3] lg:aspect-auto lg:min-h-[400px] bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm">بدون تصویر</p>
            </div>
        );
    }

    const mainImg = validImages[selIdx] || validImages[0];
    const mainUrl = getUrl(mainImg);

    const go = useCallback((idx: number) => {
        setSelIdx(idx);
        setImgLoaded(false);
    }, []);

    const goPrev = useCallback(() => {
        setSelIdx(prev => (prev - 1 + validImages.length) % validImages.length);
        setImgLoaded(false);
    }, [validImages.length]);

    const goNext = useCallback(() => {
        setSelIdx(prev => (prev + 1) % validImages.length);
        setImgLoaded(false);
    }, [validImages.length]);

    useEffect(() => {
        if (!lightbox) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setLightbox(false);
            if (e.key === 'ArrowLeft') goPrev();
            if (e.key === 'ArrowRight') goNext();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [lightbox, goPrev, goNext]);

    const handleMainClick = () => {
        if (validImages.length <= 1) return;
        setLightbox(true);
    };

    return (
        <div className="space-y-2 flex flex-col h-full">
            {/* تصویر اصلی - پرکننده فضا */}
            <div
                className={cn(
                    'relative bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden group flex-1',
                    'aspect-[4/3] lg:aspect-auto lg:min-h-[400px]',
                    validImages.length > 1 ? 'cursor-zoom-in' : 'cursor-default'
                )}
                onClick={handleMainClick}
            >
                {!imgLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
                <Image
                    src={mainUrl || '/images/no_image.jpg'}
                    alt={title}
                    fill
                    className={cn(
                        "object-cover transition-opacity duration-300",
                        !imgLoaded && 'opacity-0'
                    )}
                    unoptimized
                    priority
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    onLoadingComplete={() => setImgLoaded(true)}
                    onError={() => setImgLoaded(true)}
                />

                {validImages.length > 1 && (
                    <div className="absolute bottom-3 left-3 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="w-4 h-4" />
                    </div>
                )}
            </div>

            {/* نوار تامبنیل‌ها - ثابت */}
            {validImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide flex-shrink-0">
                    {validImages.map((file, idx) => {
                        const thumb = getUrl(file, true);
                        const isActive = idx === selIdx;
                        return (
                            <button
                                key={file.id || idx}
                                onClick={() => go(idx)}
                                className={cn(
                                    'relative flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all duration-200',
                                    isActive
                                        ? 'border-primary ring-2 ring-offset-2 scale-[1.05] shadow-lg shadow-primary/20'
                                        : 'border-gray-200 dark:border-gray-700 opacity-60 hover:opacity-100'
                                )}
                            >
                                <Image
                                    src={thumb || '/images/no_image.jpg'}
                                    alt={`${title} - تصویر ${idx + 1}`}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                    loading="lazy"
                                />
                            </button>
                        );
                    })}
                </div>
            )}

            {/* شمارنده */}
            {validImages.length > 1 && (
                <p className="text-center text-[11px] text-gray-400 dark:text-gray-500 -mt-1 flex-shrink-0">
                    {selIdx + 1} / {validImages.length} عکس
                </p>
            )}

            {/* ═══ لایت‌باکس ═══ */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-4"
                    onClick={() => setLightbox(false)}
                >
                    <button
                        onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
                        className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    <div
                        className="relative max-w-4xl w-[95vw] max-h-[85vh] flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {!imgLoaded && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-10 h-10 border-2 border-white/30 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                        <Image
                            src={mainUrl || '/images/no_image.jpg'}
                            alt={`${title} - تصویر ${selIdx + 1}`}
                            width={1200}
                            height={800}
                            className={cn(
                                'object-contain max-h-[85vh] w-auto max-w-full rounded-2xl shadow-2xl',
                                !imgLoaded && 'opacity-0'
                            )}
                            unoptimized
                            priority
                            onLoadingComplete={() => setImgLoaded(true)}
                            onError={() => setImgLoaded(true)}
                        />
                    </div>

                    {validImages.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goPrev(); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                        >
                            <ChevronRight className="w-6 h-6 text-white" />
                        </button>
                    )}

                    {validImages.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); goNext(); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                        >
                            <ChevronLeft className="w-6 h-6 text-white" />
                        </button>
                    )}

                    {validImages.length > 1 && (
                        <div
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {validImages.map((file, idx) => {
                                const thumb = getUrl(file, true);
                                return (
                                    <button
                                        key={file.id || idx}
                                        onClick={(e) => { e.stopPropagation(); go(idx); }}
                                        className={cn(
                                            'w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all duration-150 relative',
                                            idx === selIdx
                                                ? 'border-white ring-2 ring-offset-2 scale-105'
                                                : 'border-white/30 opacity-50 hover:opacity-100'
                                        )}
                                    >
                                        <Image
                                            src={thumb || '/images/no_image.jpg'}
                                            alt={`تصویر ${idx + 1}`}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                            loading="lazy"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <p className="absolute bottom-4 right-4 text-white/50 text-xs">
                        {selIdx + 1} / {validImages.length}
                    </p>
                </div>
            )}
        </div>
    );
}