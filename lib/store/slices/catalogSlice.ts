// lib/store/slices/catalogSlice.ts
// «بازوی فروش کارنت» — همان الگوی «بازار کارنت» (armSlice) ولی برای بازوی فروش
// پرسیست می‌شود تا:
//   ۱) بعد از ساخت بازوی فروش جدید، برگشت به «مدیریت بازوی فروش» همین بازوی فروش را انتخاب کند
//   ۲) ورود به مدیریت از هر مسیری (بازار، فرم آگهی، لاگین) آخرین بازوی فروشِ کارِ کاربر باز شود
//   ۳) بعداً در جای دیگری از برنامه (مثلاً فرم آگهی) قابل مصرف باشد
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/** اسنپ‌شات سبک بازوی فروش — فقط فیلدهای پرکاربرد تا state سبک بماند */
export interface CurrentCatalogSnapshot {
    id: string;
    name?: string;
    slug?: string;
    businessId?: string;
    logoUrl?: string | null;
    salesType?: string;
}

interface CatalogState {
    currentCatalogId: string | null;
    currentCatalog: CurrentCatalogSnapshot | null;
    /** «بازوی خرید کارنت» — انتخاب سوییچر برای محصول دوم (پرسیست) */
    currentInquiryId: string | null;
}

const initialState: CatalogState = {
    currentCatalogId: null,
    currentCatalog: null,
    currentInquiryId: null,
};

const catalogSlice = createSlice({
    name: 'catalog',
    initialState,
    reducers: {
        /** انتخاب/به‌روزرسانی بازوی فروش کارنت — snapshot تازه را هم با هم می‌نویسد */
        setCurrentCatalog: (state, action: PayloadAction<CurrentCatalogSnapshot | null>) => {
            state.currentCatalogId = action.payload?.id ?? null;
            state.currentCatalog = action.payload;
        },
        /** انتخاب بازوی خرید کارنت — از سوییچر یا لینک عمیق */
        setCurrentInquiry: (state, action: PayloadAction<string | null>) => {
            state.currentInquiryId = action.payload;
        },
        /** خروج/تغییر کاربر — تا بازوی فروش کاربر قبلی به کاربر بعدی نچسبد */
        clearCurrentCatalog: (state) => {
            state.currentCatalogId = null;
            state.currentCatalog = null;
            state.currentInquiryId = null;
        },
    },
});

export const { setCurrentCatalog, setCurrentInquiry, clearCurrentCatalog } = catalogSlice.actions;
export default catalogSlice.reducer;
