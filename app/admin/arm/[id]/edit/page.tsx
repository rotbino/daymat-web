// app/admin/arm/[id]/edit/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { setArm } from '@/lib/store/slices/armSlice';
import { ArmForm } from '../../components/ArmForm';
import { usePageMeta } from '@/app/admin/layout';
import { Loader2 } from 'lucide-react';

export default function EditArmPage() {
    const router = useRouter();
    const params = useParams();
    const dispatch = useDispatch();
    const armId = params.id as string;
    const { setPageMeta } = usePageMeta();

    const [arm, setArmState] = useState<any>(null);
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
                setArmState(data);

                // ✅ ست کردن بازار به عنوان کارنت
                dispatch(setArm({ arm: data, slug: data.slug }));
                localStorage.setItem('lastArmSlug', data.slug);
            } catch (error: any) {
                toast.error(error?.message || 'خطا در دریافت اطلاعات بازار');
                router.push('/admin/arm');
            } finally {
                setLoading(false);
            }
        };
        fetchArm();
    }, [armId, router, dispatch]);

    const handleSubmit = async (data: any) => {
        setSaving(true);
        try {
            const updated = await apiService.admin.arms.update(armId, data);

            // ✅ بعد از ذخیره هم بازار کارنت رو آپدیت کن
            dispatch(setArm({ arm: updated, slug: updated.slug }));
            localStorage.setItem('lastArmSlug', updated.slug);

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