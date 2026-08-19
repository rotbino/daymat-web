// app/credit/report/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { FormHeader } from '@/app/components';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import {
    Loader2, Phone, ArrowUpRight, ArrowDownRight,
    Wallet, ChevronLeft, ChevronRight, PlusCircle, Gift, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CreditTransaction = {
    id: string;
    amount: number;
    creditCount: number;
    transactionType: 'purchase' | 'spend' | 'bonus' | 'refund';
    description: string;
    createdAt: string;
    balanceAfter: number;
};

export default function CreditReportPage() {
    const router = useRouter();
    const supportConfig = (useSelector((state: RootState) => state.arm.currentArm?.config as any)?.support) || {};
    const supportPhone = supportConfig.mobile || supportConfig.phone || null;
    const supportName = supportConfig.name || 'پشتیبانی';

    const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'purchase' | 'spend' | 'bonus'>('all');
    const [pagination, setPagination] = useState({ limit: 10, offset: 0, total: 0 });
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => { fetchReport(); }, [filter, currentPage]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const params: any = { limit: pagination.limit, offset: (currentPage - 1) * pagination.limit };
            if (filter !== 'all') params.type = filter;
            const response = await apiService.credit.getCreditReport(params);
            setTransactions(response.transactions || []);
            setPagination(response.pagination || { limit: 10, offset: 0, total: 0 });
        } catch (error: any) {
            toast.error(error?.message || 'خطا در دریافت گزارش');
        } finally { setLoading(false); }
    };

    const getTypeIcon = (tx: CreditTransaction) => {
        if (tx.transactionType === 'spend') return <ArrowDownRight className="w-4 h-4 text-rose-500" />;
        if (tx.transactionType === 'purchase') return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
        if (tx.transactionType === 'bonus') return <Gift className="w-4 h-4 text-amber-500" />;
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
    };

    const getTypeLabel = (tx: CreditTransaction) => {
        const map = { purchase: 'خرید', spend: 'مصرف', bonus: 'هدیه', refund: 'بازگشت' };
        return map[tx.transactionType] || tx.transactionType;
    };

    return (
        <div className="min-h-screen bg-surface pb-28 relative">
            <button onClick={() => router.push('/credit/purchase')} className="fixed top-3 left-2 z-50 flex items-center gap-1.5 bg-primary text-white px-3.5 py-2 rounded-2xl shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all hover:scale-105 text-sm font-bold">
                <PlusCircle className="w-4 h-4"/><span>خرید اعتبار</span>
            </button>
            <FormHeader title="گزارش اعتبارات" backUrl="/profile" />

            <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 pt-20">
                <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-outline-variant/30 dark:border-gray-800 mb-6">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className="text-sm font-medium text-on-surface-variant">نوع:</span>
                        {(['all','purchase','spend','bonus'] as const).map(m => (
                            <button key={m} onClick={() => setFilter(m)} className={cn("px-4 py-1.5 rounded-xl text-xs font-medium border-2 transition-all", filter===m ? "bg-primary text-white border-primary" : "border-outline-variant/40 hover:border-primary/30")}>
                                {m === 'all' ? 'همه' : m === 'purchase' ? 'خرید' : m === 'spend' ? 'مصرف' : 'هدیه'}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary"/></div>
                    : transactions.length === 0 ? <div className="text-center py-20"><p className="text-base font-medium text-on-surface">شارژ یا مصرف اعتباری ثبت نشده است</p></div>
                        : (
                            <>
                                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/30 overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b bg-surface-container-low"><th className="text-right py-3 px-4 text-xs font-semibold">توضیحات</th><th className="text-right py-3 px-4 text-xs font-semibold">نوع</th><th className="text-right py-3 px-4 text-xs font-semibold">تاریخ</th><th className="text-center py-3 px-4 text-xs font-semibold">تغییر</th><th className="text-center py-3 px-4 text-xs font-semibold">مانده</th></tr></thead>
                                            <tbody>
                                            {transactions.map(tx => (
                                                <tr key={tx.id} className="border-b hover:bg-surface-container-low transition-colors">
                                                    <td className="py-3 px-4"><span className="font-medium text-sm">{tx.description}</span></td>
                                                    <td className="py-3 px-4"><div className="flex items-center gap-1.5">{getTypeIcon(tx)}<span className="text-xs">{getTypeLabel(tx)}</span></div></td>
                                                    <td className="py-3 px-4"><span className="text-xs text-on-surface-variant/60">{new Date(tx.createdAt).toLocaleDateString('fa-IR')}</span></td>
                                                    <td className="py-3 px-4 text-center"><span className={cn("font-bold text-sm", tx.creditCount>0 ? "text-emerald-600" : "text-rose-600")}>{tx.creditCount>0 ? '+' : ''}{tx.creditCount}</span></td>
                                                    <td className="py-3 px-4 text-center"><div className="flex items-center justify-center gap-1 text-xs font-bold text-primary"><Wallet className="w-3 h-3"/><span>{tx.balanceAfter.toLocaleString()}</span></div></td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                {pagination.total > pagination.limit && <div className="text-center text-[10px] text-on-surface-variant/40 mt-3">نمایش {transactions.length} از {pagination.total} تراکنش</div>}
                            </>
                        )}

                {supportPhone && <div className="mt-8 flex justify-center border-t pt-6"><button onClick={() => window.location.href = `tel:${supportPhone}`} className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary text-sm font-medium"><Phone className="w-4 h-4"/><span>{supportName && `${supportName} - `} پشتیبان پرداخت. تماس بگیرید</span></button></div>}
            </main>
        </div>
    );
}