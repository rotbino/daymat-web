// app/profile/page.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/lib/store/store';
import { performLogout } from '@/lib/store/slices/authSlice';
import { apiService } from '@/lib/api/apiService';
import { toast } from 'sonner';
import {
    User, Pencil, Key, CreditCard, TrendingUp, Moon, Sun,
    Info, FileText, Lightbulb, LogOut, Wallet, ArrowLeft,
    Gift, Copy, BadgeCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import NavTabs from '@/app/home/nav/NavTabs';
import EditProfileModal from '@/app/[slug]/components/EditProfileModal';
import { ChangePasswordModal } from '@/app_/register/ChangePasswordModal';

export default function ProfilePage() {
    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useSelector((s: RootState) => s.auth);
    const [isDark, setIsDark] = useState(false);
    const [editOpen, setEditOpen] = useState(false);
    const [passOpen, setPassOpen] = useState(false);
    const [copied, setCopied] = useState<'code' | 'link' | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);

    const { data: credit } = useQuery({
        queryKey: ['credit-balance'],
        queryFn: () => apiService.credit.getBalance(),
        staleTime: 60_000,
    });

    React.useEffect(() => {
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleTheme = () => {
        const next = !isDark;
        document.documentElement.classList.toggle('dark', next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
        setIsDark(next);
    };

    const firstName = (user?.fullName || '').split(' ')[0] || 'کاربر';

    // ─── رفرال ───
    const referralCode = (user as any)?.referralCode as string | undefined;
    const inviteLink = referralCode
        ? `${typeof window !== 'undefined' ? window.location.origin : ''}/catalog/register?ref=${referralCode}`
        : null;

    const copyToClipboard = async (text: string, kind: 'code' | 'link') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(kind);
            toast.success(kind === 'link' ? 'لینک دعوت کپی شد' : 'کد دعوت کپی شد');
            setTimeout(() => setCopied(null), 1500);
        } catch {
            toast.error('کپی نشد — دستی انتخاب و کپی کن');
        }
    };

    // ─── خروج کامل: باطل‌سازی توکن در سرور + پاک‌سازی کلاینت + پرش به خانه ───
    const handleLogout = async () => {
        if (loggingOut) return; // جلوگیری از دوبارکلیک
        setLoggingOut(true);
        try {
            await dispatch(performLogout()).unwrap();
        } catch {
            // حتی با خطا، پاک‌سازی محلی کامل انجام شده است
        }
        // رفرش کامل: اپ از صفر بوت می‌شود — انگار اولین بازدید است
        // replace تا دکمهٔ برگشت مرورگر به پروفایل برنگردد
        window.location.replace('/');
    };

    const Row = ({ icon: Icon, label, onClick, danger }: any) => (
        <button onClick={onClick}
                className="w-full rounded-xl border border-outline-variant/40 bg-white dark:bg-gray-900 p-3.5
                flex items-center gap-3 text-right hover:border-primary/40 transition-colors">
            <Icon className={cn('w-4.5 h-4.5 flex-shrink-0', danger ? 'text-error' : 'text-on-surface-variant')} />
            <span className={cn('flex-1 text-[13px] font-bold', danger ? 'text-error' : 'text-on-surface')}>{label}</span>
            <ArrowLeft className="w-4 h-4 text-on-surface-variant/40" />
        </button>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-surface via-surface to-surface-container-low/40 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/40 pb-24">
            <NavTabs />
            <main className="max-w-2xl mx-auto px-4 pt-6 space-y-4">

                {/* ═══ 🔴 هشدار رمز موقت — چشمک‌زن، بالای همه، به مدال وصل ═══ */}
                {user?.temporaryPassword && (
                    <div className="rounded-2xl border border-error/40 bg-error/5 overflow-hidden animate-pulse">
                        {/* ردیف ۱ — هشدار رمز */}
                        <button  onClick={() => setPassOpen(true)}
                                className="w-full p-3 flex items-center gap-3 text-right hover:bg-error/10 transition-colors">
                            <Key className="w-4.5 h-4.5 text-error flex-shrink-0" />
                            <span className="text-xs text-on-surface flex-1">
                رمز عبور شما موقت است (۱۲۳۴۵۶) — <b className="text-error">همین حالا عوضش کن</b>
            </span>
                            <span className="h-8 px-3 rounded-lg bg-error text-white text-[10px] font-bold flex items-center flex-shrink-0">
                تغییر رمز
            </span>
                        </button>
                        {/* ردیف ۲ — تأیید شماره: ملایم، غیرتکراری، بدون فشار */}
                        <div className="px-3 py-2 bg-error/[0.03] dark:bg-error/[0.06] border-t border-error/20
            flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-900/40 grid place-items-center flex-shrink-0">
                <BadgeCheck className="w-3 h-3 text-emerald-600" />
            </span>
                            <span className="text-[12px] text-on-surface-variant leading-4">
                شماره همراه شما: <b className="text-on-surface" dir="ltr">{user?.phone}</b>
                — لطفاً شماره خود را چک کنید
            </span>
                        </div>
                    </div>
                )}

                {/* ═══ کارت پروفایل ═══ */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4 flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {user?.avatarFile?.thumbnailPath
                            ? <Image src={user.avatarFile.thumbnailPath} alt="" width={56} height={56} className="w-full h-full object-cover" unoptimized />
                            : <User className="w-6 h-6 text-primary" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-on-surface truncate">{user?.fullName || 'پروفایل را تکمیل کنید'}</p>
                        <p className="text-[11px] text-on-surface-variant/70" dir="ltr">{user?.phone}</p>
                    </div>
                    <button onClick={() => setEditOpen(true)}
                            className="h-9 px-3.5 flex items-center gap-1.5 rounded-xl border border-outline-variant/50 text-xs font-bold
                            text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors flex-shrink-0">
                        <Pencil className="w-3.5 h-3.5" /> ویرایش
                    </button>
                </div>

                {/* ═══ کارت دعوت — بالای کیف، جای خودش ═══ */}
                {referralCode && (
                    <div className="bg-gradient-to-l from-primary/10 via-primary/5 to-transparent
                        border border-primary/20 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center gap-2.5">
                            <span className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                                <Gift className="w-4.5 h-4.5 text-primary" />
                            </span>
                            <div className="flex-1">
                                <p className="text-sm font-extrabold text-on-surface">دعوت دوستان</p>
                                <p className="text-[10px] text-on-surface-variant/70 mt-0.5">
                                    لینک دعوتت رو برای کسانی که کاتالوگ دیمت به دردشون می‌خوره ارسال کن.
                                </p>
                            </div>
                        </div>

                        {/* لینک دعوت */}
                        <button onClick={() => copyToClipboard(inviteLink!, 'link')}
                                className="w-full flex items-center gap-2 rounded-xl bg-white dark:bg-gray-900
                                    border border-outline-variant/40 px-3 py-2.5 hover:border-primary/40 transition-colors text-right">
                            <span className="flex-1 text-[11px] text-on-surface-variant truncate" dir="ltr">
                                {inviteLink}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-bold text-primary flex-shrink-0">
                                {copied === 'link' ? 'کپی شد ✓' : <><Copy className="w-3 h-3" /> کپی لینک</>}
                            </span>
                        </button>

                        {/* کد دعوت */}
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-on-surface-variant/70">کد تو:</span>
                            <button onClick={() => copyToClipboard(referralCode, 'code')}
                                    className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-dashed
                                        border-primary/40 bg-primary/5 font-mono text-xs font-extrabold text-primary
                                        hover:bg-primary/10 transition-colors" dir="ltr">
                                {referralCode}
                                {copied === 'code'
                                    ? <span className="text-[9px] font-sans">کپی شد ✓</span>
                                    : <Copy className="w-3 h-3 opacity-60" />}
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══ کیف اعتبار ═══ */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/50 dark:border-gray-700 p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 text-sm font-extrabold text-on-surface"><Wallet className="w-4 h-4 text-primary" /> کیف اعتبار</span>
                        <button onClick={() => router.push('/credit/purchase')} className="text-[11px] font-bold text-primary">+ شارژ</button>
                    </div>
                    <p className="text-2xl font-black text-primary">{(credit?.balance ?? 0).toLocaleString('fa-IR')}</p>
                    <div className="flex gap-2 mt-3">
                        <LinkCard icon={CreditCard} label="تاریخچه پرداخت" href="/credit/payments" />
                        <LinkCard icon={TrendingUp} label="گزارش مصرف" href="/credit/report" />
                    </div>
                </div>

                {/* ═══ تنظیمات ═══ */}
                <section className="space-y-2">
                    <h2 className="text-xs font-bold text-on-surface-variant/70 px-1">تنظیمات</h2>
                    <Row icon={Key} label="تغییر رمز عبور" onClick={() => setPassOpen(true)} />
                    <Row icon={isDark ? Sun : Moon} label={isDark ? 'تم روشن' : 'تم تاریک'} onClick={toggleTheme} />
                </section>

                {/* ═══ درباره ═══ */}
                <section className="space-y-2">
                    <h2 className="text-xs font-bold text-on-surface-variant/70 px-1">درباره</h2>
                    <Row icon={Info} label="درباره دیمت" onClick={() => router.push('/docs/about')} />
                    <Row icon={FileText} label="قوانین" onClick={() => router.push('/docs/terms')} />
                    <Row icon={Lightbulb} label="پیشنهادات و انتقادات" onClick={() => router.push('/feedback')} />
                    <Row icon={LogOut} label={loggingOut ? 'در حال خروج…' : 'خروج از حساب'} danger onClick={handleLogout} />
                </section>
            </main>

            {/* ═══ مودال‌ها ═══ */}
            <EditProfileModal isOpen={editOpen} onClose={() => setEditOpen(false)} />
            <ChangePasswordModal isOpen={passOpen} onClose={() => setPassOpen(false)}
                                 onSuccess={() => toast.success('رمز عبور عوض شد — از این به بعد با رمز جدید وارد شو')} />
        </div>
    );
}

function LinkCard({ icon: Icon, label, href }: any) {
    return (
        <a href={href} className="flex-1 rounded-xl border border-outline-variant/40 p-2.5 flex items-center gap-2
            text-[11px] font-bold text-on-surface-variant hover:text-primary hover:border-primary/40 transition-colors">
            <Icon className="w-3.5 h-3.5" /> {label}
        </a>
    );
}