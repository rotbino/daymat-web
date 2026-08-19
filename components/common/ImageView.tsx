// components/common/ImageView.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { API_BASE } from '@/lib/api/apiRequest';
import { cn } from '@/lib/utils/utils';

interface ImageViewProps {
    fileId?: string | null;
    model?: 'User' | 'Business' | 'Ad';
    modelId?: string;
    fieldKey?: string;
    thumbnail?: boolean;
    alt?: string;
    width?: number;
    height?: number;
    className?: string;
    rounded?: boolean;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    zoomable?: boolean;
}

export function ImageView({
                              fileId,
                              model,
                              modelId,
                              fieldKey,
                              thumbnail = false,
                              alt = 'تصویر',
                              width = 100,
                              height = 100,
                              className = '',
                              rounded = false,
                              objectFit = 'cover',
                              zoomable = false,
                          }: ImageViewProps) {
    const [isZoomed, setIsZoomed] = useState(false);
    const [error, setError] = useState(false);

    // ساخت URL
    let src = '';
    if (fileId) {
        src = thumbnail
            ? `${API_BASE}/file/${fileId}/thumbnail`
            : `${API_BASE}/file/${fileId}`;
    } else if (model && modelId && fieldKey) {
        src = thumbnail
            ? `${API_BASE}/file/key/${model}/${modelId}/${fieldKey}/thumbnail`
            : `${API_BASE}/file/key/${model}/${modelId}/${fieldKey}`;
    }

    const handleError = () => {
        setError(true);
    };

    const handleClick = () => {
        if (zoomable) setIsZoomed(true);
    };

    if (!src || error) {
        return (
            <div
                className={cn(
                    "bg-surface-container-high flex items-center justify-center text-on-surface-variant",
                    rounded && "rounded-full",
                    className
                )}
                style={{ width, height }}
            >
                <span className="material-symbols-outlined text-3xl">person</span>
            </div>
        );
    }

    return (
        <>
            <div
                onClick={handleClick}
                style={{ cursor: zoomable ? 'pointer' : 'default' }}
            >
                <img
                    src={src}
                    alt={alt}
                    width={width}
                    height={height}
                    className={cn(
                        "object-cover",
                        rounded && "rounded-full",
                        className
                    )}
                    style={{ objectFit }}
                    onError={handleError}
                />
            </div>

            {/* مودال زوم */}
            {isZoomed && zoomable && (
                <div
                    className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center cursor-pointer"
                    onClick={() => setIsZoomed(false)}
                >
                    <img
                        src={src}
                        alt={alt}
                        className="max-w-[90vw] max-h-[90vh] object-contain"
                    />
                </div>
            )}
        </>
    );
}