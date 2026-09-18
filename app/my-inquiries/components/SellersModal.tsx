// app/my-inquiries/components/SellersModal.tsx
// ✅ مدال «فروشندگان این کالا» — سمت بازوی خرید:
//    به‌جای لیستِ زیرِ کالا، لینکِ تمیزِ روی ردیف این مدال را باز می‌کند.
//    هر ردیف = یک بازوی فروش واقعی که همین کالا را با قیمت فعال می‌فروشد:
//    نام کسب‌وکار + نام صاحب بازو + شهر + ازِ قیمت + دکمهٔ تماس و درخواست تامین.
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Check, Loader2, Phone, Store, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { faPrice } from '../../inquiries/utils';
import { useAddInquiryMember, useRevealContact } from '@/lib/api/apiHooks';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    itemName: string;
    itemId: string;
    productReferenceId?: string | null;
    suppliers: any[];
    /** بازوی خریدِ مبدأ — برای درخواست تامین */
    inquiryId: string;
}

export default function SellersModal({ isOpen, onClose, itemName, itemId, productReferenceId, suppliers, inquiryId }: Props) {
    const reveal = useRevealContact();
    const addMember = useAddInquiryMember();
    // شمارهٔ افشاشده به تفکیک بازوی فروش — بعد از reveal، دکمه به لینک تماس تبدیل می‌شود
    const [phones, setPhones] = useState<Record<string, string>>({});
    const [invited, setInvited] = useState<Set<string>>(new Set());

    if (!isOpen) return null;

    const handleReveal = async (s: any) => {
        if (phones[s.catalogId]) return;
        try {
            const res = await reveal.mutateAsync({
                side: 'seller',
                catalogId: s.catalogId,
                itemId,
                productReferenceId: productReferenceId || undefined,
            });
            setPhones((p) => ({ ...p, [s.catalogId]: res.phone }));
        } catch {
            // toast در هوک هندل می‌شود
        }
    };

    const handleInvite = async (s: any) => {
        try {
            await addMember.mutateAsync({ inquiryId, catalogId: s.catalogId });
            setInvited((prev) => new Set(prev).add(s.catalogId));
            toast.success(`درخواست تامین برای «${s.businessName || s.name}» ثبت شد`);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ارسال درخواست ناموفق بود');
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
                        <span className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <Store className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
                        </span>
                        <div className="min-w-0">
                            <h3 className="text-sm font-extrabold text-on-surface">فروشندگان این کالا</h3>
                            <p className="text-[10px] text-on-surface-variant/70 truncate max-w-[260px]">{itemName}</p>
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

                {/* بدنه — لیست بازوهای فروش */}
                <div className="flex-1 min-h-0 overflow-y-auto scrollbar-slim px-3 py-3 space-y-2">
                    {suppliers.map((s) => {
                        const phone = phones[s.catalogId];
                        const alreadyInvited = invited.has(s.catalogId);
                        return (
                            <div
                                key={s.catalogId}
                                className="rounded-xl border border-outline-variant/30 bg-surface-container-lowest/60 p-2.5"
                            >
                                <div className="flex items-start gap-2.5">
                                    {/* لوگو/مونوگرام */}
                                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface-container-high flex-shrink-0 relative grid place-items-center">
                                        {s.logoUrl ? (
                                            <Image src={s.logoUrl} alt="" fill sizes="40px" className="object-cover" unoptimized />
                                        ) : (
                                            <span className="text-sm font-black text-on-surface-variant/50">
                                                {(s.businessName || s.name || '؟').trim().charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-extrabold text-on-surface">
                                            {s.businessName || s.name}
                                        </p>
                                        <p className="mt-0.5 truncate text-[10.5px] font-bold text-on-surface-variant/80">
                                            {s.ownerName ? <span>صاحب بازو: {s.ownerName}</span> : s.name}
                                            {s.city && <span className="text-on-surface-variant/50"> · {s.city}</span>}
                                        </p>
                                        <div className="mt-1 flex flex-wrap items-center gap-1">
                                            {!isNaN(Number(s.minPrice)) && Number(s.minPrice) > 0 && (
                                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[9.5px] font-black text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                                                    از {faPrice(s.minPrice)}{s.unitTitle && s.unitTitle !== 'عدد' ? ` / ${s.unitTitle}` : ''}
                                                </span>
                                            )}
                                            {s.sameCity && (
                                                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9.5px] font-black text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">
                                                    هم‌شهری شما
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* اکشن‌ها */}
                                <div className="mt-2 flex items-center gap-1.5">
                                    {phone ? (
                                        <a
                                            href={`tel:${phone}`}
                                            dir="ltr"
                                            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-[11px] font-extrabold text-white transition-colors hover:bg-emerald-700"
                                        >
                                            <Phone className="size-3.5" />
                                            {phone}
                                        </a>
                                    ) : (
                                        <button
                                            onClick={() => handleReveal(s)}
                                            disabled={reveal.isPending}
                                            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 text-[11px] font-extrabold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                                        >
                                            {reveal.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Phone className="size-3.5" />}
                                            تماس با فروشنده
                                        </button>
                                    )}
                                    {alreadyInvited ? (
                                        <span className="flex h-8 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-50 text-[10.5px] font-extrabold text-emerald-600 dark:bg-emerald-500/10">
                                            <Check className="size-3.5" /> درخواست تامین ارسال شد
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleInvite(s)}
                                            disabled={addMember.isPending}
                                            className="flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-outline-variant/50 text-[10.5px] font-bold text-on-surface-variant transition-colors hover:border-brand-contrast/40 hover:text-brand-contrast disabled:opacity-50"
                                        >
                                            <UserPlus className="size-3.5" />
                                            درخواست تامین
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* فوتر راهنما */}
                <div className="flex-shrink-0 border-t border-outline-variant/20 px-4 py-2.5">
                    <p className="text-center text-[9.5px] font-bold text-on-surface-variant/60">
                        همین کالا را فعال می‌فروشند — هم‌شهری‌ها اول آمده‌اند
                    </p>
                </div>
            </div>
        </div>
    );
}
