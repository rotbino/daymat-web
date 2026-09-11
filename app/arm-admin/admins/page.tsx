// app/arm-admin/admins/page.tsx
'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { apiService } from '@/lib/api/apiService';
import { useArms } from '@/lib/api/apiHooks';
import { toast } from 'sonner';
import {
    ShieldCheck, UserPlus, Loader2, Phone, Trash2, Info, CalendarDays, Building2, BookOpen,
} from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

/**
 * ادمین‌های بازار — منصوبِ مالک:
 *   مالک می‌تواند هر شخصی (با شماره موبایل) را ادمین بازار کند و عزل نماید.
 *   ادمین به پنل مدیریت دسترسی دارد اما فقط بخش‌های واگذارشده (تب «دسترسی مالک»
 *   در تنظیمات) را می‌تواند تغییر دهد؛ انتصاب/عزل ادمین هم فقط کارِ مالک است.
 */
export default function ArmAdminsPage() {
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);
    const { data: userArms } = useArms();
    const queryClient = useQueryClient();

    const [phone, setPhone] = useState('');
    const [adding, setAdding] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const currentRole = (userArms as any[] | undefined)?.find((a) => a.slug === currentSlug)?.role;
    const isOwner = currentRole === 'arm_owner';

    const { data, isLoading } = useQuery({
        queryKey: ['arm-admins', currentSlug],
        queryFn: () => apiService.armAdmin.getAdmins(currentSlug as string),
        enabled: !!currentSlug,
    });

    const admins: any[] = data?.items ?? [];

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!phone.trim()) {
            toast.error('شماره موبایل را وارد کنید');
            return;
        }
        setAdding(true);
        try {
            const res = await apiService.armAdmin.addAdmin(currentSlug as string, phone.trim());
            toast.success(res?.message || 'ادمین بازار منصوب شد');
            setPhone('');
            queryClient.invalidateQueries({ queryKey: ['arm-admins', currentSlug] });
        } catch (err: any) {
            toast.error(err?.data?.message || err?.message || 'خطا در انتصاب ادمین');
        } finally {
            setAdding(false);
        }
    };

    const handleRemove = async (userId: string, name: string) => {
        if (!window.confirm(`«${name}» از ادمینی این بازار عزل شود؟`)) return;
        setRemovingId(userId);
        try {
            const res = await apiService.armAdmin.removeAdmin(currentSlug as string, userId);
            toast.success(res?.message || 'ادمین عزل شد');
            queryClient.invalidateQueries({ queryKey: ['arm-admins', currentSlug] });
        } catch (err: any) {
            toast.error(err?.data?.message || err?.message || 'خطا در عزل ادمین');
        } finally {
            setRemovingId(null);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            {/* هدر */}
            <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-lg font-bold text-on-surface dark:text-gray-100">ادمین‌های بازار</h1>
                    <p className="text-xs text-on-surface-variant dark:text-gray-400 mt-0.5">
                        ادمینِ {currentArm?.name || 'بازار'} — غیر از مالک است؛ به پنل دسترسی دارد و وظایف واگذارشده را انجام می‌دهد
                    </p>
                </div>
            </div>

            {/* راهنمای نقش */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-xs leading-6 text-on-surface-variant dark:text-gray-300">
                    ادمین بازار می‌تواند درخواست‌های عضویت را بررسی کند و بخش‌هایی از تنظیمات را که مالک برایش
                    واگذار کرده تغییر دهد (مدیریت کاتالوگ، آگهی‌ها و…). میزان دسترسی ادمین در
                    تنظیمات ← تب «دسترسی مالک» تعیین می‌شود. ادمین نمی‌تواند ادمین دیگری منصوب کند و مالکِ بازار نیست.
                </p>
            </div>

            {/* فرم انتصاب — فقط مالک */}
            {isOwner ? (
                <form onSubmit={handleAdd} className="bg-white dark:bg-gray-900 border border-outline-variant/30 dark:border-gray-700 rounded-2xl p-4 flex flex-col sm:flex-row gap-3 sm:items-end">
                    <div className="flex-1">
                        <label className="text-xs font-semibold text-on-surface dark:text-gray-200 block mb-1.5">
                            انتصاب ادمین با شماره موبایل
                        </label>
                        <div className="relative">
                            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant/50" />
                            <input
                                type="tel"
                                dir="ltr"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="09123456789"
                                className="w-full h-11 pr-10 pl-4 rounded-xl border border-outline-variant/40 dark:border-gray-700 bg-surface-container-lowest dark:bg-gray-800 text-sm text-left focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <p className="text-[10px] text-on-surface-variant/60 mt-1.5">
                            اگر کاربر عضو بازار نباشد، عضویتِ ادمین برایش ساخته می‌شود
                        </p>
                    </div>
                    <button
                        type="submit"
                        disabled={adding || !currentSlug}
                        className="h-11 px-5 rounded-xl bg-primary text-on-primary text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-primary/90 transition-colors flex-shrink-0"
                    >
                        {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                        انتصاب ادمین
                    </button>
                </form>
            ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-300">
                        شما این بازار را به‌عنوان ادمین مدیریت می‌کنید — انتصاب و عزل ادمین فقط توسط مالک بازار انجام می‌شود.
                    </p>
                </div>
            )}

            {/* لیست ادمین‌ها */}
            <div className="space-y-2">
                {isLoading ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                ) : admins.length === 0 ? (
                    <div className="text-center py-10 border border-dashed border-outline-variant/40 dark:border-gray-700 rounded-2xl">
                        <ShieldCheck className="w-8 h-8 text-on-surface-variant/30 mx-auto mb-2" />
                        <p className="text-sm text-on-surface-variant dark:text-gray-400">هنوز ادمینی منصوب نشده است</p>
                    </div>
                ) : (
                    admins.map((admin) => (
                        <div
                            key={admin.id}
                            className="bg-white dark:bg-gray-900 border border-outline-variant/30 dark:border-gray-700 rounded-2xl p-4 flex items-center gap-3"
                        >
                            <div className="w-11 h-11 rounded-xl bg-surface-container-high dark:bg-gray-800 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {admin.user?.avatarUrl ? (
                                    <Image src={admin.user.avatarUrl} alt={admin.user?.fullName || ''} width={44} height={44} className="object-cover" unoptimized />
                                ) : (
                                    <span className="text-sm font-bold text-primary">{(admin.user?.fullName || '؟').charAt(0)}</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-on-surface dark:text-gray-100 truncate">
                                    {admin.user?.fullName || 'بدون نام'}
                                </p>
                                <div className="flex items-center gap-3 flex-wrap mt-0.5">
                                    <span className="text-[11px] text-on-surface-variant dark:text-gray-400 flex items-center gap-1" dir="ltr">
                                        <Phone className="w-3 h-3" />
                                        {admin.user?.phone || '—'}
                                    </span>
                                    <span className="text-[11px] text-on-surface-variant dark:text-gray-400 flex items-center gap-1">
                                        <CalendarDays className="w-3 h-3" />
                                        {admin.joinedAt ? new Date(admin.joinedAt).toLocaleDateString('fa-IR') : '—'}
                                    </span>
                                    {admin.business?.name && (
                                        <span className="text-[11px] text-on-surface-variant dark:text-gray-400 flex items-center gap-1">
                                            <Building2 className="w-3 h-3" />
                                            {admin.business.name}
                                        </span>
                                    )}
                                    {admin.catalog?.name && (
                                        <span className="text-[11px] text-on-surface-variant dark:text-gray-400 flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" />
                                            {admin.catalog.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span className={cn(
                                'text-[10px] px-2 py-1 rounded-full flex-shrink-0',
                                admin.status === 'active'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                    : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                            )}>
                                {admin.status === 'active' ? 'فعال' : admin.status === 'paused' ? 'موقتاً متوقف' : admin.status}
                            </span>
                            {isOwner && (
                                <button
                                    onClick={() => handleRemove(admin.userId, admin.user?.fullName || 'این کاربر')}
                                    disabled={removingId === admin.userId}
                                    title="عزل ادمین"
                                    className="p-2 rounded-lg text-error/70 hover:bg-error/5 hover:text-error transition-colors flex-shrink-0 disabled:opacity-50"
                                >
                                    {removingId === admin.userId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
