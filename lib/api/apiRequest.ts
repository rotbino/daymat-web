// lib/api/apiRequest.ts

import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { clearUserSession } from '../store/slices/authSlice';
import { ApiError } from './apiTypes';
import { getFriendlyErrorMessage } from './errorHandler';
import { handleNetworkFailure, rememberApiBase } from './networkGuard';
import { ensureInternet, noteApiSuccess } from './connectivity';

let _store: any = null;
export const injectStore = (s: any) => {
    _store = s;
};

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3011/';

export const getApiUrl = (path: string): string => {
    const base = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
};

// آدرس API را در سشن ثبت می‌کنیم تا offline.html (خارج از اپ) هم بداند کجا را پینگ کند
if (typeof window !== 'undefined') rememberApiBase(API_BASE);

// ─── توکن: تک‌منبع حقیقت = redux store (persist می‌شود) ───
// آینهٔ localStorage در setAccessToken reducer نوشته می‌شود (برای fetch های دستی)
export const getAuthToken = (): string | null => {
    return _store?.getState().auth.accessToken ?? null;
};

// ============================================================
// خروج اجباری محلی روی 401 — بدون فراخوانی مجدد سرور
// (بک ندارند refresh؛ توکن منقضی/باطل یعنی نشست تمام است)
// ============================================================
let forceLogoutDone = false;
const forceLocalLogout = () => {
    if (forceLogoutDone || !_store) return;
    forceLogoutDone = true;
    _store.dispatch(clearUserSession());
};

// ============================================================
// axios instance — بدون interceptor رفرش؛ 401 یعنی خروج
// ============================================================
const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
    // ⏱ مهلت ۱۵ ثانیه — بدون این، قطعی شبکه/هنگ بک‌اند یعنی لودینگ بی‌نهایت
    // (پیش‌فرض axios = 0 یعنی بی‌نهایت صبر کن)
    timeout: 15000,
});

api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = getAuthToken();
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// مسیرهایی که 401 در آن‌ها نتیجهٔ طبیعی فرم/جریان است — نباید کل سشن را پاک کنند
const SKIP_FORCE_LOGOUT = [
    '/auth/login',
    '/auth/register',
    '/auth/logout',
    '/auth/check-phone',
    '/auth/request-verification',
    '/auth/verify-code-and-set-password',
];

api.interceptors.response.use(
    (response) => {
        forceLogoutDone = false; // یک درخواست موفق ← حالت عادی برگشت
        return response;
    },
    (error) => {
        const originalRequest = error.config;
        const url: string = originalRequest?.url || '';

        const isSkipped = SKIP_FORCE_LOGOUT.some((p) => url.includes(p)) || originalRequest?._skipAuth;

        // ✅ 401 فقط وقتی توکن داشتیم یعنی «نشست باطل شده» —
        //    درخواستِ بدون توکن (کاربر مهمان یا بوت سرد قبل از rehydrate)
        //    نباید سشن را پاک کند؛ فقط خطا برمی‌گردد
        let hadToken = false;
        const h = originalRequest?.headers as any;
        if (h) {
            const auth = typeof h.get === 'function' ? h.get('Authorization') : (h.Authorization ?? h.authorization);
            hadToken = !!auth && String(auth).startsWith('Bearer ');
        }

        if (error.response?.status === 401 && !isSkipped && hadToken) {
            // توکن منقضی یا باطل‌شده (SESSION_REVOKED بعد از لاگ‌اوت/تغییر رمز)
            // → پاک‌سازی کامل کلاینت؛ auth-provider کاربر را به لاگین می‌برد
            forceLocalLogout();
        }

        return Promise.reject(error);
    }
);

// ============================================================
// 🌐 گارد اینترنت قبل از هر کال — جریان درست به روایت کاربر:
//    اول اینترنت بررسی شود؛ اگر قطع بود سریع به صفحهٔ آفلاین برود و
//    اصلاً سراغ کال اندپوینت‌ها نرود؛ اگر وصل بود آن‌وقت کال انجام شود.
//    (وقتی اینترنت وصل است صفر تأخیر اضافه دارد — کش ۳۰ثانیه‌ای)
// ============================================================
const OFFLINE_MESSAGE = 'اتصال اینترنت قطع است. لطفاً اتصال شبکه خود را بررسی کنید.';

const gateInternet = async (): Promise<boolean> => {
    if (typeof window === 'undefined') return true; // سمت سرور گاردی نداریم
    const online = await ensureInternet();
    if (!online) {
        // اینترنت قطع است → صفحهٔ آفلاین (بدون هدر رفتن وقت روی کال)
        handleNetworkFailure();
        throw new ApiError(0, OFFLINE_MESSAGE, { errorCode: 'NETWORK_OFFLINE' });
    }
    return true;
};

export const apiRequest = async <T = any>(
    url: string,
    options?: AxiosRequestConfig
): Promise<T> => {
    // ۱) اول اینترنت چک می‌شود؛ قطع بود → همین‌جا تمام است (بدون کال)
    await gateInternet();
    try {
        const fullUrl = getApiUrl(url);
        const response = await api({ url: fullUrl, ...options });
        noteApiSuccess(); // پاسخ موفق = اینترنت و قطعیت سرور سالم → کش آنلاین نو شود
        return response.data;
    } catch (err: any) {
        // ⏱ خطای سطح شبکه (بدون پاسخ HTTP): قطع اینترنت، تایم‌اوت، اتصال ردشده
        // به‌جای متن خام axios («Network Error» / «timeout of 15000ms exceeded»)
        // پیام فارسی واضح برمی‌گردد و کاربر به صفحهٔ وضعیت هدایت می‌شود
        if (!err.response) {
            handleNetworkFailure(); // پروب فعال: قطع اینترنت → offline.html | بک/دی‌بی قطع → server-unavailable
            throw new ApiError(0, getFriendlyErrorMessage(err), {
                errorCode: err.code === 'ECONNABORTED' ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
            });
        }
        // پیام فارسی - اولویت با message از بک‌اند
        const data = err.response?.data || err.data || {};
        const message = data?.message || err?.message || getFriendlyErrorMessage(err);
        const status = err.response?.status || err.status || 500;
        const errorCode = data?.errorCode || err?.errorCode || 'UNKNOWN_ERROR';

        throw new ApiError(status, message, data);
    }
};

export const apiFileRequest = async <T = any>(
    url: string,
    formData: FormData,
    config?: AxiosRequestConfig
): Promise<T> => {
    const token = getAuthToken();
    if (!token) {
        throw new ApiError(401, 'شما وارد نشده‌اید. لطفاً مجدداً وارد شوید.', { errorCode: 'UNAUTHORIZED' });
    }

    const fullUrl = getApiUrl(url);

    // ۱) اول اینترنت چک می‌شود (همان گارد apiRequest)
    await gateInternet();

    try {
        const response = await axios.post(fullUrl, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
            timeout: 120000, // آپلود فایل ممکن است سنگین باشد
            ...config,
        });
        noteApiSuccess();
        return response.data;
    } catch (err: any) {
        // خطای سطح شبکه (بدون پاسخ HTTP) → پیام فارسی یکدست + هدایت به صفحهٔ وضعیت
        if (!err.response) {
            handleNetworkFailure();
            throw new ApiError(0, getFriendlyErrorMessage(err), {
                errorCode: err.code === 'ECONNABORTED' ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
            });
        }
        const data = err.response?.data || {};
        const message = data?.message || err?.message || getFriendlyErrorMessage(err);
        const status = err.response?.status || 500;

        throw new ApiError(status, message, data);
    }
};
