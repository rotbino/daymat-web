// lib/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import armReducer from './slices/armSlice';
import themeReducer from './slices/themeSlice';
import catalogReducer from './slices/catalogSlice';
import { injectStore } from '@/lib/api/apiRequest'; // ✅ اضافه شد

const authPersistConfig = {
    key: 'auth',
    storage,
    whitelist: ['user', 'isAuthenticated', 'accessToken'],
};

const armPersistConfig = {
    key: 'arm',
    storage,
    whitelist: ['currentSlug', 'currentArm'],
};

// «کاتالوگ کارنت» — پرسیست مثل بازار کارنت (درخواست کاربر)
const catalogPersistConfig = {
    key: 'catalog',
    storage,
    whitelist: ['currentCatalogId', 'currentCatalog'],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedArmReducer = persistReducer(armPersistConfig, armReducer);
const persistedCatalogReducer = persistReducer(catalogPersistConfig, catalogReducer);

export const store = configureStore({
    reducer: {
        auth: persistedAuthReducer,
        arm: persistedArmReducer,
        catalog: persistedCatalogReducer,
        theme: themeReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    'persist/PERSIST',
                    'persist/REHYDRATE',
                    'persist/PAUSE',
                    'persist/FLUSH',
                    'persist/PURGE',
                    'persist/REGISTER',
                ],
            },
        }),
});

// ✅ تزریق store به apiRequest (فقط بعد از ساخته شدن)
injectStore(store);

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;