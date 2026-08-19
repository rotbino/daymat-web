// app/arm-admin/settings/payments/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { toast } from 'sonner';
import {
    CreditCard,
    Banknote,
    Shield,
    Save,
    Loader2,
    Check,
    Info,
    AlertCircle,
    Eye,
    EyeOff,
    ExternalLink,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { apiService } from '@/lib/api/apiService';
import { cn } from '@/lib/utils';

// ============================================================
// تایپ‌ها
// ============================================================
interface GatewayConfig {
    name: string;
    pin?: string;
    merchantId?: string;
    enabled: boolean;
}

interface PaymentSettings {
    paymentMode: 'online_only' | 'manual_only' | 'both';
    defaultGateway: string;
    gateways: GatewayConfig[];
    manual: {
        enabled: boolean;
        cardNumber?: string;
        shebaNumber?: string;
        accountOwner?: string;
        bankName?: string;
        instructions?: string;
    };
    settlementAccount: {
        type: string;
        value?: string;
    };
}

const GATEWAY_NAMES: Record<string, { label: string; icon: string; website: string }> = {
    'pec': {
        label: 'پارسیان',
        icon: '🏦',
        website: 'https://pec.shaparak.ir/',
    },
    'zarinpal': {
        label: 'زرین‌پال',
        icon: '🟣',
        website: 'https://www.zarinpal.com/',
    },
    'rayanpay': {
        label: 'رایان‌پی (آقای پرداخت)',
        icon: '🔵',
        website: 'https://rayanpay.com/',
    },
};

export default function PaymentSettingsPage() {
    const { currentSlug, currentArm } = useSelector((state: RootState) => state.arm);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<PaymentSettings | null>(null);
    const [showPins, setShowPins] = useState<Record<string, boolean>>({});
    const [showOnlineSettings, setShowOnlineSettings] = useState(false);
    const [showGatewayHelp, setShowGatewayHelp] = useState(false);
    const [showManualHelp, setShowManualHelp] = useState(false);

    // ============================================================
    // ✅ واکشی تنظیمات پرداخت از بک‌اند
    // ============================================================
    useEffect(() => {
        const fetchSettings = async () => {
            if (!currentSlug) {
                setLoading(false);
                return;
            }

            try {
                // ✅ دریافت تنظیمات از بک‌اند
                const payment = await apiService.armAdmin.getPaymentSettings(currentSlug);

                const manualEnabled = payment.manual?.enabled !== false;
                const hasOnline = payment.paymentMode === 'both' || payment.paymentMode === 'online_only';

                setSettings({
                    paymentMode: payment.paymentMode || 'manual_only',
                    defaultGateway: payment.defaultGateway || 'pec',
                    gateways: payment.gateways || [
                        { name: 'pec', pin: '', enabled: false },
                        { name: 'zarinpal', merchantId: '', enabled: false },
                        { name: 'rayanpay', pin: '', enabled: false },
                    ],
                    manual: {
                        enabled: manualEnabled,
                        cardNumber: payment.manual?.cardNumber || '',
                        shebaNumber: payment.manual?.shebaNumber || '',
                        accountOwner: payment.manual?.accountOwner || '',
                        bankName: payment.manual?.bankName || '',
                        instructions: payment.manual?.instructions || '',
                    },
                    settlementAccount: {
                        type: payment.settlementAccount?.type || 'bank_card',
                        value: payment.settlementAccount?.value || '',
                    },
                });

                setShowOnlineSettings(hasOnline);
            } catch (error: any) {
                console.error('Error fetching payment settings:', error);
                toast.error(error?.message || 'خطا در دریافت تنظیمات پرداخت');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [currentSlug]);

    // ============================================================
    // ✅ به‌روزرسانی فیلد درگاه
    // ============================================================
    const updateGateway = (index: number, field: string, value: any) => {
        if (!settings) return;
        const newGateways = [...settings.gateways];
        newGateways[index] = { ...newGateways[index], [field]: value };
        setSettings({ ...settings, gateways: newGateways });
    };

    // ============================================================
    // ✅ ذخیره تنظیمات
    // ============================================================
    const handleSave = async () => {
        if (!settings || !currentSlug) return;

        setSaving(true);
        try {
            // ✅ ارسال به بک‌اند
            await apiService.armAdmin.updatePaymentSettings(currentSlug, settings);

            toast.success('تنظیمات پرداخت با موفقیت ذخیره شد');
        } catch (error: any) {
            console.error('Error saving payment settings:', error);
            toast.error(error?.message || 'خطا در ذخیره تنظیمات');
        } finally {
            setSaving(false);
        }
    };

    // ============================================================
    // ✅ رندر وضعیت درگاه
    // ============================================================
    const getGatewayStatus = (gateway: GatewayConfig) => {
        if (!gateway.enabled) {
            return { label: 'غیرفعال', color: 'text-gray-400', bg: 'bg-gray-100' };
        }
        const isConfigured = gateway.pin || gateway.merchantId;
        if (!isConfigured) {
            return { label: 'تنظیم نشده', color: 'text-yellow-600', bg: 'bg-yellow-50' };
        }
        return { label: 'فعال', color: 'text-green-600', bg: 'bg-green-50' };
    };

    // ============================================================
    // ✅ در حال بارگذاری
    // ============================================================
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                    <p className="mt-4 text-on-surface-variant">در حال بارگذاری تنظیمات...</p>
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-16 h-16 text-error mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-on-surface">خطا در بارگذاری</h3>
                <p className="text-sm text-on-surface-variant">تنظیمات پرداخت یافت نشد</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-32">
            {/* هدر */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="font-bold text-on-surface">تنظیمات پرداخت</h1>

                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    ذخیره تنظیمات
                </button>
            </div>

            {/* ============================================================
                ⚠️ هشدار مهم
                ============================================================ */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
                <div className="flex items-start gap-3">
                    {/*<div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Info className="w-4 h-4 text-yellow-600" />
                    </div>*/}
                    <div>
                        <p className="text-sm text-yellow-800 text-justify">
                            <span className="font-bold">توجه:</span> با فعال‌سازی پرداخت آنلاین یا کارت به کارت،
                            مبلغ پرداختی کاربران مستقیماً به <span className="font-bold">حساب بانکی شما</span> واریز می‌شود.
                            سامانه Daymat هیچ نقشی در دریافت و انتقال وجه ندارد.
                        </p>
                    </div>
                </div>
            </div>

            {/* ============================================================
                ۱. کارت به کارت (فیشی) - اولویت اول
                ============================================================ */}
            <div className="bg-white rounded-2xl border-2 border-primary/30 p-6 shadow-sm mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Banknote className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-base font-semibold text-on-surface">پرداخت کارت به کارت (فیشی)</h3>
                        <p className="text-xs text-on-surface-variant">اطلاعات بانکی برای پرداخت‌های دستی کاربران</p>
                    </div>
                    <button
                        onClick={() => setShowManualHelp(!showManualHelp)}
                        className="mr-auto text-xs text-primary hover:underline flex items-center gap-1"
                    >
                        {showManualHelp ? 'بستن' : 'راهنما'}
                        {showManualHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                </div>

                {showManualHelp && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm text-blue-800">
                        <p>✅ اطلاعات حساب بانکی خود را وارد کنید.</p>
                        <p>✅ کاربران پس از واریز وجه، تصویر رسید را آپلود می‌کنند.</p>
                        <p>✅ شما به عنوان مالک بازار، پرداخت را تأیید و اعتبار را به کاربر اضافه می‌کنید.</p>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm">
                            <span className="text-on-surface-variant">فعال کردن پرداخت فیشی</span>
                            <input
                                type="checkbox"
                                checked={settings.manual.enabled}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    manual: { ...settings.manual, enabled: e.target.checked }
                                })}
                                className="w-4 h-4 accent-primary"
                            />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-on-surface-variant block mb-1">
                                شماره کارت <span className="text-primary">*</span>
                            </label>
                            <input
                                type="text"
                                value={settings.manual.cardNumber || ''}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    manual: { ...settings.manual, cardNumber: e.target.value }
                                })}
                                placeholder="6037-9912-3456-7890"
                                className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm font-mono text-left focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-on-surface-variant block mb-1">
                                شماره شبا
                            </label>
                            <input
                                type="text"
                                value={settings.manual.shebaNumber || ''}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    manual: { ...settings.manual, shebaNumber: e.target.value }
                                })}
                                placeholder="IR12-3456-7890-1234-5678-9012"
                                className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm font-mono text-left focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-on-surface-variant block mb-1">
                                نام صاحب حساب <span className="text-primary">*</span>
                            </label>
                            <input
                                type="text"
                                value={settings.manual.accountOwner || ''}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    manual: { ...settings.manual, accountOwner: e.target.value }
                                })}
                                placeholder="علی محمدی"
                                className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-on-surface-variant block mb-1">
                                نام بانک
                            </label>
                            <input
                                type="text"
                                value={settings.manual.bankName || ''}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    manual: { ...settings.manual, bankName: e.target.value }
                                })}
                                placeholder="بانک ملت"
                                className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="text-xs text-on-surface-variant block mb-1 py-2">
                                راهنمای واریز برای کاربران
                            </label>
                            <textarea
                                value={settings.manual.instructions || ''}
                                onChange={(e) => setSettings({
                                    ...settings,
                                    manual: { ...settings.manual, instructions: e.target.value }
                                })}
                                rows={3}
                                placeholder="لطفاً مبلغ دقیق را به شماره کارت فوق واریز کرده و تصویر رسید را در بخش مربوطه آپلود کنید."
                                className="w-full bg-surface-container-lowest border border-outline rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================
                ۲. پرداخت آنلاین
                ============================================================ */}
            <div className="bg-white rounded-2xl border border-outline-variant/50 p-6 shadow-sm mb-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-base font-semibold text-on-surface">پرداخت آنلاین</h3>
                            <p className="text-xs text-on-surface-variant">تنظیمات درگاه‌های پرداخت اینترنتی</p>
                        </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm">
                        <span className="text-on-surface-variant">فعال</span>
                        <input
                            type="checkbox"
                            checked={showOnlineSettings}
                            onChange={(e) => {
                                const checked = e.target.checked;
                                setShowOnlineSettings(checked);
                                setSettings({
                                    ...settings,
                                    paymentMode: checked ? (settings.manual.enabled ? 'both' : 'online_only') : (settings.manual.enabled ? 'manual_only' : 'manual_only'),
                                });
                            }}
                            className="w-4 h-4 accent-primary"
                        />
                    </label>
                </div>

                {showOnlineSettings && (
                    <>
                        {/* باکس توضیحاتی درگاه‌ها - جمع‌شونده */}
                        <div className="bg-blue-50 border border-blue-200 rounded-xl mb-4">
                            <button
                                onClick={() => setShowGatewayHelp(!showGatewayHelp)}
                                className="w-full flex items-center justify-between p-3 text-right"
                            >
                                <span className="text-sm font-medium text-blue-800 flex items-center gap-2">
                                    <Info className="w-4 h-4" />
                                    چگونه درگاه پرداخت آنلاین راه‌اندازی کنم؟
                                </span>
                                {showGatewayHelp ? <ChevronUp className="w-4 h-4 text-blue-600" /> : <ChevronDown className="w-4 h-4 text-blue-600" />}
                            </button>
                            {showGatewayHelp && (
                                <div className="px-4 pb-4 text-sm text-blue-800 space-y-2 border-t border-blue-200 pt-3">
                                    <p>۱. یکی از درگاه‌های زیر را انتخاب کنید و در آن ثبت‌نام کنید.</p>
                                    <p>۲. در پنل درگاه، شماره حساب بانکی خود را برای تسویه وارد کنید.</p>
                                    <p>۳. کلید (PIN یا Merchant ID) را از درگاه دریافت کنید.</p>
                                    <p>۴. کلید را در بخش مربوطه وارد کرده و درگاه را فعال کنید.</p>
                                    <p className="text-xs text-blue-600 mt-2">
                                        💡 پول کاربران مستقیماً به حسابی که در درگاه ثبت کرده‌اید واریز می‌شود.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* درگاه‌ها */}
                        <div className="space-y-3">
                            {settings.gateways.map((gateway, index) => {
                                const status = getGatewayStatus(gateway);
                                const info = GATEWAY_NAMES[gateway.name];
                                const isConfigured = gateway.pin || gateway.merchantId;

                                return (
                                    <div
                                        key={gateway.name}
                                        className={cn(
                                            "border rounded-xl p-4 transition-all",
                                            gateway.enabled && isConfigured
                                                ? "border-green-200 bg-green-50/30"
                                                : gateway.enabled && !isConfigured
                                                    ? "border-yellow-200 bg-yellow-50/30"
                                                    : "border-outline-variant"
                                        )}
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                                                    {info?.icon || '💳'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-on-surface">
                                                            {info?.label || gateway.name}
                                                        </span>
                                                        <span className={cn(
                                                            "text-xs px-2 py-0.5 rounded-full",
                                                            status.bg,
                                                            status.color
                                                        )}>
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        {info?.website && (
                                                            <a
                                                                href={info.website}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                                                            >
                                                                دریافت کلید
                                                                <ExternalLink className="w-3 h-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <label className="flex items-center gap-2 text-sm">
                                                <span className="text-on-surface-variant">فعال</span>
                                                <input
                                                    type="checkbox"
                                                    checked={gateway.enabled}
                                                    onChange={(e) => updateGateway(index, 'enabled', e.target.checked)}
                                                    className="w-4 h-4 accent-primary"
                                                />
                                            </label>
                                        </div>

                                        {gateway.enabled && (
                                            <div className="mt-3 pt-3 border-t border-outline-variant/30">
                                                {gateway.name === 'zarinpal' ? (
                                                    <div>
                                                        <label className="text-xs text-on-surface-variant block mb-1">
                                                            Merchant ID <span className="text-primary">*</span>
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={gateway.merchantId || ''}
                                                            onChange={(e) => updateGateway(index, 'merchantId', e.target.value)}
                                                            placeholder="مثال: 00000000-0000-0000-0000-000000000000"
                                                            className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm font-mono text-left focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                            dir="ltr"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <label className="text-xs text-on-surface-variant block mb-1">
                                                            PIN <span className="text-primary">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type={showPins[gateway.name] ? 'text' : 'password'}
                                                                value={gateway.pin || ''}
                                                                onChange={(e) => updateGateway(index, 'pin', e.target.value)}
                                                                placeholder="مثال: 44970783"
                                                                className="w-full bg-surface-container-lowest border border-outline rounded-lg h-10 px-3 text-sm font-mono text-left focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                                dir="ltr"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setShowPins(prev => ({ ...prev, [gateway.name]: !prev[gateway.name] }))}
                                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
                                                            >
                                                                {showPins[gateway.name] ? (
                                                                    <EyeOff className="w-4 h-4" />
                                                                ) : (
                                                                    <Eye className="w-4 h-4" />
                                                                )}
                                                            </button>
                                                        </div>
                                                        <p className="text-[10px] text-on-surface-variant/60 mt-1">
                                                            کلید PIN را از درگاه دریافت کنید
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* دکمه ذخیره (موبایل) */}
            <div className=" fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-outline-variant/50 p-4 z-40">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full h-12 bg-primary text-on-primary rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Save className="w-5 h-5" />
                    )}
                    ذخیره تنظیمات
                </button>
            </div>
        </div>
    );
}