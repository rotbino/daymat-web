// app/components/VideoPreview.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, Trash2, Play, Pause, Loader2, X } from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { API_BASE } from '@/lib/api/apiRequest';
import { toast } from 'sonner';

interface VideoPreviewProps {
    fileId: string | null;
    onDelete: () => void;
    onClear?: () => void;
    className?: string;
}

export function VideoPreview({ fileId, onDelete, onClear, className = '' }: VideoPreviewProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    // ============================================================
    // ✅ واکشی اطلاعات فایل
    // ============================================================
    useEffect(() => {
        const fetchVideoInfo = async () => {
            if (!fileId) {
                setPreviewUrl(null);
                setFileInfo(null);
                setError(null);
                return;
            }

            setIsLoading(true);
            setError(null);

            try {
                // آدرس مستقیم فایل
                const url = apiService.file.getUrl(fileId);
                setPreviewUrl(url);

                // دریافت اطلاعات فایل (نام، حجم)
                const response = await fetch(`${API_BASE}/file/${fileId}/info`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setFileInfo({
                        name: data.name || 'ویدیو',
                        size: data.size || 0,
                    });
                } else {
                    setFileInfo({
                        name: 'ویدیو',
                        size: 0,
                    });
                }
            } catch (err) {
                console.error('❌ Error fetching video:', err);
                setError('خطا در بارگذاری ویدیو');
            } finally {
                setIsLoading(false);
            }
        };

        fetchVideoInfo();
    }, [fileId]);

    // ============================================================
    // ✅ کنترل پخش
    // ============================================================
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // ============================================================
    // ✅ دانلود فایل
    // ============================================================
    const handleDownload = () => {
        if (!previewUrl) return;
        const link = document.createElement('a');
        link.href = previewUrl;
        link.download = fileInfo?.name || 'ویدیو';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // ============================================================
    // ✅ حذف فایل
    // ============================================================
    const handleDelete = async () => {
        if (!fileId) return;

        setIsDeleting(true);
        try {
            await apiService.file.delete(fileId);
            toast.success('ویدیو با موفقیت حذف شد');
            onDelete();
            if (onClear) onClear();
        } catch (error: any) {
            console.error('❌ Error deleting video:', error);
            toast.error(error?.message || 'خطا در حذف ویدیو');
        } finally {
            setIsDeleting(false);
        }
    };

    // ============================================================
    // ✅ فرمت حجم
    // ============================================================
    const formatSize = (bytes: number) => {
        if (bytes === 0) return 'نامشخص';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // ============================================================
    // ✅ در حال بارگذاری
    // ============================================================
    if (isLoading) {
        return (
            <div className={`flex items-center justify-center aspect-video w-full border border-outline-variant bg-surface-container-low ${className}`}>
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs text-on-surface-variant">در حال بارگذاری ویدیو...</span>
                </div>
            </div>
        );
    }

    // ============================================================
    // ✅ خطا یا بدون فایل
    // ============================================================
    if (error || !previewUrl || !fileInfo) {
        return (
            <div className={`flex items-center justify-center aspect-video w-full border border-error/30 bg-error/5 ${className}`}>
                <div className="flex flex-col items-center gap-2 text-center">
                    <Play className="w-8 h-8 text-error/50" />
                    <span className="text-sm text-error">{error || 'ویدیویی انتخاب نشده است'}</span>
                </div>
            </div>
        );
    }

    // ============================================================
    // ✅ نمایش ویدیو
    // ============================================================
    return (
        <div className={`group relative overflow-hidden border border-outline-variant bg-surface-container-low ${className}`}>
            {/* دکمه حذف - در گوشه */}
            {onClear && (
                <button
                    onClick={onClear}
                    className="absolute top-2 right-2 z-10 p-1 bg-surface/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/10 hover:text-error"
                    title="حذف ویدیو"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            <div className="relative aspect-video w-full">
                <video
                    ref={videoRef}
                    src={previewUrl}
                    className="h-full w-full object-cover bg-black"
                    onClick={togglePlay}
                    playsInline
                    onEnded={() => setIsPlaying(false)}
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                />

                {/* دکمه‌های کنترل - روی ویدیو */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={togglePlay}
                        className="flex items-center justify-center w-12 h-12 bg-surface/90 rounded-full hover:bg-surface transition-colors shadow-lg"
                    >
                        {isPlaying ? (
                            <Pause className="w-6 h-6 text-on-surface" />
                        ) : (
                            <Play className="w-6 h-6 text-on-surface" />
                        )}
                    </button>
                </div>

                {/* دکمه‌های اکشن - روی ویدیو */}
                <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={handleDownload}
                        className="p-1.5 bg-surface/80 rounded-lg hover:bg-surface transition-colors"
                        title="دانلود"
                    >
                        <Download className="w-4 h-4 text-on-surface" />
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="p-1.5 bg-surface/80 rounded-lg hover:bg-error/20 transition-colors disabled:opacity-50"
                        title="حذف"
                    >
                        {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin text-error" />
                        ) : (
                            <Trash2 className="w-4 h-4 text-error" />
                        )}
                    </button>
                </div>
            </div>

            {/* اطلاعات فایل */}
            <div className="p-3 flex justify-between items-center">
                <p className="text-sm font-medium text-on-surface truncate" title={fileInfo.name}>
                    {fileInfo.name}
                </p>
                <span className="text-xs text-on-surface-variant">{formatSize(fileInfo.size)}</span>
            </div>
        </div>
    );
}