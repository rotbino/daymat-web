// app/components/ArmSwitcher.tsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { useArms } from '@/lib/api/apiHooks';
import { Check, ChevronDown, Compass, Store } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_LABEL: Record<string, string> = {
    pending: 'در انتظار تأیید',
    paused: 'موقتاً غیرفعال',
    banned: 'مسدود',
    rejected: 'رد شده',
};

interface Props {
    variant?: 'desktop' | 'mobile';
}

/**
 * سوییچر بازار: بلوک برند (لوگو + نام) کلیک‌پذیر است و
 * لیست بازارهایی که کاربر عضو آن‌هاست را باز می‌کند.
 * عضویت غیرفعال نمایش داده می‌شود ولی قابل انتخاب نیست.
 * مهمان یا تک‌بازاری → Link ساده به بازار فعلی.
 */
export default function ArmSwitcher({ variant = 'desktop' }: Props) {
    const router = useRouter();
    const { currentSlug, currentArm } = useSelector((s: RootState) => s.arm);
    const { data: arms } = useArms();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const armName = currentArm?.name || 'بازار';
    const slogan = (currentArm as any)?.slogan || '';
    const logo = (currentArm as any)?.logoUrl || undefined;
    const isMobile = variant === 'mobile';

    // لیست بازارهای عضو — تا وقتی لود نشده یا تک‌موردی است، dropdown معنا ندارد
    const switchable = !!arms && arms.length > 1;

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

    // ─── حالت ساده: مهمان / تک‌بازار / هنوز لود نشده ───
    if (!switchable) {
        return (
            <Link
                href={currentSlug ? `/${currentSlug}` : '/'}
                className={cn('flex-shrink-0 flex items-center min-w-0', isMobile ? 'gap-1.5 px-1' : 'gap-2.5')}
            >
                {logo ? (
                    <Image
                        src={logo} alt={armName}
                        width={isMobile ? 32 : 40} height={isMobile ? 32 : 40}
                        className={cn('rounded-xl object-contain flex-shrink-0', isMobile ? 'w-8 h-8' : 'w-10 h-10')}
                        unoptimized={logo.startsWith('https://')}
                    />
                ) : (
                    <div className={cn('rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0', isMobile ? 'w-8 h-8' : 'w-9 h-9')}>
                        <Store className={cn('text-primary', isMobile ? 'w-4 h-4' : 'w-[18px] h-[18px]')} />
                    </div>
                )}
                <span className="flex flex-col leading-tight min-w-0">
                    <span className={cn('font-extrabold text-on-surface truncate', isMobile ? 'text-[13px] max-w-[110px]' : 'text-[15px]')}>
                        {armName}
                    </span>
                    {!isMobile && slogan && (
                        <span className="hidden xl:block text-[10px] text-on-surface-variant truncate">{slogan}</span>
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
                    <Image
                        src={logo} alt={armName}
                        width={isMobile ? 32 : 40} height={isMobile ? 32 : 40}
                        className={cn('rounded-xl object-contain flex-shrink-0', isMobile ? 'w-8 h-8' : 'w-10 h-10')}
                        unoptimized={logo.startsWith('https://')}
                    />
                ) : (
                    <div className={cn('rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0', isMobile ? 'w-8 h-8' : 'w-9 h-9')}>
                        <Store className={cn('text-primary', isMobile ? 'w-4 h-4' : 'w-[18px] h-[18px]')} />
                    </div>
                )}
                <span className="flex flex-col leading-tight min-w-0">
                    <span className={cn('font-extrabold text-on-surface truncate', isMobile ? 'text-[13px] max-w-[100px]' : 'text-[15px]')}>
                        {armName}
                    </span>
                    {!isMobile && slogan && (
                        <span className="hidden xl:block text-[10px] text-on-surface-variant truncate">{slogan}</span>
                    )}
                </span>
                <ChevronDown className={cn('flex-shrink-0 text-on-surface-variant/70 transition-transform', isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4', open && 'rotate-180')} />
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
                        {(arms ?? []).map((a: any) => {
                            const isCurrent = a.slug === currentSlug;
                            const isActive = a.status === 'active';
                            const statusLabel = !isActive ? (STATUS_LABEL[a.status] ?? 'غیرفعال') : null;
                            const rowLogo = a.logoUrl || (a.arm?.logoUrl) || undefined;
                            const rowName = a.name || a.arm?.name || a.slug;

                            return isActive ? (
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

                    {/* اگر روت مرور/ساخت بازار متفاوت است فقط این href را عوض کن */}
                    {/*<div className="border-t border-outline-variant/20 mt-1 pt-1">
                        <Link
                            href="/arms"
                            role="menuitem"
                            onClick={() => setOpen(false)}
                            className="w-full flex items-center gap-2.5 h-10 px-2.5 rounded-xl text-[13px] text-on-surface-variant hover:text-primary hover:bg-primary/5 transition-colors"
                        >
                            <Compass className="w-4 h-4" />
                            مشاهده همه بازارها
                        </Link>
                    </div>*/}
                </div>
            )}
        </div>
    );
}