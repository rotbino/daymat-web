// app/components/ArmSwitcher.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useArms } from '@/lib/api/apiHooks';
import { BookmarkCheck, Check, ChevronDown, Compass, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
    pending: 'در انتظار تأیید',
    paused: 'موقتاً غیرفعال',
    banned: 'مسدود',
    rejected: 'رد شده',
    saved: 'ذخیره‌شده',
};

interface Props {
    variant?: 'desktop' | 'mobile';
}

/**
 * سوییچر بازار: بلوک برند (لوگو + نام) کلیک‌پذیر است و
 * لیست بازارهایی که کاربر عضو آن‌هاست را باز می‌کند.
 * ✅ برای کاربرِ لاگین‌شده همیشه دراپ‌داون باز می‌شود (حتی تک‌بازاری/بدون بازار) —
 *    چون نقطهٔ دسترسیِ «سایر بازارها» (لیست و جستجوی بازارها) همین‌جاست.
 * عضویت غیرفعال نمایش داده می‌شود ولی قابل انتخاب نیست.
 * ✅ بازارهای «ذخیره‌شده» (فالوِ غیرعضو) هم در لیست‌اند و کلیک‌پذیر؛
 *    عضویت‌های removed/banned (خروج/مسدودی) از لیست حذف می‌شوند.
 * مهمان → Link ساده به بازار فعلی.
 */
export default function ArmSwitcher({ variant = 'desktop' }: Props) {
    const router = useRouter();
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);
    const { isAuthenticated } = useSelector((s: RootState) => s.auth);
    const { data: arms } = useArms();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const armName = currentArm?.name || 'بازار';
    const slogan = (currentArm as any)?.slogan || '';
    // ✅ لوگو: فیلد ریشه‌ای مقدم؛ fallback به config.general برای اسنپ‌شات‌های پرسسیست‌شدهٔ قدیمی
    // (تنظیمات بازار فقط config.general.logoUrl می‌نویسد)
    const logo =
        (currentArm as any)?.logoUrl ||
        (currentArm as any)?.config?.general?.logoUrl ||
        (currentArm as any)?.config?.general?.logoFile?.path ||
        undefined;
    const isMobile = variant === 'mobile';

    // ✅ دراپ‌داون برای همهٔ کاربرانِ لاگین‌شده (بعد از لود لیست) — حتی تک‌بازاری/بدون بازار؛
    //    مهمان یا تا لود‌نشدن لیست → لینک ساده
    const switchable = isAuthenticated && arms !== undefined;

    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const switchArm = (slug: string) => {
        setOpen(false);
        if (slug === currentSlug) return;
        localStorage.setItem('lastArmSlug', slug);
        router.push(`/${slug}`); // push → back مرورگر به بازار قبلی برمی‌گردد
    };

    // ─── حالت ساده: مهمان / هنوز لود نشده ───
    if (!switchable) {
        return (
            <Link
                href={currentSlug ? `/${currentSlug}` : '/markets'}
                className={cn('flex-shrink-0 flex items-center min-w-0', isMobile ? 'gap-1.5 px-1' : 'gap-2.5')}
            >
                {logo ? (
                    // ✅ ارتفاع ثابت + عرض اتو با نسبت واقعی تصویر — مربع قبلی لوگوی عریض را ریز می‌کرد
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={logo} alt={armName}
                        className={cn('rounded-lg object-contain flex-shrink-0', isMobile ? 'h-9 w-auto max-w-[120px]' : 'h-11 w-auto max-w-[180px]')}
                    />
                ) : (
                    <div className={cn('rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0', isMobile ? 'w-9 h-9' : 'w-11 h-11')}>
                        <Store className={cn('text-primary', isMobile ? 'w-5 h-5' : 'w-6 h-6')} />
                    </div>
                )}
                <span className="flex flex-col items-start text-right leading-tight min-w-0">
                    <span className={cn('font-extrabold text-on-surface truncate', isMobile ? 'text-[13px] max-w-[110px]' : 'text-[15px] max-w-[190px]')}>
                        {armName}
                    </span>
                    {slogan && (
                        <span className={cn('mt-1 text-[10px] text-on-surface-variant truncate max-w-[140px]', !isMobile && 'max-w-[190px]')}>
                            {slogan}
                        </span>
                    )}
                </span>
            </Link>
        );
    }

    // ─── حالت سوییچر: چند بازار عضو ───
    return (
        <div ref={ref} className="relative flex-shrink-0">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="تغییر بازار"
                className={cn(
                    'flex items-center min-w-0 rounded-xl transition-colors',
                    isMobile ? 'gap-1 px-1 py-0.5 active:bg-surface-container-high' : 'gap-2 p-1 -m-1 hover:bg-surface-container-high/70',
                )}
            >
                {logo ? (
                    // ✅ ارتفاع ثابت + عرض اتو با نسبت واقعی تصویر — مربع قبلی لوگوی عریض را ریز می‌کرد
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={logo} alt={armName}
                        className={cn('rounded-lg object-contain flex-shrink-0', isMobile ? 'h-9 w-auto max-w-[120px]' : 'h-11 w-auto max-w-[180px]')}
                    />
                ) : (
                    <div className={cn('rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0', isMobile ? 'w-9 h-9' : 'w-11 h-11')}>
                        <Store className={cn('text-primary', isMobile ? 'w-5 h-5' : 'w-6 h-6')} />
                    </div>
                )}
                <span className="flex flex-col items-start text-right leading-tight min-w-0">
                    {/* ✅ شفرون به خودِ عنوان می‌چسبد نه به کل کانتینر شعار+عنوان — و پررنگ‌تر */}
                    <span className="flex items-center min-w-0 gap-0.5">
                        <span className={cn('font-extrabold text-on-surface truncate', isMobile ? 'text-[13px] max-w-[100px]' : 'text-[15px] max-w-[170px]')}>
                            {armName}
                        </span>
                        <ChevronDown className={cn('flex-shrink-0 text-on-surface-variant transition-transform', isMobile ? 'w-4 h-4' : 'w-4 h-4', open && 'rotate-180')} />
                    </span>
                    {slogan && (
                        <span className={cn('mt-1 text-[10px] text-on-surface-variant truncate max-w-[140px]', !isMobile && 'max-w-[190px]')}>
                            {slogan}
                        </span>
                    )}
                </span>
            </button>

            {open && (
                <div
                    role="menu"
                    className={cn(
                        'absolute top-full start-0 mt-1.5 w-72 p-1.5 rounded-2xl bg-white dark:bg-gray-900',
                        'border border-outline-variant/30 shadow-xl z-[60] animate-in fade-in zoom-in-95 duration-150',
                    )}
                >
                    <div className="px-3 pt-1.5 pb-1 text-[10px] font-bold text-on-surface-variant/60">
                        بازارهای شما
                    </div>
                    <div className="max-h-[50vh] overflow-y-auto scrollbar-slim">
                        {(arms ?? []).filter((a: any) => a.status !== 'removed' && a.status !== 'banned').length === 0 && (
                            <div className="px-3 py-3 text-[11px] text-on-surface-variant/60 leading-5">
                                هنوز عضو یا ذخیره‌شده‌ای ندارید — از فهرست پایین بازارها را ببینید.
                            </div>
                        )}
                        {(arms ?? []).filter((a: any) => a.status !== 'removed' && a.status !== 'banned').map((a: any) => {
                            const isCurrent = a.slug === currentSlug;
                            const isActive = a.status === 'active';
                            const isSaved = a.status === 'saved';
                            // ✅ عضوِ فعال و بازارِ ذخیره‌شده هر دو کلیک‌پذیرند
                            const selectable = isActive || isSaved;
                            const statusLabel = !isActive ? (STATUS_LABEL[a.status] ?? 'غیرفعال') : null;
                            const rowLogo = a.logoUrl || (a.arm?.logoUrl) || undefined;
                            const rowName = a.name || a.arm?.name || a.slug;

                            return selectable ? (
                                <button
                                    key={a.slug}
                                    type="button"
                                    role="menuitem"
                                    onClick={() => switchArm(a.slug)}
                                    className={cn(
                                        'w-full flex items-center gap-2.5 h-12 px-2.5 rounded-xl text-right transition-colors',
                                        isCurrent ? 'bg-primary/10' : 'hover:bg-surface-container-high',
                                    )}
                                >
                                    {rowLogo ? (
                                        <Image src={rowLogo} alt={rowName} width={32} height={32}
                                               className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
                                               unoptimized={rowLogo.startsWith('https://')} />
                                    ) : (
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <Store className="w-3.5 h-3.5 text-primary" />
                                        </div>
                                    )}
                                    <span className="flex-1 min-w-0">
                                        <span className={cn('block text-[13px] truncate', isCurrent ? 'font-bold text-primary' : 'font-medium text-on-surface')}>
                                            {rowName}
                                        </span>
                                    </span>
                                    {/* ✅ بج «فقط ذخیره‌شده» — متمایز از عضویت واقعی */}
                                    {isSaved && !isCurrent && <BookmarkCheck className="w-4 h-4 text-amber-500 flex-shrink-0" />}
                                    {isCurrent && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
                                </button>
                            ) : (
                                <div
                                    key={a.slug}
                                    aria-disabled="true"
                                    className="w-full flex items-center gap-2.5 h-12 px-2.5 rounded-xl opacity-50 cursor-not-allowed"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center flex-shrink-0">
                                        <Store className="w-3.5 h-3.5 text-on-surface-variant/60" />
                                    </div>
                                    <span className="flex-1 min-w-0">
                                        <span className="block text-[13px] text-on-surface-variant truncate">{rowName}</span>
                                        <span className="block text-[10px] text-on-surface-variant/60">{statusLabel}</span>
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* ✅ اکسپلور بازارها — نقطهٔ دسترسی به لیست و جستجوی همهٔ بازارها */}
                    <div className="border-t border-outline-variant/20 mt-1 pt-1">
                        <Link
                            href="/markets"
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            className="w-full flex items-center gap-2.5 h-10 px-2.5 rounded-xl text-[13px] font-bold text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                        >
                            <Compass className="w-4 h-4" />
                            سایر بازارها
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}