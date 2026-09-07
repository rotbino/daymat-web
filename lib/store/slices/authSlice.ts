// lib/store/slices/authSlice.ts
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { User } from '@/lib/api/apiTypes';
import { apiService } from '@/lib/api/apiService';
import { queryClient } from '@/lib/api/queryClient';

// ============================================================
// پاک‌سازی کامل داده‌های کاربر (بدون دست زدن به currentArm)
// ============================================================
export const clearUserSession = createAsyncThunk(
    'auth/clearUserSession',
    async (_, { dispatch }) => {
        queryClient.clear();
        localStorage.removeItem('persist:auth');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        sessionStorage.clear();
        dispatch(logout());
    }
);

// ============================================================
// خروج کامل از سیستم (لاگ‌اوت)
// ============================================================
export const performLogout = createAsyncThunk(
    'auth/logout',
    async (_, { dispatch }) => {
        try {
            // ✅ درخواست به سرور برای خروج (در صورت وجود endpoint)
            await apiService.auth.logout();
        } catch (e) {
            // حتی اگر خطا داد، کلاینت را پاک می‌کنیم
        }
        await dispatch(clearUserSession());
    }
);

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    accessToken: string | null;
    refreshToken: string | null;
    sessionExpired: boolean;
    isArmOwner: boolean;
    isSystemAdmin: boolean;
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    accessToken: null,
    refreshToken: null,
    sessionExpired: false,
    isArmOwner: false,
    isSystemAdmin: false,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setUser: (state, action: PayloadAction<User & { isArmOwner?: boolean; isSystemAdmin?: boolean }>) => {
            state.user = action.payload;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.isArmOwner = action.payload.isArmOwner ?? false;
            state.isSystemAdmin = action.payload.role === 'system_admin';
        },
        setAccessToken: (state, action: PayloadAction<string | null>) => {
            state.accessToken = action.payload;
            if (action.payload) localStorage.setItem('accessToken', action.payload);
        },
        setRefreshToken: (state, action: PayloadAction<string | null>) => {
            state.refreshToken = action.payload;
            if (action.payload) localStorage.setItem('refreshToken', action.payload);
        },
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setSessionExpired: (state, action: PayloadAction<boolean>) => {
            state.sessionExpired = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.accessToken = null;
            state.refreshToken = null;
            state.sessionExpired = false;
            state.isArmOwner = false;
            state.isSystemAdmin = false;
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
        },
    },
    extraReducers: (builder) => {
        builder.addCase(clearUserSession.fulfilled, (state) => {
            // state همان مقادیر initialState است
        });
        builder.addCase(performLogout.fulfilled, (state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.accessToken = null;
            state.refreshToken = null;
            state.sessionExpired = false;
            state.isArmOwner = false;
            state.isSystemAdmin = false;
        });
    },
});

export const {
    setUser,
    setAccessToken,
    setRefreshToken,
    setLoading,
    setSessionExpired,
    logout,
} = authSlice.actions;

export default authSlice.reducer;