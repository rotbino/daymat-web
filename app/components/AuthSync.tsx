// components/AuthSync.tsx
'use client'; // ✅ اضافه کردن این خط

import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setUser } from '@/lib/store/slices/authSlice';
import { apiService } from '@/lib/api/apiService';
import { RootState } from '@/lib/store/store';

export function AuthSync() {
    const dispatch = useDispatch();
    const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
    const user = useSelector((state: RootState) => state.auth.user);
    const hasFetched = useRef(false);

    useEffect(() => {
        if (!isAuthenticated) return;
        if (hasFetched.current && user) return;

        hasFetched.current = true;
        apiService.auth.getProfile()
            .then(updatedUser => {
                if (JSON.stringify(updatedUser) !== JSON.stringify(user)) {
                    dispatch(setUser(updatedUser));
                }
            })
            .catch(() => {
                hasFetched.current = false;
            });
    }, [isAuthenticated]);

    return null;
}