// app/docs/market-owner/MarketOwnerClient.tsx
'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { AppHeader, AppFooter } from '@/app/components';
import {
    Store,
    Network,
    Factory,
    Truck,
    ShoppingCart,
    Users,
    Megaphone,
    BarChart3,
    Wallet,
    Settings2,
    ArrowLeft,
    Check,
} from 'lucide-react';

export default function MarketOwnerClient() {
    const { currentArm } = useSelector((state: RootState) => state.arm);

    const armName = currentArm?.name || 'بازار شما';

    const SectionTitle = ({
                              eyebrow,
                              title,
                              description,
                          }: {
        eyebrow?: string;
        title: string;
        description?: string;
    }) => (
        <div className="text-center max-w-3xl mx-auto mb-10">
            {eyebrow && (
                <p className="text-sm font-semibold text-primary mb-2">
                    {eyebrow}
                </p>
            )}

            <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface dark:text-white">
                {title}
            </h2>

            {description && (
                <p className="mt-3 text-sm sm:text-base leading-7 text-on-surface-variant dark:text-gray-400">
                    {description}
                </p>
            )}
        </div>
    );

    const MarketType = ({
                            icon: Icon,
                            title,
                            examples,
                        }: {
        icon: React.ElementType;
        title: string;
        examples: string;
    }) => (
        <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low dark:bg-gray-900 p-5">
            <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <Icon className="w-5 h-5" />
            </div>

            <h3 className="font-bold text-on-surface dark:text-white">
                {title}
            </h3>

            <p className="mt-2 text-sm leading-6 text-on-surface-variant dark:text-gray-400">
                {examples}
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-surface dark:bg-gray-950">
            <AppHeader showBack={true} />

            <main>
                {/* Hero */}
                <section className="px-4 sm:px-6 lg:px-8 pt-14 pb-16">
                    <div className="max-w-5xl mx-auto text-center">
                        <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                            <Store className="w-8 h-8" />
                        </div>

                        <p className="text-sm font-semibold text-primary mb-3">
                            ساخت بازار تخصصی با دیمت
                        </p>

                        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-on-surface dark:text-white">
                            بازار تخصصی خودتان را بسازید
                        </h1>

                        <p className="max-w-3xl mx-auto mt-5 text-base sm:text-lg leading-8 text-on-surface-variant dark:text-gray-400">
                            دیمت به شما امکان می‌دهد یک بازار آنلاین تخصصی
                            برای صنف، شهر، محصول یا بخشی از زنجیره تأمین خود
                            بسازید؛ خریداران و فروشندگان مرتبط را دور هم جمع
                            کنید و از فعالیت بازار درآمد داشته باشید.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                            <a
                                href="/create-arm"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 transition"
                            >
                                ساخت بازار
                                <ArrowLeft className="w-4 h-4" />
                            </a>

                            <a
                                href="#how-it-works"
                                className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-outline-variant/30 text-on-surface dark:text-white font-semibold hover:bg-surface-container transition"
                            >
                                بیشتر بدانید
                            </a>
                        </div>
                    </div>
                </section>

                {/* Chain */}
                <section
                    id="how-it-works"
                    className="px-4 sm:px-6 lg:px-8 py-16 bg-surface-container-low/50 dark:bg-gray-900/40"
                >
                    <div className="max-w-6xl mx-auto">
                        <SectionTitle
                            eyebrow="یک زیرساخت، برای کل زنجیره تأمین"
                            title="هر بخشی از زنجیره تأمین را می‌توانید به بازار تبدیل کنید"
                            description="دیمت به یک مرحله خاص از زنجیره تأمین محدود نیست. شما می‌توانید بازاری متناسب با مدل کسب‌وکار خود بسازید."
                        />

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            {[
                                {
                                    icon: Factory,
                                    title: 'تولید',
                                    text: 'بازار تولیدکنندگان و کارخانه‌ها',
                                },
                                {
                                    icon: Network,
                                    title: 'تأمین',
                                    text: 'بازار واردکنندگان و تأمین‌کنندگان',
                                },
                                {
                                    icon: Truck,
                                    title: 'پخش',
                                    text: 'بازار شرکت‌های پخش و توزیع',
                                },
                                {
                                    icon: Store,
                                    title: 'عمده‌فروشی',
                                    text: 'بازار ارتباط عمده‌فروش و خریدار',
                                },
                                {
                                    icon: ShoppingCart,
                                    title: 'خرده‌فروشی',
                                    text: 'بازار سفارش و تأمین فروشگاه‌ها',
                                },
                            ].map((item) => {
                                const Icon = item.icon;

                                return (
                                    <div
                                        key={item.title}
                                        className="text-center rounded-2xl border border-outline-variant/20 bg-surface dark:bg-gray-950 p-5"
                                    >
                                        <div className="w-11 h-11 mx-auto rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                            <Icon className="w-5 h-5" />
                                        </div>

                                        <h3 className="mt-4 font-bold text-on-surface dark:text-white">
                                            {item.title}
                                        </h3>

                                        <p className="mt-2 text-xs leading-5 text-on-surface-variant dark:text-gray-400">
                                            {item.text}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="max-w-4xl mx-auto mt-8 rounded-2xl border border-primary/15 bg-primary/5 dark:bg-primary/10 p-5 text-center">
                            <p className="text-sm sm:text-base leading-7 text-on-surface-variant dark:text-gray-300">
                                حتی می‌توانید بازار را برای یک رابطه مشخص در
                                زنجیره تأمین بسازید؛ مثلاً
                                <span className="font-semibold text-on-surface dark:text-white">
                                    {' '}سفارش سوپرمارکت از شرکت پخش
                                </span>
                                {' '}یا
                                <span className="font-semibold text-on-surface dark:text-white">
                                    {' '}خرید بارفروش از کشاورز.
                                </span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* What can build */}
                <section className="px-4 sm:px-6 lg:px-8 py-16">
                    <div className="max-w-6xl mx-auto">
                        <SectionTitle
                            eyebrow="بازار شما، با قواعد شما"
                            title="چه بازارهایی می‌توان ساخت؟"
                            description="بازار می‌تواند بر اساس محصول، صنف، شهر، نوع معامله یا رابطه تجاری تعریف شود."
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <MarketType
                                icon={Store}
                                title="بازار یک صنف"
                                examples="مثل بازار پخش سوپرمارکت، مصالح‌فروشان یا عمده‌فروشان مواد غذایی"
                            />

                            <MarketType
                                icon={Network}
                                title="بازار یک محصول"
                                examples="مثل بازار تخصصی لوله، خشکبار، میوه، لبنیات یا محصولات کشاورزی"
                            />

                            <MarketType
                                icon={Truck}
                                title="بازار یک شهر یا منطقه"
                                examples="مثل بازار عمده میوه تهران یا بازار پخش مواد غذایی همدان"
                            />

                            <MarketType
                                icon={ShoppingCart}
                                title="بازار خرید"
                                examples="بازاری که خریداران در آن نیاز خود را اعلام و از تأمین‌کنندگان پیشنهاد می‌گیرند"
                            />

                            <MarketType
                                icon={Megaphone}
                                title="بازار فروش"
                                examples="بازاری برای نمایش قیمت، موجودی و پیشنهادهای فروشندگان"
                            />

                            <MarketType
                                icon={Users}
                                title="بازار دوسویه"
                                examples="بازاری که خریدار و فروشنده در آن به‌صورت هم‌زمان فعالیت می‌کنند"
                            />
                        </div>
                    </div>
                </section>

                {/* Capabilities */}
                <section className="px-4 sm:px-6 lg:px-8 py-16 bg-surface-container-low/50 dark:bg-gray-900/40">
                    <div className="max-w-5xl mx-auto">
                        <SectionTitle
                            eyebrow="امکانات آماده"
                            title="شما بازار را می‌سازید؛ زیرساخت را دیمت فراهم می‌کند"
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                'عضویت و مدیریت کسب‌وکارهای بازار',
                                'نقش‌های خریدار، فروشنده و اعضای بازار',
                                'دسته‌بندی و نمایش اختصاصی کالاها',
                                'ثبت آگهی فروش و قیمت روز',
                                'ثبت درخواست خرید',
                                'جست‌وجو و ارتباط مستقیم میان اعضا',
                                'مدیریت اعتبار و خدمات پولی',
                                'امکان تعریف قوانین و امکانات اختصاصی بازار',
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center gap-3 rounded-xl bg-surface dark:bg-gray-950 border border-outline-variant/15 p-4"
                                >
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                        <Check className="w-4 h-4" />
                                    </div>

                                    <span className="text-sm font-medium text-on-surface dark:text-gray-200">
                                        {item}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Owner */}
                <section className="px-4 sm:px-6 lg:px-8 py-16">
                    <div className="max-w-5xl mx-auto">
                        <SectionTitle
                            eyebrow="مالک بازار"
                            title="شما صاحب بازار تخصصی خود هستید"
                            description={`دیمت زیرساخت را فراهم می‌کند و شما بازاری نمونه مانند همین ${armName} را مدیریت و توسعه می‌دهید.`}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-2xl border border-outline-variant/20 p-6">
                                <Users className="w-6 h-6 text-primary mb-4" />
                                <h3 className="font-bold text-on-surface dark:text-white">
                                    بازار را توسعه دهید
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-on-surface-variant dark:text-gray-400">
                                    کسب‌وکارهای مرتبط را جذب کنید و یک شبکه تجاری واقعی بسازید.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-outline-variant/20 p-6">
                                <Settings2 className="w-6 h-6 text-primary mb-4" />
                                <h3 className="font-bold text-on-surface dark:text-white">
                                    بازار را مدیریت کنید
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-on-surface-variant dark:text-gray-400">
                                    قوانین، دسته‌بندی، امکانات و نحوه فعالیت بازار را مدیریت کنید.
                                </p>
                            </div>

                            <div className="rounded-2xl border border-outline-variant/20 p-6">
                                <BarChart3 className="w-6 h-6 text-primary mb-4" />
                                <h3 className="font-bold text-on-surface dark:text-white">
                                    از بازار درآمد بسازید
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-on-surface-variant dark:text-gray-400">
                                    از خدمات، تبلیغات، اعتبار و امکانات پولی بازار درآمد کسب کنید.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Business model */}
                <section className="px-4 sm:px-6 lg:px-8 py-16 bg-primary/5 dark:bg-primary/10">
                    <div className="max-w-4xl mx-auto">
                        <div className="text-center">
                            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-5">
                                <Wallet className="w-7 h-7" />
                            </div>

                            <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface dark:text-white">
                                مدل درآمدی بازار را شما می‌سازید
                            </h2>

                            <p className="mt-4 text-sm sm:text-base leading-7 text-on-surface-variant dark:text-gray-300">
                                بسته به نوع بازار می‌توانید از خدماتی مانند
                                تبلیغات، دیده‌شدن بیشتر، اعتبار و امکانات
                                ویژه برای کسب‌وکارها درآمد ایجاد کنید.
                            </p>

                            <p className="mt-3 text-xs text-on-surface-variant/70 dark:text-gray-500">
                                مدل درآمدی هر بازار می‌تواند متناسب با مخاطبان
                                و ساختار همان بازار تنظیم شود.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="px-4 sm:px-6 lg:px-8 py-20">
                    <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-on-surface dark:text-white">
                            بازار تخصصی خودتان را بسازید
                        </h2>

                        <p className="mt-4 text-sm sm:text-base leading-7 text-on-surface-variant dark:text-gray-400">
                            اگر یک صنف، بازار، محصول یا بخش مشخصی از زنجیره
                            تأمین را می‌شناسید، دیمت ابزار ساخت بازار آنلاین
                            آن را در اختیار شما می‌گذارد.
                        </p>

                        <a
                            href="/create-arm"
                            className="inline-flex items-center justify-center gap-2 mt-7 px-7 py-3.5 rounded-xl bg-primary text-on-primary font-bold hover:bg-primary/90 transition"
                        >
                            ساخت بازار در دیمت
                            <ArrowLeft className="w-4 h-4" />
                        </a>
                    </div>
                </section>
            </main>

            <AppFooter />
        </div>
    );
}