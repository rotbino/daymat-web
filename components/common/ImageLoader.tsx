// components/common/ImageLoader.tsx

import React, { useState } from 'react';
import { Button } from '@/components/radix/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/radix/dialog';
import { Trash2, ZoomIn, Loader2, ImageOff, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils/utils';
import ImageView from "@/components/common/ImageView";


interface ImageLoaderProps {
    fileId: string | null;
    className?: string;
    placeholder?:string;
    imageClassName?: string;
    containerClassName?: string;
    width?: number | string;
    height?: number | string;
    aspectRatio?: 'square' | 'video' | 'auto' | number;
    rounded?: boolean | string;
    zoomable?: boolean;
    zoomModalClassName?: string;
    loadingComponent?: React.ReactNode;
    errorComponent?: React.ReactNode;
    onDelete?: (fileId: string) => void;
    showDeleteButton?: boolean;
    onUpload?: (file: File) => Promise<{ fileId: string; downloadUrl: string }>;
    editable?: boolean;
}

export function ImageLoader({
                                fileId,
                                className,
                                imageClassName,
                                containerClassName,
                                width = '100%',
                                height,
                                aspectRatio = 'square',
                                rounded = false,
                                zoomable = true,
                                zoomModalClassName,
                                loadingComponent,
                                errorComponent,
                                onDelete,
                                showDeleteButton = false,
                                onUpload,
                                editable = false,
                                placeholder="تصویری وجود ندارد"
                            }: ImageLoaderProps) {
    const [isZoomed, setIsZoomed] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState(false);

    // محاسبه کلاس‌های مربوط به گردی و نسبت تصویر
    const getAspectRatioClass = () => {
        switch (aspectRatio) {
            case 'square':
                return 'aspect-square';
            case 'video':
                return 'aspect-video';
            case 'auto':
                return '';
            default:
                if (typeof aspectRatio === 'number') {
                    return `aspect-[${aspectRatio}]`;
                }
                return 'aspect-square';
        }
    };

    const getRoundedClass = () => {
        if (rounded === true) {
            return 'rounded-lg';
        } else if (typeof rounded === 'string') {
            return rounded;
        }
        return '';
    };

    // آپلود فایل
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !onUpload) return;

        setIsUploading(true);
        try {
            await onUpload(file);
        } catch (err) {
            console.error("Error uploading file:", err);
            setError(true);
        } finally {
            setIsUploading(false);
        }
    };

    // حذف فایل
    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!fileId || !onDelete) return;

        try {
            onDelete(fileId);
        } catch (err) {
            console.error("Error deleting file:", err);
        }
    };

    // حالت آپلود
    if (isUploading) {
        if (loadingComponent) {
            return <>{loadingComponent}</>;
        }
        return (
            <div className={cn("flex items-center justify-center", getRoundedClass(), className)} style={{ width, height }}>
                <div className="flex flex-col items-center justify-center w-full h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    // حالت خطا
    if (error) {
        if (errorComponent) {
            return <>{errorComponent}</>;
        }
        return (
            <div className={cn("flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600", getRoundedClass(), className)} style={{ width, height }}>
                <div className="flex flex-col items-center justify-center w-full h-full">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4">
                        <ImageOff className="h-10 w-10 text-gray-400 dark:text-gray-500" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className={cn("group relative overflow-hidden border dark:border-gray-700", getRoundedClass(), className)} style={{ width, height }}>
                <div className={cn("relative w-full h-full overflow-hidden", getAspectRatioClass(), containerClassName)}>
                    {fileId ? (
                        <ImageView
                            imageId={fileId}
                            alt="Profile"
                            width={width}
                            height={height}
                            className={cn("w-full h-full object-cover transition-transform group-hover:scale-105 cursor-pointer", imageClassName)}
                            onClick={() => zoomable && setIsZoomed(true)}
                        />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800">
                            <div className="text-gray-400 dark:text-gray-500">
                                <Upload className="h-10 w-10 mx-auto" />
                                <p className="text-sm mt-2">{placeholder}</p>
                            </div>
                        </div>
                    )}

                    {/* دکمه آپلود */}
                    {editable && onUpload && (
                        <label className="absolute bottom-2 right-2 bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Upload className="h-4 w-4" />
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                        </label>
                    )}

                    {/* دکمه حذف */}
                    {showDeleteButton && onDelete && fileId && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* مودال زوم */}
            {fileId && (
                <Dialog open={isZoomed} onOpenChange={setIsZoomed}>
                    <DialogContent className="max-w-6xl max-h-[90vh] p-0 bg-black/90 border-none">
                        <div className="relative flex items-center justify-center w-full h-full">
                            {/*<ImageView
                                imageId={fileId}
                                alt="Profile"
                                width={800}
                                height={800}
                                className="max-h-[85vh] max-w-[85vw] object-contain"
                            />*/}
                            <img
                                src={fileId}
                                alt={ 'Preview'}
                                className={cn("w-full h-full object-cover transition-transform group-hover:scale-105 cursor-pointer", imageClassName)}
                                onClick={() => zoomable && setIsZoomed(true)}
                            />
                            {/* دکمه بستن */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-4 right-4 bg-white/20 hover:bg-white/40 text-white rounded-full p-1.5"
                                onClick={() => setIsZoomed(false)}
                            >
                                <X className="h-6 w-6"/>
                            </Button>

                            {/* هدر با اطلاعات فایل */}
                            <DialogHeader
                                className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
                                <DialogTitle className="text-white text-xl">
                                    تصویر پروفایل
                                </DialogTitle>
                            </DialogHeader>
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </>
    );
}