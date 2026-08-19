// app/admin/arm/[id]/edit/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { ArmForm } from '../../components/ArmForm';
import { usePageMeta } from '@/app/admin/layout';
import { Loader2 } from 'lucide-react';

export default function EditArmPage() {
    const router = useRouter();
    const params = useParams();
    const armId = params.id as string;
    const { setPageMeta } = usePageMeta();

    const [arm, setArm] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // ⭐ ست کردن عنوان و دکمه برگشت توی هدر layout
    useEffect(() => {
        if (arm) {
            setPageMeta({
                title: `ویرایش: ${arm.name}`,
                subtitle: `/${arm.slug}`,
                backUrl: '/admin/arm',
            });
        }
        return () => setPageMeta({});
    }, [arm, setPageMeta]);

    useEffect(() => {
        const fetchArm = async () => {
            try {
                const data = await apiService.admin.arms.getOne(armId);
                setArm(data);
            } catch (error: any) {
                toast.error(error?.message || 'خطا در دریافت اطلاعات بازار');
                router.push('/admin/arm');
            } finally {
                setLoading(false);
            }
        };
        fetchArm();
    }, [armId, router]);

    const handleSubmit = async (data: any) => {
        setSaving(true);
        try {
            await apiService.admin.arms.update(armId, data);
            //toast.success('بازار با موفقیت به‌روزرسانی شد');
        } catch (error: any) {
            toast.error(error?.message || 'خطا در به‌روزرسانی بازار');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            </div>
        );
    }

    if (!arm) {
        return (
            <div className="text-center py-20">
                <p className="text-error">بازار یافت نشد</p>
            </div>
        );
    }

    return (
        <ArmForm
            initialData={arm}
            onSubmit={handleSubmit}
            isSubmitting={saving}
        />
    );
}