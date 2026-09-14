// app/my-inquiries/components/SettingsTab.tsx
// تب تنظیمات پنل اعلام خرید — مشخصات، شرایط، دسترسی و قیمت‌گیری، وضعیت
// شامل فیلد «امکان ارسال قیمت برای خریدهای غیر فوری» (ایدهٔ مالک)
// ✅ نمایانی دوگانه: عمومی (هرکس با لینک) | خصوصی (فقط تامین‌کننده‌های تاییدشده)
//    دیوار عمومی حذف شد (تصمیم مالک) — اعلام خرید به بازارها عرضه می‌شود (گام بعد)
//    مفهوم خصوصی به خود خریدار گفته می‌شود — یک خط زیر گزینه
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Save, Boxes, Ban, RotateCcw, Trash2, Loader2, Globe, ShieldCheck, Link2 } from 'lucide-react';
import SwitchRow from './SwitchRow';
import SlugEditor from '@/app/my-catalogs/SlugEditor';
import { inp } from '../../inquiries/utils';
import type { InquiryDetail } from '@/lib/api/apiTypes';

interface Props {
    detail: InquiryDetail;
    onSave: (data: Record<string, any>) => Promise<void>;
    onOpenUnits: () => void;
    onToggleStatus: () => Promise<void>;
    onDelete: () => Promise<void>;
    saving: boolean;
}

const card = 'rounded-2xl border border-stone-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-900';
const cardTitle = 'mb-3 text-[12px] font-black text-stone-400 dark:text-gray-500';

export default function SettingsTab({ detail, onSave, onOpenUnits, onToggleStatus, onDelete, saving }: Props) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tagsRaw, setTagsRaw] = useState('');
    const [city, setCity] = useState('');
    const [deadline, setDeadline] = useState('');
    const [deliveryNote, setDeliveryNote] = useState('');
    const [paymentTerms, setPaymentTerms] = useState('');
    const [visibility, setVisibility] = useState<'public' | 'private'>('public');
    const [allowNonUrgentOffers, setAllowNonUrgent] = useState(true);
    // ✅ آدرس عمومی — قابل ویرایش مثل کاتالوگ فروش (لینک قدیمی /inquiries/{id} هم همچنان کار می‌کند)
    const [slug, setSlug] = useState('');
    const [slugStatus, setSlugStatus] = useState<'taken' | 'reserved' | null>(null);

    // با تعویض کاتالوگ، فرم از نو پر می‌شود
    useEffect(() => {
        if (!detail) return;
        setTitle(detail.title || '');
        setDescription(detail.description || '');
        setTagsRaw((detail.tags || []).join('، '));
        setCity(detail.city || '');
        setDeadline(detail.deadline ? new Date(detail.deadline).toISOString().slice(0, 16) : '');
        setDeliveryNote(detail.deliveryNote || '');
        setPaymentTerms(detail.paymentTerms || '');
        setVisibility(detail.visibility === 'private' ? 'private' : 'public');
        setAllowNonUrgent(detail.allowNonUrgentOffers !== false);
        setSlug(detail.slug || '');
        setSlugStatus(null);
    }, [detail?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    const save = async () => {
        if (!title.trim()) {
            toast.error('عنوان خالی نمی‌تونه باشه');
            return;
        }
        if (slug.trim() && slug.trim().length < 3) {
            toast.error('آدرس صفحه حداقل ۳ حرف انگلیسی');
            return;
        }
        if (slugStatus) {
            toast.error('این آدرس در دسترس نیست — کمی عوضش کن');
            return;
        }
        try {
            await onSave({
                title: title.trim(),
                description: description.trim() || undefined,
                tags: tagsRaw.split(/[,،]/).map((t) => t.trim()).filter(Boolean).slice(0, 10),
                city: city.trim() || undefined,
                deadline: deadline ? new Date(deadline).toISOString() : undefined,
                deliveryNote: deliveryNote.trim() || undefined,
                paymentTerms: paymentTerms.trim() || undefined,
                visibility,
                allowNonUrgentOffers,
                ...(slug.trim() && slug.trim() !== (detail.slug || '') ? { slug: slug.trim() } : {}),
            });
            toast.success('تنظیمات ذخیره شد');
        } catch (e: any) {
            const code = e?.response?.data?.errorCode;
            if (code === 'SLUG_TAKEN' || code === 'SLUG_RESERVED' || code === 'INVALID_SLUG') {
                toast.error(e?.response?.data?.message || 'این آدرس در دسترس نیست — کمی عوضش کن');
            } else {
                toast.error(e?.response?.data?.message || 'ذخیره ناموفق بود');
            }
        }
    };

    return (
        <div className="space-y-3">
            {/* مشخصات */}
            <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className={card}>
                <h2 className={cardTitle}>مشخصات</h2>
                <div className="space-y-2.5">
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="عنوان اعلام خرید" className={`${inp} w-full`} />
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
                        placeholder="توضیح کوتاه" className={`${inp} h-auto w-full py-2`} />
                    <input value={tagsRaw} onChange={(e) => setTagsRaw(e.target.value)} placeholder="برچسب‌ها — با ویرگول جدا کن" className={`${inp} w-full`} />
                    <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="شهر" className={`${inp} w-full`} />
                    {/* 📍 آدرس عمومی — لینک کوتاه ریشه‌ای daymat.ir/{آدرس} */}
                    <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3 dark:border-gray-800 dark:bg-gray-950/60">
                        <div className="mb-2 flex items-center gap-1.5">
                            <Link2 className="size-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="text-[11px] font-black text-stone-600 dark:text-gray-300">آدرس صفحه</span>
                        </div>
                        <SlugEditor
                            value={slug}
                            onChange={(s) => { setSlug(s); setSlugStatus(null); }}
                            onStatus={setSlugStatus}
                            excludeId={detail.id}
                            initialSlug={detail.slug || ''}
                            placeholder="supey"
                        />
                    </div>
                </div>
            </motion.section>

            {/* شرایط خرید */}
            <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={card}>
                <h2 className={cardTitle}>شرایط خرید</h2>
                <div className="space-y-2.5">
                    <div>
                        <label className="mb-1 block text-[10px] font-bold text-stone-400">مهلت پاسخ</label>
                        <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                            className={`${inp} w-full dark:[color-scheme:dark]`} />
                    </div>
                    <input value={deliveryNote} onChange={(e) => setDeliveryNote(e.target.value)} placeholder="محل/شرایط تحویل" className={`${inp} w-full`} />
                    <input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} placeholder="شرایط پرداخت" className={`${inp} w-full`} />
                </div>
            </motion.section>

            {/* دسترسی و قیمت‌گیری */}
            <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={card}>
                <h2 className={cardTitle}>دسترسی و قیمت‌گیری</h2>
                <div className="space-y-4">
                    {/* نمایانی — سگمنت دوگانه؛ مفهوم هر گزینه یک خط زیرش */}
                    <div>
                        <div className="grid grid-cols-2 gap-1.5">
                            {([['public', 'عمومی', 'هرکس با لینک می‌بیند', Globe],
                               ['private', 'خصوصی', 'فقط تامین‌کننده‌های تاییدشده', ShieldCheck]] as const).map(([v, label, hint, Icon]) => (
                                <button key={v} type="button" onClick={() => setVisibility(v)}
                                    className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-2.5 transition-all ${
                                        visibility === v
                                            ? 'border-brand-amber bg-brand-amber-soft/60 dark:bg-amber-500/10'
                                            : 'border-stone-100 hover:border-stone-200 dark:border-gray-800 dark:hover:border-gray-700'
                                    }`}>
                                    <Icon className={`size-4 ${visibility === v ? 'text-amber-600 dark:text-amber-400' : 'text-stone-300 dark:text-gray-600'}`} />
                                    <span className={`text-[11px] font-black ${visibility === v ? 'text-amber-800 dark:text-amber-300' : 'text-stone-500 dark:text-gray-400'}`}>{label}</span>
                                    <span className="text-center text-[8.5px] font-bold leading-3 text-stone-400 dark:text-gray-500">{hint}</span>
                                </button>
                            ))}
                        </div>
                        {visibility === 'private' && (
                            <p className="mt-2 rounded-xl bg-brand-amber-soft/50 px-3 py-2 text-[10px] font-bold leading-4 text-amber-700 dark:bg-amber-500/5 dark:text-amber-400">
                                تامین‌کننده‌ها را در تب «تامین‌کنندگان» اضافه کن — لینک و اعلام‌هایت فقط دست همان‌ها می‌رسد
                            </p>
                        )}
                    </div>

                    {/* ✅ امکان ارسال قیمت برای خریدهای غیر فوری */}
                    <div className="rounded-2xl border border-stone-100 bg-stone-50 p-3.5 dark:border-gray-800 dark:bg-gray-950/60">
                        <SwitchRow
                            checked={allowNonUrgentOffers}
                            onChange={setAllowNonUrgent}
                            label="امکان ارسال قیمت برای خریدهای غیر فوری"
                            sub={allowNonUrgentOffers
                                ? 'تامین‌کننده‌ها برای سایر کالاها هم قیمت می‌فرستند'
                                : 'فقط روی اقلام با اعلام خرید فعال قیمت می‌گیرید'}
                        />
                    </div>

                    {/* واحدهای من */}
                    <button onClick={onOpenUnits}
                        className="flex h-11 w-full items-center justify-between rounded-xl border border-stone-200 px-3 text-[13px] font-extrabold text-stone-600 transition-colors hover:border-brand-amber hover:text-amber-700 dark:border-gray-700 dark:text-gray-300">
                        <span className="flex items-center gap-2">
                            <Boxes className="size-4 text-brand-amber" />
                            واحدهای من
                        </span>
                        <span className="text-[10px] font-bold text-stone-400">{(detail.units as any[] | undefined)?.length ? `${(detail.units as any[]).length.toLocaleString('fa-IR')} واحد` : 'تعریف واحد'}</span>
                    </button>
                </div>
            </motion.section>

            {/* ذخیره */}
            <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={save}
                disabled={saving}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-extrabold text-on-primary shadow-lg shadow-primary/25 transition-colors hover:opacity-95 disabled:opacity-50">
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                ذخیره تغییرات
            </motion.button>

            {/* وضعیت و خطر */}
            <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className={card}>
                <h2 className={cardTitle}>وضعیت</h2>
                <div className="flex flex-wrap gap-2">
                    <button onClick={onToggleStatus}
                        className="flex h-10 items-center gap-1.5 rounded-full border border-stone-200 px-4 text-xs font-bold text-stone-600 transition-colors hover:border-stone-400 dark:border-gray-700 dark:text-gray-300">
                        {detail.status === 'open' ? <><Ban className="size-3.5" /> بستن کاتالوگ</> : <><RotateCcw className="size-3.5" /> بازکردن دوباره</>}
                    </button>
                    <button onClick={onDelete}
                        className="flex h-10 items-center gap-1.5 rounded-full border border-red-100 px-4 text-xs font-bold text-red-500 transition-colors hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10">
                        <Trash2 className="size-3.5" /> حذف
                    </button>
                </div>
            </motion.section>
        </div>
    );
}
