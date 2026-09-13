// app/business/manage/components/LogoEditModal.tsx
// 🖼️ تغییر لوگوی کسب‌وکار — آپلود با model=Business و fieldKey=logo (سرور خودش logoUrl را سینک می‌کند)
'use client';

import React, { useState } from 'react';
import { X, Loader2, Trash2, Check } from 'lucide-react';
import Image from 'next/image';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { FileUploader } from '@/components/common/FileUploader';
import { useUploadFile, useUpdateBusinessDetail } from '@/lib/api/apiHooks';
import { resolveFileSrc } from './BusinessLogo';

export function LogoEditModal({
    isOpen,
    onClose,
    businessId,
    logoUrl,
    name,
}: {
    isOpen: boolean;
    onClose: () => void;
    businessId: string;
    logoUrl?: string | null;
    name?: string;
}) {
    const [file, setFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [removing, setRemoving] = useState(false);
    const uploadMutation = useUploadFile();
    const updateMutation = useUpdateBusinessDetail();
    const queryClient = useQueryClient();

    if (!isOpen) return null;

    const currentSrc = resolveFileSrc(logoUrl);

    const handleSave = async () => {
        if (!file || saving) return;
        setSaving(true);
        try {
            await uploadMutation.mutateAsync({
                file,
                model: 'Business',
                modelId: businessId,
                fieldKey: 'logo',
            });
            queryClient.invalidateQueries({ queryKey: ['business-detail', businessId] });
            queryClient.invalidateQueries({ queryKey: ['businesses-entity'] });
            toast.success('لوگوی کسب‌وکار به‌روزرسانی شد');
            setFile(null);
            onClose();
        } catch {
            /* توست خطا در هوک */
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async () => {
        if (removing) return;
        setRemoving(true);
        try {
            await updateMutation.mutateAsync({ id: businessId, data: { logoUrl: null } });
            queryClient.invalidateQueries({ queryKey: ['business-detail', businessId] });
            queryClient.invalidateQueries({ queryKey: ['businesses-entity'] });
            toast.success('لوگو حذف شد');
            onClose();
        } catch {
            /* توست خطا در هوک */
        } finally {
            setRemoving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
                {/* هدر */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant/20 bg-primary/5">
                    <div>
                        <h3 className="text-sm font-extrabold text-on-surface">لوگوی کسب‌وکار</h3>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">{name}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
                        aria-label="بستن"
                    >
                        <X className="w-5 h-5 text-on-surface-variant" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {/* لوگوی فعلی */}
                    {currentSrc && !file && (
                        <div className="flex justify-center">
                            <span className="w-28 h-28 rounded-2xl overflow-hidden ring-1 ring-outline-variant/40 grid place-items-center bg-surface-container-high dark:bg-gray-800">
                                <Image src={currentSrc} alt="لوگوی فعلی" width={112} height={112} className="w-full h-full object-cover" unoptimized />
                            </span>
                        </div>
                    )}

                    {/* انتخاب فایل جدید */}
                    <div className="flex justify-center">
                        <FileUploader
                            value={null}
                            onFileSelect={(f) => setFile(f)}
                            onRemove={() => setFile(null)}
                            showDeleteBtn={!!file}
                            rounded={false}
                            width={112}
                            height={112}
                            disabled={saving}
                            label={currentSrc ? 'انتخاب لوگوی جدید' : 'انتخاب لوگو'}
                        />
                    </div>

                    <p className="text-[10px] text-on-surface-variant/70 text-center leading-4">
                        مربعی و با کیفیت بالا آپلود کن — پس‌زمینهٔ روشن بهتر دیده می‌شود.
                    </p>

                    {/* دکمه‌ها */}
                    <div className="flex gap-2 pt-1">
                        {currentSrc && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                disabled={saving || removing}
                                className="h-10 px-3.5 rounded-xl border border-error/40 text-error text-[11px] font-bold flex items-center gap-1.5 hover:bg-error/5 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {removing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                                حذف
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={!file || saving}
                            className={cn(
                                'flex-1 h-10 rounded-xl bg-primary text-on-primary text-xs font-extrabold flex items-center justify-center gap-1.5',
                                'hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-sm shadow-primary/25',
                            )}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            ذخیرهٔ لوگو
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
