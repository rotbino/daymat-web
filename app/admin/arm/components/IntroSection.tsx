// app/admin/arm/components/IntroSection.tsx
'use client';

import React from 'react';
import {
    Crown, Store, Target, Wallet, Rocket, CircleDollarSign,
    Lightbulb, ArrowLeft, TrendingUp, Users, MapPin, PhoneCall,
    BarChart3, Sparkles, ChevronLeft
} from 'lucide-react';

export function IntroSection() {
    return (
        <div className="space-y-10 text-right">

            {/* ۱. تیتر و شعار اصلی */}
            <div className="bg-gradient-to-bl from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-2xl p-6 md:p-8 border border-primary/20">
                <Crown className="w-7 h-7 text-amber-500 mx-auto md:mx-0 mb-3" />
                <h2 className="text-xl md:text-xl font-black text-on-surface dark:text-gray-100 leading-tight mb-3">
                 پلتفرم ایجاد بازارهای تخصصی خرید و فروش عمده آنلاین
                </h2>
                <p className="text-on-surface-variant/90 dark:text-gray-300 text-base leading-8">
                    Daymat پلتفرم ایجاد بازارهای تخصصی عمده فروشی است. و بستر نرم افزاری و سخت افزاری ساخت بازارهای تخصصی را برای شما فراهم کرده است، منظور از بازار تخصصی،
                    سایتی آنلاین است که فروشندگان عمده و خریداران حرفه‌ای یک صنف خاص، دور هم جمع می‌شوند و معامله می‌کنند.
                    درآمد شما هم از <strong>خدماتی</strong> که به همین اعضا می‌دهید، شروع می‌شود و با رشد بازارتان چند برابر می گردد. تمام بستر نرم افزاری و درآمدزایی آماده است. تنها کاری که شما باید انجام دهید دعوت از اعضای یک یا چند صنف مثلا صنف لوازم التحریر به بازارتان است..
                </p>
            </div>

            {/* ۲. این بازار چه شکلی است؟ (چند مثال شفاف) */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <Store className="w-5 h-5 text-primary" />
                    <h3 className="font-bold text-lg text-on-surface dark:text-gray-100">مثالهایی از بازارهای تخصصی خرید و فروش عمده</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                        { title: 'پخش مواد غذایی به سوپرمارکت‌ها', desc: 'سوپرمارکت‌ها به جای تماس با چندین پخش، قیمت روز را در بازار شما مقایسه می‌کنند و مستقیم سفارش می‌دهند.' },
                        { title: 'بازار عمده مصالح ساختمانی همدان', desc: 'پیمانکاران و خرده‌فروشان، قیمت سیمان، آجر و فولاد را مستقیماً از تولیدکننده می‌بینند.' },
                        { title: 'رستوران‌ها و بارفروشان', desc: 'مدیر رستوران هر روز صبح قیمت میوه و سبزی فروشندگان عمده تره بار را در تابلوی اختصاصی شما چک می‌کند.' },
                        { title: 'نمایشگاه‌های مبل به تولیدی‌ها', desc: 'مدل‌های جدید و قیمت عمده، بدون واسطه به دست نمایشگاه‌دار می‌رسد.' },
                    ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-surface-container-low dark:bg-gray-800/50 border border-outline-variant/30">
                            <ArrowLeft className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                            <div>
                                <h4 className="font-bold text-sm text-on-surface dark:text-gray-100">{item.title}</h4>
                                <p className="text-xs text-on-surface-variant/60 dark:text-gray-500 mt-1 leading-5">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ۳. مسیر روشن و قدم‌به‌قدم (داستان موفقیت) */}
            <div className="bg-surface-container-low dark:bg-gray-800/50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Target className="w-6 h-6 text-rose-500" />
                    <h3 className="font-extrabold text-lg text-on-surface dark:text-gray-100">چطور از صفر به یک بازار پول‌ساز برسیم؟ (مسیر قدم‌به‌قدم)</h3>
                </div>

                <div className="space-y-5">
                    {/* قدم اول */}
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">۱</div>
                            <div className="w-0.5 flex-1 bg-outline-variant/30 mt-1 mb-1"></div>
                        </div>
                        <div className="flex-1 pb-2">
                            <h4 className="font-bold text-on-surface dark:text-gray-100 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-amber-500" />
                                ایده‌تان را واضح کنید
                            </h4>
                            <p className="text-sm text-on-surface-variant/80 dark:text-gray-400 mt-1 leading-7">
                                دقیقاً مشخص کنید می‌خواهید <strong>کدام اصناف</strong> را به هم وصل کنید و <strong>در کدام شهر</strong> شروع کنید.
                                لازم نیست از روز اول همه‌جا را بگیرید. مثلاً بگویید: «من می‌خواهم بازار خرید و فروش عمدهٔ <strong>لوازم آرایشی</strong> در <strong>تهران</strong> را راه بیندازم.»
                            </p>
                        </div>
                    </div>

                    {/* قدم دوم */}
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">۲</div>
                            <div className="w-0.5 flex-1 bg-outline-variant/30 mt-1 mb-1"></div>
                        </div>
                        <div className="flex-1 pb-2">
                            <h4 className="font-bold text-on-surface dark:text-gray-100 flex items-center gap-2">
                                <Store className="w-4 h-4 text-primary" />
                                بازارتان را در Daymat بسازید (همین حالا!)
                            </h4>
                            <p className="text-sm text-on-surface-variant/80 dark:text-gray-400 mt-1 leading-7">
                                در همین ویزارد، اطلاعات پایه، دسته‌بندی کالاها، شهرهای هدف و صنوف مجاز را مشخص می‌کنید.
                                بازار شما در کمتر از ۱۰ دقیقه آمادهٔ استفاده است.
                            </p>
                        </div>
                    </div>

                    {/* قدم سوم */}
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">۳</div>
                            <div className="w-0.5 flex-1 bg-outline-variant/30 mt-1 mb-1"></div>
                        </div>
                        <div className="flex-1 pb-2">
                            <h4 className="font-bold text-on-surface dark:text-gray-100 flex items-center gap-2">
                                <PhoneCall className="w-4 h-4 text-emerald-500" />
                                اعضای اولیه را دعوت کنید (کلید طلایی)
                            </h4>
                            <p className="text-sm text-on-surface-variant/80 dark:text-gray-400 mt-1 leading-7">
                                این مهم‌ترین قدم است. با <strong>چند تأمین‌کنندهٔ اصلی</strong> تماس بگیرید و بگویید:
                                «من یک تابلوی قیمت روز رایگان برایتان درست کرده‌ام، مشتری‌های واقعی شما را پیدا می‌کنند.»
                                سپس چند <strong>خریدار عمده</strong> (مغازه‌دار، پیمانکار و ...) را خبر کنید که قیمت‌های به‌روز اینجا هست.
                                با <strong>۱۰ فروشنده و ۲۰ خریدار</strong> بازار شما جان می‌گیرد.
                            </p>
                        </div>
                    </div>

                    {/* قدم چهارم */}
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">۴</div>
                            <div className="w-0.5 flex-1 bg-outline-variant/30 mt-1 mb-1"></div>
                        </div>
                        <div className="flex-1 pb-2">
                            <h4 className="font-bold text-on-surface dark:text-gray-100 flex items-center gap-2">
                                <CircleDollarSign className="w-4 h-4 text-amber-500" />
                                درآمدتان از نردبان شروع می‌شود
                            </h4>
                            <p className="text-sm text-on-surface-variant/80 dark:text-gray-400 mt-1 leading-7">
                                وقتی بازار شلوغ شد، فروشندگان برای دیده شدن بیشتر، آگهی خودشان را «نردبان» می‌کنند.
                                شما از هر نردبان <strong className="text-emerald-600">۷۰٪ سود</strong> می‌برید.
                                حتی با روزی ۱۰۰ نردبان کوچک، درآمدتان میلیونی می‌شود.
                            </p>
                        </div>
                    </div>

                    {/* قدم پنجم */}
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold">۵</div>
                        </div>
                        <div className="flex-1">
                            <h4 className="font-bold text-on-surface dark:text-gray-100 flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                رشد کنید: از یک شهر به استان، از استان به کشور
                            </h4>
                            <p className="text-sm text-on-surface-variant/80 dark:text-gray-400 mt-1 leading-7">
                                بعد از موفقیت در شهر اول، به‌راحتی شهر دوم و سوم را اضافه کنید.
                                با گسترش بازار، تعداد اعضا و نردبان‌ها چند برابر می‌شود و درآمد شما از <strong>چند ده میلیون به چند صد میلیون</strong> در ماه می‌رسد.
                                Daymat ابزار توسعه را در اختیارتان می‌گذارد.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ۴. محاسبه سریع درآمد */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/40 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 mb-4">
                    <Wallet className="w-6 h-6 text-emerald-600" />
                    <h3 className="font-extrabold text-lg text-emerald-700 dark:text-emerald-300">محاسبه درآمد حدودی فقط از نردبان</h3>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/60 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-on-surface-variant dark:text-gray-300 mb-3">
                        <span>اگر روزانه فقط</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 text-xl">۱۰۰</strong>
                        <span>آگهی نردبان شود، و هزینه هر نردبان</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 text-xl">۵۰,۰۰۰ تومان</strong>
                    </div>
                    <div className="flex justify-center items-center gap-3 mb-4 text-lg font-bold">
                        <span className="text-on-surface-variant">درآمد کل روزانه:</span>
                        <span className="text-2xl text-on-surface">۵,۰۰۰,۰۰۰ تومان</span>
                    </div>
                    <div className="w-full h-px bg-emerald-200 dark:bg-emerald-700 my-3"></div>
                    <div className="flex justify-between items-center px-4">
                        <span className="text-base font-bold text-on-surface dark:text-gray-200">سهم ۷۰٪ شما:</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">۳,۵۰۰,۰۰۰ تومان</span>
                    </div>
                    <p className="text-xs text-center mt-2 text-emerald-600/70 dark:text-emerald-400/70">معادل ماهیانه: بیش از ۱۰۰ میلیون تومان</p>
                </div>
                <p className="text-xs text-on-surface-variant/70 dark:text-gray-400 mt-3">
                    * با جذب اعضای بیشتر، این عدد رشد می‌کند.
                </p>
            </div>

            {/* ۵. رویای آینده */}
            <div className="flex gap-3 p-5 rounded-2xl bg-gradient-to-l from-indigo-50 to-transparent dark:from-indigo-900/20 dark:to-transparent border border-indigo-100 dark:border-indigo-800">
                <Rocket className="w-6 h-6 text-indigo-500 mt-0.5 flex-shrink-0" />
                <div>
                    <h3 className="font-bold text-on-surface dark:text-gray-100 mb-2">و این تازه شروع ماجراست...</h3>
                    <p className="text-sm text-on-surface-variant/80 dark:text-gray-400 leading-7">
                        Daymat در حال توسعهٔ ابزارهای درآمدزایی جدیدی است که به مرور در اختیار بازارهای موفق قرار می‌گیرد:
                    </p>
                    <ul className="mt-3 space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-500 mt-0.5" />
                            <span><strong>کارمزد معاملات:</strong> با فعال شدن درگاه پرداخت امن، از هر فروش درصد می‌گیرید.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Users className="w-4 h-4 text-indigo-500 mt-0.5" />
                            <span><strong>اشتراک ویژه (VIP):</strong> فروشندگان برای امکانات بیشتر حق اشتراک می‌پردازند.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-indigo-500 mt-0.5" />
                            <span><strong>تبلیغات هدفمند:</strong> برندها برای دیده شدن در بازار شما هزینه می‌کنند.</span>
                        </li>
                    </ul>
                    <p className="mt-3 text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                        * هدف ما این است که شما را به یک بازاردار بزرگ تبدیل کنیم. ایجاد درآمد برای شما = موفقیت Daymat.
                    </p>
                </div>
            </div>

            {/* ۶. فراخوان نهایی */}
            <div className="text-center pt-4">
                <p className="text-lg font-black text-on-surface dark:text-gray-100 leading-8">
                    ابزار آماده است. ایده‌تان را بردارید و
                    <br />
                    <span className="text-primary dark:text-primary-300">با کلیک روی «مرحله بعد» اولین بازار تخصصی خود را بسازید.</span>
                </p>
            </div>

        </div>
    );
}