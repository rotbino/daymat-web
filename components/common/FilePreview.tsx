// app/components/FilePreview.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Download, Trash2, FileText, FileImage, FileVideo, File, Loader2, X } from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { API_BASE } from '@/lib/api/apiRequest';
import { toast } from 'sonner';

interface FilePreviewProps {
    fileId: string | null;
    onDelete: () => void;
    onClear?: () => void;
    className?: string;
}

export function FilePreview({ fileId, onDelete, onClear, className = '' }: FilePreviewProps) {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileInfo, setFileInfo] = useState<{ name: string; type: string; size: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // ============================================================
    // ✅ واکشی اطلاعات فایل
    // ============================================================
    useEffect(() => {
        const fetchFileInfo = async () => {
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
                const fileUrl = apiService.file.getUrl(fileId);
                setPreviewUrl(fileUrl);

                // دریافت اطلاعات فایل (نام، نوع، حجم)
                // از API اطلاعات فایل رو می‌گیریم
                const response = await fetch(`${API_BASE}/file/${fileId}/info`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`,
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    setFileInfo({
                        name: data.name || 'فایل',
                        type: data.mimeType || 'application/octet-stream',
                        size: data.size || 0,
                    });
                } else {
                    // اگر اطلاعات فایل در دسترس نبود، از نام پیش‌فرض استفاده کن
                    setFileInfo({
                        name: 'فایل',
                        type: 'application/octet-stream',
                        size: 0,
                    });
                }
            } catch (err) {
                console.error('❌ Error fetching file:', err);
                setError('خطا در بارگذاری فایل');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFileInfo();
    }, [fileId]);

    // ============================================================
    // ✅ دانلود فایل
    // ============================================================
    const handleDownload = () => {
        if (!previewUrl) return;

        const link = document.createElement('a');
        link.href = previewUrl;
        link.download = fileInfo?.name || 'فایل';
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
            toast.success('فایل با موفقیت حذف شد');
            onDelete();
            if (onClear) onClear();
        } catch (error: any) {
            console.error('❌ Error deleting file:', error);
            toast.error(error?.message || 'خطا در حذف فایل');
        } finally {
            setIsDeleting(false);
        }
    };

    // ============================================================
    // ✅ دریافت آیکون مناسب
    // ============================================================
    const getFileIcon = () => {
        if (!fileInfo) return <File className="w-10 h-10 text-on-surface-variant" />;

        if (fileInfo.type.startsWith('image/')) {
            return <FileImage className="w-10 h-10 text-blue-500" />;
        }
        if (fileInfo.type.startsWith('video/')) {
            return <FileVideo className="w-10 h-10 text-green-500" />;
        }
        if (fileInfo.type.includes('pdf')) {
            return <FileText className="w-10 h-10 text-red-500" />;
        }
        if (fileInfo.type.includes('zip') || fileInfo.type.includes('rar')) {
            return <File className="w-10 h-10 text-yellow-500" />;
        }
        return <File className="w-10 h-10 text-on-surface-variant" />;
    };

    // ============================================================
    // ✅ نمایش پیش‌نمایش برای تصاویر
    // ============================================================
    const isImage = fileInfo?.type?.startsWith('image/');

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
            <div className={`flex items-center justify-center p-8 border border-outline-variant bg-surface-container-low ${className}`}>
                <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <span className="text-xs text-on-surface-variant">در حال بارگذاری فایل...</span>
                </div>
            </div>
        );
    }

    // ============================================================
    // ✅ خطا یا بدون فایل
    // ============================================================
    if (error || !fileInfo || !previewUrl) {
        return (
            <div className={`flex items-center justify-center p-8 border border-error/30 bg-error/5 ${className}`}>
                <div className="flex flex-col items-center gap-2 text-center">
                    <File className="w-8 h-8 text-error/50" />
                    <span className="text-sm text-error">{error || 'فایلی انتخاب نشده است'}</span>
                </div>
            </div>
        );
    }

    // ============================================================
    // ✅ نمایش فایل
    // ============================================================
    return (
        <div className={`group relative overflow-hidden border border-outline-variant bg-surface-container-low ${className}`}>
            {/* دکمه حذف - در گوشه */}
            {onClear && (
                <button
                    onClick={onClear}
                    className="absolute top-2 right-2 p-1 bg-surface/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-error/10 hover:text-error"
                    title="حذف فایل"
                >
                    <X className="w-4 h-4" />
                </button>
            )}

            <div className="p-4 flex flex-col items-center gap-3">
                {/* پیش‌نمایش */}
                {isImage ? (
                    <div className="relative w-full max-h-48 overflow-hidden rounded-lg border border-outline-variant">
                        <img
                            src={previewUrl}
                            alt={fileInfo.name}
                            className="w-full h-auto max-h-48 object-contain"
                            onError={() => setError('خطا در نمایش تصویر')}
                        />
                    </div>
                ) : (
                    <div className="flex items-center justify-center w-20 h-20 bg-surface-container rounded-lg border border-outline-variant">
                        {getFileIcon()}
                    </div>
                )}

                {/* اطلاعات فایل */}
                <div className="text-center w-full">
                    <p className="text-sm font-medium text-on-surface truncate" title={fileInfo.name}>
                        {fileInfo.name}
                    </p>
                    <div className="flex justify-center gap-3 text-xs text-on-surface-variant mt-1">
                        <span>{formatSize(fileInfo.size)}</span>
                        <span className="text-outline-variant">|</span>
                        <span>{fileInfo.type || 'نامشخص'}</span>
                    </div>
                </div>

                {/* دکمه‌های اکشن */}
                <div className="flex gap-2 mt-1">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary border border-primary/30 hover:bg-primary/10 rounded-lg transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        دانلود
                    </button>

                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-error border border-error/30 hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                        )}
                        حذف
                    </button>
                </div>
            </div>
        </div>
    );
}