// app/my-catalogs/components/PublishTab.tsx
'use client';

import React, { useState } from 'react';
import { ExternalLink, Globe, IdCard, Loader2, Share2, LogOut, Undo2, X, Calendar } from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CARD_CLS, PUB_CHIP } from '../constants';

interface Props {
    currentCatalog: any;
    memberships: any[];
    onShare: () => void;
    onEditCatalog: () => void;
    onRefreshAll: () => void;
    /** 🪪 استودیوی کارت ویزیت — بنا بر خواستهٔ کاربر داخل تب انتشار */
    onOpenCard: () => void;
    /** کارت ذخیره‌شده (metadata.visitCard) — با بودنش پیش‌نمایش کارت نشان داده می‌شود */
    savedCard?: any;
}

/** تب انتشار — اشتراک‌گذاری، کارت ویزیت و مدیریت عضویت‌ها در بازارها */
export default function PublishTab({ currentCatalog, memberships, onShare, onEditCatalog, onRefreshAll, onOpenCard, savedCard }: Props) {
    const queryClient = useQueryClient();

    // ✅ لغوِ عضویت فقط با تصمیمِ مالکِ بازار — تایید دومرحله‌ای با تایپ عنوان یا اسلاگ کاتالوگ؛
    //    درخواست به پنل مالک می‌رود و تا تاییدِ او، عضویت و مزایایش برقرار است
    const [leaveTarget, setLeaveTarget] = useState<any>(null);
    const [leaveConfirmText, setLeaveConfirmText] = useState('');
    const [leaveReason, setLeaveReason] = useState('');
    const [leaving, setLeaving] = useState(false);
    const [withdrawingSlug, setWithdrawingSlug] = useState<string | null>(null);

    const leaveValid =
        !!leaveTarget &&
        (leaveConfirmText.trim() === currentCatalog?.name ||
         leaveConfirmText.trim() === currentCatalog?.slug);

    const submitLeaveRequest = async () => {
        if (!leaveTarget) return;
        setLeaving(true);
        try {
            await apiService.arm.requestLeave(leaveTarget.slug, {
                roleType: 'seller',
                catalogId: currentCatalog.id,
                reason: leaveReason.trim() || undefined,
            });
            toast.success(`درخواست لغو عضویت در ${(leaveTarget.armName || leaveTarget.name || 'بازار')} ثبت شد — تا تایید مالک، عضویتتان برقرار است`);
            queryClient.invalidateQueries({ queryKey: ['arms'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-derived'] });
            setLeaveTarget(null);
            setLeaveConfirmText('');
            setLeaveReason('');
            onRefreshAll();
        } catch (e: any) {
            toast.error(e?.data?.message || e?.message || 'خطا در ثبت درخواست لغو عضویت');
        } finally {
            setLeaving(false);
        }
    };

    const withdrawLeaveRequest = async (m: any) => {
        setWithdrawingSlug(m.slug);
        try {
            await apiService.arm.withdrawLeave(m.slug);
            toast.success('درخواست لغو برداشته شد — عضویتتان مثل قبل برقرار است');
            queryClient.invalidateQueries({ queryKey: ['arms'] });
            queryClient.invalidateQueries({ queryKey: ['notifications-derived'] });
            onRefreshAll();
        } catch (e: any) {
            toast.error(e?.data?.message || 'خطا در پس‌گرفتن درخواست');
        } finally {
            setWithdrawingSlug(null);
        }
    };

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

            {/* 🪪 ساخت کارت ویزیت کاتالوگ — بنا بر خواستهٔ کاربر داخل تب انتشار */}
            {/* اگر کارت ذخیره‌شده دارد، پیش‌نمایشش همین‌جا دیده می‌شود تا زحمت کاربر از بین نرود */}
            {(() => {
                const cardPreview = typeof savedCard?.preview === 'string' && savedCard.preview.startsWith('data:image')
                    ? savedCard.preview : null;
                const savedLabel = savedCard?.updatedAt
                    ? new Date(savedCard.updatedAt).toLocaleDateString('fa-IR')
                    : null;
                if (cardPreview) {
                    return (
                        <button onClick={onOpenCard}
                                className={cn(CARD_CLS, 'p-3.5 w-full flex items-center gap-3.5 text-right hover:border-primary/40 transition-colors')}>
                            <span className="w-[72px] h-[41px] rounded-lg overflow-hidden ring-1 ring-outline-variant/40 dark:ring-gray-700
                                    bg-white flex-shrink-0 shadow-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={cardPreview} alt="کارت ویزیت کاتالوگ" className="w-full h-full object-cover" />
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-sm font-extrabold text-on-surface">کارت ویزیت کاتالوگ</span>
                                <span className="block text-[11px] text-on-surface-variant mt-0.5 truncate">
                                    {savedLabel ? `ذخیره‌شده در ${savedLabel} — ` : 'ذخیره‌شده — '}برای ویرایش لمس کن
                                </span>
                            </span>
                            <IdCard className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        </button>
                    );
                }
                return (
                    <button onClick={onOpenCard}
                            className="w-full bg-gradient-to-l from-amber-500/10 to-amber-500/5 border border-amber-500/25 dark:border-amber-500/20
                                rounded-lg p-4 flex items-center gap-3.5 text-right hover:border-amber-500/50 transition-colors">
                        <span className="w-11 h-11 rounded-xl bg-amber-500/15 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                            <IdCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                        </span>
                        <span className="flex-1 min-w-0">
                            <span className="block text-sm font-extrabold text-amber-700 dark:text-amber-300">ساخت کارت ویزیت کاتالوگ</span>
                            <span className="block text-[11px] text-on-surface-variant mt-0.5">طرح چاپی ۹×۵ با لوگو و QR کاتالوگ</span>
                        </span>
                    </button>
                );
            })()}

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
                            const joinedLabel = m.joinedAt
                                ? new Date(m.joinedAt).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' })
                                : null;
                            return (
                                <div key={m.slug} className="rounded-lg border border-outline-variant/40 dark:border-gray-700 p-3">
                                    <div className="flex items-center gap-3">
                                        <span className={cn('inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full flex-shrink-0', chip.cls)}>
                                            <chip.icon className="w-3 h-3" /> {chip.label}
                                        </span>
                                        <span className="text-xs font-bold text-on-surface flex-1 min-w-0 truncate">
                                            {m.armName || m.name || m.arm?.name || m.slug}
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
                                    {/* ✅ تاریخ عضویت + درخواست لغو — لغو فقط با تایید مالک بازار */}
                                    <div className="mt-2 pt-2 border-t border-outline-variant/20 dark:border-gray-700/60 flex items-center justify-between gap-2">
                                        <span className="text-[10px] text-on-surface-variant/70 flex items-center gap-1 min-w-0">
                                            {joinedLabel && (<><Calendar className="w-3 h-3 flex-shrink-0" />عضو از {joinedLabel}</>)}
                                        </span>
                                        {m.pendingLeaveRequest ? (
                                            // ✅ درخواست لغوی در انتظار — پس‌گرفتنِ درخواست
                                            <button type="button" disabled={withdrawingSlug === m.slug}
                                                    onClick={() => withdrawLeaveRequest(m)}
                                                    className="text-[10px] font-bold text-amber-600 dark:text-amber-400
                                                        hover:text-amber-700 flex items-center gap-1 flex-shrink-0
                                                        transition-colors disabled:opacity-50">
                                                {withdrawingSlug === m.slug
                                                    ? <Loader2 className="w-3 h-3 animate-spin" />
                                                    : <Undo2 className="w-3 h-3" />}
                                                درخواست لغو ثبت شده — پس گرفتن
                                            </button>
                                        ) : (m.status === 'active' || m.status === 'paused') && (
                                            <button type="button" onClick={() => { setLeaveTarget(m); setLeaveConfirmText(''); setLeaveReason(''); }}
                                                    className="text-[10px] font-bold text-rose-500/90 hover:text-rose-600
                                                        flex items-center gap-1 flex-shrink-0 transition-colors">
                                                <LogOut className="w-3 h-3" /> درخواست لغو عضویت
                                            </button>
                                        )}
                                    </div>

                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ✅ مودال درخواست لغو عضویت — تایید دومرحله‌ای: تایپ عنوان یا اسلاگ کاتالوگ؛
                درخواست به پنل مالک می‌رود و فقط با تاییدِ او لغو می‌شود */}
            {leaveTarget && (
                <div className="fixed inset-0 z-[80] flex items-end lg:items-center justify-center">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={() => !leaving && setLeaveTarget(null)} />
                    <div className="relative w-full max-w-md bg-white dark:bg-gray-900 z-10 rounded-t-3xl lg:rounded-2xl shadow-2xl p-5">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-extrabold text-on-surface">درخواست لغو عضویت در {(leaveTarget.armName || leaveTarget.name || leaveTarget.arm?.name)}</h3>
                            <button type="button" onClick={() => setLeaveTarget(null)} aria-label="بستن"
                                    className="p-1.5 rounded-lg hover:bg-surface-container-high">
                                <X className="w-4 h-4 text-on-surface-variant" />
                            </button>
                        </div>
                        <p className="text-[11.5px] text-on-surface-variant leading-6 mb-3">
                            با تاییدِ مالکِ بازار، کالاهایت از تابلوی این بازار برداشته می‌شود و خروجت
                            {' '}<b className="text-on-surface">به‌عنوان خروجِ اختیاریِ خودت ثبت می‌شود</b>{' '}
                            تا مدیر اشتباهی دوباره کاتالوگت را اضافه نکند. تا قبل از تایید، عضویت و مزایایش برقرار است.
                        </p>
                        <p className="text-[11px] text-on-surface mb-1.5">
                            برای تایید، عنوان یا آدرس اختصاصی کاتالوگت را تایپ کن:
                        </p>
                        <input
                            value={leaveConfirmText}
                            onChange={(e) => setLeaveConfirmText(e.target.value)}
                            placeholder={currentCatalog?.name || currentCatalog?.slug || ''}
                            dir="auto"
                            className="w-full h-10 px-3 rounded-xl border border-outline-variant/50 dark:border-gray-700 bg-white dark:bg-gray-800
                                text-[12.5px] text-on-surface outline-none focus:border-rose-400/60 transition-colors"
                        />
                        <textarea
                            value={leaveReason}
                            onChange={(e) => setLeaveReason(e.target.value)}
                            rows={2}
                            maxLength={300}
                            placeholder="دلیل خروجت را بنویس (اختیاری) — به مالک بازار کمک می‌کند تصمیم بهتری بگیرد"
                            className="w-full mt-2 rounded-xl border border-outline-variant/50 dark:border-gray-700 bg-white dark:bg-gray-800
                                p-3 text-[11.5px] text-on-surface leading-6 outline-none focus:border-primary/50 resize-y"
                        />
                        <div className="flex gap-2 mt-4">
                            <button type="button" onClick={() => setLeaveTarget(null)} disabled={leaving}
                                    className="h-10 px-4 rounded-xl border border-outline-variant text-on-surface text-[12.5px] font-bold
                                        hover:bg-surface-container-high disabled:opacity-50">
                                انصراف
                            </button>
                            <button type="button" disabled={!leaveValid || leaving} onClick={submitLeaveRequest}
                                    className="flex-1 h-10 rounded-xl bg-rose-600 text-white text-[12.5px] font-bold
                                        hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5">
                                {leaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                ثبت درخواست لغو
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
