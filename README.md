# دیمت (Daymat) — بازار عمده‌فروشی B2B

> **راهنمای کامل پروژه — برای توسعه‌دهندهٔ انسانی یا هوش مصنوعی**
> هدف این سند یک چیز است: هر ایجنتی که این ریپو را باز می‌کند، بدون حتی یک سؤال از مالک، ایدهٔ دیمت، معماری بک‌اند و فرانت‌اند، قوانین پروژه و روش درست ادامه‌دادن کار را بفهمد و سریع روی کد سوار شود.
>
> - ریپوی فرانت‌اند: `github.com/rotbino/daymat-web` (همین ریپو — Next.js)
> - ریپوی بک‌اند: `github.com/rotbino/daymat-back` (NestJS + Prisma + MongoDB)
> - دامنهٔ رسمی: `daymat.ir`

---

## ۱) ایدهٔ دیمت در یک نگاه

**دیمت یک بازار عمده‌فروشی B2B است**: جایی که کسب‌وکارها (نه مصرف‌کننده‌های عادی) کالای خود را با قیمت عمده عرضه می‌کنند، قیمت‌گیری می‌کنند و با هم شبکه می‌سازند.

دو موتور اصلی در قلب محصول هست:

1. **کاتالوگ قیمت (کاتالوگ فروش)** — ویترین و جدول قیمت زندهٔ هر کسب‌وکار. فروشنده کالاهایش را با واحد، قیمت، حداقل تعداد و شرایط پرداخت ثبت می‌کند و یک صفحهٔ عمومی قابل‌اشتراک (با اسلاگ اختصاصی، QR و کارت ویزیت) می‌گیرد.
2. **بازوی خرید (صفحهٔ خرید)** — خریدار (پیمانکار، فروشگاه، توزیع‌کننده و…) فهرست نیازهای خودش را منتشر می‌کند و تامین‌کننده‌ها روی اقلام آن «پیشنهاد قیمت» می‌فرستند؛ چرخهٔ کامل پیشنهاد → مذاکره → پذیرش/رد → سرنخ فروش داخل پنل‌ها مدیریت می‌شود.

و روی این دو موتور، مفهوم کلیدی دیگری سوار است: **بازار تخصصی (بازو)** — بخش ۳.

منطق اقتصادی پلتفرم روی **اعتبار (Credit)** بنا شده: ثبت‌نام هدیهٔ اعتبار دارد، بعضی اقدامات (مثل bump آگهی یا ماژول‌های پولی بازار) اعتبار مصرف می‌کند و شارژ از طریق درگاه‌های پرداخت ایرانی انجام می‌شود.

---

## ۲) واژه‌نامهٔ دامنه

این جدول را مرجع رسمی واژگان بدان؛ در UI، پیام‌ها و کد باید دقیقاً همین واژه‌ها به کار رود (قوانین بخش ۱۲):

| اصطلاح | معادل کد | یعنی چه |
|---|---|---|
| کاربر | `User` | هر کسی که با موبایل+رمز ثبت‌نام کرده است |
| کسب‌وکار | `Business` | هویت تجاری کاربر (می‌تواند چندتا داشته باشد)؛ «کسب‌وکار یک‌دقیقه‌ای» |
| کاتالوگ / کاتالوگ قیمت | `Catalog` | ویترین فروش یک کسب‌وکار؛ همیشه به یک `Business` وصل است (`businessId` الزامی) |
| بازو / بازار | `Arm` | بازار تخصصی که مالک دارد؛ فروشنده‌ها و خریدارها به آن می‌پیوندند (بخش ۳) |
| عضویت بازو | `ArmMembership` | پیوند کاربر↔بازو با نقش؛ **هاب مرکزی دامنه** |
| آگهی / ردیف قیمت | `Ad` | یک کالا با قیمت در یک کاتالوگ (`catalogId` و `unitId` الزامی) |
| کالای مرجع | `ProductReference` | کالای مرکزی و مشترک (`title` یکتا) — همه از همان استفاده می‌کنند تا واژگان پراکنده نشود |
| برند | `Brand` | برند مرکزی (`title` یکتا) + **دستهٔ ثابت اجباری** (بخش ۵) |
| دستهٔ برند | `BrandCategory` | تاکسونومی ثابت ۲۲تایی، فقط سید می‌شود، کاربر حق ساخت ندارد |
| صنف | `Industry` | مرجع پیشنهاد صنف با autocomplete و شمارندهٔ استفاده |
| واحد | `Unit` | واحدهای شمارش کالا (کارتن با `containsQty`، بسته، عدد و…) |
| اعلام خرید / قلم خرید | `Inquiry` + `InquiryItem` | فهرست نیازهای خریدار در بازوی خرید |
| پیشنهاد قیمت | `InquiryOffer` | پیشنهاد تامین‌کننده روی یک قلم خرید |
| درخواست تامین / پیشنهاد تامین | — | واژگان رسمی: درخواستِ خریدار از تامین‌کننده = «درخواست تامین»؛ پیشنهادِ تامین‌کننده به خریدار = «پیشنهاد تامین» — هرگز جابجا نمی‌شوند |
| تابلوی درخواست خرید | `BuyLead` | اعلام خرید عمومی در سطح بازو |
| اعتبار | `Credit` / `CreditRequest` | کیف پول اعتباری + درخواست شارژ دستی/آنلاین |
| نماد اعتماد | `Verification` / `TrustMetric` | تایید مدارک کسب‌وکار در سطح‌ها (tier) |

---

## ۳) مفهوم «بازو» — قلب معماری دیمت

«بازو» (در کد: `Arm`، در UI: «بازار») یک **بازار تخصصی مستقل** است — مثلاً «مصالح ساختمانی»، «مواد غذایی»، «تجهیزات پزشکی». هر بازو:

- توسط **ادمین سیستم** ساخته می‌شود (`POST /arm` پشت گارد `ArmManagerGuard`)؛ کاربر عادی حق ساخت بازو ندارد.
- اسلاگ عمومی خودش را دارد: `GET /arm/:slug` و صفحهٔ عمومی روی ریشهٔ سایت `/[slug]`.
- حتی می‌تواند **دامنهٔ اختصاصی** داشته باشد (`Arm.customDomain` + `DomainResolverMiddleware` که درخواست دامنهٔ سفارشی را به `/:slug/...` بازنویسی می‌کند).
- پیکربندی بزرگی در `Arm.config` (JSON) دارد: ظاهر، ماژول‌های فعال (دیوار فروشندگان/خریداران)، اقتصاد (واحد پول، قیمت اعتبار، هزینهٔ bump)، پرداخت (درگاه‌ها/حساب دستی)، قواعد دسترسی، انتخاب لوکیشن و درخت دسته‌بندی تابلو (`categoryTree` + `allowedCategoryScopeTree`).
- دو تابلوی همیشه‌فعال دارد: **تابلوی قیمت** (آگهی‌های فروشندگان عضو) و **تابلوی خرید** (اعلام‌های خرید اعضا).

### خرید و فروش «نقش داخل بازو» هستند، نه دو شیء جدا

این مهم‌ترین نکتهٔ مفهومی معماری است. یک بازار واحد است و اعضا با نقش واردش می‌شوند:

```
User ──< ArmMembership >── Arm
            │
            ├── role        : arm_owner | arm_seller | arm_buyer | arm_member   (سطح دسترسی پنل)
            ├── roleType    : seller | buyer | seller-buyer                     (نقش تجاری)
            ├── status      : active | banned | removed                         (دسترسی سیستم)
            ├── businessStatus : active | paused                                (وضعیت تجاری — مکث، آگهی‌ها را از تابلو برمی‌دارد)
            └── catalogId   : کاتالوگِ فروشنده (مجوز انتشار قیمت روی تابلو)
```

- **پیوستن فروشنده** = `POST /arm/:slug/join {roleType:'seller', catalogId}` — کاتالوگِ خودش را به بازار می‌آورد؛ آگهی‌هایش با `stampCatalogAds` روی تابلوی بازار «مهر» می‌شود.
- **پیوستن خریدار** = `POST /arm/:slug/join {roleType:'buyer'}` — بدون کاتالوگ.
- `@@unique([armId, userId])` — هر کاربر در هر بازو یک عضویت دارد (می‌تواند هم‌زمان مالک و فروشنده باشد).

### انتشار چند-بازارهٔ آگهی

حقیقتِ انتشار در مدل `AdPublication` است (`@@unique([adId, armId])`، استراتژی «اسنپ‌شات + منسوخ‌سازی»)؛ فیلدهای `Ad.armId/categoryId/categoryPath` فقط **کش** هستند. یک آگهی با `POST /ad/:id/publish-to-market` می‌تواند هم‌زمان در چند بازار منتشر شود. دسته‌بندی روی تابلو ممکن است با دستهٔ خصوصی کاتالوگ فرق کند؛ آگهیِ بی‌دسته با `GET /user-market/my-uncategorized` پیدا و با `PATCH /user-market/ads/:adId/category` خوداشتغال اصلاح می‌شود.

### چرا این طراحی؟ (چشم‌انداز مالک)

بازارهای تخصصی یعنی دیمت می‌تواند در هر بازو، **تعداد و تخصص برندها/کالاها/فروشندگان را محدود و کنترل‌شده نگه دارد** — یک «بازوی مصالح» تمیز و حرفه‌ای، نه یک دیوار آشفتهٔ عمومی. دسته‌بندی برندها (بخش ۵) دقیقاً همین زیرساخت است: از این به بعد می‌شود در هر بازو فقط برندهای مرتبط با آن حوزه را پذیرفت.

---

## ۴) دو محصول دیمت: کاتالوگ قیمت و بازوی خرید

```
   فروشنده                                    خریدار
┌─────────────────┐                      ┌─────────────────┐
│  Business       │                      │  Business       │
│  └ Catalog      │                      │  └ (بدون کاتالوگ)│
│    └ Ad×N       │                      │                 │
└───────┬─────────┘                      └───────┬─────────┘
        │ join (seller)                          │ join (buyer)
        ▼                                        ▼
┌─────────────────────────  Arm (بازار)  ─────────────────────────┐
│   تابلوی قیمت (Ad)                 تابلوی خرید (Inquiry/BuyLead) │
└─────────────────────────────────────────────────────────────────┘
        ▲                                        │
        │            پیشنهاد قیمت (InquiryOffer) │
        └──────── تامین‌کننده‌های مرتبط ◀─────────┘
```

- سمت خرید مدل مستقل دارد: `Inquiry` (صفحهٔ خرید) → `InquiryItem` (قلم‌ها، از مرجع کالا + واحد مرجع) → `InquiryOffer` (پیشنهادها) و انتشار روی تابلو با `InquiryPublication` (قرینهٔ AdPublication).
- شبکهٔ خرید↔فروش با `InquiryMember` و عضویت متقابل کاتالوگ‌ها زنده می‌شود؛ «سرنخ‌های فروش» تامین‌کننده در پنل فروش ظاهر می‌شوند.
- مخاطبین: ماژول `contact` دفترچهٔ تلفن دو-گروهی با سینک و تطبیق اعضای دیمت دارد (`UserContact`).

---

## ۵) بازارهای تخصصی و دسته‌بندی برندها

**تصمیم مالک (الزامی رعایت شود):**

- برندها یک **تاکسونومی ثابت سطح‌بالا** دارند؛ مدل `BrandCategory` (`@@map("brand_categories")` با فیلدهای `name @unique`, `slug @unique`, `order`, `isActive`).
- **کاربر هرگز حق ساختن/ویرایش دسته را ندارد** — دسته‌ها فقط با سید وارد دیتابیس می‌شوند: `npm run seed:brand-categories` → `prisma/scripts/seed-brand-categories.ts` (idempotent، upsert بر اساس slug، هشدار اگر بیش از ۳۰ شود).
- **سقف تعداد دسته‌ها همیشه ≤ ۳۰** — الان دقیقاً **۲۲ دسته** روی دیتابیس هست.
- ثبت برند **بدون انتخاب دسته ناممکن است**: `POST /brands` فیلد `categoryId` را الزامی می‌گیرد؛ دستهٔ نامعتبر → خطای `BRAND_CATEGORY_INVALID`.
- فیلد قدیمیِ متنی `Brand.category` با نام دستهٔ انتخابی **همگام** نگه داشته می‌شود (سازگاری فیلترهای قدیمی).
- **سرچ برند مثل قبل است** — دسته برای فیلتر جستجو نیست؛ هدف آن محدودسازی تخصصی برندهای هر بازو در آینده است (`Brand.armId` مبدأ ثبت را نگه می‌دارد).
- ثبت برند تکراری ممنوع: تشخیص تکرار با نرمال‌سازی کامل فارسی (ی/ي، ک/ك، اعداد فارسی، کشیده، ZWNJ، فاصله) انجام می‌شود؛ تکرار → همان برند موجود با `_existed: true` برگردانده می‌شود (idempotent).
- لیست دسته‌ها: `GET /brands/categories` عمومی + کش ۶۰ ثانیه.

نکتهٔ فنی مهم برای Prisma+MongoDB: توابع تشخیص تکرار (`findDuplicateTitle`) **عمداً با `findMany` + تطبیق regex در JS** کار می‌کنند، چون Prisma روی MongoDB اپراتورهای خام `$regex/$ne` را در فیلتر نمی‌پذیرد و `PrismaClientValidationError` می‌دهد.

---

## ۶) معماری کلی

```
                ┌───────────────────────────────┐
                │      کاربر (PWA فارسی، RTL)    │
                └───────────────┬───────────────┘
                                │ HTTPS
        ┌───────────────────────▼────────────────────────┐
        │ daymat-web — Next.js 16 · React 19 · App Router│
        │ Tailwind 4 · Radix UI · React Query · Redux    │
        │ Vazirmatn · dir=rtl · PWA (manifest + sw.js)   │
        └───────────────────────┬────────────────────────┘
                                │ REST + Bearer JWT (axios)
                                │ NEXT_PUBLIC_API_BASE_URL
        ┌───────────────────────▼────────────────────────┐
        │ daymat-back — NestJS 11 (Fastify)              │
        │ ValidationPipe سخت‌گیرانه · JWT · گاردهای چندلایه│
        │ CacheHelper (باطل‌سازی epoch) · Swagger /api/docs│
        │ i18n (fa/en) · AllExceptionsFilter با errorCode│
        └───────────┬───────────────────────┬────────────┘
                    │ Prisma 6              │
        ┌───────────▼──────────┐   ┌────────▼─────────────────┐
        │  MongoDB (Atlas)     │   │ Arvan S3 (فایل/عکس+تامب) │
        │  ۴۵ مدل / کالکشن      │   │ درگاه‌ها: زرین‌پال/ریان‌پی/پارسیان│
        └──────────────────────┘   └──────────────────────────┘
```

- **بدون prefix سراسری** — همهٔ روت‌ها از ریشه‌اند (مثلاً `/brands`)؛ مستندات: `GET /api/docs` (Swagger).
- پورت پیش‌فرض بک: `3011` (`PORT` env). فرانت: `3000`.
- سلامت: `GET /health` (پینگ محدودِ دیتابیس، 200/503 بدون هنگ).

---

## ۷) بک‌اند — daymat-back

### ۷.۱) استک

| لایه | انتخاب |
|---|---|
| فریم‌ورک | NestJS 11 روی **Fastify** (`@nestjs/platform-fastify`, multipart تا 10MB) |
| ORM / DB | Prisma 6 + MongoDB (Atlas) — همهٔ PKها `@db.ObjectId` |
| احراز هویت | `@nestjs/jwt` + passport-jwt، هش `bcryptjs` (cost 10) |
| اعتبارسنجی | `class-validator` + `ValidationPipe` سراسری |
| کش | `@nestjs/cache-manager` درون‌حافظه‌ای + `CacheHelper` سفارشی (بخش ۷.۵) |
| فایل | `@aws-sdk/client-s3` سازگار با آروان (`forcePathStyle`) + `sharp` برای تامبنیل |
| پرداخت | زرین‌پال / ریان‌پی / پارسیان (PEC) با `payment-factory.service` |
| مستندات | Swagger در `/api/docs` |

### ۷.۲) مدل داده — ۴۵ مدل Prisma

گروه‌بندی اصلی (جزئیات در `prisma/schema.prisma`):

- **هویت و دسترسی**: `User` (موبایل یکتا، `role: SystemRole = system_admin|system_user`، کد رفرال یکتا + attribution اولین تماس، `tokenVersion` برای لاگ‌اوت واقعی)، `VerificationCode`
- **هستهٔ دامنه**: `Business`، `Catalog` (`salesType: wholesale|retail|service` + `type: producer|wholesaler|importer|exporter|distributor|retailer|contractor|service_provider|other`)، `Arm`، `ArmMembership` (بخش ۳)، `ArmMembershipRequest`، `ArmLeaveRequest`، `ArmSavedMark`، `ArmMembershipEvent`، `TeamMember`/`CatalogMember` (+`CatalogTeamEvent`)، `BusinessMember`، `Verification`
- **تاکسونومی**: `ProductCategory` (درخت با `code`)، `Unit` (`containsQty`, `qtyIsFixed`)، `Industry` (`usageCount`, `confirmed`, `isByUser`)، `Activity`، `Location`، `BusinessActivity`
- **عرضه**: `Ad`، `AdPublication`، `AdView`، `AdInteraction`، `CallEvent`، `CatalogInteraction`
- **تقاضا**: `Inquiry`، `InquiryItem`، `InquiryOffer`، `InquiryMember`، `InquiryPublication`، `SavedInquiry`، `BuyLead`
- **مراجع مشترک**: `Brand` (+`brandCategoryId`)، `BrandCategory`، `ProductReference` (`isNew` = فقط سازندهٔ تازه‌ساخت حق حذف/ویرایش دارد)
- **اقتصاد و اعتماد**: `Credit`، `CreditRequest`، `TrustMetric`
- **پلتفرم**: `File`، `Setting`، `Feedback`، `SearchLog`، `Notification`، `UserContact`، `ConnectionRequestLog`

### ۷.۳) ماژول‌ها و روت‌ها (خلاصهٔ عملیاتی)

| ماژول | روت‌های کلیدی | نکته |
|---|---|---|
| `auth` | `POST /auth/register`، `/auth/login`، `/auth/check-phone`، `GET /auth/me`، `PUT /auth/change-password`، `POST /auth/request-verification` → `verify-code-and-set-password` | ثبت‌نام = موبایل IR + رمز ≥۶ + `refCode?` → هدیهٔ ۵۰ اعتبار |
| `arm` | `POST /arm` (ادمین)، `GET /arm/:slug`، `GET /arm/suggested`، `POST /arm/:slug/join`، `DELETE /arm/:slug/leave`، `PATCH /arm/:slug/catalog-publish` | ترتیب روت‌ها مهم است: `/arm/suggested` قبل از `:slug` |
| `catalog` | `POST /catalog` (`businessId` الزامی)، `GET /catalog`، `PUT /catalog/:id`، `PATCH /catalog/:id/config` (درخت دسته + واحدهای خصوصی)، slug-check | ساخت کاتالوگ خودش `TeamMember(catalog_owner)` می‌سازد |
| `ad` | `POST /ad`، `PUT /ad/:id`، `POST /ad/:id/bump`، `GET /ad/arm/:slug` (تابلو)، `POST /ad/:id/publish-to-market`، `GET /ad/notifications` (اعلان‌های مشتق) | `catalogId`+`unitId` الزامی؛ مالکیت از طریق `catalog.business.ownerUserId` |
| `inquiry` | سمت خرید: صفحهٔ خرید، اقلام، پیشنهادها، `GET /inquiry/arm/:slug`، انتشار `InquiryPublication` | واژگان رسمی «درخواست/پیشنهاد تامین» |
| `brands` | `GET /brands/categories` (عمومی)، `GET /brands/search?q=`، `POST /brands` (`categoryId` الزامی)، `PATCH /brands/:id`، `DELETE /brands/:id` | بخش ۵ را ببین |
| `products` | `GET /products/search?q=&mine=`، `POST /products`، `PUT /products/:id` | کالای مرجع مشترک |
| `business` | `POST /business`، `GET /business/my`، `PUT /business/:id`، `PUT /business/:id/activities`، `GET /business/search-users` | «کسب‌وکار یک‌دقیقه‌ای» |
| `credit` | `GET /credit/balance`، `POST /credit/purchase`، کال‌بک‌های `verify/success/failed`، پنل مالی بازو | سه درگاه با factory |
| `file` | `POST /file/upload` (آروان + sharp)، `GET /file/:fileId(/thumbnail)` | مدل‌های مجاز: User/Catalog/Ad/ProductReference/Brand |
| `contact` | دفترچهٔ مخاطبین + تطبیق اعضا + درخواست ارتباط | `UserContact`، `ConnectionRequestLog` |
| `notification` | اعلان‌های واقعی کاربر | مدل `Notification` |
| `arm-admin` | `GET /arm-admin/:slug/...` — sellers/buyers/members/references/ads/settings/payments/financial | گارد `ArmAdminGuard` = مالکِ همان بازو |
| `admin` | `admin/users|arms|ads|brands|products|units|industries|categories|locations|businesses|credits|feedbacks|payments|settings|activities` | گارد `AdminGuard` (`system_admin`) |
| بقیه | `unit`، `location`، `activity`، `feedback`، `settings` (`user/settings`, `arm/settings`, `admin/settings`)، `user-market`، `health` | — |

**سه لایهٔ نقش** — همهٔ گاردها روی همین‌ها سوارند:
1. سیستم: `User.role` → `AdminGuard` / `ArmManagerGuard`
2. بازو: `ArmMembership.role` + `roleType` → `ArmAdminGuard` (مالکِ فعال همان اسلاگ)
3. کاتالوگ: `TeamMember.role: catalog_owner|catalog_admin|catalog_seller`

### ۷.۴) قرارداد خطا و اعتبارسنجی (برای فرانت اجباری است)

`main.ts`: `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true })`.

- **هر فیلدی که DTO نداشته باشد، درخواست را با 400 می‌کُشد** — پس افزودن هر فیلد جدید باید هم‌زمان در DTO بک و در بدنهٔ فرانت انجام شود. این «قرارداد طلایی» همگام‌سازی وب↔بک است.
- شکل خطای استاندارد (AllExceptionsFilter + i18n fa/en):
```json
{ "statusCode": 400, "errorCode": "BRAND_CATEGORY_INVALID", "message": "دستهٔ برند معتبر نیست — از لیست دسته‌ها انتخاب کنید", "field": "categoryId", "timestamp": "...", "path": "/brands" }
```
- کدهای پرتکرار: `VALIDATION_ERROR`, `WRONG_CREDENTIALS`, `DUPLICATE_PHONE`, `DUPLICATE_SLUG`, `DUPLICATE_TITLE` (۴۰۹ در ویرایش), `BUSINESS_REQUIRED`, `INVALID_CATALOG`, `UNIT_NOT_FOUND`, `BRAND_CATEGORY_INVALID`, `BRAND_CONFIRMED`, `NOT_OWNER`, `ARM_NOT_FOUND`, `NOT_ARM_ADMIN`, `ALREADY_MEMBER`, `MARKET_TYPE_MISMATCH`.

### ۷.۵) کش (الگوی epoch)

`CacheHelper` (گلوبال از `CommonModule`) با ایدهٔ «نسخه‌بندی فضای‌نام»: کلید = `{prefix}:v{epoch}:{parts}` — `bust(prefix)` فقط epoch را می‌شکند و همهٔ کلیدهای قدیمی با TTL خودشان می‌میرند. O(1) بدون لیست‌کردن کلیدها؛ خطای کش هرگز مسیر DB را نمی‌شکند.

| فضای‌نام | TTL | باطل‌سازی |
|---|---|---|
| `brand-search` | 30s | create/update/delete برند |
| `brand-categories` | 60s | — (تاکسونومی ثابت) |
| `prod-search` | 30s | CRUD کالای مرجع |
| `units` | 1h | CRUD واحد ادمین |

### ۷.۶) سیدها و مهاجرت‌های داده

- `npm run seed:all` — اورکسترатор (لوکیشن، دسته‌ها، صنف‌ها، فعالیت‌ها، تنظیمات، بازوی نمونهٔ «مصالح»)
- `npm run seed:brand-categories` — **۲۲ دستهٔ برند** (بخش ۵)
- `seed-units` (۱۰۹ واحد در ۱۴ گروه)، `seed-brands`، `seed-create-admin` (ادمین توسعه)
- `prisma/scripts/migrate-001..014-*.ts` — مهاجرت‌های دادهٔ idempotent (با `npx tsx`)

### ۷.۷) متغیرهای محیطی (نام‌ها)

`DATABASE_URL` (Atlas)، `JWT_SECRET`، `JWT_EXPIRES_IN` (پیش‌فرض `7d`)، `PORT`، `NODE_ENV`، `FRONTEND_URL`، `CORS_EXTRA_ORIGINS`، آروان: `ARVAN_ENDPOINT/REGION/ACCESS_KEY/SECRET_KEY/BUCKET_NAME`، پرداخت: `DEFAULT_PAYMENT_GATEWAY`, `PAYMENT_CALLBACK_URL`, `ZARINPAL_MERCHANT_ID(+_SANDBOX)`, `RAYANPAY_PIN(+_SANDBOX)`, `PEC_PIN(+_SANDBOX)`.

---

## ۸) فرانت‌اند — daymat-web (همین ریپو)

### ۸.۱) استک

Next.js **16** (App Router) · React 19 · TypeScript · Tailwind **4** · کامپوننت‌های Radix (`components/radix/*`) · React Query (@tanstack) برای سرور-استیت · **Redux Toolkit + redux-persist** برای استیت کاربر (slices: `auth`, `arm`, `theme`, `catalog`) · axios (timeout ۱۵s) · `sonner` برای توست · `framer-motion` · `vaul` (دراور) · فرم‌ها: react-hook-form + zod · تقویم/تاریخ: `react-multi-date-picker`, `moment-jalaali`, `dayjs`.

- **فونت و راستا**: `Vazirmatn` از next/font، `<html lang="fa" dir="rtl">`؛ فونت‌های IRANSans/Yekan هم در `styles/fonts` برای کارت ویزیت کانواسی.
- **PWA**: `app/manifest.ts` + `public/sw.js` + `app/components/pwa/PwaInstaller.tsx` (مدال نصب چندسکویی) + `public/offline.html`.
- **تم**: تاریک/روشن + سیستم رنگ سه‌نقشی برند (سبز/آبی/کهربایی) — زمردی = کاتالوگ، کهربایی = بازوی خرید.
- `next.config.mjs`: `trailingSlash: true`، `images.unoptimized`، ریدایرکت‌های `/market→/markets` و `/inquiries→/my-inquiries`.

### ۸.۲) نقشهٔ مسیرها

| مسیر | نقش |
|---|---|
| `/` | لندینگ (مهمان) / خانهٔ عضو (MemberHome) |
| `/login` | ورود/ثبت‌نام (ثبت‌نام هم از همین جریان + `POST /auth/register`) |
| `/business/register` | ساخت کسب‌وکار + فرم کاتالوگ (بخش‌بندی ۱/۲/۳: کسب‌وکار→کاتالوگ→آدرس) |
| `/business/edit/[id]`, `/business/manage` | ویرایش/مدیریت کسب‌وکار (درصد کامل‌بودن، مدارک اعتماد) |
| `/my-catalogs` | **کنسول کاتالوگ** — تب‌های مشخصات/محصولات/آمار/انتشار + PublishToMarket |
| `/ad/create` | فرم آگهی چندمرحله‌ای (کالا→قیمت→شرایط→بازبینی) — **نیازمند `?catalog=<id>`** |
| `/ad/edit/[id]`, `/ad/reedit/[id]`, `/ad/[id]/[slug]` | ویرایش/نمایش آگهی |
| `/markets` | فهرست و جستجوی بازارها (ناوِ دو-مودی: عمومی بدون جستجو، اختصاصی با جستجو) |
| `/[slug]` | صفحهٔ عمومی کاتالوگ/بازار (هدر پروفایل‌دار، تابلوی خرید، قیف تامین‌کننده) |
| `/inquiries/new`, `/inquiries/[id]`, `/my-inquiries` | ساخت/نمایش/پنلِ اعلام خریدها (بازوی خرید) |
| `/profile`, `/saved-ads`, `/notifications`, `/feedback` | پروفایل (کسب‌وکارها/کاتالوگ‌ها/بازوهای مدیریت‌شده)، ذخیره‌ها، اعلان‌ها، بازخورد |
| `/credit/*` | خرید اعتبار، پرداخت‌ها، گزارش، verify کال‌بک |
| `/admin/*` | پنل سیستم: کاربران/بازوها(ویزارد ساخت)/آگهی‌ها/برندها/کالاها/واحدها/صنف‌ها/دسته‌ها/لوکیشن/اعتبار/تنظیمات |
| `/arm-admin/*` | پنل مالک بازار: فروشندگان/خریداران/عضویت‌ها/مرجع‌ها/تبلیغ‌ها/مالی/تنظیمات |
| `/server-unavailable` | صفحهٔ قطعی سرور/اینترنت با بازگشت خودکار |

### ۸.۳) لایهٔ API و احراز هویت کلاینت

- `lib/api/apiRequest.ts` — axios با `NEXT_PUBLIC_API_BASE_URL`، درج `Authorization: Bearer`، خطای ۱۵ ثانیه‌ای، نگاشت خطای بک به پیام فارسی (`errorHandler.ts` — بر پایهٔ `errorCode`).
- `lib/api/apiService.ts` — تمام اندپوینت‌ها دسته‌بندی‌شده (auth/business/catalog/ad/brand/product/inquiry/contact/credit/…)؛ `brand.create` فیلد `categoryId` الزامی دارد.
- `lib/api/apiHooks.ts` — هوک‌های React Query با کلیدهای کش منظم (`queryClient.ts`).
- توکن در `localStorage.accessToken` + آینهٔ redux (`authSlice`)؛ `auth-provider` هیدریت را قبل از تصمیم‌های گارد صبر می‌کند؛ لاگ‌اوت واقعی با `tokenVersion` سمت بک.

### ۸.۴) الگوی EntityPicker — قلب فرم‌های مرجع

`app/components/EntityPicker.tsx` یک انتخابگر/ثبت‌کنندهٔ ژنریک برای موجودیت‌های مرجع است؛ `IndustryAutocomplete` (صنف)، `BrandPicker` (برند) و `ProductReferencePicker` (کالا + برندِ درونش) روی آن سوارند.

**قانون پروژه: هیچ جملهٔ entity-محوری داخل کامپوننت مشترک هاردکد نمی‌شود** — همه از بیرون پاس می‌شود تا ابهام صفر شود و هر موجودیت با واژگان طبیعی خودش حرف بزند. پراپ‌های پیام‌ای الزامی:

```tsx
createFieldLabel        // «عنوان برند» / «نام کامل کالا» / «نام صنف»
createFieldPlaceholder  // «مثلاً: مکنزی»
notFoundMessage         // «برندی با این نام پیدا نشد.»
emptyMessage            // «هنوز برندی ثبت نشده…»
addToListLabel          // «افزودن «{title}» به لیست برندها» (قالب {title})
duplicateMessage        // پیام تکراری بودن
countLabel              // «{count} برند» (قالب {count})
createHint, createLabel, createTitle, selectTitle, addButtonLabel
```

و پراپ‌های توسعه (برای فیلدهای اضافی فرم مثل **دستهٔ برند**):

```tsx
renderCreateFields={({ dataRef }) => <BrandCategorySelect dataRef={dataRef} />}
createValidate={(d) => (!d.categoryId ? 'دستهٔ برند را انتخاب کن' : null)}
renderEditFields / editValidate      // ویرایش برندهای کاربر-ساخته
updateFn / deleteFn                  // فقط isNew (= isByUser) ویرایش/حذف دارد
```

- `BrandCategorySelect` (`app/components/BrandCategorySelect.tsx`) — سلکت ۲۲ دسته از `GET /brands/categories`؛ در فرم ثبت برند (مستقل و درون مودال کالا) و پنل‌های ادمین استفاده می‌شود.
- واژگانِ تامین در UI قفل است: خریدار «درخواست تامین» می‌دهد، تامین‌کننده «پیشنهاد تامین» — جابجا نکنید.

---

## ۹) جریان‌های کلیدی کاربر (سناریوهای طلایی برای تست)

1. **ورود/ثبت‌نام** → `POST /auth/register` (موبایل+رمز+refCode اختیاری) → توکن + ۵۰ اعتبار هدیه.
2. **کسب‌وکار** → `/business/register` → `POST /business` (نوع فعالیت دو-سطحی sector/role، لوکیشن، لوگو) → `POST /catalog` برای همان کسب‌وکار (نام پیشنهادی خودکار، اسلاگ با چک یکتایی).
3. **ثبت قیمت** → `/ad/create?catalog=<id>` → انتخاب کالای مرجع (جستجو/ثبت جدید) + برند (با دستهٔ الزامی) + واحد → قیمت/حداقل تعداد/شرایط چک → انتشار؛ آگهی به کاتالوگ می‌رود و با publish-to-market روی تابلوی بازوها مهر می‌شود.
4. **بازوی خرید** → ساخت صفحهٔ خرید (`/inquiries/new`) → قلم‌به‌قلم از مرجع کالا → انتشار → تامین‌کننده‌ها پیشنهاد می‌دهند → پذیرش/رد/بستن پرونده.
5. **عضویت بازار** → از `/markets` یا صفحهٔ عمومی بازو → join با نقش seller/buyer → برای فروشنده: انتخاب کاتالوگ + مهر خودکار آگهی‌ها؛ برای بازار خصوصی: چرخهٔ درخواست/تایید (`ArmMembershipRequest`).

---

## ۱۰) راه‌اندازی محلی

```bash
# ── بک‌اند ────────────────────────────────────────────────
cd daymat-back
npm install
# .env: DATABASE_URL (Atlas) + JWT_SECRET + (اختیاری) آروان/درگاه
npx prisma generate
npx prisma db push            # اعمال اسکیما (افزودنی)
npm run seed:all              # داده‌های پایه
npm run seed:brand-categories # ۲۲ دستهٔ برند
npm run build && node dist/src/main.js   # → http://localhost:3011
# مستندات: http://localhost:3011/api/docs

# ── فرانت‌اند ─────────────────────────────────────────────
cd daymat-web
npm install --legacy-peer-deps
# .env.local: NEXT_PUBLIC_API_BASE_URL=http://localhost:3011
npm run s        # dev  → http://localhost:3000
npm run build && npm start   # پروداکشن‌مانند (گیتِ راستی‌آزمایی)
```

حساب‌های محیط توسعه (فقط لوکال/تست — نه پروداکشن):
- ادمین سید‌شده: `09120000000` / `admin123456`
- کاربر E2E رایج سشن‌ها: `09119001937` / `123456`

---

## ۱۱) تست E2E — پترن امتحان‌شده و دام‌ها

پترن رایج سشن‌ها: بک روی `:3011` (با dist) + `next start -p 3000` + مرورگر هدلس (agent-browser). دام‌هایی که هر ایجنتی باید بداند:

1. `/ad/create` **بدون `?catalog=<id>`** معنا ندارد — پیام «بازوی فروش مقصد مشخص نیست» می‌دهد.
2. ویرایش کاتالوگ در `/my-catalogs` داخل تب **«مشخصات»** است، نه صفحهٔ جدا.
3. مقایسهٔ متن فارسی در eval مرورگر: همیشه `text.replace(/\u200c/g,'')` (نیم‌فاصله ابهام می‌سازد).
4. سایت PWA دارد — **سرویس‌ورکر چانک قدیمی را کش می‌کند**؛ برای تست نسخهٔ تازه: unregister SW + پاک‌کردن caches.
5. `pkill "next start"` پروسهٔ `next-server` را نمی‌کشد → `EADDRINUSE`؛ با پترن kill دقیق‌تر کار کن.
6. `next build` گیتِ اصلی است (EXIT=0)؛ `next.config.mjs` خطاهای TS را نادیده می‌گیرد (`ignoreBuildErrors`)، پس **خودت tsc را چک کن** و تعداد خطاهای pre-existing را بالاتر نبر.
7. روی MongoDB + Prisma: اپراتورهای خام `$regex/$ne` ممنوع (بخش ۵)؛ فرمت `meta.target` در خطای P2002 رشتهٔ نام ایندکس است نه آرایه.
8. شناسهٔ پاس‌شده به `/ad/create` شناسهٔ **Catalog** است نه Arm.

---

## ۱۲) قوانین پروژه (قانون دیمت)

اینها تصمیم‌های مالک‌اند، نه سلیقهٔ توسعه‌دهنده — نقض‌شان رد می‌شود:

1. **روانی و گویایی UI**: پیام‌های هر صفحه/کامپوننت باید کامل، طبیعی و بی‌ابهام فارسی باشند؛ جملهٔ ژنریکِ «مورد» در کامپوننت مشترک ممنوع (بخش ۸.۴) — هر موجودیت جمله‌های خودش را از بیرون می‌گیرد.
2. **واژگان قفل است**: درخواست تامین / پیشنهاد تامین / اعلام خرید / اقلام / سرنخ فروش / نماد اعتماد — با همین کلمات.
3. **دسته‌بندی برند ثابت ≤۳۰ و فقط-سید**؛ کاربر حق ساخت دسته ندارد؛ ثبت برند بدون دسته ناممکن؛ سرچ برند بدون فیلتر دسته می‌ماند؛ تکرار برند ممنوع.
4. **برند و کالای مرجع مشترک‌اند** — پراکنده‌سازی واژگان کالا/برند بین بازوها ممنوع؛ دادهٔ کاربر-ساخته `confirmed=false` می‌ماند تا ادمین تایید کند.
5. **همگام‌سازی وب↔بک**: هر فیلد جدید = DTO بک + فرم وب با هم (به‌خاطر `forbidNonWhitelisted`).
6. **گیت کیفیت**: `nest build` بک و `next build` وب هر دو EXIT=0؛ خطاهای TS موجود را بالا نبر؛ بعد از تغییرات DI بک را **اجرا** هم بکن (نه فقط build).
7. **بدون کد مرده**: طرح‌های قدیمی حذف می‌شوند نه کامنت (پوشهٔ `app_` قبلاً به همین دلیل پاک شده — نسخهٔ فعلی ریموت آن را ندارد).
8. **امنیت**: توکن گیت‌هاب هرگز وارد ریپو/کد/README نمی‌شود؛ کریدنشل‌ها فقط در `.env` (gitignored).

---

## ۱۳) وضعیت فعلی و نقشهٔ راه

**تازه انجام شده** (لحظۀ نگارش این سند):
- ✅ EntityPicker همه‌جدا شدن از متن‌های عمومی؛ جمله‌های entity-محور از بیرون پاس می‌شوند (وب).
- ✅ تاکسونومی ثابت ۲۲تایی دستهٔ برند + الزام دسته در ثبت/ویرایش برند + سیدِ دیتابیس (وب+بک) — پس از ادغام با خط اصلی ریموت مجدداً روی `main` است.
- ✅ فیکس ساختاری تکرار برند/کالا (findMany+JS به‌جای $regex خام) + تور ایمنی P2002 (بک).
- ✅ نام پیشنهادی بازو در `/business/register` («بازوی فروش + نام کسب‌وکار»).

**نقشهٔ راه مالک (به ترتیب اهمیت مفهومی):**
- 🎯 **محدودسازی و تخصصی‌سازی برندها در هر بازو** — هدف اصلیِ دسته‌بندی برند: هر بازو بتواند فقط برندهای مرتبط حوزهٔ خودش را بپذیرد (زیرساخت: `Brand.armId` + `BrandCategory` آماده است؛ سیاست/UX آینده).
- 🎯 رشد بازوهای تخصصی: ویزارد ساخت بازو برای ادمین + ماژول‌های پولی بازار + اقتصاد اعتبار هر بازو.
- 🎯 تقویت شبکهٔ خرید↔فروش: پیشنهاد تامین‌کنندهٔ مرتبط، سرنخ‌های فروش، مخاطبین.
- 🐞 بدهی شناخته‌شده: برخی روت‌های تکسونومی زیر `admin/*` در واقع arm-scoped گارد می‌خورند؛ روت تایپی `admin/cataloges`؛ S3 بدون کریدنشل واقعی فقط وارنینگ نرم می‌دهد (در محیط توسعه طبیعی است).

---

## ۱۴) گردش کار توسعه و نکات محیطی

- **گیت**: `main` شاخهٔ اصلی هر دو ریپو؛ کامیت‌ها فارسی با پیشوند scope مثل `feat(brand): ...` / `fix(catalog): ...`. قبل از پوش `git fetch` کن — ممکن است مالک از جای دیگری پوش کرده باشد؛ واگرایی را با rebase حل کن و کامیت تکراری (کار هم‌ارزِ موجود) را drop کن.
- **پوش**: توکن در مسیر محلی `.gh_token` (بیرون از ریپو) نگه داشته می‌شود؛ پوش با URL توکن‌دار انجام می‌شود و خروجی حتماً redact شود.
- **بکاپ پچ**: بعد از هر تسک، `git format-patch` در پوشهٔ `download/` با نام `NN-web-...-hash.patch`.
- **ورک‌لاگ**: `/home/z/my-project/worklog.md` — قبل از شروع بخوان، بعد از تمام‌کردن سکشنِ Task ID جدید append کن.
- **سندباکس ریست‌شونده**: بین سشن‌ها ممکن است ریست شود — اول `git fetch` + مقایسه با `origin/main`، بعد `npm install --legacy-peer-deps` (وب) و `npx prisma generate` (بک) وگرنه build با خطای تایپ/ماژول می‌سوزد.
- **نکتهٔ DATABASE_URL**: اگر شِل متغیر سراسری `DATABASE_URL=file:...` داشت، با `set -a && source .env` (یا پاس‌دادن inline) override کن.
- **نکتهٔ fileMode**: در لینوکس بعد از ریست سندباکس `git config core.fileMode false` بزن تا نویزِ mode-change نیاید.
