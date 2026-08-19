// components/AuthSync.tsx
'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '@/lib/store/slices/authSlice';
import { apiService } from '@/lib/api/apiService';
import { RootState } from '@/lib/store/store';

export function AuthSync() {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const user = useSelector((state: RootState) => state.auth.user);

    useEffect(() => {
        if (isAuthenticated) {
            // همیشه هنگام mount پروفایل به‌روز کاربر را دریافت می‌کند
            apiService.auth.getProfile().then(updatedUser => {
                // فقط اگر تغییری در nationalId وجود داشت یا سایر فیلدها به‌روز شود
                if (JSON.stringify(updatedUser) !== JSON.stringify(user)) {
                    dispatch(setUser(updatedUser));
                }
            }).catch(console.error);
        }
    }, [isAuthenticated]); // ممکن است یکبار کافی نباشد، می‌توانیم یک interval هم بگذاریم اما شاید اذیت کند

    return null;
}