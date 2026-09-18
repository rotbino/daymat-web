// lib/push.ts
// 🔔 پوش فوری PWA — اشتراک دستگاه و ارسالش به سرور دیمت
//    «اعلام خرید فعال شد → تامین‌کننده همان لحظه نوتیف می‌گیرد» — شبیه پیام واتساپ.
//    اگر مرورگر پوش نداشته باشد یا سرور کلید VAPID نداشته باشد، بی‌صدا false برمی‌گردد.

import { apiService } from '@/lib/api/apiService';

const STORAGE_KEY = 'daymat-push-enabled';

export const isPushEnabledLocally = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === '1';
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = window.atob(base64);
    const output = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
    return output;
}

async function getRegistration(): Promise<ServiceWorkerRegistration | null> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return null;
    try {
        return await navigator.serviceWorker.ready;
    } catch {
        return null;
    }
}

/** روشن‌کردن پوش — اجازه می‌گیرد، subscribe می‌کند و اشتراک را به سرور می‌دهد */
export async function enablePush(): Promise<boolean> {
    try {
        const { publicKey } = await apiService.notification.pushPublicKey();
        if (!publicKey) {
            // سرور هنوز VAPID ندارد — پوش در دسترس نیست
            return false;
        }
        const registration = await getRegistration();
        if (!registration) return false;

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return false;

        const existing = await registration.pushManager.getSubscription();
        const sub =
            existing ??
            (await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
            }));

        const json = sub.toJSON() as any;
        await apiService.notification.subscribePush({
            endpoint: json.endpoint,
            keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
            userAgent: navigator.userAgent,
        });
        localStorage.setItem(STORAGE_KEY, '1');
        return true;
    } catch {
        return false;
    }
}

/** خاموش‌کردن پوش — unsubscribe از مرورگر + حذف از سرور */
export async function disablePush(): Promise<void> {
    try {
        const registration = await getRegistration();
        const sub = await registration?.pushManager.getSubscription();
        if (sub) {
            await apiService.notification.unsubscribePush(sub.endpoint).catch(() => undefined);
            await sub.unsubscribe().catch(() => undefined);
        }
    } finally {
        localStorage.setItem(STORAGE_KEY, '0');
    }
}

/** وضعیت واقعی اشتراک در این مرورگر */
export async function getPushStatus(): Promise<'unsupported' | 'granted' | 'denied' | 'off'> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        return 'unsupported';
    }
    if (Notification.permission === 'denied') return 'denied';
    const registration = await getRegistration();
    const sub = await registration?.pushManager.getSubscription();
    return sub ? 'granted' : 'off';
}
