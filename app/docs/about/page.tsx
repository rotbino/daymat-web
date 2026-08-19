// app/docs/about/page.tsx
'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { AppHeader, AppFooter } from '@/app/components';
import {
    Target, TrendingUp, MapPin, Layers, Store, Users,
    Phone, Clock, Gift, CreditCard, Globe, ArrowRight
} from 'lucide-react';

// تابع کمکی برای استخراج مسیر کامل دسته‌های انتخاب‌شده
const getSelectedCategoryPaths = (
    nodes: any[],
    parentTitle?: string
): string[] => {
    const results: string[] = [];
    for (const node of nodes) {
        const currentLabel = node.customLabel || node.title;
        const fullLabel = parentTitle ? `${parentTitle} ← ${currentLabel}` : currentLabel;

        if (node.isSelected) {
            results.push(fullLabel);
        }
        if (node.children && node.children.length > 0) {
            results.push(...getSelectedCategoryPaths(node.children, currentLabel));
        }
    }
    return results;
};

export default function AboutPage() {
    const { currentArm } = useSelector((state: RootState) => state.arm);
    const armName = currentArm?.name || 'Daymat';
    const config = (currentArm?.config as any) || {};
    const general = config.general || {};
    const mission = general.mission || currentArm?.mission || 'ایجاد بستری شفاف برای تجارت عمده';
    const slogan = general.slogan || currentArm?.slogan || '';
    const description = general.description || currentArm?.description || '';

    // پشتیبانی
    const support = config.support || {};
    const supportPhone = support.mobile || support.phone || 'نامشخص';
    const supportName = support.name || 'تیم پشتیبانی';
    const workingHours = support.workingHours || 'شنبه تا چهارشنبه';

    // اقتصادی
    const economy = config.economy || {};
    const signupBonus = economy.creditRules?.signupBonus ?? 0;
    const referralBonus = economy.creditRules?.referralBonus ?? 0;
    const daymatShare = economy.daymatShare ?? 30;
    const currency = economy.currency === 'IRR' ? 'تومان' : economy.currency;

    // ماژول‌ها
    const priceTable = config.modules?.priceTable || {};
    const maxFreeAds = priceTable.maxActiveAdsPerUser ?? 5;
    const adValidity = priceTable.adValidityDefaultDays ?? 24;
    const bumpCost = priceTable.bumpCost ?? 10;

    // دامنه
    const domain = currentArm?.customDomain || `${currentArm?.slug}.daymat.com` || 'daymat.com';

    // دسته‌بندی‌های فعال با مسیر کامل
    const categoryPaths = getSelectedCategoryPaths(currentArm?.categoryTree || []);

    // مناطق تحت پوشش
    const locations = (currentArm?.locationTree || [])
        .flatMap((p: any) =>
            (p.children || [])
                .filter((c: any) => c.isSelected)
                .map((c: any) => `${p.title} ← ${c.title}`)
        )
        .slice(0, 10);
    const locationText = locations.length ? locations.join('، ') : 'سراسر ایران';

    // صنوف خریدار و فروشنده
    const supplierIndustries = (config.supplierIndustries || []).slice(0, 5);
    const buyerIndustries = (config.buyerIndustries || []).slice(0, 5);

    return (
        <div className="min-h-screen bg-surface dark:bg-gray-950">
            <AppHeader showBack={true} />
            <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Hero */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/20 dark:border-gray-800 p-6 sm:p-10 mb-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-amber-600" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-on-surface dark:text-gray-100">
                            {armName} چیست؟
                        </h2>
                    </div>
                    <p className="text-base text-justify sm:text-lg text-on-surface-variant dark:text-gray-400  mx-auto leading-relaxed">
                        {description || slogan ? (
                            <span className={""}>{description || slogan}</span>
                        ) : (
                            <span>پلتفرمی تخصصی برای تجارت عمده در حوزه‌های مختلف</span>
                        )}
                    </p>
                </div>

                {/* نحوه کار */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/20 dark:border-gray-800 p-6 sm:p-10 mb-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                            <TrendingUp className="w-5 h-5 text-amber-600" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-on-surface dark:text-gray-100">
                            {armName} چگونه کار می‌کند؟
                        </h2>
                    </div>
                    <p className="text-on-surface-variant dark:text-gray-300 leading-7 mb-8 text-justify">
                        {armName} بستر ارتباط مستقیم خریدار و فروشنده را فراهم می‌کند و قیمت‌های فروشندگان عمده را در یک تابلوی شفاف
                        و زنده به نمایش می‌گذارد. در {armName}، هر کسب‌وکار می‌تواند بدون واسطه، محصولات خود را عرضه کند یا
                        تأمین‌کنندهٔ مورد نظر خود را بیابد.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                    <Store className="w-4 h-4 text-primary" />
                                </div>
                                <h3 className="font-bold text-primary">فروشندگان</h3>
                            </div>
                            <p className="text-sm text-on-surface-variant dark:text-gray-300 leading-relaxed">
                                فروشندگان پس از ثبت‌نام رایگان و ایجاد پروفایل کسب‌وکار، محصولات خود را همراه با قیمت، حداقل حجم فروش و
                                موجودی روی <strong>تابلوی قیمت</strong> ثبت می‌کنند. آن‌ها می‌توانند تا <strong>{maxFreeAds} آگهی</strong>{' '}
                                فعال هم‌زمان داشته باشند و برای نمایش بیشتر، با هزینهٔ{' '}
                                <strong>{bumpCost} اعتبار</strong> از قابلیت <strong>نردبان (Bump)</strong> استفاده کنند.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                                    <Users className="w-4 h-4 text-emerald-600" />
                                </div>
                                <h3 className="font-bold text-emerald-600">خریداران</h3>
                            </div>
                            <p className="text-sm text-on-surface-variant dark:text-gray-300 leading-relaxed">
                                خریداران بدون نیاز به ثبت‌نام می‌توانند قیمت‌ها را در تابلوی شفاف {armName} مشاهده کنند. پس از عضویت در
                                {armName}، امکان تماس مستقیم با فروشنده و همچنین ثبت درخواست خرید (Buy Lead) فراهم می‌شود. هر آگهی پس از{' '}
                                <strong>{adValidity} ساعت</strong> به‌طور خودکار منقضی می‌شود و خریداران همواره به‌روزترین قیمت‌ها را
                                مشاهده می‌کنند.
                            </p>
                        </div>
                    </div>
                </div>

                {/* چشم‌انداز + مشخصات */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/20 dark:border-gray-800 p-6 sm:p-10 mb-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Target className="w-5 h-5 text-primary" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-on-surface dark:text-gray-100">
                            چشم‌انداز {armName}
                        </h2>
                    </div>
                    <p className="text-on-surface-variant dark:text-gray-300 leading-7 text-justify mb-6">{mission}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-outline-variant/20 dark:border-gray-700">
                        <div className="flex flex-col items-center text-center gap-1">
                            <Gift className="w-5 h-5 text-amber-500" />
                            <span className="text-xs text-on-surface-variant dark:text-gray-400">اعتبار هدیه ثبت‌نام</span>
                            <span className="font-bold text-on-surface dark:text-gray-100">{signupBonus} اعتبار</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-1">
                            <Users className="w-5 h-5 text-blue-500" />
                            <span className="text-xs text-on-surface-variant dark:text-gray-400">اعتبار دعوت از دوستان</span>
                            <span className="font-bold text-on-surface dark:text-gray-100">{referralBonus} اعتبار</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-1">
                            <CreditCard className="w-5 h-5 text-emerald-500" />
                            <span className="text-xs text-on-surface-variant dark:text-gray-400">کمیسیون پلتفرم</span>
                            <span className="font-bold text-on-surface dark:text-gray-100">{daymatShare}٪</span>
                        </div>
                        <div className="flex flex-col items-center text-center gap-1">
                            <Globe className="w-5 h-5 text-purple-500" />
                            <span className="text-xs text-on-surface-variant dark:text-gray-400">دامنه</span>
                            <span className="font-bold text-on-surface dark:text-gray-100 text-xs">{domain}</span>
                        </div>
                    </div>
                </div>

                {/* گروه‌های کالایی  تخصصی فعال در این بازار  */}
                {categoryPaths.length > 0 && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/20 dark:border-gray-800 p-6 sm:p-10 mb-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                                <Layers className="w-5 h-5 text-purple-600" />
                            </div>
                            <h2 className="text-xl font-bold text-on-surface dark:text-gray-100">گروه‌های تخصصی {armName}</h2>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {categoryPaths.map((path, idx) => (
                                <span
                                    key={idx}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-container-low dark:bg-gray-800 text-on-surface-variant dark:text-gray-300 rounded-full text-xs"
                                >
                  <ArrowRight className="w-3 h-3 text-primary/60" />
                                    {path}
                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* مناطق تحت پوشش */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/20 dark:border-gray-800 p-6 sm:p-10 mb-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-xl font-bold text-on-surface dark:text-gray-100">مناطق تحت پوشش</h2>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {locations.map((loc, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-surface-container-low dark:bg-gray-800 text-on-surface-variant dark:text-gray-300 rounded-full text-xs"
                            >
                <MapPin className="w-3 h-3 text-primary/60" />
                                {loc}
              </span>
                        ))}
                    </div>
                </div>

                {/* صنوف خریدار و فروشنده */}
                {(supplierIndustries.length > 0 || buyerIndustries.length > 0) && (
                    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/20 dark:border-gray-800 p-6 sm:p-10 mb-8 shadow-sm">
                        <h2 className="text-xl font-bold text-on-surface dark:text-gray-100 mb-6">صنوف فعال در {armName}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {supplierIndustries.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-sm text-primary mb-3 flex items-center gap-2">
                                        <Store className="w-4 h-4" />
                                        فروشندگان
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {supplierIndustries.map((ind: any, idx: number) => (
                                            <span key={idx} className="px-3 py-1 bg-primary/5 dark:bg-primary/10 text-primary text-xs rounded-full">
                        {ind.title}
                      </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {buyerIndustries.length > 0 && (
                                <div>
                                    <h3 className="font-bold text-sm text-emerald-600 mb-3 flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        خریداران
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {buyerIndustries.map((ind: any, idx: number) => (
                                            <span key={idx} className="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-xs rounded-full">
                        {ind.title}
                      </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* پشتیبانی */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-outline-variant/20 dark:border-gray-800 p-6 sm:p-10 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-blue-600" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-bold text-on-surface dark:text-gray-100">پشتیبانی</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div>
                            <span className="text-xs text-on-surface-variant dark:text-gray-400 block mb-1">شماره تماس</span>
                            <span className="font-bold text-on-surface dark:text-gray-100">{supportPhone}</span>
                        </div>
                        <div>
                            <span className="text-xs text-on-surface-variant dark:text-gray-400 block mb-1">مسئول پشتیبانی</span>
                            <span className="font-bold text-on-surface dark:text-gray-100">{supportName}</span>
                        </div>
                        <div>
                            <Clock className="w-4 h-4 inline-block text-on-surface-variant ml-1" />
                            <span className="text-xs text-on-surface-variant dark:text-gray-400 block mb-1">ساعات کاری</span>
                            <span className="font-bold text-on-surface dark:text-gray-100 text-xs">{workingHours}</span>
                        </div>
                    </div>
                </div>
            </main>
            <AppFooter />
        </div>
    );
}