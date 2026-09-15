// app/my-inquiries/components/MembersTab.tsx
// ✅ تب «تامین‌کنندگان» پنل بازوی خرید — شبکهٔ خرید↔فروش:
//    تامین‌کننده‌های تاییدشده این کاتالوگ، اقلام فوری را اول از همه می‌بینند
//    و در تب «بازوی خرید»ی پنل فروششان قیمت می‌دهند.
//    دو مسیر: خریدار دعوت می‌کند (buyer_add → تایید با تامین‌کننده)
//             تامین‌کننده درخواست می‌دهد (supplier_request → تایید با خریدار)
// فلسفهٔ متن: حداقلی — خودِ ساختار می‌گوید چه خبر است.
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
    Handshake, UserPlus, Check, X, Trash2, Loader2, Search,
    Hourglass, ExternalLink, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { useInquiryMembers, useAddInquiryMember, useDecideInquiryMember } from '@/lib/api/apiHooks';
import PhoneContactsPanel from '@/components/share/PhoneContactsPanel';

interface Props {
    inquiryId: string;
    visibility: string;
    /** اسلاگ بازو — برای لینک اشتراک در ماژول مخاطبین */
    slug?: string | null;
}

const card = 'rounded-2xl border border-stone-100 bg-white dark:border-gray-800 dark:bg-gray-900';
const faDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString('fa-IR', { month: 'long', day: 'numeric' }) : '';

export default function MembersTab({ inquiryId, visibility, slug }: Props) {
    const { data: members = [], isLoading } = useInquiryMembers(inquiryId);
    const addMember = useAddInquiryMember();
    const decide = useDecideInquiryMember();

    const [addOpen, setAddOpen] = useState(false);
    const [busyId, setBusyId] = useState<string | null>(null);

    const list = members as any[];
    const incoming = list.filter((m) => m.status === 'pending' && m.via === 'supplier_request');
    const invited = list.filter((m) => m.status === 'pending' && m.via === 'buyer_add');
    const active = list.filter((m) => m.status === 'active');
    const pendingTotal = incoming.length + invited.length;

    const run = async (key: string, fn: () => Promise<any>, msg: string) => {
        setBusyId(key);
        try {
            await fn();
            toast.success(msg);
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'عملیات ناموفق بود');
        } finally {
            setBusyId(null);
        }
    };

    const memberRow = (m: any, mode: 'active' | 'incoming' | 'invited') => {
        const cat = m.catalog || {};
        const busy = busyId === m.id;
        return (
            <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 rounded-xl p-2.5 ${mode === 'incoming' ? 'bg-brand-contrast-soft/50 dark:bg-amber-500/5' : 'hover:bg-stone-50 dark:hover:bg-gray-800/50'}`}
            >
                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-stone-100 dark:bg-gray-800">
                    {cat.logoUrl
                        ? <Image src={cat.logoUrl} alt="" width={40} height={40} className="size-full object-cover" unoptimized />
                        : <Handshake className="size-4 text-stone-400" />}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-black text-stone-900 dark:text-gray-100">{cat.name || 'کاتالوگ'}</p>
                    <p className="truncate text-[10px] font-bold text-stone-400 dark:text-gray-500">
                        {m.user?.fullName || '—'}
                        {cat.city ? ` · ${cat.city}` : ''}
                        {mode === 'invited' ? ` · دعوت‌ت ${faDate(m.updatedAt || m.createdAt)} فرستاده شده` : mode === 'incoming' ? ' · درخواست عضویت' : ''}
                    </p>
                </div>
                {busy ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-stone-400" />
                ) : mode === 'incoming' ? (
                    <div className="flex shrink-0 items-center gap-1">
                        <button
                            onClick={() => run(m.id, () => decide.mutateAsync({ inquiryId, memberId: m.id, status: 'active' }), 'تامین‌کننده تایید شد')}
                            className="grid size-8 place-items-center rounded-lg bg-emerald-600 text-white"
                            aria-label="تایید"
                        >
                            <Check className="size-4" />
                        </button>
                        <button
                            onClick={() => run(m.id, () => decide.mutateAsync({ inquiryId, memberId: m.id, status: 'declined' }), 'درخواست رد شد')}
                            className="grid size-8 place-items-center rounded-lg bg-stone-200 text-stone-600 dark:bg-gray-800 dark:text-gray-300"
                            aria-label="رد"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex shrink-0 items-center gap-1">
                        {mode === 'active' && cat.slug && (
                            <Link href={`/${cat.slug}`} target="_blank" aria-label="کاتالوگ قیمت"
                                className="grid size-8 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-primary dark:hover:bg-gray-800">
                                <ExternalLink className="size-4" />
                            </Link>
                        )}
                        {mode === 'invited' && (
                            <span className="flex items-center gap-1 rounded-full bg-brand-contrast-soft px-2 py-0.5 text-[9px] font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                <Hourglass className="size-3" /> در انتظار پذیرش تامین‌کننده
                            </span>
                        )}
                        <button
                            onClick={() => {
                                if (window.confirm(`«${cat.name}» از تامین‌کننده‌ها حذف شود؟`)) {
                                    run(m.id, () => decide.mutateAsync({ inquiryId, memberId: m.id, status: 'removed' }), 'حذف شد');
                                }
                            }}
                            className="grid size-8 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                            aria-label="حذف"
                        >
                            <Trash2 className="size-4" />
                        </button>
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="space-y-3">
            {/* سربرگ — یک خط توضیح، همان‌قدر که لازم است */}
            <div className={`${card} flex items-center gap-3 p-4`}>
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-contrast-soft dark:bg-amber-500/15">
                    <Handshake className="size-5 text-amber-600 dark:text-amber-400" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-stone-900 dark:text-gray-100">تامین‌کننده‌های تاییدشده</p>
                    <p className="mt-0.5 text-[11px] font-bold leading-5 text-stone-400 dark:text-gray-500">
                        {visibility === 'private'
                            ? 'اقلامت را فقط همین‌ها می‌بینند'
                            : 'اقلام فوریت را اول از همه می‌بینند و قیمت می‌دهند'}
                    </p>
                </div>
                <button
                    onClick={() => setAddOpen(true)}
                    className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-[12px] font-extrabold text-on-primary shadow-lg shadow-primary/25 transition-colors hover:bg-primary/90"
                >
                    <UserPlus className="size-4" />
                    درخواست ارتباط با تامین‌کننده
                </button>
            </div>

            {isLoading ? (
                <div className={`${card} grid place-items-center py-10`}>
                    <Loader2 className="size-6 animate-spin text-stone-300" />
                </div>
            ) : (
                <>
                    {/* درخواست‌های در انتظار تایید تو */}
                    {incoming.length > 0 && (
                        <div className={`${card} p-3`}>
                            <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-black text-amber-700 dark:text-amber-400">
                                <ShieldCheck className="size-3.5" />
                                درخواست عضویت — {incoming.length.toLocaleString('fa-IR')} مورد
                            </p>
                            {incoming.map((m) => memberRow(m, 'incoming'))}
                        </div>
                    )}

                    {/* عضوهای فعال */}
                    <div className={`${card} p-2`}>
                        {active.length === 0 && invited.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <Handshake className="mx-auto size-8 text-stone-200 dark:text-gray-700" />
                                <p className="mt-2 text-[13px] font-black text-stone-500 dark:text-gray-400">هنوز تامین‌کننده‌ای نداری</p>
                                {/* ✅ راهنمای تامین‌کننده‌یابی — خواستهٔ مالک: دو مسیر روشن */}
                                <p className="mx-auto mt-1.5 max-w-sm text-[11px] font-bold leading-5 text-stone-400 dark:text-gray-500">
                                    با دکمهٔ بالا به تامین‌کننده‌های مناسب کالایت در شهر خودت درخواست ارتباط بده؛
                                    یا لینک بازوی خریدت را برای تامین‌کننده‌ها و بازاریاب‌هایی که می‌شناسی بفرست —
                                    اگر عضو دیمت باشند درخواست می‌دهند و اگر نباشند با لینک می‌آیند.
                                </p>
                                <p className="mx-auto mt-1.5 max-w-xs text-[10px] font-bold leading-4 text-amber-600/80 dark:text-amber-400/70">
                                    تا حداقل ۵ تامین‌کننده به این لیست اضافه نشود، یادآوری آن در اعلان‌هایت می‌ماند.
                                </p>
                            </div>
                        ) : (
                            <>
                                {active.map((m) => memberRow(m, 'active'))}
                                {invited.map((m) => memberRow(m, 'invited'))}
                            </>
                        )}
                    </div>
                </>
            )}

            {addOpen && (
                <AddSupplierModal inquiryId={inquiryId} slug={slug} existingIds={new Set(list.map((m) => m.catalogId))} onClose={() => setAddOpen(false)} onDone={() => { setAddOpen(false); }} />
            )}
        </div>
    );
}

/** مودال افزودن تامین‌کننده — جست‌وجوی کاتالوگ قیمت + ماژول مخاطبین تلفن */
function AddSupplierModal({ inquiryId, slug, existingIds, onClose, onDone }: {
    inquiryId: string;
    /** اسلاگ بازو — لینک دعوت غیراعضا */
    slug?: string | null;
    existingIds: Set<string>;
    onClose: () => void;
    onDone: () => void;
}) {
    const [q, setQ] = useState('');
    const [invited, setInvited] = useState<Set<string>>(new Set());
    const addMember = useAddInquiryMember();

    // لینک عمومی بازو — همان آدرسی که از برگهٔ انتشار می‌رود
    const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/${slug || inquiryId}` : '';

    const { data, isFetching } = useQuery({
        queryKey: ['inquiry-supplier-candidates', inquiryId, q],
        queryFn: () => apiService.inquiry.supplierCandidates(inquiryId, q),
        staleTime: 15_000,
    });
    const results: any[] = (data?.items ?? []).filter((c: any) => !existingIds.has(c.id));

    const invite = async (c: any) => {
        try {
            await addMember.mutateAsync({ inquiryId, catalogId: c.id });
            toast.success(`درخواست ارتباط برای «${c.name}» فرستاده شد`);
            setInvited((s) => new Set(s).add(c.id));
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ارسال دعوت ناموفق بود');
        }
    };

    return (
        <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
            <div
                className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl dark:bg-gray-900"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-[15px] font-black text-stone-900 dark:text-gray-100">درخواست ارتباط با تامین‌کننده</p>
                <p className="mt-0.5 text-[11px] font-bold text-stone-400 dark:text-gray-500">
                    با کاتالوگ قیمتشان درخواست ارتباط بفرست — بعد از تاییدشان، اقلامت را می‌بینند و قیمت می‌دهند
                </p>

                <div className="relative mt-3">
                    <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                    <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="جست‌وجوی کاتالوگ قیمت…"
                        autoFocus
                        className="h-11 w-full rounded-xl border border-stone-100 bg-stone-50 pr-9 pl-3 text-sm font-bold outline-none focus:border-brand-contrast dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-100"
                    />
                </div>

                <div className="mt-3 space-y-1.5">
                    {isFetching && results.length === 0 ? (
                        <div className="grid place-items-center py-8"><Loader2 className="size-5 animate-spin text-stone-300" /></div>
                    ) : results.length === 0 ? (
                        <p className="py-8 text-center text-[12px] font-bold text-stone-400">کاتالوگی پیدا نشد</p>
                    ) : results.map((c) => (
                        <div key={c.id} className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-stone-50 dark:hover:bg-gray-800/50">
                            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-stone-100 dark:bg-gray-800">
                                {c.logoUrl
                                    ? <Image src={c.logoUrl} alt="" width={36} height={36} className="size-full object-cover" unoptimized />
                                    : <Handshake className="size-4 text-stone-400" />}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-[13px] font-black text-stone-900 dark:text-gray-100">{c.name}</p>
                                {c.city && <p className="text-[10px] font-bold text-stone-400">{c.city}</p>}
                            </div>
                            {invited.has(c.id) ? (
                                <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">
                                    <Check className="size-3" /> دعوت شد
                                </span>
                            ) : (
                                <button
                                    onClick={() => invite(c)}
                                    disabled={addMember.isPending}
                                    className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-extrabold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
                                >
                                    دعوت
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* 📱 ماژول مخاطبین تلفن — موتور تامین‌کننده‌یابی:
                     عضوهای دیمت → «ارسال» و درخواست به کاتالوگشان می‌رود
                     غیراعضا → «دعوت به دیمت» — لینک بازو با پیام‌رسان یا پیامک می‌رود */}
                <div className="mt-4 border-t border-stone-100 pt-4 dark:border-gray-800">
                    <PhoneContactsPanel
                        title="یا از مخاطبین تلفنت انتخاب کن"
                        membersTitle="اعضای دیمت — درخواست به کاتالوگشان می‌رود"
                        inviteTitle="دعوت به دیمت — لینک بازو را می‌گیرند"
                        memberSend={{
                            label: 'ارسال',
                            doneLabel: 'درخواست رفت',
                            reason: (c) => {
                                const cat = c.matchedUser?.catalog;
                                if (!cat) return 'کاتالوگ قیمتی ندارد — با دعوت، لینک بازو را بفرست';
                                if (existingIds.has(cat.id)) return 'قبلاً دعوت شده';
                                return null;
                            },
                            onSend: async (c) => {
                                const cat = c.matchedUser!.catalog!;
                                await addMember.mutateAsync({ inquiryId, catalogId: cat.id });
                                toast.success(`درخواست ارتباط برای «${c.name || c.matchedUser?.fullName || cat.name}» فرستاده شد`);
                            },
                        }}
                        invite={{
                            label: 'دعوت به دیمت',
                            getText: () => 'سلام! لطفاً برای قیمت‌دادن به کالاهای بازوی خرید من، از این لینک دیمت دیدن کن:',
                            getUrl: () => publicUrl || undefined,
                        }}
                    />
                </div>

                <button
                    onClick={onDone}
                    className="mt-4 h-11 w-full rounded-full border border-stone-200 text-sm font-extrabold text-stone-600 dark:border-gray-700 dark:text-gray-300"
                >
                    تمام
                </button>
            </div>
        </div>
    );
}
