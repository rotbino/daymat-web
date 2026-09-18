// app/my-catalogs/components/BuyersModal.tsx
// ✅ مدال «خریداران این کالا» — سمت بازوی فروش (جهتِ تازهٔ مچینگ):
//    بازوهای خریدی که همین کالا را فعالانه برای قیمت‌گیری خواسته‌اند:
//    نام خریدار + کسب‌وکار + حجم سفارش + برآورد ارزش با قیمتِ خودِ فروشنده
//    (سطحِ زنجیره: خرده/عمده/بنکداری) + دکمهٔ تماس (شماره فقط با reveal).
'use client';

import React, { useState } from 'react';
import { Ban, Clock, Loader2, Package, Phone, X } from 'lucide-react';
import { useAdBuyers, useRevealContact } from '@/lib/api/apiHooks';
import { tierLabel } from '@/lib/match';
import { faPrice } from '../../inquiries/utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    ad: any;
}

export default function BuyersModal({ isOpen, onClose, ad }: Props) {
    const { data, isLoading } = useAdBuyers(ad?.id, isOpen);
    const reveal = useRevealContact();
    const [phones, setPhones] = useState<Record<string, string>>({});

    if (!isOpen || !ad) return null;

    const buyers: any[] = data?.buyers ?? [];
    const unit = ad.unit?.title || ad.unit?.shortCode || '';

    const handleReveal = async (b: any) => {
        if (phones[b.inquiryId]) return;
        try {
            const res = await reveal.mutateAsync({
                side: 'buyer',
                inquiryId: b.inquiryId,
                adId: ad.id,
                itemId: b.itemId,
                productReferenceId: ad.productReferenceId || undefined,
            });
            setPhones((p) => ({ ...p, [b.inquiryId]: res.phone }));
        } catch {
            // toast در هوک هندل می‌شود
        }
    };

    return (
        <div
            className="fixed inset-0 z-[96] flex items-end sm:items-center justify-center bg-black/50 animate-in fade-in duration-200"
            onClick={() => onClose()}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-surface w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl
                    max-h-[85dvh] flex flex-col overflow-hidden
                    animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-300"
            >
                {/* هدر */}
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-outline-variant/20">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                            <Package className="w-4.5 h-4.5 text-blue-600 dark:text-blue-400" />
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-sm font-extrabold text-on-surface">خریداران این کالا</h3>
                            <p className="text-[10px] text-on-surface-variant/70 truncate max-w-[260px]">
                                {ad.productType || ad.title}
                                {ad.unitPrice ? ` — قیمت شما: ${faPrice(ad.unitPrice)} تومان/${unit}` : ''}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="بستن"
                        className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* بدنه */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-3 py-3 space-y-2">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="size-6 animate-spin text-on-surface-variant/40" />
                        </div>
                    ) : buyers.length === 0 ? (
                        <p className="py-10 text-center text-xs font-bold text-on-surface-variant/60">
                            فعلا خریدار فعالی برای این کالا نیست
                        </p>
                    ) : (
                        buyers.map((b) => {
                            const tier = tierLabel(b.tier);
                            const phone = phones[b.inquiryId];
                            return (
                                <div
                                    key={b.inquiryId}
                                    className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest/60 p-2.5"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-[13px] font-extrabold text-on-surface">
                                                {b.businessName || b.buyerName || 'خریدار'}
                                                {b.businessName && b.buyerName && (
                                                    <span className="text-[10px] font-bold text-on-surface-variant/60"> ({b.buyerName})</span>
                                                )}
                                            </p>
                                            <p className="mt-0.5 truncate text-[10.5px] font-bold text-on-surface-variant/80">
                                                {b.inquiryTitle}
                                                {b.city && <span className="text-on-surface-variant/50"> · {b.city}</span>}
                                            </p>
                                            <div className="mt-1 flex flex-wrap items-center gap-1">
                                                {(b.quantity || b.unitTitle) && (
                                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9.5px] font-black text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                                        می‌خواهد: {b.quantity ?? '—'} {b.unitTitle ?? ''}
                                                    </span>
                                                )}
                                                {b.estimatedValue && (
                                                    <span
                                                        title="برآورد ارزش سفارش با قیمتِ خودِ شما"
                                                        className="rounded-full bg-amber-50 px-2 py-0.5 text-[9.5px] font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                                                    >
                                                        ~{faPrice(b.estimatedValue)} تومان
                                                    </span>
                                                )}
                                                {tier && (
                                                    <span className={`rounded-full px-2 py-0.5 text-[9.5px] font-black ${tier.cls}`}>
                                                        {tier.label}
                                                    </span>
                                                )}
                                                {b.sameCity && (
                                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                        هم‌شهری شما
                                                    </span>
                                                )}
                                                {b.memberStatus === 'active' && (
                                                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-black text-emerald-600 dark:bg-emerald-500/10">
                                                        عضو بازوی خریدش هستید
                                                    </span>
                                                )}
                                                {b.memberStatus === 'pending' && (
                                                    <span className="flex items-center gap-0.5 rounded-full bg-stone-100 px-2 py-0.5 text-[9.5px] font-black text-stone-500 dark:bg-gray-800 dark:text-gray-400">
                                                        <Clock className="size-2.5" /> در انتظار پذیرش
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* اکشن تماس — اگر خریدار تماس مستقیم را بسته باشد اصلا رندر نمی‌شود */}
                                    {b.contactAllowed ? (
                                        phone ? (
                                            <a
                                                href={`tel:${phone}`}
                                                dir="ltr"
                                                className="mt-2 flex h-8 items-center justify-center gap-1.5 rounded-lg bg-brand-contrast text-[11px] font-extrabold text-white transition-colors hover:bg-brand-contrast-strong"
                                            >
                                                <Phone className="size-3.5" />
                                                {phone}
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => handleReveal(b)}
                                                disabled={reveal.isPending}
                                                className="mt-2 flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-brand-contrast text-[11px] font-extrabold text-white transition-colors hover:bg-brand-contrast-strong disabled:opacity-50"
                                            >
                                                {reveal.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Phone className="size-3.5" />}
                                                تماس با خریدار
                                            </button>
                                        )
                                    ) : (
                                        <p className="mt-2 flex items-center justify-center gap-1 rounded-lg bg-stone-50 py-2 text-[10px] font-bold text-stone-400 dark:bg-gray-800/60 dark:text-gray-500">
                                            <Ban className="size-3" />
                                            این خریدار تماس مستقیم را بسته
                                        </p>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>

                {/* فوتر راهنما */}
                <div className="flex-shrink-0 border-t border-outline-variant/20 px-4 py-2.5">
                    <p className="text-center text-[9.5px] font-bold text-on-surface-variant/60">
                        این خریدارها همین کالا را در حال قیمت‌گیری‌اند — هم‌شهری‌ها و سفارش‌های بزرگ‌تر اول‌اند
                    </p>
                </div>
            </div>
        </div>
    );
}
