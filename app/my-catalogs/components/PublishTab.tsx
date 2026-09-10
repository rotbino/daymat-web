// app/my-catalogs/components/PublishTab.tsx
'use client';

import React from 'react';
import { ExternalLink, Globe, Share2, ShieldCheck } from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CARD_CLS, PUB_CHIP } from '../constants';

interface Props {
    currentCatalog: any;
    memberships: any[];
    onShare: () => void;
    onVerify: () => void;
    onEditCatalog: () => void;
    onRefreshAll: () => void;
}

/** تب انتشار — اشتراک‌گذاری، مدیریت عضویت‌ها در بازارها، تیک اعتماد */
export default function PublishTab({ currentCatalog, memberships, onShare, onVerify, onEditCatalog, onRefreshAll }: Props) {
    const queryClient = useQueryClient();

    const togglePublish = async (m: any, isOn: boolean) => {
        try {
            await apiService.arm.toggleCatalogPublish(m.slug, { catalogId: currentCatalog.id, published: !isOn });
            toast.success(!isOn ? `منتشر شد در ${m.armName || m.name}` : 'انتشار خاموش شد');
            queryClient.invalidateQueries({ queryKey: ['arms'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-derived'] });
            onRefreshAll();
        } catch (e: any) {
            toast.error(e?.data?.message || 'خطا');
        }
    };

    return (
        <div className="space-y-3">
            {/* لینک عمومی کاتالوگ — همان چیزی که مشتری می‌بیند */}
            {currentCatalog.slug ? (
                <div className={CARD_CLS + ' p-4'}>
                    <h3 className="text-sm font-extrabold text-on-surface mb-2">لینک عمومی کاتالوگ</h3>
                    <div className="flex items-center gap-2">
                        <a href={`/${currentCatalog.slug}`} target="_blank" rel="noreferrer"
                           className="flex-1 min-w-0 h-10 px-3 rounded-lg bg-surface-container-low dark:bg-gray-800
                               flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400
                               hover:bg-surface-container-high dark:hover:bg-gray-700 transition-colors" dir="ltr">
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate" dir="ltr">{typeof window !== 'undefined' ? window.location.host : ''}/{currentCatalog.slug}</span>
                        </a>
                        <button onClick={() => { navigator.clipboard?.writeText(`${window.location.origin}/${currentCatalog.slug}`).then(() => toast.success('لینک کپی شد')).catch(() => {}); }}
                                aria-label="کپی لینک"
                                className="h-10 px-3 rounded-lg border border-outline-variant/50 dark:border-gray-700 text-[11px] font-bold
                                    text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors flex-shrink-0">
                            کپی
                        </button>
                    </div>
                </div>
            ) : (
                <button onClick={onEditCatalog}
                        className="w-full rounded-lg border border-amber-500/50 bg-amber-500/5 dark:bg-amber-500/10 p-3.5
                            flex items-center gap-3 text-right hover:border-amber-500 transition-colors">
                    <Globe className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span className="flex-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                        برای انتشار، اول آدرس اختصاصی کاتالوگ را تنظیم کن
                    </span>
                </button>
            )}

            {/* کیت اشتراک‌گذاری */}
            <button onClick={onShare}
                    className="w-full bg-gradient-to-l from-primary/10 to-primary/5 border border-primary/25 rounded-lg p-4
                        flex items-center gap-3.5 text-right hover:border-primary/50 transition-colors">
                <span className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Share2 className="w-5 h-5 text-primary" />
                </span>
                <span className="flex-1 min-w-0">
                    <span className="block text-sm font-extrabold text-primary">کیت اشتراک‌گذاری کاتالوگ</span>
                    <span className="block text-[11px] text-on-surface-variant mt-0.5">لینک + پیام آماده + QR چاپی</span>
                </span>
            </button>

            {/* عضویت‌ها در بازارها */}
            <div className={CARD_CLS + ' p-4'}>
                <h3 className="flex items-center gap-1.5 text-sm font-extrabold text-on-surface mb-1">
                    <Globe className="w-4 h-4 text-primary" /> انتشار در بازارها
                </h3>
                <p className="text-[11px] text-on-surface-variant leading-6 mb-3">
                    با انتشار، کالاهای دارای قیمت معتبر در تابلوی قیمت بازار هم نمایش داده می‌شوند.
                </p>
                {memberships.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-outline-variant/50 dark:border-gray-700 p-4 text-center">
                        <p className="text-xs text-on-surface-variant leading-6">
                            این کاتالوگ هنوز عضو هیچ بازاری نیست.<br />وقتی مدیر بازار کاتالوگت را عضو کند، اینجا فعال می‌شود.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {memberships.map((m: any) => {
                            const effectiveState = m.publishState ?? (m.status === 'active' ? 'published' : null);
                            const chip = PUB_CHIP[effectiveState ?? m.status] ?? PUB_CHIP.paused;
                            const isOn = effectiveState === 'published';
                            return (
                                <div key={m.slug} className="rounded-lg border border-outline-variant/40 dark:border-gray-700 p-3 flex items-center gap-3">
                                    <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0', chip.cls)}>
                                        <chip.icon className="w-3 h-3" /> {chip.label}
                                    </span>
                                    <span className="text-xs font-bold text-on-surface flex-1 min-w-0 truncate">
                                        {m.armName || m.arm?.name || m.slug}
                                    </span>
                                    {m.status === 'pending' ? (
                                        <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex-shrink-0">⏳ تایید مدیر</span>
                                    ) : m.status === 'paused' && m.publishState !== 'published' ? (
                                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex-shrink-0">عضویت متوقف شده</span>
                                    ) : (
                                        <button onClick={() => togglePublish(m, isOn)}
                                                className={cn('relative w-11 h-6 rounded-full transition-colors flex-shrink-0',
                                                    isOn ? 'bg-primary' : 'bg-outline-variant/50')}>
                                            <span className={cn('absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all',
                                                isOn ? 'right-0.5' : 'right-[1.375rem]')} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* تیک اعتماد */}
            <button onClick={onVerify}
                    className={CARD_CLS + ' p-4 flex items-center gap-3.5 text-right hover:border-primary/40 transition-colors'}>
                <span className="w-11 h-11 rounded-xl bg-surface-container-high dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="w-5 h-5 text-on-surface-variant" />
                </span>
                <span className="flex-1">
                    <span className="block text-sm font-bold text-on-surface">تیک اعتماد کسب‌وکار</span>
                    <span className="block text-[11px] text-on-surface-variant mt-0.5">
                        {currentCatalog.verificationStatus === 'approved' ? 'تایید شده' : 'با ارسال مدارک، نشان اعتماد بگیر'}
                    </span>
                </span>
            </button>
        </div>
    );
}
