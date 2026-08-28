// lib/api/apiRequest.ts - اصلاح شده

import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { setAccessToken, setRefreshToken, setSessionExpired } from '../store/slices/authSlice';
import { ApiError } from './apiTypes';
import { getFriendlyErrorMessage } from './errorHandler';

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

let authToken: string | null = null;
let refreshToken: string | null = null;
let isRefreshing = false;
let failedQueue: Array<{ resolve: (value: any) => void; reject: (reason?: any) => void }> = [];

export const setAuthToken = (token: string | null) => {
    authToken = token;
    if (token && _store) _store.dispatch(setAccessToken(token));
};

export const getAuthToken = (): string | null => {
    return _store?.getState().auth.accessToken ?? null;
};

export const setRefreshTokenValue = (token: string | null) => {
    refreshToken = token;
    if (token && _store) _store.dispatch(setRefreshToken(token));
};

export const getRefreshTokenValue = (): string | null => {
    refreshToken = refreshToken || (_store?.getState().auth.refreshToken ?? null);
    return refreshToken;
};

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

const refreshAccessToken = async (): Promise<string> => {
    const currentRefreshToken = getRefreshTokenValue();
    if (!currentRefreshToken) {
        // ✅ پیام فارسی
        throw new ApiError(401, 'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.', { errorCode: 'SESSION_EXPIRED' });
    }

    try {
        const response = await axios.post(`${API_BASE}/auth/refresh`, {
            refreshToken: currentRefreshToken,
        });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        setAuthToken(accessToken);
        setRefreshTokenValue(newRefreshToken);
        return accessToken;
    } catch (error: any) {
        // ✅ پیام فارسی
        if (error?.response?.status === 401 || error?.response?.status === 403) {
            throw new ApiError(401, 'نشست شما منقضی شده است. لطفاً مجدداً وارد شوید.', { errorCode: 'SESSION_EXPIRED' });
        }
        throw new ApiError(
            error?.response?.status || 500,
            error?.response?.data?.message || 'خطا در تمدید نشست. لطفاً مجدداً تلاش کنید.',
            error?.response?.data || {}
        );
    }
};

const api = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

api.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = getAuthToken();
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // اگر درخواست لاگین/رفرش است، رفرش نکن
        if (originalRequest?.url?.includes('/auth/login') ||
            originalRequest?.url?.includes('/auth/register') ||
            originalRequest?.url?.includes('/auth/refresh') ||
            originalRequest?._skipRefresh) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest?._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newToken = await refreshAccessToken();
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                processQueue(null, newToken);
                return api(originalRequest);
            } catch (refreshError: any) {
                processQueue(refreshError, null);

                // ✅ فقط اگر SESSION_EXPIRED یا 401/403 باشد logout کن
                const isSessionExpired =
                    refreshError?.data?.errorCode === 'SESSION_EXPIRED' ||
                    refreshError?.response?.status === 401 ||
                    refreshError?.response?.status === 403;

                if (isSessionExpired && _store) {
                    _store.dispatch(setSessionExpired());
                }

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export const apiRequest = async <T = any>(
    url: string,
    options?: AxiosRequestConfig
): Promise<T> => {
    try {
        const fullUrl = getApiUrl(url);
        const response = await api({ url: fullUrl, ...options });
        return response.data;
    } catch (err: any) {
        // ✅ پیام فارسی - اولویت با message از بک‌اند
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

    try {
        const response = await axios.post(fullUrl, formData, {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            },
            ...config,
        });
        return response.data;
    } catch (err: any) {
        const data = err.response?.data || {};
        const message = data?.message || err?.message || getFriendlyErrorMessage(err);
        const status = err.response?.status || 500;

        throw new ApiError(status, message, data);
    }
};