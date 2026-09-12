// app_/profile/components/CatalogTeamsList.tsx
// عضویت‌های تیم کاتالوگ در پروفایل — سناریوی بازار پخش:
//   • مشتری کاتالوگ (سوپرمارکت): درخواستِ در انتظار تایید + بازاریابِ منتسب + خروج
//   • بازاریاب کاتالوگ (فروشنده): وضعیت + خروج
// همه‌چیز با تاریخ دقیق — هم‌راستا با پروندهٔ عضویت بازار
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Store, MapPin, Loader2, Check, X, LogOut, ChevronLeft, Hourglass } from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CARD_CLS } from '@/app/my-catalogs/constants';

const faDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

export default function CatalogTeamsList() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const [busy, setBusy] = useState<string | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['catalog-team-memberships'],
        queryFn: () => apiService.catalog.team.getMyMemberships(),
        staleTime: 30_000,
    });

    const rows = (data || []).filter((m: any) => m.customerStatus || m.sellerStatus);
    if (isLoading) return null;
    if (!rows.length) return null;

    const refresh = () => queryClient.invalidateQueries({ queryKey: ['catalog-team-memberships'] });

    const run = async (key: string, fn: () => Promise<any>, msg: string) => {
        setBusy(key);
        try {
            await fn();
            toast.success(msg);
            refresh();
        } catch (e: any) {
            toast.error(e?.data?.message || e?.message || 'خطا در انجام عملیات');
        } finally {
            setBusy(null);
        }
    };

    return (
        <div className={cn(CARD_CLS, 'p-4')}>
            <p className="font-bold text-sm text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                تیم‌های کاتالوگ
            </p>
            <div className="space-y-2.5">
                {rows.map((m: any) => {
                    const catName = m.catalog?.name || 'کاتالوگ';
                    return (
                        <div key={m.id} className="p-3 rounded-xl border border-outline-variant/30 dark:border-gray-800">
                            {/* کاتالوگ */}
                            <button
                                onClick={() => router.push(m.catalog?.slug ? `/c/${m.catalog.slug}` : '/my-catalogs')}
                                className="flex items-center gap-2 text-primary text-xs font-bold mb-2 hover:underline"
                            >
                                <Store className="w-3.5 h-3.5" />
                                {catName}
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>

                            {/* لِین مشتری */}
                            {m.customerStatus && m.customerStatus !== 'removed' && (
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                                            مشتری{m.customerBusinessName ? ` — ${m.customerBusinessName}` : ''}
                                            {m.customerStatus === 'pending' && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-300 font-bold mr-1.5">
                                                    <Hourglass className="w-3 h-3 inline -mt-0.5" /> در انتظار تایید شما
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {m.assignedSeller
                                                ? `بازاریاب شما: ${m.assignedSeller.fullName || m.assignedSeller.businessName}${m.assignedSeller.phone ? ` · ${m.assignedSeller.phone}` : ''}`
                                                : 'بدون بازاریاب منتسب'}
                                            {m.customerJoinedAt && ` · مشتری از ${faDate(m.customerJoinedAt)}`}
                                        </p>
                                    </div>
                                    {m.customerStatus === 'pending' ? (
                                        busy === `cf-${m.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                            <div className="flex gap-1.5 flex-shrink-0">
                                                <button
                                                    onClick={() => run(`cf-${m.id}`, () => apiService.catalog.team.confirmCustomer(m.catalog.id, m.id), 'تایید شد — تماس‌تان به بازاریاب خودتان می‌رسد')}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => run(`dc-${m.id}`, () => apiService.catalog.team.declineCustomer(m.catalog.id, m.id), 'ثبت رد شد')}
                                                    className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        )
                                    ) : (
                                        busy === `lc-${m.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('عضویت مشتری‌تان در این کاتالوگ لغو شود؟')) {
                                                        run(`lc-${m.id}`, () => apiService.catalog.team.leaveAsCustomer(m.catalog.id), 'عضویت مشتری لغو شد');
                                                    }
                                                }}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex-shrink-0"
                                                title="خروج از مشتری‌بودن"
                                            >
                                                <LogOut className="w-4 h-4" />
                                            </button>
                                        )
                                    )}
                                </div>
                            )}

                            {/* لِین فروشنده */}
                            {m.sellerStatus && m.sellerStatus !== 'removed' && (
                                <div className="flex items-center gap-3 mt-2 pt-2 border-t border-outline-variant/20 dark:border-gray-800">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                                            بازاریاب{m.sellerStatus === 'pending' && (
                                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/25 text-amber-700 dark:text-amber-300 font-bold mr-1.5">در انتظار تایید اونر</span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {m.sellerBusinessName || ''}
                                            {m.sellerRegion && (
                                                <><MapPin className="w-3 h-3 inline -mt-0.5" /> {m.sellerRegion}</>
                                            )}
                                            {m.sellerJoinedAt && ` · عضو از ${faDate(m.sellerJoinedAt)}`}
                                        </p>
                                    </div>
                                    {m.sellerStatus === 'active' && (
                                        busy === `ls-${m.id}` ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('از تیم فروش این کاتالوگ خارج شوید؟')) {
                                                        run(`ls-${m.id}`, () => apiService.catalog.team.leaveAsSeller(m.catalog.id), 'از تیم خارج شدید');
                                                    }
                                                }}
                                                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 flex-shrink-0"
                                                title="خروج از تیم"
                                            >
                                                <LogOut className="w-4 h-4" />
                                            </button>
                                        )
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
