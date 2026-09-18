// app/my-inquiries/components/MembersTab.tsx
// ✅ تب «تامین‌کنندگان» پنل بازوی خرید — شبکهٔ خرید↔فروش:
//    تامین‌کننده‌های تاییدشدهٔ این بازو، اقلام فوری را اول از همه می‌بینند
//    و در تب «بازوی خرید»ی پنل فروششان قیمت می‌دهند.
//    دو مسیر: خریدار «درخواست تامین» می‌فرستد (buyer_add → تایید با تامین‌کننده)
//             تامین‌کننده «پیشنهاد تامین» می‌دهد (supplier_request → تایید با خریدار)
// فلسفهٔ متن: حداقلی — خودِ ساختار می‌گوید چه خبر است.
// ✅ اصلاح واژگان (خواستهٔ مالک): درخواستِ خریدار = «درخواست تامین»، درخواستِ تامین‌کننده = «پیشنهاد تامین» — نه «عضویت» و نه «دعوت»
// ✅ دکمه‌های قبول/رد متنی (کاربر کم‌سواد تیک و ضربدر را نمی‌فهمد)
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
    Handshake, UserPlus, Check, X, Trash2, Loader2, Search,
    Hourglass, ExternalLink, ShieldCheck, Users, Smartphone, XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService } from '@/lib/api/apiService';
import { useInquiryMembers, useAddInquiryMember, useDecideInquiryMember } from '@/lib/api/apiHooks';
import PhoneContactsPanel from '@/components/share/PhoneContactsPanel';
import OfferCallButton from '@/app/components/OfferCallButton';
import { IranLocationSelector } from '@/app/components/IranLocationSelector';
import { DropSelector } from '@/components/common/DropSelector';

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
    // ✅ ردشده‌ها — دعوت‌های «ما فرستادیم، تامین‌کننده رد کرد» (خواستهٔ مالک: دیده شود + دکمهٔ حذف)
    const declinedMine = list.filter((m) => m.status === 'declined' && m.via === 'buyer_add');

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

    const memberRow = (m: any, mode: 'active' | 'incoming' | 'invited' | 'declined') => {
        const cat = m.catalog || {};
        const busy = busyId === m.id;
        return (
            <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex items-center gap-3 rounded-xl p-2.5 ${mode === 'incoming' ? 'bg-brand-contrast-soft/50 dark:bg-amber-500/5' : mode === 'declined' ? 'bg-rose-50/60 dark:bg-rose-900/10' : 'hover:bg-stone-50 dark:hover:bg-gray-800/50'}`}
            >
                <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-stone-100 dark:bg-gray-800">
                    {cat.logoUrl
                        ? <Image src={cat.logoUrl} alt="" width={40} height={40} className="size-full object-cover" unoptimized />
                        : <Handshake className="size-4 text-stone-400" />}
                </span>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-black text-stone-900 dark:text-gray-100">{cat.name || 'بازوی فروش'}</p>
                    <p className="truncate text-[10px] font-bold text-stone-400 dark:text-gray-500">
                        {m.user?.fullName || '—'}
                        {cat.city ? ` · ${cat.city}` : ''}
                        {mode === 'invited'
                            ? ` · درخواست ${faDate(m.updatedAt || m.createdAt)} فرستاده شده`
                            : mode === 'incoming' ? ' · پیشنهاد تامین' : ''}
                    </p>
                </div>
                {busy ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-stone-400" />
                ) : mode === 'incoming' ? (
                    <div className="flex shrink-0 items-center gap-1.5">
                        {/* ✅ تماس با متقاضی — همیشه (شمارهٔ ثبت‌نام شخص) */}
                        <OfferCallButton phone={m.user?.phone} title="تماس با متقاضی" />
                        <button
                            onClick={() => run(m.id, () => decide.mutateAsync({ inquiryId, memberId: m.id, status: 'active' }), 'پیشنهاد تامین پذیرفته شد')}
                            className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-extrabold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
                            aria-label="قبول پیشنهاد تامین"
                        >
                            <Check className="size-3.5" />
                            قبول
                        </button>
                        <button
                            onClick={() => run(m.id, () => decide.mutateAsync({ inquiryId, memberId: m.id, status: 'declined' }), 'پیشنهاد تامین رد شد')}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-stone-200 bg-white px-2.5 text-[11px] font-extrabold text-stone-500 transition hover:border-stone-300 active:scale-95 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                            aria-label="رد پیشنهاد تامین"
                        >
                            <X className="size-3.5" />
                            رد
                        </button>
                    </div>
                ) : (
                    <div className="flex shrink-0 items-center gap-1">
                        {mode === 'active' && cat.slug && (
                            <Link href={`/${cat.slug}`} target="_blank" aria-label="بازوی فروش"
                                className="grid size-8 place-items-center rounded-lg text-stone-400 transition-colors hover:bg-stone-100 hover:text-primary dark:hover:bg-gray-800">
                                <ExternalLink className="size-4" />
                            </Link>
                        )}
                        {mode === 'invited' && (
                            <span className="flex items-center gap-1 rounded-full bg-brand-contrast-soft px-2 py-0.5 text-[9px] font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                <Hourglass className="size-3" /> در انتظار پذیرش تامین‌کننده
                            </span>
                        )}
                        {mode === 'declined' && (
                            <span className="flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-black text-rose-700 dark:bg-rose-900/25 dark:text-rose-300">
                                <XCircle className="size-3" /> درخواست رد شده
                            </span>
                        )}
                        {/* ✅ تماس با تامین‌کننده — همیشه (شمارهٔ ثبت‌نام؛ یادآوری پذیرش/اتصال تیم را قوی‌تر می‌کند) */}
                        <OfferCallButton
                            phone={m.user?.phone}
                            title={mode === 'invited' ? 'تماس — یادآوری پذیرش درخواست تامین' : `تماس با ${m.user?.fullName || 'تامین‌کننده'}`}
                        />
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
                    درخواست تامین
                </button>
            </div>

            {isLoading ? (
                <div className={`${card} grid place-items-center py-10`}>
                    <Loader2 className="size-6 animate-spin text-stone-300" />
                </div>
            ) : (
                <>
                    {/* پیشنهادهای تامینِ تامین‌کننده‌ها در انتظار تایید تو (خواستهٔ مالک: «پیشنهاد تامین») */}
                    {incoming.length > 0 && (
                        <div className={`${card} p-3`}>
                            <p className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-black text-amber-700 dark:text-amber-400">
                                <ShieldCheck className="size-3.5" />
                                پیشنهاد تامین — {incoming.length.toLocaleString('fa-IR')} مورد
                            </p>
                            {incoming.map((m) => memberRow(m, 'incoming'))}
                        </div>
                    )}

                    {/* همکارهای فعال */}
                    <div className={`${card} p-2`}>
                        {active.length === 0 && invited.length === 0 && declinedMine.length === 0 ? (
                            <div className="px-4 py-8 text-center">
                                <Handshake className="mx-auto size-8 text-stone-200 dark:text-gray-700" />
                                <p className="mt-2 text-[13px] font-black text-stone-500 dark:text-gray-400">هنوز تامین‌کننده‌ای نداری</p>
                                {/* ✅ راهنمای تامین‌کننده‌یابی — خواستهٔ مالک: دو مسیر روشن */}
                                <p className="mx-auto mt-1.5 max-w-sm text-[11px] font-bold leading-5 text-stone-400 dark:text-gray-500">
                                    با دکمهٔ بالا به تامین‌کننده‌های مناسب کالایت در شهر خودت یا هر شهری درخواست تامین بده؛
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
                                {/* ✅ ردشده‌ها — همان‌جا دیده می‌شوند و دکمهٔ حذف دارند (خواستهٔ مالک) */}
                                {declinedMine.map((m) => memberRow(m, 'declined'))}
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

/**
 * مودال «درخواست تامین» — دو تب (خواستهٔ مالک):
 *   • اعضا — جست‌وجوی بازوهای فروشی دیمت با فیلتر استان/شهر/صنف + نام بیزینس و شهر زیر هر بازوی فروش
 *     (همکارهای فعال هرگز لیست نمی‌شوند؛ درخواست‌های در انتظار با لیبل کهربایی «در انتظار تایید»)
 *   • مخاطبین تلفن — ماژول مخاطبین: عضوهای دیمت → درخواست تامین به بازوی فروششان، غیراعضا → دعوت با لینک بازو
 */
function AddSupplierModal({ inquiryId, slug, existingIds, onClose, onDone }: {
    inquiryId: string;
    /** اسلاگ بازو — لینک دعوت غیراعضا */
    slug?: string | null;
    existingIds: Set<string>;
    onClose: () => void;
    onDone: () => void;
}) {
    const qc = useQueryClient();
    const [tab, setTab] = useState<'members' | 'contacts'>('members');
    const [q, setQ] = useState('');
    const [qDeb, setQDeb] = useState('');
    const [provinceCode, setProvinceCode] = useState('');
    const [cityCode, setCityCode] = useState('');
    const [industry, setIndustry] = useState('');
    const [sent, setSent] = useState<Set<string>>(new Set());
    const addMember = useAddInquiryMember();

    // لینک عمومی بازو — همان آدرسی که از برگهٔ انتشار می‌رود
    const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/i/${slug || inquiryId}` : '';

    // جست‌وجوی نرم — با هر تپ کوئری نزنیم
    useEffect(() => {
        const t = setTimeout(() => setQDeb(q), 300);
        return () => clearTimeout(t);
    }, [q]);

    // صنف‌ها — از مرجع صنف دیمت (عمومی)
    const { data: industries } = useQuery({
        queryKey: ['industries-list'],
        queryFn: () => apiService.industry.list(true),
        staleTime: 5 * 60_000,
    });

    const filtersActive = !!(qDeb.trim() || provinceCode || cityCode || industry);
    const clearFilters = () => { setQ(''); setQDeb(''); setProvinceCode(''); setCityCode(''); setIndustry(''); };

    const { data, isFetching } = useQuery({
        queryKey: ['inquiry-supplier-candidates', inquiryId, qDeb, provinceCode, cityCode, industry],
        queryFn: () => apiService.inquiry.supplierCandidates(inquiryId, { q: qDeb, provinceCode, cityCode, industry }),
        staleTime: 15_000,
    });
    const results: any[] = data?.items ?? [];

    const invite = async (c: any) => {
        try {
            await addMember.mutateAsync({ inquiryId, catalogId: c.id });
            toast.success(`درخواست تامین برای «${c.name}» فرستاده شد`);
            setSent((s) => new Set(s).add(c.id));
            // لیبل‌های «در انتظار تایید» بعد از بستن مودال هم درست بمانند
            qc.invalidateQueries({ queryKey: ['inquiry-supplier-candidates', inquiryId] });
        } catch (e: any) {
            toast.error(e?.response?.data?.message || 'ارسال درخواست تامین ناموفق بود');
        }
    };

    return (
        <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
            <div
                className="max-h-[85dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:max-w-md sm:rounded-2xl dark:bg-gray-900"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-[15px] font-black text-stone-900 dark:text-gray-100">درخواست تامین</p>
                <p className="mt-0.5 text-[11px] font-bold text-stone-400 dark:text-gray-500">
                    از بازوی فروششان درخواست تامین بفرست — بعد از تاییدشان، اقلامت را می‌بینند و قیمت می‌دهند
                </p>

                {/* دو تب — اعضای دیمت | مخاطبین تلفن (خواستهٔ مالک: کنار هم، نه زیر هم) */}
                <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-stone-100 p-1 dark:bg-gray-950/60">
                    {([['members', 'اعضا', Users], ['contacts', 'مخاطبین تلفن', Smartphone]] as const).map(([v, label, Icon]) => (
                        <button key={v} onClick={() => setTab(v)}
                            className={`flex h-9 items-center justify-center gap-1.5 rounded-lg text-[12px] font-extrabold transition-all ${
                                tab === v
                                    ? 'bg-primary text-on-primary shadow-sm'
                                    : 'text-stone-500 hover:text-stone-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}>
                            <Icon className="size-4" />
                            {label}
                        </button>
                    ))}
                </div>

                {tab === 'members' && (
                    <>
                        {/* جست‌وجو */}
                        <div className="relative mt-3">
                            <Search className="absolute right-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
                            <input
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="جست‌وجوی بازوی فروش…"
                                autoFocus
                                className="h-11 w-full rounded-xl border border-stone-100 bg-stone-50 pr-9 pl-3 text-sm font-bold outline-none focus:border-brand-contrast dark:border-gray-800 dark:bg-gray-950/60 dark:text-gray-100"
                            />
                        </div>

                        {/* فیلتر استان/شهر/صنف — خریدار اکثراً از شهر خودش تامین می‌کند (خواستهٔ مالک) */}
                        <div className="mt-2 space-y-2 rounded-2xl border border-stone-100 bg-stone-50 p-3 dark:border-gray-800 dark:bg-gray-950/60">
                            <IranLocationSelector
                                provinceCode={provinceCode}
                                cityCode={cityCode}
                                onProvinceChange={(code) => setProvinceCode(code)}
                                onCityChange={(code) => setCityCode(code)}
                            />
                            <DropSelector
                                value={industry}
                                options={[
                                    { value: '', label: 'همه صنف‌ها' },
                                    ...(industries?.items || []).map((i) => ({ value: i.title, label: i.title })),
                                ]}
                                onChange={(v) => setIndustry(v)}
                                placeholder="همه صنف‌ها"
                            />
                        </div>

                        {/* لیست بازوهای فروش — زیر اسم، بیزینس · صنف · شهر برای تصمیم آسان */}
                        <div className="mt-3 space-y-1.5">
                            {isFetching && results.length === 0 ? (
                                <div className="grid place-items-center py-8"><Loader2 className="size-5 animate-spin text-stone-300" /></div>
                            ) : results.length === 0 ? (
                                <div className="py-8 text-center">
                                    <p className="text-[12px] font-black text-stone-400">تامین‌کننده‌ای پیدا نشد</p>
                                    {filtersActive && (
                                        <>
                                            <p className="mx-auto mt-1 max-w-[240px] text-[10px] font-bold leading-4 text-stone-400/80">
                                                با این فیلترها کسی نیست — فیلترها را کم کن
                                            </p>
                                            <button onClick={clearFilters}
                                                className="mx-auto mt-2 flex h-8 items-center gap-1 rounded-full border border-stone-200 bg-white px-3 text-[11px] font-extrabold text-stone-500 transition hover:border-stone-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300">
                                                <X className="size-3.5" />
                                                حذف فیلترها
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : results.map((c) => (
                                <div key={c.id} className="flex items-center gap-2.5 rounded-xl p-2 hover:bg-stone-50 dark:hover:bg-gray-800/50">
                                    <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-stone-100 dark:bg-gray-800">
                                        {c.logoUrl
                                            ? <Image src={c.logoUrl} alt="" width={36} height={36} className="size-full object-cover" unoptimized />
                                            : <Handshake className="size-4 text-stone-400" />}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-[13px] font-black text-stone-900 dark:text-gray-100">{c.name}</p>
                                        <p className="truncate text-[10px] font-bold text-stone-400 dark:text-gray-500">
                                            {[c.businessName, c.industryName, c.city].filter(Boolean).join(' · ') || '—'}
                                        </p>
                                    </div>
                                    {/* درخواست قبلی → لیبل؛ همکار فعال اصلاً لیست نمی‌شود (فیلتر سمت بک) */}
                                    {sent.has(c.id) ? (
                                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-900/25 dark:text-emerald-300">
                                            <Check className="size-3" /> درخواست رفت
                                        </span>
                                    ) : c.pending ? (
                                        <span className="flex shrink-0 items-center gap-1 rounded-full bg-brand-contrast-soft px-2.5 py-1 text-[10px] font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                                            <Hourglass className="size-3" /> در انتظار تایید
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => invite(c)}
                                            disabled={addMember.isPending}
                                            className="shrink-0 rounded-full bg-primary px-3.5 py-1.5 text-[11px] font-extrabold text-on-primary transition-colors hover:bg-primary/90 disabled:opacity-50"
                                        >
                                            درخواست تامین
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* 📱 تب مخاطبین تلفن — موتور تامین‌کننده‌یابی:
                     عضوهای دیمت → «درخواست تامین» به بازوی فروششان می‌رود
                     غیراعضا → «دعوت به دیمت» — لینک بازو با پیام‌رسان یا پیامک می‌رود */}
                {tab === 'contacts' && (
                    <div className="mt-3">
                        <PhoneContactsPanel
                            title="از مخاطبین تلفنت انتخاب کن"
                            membersTitle="اعضای دیمت — درخواست تامین به بازوی فروششان می‌رود"
                            inviteTitle="دعوت به دیمت — لینک بازو را می‌گیرند"
                            memberSend={{
                                label: 'درخواست تامین',
                                doneLabel: 'درخواست رفت',
                                reason: (c) => {
                                    const cat = c.matchedUser?.catalog;
                                    if (!cat) return 'بازوی فروشی ندارد — با دعوت، لینک بازو را بفرست';
                                    if (existingIds.has(cat.id)) return 'درخواست تامین قبلاً فرستاده شده';
                                    return null;
                                },
                                onSend: async (c) => {
                                    const cat = c.matchedUser!.catalog!;
                                    await addMember.mutateAsync({ inquiryId, catalogId: cat.id });
                                    toast.success(`درخواست تامین برای «${c.name || c.matchedUser?.fullName || cat.name}» فرستاده شد`);
                                },
                            }}
                            invite={{
                                label: 'دعوت به دیمت',
                                getText: () => 'سلام! لطفاً برای قیمت‌دادن به کالاهای بازوی خرید من، از این لینک دیمت دیدن کن:',
                                getUrl: () => publicUrl || undefined,
                            }}
                        />
                    </div>
                )}

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
