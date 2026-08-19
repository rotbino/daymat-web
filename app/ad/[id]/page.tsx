'use client';

import React, {useEffect, useMemo, useState} from 'react';
import {useParams, useRouter} from 'next/navigation';
import {useSelector} from 'react-redux';
import {RootState} from '@/lib/store/store';
import {apiService} from '@/lib/api/apiService';
import {toast} from 'sonner';
import {
    ArrowUpCircle,
    BadgeCheck,
    Banknote,
    BarChart3,
    Bookmark,
    Building2,
    ChevronRight,
    Clock,
    CreditCard,
    Eye,
    FileText,
    Layers,
    Loader2,
    MapPin,
    Package,
    Phone,
    Share2,
    Shield,
    ShoppingCart,
    Tag,
    Timer,
    User,
    Zap
} from 'lucide-react';
import {cn} from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import {AdStats} from "@/app/arm-admin/ads/components/AdStats";

/* ───────────────────── Helpers ───────────────────── */

function formatNum(n: number | undefined) {
    return n?.toLocaleString('fa-IR') ?? '—';
}

function timeLeft(expiresAt: string) {
    const hours = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60));
    if (hours <= 0) return {text: 'منقضی', urgent: true};
    if (hours < 24) return {text: `${hours} ساعت`, urgent: true};
    const days = Math.floor(hours / 24);
    return {text: `${days} روز`, urgent: days <= 2};
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'لحظاتی پیش';
    if (m < 60) return `${m} دقیقه پیش`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} ساعت پیش`;
    return `${Math.floor(h / 24)} روز پیش`;
}

function getTierLabel(tier: string | undefined) {
    return {gold: 'طلایی', silver: 'نقره‌ای', blue: 'برنزی'}[tier || ''] || null;
}

function getTierBadge(tier: string | undefined) {
    if (tier === 'gold') return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/40';
    if (tier === 'silver') return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    if (tier === 'blue') return 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200/60 dark:border-sky-800/40';
    return '';
}

/* ───────────────────── Pill Badge ───────────────────── */

function Pill({children, variant = 'default', className}: {
    children: React.ReactNode;
    variant?: 'default' | 'amber' | 'indigo' | 'green' | 'red';
    className?: string;
}) {
    const styles: Record<string, string> = {
        default: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
        amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400',
        indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400',
        green: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400',
        red: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',
    };
    return (
        <span className={cn(
            'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium leading-none',
            styles[variant],
            className
        )}>
            {children}
        </span>
    );
}

/* ───────────────────── Main Page ───────────────────── */

export default function AdDetailPage() {
    const router = useRouter();
    const params = useParams();
    const adId = params.id as string;

    const {user, isAuthenticated} = useSelector((state: RootState) => state.auth);
    const {currentArm, currentSlug} = useSelector((state: RootState) => state.arm);

    const [ad, setAd] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isCalling, setIsCalling] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [similarAds, setSimilarAds] = useState<any[]>([]);
    const [isMember, setIsMember] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const armConfig = (currentArm?.config as any) || {};
    const priceTable = armConfig.modules?.priceTable || {};
    const requireLoginToCall = priceTable.requireLoginToCall ?? false;
    const requireMembershipToCall = priceTable.requireMembershipToCall ?? false;

    const unit = ad?.unit?.shortCode || 'تن';
    const paymentMethods = ad?.paymentMethods;
    const specs = ad?.specs || ad?.customFields?.specs || {};
    const seller = ad?.business;
    const owner = seller?.owner;
    const adImages = ad?.files?.filter((f: any) => f.fieldKey?.startsWith('ad-image')) || [];
    const hasImages = adImages.length > 0;
    const expiry = ad ? timeLeft(ad.expiresAt) : {text: '', urgent: false};

    /* پرداخت‌های چکی و اقساطی */
    let chequeOptions: any[] = [], installmentOptions: any[] = [];
    let chequeDesc = '', installDesc = '';
    if (paymentMethods) {
        chequeOptions = paymentMethods.cheque || [];
        installmentOptions = paymentMethods.installment || [];
        chequeDesc = paymentMethods.chequeDescription || '';
        installDesc = paymentMethods.installmentDescription || '';
    }
    const hasCheque = chequeOptions.length > 0;
    const hasInstallment = installmentOptions.length > 0;
    const hasAltPayment = hasCheque || hasInstallment;

    /* تب‌ها — ادغام توضیحات و مشخصات */
    const tabs = useMemo(() => {
        const t: { id: string; label: string; icon: React.ReactNode }[] = [];
        if (isOwner) t.push({id: 'stats', label: 'آمار', icon: <BarChart3 className="w-4 h-4"/>});
        if (ad?.description?.trim() || Object.keys(specs).length > 0)
            t.push({id: 'details', label: 'توضیحات', icon: <FileText className="w-4 h-4"/>});
        if (hasAltPayment)
            t.push({id: 'payment', label: 'پرداخت', icon: <CreditCard className="w-4 h-4"/>});
        t.push({id: 'business', label: 'فروشنده', icon: <Building2 className="w-4 h-4"/>});
        if (similarAds.length > 0)
            t.push({id: 'similar', label: 'آگهی‌ها', icon: <Package className="w-4 h-4"/>});
        return t;
    }, [isOwner, ad, specs, similarAds, hasAltPayment]);

    const [activeTab, setActiveTab] = useState('');
    useEffect(() => {
        if (tabs.length > 0 && !tabs.some(t => t.id === activeTab)) setActiveTab(tabs[0].id);
    }, [tabs, activeTab]);

    /* واکشی داده‌ها */
    useEffect(() => {
        fetchDetail();
        checkMember();
        checkSaved();
        trackView();
    }, [adId]);

    const fetchDetail = async () => {
        setLoading(true);
        try {
            const data = await apiService.ad.getDetail(adId);
            setAd(data);
            if (data.business?.id) {
                const sim = await apiService.ad.getBusinessAds(data.business.id);
                setSimilarAds(sim.filter((a: any) => a.id !== adId && a.status === 'active'));
            }
            if (user?.id && data.business?.owner?.id === user.id) setIsOwner(true);
        } catch (e: any) {
            toast.error(e?.message || 'خطا در دریافت اطلاعات');
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    const checkMember = async () => {
        if (!isAuthenticated || !currentSlug) return;
        try {
            const arms = await apiService.arm.getUserArms();
            setIsMember(arms.some((a: any) => a.slug === currentSlug));
        } catch {
            setIsMember(false);
        }
    };

    const checkSaved = async () => {
        if (!isAuthenticated) return;
        try {
            const saved = await apiService.ad.getSavedAds();
            setIsSaved(saved.some((s: any) => s.id === adId));
        } catch { /* ignore */
        }
    };

    const trackView = async () => {
        try {
            await apiService.ad.interact(adId, 'view', {sessionId: 's-' + Date.now()});
        } catch { /* ignore */
        }
    };

    /* هندلرها */
    const handleSave = async () => {
        if (!isAuthenticated) {
            router.push(`/login?redirect=/ad/${adId}`);
            return;
        }
        try {
            if (isSaved) {
                await apiService.ad.unsave(adId);
                setIsSaved(false);
                toast.success('حذف از ذخیره‌ها');
            } else {
                await apiService.ad.save(adId);
                setIsSaved(true);
                toast.success('ذخیره شد');
            }
        } catch (e: any) {
            toast.error(e?.message || 'خطا');
        }
    };

    const handleContact = async () => {
        if (requireLoginToCall && !isAuthenticated) {
            router.push(`/login?redirect=/ad/${adId}`);
            return;
        }
        if (requireMembershipToCall && !isMember) {
            toast.error('برای تماس، ابتدا عضو بازار شوید');
            return;
        }
        const callCost = armConfig.economy?.interactionCosts?.call || 0;
        if (callCost > 0 && isAuthenticated) {
            try {
                const bal = await apiService.credit.getBalance();
                if (bal.balance < callCost) {
                    toast.error(`اعتبار کافی نیست (نیاز: ${callCost})`);
                    return;
                }
            } catch {
                toast.error('خطا در بررسی اعتبار');
                return;
            }
        }
        if (isCalling) return;
        setIsCalling(true);
        try {
            const info = await apiService.ad.getContact(adId);
            await apiService.ad.interact(adId, 'call', {});
            if (window.innerWidth < 768) window.location.href = `tel:${info.phone}`;
            else {
                toast.info(`${info.businessName}\n${info.phone}`, {duration: 8000});
                navigator.clipboard.writeText(info.phone).catch(() => {
                });
            }
        } catch (e: any) {
            const code = e?.data?.errorCode;
            if (code === 'DAILY_CALL_LIMIT_EXCEEDED' || code === 'INSUFFICIENT_CREDIT') toast.error(e?.data?.message || 'محدودیت تماس');
            else toast.error(e?.message || 'خطا');
        } finally {
            setIsCalling(false);
        }
    };

    const handleShare = async () => {
        const url = window.location.href;
        try {
            if (navigator.share) {
                await navigator.share({title: ad?.productType || ad?.title, url});
                await apiService.ad.interact(adId, 'share', {});
            } else {
                await navigator.clipboard.writeText(url);
                toast.success('لینک کپی شد');
                await apiService.ad.interact(adId, 'share', {});
            }
        } catch (e: any) {
            if (e?.name !== 'AbortError') console.error(e);
        }
    };

    /* ───── Loading ───── */
    if (loading || !ad) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
                <Loader2 className="w-9 h-9 animate-spin text-primary"/>
            </div>
        );
    }

    const tierLabel = getTierLabel(seller?.verificationTier);
    const tierBadge = getTierBadge(seller?.verificationTier);
    const bizType = {
        wholesaler: 'عمده‌فروش',
        producer: 'تولیدی',
        importer: 'واردکننده',
        exporter: 'صادرکننده'
    }[seller?.type || ''] || seller?.type || '';
    const locLabel = seller?.province && seller?.city ? `${seller.province}، ${seller.city}` : seller?.city || seller?.province || '';
    const ownerAvatar = owner?.avatarFile?.path
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${owner.avatarFile.id}/thumbnail`
        : owner?.avatarUrl || null;

    /* ════════════════════ RENDER ════════════════════ */
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950">

            {/* ─── هدر چسبان ─── */}
            <header
                className="sticky top-0 z-40 bg-white/85 dark:bg-gray-900/85 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60">
                <div className="max-w-5xl mx-auto px-4 sm:px-6">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-2 min-w-0">
                            <button onClick={() => router.back()}
                                    className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                                <ChevronRight className="w-5 h-5 text-gray-500"/>
                            </button>
                            <div className="min-w-0">
                                <h1 className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[180px] sm:max-w-sm">
                                    {ad.productType || ad.title}
                                </h1>
                                <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[180px] sm:max-w-sm">
                                    {seller?.name}
                                </p>
                            </div>
                        </div>
                        {tierLabel && (
                            <span
                                className={cn('flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0', tierBadge)}>
                                <BadgeCheck className="w-3 h-3"/>{tierLabel}
                            </span>
                        )}
                    </div>
                </div>
            </header>

            {/* ─── محتوای اصلی ─── */}
            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 pb-28 md:pb-10">

                {/* ───── بخش بالایی: گالری + سایدبار ───── */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                    {/* ستون گالری */}
                    <div className="lg:col-span-3">
                        {hasImages ? (
                            <div className="grid grid-cols-2 gap-2.5">
                                {adImages.slice(0, 4).map((file: any, idx: number) => (
                                    <div
                                        key={file.id}
                                        className={cn(
                                            'relative bg-gray-100 dark:bg-gray-800 rounded-2xl overflow-hidden group',
                                            idx === 0 ? 'col-span-2 aspect-[16/10]' : 'aspect-square'
                                        )}
                                    >
                                        <Image
                                            src={file.path?.startsWith('http') ? file.path : `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${file.id}`}
                                            alt={ad.productType || ad.title}
                                            fill
                                            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                            unoptimized
                                        />
                                        {idx === 3 && adImages.length > 4 && (
                                            <div
                                                className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
                                                <span
                                                    className="text-white font-bold text-lg">+{adImages.length - 4}</span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div
                                className="aspect-[16/10] bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center">
                                <Package className="w-16 h-16 text-gray-300 dark:text-gray-600"/>
                            </div>
                        )}
                    </div>

                    {/* ─── ستون سایدبار ─── */}
                    <div className="lg:col-span-2 space-y-3.5">

                        {/* ── کارت قیمت ── */}
                        <div
                            className="relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800/80 border-t-[3px] border-t-primary p-4 shadow-sm">
                            <div className="flex items-center justify-between">
                                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500">قیمت
                                    هر {unit}</p>
                                <span className={cn(
                                    'inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full',
                                    expiry.urgent
                                        ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                                        : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                                )}>
                <Clock className="w-3 h-3"/>
                                    {expiry.text} مانده
            </span>
                            </div>
                            <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-none">
                {formatNum(ad.unitPrice)}
            </span>
                                <span className="text-sm text-gray-400 dark:text-gray-500 font-medium">تومان</span>
                            </div>
                        </div>

                        {/* ── اطلاعات سریع ۲×۲ ── */}
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                {
                                    icon: <ShoppingCart className="w-4 h-4 text-primary/60"/>,
                                    label: 'حداقل سفارش',
                                    value: `${formatNum(ad.minQuantity)} ${unit}`
                                },
                                {
                                    icon: <Layers className="w-4 h-4 text-primary/60"/>,
                                    label: 'موجودی',
                                    value: ad.availableQuantity ? `${formatNum(ad.availableQuantity)} ${unit}` : 'نامشخص'
                                },
                                {
                                    icon: <MapPin className="w-4 h-4 text-primary/60"/>,
                                    label: 'محل تحویل',
                                    value: ad.city || 'نامشخص'
                                },
                                {
                                    icon: <Tag className="w-4 h-4 text-primary/60"/>,
                                    label: 'دسته‌بندی',
                                    value: ad.category?.title || '—'
                                },
                            ].map((item) => (
                                <div key={item.label}
                                     className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/60 dark:border-gray-800/60 px-3.5 py-3">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        {item.icon}
                                        <span
                                            className="text-[11px] text-gray-400 dark:text-gray-500">{item.label}</span>
                                    </div>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{item.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* ── ردیف برچسب‌ها ── */}
                        <div className="flex flex-wrap gap-2 px-0.5">
                            {ad.isBumped && (
                                <Pill variant="amber">
                                    <ArrowUpCircle className="w-3 h-3"/>نردبان
                                </Pill>
                            )}
                            {hasCheque && (
                                <Pill variant="amber">
                                    <Banknote className="w-3 h-3"/>چکی
                                </Pill>
                            )}
                            {hasInstallment && (
                                <Pill variant="indigo">
                                    <Layers className="w-3 h-3"/>اقساطی
                                </Pill>
                            )}
                            <Pill variant="default">
                                <Timer className="w-3 h-3"/>{timeAgo(ad.updatedAt)}
                            </Pill>
                            <Pill variant="default">
                                <Eye className="w-3 h-3"/>{formatNum(ad.viewCount)} بازدید
                            </Pill>
                        </div>

                        {/* ── مینی‌کارت فروشنده ── */}
                        {owner && (
                            <div
                                className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200/60 dark:border-gray-800/60 px-4 py-3">
                                <div
                                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0">
                                    {ownerAvatar ? (
                                        <Image src={ownerAvatar} alt={owner.fullName || ''} width={40} height={40}
                                               className="object-cover w-full h-full" unoptimized/>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center"><User
                                            className="w-5 h-5 text-gray-400"/></div>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{owner.fullName}</p>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{seller?.name}</p>
                                </div>
                                {tierLabel && (
                                    <span
                                        className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0', tierBadge)}>
                    {tierLabel}
                </span>
                                )}
                            </div>
                        )}

                        {/* ── دکمه تماس (دسکتاپ) ── */}
                        <button
                            onClick={handleContact}
                            disabled={isCalling}
                            className="hidden md:flex w-full bg-primary hover:bg-primary/90 active:scale-[0.98] text-white py-3.5 rounded-xl font-bold items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all duration-200"
                        >
                            {isCalling
                                ? <div
                                    className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"/>
                                : <><Phone className="w-5 h-5"/>تماس با فروشنده</>
                            }
                        </button>
                        {(requireLoginToCall && !isAuthenticated) && (
                            <p className="hidden md:block text-[11px] text-center text-amber-600 dark:text-amber-400 -mt-1">برای
                                تماس ابتدا وارد شوید</p>
                        )}
                        {(requireMembershipToCall && !isMember && isAuthenticated) && (
                            <p className="hidden md:block text-[11px] text-center text-amber-600 dark:text-amber-400 -mt-1">عضویت
                                در بازار الزامی است</p>
                        )}
                    </div>
                </div>

                {/* ───── تب‌ها ───── */}
                {tabs.length > 0 && (
                    <div className="mt-8 -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-x-auto scrollbar-hide">
                        <div className="flex gap-1 border-b border-gray-200/60 dark:border-gray-800/60 min-w-max">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'px-4 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 flex items-center gap-2 -mb-px',
                                        activeTab === tab.id
                                            ? 'text-primary bg-white dark:bg-gray-900 border border-b-0 border-gray-200/60 dark:border-gray-800/60'
                                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                    )}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* ───── محتوای تب‌ها ───── */}
                <div className="mt-5">

                    {/* آمار — فقط مالک */}
                    {activeTab === 'stats' && isOwner && (
                        <div
                            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm">
                            <AdStats adId={adId}/>
                        </div>
                    )}

                    {/* توضیحات و مشخصات (ادغام‌شده) */}
                    {activeTab === 'details' && (
                        <div
                            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 shadow-sm overflow-hidden">
                            {ad.description?.trim() && (
                                <div className="p-5">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-primary"/>توضیحات
                                    </h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-7 text-justify whitespace-pre-wrap">
                                        {ad.description}
                                    </p>
                                </div>
                            )}
                            {ad.description?.trim() && Object.keys(specs).length > 0 && (
                                <div className="border-t border-gray-100 dark:border-gray-800/50 mx-5"/>
                            )}
                            {Object.keys(specs).length > 0 && (
                                <div className="p-5">
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Tag className="w-4 h-4 text-primary"/>مشخصات فنی
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2">
                                        {Object.entries(specs).map(([key, val], i) => (
                                            <div key={key} className={cn(
                                                'flex justify-between items-center py-3 px-1',
                                                i < Object.keys(specs).length - 1 && 'border-b border-gray-100 dark:border-gray-800/50 sm:border-0 sm:py-0'
                                            )}>
                                                <span className="text-sm text-gray-400 dark:text-gray-500">{key}</span>
                                                <span
                                                    className="text-sm font-medium text-gray-800 dark:text-white">{String(val)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* شرایط پرداخت */}
                    {activeTab === 'payment' && (
                        <div
                            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm space-y-3">
                            {/* نقدی */}
                            <div
                                className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/30">
                                <div
                                    className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                                    <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400"/>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">نقدی</p>
                                    <p className="text-sm font-semibold text-gray-800 dark:text-white mt-0.5">
                                        {formatNum(ad.unitPrice)} تومان / {unit}
                                    </p>
                                </div>
                            </div>

                            {/* چکی */}
                            {hasCheque && (
                                <div
                                    className="flex items-start gap-3 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30">
                                    <div
                                        className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mt-0.5">
                                        <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400"/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">پرداخت
                                            چکی</p>
                                        <div className="space-y-1 mt-1.5">
                                            {chequeOptions.map((opt: any, i: number) => (
                                                <div key={i} className="flex items-baseline gap-2">
                                                    <span
                                                        className="text-sm font-semibold text-gray-800 dark:text-white">{formatNum(opt.price)} تومان</span>
                                                    <span
                                                        className="text-xs text-gray-400 dark:text-gray-500">/ {unit} — {opt.days} روزه</span>
                                                </div>
                                            ))}
                                        </div>
                                        {chequeDesc &&
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">{chequeDesc}</p>}
                                    </div>
                                </div>
                            )}

                            {/* اقساطی */}
                            {hasInstallment && (
                                <div
                                    className="flex items-start gap-3 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/50 dark:border-indigo-800/30">
                                    <div
                                        className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mt-0.5">
                                        <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400"/>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400">پرداخت
                                            اقساطی</p>
                                        <div className="space-y-1.5 mt-1.5">
                                            {installmentOptions.map((opt: any, i: number) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <span
                                                        className="text-sm font-semibold text-gray-800 dark:text-white">{formatNum(opt.price)} تومان</span>
                                                    <span
                                                        className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                                        / {unit} — {opt.months} ماهه
                                                        {opt.prepaymentPercent ? ` (${opt.prepaymentPercent}٪ پیش‌پرداخت)` : ''}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {installDesc &&
                                            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-2">{installDesc}</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* فروشنده */}
                    {activeTab === 'business' && seller && (
                        <div className="space-y-4">
                            {/* هدر فروشنده */}
                            <div
                                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm">
                                <div className="flex items-start gap-4">
                                    <div
                                        className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0">
                                        {seller.logoUrl ? (
                                            <Image src={seller.logoUrl} alt={seller.name} width={56} height={56}
                                                   className="object-cover w-full h-full" unoptimized/>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center"><Building2
                                                className="w-7 h-7 text-gray-400"/></div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h2 className="text-base font-bold text-gray-900 dark:text-white">{seller.name}</h2>
                                            {tierLabel && (
                                                <span
                                                    className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border', tierBadge)}>
                                                    <BadgeCheck className="w-3 h-3"/>{tierLabel}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                            {bizType && (
                                                <span
                                                    className="px-2.5 py-0.5 bg-primary/[0.07] text-primary dark:text-primary-400 rounded-full text-[11px] font-medium">
                                                    {bizType}
                                                </span>
                                            )}
                                            {locLabel && (
                                                <span
                                                    className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3"/>{locLabel}
                                                </span>
                                            )}
                                        </div>
                                        {seller.shortDescription && (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-6">{seller.shortDescription}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* اطلاعات اصلی + تماس */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div
                                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm">
                                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">اطلاعات
                                        کسب‌وکار</h3>
                                    <div className="space-y-3 text-sm">
                                        {[
                                            ['نوع فعالیت', bizType],
                                            ['موقعیت', locLabel],
                                        ].filter(([, v]) => v).map(([l, v]) => (
                                            <div key={l} className="flex justify-between">
                                                <span className="text-gray-400 dark:text-gray-500">{l}</span>
                                                <span className="text-gray-800 dark:text-white font-medium">{v}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div
                                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm">
                                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">اطلاعات
                                        تماس</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400 dark:text-gray-500">تلفن</span>
                                            <span
                                                className="text-gray-800 dark:text-white font-mono font-medium direction-ltr">{seller.phone || '—'}</span>
                                        </div>
                                        {seller.website && (
                                            <div className="flex justify-between">
                                                <span className="text-gray-400 dark:text-gray-500">وب‌سایت</span>
                                                <a href={seller.website.startsWith('http') ? seller.website : `https://${seller.website}`}
                                                   target="_blank" rel="noopener"
                                                   className="text-primary hover:underline text-left direction-ltr truncate max-w-[180px]">
                                                    {seller.website}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* فعالیت‌ها */}
                            {seller.activities?.length > 0 && (
                                <div
                                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm">
                                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">حوزه
                                        فعالیت</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {seller.activities.map((act: any) => (
                                            <span key={act.id}
                                                  className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs rounded-lg border border-gray-100 dark:border-gray-700">
                                                {act.title}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* درباره ما */}
                            {seller.description && (
                                <div
                                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm">
                                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">درباره
                                        ما</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-7 text-justify">{seller.description}</p>
                                </div>
                            )}

                            {/* آمار اعتماد */}
                            <div className="grid grid-cols-4 gap-2.5">
                                {[
                                    {val: seller.totalAds || 0, label: 'آگهی فعال'},
                                    {val: seller.totalDeals || 0, label: 'معامله'},
                                    {val: seller.totalViews || 0, label: 'بازدید'},
                                    {val: `${seller.trustScore || 0}٪`, label: 'اعتماد'},
                                ].map((s) => (
                                    <div key={s.label}
                                         className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/60 dark:border-gray-800/60 p-3.5 text-center shadow-sm">
                                        <p className="text-lg font-bold text-gray-800 dark:text-white">{s.val}</p>
                                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {/* مدارک */}
                            {seller.verifications?.length > 0 && (
                                <div
                                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/60 dark:border-gray-800/60 p-5 shadow-sm">
                                    <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">مدارک
                                        تأیید شده</h3>
                                    <div className="space-y-2">
                                        {seller.verifications.map((v: any) => (
                                            <div key={v.id}
                                                 className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/50 last:border-0">
                                                <div className="flex items-center gap-2">
                                                    <Shield
                                                        className={cn('w-4 h-4', v.status === 'approved' ? 'text-emerald-500' : v.status === 'pending' ? 'text-amber-500' : 'text-red-400')}/>
                                                    <span
                                                        className="text-sm text-gray-700 dark:text-gray-300">سطح {getTierLabel(v.tier) || v.tier}</span>
                                                </div>
                                                <span className={cn(
                                                    'text-[11px] font-medium px-2.5 py-0.5 rounded-full',
                                                    v.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                                                        : v.status === 'pending' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400'
                                                            : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400'
                                                )}>
                                                    {v.status === 'approved' ? 'تایید شده' : v.status === 'pending' ? 'در انتظار بررسی' : 'رد شده'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* سایر آگهی‌ها */}
                    {activeTab === 'similar' && similarAds.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {similarAds.map((s: any) => {
                                const sImg = s.files?.find((f: any) => f.fieldKey?.startsWith('ad-image'));
                                return (
                                    <Link
                                        key={s.id}
                                        href={`/ad/${s.id}`}
                                        className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200/60 dark:border-gray-800/60 p-3 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200 flex items-center gap-3"
                                    >
                                        <div
                                            className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                                            {sImg ? (
                                                <Image
                                                    src={sImg.path?.startsWith('http') ? sImg.path : `${process.env.NEXT_PUBLIC_API_BASE_URL}/file/${sImg.id}`}
                                                    alt={s.title}
                                                    width={64} height={64}
                                                    className="object-cover w-full h-full"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center"><Package
                                                    className="w-6 h-6 text-gray-300 dark:text-gray-600"/></div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{s.productType || s.title}</p>
                                            <p className="text-xs text-primary font-bold mt-1">{formatNum(s.unitPrice)} تومان</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">{s.city || ''}</p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>

            {/* ─── نوار پایین موبایل ─── */}
            <div
                className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-800/60 px-4 py-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleSave}
                        className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <Bookmark className={cn('w-5 h-5', isSaved ? 'fill-primary text-primary' : 'text-gray-500')}/>
                    </button>
                    <button
                        onClick={handleShare}
                        className="w-12 h-12 rounded-xl border border-gray-200 dark:border-gray-700 flex items-center justify-center transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <Share2 className="w-5 h-5 text-gray-500"/>
                    </button>
                    <button
                        onClick={handleContact}
                        disabled={isCalling}
                        className="flex-1 h-12 bg-primary hover:bg-primary/90 active:scale-[0.98] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50 transition-all duration-200"
                    >
                        {isCalling
                            ? <div
                                className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"/>
                            : <><Phone className="w-5 h-5"/>تماس با فروشنده</>
                        }
                    </button>
                </div>
            </div>
        </div>
    );
}