// app/docs/terms/TermsClient.tsx
'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store/store';
import { AppHeader, AppFooter } from '@/app/components';

export default function TermsClient() {
    const { currentArm } = useSelector((state: RootState) => state.arm);
    const armName = currentArm?.name || 'Daymat';
    const armConfig = (currentArm?.config as any) || {};
    const supportPhone = armConfig?.support?.phone || '021-12345678';
    const supportEmail = armConfig?.support?.email || 'support@example.com';
    const platformDomain = currentArm?.customDomain || `${currentArm?.slug}.daymat.com` || 'daymat.com';

    // برخی کلیدواژه‌های پویا بر اساس امکانات بازو
    const hasPriceTable = armConfig?.modules?.priceTable?.enabled !== false;
    const hasBuyLead = armConfig?.modules?.buyLead?.enabled !== false;
    const hasBump = armConfig?.modules?.priceTable?.bumpCost > 0;

    const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
        <section className="mb-10">
            <h2 className="text-xl font-bold text-on-surface dark:text-gray-100 mb-4 border-b border-outline-variant/30 pb-2">
                {title}
            </h2>
            <div className="text-on-surface-variant dark:text-gray-300 leading-8 text-justify space-y-4">
                {children}
            </div>
        </section>
    );

    return (
        <div className="min-h-screen bg-surface dark:bg-gray-950">
            <AppHeader showBack={true} />
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* عنوان اصلی */}
                <div className="text-center mb-12">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-on-surface dark:text-gray-100 mb-3">
                        شرایط و قوانین کلی  {armName}
                    </h1>
                    <p className="text-sm text-on-surface-variant dark:text-gray-400 max-w-2xl mx-auto">
                        به {armName} خوش آمدید. پلتفرم {armName} برای آسان‌سازی معاملات عمده و حذف واسطه‌ها طراحی شده است.
                        استفاده از خدمات این پلتفرم منوط به پذیرش کامل شرایط و قوانین زیر است.
                    </p>
                </div>

                {/* ماده ۱ - تعاریف */}
                <Section title="ماده ۱- تعاریف">
                    <p>
                        الف) <strong>{armName}</strong>: پلتفرم برخط بازار تخصصی عمده‌فروشی است که امکان ایجاد و مدیریت بازارهای اختصاصی (بازو) را فراهم می‌کند.
                    </p>
                    <p>
                        پ) <strong>بازو</strong>: هر بازار تخصصی ایجاد‌شده در بستر {armName} که به یک صنف خاص اختصاص دارد.
                    </p>
                    <p>
                        ت) <strong>کاربر</strong>: شخص حقیقی یا حقوقی که پس از تأیید شماره موبایل و ثبت کسب‌وکار، در {armName} فعالیت می‌کند.
                    </p>
                    <p>
                        ث) <strong>تابلوی قیمت</strong>: ویترین زنده‌ای که قیمت‌های اعلام‌شده توسط فروشندگان عمده را به‌صورت شفاف نمایش می‌دهد.
                    </p>
                    <p>
                        ج) <strong>نردبان</strong>: سرویسی که آگهی کاربر را برای مدت معین به بالای تابلو منتقل می‌کند و نیازمند مصرف اعتبار است.
                    </p>
                </Section>

                {/* ماده ۲ - شرایط عمومی */}
                <Section title="ماده ۲- شرایط عمومی استفاده">
                    <p>۱-۲) داشتن حداقل ۱۸ سال سن و اهلیت قانونی برای انعقاد قرارداد.</p>
                    <p>۲-۲) ثبت شماره موبایل معتبر و تأیید آن.</p>
                    <p>۳-۲) رعایت قوانین جمهوری اسلامی ایران و عدم انتشار محتوای خلاف عرف و اخلاق.</p>
                    <p>۴-۲) مسئولیت صحت اطلاعات شخصی و محتوای آگهی‌ها کاملاً بر عهده کاربر است و {armName} صرفاً بستر انتشار را فراهم می‌کند.</p>
                    <p>۵-۲) استفاده از زبان فارسی در تمام محتواها الزامی است.</p>
                </Section>

                {/* ماده ۳ - پشتیبانی */}
                <Section title="ماده ۳- پشتیبانی">
                    <p>۱-۳) تیم پشتیبانی {armName} در ساعات کاری (شنبه تا چهارشنبه ۹ الی ۱۷) پاسخگوی مشکلات فنی و گزارش تخلفات است.</p>
                    <p>۲-۳) راه‌های ارتباطی: تلفن <span dir="ltr">{supportPhone}</span> و ایمیل <span dir="ltr">{supportEmail}</span>.</p>
                </Section>

                {/* ماده ۴ - آگهی‌ها و نردبان */}
                <Section title="ماده ۴- انتشار آگهی و استفاده از نردبان">
                    <p>۱-۴) هر کاربر می‌تواند تا سقف <strong>{armConfig?.modules?.priceTable?.maxActiveAdsPerUser || 5}</strong> آگهی فعال هم‌زمان داشته باشد. فراتر از آن، ثبت آگهی نیازمند مصرف اعتبار است.</p>
                    <p>۲-۴) مدت اعتبار قیمت هر آگهی حداکثر <strong>{72}</strong> ساعت است و پس از پایان، به‌طور خودکارآرشیو می شود و برای نمایش مجدد باید قیمت آن آپدیت و فعال شود.</p>
                    <p>۳-۴) استفاده از نردبان (Bump) با هزینهٔ <strong>{armConfig?.modules?.priceTable?.bumpCost || 10}</strong> اعتبار به ازای هر ۲۴ ساعت انجام می‌شود. آگهی نردبان‌شده در بالای تابلو نمایش داده می‌شود.</p>
                    <p>۴-۴) درج آگهی تکراری، محتوای گمراه‌کننده، یا دسته‌بندی نادرست ممنوع است و می‌تواند به حذف آگهی و مسدودیت حساب منجر شود.</p>
                </Section>

                {/* ماده ۵ - اعتبار و پرداخت‌ها */}
                <Section title="ماده ۵- اعتبار و پرداخت‌ها">
                    <p>۱-۵) واحد پولی پلتفرم {armConfig?.economy?.currency || 'IRR'} است. کاربران می‌توانند از طریق درگاه آنلاین یا واریز فیش، اعتبار خریداری کنند.</p>
                    <p>۲-۵) اعتبار خریداری‌شده غیرقابل بازگشت است مگر در مواردی که به تشخیص مدیریت پلتفرم خطایی رخ داده باشد.</p>

                </Section>

                {/* ماده ۶ - مسئولیت‌ها */}
                <Section title="ماده ۶- مسئولیت‌ها">
                    <p>{armName} صرفاً یک زیرساخت نرم‌افزاری برای تسهیل ارتباط خریداران و فروشندگان عمده است. این پلتفرم هیچ‌گونه مسئولیتی در قبال کیفیت کالا، صحت قیمت‌ها، یا اجرای تعهدات طرفین معامله ندارد. تأیید هویت کاربران از طریق تیک‌های اعتماد (آبی/نقره‌ای/طلایی) صرفاً نشان‌دهندهٔ احراز اطلاعات کسب‌وکار است و به‌منزلهٔ تضمین عملکرد آن‌ها نیست.</p>
                </Section>

                {/* ماده ۷ - حریم خصوصی */}
                <Section title="ماده ۷- حریم خصوصی">
                    <p>اطلاعات شخصی کاربران نزد {armName} محفوظ است و جز در موارد قانونی در اختیار شخص ثالث قرار نمی‌گیرد. اطلاعات تماس (شماره موبایل) تنها پس از درخواست تماس توسط خریدار و با رضایت فروشنده نمایش داده می‌شود.</p>
                </Section>

                <div className="text-center text-xs text-on-surface-variant/60 mt-12 border-t border-outline-variant/20 pt-6">
                    آخرین به‌روزرسانی: {new Date().toLocaleDateString('fa-IR')}
                </div>
            </main>
            <AppFooter />
        </div>
    );
}