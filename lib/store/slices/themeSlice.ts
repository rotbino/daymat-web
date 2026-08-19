// lib/store/slices/themeSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
    mode: ThemeMode;
}

const initialState: ThemeState = {
    mode: (typeof window !== 'undefined' ? (localStorage.getItem('theme') as ThemeMode) : null) || 'light',
};

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
            state.mode = action.payload;
            localStorage.setItem('theme', action.payload);
        },
    },
});

export const { setThemeMode } = themeSlice.actions;
export default themeSlice.reducer;