// lib/store/slices/catalogSlice.ts
// «کاتالوگ کارنت» — همان الگوی «بازار کارنت» (armSlice) ولی برای کاتالوگ
// پرسیست می‌شود تا:
//   ۱) بعد از ساخت کاتالوگ جدید، برگشت به «مدیریت کاتالوگ» همین کاتالوگ را انتخاب کند
//   ۲) ورود به مدیریت از هر مسیری (بازار، فرم آگهی، لاگین) آخرین کاتالوگِ کارِ کاربر باز شود
//   ۳) بعداً در جای دیگری از برنامه (مثلاً فرم آگهی) قابل مصرف باشد
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

/** اسنپ‌شات سبک کاتالوگ — فقط فیلدهای پرکاربرد تا state سبک بماند */
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
}

const initialState: CatalogState = {
    currentCatalogId: null,
    currentCatalog: null,
};

const catalogSlice = createSlice({
    name: 'catalog',
    initialState,
    reducers: {
        /** انتخاب/به‌روزرسانی کاتالوگ کارنت — snapshot تازه را هم با هم می‌نویسد */
        setCurrentCatalog: (state, action: PayloadAction<CurrentCatalogSnapshot | null>) => {
            state.currentCatalogId = action.payload?.id ?? null;
            state.currentCatalog = action.payload;
        },
        /** خروج/تغییر کاربر — تا کاتالوگ کاربر قبلی به کاربر بعدی نچسبد */
        clearCurrentCatalog: (state) => {
            state.currentCatalogId = null;
            state.currentCatalog = null;
        },
    },
});

export const { setCurrentCatalog, clearCurrentCatalog } = catalogSlice.actions;
export default catalogSlice.reducer;
