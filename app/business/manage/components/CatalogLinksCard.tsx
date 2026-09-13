// app/business/manage/components/CatalogLinksCard.tsx
// 🔗 لینک کاتالوگ‌های این کسب‌وکار — کپی و مشاهده + ساخت کاتالوگ جدید
'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Copy, ExternalLink, Plus, Check, Store } from 'lucide-react';
import { toast } from 'sonner';

export interface ManageCatalogItem {
    id: string;
    name: string;
    slug?: string | null;
    salesType?: string;
    status?: string;
}

const SALES_LABEL: Record<string, string> = { wholesale: 'عمده', retail: 'خرده', both: 'عمده و خرده' };

export function CatalogLinksCard({ catalogs }: { catalogs: ManageCatalogItem[] }) {
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const copyLink = async (slug: string, id: string) => {
        try {
            await navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
            setCopiedId(id);
            toast.success('لینک کاتالوگ کپی شد');
            setTimeout(() => setCopiedId(null), 1600);
        } catch {
            toast.error('کپی نشد — دستی انتخاب و کپی کن');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4 sm:p-5 space-y-3">
            {/* هدر */}
            <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-primary/10 grid place-items-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-primary" />
                </span>
                <div className="flex-1">
                    <p className="text-[13px] font-extrabold text-on-surface">کاتالوگ‌های این کسب‌وکار</p>
                    <p className="text-[10px] text-on-surface-variant/70">
                        {catalogs.length > 0
                            ? `${catalogs.length.toLocaleString('fa-IR')} کاتالوگ فعال`
                            : 'هنوز کاتالوگی نساخته‌اید'}
                    </p>
                </div>
                <Link
                    href="/business/register"
                    className="h-8 px-3 rounded-lg border border-primary/30 text-primary text-[10px] font-extrabold flex items-center gap-1 hover:bg-primary/5 active:scale-95 transition-all flex-shrink-0"
                >
                    <Plus className="w-3.5 h-3.5" /> کاتالوگ جدید
                </Link>
            </div>

            {/* لیست */}
            {catalogs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-outline-variant/50 p-4 flex flex-col items-center gap-2 text-center">
                    <Store className="w-6 h-6 text-on-surface-variant/40" />
                    <p className="text-[11px] text-on-surface-variant leading-4">
                        با ساخت کاتالوگ، محصولات این کسب‌وکار را برای خریداران به نمایش بگذارید.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {catalogs.map((c) => (
                        <div
                            key={c.id}
                            className="rounded-xl border border-outline-variant/40 dark:border-gray-700/70 p-3 flex items-center gap-2.5"
                        >
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-bold text-on-surface truncate">{c.name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    {c.slug && (
                                        <span className="text-[10px] text-on-surface-variant/70 truncate" dir="ltr">
                                            /{c.slug}
                                        </span>
                                    )}
                                    {c.salesType && SALES_LABEL[c.salesType] && (
                                        <span className="text-[9px] font-bold text-primary bg-primary/10 rounded-full px-1.5 py-px flex-shrink-0">
                                            {SALES_LABEL[c.salesType]}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {c.slug && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => copyLink(c.slug!, c.id)}
                                        aria-label="کپی لینک"
                                        className="w-8 h-8 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-primary hover:bg-primary/10 active:scale-90 transition-all flex-shrink-0"
                                    >
                                        {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                                    </button>
                                    <a
                                        href={`/${c.slug}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="مشاهده کاتالوگ"
                                        className="w-8 h-8 rounded-lg grid place-items-center text-on-surface-variant/60 hover:text-primary hover:bg-primary/10 active:scale-90 transition-all flex-shrink-0"
                                    >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
