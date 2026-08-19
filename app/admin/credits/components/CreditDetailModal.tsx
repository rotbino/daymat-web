// app/admin/credits/components/CreditDetailModal.tsx
'use client';

import React from 'react';
import { X, CreditCard, User, Building2, MapPin, Calendar, Hash, Info, Globe, Wallet, Receipt } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface Props { credit: any; isOpen: boolean; onClose: () => void; }

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011';

export function CreditDetailModal({ credit, isOpen, onClose }: Props) {
    if (!isOpen || !credit) return null;

    const metadata = credit.metadata || {};

    // مسیر تصویر
    const getImageUrl = (fileId: string) => {
        if (!fileId) return '';
        if (fileId.startsWith('http')) return fileId;
        const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
        return `${base}/file/${fileId}`;
    };

    const receiptUrl = getImageUrl(credit.receiptImage);
    const avatarUrl = getImageUrl(credit.user?.avatarFileId);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-surface w-full max-w-xl rounded-2xl shadow-2xl border border-outline-variant max-h-[90vh] overflow-y-auto">
                {/* هدر */}
                <div className="flex items-center justify-between px-5 py-4 border-b sticky top-0 bg-surface rounded-t-2xl z-10">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center",
                            credit.status === 'success' ? 'bg-green-100 text-green-600' :
                                credit.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                        )}>
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-on-surface">تراکنش #{credit.id?.slice(-8)}</h3>
                            <p className="text-xs text-on-surface-variant">
                                {credit.status === 'success' ? 'موفق' : credit.status === 'pending' ? 'در انتظار تأیید' : 'ناموفق'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-surface-container-high rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* محتوا */}
                <div className="p-5 space-y-5">
                    {/* کارت مبلغ */}
                    <div className={cn(
                        "rounded-xl p-4 text-center",
                        credit.status === 'success' ? 'bg-green-50 border border-green-200' :
                            credit.status === 'pending' ? 'bg-yellow-50 border border-yellow-200' : 'bg-red-50 border border-red-200'
                    )}>
                        <p className="text-2xl font-bold text-on-surface">
                            {credit.amount?.toLocaleString()} <span className="text-sm font-normal text-on-surface-variant">تومان</span>
                        </p>
                        <p className="text-sm text-on-surface-variant mt-1">
                            {credit.creditCount?.toLocaleString()} اعتبار
                            {credit.pricePerCredit && <span> (هر اعتبار {credit.pricePerCredit.toLocaleString()} تومان)</span>}
                        </p>
                    </div>

                    {/* اطلاعات تراکنش */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <DetailItem icon={User} label="کاربر" value={credit.user?.fullName || '-'} sub={credit.user?.phone} />
                        <DetailItem icon={Building2} label="کسب‌وکار" value={credit.business?.name || '-'} />
                        <DetailItem icon={Globe} label="بازار" value={credit.arm?.name || '-'} />
                        <DetailItem icon={MapPin} label="موقعیت" value={[credit.business?.city, credit.business?.province].filter(Boolean).join('، ') || '-'} />
                        <DetailItem icon={Wallet} label="روش پرداخت" value={credit.paymentMethod === 'online' ? 'پرداخت آنلاین' : 'کارت به کارت (فیشی)'} />
                        <DetailItem icon={Info} label="نوع اعتبار" value={credit.creditType === 'purchased' ? 'خریداری شده' : credit.creditType || '-'} />
                        <DetailItem icon={Calendar} label="تاریخ" value={new Date(credit.createdAt).toLocaleDateString('fa-IR')} />
                        <DetailItem icon={Hash} label="شناسه" value={credit.id?.slice(-12)} mono />
                    </div>

                    {/* توضیحات */}
                    {credit.description && (
                        <div className="bg-surface-container-low rounded-xl p-4">
                            <p className="text-xs text-on-surface-variant mb-1 font-medium">توضیحات</p>
                            <p className="text-sm text-on-surface">{credit.description}</p>
                        </div>
                    )}

                    {/* یادداشت کاربر (فیشی) */}
                    {credit.receiptNote && (
                        <div className="bg-surface-container-low rounded-xl p-4">
                            <p className="text-xs text-on-surface-variant mb-1 font-medium">یادداشت کاربر</p>
                            <p className="text-sm text-on-surface">{credit.receiptNote}</p>
                        </div>
                    )}

                    {/* تصویر فیش */}
                    {receiptUrl && (
                        <div className="bg-surface-container-low rounded-xl p-4">
                            <p className="text-xs text-on-surface-variant mb-3 font-medium flex items-center gap-1.5">
                                <Receipt className="w-4 h-4" />
                                تصویر رسید پرداخت
                            </p>
                            <div className="bg-surface rounded-xl border border-outline-variant/20 overflow-hidden relative w-full" style={{ minHeight: '200px' }}>
                                <Image
                                    src={receiptUrl}
                                    alt="رسید پرداخت"
                                    fill
                                    className="object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => window.open(receiptUrl, '_blank')}
                                    onError={() => console.error('❌ Failed to load receipt:', receiptUrl)}
                                    unoptimized
                                />
                            </div>
                        </div>
                    )}

                    {/* اطلاعات فیش */}
                    {credit.paymentMethod === 'manual' && (
                        <div className="bg-surface-container-low rounded-xl p-4 space-y-2">
                            <p className="text-xs text-on-surface-variant font-medium">جزئیات پرداخت فیشی</p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {metadata.verified_by && (
                                    <div>
                                        <span className="text-xs text-on-surface-variant">تأییدکننده: </span>
                                        <span className="text-on-surface">{metadata.verified_by_name || metadata.verified_by}</span>
                                    </div>
                                )}
                                {metadata.verified_at && (
                                    <div>
                                        <span className="text-xs text-on-surface-variant">تاریخ تأیید: </span>
                                        <span className="text-on-surface">{new Date(metadata.verified_at).toLocaleDateString('fa-IR')}</span>
                                    </div>
                                )}
                                {metadata.currencySymbol && (
                                    <div>
                                        <span className="text-xs text-on-surface-variant">واحد پولی: </span>
                                        <span className="text-on-surface">{metadata.currencySymbol}</span>
                                    </div>
                                )}
                                {credit.receiptNote && (
                                    <div className="col-span-2">
                                        <span className="text-xs text-on-surface-variant">یادداشت: </span>
                                        <span className="text-on-surface">{credit.receiptNote}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function DetailItem({ icon: Icon, label, value, sub, mono }: { icon: any; label: string; value: string; sub?: string; mono?: boolean }) {
    return (
        <div className="bg-surface-container-low rounded-xl p-3">
            <p className="text-[10px] text-on-surface-variant flex items-center gap-1.5 mb-1">
                <Icon className="w-3.5 h-3.5" />{label}
            </p>
            <p className={cn("text-sm font-medium text-on-surface", mono && "font-mono text-xs")}>{value}</p>
            {sub && <p className="text-[10px] text-on-surface-variant/60 mt-0.5" dir="ltr">{sub}</p>}
        </div>
    );
}