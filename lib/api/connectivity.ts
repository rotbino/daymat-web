// lib/api/connectivity.ts
// ============================================================
// پروب فعال اینترنت — چرا navigator.onLine قابل‌اعتماد نیست؟
//   navigator.onLine فقط وضعیت «کارت شبکه» را می‌گوید؛
//   وقتی وای‌فای/کابل به مودم وصل است ولی اینترنت واقعی قطع است،
//   onLine همچنان true برمی‌گرداند → قبلاً باعث می‌شد کاربرِ قطع‌شده
//   به اشتباه به صفحهٔ «سرور در دسترس نیست» برود.
//
// راه‌حل: قبل از کال‌کردن اندپوینت‌ها، اتصال واقعی اینترنت با
// درخواست سبک (HEAD/GET no-cors) به چند مقصد بی‌طرف (خارج از
// سرور دیمت) بررسی می‌شود. اگر حداقل یکی جواب داد = اینترنت وصل.
//
//   • مقصدها بی‌طرفند (CDN)، نه بک خودمان — چون دقیقاً می‌خواهیم
//     «قطعی اینترنت» را از «قطع سرور/دیتابیس» تفکیک کنیم.
//   • arvancloud: CDN ایرانی، در ایران همیشه در دسترس.
//   • cloudflare + gstatic: پوشش گلوبال (در ایران فیلتر باشند،
//     حضورشان ضرری ندارد — همان یکی که جواب بدهد کافی است).
//   • نتیجه کش می‌شود تا روی هر درخواست پروب نزنیم:
//       online  → کش ۳۰ ثانیه (خودِ پاسخ موفق API هم کش را نو می‌کند)
//       offline → کش ۱۵ ثانیه (زودتر دوباره امتحان کنیم)
//   • پروب‌های هم‌زمان dedupe می‌شوند (یک درخواست برای همهٔ کال‌ها).
// ============================================================

type CachedState = { state: 'online' | 'offline'; at: number };

const CACHE_ONLINE_TTL = 30_000; // وضعیت «آنلاین» تا ۳۰ث معتبر
const CACHE_OFFLINE_TTL = 15_000; // وضعیت «آفلاین» تا ۱۵ث معتبر
export const PROBE_TIMEOUT = 3500; // مهلت کل پروب

/** مقصدهای بی‌طرف خارج از سرور دیمت */
const PROBE_URLS = [
    'https://www.arvancloud.ir/favicon.ico',
    'https://www.cloudflare.com/cdn-cgi/trace',
    'https://www.gstatic.com/generate_204',
];

let cache: CachedState | null = null;
let inflight: Promise<boolean> | null = null;

// رویدادهای مرورگر: قطع/وصل شدن اینترف شبکه → کش بی‌اعتبار/به‌روز
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        cache = null; // دوباره با پروب واقعی تأیید شود
    });
    window.addEventListener('offline', () => {
        cache = { state: 'offline', at: Date.now() };
    });
}

/** یک پروب تکی — هر پاسخ HTTP (حتی ۴۰۴) یعنی شبکه reachable است */
const probeOnce = (url: string, timeoutMs: number): Promise<boolean> =>
    new Promise((resolve) => {
        let done = false;
        const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timer = setTimeout(() => {
            if (done) return;
            done = true;
            ctrl?.abort();
            resolve(false);
        }, timeoutMs);

        fetch(url, {
            mode: 'no-cors', // فقط «رسید یا نرسید» مهم است؛ CORS بی‌ربط
            cache: 'no-store',
            signal: ctrl?.signal,
        })
            .then(() => {
                if (done) return;
                done = true;
                clearTimeout(timer);
                resolve(true);
            })
            .catch(() => {
                if (done) return;
                done = true;
                clearTimeout(timer);
                resolve(false);
            });
    });

/**
 * چک فعال اینترنت — همیشه پروب واقعی می‌زند (نتایج هم‌زمان dedupe می‌شوند).
 * true = حداقل یکی از مقصدها پاسخ داد (اینترنت وصل) | false = همه شکست خوردند.
 */
export const checkInternet = (timeoutMs: number = PROBE_TIMEOUT): Promise<boolean> => {
    // اینترفیز شبکه قطع؟ نیازی به پروب نیست — قطعیِ قطعی
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        cache = { state: 'offline', at: Date.now() };
        return Promise.resolve(false);
    }
    if (inflight) return inflight;

    const bust = `?t=${Date.now()}`; // شکستن کش میانی‌ها/مرورگر
    inflight = new Promise<boolean>((resolve) => {
        let pending = PROBE_URLS.length;
        let settled = false;
        const finish = (online: boolean) => {
            if (settled) return;
            settled = true;
            cache = { state: online ? 'online' : 'offline', at: Date.now() };
            inflight = null;
            resolve(online);
        };
        PROBE_URLS.forEach((u) => {
            probeOnce(`${u}${bust}`, timeoutMs).then((ok) => {
                if (settled) return;
                if (ok) {
                    finish(true); // اولین موفق = اینترنت وصل (بقیه بی‌خیال)
                } else if (--pending === 0) {
                    finish(false); // همه شکست خوردند
                }
            });
        });
    });
    return inflight;
};

/** وضعیت کش‌شده (بدون پروب): 'online' | 'offline' | 'unknown' اگر تازه منقضی شده */
export const getCachedConnectivity = (): 'online' | 'offline' | 'unknown' => {
    if (!cache) return 'unknown';
    const ttl = cache.state === 'online' ? CACHE_ONLINE_TTL : CACHE_OFFLINE_TTL;
    return Date.now() - cache.at <= ttl ? cache.state : 'unknown';
};

/**
 * گارد قبل از کال اندپوینت‌ها — دقیقاً همان جریانی که کاربر خواسته:
 *   اول اینترنت بررسی شود؛ اگر قطع بود سریع به صفحهٔ آفلاین برو و
 *   اصلاً سراغ کال اندپوینت‌ها نرو؛ اگر وصل بود اجازهٔ کال بده.
 *
 *   • navigator.onLine = false → بدون پروب، فوری false (سریع‌ترین مسیر)
 *   • کش تازهٔ offline → فوری false (کال‌های بعدی همان لحظه می‌فهمند)
 *   • کش تازهٔ online → فوری true (صفر تأخیر)
 *   • unknown → پروب واقعی (~۱۰۰-۴۰۰ms وقتی آنلاین است)
 */
export const ensureInternet = async (): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
    const cached = getCachedConnectivity();
    if (cached === 'online') return true;
    if (cached === 'offline') return false;
    return checkInternet();
};

/** بعد از هر پاسخ موفق API صدا زده شود — خودِ پاسخ یعنی اینترنت وصل است */
export const noteApiSuccess = () => {
    cache = { state: 'online', at: Date.now() };
};
