// lib/api/apiRequest.ts

import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { setAccessToken, setRefreshToken, setSessionExpired } from '../store/slices/authSlice';
import { ApiError } from './apiTypes';
import { isSystemError, getSystemErrorMessage, getFriendlyErrorMessage } from './errorHandler';

// Lazy store برای شکستن چرخه
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
    if (!currentRefreshToken) throw new Error('No refresh token');

    const response = await axios.post(`${API_BASE}/auth/refresh`, {
        refreshToken: currentRefreshToken,
    });
    const { accessToken, refreshToken: newRefreshToken } = response.data;
    setAuthToken(accessToken);
    setRefreshTokenValue(newRefreshToken);
    return accessToken;
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

        // اگر درخواست لاگین است یا flag _skipRefresh وجود دارد، رفرش نکن
        if (originalRequest.url?.includes('/auth/login') ||
            originalRequest.url?.includes('/auth/register') ||
            originalRequest._skipRefresh) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
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
            } catch (refreshError) {
                processQueue(refreshError, null);

                // ✅ فقط در صورتی که خطای رفرش واقعاً به‌معنای منقضی شدن نشست باشد (401, 403) کاربر را logout کن
                if (refreshError?.response?.status === 401 || refreshError?.response?.status === 403) {
                    if (_store) {
                        try {
                            _store.dispatch({ type: 'auth/logout' });
                        } catch (e) {
                            console.error('Error dispatching logout:', e);
                        }
                    }

                    // پاک کردن persist از localStorage
                    if (typeof window !== 'undefined') {
                        try {
                            localStorage.removeItem('persist:auth');
                            localStorage.removeItem('persist:arm');
                        } catch (e) {
                            console.error('Error clearing localStorage:', e);
                        }
                    }
                }
                // در غیر این صورت (Network error, 500, ...) هیچ کاری نمی‌کنیم و کاربر می‌تواند دوباره تلاش کند.

                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }
        return Promise.reject(error);
    }
);

// ... (apiRequest و apiFileRequest بدون تغییر) ...
export const apiRequest = async <T = any>(
    url: string,
    options?: AxiosRequestConfig
): Promise<T> => {
    try {
        const fullUrl = getApiUrl(url);
        const response = await api({ url: fullUrl, ...options });
        return response.data;
    } catch (err: any) {
        const data = err.response?.data;
        const message = data?.message || getFriendlyErrorMessage(err);
        const status = err.response?.status || 500;
        const errorCode = data?.errorCode || 'UNKNOWN_ERROR';

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
        const data = err.response?.data;
        const message = data?.message || getFriendlyErrorMessage(err);
        const status = err.response?.status || 500;

        throw new ApiError(status, message, data);
    }
};