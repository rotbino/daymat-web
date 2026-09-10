// lib/store/slices/authSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '@/lib/api/apiTypes';
import { apiService } from '@/lib/api/apiService';
import { queryClient } from '@/lib/api/queryClient';
import { clearCurrentCatalog } from './catalogSlice';

// ─── کلیدهای storage سشن — تک‌منبع حقیقت نام کلیدها ───
const AUTH_STORAGE_KEYS = ['accessToken', 'refreshToken'] as const;
const PERSIST_AUTH_KEY = 'persist:auth'; // snapshot ریدوسر auth در redux-persist

// ============================================================
// پاک‌سازی کامل کلاینت (بدون تماس با سرور)
// — قبل از لاگین مجدد، بعد از پاس 401 سرور، و داخل performLogout
// ⚠️ reducer هیچ side-effect ای ندارد؛ همهٔ پاک‌سازی storage اینجاست
// ============================================================
export const clearUserSession = createAsyncThunk(
    'auth/clearUserSession',
    async (_, { dispatch }) => {
        queryClient.clear();                                  // کش React Query (پروفایل، آگهی‌ها، ...)
        sessionStorage.clear();
        AUTH_STORAGE_KEYS.forEach((k) => localStorage.removeItem(k)); // آینهٔ توکن برای fetch های دستی
        localStorage.removeItem(PERSIST_AUTH_KEY);            // snapshot قدیمی redux-persist
        dispatch(logout());                                   // ریست state (خالص) → پرشیست state خالی را می‌نویسد
        dispatch(clearCurrentCatalog());                      // کاتالوگ کاربر قبلی به کاربر بعدی نچسبد
    }
);

// ============================================================
// خروج کامل از سیستم:
//  ۱) بک: tokenVersion++ → همهٔ توکن‌های صادرشده فوراً باطل (SESSION_REVOKED)
//  ۲) فرانت: پاک‌سازی کامل کش و storage — انگار اولین بازدید است
// ============================================================
export const performLogout = createAsyncThunk(
    'auth/performLogout',
    async (_, { dispatch }) => {
        try {
            await apiService.auth.logout();
        } catch {
            // حتی اگر سرور قطع بود یا توکن منقضی، خروجِ محلی کامل انجام می‌شود
        }
        await dispatch(clearUserSession());
    }
);

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    accessToken: string | null;
    sessionExpired: boolean;
    isArmOwner: boolean;
    isSystemAdmin: boolean;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    accessToken: null,
    sessionExpired: false,
    isArmOwner: false,
    isSystemAdmin: false,
};

/** ریست کامل state — تنها منبع حقیقتِ «خروج» در ریدوسر */
const resetAuthState = () => initialState;

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User & { isArmOwner?: boolean; isSystemAdmin?: boolean }>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.sessionExpired = false; // ورود جدید ← هر ردِ «سشن منقضی» پاک می‌شود
            state.isArmOwner = action.payload.isArmOwner ?? false;
            state.isSystemAdmin = action.payload.role === 'system_admin';
        },
        // آینهٔ localStorage برای fetch/preview های خارج از context — نگهداری در یک نقطه
        setAccessToken: (state, action: PayloadAction<string | null>) => {
            state.accessToken = action.payload;
            if (action.payload && typeof window !== 'undefined') {
                localStorage.setItem('accessToken', action.payload);
            }
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setSessionExpired: (state, action: PayloadAction<boolean>) => {
            state.sessionExpired = action.payload;
        },
        /** ⚠️ خالص — فقط state؛ پاک‌سازی storage فقط در clearUserSession */
        logout: resetAuthState,
    },
    extraReducers: (builder) => {
        // تورِ امن: هر مسیری که به این thunks ختم شود، state صفر می‌شود
        builder.addCase(clearUserSession.fulfilled, resetAuthState);
        builder.addCase(performLogout.fulfilled, resetAuthState);
    },
});

export const {
    setUser,
    setAccessToken,
    setLoading,
    setSessionExpired,
    logout,
} = authSlice.actions;

export default authSlice.reducer;
