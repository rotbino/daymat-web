// lib/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import authReducer from './slices/authSlice';
import armReducer from './slices/armSlice';
import themeReducer from './slices/themeSlice';
import { injectStore } from '@/lib/api/apiRequest'; // ✅ اضافه شد

const authPersistConfig = {
    key: 'auth',
    storage,
    whitelist: ['user', 'isAuthenticated', 'accessToken', 'refreshToken'],
};

const armPersistConfig = {
    key: 'arm',
    storage,
    whitelist: ['currentSlug', 'currentArm'],
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);
const persistedArmReducer = persistReducer(armPersistConfig, armReducer);

export const store = configureStore({
    reducer: {
        auth: persistedAuthReducer,
        arm: persistedArmReducer,
        theme: themeReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
            },
        }),
});

// ✅ تزریق store به apiRequest (فقط بعد از ساخته شدن)
injectStore(store);

export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;