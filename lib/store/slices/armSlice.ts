// lib/store/slices/armSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ArmData {
    id: string;
    slug: string;
    name: string;
    shortName?: string;
    slogan: string;
    description?: string;
    icon?: string;
    colorPrimary?: string;
    colorSecondary?: string;
    logoUrl?: string;
    bannerUrl?: string;
    status: string;
    visibility: string;
    mission?: string;
    featuresEnabled: string[];
    config?: any;
    membersCount?: number;
    activeAdsCount?: number;
    categorySelections?: any[];
    locationTree?: any[]; // ✅ اضافه شد
    geoScopes?: any[]; // برای سازگاری با نسخه قبلی
    isArmOwner?: boolean;      // ← اضافه شد
    isSystemAdmin?: boolean;   // ← اضافه شد
}

interface ArmState {
    currentArm: ArmData | null;
    currentSlug: string | null;
    isLoading: boolean;
    error: string | null;
}

const initialState: ArmState = {
    currentArm: null,
    currentSlug: null,
    isLoading: false,
    error: null,
};

const armSlice = createSlice({
    name: 'arm',
    initialState,
    reducers: {
        setArmLoading: (state, action: PayloadAction<boolean>) => {
            state.isLoading = action.payload;
        },
        setArm: (state, action: PayloadAction<{ arm: ArmData; slug: string }>) => {
            console.log('📍 armSlice: setting arm:', action.payload.arm);
            state.currentArm = action.payload.arm;
            state.currentSlug = action.payload.slug;
            state.isLoading = false;
            state.error = null;
        },
        setArmError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.isLoading = false;
        },
        clearArm: (state) => {
            state.currentArm = null;
            state.currentSlug = null;
            state.error = null;
        },
    },
});

export const { setArmLoading, setArm, setArmError, clearArm } = armSlice.actions;
export default armSlice.reducer;